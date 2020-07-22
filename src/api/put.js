const fs           = require('fs');
const path         = require('path');
const { pipeline } = require('stream');
const { proxy }    = require('fast-proxy')({});
const Busboy       = require('busboy');
const repartition  = require('../commons/repartition');
const encryption   = require('../commons/encryption');
const file         = require('../commons/file');
const zlib         = require('zlib');
const FormData     = require('form-data');
const fetch        = require('node-fetch');
const {
  respond,
  createDirIfNotExists,
  queue
} = require('../commons/utils');
const {
  getHeaderNthNode,
  setHeaderNthNode,
  setHeaderCurrentNode,
  getHeaderFromNode
} = require('../commons/headers');
const { runInNewContext } = require('vm');

function putFile (fileStream, params, store, keyNodes, isGzip, callback) {
  let pathDisk = path.join(store.CONFIG.FILE_DIRECTORY, keyNodes);
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

      let filename     = file.getFileName(params.id, store.CONFIG.ENCRYPTION_IV_LENGTH);
      let fileNameDisk = encryption.hash(filename, store.CONFIG.HASH_SECRET, store.CONFIG.HASH_ALGORITHM);

      let pathFile  = path.join(pathContainer, fileNameDisk + '.enc');
      let _pipeline = [
        fileStream,
        encryption.encryptStream(
          filename,
          store.CONFIG.ENCRYPTION_IV,
          store.CONFIG.ENCRYPTION_ALGORITHM
        ),
        fs.createWriteStream(pathFile),
        err => {
          if (err) {
            return console.log('Write pipeline error', err);
          }

          callback();
        }
      ];

      if (isGzip) {
        _pipeline.splice(1, 0, zlib.createGunzip());
      }

      pipeline.apply(null, _pipeline);
    });
  });
}

exports.putFile = putFile;

exports.putApi = function put (req, res, params, store) {
  let nodes            = repartition.getNodesToPersistTo(params.id, store.CONFIG.NODES);
  let isAllowedToWrite = repartition.isCurrentNodeInPersistentNodes(nodes, store.CONFIG.ID);

  if (!isAllowedToWrite) {
    if (getHeaderNthNode(req.headers) === 3) {
      return respond(res, 500);
    }

    return proxy(req, res, nodes[0].host + req.url, {
      rewriteRequestHeaders (req, headers) {
        setHeaderNthNode(headers);
        setHeaderCurrentNode(headers, store.CONFIG.ID);
        return headers;
      }
    });
  }

  let keyNodes = repartition.flattenNodes(nodes);

  let busboy = null;
  try {
    busboy = new Busboy({ headers: req.headers });
  }
  catch (e) {
    return respond(res, 500);
  }

  busboy.on('file', (fieldname, fileStream, filename, encoding, mimetype) => {
    if (!filename) {
      return respond(res, 500);
    }

    let keyNodes = repartition.flattenNodes(nodes);

    putFile(fileStream, params, store, keyNodes, false, (err) => {
      if (err) {
        return respond(res, 500);
      }

      if (getHeaderFromNode(req.headers)) {
        return respond(res, 200);
      }

      let headers =  {};
      setHeaderCurrentNode(headers, store.CONFIG.ID);

      queue(nodes, (node, next) => {
        if (node.id === store.CONFIG.ID) {
          return next();
        }

        let form = new FormData();
        form.append('file', file.getFile(res, params, store, keyNodes, next, true, false));

        setHeaderNthNode(headers, req.headers);

        fetch(node.host + req.url, {
          method : 'PUT',
          body   : form,
          headers
        }).then(res => {
          if (res.status !== 200) {
            return next();
          }

          respond(res, 200);
        }).catch(() => {
          next();
        })
      }, () => {
        respond(res, 200);
      });
    });
  });

  busboy.on('error' , err => {
    console.log(err);
    respond(res, 500);
  });

  req.pipe(busboy);
}
