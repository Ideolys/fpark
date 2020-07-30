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
  router.on('GET'   , '/file/container/:containerId/:id', getApi, store);
  router.on('PUT'   , '/file/container/:containerId/:id', putApi, store);
  router.on('DELETE', '/file/container/:containerId/:id', delApi, store);

  if (store.CONFIG.IS_REGISTRATION_ENABLED) {
    router.on('POST', '/node/register', nodeApi, store);
  }
}

module.exports = load;
