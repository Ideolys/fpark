const IMAGES_EXTENSIONS = ['PNG', 'JPEG', 'JPG', 'WEBP'];

module.exports = {

  /**
   * Is extension an image ?
   * @param {String} extension
   */
  isImage : function (extension) {
    return IMAGES_EXTENSIONS.indexOf(extension.toUpperCase()) !== -1;
  }
};
