const should                  = require('should');
const path                    = require('path');
const fetch                   = require('node-fetch');
const config                  = require('./datasets/configs/100.json');
const { runArchi, stopArchi } = require('./utils');

let url = config.NODES[0].host + '/node/stats';

describe('stats', () => {

  after(done => {
    stopArchi(done);
  });

  it('should get stats if json format', done => {
    runArchi('service-registration', [
      ['start', '-c', path.join('..', 'configs', '100-stats.json')]
    ], () => {
      fetch(url + '?format=json', {
        method : 'GET',
      }).then(res => {
        should(res.status).eql(200);
        return res.json();
      }).then(body => {
        should(body).be.an.Array();
        should(body[0]).be.an.Object();
        should(body[0].label).eql('fpark_info_uptime');
        done();
      }).catch(e => {
        done(e);
      });
    });
  });

  it('should get stats if default format (open metrics)', done => {
    runArchi('service-registration', [
      ['start', '-c', path.join('..', 'configs', '100-stats.json')]
    ], () => {
      fetch(url, {
        method : 'GET',
      }).then(res => {
        should(res.status).eql(200);
        return res.text();
      }).then(body => {
        should(body).be.a.String();
        let _body = body.split('\n');
        should(_body[0].includes('fpark_info_uptime')).eql(true);
        done();
      }).catch(e => {
        done(e);
      });
    });
  });

  it('should not get stats (desactivated)', done => {
    runArchi('service-registration', [
      ['start', '-c', path.join('..', 'configs', '100-no-stats.json')]
    ], () => {
      fetch(url, {
        method : 'GET',
      }).then(res => {
        should(res.status).eql(404);
        done();
      }).catch(e => {
        done(e);
      });
    });
  });

});
