const fs                                          = require('fs');
const path                                        = require('path');
const fetch                                       = require('node-fetch');
const { respond, queue }                          = require('../commons/utils');
const { setKey }                                  = require('../commons/auth');
const { setHeaderCurrentNode, getHeaderFromNode } = require('../commons/headers');

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

      if (!_body.container || !_body.key || !_body.accessKey) {
        return respond(res, 400);
      }

      let _filename = _body.container;
      if (typeof _body.container === 'string') {
        console.log('Container cannot contain char "/"');
        return respond(res, 500);
      }

      fs.writeFile(path.join(store.CONFIG.KEYS_DIRECTORY, _filename + '.pub'), _body.key, { flag : 'wx' }, (err) => {
        if (err) {
          if (err.code === 'EEXIST') {
            return respond(res, 200);
          }

          return respond(res, 500);
        }

        fs.writeFile(path.join(store.CONFIG.KEYS_DIRECTORY, _filename + '.access_key'), _body.accessKey, { flag : 'wx' }, (err) => {
          if (err) {
            return respond(res, 500);
          }

          setKey(_filename, _body.key);

          if (getHeaderFromNode(req.headers)) {
            return respond(res, 200);
          }

          queue(store.CONFIG.NODES, (node, next) => {
            if (node.id === store.CONFIG.ID) {
              return next();
            }

            let headers = {
              'Content-Type' : 'application/json'
            };
            setHeaderCurrentNode(headers);

            let _req =  {
              method : 'POST',
              headers,
              body
            };

            fetch(node.host + req.url, _req).then((resRequest) => {
              if (resRequest.status !== 200) {
                return respond(res, 500);
              }

              next();
            }).catch(() => {
              return respond(res, 500);
            });
          }, () => {
            // No file has been found
            respond(res, 200);
          });
        });
      });
    }
    catch (e) {
      return respond(res, 500);
    }
  });
}
