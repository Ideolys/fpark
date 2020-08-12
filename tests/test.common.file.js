const should          = require('should');
const { getFileName } = require('../src/commons/file');

describe('Common file', () => {

  it('should return a string', () => {
    should(getFileName('abcd', 4)).be.a.String();
  });

  it('should return a string of length = 4', () => {
    should(Buffer.from(getFileName('abcd', 4)).length).eql(4);
  });

  it('should return a string of length = 4 if the string has a length of 2', () => {
    let filename = getFileName('ab', 4);
    should(Buffer.from(filename).length).eql(4);
    should(getFileName('ab', 4)).eql('00ab');
  });

  it('should return a string of length = 4 if the string has a length > 4', () => {
    let filename = getFileName('abcde', 4);
    should(Buffer.from(filename).length).eql(4);
    should(filename).eql('abcd');
  });

  it('should return a string of length = 4 if the string has a length = 4', () => {
    let filename = getFileName('abcd', 4);
    should(Buffer.from(filename).length).eql(4);
    should(filename).eql('abcd');
  });

  it('should return a string of length = 4 if the string has utf8 characters', () => {
    let filename = getFileName('abcé', 4);
    should(Buffer.from(filename).length).eql(4);
  });

});
