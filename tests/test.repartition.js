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

    it('should return null if no string is given', () => {
      should(repartition.getNodesToPersistTo()).eql(null);
    });

    it('should return null if null is given', () => {
      should(repartition.getNodesToPersistTo(null)).eql(null);
    });

    it('should return null if an empty is given', () => {
      should(repartition.getNodesToPersistTo('')).eql(null);
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
        , { id : 200, host : 'localhost', port : 6002 }
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
        , { id : 200, host : 'localhost', port : 6002 }
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
        , { id : 101, host : 'localhost', port : 6001 }
      ]);
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
});
