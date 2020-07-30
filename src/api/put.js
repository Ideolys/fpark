const fs           = require('fs');
const path         = require('path');
const { pipeline } = require('stream');
const Busboy       = require('busboy');
const FormData     = require('form-data');
const fetch        = require('node-fetch');
const repartition  = require('../commons/repartition');
const encryption   = require('../commons/encryption');
const file         = require('../commons/file');
const proxyFactory = require('../commons/proxy');

const {
  respond,
  createDirIfNotExists,
  queue
} = require('../commons/utils');

const {
  getHeaderNthNode,
  setHeaderNthNode,
  setHeaderCurrentNode,
  getHeaderFromNode,
  getHeaderReplication,
  setHeaderReplication
} = require('../commons/headers');

const imageUtils    = require('../commons/image/utils');
const imageCompress = require('../commons/image/compress');
const imageResize   = require('../commons/image/resize').resize;
const auth = require('../commons/auth');

/**
 * PUT a file
 * @param {Stream} fileStream
 * @param {Object} params { id, containerId }
 * @param {Object} store { CONFIG }
 * @param {String} keyNodes 'node1-node2-ndoeN'
 * @param {Boolean/String} isFromAnotherNode is request from another node
 * @param {Function} callback
 */
function putFile (fileStream, params, store, keyNodes, isFromAnotherNode, callback) {
  let pathDisk = path.join(store.CONFIG.FILES_DIRECTORY, keyNodes);
  createDirIfNotExists(pathDisk, err => {
    if (err) {
      console.log('Cannot create container', err);
      return callback(true);
    }

    let pathContainer = path.join(pathDisk, params.containerId);
    createDirIfNotExists(pathContainer, err => {
      if (err) {
        console.log( 'Cannot create container', err);
        return callback(true);
      }

      let filePath            = file.getFilePath(store.CONFIG, keyNodes, params);
      let extension           = path.extname(params.id);
      let extensionWithoutDot = extension.replace('.', '');
      let isImage             = imageUtils.isImage(extensionWithoutDot);

      if (extension === '.png') {
        extension = '.jpeg';
      }

      let _pipeline = [
        fs.createWriteStream(filePath.path),
        err => {
          if (err) {
            console.log('Write pipeline error', err);
          }

          callback(err);
        }
      ];

      if (isFromAnotherNode == null) {
        _pipeline.unshift(encryption.encryptStream(
          filePath.filename,
          store.CONFIG.ENCRYPTION_IV,
          store.CONFIG.ENCRYPTION_ALGORITHM
        ));
      }

      if (isFromAnotherNode === undefined && isImage) {
        _pipeline.unshift(imageCompress(store.CONFIG, extensionWithoutDot));
        _pipeline.unshift(imageResize(store.CONFIG));
      }

      _pipeline.unshift(fileStream);
      pipeline.apply(null, _pipeline);
    });
  });
}

exports.putFile = putFile;

/**
 * PUT API
 * @param {Object} req
 * @param {Object} res
 * @param {Object} params { id, containerId }
 * @param {Object} store { CONFIG }
 */
exports.putApi = function put (req, res, params, store) {
  auth.verify(req, res, params, () => {
    let nodes            = repartition.getNodesToPersistTo(params.id, store.CONFIG.NODES, store.CONFIG.REPLICATION_NB_REPLICAS);
    let isAllowedToWrite = repartition.isCurrentNodeInPersistentNodes(nodes, store.CONFIG.ID);

    if (!isAllowedToWrite && nodes.length) {
      if (getHeaderNthNode(req.headers) === 3) {
        return respond(res, 500);
      }

      return queue(nodes, (node, next) => {
        if (node.id === store.CONFIG.ID) {
          return next();
        }

        let proxy = proxyFactory(() => {
          return respond(res, 500);
        });

        let headers = {};
        setHeaderNthNode(headers, req.headers);
        setHeaderCurrentNode(headers, store.CONFIG.ID);

        proxy(req, res, {
          selfHandleResponse : true,
          target             : node.host,
          headers
        });
      }, () => {
        respond(res, 500);
      });
    }

    let keyNodes = repartition.flattenNodes(nodes);

    let busboy = null;
    try {
      busboy = new Busboy({
        headers : req.headers,
        limits  : {
          fileSize : store.CONFIG.MAX_FILE_SIZE,
        }
      });
    }
    catch (e) {
      return respond(res, 500);
    }

    busboy.on('file', (fieldname, fileStream, filename, encoding, mimetype) => {
      if (!filename) {
        return respond(res, 500);
      }

      /**
       * File size reached
       * https://github.com/mscdex/busboy/blob/967fce0db075cb02765814db3e322d4f64d33a42/lib/types/multipart.js#L221
       */
      fileStream.on('limit', () => {
        return respond(res, 413);
      });

      putFile(fileStream, params, store, keyNodes, getHeaderReplication(req.headers), (err) => {
        if (err) {
          return respond(res, 500);
        }

        if (getHeaderFromNode(req.headers) && !req.headers['x-forwarded-for']) {
          return respond(res, 200);
        }

        let headers =  {
          'authorization' : req.headers.authorization
        };
        setHeaderCurrentNode(headers, store.CONFIG.ID);
        setHeaderReplication(headers, store.CONFIG.ID)

        queue(nodes, (node, next) => {
          if (node.id === store.CONFIG.ID) {
            return next();
          }

          let form    = new FormData();
          let streams = file.getFilePath(store.CONFIG, keyNodes, params).path;
          form.append('file', fs.createReadStream(streams));

          Object.assign(headers, form.getHeaders());
          setHeaderNthNode(headers, req.headers);

          fetch(node.host + req.url, {
            method : 'PUT',
            body   : form,
            headers
          }).then(resFetch => {
            if (resFetch.status !== 200) {
              return next();
            }

            respond(res, 200);
          }).catch(() => {
            next();
          })
        }, () => {
          respond(res, nodes.length ? 500 : 200);
        });
      });
    });

    busboy.on('error' , err => {
      respond(res, 500);
    });

    req.pipe(busboy);
  });
}
