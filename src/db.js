/**
 * @file Helper methods for dealing with IndexedDB cache of messages, users, and topics.
 *
 * @copyright 2015-2025 Tinode LLC.
 */
'use strict';

// NOTE TO DEVELOPERS:
// Localizable strings should be double quoted "строка на другом языке",
// non-localizable strings should be single quoted 'non-localized'.

const DB_VERSION = 3;
const DB_NAME = 'tinode-web';

let IDBProvider;

export default class DB {
  #onError = _ => {};
  #logger = _ => {};

  // Instance of IndexDB.
  db = null;
  // Indicator that the cache is disabled.
  disabled = true;

  constructor(onError, logger) {
    this.#onError = onError || this.#onError;
    this.#logger = logger || this.#logger;
  }

  #mapObjects(source, callback, context) {
    if (!this.db) {
      return disabled ?
        Promise.resolve([]) :
        Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction([source]);
      trx.onerror = event => {
        this.#logger('PCache', 'mapObjects', source, event.target.error);
        reject(event.target.error);
      };
      trx.objectStore(source).getAll().onsuccess = event => {
        if (callback) {
          event.target.result.forEach(topic => {
            callback.call(context, topic);
          });
        }
        resolve(event.target.result);
      };
    });
  }

  /**
   * Initialize persistent cache: open or create/upgrade if needed.
   * @returns {Promise} promise to be resolved/rejected when the DB is initialized.
   */
  initDatabase() {
    return new Promise((resolve, reject) => {
      // Open the database and initialize callbacks.
      const req = IDBProvider.open(DB_NAME, DB_VERSION);
      req.onsuccess = event => {
        this.db = event.target.result;
        this.disabled = false;
        resolve(this.db);
      };
      req.onerror = event => {
        this.#logger('PCache', "failed to initialize", event);
        reject(event.target.error);
        this.#onError(event.target.error);
      };
      req.onupgradeneeded = event => {
        this.db = event.target.result;

        this.db.onerror = event => {
          this.#logger('PCache', "failed to create storage", event);
          this.#onError(event.target.error);
        };

        // Individual object stores.
        // Object store (table) for topics. The primary key is topic name.
        this.db.createObjectStore('topic', {
          keyPath: 'name'
        });

        // Users object store. UID is the primary key.
        this.db.createObjectStore('user', {
          keyPath: 'uid'
        });

        // Subscriptions object store topic <-> user. Topic name + UID is the primary key.
        this.db.createObjectStore('subscription', {
          keyPath: ['topic', 'uid']
        });

        // Messages object store. The primary key is topic name + seq.
        this.db.createObjectStore('message', {
          keyPath: ['topic', 'seq']
        });

        // Records of deleted message ranges. The primary key is topic name + low seq.
        const dellog = this.db.createObjectStore('dellog', {
          keyPath: ['topic', 'low', 'hi']
        });
        dellog.createIndex('topic_clear', ['topic', 'clear'], {
          unique: false
        });
      };
    });
  }

  /**
   * Delete persistent cache.
   */
  deleteDatabase() {
    // Close connection, otherwise operations will fail with 'onblocked'.
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    return new Promise((resolve, reject) => {
      const req = IDBProvider.deleteDatabase(DB_NAME);
      req.onblocked = _ => {
        if (this.db) {
          this.db.close();
        }
        const err = new Error("blocked");
        this.#logger('PCache', 'deleteDatabase', err);
        reject(err);
      };
      req.onsuccess = _ => {
        this.db = null;
        this.disabled = true;
        resolve(true);
      };
      req.onerror = event => {
        this.#logger('PCache', 'deleteDatabase', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Check if persistent cache is ready for use.
   * @memberOf DB
   * @returns {boolean} <code>true</code> if cache is ready, <code>false</code> otherwise.
   */
  isReady() {
    return !!this.db;
  }

  // Topics.

  /**
   * Save to cache or update topic in persistent cache.
   * @memberOf DB
   * @param {Topic} topic - topic to be added or updated.
   * @returns {Promise} promise resolved/rejected on operation completion.
   */
  updTopic(topic) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['topic'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'updTopic', event.target.error);
        reject(event.target.error);
      };
      const req = trx.objectStore('topic').get(topic.name);
      req.onsuccess = _ => {
        trx.objectStore('topic').put(DB.#serializeTopic(req.result, topic));
        trx.commit();
      };
    });
  }

  /**
   * Mark or unmark topic as deleted.
   * @memberOf DB
   * @param {string} name - name of the topic to mark or unmark.
   * @param {boolean} deleted - status
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  markTopicAsDeleted(name, deleted) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['topic'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'markTopicAsDeleted', event.target.error);
        reject(event.target.error);
      };
      const req = trx.objectStore('topic').get(name);
      req.onsuccess = event => {
        const topic = event.target.result;
        if (topic && topic._deleted != deleted) {
          topic._deleted = deleted;
          trx.objectStore('topic').put(topic);
        }
        trx.commit();
      };
    });
  }

  /**
   * Remove topic from persistent cache.
   * @memberOf DB
   * @param {string} name - name of the topic to remove from database.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  remTopic(name) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['topic', 'subscription', 'message'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'remTopic', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('topic').delete(IDBKeyRange.only(name));
      trx.objectStore('subscription').delete(IDBKeyRange.bound([name, '-'], [name, '~']));
      trx.objectStore('message').delete(IDBKeyRange.bound([name, 0], [name, Number.MAX_SAFE_INTEGER]));
      trx.commit();
    });
  }

  /**
   * Execute a callback for each stored topic.
   * @memberOf DB
   * @param {function} callback - function to call for each topic.
   * @param {Object} context - the value or <code>this</code> inside the callback.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  mapTopics(callback, context) {
    return this.#mapObjects('topic', callback, context);
  }

  /**
   * Copy data from serialized object to topic.
   * @memberOf DB
   * @param {Topic} topic - target to deserialize to.
   * @param {Object} src - serialized data to copy from.
   */
  deserializeTopic(topic, src) {
    DB.#deserializeTopic(topic, src);
  }

  // Users.
  /**
   * Add or update user object in the persistent cache.
   * @memberOf DB
   * @param {string} uid - ID of the user to save or update.
   * @param {Object} pub - user's <code>public</code> information.
   * @returns {Promise} promise resolved/rejected on operation completion.
   */
  updUser(uid, pub) {
    if (arguments.length < 2 || pub === undefined) {
      // No point inupdating user with invalid data.
      return;
    }
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['user'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'updUser', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('user').put({
        uid: uid,
        public: pub
      });
      trx.commit();
    });
  }

  /**
   * Remove user from persistent cache.
   * @memberOf DB
   * @param {string} uid - ID of the user to remove from the cache.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  remUser(uid) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['user'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'remUser', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('user').delete(IDBKeyRange.only(uid));
      trx.commit();
    });
  }

  /**
   * Execute a callback for each stored user.
   * @memberOf DB
   * @param {function} callback - function to call for each topic.
   * @param {Object} context - the value or <code>this</code> inside the callback.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  mapUsers(callback, context) {
    return this.#mapObjects('user', callback, context);
  }

  /**
   * Read a single user from persistent cache.
   * @memberOf DB
   * @param {string} uid - ID of the user to fetch from cache.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  getUser(uid) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['user']);
      trx.oncomplete = event => {
        const user = event.target.result;
        resolve({
          user: user.uid,
          public: user.public
        });
      };
      trx.onerror = event => {
        this.#logger('PCache', 'getUser', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('user').get(uid);
    });
  }

  // Subscriptions.
  /**
   * Add or update subscription in persistent cache.
   * @memberOf DB
   * @param {string} topicName - name of the topic which owns the message.
   * @param {string} uid - ID of the subscribed user.
   * @param {Object} sub - subscription to save.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  updSubscription(topicName, uid, sub) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['subscription'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'updSubscription', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('subscription').get([topicName, uid]).onsuccess = (event) => {
        trx.objectStore('subscription').put(DB.#serializeSubscription(event.target.result, topicName, uid, sub));
        trx.commit();
      };
    });
  }

  /**
   * Execute a callback for each cached subscription in a given topic.
   * @memberOf DB
   * @param {string} topicName - name of the topic which owns the subscriptions.
   * @param {function} callback - function to call for each subscription.
   * @param {Object} context - the value or <code>this</code> inside the callback.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  mapSubscriptions(topicName, callback, context) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve([]) :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['subscription']);
      trx.onerror = (event) => {
        this.#logger('PCache', 'mapSubscriptions', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('subscription').getAll(IDBKeyRange.bound([topicName, '-'], [topicName, '~'])).onsuccess = (event) => {
        if (callback) {
          event.target.result.forEach((topic) => {
            callback.call(context, topic);
          });
        }
        resolve(event.target.result);
      };
    });
  }

  // Messages.

  /**
   * Save message to persistent cache.
   * @memberOf DB
   * @param {Object} msg - message to save.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  addMessage(msg) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['message'], 'readwrite');
      trx.onsuccess = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'addMessage', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('message').add(DB.#serializeMessage(null, msg));
      trx.commit();
    });
  }

  /**
   * Update delivery status of a message stored in persistent cache.
   * @memberOf DB
   * @param {string} topicName - name of the topic which owns the message.
   * @param {number} seq - ID of the message to update
   * @param {number} status - new delivery status of the message.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  updMessageStatus(topicName, seq, status) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['message'], 'readwrite');
      trx.onsuccess = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'updMessageStatus', event.target.error);
        reject(event.target.error);
      };
      const req = trx.objectStore('message').get(IDBKeyRange.only([topicName, seq]));
      req.onsuccess = event => {
        const src = req.result || event.target.result;
        if (!src || src._status == status) {
          trx.commit();
          return;
        }
        trx.objectStore('message').put(DB.#serializeMessage(src, {
          topic: topicName,
          seq: seq,
          _status: status
        }));
        trx.commit();
      };
    });
  }

  /**
   * Remove one or more messages from persistent cache.
   * @memberOf DB
   * @param {string} topicName - name of the topic which owns the message.
   * @param {number} from - id of the message to remove or lower boundary when removing range (inclusive).
   * @param {number=} to - upper boundary (exclusive) when removing a range of messages.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  remMessages(topicName, from, to) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      if (!from && !to) {
        from = 0;
        to = Number.MAX_SAFE_INTEGER;
      }
      const range = to > 0 ? IDBKeyRange.bound([topicName, from], [topicName, to], false, true) :
        IDBKeyRange.only([topicName, from]);
      const trx = this.db.transaction(['message'], 'readwrite');
      trx.onsuccess = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'remMessages', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('message').delete(range);
      trx.commit();
    });
  }

  /**
   * Retrieve messages from persistent store.
   * @memberOf DB
   * @param {string} topicName - name of the topic to retrieve messages from.
   * @param {function} callback to call for each retrieved message.
   * @param {GetDataType} query - parameters of the message range to retrieve.
   *
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  readMessages(topicName, query, callback, context) {
    query = query || {};

    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve([]) :
        Promise.reject(new Error("not initialized"));
    }

    const trx = this.db.transaction(['message']);
    let result = [];

    // Handle individual message ranges.
    if (Array.isArray(query.ranges)) {
      return new Promise((resolve, reject) => {
        trx.onerror = event => {
          this.#logger('PCache', 'readMessages', event.target.error);
          reject(event.target.error);
        };

        let count = 0;
        query.ranges.forEach(range => {
          const key = range.hi ? IDBKeyRange.bound([topicName, range.low], [topicName, range.hi], false, true) :
            IDBKeyRange.only([topicName, range.low]);
          trx.objectStore('message').getAll(key).onsuccess = event => {
            const msgs = event.target.result;
            if (msgs) {
              if (callback) {
                callback.call(context, msgs);
              }
              if (Array.isArray(msgs)) {
                result = result.concat(msgs);
              } else {
                result.push(msgs);
              }
            }
            count++;
            if (count == query.ranges.length) {
              resolve(result);
            }
          };
        });
      });
    }

    // Handle single range.
    return new Promise((resolve, reject) => {
      const since = query.since > 0 ? query.since : 0;
      const before = query.before > 0 ? query.before : Number.MAX_SAFE_INTEGER;
      const limit = query.limit | 0;

      trx.onerror = event => {
        this.#logger('PCache', 'readMessages', event.target.error);
        reject(event.target.error);
      };

      const range = IDBKeyRange.bound([topicName, since], [topicName, before], false, true);
      // Iterate in descending order.
      trx.objectStore('message').openCursor(range, 'prev')
        .onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            if (callback) {
              callback.call(context, cursor.value);
            }
            result.push(cursor.value);
            if (limit <= 0 || result.length < limit) {
              cursor.continue();
            } else {
              resolve(result);
            }
          } else {
            resolve(result);
          }
        };
    });
  }

  // Delete log

  /**
   * Add records of deleted messages.
   * @memberOf DB
   * @param {string} topicName - name of the topic which owns the message.
   * @param {number} delId - id of the deletion transaction.
   * @param {Array.<IdRange>} ranges - message to save.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  addDelLog(topicName, delId, ranges) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve() :
        Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['dellog'], 'readwrite');
      trx.onsuccess = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'addDelLog', event.target.error);
        reject(event.target.error);
      };
      ranges.forEach(r => trx.objectStore('dellog').add({
        topic: topicName,
        clear: delId,
        low: r.low,
        hi: r.hi || (r.low + 1)
      }));
      trx.commit();
    });
  }

  /**
   * Retrieve deleted message records from persistent store.
   * @memberOf DB
   * @param {string} topicName - name of the topic to retrieve records for.
   * @param {GetDataType} query - parameters of the message range to retrieve.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  readDelLog(topicName, query) {
    query = query || {};

    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve([]) :
        Promise.reject(new Error("not initialized"));
    }

    const trx = this.db.transaction(['dellog']);
    let result = [];

    // Handle individual message ranges.
    if (Array.isArray(query.ranges)) {
      return new Promise((resolve, reject) => {
        trx.onerror = event => {
          this.#logger('PCache', 'readDelLog', event.target.error);
          reject(event.target.error);
        };

        let count = 0;
        query.ranges.forEach(range => {
          const hi = range.hi || (range.low + 1);
          const key = IDBKeyRange.bound([topicName, 0, range.low], [topicName, hi, Number.MAX_SAFE_INTEGER], false, true);
          trx.objectStore('dellog').getAll(key).onsuccess = event => {
            const entries = event.target.result;
            if (entries) {
              if (Array.isArray(entries)) {
                result = result.concat(entries.map(entry => {
                  return {
                    low: entry.low,
                    hi: entry.hi
                  };
                }));
              } else {
                result.push({
                  low: entries.low,
                  hi: entries.hi
                });
              }
            }
            count++;
            if (count == query.ranges.length) {
              resolve(result);
            }
          };
        });
      });
    }

    return new Promise((resolve, reject) => {
      const since = query.since > 0 ? query.since : 0;
      const before = query.before > 0 ? query.before : Number.MAX_SAFE_INTEGER;
      const limit = query.limit | 0;

      trx.onerror = event => {
        this.#logger('PCache', 'readDelLog', event.target.error);
        reject(event.target.error);
      };

      let count = 0;
      const result = [];
      const range = IDBKeyRange.bound([topicName, 0, since], [topicName, before, Number.MAX_SAFE_INTEGER], false, true);
      trx.objectStore('dellog').openCursor(range, 'prev')
        .onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            result.push({
              low: cursor.value.low,
              hi: cursor.value.hi
            });
            count += cursor.value.hi - cursor.value.low;
            if (limit <= 0 || count < limit) {
              cursor.continue();
            } else {
              resolve(result);
            }
          } else {
            resolve(result);
          }
        };
    });
  }

  /**
   * Retrieve the latest 'clear' ID for the given topic.
   * @param {string} topicName
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  maxDelId(topicName) {
    if (!this.isReady()) {
      return this.disabled ?
        Promise.resolve(0) :
        Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['dellog']);
      trx.onerror = event => {
        this.#logger('PCache', 'maxDelId', event.target.error);
        reject(event.target.error);
      };

      const index = trx.objectStore('dellog').index('topic_clear');
      index.openCursor(IDBKeyRange.bound([topicName, 0], [topicName, Number.MAX_SAFE_INTEGER]), 'prev')
        .onsuccess = event => {
          if (event.target.result) {
            resolve(event.target.result.value);
          }
        };
    });
  }

  // Private methods.

  // Serializable topic fields.
  static #topic_fields = ['created', 'updated', 'deleted', 'touched', 'read', 'recv', 'seq',
    'clear', 'defacs', 'creds', 'public', 'trusted', 'private', '_aux', '_deleted'
  ];

  // Copy data from src to Topic object.
  static #deserializeTopic(topic, src) {
    DB.#topic_fields.forEach((f) => {
      if (src.hasOwnProperty(f)) {
        topic[f] = src[f];
      }
    });
    if (Array.isArray(src.tags)) {
      topic._tags = src.tags;
    }
    if (src.acs) {
      topic.setAccessMode(src.acs);
    }
    topic.seq |= 0;
    topic.read |= 0;
    topic.unread = Math.max(0, topic.seq - topic.read);
  }

  // Copy values from 'src' to 'dst'. Allocate dst if it's null or undefined.
  static #serializeTopic(dst, src) {
    const res = dst || {
      name: src.name
    };
    DB.#topic_fields.forEach(f => {
      if (src.hasOwnProperty(f)) {
        res[f] = src[f];
      }
    });
    if (Array.isArray(src._tags)) {
      res.tags = src._tags;
    }
    if (src.acs) {
      res.acs = src.getAccessMode().jsonHelper();
    }
    return res;
  }

  static #serializeSubscription(dst, topicName, uid, sub) {
    const fields = ['updated', 'mode', 'read', 'recv', 'clear', 'lastSeen', 'userAgent'];
    const res = dst || {
      topic: topicName,
      uid: uid
    };

    fields.forEach((f) => {
      if (sub.hasOwnProperty(f)) {
        res[f] = sub[f];
      }
    });

    return res;
  }

  static #serializeMessage(dst, msg) {
    // Serializable fields.
    const fields = ['topic', 'seq', 'ts', '_status', 'from', 'head', 'content'];
    const res = dst || {};
    fields.forEach((f) => {
      if (msg.hasOwnProperty(f)) {
        res[f] = msg[f];
      }
    });
    return res;
  }

  /**
   * To use DB in a non browser context, supply indexedDB provider.
   * @static
   * @memberof DB
   * @param idbProvider indexedDB provider, e.g. for node <code>require('fake-indexeddb')</code>.
   */
  static setDatabaseProvider(idbProvider) {
    IDBProvider = idbProvider;
  }
}
