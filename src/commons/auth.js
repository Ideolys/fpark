const path    = require('path');
const fs      = require('fs');
const cluster = require('cluster');
const jwt     = require('jsonwebtoken');
const cache   = require('kitten-cache');
const lru     = new cache({
  size : 10000
});
const { respond, queue } = require('./utils');

const PUBLIC_KEY_FILE_EXTENSION = '.pub';
const keys                      = {};

if (cluster.isMaster) {
  cluster.on('message', (worker, message) => {
    for (const id in cluster.workers) {
      if (id === worker.id) {
        continue;
      }

      cluster.workers[id].send(message);
    }
  });
}

if (cluster.isWorker) {
  process.on('message', (message) => {
    keys[message.container] = message.key;
  });
}

/**
 * Set key for a container
 * @todo make it cluster friendly
 * @param {String} container
 * @param {String} key
 */
function setKey (container, key) {
  if (keys[container]) {
    return;
  }

  keys[container] = key;

  if (cluster.isWorker) {
    process.send({
      container,
      key
    });
  }
}

module.exports = {

  setKey,

  /**
   * Verify a JWT token
   * @param {Object} req
   * @param {Object} res
   * @param {Function} callback
   */
  verify : function verify (req, res, params, callback) {
    let _containerId = params.containerId;
    let _token       = req.headers.authorization;

    if (!_token) {
      return respond(res, 401);
    }

    _token = _token.replace('Bearer ', '');

    let _containerIdJWT = null;
    try {
      _containerIdJWT = JSON.parse(Buffer.from(_token.split('.')[1], 'base64').toString()).aud;
    }
    catch (e) {
      return respond(res, 401);
    }

    let _cachedResponse = lru.get(_token);
    if (_cachedResponse) {
      return callback(_cachedResponse);
    }
    else if (_cachedResponse === false) {
      return respond(res, 401);
    }

    if (!keys[_containerIdJWT]) {
      return respond(res, 401);
    }

    jwt.verify(_token, keys[_containerIdJWT], (err, decoded) => {
      if (err) {
        lru.set(_token, false);
        return respond(res, 401);
      }

      if (_containerId != _containerIdJWT) {
        lru.set(_token, false);
        return respond(res, 401);
      }

      lru.set(_token, _containerIdJWT);
      callback(_containerIdJWT);
    });
  },

  /**
   * Load ECDH keys
   * @param {String} directory  path to ECDH keys directory
   */
  loadKeys : function (directory, callback) {
    fs.readdir(directory, (err, files) => {
      if (err) {
        return callback(err);
      }

      queue(files, (file, next) => {
        if (path.extname(file) !== PUBLIC_KEY_FILE_EXTENSION) {
          return next();
        }

        let _filename   = path.basename(file, PUBLIC_KEY_FILE_EXTENSION);
        fs.readFile(path.join(directory, file), (err, file) => {
          if (err) {
            return next();
          }

          keys[_filename] = file.toString();
        });
      }, callback);
    });
  }

}
