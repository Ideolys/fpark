module.exports = {

  /**
   * Set header 'fpark-from-node'
   * @param {Object} headers
   * @param {Int} nodeId
   */
  setHeaderCurrentNode (headers, nodeId) {
    headers['fpark-from-node'] = nodeId;
  },

  /**
   * Set header 'fpark-nth-node'
   * @param {Object} headers
   * @param {Object} reqHeaders
   */
  setHeaderNthNode (headers, reqHeaders) {
    let _header = headers['fpark-nth-node'];

    if (reqHeaders) {
      _header = reqHeaders['fpark-nth-node'];
    }

    headers['fpark-nth-node'] = _header ? parseInt(_header, 10) + 1 : 1;
  },

  /**
   * Get value of header 'fpark-nth-node'
   * @param {Object} headers
   * @returns {Int}
   */
  getHeaderNthNode (headers) {
    return headers['fpark-nth-node'] ? parseInt(headers['fpark-nth-node'], 10) : 1;
  }

};
