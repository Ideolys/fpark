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

  let keyNodes = repartition.flattenNodes(nodes);

  file.getFile(res, params, store, keyNodes, () => {
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

      setHeaderNthNode(headers);

      let _req =  {
        method : 'GET',
        path   : req.url,
        base   : node.host,
        headers
      };

      request(_req, (err, resRequest) => {
        if (err) {
          return next();
        }

        putFile(resRequest, params, store, keyNodes, true, err => {
          if (err) {
            return respond(r, 500);
          }

          file.getFile(res, params, store, keyNodes, () => {
            respond(res, 404);
          }, true, true);
        });
      });
    }, () => {
      // No file has been found
      respond(res, 404);
    });
  });
}
