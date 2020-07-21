const server  = require('../src/index');
const utils   = require('./utils');
const request = require('../src/commons/request');
const node    = require('./datasets/configs/100.json').NODES[0];

describe.only('API GET', () => {

  before(done => {
    utils.runArchi('get', done);
  });

  after(done => {
    utils.stopArchi(done);
  });

  describe('GET /file/container/:containerId/:id', () => {

    it('should return a 404 if the file does not exist', done => {
      request({
        base : node.host,
        path : '/file/container/test/image.jpg',
      }, (err, res) => {
        should(err).ok();
        should(res.statusCode).eql(404);
        done();
      });
    });

  });

});
