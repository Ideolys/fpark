const { padlz } = require('./utils');

module.exports = {

  getFileName (filename, length) {
    if (filename.length < length) {
      return padlz(filename, length);
    }

    return filename.substr(0, length);
  }

};
