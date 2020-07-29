const sharp = require('sharp');

/**
 * Get size among configured sizes
 * @returns {Object}
 */
exports.getSize = function (CONFIG, size) {
  return CONFIG.IMAGE_SIZES[size];
}

/**
 * Resize an image
 * @param {Object} CONFIG
 * @param {String} size @optional
 * @returns {Stream}
 */
exports.resize = function resize (CONFIG, size) {
  let pipeline = sharp();

  if (size) {
    return pipeline.resize({
      fit    : 'inside',
      width  : CONFIG.IMAGE_SIZES[size].width,
      height : CONFIG.IMAGE_SIZES[size].height
    });
  }

  pipeline.resize({
    withoutEnlargement : true,
    fit                : 'inside',
    width              : CONFIG.IMAGE_SIZE_DEFAULT_WIDTH
  });

  return pipeline;
}
