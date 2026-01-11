import MetaGetBuilder from './meta-builder.js';

describe('MetaGetBuilder', () => {
  let mockTopic;
  let builder;

  beforeEach(() => {
    mockTopic = {
      _maxSeq: 100,
      _minSeq: 10,
      _maxDel: 5,
      _deleted: false,
      updated: new Date('2025-01-01T00:00:00Z'),
      _lastSubsUpdate: new Date('2025-01-02T00:00:00Z'),
      getType: jest.fn(() => 'grp'),
      isP2PType: jest.fn(() => false),
      _tinode: {
        logger: jest.fn()
      }
    };
    builder = new MetaGetBuilder(mockTopic);
  });

  describe('withData', () => {
    test('sets data query with all parameters', () => {
      const result = builder.withData(10, 50, 20);
      expect(result).toBe(builder); // returns this for chaining
      expect(builder.what.data).toEqual({
        since: 10,
        before: 50,
        limit: 20
      });
    });

    test('sets data query with partial parameters', () => {
      builder.withData(undefined, 50, undefined);
      expect(builder.what.data).toEqual({
        since: undefined,
        before: 50,
        limit: undefined
      });
    });
  });

  describe('withLaterData', () => {
    test('fetches messages newer than _maxSeq when _maxSeq > 0', () => {
      mockTopic._maxSeq = 100;
      builder.withLaterData(25);
      expect(builder.what.data).toEqual({
        since: 101,
        before: undefined,
        limit: 25
      });
    });

    test('sets since to undefined when _maxSeq is 0', () => {
      mockTopic._maxSeq = 0;
      builder.withLaterData(25);
      expect(builder.what.data).toEqual({
        since: undefined,
        before: undefined,
        limit: 25
      });
    });
  });

  describe('withDataRanges', () => {
    test('normalizes and sets ranges', () => {
      const ranges = [{
        low: 5,
        hi: 10
      }, {
        low: 20,
        hi: 30
      }];
      builder.withDataRanges(ranges, 50);
      expect(builder.what.data.limit).toBe(50);
      expect(builder.what.data.ranges).toBeDefined();
    });
  });

  describe('withDataList', () => {
    test('converts list to ranges', () => {
      builder.withDataList([1, 2, 3, 5, 6, 10]);
      expect(builder.what.data.ranges).toBeDefined();
    });
  });

  describe('withEarlierData', () => {
    test('fetches messages older than _minSeq when _minSeq > 0', () => {
      mockTopic._minSeq = 10;
      builder.withEarlierData(25);
      expect(builder.what.data).toEqual({
        since: undefined,
        before: 10,
        limit: 25
      });
    });

    test('sets before to undefined when _minSeq is 0', () => {
      mockTopic._minSeq = 0;
      builder.withEarlierData(25);
      expect(builder.what.data).toEqual({
        since: undefined,
        before: undefined,
        limit: 25
      });
    });
  });

  describe('withDesc', () => {
    test('sets desc query with timestamp', () => {
      const ims = new Date('2025-01-01T12:00:00Z');
      builder.withDesc(ims);
      expect(builder.what.desc).toEqual({
        ims
      });
    });

    test('sets desc query without timestamp', () => {
      builder.withDesc();
      expect(builder.what.desc).toEqual({
        ims: undefined
      });
    });
  });

  describe('withLaterDesc', () => {
    test('uses topic updated timestamp when not deleted', () => {
      mockTopic._deleted = false;
      mockTopic.updated = new Date('2025-01-01T00:00:00Z');
      builder.withLaterDesc();
      expect(builder.what.desc).toEqual({
        ims: new Date('2025-01-01T00:00:00Z')
      });
    });

    test('uses undefined when topic is deleted', () => {
      mockTopic._deleted = true;
      builder.withLaterDesc();
      expect(builder.what.desc).toEqual({
        ims: undefined
      });
    });
  });

  describe('withSub', () => {
    test('sets sub query for group topic with user parameter', () => {
      mockTopic.getType.mockReturnValue('grp');
      const ims = new Date('2025-01-01T00:00:00Z');
      builder.withSub(ims, 50, 'user123');
      expect(builder.what.sub).toEqual({
        ims,
        limit: 50,
        user: 'user123'
      });
    });

    test('sets sub query for me topic with topic parameter', () => {
      mockTopic.getType.mockReturnValue('me');
      const ims = new Date('2025-01-01T00:00:00Z');
      builder.withSub(ims, 50, 'grpABC');
      expect(builder.what.sub).toEqual({
        ims,
        limit: 50,
        topic: 'grpABC'
      });
    });

    test('sets sub query without optional parameters', () => {
      builder.withSub();
      expect(builder.what.sub).toEqual({
        ims: undefined,
        limit: undefined,
        user: undefined
      });
    });
  });

  describe('withOneSub', () => {
    test('calls withSub with undefined limit', () => {
      const ims = new Date('2025-01-01T00:00:00Z');
      builder.withOneSub(ims, 'user123');
      expect(builder.what.sub).toEqual({
        ims,
        limit: undefined,
        user: 'user123'
      });
    });
  });

  describe('withLaterOneSub', () => {
    test('uses _lastSubsUpdate timestamp', () => {
      mockTopic._lastSubsUpdate = new Date('2025-01-02T00:00:00Z');
      builder.withLaterOneSub('user123');
      expect(builder.what.sub).toEqual({
        ims: new Date('2025-01-02T00:00:00Z'),
        limit: undefined,
        user: 'user123'
      });
    });

    test('passes userOrTopic to sub query', () => {
      mockTopic.getType.mockReturnValue('grp');
      builder.withLaterOneSub('user456');
      expect(builder.what.sub.user).toBe('user456');
    });
  });

  describe('withLaterSub', () => {
    test('uses _lastSubsUpdate for group topic', () => {
      mockTopic.getType.mockReturnValue('grp');
      mockTopic._lastSubsUpdate = new Date('2025-01-02T00:00:00Z');
      builder.withLaterSub(100);
      expect(builder.what.sub).toEqual({
        ims: new Date('2025-01-02T00:00:00Z'),
        limit: 100,
        user: undefined
      });
    });

    test('uses updated timestamp for P2P topic', () => {
      mockTopic.isP2PType.mockReturnValue(true);
      mockTopic.updated = new Date('2025-01-03T00:00:00Z');
      builder.withLaterSub(100);
      expect(builder.what.sub).toEqual({
        ims: new Date('2025-01-03T00:00:00Z'),
        limit: 100,
        user: undefined
      });
    });
  });

  describe('withTags', () => {
    test('sets tags to true', () => {
      builder.withTags();
      expect(builder.what.tags).toBe(true);
    });
  });

  describe('withCred', () => {
    test('sets cred to true for me topic', () => {
      mockTopic.getType.mockReturnValue('me');
      builder.withCred();
      expect(builder.what.cred).toBe(true);
      expect(mockTopic._tinode.logger).not.toHaveBeenCalled();
    });

    test('logs error and does not set cred for non-me topic', () => {
      mockTopic.getType.mockReturnValue('grp');
      builder.withCred();
      expect(builder.what.cred).toBeUndefined();
      expect(mockTopic._tinode.logger).toHaveBeenCalledWith(
        'ERROR: Invalid topic type for MetaGetBuilder:withCreds',
        'grp'
      );
    });
  });

  describe('withAux', () => {
    test('sets aux to true', () => {
      builder.withAux();
      expect(builder.what.aux).toBe(true);
    });
  });

  describe('withDel', () => {
    test('sets del query with both parameters', () => {
      builder.withDel(5, 20);
      expect(builder.what.del).toEqual({
        since: 5,
        limit: 20
      });
    });

    test('sets del query with only since', () => {
      builder.withDel(5, undefined);
      expect(builder.what.del).toEqual({
        since: 5,
        limit: undefined
      });
    });

    test('does not set del query when both parameters are falsy', () => {
      builder.withDel(undefined, undefined);
      expect(builder.what.del).toBeUndefined();
    });

    test('sets del query when only limit is provided', () => {
      builder.withDel(undefined, 20);
      expect(builder.what.del).toEqual({
        since: undefined,
        limit: 20
      });
    });
  });

  describe('withLaterDel', () => {
    test('fetches deleted messages after _maxDel when _maxSeq > 0', () => {
      mockTopic._maxSeq = 100;
      mockTopic._maxDel = 5;
      builder.withLaterDel(50);
      expect(builder.what.del).toEqual({
        since: 6,
        limit: 50
      });
    });

    test('sets since to undefined when _maxSeq is 0', () => {
      mockTopic._maxSeq = 0;
      builder.withLaterDel(50);
      expect(builder.what.del).toEqual({
        since: undefined,
        limit: 50
      });
    });
  });

  describe('extract', () => {
    test('extracts specified subquery', () => {
      builder.withData(10, 50, 20);
      builder.withTags();

      expect(builder.extract('data')).toEqual({
        since: 10,
        before: 50,
        limit: 20
      });
      expect(builder.extract('tags')).toBe(true);
    });

    test('returns undefined for non-existent subquery', () => {
      expect(builder.extract('nonexistent')).toBeUndefined();
    });
  });

  describe('build', () => {
    test('builds empty query when no subqueries are set', () => {
      const result = builder.build();
      expect(result).toBeUndefined();
    });

    test('builds query with single subquery', () => {
      builder.withTags();
      const result = builder.build();
      expect(result).toEqual({
        what: 'tags'
      });
    });

    test('builds query with data parameters', () => {
      builder.withData(10, 50, 20);
      const result = builder.build();
      expect(result).toEqual({
        what: 'data',
        data: {
          since: 10,
          before: 50,
          limit: 20
        }
      });
    });

    test('builds query with multiple subqueries', () => {
      builder.withData(10, 50, 20);
      builder.withDesc(new Date('2025-01-01T00:00:00Z'));
      builder.withTags();
      builder.withSub(new Date('2025-01-02T00:00:00Z'), 100);

      const result = builder.build();
      expect(result.what).toBe('data sub desc tags');
      expect(result.data).toEqual({
        since: 10,
        before: 50,
        limit: 20
      });
      expect(result.desc).toEqual({
        ims: new Date('2025-01-01T00:00:00Z')
      });
      expect(result.sub).toEqual({
        ims: new Date('2025-01-02T00:00:00Z'),
        limit: 100,
        user: undefined
      });
      expect(result.tags).toBeUndefined(); // boolean flags don't get included in params
    });

    test('builds query with all subqueries', () => {
      mockTopic.getType.mockReturnValue('me');

      builder
        .withData(10, 50, 20)
        .withSub(new Date('2025-01-02T00:00:00Z'), 100, 'grpABC')
        .withDesc(new Date('2025-01-01T00:00:00Z'))
        .withTags()
        .withCred()
        .withAux()
        .withDel(5, 30);

      const result = builder.build();
      expect(result.what).toBe('data sub desc tags cred aux del');
      expect(result.data).toBeDefined();
      expect(result.sub).toBeDefined();
      expect(result.desc).toBeDefined();
      expect(result.del).toBeDefined();
    });

    test('does not include empty objects in parameters', () => {
      builder.withDesc(); // ims will be undefined, creating empty object
      builder.what.desc = {}; // Force empty object

      const result = builder.build();
      expect(result.what).toBe('desc');
      expect(result.desc).toBeUndefined(); // empty objects are not included
    });
  });

  describe('method chaining', () => {
    test('all methods return builder for chaining', () => {
      const result = builder
        .withData(10, 50, 20)
        .withDesc()
        .withSub()
        .withTags()
        .withCred()
        .withAux()
        .withDel(5, 20);

      expect(result).toBe(builder);
    });

    test('complex chaining scenario', () => {
      mockTopic.getType.mockReturnValue('grp');
      mockTopic._maxSeq = 100;

      const result = builder
        .withLaterData(25)
        .withLaterDesc()
        .withLaterSub(50)
        .withTags()
        .withLaterDel(10)
        .build();

      expect(result.what).toBe('data sub desc tags del');
      expect(result.data.since).toBe(101);
      expect(result.del.since).toBe(6);
    });
  });
});
