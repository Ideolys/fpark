const fs          = require('fs');
const path        = require('path');
const { respond } = require('../commons/utils');
const { setKey } = require('../commons/auth');

module.exports = function nodRegister (req, res, params, store) {
  if (req.headers['content-type'] !== 'application/json') {
    return respond(res, 400);
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      let _body = JSON.parse(body);

      if (!_body) {
        return  respond(res, 400);
      }

      if (!_body.containerId || !_body.key) {
        return respond(res, 400);
      }

      fs.writeFile(path.join(store.CONFIG.KEYS_DIRECTORY, _body.containerId + '.pub'), _body.key, { flag : 'wx' }, (err) => {
        if (err) {
          console.log(err);
          return respond(res, 500);
        }

        setKey(_body.containerId, _body.key);
        respond(res, 200);
      });
    }
    catch (e) {
      return respond(res, 500);
    }
  });
}
