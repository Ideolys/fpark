const fs          = require('fs');
const path        = require('path');
const zlib        = require('zlib');
const { padlz }   = require('./utils');
const repartition = require('./repartition');
const encryption  = require('../commons/encryption');

module.exports = {

  /**
   * Get filename of spe;cified length
   * @param {String} filename
   * @param {Int} length
   * @returns {String}
   */
  getFileName (filename, length) {
    if (filename.length < length) {
      return padlz(filename, length);
    }

    return filename.substr(0, length);
  },

  /**
   * Get a file
   * @param {Object} res
   * @param {Object} params
   * @param {Object} store { CONFIG }
   * @param {Array} nodes array of authorized nodes to handle request
   * @param {Function} handler for error
   * @param {Boolean} isFromCurrentProcess @default false // if true, do add already defined header
   * @param {Boolean} isPipeToRes@default true
   */
  getFile (res, params, store, nodes, handler, isFromCurrentProcess = false, isPipeToRes = true) {
    let pathDisk     = path.resolve(path.join(store.CONFIG.FILE_DIRECTORY, nodes));
    let filename     = this.getFileName(params.id, store.CONFIG.ENCRYPTION_IV_LENGTH);
    let fileNameDisk = encryption.hash(filename, store.CONFIG.HASH_SECRET, store.CONFIG.HASH_ALGORITHM);
    let filePath     = path.join(pathDisk, params.containerId, fileNameDisk + '.enc');
    let fileStream   = fs.createReadStream(filePath);

    let gzipStream    = zlib.createGzip();
    let decryptStream = encryption.decryptStream(
      filename,
      store.CONFIG.ENCRYPTION_IV,
      store.CONFIG.ENCRYPTION_ALGORITHM
    );

    fileStream.on('error', err => {
      handler();
    });

    decryptStream.on('error', () => {
      return respond(res, 500);
    });
    gzipStream.on('error', () => {
      return respond(res, 500);
    });

    if (!isFromCurrentProcess) {
      res.setHeader('Cache-Control', 'max-age=' + store.CONFIG.CACHE_CONTROL_MAX_AGE + ',immutable');
      res.setHeader('Content-Encoding', 'gzip');
    }

    fileStream.pipe(decryptStream).pipe(gzipStream);

    if (isPipeToRes) {
      gzipStream.pipe(res);
    }

    return fileStream;
  }

};
