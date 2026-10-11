import 'fake-indexeddb/auto';
import * as fakeIndexedDB from 'fake-indexeddb';
import IndexedDBAdapter from './indexeddb-adapter.js';
import MemoryAdapter from './memory-adapter.js';
import {
  MAX_SEQ
} from './storage-adapter.js';

const everything = {
  since: 0,
  before: MAX_SEQ,
  limit: 0
};

function message(topic, seq) {
  return {
    topic,
    seq,
    content: `m${seq}`
  };
}

describe.each([
  ['MemoryAdapter', () => new MemoryAdapter()],
  ['IndexedDBAdapter', () => new IndexedDBAdapter()],
])('%s', (_name, create) => {
  let adapter;

  beforeEach(async () => {
    adapter = create();
    await adapter.open();
    await adapter.destroy();
    await adapter.open();
  });

  afterEach(async () => {
    await adapter.destroy();
  });

  test('should report open state', async () => {
    expect(adapter.isOpen()).toBe(true);
    await adapter.close();
    expect(adapter.isOpen()).toBe(false);
  });

  test('should drop all data on destroy', async () => {
    await adapter.putTopic({
      name: 'grpA'
    });
    await adapter.destroy();
    await adapter.open();
    expect(await adapter.getTopics()).toEqual([]);
  });

  test('should store a copy of the topic', async () => {
    const record = {
      name: 'grpA',
      seq: 3
    };
    await adapter.putTopic(record);
    record.seq = 10;
    expect(await adapter.getTopic('grpA')).toEqual({
      name: 'grpA',
      seq: 3
    });
    expect(await adapter.getTopic('nope')).toBeUndefined();
    expect(await adapter.getTopics()).toHaveLength(1);
  });

  test('should store and remove users', async () => {
    await adapter.putUser({
      uid: 'usr1',
      public: {
        fn: 'A'
      }
    });
    expect(await adapter.getUser('usr1')).toEqual({
      uid: 'usr1',
      public: {
        fn: 'A'
      }
    });
    expect(await adapter.getUsers()).toHaveLength(1);
    await adapter.removeUser('usr1');
    expect(await adapter.getUser('usr1')).toBeUndefined();
  });

  test('should keep subscriptions per topic', async () => {
    await adapter.putSubscription({
      topic: 'grpA',
      uid: 'usr1',
      mode: 'JRWP'
    });
    await adapter.putSubscription({
      topic: 'grpA',
      uid: 'usr2'
    });
    await adapter.putSubscription({
      topic: 'grpB',
      uid: 'usr1'
    });
    expect(await adapter.getSubscriptions('grpA')).toHaveLength(2);
    expect(await adapter.getSubscription('grpA', 'usr1')).toEqual({
      topic: 'grpA',
      uid: 'usr1',
      mode: 'JRWP'
    });
    await adapter.removeSubscription('grpA', 'usr1');
    expect(await adapter.getSubscriptions('grpA')).toHaveLength(1);
    expect(await adapter.getSubscriptions('none')).toEqual([]);
  });

  test('should read a window of messages newest first with limit', async () => {
    for (let seq = 1; seq <= 6; seq++) {
      await adapter.putMessage(message('grpA', seq));
    }
    await adapter.putMessage(message('grpB', 2));
    const all = await adapter.readMessages('grpA', everything);
    expect(all.map(m => m.seq)).toEqual([6, 5, 4, 3, 2, 1]);
    const limited = await adapter.readMessages('grpA', {
      since: 0,
      before: MAX_SEQ,
      limit: 2
    });
    expect(limited.map(m => m.seq)).toEqual([6, 5]);
    const window = await adapter.readMessages('grpA', {
      since: 2,
      before: 5,
      limit: 0
    });
    expect(window.map(m => m.seq)).toEqual([4, 3, 2]);
    expect(await adapter.readMessages('grpA', {
      since: 5,
      before: 5,
      limit: 0
    })).toEqual([]);
  });

  test('should read half-open message ranges', async () => {
    for (let seq = 1; seq <= 6; seq++) {
      await adapter.putMessage(message('grpA', seq));
    }
    const result = await adapter.readMessageRanges('grpA', [{
      low: 2,
      hi: 4
    }, {
      low: 6
    }, {
      low: 5,
      hi: 5
    }]);
    expect(result.map(m => m.seq)).toEqual([2, 3, 6]);
  });

  test('should update message status and remove messages', async () => {
    for (let seq = 1; seq <= 5; seq++) {
      await adapter.putMessage(message('grpA', seq));
    }
    await adapter.updateMessageStatus('grpA', 2, 7);
    await adapter.updateMessageStatus('grpA', 99, 7);
    const [second] = await adapter.readMessageRanges('grpA', [{
      low: 2
    }]);
    expect(second._status).toBe(7);
    await adapter.removeMessages('grpA', 2, 4);
    const left = await adapter.readMessages('grpA', everything);
    expect(left.map(m => m.seq)).toEqual([5, 4, 1]);
  });

  test('should read the delete log', async () => {
    await adapter.addDelLog([{
      topic: 'grpA',
      clear: 1,
      low: 2,
      hi: 4
    }, {
      topic: 'grpA',
      clear: 2,
      low: 10,
      hi: 11
    }, {
      topic: 'grpA',
      clear: 2,
      low: 20,
      hi: 25
    }]);
    expect(await adapter.maxDelId('grpA')).toBe(2);
    expect(await adapter.maxDelId('grpB')).toBe(0);
    expect(await adapter.readDelLog('grpA', everything)).toEqual([{
      low: 20,
      hi: 25
    }, {
      low: 10,
      hi: 11
    }, {
      low: 2,
      hi: 4
    }]);
    expect(await adapter.readDelLog('grpA', {
      since: 0,
      before: MAX_SEQ,
      limit: 5
    })).toEqual([{
      low: 20,
      hi: 25
    }]);
    expect(await adapter.readDelLog('grpA', {
      since: 3,
      before: 12,
      limit: 0
    })).toEqual([{
      low: 10,
      hi: 11
    }, {
      low: 2,
      hi: 4
    }]);
    expect(await adapter.readDelLogRanges('grpA', [{
      low: 10
    }, {
      low: 3,
      hi: 6
    }])).toEqual([{
      low: 10,
      hi: 11
    }, {
      low: 2,
      hi: 4
    }]);
  });

  test('should remove topic with its subscriptions, messages and delete log', async () => {
    await adapter.putTopic({
      name: 'grpA'
    });
    await adapter.putSubscription({
      topic: 'grpA',
      uid: 'usr1'
    });
    await adapter.putMessage(message('grpA', 1));
    await adapter.addDelLog([{
      topic: 'grpA',
      clear: 3,
      low: 1,
      hi: 2
    }]);
    await adapter.putTopic({
      name: 'grpB'
    });
    await adapter.putMessage(message('grpB', 1));
    await adapter.removeTopic('grpA');
    expect(await adapter.getTopic('grpA')).toBeUndefined();
    expect(await adapter.getSubscriptions('grpA')).toEqual([]);
    expect(await adapter.readMessages('grpA', everything)).toEqual([]);
    expect(await adapter.maxDelId('grpA')).toBe(0);
    expect(await adapter.readMessages('grpB', everything)).toHaveLength(1);
  });
});

