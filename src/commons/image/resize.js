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
    pipeline.resize({
      width  : CONFIG.IMAGE_SIZES[size].width,
      height : CONFIG.IMAGE_SIZES[size].height
    });

    return pipeline;
  }

  pipeline.resize({
    withoutEnlargement : true,
    fit                : 'inside',
    width              : CONFIG.IMAGE_SIZE_DEFAULT_WIDTH
  });

  return pipeline;
}
