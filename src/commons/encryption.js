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
  },

  /**
   * Hash a string
   * @param {String} string
   * @param {String} secret
   * @param {String} algorithm defautl sha256
   * @returns {Stirng}
   */
  hash (string, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret)
                  .update(string)
                  .digest('hex');
  }

};
