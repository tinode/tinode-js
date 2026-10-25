/**
 * @file Key-value storage adapter for the persistent cache, e.g. for AsyncStorage or MMKV.
 *
 * @copyright 2015-2026 Tinode LLC.
 */
'use strict';

import MemoryAdapter from './memory-adapter.js';

const DEFAULT_PREFIX = 'tinode';
const DATE_KEYS = ['ts', 'touched', 'updated', 'created', 'when', 'deleted', 'expires'];

function reviveDate(key, val) {
  if (typeof val == 'string' && val.length >= 20 && val.length <= 24 && DATE_KEYS.includes(key)) {
    const date = new Date(val);
    if (!isNaN(date)) {
      return date;
    }
  }
  return val;
}

function parse(raw) {
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw, reviveDate);
  } catch (err) {
    return undefined;
  }
}

function isObject(value) {
  return typeof value == 'object' && value !== null;
}

function isTopicRecord(value) {
  return isObject(value) && typeof value.name == 'string';
}

function isUserRecord(value) {
  return isObject(value) && typeof value.uid == 'string';
}

function isSubscriptionRecord(value) {
  return isObject(value) && typeof value.topic == 'string' && typeof value.uid == 'string';
}

function isMessageRecord(value) {
  return isObject(value) && typeof value.topic == 'string' && typeof value.seq == 'number';
}

function isDelLogRecord(value) {
  return isObject(value) && typeof value.topic == 'string' && typeof value.clear == 'number' &&
    typeof value.low == 'number' && typeof value.hi == 'number';
}

/**
 * Wrap an MMKV instance into a key-value store usable by {@link Tinode.KeyValueAdapter}.
 * Works with MMKV v3 (<code>delete</code>) and v4 (<code>remove</code>).
 * @memberof Tinode
 * @param {Object} mmkv - MMKV instance.
 * @returns {Object} key-value store.
 */
export function fromMMKV(mmkv) {
  return {
    getItem: key => mmkv.getString(key),
    setItem: (key, value) => mmkv.set(key, value),
    removeItem: key => 'remove' in mmkv ? mmkv.remove(key) : mmkv.delete(key),
    getAllKeys: _ => mmkv.getAllKeys()
  };
}

/**
 * Storage adapter which keeps data in memory and writes every change through to a key-value store,
 * such as AsyncStorage, MMKV (see {@link Tinode.fromMMKV}) or <code>localStorage</code>.
 * The store must have <code>getItem</code>, <code>setItem</code>, <code>removeItem</code> and
 * <code>getAllKeys</code>, and may have <code>getMany</code> or <code>multiGet</code> for faster loading.
 * Store methods may be synchronous or return promises.
 *
 * @class KeyValueAdapter
 * @memberof Tinode
 * @extends Tinode.MemoryAdapter
 *
 * @param {Object} store - key-value store.
 * @param {Object=} options - adapter options.
 * @param {string=} options.prefix - prefix of all keys written by the adapter, <code>'tinode'</code> by default.
 */
export default class KeyValueAdapter extends MemoryAdapter {
  #store;
  #prefix;
  #queue = Promise.resolve();

  constructor(store, options) {
    super();
    this.#store = store;
    this.#prefix = ((options && options.prefix) || DEFAULT_PREFIX) + '/';
  }

  open() {
    return this.#enqueue(async _ => {
      const keys = (await this.#store.getAllKeys()).filter(key => key.startsWith(this.#prefix));
      for (const [key, raw] of await this.#readAll(keys)) {
        await this.#restore(key.slice(this.#prefix.length), parse(raw));
      }
      await super.open();
    });
  }

  destroy() {
    return this.#write(super.destroy(), _ => this.#removeWhere(_ => true));
  }

  putTopic(record) {
    return this.#write(super.putTopic(record), _ => this.#save(`topic/${record.name}`, record));
  }

  removeTopic(name) {
    return this.#write(super.removeTopic(name), _ => this.#removeWhere(path => path == `topic/${name}` ||
      path.startsWith(`sub/${name}/`) ||
      path.startsWith(`msg/${name}/`) ||
      path.startsWith(`del/${name}/`)));
  }

  putUser(record) {
    return this.#write(super.putUser(record), _ => this.#save(`user/${record.uid}`, record));
  }

  removeUser(uid) {
    return this.#write(super.removeUser(uid), _ => this.#store.removeItem(this.#prefix + `user/${uid}`));
  }

  putSubscription(record) {
    return this.#write(super.putSubscription(record), _ => this.#save(`sub/${record.topic}/${record.uid}`, record));
  }

  removeSubscription(topic, uid) {
    return this.#write(super.removeSubscription(topic, uid), _ => this.#store.removeItem(this.#prefix + `sub/${topic}/${uid}`));
  }

  putMessage(record) {
    return this.#write(super.putMessage(record), _ => this.#save(`msg/${record.topic}/${record.seq}`, record));
  }

  updateMessageStatus(topic, seq, status) {
    return this.#write(super.updateMessageStatus(topic, seq, status), async _ => {
      const [record] = await super.readMessageRanges(topic, [{
        low: seq
      }]);
      if (record) {
        await this.#save(`msg/${topic}/${seq}`, record);
      }
    });
  }

  removeMessages(topic, low, hi) {
    const messages = `msg/${topic}/`;
    return this.#write(super.removeMessages(topic, low, hi), _ => this.#removeWhere(path => {
      if (!path.startsWith(messages)) {
        return false;
      }
      const seq = Number(path.slice(messages.length));
      return seq >= low && seq < hi;
    }));
  }

  addDelLog(records) {
    return this.#write(super.addDelLog(records), async _ => {
      for (const record of records) {
        await this.#save(`del/${record.topic}/${record.low}/${record.hi}`, record);
      }
    });
  }

  #enqueue(task) {
    const result = this.#queue.then(task);
    this.#queue = result.catch(_ => {});
    return result;
  }

  #write(changed, persist) {
    return this.#enqueue(_ => changed.then(persist));
  }

  async #readAll(keys) {
    if (typeof this.#store.getMany == 'function') {
      const values = await this.#store.getMany(keys);
      return keys.map(key => [key, values[key]]);
    }
    if (typeof this.#store.multiGet == 'function') {
      return this.#store.multiGet(keys);
    }
    const pairs = [];
    for (const key of keys) {
      pairs.push([key, await this.#store.getItem(key)]);
    }
    return pairs;
  }

  async #restore(path, value) {
    switch (path.slice(0, path.indexOf('/'))) {
      case 'topic':
        if (isTopicRecord(value)) {
          await super.putTopic(value);
        }
        break;
      case 'user':
        if (isUserRecord(value)) {
          await super.putUser(value);
        }
        break;
      case 'sub':
        if (isSubscriptionRecord(value)) {
          await super.putSubscription(value);
        }
        break;
      case 'msg':
        if (isMessageRecord(value)) {
          await super.putMessage(value);
        }
        break;
      case 'del':
        if (isDelLogRecord(value)) {
          await super.addDelLog([value]);
        }
        break;
    }
  }

  async #save(path, record) {
    await this.#store.setItem(this.#prefix + path, JSON.stringify(record));
  }

  async #removeWhere(matches) {
    for (const key of await this.#store.getAllKeys()) {
      if (key.startsWith(this.#prefix) && matches(key.slice(this.#prefix.length))) {
        await this.#store.removeItem(key);
      }
    }
  }
}
