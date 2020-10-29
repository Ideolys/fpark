const should      = require('should');
const repartition = require('../src/commons/repartition');

describe('Repartition', () => {

  describe('hash()', () => {
    it('should be defined', () => {
      should(repartition.hash).be.a.Function();
    });

    it('should return 0 if no string is given', () => {
      should(repartition.hash()).eql(0);
    });

    it('should return 0 if null is given', () => {
      should(repartition.hash(null)).eql(0);
    });

    it('should return 0 if an empty is given', () => {
      should(repartition.hash('')).eql(0);
    });

    it('should return a number if value is given', () => {
      should(repartition.hash('a')).be.a.Number();
    });

    it('should return a number equals to the sum of charCode of the string', () => {
      should(repartition.hash('a')).eql(97);
      should(repartition.hash('abc')).eql(97+98+99);
    });

  });

  describe('getNodesToPersistTo()', () => {

    beforeEach(repartition._resetCache);

    it('should be defined', () => {
      should(repartition.getNodesToPersistTo).be.a.Function();
    });

    it('should return [] if no string is given', () => {
      should(repartition.getNodesToPersistTo()).eql([]);
    });

    it('should return [] if null is given', () => {
      should(repartition.getNodesToPersistTo(null)).eql([]);
    });

    it('should return [] if an empty is given', () => {
      should(repartition.getNodesToPersistTo('')).eql([]);
    });

    it('should return [] if an empty nodes array is given', () => {
      should(repartition.getNodesToPersistTo('a', [], 3)).eql([]);
    });

    it('should return [] is nbReplicas = 0', () => {
      should(repartition.getNodesToPersistTo('a', [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 200, host : 'localhost', port : 6002 }
        , { id : 201, host : 'localhost', port : 6003 }
      ], 0)).eql([]);
    });

    it('should return an array if value is given', () => {
      should(repartition.getNodesToPersistTo('a', [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 200, host : 'localhost', port : 6002 }
        , { id : 201, host : 'localhost', port : 6003 }
      ])).be.an.Array();
    });

    it('should return an array of three values', () => {
      should(repartition.getNodesToPersistTo('a', [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 200, host : 'localhost', port : 6002 }
        , { id : 201, host : 'localhost', port : 6003 }
      ])).be.an.Array().and.have.lengthOf(3);
    });

    it('should return an array of three values even if nbReplicas is > nodes.length', () => {
      should(repartition.getNodesToPersistTo('a', [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 200, host : 'localhost', port : 6002 }
      ], 4)).be.an.Array().and.have.lengthOf(3);
    });

    it('should return three nodes among an array of nodes', () => {
      let nodes = [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 200, host : 'localhost', port : 6002 }
        , { id : 201, host : 'localhost', port : 6003 }
      ];

      let nodesToPersit = repartition.getNodesToPersistTo('a', nodes);

      should(nodesToPersit).eql([
          { id : 101, host : 'localhost', port : 6001 }
        , { id : 201, host : 'localhost', port : 6003 }
        , { id : 100, host : 'localhost', port : 6000 }
      ]);
    });

    it('should return three nodes among an array of nodes unsorted', () => {
      let nodes = [
          { id : 200, host : 'localhost', port : 6002 }
        , { id : 100, host : 'localhost', port : 6000 }
        , { id : 201, host : 'localhost', port : 6003 }
        , { id : 101, host : 'localhost', port : 6001 }
      ];

      let nodesToPersit = repartition.getNodesToPersistTo('a', nodes);

      should(nodesToPersit).eql([
          { id : 101, host : 'localhost', port : 6001 }
        , { id : 201, host : 'localhost', port : 6003 }
        , { id : 100, host : 'localhost', port : 6000 }
      ]);
    });

    it('should return three nodes with first node in second region', () => {
      let nodes = [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 200, host : 'localhost', port : 6002 }
        , { id : 201, host : 'localhost', port : 6003 }
      ];

      let nodesToPersit = repartition.getNodesToPersistTo('test-2.png', nodes);

      should(nodesToPersit).eql([
          { id : 200, host : 'localhost', port : 6002 }
        , { id : 100, host : 'localhost', port : 6000 }
        , { id : 201, host : 'localhost', port : 6003 }
      ]);
    });

    it('should return three nodes among a region if no multi regions', () => {
      let nodes = [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 102, host : 'localhost', port : 6002 }
        , { id : 103, host : 'localhost', port : 6003 }
      ];

      let nodesToPersit = repartition.getNodesToPersistTo('test-2.png', nodes);

      should(nodesToPersit).eql([
          { id : 102, host : 'localhost', port : 6002 }
        , { id : 103, host : 'localhost', port : 6003 }
        , { id : 100, host : 'localhost', port : 6000 }
      ]);
    });

    it('should return three nodes among three regions', () => {
      let nodes = [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 200, host : 'localhost', port : 6002 }
        , { id : 201, host : 'localhost', port : 6003 }
        , { id : 300, host : 'localhost', port : 6004 }
        , { id : 201, host : 'localhost', port : 6005 }
      ];

      let nodesToPersit = repartition.getNodesToPersistTo('test-2.png', nodes);

      should(nodesToPersit).eql([
          { id : 200, host : 'localhost', port : 6002 }
        , { id : 300, host : 'localhost', port : 6004 }
        , { id : 100, host : 'localhost', port : 6000 }
      ]);
    });

    it('should return two nodes among a region if no multi regions', () => {
      let nodes = [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 102, host : 'localhost', port : 6002 }
        , { id : 103, host : 'localhost', port : 6003 }
      ];

      let nodesToPersit = repartition.getNodesToPersistTo('test-2.png', nodes, 2);

      should(nodesToPersit).eql([
          { id : 102, host : 'localhost', port : 6002 }
        , { id : 103, host : 'localhost', port : 6003 }
      ]);
    });

    it('should return one node among a region if no multi regions', () => {
      let nodes = [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 102, host : 'localhost', port : 6002 }
        , { id : 103, host : 'localhost', port : 6003 }
      ];

      let nodesToPersit = repartition.getNodesToPersistTo('test-2.png', nodes, 1);

      should(nodesToPersit).eql([
          { id : 102, host : 'localhost', port : 6002 }
      ]);
    });

    it('should return two nodes among two regions', () => {
      let nodes = [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 200, host : 'localhost', port : 6002 }
        , { id : 201, host : 'localhost', port : 6003 }
      ];

      let nodesToPersit = repartition.getNodesToPersistTo('test-2.png', nodes, 2);

      should(nodesToPersit).eql([
          { id : 200, host : 'localhost', port : 6002 }
        , { id : 100, host : 'localhost', port : 6000 }
      ]);
    });

    it('should return four nodes among two regions', () => {
      let nodes = [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
        , { id : 200, host : 'localhost', port : 6002 }
        , { id : 201, host : 'localhost', port : 6003 }
      ];

      let nodesToPersit = repartition.getNodesToPersistTo('test-2.png', nodes, 4);

      should(nodesToPersit).eql([
          { id : 200, host : 'localhost', port : 6002 }
        , { id : 100, host : 'localhost', port : 6000 }
        , { id : 201, host : 'localhost', port : 6003 }
        , { id : 101, host : 'localhost', port : 6001 }
      ]);
    });

    it('should not return four nodes among one region of two nodes', () => {
      let nodes = [
          { id : 100, host : 'localhost', port : 6000 }
        , { id : 101, host : 'localhost', port : 6001 }
      ];

      try {
        repartition.getNodesToPersistTo('test-2.png', nodes, 4);
      }
      catch (e) {
        should(e.message).eql('Number of replica is superior to number of nodes');
      }
    });
  });

  describe('isCurrentNodeInPersistentNodes()', () => {

    it('should be defined', () => {
      should(repartition.isCurrentNodeInPersistentNodes).be.a.Function();
    });

    it('should return false if no vlaue is given', () => {
      should(repartition.isCurrentNodeInPersistentNodes()).eql(false);
    });

    it('should return false if no nodeId is given', () => {
      should(repartition.isCurrentNodeInPersistentNodes([{ id : 1 }])).eql(false);
    });

    it('should return false if the nodeId is not in nodes', () => {
      let isAllowed = repartition.isCurrentNodeInPersistentNodes([
        { id : 100, host : 'localhost', port : 6000 }
      , { id : 101, host : 'localhost', port : 6001 }
      , { id : 200, host : 'localhost', port : 6002 }
      , { id : 201, host : 'localhost', port : 6003 }
    ], 301);
      should(isAllowed).eql(false);
    });

    it('should return true if the nodeId is in nodes', () => {
      let isAllowed = repartition.isCurrentNodeInPersistentNodes([
        { id : 100, host : 'localhost', port : 6000 }
      , { id : 101, host : 'localhost', port : 6001 }
      , { id : 200, host : 'localhost', port : 6002 }
      , { id : 201, host : 'localhost', port : 6003 }
    ], 200);
      should(isAllowed).eql(true);
    });

  });

  describe('flattenNodes()', () => {

    it('should return a string', () => {
      should(repartition.flattenNodes([
        { id : 100, host : 'localhost', port : 6000 }
      , { id : 101, host : 'localhost', port : 6001 }
      , { id : 200, host : 'localhost', port : 6002 }
      ])).be.a.String();
    });

    it('should return a string with node ids separated by -', () => {
      should(repartition.flattenNodes([
        { id : 100, host : 'localhost', port : 6000 }
      , { id : 101, host : 'localhost', port : 6001 }
      , { id : 200, host : 'localhost', port : 6002 }
      ])).eql('100-101-200');
    });

    it('should sort nodes', () => {
      should(repartition.flattenNodes([
        { id : 200, host : 'localhost', port : 6002 }
      , { id : 100, host : 'localhost', port : 6000 }
      , { id : 101, host : 'localhost', port : 6001 }
      ])).eql('100-101-200');
    });

    it('should return empty string and current node is the only node', () => {
      should(repartition.flattenNodes([
        { id : 200, host : 'localhost', port : 6002 }
      ], 200)).eql('');
    });

    it('should not return empty string and current node is the only node', () => {
      should(repartition.flattenNodes([
          { id : 200, host : 'localhost', port : 6002 }
        , { id : 201, host : 'localhost', port : 6003 }
      ], 200)).eql('200-201');
    });

    it('should return the only node if no current node set', () => {
      should(repartition.flattenNodes([
        { id : 200, host : 'localhost', port : 6002 }
      ])).eql('200');
    });

  });
});
