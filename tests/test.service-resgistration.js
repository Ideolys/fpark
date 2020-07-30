const fs     = require('fs');
const path   = require('path');
const fetch  = require('node-fetch');
const should = require('should');
const config = require('./datasets/configs/100.json');
const { runArchi, stopArchi, deleteFolderRecursive } = require('./utils');

let url      = config.NODES[0].host + '/node/register';
let filePath = path.join(__dirname, 'datasets', 'service-registration', 'keys_100', '123456789.pub');

describe('Service registration', () => {

  it('should not register a node if registration si disabled', done => {
    runArchi('service-registration', [
      ['start', '-c', path.join('..', 'configs', '100-no-service-registration.json')]
    ], () => {
      fetch(url, {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
          container : 123456789,
          key       : '/* MY PUBLIC KEY */'
        })
      }).then(res => {
        should(res.status).eql(404);
        done();
      }).catch(e => {
        done(e);
      });
    });
  });

  describe('one node', () => {

    beforeEach(() => {
      deleteFolderRecursive(path.join(__dirname, 'datasets', 'service-registration', 'keys_100'));
      fs.mkdirSync(path.join(__dirname, 'datasets', 'service-registration', 'keys_100'));
    });

    before(done => {
      runArchi('service-registration', [['start', '-c', path.join('..', 'configs', '100-service-registration-one-node.json')]], done);
    });

    after(done => {
      stopArchi(done);
    });

    it('should register the service', done => {
      fetch(url, {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
          container : 123456789,
          key       : '/* MY PUBLIC KEY */'
        })
      }).then(res => {
        should(res.status).eql(200);
        fs.readFile(filePath, (err, file) => {
          should(err).not.ok();
          should(file.toString()).eql('/* MY PUBLIC KEY */');
          done();
        })
      }).catch(e => {
        done(e);
      });
    });

    it('should register the service if the key already exist', done => {
      fetch(url, {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
          container : 123456789,
          key       : '/* MY PUBLIC KEY */'
        })
      }).then(res => {
        should(res.status).eql(200);
        fs.readFile(filePath, (err, file) => {
          should(err).not.ok();
          should(file.toString()).eql('/* MY PUBLIC KEY */');

          fetch(url, {
            method  : 'POST',
            headers : {
              'Content-Type' : 'application/json'
            },
            body : JSON.stringify({
              container : 123456789,
              key       : '/* MY PUBLIC KEY */'
            })
          }).then(res => {
            should(res.status).eql(200);
            done();
          }).catch(e => {
            done(e);
          });

        })
      }).catch(e => {
        done(e);
      });
    });

    it('should not register the service if it is not json : no header', done => {
      fetch(url, {
        method  : 'POST',
        body : JSON.stringify({
          container : 123456789,
          key       : '/* MY PUBLIC KEY */'
        })
      }).then(res => {
        should(res.status).eql(400);
        fs.access(filePath, (err) => {
          should(err).ok();
          done();
        });
      }).catch(e => {
        done(e);
      })
    });

    it('should not register the service if it is not json : not json in body', done => {
      fetch(url, {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        },
        body : 'test'
      }).then(res => {
          should(res.status).eql(500);
          fs.access(filePath, (err) => {
            should(err).ok();
            done();
          });
      }).catch(e => {
        done(e);
      })
    });

    it('should not register the service if there is no body', done => {
      fetch(url, {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        }
      }).then(res => {
        should(res.status).eql(500);
        fs.access(filePath, (err) => {
          should(err).ok();
          done();
        });
      }).catch(e => {
        done(e);
      });
    });

    it('should not register the service if the body has not container', done => {
      fetch(url, {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
          key         : '/* MY PUBLIC KEY */'
        })
      }).then(res => {
        should(res.status).eql(400);
        fs.access(filePath, (err) => {
          should(err).ok();
          done();
        });
      }).catch(e => {
        done(e);
      })
    });

    it('should not register the service if the body has not key', done => {
      fetch(url, {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        },
          body : JSON.stringify({
            container : 123456789
          })
        }).then(res => {
          should(res.status).eql(400);
          fs.access(filePath, (err) => {
            should(err).ok();
            done();
          });
      }).catch(e => {
        done(e);
      })
    });

  });

  describe('multiple nodes', () => {

    it('should register the service on each nodes', done => {
      deleteFolderRecursive(path.join(__dirname, 'datasets', 'service-registration', 'keys_100'));
      deleteFolderRecursive(path.join(__dirname, 'datasets', 'service-registration', 'keys_101'));

      runArchi('service-registration', [
        ['start', '-c', path.join('..', 'configs', '100-service-registration.json')],
        ['start', '-c', path.join('..', 'configs', '101-service-registration.json')]
      ], () => {
        fetch(url, {
          method  : 'POST',
          headers : {
            'Content-Type' : 'application/json'
          },
          body : JSON.stringify({
            container : 123456789,
            key       : '/* MY PUBLIC KEY */'
          })
        }).then(res => {
          should(res.status).eql(200);

          let filePath100 = path.join(__dirname, 'datasets', 'service-registration', 'keys_100', '123456789.pub');
          let filePath101 = path.join(__dirname, 'datasets', 'service-registration', 'keys_101', '123456789.pub');

          fs.readFile(filePath100, (err, file) => {
            should(err).not.ok();
            should(file.toString()).eql('/* MY PUBLIC KEY */');

            deleteFolderRecursive(path.join(__dirname, 'datasets', 'service-registration', 'keys_100'));

            fs.readFile(filePath101, (err, file) => {
              should(err).not.ok();
              should(file.toString()).eql('/* MY PUBLIC KEY */');

              deleteFolderRecursive(path.join(__dirname, 'datasets', 'service-registration', 'keys_101'));
              stopArchi(done);
            });
          });
        }).catch(e => {
          done(e);
        });
      });
    });

    it('should fail if a node is not running', done => {
      deleteFolderRecursive(path.join(__dirname, 'datasets', 'service-registration', 'keys_100'));

      runArchi('service-registration', [
        ['start', '-c', path.join('..', 'configs', '100-service-registration.json')],
      ], () => {
        fetch(url, {
          method  : 'POST',
          headers : {
            'Content-Type' : 'application/json'
          },
          body : JSON.stringify({
            container : 123456789,
            key       : '/* MY PUBLIC KEY */'
          })
        }).then(res => {
          should(res.status).eql(500);

          let filePath100 = path.join(__dirname, 'datasets', 'service-registration', 'keys_100', '123456789.pub');
          let filePath101 = path.join(__dirname, 'datasets', 'service-registration', 'keys_101', '123456789.pub');

          fs.readFile(filePath100, (err, file) => {
            should(err).not.ok();
            should(file.toString()).eql('/* MY PUBLIC KEY */');

            deleteFolderRecursive(path.join(__dirname, 'datasets', 'service-registration', 'keys_100'));

            fs.access(filePath101, fs.constants.F_OK, err => {
              should(err).ok();
              stopArchi(done);
            });
          });
        }).catch(e => {
          done(e);
        });
      });
    });

  });
});
