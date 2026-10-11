/**
 * @file IndexedDB storage adapter for the persistent cache.
 *
 * @copyright 2015-2026 Tinode LLC.
 */
'use strict';

import {
  MAX_SEQ
} from './storage-adapter.js';

const DB_VERSION = 3;
const DB_NAME = 'tinode-web';

function resolveProvider(provider) {
  if (!provider) {
    return {
      factory: globalThis.indexedDB,
      keyRange: globalThis.IDBKeyRange
    };
  }
  if (provider.factory) {
    return {
      factory: provider.factory,
      keyRange: provider.keyRange
    };
  }
  if (provider.indexedDB) {
    return {
      factory: provider.indexedDB,
      keyRange: provider.IDBKeyRange || globalThis.IDBKeyRange
    };
  }
  return {
    factory: provider,
    keyRange: globalThis.IDBKeyRange
  };
}

function isNonEmptyRange(range) {
  return !range.hi || range.hi > range.low;
}

function delLogRange(record) {
  return {
    low: record.low,
    hi: record.hi
  };
}

function createStores(db) {
  if (!db.objectStoreNames.contains('topic')) {
    db.createObjectStore('topic', {
      keyPath: 'name'
    });
  }

  if (!db.objectStoreNames.contains('user')) {
    db.createObjectStore('user', {
      keyPath: 'uid'
    });
  }

  if (!db.objectStoreNames.contains('subscription')) {
    db.createObjectStore('subscription', {
      keyPath: ['topic', 'uid']
    });
  }

  if (!db.objectStoreNames.contains('message')) {
    db.createObjectStore('message', {
      keyPath: ['topic', 'seq']
    });
  }

  if (!db.objectStoreNames.contains('dellog')) {
    const dellog = db.createObjectStore('dellog', {
      keyPath: ['topic', 'low', 'hi']
    });
    if (!dellog.indexNames.contains('topic_clear')) {
      dellog.createIndex('topic_clear', ['topic', 'clear'], {
        unique: false
      });
    }
  }
}

/**
 * Storage adapter which keeps data in IndexedDB. Uses the same database as {@link Tinode.DB}.
 *
 * @class IndexedDBAdapter
 * @memberof Tinode
 * @implements {Tinode.StorageAdapter}
 *
 * @param {Object=} provider - IndexedDB implementation: an <code>indexedDB</code> factory,
 *    an object with <code>indexedDB</code> and optional <code>IDBKeyRange</code> (e.g. <code>require('fake-indexeddb')</code>),
 *    or <code>{factory, keyRange}</code>. Uses the global <code>indexedDB</code> and <code>IDBKeyRange</code> if missing.
 */
export default class IndexedDBAdapter {
  #factory = null;
  #keyRange = null;
  #db = null;

  constructor(provider) {
    const {
      factory,
      keyRange
    } = resolveProvider(provider);
    this.#factory = factory || null;
    this.#keyRange = keyRange || null;
  }

  /**
   * Check if IndexedDB can be used.
   * @static
   * @memberof Tinode.IndexedDBAdapter
   * @param {Object=} provider - IndexedDB implementation, same as in the constructor.
   * @returns {boolean} <code>true</code> if both the factory and the key range are available.
   */
  static isSupported(provider) {
    const {
      factory,
      keyRange
    } = resolveProvider(provider);
    return !!factory && typeof factory.open == 'function' && !!keyRange && typeof keyRange.bound == 'function';
  }

