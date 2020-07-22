const fs       = require('fs');
const path     = require('path');
const fetch    = require('node-fetch');
const utils    = require('./utils');
const config   = require('./datasets/configs/100.json');
const nodes    = config.NODES;
const FormData = require('form-data');

describe('API PUT', () => {

  before(done => {
    utils.runArchi('put', done);
  });

  after(done => {
    utils.stopArchi(done);
  });

  describe('PUT /file/container/:containerId/:id', () => {

    describe('Document', () => {

      it('should upload a file & replicate', done => {
        let formData = new FormData();
        formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

        fetch(nodes[1].host + '/file/container/test/file.txt', {
          method  : 'PUT',
          body    : formData
        }).then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '101-200-201');
          let filename = utils.getFileHash('file.txt', config.HASH_SECRET);
          fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
            should(err).not.ok();
            utils.deleteFolderRecursive(pathDir);

            pathDir  = path.join(__dirname, 'datasets', 'put', 'data_200', '101-200-201');
            fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
              should(err).not.ok();
              utils.deleteFolderRecursive(pathDir);
              done();
            });
          });
        }).catch(err => {
          done(err);
        });
      });

      it('should upload a file to an authorized node if current is not allowed to write', done => {
        let formData = new FormData();
        formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

        fetch(nodes[0].host + '/file/container/test/file.txt', {
          method  : 'PUT',
          body    : formData
        }).then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '101-200-201');
          let filename = utils.getFileHash('file.txt', config.HASH_SECRET);
          fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
            should(err).ok();

            pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '101-200-201');
            fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
              should(err).not.ok();
              utils.deleteFolderRecursive(pathDir);
              done();
            });
          });
        }).catch(err => {
          done(err);
        });
      });

    });


  });

});
