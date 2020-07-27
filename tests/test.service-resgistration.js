const fs     = require('fs');
const path   = require('path');
const fetch  = require('node-fetch');
const should = require('should');
const config = require('./datasets/configs/100.json');
const { runArchi, stopArchi, deleteFolderRecursive } = require('./utils');

let url      = config.NODES[0].host + '/node/register';
let filePath = path.join(__dirname, 'datasets', 'service-registration', 'keys', '123456789.pub');

describe('Service registration', () => {

  beforeEach(() => {
    deleteFolderRecursive(path.join(__dirname, 'datasets', 'service-registration', 'keys'));
    fs.mkdirSync(path.join(__dirname, 'datasets', 'service-registration', 'keys'));
  });

  before(done => {
    runArchi('service-registration', [['start', '-c', path.join('..', 'configs', '100.json')]], done);
  });

  after(done => {
    stopArchi(done);
  })

  it('should register the service', done => {
    fetch(url, {
      method  : 'POST',
      headers : {
        'Content-Type' : 'application/json'
      },
      body : JSON.stringify({
        containerId : 123456789,
        key         : '/* MY PUBLIC KEY */'
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

  it('should not register the service if the key already exist', done => {
    fetch(url, {
      method  : 'POST',
      headers : {
        'Content-Type' : 'application/json'
      },
      body : JSON.stringify({
        containerId : 123456789,
        key         : '/* MY PUBLIC KEY */'
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
            containerId : 123456789,
            key         : '/* MY PUBLIC KEY */'
          })
        }).then(res => {
          should(res.status).eql(409);
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
        containerId : 123456789,
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

  it('should not register the service if the body has not containerID', done => {
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
          containerId : 123456789
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
