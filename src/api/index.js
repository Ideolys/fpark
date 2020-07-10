const putApi = require('./put');

function load (router, store) {
  router.on('PUT', '/file/container/:containerId/:id', putApi, store);
}

function getImage (req, res, params, store) {

}


module.exports = load;
