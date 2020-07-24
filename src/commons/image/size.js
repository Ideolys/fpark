/**
 * Generate function to control size
 * @param {Object} config server's config
 * @return {Function} size(${String} size)
 */
module.exports = function size (config) {
  let fn = 'switch(size) {';

  for (let size in config.IMAGE_SIZES) {
    fn += `case '${ size }': return true;`;
  }

  fn += 'default: return false; }';

  return new Function('size', fn);
}
