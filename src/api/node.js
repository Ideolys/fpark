const fs                                          = require('fs');
const path                                        = require('path');
const url                                         = require('url');
const fetch                                       = require('node-fetch');
const stats                                       = require('../stats');
const { respond, queue }                          = require('../commons/utils');
const { setKey }                                  = require('../commons/auth');
const { setHeaderCurrentNode, getHeaderFromNode } = require('../commons/headers');

function nodeRegister (req, res, params, store) {
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
      if (typeof _body.container === 'string' && _body.container.includes('/')) {
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

function nodeStats (req, res) {
  stats.getAll(statistics => {
    if (!statistics) {
      return _formatStatsForJSON(res, statistics);
    }

    let query       = url.parse(req.url).search;
    let queryParams = new URLSearchParams(query);
    let format      = queryParams.get('format');

    if (format === 'json') {
      return _formatStatsForJSON(res, statistics);
    }


    _formatStatsForOpenMetrics(res, statistics);
  });
}

/**
 * Format statistics for open metrics
 * @param {Object} res
 * @param {Array} statistics [{ label : String, description : Object, value : * }]
 */
function _formatStatsForOpenMetrics (res, statistics) {
  let result = '';

  for (let i = 0; i < statistics.length; i++) {
    let description = [];

    for (let key in statistics[i].description) {
      description.push(key + '="' + statistics[i].description[key] + '"');
    }

    result += statistics[i].label + '{' + description.join(',') + '} ' + statistics[i].value + '\n';
  }

  res.setHeader('Content-type', 'text/plain');
  res.write(result);
  respond(res, 200);
}

/**
 * Format statistics for JSON
 * @param {Object} res
 * @param {Array} statistics [{ label : String, description : Object, value : * }]
 */
function _formatStatsForJSON (res, statistics) {
  res.setHeader('Content-type', 'application/json');
  res.write(JSON.stringify(statistics));
  respond(res, 200);
}

module.exports = {
  nodeRegister,
  nodeStats
};
