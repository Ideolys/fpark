const httpProxy = require('http-proxy');
const pump      = require('pump');

module.exports = function factory (onErrorHandler) {
  let proxy = httpProxy.createProxy({});

  proxy.once('error', (err, req, res) => {
    proxy = null;
    return onErrorHandler(err);
  });

  proxy.once('proxyRes', (proxyRes, req, res) => {
    if (proxyRes.statusCode !== 200) {
      return onErrorHandler();
    }

    pump(proxyRes, res);
  });

  return function forward (req, res, options) {
    proxy.web(req, res, options);
  }
};
