const { putApi  } = require('./put');
const { getApi  } = require('./get');
const nodeApi = require('./node');

/**
 * API router
 * @param {Object} router find-my-way
 * @param {Object} store { CONFIG }
 */
function load (router, store) {
  router.on('GET', '/file/container/:containerId/:id', getApi, store);
  router.on('PUT', '/file/container/:containerId/:id', putApi, store);

  router.on('POST', '/node/register', nodeApi, store);
}

module.exports = load;