describe('IndexedDBAdapter provider', () => {
  async function withoutGlobals(run) {
    const {
      indexedDB,
      IDBKeyRange
    } = globalThis;
    delete globalThis.indexedDB;
    delete globalThis.IDBKeyRange;
    try {
      return await run();
    } finally {
      globalThis.indexedDB = indexedDB;
      globalThis.IDBKeyRange = IDBKeyRange;
    }
  }

  async function roundTrip(adapter) {
    await adapter.open();
    await adapter.putMessage(message('grpA', 1));
    await adapter.putMessage(message('grpA', 2));
    const messages = await adapter.readMessages('grpA', everything);
    await adapter.removeTopic('grpA');
    await adapter.destroy();
    return messages.map(m => m.seq);
  }

  test('should accept an indexedDB factory', async () => {
    expect(await roundTrip(new IndexedDBAdapter(fakeIndexedDB.indexedDB))).toEqual([2, 1]);
  });

  test('should accept the fake-indexeddb module', async () => {
    const seqs = await withoutGlobals(() => roundTrip(new IndexedDBAdapter(fakeIndexedDB)));
    expect(seqs).toEqual([2, 1]);
  });

  test('should accept a factory with a key range', async () => {
    const seqs = await withoutGlobals(() => roundTrip(new IndexedDBAdapter({
      factory: fakeIndexedDB.indexedDB,
      keyRange: fakeIndexedDB.IDBKeyRange
    })));
    expect(seqs).toEqual([2, 1]);
  });

  test('should not be supported without indexedDB', async () => {
    expect(IndexedDBAdapter.isSupported()).toBe(true);
    await withoutGlobals(() => {
      expect(IndexedDBAdapter.isSupported()).toBe(false);
      expect(IndexedDBAdapter.isSupported(fakeIndexedDB.indexedDB)).toBe(false);
      expect(IndexedDBAdapter.isSupported(fakeIndexedDB)).toBe(true);
    });
  });
});
