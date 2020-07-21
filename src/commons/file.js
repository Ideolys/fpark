const { padlz } = require('./utils');

module.exports = {

  /**
   * Get filename of spe;cified length
   * @param {String} filename
   * @param {Int} length
   * @returns {String}
   */
  getFileName (filename, length) {
    if (filename.length < length) {
      return padlz(filename, length);
    }

    return filename.substr(0, length);
  }

};
