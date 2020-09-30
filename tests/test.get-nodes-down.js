const utils  = require('./utils');
const fetch  = require('node-fetch');
const fs     = require('fs');
const path   = require('path');
const config = require('./datasets/configs/100.json');
const nodes  = config.NODES;

describe('API GET : nodes down', () => {

  describe('GET /c/:containerId/f/:id with nodes down', () => {

    it('should return a 404 if the file does not exist', done => {
      utils.runArchi('get', [
          ['start', '-c', path.join('..', 'configs', '100.json')]
        , ['start', '-c', path.join('..', 'configs', '101.json')]
      ], () => {
        fetch(nodes[1].host + '/c/test/f/1.jpg?access_key=secret').then(res => {
          should(res.status).eql(404);
          utils.stopArchi(done);
        }).catch(e => {
          done(e);
        })
      });
    });

    it('should get a file not present on current node 100 : 100; 200; [File] 101 || node 200 down', function (done) {
      this.timeout(2500);

      utils.runArchi('get', [
          ['start', '-c', path.join('..', 'configs', '100.json')]
        , ['start', '-c', path.join('..', 'configs', '101.json')]
        , ['start', '-c', path.join('..', 'configs', '201.json')]
      ], () => {
        fetch(nodes[0].host + '/c/test/f/image.jpg?access_key=secret').then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'get', 'data_100', '100-101-200', 'test');
          let filename = utils.getFileHash('image.jpg', config.HASH_SECRET);
          fs.access(path.join(pathDir, filename + '.enc'), (err) => {
            should(err).not.ok();

            utils.deleteFolderRecursive(pathDir);
            utils.stopArchi(done);
          });
        }).catch(e => {
          done(e);
        })
      });
    });

    it('should get a file not present on current node 200 : 100; 200; [File] 101 || 100 down', function (done) {
      this.timeout(2500);

      utils.runArchi('get', [
          ['start', '-c', path.join('..', 'configs', '101.json')]
        , ['start', '-c', path.join('..', 'configs', '200.json')]
        , ['start', '-c', path.join('..', 'configs', '201.json')]
      ], () => {

        fetch(nodes[2].host + '/c/test/f/image.jpg?access_key=secret').then(res => {
          should(res.status).eql(200);

          let pathDir = path.join(__dirname, 'datasets', 'get', 'data_200', '100-101-200', 'test');
          let filename = utils.getFileHash('image.jpg', config.HASH_SECRET);
          fs.access(path.join(pathDir, filename + '.enc'), (err) => {
            should(err).not.ok();

            utils.deleteFolderRecursive(pathDir);
            utils.stopArchi(done);
          });
        }).catch(e => {
          done(e);
        })
      });
    });

    // @todo unskip test when proxy rerun will be set
    it.skip('should get a file not present on current node 201 (not authorized) : 100; 200; [File] 101 || 100 down', function (done) {
      this.timeout(2500);

      utils.runArchi('get', [
          ['start', '-c', path.join('..', 'configs', '101.json')]
        , ['start', '-c', path.join('..', 'configs', '200.json')]
        , ['start', '-c', path.join('..', 'configs', '201.json')]
      ], () => {

        request({
          base : nodes[3].host,
          path : '/file/container/test/a.png',
        }, (err, res) => {
          should(err).not.ok();
          should(res.statusCode).eql(200);

          let pathDir = path.join(__dirname, 'datasets', 'get', 'data_201', '100-101-200');
          let filename = utils.getFileHash('a.png', config.HASH_SECRET);
          fs.access(path.join(pathDir, 'test', filename + '.enc'), (err) => {
            should(err).ok();

            utils.stopArchi(done);
          });
        });
      });
    });

  });

});
