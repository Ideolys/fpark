const sharp = require('sharp');

/**
 * Resize an image
 * @param {Object} CONFIG
 * @param {String} size @optional
 * @returns {Stream}
 */
module.exports = function resize (CONFIG, size) {
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
