const fs         = require('fs');
const path       = require('path');
const { padlz }  = require('./utils');
const encryption = require('../commons/encryption');

module.exports = {

  /**
   * Get filename of specified length
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
   * Get file path and filename
   * @param {Object} CONFIG
   * @param {String} nodes array of authorized nodes to handle request
   * @param {Object} params
   * @returns {Object} { path : String, filename : String }
   */
  getFilePath (CONFIG, nodes, params) {
    let pathDisk     = path.resolve(path.join(CONFIG.FILES_DIRECTORY, nodes));
    let filename     = this.getFileName(params.id, CONFIG.ENCRYPTION_IV_LENGTH);
    let filenameDisk = encryption.hash(params.id, CONFIG.HASH_SECRET, CONFIG.HASH_ALGORITHM);
    let filePath     = path.join(pathDisk, params.containerId, filenameDisk + '.enc');

    return { path : filePath, filename };
  },

  /**
   * Prepare streams to read file from disk
   * @param {Object} CONFIG
   * @param {String} nodes array of authorized nodes to handle request
   * @param {Object} params
   * @param {Array} streams array of Stream object to pipe to file read stream
   * @param {Function} handlerError
   * @returns {WritableStream}
   */
  prepareStreams (CONFIG, nodes, params, streams, handlerError) {
    let paths      = this.getFilePath(CONFIG, nodes, params);
    let fileStream = fs.createReadStream(paths.path);

    let decryptStream = encryption.decryptStream(
      paths.filename,
      CONFIG.ENCRYPTION_IV,
      CONFIG.ENCRYPTION_ALGORITHM
    );

    fileStream.on('error', handlerError);
    decryptStream.on('error', handlerError);

    let pipedStreams = fileStream.pipe(decryptStream);

    for (let i = 0; i < streams.length; i++) {
      let stream = streams[i];
      stream.on('error', handlerError);
      pipedStreams = pipedStreams.pipe(stream);
    }

    return pipedStreams;
  }

};
