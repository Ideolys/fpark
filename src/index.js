const http    = require('http');
const path    = require('path');
const cluster = require('cluster');
const os      = require('os');
const numCPUs = os.cpus().length;
const router  = require('find-my-way')({
  defaultRoute : (req, res) => {
    res.statusCode = 404;
    res.end();
  }
});
const api          = require('./api');
const kittenLogger = require('kitten-logger');
const CONFIG       = require('./config');
const logger       = require('./logger');
const utils        = require('./commons/utils');
const auth         = require('./commons/auth');
let server;

/**
 * Init cluster
 * @param {Int} nbWorkers
 */
function initCluster (nbWorkers = numCPUs) {
  cluster.setupMaster({
    stdio : 'pipe'
  });

  for (var i = 0; i < nbWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
}


/**
 * Run server
 * @param {Function} callback
 */
function runServer (config, callback) {
  Object.assign(CONFIG, config);

  if (!CONFIG.ID && CONFIG.NODES.length) {
    throw new Error('The given configuration must defined the key "ID"');
  }

  if (cluster.isMaster || CONFIG.SERVER_CLUSTERS <= 1) {
    process.env.KITTEN_LOGGER_RETENTION_DIRECTORY = CONFIG.LOGS_DIRECTORY;
    process.env.KITTEN_LOGGER_RETENTION_FILENAME  = 'salt.' + CONFIG.SERVER_PORT;
    kittenLogger.init();
  }

  if (cluster.isMaster && CONFIG.SERVER_CLUSTERS > 1) {
    console.log(`[Cluster] master ${ process.pid } is running`);

    initCluster(CONFIG.SERVER_CLUSTERS);

    if (callback) {
      return callback();
    }

    return;
  }

  utils.createDirIfNotExistsSync(CONFIG.FILES_DIRECTORY);
  utils.createDirIfNotExistsSync(CONFIG.KEYS_DIRECTORY);

  api(router, { CONFIG });

  auth.loadKeys(path.join(process.cwd(), CONFIG.KEYS_DIRECTORY), err => {
    if (err) {
      throw err;
    }

    server = http.createServer((req, res) => {
      logger(req, res);
      router.lookup(req, res);
    });

    server.listen(CONFIG.SERVER_PORT, err => {
      if (err) {
        throw err;
      }

      console.log('Server listening on: http://localhost:' + CONFIG.SERVER_PORT);
    });
  });
}

module.exports = {
  start : runServer
};
