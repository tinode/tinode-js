import KeyValueAdapter, {
  fromMMKV
} from './key-value-adapter.js';
import {
  MAX_SEQ
} from './storage-adapter.js';

const everything = {
  since: 0,
  before: MAX_SEQ,
  limit: 0
};

class SyncStore {
  data = new Map();
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  setItem(key, value) {
    this.data.set(key, value);
  }
  removeItem(key) {
    this.data.delete(key);
  }
  getAllKeys() {
    return [...this.data.keys()];
  }
}

class AsyncStore {
  data = new Map();
  getItemCalls = 0;
  multiGetCalls = 0;
  async getItem(key) {
    this.getItemCalls++;
    return this.data.has(key) ? this.data.get(key) : null;
  }
  async setItem(key, value) {
    this.data.set(key, value);
  }
  async removeItem(key) {
    this.data.delete(key);
  }
  async getAllKeys() {
    return [...this.data.keys()];
  }
  async multiGet(keys) {
    this.multiGetCalls++;
    return keys.map(key => [key, this.data.has(key) ? this.data.get(key) : null]);
  }
}

class GetManyStore extends SyncStore {
  getManyCalls = 0;
  getItem(key) {
    throw new Error("getItem should not be used for loading");
  }
  async getMany(keys) {
    this.getManyCalls++;
    const values = {};
    keys.forEach(key => {
      values[key] = this.data.has(key) ? this.data.get(key) : null;
    });
    return values;
  }
}

class FakeMMKV {
  data = new Map();
  getString(key) {
    return this.data.get(key);
  }
  set(key, value) {
    this.data.set(key, String(value));
  }
  getAllKeys() {
    return [...this.data.keys()];
  }
}

class FakeMMKVv3 extends FakeMMKV {
  delete(key) {
    this.data.delete(key);
  }
}

class FakeMMKVv4 extends FakeMMKV {
  remove(key) {
    return this.data.delete(key);
  }
}

async function openOn(store, prefix) {
  const adapter = new KeyValueAdapter(store, {
    prefix
  });
  await adapter.open();
  return adapter;
}

async function seed(adapter) {
  await adapter.putTopic({
    name: 'grpA',
    seq: 3,
    updated: new Date('2026-10-01T10:00:00.000Z')
  });
  await adapter.putUser({
    uid: 'usr1',
    public: {
      fn: 'Alice'
    }
  });
  await adapter.putSubscription({
    topic: 'grpA',
    uid: 'usr1',
    lastSeen: {
      when: new Date('2026-10-02T08:30:00.000Z')
    }
  });
  for (let seq = 1; seq <= 3; seq++) {
    await adapter.putMessage({
      topic: 'grpA',
      seq,
      ts: new Date(`2026-10-03T0${seq}:00:00.000Z`),
      content: `m${seq}`
    });
  }
  await adapter.addDelLog([{
    topic: 'grpA',
    clear: 1,
    low: 10,
    hi: 12
  }]);
}

