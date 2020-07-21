const fs           = require('fs');
const path         = require('path');
const zlib         = require('zlib');
const { proxy }    = require('fast-proxy')({});
const { putFile }  = require('./put');
const repartition  = require('../commons/repartition');
const encryption   = require('../commons/encryption');
const file         = require('../commons/file');
const request      = require('../commons/request');
const {
  getHeaderNthNode,
  setHeaderNthNode,
  setHeaderCurrentNode,
  getHeaderFromNode
} = require('../commons/headers');
const {
  respond,
  queue
} = require('../commons/utils');

/**
 * Get a file
 * @param {Object} req
 * @param {Object} res
 * @param {Object} params
 * @param {Object} store { CONFIG }
 * @param {Array} nodes array of authorized nodes to handle request
 * @param {Boolean} isFromCurrentProcess
 */
function getFile (req, res, params, store, nodes, isFromCurrentProcess = false) {
  let keyNodes   = repartition.flattenNodes(nodes);
  let pathDisk   = path.resolve(path.join(store.CONFIG.FILE_DIRECTORY, keyNodes));
  let filePath   = path.join(pathDisk, params.containerId, params.id + '.enc');
  let fileStream = fs.createReadStream(filePath);

  let gzipStream    = zlib.createGzip();
  let decryptStream = encryption.decryptStream(
    file.getFileName(params.id, store.CONFIG.ENCRYPTION_IV_LENGTH),
    store.CONFIG.ENCRYPTION_IV,
    store.CONFIG.ENCRYPTION_ALGORITHM
  );

  fileStream.on('error', () => {
    if (getHeaderNthNode(req.headers) === 3 || getHeaderFromNode(req.headers)) {
      return respond(res, 404);
    }

    let headers =  {
      'accept-encoding' : 'gzip'
    };
    setHeaderCurrentNode(headers, store.CONFIG.ID);

    // Try to get file from another node
    // Save it
    // Serve it
    queue(nodes, (node, next) => {
      if (node.id === store.CONFIG.ID) {
        return next();
      }

      setHeaderNthNode(headers, req.headers);

      request({
        method : 'GET',
        path   : req.url,
        base   : node.host,
        headers
      }, (err, resRequest) => {
        if (err) {
          return next();
        }

        putFile(resRequest, params, store, keyNodes, true, err => {
          if (err) {
            return respond(r, 500);
          }

          getFile(req, res, params, store, nodes, true);
        });
      });
    }, () => {
      // No file has been found
      respond(res, 404);
    });
  });

  decryptStream.on('error', () => {
    return respond(res, 500);
  });
  gzipStream.on('error', () => {
    return respond(res, 500);
  });

  if (!isFromCurrentProcess) {
    res.setHeader('Cache-Control', 'max-age=' + store.CONFIG.CACHE_CONTROL_MAX_AGE + ',immutable');
    res.setHeader('Content-Encoding', 'gzip');
  }

  fileStream.pipe(decryptStream).pipe(gzipStream).pipe(res);
}

exports.getFile = getFile;

/**
 * Get API
 * @param {Object} req
 * @param {Object} res
 * @param {Object} params
 * @param {Object} store
 */
exports.getApi = function getApi (req, res, params, store) {
  let nodes            = repartition.getNodesToPersistTo(params.id, store.CONFIG.NODES);
  let isAllowedToWrite = repartition.isCurrentNodeInPersistentNodes(nodes, store.CONFIG.ID);

  if (!isAllowedToWrite) {
    if (getHeaderNthNode(req.headers) === 3) {
      return respond(res, 404);
    }

    return proxy(req, res, nodes[0].host + req.url, {
      rewriteRequestHeaders (req, headers) {
        setHeaderNthNode(req.headers);
        setHeaderCurrentNode(req.headers, store.CONFIG.ID);
        return headers;
      }
    });
  }

  file.getFile(res, params, store, nodes, () => {
    if (getHeaderNthNode(req.headers) === 3 || getHeaderFromNode(req.headers)) {
      return respond(res, 404);
    }

    let headers =  {
      'accept-encoding' : 'gzip'
    };
    setHeaderCurrentNode(headers, store.CONFIG.ID);

    // Try to get file from another node
    // Save it
    // Serve it
    queue(nodes, (node, next) => {
      if (node.id === store.CONFIG.ID) {
        return next();
      }

      setHeaderNthNode(headers, req.headers);

      request({
        method : 'GET',
        path   : req.url,
        base   : node.host,
        headers
      }, (err, resRequest) => {
        if (err) {
          return next();
        }

        putFile(resRequest, params, store, keyNodes, true, err => {
          if (err) {
            return respond(r, 500);
          }

          getFile(req, res, params, store, nodes, true);
        });
      });
    }, () => {
      // No file has been found
      respond(res, 404);
    });
  });
}
