
const path         = require('path');
const url          = require('url');
const zlib         = require('zlib');
const fetch        = require('node-fetch');
const { putFile }  = require('./put');
const repartition  = require('../commons/repartition');
const file         = require('../commons/file');
const proxyFactory = require('../commons/proxy');
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
const {
  resize,
  getSize
} = require('../commons/image/resize');
const isImage = require('../commons/image/utils').isImage;

const kittenLogger = require('kitten-logger');
const auth         = require('../commons/auth');
const logger       = kittenLogger.createPersistentLogger('get_file');
const stats        = require('../stats');

/**
 * Get a file (initialize streams)
 * @param {Object} CONFIG
 * @param {Object} req
 * @param {Object} res
 * @param {Object} params request's params
 * @param {Object} queryParams query parameters
 * @param {String} keyNodes path 'node1-node2-node3'
 * @param {Array} streams
 * @param {Function} handler handler if error
 */
function getFile (CONFIG, req, res, params, queryParams, keyNodes, streams, handler) {
  function handlerError (err) {
    if (getHeaderNthNode(req.headers) === 3 || (getHeaderFromNode(req.headers) && !req.headers['x-forwarded-for'])) {
      logger.warn({ msg : 'Depth reached', from : getHeaderFromNode(req.headers) }, { idKittenLogger : req.log_id });
      return respond(res, 404);
    }

    handler();
  }

  let extension           = path.extname(params.id);
  let extensionWithoutDot = extension.replace('.', '');

  if (isImage(extensionWithoutDot) && req.url) {
    let sizeId = queryParams.get('size');
    let size   = getSize(CONFIG, sizeId);

    if (size) {
      streams.unshift(resize(CONFIG, sizeId));
    }
  }

  let preparedStreams = file.prepareStreams(CONFIG, keyNodes, params, streams, handlerError, req.url);

  if (res) {
    preparedStreams.pipe(res);
  }
}

/**
 * Get API
 * @param {Object} req
 * @param {Object} res
 * @param {Object} params
 * @param {Object} store
 */
exports.getApi = function getApi (req, res, params, store) {
  req.counters = [
    stats.COUNTER_NAMESPACES.REQUEST_DURATION_AVG_GET,
    stats.COUNTER_NAMESPACES.REQUEST_DURATION_GET,
    stats.COUNTER_NAMESPACES.REQUEST_NUMBER_GET
  ];

  auth.verifyAccessKey(req, res, params, queryParams => {
    let fileHash         = file.getFileHash(store.CONFIG, params.id);
    let nodes            = repartition.getNodesToPersistTo(fileHash, store.CONFIG.NODES, store.CONFIG.REPLICATION_NB_REPLICAS);
    let isAllowedToWrite = repartition.isCurrentNodeInPersistentNodes(nodes, store.CONFIG.ID);

    if (!isAllowedToWrite && nodes.length) {
      if (getHeaderNthNode(req.headers) === 3) {
        logger.warn({ msg : 'Depth reached', from : getHeaderFromNode(req.headers) }, { idKittenLogger : req.log_id });
        return respond(res, 404);
      }

      return queue(nodes, (node, next) => {
        if (node.id === store.CONFIG.ID) {
          return next();
        }

        let proxy = proxyFactory(() => {
          return respond(res, 404);
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
        logger.warn({ msg : 'Cannot proxy',  }, { idKittenLogger : req.log_id });
        respond(res, 500);
      });
    }

    req.counters.push(stats.COUNTER_NAMESPACES.FILES_COUNT);

    let keyNodes = repartition.flattenNodes(nodes, store.CONFIG.ID);

    res.setHeader('Cache-Control', 'max-age=' + store.CONFIG.CACHE_CONTROL_MAX_AGE + ',immutable');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(params.id) + '"');

    getFile(store.CONFIG, req, res, params, queryParams, keyNodes, [zlib.createGzip()], () => {
      if (!nodes.length) {
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
          headers,
          method : 'GET',
          url    : req.url
        };

        fetch(node.host + req.url, _req).then((resRequest) => {
          if (resRequest.status !== 200) {
            return next();
          }

          putFile(resRequest.body, params, store, keyNodes, null, err => {
            if (err) {
              logger.warn({ msg : 'Cannot get file', err }, { idKittenLogger : req.log_id });
              return respond(res, 500);
            }

            getFile(store.CONFIG, _req, res, params, queryParams, keyNodes, [zlib.createGzip()], () => {
              respond(res, 404);
            });
          });
        }).catch(() => {
          next();
        });
      }, () => {
        // No file has been found
        respond(res, 404);
      });
    });
  });
}
