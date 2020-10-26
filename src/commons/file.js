const fs         = require('fs');
const path       = require('path');
const encryption = require('../commons/encryption');
const Cache      = require('streaming-cache');

let cache = new Cache({
  maxAge : 1000 * 60 * 60
});

module.exports = {

  /**
   * Get filename of specified length
   * @param {String} filename
   * @param {Int} length
   * @returns {String}
   */
  getFileName (filename, length) {
    let _bufferString = Buffer.from(filename);

    if (_bufferString.length >= length) {
      return _bufferString.slice(0, length).toString('ascii');
    }

    let _buffer = Buffer.alloc(length);
    _buffer.fill('0');
    _bufferString.copy(_buffer, length - _bufferString.length);

    return _buffer.toString('ascii');
  },

  /**
   * Get file path and filename
   * @param {Object} CONFIG
   * @param {String} nodes array of authorized nodes to handle request
   * @param {Object} params
   * @returns {Object} { path : String, filename : String }
   */
  getFilePath (CONFIG, nodes, params) {
    let pathDisk     = path.resolve(path.join(CONFIG.FILES_DIRECTORY, nodes));
    let filename     = this.getFileName(params.id, CONFIG.ENCRYPTION_IV_LENGTH);
    let filenameDisk = this.getFileHash(CONFIG, params.id);
    let filePath     = path.join(pathDisk, params.containerId, filenameDisk + '.enc');

    return { path : filePath, filename };
  },

  /**
   * Get file hash
   * @param {Object} CONFIG
   * @param {Object} filename
   * @returns {String}
   */
  getFileHash (CONFIG, filename) {
    return encryption.hash(filename, CONFIG.HASH_SECRET, CONFIG.HASH_ALGORITHM);
  },

  /**
   * Prepare streams to read file from disk
   * @param {Object} CONFIG
   * @param {String} nodes array of authorized nodes to handle request
   * @param {Object} params
   * @param {Array} streams array of Stream object to pipe to file read stream
   * @param {Function} handlerError
   * @param {String} cacheKey
   * @returns {WritableStream}
   */
  prepareStreams (CONFIG, nodes, params, streams, handlerError, cacheKey) {
    let paths = this.getFilePath(CONFIG, nodes, params);

    if (cache.exists(cacheKey)) {
      let cacheValue = cache.get(cacheKey);
      cacheValue.on('error', handlerError);
      return cacheValue;
    }

    let fileStream = fs.createReadStream(paths.path);

    let decryptStream = encryption.decryptStream(
      paths.filename,
      CONFIG.ENCRYPTION_IV,
      CONFIG.ENCRYPTION_ALGORITHM
    );

    function cacheHandlerError (e) {
      cache.del(cacheKey);
      handlerError(e)
    }

    fileStream.on('error', cacheHandlerError);
    decryptStream.on('error', cacheHandlerError);

    let pipedStreams = fileStream.pipe(decryptStream);
    let cacheValue = null;

    try {
      cacheValue = cache.set(cacheKey);
    }
    catch (e) {
      cacheHandlerError();
    }
    streams.push(cacheValue);

    for (let i = 0; i < streams.length; i++) {
      let stream = streams[i];
      stream.on('error', cacheHandlerError);
      pipedStreams = pipedStreams.pipe(stream);
    }

    return pipedStreams;
  }

};
