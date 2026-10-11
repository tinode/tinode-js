import DB from './db.js';
import MemoryAdapter from './memory-adapter.js';

class FakeAccessMode {
  constructor(mode) {
    this.mode = mode;
  }

  jsonHelper() {
    return {
      mode: this.mode
    };
  }
}

class FakeTopic {
  constructor(name) {
    this.name = name;
    this.created = new Date(1000);
    this.updated = new Date(2000);
    this.seq = 0;
    this.read = 0;
    this.recv = 0;
    this.unread = 0;
    this.public = {
      fn: 'Group'
    };
    this._tags = [];
    this._deleted = false;
    this.acs = undefined;
  }

  getAccessMode() {
    return this.acs || new FakeAccessMode('');
  }

  setAccessMode(acs) {
    this.acs = new FakeAccessMode(acs.mode);
  }
}

describe('DB without storage', () => {
  const db = new DB(null, null, null);

  test('is not ready and resolves empty results', async () => {
    expect(db.isReady()).toBe(false);
    await expect(db.initDatabase()).resolves.toBeUndefined();
    await expect(db.mapTopics()).resolves.toEqual([]);
    await expect(db.mapUsers()).resolves.toEqual([]);
    await expect(db.mapSubscriptions('grpA')).resolves.toEqual([]);
    await expect(db.readMessages('grpA')).resolves.toEqual([]);
    await expect(db.readDelLog('grpA')).resolves.toEqual([]);
    await expect(db.maxDelId('grpA')).resolves.toBe(0);
    await expect(db.getUser('usr1')).resolves.toBeUndefined();
    await expect(db.updTopic(new FakeTopic('grpA'))).resolves.toBeUndefined();
    await expect(db.addMessage({
      topic: 'grpA',
      seq: 1
    })).resolves.toBeUndefined();
    await expect(db.remMessages('grpA')).resolves.toBeUndefined();
    await expect(db.deleteDatabase()).resolves.toBe(true);
  });
});

describe('DB with default storage outside the browser', () => {
  test('is not ready when IndexedDB is unavailable', async () => {
    const db = new DB(jest.fn(), jest.fn());
    expect(db.isReady()).toBe(false);
    await expect(db.initDatabase()).resolves.toBeUndefined();
    expect(db.isReady()).toBe(false);
    await expect(db.mapTopics()).resolves.toEqual([]);
    await expect(db.deleteDatabase()).resolves.toBe(true);
  });
});

