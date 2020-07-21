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
        path : '/file/container/test/1.jpg',
      }, (err, res) => {
        should(err).ok();
        should(res.statusCode).eql(404);
        done();
      });
    });

    it('should get a file with gzip', done => {
      request({
        base : node.host,
        path : '/file/container/test/image.jpg',
      }, (err, res) => {
        should(err).not.ok();
        should(res.statusCode).eql(200);
        should(res.headers['content-encoding']).eql('gzip');
        done();
      });
    });

    it('should set cache-control header', done => {
      request({
        base : node.host,
        path : '/file/container/test/image.jpg',
      }, (err, res) => {
        should(err).not.ok();
        should(res.statusCode).eql(200);
        should(res.headers['content-encoding']).eql('gzip');
        done();
      });
    });

    it('should set cache-control header', done => {
      request({
        base : node.host,
        path : '/file/container/test/image.jpg',
      }, (err, res) => {
        should(err).not.ok();
        should(res.statusCode).eql(200);
        should(res.headers['cache-control']).be.a.String().and.eql('max-age=7776000,immutable');
        utils.stopExecute(done);
      });
    });

  });

});
