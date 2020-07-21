const server  = require('../src/index');
const utils   = require('./utils');
const request = require('../src/commons/request');
const nodes   = require('./datasets/configs/100.json').NODES;
const fs      = require('fs');
const path    = require('path');

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
        base : nodes[1].host,
        path : '/file/container/test/1.jpg',
      }, (err, res) => {
        should(err).ok();
        should(res.statusCode).eql(404);
        done();
      });
    });

    it('should get a file with gzip', done => {
      request({
        base : nodes[1].host,
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
        base : nodes[1].host,
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
        base : nodes[1].host,
        path : '/file/container/test/image.jpg',
      }, (err, res) => {
        should(err).not.ok();
        should(res.statusCode).eql(200);
        should(res.headers['cache-control']).be.a.String().and.eql('max-age=7776000,immutable');
        done();
      });
    });

    describe('Inter-node communication', () => {

      it('should get a file not present on current node 101 : [File] 100; 200; 101', done => {
        request({
          base : nodes[0].host,
          path : '/file/container/test/image.jpg',
        }, (err, res) => {
          should(err).not.ok();
          should(res.statusCode).eql(200);

          let pathDir = path.join(__dirname, 'datasets', 'get', 'data_100', '100-200-101');
          fs.access(path.join(pathDir, 'test', 'image.jpg.enc'), (err) => {
            should(err).not.ok();

            utils.deleteFolderRecursive(pathDir);
            done();
          });
        });
      });

      it('should get a file not present on current node 200 : [File] 100; 200; 101', done => {
        request({
          base : nodes[2].host,
          path : '/file/container/test/image.jpg',
        }, (err, res) => {
          should(err).not.ok();
          should(res.statusCode).eql(200);

          let pathDir = path.join(__dirname, 'datasets', 'get', 'data_200', '100-200-101');
          fs.access(path.join(pathDir, 'test', 'image.jpg.enc'), (err) => {
            should(err).not.ok();

            utils.deleteFolderRecursive(pathDir);
            done();
          });
        });
      });

    });

  });

});
