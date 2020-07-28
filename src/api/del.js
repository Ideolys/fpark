const fs    = require('fs');
const fetch = require('node-fetch');
const {
  getNodesToPersistTo,
  isCurrentNodeInPersistentNodes,
  flattenNodes
} = require("../commons/repartition");
const {
  getHeaderNthNode,
  setHeaderNthNode,
  setHeaderCurrentNode,
  getHeaderFromNode
} = require("../commons/headers");
const { queue, respond } = require("../commons/utils");
const proxyFactory       = require('../commons/proxy');
const file               = require('../commons/file');
const { verify }         = require('../commons/auth');

/**
 * DEL API
 * @param {Object} req
 * @param {Object} res
 * @param {Object} params { id, containerId }
 * @param {Object} store { CONFIG }
 */
exports.delApi = function delApi (req, res, params, store) {
  verify(req, res, params, () => {
    let nodes            = getNodesToPersistTo(params.id, store.CONFIG.NODES);
    let isAllowedToWrite = isCurrentNodeInPersistentNodes(nodes, store.CONFIG.ID);

    if (!isAllowedToWrite) {
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

    let keyNodes = flattenNodes(nodes);
    let filePath = file.getFilePath(store.CONFIG, keyNodes, params);
    fs.unlink(filePath.path, err => {
      if (err) {
        return respond(res, 404);
      }

      if (getHeaderFromNode(req.headers) && !req.headers['x-forwarded-for']) {
        return respond(res, 200);
      }

      // Send request to each nodes
      let isAtLeastOneError = false;
      queue(nodes, (node, next) => {
        if (node.id === store.CONFIG.ID) {
          return next();
        }

        let headers = {
          'Content-Type'  : 'application/json',
          'authorization' : req.headers.authorization
        };

        setHeaderCurrentNode(headers);

        let _req =  {
          method : 'DELETE',
          headers
        };

        fetch(node.host + req.url, _req).then((resRequest) => {
          if (resRequest.status !== 200) {
            isAtLeastOneError = true;
            return next();
          }

          next();
        }).catch(() => {
          isAtLeastOneError = true;
          return next();
        });
      }, () => {
        respond(res, isAtLeastOneError ? 500 : 200);
      });
    });
  });
}