  open() {
    if (this.#db) {
      return Promise.resolve();
    }
    if (!this.#factory) {
      return Promise.reject(new Error("IndexedDB is not available"));
    }
    return new Promise((resolve, reject) => {
      const req = this.#factory.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = event => {
        createStores(event.target.result);
      };
      req.onerror = event => {
        reject(event.target.error);
      };
      req.onsuccess = event => {
        const db = event.target.result;
        db.onversionchange = _ => {
          db.close();
          if (this.#db == db) {
            this.#db = null;
          }
        };
        this.#db = db;
        resolve();
      };
    });
  }

  close() {
    if (this.#db) {
      this.#db.close();
      this.#db = null;
    }
    return Promise.resolve();
  }

  destroy() {
    this.close();
    if (!this.#factory) {
      return Promise.reject(new Error("IndexedDB is not available"));
    }
    return new Promise((resolve, reject) => {
      const req = this.#factory.deleteDatabase(DB_NAME);
      req.onblocked = _ => {
        reject(new Error("blocked"));
      };
      req.onsuccess = _ => {
        resolve();
      };
      req.onerror = event => {
        reject(event.target.error);
      };
    });
  }

  isOpen() {
    return !!this.#db;
  }

  getTopics() {
    return this.#getAll('topic');
  }

  getTopic(name) {
    return this.#get('topic', name);
  }

  putTopic(record) {
    return this.#put('topic', record);
  }

  removeTopic(name) {
    return this.#exec(['topic', 'subscription', 'message', 'dellog'], 'readwrite', trx => {
      trx.objectStore('topic').delete(this.#keyRange.only(name));
      trx.objectStore('subscription').delete(this.#keyRange.bound([name, '-'], [name, '~']));
      trx.objectStore('message').delete(this.#keyRange.bound([name, 0], [name, MAX_SEQ]));
      trx.objectStore('dellog').delete(this.#keyRange.bound([name, 0, 0], [name, MAX_SEQ, MAX_SEQ]));
    });
  }

  getUsers() {
    return this.#getAll('user');
  }

  getUser(uid) {
    return this.#get('user', uid);
  }

  putUser(record) {
    return this.#put('user', record);
  }

  removeUser(uid) {
    return this.#delete('user', uid);
  }

  getSubscriptions(topic) {
    return this.#getAll('subscription', this.#keyRange.bound([topic, '-'], [topic, '~']));
  }

  getSubscription(topic, uid) {
    return this.#get('subscription', [topic, uid]);
  }

  putSubscription(record) {
    return this.#put('subscription', record);
  }

  removeSubscription(topic, uid) {
    return this.#delete('subscription', [topic, uid]);
  }

  putMessage(record) {
    return this.#put('message', record);
  }

  updateMessageStatus(topic, seq, status) {
    return this.#exec(['message'], 'readwrite', trx => {
      const store = trx.objectStore('message');
      store.get([topic, seq]).onsuccess = event => {
        const record = event.target.result;
        if (record && record._status != status) {
          record._status = status;
          store.put(record);
        }
      };
    });
  }

  removeMessages(topic, low, hi) {
    if (hi <= low) {
      return Promise.resolve();
    }
    return this.#exec(['message'], 'readwrite', trx => {
      trx.objectStore('message').delete(this.#keyRange.bound([topic, low], [topic, hi], false, true));
    });
  }

  readMessages(topic, window) {
    if (window.since >= window.before) {
      return Promise.resolve([]);
    }
    const result = [];
    return this.#exec(['message'], 'readonly', trx => {
      const range = this.#keyRange.bound([topic, window.since], [topic, window.before], false, true);
      trx.objectStore('message').openCursor(range, 'prev').onsuccess = event => {
        const cursor = event.target.result;
        if (!cursor) {
          return;
        }
        result.push(cursor.value);
        if (window.limit <= 0 || result.length < window.limit) {
          cursor.continue();
        }
      };
    }).then(_ => result);
  }

  readMessageRanges(topic, ranges) {
    const found = [];
    return this.#exec(['message'], 'readonly', trx => {
      ranges.filter(isNonEmptyRange).forEach((range, index) => {
        const key = range.hi ? this.#keyRange.bound([topic, range.low], [topic, range.hi], false, true) :
          this.#keyRange.only([topic, range.low]);
        trx.objectStore('message').getAll(key).onsuccess = event => {
          found[index] = event.target.result;
        };
      });
    }).then(_ => found.flat());
  }

  addDelLog(records) {
    if (records.length == 0) {
      return Promise.resolve();
    }
    return this.#exec(['dellog'], 'readwrite', trx => {
      const store = trx.objectStore('dellog');
      records.forEach(record => {
        store.put(record);
      });
    });
  }

  readDelLog(topic, window) {
    if (window.since >= window.before) {
      return Promise.resolve([]);
    }
    const result = [];
    let count = 0;
    return this.#exec(['dellog'], 'readonly', trx => {
      const range = this.#keyRange.bound([topic, 0, 0], [topic, window.before, 0], false, true);
      trx.objectStore('dellog').openCursor(range, 'prev').onsuccess = event => {
        const cursor = event.target.result;
        if (!cursor) {
          return;
        }
        const record = cursor.value;
        if (record.hi > window.since) {
          result.push(delLogRange(record));
          count += record.hi - record.low;
        }
        if (window.limit <= 0 || count < window.limit) {
          cursor.continue();
        }
      };
    }).then(_ => result);
  }

  readDelLogRanges(topic, ranges) {
    const found = [];
    return this.#exec(['dellog'], 'readonly', trx => {
      ranges.forEach((range, index) => {
        const hi = range.hi || range.low + 1;
        const key = this.#keyRange.bound([topic, 0, 0], [topic, hi, 0], false, true);
        trx.objectStore('dellog').getAll(key).onsuccess = event => {
          found[index] = event.target.result
            .filter(record => record.hi > range.low)
            .map(delLogRange);
        };
      });
    }).then(_ => found.flat());
  }

  maxDelId(topic) {
    let clear = 0;
    return this.#exec(['dellog'], 'readonly', trx => {
      const range = this.#keyRange.bound([topic, 0], [topic, MAX_SEQ]);
      trx.objectStore('dellog').index('topic_clear').openCursor(range, 'prev').onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          clear = cursor.value.clear;
        }
      };
    }).then(_ => clear);
  }

  #exec(stores, mode, action) {
    if (!this.#db) {
      return Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.#db.transaction(stores, mode);
      trx.oncomplete = _ => {
        resolve();
      };
      trx.onerror = event => {
        reject(event.target.error);
      };
      trx.onabort = _ => {
        reject(trx.error || new Error("aborted"));
      };
      action(trx);
    });
  }

  #get(source, key) {
    let record;
    return this.#exec([source], 'readonly', trx => {
      trx.objectStore(source).get(key).onsuccess = event => {
        record = event.target.result;
      };
    }).then(_ => record);
  }

  #getAll(source, range) {
    let records = [];
    return this.#exec([source], 'readonly', trx => {
      trx.objectStore(source).getAll(range).onsuccess = event => {
        records = event.target.result;
      };
    }).then(_ => records);
  }

  #put(source, record) {
    return this.#exec([source], 'readwrite', trx => {
      trx.objectStore(source).put(record);
    });
  }

  #delete(source, key) {
    return this.#exec([source], 'readwrite', trx => {
      trx.objectStore(source).delete(key);
    });
  }
}
