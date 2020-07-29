const fs     = require('fs');
const path   = require('path');
const fetch  = require('node-fetch');
const sharp  = require('sharp');
const utils  = require('./utils');
const config = require('./datasets/configs/100.json');
const nodes  = config.NODES;

describe('API GET', () => {

  before(done => {
    utils.runArchi('get', done);
  });

  after(done => {
    utils.stopArchi(done);
  });

  describe('GET /file/container/:containerId/:id', () => {

    it('should return a 404 if the file does not exist', done => {
      fetch(nodes[1].host + '/file/container/test/1.jpg').then(res => {
        should(res.status).eql(404);
        done();
      }).catch(e => {
        done(e);
      });
    });

    it('should get a file with gzip', done => {
      fetch(nodes[1].host + '/file/container/test/image.jpg').then(res => {
        should(res.status).eql(200);
        should(res.headers.get('content-encoding')).eql('gzip');
        done();
      }).catch(e => {
        done(e);
      })
    });

    it('should set cache-control header', done => {
      fetch(nodes[1].host + '/file/container/test/image.jpg').then(res => {
        should(res.status).eql(200);
        should(res.headers.get('content-encoding')).eql('gzip');
        done();
      }).catch(e => {
        done(e);
      })
    });

    it('should set cache-control header', done => {
      fetch(nodes[1].host + '/file/container/test/image.jpg').then(res => {
        should(res.status).eql(200);
        should(res.headers.get('cache-control')).be.a.String().and.eql('max-age=7776000,immutable');
        done();
      }).catch(e => {
        done(e);
      })
    });

    it('should get an image & resize on the fly', done => {
      fetch(nodes[1].host + '/file/container/test/image.jpg?size=S').then(res => {
        should(res.status).eql(200);
        res.body.pipe(sharp().metadata((err, metadata) => {
            should(err).not.ok();
            should(metadata.width).eql(120);
            should(metadata.height).eql(80);
            done();
          })
        );
      }).catch(e => {
        done(e);
      })
    });

    it('should get an image & not resize on the fly if the size is not specified', done => {
      fetch(nodes[1].host + '/file/container/test/image.jpg?size=M').then(res => {
        should(res.status).eql(200);
        res.body.pipe(sharp().metadata((err, metadata) => {
            should(err).not.ok();
            should(metadata.width).eql(1100);
            should(metadata.height).eql(715);
            done();
          })
        );
      }).catch(e => {
        done(e);
      })
    });

    describe('Inter-node communication', () => {

      it('should get a file not present on current node 100 : 100; 200; [File] 101', done => {
        fetch(nodes[0].host + '/file/container/test/image.jpg').then(res => {
          should(res.status).eql(200);

          let pathDir  = path.join(__dirname, 'datasets', 'get', 'data_100', '100-101-200', 'test');
          let filename = utils.getFileHash('image.jpg', config.HASH_SECRET);
          fs.access(path.join(pathDir, filename + '.enc'), (err) => {
            should(err).not.ok();

            utils.deleteFolderRecursive(pathDir);
            done();
          });
        }).catch(e => {
          done(e);
        })
      });

      it('should get a file not present on current node 200 : 100; 200; [File] 101', done => {
        fetch(nodes[2].host + '/file/container/test/image.jpg').then(res => {
          should(res.status).eql(200);

          let pathDir = path.join(__dirname, 'datasets', 'get', 'data_200', '100-101-200', 'test');
          let filename = utils.getFileHash('image.jpg', config.HASH_SECRET);
          fs.access(path.join(pathDir, filename + '.enc'), (err) => {
            should(err).not.ok();

            utils.deleteFolderRecursive(pathDir);
            done();
          });
        }).catch(e => {
          done(e);
        })
      });

      it('should get a file from another node and not save it to the disk (not authorized)', function (done) {
        fetch(nodes[3].host + '/file/container/do-not-delete/a.png').then(res => {
          should(res.status).eql(200);

          let pathDir = path.join(__dirname, 'datasets', 'get', 'data_201', '100-101-200');
          let filename = utils.getFileHash('a.png', config.HASH_SECRET);
          fs.access(path.join(pathDir, 'do-not-delete', filename + '.enc'), (err) => {
            should(err).ok();
            done();
          });
        }).catch(e => {
          done(e);
        })
      });

    });

  });

});
