
/**
 * A region is an integer between 1-9
 * A node is identified by an id, ex: 101
 * This id specify the region, ex:
 *   id = 101 -> region = 1
 *   id = 200 -> region = 2
 *
 * nodesByRegion = { 1 -> [node1, nodeN], 2 -> [node1, nodeN] }
 */
let nodesByRegion = null;
let nbRegions     = 0;

/**
 * Convert a string into a Number
 * @param  {String} str
 * @return {Number}
 */
function hash (str) {
  let res = 0;

  if (!str) {
    return res;
  }

  for (let i = 0; i < str.length; i++) {
   res += str.charCodeAt(i);
  }

  return res;
}

/**
 * Get region for a node based on its id
 * @param {Objec-} node
 * @returns {Number}
 */
function getRegionForNode (node) {
  return Math.round(node.id / 100);
}

/**
 * Set var nodesByRegion
 * @param {Array} nodes
 */
function setNodesByRegion (nodes) {
  if (nodesByRegion) {
    return;
  }

  nodesByRegion = {};

  for (let i = 0; i < nodes.length; i++) {
    let region = getRegionForNode(nodes[i]);

    if (!nodesByRegion[region]) {
      nodesByRegion[region] = [];
      nbRegions++;
    }

    nodesByRegion[region].push(nodes[i]);
  }
}

/**
 * Sort ASC nodes on attibute id
 * @param {Array} nodes
 */
function _sortNodes (nodes) {
  nodes.sort((a, b) => {
    return a.id - b.id;
  });
}

/**
 * Get next region by key
 * @param {String} currentRegion
 * @returns {String}
 */
function getNextRegionByKey (currentRegion) {
  let regions     = Object.keys(nodesByRegion).sort();
  let indexRegion = regions.indexOf(currentRegion + '');

  if (indexRegion === -1) {
    return currentRegion;
  }

  if (regions[indexRegion + 1]) {
    return regions[indexRegion + 1];
  }

  return regions[0];
}

/**
 * Get next region by index
 * @param {String} currentRegion
 * @returns {String}
 */
function getNextRegionByIndex (index) {
  let regions = Object.keys(nodesByRegion).sort();

  if (index < 0 || index > regions.length - 1) {
    return regions[0];
  }

  return regions[index];
}

/**
 * Get nodes to persist to
 * @param {String} str
 * @param {Array} of nodes { id : Number, host : String, port : Number }
 * @param {Int} nbReplicas number of replicas for a file
 * @returns {Array} of nodes
 */
function getNodesToPersistTo (str, nodes, nbReplicas = 3) {
  if (!str || !nbReplicas || !nodes.length) {
    return null;
  }

  setNodesByRegion(nodes);
  let nodesToPersist = [];
  let hashIndex      = hash(str) % nbReplicas;

  if (nbReplicas > nodes.length) {
    throw new Error('Number of replica is superior to number of nodes');
  }

  _sortNodes(nodes);

  let lastRegionIndex = {};

  let lastNode = nodes[hashIndex];
  nodesToPersist.push(lastNode);

  let region              = getRegionForNode(lastNode);
  lastRegionIndex[region] = nodesByRegion[region].indexOf(lastNode);

  for (let i = 0; i < nbReplicas - 1; i++) {
    let region     = getRegionForNode(lastNode);
    let nextRegion = getNextRegionByKey(region);

    let index = lastRegionIndex[nextRegion] != null ? lastRegionIndex[nextRegion] + 1 : lastRegionIndex[region];

    if (index >= nodesByRegion[nextRegion].length) {
      index = 0;
    }

    lastRegionIndex[nextRegion] = index;

    lastNode = nodesByRegion[nextRegion][index];
    nodesToPersist.push(lastNode);
  }

  return nodesToPersist;
}

/**
 * Is current node in persistent nodes ?
 * @param {Array} nodes
 * @param {Int} nodeId
 * @returns {Boolean}
 */
function isCurrentNodeInPersistentNodes (nodes, nodeId) {
  if (!nodes || nodeId == null) {
    return false;
  }

  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === nodeId) {
      return true;
    }
  }

  return false;
}

/**
 * Flatten nodes
 * @param {Array} nodes
 * @returns {String} "node1Id-node2Id-node3Id"
 */
function flattenNodes (nodes) {
  _sortNodes(nodes);

  let res = '';

  for (let i = 0; i< nodes.length; i++) {
    res += '-' + nodes[i].id;
  }

  return res.slice(1);
}

module.exports = {
  getNodesToPersistTo,
  hash,
  isCurrentNodeInPersistentNodes,
  flattenNodes,

  /**
   * Only for tests
   */
  _resetCache () {
    nodesByRegion = null;
    nbRegions     = 0;
  }
};
