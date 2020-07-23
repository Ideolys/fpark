
const zlib         = require('zlib');
const { proxy }    = require('fast-proxy')({});
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


function getFile (CONFIG, req, res, params, keyNodes, isGzip, handler) {
  function handlerError (err) {
    if (getHeaderNthNode(req.headers) === 3 || getHeaderFromNode(req.headers)) {
      return respond(res, 404);
    }

    handler();
  }

  let streams = file.prepareStreams(CONFIG, keyNodes, params, isGzip, handlerError);

  if (res) {
    streams.pipe(res);
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
  let nodes            = repartition.getNodesToPersistTo(params.id, store.CONFIG.NODES);
  let isAllowedToWrite = repartition.isCurrentNodeInPersistentNodes(nodes, store.CONFIG.ID);

  if (!isAllowedToWrite) {
    if (getHeaderNthNode(req.headers) === 3) {
      return respond(res, 404);
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

  res.setHeader('Cache-Control', 'max-age=' + store.CONFIG.CACHE_CONTROL_MAX_AGE + ',immutable');
  res.setHeader('Content-Encoding', 'gzip');

  getFile(store.CONFIG, req, res, params, keyNodes, true, () => {
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
        headers,
      };

      fetch(node.host + req.url, _req).then((resRequest) => {
        if (resRequest.status !== 200) {
          return next();
        }

        putFile(resRequest.body, params, store, keyNodes, null, err => {
          if (err) {
            return respond(res, 500);
          }

          getFile(store.CONFIG, _req, res, params, keyNodes, false, () => {
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
}
