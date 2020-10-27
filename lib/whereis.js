const path = require('path');

const repartition = require('../src/commons/repartition');
const filer       = require('../src/commons/file');

module.exports = function whereis (config, filename) {
  let fileHash = filer.getFileHash(config, filename);
  let nodes    = repartition.getNodesToPersistTo(fileHash, config.NODES, config.REPLICATION_NB_REPLICAS);
  let keyNodes = repartition.flattenNodes(nodes);
  let filePath = filer.getFilePath(config, keyNodes, {
    id          : path.basename(filename),
    containerId : 'sample'
  });

  console.log('Path= \t\t'   + filePath.path);
  console.log('Filename= \t' + fileHash + '.enc');
  console.log('Nodes= \t\t' + (keyNodes || 'none'));
}
