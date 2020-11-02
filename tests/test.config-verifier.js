const should         = require('should');
const configVerifier = require('../src/config-verifier');

describe('should test the config', () => {

  it('should be a function', () => {
    should(configVerifier).be.a.Function();
  });

  it('should throw an error if ID is not defined', () =>  {
    (function () {
      configVerifier({
        NODES : [{}]
      });
    }).should.throw('fpark.conf: ID is required\n Documentation: https://github.com/Ideolys/fpark#configuration');
  });

  it('should throw an error if NODES[].id is not defined', () =>  {
    (function () {
      configVerifier({
        ID : 1,
        NODES : [{}]
      });
    }).should.throw('fpark.conf: NODES[].id is required\n Documentation: https://github.com/Ideolys/fpark#configuration');
  });

  it('should throw an error for each object inNODES', () =>  {
    (function () {
      configVerifier({
        ID : 1,
        NODES : [{ id : 1, host : 'http://localhost:3000' }, {}]
      });
    }).should.throw('fpark.conf: NODES[].id is required\n Documentation: https://github.com/Ideolys/fpark#configuration');
  });

  it('should throw an error if NODES[].host is not defined', () =>  {
    (function () {
      configVerifier({
        ID : 1,
        NODES : [{ id : 1 }]
      });
    }).should.throw('fpark.conf: NODES[].host is required, ex: "http://localhost:3000"\n Documentation: https://github.com/Ideolys/fpark#configuration');
  });

  it('should throw an error if NODES[].host is not http or https', () =>  {
    (function () {
      configVerifier({
        ID : 1,
        NODES : [{ id : 1, host : 'a ' }]
      });
    }).should.throw('fpark.conf: NODES[].host should starts with "http" or "https", ex: "http://localhost:3000"\n Documentation: https://github.com/Ideolys/fpark#configuration');
  });

  it('should not throw an error', () =>  {
    (function () {
      configVerifier({
        ID : 1,
        NODES : [
          { id : 1, host : 'http://localhost:3000' },
          { id : 1, host : 'https://localhost:3000' }
        ]
      });
    }).should.not.throw();
  });

});
