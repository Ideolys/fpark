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
  router.on('GET'   , '/file/:id/container/:containerId', getApi, store);
  router.on('PUT'   , '/file/:id/container/:containerId', putApi, store);
  router.on('DELETE', '/file/:id/container/:containerId', delApi, store);

  if (store.CONFIG.IS_REGISTRATION_ENABLED) {
    router.on('POST', '/node/register', nodeApi, store);
  }
}

module.exports = load;
