const fs     = require('fs');
const zlib   = require('zlib');
const crypto = require('crypto');


module.exports = {

  /**
   * Create an encrypt stream
   * @param {String} key
   * @param {String} iv
   * @param {String} algorithm
   */
  encryptStream (key, iv, algorithm = 'aes-128-ctr') {
    return crypto.createCipheriv(algorithm, key, iv);
  },

  /**
   * Create an decrypt stream
   * @param {String} key
   * @param {String} iv
   * @param {String} algorithm
   */
  decryptStream (key, iv, algorithm = 'aes-128-ctr') {
    return crypto.createDecipheriv(algorithm, key, iv);
  }

};