describe('KeyValueAdapter', () => {
  test('should restore saved data when reopened on the same store', async () => {
    const store = new SyncStore();
    await seed(await openOn(store));

    const reopened = await openOn(store);

    expect(await reopened.getTopic('grpA')).toEqual({
      name: 'grpA',
      seq: 3,
      updated: new Date('2026-10-01T10:00:00.000Z')
    });
    expect(await reopened.getUser('usr1')).toEqual({
      uid: 'usr1',
      public: {
        fn: 'Alice'
      }
    });
    const [sub] = await reopened.getSubscriptions('grpA');
    expect(sub.lastSeen).toEqual({
      when: new Date('2026-10-02T08:30:00.000Z')
    });
    const messages = await reopened.readMessages('grpA', everything);
    expect(messages.map(m => m.seq)).toEqual([3, 2, 1]);
    expect(messages[0].ts).toEqual(new Date('2026-10-03T03:00:00.000Z'));
    expect(await reopened.maxDelId('grpA')).toBe(1);
  });

  test('should save message status changes', async () => {
    const store = new SyncStore();
    const adapter = await openOn(store);
    await adapter.putMessage({
      topic: 'grpA',
      seq: 1,
      _status: 20
    });

    await adapter.updateMessageStatus('grpA', 1, 50);

    const reopened = await openOn(store);
    const [message] = await reopened.readMessageRanges('grpA', [{
      low: 1
    }]);
    expect(message._status).toBe(50);
  });

  test('should remove stored messages in the half-open range only', async () => {
    const store = new SyncStore();
    const adapter = await openOn(store);
    for (let seq = 1; seq <= 5; seq++) {
      await adapter.putMessage({
        topic: 'grpA',
        seq
      });
    }
    await adapter.putMessage({
      topic: 'grpAB',
      seq: 3
    });

    await adapter.removeMessages('grpA', 2, 4);

    expect([...store.data.keys()].sort()).toEqual([
      'tinode/msg/grpA/1',
      'tinode/msg/grpA/4',
      'tinode/msg/grpA/5',
      'tinode/msg/grpAB/3'
    ]);
  });

  test('should leave other topics and other prefixes alone on removeTopic and destroy', async () => {
    const store = new SyncStore();
    store.setItem('theme', 'dark');
    const other = await openOn(store, 'other');
    await other.putTopic({
      name: 'grpA'
    });
    const adapter = await openOn(store);
    await seed(adapter);
    await adapter.putTopic({
      name: 'grpAB'
    });

    await adapter.removeTopic('grpA');
    expect([...store.data.keys()].sort()).toEqual([
      'other/topic/grpA',
      'theme',
      'tinode/topic/grpAB',
      'tinode/user/usr1'
    ]);

    await adapter.destroy();
    expect([...store.data.keys()].sort()).toEqual([
      'other/topic/grpA',
      'theme'
    ]);
  });

  test('should skip records which cannot be read on open', async () => {
    const store = new SyncStore();
    store.setItem('tinode/topic/grpA', '{not json');
    store.setItem('tinode/msg/grpA/1', JSON.stringify({
      topic: 'grpA'
    }));
    store.setItem('tinode/topic/grpB', JSON.stringify({
      name: 'grpB'
    }));

    const adapter = await openOn(store);

    expect(await adapter.getTopics()).toEqual([{
      name: 'grpB'
    }]);
    expect(await adapter.readMessages('grpA', everything)).toEqual([]);
  });

  test('should load with one multiGet call when the store has multiGet', async () => {
    const store = new AsyncStore();
    await seed(await openOn(store));
    store.getItemCalls = 0;
    store.multiGetCalls = 0;

    const reopened = await openOn(store);

    expect(store.multiGetCalls).toBe(1);
    expect(store.getItemCalls).toBe(0);
    expect(await reopened.readMessages('grpA', everything)).toHaveLength(3);
  });

  test('should load with one getMany call when the store has getMany', async () => {
    const store = new GetManyStore();
    await seed(await openOn(store));
    store.getManyCalls = 0;

    const reopened = await openOn(store);

    expect(store.getManyCalls).toBe(1);
    expect(await reopened.getTopics()).toHaveLength(1);
  });
});

describe('fromMMKV', () => {
  test.each([
    ['v3 with delete', () => new FakeMMKVv3()],
    ['v4 with remove', () => new FakeMMKVv4()]
  ])('should work with MMKV %s', async (_name, create) => {
    const mmkv = create();
    const adapter = await openOn(fromMMKV(mmkv));
    await seed(adapter);
    await adapter.removeUser('usr1');

    const reopened = await openOn(fromMMKV(mmkv));

    expect(await reopened.getUser('usr1')).toBeUndefined();
    expect(await reopened.readMessages('grpA', everything)).toHaveLength(3);
    expect(mmkv.data.has('tinode/user/usr1')).toBe(false);
  });
});
