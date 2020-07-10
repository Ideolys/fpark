const fs = require('fs');

module.exports = {

  /**
   * End HTTP request
   * @param {*} res
   * @param {*} code
   */
  respond : function respond (res, code) {
    res.statusCode = code || 500;
    res.end();
  },

  /**
   * Create directory if not exists
   * @param {String} path path to the directory
   */
  createDirIfNotExists : function (path, callback) {
    fs.access(path, err => {
      if (!err) {
        return callback();
      }

      fs.mkdir(path, callback);
    });
  },

  /**
   * Create directory if not exists SYNC
   * @param {String} path path to the directory
   */
  createDirIfNotExistsSync : function (path) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  },

  padlz : function(n, len) {
    for (n+=""; n.length < len; n = "0" + n);
    return n;
  }
};
