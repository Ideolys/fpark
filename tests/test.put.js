const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const fetch    = require('node-fetch');
const FormData = require('form-data');
const sharp    = require('sharp');
const utils    = require('./utils');
const config   = require('./datasets/configs/100.json');
const nodes    = config.NODES;
const file     = require('../src/commons/file');

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

      it('should upload a file & encrypt', done => {
        let formData = new FormData();
        formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

        fetch(nodes[1].host + '/file/container/test/file.txt', {
          method  : 'PUT',
          body    : formData
        }).then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '101-200-201');
          let filename = utils.getFileHash('file.txt', config.HASH_SECRET);
          let filePath = path.join(pathDir, 'test', filename + '.enc');
          fs.access(filePath, fs.constants.F_OK, err => {
            should(err).not.ok();

            let filenameEncrypt = file.getFileName('file.txt', config.ENCRYPTION_IV_LENGTH);
            let cipher          = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);
            let fileData        = fs.readFileSync(filePath);

            should(fileData).not.eql('test\n');

            let decrypted = cipher.update(fileData);
            decrypted    += cipher.final();

            should(decrypted).eql('test\n');
            utils.deleteFolderRecursive(pathDir);

            pathDir  = path.join(__dirname, 'datasets', 'put', 'data_200', '101-200-201');
            filePath = path.join(pathDir, 'test', filename + '.enc');
            fs.access(filePath, fs.constants.F_OK, err => {
              should(err).not.ok();

              filenameEncrypt = file.getFileName('file.txt', config.ENCRYPTION_IV_LENGTH);
              cipher          = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);
              fileData        = fs.readFileSync(filePath);

              should(fileData).not.eql('test\n');

              decrypted = cipher.update(fileData);
              decrypted += cipher.final();

              should(decrypted).eql('test\n');

              utils.deleteFolderRecursive(pathDir);
              done();
            });
          });
        }).catch(err => {
          done(err);
        });
      });

    });

    describe('Image', () => {

      it('should upload an image & replicate', done => {
        let formData = new FormData();
        formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'image.jpg')));

        fetch(nodes[1].host + '/file/container/test/image.jpg', {
          method  : 'PUT',
          body    : formData
        }).then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '100-101-200');
          let filename = utils.getFileHash('image.jpg', config.HASH_SECRET);
          fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
            should(err).not.ok();
            utils.deleteFolderRecursive(pathDir);

            pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-101-200');
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

      it('should upload an image & compress : jpeg', done => {
        let filenameOriginal = 'image.jpg';
        let pathFile         = path.join(__dirname, 'datasets', '_documents', filenameOriginal);

        let formData = new FormData();
        formData.append('file', fs.createReadStream(pathFile));

        fetch(nodes[1].host + '/file/container/test/' + filenameOriginal, {
          method  : 'PUT',
          body    : formData
        }).then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '100-101-200');
          let filename = utils.getFileHash(filenameOriginal, config.HASH_SECRET);
          let filePath = path.join(pathDir, 'test', filename + '.enc');
          fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
            should(err).not.ok();

            let filenameEncrypt  = file.getFileName(filenameOriginal, config.ENCRYPTION_IV_LENGTH);
            let cipher           = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);
            let fileData         = fs.readFileSync(filePath);
            let originalFileData = fs.readFileSync(pathFile);

            let decrypted = cipher.update(fileData);
            decrypted    += cipher.final();

            should(decrypted.length).lessThan(originalFileData.length);

            utils.deleteFolderRecursive(pathDir);

            pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-101-200');
            filePath = path.join(pathDir, 'test', filename + '.enc');
            fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
              should(err).not.ok();

              filenameEncrypt  = file.getFileName(filenameOriginal, config.ENCRYPTION_IV_LENGTH);
              cipher           = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);
              fileData         = fs.readFileSync(filePath);

              decrypted = cipher.update(fileData);
              decrypted += cipher.final();

              should(decrypted.length).lessThan(originalFileData.length);

              utils.deleteFolderRecursive(pathDir);
              done();
            });
          });
        }).catch(err => {
          done(err);
        });
      });

      it('should upload an image & compress : webp', done => {
        let filenameOriginal = 'image.webp';
        let pathFile         = path.join(__dirname, 'datasets', '_documents', filenameOriginal);

        let formData = new FormData();
        formData.append('file', fs.createReadStream(pathFile));

        fetch(nodes[1].host + '/file/container/test/' + filenameOriginal, {
          method  : 'PUT',
          body    : formData
        }).then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '101-200-201');
          let filename = utils.getFileHash(filenameOriginal, config.HASH_SECRET);
          let filePath = path.join(pathDir, 'test', filename + '.enc');
          fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
            should(err).not.ok();

            let filenameEncrypt  = file.getFileName(filenameOriginal, config.ENCRYPTION_IV_LENGTH);
            let cipher           = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);
            let fileData         = fs.readFileSync(filePath);
            let originalFileData = fs.readFileSync(pathFile);

            let decrypted = cipher.update(fileData);
            decrypted    += cipher.final();

            should(decrypted.length).lessThan(originalFileData.length);

            utils.deleteFolderRecursive(pathDir);

            pathDir  = path.join(__dirname, 'datasets', 'put', 'data_200', '101-200-201');
            filePath = path.join(pathDir, 'test', filename + '.enc');
            fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
              should(err).not.ok();

              filenameEncrypt  = file.getFileName(filenameOriginal, config.ENCRYPTION_IV_LENGTH);
              cipher           = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);
              fileData         = fs.readFileSync(filePath);

              decrypted = cipher.update(fileData);
              decrypted += cipher.final();

              should(decrypted.length).lessThan(originalFileData.length);

              utils.deleteFolderRecursive(pathDir);
              done();
            });
          });
        }).catch(err => {
          done(err);
        });
      });

      it('should upload an image & resize if too large', done => {
        let filenameOriginal = 'image_large.jpeg';
        let pathFile         = path.join(__dirname, 'datasets', '_documents', filenameOriginal);

        let formData = new FormData();
        formData.append('file', fs.createReadStream(pathFile));

        fetch(nodes[1].host + '/file/container/test/' + filenameOriginal, {
          method  : 'PUT',
          body    : formData
        }).then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '100-101-200');
          let filename = utils.getFileHash(filenameOriginal, config.HASH_SECRET);
          let filePath = path.join(pathDir, 'test', filename + '.enc');
          fs.access(filePath, fs.constants.F_OK, err => {
            should(err).not.ok();

            let filenameEncrypt = file.getFileName(filenameOriginal, config.ENCRYPTION_IV_LENGTH);
            let cipher          = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);

            fs.createReadStream(filePath).pipe(cipher).pipe(sharp().metadata((err, metadata) => {
              should(err).not.ok();
              should(metadata.width).eql(config.IMAGE_SIZE_DEFAULT_WIDTH);

              utils.deleteFolderRecursive(pathDir);

              pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-101-200');
              filePath = path.join(pathDir, 'test', filename + '.enc');
              fs.access(filePath, fs.constants.F_OK, err => {
                should(err).not.ok();

                filenameEncrypt  = file.getFileName(filenameOriginal, config.ENCRYPTION_IV_LENGTH);
                cipher           = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);

                fs.createReadStream(filePath).pipe(cipher).pipe(sharp().metadata((err, metadata) => {
                  should(err).not.ok();
                  should(metadata.width).eql(config.IMAGE_SIZE_DEFAULT_WIDTH);

                  utils.deleteFolderRecursive(pathDir);
                  done();
                }));
              });
            }));
          });
        }).catch(err => {
          done(err);
        });
      });

      it('should upload an image & not resize if image is < to default max size', done => {
        let filenameOriginal = 'image.jpg';
        let pathFile         = path.join(__dirname, 'datasets', '_documents', filenameOriginal);

        let formData = new FormData();
        formData.append('file', fs.createReadStream(pathFile));

        fetch(nodes[1].host + '/file/container/test/' + filenameOriginal, {
          method  : 'PUT',
          body    : formData
        }).then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '100-101-200');
          let filename = utils.getFileHash(filenameOriginal, config.HASH_SECRET);
          let filePath = path.join(pathDir, 'test', filename + '.enc');
          fs.access(filePath, fs.constants.F_OK, err => {
            should(err).not.ok();

            let filenameEncrypt = file.getFileName(filenameOriginal, config.ENCRYPTION_IV_LENGTH);
            let cipher          = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);

            fs.createReadStream(filePath).pipe(cipher).pipe(sharp().metadata((err, metadata) => {
              should(err).not.ok();
              should(metadata.width).lessThan(config.IMAGE_SIZE_DEFAULT_WIDTH);

              utils.deleteFolderRecursive(pathDir);

              pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-101-200');
              filePath = path.join(pathDir, 'test', filename + '.enc');
              fs.access(filePath, fs.constants.F_OK, err => {
                should(err).not.ok();

                filenameEncrypt  = file.getFileName(filenameOriginal, config.ENCRYPTION_IV_LENGTH);
                cipher           = crypto.createDecipheriv(config.ENCRYPTION_ALGORITHM, filenameEncrypt, config.ENCRYPTION_IV);

                fs.createReadStream(filePath).pipe(cipher).pipe(sharp().metadata((err, metadata) => {
                  should(err).not.ok();
                  should(metadata.width).lessThan(config.IMAGE_SIZE_DEFAULT_WIDTH);

                  utils.deleteFolderRecursive(pathDir);
                  done();
                }));
              });
            }));
          });
        }).catch(err => {
          done(err);
        });
      });

    })

  });

});
