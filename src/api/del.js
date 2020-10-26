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

const kittenLogger = require('kitten-logger');
const logger       = kittenLogger.createPersistentLogger('del_file');

/**
 * DEL API
 * @param {Object} req
 * @param {Object} res
 * @param {Object} params { id, containerId }
 * @param {Object} store { CONFIG }
 */
exports.delApi = function delApi (req, res, params, store) {
  verify(req, res, params, () => {
    let fileHash         = file.getFileHash(store.CONFIG, params.id);
    let nodes            = getNodesToPersistTo(fileHash, store.CONFIG.NODES, store.CONFIG.REPLICATION_NB_REPLICAS);
    let isAllowedToWrite = isCurrentNodeInPersistentNodes(nodes, store.CONFIG.ID);

    if (!isAllowedToWrite && nodes.length) {
      if (getHeaderNthNode(req.headers) === 3) {
        logger.warn({ msg : 'Depth reached', from : getHeaderFromNode(req.headers) }, { idKittenLogger : req.log_id });
        return respond(res, 500);
      }

      return queue(nodes, (node, next) => {
        if (node.id === store.CONFIG.ID) {
          return next();
        }

        let proxy = proxyFactory(() => {
          logger.warn({ msg : 'cannot proxy' }, { idKittenLogger : req.log_id });
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
        logger.warn({ msg : 'Cannot proxy' }, { idKittenLogger : req.log_id });
        respond(res, 500);
      });
    }

    let keyNodes = flattenNodes(nodes);
    let filePath = file.getFilePath(store.CONFIG, keyNodes, params);
    fs.unlink(filePath.path, err => {
      if (err) {
        logger.warn({ msg : 'cannot delete', err }, { idKittenLogger : req.log_id });
        return respond(res, 404);
      }

      if ((getHeaderFromNode(req.headers) && !req.headers['x-forwarded-for']) || !nodes.length) {
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
