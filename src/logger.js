const crypto       = require('crypto');
const kittenLogger = require('kitten-logger');
const stats        = require('./stats');

kittenLogger.addFormatter('http:start', kittenLogger.formattersCollection.http_start);
kittenLogger.addFormatter('http:end'  , kittenLogger.formattersCollection.http_end);

const loggerStart  = kittenLogger.createPersistentLogger('http:start');
const loggerEnd    = kittenLogger.createPersistentLogger('http:end');

const uidReference   = (new Date(2021, 0, 1)).getTime();
let uidPrevTimestamp = null;

/**
 * Generate an integer unique id
 * Be careful, this is unique only for this process id. Another process could generate the same number at the same time.
 * It can generate 10000 unique id per ms maximum.
 * It is a combination of a timestamp and a counter. The counter is used only if uid() is called within the same millisecond.
 * The timestamp start at on 2021-01-01 instead of 1970 to avoid Number overflow.
 * An JS number is represented by a double-precision float (2^53 bit max).
 * @return {Integer} Unique id
 */
function uid (){
  var _now = (Date.now() - uidReference) * 10000;
  if(_now !== uidPrevTimestamp){
    uidCounter = 0;
  }
  if(uidCounter >= 10000){
    throw new Error('helper: uid() does not generate a unique id');
  }
  uidPrevTimestamp = _now;
  return _now + uidCounter++;
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
  req.log_id    = uid();

  loggerStart.info(getMessageForReq(req), { idKittenLogger : req.log_id });

  res.on('finish', () => {
    loggerEnd.info(getMessageForRes(req, res), { idKittenLogger : req.log_id });
  });
};
