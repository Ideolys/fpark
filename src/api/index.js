const { putApi  } = require('./put');
const { getApi  } = require('./get');
const { delApi }  = require('./del');
const nodeApi     = require('./node');

/**
 * API router
 * @param {Object} router find-my-way
 * @param {Object} store { CONFIG }
 */
function load (router, store) {
  router.on('GET'   , '/c/:containerId/f/:id', getApi, store);
  router.on('PUT'   , '/c/:containerId/f/:id', putApi, store);
  router.on('DELETE', '/c/:containerId/f/:id', delApi, store);

  if (store.CONFIG.IS_REGISTRATION_ENABLED) {
    router.on('POST', '/node/register', nodeApi.nodeRegister, store);
  }
  if (store.CONFIG.IS_STATS_ENABLED) {
    router.on('GET', '/node/stats', nodeApi.nodeStats, store);
  }
}

module.exports = load;
