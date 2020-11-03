const crypto       = require('crypto');
const kittenLogger = require('kitten-logger');
const stats        = require('./stats');

kittenLogger.addFormatter('http:start', kittenLogger.formattersCollection.http_start);
kittenLogger.addFormatter('http:end'  , kittenLogger.formattersCollection.http_end);

const loggerStart  = kittenLogger.createPersistentLogger('http:start');
const loggerEnd    = kittenLogger.createPersistentLogger('http:end');

/**
 * Get random 32 bits integer
 */
function randU32() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

function getMessageForReq (req) {

  let url = req.url.split('/f/');

  if (url.length > 1) {
    url = url[0] + '/f/*';
  }
  else {
    url = url[0];
  }

  return {
    url,
    method  : req.method,
    ip      : req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip
  };
}

function getMessageForRes (req, res) {
  let result = {
    time   : process.hrtime(req.log_start)[1] / 1000000, //ms
    status : res.statusCode
  };

  if (req.counters) {
    req.counters.forEach(counter => {
      stats.update({
        counterId    : counter,
        subCounterId : result.status,
        value        : result.time
      });
    });
  }

  return result;
}

/**
 * Log HTTP requests
 * @param {Object} req
 * @param {Object} res
 * @returns {Function}
 */
module.exports = function logHTTP (req, res) {
  req.log_start = process.hrtime();
  req.log_id    = randU32();

  loggerStart.info(getMessageForReq(req), { idKittenLogger : req.log_id });

  res.on('finish', () => {
    loggerEnd.info(getMessageForRes(req, res), { idKittenLogger : req.log_id });
  });
};
