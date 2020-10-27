const errorPrefix = 'fpark.conf: ' ;
const errorEnd = '\n Documentation: https://github.com/Ideolys/fpark#configuration';

module.exports = function verify (config) {

  if (config.NODES && config.NODES.length && config.ID == null) {
    throw new Error(errorPrefix + 'ID is required' + errorEnd);
  }

  if (config.NODES) {
    for (let i = 0; i < config.NODES.length; i++) {
      let node = config.NODES[i];

      if (!node.id) {
        throw new Error(errorPrefix + 'NODES[].id is required' + errorEnd);
      }
      if (!node.host) {
        throw new Error(errorPrefix + 'NODES[].host is required, ex: "http://localhost:3000"' + errorEnd);
      }

      if (!node.host.startsWith('http')) {
        throw new Error(errorPrefix + 'NODES[].host should starts with "http" or "https", ex: "http://localhost:3000"' + errorEnd);
      }
    }
  }

}
