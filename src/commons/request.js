const url = require('url');

/**
 * Make an HTTP request
 * @param {Object} options {
 *   base    : String, // host ex: http:localhost:3000
 *   method  : String,
 *   path    : String,
 *   headers : Object,
 *   ...
 * }
 * @param {Function} callback
 */
module.exports = function request (options, callback) {
  let httpLibrary = options.base.startsWith('https') ? require('https') : require('http');
  let parsedUrl   = url.parse(options.base);

  options.host = parsedUrl.hostname;
  options.port = parsedUrl.port;

  let request = httpLibrary.request(options, res => {
    if (res.statusCode !== 200) {
      return callback(res.statusCode, res);
    }

    callback(null, res);
  });

  request.on('error', err => {
    callback(err);
  });

  request.end();
}
