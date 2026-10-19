/**
 * @file Persistent cache of messages, users, and topics backed by a pluggable storage adapter.
 *
 * @copyright 2015-2026 Tinode LLC.
 */
'use strict';

// NOTE TO DEVELOPERS:
// Localizable strings should be double quoted "строка на другом языке",
// non-localizable strings should be single quoted 'non-localized'.

import {
  MAX_SEQ
} from './storage-adapter.js';

export default class DB {
  #onError = _ => {};
  #logger = _ => {};
  #adapter = null;

  /**
   * Create persistent cache.
   * @param {function} onError - callback to call when the storage fails to initialize.
   * @param {function} logger - logging function.
   * @param {Tinode.StorageAdapter=} adapter - storage for the cache; <code>null</code> or <code>undefined</code>
   *   disables the cache.
   */
  constructor(onError, logger, adapter) {
    this.#onError = onError || this.#onError;
    this.#logger = logger || this.#logger;
    this.#adapter = adapter || null;
  }

  #run(op, fallback, work) {
    const adapter = this.#adapter;
    if (!adapter || !adapter.isOpen()) {
      return Promise.resolve(fallback);
    }
    return work(adapter).catch(err => {
      this.#logger('PCache', op, err);
      throw err;
    });
  }

  /**
   * Initialize persistent cache: open or create/upgrade if needed.
   * @returns {Promise} promise to be resolved/rejected when the storage is open.
   */
  initDatabase() {
    if (!this.#adapter) {
      return Promise.resolve();
    }
    return this.#adapter.open().catch(err => {
      this.#logger('PCache', "failed to initialize", err);
      this.#onError(err);
      throw err;
    });
  }

  /**
   * Delete persistent cache.
   * @returns {Promise} promise resolved with <code>true</code> when the cache is deleted.
   */
  deleteDatabase() {
    if (!this.#adapter) {
      return Promise.resolve(true);
    }
    return this.#adapter.destroy().then(_ => true, err => {
      this.#logger('PCache', 'deleteDatabase', err);
      throw err;
    });
  }

  /**
   * Check if persistent cache is ready for use.
   * @memberOf DB
   * @returns {boolean} <code>true</code> if cache is ready, <code>false</code> otherwise.
   */
  isReady() {
    return !!this.#adapter && this.#adapter.isOpen();
  }

  // Topics.

  /**
   * Save to cache or update topic in persistent cache.
   * @memberOf DB
   * @param {Topic} topic - topic to be added or updated.
   * @returns {Promise} promise resolved/rejected on operation completion.
   */
  updTopic(topic) {
    return this.#run('updTopic', undefined, adapter =>
      adapter.getTopic(topic.name).then(src => adapter.putTopic(DB.#serializeTopic(src, topic))));
  }

  /**
   * Mark or unmark topic as deleted.
   * @memberOf DB
   * @param {string} name - name of the topic to mark or unmark.
   * @param {boolean} deleted - status
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  markTopicAsDeleted(name, deleted) {
    return this.#run('markTopicAsDeleted', undefined, adapter =>
      adapter.getTopic(name).then(topic => {
        if (topic && topic._deleted != deleted) {
          topic._deleted = deleted;
          return adapter.putTopic(topic);
        }
      }));
  }

  /**
   * Remove topic from persistent cache.
   * @memberOf DB
   * @param {string} name - name of the topic to remove from storage.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  remTopic(name) {
    return this.#run('remTopic', undefined, adapter => adapter.removeTopic(name));
  }

  /**
   * Execute a callback for each stored topic.
   * @memberOf DB
   * @param {function} callback - function to call for each topic.
   * @param {Object} context - the value or <code>this</code> inside the callback.
   * @return {Promise} promise resolved with the array of stored topics.
   */
  mapTopics(callback, context) {
    return this.#run('mapTopics', [], adapter =>
      adapter.getTopics().then(topics => DB.#visit(topics, callback, context)));
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
    if (typeof pub == 'undefined') {
      return Promise.resolve();
    }
    return this.#run('updUser', undefined, adapter => adapter.putUser({
      uid: uid,
      public: pub
    }));
  }

  /**
   * Remove user from persistent cache.
   * @memberOf DB
   * @param {string} uid - ID of the user to remove from the cache.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  remUser(uid) {
    return this.#run('remUser', undefined, adapter => adapter.removeUser(uid));
  }

  /**
   * Execute a callback for each stored user.
   * @memberOf DB
   * @param {function} callback - function to call for each user.
   * @param {Object} context - the value or <code>this</code> inside the callback.
   * @return {Promise} promise resolved with the array of stored users.
   */
  mapUsers(callback, context) {
    return this.#run('mapUsers', [], adapter =>
      adapter.getUsers().then(users => DB.#visit(users, callback, context)));
  }

  /**
   * Read a single user from persistent cache.
   * @memberOf DB
   * @param {string} uid - ID of the user to fetch from cache.
   * @return {Promise} promise resolved with <code>{user, public}</code> or <code>undefined</code> if the user is not cached.
   */
  getUser(uid) {
    return this.#run('getUser', undefined, adapter =>
      adapter.getUser(uid).then(user => user && {
        user: user.uid,
        public: user.public
      }));
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
    return this.#run('updSubscription', undefined, adapter =>
      adapter.getSubscription(topicName, uid).then(src =>
        adapter.putSubscription(DB.#serializeSubscription(src, topicName, uid, sub))));
  }

  /**
   * Remove subscription from persistent cache.
   * @memberOf DB
   * @param {string} topicName - name of the topic which owns the subscription.
   * @param {string} uid - ID of the unsubscribed user.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  remSubscription(topicName, uid) {
    return this.#run('remSubscription', undefined, adapter => adapter.removeSubscription(topicName, uid));
  }

  /**
   * Execute a callback for each cached subscription in a given topic.
   * @memberOf DB
   * @param {string} topicName - name of the topic which owns the subscriptions.
   * @param {function} callback - function to call for each subscription.
   * @param {Object} context - the value or <code>this</code> inside the callback.
   * @return {Promise} promise resolved with the array of subscriptions, each with <code>user</code> set to the subscriber's ID.
   */
  mapSubscriptions(topicName, callback, context) {
    return this.#run('mapSubscriptions', [], adapter =>
      adapter.getSubscriptions(topicName).then(subs => DB.#visit(subs.map(sub => {
        return {
          ...sub,
          user: sub.uid
        };
      }), callback, context)));
  }

  // Messages.

  /**
   * Save message to persistent cache.
   * @memberOf DB
   * @param {Object} msg - message to save.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  addMessage(msg) {
    return this.#run('addMessage', undefined, adapter => adapter.putMessage(DB.#serializeMessage(null, msg)));
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
    return this.#run('updMessageStatus', undefined, adapter => adapter.updateMessageStatus(topicName, seq, status));
  }

  /**
   * Remove one or more messages from persistent cache.
   * @memberOf DB
   * @param {string} topicName - name of the topic which owns the message.
   * @param {number=} from - id of the message to remove or lower boundary when removing range (inclusive).
   *   When neither <code>from</code> nor <code>to</code> is given, all messages of the topic are removed.
   * @param {number=} to - upper boundary (exclusive) when removing a range of messages.
   * @return {Promise} promise resolved/rejected on operation completion.
   */
  remMessages(topicName, from, to) {
    return this.#run('remMessages', undefined, adapter => {
      if (!from && !to) {
        return adapter.removeMessages(topicName, 0, MAX_SEQ);
      }
      from = from || 0;
      if (to > 0) {
        return to > from ? adapter.removeMessages(topicName, from, to) : Promise.resolve();
      }
      return adapter.removeMessages(topicName, from, from + 1);
    });
  }

  /**
   * Retrieve messages from persistent store.
   * @memberOf DB
   * @param {string} topicName - name of the topic to retrieve messages from.
   * @param {GetDataType} query - parameters of the message range to retrieve.
   * @param {function=} callback - function to call for each retrieved message.
   * @param {Object=} context - the value or <code>this</code> inside the callback.
   *
   * @return {Promise} promise resolved with the array of retrieved messages.
   */
  readMessages(topicName, query, callback, context) {
    query = query || {};
    return this.#run('readMessages', [], adapter => {
      const read = Array.isArray(query.ranges) ?
        adapter.readMessageRanges(topicName, query.ranges) :
        adapter.readMessages(topicName, DB.#window(query));
      return read.then(msgs => DB.#visit(msgs, callback, context));
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
    return this.#run('addDelLog', undefined, adapter => adapter.addDelLog(ranges.map(r => {
      return {
        topic: topicName,
        clear: delId,
        low: r.low,
        hi: r.hi || (r.low + 1)
      };
    })));
  }

  /**
   * Retrieve deleted message records from persistent store.
   * @memberOf DB
   * @param {string} topicName - name of the topic to retrieve records for.
   * @param {GetDataType} query - parameters of the message range to retrieve.
   * @return {Promise} promise resolved with the array of deleted ranges <code>{low, hi}</code>.
   */
  readDelLog(topicName, query) {
    query = query || {};
    return this.#run('readDelLog', [], adapter => Array.isArray(query.ranges) ?
      adapter.readDelLogRanges(topicName, query.ranges) :
      adapter.readDelLog(topicName, DB.#window(query)));
  }

  /**
   * Retrieve the latest 'clear' ID for the given topic.
   * @param {string} topicName
   * @return {Promise} promise resolved with the latest 'clear' ID or 0 if there are no records.
   */
  maxDelId(topicName) {
    return this.#run('maxDelId', 0, adapter => adapter.maxDelId(topicName));
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

  static #window(query) {
    return {
      since: query.since > 0 ? query.since : 0,
      before: query.before > 0 ? query.before : MAX_SEQ,
      limit: query.limit | 0
    };
  }

  static #visit(items, callback, context) {
    if (callback) {
      items.forEach(item => callback.call(context, item));
    }
    return items;
  }
}
