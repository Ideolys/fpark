const fs           = require('fs');
const path         = require('path');
const { pipeline } = require('stream');
const { proxy }    = require('fast-proxy')({});
const Busboy       = require('busboy');
const repartition  = require('../commons/repartition');
const utils        = require('../commons/utils');
const encryption   = require('../commons/encryption');
const file         = require('../commons/file');
const zlib         = require('zlib');
const {
  getHeaderNthNode,
  setHeaderNthNode,
  setHeaderCurrentNode
} = require('../commons/headers');

const respond              = utils.respond;
const createDirIfNotExists = utils.createDirIfNotExists;

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

      let pathFile  = path.join(pathContainer, params.id + '.enc');
      let _pipeline = [
        fileStream,
        encryption.encryptStream(
          file.getFileName(params.id, store.CONFIG.ENCRYPTION_IV_LENGTH),
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

  let busboy = new Busboy({ headers: req.headers });

  busboy.on('file', (fieldname, fileStream, filename, encoding, mimetype) => {
    if (!filename) {
      return respond(res);
    }

    putFile(fileStream, params, store, keyNodes, false, (err) => {
      if (err) {
        return respond(res, 500);
      }

      respond(res, 200);
    });
  });

  busboy.on('error' , () => {
    respond(res);
  });

  busboy.on('finish', () => {
    respond(res, 200);
  });

  req.pipe(busboy);
}
