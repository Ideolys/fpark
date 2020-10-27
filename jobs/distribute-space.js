// @todo one file at a time (queue)
// @todo get files that respond to old conf (XX-XX-XX where XX is the node's ID)
// dir nodes THEN containers THEN files

const path         = require('path');
const fs           = require('fs');
const kittenLogger = require('kitten-logger');

const repartition = require('../src/commons/repartition');
const filer       = require('../src/commons/file');

const logger  = kittenLogger.createPersistentLogger('fpark:job:distribute-space');
const pidFile = path.join(process.cwd(), 'job_distribute_space.pid');
const {
  queue,
  createDirIfNotExists
} = require('../src/commons/utils');

/**
 * Determine if conf has changed and is different from the old one
 * @param {Array} newNodes
 * @param {Array} oldNodes
 */
function _isConfDifferent (newNodes, oldNodes) {
  if (newNodes.length !== oldNodes.length) {
    return true;
  }

  for (let i = 0; i < newNodes.length; i++) {
    let hasBeenFound = false;

    for (let j = 0; j < oldNodes.length; j++) {
      if (newNodes[i].id === oldNodes[j].id) {
        hasBeenFound = true;
        break;
      }
    }

    if (!hasBeenFound) {
      return true;
    }
  }

  return false;
}

/**
 * Start
 * @param {Function} callback
 */
function _start (callback) {
  fs.writeFile(pidFile, process.pid, callback);
}

/**
 * End job
 * @param {String} loggerId
 * @param {Function} callback
 */
function _end (loggerId, callback) {
  logger.info('Job has ended', { idKittenLogger : loggerId });
  callback();
}

/**
 * Determine if the job is running
 * @param {Function} callback
 */
function _isJobRunning (callback) {
  fs.stat(pidFile, fs.constants.F_OK, (err) => {
    if (err) {
      return callback(false);
    }

    callback(true);
  })
}

/**
 * Remove job file
 * @param {Function} callback
 */
function _removeJobFile (callback) {
  fs.unlink(pidFile, callback);
}

/**
 * Walk directory
 * @param {String} dir
 * @param {Function} onLastDirectoryFn
 * @param {Function} done
 */
function _walkDirectory (dir, onLastDirectoryFn, done) {
  let results = [];

  fs.readdir(dir, (err, list) => {
    if (err) {
      return done(err);
    }

    var i = 0;
    function next () {
      let _file      = list[i++];
      let _container = _file;
      if (!_file) {
        return done(null, results);
      }

      _file = dir + '/' + _file;
      fs.stat(_file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          return _walkDirectory(_file, onLastDirectoryFn, (err, res) => {
            if (!res.length) {
              return next();
            }

            onLastDirectoryFn(_file, _container, res, next);
          });
        }

        if (_file.substring(_file.length - 4, _file.length) === '.enc') {
          results.push(_file);
        }

        next();
      });
    }

    next();
  });
}

/**
 * Move files
 * @param {String} loggerId
 * @param {Object} config
 * @param {String} container
 * @param {Array} files
 * @param {Function} callback
 */
function _moveFiles (loggerId, config, container, files, callback) {
  let nbErrors = 0;

  queue(files, (file, next) => {
    let fileHash = path.basename(file, '.enc');
    let nodes    = repartition.getNodesToPersistTo(fileHash, config.NODES, config.REPLICATION_NB_REPLICAS);
    let keyNodes = repartition.flattenNodes(nodes);
    let pathDisk = path.join(config.FILES_DIRECTORY, keyNodes);

    createDirIfNotExists(pathDisk, err => {
      if (err) {
        logger.error('Cannot create directory ' + pathDisk + ': ' + err.message, { idKittenLogger : loggerId });
        logger.error('Cannot distribute file '  + file     + ': ' + err.message, { idKittenLogger : loggerId });
        nbErrors++;
        return next();
      }

      let pathContainer = path.join(pathDisk, container);
      createDirIfNotExists(pathContainer, err => {
        if (err) {
          logger.error('Cannot create directory ' + pathContainer + ': ' + err.message, { idKittenLogger : loggerId });
          logger.error('Cannot distribute file '  + file          + ': ' + err.message, { idKittenLogger : loggerId });
          nbErrors++;
          return next();
        }

        let filePath =  filer.getFilePath(config, keyNodes, {
          id          : path.basename(file),
          containerId : container
        });

        fs.rename(file, filePath.path, err => {
          if (err) {
            logger.error('Cannot distribute file ' + file + ': ' + err.message, { idKittenLogger : loggerId });
            nbErrors++;
            return next();
          }

          next();
        });
      });
    });
  }, () => {
    callback(nbErrors);
  });
}

/**
 * Job distribute-space
 * It will redistribute files among nodes if
 *  - nodes have been removed
 *  - nodes have been added
 * @param {Object} params { config }
 * @param {Function} callback
 */
function distributeSpace (params, callback) {
  const { config } = params;
  const loggerId   = new Date().valueOf();

  logger.info('Job has started', { idKittenLogger : loggerId });

  if (!config.OLD_NODES) {
    return _end(loggerId, callback);
  }

  if (!_isConfDifferent(config.NODES, config.OLD_NODES)) {
    return _end(loggerId, callback);
  }

  _isJobRunning(isRunning => {
    if (isRunning) {
      logger.warn('Job is already running', { idKittenLogger : loggerId });
      return _end(loggerId, callback);
    }

    _start(() => {
      _walkDirectory(config.FILES_DIRECTORY, (pathContainer, container, files, next) => {
        _moveFiles(loggerId, config, container, files, nbErrors => {
          logger.info(
            'Job has distributed ' + Math.abs(nbErrors - files.length) + '/' + files.length + ' for dir ' + pathContainer,
            { idKittenLogger : loggerId }
          );
          next();
        });
      }, () => {
        _removeJobFile(() => {
          _end(loggerId, callback);
        });
      });
    });
  });
}

module.exports = distributeSpace;
