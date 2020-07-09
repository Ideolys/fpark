const fs        = require('fs');
const path      = require('path');
const cluster   = require('../cluster');
const { proxy } = require('fast-proxy')({});

function load (router, store) {
  router.on('PUT', '/image/:id', putImage, store);
  router.on('GET', '/image/:id', getImage, store);
}

function putImage (req, res, params, store) {
  let nodes            = cluster.getNodesPersistence(params.id, store.CONFIG.NB_NODES_TO_REPLICATE, store.CONFIG.NODES);
  let isAllowedToWrite = cluster.isCurrentNodeInPersistenceNodes(store.CONFIG.SERVER_PORT, store.CONFIG.NODES, nodes);

  if (!isAllowedToWrite) {
    let nodeToWrite = cluster.getNodeToPersist(store.CONFIG.NODES, nodes);
    return proxy(req, res, 'http://' + nodeToWrite.host + ':' + nodeToWrite.port + req.url);
  }

  return fs.writeFile(path.join(process.cwd(), 'tmp', store.CONFIG.SERVER_PORT + '', params.id + ''), params.id, err => {
    res.statusCode = 200;
    res.end();
  });
}

function getImage (req, res, params, store) {

}


module.exports = load;
