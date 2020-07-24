const sharp = require('sharp');

/**
 * Compress an image
 * If the image is a png file, it will be converted to jpeg
 * @param {String} extension Uploaded file extension
 * @param {Object} options {
 *   ...
 *   IMAGE_COMPRESSION_LIMIT : Int // default compression limit between 0 and 100
 *   IMAGE_COMPRESSION_LIMIT_JPEG : Int // optional compression limit for jpeg
 *   IMAGE_COMPRESSION_LIMIT_WEBP : Int // optional compression limit for webp
 *   ...
 * }
 * * @returns {Stream}
 */
function compress (CONFIG, extension) {
  let pipeline = sharp();

  if (extension === 'jpeg' || extension === 'jpg') {
    pipeline.jpeg({ quality : CONFIG.IMAGE_COMPRESSION_LIMIT_JPEG || CONFIG.IMAGE_COMPRESSION_LIMIT });
  }

  if (extension === 'webp') {
    pipeline.webp({ quality : CONFIG.IMAGE_COMPRESSION_LIMIT_WEBP || CONFIG.IMAGE_COMPRESSION_LIMIT });
  }

  return pipeline;
}

module.exports = compress;
