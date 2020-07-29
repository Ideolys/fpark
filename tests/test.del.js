const fs     = require('fs');
const path   = require('path');
const fetch  = require('node-fetch');
const should = require('should');
const config = require('./datasets/configs/100.json');
const nodes  = config.NODES;
const { runArchi, stopArchi, deleteFolderRecursive, setJWTHeader, getFileHash } = require('./utils');
const { createDirIfNotExistsSync } = require('../src/commons/utils');

describe('DEL /file/container/:containerId/:id', () => {

  describe('auth', () => {

    before(done => {
      runArchi('put', [
        ['start', '-c', path.join('..', 'configs', '100-file-size.json')]
      ], done);
    });

    after(done => {
      stopArchi(done);
    });

    it('should not be allowed to delete a file if no token is provided', done => {
      fetch(nodes[0].host + '/file/container/test/file.txt', {
        method  : 'DELETE'
      }).then(res => {
        should(res.status).eql(401);
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('should not be allowed to delete a file if the token is invalid for the container', done => {
      let headers = {};
      setJWTHeader(headers, 'test_2', path.join(__dirname, 'datasets', '_keys', 'key_2.pem'));

      fetch(nodes[0].host + '/file/container/test/file.txt', {
        method  : 'DELETE',
        headers
      }).then(res => {
        should(res.status).eql(401);
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('should not be allowed to delete a file if the container does not exist', done => {
      let headers = {};
      setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

      fetch(nodes[0].host + '/file/container/test_2/file.txt', {
        method  : 'DELETE',
        headers
      }).then(res => {
        should(res.status).eql(401);
        done();
      }).catch(err => {
        done(err);
      });
    });
  });

  describe('no nodes down', () => {

    before(done => {
      runArchi('del', done);
    });

    after(done => {
      stopArchi(done);
    });

    let headers = {};
    setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

    it('should not delete a file that does not exist', done => {
      fetch(nodes[0].host + '/file/container/test/a.png', {
        method  : 'DELETE',
        headers
      }).then(res => {
        should(res.status).eql(404);
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('should delete a file on each node', done => {
      let sourcePath = path.join(__dirname, 'datasets', '_documents', 'file.txt');
      let filename   = getFileHash('file.txt', config.HASH_SECRET);

      let filePath101 = path.join(__dirname, 'datasets', 'del', 'data_100','100-101-201', 'test', filename + '.enc');
      let filePath200 = path.join(__dirname, 'datasets', 'del', 'data_101','100-101-201', 'test', filename + '.enc');
      let filePath201 = path.join(__dirname, 'datasets', 'del', 'data_201','100-101-201', 'test', filename + '.enc');

      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_100', '100-101-201'));
      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_101', '100-101-201'));
      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_201', '100-101-201'));

      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_100', '100-101-201','test'));
      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_101', '100-101-201','test'));
      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_201', '100-101-201','test'));

      fs.writeFileSync(filePath101, fs.readFileSync(sourcePath));
      fs.writeFileSync(filePath200, fs.readFileSync(sourcePath));
      fs.writeFileSync(filePath201, fs.readFileSync(sourcePath));

      fetch(nodes[1].host + '/file/container/test/file.txt', {
        method  : 'DELETE',
        headers
      }).then(res => {
        should(res.status).eql(200);

        fs.access(filePath101, fs.constants.F_OK, err => {
          should(err).be.ok();

          fs.access(filePath200, fs.constants.F_OK, err => {
            should(err).be.ok();

            fs.access(filePath201, fs.constants.F_OK, err => {
              should(err).be.ok();
              done();
            });
          });
        });
      }).catch(err => {
        done(err);
      });
    });

    it('should delete a file on each node : current node not owner of file', done => {
      let sourcePath = path.join(__dirname, 'datasets', '_documents', 'file.txt');
      let filename   = getFileHash('file.txt', config.HASH_SECRET);

      let filePath101 = path.join(__dirname, 'datasets', 'del', 'data_100','100-101-201', 'test', filename + '.enc');
      let filePath200 = path.join(__dirname, 'datasets', 'del', 'data_101','100-101-201', 'test', filename + '.enc');
      let filePath201 = path.join(__dirname, 'datasets', 'del', 'data_201','100-101-201', 'test', filename + '.enc');

      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_100', '100-101-201'));
      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_101', '100-101-201'));
      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_201', '100-101-201'));

      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_100', '100-101-201','test'));
      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_101', '100-101-201','test'));
      createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_201', '100-101-201','test'));

      fs.writeFileSync(filePath101, fs.readFileSync(sourcePath));
      fs.writeFileSync(filePath200, fs.readFileSync(sourcePath));
      fs.writeFileSync(filePath201, fs.readFileSync(sourcePath));

      fetch(nodes[0].host + '/file/container/test/file.txt', {
        method  : 'DELETE',
        headers
      }).then(res => {
        should(res.status).eql(200);

        fs.access(filePath101, fs.constants.F_OK, err => {
          should(err).be.ok();

          fs.access(filePath200, fs.constants.F_OK, err => {
            should(err).be.ok();

            fs.access(filePath201, fs.constants.F_OK, err => {
              should(err).be.ok();
              done();
            });
          });
        });
      }).catch(err => {
        done(err);
      });
    });
  });

  describe('nodes down', () => {

    let headers = {};
    setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

    it('should delete what the nodes can', done => {
      runArchi('del', [
          ['start', '-c', path.join('..', 'configs', '101.json')]
        , ['start', '-c', path.join('..', 'configs', '201.json')]
      ], () => {
        let sourcePath = path.join(__dirname, 'datasets', '_documents', 'file.txt');
        let filename   = getFileHash('file.txt', config.HASH_SECRET);

        let filePath101 = path.join(__dirname, 'datasets', 'del', 'data_101','100-101-201', 'test', filename + '.enc');
        let filePath201 = path.join(__dirname, 'datasets', 'del', 'data_201','100-101-201', 'test', filename + '.enc');

        createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_101', '100-101-201'));
        createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_201', '100-101-201'));

        createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_101', '100-101-201','test'));
        createDirIfNotExistsSync(path.join(__dirname, 'datasets', 'del', 'data_201', '100-101-201','test'));

        fs.writeFileSync(filePath101, fs.readFileSync(sourcePath));
        fs.writeFileSync(filePath201, fs.readFileSync(sourcePath));

        fetch(nodes[1].host + '/file/container/test/file.txt', {
          method  : 'DELETE',
          headers
        }).then(res => {
          should(res.status).eql(500);

          fs.access(filePath101, fs.constants.F_OK, err => {
            should(err).be.ok();

            fs.access(filePath201, fs.constants.F_OK, err => {
              should(err).be.ok();
              stopArchi(done);
            });
          });
        }).catch(err => {
          done(err);
        });
      });
    });

  });

});
