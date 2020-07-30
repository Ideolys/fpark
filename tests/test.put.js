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
const { url } = require('inspector');

describe('API PUT', () => {

  describe('PUT /file/container/:containerId/:id', () => {

    describe('Multi-nodes', () => {

      describe('Document', () => {

        before(done => {
          utils.runArchi('put', done);
        });

        after(done => {
          utils.stopArchi(done);
        });

        it('should not upload a file if no token is provided', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};

          fetch(nodes[1].host + '/file/container/test/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(401);
            done();
          }).catch(err => {
            done(err);
          });
        });

        it('should not upload a file if the token is invalid', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'key_2.pem'));

          fetch(nodes[1].host + '/file/container/test/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(401);
            done();
          }).catch(err => {
            done(err);
          });
        });

        it('should not upload a file to an unregistered container', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'key_2.pem'));

          fetch(nodes[1].host + '/file/container/test_2/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(401);
            done();
          }).catch(err => {
            done(err);
          });
        });

        it('should upload a file & replicate', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[1].host + '/file/container/test/file.txt', {
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

              pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-101-201');
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

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[2].host + '/file/container/test/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-101-201');
            let filename = utils.getFileHash('file.txt', config.HASH_SECRET);
            fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
              should(err).not.ok();

              pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '100-101-201');
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

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[0].host + '/file/container/test/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-101-201');
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

              pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '100-101-201');
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

        before(done => {
          utils.runArchi('put', done);
        });

        after(done => {
          utils.stopArchi(done);
        });

        it('should upload an image & replicate', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'image.jpg')));


          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[1].host + '/file/container/test/image.jpg', {
            method  : 'PUT',
            body    : formData,
            headers
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

        it('should upload an image & compress : jpg', done => {
          let filenameOriginal = 'image.jpg';
          let pathFile         = path.join(__dirname, 'datasets', '_documents', filenameOriginal);

          let formData = new FormData();
          formData.append('file', fs.createReadStream(pathFile));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[1].host + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
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

        it('should upload an image & compress : jpeg', done => {
          let filenameOriginal = 'image.jpeg';
          let pathFile         = path.join(__dirname, 'datasets', '_documents', filenameOriginal);

          let formData = new FormData();
          formData.append('file', fs.createReadStream(pathFile));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[0].host + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-200-201');
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

              pathDir  = path.join(__dirname, 'datasets', 'put', 'data_200', '100-200-201');
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

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[0].host + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-101-201');
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

              pathDir  = path.join(__dirname, 'datasets', 'put', 'data_101', '100-101-201');
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

          let headers = formData.getHeaders();
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[0].host + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_100', '100-200-201');
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

                pathDir  = path.join(__dirname, 'datasets', 'put', 'data_200', '100-200-201');
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

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(nodes[1].host + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
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

      });

      describe('limit', () => {

        it('should not upload a file too large', done => {
          utils.runArchi('put', [
            ['start', '-c', path.join('..', 'configs', '100-file-size.json')]
          ], () => {
            let file     = 'image.jpg';
            let formData = new FormData();
            formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', file)));

            let headers = {};
            utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

            fetch(nodes[0].host + '/file/container/test/' + file, {
              method : 'PUT',
              body   : formData,
              headers
            }).then(res => {
              should(res.status).eql(413);
              utils.stopArchi(done);
            }).catch(err => {
              done(err);
            });
          });
        });

      });

    });

    describe('One node', () => {

      let url = 'http://localhost:' + config.SERVER_PORT;

      describe('Document', () => {

        before(done => {
          utils.runArchi('put', [
            ['start', '-c', path.join('..', 'configs', 'solo.json')]
          ],done);
        });

        after(done => {
          utils.stopArchi(done);
        });

        it('should not upload a file if no token is provided', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};

          fetch(url + '/file/container/test/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(401);
            done();
          }).catch(err => {
            done(err);
          });
        });

        it('should not upload a file if the token is invalid', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'key_2.pem'));

          fetch(url + '/file/container/test/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(401);
            done();
          }).catch(err => {
            done(err);
          });
        });

        it('should not upload a file to an unregistered container', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'key_2.pem'));

          fetch(url + '/file/container/test_2/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(401);
            done();
          }).catch(err => {
            done(err);
          });
        });

        it('should upload a file', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(url + '/file/container/test/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_1');
            let filename = utils.getFileHash('file.txt', config.HASH_SECRET);
            fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
              should(err).not.ok();
              utils.deleteFolderRecursive(pathDir);
              done();
            });
          }).catch(err => {
            done(err);
          });
        });

        it('should upload a file & encrypt', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'file.txt')));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(url + '/file/container/test/file.txt', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_1');
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
              done();
            });
          }).catch(err => {
            done(err);
          });
        });

      });

      describe('Image', () => {

        before(done => {
          utils.runArchi('put', [
            ['start', '-c', path.join('..', 'configs', 'solo.json')]
          ],done);
        });

        after(done => {
          utils.stopArchi(done);
        });

        it('should upload an image & replicate', done => {
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', 'image.jpg')));


          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(url + '/file/container/test/image.jpg', {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_1');
            let filename = utils.getFileHash('image.jpg', config.HASH_SECRET);
            fs.access(path.join(pathDir, 'test', filename + '.enc'), fs.constants.F_OK, err => {
              should(err).not.ok();
              utils.deleteFolderRecursive(pathDir);
              done();
            });
          }).catch(err => {
            done(err);
          });
        });

        it('should upload an image & compress : jpg', done => {
          let filenameOriginal = 'image.jpg';
          let pathFile         = path.join(__dirname, 'datasets', '_documents', filenameOriginal);

          let formData = new FormData();
          formData.append('file', fs.createReadStream(pathFile));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(url + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_1');
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
              done();
            });
          }).catch(err => {
            done(err);
          });
        });

        it('should upload an image & compress : jpeg', done => {
          let filenameOriginal = 'image.jpeg';
          let pathFile         = path.join(__dirname, 'datasets', '_documents', filenameOriginal);

          let formData = new FormData();
          formData.append('file', fs.createReadStream(pathFile));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(url + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_1');
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
              done();
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

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(url + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_1');
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
              done();
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

          let headers = formData.getHeaders();
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(url + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_1');
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
                done();
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

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(url + '/file/container/test/' + filenameOriginal, {
            method  : 'PUT',
            body    : formData,
            headers
          }).then(res => {
            should(res.status).eql(200);

            let pathDir  = path.join(__dirname, 'datasets', 'put', 'data_1');
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
                done();
              }));
            });
          }).catch(err => {
            done(err);
          });
        });

      });

      describe('limit', () => {

        before(done => {
          utils.runArchi('put', [
            ['start', '-c', path.join('..', 'configs', 'solo-file-size.json')]
          ],done);
        });

        after(done => {
          utils.stopArchi(done);
        });

        it('should not upload a file too large', done => {
          utils.runArchi
          let file     = 'image.jpg';
          let formData = new FormData();
          formData.append('file', fs.createReadStream(path.join(__dirname, 'datasets', '_documents', file)));

          let headers = {};
          utils.setJWTHeader(headers, 'test', path.join(__dirname, 'datasets', '_keys', 'test.pem'));

          fetch(url + '/file/container/test/' + file, {
            method : 'PUT',
            body   : formData,
            headers
          }).then(res => {
            should(res.status).eql(413);
            utils.stopArchi(done);
          }).catch(err => {
            done(err);
          });
        });

      });

    });

  });

});
