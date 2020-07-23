const sharp = require('sharp');

/**
 * Compress an image
 * If the image is a png file, it will be converted to jpeg
 * @param {String} extension Uploaded file extension
 * @param {Object} options {
 *   ...
 *   COMPRESSION_LIMIT : Int // default compression limit between 0 and 100
 *   COMPRESSION_LIMIT_JPEG : Int // optional compression limit for jpeg
 *   COMPRESSION_LIMIT_WEBP : Int // optional compression limit for webp
 *   ...
 * }
 */
function compress (extension, CONFIG) {
  let pipeline = sharp();

  if (extension === 'png') {
    pipeline.toFormat('jpeg');
    extension = 'jpeg';
  }

  if (extension === 'jpeg' || extension === 'jpg') {
    pipeline.jpeg({ quality : CONFIG.COMPRESSION_LIMIT_JPEG || CONFIG.COMPRESSION_LIMIT });
  }

  if (extension === 'webp') {
    // pipeline.webp({ quality : CONFIG.COMPRESSION_LIMIT_WEBP || CONFIG.COMPRESSION_LIMIT });
  }

  return pipeline;
}

module.exports = compress;
