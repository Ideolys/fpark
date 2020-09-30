const fs     = require('fs');
const path   = require('path');
const fetch  = require('node-fetch');
const sharp  = require('sharp');
const utils  = require('./utils');
const config = require('./datasets/configs/100.json');
const nodes  = config.NODES;

describe('API GET', () => {

  describe('multi-nodes', () => {

    before(done => {
      utils.runArchi('get', done);
    });

    after(done => {
      utils.stopArchi(done);
    });

    describe('GET /c/:containerId/f/:id', () => {

      it('should return a 401 if no access_key', done => {
        fetch(nodes[1].host + '/c/test/f/1.jpg').then(res => {
          should(res.status).eql(401);
          done();
        }).catch(e => {
          done(e);
        });
      });

      it('should return a 401 if containerId does not exist', done => {
        fetch(nodes[1].host + '/c/not/f/1.jpg-exist?access_key=secret').then(res => {
          should(res.status).eql(401);
          done();
        }).catch(e => {
          done(e);
        });
      });

      it('should return a 401 if access_key is incorrect', done => {
        fetch(nodes[1].host + '/c/test/f/1.jpg?access_key=secret-falsy').then(res => {
          should(res.status).eql(401);
          done();
        }).catch(e => {
          done(e);
        });
      });

      it('should return a 404 if the file does not exist', done => {
        fetch(nodes[1].host + '/c/test/f/1.jpg?access_key=secret').then(res => {
          should(res.status).eql(404);
          done();
        }).catch(e => {
          done(e);
        });
      });

      it('should get a file with gzip', done => {
        fetch(nodes[1].host + '/c/test/f/image.jpg?access_key=secret').then(res => {
          should(res.status).eql(200);
          should(res.headers.get('content-encoding')).eql('gzip');
          done();
        }).catch(e => {
          done(e);
        })
      });

      it('should set cache-control header', done => {
        fetch(nodes[1].host + '/c/test/f/image.jpg?access_key=secret').then(res => {
          should(res.status).eql(200);
          should(res.headers.get('content-encoding')).eql('gzip');
          done();
        }).catch(e => {
          done(e);
        })
      });

      it('should set cache-control header', done => {
        fetch(nodes[1].host + '/c/test/f/image.jpg?access_key=secret').then(res => {
          should(res.status).eql(200);
          should(res.headers.get('cache-control')).be.a.String().and.eql('max-age=7776000,immutable');
          done();
        }).catch(e => {
          done(e);
        })
      });

      it('should get an image & resize on the fly', done => {
        fetch(nodes[1].host + '/c/test/f/image.jpg?access_key=secret&size=S').then(res => {
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
        fetch(nodes[1].host + '/c/test/f/image.jpg?access_key=secret&size=M').then(res => {
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
          fetch(nodes[0].host + '/c/test/f/image.jpg?access_key=secret').then(res => {
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
          fetch(nodes[2].host + '/c/test/f/image.jpg?access_key=secret').then(res => {
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
          fetch(nodes[3].host + '/c/do-not-delete/f/a.png?access_key=secret2').then(res => {
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

  describe('one node', () => {

    let url = 'http://localhost:' + config.SERVER_PORT;

    before(done => {
      utils.runArchi('get', [
        ['start', '-c', path.join('..', 'configs', 'solo.json')]
      ],done);
    });

    after(done => {
      utils.stopArchi(done);
    });

    describe('GET /file/container/:containerId/:id', () => {

      it('should return a 401 if no access_key', done => {
        fetch(url + '/c/test/f/1.jpg').then(res => {
          should(res.status).eql(401);
          done();
        }).catch(e => {
          done(e);
        });
      });

      it('should return a 401 if containerId does not exist', done => {
        fetch(url + '/c/container/f/1.jpg-test?access_key=secret').then(res => {
          should(res.status).eql(401);
          done();
        }).catch(e => {
          done(e);
        });
      });

      it('should return a 401 if access_key is incorrect', done => {
        fetch(url + '/c/test/f/1.jpg?access_key=test').then(res => {
          should(res.status).eql(401);
          done();
        }).catch(e => {
          done(e);
        });
      });

      it('should return a 404 if the file does not exist', done => {
        fetch(url + '/c/test/f/1.jpg?access_key=secret').then(res => {
          should(res.status).eql(404);
          done();
        }).catch(e => {
          done(e);
        });
      });

      it('should get a file with gzip', done => {
        fetch(url + '/c/test/f/image.jpg?access_key=secret').then(res => {
          should(res.status).eql(200);
          should(res.headers.get('content-encoding')).eql('gzip');
          done();
        }).catch(e => {
          done(e);
        })
      });

      it('should set content-disposition header', done => {
        fetch(url + '/c/test/f/image.jpg?access_key=secret').then(res => {
          should(res.status).eql(200);
          should(res.headers.get('content-disposition')).eql('inline; filename="image.jpg"');
          done();
        }).catch(e => {
          done(e);
        })
      });

      it('should set cache-control header', done => {
        fetch(url + '/c/test/f/image.jpg?access_key=secret').then(res => {
          should(res.status).eql(200);
          should(res.headers.get('cache-control')).be.a.String().and.eql('max-age=7776000,immutable');
          done();
        }).catch(e => {
          done(e);
        })
      });

      it('should get an image & resize on the fly', done => {
        fetch(url + '/c/test/f/image.jpg?access_key=secret&size=S').then(res => {
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
        fetch(url + '/c/test/f/image.jpg?access_key=secret&size=M').then(res => {
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

    });

  });
});