describe('DB over memory adapter', () => {
  let db;

  beforeEach(async () => {
    db = new DB(jest.fn(), jest.fn(), new MemoryAdapter());
    await db.initDatabase();
  });

  test('is ready after init and not ready after delete', async () => {
    expect(db.isReady()).toBe(true);
    await expect(db.deleteDatabase()).resolves.toBe(true);
    expect(db.isReady()).toBe(false);
  });

  test('serializes and deserializes a topic', async () => {
    const topic = new FakeTopic('grpA');
    topic.seq = 9;
    topic.read = 4;
    topic._tags = ['a', 'b'];
    topic.setAccessMode({
      mode: 'JRWP'
    });
    await db.updTopic(topic);

    const records = await db.mapTopics();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      name: 'grpA',
      seq: 9,
      read: 4,
      tags: ['a', 'b'],
      acs: {
        mode: 'JRWP'
      },
      public: {
        fn: 'Group'
      }
    });

    const restored = new FakeTopic('grpA');
    db.deserializeTopic(restored, records[0]);
    expect(restored.seq).toBe(9);
    expect(restored.read).toBe(4);
    expect(restored.unread).toBe(5);
    expect(restored._tags).toEqual(['a', 'b']);
    expect(restored.acs.mode).toBe('JRWP');
  });

  test('updates an existing topic in place', async () => {
    const topic = new FakeTopic('grpA');
    await db.updTopic(topic);
    topic.seq = 3;
    await db.updTopic(topic);
    const records = await db.mapTopics();
    expect(records).toHaveLength(1);
    expect(records[0].seq).toBe(3);
  });

  test('calls the topic callback with the given context', async () => {
    await db.updTopic(new FakeTopic('grpA'));
    const seen = [];
    const context = {
      tag: 'ctx'
    };
    await db.mapTopics(function(record) {
      expect(this).toBe(context);
      seen.push(record.name);
    }, context);
    expect(seen).toEqual(['grpA']);
  });

  test('marks and removes topics', async () => {
    await db.updTopic(new FakeTopic('grpA'));
    await db.markTopicAsDeleted('grpA', true);
    expect((await db.mapTopics())[0]._deleted).toBe(true);
    await expect(db.markTopicAsDeleted('missing', true)).resolves.toBeUndefined();
    await db.remTopic('grpA');
    await expect(db.mapTopics()).resolves.toEqual([]);
  });

  test('stores, reads and removes users', async () => {
    await db.updUser('usr1');
    await expect(db.mapUsers()).resolves.toEqual([]);
    await db.updUser('usr1', {
      fn: 'Alice'
    });
    await expect(db.getUser('usr1')).resolves.toEqual({
      user: 'usr1',
      public: {
        fn: 'Alice'
      }
    });
    await expect(db.getUser('usr2')).resolves.toBeUndefined();
    await expect(db.mapUsers()).resolves.toEqual([{
      uid: 'usr1',
      public: {
        fn: 'Alice'
      }
    }]);
    await db.remUser('usr1');
    await expect(db.mapUsers()).resolves.toEqual([]);
  });

  test('merges subscription updates and exposes the user', async () => {
    await db.updSubscription('grpA', 'usr1', {
      mode: 'JRWP',
      user: 'usr1',
      online: true
    });
    await db.updSubscription('grpA', 'usr1', {
      read: 3
    });
    const seen = [];
    const subs = await db.mapSubscriptions('grpA', sub => seen.push(sub.user));
    expect(subs).toEqual([{
      topic: 'grpA',
      uid: 'usr1',
      user: 'usr1',
      mode: 'JRWP',
      read: 3
    }]);
    expect(seen).toEqual(['usr1']);
    await db.remSubscription('grpA', 'usr1');
    await expect(db.mapSubscriptions('grpA')).resolves.toEqual([]);
  });

  test('reads messages by window, limit and ranges', async () => {
    for (let seq = 1; seq <= 5; seq++) {
      await db.addMessage({
        topic: 'grpA',
        seq: seq,
        content: 'm' + seq
      });
    }
    const recent = await db.readMessages('grpA', {
      limit: 2
    });
    expect(recent.map(m => m.seq)).toEqual([5, 4]);

    const windowed = await db.readMessages('grpA', {
      since: 2,
      before: 4
    });
    expect(windowed.map(m => m.seq)).toEqual([3, 2]);

    const seen = [];
    const ranged = await db.readMessages('grpA', {
      ranges: [{
        low: 1,
        hi: 3
      }, {
        low: 5
      }]
    }, msg => seen.push(msg.seq));
    expect(ranged.map(m => m.seq)).toEqual([1, 2, 5]);
    expect(seen).toEqual([1, 2, 5]);
  });

  test('updates message status and keeps content', async () => {
    await db.addMessage({
      topic: 'grpA',
      seq: 3,
      content: 'm3'
    });
    await db.updMessageStatus('grpA', 3, 4);
    const [msg] = await db.readMessages('grpA', {
      ranges: [{
        low: 3
      }]
    });
    expect(msg._status).toBe(4);
    expect(msg.content).toBe('m3');
  });

  test('removes a single message, a range, an empty range and all messages', async () => {
    for (let seq = 1; seq <= 8; seq++) {
      await db.addMessage({
        topic: 'grpA',
        seq: seq
      });
    }
    await db.remMessages('grpA', 8);
    await db.remMessages('grpA', 2, 4);
    await db.remMessages('grpA', 5, 5);
    await db.remMessages('grpA', 7, 6);
    expect((await db.readMessages('grpA')).map(m => m.seq)).toEqual([7, 6, 5, 4, 1]);
    await db.remMessages('grpA', undefined, 2);
    expect((await db.readMessages('grpA')).map(m => m.seq)).toEqual([7, 6, 5, 4]);
    await db.remMessages('grpA');
    await expect(db.readMessages('grpA')).resolves.toEqual([]);
  });

  test('records deleted ranges and reports the latest delete id', async () => {
    await expect(db.maxDelId('grpA')).resolves.toBe(0);
    await db.addDelLog('grpA', 3, [{
      low: 2,
      hi: 4
    }, {
      low: 9
    }]);
    await db.addDelLog('grpA', 5, [{
      low: 20,
      hi: 22
    }]);
    await expect(db.maxDelId('grpA')).resolves.toBe(5);
    await expect(db.readDelLog('grpA')).resolves.toEqual([{
      low: 20,
      hi: 22
    }, {
      low: 9,
      hi: 10
    }, {
      low: 2,
      hi: 4
    }]);
    await expect(db.readDelLog('grpA', {
      limit: 2
    })).resolves.toEqual([{
      low: 20,
      hi: 22
    }]);
    await expect(db.readDelLog('grpA', {
      ranges: [{
        low: 9
      }]
    })).resolves.toEqual([{
      low: 9,
      hi: 10
    }]);
  });

  test('logs and rethrows adapter errors', async () => {
    const adapter = new MemoryAdapter();
    const logger = jest.fn();
    const failing = new DB(null, logger, adapter);
    await failing.initDatabase();
    jest.spyOn(adapter, 'getUsers').mockRejectedValue(new Error('boom'));
    await expect(failing.mapUsers()).rejects.toThrow('boom');
    expect(logger).toHaveBeenCalledWith('PCache', 'mapUsers', expect.any(Error));
  });

  test('reports open failure to onError', async () => {
    const adapter = new MemoryAdapter();
    const onError = jest.fn();
    jest.spyOn(adapter, 'open').mockRejectedValue(new Error('denied'));
    const failing = new DB(onError, null, adapter);
    await expect(failing.initDatabase()).rejects.toThrow('denied');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(failing.isReady()).toBe(false);
  });
});
