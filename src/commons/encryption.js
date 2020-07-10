const fs     = require('fs');
const zlib   = require('zlib');
const crypto = require('crypto');


module.exports = {

  encryptStream (key, iv, algorithm = 'aes-128-ctr') {
    return crypto.createCipheriv(algorithm, key, iv);
  },

  decryptStream (key, iv, algorithm = 'aes-128-ctr') {
    return crypto.createDecipheriv(algorithm, key, iv);
  }

};
