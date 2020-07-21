const fs = require('fs');

module.exports = {

  /**
   * End HTTP request
   * @param {Object} res
   * @param {Int} code
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

  /**
   * Pad by zero a string to specified length
   * @param {String} n
   * @param {Int} length
   */
  padlz : function(n, length) {
    for (n+=""; n.length < length; n = "0" + n);
    return n;
  },

  /**
   * Queue
   * @param {Array} items
   * @param {Function} handler function to handle item in items -> handler(item, next {Function})
   * @param {Function} done    function called when every items have been processed
   */
  queue (items, handler, done) {
    var iterator = -1;

    function next () {
      iterator++;
      var item = items[iterator];

      if (!item) {
        return done();
      }

      handler(items[iterator], next);
    }

    next();
  }
};
