const path    = require('path');
const fs      = require('fs');
const cluster = require('cluster');
const url     = require('url');
const jwt     = require('jsonwebtoken');
const cache   = require('kitten-cache');
const lru     = new cache({
  size : 10000
});
const { respond, queue } = require('./utils');

const PUBLIC_KEY_FILE_EXTENSION = '.pub';
const ACCESS_KEY_FILE_EXTENSION = '.access_key';
const keys                      = {};
const accessKeys                = {};

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
   * Verify accessKey
   * @param {Object} req
   * @param {Object} res
   * @param {Object} params request parameters
   * @param {Function} callback
   */
  verifyAccessKey (req, res, params, callback) {
    let query = url.parse(req.url).search;

    if (!query) {
      return respond(res, 401);
    }

    let queryParams = new URLSearchParams(query);

    if (!queryParams.has('access_key')) {
      return respond(res, 401);
    }

    let containerAccessKey = queryParams.get('access_key');
    if (!accessKeys[params.containerId]) {
      return respond(res, 401);
    }

    if (accessKeys[params.containerId] !== containerAccessKey) {
      return respond(res, 401);
    }

    callback(queryParams);
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

        let _filename = path.basename(file, PUBLIC_KEY_FILE_EXTENSION);
        fs.readFile(path.join(directory, file), (err, file) => {
          if (err) {
            return next();
          }

          _filename = _filename.replace('_', '/');

          keys[_filename] = file.toString();
          next();
        });
      }, callback);
    });
  },

  /**
   * Load Access keys
   * @param {String} directory  path to access keys directory (sameas keys)
   */
  loadAccessKeys : function (directory, callback) {
    fs.readdir(directory, (err, files) => {
      if (err) {
        return callback(err);
      }

      queue(files, (file, next) => {
        if (path.extname(file) !== ACCESS_KEY_FILE_EXTENSION) {
          return next();
        }

        let _filename = path.basename(file, ACCESS_KEY_FILE_EXTENSION);
        fs.readFile(path.join(directory, file), (err, file) => {
          if (err) {
            return next();
          }

          _filename = _filename.replace('_', '/');

          accessKeys[_filename] = file.toString().trim();
          next();
        });
      }, callback);
    });
  },

}
