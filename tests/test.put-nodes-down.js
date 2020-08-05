const fs       = require('fs');
const path     = require('path');
const fetch    = require('node-fetch');
const utils    = require('./utils');
const config   = require('./datasets/configs/100.json');
const nodes    = config.NODES;
const FormData = require('form-data');

describe('API PUT - nodes down', () => {

  describe('PUT /file/:id/container/:containerId', () => {

    describe('Document', () => {

      it('should upload a file & replicate : 200 down', done => {
        utils.runArchi('put', [
            ['start', '-c', path.join('..', 'configs', '101.json')]
          , ['start', '-c', path.join('..', 'configs', '201.json')]
        ], () => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[1].host + '/file/file.txt/container/test', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '100-101-201');
            let filename = utils.getFileHash('file.txt', config.HASH_SECRET);
            fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
              should(err).not.ok();
              utils.deleteFolderRecursive(pathDir);

              pathDir  = path.join(__dirname, 'datasets', 'put', 'data_201', '100-101-201');
              fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
                should(err).not.ok();

                utils.deleteFolderRecursive(pathDir);
                utils.stopArchi(done);
              });
            });
          }).catch(err => {
            done(err);
          });
        });
      });

      /**
       * @todo unskip test when proxy rereun will be set
       */
      it.skip('should upload a file to an authorized node if current is not allowed to write : 101 & 201 down', function (done) {
        this.timeout(2500);

        utils.runArchi('put', [
            ['start', '-c', path.join('..', 'configs', '100.json')]
          , ['start', '-c', path.join('..', 'configs', '200.json')]
        ], () => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          fetch(nodes[0].host + '/file/file.txt/container/test', {
            method  : 'PUT',
            body    : formData
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '101-200-201');
            let filename = utils.getFileHash('file.txt', config.HASH_SECRET);
            fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
              should(err).ok();

              pathDir  = path.join(__dirname, 'datasets', 'put', 'data_200', '101-200-201');
              fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
                should(err).not.ok();

                utils.deleteFolderRecursive(pathDir);
                utils.stopArchi(done);
              });
            });
          }).catch(err => {
            done(err);
          });
        });
      });

    });


  });

});
