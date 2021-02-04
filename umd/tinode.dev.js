(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Tinode = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * @file Helper methods for dealing with IndexedDB cache of messages, users, and topics.
 * See <a href="https://github.com/tinode/webapp">https://github.com/tinode/webapp</a> for real-life usage.
 *
 * @copyright 2015-2021 Tinode
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.17
 */
'use strict';

const DB_VERSION = 1;
const DB_NAME = 'tinode-web';

const DB = function(onError, logger) {
  onError = onError || function() {}
  logger = logger || function() {}

  // Placeholder DB which does nothing.
  let db = null;

  // Serializable topic fields.
  const topic_fields = ['created', 'updated', 'deleted', 'read', 'recv', 'seq', 'clear', 'defacs',
    'creds', 'public', 'private', 'touched'
  ];

  // Copy values from 'src' to 'dst'. Allocate dst if 'it's null or undefined.
  function serializeTopic(dst, src) {
    const res = dst || {
      name: src.name
    };
    topic_fields.forEach((f) => {
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

  // Copy data from src to Topic object.
  function deserializeTopic(topic, src) {
    topic_fields.forEach((f) => {
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
  }

  function serializeSubscription(dst, topicName, uid, sub) {
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

  function serializeMessage(dst, msg) {
    // Serializable fields.
    const fields = ['topic', 'seq', 'ts', '_status', 'from', 'head', 'content'];
    const res = dst || {};
    fields.forEach((f) => {
      if (msg.hasOwnProperty(f)) {
        res[f] = msg[f];
      }
    });
    console.log("serializeMessage", res);
    return res;
  }

  return {
    /**
     * Initialize persistent cache: open or create/upgrade if needed.
     * @returns {Promise} promise to be resolved/rejected when the DB is initialized.
     */
    initDatabase: function() {
      return new Promise((resolve, reject) => {
        // Open the database and initialize callbacks.
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (event) => {
          db = event.target.result;
          resolve(db);
        };
        req.onerror = (event) => {
          logger("PCache", "failed to initialize", event);
          reject(event.target.error);
          if (onError) {
            onError(event.target.error);
          }
        };
        req.onupgradeneeded = function(event) {
          db = event.target.result;

          db.onerror = function(event) {
            logger("PCache", "failed to create storage", event);
            if (onError) {
              onError(event.target.error);
            }
          };

          // Individual object stores.

          // Object store (table) for topics. The primary key is topic name.
          db.createObjectStore('topic', {
            keyPath: 'name'
          });

          // Users object store. UID is the primary key.
          db.createObjectStore('user', {
            keyPath: 'uid'
          });

          // Subscriptions object store topic <-> user. Topic name + UID is the primary key.
          db.createObjectStore('subscription', {
            keyPath: ['topic', 'uid']
          });

          // Messages object store. The primary key is topic name + seq.
          db.createObjectStore('message', {
            keyPath: ['topic', 'seq']
          });
        };
      });
    },

    /**
     * Delete persistent cache.
     */
    deleteDatabase: function() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = function(event) {
          resolve(true);
        };
        req.onerror = function(event) {
          logger("PCache", "deleteDatabase", event.target.error);
          reject(event.target.error);
        };
      });
    },

    /**
     * Check if persistent cache is ready for use.
     * @returns {boolean} <code>true</code> if cache is ready, <code>false</code> otherwise.
     */
    isReady: function() {
      return !!db;
    },

    // Topics.
    /**
     * Add or update topic in persistent cache.
     * @memberOf DB
     * @param {Topic} topic - topic to be added to persistent storage.
     * @returns {Promise} promise resolved/rejected on operation completion.
     */
    updTopic: function(topic) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "updTopic", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('topic').get(topic.name).onsuccess = (event) => {
          trx.objectStore('topic').put(serializeTopic(event.target.result, topic));
          trx.commit();
        };
      });
    },

    /**
     * Remove topic from persistent cache.
     * @memberOf DB
     * @param {string} name - name of the topic to remove from database.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    remTopic: function(name) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic', 'subscription', 'message'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "remTopic", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('topic').delete(IDBKeyRange.only(name));
        trx.objectStore('subscription').delete(IDBKeyRange.bound([name, '-'], [name, '~']));
        trx.objectStore('message').delete(IDBKeyRange.bound([name, 0], [name, Number.MAX_SAFE_INTEGER]));
        trx.commit();
      });
    },

    /**
     * Execute a callback for each stored topic.
     * @memberOf DB
     * @param {function} callback - function to call for each topic.
     * @param {Object} context - the value or <code>this</code> inside the callback.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    mapTopics: function(callback, context) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic']);
        trx.onerror = (event) => {
          logger("PCache", "mapTopics", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('topic').getAll().onsuccess = (event) => {
          if (callback) {
            event.target.result.forEach((topic) => {
              callback.call(context, topic);
            });
          }
          resolve(event.target.result);
        };
      });
    },

    /**
     * Copy data from serialized object to topic.
     * @memberOf DB
     * @param {Topic} topic - target to deserialize to.
     * @param {Object} src - serialized data to copy from.
     */
    deserializeTopic: function(topic, src) {
      deserializeTopic(topic, src);
    },

    // Users.
    /**
     * Add or update user object in the persistent cache.
     * @memberOf DB
     * @param {string} uid - ID of the user to save.
     * @param {Object} pub - user's <code>public</code> information.
     * @returns {Promise} promise resolved/rejected on operation completion.
     */
    updUser: function(uid, pub) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['user'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "updUser", event.target.error);
          reject(event.target.error);
        };
        const user = {
          uid: uid
        };
        if (arguments.length > 1 && pub !== undefined) {
          user.public = pub;
        }
        trx.objectStore('user').put(user);
        trx.commit();
      });
    },

    /**
     * Remove user from persistent cache.
     * @memberOf DB
     * @param {string} uid - ID of the user to remove from the cache.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    remUser: function(uid) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['user'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "remUser", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('user').delete(IDBKeyRange.only(uid));
        trx.commit();
      });
    },

    /**
     * Read a single user from persistent cache.
     * @memberOf DB
     * @param {string} uid - ID of the user to fetch from cache.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    getUser: function(uid) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['user']);
        trx.oncomplete = (event) => {
          const user = event.target.result;
          resolve({
            user: user.uid,
            public: user.public
          });
        };
        trx.onerror = (event) => {
          logger("PCache", "getUser", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('user').get(uid);
      });
    },

    // Subscriptions.

    /**
     * Add or update subscription in persistent cache.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the message.
     * @param {string} uid - ID of the subscribed user.
     * @param {Object} sub - subscription to save.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    updSubscription: function(topicName, uid, sub) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['subscription'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "updSubscription", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('subscription').get([topicName, uid]).onsuccess = (event) => {
          trx.objectStore('subscription').put(serializeSubscription(event.target.result, topicName, uid, sub));
          trx.commit();
        };
      });
    },

    /**
     * Execute a callback for each cached subscription in a given topic.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the subscriptions.
     * @param {function} callback - function to call for each subscription.
     * @param {Object} context - the value or <code>this</code> inside the callback.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    mapSubscriptions: function(topicName, callback, context) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['subscription']);
        trx.onerror = (event) => {
          logger("PCache", "mapSubscriptions", event.target.error);
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
    },

    // Messages.

    /**
     * Save message to persistent cache.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the message.
     * @param {Object} msg - message to save.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    addMessage: function(msg) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "addMesssage", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('message').add(serializeMessage(null, msg));
        trx.commit();
      });
    },

    /**
     * Update delivery status of a message stored in persistent cache.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the message.
     * @param {number} seq - ID of the message to update
     * @param {number} status - new delivery status of the message.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    updMessageStatus: function(topicName, seq, status) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "updMessageStatus", event.target.error);
          reject(event.target.error);
        };
        const req = trx.objectStore('message').get(IDBKeyRange.only([topicName, seq]));
        req.onsuccess = (event) => {
          let src = null;
          if (!req.result) {
            console.log("updMessageStatus --  request", req, JSON.stringify(req), topicName, seq);
          } else {
            src = req.result;
            console.log("updMessageStatus -- using REQUEST", req, JSON.stringify(req), topicName, seq);
          }
          if (!src && !event.target.result) {
            console.log("updMessageStatus -- event", event, JSON.stringify(event.target), topicName, seq);
          } else {
            src = event.target.result;
            console.log("updMessageStatus -- using EVENT", event, JSON.stringify(event.target), topicName, seq);
          }
          if (!src || src._status == status) {
            trx.commit();
            return;
          }
          trx.objectStore('message').put(serializeMessage(src, {
            topic: topicName,
            seq: seq,
            _status: status
          }));
          trx.commit();
        };
      });
    },

    /**
     * Remove one or more messages from persistent cache.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the message.
     * @param {number} from - id of the message to remove or lower boundary when removing range (inclusive).
     * @param {number=} to - upper boundary (exclusive) when removing a range of messages.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    remMessages: function(topicName, from, to) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        if (!from && !to) {
          from = 0;
          to = Number.MAX_SAFE_INTEGER;
        }
        const range = to > 0 ? IDBKeyRange.bound([topicName, from], [topicName, to], false, true) :
          IDBKeyRange.only([topicName, from]);
        const trx = db.transaction(['message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "remMessages", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('message').delete(range);
        trx.commit();
      });
    },

    /**
     * Retrieve messages from persistent store.
     * @memberOf DB
     * @param {string} topicName - name of the topic to retrieve messages from.
     * @param {function} callback to call for each retrieved message.
     * @param {Object} query - parameters of the message range to retrieve.
     * @param {number=} query.from - the least message ID to retrieve (inclusive).
     * @param {number=} query.to - the greatest message ID to retrieve (exclusive).
     * @param {number=} query.limit - the maximum number of messages to retrieve.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    readMessages: function(topicName, query, callback, context) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        query = query || {};
        const from = query.from > 0 ? query.from : 0;
        const to = query.to > 0 ? query.to : Number.MAX_SAFE_INTEGER;
        const limit = query.limit | 0;

        const result = [];
        const range = IDBKeyRange.bound([topicName, from], [topicName, to], false, true);
        const trx = db.transaction(['message']);
        trx.onerror = (event) => {
          logger("PCache", "readMessages", event.target.error);
          reject(event.target.error);
        };
        // Iterate in descending order.
        trx.objectStore('message').openCursor(range, 'prev').onsuccess = (event) => {
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
  };
}

if (typeof module != 'undefined') {
  module.exports = DB;
}

},{}],2:[function(require,module,exports){
/**
 * @copyright 2015-2021 Tinode
 * @summary Minimally rich text representation and formatting for Tinode.
 * @license Apache 2.0
 * @version 0.16
 *
 * @file Basic parser and formatter for very simple text markup. Mostly targeted at
 * mobile use cases similar to Telegram, WhatsApp, and FB Messenger.
 *
 * <p>Supports conversion of user keyboard input to formatted text:</p>
 * <ul>
 *   <li>*abc* &rarr; <b>abc</b></li>
 *   <li>_abc_ &rarr; <i>abc</i></li>
 *   <li>~abc~ &rarr; <del>abc</del></li>
 *   <li>`abc` &rarr; <tt>abc</tt></li>
 * </ul>
 * Also supports forms and buttons.
 *
 * Nested formatting is supported, e.g. *abc _def_* -> <b>abc <i>def</i></b>
 * URLs, @mentions, and #hashtags are extracted and converted into links.
 * Forms and buttons can be added procedurally.
 * JSON data representation is inspired by Draft.js raw formatting.
 *
 *
 * @example
 * Text:
 * <pre>
 *     this is *bold*, `code` and _italic_, ~strike~
 *     combined *bold and _italic_*
 *     an url: https://www.example.com/abc#fragment and another _www.tinode.co_
 *     this is a @mention and a #hashtag in a string
 *     second #hashtag
 * </pre>
 *
 *  Sample JSON representation of the text above:
 *  {
 *     "txt": "this is bold, code and italic, strike combined bold and italic an url: https://www.example.com/abc#fragment " +
 *             "and another www.tinode.co this is a @mention and a #hashtag in a string second #hashtag",
 *     "fmt": [
 *         { "at":8, "len":4,"tp":"ST" },{ "at":14, "len":4, "tp":"CO" },{ "at":23, "len":6, "tp":"EM"},
 *         { "at":31, "len":6, "tp":"DL" },{ "tp":"BR", "len":1, "at":37 },{ "at":56, "len":6, "tp":"EM" },
 *         { "at":47, "len":15, "tp":"ST" },{ "tp":"BR", "len":1, "at":62 },{ "at":120, "len":13, "tp":"EM" },
 *         { "at":71, "len":36, "key":0 },{ "at":120, "len":13, "key":1 },{ "tp":"BR", "len":1, "at":133 },
 *         { "at":144, "len":8, "key":2 },{ "at":159, "len":8, "key":3 },{ "tp":"BR", "len":1, "at":179 },
 *         { "at":187, "len":8, "key":3 },{ "tp":"BR", "len":1, "at":195 }
 *     ],
 *     "ent": [
 *         { "tp":"LN", "data":{ "url":"https://www.example.com/abc#fragment" } },
 *         { "tp":"LN", "data":{ "url":"http://www.tinode.co" } },
 *         { "tp":"MN", "data":{ "val":"mention" } },
 *         { "tp":"HT", "data":{ "val":"hashtag" } }
 *     ]
 *  }
 */

'use strict';

const MAX_FORM_ELEMENTS = 8;
const JSON_MIME_TYPE = 'application/json';

// Regular expressions for parsing inline formats. Javascript does not support lookbehind,
// so it's a bit messy.
const INLINE_STYLES = [
  // Strong = bold, *bold text*
  {
    name: 'ST',
    start: /(?:^|[\W_])(\*)[^\s*]/,
    end: /[^\s*](\*)(?=$|[\W_])/
  },
  // Emphesized = italic, _italic text_
  {
    name: 'EM',
    start: /(?:^|\W)(_)[^\s_]/,
    end: /[^\s_](_)(?=$|\W)/
  },
  // Deleted, ~strike this though~
  {
    name: 'DL',
    start: /(?:^|[\W_])(~)[^\s~]/,
    end: /[^\s~](~)(?=$|[\W_])/
  },
  // Code block `this is monospace`
  {
    name: 'CO',
    start: /(?:^|\W)(`)[^`]/,
    end: /[^`](`)(?=$|\W)/
  }
];

// RegExps for entity extraction (RF = reference)
const ENTITY_TYPES = [
  // URLs
  {
    name: 'LN',
    dataName: 'url',
    pack: function(val) {
      // Check if the protocol is specified, if not use http
      if (!/^[a-z]+:\/\//i.test(val)) {
        val = 'http://' + val;
      }
      return {
        url: val
      };
    },
    re: /(?:(?:https?|ftp):\/\/|www\.|ftp\.)[-A-Z0-9+&@#\/%=~_|$?!:,.]*[A-Z0-9+&@#\/%=~_|$]/ig
  },
  // Mentions @user (must be 2 or more characters)
  {
    name: 'MN',
    dataName: 'val',
    pack: function(val) {
      return {
        val: val.slice(1)
      };
    },
    re: /\B@(\w\w+)/g
  },
  // Hashtags #hashtag, like metion 2 or more characters.
  {
    name: 'HT',
    dataName: 'val',
    pack: function(val) {
      return {
        val: val.slice(1)
      };
    },
    re: /\B#(\w\w+)/g
  }
];

// HTML tag name suggestions
const HTML_TAGS = {
  ST: {
    name: 'b',
    isVoid: false
  },
  EM: {
    name: 'i',
    isVoid: false
  },
  DL: {
    name: 'del',
    isVoid: false
  },
  CO: {
    name: 'tt',
    isVoid: false
  },
  BR: {
    name: 'br',
    isVoid: true
  },
  LN: {
    name: 'a',
    isVoid: false
  },
  MN: {
    name: 'a',
    isVoid: false
  },
  HT: {
    name: 'a',
    isVoid: false
  },
  IM: {
    name: 'img',
    isVoid: true
  },
  FM: {
    name: 'div',
    isVoid: false
  },
  RW: {
    name: 'div',
    isVoid: false,
  },
  BN: {
    name: 'button',
    isVoid: false
  },
  HD: {
    name: '',
    isVoid: false
  },
  HL: {
    name: 'span',
    isVoid: false
  }
};

// Convert base64-encoded string into Blob.
function base64toObjectUrl(b64, contentType, logger) {
  if (!b64) {
    return null;
  }

  try {
    const bin = atob(b64);
    const length = bin.length;
    const buf = new ArrayBuffer(length);
    const arr = new Uint8Array(buf);
    for (let i = 0; i < length; i++) {
      arr[i] = bin.charCodeAt(i);
    }

    return URL.createObjectURL(new Blob([buf], {
      type: contentType
    }));
  } catch (err) {
    if (logger) {
      logger("Drafty: failed to convert object.", err.message);
    }
  }

  return null;
}

function base64toDataUrl(b64, contentType) {
  if (!b64) {
    return null;
  }
  contentType = contentType || 'image/jpeg';
  return 'data:' + contentType + ';base64,' + b64;
}

// Helpers for converting Drafty to HTML.
const DECORATORS = {
  // Visial styles
  ST: {
    open: function() {
      return '<b>';
    },
    close: function() {
      return '</b>';
    }
  },
  EM: {
    open: function() {
      return '<i>';
    },
    close: function() {
      return '</i>'
    }
  },
  DL: {
    open: function() {
      return '<del>';
    },
    close: function() {
      return '</del>'
    }
  },
  CO: {
    open: function() {
      return '<tt>';
    },
    close: function() {
      return '</tt>'
    }
  },
  // Line break
  BR: {
    open: function() {
      return '<br/>';
    },
    close: function() {
      return ''
    }
  },
  // Hidden element
  HD: {
    open: function() {
      return '';
    },
    close: function() {
      return '';
    }
  },
  // Highlighted element.
  HL: {
    open: function() {
      return '<span style="color:teal">';
    },
    close: function() {
      return '</span>';
    }
  },
  // Link (URL)
  LN: {
    open: function(data) {
      return '<a href="' + data.url + '">';
    },
    close: function(data) {
      return '</a>';
    },
    props: function(data) {
      return data ? {
        href: data.url,
        target: "_blank"
      } : null;
    },
  },
  // Mention
  MN: {
    open: function(data) {
      return '<a href="#' + data.val + '">';
    },
    close: function(data) {
      return '</a>';
    },
    props: function(data) {
      return data ? {
        name: data.val
      } : null;
    },
  },
  // Hashtag
  HT: {
    open: function(data) {
      return '<a href="#' + data.val + '">';
    },
    close: function(data) {
      return '</a>';
    },
    props: function(data) {
      return data ? {
        name: data.val
      } : null;
    },
  },
  // Button
  BN: {
    open: function(data) {
      return '<button>';
    },
    close: function(data) {
      return '</button>';
    },
    props: function(data) {
      return data ? {
        'data-act': data.act,
        'data-val': data.val,
        'data-name': data.name,
        'data-ref': data.ref
      } : null;
    },
  },
  // Image
  IM: {
    open: function(data) {
      // Don't use data.ref for preview: it's a security risk.
      const tmpPreviewUrl = base64toDataUrl(data._tempPreview, data.mime);
      const previewUrl = base64toObjectUrl(data.val, data.mime, Drafty.logger);
      const downloadUrl = data.ref || previewUrl;
      return (data.name ? '<a href="' + downloadUrl + '" download="' + data.name + '">' : '') +
        '<img src="' + (tmpPreviewUrl || previewUrl) + '"' +
        (data.width ? ' width="' + data.width + '"' : '') +
        (data.height ? ' height="' + data.height + '"' : '') + ' border="0" />';
    },
    close: function(data) {
      return (data.name ? '</a>' : '');
    },
    props: function(data) {
      if (!data) return null;
      return {
        // Temporary preview, or permanent preview, or external link.
        src: base64toDataUrl(data._tempPreview, data.mime) ||
          data.ref || base64toObjectUrl(data.val, data.mime, Drafty.logger),
        title: data.name,
        'data-width': data.width,
        'data-height': data.height,
        'data-name': data.name,
        'data-size': data.val ? ((data.val.length * 0.75) | 0) : (data.size | 0),
        'data-mime': data.mime
      };
    },
  },
  // Form - structured layout of elements.
  FM: {
    open: function(data) {
      return '<div>';
    },
    close: function(data) {
      return '</div>';
    }
  },
  // Row: logic grouping of elements
  RW: {
    open: function(data) {
      return '<div>';
    },
    close: function(data) {
      return '</div>';
    }
  }
};

/**
 * The main object which performs all the formatting actions.
 * @class Drafty
 * @constructor
 */
const Drafty = function() {}

// Take a string and defined earlier style spans, re-compose them into a tree where each leaf is
// a same-style (including unstyled) string. I.e. 'hello *bold _italic_* and ~more~ world' ->
// ('hello ', (b: 'bold ', (i: 'italic')), ' and ', (s: 'more'), ' world');
//
// This is needed in order to clear markup, i.e. 'hello *world*' -> 'hello world' and convert
// ranges from markup-ed offsets to plain text offsets.
function chunkify(line, start, end, spans) {
  const chunks = [];

  if (spans.length == 0) {
    return [];
  }

  for (let i in spans) {
    // Get the next chunk from the queue
    const span = spans[i];

    // Grab the initial unstyled chunk
    if (span.start > start) {
      chunks.push({
        text: line.slice(start, span.start)
      });
    }

    // Grab the styled chunk. It may include subchunks.
    const chunk = {
      type: span.type
    };
    const chld = chunkify(line, span.start + 1, span.end, span.children);
    if (chld.length > 0) {
      chunk.children = chld;
    } else {
      chunk.text = span.text;
    }
    chunks.push(chunk);
    start = span.end + 1; // '+1' is to skip the formatting character
  }

  // Grab the remaining unstyled chunk, after the last span
  if (start < end) {
    chunks.push({
      text: line.slice(start, end)
    });
  }

  return chunks;
}

// Inverse of chunkify. Returns a tree of formatted spans.
function forEach(line, start, end, spans, formatter, context) {
  const result = [];

  // Process ranges calling formatter for each range.
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    if (span.at < 0) {
      // Ask formatter if it wants to do anything with the non-visual span.
      const s = formatter.call(context, span.tp, span.data, undefined, result.length);
      if (s) {
        result.push(s);
      }
      continue;
    }
    // Add un-styled range before the styled span starts.
    if (start < span.at) {
      result.push(formatter.call(context, null, undefined, line.slice(start, span.at), result.length));
      start = span.at;
    }
    // Get all spans which are within current span.
    const subspans = [];
    for (let si = i + 1; si < spans.length && spans[si].at < span.at + span.len; si++) {
      subspans.push(spans[si]);
      i = si;
    }

    const tag = HTML_TAGS[span.tp] || {}
    result.push(formatter.call(context, span.tp, span.data,
      tag.isVoid ? null : forEach(line, start, span.at + span.len, subspans, formatter, context),
      result.length));

    start = span.at + span.len;
  }

  // Add the last unformatted range.
  if (start < end) {
    result.push(formatter.call(context, null, undefined, line.slice(start, end), result.length));
  }

  return result;
}

// Detect starts and ends of formatting spans. Unformatted spans are
// ignored at this stage.
function spannify(original, re_start, re_end, type) {
  const result = [];
  let index = 0;
  let line = original.slice(0); // make a copy;

  while (line.length > 0) {
    // match[0]; // match, like '*abc*'
    // match[1]; // match captured in parenthesis, like 'abc'
    // match['index']; // offset where the match started.

    // Find the opening token.
    const start = re_start.exec(line);
    if (start == null) {
      break;
    }

    // Because javascript RegExp does not support lookbehind, the actual offset may not point
    // at the markup character. Find it in the matched string.
    let start_offset = start['index'] + start[0].lastIndexOf(start[1]);
    // Clip the processed part of the string.
    line = line.slice(start_offset + 1);
    // start_offset is an offset within the clipped string. Convert to original index.
    start_offset += index;
    // Index now point to the beginning of 'line' within the 'original' string.
    index = start_offset + 1;

    // Find the matching closing token.
    const end = re_end ? re_end.exec(line) : null;
    if (end == null) {
      break;
    }
    let end_offset = end['index'] + end[0].indexOf(end[1]);
    // Clip the processed part of the string.
    line = line.slice(end_offset + 1);
    // Update offsets
    end_offset += index;
    // Index now point to the beginning of 'line' within the 'original' string.
    index = end_offset + 1;

    result.push({
      text: original.slice(start_offset + 1, end_offset),
      children: [],
      start: start_offset,
      end: end_offset,
      type: type
    });
  }

  return result;
}

// Convert linear array or spans into a tree representation.
// Keep standalone and nested spans, throw away partially overlapping spans.
function toTree(spans) {
  if (spans.length == 0) {
    return [];
  }

  const tree = [spans[0]];
  let last = spans[0];
  for (let i = 1; i < spans.length; i++) {
    // Keep spans which start after the end of the previous span or those which
    // are complete within the previous span.

    if (spans[i].start > last.end) {
      // Span is completely outside of the previous span.
      tree.push(spans[i]);
      last = spans[i];
    } else if (spans[i].end < last.end) {
      // Span is fully inside of the previous span. Push to subnode.
      last.children.push(spans[i]);
    }
    // Span could partially overlap, ignoring it as invalid.
  }

  // Recursively rearrange the subnodes.
  for (let i in tree) {
    tree[i].children = toTree(tree[i].children);
  }

  return tree;
}

// Get a list of entities from a text.
function extractEntities(line) {
  let match;
  let extracted = [];
  ENTITY_TYPES.map(function(entity) {
    while ((match = entity.re.exec(line)) !== null) {
      extracted.push({
        offset: match['index'],
        len: match[0].length,
        unique: match[0],
        data: entity.pack(match[0]),
        type: entity.name
      });
    }
  });

  if (extracted.length == 0) {
    return extracted;
  }

  // Remove entities detected inside other entities, like #hashtag in a URL.
  extracted.sort(function(a, b) {
    return a.offset - b.offset;
  });

  let idx = -1;
  extracted = extracted.filter(function(el) {
    const result = (el.offset > idx);
    idx = el.offset + el.len;
    return result;
  });

  return extracted;
}

// Convert the chunks into format suitable for serialization.
function draftify(chunks, startAt) {
  let plain = "";
  let ranges = [];
  for (let i in chunks) {
    const chunk = chunks[i];
    if (!chunk.text) {
      const drafty = draftify(chunk.children, plain.length + startAt);
      chunk.text = drafty.txt;
      ranges = ranges.concat(drafty.fmt);
    }

    if (chunk.type) {
      ranges.push({
        at: plain.length + startAt,
        len: chunk.text.length,
        tp: chunk.type
      });
    }

    plain += chunk.text;
  }
  return {
    txt: plain,
    fmt: ranges
  };
}

// Splice two strings: insert second string into the first one at the given index
function splice(src, at, insert) {
  return src.slice(0, at) + insert + src.slice(at);
}

/**
 * Parse plain text into Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {String} content - plain-text content to parse.
 * @return {Drafty} parsed document or null if the source is not plain text.
 */
Drafty.parse = function(content) {
  // Make sure we are parsing strings only.
  if (typeof content != 'string') {
    return null;
  }

  // Split text into lines. It makes further processing easier.
  const lines = content.split(/\r?\n/);

  // Holds entities referenced from text
  const entityMap = [];
  const entityIndex = {};

  // Processing lines one by one, hold intermediate result in blx.
  const blx = [];
  lines.map(function(line) {
    let spans = [];
    let entities;

    // Find formatted spans in the string.
    // Try to match each style.
    INLINE_STYLES.map(function(style) {
      // Each style could be matched multiple times.
      spans = spans.concat(spannify(line, style.start, style.end, style.name));
    });

    let block;
    if (spans.length == 0) {
      block = {
        txt: line
      };
    } else {
      // Sort spans by style occurence early -> late
      spans.sort(function(a, b) {
        return a.start - b.start;
      });

      // Convert an array of possibly overlapping spans into a tree
      spans = toTree(spans);

      // Build a tree representation of the entire string, not
      // just the formatted parts.
      const chunks = chunkify(line, 0, line.length, spans);

      const drafty = draftify(chunks, 0);

      block = {
        txt: drafty.txt,
        fmt: drafty.fmt
      };
    }

    // Extract entities from the cleaned up string.
    entities = extractEntities(block.txt);
    if (entities.length > 0) {
      const ranges = [];
      for (let i in entities) {
        // {offset: match['index'], unique: match[0], len: match[0].length, data: ent.packer(), type: ent.name}
        const entity = entities[i];
        let index = entityIndex[entity.unique];
        if (!index) {
          index = entityMap.length;
          entityIndex[entity.unique] = index;
          entityMap.push({
            tp: entity.type,
            data: entity.data
          });
        }
        ranges.push({
          at: entity.offset,
          len: entity.len,
          key: index
        });
      }
      block.ent = ranges;
    }

    blx.push(block);
  });

  const result = {
    txt: ""
  };

  // Merge lines and save line breaks as BR inline formatting.
  if (blx.length > 0) {
    result.txt = blx[0].txt;
    result.fmt = (blx[0].fmt || []).concat(blx[0].ent || []);

    for (let i = 1; i < blx.length; i++) {
      const block = blx[i];
      const offset = result.txt.length + 1;

      result.fmt.push({
        tp: 'BR',
        len: 1,
        at: offset - 1
      });

      result.txt += " " + block.txt;
      if (block.fmt) {
        result.fmt = result.fmt.concat(block.fmt.map(function(s) {
          s.at += offset;
          return s;
        }));
      }
      if (block.ent) {
        result.fmt = result.fmt.concat(block.ent.map(function(s) {
          s.at += offset;
          return s;
        }));
      }
    }

    if (result.fmt.length == 0) {
      delete result.fmt;
    }

    if (entityMap.length > 0) {
      result.ent = entityMap;
    }
  }
  return result;
}

/**
 * Initialize Drafty document to a plain text string.
 *
 * @param {String} plainText - string to use as Drafty content.
 *
 * @returns new Drafty document or null is plainText is not a string.
 */
Drafty.init = function(plainText) {
  if (typeof plainText != 'string') {
    return null;
  }
  return {
    txt: plainText
  };
}

/**
 * Append one Drafty document to another.
 *
 * @param {Drafty} first - Drafty document to append to.
 * @param {Drafty} second - Drafty document being appended.
 *
 * @return {Drafty} first document with the second appended to it.
 */
Drafty.append = function(first, second) {
  if (first == null) {
    return second;
  }
  if (second == null) {
    return first;
  }

  first.txt = first.txt || '';
  second.txt = second.txt || '';
  const len = first.txt.length;

  first.txt += second.txt;
  if (Array.isArray(second.fmt)) {
    first.fmt = first.fmt || [];
    if (Array.isArray(second.ent)) {
      first.ent = first.ent || [];
    }
    second.fmt.forEach(src => {
      const fmt = {
        at: src.at + len,
        len: src.len
      };
      if (src.tp) {
        fmt.tp = src.tp;
      } else {
        fmt.key = first.ent.length;
        first.ent.push(second.ent[src.key || 0]);
      }
      first.fmt.push(fmt);
    });
  }

  return first;
}

/**
 * @typedef Drafty.ImageDesc
 * @memberof Drafty
 * @type Object
 * @param {string} mime - mime-type of the image, e.g. "image/png"
 * @param {string} preview - base64-encoded image content (or preview, if large image is attached). Could be null/undefined.
 * @param {integer} width - width of the image
 * @param {integer} height - height of the image
 * @param {string} filename - file name suggestion for downloading the image.
 * @param {integer} size - size of the image in bytes. Treat is as an untrusted hint.
 * @param {string} refurl - reference to the content. Could be null/undefined.
 * @param {string} _tempPreview - base64-encoded image preview used during upload process; not serializable.
 * @param {Promise} urlPromise - Promise which returns content URL when resolved.
 */

/**
 * Insert inline image into Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to add image to.
 * @param {integer} at - index where the object is inserted. The length of the image is always 1.
 * @param {ImageDesc} imageDesc - object with image paramenets and data.
 *
 * @return {Drafty} updated document.
 */
Drafty.insertImage = function(content, at, imageDesc) {
  content = content || {
    txt: " "
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: at,
    len: 1,
    key: content.ent.length
  });

  const ex = {
    tp: 'IM',
    data: {
      mime: imageDesc.mime,
      val: imageDesc.preview,
      width: imageDesc.width,
      height: imageDesc.height,
      name: imageDesc.filename,
      size: imageDesc.size | 0,
      ref: imageDesc.refurl
    }
  };

  if (imageDesc.urlPromise) {
    ex.data._tempPreview = imageDesc._tempPreview;
    ex.data._processing = true;
    imageDesc.urlPromise.then(
      (url) => {
        ex.data.ref = url;
        ex.data._tempPreview = undefined;
        ex.data._processing = undefined;
      },
      (err) => {
        /* catch the error, otherwise it will appear in the console. */
        ex.data._processing = undefined;
      }
    );
  }

  content.ent.push(ex);

  return content;
}

/**
 * Append inline image to Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to add image to.
 * @param {ImageDesc} imageDesc - object with image paramenets.
 *
 * @return {Drafty} updated document.
 */
Drafty.appendImage = function(content, imageDesc) {
  content = content || {
    txt: ""
  };
  content.txt += " ";
  return Drafty.insertImage(content, content.txt.length - 1, imageDesc);
}

/**
 * @typedef Drafty.AttachmentDesc
 * @memberof Drafty
 * @type Object
 * @param {string} mime - mime-type of the image, e.g. "image/png"
 * @param {string} data - base64-encoded in-band content of small attachments. Could be null/undefined.
 * @param {string} filename - file name suggestion for downloading the attachment.
 * @param {integer} size - size of the file in bytes. Treat is as an untrusted hint.
 * @param {string} refurl - reference to the out-of-band content. Could be null/undefined.
 * @param {Promise} urlPromise - Promise which returns content URL when resolved.
 */

/**
 * Attach file to Drafty content. Either as a blob or as a reference.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to attach file to.
 * @param {AttachmentDesc} object - containing attachment description and data.
 *
 * @return {Drafty} updated document.
 */
Drafty.attachFile = function(content, attachmentDesc) {
  content = content || {
    txt: ""
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: -1,
    len: 0,
    key: content.ent.length
  });

  const ex = {
    tp: 'EX',
    data: {
      mime: attachmentDesc.mime,
      val: attachmentDesc.data,
      name: attachmentDesc.filename,
      ref: attachmentDesc.refurl,
      size: attachmentDesc.size | 0
    }
  }
  if (attachmentDesc.urlPromise) {
    ex.data._processing = true;
    attachmentDesc.urlPromise.then(
      (url) => {
        ex.data.ref = url;
        ex.data._processing = undefined;
      },
      (err) => {
        /* catch the error, otherwise it will appear in the console. */
        ex.data._processing = undefined;
      }
    );
  }
  content.ent.push(ex);

  return content;
}

/**
 * Wraps content into an interactive form.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty|string} content - to wrap into a form.
 * @param {number} at - index where the forms starts.
 * @param {number} len - length of the form content.
 *
 * @return {Drafty} updated document.
 */
Drafty.wrapAsForm = function(content, at, len) {
  if (typeof content == 'string') {
    content = {
      txt: content
    };
  }
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: at,
    len: len,
    tp: 'FM'
  });

  return content;
}

/**
 * Insert clickable button into Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty|string} content - Drafty document to insert button to or a string to be used as button text.
 * @param {number} at - location where the button is inserted.
 * @param {number} len - the length of the text to be used as button title.
 * @param {string} name - the button. Client should return it to the server when the button is clicked.
 * @param {string} actionType - the type of the button, one of 'url' or 'pub'.
 * @param {string} actionValue - the value to return on click:
 * @param {string} refUrl - the URL to go to when the 'url' button is clicked.
 *
 * @return {Drafty} updated document.
 */
Drafty.insertButton = function(content, at, len, name, actionType, actionValue, refUrl) {
  if (typeof content == 'string') {
    content = {
      txt: content
    };
  }

  if (!content || !content.txt || content.txt.length < at + len) {
    return null;
  }

  if (len <= 0 || ['url', 'pub'].indexOf(actionType) == -1) {
    return null;
  }
  // Ensure refUrl is a string.
  if (actionType == 'url' && !refUrl) {
    return null;
  }
  refUrl = '' + refUrl;

  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: at,
    len: len,
    key: content.ent.length
  });
  content.ent.push({
    tp: 'BN',
    data: {
      act: actionType,
      val: actionValue,
      ref: refUrl,
      name: name
    }
  });

  return content;
}

/**
 * Append clickable button to Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty|string} content - Drafty document to insert button to or a string to be used as button text.
 * @param {string} title - the text to be used as button title.
 * @param {string} name - the button. Client should return it to the server when the button is clicked.
 * @param {string} actionType - the type of the button, one of 'url' or 'pub'.
 * @param {string} actionValue - the value to return on click:
 * @param {string} refUrl - the URL to go to when the 'url' button is clicked.
 *
 * @return {Drafty} updated document.
 */
Drafty.appendButton = function(content, title, name, actionType, actionValue, refUrl) {
  content = content || {
    txt: ""
  };
  const at = content.txt.length;
  content.txt += title;
  return Drafty.insertButton(content, at, title.length, name, actionType, actionValue, refUrl);
}

/**
 * Attach a generic JS object. The object is attached as a json string.
 * Intended for representing a form response.
 *
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - Drafty document to attach file to.
 * @param {Object} data - data to convert to json string and attach.
 * @returns {Drafty} the same document as <code>content</code>.
 */
Drafty.attachJSON = function(content, data) {
  content = content || {
    txt: ""
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: -1,
    len: 0,
    key: content.ent.length
  });

  content.ent.push({
    tp: 'EX',
    data: {
      mime: JSON_MIME_TYPE,
      val: data
    }
  });

  return content;
}
/**
 * Append line break to a Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - Drafty document to append linebreak to.
 * @returns {Drafty} the same document as <code>content</code>.
 */
Drafty.appendLineBreak = function(content) {
  content = content || {
    txt: ""
  };
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: content.txt.length,
    len: 1,
    tp: 'BR'
  });
  content.txt += " ";

  return content;
}
/**
 * Given Drafty document, convert it to HTML.
 * No attempt is made to strip pre-existing html markup.
 * This is potentially unsafe because <code>content.txt</code> may contain malicious
 * markup.
 * @memberof Tinode.Drafty
 * @static
 *
 * @param {Drafy} content - document to convert.
 *
 * @returns {string} HTML-representation of content.
 */
Drafty.UNSAFE_toHTML = function(content) {
  let {
    txt,
    fmt,
    ent
  } = content;

  const markup = [];
  if (fmt) {
    for (let i in fmt) {
      const range = fmt[i];
      const at = range.at | 0;
      let tp = range.tp;
      let data;
      if (!tp) {
        const entity = ent[range.key | 0];
        if (entity) {
          tp = entity.tp;
          data = entity.data;
        }
      }

      if (DECORATORS[tp]) {
        // Because we later sort in descending order, closing markup must come first.
        // Otherwise zero-length objects will not be represented correctly.
        markup.push({
          idx: at + range.len,
          len: -range.len,
          what: DECORATORS[tp].close(data)
        });
        markup.push({
          idx: at,
          len: range.len,
          what: DECORATORS[tp].open(data)
        });
      }
    }
  }

  markup.sort(function(a, b) {
    return b.idx == a.idx ? b.len - a.len : b.idx - a.idx; // in descending order
  });

  for (let i in markup) {
    if (markup[i].what) {
      txt = splice(txt, markup[i].idx, markup[i].what);
    }
  }

  return txt;
}

/**
 * Callback for applying custom formatting/transformation to a Drafty document.
 * Called once for each syle span.
 * @memberof Drafty
 * @static
 *
 * @callback Formatter
 * @param {string} style - style code such as "ST" or "IM".
 * @param {Object} data - entity's data
 * @param {Object} values - possibly styled subspans contained in this style span.
 * @param {number} index - of the current element among its siblings.
 */

/**
 * Transform Drafty document using custom formatting.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to transform.
 * @param {Formatter} formatter - callback which transforms individual elements
 * @param {Object} context - context provided to formatter as <code>this</code>.
 *
 * @return {Object} transformed object
 */
Drafty.format = function(content, formatter, context) {
  let {
    txt,
    fmt,
    ent
  } = content;

  // Assign default values.
  txt = txt || "";
  if (!Array.isArray(ent)) {
    ent = [];
  }

  if (!Array.isArray(fmt)) {
    // Handle special case when all values in fmt are 0 and fmt is skipped.
    if (ent.length == 1) {
      fmt = [{
        at: 0,
        len: 0,
        key: 0
      }];
    } else {
      return [txt];
    }
  }

  let spans = [].concat(fmt);

  // Zero values may have been stripped. Restore them.
  // Also ensure indexes and lengths are sane.
  spans.map(function(s) {
    s.at = s.at || 0;
    s.len = s.len || 0;
    if (s.len < 0) {
      s.len = 0;
    }
    if (s.at < -1) {
      s.at = -1;
    }
  });

  // Sort spans first by start index (asc) then by length (desc).
  spans.sort(function(a, b) {
    if (a.at - b.at == 0) {
      return b.len - a.len; // longer one comes first (<0)
    }
    return a.at - b.at;
  });

  // Denormalize entities into spans. Create a copy of the objects to leave
  // original Drafty object unchanged.
  spans = spans.map((s) => {
    let data;
    let tp = s.tp;
    if (!tp) {
      s.key = s.key || 0;
      if (ent[s.key]) {
        data = ent[s.key].data;
        tp = ent[s.key].tp;
      }
    }

    // Type still not defined? Hide invalid element.
    tp = tp || 'HD';

    return {
      tp: tp,
      data: data,
      at: s.at,
      len: s.len
    };
  });

  return forEach(txt, 0, txt.length, spans, formatter, context);
}

/**
 * Given Drafty document, convert it to plain text.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to convert to plain text.
 * @returns {string} plain-text representation of the drafty document.
 */
Drafty.toPlainText = function(content) {
  return typeof content == 'string' ? content : content.txt;
}

/**
 * Check if the document has no markup and no entities.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to check for presence of markup.
 * @returns <code>true</code> is content is plain text, <code>false</code> otherwise.
 */
Drafty.isPlainText = function(content) {
  return typeof content == 'string' || !(content.fmt || content.ent);
}

/**
 * Checks if the object represets is a valid Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to check for validity.
 * @returns <code>true</code> is content is valid, <code>false</code> otherwise.
 */
Drafty.isValid = function(content) {
  if (!content) {
    return false;
  }

  const {
    txt,
    fmt,
    ent
  } = content;

  if (!txt && txt !== '' && !fmt && !ent) {
    return false;
  }

  const txt_type = typeof txt;
  if (txt_type != 'string' && txt_type != 'undefined' && txt !== null) {
    return false;
  }

  if (typeof fmt != 'undefined' && !Array.isArray(fmt) && fmt !== null) {
    return false;
  }

  if (typeof ent != 'undefined' && !Array.isArray(ent) && ent !== null) {
    return false;
  }
  return true;
}

/**
 * Check if the drafty document has attachments.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to check for attachments.
 * @returns <code>true</code> if there are attachments.
 */
Drafty.hasAttachments = function(content) {
  if (content.ent && content.ent.length > 0) {
    for (let i in content.ent) {
      if (content.ent[i] && content.ent[i].tp == 'EX') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Callback for applying custom formatting/transformation to a Drafty document.
 * Called once for each syle span.
 * @memberof Drafty
 * @static
 *
 * @callback AttachmentCallback
 * @param {Object} data attachment data
 * @param {number} index attachment's index in `content.ent`.
 */

/**
 * Enumerate attachments.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to process for attachments.
 * @param {AttachmentCallback} callback - callback to call for each attachment.
 * @param {Object} context - value of "this" for callback.
 */
Drafty.attachments = function(content, callback, context) {
  if (content.ent && content.ent.length > 0) {
    for (let i in content.ent) {
      if (content.ent[i] && content.ent[i].tp == 'EX') {
        callback.call(context, content.ent[i].data, i);
      }
    }
  }
}

/**
 * Given the entity, get URL which can be used for downloading
 * entity data.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entData - entity.data to get the URl from.
 * @returns {string} URL to download entity data or <code>null</code>.
 */
Drafty.getDownloadUrl = function(entData) {
  let url = null;
  if (entData.mime != JSON_MIME_TYPE && entData.val) {
    url = base64toObjectUrl(entData.val, entData.mime, Drafty.logger);
  } else if (typeof entData.ref == 'string') {
    url = entData.ref;
  }
  return url;
}

/**
 * Check if the entity data is not ready for sending, such as being uploaded to the server.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entity.data to get the URl from.
 * @returns {boolean} true if upload is in progress, false otherwise.
 */
Drafty.isProcessing = function(entData) {
  return !!entData._processing;
}

/**
 * Given the entity, get URL which can be used for previewing
 * the entity.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entity.data to get the URl from.
 *
 * @returns {string} url for previewing or null if no such url is available.
 */
Drafty.getPreviewUrl = function(entData) {
  return entData.val ? base64toObjectUrl(entData.val, entData.mime, Drafty.logger) : null;
}

/**
 * Get approximate size of the entity.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entData - entity.data to get the size for.
 * @returns {number} size of entity data in bytes.
 */
Drafty.getEntitySize = function(entData) {
  // Either size hint or length of value. The value is base64 encoded,
  // the actual object size is smaller than the encoded length.
  return entData.size ? entData.size : entData.val ? (entData.val.length * 0.75) | 0 : 0;
}

/**
 * Get entity mime type.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entData - entity.data to get the type for.
 * @returns {string} mime type of entity.
 */
Drafty.getEntityMimeType = function(entData) {
  return entData.mime || 'text/plain';
}

/**
 * Get HTML tag for a given two-letter style name.
 * @memberof Drafty
 * @static
 *
 * @param {string} style - two-letter style, like ST or LN.
 *
 * @returns {string} HTML tag name if style is found, '_UNKN' if not found, {code: undefined} if style is falsish.
 */
Drafty.tagName = function(style) {
  return style ? (HTML_TAGS[style] ? HTML_TAGS[style].name : '_UNKN') : undefined;
}

/**
 * For a given data bundle generate an object with HTML attributes,
 * for instance, given {url: "http://www.example.com/"} return
 * {href: "http://www.example.com/"}
 * @memberof Drafty
 * @static
 *
 * @param {string} style - two-letter style to generate attributes for.
 * @param {Object} data - data bundle to convert to attributes
 *
 * @returns {Object} object with HTML attributes.
 */
Drafty.attrValue = function(style, data) {
  if (data && DECORATORS[style]) {
    return DECORATORS[style].props(data);
  }

  return undefined;
}

/**
 * Drafty MIME type.
 * @memberof Drafty
 * @static
 *
 * @returns {string} HTTP Content-Type "text/x-drafty".
 */
Drafty.getContentType = function() {
  return 'text/x-drafty';
}

/**
 * Shorten Drafty document and strip all entity data leaving just inline styles and entity references.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} original - Drafty object to shorten.
 * @param {number} length - length in characters to shorten to.
 * @returns new shortened Drafty object leaving the original intact.
 */
Drafty.preview = function(original, length) {
  if (!original || length <= 0 || typeof original != 'object') {
    return null;
  }

  const {
    txt,
    fmt,
    ent
  } = original;

  const preview = {
    txt: ''
  };
  let len = 0;
  if (typeof txt == 'string') {
    if (txt.length > length) {
      preview.txt = txt.substr(0, length);
    } else {
      preview.txt = txt;
    }
    len = preview.txt.length;
  }

  if (Array.isArray(fmt) && fmt.length > 0) {
    // Old key to new key entity mapping.
    const ent_refs = [];
    // Count styles which start within the new length of the text and save entity keys as a set.
    let fmt_count = 0;
    let ent_count = 0;
    fmt.forEach((st) => {
      if (st.at < len) {
        fmt_count++;
        if (!st.tp) {
          const key = st.key | 0;
          if (!ent_refs[key]) {
            ent_refs[key] = ent_count;
            ent_count++;
          }
        }
      }
    });

    if (fmt_count == 0) {
      return preview;
    }

    // Allocate space for copying styles and entities.
    preview.fmt = [];
    if (Array.isArray(ent) && ent_refs.length > 0) {
      preview.ent = [];
    }

    // Insertion point for styles.
    let fmt_idx = 0;
    fmt.forEach((st) => {
      if (st.at < len) {
        const style = {
          at: st.at,
          len: st.len
        };
        const key = st.key | 0;
        if (st.tp) {
          style.tp = '' + st.tp;
        } else if (Array.isArray(ent) && ent.length > key && typeof ent_refs[key] == 'number') {
          style.key = ent_refs[key];
          preview.ent[style.key] = copyLight(ent[key]);
        } else {
          return;
        }
        preview.fmt[fmt_idx++] = style;
      }
    });
  }

  return preview;
}

// Create a copy of an entity without large data.
function copyLight(ent) {
  let result = {
    tp: ent.tp
  };
  if (ent.data && Object.entries(ent.data).length != 0) {
    dc = {};
    ["mime", "name", "width", "height", "size"].forEach((key) => {
      const val = ent.data[key];
      if (val) {
        dc[key] = val;
      }
    });
    if (Object.entries(dc).length != 0) {
      result.data = dc;
    }
  }
  return result;
}

if (typeof module != 'undefined') {
  module.exports = Drafty;
}

},{}],3:[function(require,module,exports){
(function (global){(function (){
/**
 * @file SDK to connect to Tinode chat server.
 * See <a href="https://github.com/tinode/webapp">
 * https://github.com/tinode/webapp</a> for real-life usage.
 *
 * @copyright 2015-2021 Tinode
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.17
 *
 * @example
 * <head>
 * <script src=".../tinode.js"></script>
 * </head>
 *
 * <body>
 *  ...
 * <script>
 *  // Instantiate tinode.
 *  const tinode = new Tinode(APP_NAME, HOST, API_KEY, null, true);
 *  tinode.enableLogging(true);
 *  // Add logic to handle disconnects.
 *  tinode.onDisconnect = function(err) { ... };
 *  // Connect to the server.
 *  tinode.connect().then(() => {
 *    // Connected. Login now.
 *    return tinode.loginBasic(login, password);
 *  }).then((ctrl) => {
 *    // Logged in fine, attach callbacks, subscribe to 'me'.
 *    const me = tinode.getMeTopic();
 *    me.onMetaDesc = function(meta) { ... };
 *    // Subscribe, fetch topic description and the list of contacts.
 *    me.subscribe({get: {desc: {}, sub: {}});
 *  }).catch((err) => {
 *    // Login or subscription failed, do something.
 *    ...
 *  });
 *  ...
 * </script>
 * </body>
 */
'use strict';

// NOTE TO DEVELOPERS:
// Localizable strings should be double quoted "строка на другом языке",
// non-localizable strings should be single quoted 'non-localized'.

if (typeof require == 'function') {
  if (typeof Drafty == 'undefined') {
    var Drafty = require('./drafty.js');
  }
  if (typeof DB == 'undefined') {
    var DB = require('./db.js');
  }
  var package_version = require('../version.json').version;
}

let WebSocketProvider;
if (typeof WebSocket != 'undefined') {
  WebSocketProvider = WebSocket;
}

let XHRProvider;
if (typeof XMLHttpRequest != 'undefined') {
  XHRProvider = XMLHttpRequest;
}
initForNonBrowserApp();

// Global constants
const PROTOCOL_VERSION = '0'; // Major component of the version, 0 in 0.16.9
const VERSION = package_version || '0.17';
const LIBRARY = 'tinodejs/' + VERSION;

const TOPIC_NEW = 'new';
const TOPIC_NEW_CHAN = 'nch';
const TOPIC_ME = 'me';
const TOPIC_FND = 'fnd';
const TOPIC_SYS = 'sys';
const TOPIC_CHAN = 'chn';
const USER_NEW = 'new';

// Starting value of a locally-generated seqId used for pending messages.
const LOCAL_SEQID = 0xFFFFFFF;

const MESSAGE_STATUS_NONE = 0; // Status not assigned.
const MESSAGE_STATUS_QUEUED = 1; // Local ID assigned, in progress to be sent.
const MESSAGE_STATUS_SENDING = 2; // Transmission started.
const MESSAGE_STATUS_FAILED = 3; // At least one attempt was made to send the message.
const MESSAGE_STATUS_SENT = 4; // Delivered to the server.
const MESSAGE_STATUS_RECEIVED = 5; // Received by the client.
const MESSAGE_STATUS_READ = 6; // Read by the user.
const MESSAGE_STATUS_TO_ME = 7; // Message from another user.

// Error code to return in case of a network problem.
const NETWORK_ERROR = 503;
const NETWORK_ERROR_TEXT = "Connection failed";

// Reject unresolved futures after this many milliseconds.
const EXPIRE_PROMISES_TIMEOUT = 5000;
// Periodicity of garbage collection of unresolved futures.
const EXPIRE_PROMISES_PERIOD = 1000;

// Error code to return when user disconnected from server.
const NETWORK_USER = 418;
const NETWORK_USER_TEXT = "Disconnected by client";

// Default number of messages to pull into memory from persistent cache.
const DEFAULT_MESSAGES_PAGE = 24;

// Utility functions

// Add brower missing function for non browser app, eg nodeJs
function initForNonBrowserApp() {
  // Tinode requirement in native mode because react native doesn't provide Base64 method
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  if (typeof btoa == 'undefined') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    global.btoa = function(input = '') {
      let str = input;
      let output = '';

      for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || (map = '=', i % 1); output += map.charAt(63 & block >> 8 - i % 1 * 8)) {

        charCode = str.charCodeAt(i += 3 / 4);

        if (charCode > 0xFF) {
          throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
        }

        block = block << 8 | charCode;
      }

      return output;
    };
  }

  if (typeof atob == 'undefined') {
    global.atob = function(input = '') {
      let str = input.replace(/=+$/, '');
      let output = '';

      if (str.length % 4 == 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
      }
      for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++);

        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
          bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
      ) {
        buffer = chars.indexOf(buffer);
      }

      return output;
    };
  }

  if (typeof window == 'undefined') {
    global.window = {
      WebSocket: WebSocketProvider,
      XMLHttpRequest: XHRProvider,
      URL: {
        createObjectURL: function() {
          throw new Error("Unable to use URL.createObjectURL in a non-browser application");
        }
      }
    }
  }
}

// RFC3339 formater of Date
function rfc3339DateString(d) {
  if (!d || d.getTime() == 0) {
    return undefined;
  }

  function pad(val, sp) {
    sp = sp || 2;
    return '0'.repeat(sp - ('' + val).length) + val;
  }

  const millis = d.getUTCMilliseconds();
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) +
    'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) +
    (millis ? '.' + pad(millis, 3) : '') + 'Z';
}

// btoa replacement. Stock btoa fails on on non-Latin1 strings.
function b64EncodeUnicode(str) {
  // The encodeURIComponent percent-encodes UTF-8 string,
  // then the percent encoding is converted into raw bytes which
  // can be fed into btoa.
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
}

// Recursively merge src's own properties to dst.
// Ignore properties where ignore[property] is true.
// Array and Date objects are shallow-copied.
function mergeObj(dst, src, ignore) {
  if (typeof src != 'object') {
    if (src === Tinode.DEL_CHAR) {
      return undefined;
    }
    if (src === undefined) {
      return dst;
    }
    return src;
  }
  // JS is crazy: typeof null is 'object'.
  if (src === null) {
    return src;
  }

  // Handle Date
  if (src instanceof Date) {
    return (!dst || !(dst instanceof Date) || dst < src) ? src : dst;
  }

  // Access mode
  if (src instanceof AccessMode) {
    return new AccessMode(src);
  }

  // Handle Array
  if (src instanceof Array) {
    return src;
  }

  if (!dst || dst === Tinode.DEL_CHAR) {
    dst = src.constructor();
  }

  for (let prop in src) {
    if (src.hasOwnProperty(prop) &&
      (!ignore || !ignore[prop]) &&
      (prop != '_noForwarding')) {

      dst[prop] = mergeObj(dst[prop], src[prop]);
    }
  }
  return dst;
}

// Update object stored in a cache. Returns updated value.
function mergeToCache(cache, key, newval, ignore) {
  cache[key] = mergeObj(cache[key], newval, ignore);
  return cache[key];
}

function stringToDate(obj) {
  if (typeof obj.created == 'string') {
    obj.created = new Date(obj.created);
  }
  if (typeof obj.updated == 'string') {
    obj.updated = new Date(obj.updated);
  }
  if (typeof obj.touched == 'string') {
    obj.touched = new Date(obj.touched);
  }
}

// JSON stringify helper - pre-processor for JSON.stringify
function jsonBuildHelper(key, val) {
  if (val instanceof Date) {
    // Convert javascript Date objects to rfc3339 strings
    val = rfc3339DateString(val);
  } else if (val instanceof AccessMode) {
    val = val.jsonHelper();
  } else if (val === undefined || val === null || val === false ||
    (Array.isArray(val) && val.length == 0) ||
    ((typeof val == 'object') && (Object.keys(val).length == 0))) {
    // strip out empty elements while serializing objects to JSON
    return undefined;
  }

  return val;
};

// Strips all values from an object of they evaluate to false or if their name starts with '_'.
function simplify(obj) {
  Object.keys(obj).forEach(function(key) {
    if (key[0] == '_') {
      // Strip fields like "obj._key".
      delete obj[key];
    } else if (!obj[key]) {
      // Strip fields which evaluate to false.
      delete obj[key];
    } else if (Array.isArray(obj[key]) && obj[key].length == 0) {
      // Strip empty arrays.
      delete obj[key];
    } else if (!obj[key]) {
      // Strip fields which evaluate to false.
      delete obj[key];
    } else if (typeof obj[key] == 'object' && !(obj[key] instanceof Date)) {
      simplify(obj[key]);
      // Strip empty objects.
      if (Object.getOwnPropertyNames(obj[key]).length == 0) {
        delete obj[key];
      }
    }
  });
  return obj;
};

// Trim whitespace, strip empty and duplicate elements elements.
// If the result is an empty array, add a single element "\u2421" (Unicode Del character).
function normalizeArray(arr) {
  let out = [];
  if (Array.isArray(arr)) {
    // Trim, throw away very short and empty tags.
    for (let i = 0, l = arr.length; i < l; i++) {
      let t = arr[i];
      if (t) {
        t = t.trim().toLowerCase();
        if (t.length > 1) {
          out.push(t);
        }
      }
    }
    out.sort().filter(function(item, pos, ary) {
      return !pos || item != ary[pos - 1];
    });
  }
  if (out.length == 0) {
    // Add single tag with a Unicode Del character, otherwise an ampty array
    // is ambiguos. The Del tag will be stripped by the server.
    out.push(Tinode.DEL_CHAR);
  }
  return out;
}

// Attempt to convert date strings to objects.
function jsonParseHelper(key, val) {
  // Convert string timestamps with optional milliseconds to Date
  // 2015-09-02T01:45:43[.123]Z
  if (key === 'ts' && typeof val === 'string' &&
    val.length >= 20 && val.length <= 24) {
    let date = new Date(val);
    if (date) {
      return date;
    }
  } else if (key === 'acs' && typeof val === 'object') {
    return new AccessMode(val);
  }
  return val;
};

// Trims very long strings (encoded images) to make logged packets more readable.
function jsonLoggerHelper(key, val) {
  if (typeof val == 'string' && val.length > 128) {
    return '<' + val.length + ', bytes: ' + val.substring(0, 12) + '...' + val.substring(val.length - 12) + '>';
  }
  return jsonBuildHelper(key, val);
};

// Parse browser user agent to extract browser name and version.
function getBrowserInfo(ua, product) {
  ua = ua || '';
  let reactnative = '';
  // Check if this is a ReactNative app.
  if (/reactnative/i.test(product)) {
    reactnative = 'ReactNative; ';
  }
  // Then test for WebKit based browser.
  ua = ua.replace(' (KHTML, like Gecko)', '');
  let m = ua.match(/(AppleWebKit\/[.\d]+)/i);
  let result;
  if (m) {
    // List of common strings, from more useful to less useful.
    let priority = ['chrome', 'safari', 'mobile', 'version'];
    let tmp = ua.substr(m.index + m[0].length).split(" ");
    let tokens = [];
    // Split Name/0.0.0 into Name and version 0.0.0
    for (let i = 0; i < tmp.length; i++) {
      let m2 = /([\w.]+)[\/]([\.\d]+)/.exec(tmp[i]);
      if (m2) {
        tokens.push([m2[1], m2[2], priority.findIndex(function(e) {
          return (e == m2[1].toLowerCase());
        })]);
      }
    }
    // Sort by priority: more interesting is earlier than less interesting.
    tokens.sort(function(a, b) {
      let diff = a[2] - b[2];
      return diff != 0 ? diff : b[0].length - a[0].length;
    });
    if (tokens.length > 0) {
      // Return the least common browser string and version.
      result = tokens[0][0] + '/' + tokens[0][1];
    } else {
      // Failed to ID the browser. Return the webkit version.
      result = m[1];
    }
    // Test for MSIE.
  } else if (/trident/i.test(ua)) {
    m = /(?:\brv[ :]+([.\d]+))|(?:\bMSIE ([.\d]+))/g.exec(ua);
    if (m) {
      result = 'MSIE/' + (m[1] || m[2]);
    } else {
      result = 'MSIE/?';
    }
    // Test for Firefox.
  } else if (/firefox/i.test(ua)) {
    m = /Firefox\/([.\d]+)/g.exec(ua);
    if (m) {
      result = 'Firefox/' + m[1];
    } else {
      result = 'Firefox/?';
    }
    // Older Opera.
  } else if (/presto/i.test(ua)) {
    m = /Opera\/([.\d]+)/g.exec(ua);
    if (m) {
      result = 'Opera/' + m[1];
    } else {
      result = 'Opera/?';
    }
  } else {
    // Failed to parse anything meaningfull. Try the last resort.
    m = /([\w.]+)\/([.\d]+)/.exec(ua);
    if (m) {
      result = m[1] + '/' + m[2];
    } else {
      m = ua.split(' ');
      result = m[0];
    }
  }

  // Shorten the version to one dot 'a.bb.ccc.d -> a.bb' at most.
  m = result.split('/');
  if (m.length > 1) {
    let v = m[1].split('.');
    result = m[0] + '/' + v[0] + (v[1] ? '.' + v[1] : '');
  }
  return reactnative + result;
}

/**
 * In-memory sorted cache of objects.
 *
 * @class CBuffer
 * @memberof Tinode
 * @protected
 *
 * @param {function} compare custom comparator of objects. Takes two parameters <code>a</code> and <code>b</code>;
 *    returns <code>-1</code> if <code>a < b</code>, <code>0</code> if <code>a == b</code>, <code>1</code> otherwise.
 * @param {boolean} unique enforce element uniqueness: when <code>true</code> replace existing element with a new
 *    one on conflict; when <code>false</code> keep both elements.
 */
var CBuffer = function(compare, unique) {
  let buffer = [];

  compare = compare || function(a, b) {
    return a === b ? 0 : a < b ? -1 : 1;
  };

  function findNearest(elem, arr, exact) {
    let start = 0;
    let end = arr.length - 1;
    let pivot = 0;
    let diff = 0;
    let found = false;

    while (start <= end) {
      pivot = (start + end) / 2 | 0;
      diff = compare(arr[pivot], elem);
      if (diff < 0) {
        start = pivot + 1;
      } else if (diff > 0) {
        end = pivot - 1;
      } else {
        found = true;
        break;
      }
    }
    if (found) {
      return {
        idx: pivot,
        exact: true
      };
    }
    if (exact) {
      return {
        idx: -1
      };
    }
    // Not exact - insertion point
    return {
      idx: diff < 0 ? pivot + 1 : pivot
    };
  }

  // Insert element into a sorted array.
  function insertSorted(elem, arr) {
    const found = findNearest(elem, arr, false);
    const count = (found.exact && unique) ? 1 : 0;
    arr.splice(found.idx, count, elem);
    return arr;
  }

  return {
    /**
     * Get an element at the given position.
     * @memberof Tinode.CBuffer#
     * @param {number} at - Position to fetch from.
     * @returns {Object} Element at the given position or <code>undefined</code>.
     */
    getAt: function(at) {
      return buffer[at];
    },

    /**
     * Convenience method for getting the last element of the buffer.
     * @memberof Tinode.CBuffer#
     * @returns {Object} The last element in the buffer or <code>undefined</code> if buffer is empty.
     */
    getLast: function() {
      return buffer.length > 0 ? buffer[buffer.length - 1] : undefined;
    },

    /**
     * Add new element(s) to the buffer. Variadic: takes one or more arguments. If an array is passed as a single
     * argument, its elements are inserted individually.
     * @memberof Tinode.CBuffer#
     *
     * @param {...Object|Array} - One or more objects to insert.
     */
    put: function() {
      let insert;
      // inspect arguments: if array, insert its elements, if one or more non-array arguments, insert them one by one
      if (arguments.length == 1 && Array.isArray(arguments[0])) {
        insert = arguments[0];
      } else {
        insert = arguments;
      }
      for (let idx in insert) {
        insertSorted(insert[idx], buffer);
      }
    },

    /**
     * Remove element at the given position.
     * @memberof Tinode.CBuffer#
     * @param {number} at - Position to delete at.
     * @returns {Object} Element at the given position or <code>undefined</code>.
     */
    delAt: function(at) {
      let r = buffer.splice(at, 1);
      if (r && r.length > 0) {
        return r[0];
      }
      return undefined;
    },

    /**
     * Remove elements between two positions.
     * @memberof Tinode.CBuffer#
     * @param {number} since - Position to delete from (inclusive).
     * @param {number} before - Position to delete to (exclusive).
     *
     * @returns {Array} array of removed elements (could be zero length).
     */
    delRange: function(since, before) {
      return buffer.splice(since, before - since);
    },

    /**
     * Return the number of elements the buffer holds.
     * @memberof Tinode.CBuffer#
     * @return {number} Number of elements in the buffer.
     */
    length: function() {
      return buffer.length;
    },

    /**
     * Reset the buffer discarding all elements
     * @memberof Tinode.CBuffer#
     */
    reset: function() {
      buffer = [];
    },

    /**
     * Callback for iterating contents of buffer. See {@link Tinode.CBuffer#forEach}.
     * @callback ForEachCallbackType
     * @memberof Tinode.CBuffer#
     * @param {Object} elem - Element of the buffer.
     * @param {number} index - Index of the current element.
     */

    /**
     * Apply given <code>callback</code> to all elements of the buffer.
     * @memberof Tinode.CBuffer#
     *
     * @param {Tinode.ForEachCallbackType} callback - Function to call for each element.
     * @param {number} startIdx - Optional index to start iterating from (inclusive).
     * @param {number} beforeIdx - Optional index to stop iterating before (exclusive).
     * @param {Object} context - calling context (i.e. value of <code>this</code> in callback)
     */
    forEach: function(callback, startIdx, beforeIdx, context) {
      startIdx = startIdx | 0;
      beforeIdx = beforeIdx || buffer.length;
      for (let i = startIdx; i < beforeIdx; i++) {
        callback.call(context, buffer[i], i);
      }
    },

    /**
     * Find element in buffer using buffer's comparison function.
     * @memberof Tinode.CBuffer#
     *
     * @param {Object} elem - element to find.
     * @param {boolean=} nearest - when true and exact match is not found, return the nearest element (insertion point).
     * @returns {number} index of the element in the buffer or -1.
     */
    find: function(elem, nearest) {
      const {
        idx
      } = findNearest(elem, buffer, !nearest);
      return idx;
    }
  }
}

// Helper function for creating an endpoint URL.
function makeBaseUrl(host, protocol, apiKey) {
  let url = null;

  if (protocol === 'http' || protocol === 'https' || protocol === 'ws' || protocol === 'wss') {
    url = protocol + '://';
    url += host;
    if (url.charAt(url.length - 1) !== '/') {
      url += '/';
    }
    url += 'v' + PROTOCOL_VERSION + '/channels';
    if (protocol === 'http' || protocol === 'https') {
      // Long polling endpoint end with "lp", i.e.
      // '/v0/channels/lp' vs just '/v0/channels' for ws
      url += '/lp';
    }
    url += '?apikey=' + apiKey;
  }

  return url;
}

/**
 * An abstraction for a websocket or a long polling connection.
 *
 * @class Connection
 * @memberof Tinode
 *
 * @param {string} host_ - Host name and port number to connect to.
 * @param {string} apiKey_ - API key generated by keygen
 * @param {string} transport_ - Network transport to use, either <code>"ws"<code>/<code>"wss"</code> for websocket or
 *      <code>lp</code> for long polling.
 * @param {boolean} secure_ - Use secure WebSocket (wss) if <code>true</code>.
 * @param {boolean} autoreconnect_ - If connection is lost, try to reconnect automatically.
 */
var Connection = function(host_, apiKey_, transport_, secure_, autoreconnect_) {
  let host = host_;
  let secure = secure_;
  let apiKey = apiKey_;

  let autoreconnect = autoreconnect_;

  // Settings for exponential backoff
  const _BOFF_BASE = 2000; // 2000 milliseconds, minimum delay between reconnects
  const _BOFF_MAX_ITER = 10; // Maximum delay between reconnects 2^10 * 2000 ~ 34 minutes
  const _BOFF_JITTER = 0.3; // Add random delay

  let _boffTimer = null;
  let _boffIteration = 0;
  let _boffClosed = false; // Indicator if the socket was manually closed - don't autoreconnect if true.

  let log = (text, ...args) => {
    if (this.logger) {
      this.logger(text, ...args);
    }
  }

  // Backoff implementation - reconnect after a timeout.
  function boffReconnect() {
    // Clear timer
    clearTimeout(_boffTimer);
    // Calculate when to fire the reconnect attempt
    const timeout = _BOFF_BASE * (Math.pow(2, _boffIteration) * (1.0 + _BOFF_JITTER * Math.random()));
    // Update iteration counter for future use
    _boffIteration = (_boffIteration >= _BOFF_MAX_ITER ? _boffIteration : _boffIteration + 1);
    if (this.onAutoreconnectIteration) {
      this.onAutoreconnectIteration(timeout);
    }

    _boffTimer = setTimeout(() => {
      log(`Reconnecting, iter=${_boffIteration}, timeout=${timeout}`);
      // Maybe the socket was closed while we waited for the timer?
      if (!_boffClosed) {
        const prom = this.connect();
        if (this.onAutoreconnectIteration) {
          this.onAutoreconnectIteration(0, prom);
        } else {
          // Suppress error if it's not used.
          prom.catch(() => {
            /* do nothing */
          });
        }
      } else if (this.onAutoreconnectIteration) {
        this.onAutoreconnectIteration(-1);
      }
    }, timeout);
  }

  // Terminate auto-reconnect process.
  function boffStop() {
    clearTimeout(_boffTimer);
    _boffTimer = null;
  }

  // Reset auto-reconnect iteration counter.
  function boffReset() {
    _boffIteration = 0;
  }

  // Initialization for Websocket
  function init_ws(instance) {
    let _socket = null;

    /**
     * Initiate a new connection
     * @memberof Tinode.Connection#
     * @param {string} host_ Host name to connect to; if <code>null</code> the old host name will be used.
     * @param {boolean} force Force new connection even if one already exists.
     * @return {Promise} Promise resolved/rejected when the connection call completes, resolution is called without
     *  parameters, rejection passes the {Error} as parameter.
     */
    instance.connect = function(host_, force) {
      _boffClosed = false;

      if (_socket) {
        if (!force && _socket.readyState == _socket.OPEN) {
          return Promise.resolve();
        }
        _socket.close();
        _socket = null;
      }

      if (host_) {
        host = host_;
      }

      return new Promise(function(resolve, reject) {
        const url = makeBaseUrl(host, secure ? 'wss' : 'ws', apiKey);

        log("Connecting to: ", url);

        // It throws when the server is not accessible but the exception cannot be caught:
        // https://stackoverflow.com/questions/31002592/javascript-doesnt-catch-error-in-websocket-instantiation/31003057
        const conn = new WebSocketProvider(url);

        conn.onerror = function(err) {
          reject(err);
        }

        conn.onopen = function(evt) {
          if (autoreconnect) {
            boffStop();
          }

          if (instance.onOpen) {
            instance.onOpen();
          }

          resolve();
        }

        conn.onclose = function(evt) {
          _socket = null;

          if (instance.onDisconnect) {
            const code = _boffClosed ? NETWORK_USER : NETWORK_ERROR;
            instance.onDisconnect(new Error(_boffClosed ? NETWORK_USER_TEXT : NETWORK_ERROR_TEXT +
              ' (' + code + ')'), code);
          }

          if (!_boffClosed && autoreconnect) {
            boffReconnect.call(instance);
          }
        }

        conn.onmessage = function(evt) {
          if (instance.onMessage) {
            instance.onMessage(evt.data);
          }
        }
        _socket = conn;
      });
    }

    /**
     * Try to restore a network connection, also reset backoff.
     * @memberof Tinode.Connection#
     *
     * @param {boolean} force - reconnect even if there is a live connection already.
     */
    instance.reconnect = function(force) {
      boffStop();
      instance.connect(null, force);
    }

    /**
     * Terminate the network connection
     * @memberof Tinode.Connection#
     */
    instance.disconnect = function() {
      _boffClosed = true;
      boffStop();

      if (!_socket) {
        return;
      }
      _socket.close();
      _socket = null;
    }

    /**
     * Send a string to the server.
     * @memberof Tinode.Connection#
     *
     * @param {string} msg - String to send.
     * @throws Throws an exception if the underlying connection is not live.
     */
    instance.sendText = function(msg) {
      if (_socket && (_socket.readyState == _socket.OPEN)) {
        _socket.send(msg);
      } else {
        throw new Error("Websocket is not connected");
      }
    };

    /**
     * Check if socket is alive.
     * @memberof Tinode.Connection#
     * @returns {boolean} <code>true</code> if connection is live, <code>false</code> otherwise.
     */
    instance.isConnected = function() {
      return (_socket && (_socket.readyState == _socket.OPEN));
    }

    /**
     * Get the name of the current network transport.
     * @memberof Tinode.Connection#
     * @returns {string} name of the transport such as <code>"ws"</code> or <code>"lp"</code>.
     */
    instance.transport = function() {
      return 'ws';
    }

    /**
     * Send network probe to check if connection is indeed live.
     * @memberof Tinode.Connection#
     */
    instance.probe = function() {
      instance.sendText('1');
    }
  }

  // Initialization for long polling.
  function init_lp(instance) {
    const XDR_UNSENT = 0; //	Client has been created. open() not called yet.
    const XDR_OPENED = 1; //	open() has been called.
    const XDR_HEADERS_RECEIVED = 2; // send() has been called, and headers and status are available.
    const XDR_LOADING = 3; //	Downloading; responseText holds partial data.
    const XDR_DONE = 4; // The operation is complete.
    // Fully composed endpoint URL, with API key & SID
    let _lpURL = null;

    let _poller = null;
    let _sender = null;

    function lp_sender(url_) {
      let sender = new XMLHttpRequest();
      sender.onreadystatechange = function(evt) {
        if (sender.readyState == XDR_DONE && sender.status >= 400) {
          // Some sort of error response
          throw new Error(`LP sender failed, ${sender.status}`);
        }
      }

      sender.open('POST', url_, true);
      return sender;
    }

    function lp_poller(url_, resolve, reject) {
      let poller = new XMLHttpRequest();
      let promiseCompleted = false;

      poller.onreadystatechange = function(evt) {

        if (poller.readyState == XDR_DONE) {
          if (poller.status == 201) { // 201 == HTTP.Created, get SID
            let pkt = JSON.parse(poller.responseText, jsonParseHelper);
            _lpURL = url_ + '&sid=' + pkt.ctrl.params.sid
            poller = lp_poller(_lpURL);
            poller.send(null)
            if (instance.onOpen) {
              instance.onOpen();
            }

            if (resolve) {
              promiseCompleted = true;
              resolve();
            }

            if (autoreconnect) {
              boffStop();
            }
          } else if (poller.status < 400) { // 400 = HTTP.BadRequest
            if (instance.onMessage) {
              instance.onMessage(poller.responseText)
            }
            poller = lp_poller(_lpURL);
            poller.send(null);
          } else {
            // Don't throw an error here, gracefully handle server errors
            if (reject && !promiseCompleted) {
              promiseCompleted = true;
              reject(poller.responseText);
            }
            if (instance.onMessage && poller.responseText) {
              instance.onMessage(poller.responseText);
            }
            if (instance.onDisconnect) {
              const code = poller.status || (_boffClosed ? NETWORK_USER : NETWORK_ERROR);
              const text = poller.responseText || (_boffClosed ? NETWORK_USER_TEXT : NETWORK_ERROR_TEXT);
              instance.onDisconnect(new Error(text + ' (' + code + ')'), code);
            }

            // Polling has stopped. Indicate it by setting poller to null.
            poller = null;
            if (!_boffClosed && autoreconnect) {
              boffReconnect.call(instance);
            }
          }
        }
      }
      poller.open('GET', url_, true);
      return poller;
    }

    instance.connect = function(host_, force) {
      _boffClosed = false;

      if (_poller) {
        if (!force) {
          return Promise.resolve();
        }
        _poller.onreadystatechange = undefined;
        _poller.abort();
        _poller = null;
      }

      if (host_) {
        host = host_;
      }

      return new Promise(function(resolve, reject) {
        const url = makeBaseUrl(host, secure ? 'https' : 'http', apiKey);
        log("Connecting to: ", url);
        _poller = lp_poller(url, resolve, reject);
        _poller.send(null)
      }).catch((err) => {
        log("LP connection failed:", err);
      });
    };

    instance.reconnect = function(force) {
      boffStop();
      instance.connect(null, force);
    };

    instance.disconnect = function() {
      _boffClosed = true;
      boffStop();

      if (_sender) {
        _sender.onreadystatechange = undefined;
        _sender.abort();
        _sender = null;
      }
      if (_poller) {
        _poller.onreadystatechange = undefined;
        _poller.abort();
        _poller = null;
      }

      if (instance.onDisconnect) {
        instance.onDisconnect(new Error(NETWORK_USER_TEXT + ' (' + NETWORK_USER + ')'), NETWORK_USER);
      }
      // Ensure it's reconstructed
      _lpURL = null;
    }

    instance.sendText = function(msg) {
      _sender = lp_sender(_lpURL);
      if (_sender && (_sender.readyState == 1)) { // 1 == OPENED
        _sender.send(msg);
      } else {
        throw new Error("Long poller failed to connect");
      }
    };

    instance.isConnected = function() {
      return (_poller && true);
    }

    instance.transport = function() {
      return 'lp';
    }

    instance.probe = function() {
      instance.sendText('1');
    }
  }

  let initialized = false;
  if (transport_ === 'lp') {
    // explicit request to use long polling
    init_lp(this);
    initialized = true;
  } else if (transport_ === 'ws') {
    // explicit request to use web socket
    // if websockets are not available, horrible things will happen
    init_ws(this);
    initialized = true;

    // Default transport selection
  } else if (typeof window == 'object') {
    if (window['WebSocket']) {
      // Using web sockets -- default.
      init_ws(this);
      initialized = true;
    } else if (window['XMLHttpRequest']) {
      // The browser has no websockets, using long polling.
      init_lp(this);
      initialized = true;
    }
  }

  if (!initialized) {
    // No transport is avaiilable.
    log("No network transport is available. Running under Node? Call 'Tinode.setNetworkProviders()'.");
    throw new Error("No network transport is available. Running under Node? Call 'Tinode.setNetworkProviders()'.");
  }

  /**
   * Check if the given network transport is available.
   * @memberof Tinode.Connection#
   * @param {string} trans - either <code>"ws"</code> (websocket) or <code>"lp"</code> (long polling).
   * @returns true if given transport is available, false otherwise.
   */
  this.transportAvailable = function(transp) {
    switch (transp) {
      case 'ws':
        return typeof window == 'object' && window['WebSocket'];
      case 'lp':
        return typeof window == 'object' && window['XMLHttpRequest'];
      default:
        log("Request for unknown transport", transp);
        return false;
    }
  }

  /**
   * Reset autoreconnect counter to zero.
   * @memberof Tinode.Connection#
   */
  this.backoffReset = function() {
    boffReset();
  }

  // Callbacks:
  /**
   * A callback to pass incoming messages to. See {@link Tinode.Connection#onMessage}.
   * @callback Tinode.Connection.OnMessage
   * @memberof Tinode.Connection
   * @param {string} message - Message to process.
   */
  /**
   * A callback to pass incoming messages to.
   * @type {Tinode.Connection.OnMessage}
   * @memberof Tinode.Connection#
   */
  this.onMessage = undefined;

  /**
   * A callback for reporting a dropped connection.
   * @type {function}
   * @memberof Tinode.Connection#
   */
  this.onDisconnect = undefined;

  /**
   * A callback called when the connection is ready to be used for sending. For websockets it's socket open,
   * for long polling it's <code>readyState=1</code> (OPENED)
   * @type {function}
   * @memberof Tinode.Connection#
   */
  this.onOpen = undefined;

  /**
   * A callback to notify of reconnection attempts. See {@link Tinode.Connection#onAutoreconnectIteration}.
   * @memberof Tinode.Connection
   * @callback AutoreconnectIterationType
   * @param {string} timeout - time till the next reconnect attempt in milliseconds. <code>-1</code> means reconnect was skipped.
   * @param {Promise} promise resolved or rejected when the reconnect attemp completes.
   *
   */
  /**
   * A callback to inform when the next attampt to reconnect will happen and to receive connection promise.
   * @memberof Tinode.Connection#
   * @type {Tinode.Connection.AutoreconnectIterationType}
   */
  this.onAutoreconnectIteration = undefined;

  /**
   * A callback to log events from Connection. See {@link Tinode.Connection#logger}.
   * @memberof Tinode.Connection
   * @callback LoggerCallbackType
   * @param {string} event - Event to log.
   */
  /**
   * A callback to report logging events.
   * @memberof Tinode.Connection#
   * @type {Tinode.Connection.LoggerCallbackType}
   */
  this.logger = undefined;
};

/**
 * @class Tinode
 *
 * @param {Object} config - configuration parameters.
 * @param {string} config.appName - Name of the calling application to be reported in the User Agent.
 * @param {string} config.host - Host name and port number to connect to.
 * @param {string} config.apiKey - API key generated by <code>keygen</code>.
 * @param {string} config.transport - See {@link Tinode.Connection#transport}.
 * @param {boolean} config.secure - Use Secure WebSocket if <code>true</code>.
 * @param {string} config.platform - Optional platform identifier, one of <code>"ios"</code>, <code>"web"</code>, <code>"android"</code>.
 * @param {boolen} config.persist - use indexDB persistent storage.
 * @param {function} onComplete - callback to call when initialization is completed.
 */
var Tinode = function(config, onComplete) {
  // Client-provided application name, format <Name>/<version number>
  this._appName = config.appName || "Undefined";

  // API Key.
  this._apiKey = config.apiKey;

  // Name and version of the browser.
  this._browser = '';
  this._platform = config.platform || 'web';
  this._hwos = 'undefined';
  this._humanLanguage = 'xx';
  // Underlying OS.
  if (typeof navigator != 'undefined') {
    this._browser = getBrowserInfo(navigator.userAgent, navigator.product);
    this._hwos = navigator.platform;
    // This is the default language. It could be changed by client.
    this._humanLanguage = navigator.language || 'en-US';
  }
  // Logging to console enabled
  this._loggingEnabled = false;
  // When logging, trip long strings (base64-encoded images) for readability
  this._trimLongStrings = false;
  // UID of the currently authenticated user.
  this._myUID = null;
  // Status of connection: authenticated or not.
  this._authenticated = false;
  // Login used in the last successful basic authentication
  this._login = null;
  // Token which can be used for login instead of login/password.
  this._authToken = null;
  // Counter of received packets
  this._inPacketCount = 0;
  // Counter for generating unique message IDs
  this._messageId = Math.floor((Math.random() * 0xFFFF) + 0xFFFF);
  // Information about the server, if connected
  this._serverInfo = null;
  // Push notification token. Called deviceToken for consistency with the Android SDK.
  this._deviceToken = null;

  // Cache of pending promises by message id.
  this._pendingPromises = {};

  // The Timeout object returned by the reject expired promises setInterval.
  this._expirePromises = null;

  /** A connection object, see {@link Tinode.Connection}. */
  this._connection = new Connection(config.host, config.apiKey, config.transport, config.secure, true);
  // Console logger. Babel somehow fails to parse '...rest' parameter.
  this.logger = (str, ...args) => {
    if (this._loggingEnabled) {
      const d = new Date()
      const dateString = ('0' + d.getUTCHours()).slice(-2) + ':' +
        ('0' + d.getUTCMinutes()).slice(-2) + ':' +
        ('0' + d.getUTCSeconds()).slice(-2) + '.' +
        ('00' + d.getUTCMilliseconds()).slice(-3);

      console.log('[' + dateString + ']', str, args.join(' '));
    }
  }
  this._connection.logger = this.logger;
  Drafty.logger = this.logger;

  // Timestamp of the most recent update to topics in cache.
  this._lastTopicUpdate = null;

  // Tinode's cache of objects
  this._cache = {};

  const cachePut = this.cachePut = (type, name, obj) => {
    this._cache[type + ':' + name] = obj;
  }

  const cacheGet = this.cacheGet = (type, name) => {
    return this._cache[type + ':' + name];
  }

  const cacheDel = this.cacheDel = (type, name) => {
    delete this._cache[type + ':' + name];
  }
  // Enumerate all items in cache, call func for each item.
  // Enumeration stops if func returns true.
  const cacheMap = this.cacheMap = (type, func, context) => {
    const key = type ? type + ':' : undefined;
    for (let idx in this._cache) {
      if (!key || idx.indexOf(key) == 0) {
        if (func.call(context, this._cache[idx], idx)) {
          break;
        }
      }
    }
  }

  // Make limited cache management available to topic.
  // Caching user.public only. Everything else is per-topic.
  this.attachCacheToTopic = (topic) => {
    topic._tinode = this;

    topic._cacheGetUser = (uid) => {
      const pub = cacheGet('user', uid);
      if (pub) {
        return {
          user: uid,
          public: mergeObj({}, pub)
        };
      }
      return undefined;
    };
    topic._cachePutUser = (uid, user) => {
      return cachePut('user', uid, mergeObj({}, user.public));
    };
    topic._cacheDelUser = (uid) => {
      return cacheDel('user', uid);
    };
    topic._cachePutSelf = () => {
      if (topic.updated && topic.updated > this._lastTopicUpdate) {
        this._lastTopicUpdate = topic.updated;
      }
      return cachePut('topic', topic.name, topic);
    }
    topic._cacheDelSelf = () => {
      return cacheDel('topic', topic.name);
    }
  }

  // Use indexDB for caching topics and messages.
  this._persist = config.persist;
  // Initialize object regardless. It simplifies the code.
  this._db = DB((err) => {
    this.logger("DB", err);
  }, this.logger);

  if (this._persist) {
    // Create the persistent cache and read topics into memory.
    this._db.initDatabase().then(() => {
      // Store promises to be resolved when messages load into memory.
      const msgs = [];
      // Load topics to memory.
      return this._db.mapTopics((data) => {
        let topic = this.cacheGet('topic', data.name);
        if (topic) {
          return;
        }
        if (data.name == TOPIC_ME) {
          topic = new TopicMe();
        } else if (data.name == TOPIC_FND) {
          topic = new TopicFnd();
        } else {
          topic = new Topic(data.name);
        }

        this._db.deserializeTopic(topic, data);
        this.attachCacheToTopic(topic);
        topic._cachePutSelf();
        // Request to load messages and save the promise.
        msgs.push(topic._loadMessages(this._db));
      }).then(() => {
        // Wait for all messages to load.
        return Promise.all(msgs);
      }).then(() => {
        if (onComplete) {
          onComplete();
        }
        this.logger("Persistent cache initialized.");
      });
    });
  }

  // Resolve or reject a pending promise.
  // Unresolved promises are stored in _pendingPromises.
  const execPromise = (id, code, onOK, errorText) => {
    const callbacks = this._pendingPromises[id];
    if (callbacks) {
      delete this._pendingPromises[id];
      if (code >= 200 && code < 400) {
        if (callbacks.resolve) {
          callbacks.resolve(onOK);
        }
      } else if (callbacks.reject) {
        callbacks.reject(new Error(`${errorText} (${code})`));
      }
    }
  }

  // Generator of default promises for sent packets.
  const makePromise = (id) => {
    let promise = null;
    if (id) {
      promise = new Promise((resolve, reject) => {
        // Stored callbacks will be called when the response packet with this Id arrives
        this._pendingPromises[id] = {
          'resolve': resolve,
          'reject': reject,
          'ts': new Date()
        };
      })
    }
    return promise;
  }

  // Generates unique message IDs
  const getNextUniqueId = this.getNextUniqueId = () => {
    return (this._messageId != 0) ? '' + this._messageId++ : undefined;
  }

  // Get User Agent string
  const getUserAgent = () => {
    return this._appName + ' (' + (this._browser ? this._browser + '; ' : '') + this._hwos + '); ' + LIBRARY;
  }

  // Generator of packets stubs
  this.initPacket = (type, topic) => {
    switch (type) {
      case 'hi':
        return {
          'hi': {
            'id': getNextUniqueId(),
            'ver': VERSION,
            'ua': getUserAgent(),
            'dev': this._deviceToken,
            'lang': this._humanLanguage,
            'platf': this._platform
          }
        };

      case 'acc':
        return {
          'acc': {
            'id': getNextUniqueId(),
            'user': null,
            'scheme': null,
            'secret': null,
            'login': false,
            'tags': null,
            'desc': {},
            'cred': {}
          }
        };

      case 'login':
        return {
          'login': {
            'id': getNextUniqueId(),
            'scheme': null,
            'secret': null
          }
        };

      case 'sub':
        return {
          'sub': {
            'id': getNextUniqueId(),
            'topic': topic,
            'set': {},
            'get': {}
          }
        };

      case 'leave':
        return {
          'leave': {
            'id': getNextUniqueId(),
            'topic': topic,
            'unsub': false
          }
        };

      case 'pub':
        return {
          'pub': {
            'id': getNextUniqueId(),
            'topic': topic,
            'noecho': false,
            'head': null,
            'content': {}
          }
        };

      case 'get':
        return {
          'get': {
            'id': getNextUniqueId(),
            'topic': topic,
            'what': null, // data, sub, desc, space separated list; unknown strings are ignored
            'desc': {},
            'sub': {},
            'data': {}
          }
        };

      case 'set':
        return {
          'set': {
            'id': getNextUniqueId(),
            'topic': topic,
            'desc': {},
            'sub': {},
            'tags': []
          }
        };

      case 'del':
        return {
          'del': {
            'id': getNextUniqueId(),
            'topic': topic,
            'what': null,
            'delseq': null,
            'user': null,
            'hard': false
          }
        };

      case 'note':
        return {
          'note': {
            // no id by design
            'topic': topic,
            'what': null, // one of "recv", "read", "kp"
            'seq': undefined // the server-side message id aknowledged as received or read
          }
        };

      default:
        throw new Error(`Unknown packet type requested: ${type}`);
    }
  }

  // Send a packet. If packet id is provided return a promise.
  this.send = (pkt, id) => {
    let promise;
    if (id) {
      promise = makePromise(id);
    }
    pkt = simplify(pkt);
    let msg = JSON.stringify(pkt);
    this.logger("out: " + (this._trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : msg));
    try {
      this._connection.sendText(msg);
    } catch (err) {
      // If sendText throws, wrap the error in a promise or rethrow.
      if (id) {
        execPromise(id, NETWORK_ERROR, null, err.message);
      } else {
        throw err;
      }
    }
    return promise;
  }

  // On successful login save server-provided data.
  this.loginSuccessful = (ctrl) => {
    if (!ctrl.params || !ctrl.params.user) {
      return ctrl;
    }
    // This is a response to a successful login,
    // extract UID and security token, save it in Tinode module
    this._myUID = ctrl.params.user;
    this._authenticated = (ctrl && ctrl.code >= 200 && ctrl.code < 300);
    if (ctrl.params && ctrl.params.token && ctrl.params.expires) {
      this._authToken = {
        token: ctrl.params.token,
        expires: new Date(ctrl.params.expires)
      };
    } else {
      this._authToken = null;
    }

    if (this.onLogin) {
      this.onLogin(ctrl.code, ctrl.text);
    }

    return ctrl;
  }

  // The main message dispatcher.
  this._connection.onMessage = (data) => {
    // Skip empty response. This happens when LP times out.
    if (!data) return;

    this._inPacketCount++;

    // Send raw message to listener
    if (this.onRawMessage) {
      this.onRawMessage(data);
    }

    if (data === '0') {
      // Server response to a network probe.
      if (this.onNetworkProbe) {
        this.onNetworkProbe();
      }
      // No processing is necessary.
      return;
    }

    let pkt = JSON.parse(data, jsonParseHelper);
    if (!pkt) {
      this.logger("in: " + data);
      this.logger("ERROR: failed to parse data");
    } else {
      this.logger("in: " + (this._trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : data));

      // Send complete packet to listener
      if (this.onMessage) {
        this.onMessage(pkt);
      }

      if (pkt.ctrl) {
        // Handling {ctrl} message
        if (this.onCtrlMessage) {
          this.onCtrlMessage(pkt.ctrl);
        }

        // Resolve or reject a pending promise, if any
        if (pkt.ctrl.id) {
          execPromise(pkt.ctrl.id, pkt.ctrl.code, pkt.ctrl, pkt.ctrl.text);
        }
        setTimeout(() => {
          if (pkt.ctrl.code == 205 && pkt.ctrl.text == 'evicted') {
            // User evicted from topic.
            const topic = cacheGet('topic', pkt.ctrl.topic);
            if (topic) {
              topic._resetSub();
              if (pkt.ctrl.params && pkt.ctrl.params.unsub) {
                topic._gone();
              }
            }
          } else if (pkt.ctrl.params && pkt.ctrl.params.what == 'data') {
            // All messages received: "params":{"count":11,"what":"data"},
            const topic = cacheGet('topic', pkt.ctrl.topic);
            if (topic) {
              topic._allMessagesReceived(pkt.ctrl.params.count);
            }
          } else if (pkt.ctrl.params && pkt.ctrl.params.what == 'sub') {
            // The topic has no subscriptions.
            const topic = cacheGet('topic', pkt.ctrl.topic);
            if (topic) {
              // Trigger topic.onSubsUpdated.
              topic._processMetaSub([]);
            }
          }
        }, 0);
      } else {
        setTimeout(() => {
          if (pkt.meta) {
            // Handling a {meta} message.

            // Preferred API: Route meta to topic, if one is registered
            const topic = cacheGet('topic', pkt.meta.topic);
            if (topic) {
              topic._routeMeta(pkt.meta);
            }

            if (pkt.meta.id) {
              execPromise(pkt.meta.id, 200, pkt.meta, 'META');
            }

            // Secondary API: callback
            if (this.onMetaMessage) {
              this.onMetaMessage(pkt.meta);
            }
          } else if (pkt.data) {
            // Handling {data} message

            // Preferred API: Route data to topic, if one is registered
            const topic = cacheGet('topic', pkt.data.topic);
            if (topic) {
              topic._routeData(pkt.data);
            }

            // Secondary API: Call callback
            if (this.onDataMessage) {
              this.onDataMessage(pkt.data);
            }
          } else if (pkt.pres) {
            // Handling {pres} message

            // Preferred API: Route presence to topic, if one is registered
            const topic = cacheGet('topic', pkt.pres.topic);
            if (topic) {
              topic._routePres(pkt.pres);
            }

            // Secondary API - callback
            if (this.onPresMessage) {
              this.onPresMessage(pkt.pres);
            }
          } else if (pkt.info) {
            // {info} message - read/received notifications and key presses

            // Preferred API: Route {info}} to topic, if one is registered
            const topic = cacheGet('topic', pkt.info.topic);
            if (topic) {
              topic._routeInfo(pkt.info);
            }

            // Secondary API - callback
            if (this.onInfoMessage) {
              this.onInfoMessage(pkt.info);
            }
          } else {
            this.logger("ERROR: Unknown packet received.");
          }
        }, 0);
      }
    }
  }

  // Ready to start sending.
  this._connection.onOpen = () => {
    if (!this._expirePromises) {
      // Reject promises which have not been resolved for too long.
      this._expirePromises = setInterval(() => {
        const err = new Error("Timeout (504)");
        const expires = new Date(new Date().getTime() - EXPIRE_PROMISES_TIMEOUT);
        for (let id in this._pendingPromises) {
          let callbacks = this._pendingPromises[id];
          if (callbacks && callbacks.ts < expires) {
            this.logger("Promise expired", id);
            delete this._pendingPromises[id];
            if (callbacks.reject) {
              callbacks.reject(err);
            }
          }
        }
      }, EXPIRE_PROMISES_PERIOD);
    }
    this.hello();
  }

  // Wrapper for the reconnect iterator callback.
  this._connection.onAutoreconnectIteration = (timeout, promise) => {
    if (this.onAutoreconnectIteration) {
      this.onAutoreconnectIteration(timeout, promise);
    }
  }

  this._connection.onDisconnect = (err, code) => {
    this._inPacketCount = 0;
    this._serverInfo = null;
    this._authenticated = false;

    if (this._expirePromises) {
      clearInterval(this._expirePromises);
      this._expirePromises = null;
    }

    // Mark all topics as unsubscribed
    cacheMap('topic', (topic, key) => {
      topic._resetSub();
    });

    // Reject all pending promises
    for (let key in this._pendingPromises) {
      const callbacks = this._pendingPromises[key];
      if (callbacks && callbacks.reject) {
        callbacks.reject(err);
      }
    }
    this._pendingPromises = {};

    if (this.onDisconnect) {
      this.onDisconnect(err);
    }
  }
};

// Static methods.

/**
 * @typedef Credential
 * @type {object}
 * @property {string} meth - validation method.
 * @property {string} val - value to validate (e.g. email or phone number).
 * @property {string} resp - validation response.
 * @property {Object} params - validation parameters.
 */
/**
 * Helper method to package account credential.
 *
 * @memberof Tinode
 * @static
 *
 * @param {string | Credential} meth - validation method or object with validation data.
 * @param {string=} val - validation value (e.g. email or phone number).
 * @param {Object=} params - validation parameters.
 * @param {string=} resp - validation response.
 *
 * @returns {Array.<Credential>} array with a single credential or <code>null</code> if no valid credentials were given.
 */
Tinode.credential = function(meth, val, params, resp) {
  if (typeof meth == 'object') {
    ({
      val,
      params,
      resp,
      meth
    } = meth);
  }
  if (meth && (val || resp)) {
    return [{
      'meth': meth,
      'val': val,
      'resp': resp,
      'params': params
    }];
  }
  return null;
};

/**
 * Determine topic type from topic's name: grp, p2p, me, fnd, sys.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {string} One of <code>"me"</code>, <code>"fnd"</code>, <code>"sys"</code>, <code>"grp"</code>,
 *    <code>"p2p"</code> or <code>undefined</code>.
 */
Tinode.topicType = function(name) {
  const types = {
    'me': 'me',
    'fnd': 'fnd',
    'grp': 'grp',
    'new': 'grp',
    'nch': 'grp',
    'chn': 'grp',
    'usr': 'p2p',
    'sys': 'sys'
  };
  return types[(typeof name == 'string') ? name.substring(0, 3) : 'xxx'];
};

/**
 * Check if the given topic name is a name of a 'me' topic.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {boolean} <code>true</code> if the name is a name of a 'me' topic, <code>false</code> otherwise.
 */
Tinode.isMeTopicName = function(name) {
  return Tinode.topicType(name) == 'me';
};

/**
 * Check if the given topic name is a name of a group topic.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {boolean} <code>true</code> if the name is a name of a group topic, <code>false</code> otherwise.
 */
Tinode.isGroupTopicName = function(name) {
  return Tinode.topicType(name) == 'grp';
};

/**
 * Check if the given topic name is a name of a p2p topic.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {boolean} <code>true</code> if the name is a name of a p2p topic, <code>false</code> otherwise.
 */
Tinode.isP2PTopicName = function(name) {
  return Tinode.topicType(name) == 'p2p';
};

/**
 * Check if the given topic name is a name of a communication topic, i.e. P2P or group.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {boolean} <code>true</code> if the name is a name of a p2p or group topic, <code>false</code> otherwise.
 */
Tinode.isCommTopicName = function(name) {
  return Tinode.isP2PTopicName(name) || Tinode.isGroupTopicName(name);
};

/**
 * Check if the topic name is a name of a new topic.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - topic name to check.
 * @returns {boolean} <code>true</code> if the name is a name of a new topic, <code>false</code> otherwise.
 */
Tinode.isNewGroupTopicName = function(name) {
  return (typeof name == 'string') &&
    (name.substring(0, 3) == TOPIC_NEW || name.substring(0, 3) == TOPIC_NEW_CHAN);
};

/**
 * Check if the topic name is a name of a channel.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - topic name to check.
 * @returns {boolean} <code>true</code> if the name is a name of a channel, <code>false</code> otherwise.
 */
Tinode.isChannelTopicName = function(name) {
  return (typeof name == 'string') &&
    (name.substring(0, 3) == TOPIC_CHAN || name.substring(0, 3) == TOPIC_NEW_CHAN);
};

/**
 * Return information about the current version of this Tinode client library.
 * @memberof Tinode
 * @static
 *
 * @returns {string} semantic version of the library, e.g. <code>"0.15.5-rc1"</code>.
 */
Tinode.getVersion = function() {
  return VERSION;
};

/**
 * To use Tinode in a non browser context, supply WebSocket and XMLHttpRequest providers.
 * @static
 * @memberof Tinode
 * @param wsProvider WebSocket provider, e.g. for nodeJS , <code>require('ws')</code>.
 * @param xhrProvider XMLHttpRequest provider, e.g. for node <code>require('xhr')</code>.
 */
Tinode.setNetworkProviders = function(wsProvider, xhrProvider) {
  WebSocketProvider = wsProvider;
  XHRProvider = xhrProvider;
};

/**
 * Return information about the current name and version of this Tinode library.
 * @memberof Tinode
 * @static
 *
 * @returns {string} the name of the library and it's version.
 */
Tinode.getLibrary = function() {
  return LIBRARY;
};

// Exported constants
Tinode.MESSAGE_STATUS_NONE = MESSAGE_STATUS_NONE;
Tinode.MESSAGE_STATUS_QUEUED = MESSAGE_STATUS_QUEUED;
Tinode.MESSAGE_STATUS_SENDING = MESSAGE_STATUS_SENDING;
Tinode.MESSAGE_STATUS_FAILED = MESSAGE_STATUS_FAILED;
Tinode.MESSAGE_STATUS_SENT = MESSAGE_STATUS_SENT;
Tinode.MESSAGE_STATUS_RECEIVED = MESSAGE_STATUS_RECEIVED;
Tinode.MESSAGE_STATUS_READ = MESSAGE_STATUS_READ;
Tinode.MESSAGE_STATUS_TO_ME = MESSAGE_STATUS_TO_ME;

// Unicode [del] symbol.
Tinode.DEL_CHAR = '\u2421';

/**
 * Check if the given string represents <code>NULL</code> value as defined by Tinode (<code>'\u2421'</code>).
 * @memberof Tinode
 * @static
 *
 * @param {string} str - string to check for <code>NULL</code> value.
 *
 * @returns {boolean} <code>true</code> if string represents <code>NULL</code> value, <code>false</code> otherwise.
 */
Tinode.isNullValue = function(str) {
  return str === Tinode.DEL_CHAR;
};

/**
 * Check if the given URL string is a relative URL.
 * Check for cases like:
 *  <code>'http://example.com'</code>
 *  <code>' http://example.com'</code>
 *  <code>'//example.com/'</code>
 *  <code>'http:example.com'</code>
 *  <code>'http:/example.com'</code>
 * @memberof Tinode
 * @static
 *
 * @param {string} url - URL string to check.
 *
 * @returns {boolean} <code>true</code> if the URL is relative, <code>false</code> otherwise.
 */
Tinode.isRelativeURL = function(url) {
  return !/^\s*([a-z][a-z0-9+.-]*:|\/\/)/im.test(url);
};

// Names of keys to server-provided configuration limits.
Tinode.MAX_MESSAGE_SIZE = 'maxMessageSize';
Tinode.MAX_SUBSCRIBER_COUNT = 'maxSubscriberCount';
Tinode.MAX_TAG_COUNT = 'maxTagCount';
Tinode.MAX_FILE_UPLOAD_SIZE = 'maxFileUploadSize';

// Public methods;
Tinode.prototype = {
  /**
   * Connect to the server.
   * @memberof Tinode#
   *
   * @param {string} host_ - name of the host to connect to.
   *
   * @return {Promise} Promise resolved/rejected when the connection call completes:
   *    <code>resolve()</code> is called without parameters, <code>reject()</code> receives the
   *    <code>Error</code> as a single parameter.
   */
  connect: function(host_) {
    return this._connection.connect(host_);
  },

  /**
   * Attempt to reconnect to the server immediately.
   * @memberof Tinode#
   *
   * @param {string} force - reconnect even if there is a connection already.
   */
  reconnect: function(force) {
    this._connection.reconnect(force);
  },

  /**
   * Disconnect from the server.
   * @memberof Tinode#
   */
  disconnect: function() {
    this._connection.disconnect();
  },

  /**
   * Clear persistent cache: remove indexDB cache of the most recently logged in user.
   */
  clearStorage: function() {
    if (this._db) {
      this._db.deleteDatabase();
    }
  },

  /**
   * Send a network probe message to make sure the connection is alive.
   * @memberof Tinode#
   */
  networkProbe: function() {
    this._connection.probe();
  },

  /**
   * Check for live connection to server.
   * @memberof Tinode#
   *
   * @returns {boolean} <code>true</code> if there is a live connection, <code>false</code> otherwise.
   */
  isConnected: function() {
    return this._connection.isConnected();
  },

  /**
   * Check if connection is authenticated (last login was successful).
   * @memberof Tinode#
   * @returns {boolean} <code>true</code> if authenticated, <code>false</code> otherwise.
   */
  isAuthenticated: function() {
    return this._authenticated;
  },

  /**
   * Add API key and auth token to the relative URL making it usable for getting data
   * from the server in a simple <code>HTTP GET</code> request.
   * @memberof Tinode#
   *
   * @param {string} URL - URL to wrap.
   * @returns {string} URL with appended API key and token, if valid token is present.
   */
  authorizeURL: function(url) {
    if (!url) {
      return url;
    }

    if (Tinode.isRelativeURL(url)) {
      // Fake base to make the relative URL parseable.
      const base = 'scheme://host/';
      const parsed = new URL(url, base);
      if (this._apiKey) {
        parsed.searchParams.append('apikey', this._apiKey);
      }
      if (this._authToken.token) {
        parsed.searchParams.append('auth', 'token');
        parsed.searchParams.append('secret', this._authToken.token);
      }
      // Convert back to string and strip fake base URL except for the root slash.
      url = parsed.toString().substring(base.length - 1);
    }
    return url;
  },

  /**
   * @typedef AccountParams
   * @memberof Tinode
   * @type {Object}
   * @property {Tinode.DefAcs=} defacs - Default access parameters for user's <code>me</code> topic.
   * @property {Object=} public - Public application-defined data exposed on <code>me</code> topic.
   * @property {Object=} private - Private application-defined data accessible on <code>me</code> topic.
   * @property {Array} tags - array of string tags for user discovery.
   * @property {string=} token - authentication token to use.
   */
  /**
   * @typedef DefAcs
   * @memberof Tinode
   * @type {Object}
   * @property {string=} auth - Access mode for <code>me</code> for authenticated users.
   * @property {string=} anon - Access mode for <code>me</code> for anonymous users.
   */

  /**
   * Create or update an account.
   * @memberof Tinode#
   *
   * @param {string} uid - User id to update
   * @param {string} scheme - Authentication scheme; <code>"basic"</code> and <code>"anonymous"</code> are the currently supported schemes.
   * @param {string} secret - Authentication secret, assumed to be already base64 encoded.
   * @param {boolean=} login - Use new account to authenticate current session
   * @param {Tinode.AccountParams=} params - User data to pass to the server.
   */
  account: function(uid, scheme, secret, login, params) {
    const pkt = this.initPacket('acc');
    pkt.acc.user = uid;
    pkt.acc.scheme = scheme;
    pkt.acc.secret = secret;
    // Log in to the new account using selected scheme
    pkt.acc.login = login;

    if (params) {
      pkt.acc.desc.defacs = params.defacs;
      pkt.acc.desc.public = params.public;
      pkt.acc.desc.private = params.private;

      pkt.acc.tags = params.tags;
      pkt.acc.cred = params.cred;

      pkt.acc.token = params.token;
    }

    return this.send(pkt, pkt.acc.id);
  },

  /**
   * Create a new user. Wrapper for {@link Tinode#account}.
   * @memberof Tinode#
   *
   * @param {string} scheme - Authentication scheme; <code>"basic"</code> is the only currently supported scheme.
   * @param {string} secret - Authentication.
   * @param {boolean=} login - Use new account to authenticate current session
   * @param {Tinode.AccountParams=} params - User data to pass to the server.
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  createAccount: function(scheme, secret, login, params) {
    let promise = this.account(USER_NEW, scheme, secret, login, params);
    if (login) {
      promise = promise.then((ctrl) => {
        return this.loginSuccessful(ctrl);
      });
    }
    return promise;
  },

  /**
   * Create user with <code>'basic'</code> authentication scheme and immediately
   * use it for authentication. Wrapper for {@link Tinode#account}.
   * @memberof Tinode#
   *
   * @param {string} username - Login to use for the new account.
   * @param {string} password - User's password.
   * @param {Tinode.AccountParams=} params - User data to pass to the server.
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  createAccountBasic: function(username, password, params) {
    // Make sure we are not using 'null' or 'undefined';
    username = username || '';
    password = password || '';
    return this.createAccount('basic',
      b64EncodeUnicode(username + ':' + password), true, params);
  },

  /**
   * Update user's credentials for <code>'basic'</code> authentication scheme. Wrapper for {@link Tinode#account}.
   * @memberof Tinode#
   *
   * @param {string} uid - User ID to update.
   * @param {string} username - Login to use for the new account.
   * @param {string} password - User's password.
   * @param {Tinode.AccountParams=} params - data to pass to the server.
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  updateAccountBasic: function(uid, username, password, params) {
    // Make sure we are not using 'null' or 'undefined';
    username = username || '';
    password = password || '';
    return this.account(uid, 'basic',
      b64EncodeUnicode(username + ':' + password), false, params);
  },

  /**
   * Send handshake to the server.
   * @memberof Tinode#
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  hello: function() {
    const pkt = this.initPacket('hi');

    return this.send(pkt, pkt.hi.id)
      .then((ctrl) => {
        // Reset backoff counter on successful connection.
        this._connection.backoffReset();

        // Server response contains server protocol version, build, constraints,
        // session ID for long polling. Save them.
        if (ctrl.params) {
          this._serverInfo = ctrl.params;
        }

        if (this.onConnect) {
          this.onConnect();
        }

        return ctrl;
      }).catch((err) => {
        this._connection.reconnect(true);

        if (this.onDisconnect) {
          this.onDisconnect(err);
        }
      });
  },

  /**
   * Set or refresh the push notifications/device token. If the client is connected,
   * the deviceToken can be sent to the server.
   *
   * @memberof Tinode#
   * @param {string} dt - token obtained from the provider.
   * @param {boolean} sendToServer - if true, send dt to server immediately.
   *
   * @returns true if attempt was made to send the token to the server.
   */
  setDeviceToken: function(dt, sendToServer) {
    let sent = false;
    if (dt && dt != this._deviceToken) {
      this._deviceToken = dt;
      if (sendToServer && this.isConnected() && this.isAuthenticated()) {
        this.send({
          'hi': {
            'dev': dt
          }
        });
        sent = true;
      }
    }
    return sent;
  },

  /**
   * Authenticate current session.
   * @memberof Tinode#
   *
   * @param {string} scheme - Authentication scheme; <code>"basic"</code> is the only currently supported scheme.
   * @param {string} secret - Authentication secret, assumed to be already base64 encoded.
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  login: function(scheme, secret, cred) {
    const pkt = this.initPacket('login');
    pkt.login.scheme = scheme;
    pkt.login.secret = secret;
    pkt.login.cred = cred;

    return this.send(pkt, pkt.login.id)
      .then((ctrl) => {
        const x = this.loginSuccessful(ctrl);
        return x;
      });
  },

  /**
   * Wrapper for {@link Tinode#login} with basic authentication
   * @memberof Tinode#
   *
   * @param {string} uname - User name.
   * @param {string} password  - Password.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  loginBasic: function(uname, password, cred) {
    return this.login('basic', b64EncodeUnicode(uname + ':' + password), cred)
      .then((ctrl) => {
        this._login = uname;
        return ctrl;
      });
  },

  /**
   * Wrapper for {@link Tinode#login} with token authentication
   * @memberof Tinode#
   *
   * @param {string} token - Token received in response to earlier login.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  loginToken: function(token, cred) {
    return this.login('token', token, cred);
  },

  /**
   * Send a request for resetting an authentication secret.
   * @memberof Tinode#
   *
   * @param {string} scheme - authentication scheme to reset.
   * @param {string} method - method to use for resetting the secret, such as "email" or "tel".
   * @param {string} value - value of the credential to use, a specific email address or a phone number.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving the server reply.
   */
  requestResetAuthSecret: function(scheme, method, value) {
    return this.login('reset', b64EncodeUnicode(scheme + ':' + method + ':' + value));
  },

  /**
   * @typedef AuthToken
   * @memberof Tinode
   * @type {Object}
   * @property {string} token - Token value.
   * @property {Date} expires - Token expiration time.
   */
  /**
   * Get stored authentication token.
   * @memberof Tinode#
   *
   * @returns {Tinode.AuthToken} authentication token.
   */
  getAuthToken: function() {
    if (this._authToken && (this._authToken.expires.getTime() > Date.now())) {
      return this._authToken;
    } else {
      this._authToken = null;
    }
    return null;
  },

  /**
   * Application may provide a saved authentication token.
   * @memberof Tinode#
   *
   * @param {Tinode.AuthToken} token - authentication token.
   */
  setAuthToken: function(token) {
    this._authToken = token;
  },

  /**
   * @typedef SetParams
   * @type {Object}
   * @memberof Tinode
   * @property {Tinode.SetDesc=} desc - Topic initialization parameters when creating a new topic or a new subscription.
   * @property {Tinode.SetSub=} sub - Subscription initialization parameters.
   */
  /**
   * @typedef SetDesc
   * @type {Object}
   * @memberof Tinode
   * @property {Tinode.DefAcs=} defacs - Default access mode.
   * @property {Object=} public - Free-form topic description, publically accessible.
   * @property {Object=} private - Free-form topic descriptionaccessible only to the owner.
   */
  /**
   * @typedef SetSub
   * @type {Object}
   * @memberof Tinode
   * @property {string=} user - UID of the user affected by the request. Default (empty) - current user.
   * @property {string=} mode - User access mode, either requested or assigned dependent on context.
   * @property {Object=} info - Free-form payload to pass to the invited user or topic manager.
   */
  /**
   * Parameters passed to {@link Tinode#subscribe}.
   *
   * @typedef SubscriptionParams
   * @type {Object}
   * @memberof Tinode
   * @property {Tinode.SetParams=} set - Parameters used to initialize topic
   * @property {Tinode.GetQuery=} get - Query for fetching data from topic.
   */

  /**
   * Send a topic subscription request.
   * @memberof Tinode#
   *
   * @param {string} topic - Name of the topic to subscribe to.
   * @param {Tinode.GetQuery=} getParams - Optional subscription metadata query
   * @param {Tinode.SetParams=} setParams - Optional initialization parameters
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  subscribe: function(topicName, getParams, setParams) {
    const pkt = this.initPacket('sub', topicName)
    if (!topicName) {
      topicName = TOPIC_NEW;
    }

    pkt.sub.get = getParams;

    if (setParams) {
      if (setParams.sub) {
        pkt.sub.set.sub = setParams.sub;
      }

      if (setParams.desc) {
        if (Tinode.isNewGroupTopicName(topicName)) {
          // Full set.desc params are used for new topics only
          pkt.sub.set.desc = setParams.desc;
        } else if (Tinode.isP2PTopicName(topicName) && setParams.desc.defacs) {
          // Use optional default permissions only.
          pkt.sub.set.desc = {
            defacs: setParams.desc.defacs
          };
        }
      }

      if (setParams.tags) {
        pkt.sub.set.tags = setParams.tags;
      }
    }

    return this.send(pkt, pkt.sub.id);
  },

  /**
   * Detach and optionally unsubscribe from the topic
   * @memberof Tinode#
   *
   * @param {string} topic - Topic to detach from.
   * @param {boolean} unsub - If <code>true</code>, detach and unsubscribe, otherwise just detach.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  leave: function(topic, unsub) {
    const pkt = this.initPacket('leave', topic);
    pkt.leave.unsub = unsub;

    return this.send(pkt, pkt.leave.id);
  },

  /**
   * Create message draft without sending it to the server.
   * @memberof Tinode#
   *
   * @param {string} topic - Name of the topic to publish to.
   * @param {Object} data - Payload to publish.
   * @param {boolean=} noEcho - If <code>true</code>, tell the server not to echo the message to the original session.
   *
   * @returns {Object} new message which can be sent to the server or otherwise used.
   */
  createMessage: function(topic, data, noEcho) {
    const pkt = this.initPacket('pub', topic);

    let dft = typeof data == 'string' ? Drafty.parse(data) : data;
    if (dft && !Drafty.isPlainText(dft)) {
      pkt.pub.head = {
        mime: Drafty.getContentType()
      };
      data = dft;
    }
    pkt.pub.noecho = noEcho;
    pkt.pub.content = data;

    return pkt.pub;
  },

  /**
   * Publish {data} message to topic.
   * @memberof Tinode#
   *
   * @param {string} topic - Name of the topic to publish to.
   * @param {Object} data - Payload to publish.
   * @param {boolean=} noEcho - If <code>true</code>, tell the server not to echo the message to the original session.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  publish: function(topic, data, noEcho) {
    return this.publishMessage(
      this.createMessage(topic, data, noEcho)
    );
  },

  /**
   * Publish message to topic. The message should be created by {@link Tinode#createMessage}.
   * @memberof Tinode#
   *
   * @param {Object} pub - Message to publish.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  publishMessage: function(pub) {
    // Make a shallow copy. Needed in order to clear locally-assigned temp values;
    pub = Object.assign({}, pub);
    pub.seq = undefined;
    pub.from = undefined;
    pub.ts = undefined;
    return this.send({
      pub: pub
    }, pub.id);
  },

  /**
   * @typedef GetQuery
   * @type {Object}
   * @memberof Tinode
   * @property {Tinode.GetOptsType=} desc - If provided (even if empty), fetch topic description.
   * @property {Tinode.GetOptsType=} sub - If provided (even if empty), fetch topic subscriptions.
   * @property {Tinode.GetDataType=} data - If provided (even if empty), get messages.
   */

  /**
   * @typedef GetOptsType
   * @type {Object}
   * @memberof Tinode
   * @property {Date=} ims - "If modified since", fetch data only it was was modified since stated date.
   * @property {number=} limit - Maximum number of results to return. Ignored when querying topic description.
   */

  /**
   * @typedef GetDataType
   * @type {Object}
   * @memberof Tinode
   * @property {number=} since - Load messages with seq id equal or greater than this value.
   * @property {number=} before - Load messages with seq id lower than this number.
   * @property {number=} limit - Maximum number of results to return.
   */

  /**
   * Request topic metadata
   * @memberof Tinode#
   *
   * @param {string} topic - Name of the topic to query.
   * @param {Tinode.GetQuery} params - Parameters of the query. Use {@link Tinode.MetaGetBuilder} to generate.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  getMeta: function(topic, params) {
    const pkt = this.initPacket('get', topic);

    pkt.get = mergeObj(pkt.get, params);

    return this.send(pkt, pkt.get.id);
  },

  /**
   * Update topic's metadata: description, subscribtions.
   * @memberof Tinode#
   *
   * @param {string} topic - Topic to update.
   * @param {Tinode.SetParams} params - topic metadata to update.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  setMeta: function(topic, params) {
    const pkt = this.initPacket('set', topic);
    const what = [];

    if (params) {
      ['desc', 'sub', 'tags', 'cred'].map(function(key) {
        if (params.hasOwnProperty(key)) {
          what.push(key);
          pkt.set[key] = params[key];
        }
      });
    }

    if (what.length == 0) {
      return Promise.reject(new Error("Invalid {set} parameters"));
    }

    return this.send(pkt, pkt.set.id);
  },

  /**
   * Range of message IDs to delete.
   *
   * @typedef DelRange
   * @type {Object}
   * @memberof Tinode
   * @property {number} low - low end of the range, inclusive (closed).
   * @property {number=} hi - high end of the range, exclusive (open).
   */
  /**
   * Delete some or all messages in a topic.
   * @memberof Tinode#
   *
   * @param {string} topic - Topic name to delete messages from.
   * @param {Tinode.DelRange[]} list - Ranges of message IDs to delete.
   * @param {boolean=} hard - Hard or soft delete
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delMessages: function(topic, ranges, hard) {
    const pkt = this.initPacket('del', topic);

    pkt.del.what = 'msg';
    pkt.del.delseq = ranges;
    pkt.del.hard = hard;

    return this.send(pkt, pkt.del.id);
  },

  /**
   * Delete the topic alltogether. Requires Owner permission.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to delete
   * @param {boolean} hard - hard-delete topic.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delTopic: function(topicName, hard) {
    const pkt = this.initPacket('del', topicName);
    pkt.del.what = 'topic';
    pkt.del.hard = hard;

    return this.send(pkt, pkt.del.id).then((ctrl) => {
      this._db.remTopic(topicName);
      this.cacheDel('topic', topicName);
      return this.ctrl;
    });
  },

  /**
   * Delete subscription. Requires Share permission.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to delete
   * @param {string} user - User ID to remove.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delSubscription: function(topicName, user) {
    const pkt = this.initPacket('del', topicName);
    pkt.del.what = 'sub';
    pkt.del.user = user;

    return this.send(pkt, pkt.del.id);
  },

  /**
   * Delete credential. Always sent on <code>'me'</code> topic.
   * @memberof Tinode#
   *
   * @param {string} method - validation method such as <code>'email'</code> or <code>'tel'</code>.
   * @param {string} value - validation value, i.e. <code>'alice@example.com'</code>.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delCredential: function(method, value) {
    const pkt = this.initPacket('del', TOPIC_ME);
    pkt.del.what = 'cred';
    pkt.del.cred = {
      meth: method,
      val: value
    };

    return this.send(pkt, pkt.del.id);
  },

  /**
   * Request to delete account of the current user.
   * @memberof Tinode#
   *
   * @param {boolean} hard - hard-delete user.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delCurrentUser: function(hard) {
    const pkt = this.initPacket('del', null);
    pkt.del.what = 'user';
    pkt.del.hard = hard;

    return this.send(pkt, pkt.del.id).then((ctrl) => {
      this._myUID = null;
    });
  },

  /**
   * Notify server that a message or messages were read or received. Does NOT return promise.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic where the mesage is being aknowledged.
   * @param {string} what - Action being aknowledged, either <code>"read"</code> or <code>"recv"</code>.
   * @param {number} seq - Maximum id of the message being acknowledged.
   */
  note: function(topicName, what, seq) {
    if (seq <= 0 || seq >= LOCAL_SEQID) {
      throw new Error(`Invalid message id ${seq}`);
    }

    const pkt = this.initPacket('note', topicName);
    pkt.note.what = what;
    pkt.note.seq = seq;
    this.send(pkt);
  },

  /**
   * Broadcast a key-press notification to topic subscribers. Used to show
   * typing notifications "user X is typing...".
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to broadcast to.
   */
  noteKeyPress: function(topicName) {
    const pkt = this.initPacket('note', topicName);
    pkt.note.what = 'kp';
    this.send(pkt);
  },

  /**
   * Get a named topic, either pull it from cache or create a new instance.
   * There is a single instance of topic for each name.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to get.
   * @returns {Tinode.Topic} Requested or newly created topic or <code>undefined</code> if topic name is invalid.
   */
  getTopic: function(topicName) {
    let topic = this.cacheGet('topic', topicName);
    if (!topic && topicName) {
      if (topicName == TOPIC_ME) {
        topic = new TopicMe();
      } else if (topicName == TOPIC_FND) {
        topic = new TopicFnd();
      } else {
        topic = new Topic(topicName);
      }
      // Cache management.
      this._db.updTopic(topic);
      this.attachCacheToTopic(topic);
      topic._cachePutSelf();
    }
    return topic;
  },

  /**
   * Check if named topic is already present in cache.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to check.
   * @returns {boolean} true if topic is found in cache, false oterwise.
   */
  isTopicCached: function(topicName) {
    return !!this.cacheGet('topic', topicName);
  },

  /**
   * Generate unique name like <code>'new123456'</code> suitable for creating a new group topic.
   * @memberof Tinode#
   *
   * @param {boolean} isChan - if the topic is channel-enabled.
   * @returns {string} name which can be used for creating a new group topic.
   */
  newGroupTopicName: function(isChan) {
    return (isChan ? TOPIC_NEW_CHAN : TOPIC_NEW) + this.getNextUniqueId();
  },

  /**
   * Instantiate <code>'me'</code> topic or get it from cache.
   * @memberof Tinode#
   *
   * @returns {Tinode.TopicMe} Instance of <code>'me'</code> topic.
   */
  getMeTopic: function() {
    return this.getTopic(TOPIC_ME);
  },

  /**
   * Instantiate <code>'fnd'</code> (find) topic or get it from cache.
   * @memberof Tinode#
   *
   * @returns {Tinode.Topic} Instance of <code>'fnd'</code> topic.
   */
  getFndTopic: function() {
    return this.getTopic(TOPIC_FND);
  },

  /**
   * Create a new {@link LargeFileHelper} instance
   * @memberof Tinode#
   *
   * @returns {Tinode.LargeFileHelper} instance of a {@link Tinode.LargeFileHelper}.
   */
  getLargeFileHelper: function() {
    return new LargeFileHelper(this);
  },

  /**
   * Get the UID of the the current authenticated user.
   * @memberof Tinode#
   * @returns {string} UID of the current user or <code>undefined</code> if the session is not yet authenticated or if there is no session.
   */
  getCurrentUserID: function() {
    return this._myUID;
  },

  /**
   * Check if the given user ID is equal to the current user's UID.
   * @memberof Tinode#
   * @param {string} uid - UID to check.
   * @returns {boolean} true if the given UID belongs to the current logged in user.
   */
  isMe: function(uid) {
    return this._myUID === uid;
  },

  /**
   * Get login used for last successful authentication.
   * @memberof Tinode#
   * @returns {string} login last used successfully or <code>undefined</code>.
   */
  getCurrentLogin: function() {
    return this._login;
  },

  /**
   * Return information about the server: protocol version and build timestamp.
   * @memberof Tinode#
   * @returns {Object} build and version of the server or <code>null</code> if there is no connection or if the first server response has not been received yet.
   */
  getServerInfo: function() {
    return this._serverInfo;
  },

  /**
   * Return server-provided configuration value (long integer).
   * @memberof Tinode#
   * @param {string} name of the value to return
   * @param {Object} defaultValue to return in case server limit is not set or not found.
   * @returns {number} named value.
   */
  getServerLimit: function(name, defaultValue) {
    return (this._serverInfo ? this._serverInfo[name] : null) || defaultValue;
  },

  /**
   * Toggle console logging. Logging is off by default.
   * @memberof Tinode#
   * @param {boolean} enabled - Set to <code>true</code> to enable logging to console.
   * @param {boolean} trimLongStrings - Set to <code>true</code> to trim long strings.
   */
  enableLogging: function(enabled, trimLongStrings) {
    this._loggingEnabled = enabled;
    this._trimLongStrings = enabled && trimLongStrings;
  },

  /**
   * Set UI language to report to the server. Must be called before <code>'hi'</code> is sent, otherwise it will not be used.
   * @memberof Tinode#
   *
   * @param {string} hl - human (UI) language, like <code>"en_US"</code> or <code>"zh-Hans"</code>.
   */
  setHumanLanguage: function(hl) {
    if (hl) {
      this._humanLanguage = hl;
    }
  },

  /**
   * Check if given topic is online.
   * @memberof Tinode#
   *
   * @param {string} name of the topic to test.
   * @returns {boolean} true if topic is online, false otherwise.
   */
  isTopicOnline: function(name) {
    const topic = this.cacheGet('topic', name);
    return topic && topic.online;
  },

  /**
   * Get access mode for the given contact.
   * @memberof Tinode#
   *
   * @param {string} name of the topic to query.
   * @returns {AccessMode} access mode if topic is found, null otherwise.
   */
  getTopicAccessMode: function(name) {
    const topic = this.cacheGet('topic', name);
    return topic ? topic.acs : null;
  },

  /**
   * Include message ID into all subsequest messages to server instructin it to send aknowledgemens.
   * Required for promises to function. Default is <code>"on"</code>.
   * @memberof Tinode#
   *
   * @param {boolean} status - Turn aknowledgemens on or off.
   * @deprecated
   */
  wantAkn: function(status) {
    if (status) {
      this._messageId = Math.floor((Math.random() * 0xFFFFFF) + 0xFFFFFF);
    } else {
      this._messageId = 0;
    }
  },

  // Callbacks:
  /**
   * Callback to report when the websocket is opened. The callback has no parameters.
   * @memberof Tinode#
   * @type {Tinode.onWebsocketOpen}
   */
  onWebsocketOpen: undefined,

  /**
   * @typedef Tinode.ServerParams
   * @memberof Tinode
   * @type {Object}
   * @property {string} ver - Server version
   * @property {string} build - Server build
   * @property {string=} sid - Session ID, long polling connections only.
   */

  /**
   * @callback Tinode.onConnect
   * @param {number} code - Result code
   * @param {string} text - Text epxplaining the completion, i.e "OK" or an error message.
   * @param {Tinode.ServerParams} params - Parameters returned by the server.
   */
  /**
   * Callback to report when connection with Tinode server is established.
   * @memberof Tinode#
   * @type {Tinode.onConnect}
   */
  onConnect: undefined,

  /**
   * Callback to report when connection is lost. The callback has no parameters.
   * @memberof Tinode#
   * @type {Tinode.onDisconnect}
   */
  onDisconnect: undefined,

  /**
   * @callback Tinode.onLogin
   * @param {number} code - NUmeric completion code, same as HTTP status codes.
   * @param {string} text - Explanation of the completion code.
   */
  /**
   * Callback to report login completion.
   * @memberof Tinode#
   * @type {Tinode.onLogin}
   */
  onLogin: undefined,

  /**
   * Callback to receive <code>{ctrl}</code> (control) messages.
   * @memberof Tinode#
   * @type {Tinode.onCtrlMessage}
   */
  onCtrlMessage: undefined,

  /**
   * Callback to recieve <code>{data}</code> (content) messages.
   * @memberof Tinode#
   * @type {Tinode.onDataMessage}
   */
  onDataMessage: undefined,

  /**
   * Callback to receive <code>{pres}</code> (presence) messages.
   * @memberof Tinode#
   * @type {Tinode.onPresMessage}
   */
  onPresMessage: undefined,

  /**
   * Callback to receive all messages as objects.
   * @memberof Tinode#
   * @type {Tinode.onMessage}
   */
  onMessage: undefined,

  /**
   * Callback to receive all messages as unparsed text.
   * @memberof Tinode#
   * @type {Tinode.onRawMessage}
   */
  onRawMessage: undefined,

  /**
   * Callback to receive server responses to network probes. See {@link Tinode#networkProbe}
   * @memberof Tinode#
   * @type {Tinode.onNetworkProbe}
   */
  onNetworkProbe: undefined,

  /**
   * Callback to be notified when exponential backoff is iterating.
   * @memberof Tinode#
   * @type {Tinode.onAutoreconnectIteration}
   */
  onAutoreconnectIteration: undefined,
};

/**
 * Helper class for constructing {@link Tinode.GetQuery}.
 *
 * @class MetaGetBuilder
 * @memberof Tinode
 *
 * @param {Tinode.Topic} parent topic which instantiated this builder.
 */
var MetaGetBuilder = function(parent) {
  this.topic = parent;
  this.what = {};
}

MetaGetBuilder.prototype = {

  // Get timestamp of the most recent desc update.
  _get_desc_ims: function() {
    const tupd = this.topic._lastDescUpdate || 0;
    return this.topic.updated > tupd ? this.topic.updated : tupd;
  },

  // Get timestamp of the most recent subs update.
  _get_subs_ims: function() {
    if (this.topic.isP2PType()) {
      return this._get_desc_ims();
    }
    if (this.topic.isMeType()) {
      const gupd = this.topic._tinode._lastTopicUpdate || 0;
      if (gupd > this.topic._lastSubsUpdate) {
        return gupd;
      }
    }
    return this.topic._lastSubsUpdate;
  },

  /**
   * Add query parameters to fetch messages within explicit limits.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} since - messages newer than this (inclusive);
   * @param {number=} before - older than this (exclusive)
   * @param {number=} limit - number of messages to fetch
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withData: function(since, before, limit) {
    this.what['data'] = {
      since: since,
      before: before,
      limit: limit
    };
    return this;
  },

  /**
   * Add query parameters to fetch messages newer than the latest saved message.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} limit - number of messages to fetch
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterData: function(limit) {
    return this.withData(this.topic._maxSeq > 0 ? this.topic._maxSeq + 1 : undefined, undefined, limit);
  },

  /**
   * Add query parameters to fetch messages older than the earliest saved message.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} limit - maximum number of messages to fetch.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withEarlierData: function(limit) {
    return this.withData(undefined, this.topic._minSeq > 0 ? this.topic._minSeq : undefined, limit);
  },

  /**
   * Add query parameters to fetch topic description if it's newer than the given timestamp.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {Date=} ims - fetch messages newer than this timestamp.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withDesc: function(ims) {
    this.what['desc'] = {
      ims: ims
    };
    return this;
  },

  /**
   * Add query parameters to fetch topic description if it's newer than the last update.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterDesc: function() {
    return this.withDesc(this._get_desc_ims());
  },

  /**
   * Add query parameters to fetch subscriptions.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {Date=} ims - fetch subscriptions modified more recently than this timestamp
   * @param {number=} limit - maximum number of subscriptions to fetch.
   * @param {string=} userOrTopic - user ID or topic name to fetch for fetching one subscription.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withSub: function(ims, limit, userOrTopic) {
    const opts = {
      ims: ims,
      limit: limit
    };
    if (this.topic.getType() == 'me') {
      opts.topic = userOrTopic;
    } else {
      opts.user = userOrTopic;
    }
    this.what['sub'] = opts;
    return this;
  },

  /**
   * Add query parameters to fetch a single subscription.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {Date=} ims - fetch subscriptions modified more recently than this timestamp
   * @param {string=} userOrTopic - user ID or topic name to fetch for fetching one subscription.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withOneSub: function(ims, userOrTopic) {
    return this.withSub(ims, undefined, userOrTopic);
  },

  /**
   * Add query parameters to fetch a single subscription if it's been updated since the last update.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {string=} userOrTopic - user ID or topic name to fetch for fetching one subscription.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterOneSub: function(userOrTopic) {
    return this.withOneSub(this.topic._lastSubsUpdate, userOrTopic);
  },

  /**
   * Add query parameters to fetch subscriptions updated since the last update.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} limit - maximum number of subscriptions to fetch.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterSub: function(limit) {
    return this.withSub(this._get_subs_ims(), limit);
  },

  /**
   * Add query parameters to fetch topic tags.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withTags: function() {
    this.what['tags'] = true;
    return this;
  },

  /**
   * Add query parameters to fetch user's credentials. <code>'me'</code> topic only.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withCred: function() {
    if (this.topic.getType() == 'me') {
      this.what['cred'] = true;
    } else {
      this.topic._tinode.logger("ERROR: Invalid topic type for MetaGetBuilder:withCreds", this.topic.getType());
    }
    return this;
  },

  /**
   * Add query parameters to fetch deleted messages within explicit limits. Any/all parameters can be null.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} since - ids of messages deleted since this 'del' id (inclusive)
   * @param {number=} limit - number of deleted message ids to fetch
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withDel: function(since, limit) {
    if (since || limit) {
      this.what['del'] = {
        since: since,
        limit: limit
      };
    }
    return this;
  },

  /**
   * Add query parameters to fetch messages deleted after the saved <code>'del'</code> id.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} limit - number of deleted message ids to fetch
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterDel: function(limit) {
    // Specify 'since' only if we have already received some messages. If
    // we have no locally cached messages then we don't care if any messages were deleted.
    return this.withDel(this.topic._maxSeq > 0 ? this.topic._maxDel + 1 : undefined, limit);
  },

  /**
   * Construct parameters.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @returns {Tinode.GetQuery} Get query
   */
  build: function() {
    const what = [];
    const instance = this;
    let params = {};
    ['data', 'sub', 'desc', 'tags', 'cred', 'del'].map(function(key) {
      if (instance.what.hasOwnProperty(key)) {
        what.push(key);
        if (Object.getOwnPropertyNames(instance.what[key]).length > 0) {
          params[key] = instance.what[key];
        }
      }
    });
    if (what.length > 0) {
      params.what = what.join(' ');
    } else {
      params = undefined;
    }
    return params;
  }
};

/**
 * Helper class for handling access mode.
 *
 * @class AccessMode
 * @memberof Tinode
 *
 * @param {AccessMode|Object=} acs - AccessMode to copy or access mode object received from the server.
 */
var AccessMode = function(acs) {
  if (acs) {
    this.given = typeof acs.given == 'number' ? acs.given : AccessMode.decode(acs.given);
    this.want = typeof acs.want == 'number' ? acs.want : AccessMode.decode(acs.want);
    this.mode = acs.mode ? (typeof acs.mode == 'number' ? acs.mode : AccessMode.decode(acs.mode)) :
      (this.given & this.want);
  }
};

AccessMode._NONE = 0x00;
AccessMode._JOIN = 0x01;
AccessMode._READ = 0x02;
AccessMode._WRITE = 0x04;
AccessMode._PRES = 0x08;
AccessMode._APPROVE = 0x10;
AccessMode._SHARE = 0x20;
AccessMode._DELETE = 0x40;
AccessMode._OWNER = 0x80;

AccessMode._BITMASK = AccessMode._JOIN | AccessMode._READ | AccessMode._WRITE | AccessMode._PRES |
  AccessMode._APPROVE | AccessMode._SHARE | AccessMode._DELETE | AccessMode._OWNER;
AccessMode._INVALID = 0x100000;

AccessMode._checkFlag = function(val, side, flag) {
  side = side || 'mode';
  if (['given', 'want', 'mode'].includes(side)) {
    return ((val[side] & flag) != 0);
  }
  throw new Error(`Invalid AccessMode component '${side}'`);
}

/**
 * Parse string into an access mode value.
 * @memberof Tinode.AccessMode
 * @static
 *
 * @param {string | Number} mode - either a String representation of the access mode to parse or a set of bits to assign.
 * @returns {number} - Access mode as a numeric value.
 */
AccessMode.decode = function(str) {
  if (!str) {
    return null;
  } else if (typeof str == 'number') {
    return str & AccessMode._BITMASK;
  } else if (str === 'N' || str === 'n') {
    return AccessMode._NONE;
  }

  const bitmask = {
    'J': AccessMode._JOIN,
    'R': AccessMode._READ,
    'W': AccessMode._WRITE,
    'P': AccessMode._PRES,
    'A': AccessMode._APPROVE,
    'S': AccessMode._SHARE,
    'D': AccessMode._DELETE,
    'O': AccessMode._OWNER
  };

  let m0 = AccessMode._NONE;

  for (let i = 0; i < str.length; i++) {
    const bit = bitmask[str.charAt(i).toUpperCase()];
    if (!bit) {
      // Unrecognized bit, skip.
      continue;
    }
    m0 |= bit;
  }
  return m0;
};

/**
 * Convert numeric representation of the access mode into a string.
 *
 * @memberof Tinode.AccessMode
 * @static
 *
 * @param {number} val - access mode value to convert to a string.
 * @returns {string} - Access mode as a string.
 */
AccessMode.encode = function(val) {
  if (val === null || val === AccessMode._INVALID) {
    return null;
  } else if (val === AccessMode._NONE) {
    return 'N';
  }

  const bitmask = ['J', 'R', 'W', 'P', 'A', 'S', 'D', 'O'];
  let res = '';
  for (let i = 0; i < bitmask.length; i++) {
    if ((val & (1 << i)) != 0) {
      res = res + bitmask[i];
    }
  }
  return res;
};

/**
 * Update numeric representation of access mode with the new value. The value
 * is one of the following:
 *  - a string starting with <code>'+'</code> or <code>'-'</code> then the bits to add or remove, e.g. <code>'+R-W'</code> or <code>'-PS'</code>.
 *  - a new value of access mode
 *
 * @memberof Tinode.AccessMode
 * @static
 *
 * @param {number} val - access mode value to update.
 * @param {string} upd - update to apply to val.
 * @returns {number} - updated access mode.
 */
AccessMode.update = function(val, upd) {
  if (!upd || typeof upd != 'string') {
    return val;
  }

  let action = upd.charAt(0);
  if (action == '+' || action == '-') {
    let val0 = val;
    // Split delta-string like '+ABC-DEF+Z' into an array of parts including + and -.
    const parts = upd.split(/([-+])/);
    // Starting iteration from 1 because String.split() creates an array with the first empty element.
    // Iterating by 2 because we parse pairs +/- then data.
    for (let i = 1; i < parts.length - 1; i += 2) {
      action = parts[i];
      const m0 = AccessMode.decode(parts[i + 1]);
      if (m0 == AccessMode._INVALID) {
        return val;
      }
      if (m0 == null) {
        continue;
      }
      if (action === '+') {
        val0 |= m0;
      } else if (action === '-') {
        val0 &= ~m0;
      }
    }
    val = val0;
  } else {
    // The string is an explicit new value 'ABC' rather than delta.
    const val0 = AccessMode.decode(upd);
    if (val0 != AccessMode._INVALID) {
      val = val0;
    }
  }

  return val;
};

/**
 * Bits present in a1 but missing in a2.
 *
 * @static
 * @memberof Tinode
 *
 * @param {number | string} a1 - access mode to subtract from.
 * @param {number | string} a2 - access mode to subtract.
 * @returns {number} access mode with bits present in <code>a1</code> but missing in <code>a2</code>.
 */
AccessMode.diff = function(a1, a2) {
  a1 = AccessMode.decode(a1);
  a2 = AccessMode.decode(a2);

  if (a1 == AccessMode._INVALID || a2 == AccessMode._INVALID) {
    return AccessMode._INVALID;
  }
  return a1 & ~a2;
};

/**
 * AccessMode is a class representing topic access mode.
 *
 * @memberof Tinode
 * @class AccessMode
 */
AccessMode.prototype = {
  /**
   * Custom formatter
   */
  toString: function() {
    return '{"mode": "' + AccessMode.encode(this.mode) +
      '", "given": "' + AccessMode.encode(this.given) +
      '", "want": "' + AccessMode.encode(this.want) + '"}';
  },
  /**
   * Converts numeric values to strings.
   */
  jsonHelper: function() {
    return {
      mode: AccessMode.encode(this.mode),
      given: AccessMode.encode(this.given),
      want: AccessMode.encode(this.want)
    };
  },
  /**
   * Assign value to 'mode'.
   * @memberof Tinode.AccessMode
   *
   * @param {string | Number} m - either a string representation of the access mode or a set of bits.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  setMode: function(m) {
    this.mode = AccessMode.decode(m);
    return this;
  },
  /**
   * Update <code>mode</code> value.
   * @memberof Tinode.AccessMode
   *
   * @param {string} u - string representation of the changes to apply to access mode.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  updateMode: function(u) {
    this.mode = AccessMode.update(this.mode, u);
    return this;
  },
  /**
   * Get <code>mode</code> value as a string.
   * @memberof Tinode.AccessMode
   *
   * @returns {string} - <code>mode</code> value.
   */
  getMode: function() {
    return AccessMode.encode(this.mode);
  },

  /**
   * Assign <code>given</code>  value.
   * @memberof Tinode.AccessMode
   *
   * @param {string | Number} g - either a string representation of the access mode or a set of bits.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  setGiven: function(g) {
    this.given = AccessMode.decode(g);
    return this;
  },
  /**
   * Update 'given' value.
   * @memberof Tinode.AccessMode
   *
   * @param {string} u - string representation of the changes to apply to access mode.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  updateGiven: function(u) {
    this.given = AccessMode.update(this.given, u);
    return this;
  },
  /**
   * Get 'given' value as a string.
   * @memberof Tinode.AccessMode
   *
   * @returns {string} - <b>given</b> value.
   */
  getGiven: function() {
    return AccessMode.encode(this.given);
  },

  /**
   * Assign 'want' value.
   * @memberof Tinode.AccessMode
   *
   * @param {string | Number} w - either a string representation of the access mode or a set of bits.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  setWant: function(w) {
    this.want = AccessMode.decode(w);
    return this;
  },
  /**
   * Update 'want' value.
   * @memberof Tinode.AccessMode
   *
   * @param {string} u - string representation of the changes to apply to access mode.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  updateWant: function(u) {
    this.want = AccessMode.update(this.want, u);
    return this;
  },
  /**
   * Get 'want' value as a string.
   * @memberof Tinode.AccessMode
   *
   * @returns {string} - <b>want</b> value.
   */
  getWant: function() {
    return AccessMode.encode(this.want);
  },

  /**
   * Get permissions present in 'want' but missing in 'given'.
   * Inverse of {@link Tinode.AccessMode#getExcessive}
   *
   * @memberof Tinode.AccessMode
   *
   * @returns {string} permissions present in <b>want</b> but missing in <b>given</b>.
   */
  getMissing: function() {
    return AccessMode.encode(this.want & ~this.given);
  },

  /**
   * Get permissions present in 'given' but missing in 'want'.
   * Inverse of {@link Tinode.AccessMode#getMissing}
   * @memberof Tinode.AccessMode
   *
   * @returns {string} permissions present in <b>given</b> but missing in <b>want</b>.
   */
  getExcessive: function() {
    return AccessMode.encode(this.given & ~this.want);
  },

  /**
   * Update 'want', 'give', and 'mode' values.
   * @memberof Tinode.AccessMode
   *
   * @param {AccessMode} val - new access mode value.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  updateAll: function(val) {
    if (val) {
      this.updateGiven(val.given);
      this.updateWant(val.want);
      this.mode = this.given & this.want;
    }
    return this;
  },

  /**
   * Check if Owner (O) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isOwner: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._OWNER);
  },

  /**
   * Check if Presence (P) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isPresencer: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._PRES);
  },

  /**
   * Check if Presence (P) flag is NOT set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isMuted: function(side) {
    return !this.isPresencer(side);
  },

  /**
   * Check if Join (J) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isJoiner: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._JOIN);
  },

  /**
   * Check if Reader (R) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isReader: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._READ);
  },

  /**
   * Check if Writer (W) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isWriter: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._WRITE);
  },

  /**
   * Check if Approver (A) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isApprover: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._APPROVE);
  },

  /**
   * Check if either one of Owner (O) or Approver (A) flags is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isAdmin: function(side) {
    return this.isOwner(side) || this.isApprover(side);
  },

  /**
   * Check if either one of Owner (O), Approver (A), or Sharer (S) flags is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isSharer: function(side) {
    return this.isAdmin(side) || AccessMode._checkFlag(this, side, AccessMode._SHARE);
  },

  /**
   * Check if Deleter (D) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isDeleter: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._DELETE);
  }
};

/**
 * @callback Tinode.Topic.onData
 * @param {Data} data - Data packet
 */
/**
 * Topic is a class representing a logical communication channel.
 * @class Topic
 * @memberof Tinode
 *
 * @param {string} name - Name of the topic to create.
 * @param {Object=} callbacks - Object with various event callbacks.
 * @param {Tinode.Topic.onData} callbacks.onData - Callback which receives a <code>{data}</code> message.
 * @param {callback} callbacks.onMeta - Callback which receives a <code>{meta}</code> message.
 * @param {callback} callbacks.onPres - Callback which receives a <code>{pres}</code> message.
 * @param {callback} callbacks.onInfo - Callback which receives an <code>{info}</code> message.
 * @param {callback} callbacks.onMetaDesc - Callback which receives changes to topic desctioption {@link desc}.
 * @param {callback} callbacks.onMetaSub - Called for a single subscription record change.
 * @param {callback} callbacks.onSubsUpdated - Called after a batch of subscription changes have been recieved and cached.
 * @param {callback} callbacks.onDeleteTopic - Called after the topic is deleted.
 * @param {callback} callbacls.onAllMessagesReceived - Called when all requested <code>{data}</code> messages have been recived.
 */
var Topic = function(name, callbacks) {
  // Parent Tinode object.
  this._tinode = null;

  // Server-provided data, locally immutable.
  // topic name
  this.name = name;
  // timestamp when the topic was created
  this.created = null;
  // timestamp when the topic was last updated
  this.updated = null;
  // timestamp of the last messages
  this.touched = null;
  // access mode, see AccessMode
  this.acs = new AccessMode(null);
  // per-topic private data
  this.private = null;
  // per-topic public data
  this.public = null;

  // Locally cached data
  // Subscribed users, for tracking read/recv/msg notifications.
  this._users = {};

  // Current value of locally issued seqId, used for pending messages.
  this._queuedSeqId = LOCAL_SEQID;

  // The maximum known {data.seq} value.
  this._maxSeq = 0;
  // The minimum known {data.seq} value.
  this._minSeq = 0;
  // Indicator that the last request for earlier messages returned 0.
  this._noEarlierMsgs = false;
  // The maximum known deletion ID.
  this._maxDel = 0;
  // User discovery tags
  this._tags = [];
  // Credentials such as email or phone number.
  this._credentials = [];
  // Message cache, sorted by message seq values, from old to new.
  this._messages = CBuffer(function(a, b) {
    return a.seq - b.seq;
  }, true);
  // Boolean, true if the topic is currently live
  this._subscribed = false;
  // Timestap when topic meta-desc update was recived.
  this._lastDescUpdate = null;
  // Timestap when topic meta-subs update was recived.
  this._lastSubsUpdate = null;
  // Topic created but not yet synced with the server. Used only during initialization.
  this._new = true;

  // Callbacks
  if (callbacks) {
    this.onData = callbacks.onData;
    this.onMeta = callbacks.onMeta;
    this.onPres = callbacks.onPres;
    this.onInfo = callbacks.onInfo;
    // A single desc update;
    this.onMetaDesc = callbacks.onMetaDesc;
    // A single subscription record;
    this.onMetaSub = callbacks.onMetaSub;
    // All subscription records received;
    this.onSubsUpdated = callbacks.onSubsUpdated;
    this.onTagsUpdated = callbacks.onTagsUpdated;
    this.onCredsUpdated = callbacks.onCredsUpdated;
    this.onDeleteTopic = callbacks.onDeleteTopic;
    this.onAllMessagesReceived = callbacks.onAllMessagesReceived;
  }
};

Topic.prototype = {
  /**
   * Check if the topic is subscribed.
   * @memberof Tinode.Topic#
   * @returns {boolean} True is topic is attached/subscribed, false otherwise.
   */
  isSubscribed: function() {
    return this._subscribed;
  },

  /**
   * Request topic to subscribe. Wrapper for {@link Tinode#subscribe}.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.GetQuery=} getParams - get query parameters.
   * @param {Tinode.SetParams=} setParams - set parameters.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  subscribe: function(getParams, setParams) {
    // If the topic is already subscribed, return resolved promise
    if (this._subscribed) {
      return Promise.resolve(this);
    }

    // Send subscribe message, handle async response.
    // If topic name is explicitly provided, use it. If no name, then it's a new group topic,
    // use "new".
    return this._tinode.subscribe(this.name || TOPIC_NEW, getParams, setParams).then((ctrl) => {
      if (ctrl.code >= 300) {
        // Do nothing if subscription status has not changed.
        return ctrl;
      }

      this._subscribed = true;
      this.acs = (ctrl.params && ctrl.params.acs) ? ctrl.params.acs : this.acs;

      // Set topic name for new topics and add it to cache.
      if (this._new) {
        this._new = false;

        // Name may change new123456 -> grpAbCdEf
        this.name = ctrl.topic;

        this.created = ctrl.ts;
        this.updated = ctrl.ts;
        // Don't assign touched, otherwise topic will be put on top of the list on subscribe.

        this._cachePutSelf();

        if (this.name != TOPIC_ME && this.name != TOPIC_FND) {
          // Add the new topic to the list of contacts maintained by the 'me' topic.
          const me = this._tinode.getMeTopic();
          if (me.onMetaSub) {
            me.onMetaSub(this);
          }
          if (me.onSubsUpdated) {
            me.onSubsUpdated([this.name], 1);
          }
        }

        if (setParams && setParams.desc) {
          setParams.desc._noForwarding = true;
          this._processMetaDesc(setParams.desc);
        }
      }

      return ctrl;
    });
  },

  /**
   * Create a draft of a message without sending it to the server.
   * @memberof Tinode.Topic#
   *
   * @param {string | Object} data - Content to wrap in a draft.
   * @param {boolean=} noEcho - If <code>true</code> server will not echo message back to originating
   * session. Otherwise the server will send a copy of the message to sender.
   *
   * @returns {Object} message draft.
   */
  createMessage: function(data, noEcho) {
    return this._tinode.createMessage(this.name, data, noEcho);
  },

  /**
   * Immediately publish data to topic. Wrapper for {@link Tinode#publish}.
   * @memberof Tinode.Topic#
   *
   * @param {string | Object} data - Data to publish, either plain string or a Drafty object.
   * @param {boolean=} noEcho - If <code>true</code> server will not echo message back to originating
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  publish: function(data, noEcho) {
    return this.publishMessage(this.createMessage(data, noEcho));
  },

  /**
   * Publish message created by {@link Tinode.Topic#createMessage}.
   * @memberof Tinode.Topic#
   *
   * @param {Object} pub - {data} object to publish. Must be created by {@link Tinode.Topic#createMessage}
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  publishMessage: function(pub) {
    if (!this._subscribed) {
      return Promise.reject(new Error("Cannot publish on inactive topic"));
    }

    // Update header with attachment records.
    if (Drafty.hasAttachments(pub.content) && !pub.head.attachments) {
      let attachments = [];
      Drafty.attachments(pub.content, (data) => {
        attachments.push(data.ref);
      });
      pub.head.attachments = attachments;
    }

    // Send data.
    pub._sending = true;
    pub._failed = false;
    return this._tinode.publishMessage(pub).then((ctrl) => {
      pub._sending = false;
      pub.ts = ctrl.ts;
      this.swapMessageId(pub, ctrl.params.seq);
      this._routeData(pub);
      return ctrl;
    }).catch((err) => {
      this._tinode.logger("WARNING: Message rejected by the server", err);
      pub._sending = false;
      pub._failed = true;
      if (this.onData) {
        this.onData();
      }
    });
  },

  /**
   * Add message to local message cache, send to the server when the promise is resolved.
   * If promise is null or undefined, the message will be sent immediately.
   * The message is sent when the
   * The message should be created by {@link Tinode.Topic#createMessage}.
   * This is probably not the final API.
   * @memberof Tinode.Topic#
   *
   * @param {Object} pub - Message to use as a draft.
   * @param {Promise} prom - Message will be sent when this promise is resolved, discarded if rejected.
   *
   * @returns {Promise} derived promise.
   */
  publishDraft: function(pub, prom) {
    if (!prom && !this._subscribed) {
      return Promise.reject(new Error("Cannot publish on inactive topic"));
    }

    const seq = pub.seq || this._getQueuedSeqId();
    if (!pub._noForwarding) {
      // The 'seq', 'ts', and 'from' are added to mimic {data}. They are removed later
      // before the message is sent.

      pub._noForwarding = true;
      pub.seq = seq;
      pub.ts = new Date();
      pub.from = this._tinode.getCurrentUserID();

      // Don't need an echo message because the message is added to local cache right away.
      pub.noecho = true;
      // Add to cache.
      this._messages.put(pub);
      this._tinode._db.addMessage(pub);

      if (this.onData) {
        this.onData(pub);
      }
    }
    // If promise is provided, send the queued message when it's resolved.
    // If no promise is provided, create a resolved one and send immediately.
    prom = (prom || Promise.resolve()).then(
      ( /* argument ignored */ ) => {
        if (pub._cancelled) {
          return {
            code: 300,
            text: "cancelled"
          };
        }
        return this.publishMessage(pub);
      },
      (err) => {
        this._tinode.logger("WARNING: Message draft rejected", err);
        pub._sending = false;
        pub._failed = true;
        this._messages.delAt(this._messages.find(pub));
        this._tinode._db.remMessages(this.name, pub.seq);
        if (this.onData) {
          this.onData();
        }
      });
    return prom;
  },

  /**
   * Leave the topic, optionally unsibscribe. Leaving the topic means the topic will stop
   * receiving updates from the server. Unsubscribing will terminate user's relationship with the topic.
   * Wrapper for {@link Tinode#leave}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean=} unsub - If true, unsubscribe, otherwise just leave.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  leave: function(unsub) {
    // It's possible to unsubscribe (unsub==true) from inactive topic.
    if (!this._subscribed && !unsub) {
      return Promise.reject(new Error("Cannot leave inactive topic"));
    }

    // Send a 'leave' message, handle async response
    return this._tinode.leave(this.name, unsub).then((ctrl) => {
      this._resetSub();
      if (unsub) {
        this._tinode.cacheDel('topic', this.name);
        this._gone();
      }
      return ctrl;
    });
  },

  /**
   * Request topic metadata from the server.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.GetQuery} request parameters
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  getMeta: function(params) {
    // Send {get} message, return promise.
    return this._tinode.getMeta(this.name, params);
  },

  /**
   * Request more messages from the server
   * @memberof Tinode.Topic#
   *
   * @param {number} limit number of messages to get.
   * @param {boolean} forward if true, request newer messages.
   */
  getMessagesPage: function(limit, forward) {
    const query = this.startMetaQuery();
    if (forward) {
      query.withLaterData(limit);
    } else {
      query.withEarlierData(limit);
    }
    let promise = this.getMeta(query.build());
    if (!forward) {
      promise = promise.then((ctrl) => {
        if (ctrl && ctrl.params && !ctrl.params.count) {
          this._noEarlierMsgs = true;
        }
      });
    }
    return promise;
  },

  /**
   * Update topic metadata.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.SetParams} params parameters to update.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  setMeta: function(params) {
    if (params.tags) {
      params.tags = normalizeArray(params.tags);
    }
    // Send Set message, handle async response.
    return this._tinode.setMeta(this.name, params)
      .then((ctrl) => {
        if (ctrl && ctrl.code >= 300) {
          // Not modified
          return ctrl;
        }

        if (params.sub) {
          params.sub.topic = this.name;
          if (ctrl.params && ctrl.params.acs) {
            params.sub.acs = ctrl.params.acs;
            params.sub.updated = ctrl.ts;
          }
          if (!params.sub.user) {
            // This is a subscription update of the current user.
            // Assign user ID otherwise the update will be ignored by _processMetaSub.
            params.sub.user = this._tinode.getCurrentUserID();
            if (!params.desc) {
              // Force update to topic's asc.
              params.desc = {};
            }
          }
          params.sub._noForwarding = true;
          this._processMetaSub([params.sub]);
        }

        if (params.desc) {
          if (ctrl.params && ctrl.params.acs) {
            params.desc.acs = ctrl.params.acs;
            params.desc.updated = ctrl.ts;
          }
          this._processMetaDesc(params.desc);
        }

        if (params.tags) {
          this._processMetaTags(params.tags);
        }
        if (params.cred) {
          this._processMetaCreds([params.cred], true);
        }

        return ctrl;
      });
  },

  /**
   * Update access mode of the current user or of another topic subsriber.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - UID of the user to update or null to update current user.
   * @param {string} update - the update value, full or delta.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  updateMode: function(uid, update) {
    const user = uid ? this.subscriber(uid) : null;
    const am = user ?
      user.acs.updateGiven(update).getGiven() :
      this.getAccessMode().updateWant(update).getWant();

    return this.setMeta({
      sub: {
        user: uid,
        mode: am
      }
    });
  },

  /**
   * Create new topic subscription. Wrapper for {@link Tinode#setMeta}.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - ID of the user to invite
   * @param {string=} mode - Access mode. <code>null</code> means to use default.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  invite: function(uid, mode) {
    return this.setMeta({
      sub: {
        user: uid,
        mode: mode
      }
    });
  },

  /**
   * Archive or un-archive the topic. Wrapper for {@link Tinode#setMeta}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} arch - true to archive the topic, false otherwise.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  archive: function(arch) {
    if (this.private && this.private.arch == arch) {
      return Promise.resolve(arch);
    }
    return this.setMeta({
      desc: {
        private: {
          arch: arch ? true : Tinode.DEL_CHAR
        }
      }
    });
  },

  /**
   * Delete messages. Hard-deleting messages requires Owner permission.
   * Wrapper for {@link Tinode#delMessages}.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.DelRange[]} ranges - Ranges of message IDs to delete.
   * @param {boolean=} hard - Hard or soft delete
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delMessages: function(ranges, hard) {
    if (!this._subscribed) {
      return Promise.reject(new Error("Cannot delete messages in inactive topic"));
    }

    // Sort ranges in accending order by low, the descending by hi.
    ranges.sort((r1, r2) => {
      if (r1.low < r2.low) {
        return true;
      }
      if (r1.low == r2.low) {
        return !r2.hi || (r1.hi >= r2.hi);
      }
      return false;
    });

    // Remove pending messages from ranges possibly clipping some ranges.
    let tosend = ranges.reduce((out, r) => {
      if (r.low < LOCAL_SEQID) {
        if (!r.hi || r.hi < LOCAL_SEQID) {
          out.push(r);
        } else {
          // Clip hi to max allowed value.
          out.push({
            low: r.low,
            hi: this._maxSeq + 1
          });
        }
      }
      return out;
    }, []);

    // Send {del} message, return promise
    let result;
    if (tosend.length > 0) {
      result = this._tinode.delMessages(this.name, tosend, hard);
    } else {
      result = Promise.resolve({
        params: {
          del: 0
        }
      });
    }
    // Update local cache.
    return result.then((ctrl) => {
      if (ctrl.params.del > this._maxDel) {
        this._maxDel = ctrl.params.del;
      }

      ranges.map((r) => {
        if (r.hi) {
          this.flushMessageRange(r.low, r.hi);
        } else {
          this.flushMessage(r.low);
        }
      });

      this._updateDeletedRanges();

      if (this.onData) {
        // Calling with no parameters to indicate the messages were deleted.
        this.onData();
      }
      return ctrl;
    });
  },

  /**
   * Delete all messages. Hard-deleting messages requires Owner permission.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} hardDel - true if messages should be hard-deleted.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delMessagesAll: function(hardDel) {
    if (!this._maxSeq || this._maxSeq <= 0) {
      // There are no messages to delete.
      return Promise.resolve();
    }
    return this.delMessages([{
      low: 1,
      hi: this._maxSeq + 1,
      _all: true
    }], hardDel);
  },

  /**
   * Delete multiple messages defined by their IDs. Hard-deleting messages requires Owner permission.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.DelRange[]} list - list of seq IDs to delete
   * @param {boolean=} hardDel - true if messages should be hard-deleted.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delMessagesList: function(list, hardDel) {
    // Sort the list in ascending order
    list.sort((a, b) => a - b);
    // Convert the array of IDs to ranges.
    let ranges = list.reduce((out, id) => {
      if (out.length == 0) {
        // First element.
        out.push({
          low: id
        });
      } else {
        let prev = out[out.length - 1];
        if ((!prev.hi && (id != prev.low + 1)) || (id > prev.hi)) {
          // New range.
          out.push({
            low: id
          });
        } else {
          // Expand existing range.
          prev.hi = prev.hi ? Math.max(prev.hi, id + 1) : id + 1;
        }
      }
      return out;
    }, []);
    // Send {del} message, return promise
    return this.delMessages(ranges, hardDel)
  },

  /**
   * Delete topic. Requires Owner permission. Wrapper for {@link Tinode#delTopic}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} hard - had-delete topic.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  delTopic: function(hard) {
    return this._tinode.delTopic(this.name, hard).then((ctrl) => {
      this._resetSub();
      this._gone();
      return ctrl;
    });
  },

  /**
   * Delete subscription. Requires Share permission. Wrapper for {@link Tinode#delSubscription}.
   * @memberof Tinode.Topic#
   *
   * @param {string} user - ID of the user to remove subscription for.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delSubscription: function(user) {
    if (!this._subscribed) {
      return Promise.reject(new Error("Cannot delete subscription in inactive topic"));
    }
    // Send {del} message, return promise
    return this._tinode.delSubscription(this.name, user).then((ctrl) => {
      // Remove the object from the subscription cache;
      delete this._users[user];
      // Notify listeners
      if (this.onSubsUpdated) {
        this.onSubsUpdated(Object.keys(this._users));
      }
      return ctrl;
    });
  },

  /**
   * Send a read/recv notification.
   * @memberof Tinode.Topic#
   *
   * @param {string} what - what notification to send: <code>recv</code>, <code>read</code>.
   * @param {number} seq - ID or the message read or received.
   */
  note: function(what, seq) {
    if (!this._subscribed) {
      // Cannot sending {note} on an inactive topic".
      return;
    }

    // Update local cache with the new count.
    const user = this._users[this._tinode.getCurrentUserID()];
    let update = false;
    if (user) {
      // Self-subscription is found.
      if (!user[what] || user[what] < seq) {
        user[what] = seq;
        update = true;
      }
    } else {
      // Self-subscription is not found.
      update = (this[what] | 0) < seq;
    }

    if (update) {
      // Send notification to the server.
      this._tinode.note(this.name, what, seq);
      // Update locally cached contact with the new count.
      this._updateReadRecv(what, seq);

      const me = this._tinode.getMeTopic();
      if (this.acs != null && !this.acs.isMuted()) {
        // Sent a notification to 'me' listeners.
        me.this._refreshContact(what, this);
      }
    }
  },

  /**
   * Send a 'recv' receipt. Wrapper for {@link Tinode#noteRecv}.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - ID of the message to aknowledge.
   */
  noteRecv: function(seq) {
    this.note('recv', seq);
  },

  /**
   * Send a 'read' receipt. Wrapper for {@link Tinode#noteRead}.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - ID of the message to aknowledge or 0/undefined to acknowledge the latest messages.
   */
  noteRead: function(seq) {
    seq = seq || this._maxSeq;
    if (seq > 0) {
      this.note('read', seq);
    }
  },

  /**
   * Send a key-press notification. Wrapper for {@link Tinode#noteKeyPress}.
   * @memberof Tinode.Topic#
   */
  noteKeyPress: function() {
    if (this._subscribed) {
      this._tinode.noteKeyPress(this.name);
    } else {
      this._tinode.logger("INFO: Cannot send notification in inactive topic");
    }
  },

  // Update cached read/recv/unread counts.
  _updateReadRecv: function(what, seq, ts) {
    let oldVal, doUpdate = false;

    seq = seq | 0;
    this.seq = this.seq | 0;
    this.read = this.read | 0;
    this.recv = this.recv | 0;
    switch (what) {
      case 'recv':
        oldVal = this.recv;
        this.recv = Math.max(this.recv, seq);
        doUpdate = (oldVal != this.recv);
        break;
      case 'read':
        oldVal = this.read;
        this.read = Math.max(this.read, seq);
        doUpdate = (oldVal != this.read);
        break;
      case 'msg':
        oldVal = this.seq;
        this.seq = Math.max(this.seq, seq);
        if (!this.touched || this.touched < ts) {
          this.touched = ts;
        }
        doUpdate = (oldVal != this.seq);
        break;
    }

    // Sanity checks.
    if (this.recv < this.read) {
      this.recv = this.read;
      doUpdate = true;
    }
    if (this.seq < this.recv) {
      this.seq = this.recv;
      if (!this.touched || this.touched < ts) {
        this.touched = ts;
      }
      doUpdate = true;
    }
    this.unread = this.seq - this.read;
    return doUpdate;
  },

  /**
   * Get user description from global cache. The user does not need to be a
   * subscriber of this topic.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - ID of the user to fetch.
   * @return {Object} user description or undefined.
   */
  userDesc: function(uid) {
    // TODO(gene): handle asynchronous requests

    const user = this._cacheGetUser(uid);
    if (user) {
      return user; // Promise.resolve(user)
    }
  },

  /**
   * Get description of the p2p peer from subscription cache.
   * @memberof Tinode.Topic#
   *
   * @return {Object} peer's description or undefined.
   */
  p2pPeerDesc: function() {
    if (!this.isP2PType()) {
      return undefined;
    }
    return this._users[this.name];
  },

  /**
   * Iterate over cached subscribers. If callback is undefined, use this.onMetaSub.
   * @memberof Tinode.Topic#
   *
   * @param {function} callback - Callback which will receive subscribers one by one.
   * @param {Object=} context - Value of `this` inside the `callback`.
   */
  subscribers: function(callback, context) {
    const cb = (callback || this.onMetaSub);
    if (cb) {
      for (let idx in this._users) {
        cb.call(context, this._users[idx], idx, this._users);
      }
    }
  },

  /**
   * Get a copy of cached tags.
   * @memberof Tinode.Topic#
   *
   * @return {Array.<string>} a copy of tags
   */
  tags: function() {
    // Return a copy.
    return this._tags.slice(0);
  },

  /**
   * Get cached subscription for the given user ID.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - id of the user to query for
   * @return user description or undefined.
   */
  subscriber: function(uid) {
    return this._users[uid];
  },

  /**
   * Iterate over cached messages. If callback is undefined, use this.onData.
   * @memberof Tinode.Topic#
   *
   * @param {function} callback - Callback which will receive messages one by one. See {@link Tinode.CBuffer#forEach}
   * @param {number} sinceId - Optional seqId to start iterating from (inclusive).
   * @param {number} beforeId - Optional seqId to stop iterating before (exclusive).
   * @param {Object} context - Value of `this` inside the `callback`.
   */
  messages: function(callback, sinceId, beforeId, context) {
    const cb = (callback || this.onData);
    if (cb) {
      let startIdx = typeof sinceId == 'number' ? this._messages.find({
        seq: sinceId
      }, true) : undefined;
      let beforeIdx = typeof beforeId == 'number' ? this._messages.find({
        seq: beforeId
      }, true) : undefined;
      if (startIdx != -1 && beforeIdx != -1) {
        this._messages.forEach(cb, startIdx, beforeIdx, context);
      }
    }
  },

  /**
   * Get the most recent message from cache.
   * @memberof Tinode.Topic#
   *
   * @returns {Object} the most recent cached message or <code>undefined</code>, if no messages are cached.
   */
  latestMessage: function() {
    return this._messages.getLast();
  },

  /**
   * Iterate over cached unsent messages. Wraps {@link Tinode.Topic#messages}.
   * @memberof Tinode.Topic#
   *
   * @param {function} callback - Callback which will receive messages one by one. See {@link Tinode.CBuffer#forEach}
   * @param {Object} context - Value of <code>this</code> inside the <code>callback</code>.
   */
  queuedMessages: function(callback, context) {
    if (!callback) {
      throw new Error("Callback must be provided");
    }
    this.messages(callback, LOCAL_SEQID, undefined, context);
  },

  /**
   * Get the number of topic subscribers who marked this message as either recv or read
   * Current user is excluded from the count.
   * @memberof Tinode.Topic#
   *
   * @param {string} what - what action to consider: received <code>"recv"</code> or read <code>"read"</code>.
   * @param {number} seq - ID or the message read or received.
   *
   * @returns {number} the number of subscribers who marked the message with the given ID as read or received.
   */
  msgReceiptCount: function(what, seq) {
    let count = 0;
    if (seq > 0) {
      const me = this._tinode.getCurrentUserID();
      for (let idx in this._users) {
        const user = this._users[idx];
        if (user.user !== me && user[what] >= seq) {
          count++;
        }
      }
    }
    return count;
  },

  /**
   * Get the number of topic subscribers who marked this message (and all older messages) as read.
   * The current user is excluded from the count.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - message id to check.
   * @returns {number} number of subscribers who claim to have received the message.
   */
  msgReadCount: function(seq) {
    return this.msgReceiptCount('read', seq);
  },

  /**
   * Get the number of topic subscribers who marked this message (and all older messages) as received.
   * The current user is excluded from the count.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - Message id to check.
   * @returns {number} Number of subscribers who claim to have received the message.
   */
  msgRecvCount: function(seq) {
    return this.msgReceiptCount('recv', seq);
  },

  /**
   * Check if cached message IDs indicate that the server may have more messages.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} newer - if <code>true</code>, check for newer messages only.
   */
  msgHasMoreMessages: function(newer) {
    return newer ? this.seq > this._maxSeq :
      // _minSeq could be more than 1, but earlier messages could have been deleted.
      (this._minSeq > 1 && !this._noEarlierMsgs);
  },

  /**
   * Check if the given seq Id is id of the most recent message.
   * @memberof Tinode.Topic#
   *
   * @param {number} seqId id of the message to check
   */
  isNewMessage: function(seqId) {
    return this._maxSeq <= seqId;
  },

  /**
   * Remove one message from local cache.
   * @memberof Tinode.Topic#
   *
   * @param {number} seqId id of the message to remove from cache.
   * @returns {Message} removed message or undefined if such message was not found.
   */
  flushMessage: function(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });
    if (idx >= 0) {
      this._tinode._db.remMessages(this.name, seqId);
      return this._messages.delAt(idx);
    }
    return undefined;
  },

  /**
   * Update message's seqId.
   * @memberof Tinode.Topic#
   *
   * @param {Object} pub message object.
   * @param {number} newSeqId new seq id for pub.
   */
  swapMessageId: function(pub, newSeqId) {
    const idx = this._messages.find(pub);
    const numMessages = this._messages.length();
    if (0 <= idx && idx < numMessages) {
      // Remove message with the old seq ID.
      this._messages.delAt(idx);
      this._tinode._db.remMessages(this.name, pub.seq);
      // Add message with the new seq ID.
      pub.seq = newSeqId;
      this._messages.put(pub);
      this._tinode._db.addMessage(pub);
    }
  },

  /**
   * Remove a range of messages from the local cache.
   * @memberof Tinode.Topic#
   *
   * @param {number} fromId seq ID of the first message to remove (inclusive).
   * @param {number} untilId seqID of the last message to remove (exclusive).
   *
   * @returns {Message[]} array of removed messages (could be empty).
   */
  flushMessageRange: function(fromId, untilId) {
    // Remove range from persistent cache.
    this._tinode._db.remMessages(this.name, fromId, untilId);
    // start, end: find insertion points (nearest == true).
    const since = this._messages.find({
      seq: fromId
    }, true);
    return since >= 0 ? this._messages.delRange(since, this._messages.find({
      seq: untilId
    }, true)) : [];
  },

  /**
   * Attempt to stop message from being sent.
   * @memberof Tinode.Topic#
   *
   * @param {number} seqId id of the message to stop sending and remove from cache.
   *
   * @returns {boolean} <code>true</code> if message was cancelled, <code>false</code> otherwise.
   */
  cancelSend: function(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });
    if (idx >= 0) {
      const msg = this._messages.getAt(idx);
      const status = this.msgStatus(msg);
      if (status == MESSAGE_STATUS_QUEUED || status == MESSAGE_STATUS_FAILED) {
        this._tinode._db.remMessages(this.name, seqId);
        msg._cancelled = true;
        this._messages.delAt(idx);
        if (this.onData) {
          // Calling with no parameters to indicate the message was deleted.
          this.onData();
        }
        return true;
      }
    }
    return false;
  },

  /**
   * Get type of the topic: me, p2p, grp, fnd...
   * @memberof Tinode.Topic#
   *
   * @returns {string} One of 'me', 'p2p', 'grp', 'fnd', 'sys' or <code>undefined</code>.
   */
  getType: function() {
    return Tinode.topicType(this.name);
  },

  /**
   * Get current user's access mode of the topic.
   * @memberof Tinode.Topic#
   *
   * @returns {Tinode.AccessMode} - user's access mode
   */
  getAccessMode: function() {
    return this.acs;
  },

  /**
   * Set current user's access mode of the topic.
   * @memberof Tinode.Topic#
   *
   * @param {AccessMode | Object} acs - access mode to set.
   */
  setAccessMode: function(acs) {
    return this.acs = new AccessMode(acs);
  },

  /**
   * Get topic's default access mode.
   * @memberof Tinode.Topic#
   *
   * @returns {Tinode.DefAcs} - access mode, such as {auth: `RWP`, anon: `N`}.
   */
  getDefaultAccess: function() {
    return this.defacs;
  },

  /**
   * Initialize new meta {@link Tinode.GetQuery} builder. The query is attched to the current topic.
   * It will not work correctly if used with a different topic.
   * @memberof Tinode.Topic#
   *
   * @returns {Tinode.MetaGetBuilder} query attached to the current topic.
   */
  startMetaQuery: function() {
    return new MetaGetBuilder(this);
  },

  /**
   * Check if topic is archived, i.e. private.arch == true.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is archived, <code>false</code> otherwise.
   */
  isArchived: function() {
    return this.private && this.private.arch ? true : false;
  },

  /**
   * Check if topic is a 'me' topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a 'me' topic, <code>false</code> otherwise.
   */
  isMeType: function() {
    return Tinode.isMeTopicName(this.name);
  },

  /**
   * Check if topic is a channel.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a channel, <code>false</code> otherwise.
   */
  isChannelType: function() {
    return Tinode.isChannelTopicName(this.name);
  },

  /**
   * Check if topic is a group topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a group, <code>false</code> otherwise.
   */
  isGroupType: function() {
    return Tinode.isGroupTopicName(this.name);
  },

  /**
   * Check if topic is a p2p topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a p2p topic, <code>false</code> otherwise.
   */
  isP2PType: function() {
    return Tinode.isP2PTopicName(this.name);
  },

  /**
   * Check if topic is a communication topic, i.e. a group or p2p topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a p2p or group topic, <code>false</code> otherwise.
   */
  isCommType: function() {
    return Tinode.isCommTopicName(this.name);
  },

  /**
   * Get status (queued, sent, received etc) of a given message in the context
   * of this topic.
   * @memberof Tinode.Topic#
   *
   * @param {Message} msg - message to check for status.
   * @param {boolean} upd - update chached message status.
   *
   * @returns message status constant.
   */
  msgStatus: function(msg, upd) {
    let status = MESSAGE_STATUS_NONE;
    if (this._tinode.isMe(msg.from)) {
      if (msg._sending) {
        status = MESSAGE_STATUS_SENDING;
      } else if (msg._failed || msg._cancelled) {
        status = MESSAGE_STATUS_FAILED;
      } else if (msg.seq >= LOCAL_SEQID) {
        status = MESSAGE_STATUS_QUEUED;
      } else if (this.msgReadCount(msg.seq) > 0) {
        status = MESSAGE_STATUS_READ;
      } else if (this.msgRecvCount(msg.seq) > 0) {
        status = MESSAGE_STATUS_RECEIVED;
      } else if (msg.seq > 0) {
        status = MESSAGE_STATUS_SENT;
      }
    } else {
      status = MESSAGE_STATUS_TO_ME;
    }

    if (upd && msg._status != status) {
      msg._status = status;
      this._tinode._db.updMessageStatus(this.name, msg.seq, status);
    }

    return status;
  },

  // Process data message
  _routeData: function(data) {
    if (data.content) {
      if (!this.touched || this.touched < data.ts) {
        this.touched = data.ts;
      }
    }

    if (data.seq > this._maxSeq) {
      this._maxSeq = data.seq;
    }
    if (data.seq < this._minSeq || this._minSeq == 0) {
      this._minSeq = data.seq;
    }

    if (!data._noForwarding) {
      this._messages.put(data);
      this._tinode._db.addMessage(data);
      this._updateDeletedRanges();
    }

    if (this.onData) {
      this.onData(data);
    }

    // Update locally cached contact with the new message count.
    const what = ((!this.isChannelType() && !data.from) || this._tinode.isMe(data.from)) ? 'read' : 'msg';
    const updated = this._updateReadRecv(what, data.seq, data.ts);
    const me = this._tinode.getMeTopic();
    if (updated) {
      // Notify 'me' listeners of the change.
      me._refreshContact(what, this);
    }
  },

  // Process metadata message
  _routeMeta: function(meta) {
    if (meta.desc) {
      this._lastDescUpdate = meta.ts;
      this._processMetaDesc(meta.desc);
    }
    if (meta.sub && meta.sub.length > 0) {
      this._lastSubsUpdate = meta.ts;
      this._processMetaSub(meta.sub);
    }
    if (meta.del) {
      this._processDelMessages(meta.del.clear, meta.del.delseq);
    }
    if (meta.tags) {
      this._processMetaTags(meta.tags);
    }
    if (meta.cred) {
      this._processMetaCreds(meta.cred);
    }
    if (this.onMeta) {
      this.onMeta(meta);
    }
  },

  // Process presence change message
  _routePres: function(pres) {
    let user;
    switch (pres.what) {
      case 'del':
        // Delete cached messages.
        this._processDelMessages(pres.clear, pres.delseq);
        break;
      case 'on':
      case 'off':
        // Update online status of a subscription.
        user = this._users[pres.src];
        if (user) {
          user.online = pres.what == 'on';
        } else {
          this._tinode.logger("WARNING: Presence update for an unknown user", this.name, pres.src);
        }
        break;
      case 'term':
        // Attachment to topic is terminated probably due to cluster rehashing.
        this._resetSub();
        break;
      case 'acs':
        const uid = pres.src || this._tinode.getCurrentUserID();
        user = this._users[uid];
        if (!user) {
          // Update for an unknown user: notification of a new subscription.
          const acs = new AccessMode().updateAll(pres.dacs);
          if (acs && acs.mode != AccessMode._NONE) {
            user = this._cacheGetUser(uid);
            if (!user) {
              user = {
                user: uid,
                acs: acs
              };
              this.getMeta(this.startMetaQuery().withOneSub(undefined, uid).build());
            } else {
              user.acs = acs;
            }
            user.updated = new Date();
            this._processMetaSub([user]);
          }
        } else {
          // Known user
          user.acs.updateAll(pres.dacs);
          // Update user's access mode.
          this._processMetaSub([{
            user: uid,
            updated: new Date(),
            acs: user.acs
          }]);
        }
        break;
      default:
        this._tinode.logger("INFO: Ignored presence update", pres.what);
    }

    if (this.onPres) {
      this.onPres(pres);
    }
  },

  // Process {info} message
  _routeInfo: function(info) {
    if (info.what !== 'kp') {
      const user = this._users[info.from];
      if (user) {
        user[info.what] = info.seq;
        if (user.recv < user.read) {
          user.recv = user.read;
        }
      }
      const msg = this.latestMessage();
      this.msgStatus(msg, true);

      // If this is an update from the current user, update the cache with the new count.
      if (this._tinode.isMe(info.from)) {
        this._updateReadRecv(info.what, info.seq);
      }

      // Notify 'me' listener of the status change.
      this._tinode.getMeTopic()._refreshContact(info.what, this);
    }
    if (this.onInfo) {
      this.onInfo(info);
    }
  },

  // Called by Tinode when meta.desc packet is received.
  // Called by 'me' topic on contact update (desc._noForwarding is true).
  _processMetaDesc: function(desc) {
    if (this.isP2PType()) {
      // Synthetic desc may include defacs for p2p topics which is useless.
      // Remove it.
      delete desc.defacs;

      // Update to p2p desc is the same as user update. Update cached user.
      this._tinode._db.updUser(this.name, desc.public);
    }

    // Copy parameters from desc object to this topic.
    mergeObj(this, desc);
    // Make sure date fields are Date().
    stringToDate(this);
    // Update persistent cache.
    this._tinode._db.updTopic(this);

    // Notify 'me' listener, if available:
    if (this.name !== TOPIC_ME && !desc._noForwarding) {
      const me = this._tinode.getMeTopic();
      if (me.onMetaSub) {
        me.onMetaSub(this);
      }
      if (me.onSubsUpdated) {
        me.onSubsUpdated([this.name], 1);
      }
    }

    if (this.onMetaDesc) {
      this.onMetaDesc(this);
    }
  },

  // Called by Tinode when meta.sub is recived or in response to received
  // {ctrl} after setMeta-sub.
  _processMetaSub: function(subs) {
    for (let idx in subs) {
      const sub = subs[idx];

      sub.updated = new Date(sub.updated);
      sub.deleted = sub.deleted ? new Date(sub.deleted) : null;

      let user = null;
      if (!sub.deleted) {
        // If this is a change to user's own permissions, update them in topic too.
        // Desc will update 'me' topic.
        if (this._tinode.isMe(sub.user) && sub.acs) {
          this._processMetaDesc({
            updated: sub.updated || new Date(),
            touched: sub.updated,
            acs: sub.acs
          });
        }
        user = this._updateCachedUser(sub.user, sub);
      } else {
        // Subscription is deleted, remove it from topic (but leave in Users cache)
        delete this._users[sub.user];
        user = sub;
      }

      if (this.onMetaSub) {
        this.onMetaSub(user);
      }
    }

    if (this.onSubsUpdated) {
      this.onSubsUpdated(Object.keys(this._users));
    }
  },

  // Called by Tinode when meta.tags is recived.
  _processMetaTags: function(tags) {
    if (tags.length == 1 && tags[0] == Tinode.DEL_CHAR) {
      tags = [];
    }
    this._tags = tags;
    if (this.onTagsUpdated) {
      this.onTagsUpdated(tags);
    }
  },

  // Do nothing for topics other than 'me'
  _processMetaCreds: function(creds) {},

  // Delete cached messages and update cached transaction IDs
  _processDelMessages: function(clear, delseq) {
    this._maxDel = Math.max(clear, this._maxDel);
    this.clear = Math.max(clear, this.clear);
    const topic = this;
    let count = 0;
    if (Array.isArray(delseq)) {
      delseq.map(function(range) {
        if (!range.hi) {
          count++;
          topic.flushMessage(range.low);
        } else {
          for (let i = range.low; i < range.hi; i++) {
            count++;
            topic.flushMessage(i);
          }
        }
      });
    }

    if (count > 0) {
      this._updateDeletedRanges();

      if (this.onData) {
        this.onData();
      }
    }
  },

  // Topic is informed that the entire response to {get what=data} has been received.
  _allMessagesReceived: function(count) {
    this._updateDeletedRanges();

    if (this.onAllMessagesReceived) {
      this.onAllMessagesReceived(count);
    }
  },

  // Reset subscribed state
  _resetSub: function() {
    this._subscribed = false;
  },

  // This topic is either deleted or unsubscribed from.
  _gone: function() {
    this._messages.reset();
    this._tinode._db.remMessages(this.name);
    this._users = {};
    this.acs = new AccessMode(null);
    this.private = null;
    this.public = null;
    this._maxSeq = 0;
    this._minSeq = 0;
    this._subscribed = false;

    const me = this._tinode.getMeTopic();
    if (me) {
      me._routePres({
        _noForwarding: true,
        what: 'gone',
        topic: TOPIC_ME,
        src: this.name
      });
    }
    if (this.onDeleteTopic) {
      this.onDeleteTopic();
    }
  },

  // Update global user cache and local subscribers cache.
  // Don't call this method for non-subscribers.
  _updateCachedUser: function(uid, obj) {
    // Fetch user object from the global cache.
    // This is a clone of the stored object
    let cached = this._cacheGetUser(uid);
    cached = mergeObj(cached || {}, obj);
    // Save to global cache
    this._cachePutUser(uid, cached);
    // Save to the list of topic subsribers.
    return mergeToCache(this._users, uid, cached);
  },

  // Get local seqId for a queued message.
  _getQueuedSeqId: function() {
    return this._queuedSeqId++;
  },

  // Calculate ranges of missing messages.
  _updateDeletedRanges: function() {
    const ranges = [];

    let prev = null;
    // Check for gap in the beginning, before the first message.
    const first = this._messages.getAt(0);
    if (first && this._minSeq > 1 && !this._noEarlierMsgs) {
      // Some messages are missing in the beginning.
      if (first.hi) {
        // The first message already represents a gap.
        if (first.seq > 1) {
          first.seq = 1;
        }
        if (first.hi < this._minSeq - 1) {
          first.hi = this._minSeq - 1;
        }
        prev = first;
      } else {
        // Create new gap.
        prev = {
          seq: 1,
          hi: this._minSeq - 1
        };
        ranges.push(prev);
      }
    } else {
      // No gap in the beginning.
      prev = {
        seq: 0,
        hi: 0
      };
    }

    // Find gaps in the list of received messages. The list contains messages-proper as well
    // as placeholers for deleted ranges.
    // The messages are iterated by seq ID in ascending order.
    this._messages.forEach((data) => {
      // Do not create a gap between the last sent message and the first unsent.
      if (data.seq >= LOCAL_SEQID) {
        return;
      }

      // New message is reducing the existing gap
      if (data.seq == (prev.hi || prev.seq) + 1) {
        // No new gap. Replace previous with current.
        prev = data;
        return;
      }

      // Found a new gap.
      if (prev.hi) {
        // Previous is also a gap, alter it.
        prev.hi = data.hi || data.seq;
        return;
      }

      // Previous is not a gap. Create a new gap.
      prev = {
        seq: (prev.hi || prev.seq) + 1,
        hi: data.hi || data.seq
      };
      ranges.push(prev);
    });

    // Check for missing messages at the end.
    // All messages could be missing or it could be a new topic with no messages.
    const last = this._messages.getLast();
    const maxSeq = Math.max(this.seq, this._maxSeq) || 0;
    if ((maxSeq > 0 && !last) || (last && ((last.hi || last.seq) < maxSeq))) {
      if (last && last.hi) {
        // Extend existing gap
        last.hi = maxSeq;
      } else {
        // Create new gap.
        ranges.push({
          seq: last ? last.seq + 1 : 1,
          hi: maxSeq
        });
      }
    }

    // Insert new gaps into cache.
    ranges.map((gap) => {
      this._messages.put(gap);
    });
  },

  // Load most recent messages from persistent cache.
  _loadMessages: function(db) {
    return db.readMessages(this.name, {
        limit: DEFAULT_MESSAGES_PAGE
      })
      .then((msgs) => {
        msgs.forEach((data) => {
          if (data.seq > this._maxSeq) {
            this._maxSeq = data.seq;
          }
          if (data.seq < this._minSeq || this._minSeq == 0) {
            this._minSeq = data.seq;
          }
          this._messages.put(data);
        });

        this._updateDeletedRanges();
        return this.name;
      });
  }
};

/**
 * @class TopicMe - special case of {@link Tinode.Topic} for
 * managing data of the current user, including contact list.
 * @extends Tinode.Topic
 * @memberof Tinode
 *
 * @param {TopicMe.Callbacks} callbacks - Callbacks to receive various events.
 */
var TopicMe = function(callbacks) {
  Topic.call(this, TOPIC_ME, callbacks);

  // me-specific callbacks
  if (callbacks) {
    this.onContactUpdate = callbacks.onContactUpdate;
  }
};

// Inherit everyting from the generic Topic
TopicMe.prototype = Object.create(Topic.prototype, {
  // Override the original Topic._processMetaDesc.
  _processMetaDesc: {
    value: function(desc) {
      // Check if online contacts need to be turned off because P permission was removed.
      const turnOff = (desc.acs && !desc.acs.isPresencer()) && (this.acs && this.acs.isPresencer());

      // Copy parameters from desc object to this topic.
      mergeObj(this, desc);
      this._tinode._db.updTopic(this);

      // String datetime headers to Date() objects.
      stringToDate(this);

      // 'P' permission was removed. All topics are offline now.
      if (turnOff) {
        this._tinode.cacheMap('topic', (cont) => {
          if (cont.online) {
            cont.online = false;
            if (cont.seen) {
              cont.seen.when = new Date();
            } else {
              cont.seen = {
                when: new Date()
              };
            }
            this._refreshContact('off', cont);
          }
        });
      }

      if (this.onMetaDesc) {
        this.onMetaDesc(this);
      }
    },
    enumerable: true,
    configurable: true
  },

  // Override the original Topic._processMetaSub
  _processMetaSub: {
    value: function(subs) {
      let updateCount = 0;
      subs.forEach((sub) => {
        const topicName = sub.topic;
        // Don't show 'me' and 'fnd' topics in the list of contacts.
        if (topicName == TOPIC_FND || topicName == TOPIC_ME) {
          return;
        }
        sub.updated = new Date(sub.updated);
        sub.touched = sub.touched ? new Date(sub.touched) : undefined;
        sub.deleted = sub.deleted ? new Date(sub.deleted) : null;

        let cont = null;
        if (sub.deleted) {
          cont = sub;
          this._tinode.cacheDel('topic', topicName);
          this._tinode._db.remTopic(topicName);
        } else {
          // Ensure the values are defined and are integers.
          if (typeof sub.seq != 'undefined') {
            sub.seq = sub.seq | 0;
            sub.recv = sub.recv | 0;
            sub.read = sub.read | 0;
            sub.unread = sub.seq - sub.read;
          }

          if (sub.seen && sub.seen.when) {
            sub.seen.when = new Date(sub.seen.when);
          }

          cont = mergeObj(this._tinode.getTopic(topicName), sub);
          this._tinode._db.updTopic(cont);

          if (Tinode.isP2PTopicName(topicName)) {
            this._cachePutUser(topicName, cont);
            this._tinode._db.updUser(topicName, cont.public);
          }
          // Notify topic of the update if it's an external update.
          if (!sub._noForwarding) {
            const topic = this._tinode.getTopic(topicName);
            if (topic) {
              sub._noForwarding = true;
              topic._processMetaDesc(sub);
            }
          }
        }

        updateCount++;

        if (this.onMetaSub) {
          this.onMetaSub(cont);
        }
      });

      if (this.onSubsUpdated && updateCount > 0) {
        const keys = [];
        subs.forEach((s) => {
          keys.push(s.topic);
        });
        this.onSubsUpdated(keys, updateCount);
      }
    },
    enumerable: true,
    configurable: true
  },

  // Called by Tinode when meta.sub is recived.
  _processMetaCreds: {
    value: function(creds, upd) {
      if (creds.length == 1 && creds[0] == Tinode.DEL_CHAR) {
        creds = [];
      }
      if (upd) {
        creds.map((cr) => {
          if (cr.val) {
            // Adding a credential.
            let idx = this._credentials.findIndex((el) => {
              return el.meth == cr.meth && el.val == cr.val;
            });
            if (idx < 0) {
              // Not found.
              if (!cr.done) {
                // Unconfirmed credential replaces previous unconfirmed credential of the same method.
                idx = this._credentials.findIndex((el) => {
                  return el.meth == cr.meth && !el.done;
                });
                if (idx >= 0) {
                  // Remove previous unconfirmed credential.
                  this._credentials.splice(idx, 1);
                }
              }
              this._credentials.push(cr);
            } else {
              // Found. Maybe change 'done' status.
              this._credentials[idx].done = cr.done;
            }
          } else if (cr.resp) {
            // Handle credential confirmation.
            const idx = this._credentials.findIndex((el) => {
              return el.meth == cr.meth && !el.done;
            });
            if (idx >= 0) {
              this._credentials[idx].done = true;
            }
          }
        });
      } else {
        this._credentials = creds;
      }
      if (this.onCredsUpdated) {
        this.onCredsUpdated(this._credentials);
      }
    },
    enumerable: true,
    configurable: true
  },

  // Process presence change message
  _routePres: {
    value: function(pres) {
      if (pres.what == 'term') {
        // The 'me' topic itself is detached. Mark as unsubscribed.
        this._resetSub();
        return;
      }

      if (pres.what == 'upd' && pres.src == TOPIC_ME) {
        // Update to me's description. Request updated value.
        this.getMeta(this.startMetaQuery().withDesc().build());
        return;
      }

      const cont = this._tinode.cacheGet('topic', pres.src);
      if (cont) {
        switch (pres.what) {
          case 'on': // topic came online
            cont.online = true;
            break;
          case 'off': // topic went offline
            if (cont.online) {
              cont.online = false;
              if (cont.seen) {
                cont.seen.when = new Date();
              } else {
                cont.seen = {
                  when: new Date()
                };
              }
            }
            break;
          case 'msg': // new message received
            cont.touched = new Date();
            cont.seq = pres.seq | 0;
            // Check if message is sent by the current user. If so it's been read already.
            if (!pres.act || this._tinode.isMe(pres.act)) {
              cont.read = cont.read ? Math.max(cont.read, cont.seq) : cont.seq;
              cont.recv = cont.recv ? Math.max(cont.read, cont.recv) : cont.read;
            }
            cont.unread = cont.seq - (cont.read | 0);
            break;
          case 'upd': // desc updated
            // Request updated subscription.
            this.getMeta(this.startMetaQuery().withLaterOneSub(pres.src).build());
            break;
          case 'acs': // access mode changed
            if (cont.acs) {
              cont.acs.updateAll(pres.dacs);
            } else {
              cont.acs = new AccessMode().updateAll(pres.dacs);
            }
            cont.touched = new Date();
            break;
          case 'ua':
            // user agent changed.
            cont.seen = {
              when: new Date(),
              ua: pres.ua
            };
            break;
          case 'recv':
            // user's other session marked some messges as received.
            pres.seq = pres.seq | 0;
            cont.recv = cont.recv ? Math.max(cont.recv, pres.seq) : pres.seq;
            break;
          case 'read':
            // user's other session marked some messages as read.
            pres.seq = pres.seq | 0;
            cont.read = cont.read ? Math.max(cont.read, pres.seq) : pres.seq;
            cont.recv = cont.recv ? Math.max(cont.read, cont.recv) : cont.recv;
            cont.unread = cont.seq - cont.read;
            break;
          case 'gone':
            // topic deleted or unsubscribed from.
            this._tinode.cacheDel('topic', pres.src);
            this._tinode._db.remTopic(pres.src);
            break;
          case 'del':
            // Update topic.del value.
            break;
          default:
            this._tinode.logger("INFO: Unsupported presence update in 'me'", pres.what);
        }

        this._refreshContact(pres.what, cont);
      } else {
        if (pres.what == 'acs') {
          // New subscriptions and deleted/banned subscriptions have full
          // access mode (no + or - in the dacs string). Changes to known subscriptions are sent as
          // deltas, but they should not happen here.
          const acs = new AccessMode(pres.dacs);
          if (!acs || acs.mode == AccessMode._INVALID) {
            this._tinode.logger("ERROR: Invalid access mode update", pres.src, pres.dacs);
            return;
          } else if (acs.mode == AccessMode._NONE) {
            this._tinode.logger("WARNING: Removing non-existent subscription", pres.src, pres.dacs);
            return;
          } else {
            // New subscription. Send request for the full description.
            // Using .withOneSub (not .withLaterOneSub) to make sure IfModifiedSince is not set.
            this.getMeta(this.startMetaQuery().withOneSub(undefined, pres.src).build());
            // Create a dummy entry to catch online status update.
            const dummy = this._tinode.getTopic(pres.src);
            dummy.touched = new Date();
            dummy.topic = pres.src;
            dummy.online = false;
            dummy.acs = acs;
            this._tinode.attachCacheToTopic(dummy);
            dummy._cachePutSelf();
            this._db.updTopic(dummy);
          }
        } else if (pres.what == 'tags') {
          this.getMeta(this.startMetaQuery().withTags().build());
        }
      }

      if (this.onPres) {
        this.onPres(pres);
      }
    },
    enumerable: true,
    configurable: true
  },

  // Contact is updated, execute callbacks.
  _refreshContact: {
    value: function(what, cont) {
      if (this.onContactUpdate) {
        this.onContactUpdate(what, cont);
      }
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Publishing to TopicMe is not supported. {@link Topic#publish} is overriden and thows an {Error} if called.
   * @memberof Tinode.TopicMe#
   * @throws {Error} Always throws an error.
   */
  publish: {
    value: function() {
      return Promise.reject(new Error("Publishing to 'me' is not supported"));
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Delete validation credential.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} topic - Name of the topic to delete
   * @param {string} user - User ID to remove.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delCredential: {
    value: function(method, value) {
      if (!this._subscribed) {
        return Promise.reject(new Error("Cannot delete credential in inactive 'me' topic"));
      }
      // Send {del} message, return promise
      return this._tinode.delCredential(method, value).then((ctrl) => {
        // Remove deleted credential from the cache.
        const index = this._credentials.findIndex((el) => {
          return el.meth == method && el.val == value;
        });
        if (index > -1) {
          this._credentials.splice(index, 1);
        }
        // Notify listeners
        if (this.onCredsUpdated) {
          this.onCredsUpdated(this._credentials);
        }
        return ctrl;
      });

    },
    enumerable: true,
    configurable: true
  },

  /**
   * @callback contactFilter
   * @param {Object} contact to check for inclusion.
   * @returns {boolean} <code>true</code> if contact should be processed, <code>false</code> to exclude it.
   */
  /**
   * Iterate over cached contacts.
   *
   * @function
   * @memberof Tinode.TopicMe#
   * @param {TopicMe.ContactCallback} callback - Callback to call for each contact.
   * @param {contactFilter=} filter - Optionally filter contacts; include all if filter is false-ish, otherwise
   *      include those for which filter returns true-ish.
   * @param {Object=} context - Context to use for calling the `callback`, i.e. the value of `this` inside the callback.
   */
  contacts: {
    value: function(callback, filter, context) {
      this._tinode.cacheMap('topic', (c, idx) => {
        if (c.isCommType() && (!filter || filter(c))) {
          callback.call(context, c, idx);
        }
      });
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Get a contact from cache.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} name - Name of the contact to get, either a UID (for p2p topics) or a topic name.
   * @returns {Tinode.Contact} - Contact or `undefined`.
   */
  getContact: {
    value: function(name) {
      return this._tinode.cacheGet('topic', name);
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Get access mode of a given contact from cache.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} name - Name of the contact to get access mode for, either a UID (for p2p topics)
   *        or a topic name; if missing, access mode for the 'me' topic itself.
   * @returns {string} - access mode, such as `RWP`.
   */
  getAccessMode: {
    value: function(name) {
      if (name) {
        const cont = this._tinode.cacheGet('topic', name);
        return cont ? cont.acs : null;
      }
      return this.acs;
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Check if contact is archived, i.e. contact.private.arch == true.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} name - Name of the contact to check archived status, either a UID (for p2p topics) or a topic name.
   * @returns {boolean} - true if contact is archived, false otherwise.
   */
  isArchived: {
    value: function(name) {
      const cont = this._tinode.cacheGet('topic', name);
      return cont ? ((cont.private && cont.private.arch) ? true : false) : null;
    },
    enumerable: true,
    configurable: true
  },

  /**
   * @typedef Tinode.Credential
   * @memberof Tinode
   * @type Object
   * @property {string} meth - validation method such as 'email' or 'tel'.
   * @property {string} val - credential value, i.e. 'jdoe@example.com' or '+17025551234'
   * @property {boolean} done - true if credential is validated.
   */
  /**
   * Get the user's credentials: email, phone, etc.
   * @memberof Tinode.TopicMe#
   *
   * @returns {Tinode.Credential[]} - array of credentials.
   */
  getCredentials: {
    value: function() {
      return this._credentials;
    },
    enumerable: true,
    configurable: true
  }
});
TopicMe.prototype.constructor = TopicMe;

/**
 * @class TopicFnd - special case of {@link Tinode.Topic} for searching for
 * contacts and group topics.
 * @extends Tinode.Topic
 * @memberof Tinode
 *
 * @param {TopicFnd.Callbacks} callbacks - Callbacks to receive various events.
 */
var TopicFnd = function(callbacks) {
  Topic.call(this, TOPIC_FND, callbacks);
  // List of users and topics uid or topic_name -> Contact object)
  this._contacts = {};
};

// Inherit everyting from the generic Topic
TopicFnd.prototype = Object.create(Topic.prototype, {
  // Override the original Topic._processMetaSub
  _processMetaSub: {
    value: function(subs) {
      let updateCount = Object.getOwnPropertyNames(this._contacts).length;
      // Reset contact list.
      this._contacts = {};
      for (let idx in subs) {
        let sub = subs[idx];
        const indexBy = sub.topic ? sub.topic : sub.user;

        sub.updated = new Date(sub.updated);
        if (sub.seen && sub.seen.when) {
          sub.seen.when = new Date(sub.seen.when);
        }

        sub = mergeToCache(this._contacts, indexBy, sub);
        updateCount++;

        if (this.onMetaSub) {
          this.onMetaSub(sub);
        }
      }

      if (updateCount > 0 && this.onSubsUpdated) {
        this.onSubsUpdated(Object.keys(this._contacts));
      }
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Publishing to TopicFnd is not supported. {@link Topic#publish} is overriden and thows an {Error} if called.
   * @memberof Tinode.TopicFnd#
   * @throws {Error} Always throws an error.
   */
  publish: {
    value: function() {
      return Promise.reject(new Error("Publishing to 'fnd' is not supported"));
    },
    enumerable: true,
    configurable: true
  },

  /**
   * setMeta to TopicFnd resets contact list in addition to sending the message.
   * @memberof Tinode.TopicFnd#
   * @param {Tinode.SetParams} params parameters to update.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  setMeta: {
    value: function(params) {
      const instance = this;
      return Object.getPrototypeOf(TopicFnd.prototype).setMeta.call(this, params).then(function() {
        if (Object.keys(instance._contacts).length > 0) {
          instance._contacts = {};
          if (instance.onSubsUpdated) {
            instance.onSubsUpdated([]);
          }
        }
      });
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Iterate over found contacts. If callback is undefined, use {@link this.onMetaSub}.
   * @function
   * @memberof Tinode.TopicFnd#
   * @param {TopicFnd.ContactCallback} callback - Callback to call for each contact.
   * @param {Object} context - Context to use for calling the `callback`, i.e. the value of `this` inside the callback.
   */
  contacts: {
    value: function(callback, context) {
      const cb = (callback || this.onMetaSub);
      if (cb) {
        for (let idx in this._contacts) {
          cb.call(context, this._contacts[idx], idx, this._contacts);
        }
      }
    },
    enumerable: true,
    configurable: true
  }
});
TopicFnd.prototype.constructor = TopicFnd;

/**
 * @class LargeFileHelper - collection of utilities for uploading and downloading files
 * out of band. Don't instantiate this class directly. Use {Tinode.getLargeFileHelper} instead.
 * @memberof Tinode
 *
 * @param {Tinode} tinode - the main Tinode object.
 */
var LargeFileHelper = function(tinode) {
  this._tinode = tinode;

  this._apiKey = tinode._apiKey;
  this._authToken = tinode.getAuthToken();
  this._msgId = tinode.getNextUniqueId();
  this.xhr = new XMLHttpRequest();

  // Promise
  this.toResolve = null;
  this.toReject = null;

  // Callbacks
  this.onProgress = null;
  this.onSuccess = null;
  this.onFailure = null;
}

LargeFileHelper.prototype = {
  /**
   * Start uploading the file to a non-default endpoint.
   *
   * @memberof Tinode.LargeFileHelper#
   *
   * @param {string} baseUrl alternative base URL of upload server.
   * @param {File|Blob} data to upload
   * @param {Callback} onProgress callback. Takes one {float} parameter 0..1
   * @param {Callback} onSuccess callback. Called when the file is successfully uploaded.
   * @param {Callback} onFailure callback. Called in case of a failure.
   *
   * @returns {Promise} resolved/rejected when the upload is completed/failed.
   */
  uploadWithBaseUrl: function(baseUrl, data, onProgress, onSuccess, onFailure) {
    if (!this._authToken) {
      throw new Error("Must authenticate first");
    }
    const instance = this;

    let url = '/v' + PROTOCOL_VERSION + '/file/u/';
    if (baseUrl) {
      if (baseUrl.indexOf('http://') == 0 || baseUrl.indexOf('https://') == 0) {
        url = baseUrl + url;
      } else {
        throw new Error(`Invalid base URL '${baseUrl}'`);
      }
    }
    this.xhr.open('POST', url, true);
    this.xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    this.xhr.setRequestHeader('X-Tinode-Auth', 'Token ' + this._authToken.token);
    const result = new Promise((resolve, reject) => {
      this.toResolve = resolve;
      this.toReject = reject;
    });

    this.onProgress = onProgress;
    this.onSuccess = onSuccess;
    this.onFailure = onFailure;

    this.xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && instance.onProgress) {
        instance.onProgress(e.loaded / e.total);
      }
    }

    this.xhr.onload = function() {
      let pkt;
      try {
        pkt = JSON.parse(this.response, jsonParseHelper);
      } catch (err) {
        instance._tinode.logger("ERROR: Invalid server response in LargeFileHelper", this.response);
        pkt = {
          ctrl: {
            code: this.status,
            text: this.statusText
          }
        };
      }

      if (this.status >= 200 && this.status < 300) {
        if (instance.toResolve) {
          instance.toResolve(pkt.ctrl.params.url);
        }
        if (instance.onSuccess) {
          instance.onSuccess(pkt.ctrl);
        }
      } else if (this.status >= 400) {
        if (instance.toReject) {
          instance.toReject(new Error(`${pkt.ctrl.text} (${pkt.ctrl.code})`));
        }
        if (instance.onFailure) {
          instance.onFailure(pkt.ctrl)
        }
      } else {
        instance._tinode.logger("ERROR: Unexpected server response status", this.status, this.response);
      }
    };

    this.xhr.onerror = function(e) {
      if (instance.toReject) {
        instance.toReject(new Error("failed"));
      }
      if (instance.onFailure) {
        instance.onFailure(null);
      }
    };

    this.xhr.onabort = function(e) {
      if (instance.toReject) {
        instance.toReject(new Error("upload cancelled by user"));
      }
      if (instance.onFailure) {
        instance.onFailure(null);
      }
    };

    try {
      const form = new FormData();
      form.append('file', data);
      form.set('id', this._msgId);
      this.xhr.send(form);
    } catch (err) {
      if (this.toReject) {
        this.toReject(err);
      }
      if (this.onFailure) {
        this.onFailure(null);
      }
    }

    return result;
  },

  /**
   * Start uploading the file to default endpoint.
   *
   * @memberof Tinode.LargeFileHelper#
   *
   * @param {File|Blob} data to upload
   * @param {Callback} onProgress callback. Takes one {float} parameter 0..1
   * @param {Callback} onSuccess callback. Called when the file is successfully uploaded.
   * @param {Callback} onFailure callback. Called in case of a failure.
   *
   * @returns {Promise} resolved/rejected when the upload is completed/failed.
   */
  upload: function(data, onProgress, onSuccess, onFailure) {
    return this.uploadWithBaseUrl(undefined, data, onProgress, onSuccess, onFailure);
  },

  /**
   * Download the file from a given URL using GET request. This method works with the Tinode server only.
   *
   * @memberof Tinode.LargeFileHelper#
   *
   * @param {string} relativeUrl - URL to download the file from. Must be relative url, i.e. must not contain the host.
   * @param {string=} filename - file name to use for the downloaded file.
   *
   * @returns {Promise} resolved/rejected when the download is completed/failed.
   */
  download: function(relativeUrl, filename, mimetype, onProgress, onError) {
    if (!Tinode.isRelativeURL(relativeUrl)) {
      // As a security measure refuse to download from an absolute URL.
      if (onError) {
        onError(`The URL '${relativeUrl}' must be relative, not absolute`);
      }
      return;
    }
    if (!this._authToken) {
      if (onError) {
        onError("Must authenticate first");
      }
      return;
    }
    const instance = this;
    // Get data as blob (stored by the browser as a temporary file).
    this.xhr.open('GET', relativeUrl, true);
    this.xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    this.xhr.setRequestHeader('X-Tinode-Auth', 'Token ' + this._authToken.token);
    this.xhr.responseType = 'blob';

    this.onProgress = onProgress;
    this.xhr.onprogress = function(e) {
      if (instance.onProgress) {
        // Passing e.loaded instead of e.loaded/e.total because e.total
        // is always 0 with gzip compression enabled by the server.
        instance.onProgress(e.loaded);
      }
    };

    const result = new Promise((resolve, reject) => {
      this.toResolve = resolve;
      this.toReject = reject;
    });

    // The blob needs to be saved as file. There is no known way to
    // save the blob as file other than to fake a click on an <a href... download=...>.
    this.xhr.onload = function() {
      if (this.status == 200) {
        const link = document.createElement('a');
        // URL.createObjectURL is not available in non-browser environment. This call will fail.
        link.href = window.URL.createObjectURL(new Blob([this.response], {
          type: mimetype
        }));
        link.style.display = 'none';
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        if (instance.toResolve) {
          instance.toResolve();
        }
      } else if (this.status >= 400 && instance.toReject) {
        // The this.responseText is undefined, must use this.response which is a blob.
        // Need to convert this.response to JSON. The blob can only be accessed by the
        // FileReader.
        const reader = new FileReader();
        reader.onload = function() {
          try {
            const pkt = JSON.parse(this.result, jsonParseHelper);
            instance.toReject(new Error(`${pkt.ctrl.text} (${pkt.ctrl.code})`));
          } catch (err) {
            instance._tinode.logger("ERROR: Invalid server response in LargeFileHelper", this.result);
            instance.toReject(err);
          }
        };
        reader.readAsText(this.response);
      }
    };

    this.xhr.onerror = function(e) {
      if (instance.toReject) {
        instance.toReject(new Error("failed"));
      }
    };

    this.xhr.onabort = function() {
      if (instance.toReject) {
        instance.toReject(null);
      }
    };

    try {
      this.xhr.send();
    } catch (err) {
      if (this.toReject) {
        this.toReject(err);
      }
    }

    return result;
  },

  /**
   * Try to cancel an ongoing upload or download.
   * @memberof Tinode.LargeFileHelper#
   */
  cancel: function() {
    if (this.xhr && this.xhr.readyState < 4) {
      this.xhr.abort();
    }
  },

  /**
   * Get unique id of this request.
   * @memberof Tinode.LargeFileHelper#
   *
   * @returns {string} unique id
   */
  getId: function() {
    return this._msgId;
  }
};

/**
 * @class Message - definition a communication message.
 * Work in progress.
 * @memberof Tinode
 *
 * @param {string} topic_ - name of the topic the message belongs to.
 * @param {string | Drafty} content_ - message contant.
 */
var Message = function(topic_, content_) {
  this.status = Message.STATUS_NONE;
  this.topic = topic_;
  this.content = content_;
}

Message.STATUS_NONE = MESSAGE_STATUS_NONE;
Message.STATUS_QUEUED = MESSAGE_STATUS_QUEUED;
Message.STATUS_SENDING = MESSAGE_STATUS_SENDING;
Message.STATUS_FAILED = MESSAGE_STATUS_FAILED;
Message.STATUS_SENT = MESSAGE_STATUS_SENT;
Message.STATUS_RECEIVED = MESSAGE_STATUS_RECEIVED;
Message.STATUS_READ = MESSAGE_STATUS_READ;
Message.STATUS_TO_ME = MESSAGE_STATUS_TO_ME;

Message.prototype = {
  /**
   * Convert message object to {pub} packet.
   */
  toJSON: function() {

  },
  /**
   * Parse JSON into message.
   */
  fromJSON: function(json) {

  }
}
Message.prototype.constructor = Message;

if (typeof module != 'undefined') {
  module.exports = Tinode;
  module.exports.Drafty = Drafty;
  module.exports.AccessMode = AccessMode;
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../version.json":4,"./db.js":1,"./drafty.js":2}],4:[function(require,module,exports){
module.exports={"version": "0.17.0"}

},{}]},{},[3])(3)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZGIuanMiLCJzcmMvZHJhZnR5LmpzIiwic3JjL3Rpbm9kZS5qcyIsInZlcnNpb24uanNvbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMW5EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzZ01BO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKipcbiAqIEBmaWxlIEhlbHBlciBtZXRob2RzIGZvciBkZWFsaW5nIHdpdGggSW5kZXhlZERCIGNhY2hlIG9mIG1lc3NhZ2VzLCB1c2VycywgYW5kIHRvcGljcy5cbiAqIFNlZSA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL3Rpbm9kZS93ZWJhcHBcIj5odHRwczovL2dpdGh1Yi5jb20vdGlub2RlL3dlYmFwcDwvYT4gZm9yIHJlYWwtbGlmZSB1c2FnZS5cbiAqXG4gKiBAY29weXJpZ2h0IDIwMTUtMjAyMSBUaW5vZGVcbiAqIEBzdW1tYXJ5IEphdmFzY3JpcHQgYmluZGluZ3MgZm9yIFRpbm9kZS5cbiAqIEBsaWNlbnNlIEFwYWNoZSAyLjBcbiAqIEB2ZXJzaW9uIDAuMTdcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBEQl9WRVJTSU9OID0gMTtcbmNvbnN0IERCX05BTUUgPSAndGlub2RlLXdlYic7XG5cbmNvbnN0IERCID0gZnVuY3Rpb24ob25FcnJvciwgbG9nZ2VyKSB7XG4gIG9uRXJyb3IgPSBvbkVycm9yIHx8IGZ1bmN0aW9uKCkge31cbiAgbG9nZ2VyID0gbG9nZ2VyIHx8IGZ1bmN0aW9uKCkge31cblxuICAvLyBQbGFjZWhvbGRlciBEQiB3aGljaCBkb2VzIG5vdGhpbmcuXG4gIGxldCBkYiA9IG51bGw7XG5cbiAgLy8gU2VyaWFsaXphYmxlIHRvcGljIGZpZWxkcy5cbiAgY29uc3QgdG9waWNfZmllbGRzID0gWydjcmVhdGVkJywgJ3VwZGF0ZWQnLCAnZGVsZXRlZCcsICdyZWFkJywgJ3JlY3YnLCAnc2VxJywgJ2NsZWFyJywgJ2RlZmFjcycsXG4gICAgJ2NyZWRzJywgJ3B1YmxpYycsICdwcml2YXRlJywgJ3RvdWNoZWQnXG4gIF07XG5cbiAgLy8gQ29weSB2YWx1ZXMgZnJvbSAnc3JjJyB0byAnZHN0Jy4gQWxsb2NhdGUgZHN0IGlmICdpdCdzIG51bGwgb3IgdW5kZWZpbmVkLlxuICBmdW5jdGlvbiBzZXJpYWxpemVUb3BpYyhkc3QsIHNyYykge1xuICAgIGNvbnN0IHJlcyA9IGRzdCB8fCB7XG4gICAgICBuYW1lOiBzcmMubmFtZVxuICAgIH07XG4gICAgdG9waWNfZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgcmVzW2ZdID0gc3JjW2ZdO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHNyYy5fdGFncykpIHtcbiAgICAgIHJlcy50YWdzID0gc3JjLl90YWdzO1xuICAgIH1cbiAgICBpZiAoc3JjLmFjcykge1xuICAgICAgcmVzLmFjcyA9IHNyYy5nZXRBY2Nlc3NNb2RlKCkuanNvbkhlbHBlcigpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgLy8gQ29weSBkYXRhIGZyb20gc3JjIHRvIFRvcGljIG9iamVjdC5cbiAgZnVuY3Rpb24gZGVzZXJpYWxpemVUb3BpYyh0b3BpYywgc3JjKSB7XG4gICAgdG9waWNfZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgdG9waWNbZl0gPSBzcmNbZl07XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc3JjLnRhZ3MpKSB7XG4gICAgICB0b3BpYy5fdGFncyA9IHNyYy50YWdzO1xuICAgIH1cbiAgICBpZiAoc3JjLmFjcykge1xuICAgICAgdG9waWMuc2V0QWNjZXNzTW9kZShzcmMuYWNzKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXJpYWxpemVTdWJzY3JpcHRpb24oZHN0LCB0b3BpY05hbWUsIHVpZCwgc3ViKSB7XG4gICAgY29uc3QgZmllbGRzID0gWyd1cGRhdGVkJywgJ21vZGUnLCAncmVhZCcsICdyZWN2JywgJ2NsZWFyJywgJ2xhc3RTZWVuJywgJ3VzZXJBZ2VudCddO1xuICAgIGNvbnN0IHJlcyA9IGRzdCB8fCB7XG4gICAgICB0b3BpYzogdG9waWNOYW1lLFxuICAgICAgdWlkOiB1aWRcbiAgICB9O1xuXG4gICAgZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChzdWIuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgcmVzW2ZdID0gc3ViW2ZdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZU1lc3NhZ2UoZHN0LCBtc2cpIHtcbiAgICAvLyBTZXJpYWxpemFibGUgZmllbGRzLlxuICAgIGNvbnN0IGZpZWxkcyA9IFsndG9waWMnLCAnc2VxJywgJ3RzJywgJ19zdGF0dXMnLCAnZnJvbScsICdoZWFkJywgJ2NvbnRlbnQnXTtcbiAgICBjb25zdCByZXMgPSBkc3QgfHwge307XG4gICAgZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChtc2cuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgcmVzW2ZdID0gbXNnW2ZdO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKFwic2VyaWFsaXplTWVzc2FnZVwiLCByZXMpO1xuICAgIHJldHVybiByZXM7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgcGVyc2lzdGVudCBjYWNoZTogb3BlbiBvciBjcmVhdGUvdXBncmFkZSBpZiBuZWVkZWQuXG4gICAgICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgREIgaXMgaW5pdGlhbGl6ZWQuXG4gICAgICovXG4gICAgaW5pdERhdGFiYXNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIC8vIE9wZW4gdGhlIGRhdGFiYXNlIGFuZCBpbml0aWFsaXplIGNhbGxiYWNrcy5cbiAgICAgICAgY29uc3QgcmVxID0gaW5kZXhlZERCLm9wZW4oREJfTkFNRSwgREJfVkVSU0lPTik7XG4gICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgcmVzb2x2ZShkYik7XG4gICAgICAgIH07XG4gICAgICAgIHJlcS5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwiZmFpbGVkIHRvIGluaXRpYWxpemVcIiwgZXZlbnQpO1xuICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICAgIGlmIChvbkVycm9yKSB7XG4gICAgICAgICAgICBvbkVycm9yKGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXEub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgICAgICBkYi5vbmVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcImZhaWxlZCB0byBjcmVhdGUgc3RvcmFnZVwiLCBldmVudCk7XG4gICAgICAgICAgICBpZiAob25FcnJvcikge1xuICAgICAgICAgICAgICBvbkVycm9yKGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vIEluZGl2aWR1YWwgb2JqZWN0IHN0b3Jlcy5cblxuICAgICAgICAgIC8vIE9iamVjdCBzdG9yZSAodGFibGUpIGZvciB0b3BpY3MuIFRoZSBwcmltYXJ5IGtleSBpcyB0b3BpYyBuYW1lLlxuICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKCd0b3BpYycsIHtcbiAgICAgICAgICAgIGtleVBhdGg6ICduYW1lJ1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gVXNlcnMgb2JqZWN0IHN0b3JlLiBVSUQgaXMgdGhlIHByaW1hcnkga2V5LlxuICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKCd1c2VyJywge1xuICAgICAgICAgICAga2V5UGF0aDogJ3VpZCdcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIFN1YnNjcmlwdGlvbnMgb2JqZWN0IHN0b3JlIHRvcGljIDwtPiB1c2VyLiBUb3BpYyBuYW1lICsgVUlEIGlzIHRoZSBwcmltYXJ5IGtleS5cbiAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZSgnc3Vic2NyaXB0aW9uJywge1xuICAgICAgICAgICAga2V5UGF0aDogWyd0b3BpYycsICd1aWQnXVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gTWVzc2FnZXMgb2JqZWN0IHN0b3JlLiBUaGUgcHJpbWFyeSBrZXkgaXMgdG9waWMgbmFtZSArIHNlcS5cbiAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZSgnbWVzc2FnZScsIHtcbiAgICAgICAgICAgIGtleVBhdGg6IFsndG9waWMnLCAnc2VxJ11cbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZWxldGUgcGVyc2lzdGVudCBjYWNoZS5cbiAgICAgKi9cbiAgICBkZWxldGVEYXRhYmFzZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCByZXEgPSBpbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoREJfTkFNRSk7XG4gICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBsb2dnZXIoXCJQQ2FjaGVcIiwgXCJkZWxldGVEYXRhYmFzZVwiLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHBlcnNpc3RlbnQgY2FjaGUgaXMgcmVhZHkgZm9yIHVzZS5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgY2FjaGUgaXMgcmVhZHksIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAgICovXG4gICAgaXNSZWFkeTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISFkYjtcbiAgICB9LFxuXG4gICAgLy8gVG9waWNzLlxuICAgIC8qKlxuICAgICAqIEFkZCBvciB1cGRhdGUgdG9waWMgaW4gcGVyc2lzdGVudCBjYWNoZS5cbiAgICAgKiBAbWVtYmVyT2YgREJcbiAgICAgKiBAcGFyYW0ge1RvcGljfSB0b3BpYyAtIHRvcGljIHRvIGJlIGFkZGVkIHRvIHBlcnNpc3RlbnQgc3RvcmFnZS5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICB1cGRUb3BpYzogZnVuY3Rpb24odG9waWMpIHtcbiAgICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIm5vdCBpbml0aWFsaXplZFwiKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCB0cnggPSBkYi50cmFuc2FjdGlvbihbJ3RvcGljJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgdHJ4Lm9uY29tcGxldGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcInVwZFRvcGljXCIsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vYmplY3RTdG9yZSgndG9waWMnKS5nZXQodG9waWMubmFtZSkub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd0b3BpYycpLnB1dChzZXJpYWxpemVUb3BpYyhldmVudC50YXJnZXQucmVzdWx0LCB0b3BpYykpO1xuICAgICAgICAgIHRyeC5jb21taXQoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdG9waWMgZnJvbSBwZXJzaXN0ZW50IGNhY2hlLlxuICAgICAqIEBtZW1iZXJPZiBEQlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgdG9waWMgdG8gcmVtb3ZlIGZyb20gZGF0YWJhc2UuXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICByZW1Ub3BpYzogZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsndG9waWMnLCAnc3Vic2NyaXB0aW9uJywgJ21lc3NhZ2UnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICB0cngub25jb21wbGV0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwicmVtVG9waWNcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd0b3BpYycpLmRlbGV0ZShJREJLZXlSYW5nZS5vbmx5KG5hbWUpKTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdzdWJzY3JpcHRpb24nKS5kZWxldGUoSURCS2V5UmFuZ2UuYm91bmQoW25hbWUsICctJ10sIFtuYW1lLCAnfiddKSk7XG4gICAgICAgIHRyeC5vYmplY3RTdG9yZSgnbWVzc2FnZScpLmRlbGV0ZShJREJLZXlSYW5nZS5ib3VuZChbbmFtZSwgMF0sIFtuYW1lLCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUl0pKTtcbiAgICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBjYWxsYmFjayBmb3IgZWFjaCBzdG9yZWQgdG9waWMuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBmdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHRvcGljLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gdGhlIHZhbHVlIG9yIDxjb2RlPnRoaXM8L2NvZGU+IGluc2lkZSB0aGUgY2FsbGJhY2suXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICBtYXBUb3BpY3M6IGZ1bmN0aW9uKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJub3QgaW5pdGlhbGl6ZWRcIikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdHJ4ID0gZGIudHJhbnNhY3Rpb24oWyd0b3BpYyddKTtcbiAgICAgICAgdHJ4Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBsb2dnZXIoXCJQQ2FjaGVcIiwgXCJtYXBUb3BpY3NcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd0b3BpYycpLmdldEFsbCgpLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgZXZlbnQudGFyZ2V0LnJlc3VsdC5mb3JFYWNoKCh0b3BpYykgPT4ge1xuICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRvcGljKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvcHkgZGF0YSBmcm9tIHNlcmlhbGl6ZWQgb2JqZWN0IHRvIHRvcGljLlxuICAgICAqIEBtZW1iZXJPZiBEQlxuICAgICAqIEBwYXJhbSB7VG9waWN9IHRvcGljIC0gdGFyZ2V0IHRvIGRlc2VyaWFsaXplIHRvLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcmMgLSBzZXJpYWxpemVkIGRhdGEgdG8gY29weSBmcm9tLlxuICAgICAqL1xuICAgIGRlc2VyaWFsaXplVG9waWM6IGZ1bmN0aW9uKHRvcGljLCBzcmMpIHtcbiAgICAgIGRlc2VyaWFsaXplVG9waWModG9waWMsIHNyYyk7XG4gICAgfSxcblxuICAgIC8vIFVzZXJzLlxuICAgIC8qKlxuICAgICAqIEFkZCBvciB1cGRhdGUgdXNlciBvYmplY3QgaW4gdGhlIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIElEIG9mIHRoZSB1c2VyIHRvIHNhdmUuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHB1YiAtIHVzZXIncyA8Y29kZT5wdWJsaWM8L2NvZGU+IGluZm9ybWF0aW9uLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgICAqL1xuICAgIHVwZFVzZXI6IGZ1bmN0aW9uKHVpZCwgcHViKSB7XG4gICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJub3QgaW5pdGlhbGl6ZWRcIikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdHJ4ID0gZGIudHJhbnNhY3Rpb24oWyd1c2VyJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgdHJ4Lm9uY29tcGxldGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcInVwZFVzZXJcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdXNlciA9IHtcbiAgICAgICAgICB1aWQ6IHVpZFxuICAgICAgICB9O1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgcHViICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB1c2VyLnB1YmxpYyA9IHB1YjtcbiAgICAgICAgfVxuICAgICAgICB0cngub2JqZWN0U3RvcmUoJ3VzZXInKS5wdXQodXNlcik7XG4gICAgICAgIHRyeC5jb21taXQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdXNlciBmcm9tIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIElEIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBmcm9tIHRoZSBjYWNoZS5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgICAqL1xuICAgIHJlbVVzZXI6IGZ1bmN0aW9uKHVpZCkge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsndXNlciddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIHRyeC5vbmNvbXBsZXRlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBsb2dnZXIoXCJQQ2FjaGVcIiwgXCJyZW1Vc2VyXCIsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vYmplY3RTdG9yZSgndXNlcicpLmRlbGV0ZShJREJLZXlSYW5nZS5vbmx5KHVpZCkpO1xuICAgICAgICB0cnguY29tbWl0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVhZCBhIHNpbmdsZSB1c2VyIGZyb20gcGVyc2lzdGVudCBjYWNoZS5cbiAgICAgKiBAbWVtYmVyT2YgREJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gSUQgb2YgdGhlIHVzZXIgdG8gZmV0Y2ggZnJvbSBjYWNoZS5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgICAqL1xuICAgIGdldFVzZXI6IGZ1bmN0aW9uKHVpZCkge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsndXNlciddKTtcbiAgICAgICAgdHJ4Lm9uY29tcGxldGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCB1c2VyID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgIHVzZXI6IHVzZXIudWlkLFxuICAgICAgICAgICAgcHVibGljOiB1c2VyLnB1YmxpY1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcImdldFVzZXJcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd1c2VyJykuZ2V0KHVpZCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gU3Vic2NyaXB0aW9ucy5cblxuICAgIC8qKlxuICAgICAqIEFkZCBvciB1cGRhdGUgc3Vic2NyaXB0aW9uIGluIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHdoaWNoIG93bnMgdGhlIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIElEIG9mIHRoZSBzdWJzY3JpYmVkIHVzZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHN1YiAtIHN1YnNjcmlwdGlvbiB0byBzYXZlLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAgICovXG4gICAgdXBkU3Vic2NyaXB0aW9uOiBmdW5jdGlvbih0b3BpY05hbWUsIHVpZCwgc3ViKSB7XG4gICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJub3QgaW5pdGlhbGl6ZWRcIikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdHJ4ID0gZGIudHJhbnNhY3Rpb24oWydzdWJzY3JpcHRpb24nXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICB0cngub25jb21wbGV0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwidXBkU3Vic2NyaXB0aW9uXCIsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vYmplY3RTdG9yZSgnc3Vic2NyaXB0aW9uJykuZ2V0KFt0b3BpY05hbWUsIHVpZF0pLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHRyeC5vYmplY3RTdG9yZSgnc3Vic2NyaXB0aW9uJykucHV0KHNlcmlhbGl6ZVN1YnNjcmlwdGlvbihldmVudC50YXJnZXQucmVzdWx0LCB0b3BpY05hbWUsIHVpZCwgc3ViKSk7XG4gICAgICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBjYWxsYmFjayBmb3IgZWFjaCBjYWNoZWQgc3Vic2NyaXB0aW9uIGluIGEgZ2l2ZW4gdG9waWMuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHdoaWNoIG93bnMgdGhlIHN1YnNjcmlwdGlvbnMuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBmdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHN1YnNjcmlwdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIHRoZSB2YWx1ZSBvciA8Y29kZT50aGlzPC9jb2RlPiBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAgICovXG4gICAgbWFwU3Vic2NyaXB0aW9uczogZnVuY3Rpb24odG9waWNOYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsnc3Vic2NyaXB0aW9uJ10pO1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcIm1hcFN1YnNjcmlwdGlvbnNcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdzdWJzY3JpcHRpb24nKS5nZXRBbGwoSURCS2V5UmFuZ2UuYm91bmQoW3RvcGljTmFtZSwgJy0nXSwgW3RvcGljTmFtZSwgJ34nXSkpLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgZXZlbnQudGFyZ2V0LnJlc3VsdC5mb3JFYWNoKCh0b3BpYykgPT4ge1xuICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRvcGljKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIE1lc3NhZ2VzLlxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBtZXNzYWdlIHRvIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHdoaWNoIG93bnMgdGhlIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG1zZyAtIG1lc3NhZ2UgdG8gc2F2ZS5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgICAqL1xuICAgIGFkZE1lc3NhZ2U6IGZ1bmN0aW9uKG1zZykge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsnbWVzc2FnZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIHRyeC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcImFkZE1lc3NzYWdlXCIsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vYmplY3RTdG9yZSgnbWVzc2FnZScpLmFkZChzZXJpYWxpemVNZXNzYWdlKG51bGwsIG1zZykpO1xuICAgICAgICB0cnguY29tbWl0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGRlbGl2ZXJ5IHN0YXR1cyBvZiBhIG1lc3NhZ2Ugc3RvcmVkIGluIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHdoaWNoIG93bnMgdGhlIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNlcSAtIElEIG9mIHRoZSBtZXNzYWdlIHRvIHVwZGF0ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXMgLSBuZXcgZGVsaXZlcnkgc3RhdHVzIG9mIHRoZSBtZXNzYWdlLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAgICovXG4gICAgdXBkTWVzc2FnZVN0YXR1czogZnVuY3Rpb24odG9waWNOYW1lLCBzZXEsIHN0YXR1cykge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsnbWVzc2FnZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIHRyeC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcInVwZE1lc3NhZ2VTdGF0dXNcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVxID0gdHJ4Lm9iamVjdFN0b3JlKCdtZXNzYWdlJykuZ2V0KElEQktleVJhbmdlLm9ubHkoW3RvcGljTmFtZSwgc2VxXSkpO1xuICAgICAgICByZXEub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbGV0IHNyYyA9IG51bGw7XG4gICAgICAgICAgaWYgKCFyZXEucmVzdWx0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVwZE1lc3NhZ2VTdGF0dXMgLS0gIHJlcXVlc3RcIiwgcmVxLCBKU09OLnN0cmluZ2lmeShyZXEpLCB0b3BpY05hbWUsIHNlcSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNyYyA9IHJlcS5yZXN1bHQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVwZE1lc3NhZ2VTdGF0dXMgLS0gdXNpbmcgUkVRVUVTVFwiLCByZXEsIEpTT04uc3RyaW5naWZ5KHJlcSksIHRvcGljTmFtZSwgc2VxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFzcmMgJiYgIWV2ZW50LnRhcmdldC5yZXN1bHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidXBkTWVzc2FnZVN0YXR1cyAtLSBldmVudFwiLCBldmVudCwgSlNPTi5zdHJpbmdpZnkoZXZlbnQudGFyZ2V0KSwgdG9waWNOYW1lLCBzZXEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzcmMgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1cGRNZXNzYWdlU3RhdHVzIC0tIHVzaW5nIEVWRU5UXCIsIGV2ZW50LCBKU09OLnN0cmluZ2lmeShldmVudC50YXJnZXQpLCB0b3BpY05hbWUsIHNlcSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghc3JjIHx8IHNyYy5fc3RhdHVzID09IHN0YXR1cykge1xuICAgICAgICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0cngub2JqZWN0U3RvcmUoJ21lc3NhZ2UnKS5wdXQoc2VyaWFsaXplTWVzc2FnZShzcmMsIHtcbiAgICAgICAgICAgIHRvcGljOiB0b3BpY05hbWUsXG4gICAgICAgICAgICBzZXE6IHNlcSxcbiAgICAgICAgICAgIF9zdGF0dXM6IHN0YXR1c1xuICAgICAgICAgIH0pKTtcbiAgICAgICAgICB0cnguY29tbWl0KCk7XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIG9uZSBvciBtb3JlIG1lc3NhZ2VzIGZyb20gcGVyc2lzdGVudCBjYWNoZS5cbiAgICAgKiBAbWVtYmVyT2YgREJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWNOYW1lIC0gbmFtZSBvZiB0aGUgdG9waWMgd2hpY2ggb3ducyB0aGUgbWVzc2FnZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZnJvbSAtIGlkIG9mIHRoZSBtZXNzYWdlIHRvIHJlbW92ZSBvciBsb3dlciBib3VuZGFyeSB3aGVuIHJlbW92aW5nIHJhbmdlIChpbmNsdXNpdmUpLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gdG8gLSB1cHBlciBib3VuZGFyeSAoZXhjbHVzaXZlKSB3aGVuIHJlbW92aW5nIGEgcmFuZ2Ugb2YgbWVzc2FnZXMuXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICByZW1NZXNzYWdlczogZnVuY3Rpb24odG9waWNOYW1lLCBmcm9tLCB0bykge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghZnJvbSAmJiAhdG8pIHtcbiAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgICB0byA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJhbmdlID0gdG8gPiAwID8gSURCS2V5UmFuZ2UuYm91bmQoW3RvcGljTmFtZSwgZnJvbV0sIFt0b3BpY05hbWUsIHRvXSwgZmFsc2UsIHRydWUpIDpcbiAgICAgICAgICBJREJLZXlSYW5nZS5vbmx5KFt0b3BpY05hbWUsIGZyb21dKTtcbiAgICAgICAgY29uc3QgdHJ4ID0gZGIudHJhbnNhY3Rpb24oWydtZXNzYWdlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgdHJ4Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwicmVtTWVzc2FnZXNcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdtZXNzYWdlJykuZGVsZXRlKHJhbmdlKTtcbiAgICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIG1lc3NhZ2VzIGZyb20gcGVyc2lzdGVudCBzdG9yZS5cbiAgICAgKiBAbWVtYmVyT2YgREJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWNOYW1lIC0gbmFtZSBvZiB0aGUgdG9waWMgdG8gcmV0cmlldmUgbWVzc2FnZXMgZnJvbS5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayB0byBjYWxsIGZvciBlYWNoIHJldHJpZXZlZCBtZXNzYWdlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBxdWVyeSAtIHBhcmFtZXRlcnMgb2YgdGhlIG1lc3NhZ2UgcmFuZ2UgdG8gcmV0cmlldmUuXG4gICAgICogQHBhcmFtIHtudW1iZXI9fSBxdWVyeS5mcm9tIC0gdGhlIGxlYXN0IG1lc3NhZ2UgSUQgdG8gcmV0cmlldmUgKGluY2x1c2l2ZSkuXG4gICAgICogQHBhcmFtIHtudW1iZXI9fSBxdWVyeS50byAtIHRoZSBncmVhdGVzdCBtZXNzYWdlIElEIHRvIHJldHJpZXZlIChleGNsdXNpdmUpLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gcXVlcnkubGltaXQgLSB0aGUgbWF4aW11bSBudW1iZXIgb2YgbWVzc2FnZXMgdG8gcmV0cmlldmUuXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICByZWFkTWVzc2FnZXM6IGZ1bmN0aW9uKHRvcGljTmFtZSwgcXVlcnksIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJub3QgaW5pdGlhbGl6ZWRcIikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgcXVlcnkgPSBxdWVyeSB8fCB7fTtcbiAgICAgICAgY29uc3QgZnJvbSA9IHF1ZXJ5LmZyb20gPiAwID8gcXVlcnkuZnJvbSA6IDA7XG4gICAgICAgIGNvbnN0IHRvID0gcXVlcnkudG8gPiAwID8gcXVlcnkudG8gOiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUjtcbiAgICAgICAgY29uc3QgbGltaXQgPSBxdWVyeS5saW1pdCB8IDA7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IHJhbmdlID0gSURCS2V5UmFuZ2UuYm91bmQoW3RvcGljTmFtZSwgZnJvbV0sIFt0b3BpY05hbWUsIHRvXSwgZmFsc2UsIHRydWUpO1xuICAgICAgICBjb25zdCB0cnggPSBkYi50cmFuc2FjdGlvbihbJ21lc3NhZ2UnXSk7XG4gICAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwicmVhZE1lc3NhZ2VzXCIsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEl0ZXJhdGUgaW4gZGVzY2VuZGluZyBvcmRlci5cbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdtZXNzYWdlJykub3BlbkN1cnNvcihyYW5nZSwgJ3ByZXYnKS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCBjdXJzb3IgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgICAgaWYgKGxpbWl0IDw9IDAgfHwgcmVzdWx0Lmxlbmd0aCA8IGxpbWl0KSB7XG4gICAgICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufVxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IERCO1xufVxuIiwiLyoqXG4gKiBAY29weXJpZ2h0IDIwMTUtMjAyMSBUaW5vZGVcbiAqIEBzdW1tYXJ5IE1pbmltYWxseSByaWNoIHRleHQgcmVwcmVzZW50YXRpb24gYW5kIGZvcm1hdHRpbmcgZm9yIFRpbm9kZS5cbiAqIEBsaWNlbnNlIEFwYWNoZSAyLjBcbiAqIEB2ZXJzaW9uIDAuMTZcbiAqXG4gKiBAZmlsZSBCYXNpYyBwYXJzZXIgYW5kIGZvcm1hdHRlciBmb3IgdmVyeSBzaW1wbGUgdGV4dCBtYXJrdXAuIE1vc3RseSB0YXJnZXRlZCBhdFxuICogbW9iaWxlIHVzZSBjYXNlcyBzaW1pbGFyIHRvIFRlbGVncmFtLCBXaGF0c0FwcCwgYW5kIEZCIE1lc3Nlbmdlci5cbiAqXG4gKiA8cD5TdXBwb3J0cyBjb252ZXJzaW9uIG9mIHVzZXIga2V5Ym9hcmQgaW5wdXQgdG8gZm9ybWF0dGVkIHRleHQ6PC9wPlxuICogPHVsPlxuICogICA8bGk+KmFiYyogJnJhcnI7IDxiPmFiYzwvYj48L2xpPlxuICogICA8bGk+X2FiY18gJnJhcnI7IDxpPmFiYzwvaT48L2xpPlxuICogICA8bGk+fmFiY34gJnJhcnI7IDxkZWw+YWJjPC9kZWw+PC9saT5cbiAqICAgPGxpPmBhYmNgICZyYXJyOyA8dHQ+YWJjPC90dD48L2xpPlxuICogPC91bD5cbiAqIEFsc28gc3VwcG9ydHMgZm9ybXMgYW5kIGJ1dHRvbnMuXG4gKlxuICogTmVzdGVkIGZvcm1hdHRpbmcgaXMgc3VwcG9ydGVkLCBlLmcuICphYmMgX2RlZl8qIC0+IDxiPmFiYyA8aT5kZWY8L2k+PC9iPlxuICogVVJMcywgQG1lbnRpb25zLCBhbmQgI2hhc2h0YWdzIGFyZSBleHRyYWN0ZWQgYW5kIGNvbnZlcnRlZCBpbnRvIGxpbmtzLlxuICogRm9ybXMgYW5kIGJ1dHRvbnMgY2FuIGJlIGFkZGVkIHByb2NlZHVyYWxseS5cbiAqIEpTT04gZGF0YSByZXByZXNlbnRhdGlvbiBpcyBpbnNwaXJlZCBieSBEcmFmdC5qcyByYXcgZm9ybWF0dGluZy5cbiAqXG4gKlxuICogQGV4YW1wbGVcbiAqIFRleHQ6XG4gKiA8cHJlPlxuICogICAgIHRoaXMgaXMgKmJvbGQqLCBgY29kZWAgYW5kIF9pdGFsaWNfLCB+c3RyaWtlflxuICogICAgIGNvbWJpbmVkICpib2xkIGFuZCBfaXRhbGljXypcbiAqICAgICBhbiB1cmw6IGh0dHBzOi8vd3d3LmV4YW1wbGUuY29tL2FiYyNmcmFnbWVudCBhbmQgYW5vdGhlciBfd3d3LnRpbm9kZS5jb19cbiAqICAgICB0aGlzIGlzIGEgQG1lbnRpb24gYW5kIGEgI2hhc2h0YWcgaW4gYSBzdHJpbmdcbiAqICAgICBzZWNvbmQgI2hhc2h0YWdcbiAqIDwvcHJlPlxuICpcbiAqICBTYW1wbGUgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgdGV4dCBhYm92ZTpcbiAqICB7XG4gKiAgICAgXCJ0eHRcIjogXCJ0aGlzIGlzIGJvbGQsIGNvZGUgYW5kIGl0YWxpYywgc3RyaWtlIGNvbWJpbmVkIGJvbGQgYW5kIGl0YWxpYyBhbiB1cmw6IGh0dHBzOi8vd3d3LmV4YW1wbGUuY29tL2FiYyNmcmFnbWVudCBcIiArXG4gKiAgICAgICAgICAgICBcImFuZCBhbm90aGVyIHd3dy50aW5vZGUuY28gdGhpcyBpcyBhIEBtZW50aW9uIGFuZCBhICNoYXNodGFnIGluIGEgc3RyaW5nIHNlY29uZCAjaGFzaHRhZ1wiLFxuICogICAgIFwiZm10XCI6IFtcbiAqICAgICAgICAgeyBcImF0XCI6OCwgXCJsZW5cIjo0LFwidHBcIjpcIlNUXCIgfSx7IFwiYXRcIjoxNCwgXCJsZW5cIjo0LCBcInRwXCI6XCJDT1wiIH0seyBcImF0XCI6MjMsIFwibGVuXCI6NiwgXCJ0cFwiOlwiRU1cIn0sXG4gKiAgICAgICAgIHsgXCJhdFwiOjMxLCBcImxlblwiOjYsIFwidHBcIjpcIkRMXCIgfSx7IFwidHBcIjpcIkJSXCIsIFwibGVuXCI6MSwgXCJhdFwiOjM3IH0seyBcImF0XCI6NTYsIFwibGVuXCI6NiwgXCJ0cFwiOlwiRU1cIiB9LFxuICogICAgICAgICB7IFwiYXRcIjo0NywgXCJsZW5cIjoxNSwgXCJ0cFwiOlwiU1RcIiB9LHsgXCJ0cFwiOlwiQlJcIiwgXCJsZW5cIjoxLCBcImF0XCI6NjIgfSx7IFwiYXRcIjoxMjAsIFwibGVuXCI6MTMsIFwidHBcIjpcIkVNXCIgfSxcbiAqICAgICAgICAgeyBcImF0XCI6NzEsIFwibGVuXCI6MzYsIFwia2V5XCI6MCB9LHsgXCJhdFwiOjEyMCwgXCJsZW5cIjoxMywgXCJrZXlcIjoxIH0seyBcInRwXCI6XCJCUlwiLCBcImxlblwiOjEsIFwiYXRcIjoxMzMgfSxcbiAqICAgICAgICAgeyBcImF0XCI6MTQ0LCBcImxlblwiOjgsIFwia2V5XCI6MiB9LHsgXCJhdFwiOjE1OSwgXCJsZW5cIjo4LCBcImtleVwiOjMgfSx7IFwidHBcIjpcIkJSXCIsIFwibGVuXCI6MSwgXCJhdFwiOjE3OSB9LFxuICogICAgICAgICB7IFwiYXRcIjoxODcsIFwibGVuXCI6OCwgXCJrZXlcIjozIH0seyBcInRwXCI6XCJCUlwiLCBcImxlblwiOjEsIFwiYXRcIjoxOTUgfVxuICogICAgIF0sXG4gKiAgICAgXCJlbnRcIjogW1xuICogICAgICAgICB7IFwidHBcIjpcIkxOXCIsIFwiZGF0YVwiOnsgXCJ1cmxcIjpcImh0dHBzOi8vd3d3LmV4YW1wbGUuY29tL2FiYyNmcmFnbWVudFwiIH0gfSxcbiAqICAgICAgICAgeyBcInRwXCI6XCJMTlwiLCBcImRhdGFcIjp7IFwidXJsXCI6XCJodHRwOi8vd3d3LnRpbm9kZS5jb1wiIH0gfSxcbiAqICAgICAgICAgeyBcInRwXCI6XCJNTlwiLCBcImRhdGFcIjp7IFwidmFsXCI6XCJtZW50aW9uXCIgfSB9LFxuICogICAgICAgICB7IFwidHBcIjpcIkhUXCIsIFwiZGF0YVwiOnsgXCJ2YWxcIjpcImhhc2h0YWdcIiB9IH1cbiAqICAgICBdXG4gKiAgfVxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuY29uc3QgTUFYX0ZPUk1fRUxFTUVOVFMgPSA4O1xuY29uc3QgSlNPTl9NSU1FX1RZUEUgPSAnYXBwbGljYXRpb24vanNvbic7XG5cbi8vIFJlZ3VsYXIgZXhwcmVzc2lvbnMgZm9yIHBhcnNpbmcgaW5saW5lIGZvcm1hdHMuIEphdmFzY3JpcHQgZG9lcyBub3Qgc3VwcG9ydCBsb29rYmVoaW5kLFxuLy8gc28gaXQncyBhIGJpdCBtZXNzeS5cbmNvbnN0IElOTElORV9TVFlMRVMgPSBbXG4gIC8vIFN0cm9uZyA9IGJvbGQsICpib2xkIHRleHQqXG4gIHtcbiAgICBuYW1lOiAnU1QnLFxuICAgIHN0YXJ0OiAvKD86XnxbXFxXX10pKFxcKilbXlxccypdLyxcbiAgICBlbmQ6IC9bXlxccypdKFxcKikoPz0kfFtcXFdfXSkvXG4gIH0sXG4gIC8vIEVtcGhlc2l6ZWQgPSBpdGFsaWMsIF9pdGFsaWMgdGV4dF9cbiAge1xuICAgIG5hbWU6ICdFTScsXG4gICAgc3RhcnQ6IC8oPzpefFxcVykoXylbXlxcc19dLyxcbiAgICBlbmQ6IC9bXlxcc19dKF8pKD89JHxcXFcpL1xuICB9LFxuICAvLyBEZWxldGVkLCB+c3RyaWtlIHRoaXMgdGhvdWdoflxuICB7XG4gICAgbmFtZTogJ0RMJyxcbiAgICBzdGFydDogLyg/Ol58W1xcV19dKSh+KVteXFxzfl0vLFxuICAgIGVuZDogL1teXFxzfl0ofikoPz0kfFtcXFdfXSkvXG4gIH0sXG4gIC8vIENvZGUgYmxvY2sgYHRoaXMgaXMgbW9ub3NwYWNlYFxuICB7XG4gICAgbmFtZTogJ0NPJyxcbiAgICBzdGFydDogLyg/Ol58XFxXKShgKVteYF0vLFxuICAgIGVuZDogL1teYF0oYCkoPz0kfFxcVykvXG4gIH1cbl07XG5cbi8vIFJlZ0V4cHMgZm9yIGVudGl0eSBleHRyYWN0aW9uIChSRiA9IHJlZmVyZW5jZSlcbmNvbnN0IEVOVElUWV9UWVBFUyA9IFtcbiAgLy8gVVJMc1xuICB7XG4gICAgbmFtZTogJ0xOJyxcbiAgICBkYXRhTmFtZTogJ3VybCcsXG4gICAgcGFjazogZnVuY3Rpb24odmFsKSB7XG4gICAgICAvLyBDaGVjayBpZiB0aGUgcHJvdG9jb2wgaXMgc3BlY2lmaWVkLCBpZiBub3QgdXNlIGh0dHBcbiAgICAgIGlmICghL15bYS16XSs6XFwvXFwvL2kudGVzdCh2YWwpKSB7XG4gICAgICAgIHZhbCA9ICdodHRwOi8vJyArIHZhbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogdmFsXG4gICAgICB9O1xuICAgIH0sXG4gICAgcmU6IC8oPzooPzpodHRwcz98ZnRwKTpcXC9cXC98d3d3XFwufGZ0cFxcLilbLUEtWjAtOSsmQCNcXC8lPX5ffCQ/ITosLl0qW0EtWjAtOSsmQCNcXC8lPX5ffCRdL2lnXG4gIH0sXG4gIC8vIE1lbnRpb25zIEB1c2VyIChtdXN0IGJlIDIgb3IgbW9yZSBjaGFyYWN0ZXJzKVxuICB7XG4gICAgbmFtZTogJ01OJyxcbiAgICBkYXRhTmFtZTogJ3ZhbCcsXG4gICAgcGFjazogZnVuY3Rpb24odmFsKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWw6IHZhbC5zbGljZSgxKVxuICAgICAgfTtcbiAgICB9LFxuICAgIHJlOiAvXFxCQChcXHdcXHcrKS9nXG4gIH0sXG4gIC8vIEhhc2h0YWdzICNoYXNodGFnLCBsaWtlIG1ldGlvbiAyIG9yIG1vcmUgY2hhcmFjdGVycy5cbiAge1xuICAgIG5hbWU6ICdIVCcsXG4gICAgZGF0YU5hbWU6ICd2YWwnLFxuICAgIHBhY2s6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsOiB2YWwuc2xpY2UoMSlcbiAgICAgIH07XG4gICAgfSxcbiAgICByZTogL1xcQiMoXFx3XFx3KykvZ1xuICB9XG5dO1xuXG4vLyBIVE1MIHRhZyBuYW1lIHN1Z2dlc3Rpb25zXG5jb25zdCBIVE1MX1RBR1MgPSB7XG4gIFNUOiB7XG4gICAgbmFtZTogJ2InLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgRU06IHtcbiAgICBuYW1lOiAnaScsXG4gICAgaXNWb2lkOiBmYWxzZVxuICB9LFxuICBETDoge1xuICAgIG5hbWU6ICdkZWwnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgQ086IHtcbiAgICBuYW1lOiAndHQnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgQlI6IHtcbiAgICBuYW1lOiAnYnInLFxuICAgIGlzVm9pZDogdHJ1ZVxuICB9LFxuICBMTjoge1xuICAgIG5hbWU6ICdhJyxcbiAgICBpc1ZvaWQ6IGZhbHNlXG4gIH0sXG4gIE1OOiB7XG4gICAgbmFtZTogJ2EnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgSFQ6IHtcbiAgICBuYW1lOiAnYScsXG4gICAgaXNWb2lkOiBmYWxzZVxuICB9LFxuICBJTToge1xuICAgIG5hbWU6ICdpbWcnLFxuICAgIGlzVm9pZDogdHJ1ZVxuICB9LFxuICBGTToge1xuICAgIG5hbWU6ICdkaXYnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgUlc6IHtcbiAgICBuYW1lOiAnZGl2JyxcbiAgICBpc1ZvaWQ6IGZhbHNlLFxuICB9LFxuICBCTjoge1xuICAgIG5hbWU6ICdidXR0b24nLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgSEQ6IHtcbiAgICBuYW1lOiAnJyxcbiAgICBpc1ZvaWQ6IGZhbHNlXG4gIH0sXG4gIEhMOiB7XG4gICAgbmFtZTogJ3NwYW4nLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfVxufTtcblxuLy8gQ29udmVydCBiYXNlNjQtZW5jb2RlZCBzdHJpbmcgaW50byBCbG9iLlxuZnVuY3Rpb24gYmFzZTY0dG9PYmplY3RVcmwoYjY0LCBjb250ZW50VHlwZSwgbG9nZ2VyKSB7XG4gIGlmICghYjY0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGJpbiA9IGF0b2IoYjY0KTtcbiAgICBjb25zdCBsZW5ndGggPSBiaW4ubGVuZ3RoO1xuICAgIGNvbnN0IGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpO1xuICAgIGNvbnN0IGFyciA9IG5ldyBVaW50OEFycmF5KGJ1Zik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgYXJyW2ldID0gYmluLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW2J1Zl0sIHtcbiAgICAgIHR5cGU6IGNvbnRlbnRUeXBlXG4gICAgfSkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAobG9nZ2VyKSB7XG4gICAgICBsb2dnZXIoXCJEcmFmdHk6IGZhaWxlZCB0byBjb252ZXJ0IG9iamVjdC5cIiwgZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBiYXNlNjR0b0RhdGFVcmwoYjY0LCBjb250ZW50VHlwZSkge1xuICBpZiAoIWI2NCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnRlbnRUeXBlID0gY29udGVudFR5cGUgfHwgJ2ltYWdlL2pwZWcnO1xuICByZXR1cm4gJ2RhdGE6JyArIGNvbnRlbnRUeXBlICsgJztiYXNlNjQsJyArIGI2NDtcbn1cblxuLy8gSGVscGVycyBmb3IgY29udmVydGluZyBEcmFmdHkgdG8gSFRNTC5cbmNvbnN0IERFQ09SQVRPUlMgPSB7XG4gIC8vIFZpc2lhbCBzdHlsZXNcbiAgU1Q6IHtcbiAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPGI+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPC9iPic7XG4gICAgfVxuICB9LFxuICBFTToge1xuICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8aT4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8L2k+J1xuICAgIH1cbiAgfSxcbiAgREw6IHtcbiAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPGRlbD4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8L2RlbD4nXG4gICAgfVxuICB9LFxuICBDTzoge1xuICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8dHQ+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPC90dD4nXG4gICAgfVxuICB9LFxuICAvLyBMaW5lIGJyZWFrXG4gIEJSOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzxici8+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfSxcbiAgLy8gSGlkZGVuIGVsZW1lbnRcbiAgSEQ6IHtcbiAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH0sXG4gIC8vIEhpZ2hsaWdodGVkIGVsZW1lbnQuXG4gIEhMOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzxzcGFuIHN0eWxlPVwiY29sb3I6dGVhbFwiPic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzwvc3Bhbj4nO1xuICAgIH1cbiAgfSxcbiAgLy8gTGluayAoVVJMKVxuICBMTjoge1xuICAgIG9wZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPGEgaHJlZj1cIicgKyBkYXRhLnVybCArICdcIj4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPC9hPic7XG4gICAgfSxcbiAgICBwcm9wczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIGRhdGEgPyB7XG4gICAgICAgIGhyZWY6IGRhdGEudXJsLFxuICAgICAgICB0YXJnZXQ6IFwiX2JsYW5rXCJcbiAgICAgIH0gOiBudWxsO1xuICAgIH0sXG4gIH0sXG4gIC8vIE1lbnRpb25cbiAgTU46IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzxhIGhyZWY9XCIjJyArIGRhdGEudmFsICsgJ1wiPic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8L2E+JztcbiAgICB9LFxuICAgIHByb3BzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSA/IHtcbiAgICAgICAgbmFtZTogZGF0YS52YWxcbiAgICAgIH0gOiBudWxsO1xuICAgIH0sXG4gIH0sXG4gIC8vIEhhc2h0YWdcbiAgSFQ6IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzxhIGhyZWY9XCIjJyArIGRhdGEudmFsICsgJ1wiPic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8L2E+JztcbiAgICB9LFxuICAgIHByb3BzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSA/IHtcbiAgICAgICAgbmFtZTogZGF0YS52YWxcbiAgICAgIH0gOiBudWxsO1xuICAgIH0sXG4gIH0sXG4gIC8vIEJ1dHRvblxuICBCTjoge1xuICAgIG9wZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPGJ1dHRvbj4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPC9idXR0b24+JztcbiAgICB9LFxuICAgIHByb3BzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSA/IHtcbiAgICAgICAgJ2RhdGEtYWN0JzogZGF0YS5hY3QsXG4gICAgICAgICdkYXRhLXZhbCc6IGRhdGEudmFsLFxuICAgICAgICAnZGF0YS1uYW1lJzogZGF0YS5uYW1lLFxuICAgICAgICAnZGF0YS1yZWYnOiBkYXRhLnJlZlxuICAgICAgfSA6IG51bGw7XG4gICAgfSxcbiAgfSxcbiAgLy8gSW1hZ2VcbiAgSU06IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyBEb24ndCB1c2UgZGF0YS5yZWYgZm9yIHByZXZpZXc6IGl0J3MgYSBzZWN1cml0eSByaXNrLlxuICAgICAgY29uc3QgdG1wUHJldmlld1VybCA9IGJhc2U2NHRvRGF0YVVybChkYXRhLl90ZW1wUHJldmlldywgZGF0YS5taW1lKTtcbiAgICAgIGNvbnN0IHByZXZpZXdVcmwgPSBiYXNlNjR0b09iamVjdFVybChkYXRhLnZhbCwgZGF0YS5taW1lLCBEcmFmdHkubG9nZ2VyKTtcbiAgICAgIGNvbnN0IGRvd25sb2FkVXJsID0gZGF0YS5yZWYgfHwgcHJldmlld1VybDtcbiAgICAgIHJldHVybiAoZGF0YS5uYW1lID8gJzxhIGhyZWY9XCInICsgZG93bmxvYWRVcmwgKyAnXCIgZG93bmxvYWQ9XCInICsgZGF0YS5uYW1lICsgJ1wiPicgOiAnJykgK1xuICAgICAgICAnPGltZyBzcmM9XCInICsgKHRtcFByZXZpZXdVcmwgfHwgcHJldmlld1VybCkgKyAnXCInICtcbiAgICAgICAgKGRhdGEud2lkdGggPyAnIHdpZHRoPVwiJyArIGRhdGEud2lkdGggKyAnXCInIDogJycpICtcbiAgICAgICAgKGRhdGEuaGVpZ2h0ID8gJyBoZWlnaHQ9XCInICsgZGF0YS5oZWlnaHQgKyAnXCInIDogJycpICsgJyBib3JkZXI9XCIwXCIgLz4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAoZGF0YS5uYW1lID8gJzwvYT4nIDogJycpO1xuICAgIH0sXG4gICAgcHJvcHM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGlmICghZGF0YSkgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAvLyBUZW1wb3JhcnkgcHJldmlldywgb3IgcGVybWFuZW50IHByZXZpZXcsIG9yIGV4dGVybmFsIGxpbmsuXG4gICAgICAgIHNyYzogYmFzZTY0dG9EYXRhVXJsKGRhdGEuX3RlbXBQcmV2aWV3LCBkYXRhLm1pbWUpIHx8XG4gICAgICAgICAgZGF0YS5yZWYgfHwgYmFzZTY0dG9PYmplY3RVcmwoZGF0YS52YWwsIGRhdGEubWltZSwgRHJhZnR5LmxvZ2dlciksXG4gICAgICAgIHRpdGxlOiBkYXRhLm5hbWUsXG4gICAgICAgICdkYXRhLXdpZHRoJzogZGF0YS53aWR0aCxcbiAgICAgICAgJ2RhdGEtaGVpZ2h0JzogZGF0YS5oZWlnaHQsXG4gICAgICAgICdkYXRhLW5hbWUnOiBkYXRhLm5hbWUsXG4gICAgICAgICdkYXRhLXNpemUnOiBkYXRhLnZhbCA/ICgoZGF0YS52YWwubGVuZ3RoICogMC43NSkgfCAwKSA6IChkYXRhLnNpemUgfCAwKSxcbiAgICAgICAgJ2RhdGEtbWltZSc6IGRhdGEubWltZVxuICAgICAgfTtcbiAgICB9LFxuICB9LFxuICAvLyBGb3JtIC0gc3RydWN0dXJlZCBsYXlvdXQgb2YgZWxlbWVudHMuXG4gIEZNOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8ZGl2Pic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8L2Rpdj4nO1xuICAgIH1cbiAgfSxcbiAgLy8gUm93OiBsb2dpYyBncm91cGluZyBvZiBlbGVtZW50c1xuICBSVzoge1xuICAgIG9wZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPGRpdj4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPC9kaXY+JztcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogVGhlIG1haW4gb2JqZWN0IHdoaWNoIHBlcmZvcm1zIGFsbCB0aGUgZm9ybWF0dGluZyBhY3Rpb25zLlxuICogQGNsYXNzIERyYWZ0eVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmNvbnN0IERyYWZ0eSA9IGZ1bmN0aW9uKCkge31cblxuLy8gVGFrZSBhIHN0cmluZyBhbmQgZGVmaW5lZCBlYXJsaWVyIHN0eWxlIHNwYW5zLCByZS1jb21wb3NlIHRoZW0gaW50byBhIHRyZWUgd2hlcmUgZWFjaCBsZWFmIGlzXG4vLyBhIHNhbWUtc3R5bGUgKGluY2x1ZGluZyB1bnN0eWxlZCkgc3RyaW5nLiBJLmUuICdoZWxsbyAqYm9sZCBfaXRhbGljXyogYW5kIH5tb3JlfiB3b3JsZCcgLT5cbi8vICgnaGVsbG8gJywgKGI6ICdib2xkICcsIChpOiAnaXRhbGljJykpLCAnIGFuZCAnLCAoczogJ21vcmUnKSwgJyB3b3JsZCcpO1xuLy9cbi8vIFRoaXMgaXMgbmVlZGVkIGluIG9yZGVyIHRvIGNsZWFyIG1hcmt1cCwgaS5lLiAnaGVsbG8gKndvcmxkKicgLT4gJ2hlbGxvIHdvcmxkJyBhbmQgY29udmVydFxuLy8gcmFuZ2VzIGZyb20gbWFya3VwLWVkIG9mZnNldHMgdG8gcGxhaW4gdGV4dCBvZmZzZXRzLlxuZnVuY3Rpb24gY2h1bmtpZnkobGluZSwgc3RhcnQsIGVuZCwgc3BhbnMpIHtcbiAgY29uc3QgY2h1bmtzID0gW107XG5cbiAgaWYgKHNwYW5zLmxlbmd0aCA9PSAwKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZm9yIChsZXQgaSBpbiBzcGFucykge1xuICAgIC8vIEdldCB0aGUgbmV4dCBjaHVuayBmcm9tIHRoZSBxdWV1ZVxuICAgIGNvbnN0IHNwYW4gPSBzcGFuc1tpXTtcblxuICAgIC8vIEdyYWIgdGhlIGluaXRpYWwgdW5zdHlsZWQgY2h1bmtcbiAgICBpZiAoc3Bhbi5zdGFydCA+IHN0YXJ0KSB7XG4gICAgICBjaHVua3MucHVzaCh7XG4gICAgICAgIHRleHQ6IGxpbmUuc2xpY2Uoc3RhcnQsIHNwYW4uc3RhcnQpXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBHcmFiIHRoZSBzdHlsZWQgY2h1bmsuIEl0IG1heSBpbmNsdWRlIHN1YmNodW5rcy5cbiAgICBjb25zdCBjaHVuayA9IHtcbiAgICAgIHR5cGU6IHNwYW4udHlwZVxuICAgIH07XG4gICAgY29uc3QgY2hsZCA9IGNodW5raWZ5KGxpbmUsIHNwYW4uc3RhcnQgKyAxLCBzcGFuLmVuZCwgc3Bhbi5jaGlsZHJlbik7XG4gICAgaWYgKGNobGQubGVuZ3RoID4gMCkge1xuICAgICAgY2h1bmsuY2hpbGRyZW4gPSBjaGxkO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaHVuay50ZXh0ID0gc3Bhbi50ZXh0O1xuICAgIH1cbiAgICBjaHVua3MucHVzaChjaHVuayk7XG4gICAgc3RhcnQgPSBzcGFuLmVuZCArIDE7IC8vICcrMScgaXMgdG8gc2tpcCB0aGUgZm9ybWF0dGluZyBjaGFyYWN0ZXJcbiAgfVxuXG4gIC8vIEdyYWIgdGhlIHJlbWFpbmluZyB1bnN0eWxlZCBjaHVuaywgYWZ0ZXIgdGhlIGxhc3Qgc3BhblxuICBpZiAoc3RhcnQgPCBlbmQpIHtcbiAgICBjaHVua3MucHVzaCh7XG4gICAgICB0ZXh0OiBsaW5lLnNsaWNlKHN0YXJ0LCBlbmQpXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gY2h1bmtzO1xufVxuXG4vLyBJbnZlcnNlIG9mIGNodW5raWZ5LiBSZXR1cm5zIGEgdHJlZSBvZiBmb3JtYXR0ZWQgc3BhbnMuXG5mdW5jdGlvbiBmb3JFYWNoKGxpbmUsIHN0YXJ0LCBlbmQsIHNwYW5zLCBmb3JtYXR0ZXIsIGNvbnRleHQpIHtcbiAgY29uc3QgcmVzdWx0ID0gW107XG5cbiAgLy8gUHJvY2VzcyByYW5nZXMgY2FsbGluZyBmb3JtYXR0ZXIgZm9yIGVhY2ggcmFuZ2UuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3BhbnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBzcGFuID0gc3BhbnNbaV07XG4gICAgaWYgKHNwYW4uYXQgPCAwKSB7XG4gICAgICAvLyBBc2sgZm9ybWF0dGVyIGlmIGl0IHdhbnRzIHRvIGRvIGFueXRoaW5nIHdpdGggdGhlIG5vbi12aXN1YWwgc3Bhbi5cbiAgICAgIGNvbnN0IHMgPSBmb3JtYXR0ZXIuY2FsbChjb250ZXh0LCBzcGFuLnRwLCBzcGFuLmRhdGEsIHVuZGVmaW5lZCwgcmVzdWx0Lmxlbmd0aCk7XG4gICAgICBpZiAocykge1xuICAgICAgICByZXN1bHQucHVzaChzKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICAvLyBBZGQgdW4tc3R5bGVkIHJhbmdlIGJlZm9yZSB0aGUgc3R5bGVkIHNwYW4gc3RhcnRzLlxuICAgIGlmIChzdGFydCA8IHNwYW4uYXQpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGZvcm1hdHRlci5jYWxsKGNvbnRleHQsIG51bGwsIHVuZGVmaW5lZCwgbGluZS5zbGljZShzdGFydCwgc3Bhbi5hdCksIHJlc3VsdC5sZW5ndGgpKTtcbiAgICAgIHN0YXJ0ID0gc3Bhbi5hdDtcbiAgICB9XG4gICAgLy8gR2V0IGFsbCBzcGFucyB3aGljaCBhcmUgd2l0aGluIGN1cnJlbnQgc3Bhbi5cbiAgICBjb25zdCBzdWJzcGFucyA9IFtdO1xuICAgIGZvciAobGV0IHNpID0gaSArIDE7IHNpIDwgc3BhbnMubGVuZ3RoICYmIHNwYW5zW3NpXS5hdCA8IHNwYW4uYXQgKyBzcGFuLmxlbjsgc2krKykge1xuICAgICAgc3Vic3BhbnMucHVzaChzcGFuc1tzaV0pO1xuICAgICAgaSA9IHNpO1xuICAgIH1cblxuICAgIGNvbnN0IHRhZyA9IEhUTUxfVEFHU1tzcGFuLnRwXSB8fCB7fVxuICAgIHJlc3VsdC5wdXNoKGZvcm1hdHRlci5jYWxsKGNvbnRleHQsIHNwYW4udHAsIHNwYW4uZGF0YSxcbiAgICAgIHRhZy5pc1ZvaWQgPyBudWxsIDogZm9yRWFjaChsaW5lLCBzdGFydCwgc3Bhbi5hdCArIHNwYW4ubGVuLCBzdWJzcGFucywgZm9ybWF0dGVyLCBjb250ZXh0KSxcbiAgICAgIHJlc3VsdC5sZW5ndGgpKTtcblxuICAgIHN0YXJ0ID0gc3Bhbi5hdCArIHNwYW4ubGVuO1xuICB9XG5cbiAgLy8gQWRkIHRoZSBsYXN0IHVuZm9ybWF0dGVkIHJhbmdlLlxuICBpZiAoc3RhcnQgPCBlbmQpIHtcbiAgICByZXN1bHQucHVzaChmb3JtYXR0ZXIuY2FsbChjb250ZXh0LCBudWxsLCB1bmRlZmluZWQsIGxpbmUuc2xpY2Uoc3RhcnQsIGVuZCksIHJlc3VsdC5sZW5ndGgpKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIERldGVjdCBzdGFydHMgYW5kIGVuZHMgb2YgZm9ybWF0dGluZyBzcGFucy4gVW5mb3JtYXR0ZWQgc3BhbnMgYXJlXG4vLyBpZ25vcmVkIGF0IHRoaXMgc3RhZ2UuXG5mdW5jdGlvbiBzcGFubmlmeShvcmlnaW5hbCwgcmVfc3RhcnQsIHJlX2VuZCwgdHlwZSkge1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IGxpbmUgPSBvcmlnaW5hbC5zbGljZSgwKTsgLy8gbWFrZSBhIGNvcHk7XG5cbiAgd2hpbGUgKGxpbmUubGVuZ3RoID4gMCkge1xuICAgIC8vIG1hdGNoWzBdOyAvLyBtYXRjaCwgbGlrZSAnKmFiYyonXG4gICAgLy8gbWF0Y2hbMV07IC8vIG1hdGNoIGNhcHR1cmVkIGluIHBhcmVudGhlc2lzLCBsaWtlICdhYmMnXG4gICAgLy8gbWF0Y2hbJ2luZGV4J107IC8vIG9mZnNldCB3aGVyZSB0aGUgbWF0Y2ggc3RhcnRlZC5cblxuICAgIC8vIEZpbmQgdGhlIG9wZW5pbmcgdG9rZW4uXG4gICAgY29uc3Qgc3RhcnQgPSByZV9zdGFydC5leGVjKGxpbmUpO1xuICAgIGlmIChzdGFydCA9PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBCZWNhdXNlIGphdmFzY3JpcHQgUmVnRXhwIGRvZXMgbm90IHN1cHBvcnQgbG9va2JlaGluZCwgdGhlIGFjdHVhbCBvZmZzZXQgbWF5IG5vdCBwb2ludFxuICAgIC8vIGF0IHRoZSBtYXJrdXAgY2hhcmFjdGVyLiBGaW5kIGl0IGluIHRoZSBtYXRjaGVkIHN0cmluZy5cbiAgICBsZXQgc3RhcnRfb2Zmc2V0ID0gc3RhcnRbJ2luZGV4J10gKyBzdGFydFswXS5sYXN0SW5kZXhPZihzdGFydFsxXSk7XG4gICAgLy8gQ2xpcCB0aGUgcHJvY2Vzc2VkIHBhcnQgb2YgdGhlIHN0cmluZy5cbiAgICBsaW5lID0gbGluZS5zbGljZShzdGFydF9vZmZzZXQgKyAxKTtcbiAgICAvLyBzdGFydF9vZmZzZXQgaXMgYW4gb2Zmc2V0IHdpdGhpbiB0aGUgY2xpcHBlZCBzdHJpbmcuIENvbnZlcnQgdG8gb3JpZ2luYWwgaW5kZXguXG4gICAgc3RhcnRfb2Zmc2V0ICs9IGluZGV4O1xuICAgIC8vIEluZGV4IG5vdyBwb2ludCB0byB0aGUgYmVnaW5uaW5nIG9mICdsaW5lJyB3aXRoaW4gdGhlICdvcmlnaW5hbCcgc3RyaW5nLlxuICAgIGluZGV4ID0gc3RhcnRfb2Zmc2V0ICsgMTtcblxuICAgIC8vIEZpbmQgdGhlIG1hdGNoaW5nIGNsb3NpbmcgdG9rZW4uXG4gICAgY29uc3QgZW5kID0gcmVfZW5kID8gcmVfZW5kLmV4ZWMobGluZSkgOiBudWxsO1xuICAgIGlmIChlbmQgPT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGxldCBlbmRfb2Zmc2V0ID0gZW5kWydpbmRleCddICsgZW5kWzBdLmluZGV4T2YoZW5kWzFdKTtcbiAgICAvLyBDbGlwIHRoZSBwcm9jZXNzZWQgcGFydCBvZiB0aGUgc3RyaW5nLlxuICAgIGxpbmUgPSBsaW5lLnNsaWNlKGVuZF9vZmZzZXQgKyAxKTtcbiAgICAvLyBVcGRhdGUgb2Zmc2V0c1xuICAgIGVuZF9vZmZzZXQgKz0gaW5kZXg7XG4gICAgLy8gSW5kZXggbm93IHBvaW50IHRvIHRoZSBiZWdpbm5pbmcgb2YgJ2xpbmUnIHdpdGhpbiB0aGUgJ29yaWdpbmFsJyBzdHJpbmcuXG4gICAgaW5kZXggPSBlbmRfb2Zmc2V0ICsgMTtcblxuICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgIHRleHQ6IG9yaWdpbmFsLnNsaWNlKHN0YXJ0X29mZnNldCArIDEsIGVuZF9vZmZzZXQpLFxuICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgc3RhcnQ6IHN0YXJ0X29mZnNldCxcbiAgICAgIGVuZDogZW5kX29mZnNldCxcbiAgICAgIHR5cGU6IHR5cGVcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIENvbnZlcnQgbGluZWFyIGFycmF5IG9yIHNwYW5zIGludG8gYSB0cmVlIHJlcHJlc2VudGF0aW9uLlxuLy8gS2VlcCBzdGFuZGFsb25lIGFuZCBuZXN0ZWQgc3BhbnMsIHRocm93IGF3YXkgcGFydGlhbGx5IG92ZXJsYXBwaW5nIHNwYW5zLlxuZnVuY3Rpb24gdG9UcmVlKHNwYW5zKSB7XG4gIGlmIChzcGFucy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IHRyZWUgPSBbc3BhbnNbMF1dO1xuICBsZXQgbGFzdCA9IHNwYW5zWzBdO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHNwYW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gS2VlcCBzcGFucyB3aGljaCBzdGFydCBhZnRlciB0aGUgZW5kIG9mIHRoZSBwcmV2aW91cyBzcGFuIG9yIHRob3NlIHdoaWNoXG4gICAgLy8gYXJlIGNvbXBsZXRlIHdpdGhpbiB0aGUgcHJldmlvdXMgc3Bhbi5cblxuICAgIGlmIChzcGFuc1tpXS5zdGFydCA+IGxhc3QuZW5kKSB7XG4gICAgICAvLyBTcGFuIGlzIGNvbXBsZXRlbHkgb3V0c2lkZSBvZiB0aGUgcHJldmlvdXMgc3Bhbi5cbiAgICAgIHRyZWUucHVzaChzcGFuc1tpXSk7XG4gICAgICBsYXN0ID0gc3BhbnNbaV07XG4gICAgfSBlbHNlIGlmIChzcGFuc1tpXS5lbmQgPCBsYXN0LmVuZCkge1xuICAgICAgLy8gU3BhbiBpcyBmdWxseSBpbnNpZGUgb2YgdGhlIHByZXZpb3VzIHNwYW4uIFB1c2ggdG8gc3Vibm9kZS5cbiAgICAgIGxhc3QuY2hpbGRyZW4ucHVzaChzcGFuc1tpXSk7XG4gICAgfVxuICAgIC8vIFNwYW4gY291bGQgcGFydGlhbGx5IG92ZXJsYXAsIGlnbm9yaW5nIGl0IGFzIGludmFsaWQuXG4gIH1cblxuICAvLyBSZWN1cnNpdmVseSByZWFycmFuZ2UgdGhlIHN1Ym5vZGVzLlxuICBmb3IgKGxldCBpIGluIHRyZWUpIHtcbiAgICB0cmVlW2ldLmNoaWxkcmVuID0gdG9UcmVlKHRyZWVbaV0uY2hpbGRyZW4pO1xuICB9XG5cbiAgcmV0dXJuIHRyZWU7XG59XG5cbi8vIEdldCBhIGxpc3Qgb2YgZW50aXRpZXMgZnJvbSBhIHRleHQuXG5mdW5jdGlvbiBleHRyYWN0RW50aXRpZXMobGluZSkge1xuICBsZXQgbWF0Y2g7XG4gIGxldCBleHRyYWN0ZWQgPSBbXTtcbiAgRU5USVRZX1RZUEVTLm1hcChmdW5jdGlvbihlbnRpdHkpIHtcbiAgICB3aGlsZSAoKG1hdGNoID0gZW50aXR5LnJlLmV4ZWMobGluZSkpICE9PSBudWxsKSB7XG4gICAgICBleHRyYWN0ZWQucHVzaCh7XG4gICAgICAgIG9mZnNldDogbWF0Y2hbJ2luZGV4J10sXG4gICAgICAgIGxlbjogbWF0Y2hbMF0ubGVuZ3RoLFxuICAgICAgICB1bmlxdWU6IG1hdGNoWzBdLFxuICAgICAgICBkYXRhOiBlbnRpdHkucGFjayhtYXRjaFswXSksXG4gICAgICAgIHR5cGU6IGVudGl0eS5uYW1lXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChleHRyYWN0ZWQubGVuZ3RoID09IDApIHtcbiAgICByZXR1cm4gZXh0cmFjdGVkO1xuICB9XG5cbiAgLy8gUmVtb3ZlIGVudGl0aWVzIGRldGVjdGVkIGluc2lkZSBvdGhlciBlbnRpdGllcywgbGlrZSAjaGFzaHRhZyBpbiBhIFVSTC5cbiAgZXh0cmFjdGVkLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhLm9mZnNldCAtIGIub2Zmc2V0O1xuICB9KTtcblxuICBsZXQgaWR4ID0gLTE7XG4gIGV4dHJhY3RlZCA9IGV4dHJhY3RlZC5maWx0ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBjb25zdCByZXN1bHQgPSAoZWwub2Zmc2V0ID4gaWR4KTtcbiAgICBpZHggPSBlbC5vZmZzZXQgKyBlbC5sZW47XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG5cbiAgcmV0dXJuIGV4dHJhY3RlZDtcbn1cblxuLy8gQ29udmVydCB0aGUgY2h1bmtzIGludG8gZm9ybWF0IHN1aXRhYmxlIGZvciBzZXJpYWxpemF0aW9uLlxuZnVuY3Rpb24gZHJhZnRpZnkoY2h1bmtzLCBzdGFydEF0KSB7XG4gIGxldCBwbGFpbiA9IFwiXCI7XG4gIGxldCByYW5nZXMgPSBbXTtcbiAgZm9yIChsZXQgaSBpbiBjaHVua3MpIHtcbiAgICBjb25zdCBjaHVuayA9IGNodW5rc1tpXTtcbiAgICBpZiAoIWNodW5rLnRleHQpIHtcbiAgICAgIGNvbnN0IGRyYWZ0eSA9IGRyYWZ0aWZ5KGNodW5rLmNoaWxkcmVuLCBwbGFpbi5sZW5ndGggKyBzdGFydEF0KTtcbiAgICAgIGNodW5rLnRleHQgPSBkcmFmdHkudHh0O1xuICAgICAgcmFuZ2VzID0gcmFuZ2VzLmNvbmNhdChkcmFmdHkuZm10KTtcbiAgICB9XG5cbiAgICBpZiAoY2h1bmsudHlwZSkge1xuICAgICAgcmFuZ2VzLnB1c2goe1xuICAgICAgICBhdDogcGxhaW4ubGVuZ3RoICsgc3RhcnRBdCxcbiAgICAgICAgbGVuOiBjaHVuay50ZXh0Lmxlbmd0aCxcbiAgICAgICAgdHA6IGNodW5rLnR5cGVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHBsYWluICs9IGNodW5rLnRleHQ7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0eHQ6IHBsYWluLFxuICAgIGZtdDogcmFuZ2VzXG4gIH07XG59XG5cbi8vIFNwbGljZSB0d28gc3RyaW5nczogaW5zZXJ0IHNlY29uZCBzdHJpbmcgaW50byB0aGUgZmlyc3Qgb25lIGF0IHRoZSBnaXZlbiBpbmRleFxuZnVuY3Rpb24gc3BsaWNlKHNyYywgYXQsIGluc2VydCkge1xuICByZXR1cm4gc3JjLnNsaWNlKDAsIGF0KSArIGluc2VydCArIHNyYy5zbGljZShhdCk7XG59XG5cbi8qKlxuICogUGFyc2UgcGxhaW4gdGV4dCBpbnRvIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gY29udGVudCAtIHBsYWluLXRleHQgY29udGVudCB0byBwYXJzZS5cbiAqIEByZXR1cm4ge0RyYWZ0eX0gcGFyc2VkIGRvY3VtZW50IG9yIG51bGwgaWYgdGhlIHNvdXJjZSBpcyBub3QgcGxhaW4gdGV4dC5cbiAqL1xuRHJhZnR5LnBhcnNlID0gZnVuY3Rpb24oY29udGVudCkge1xuICAvLyBNYWtlIHN1cmUgd2UgYXJlIHBhcnNpbmcgc3RyaW5ncyBvbmx5LlxuICBpZiAodHlwZW9mIGNvbnRlbnQgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFNwbGl0IHRleHQgaW50byBsaW5lcy4gSXQgbWFrZXMgZnVydGhlciBwcm9jZXNzaW5nIGVhc2llci5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgLy8gSG9sZHMgZW50aXRpZXMgcmVmZXJlbmNlZCBmcm9tIHRleHRcbiAgY29uc3QgZW50aXR5TWFwID0gW107XG4gIGNvbnN0IGVudGl0eUluZGV4ID0ge307XG5cbiAgLy8gUHJvY2Vzc2luZyBsaW5lcyBvbmUgYnkgb25lLCBob2xkIGludGVybWVkaWF0ZSByZXN1bHQgaW4gYmx4LlxuICBjb25zdCBibHggPSBbXTtcbiAgbGluZXMubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICBsZXQgc3BhbnMgPSBbXTtcbiAgICBsZXQgZW50aXRpZXM7XG5cbiAgICAvLyBGaW5kIGZvcm1hdHRlZCBzcGFucyBpbiB0aGUgc3RyaW5nLlxuICAgIC8vIFRyeSB0byBtYXRjaCBlYWNoIHN0eWxlLlxuICAgIElOTElORV9TVFlMRVMubWFwKGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgICAvLyBFYWNoIHN0eWxlIGNvdWxkIGJlIG1hdGNoZWQgbXVsdGlwbGUgdGltZXMuXG4gICAgICBzcGFucyA9IHNwYW5zLmNvbmNhdChzcGFubmlmeShsaW5lLCBzdHlsZS5zdGFydCwgc3R5bGUuZW5kLCBzdHlsZS5uYW1lKSk7XG4gICAgfSk7XG5cbiAgICBsZXQgYmxvY2s7XG4gICAgaWYgKHNwYW5zLmxlbmd0aCA9PSAwKSB7XG4gICAgICBibG9jayA9IHtcbiAgICAgICAgdHh0OiBsaW5lXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTb3J0IHNwYW5zIGJ5IHN0eWxlIG9jY3VyZW5jZSBlYXJseSAtPiBsYXRlXG4gICAgICBzcGFucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEuc3RhcnQgLSBiLnN0YXJ0O1xuICAgICAgfSk7XG5cbiAgICAgIC8vIENvbnZlcnQgYW4gYXJyYXkgb2YgcG9zc2libHkgb3ZlcmxhcHBpbmcgc3BhbnMgaW50byBhIHRyZWVcbiAgICAgIHNwYW5zID0gdG9UcmVlKHNwYW5zKTtcblxuICAgICAgLy8gQnVpbGQgYSB0cmVlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBlbnRpcmUgc3RyaW5nLCBub3RcbiAgICAgIC8vIGp1c3QgdGhlIGZvcm1hdHRlZCBwYXJ0cy5cbiAgICAgIGNvbnN0IGNodW5rcyA9IGNodW5raWZ5KGxpbmUsIDAsIGxpbmUubGVuZ3RoLCBzcGFucyk7XG5cbiAgICAgIGNvbnN0IGRyYWZ0eSA9IGRyYWZ0aWZ5KGNodW5rcywgMCk7XG5cbiAgICAgIGJsb2NrID0ge1xuICAgICAgICB0eHQ6IGRyYWZ0eS50eHQsXG4gICAgICAgIGZtdDogZHJhZnR5LmZtdFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBFeHRyYWN0IGVudGl0aWVzIGZyb20gdGhlIGNsZWFuZWQgdXAgc3RyaW5nLlxuICAgIGVudGl0aWVzID0gZXh0cmFjdEVudGl0aWVzKGJsb2NrLnR4dCk7XG4gICAgaWYgKGVudGl0aWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHJhbmdlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSBpbiBlbnRpdGllcykge1xuICAgICAgICAvLyB7b2Zmc2V0OiBtYXRjaFsnaW5kZXgnXSwgdW5pcXVlOiBtYXRjaFswXSwgbGVuOiBtYXRjaFswXS5sZW5ndGgsIGRhdGE6IGVudC5wYWNrZXIoKSwgdHlwZTogZW50Lm5hbWV9XG4gICAgICAgIGNvbnN0IGVudGl0eSA9IGVudGl0aWVzW2ldO1xuICAgICAgICBsZXQgaW5kZXggPSBlbnRpdHlJbmRleFtlbnRpdHkudW5pcXVlXTtcbiAgICAgICAgaWYgKCFpbmRleCkge1xuICAgICAgICAgIGluZGV4ID0gZW50aXR5TWFwLmxlbmd0aDtcbiAgICAgICAgICBlbnRpdHlJbmRleFtlbnRpdHkudW5pcXVlXSA9IGluZGV4O1xuICAgICAgICAgIGVudGl0eU1hcC5wdXNoKHtcbiAgICAgICAgICAgIHRwOiBlbnRpdHkudHlwZSxcbiAgICAgICAgICAgIGRhdGE6IGVudGl0eS5kYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmFuZ2VzLnB1c2goe1xuICAgICAgICAgIGF0OiBlbnRpdHkub2Zmc2V0LFxuICAgICAgICAgIGxlbjogZW50aXR5LmxlbixcbiAgICAgICAgICBrZXk6IGluZGV4XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgYmxvY2suZW50ID0gcmFuZ2VzO1xuICAgIH1cblxuICAgIGJseC5wdXNoKGJsb2NrKTtcbiAgfSk7XG5cbiAgY29uc3QgcmVzdWx0ID0ge1xuICAgIHR4dDogXCJcIlxuICB9O1xuXG4gIC8vIE1lcmdlIGxpbmVzIGFuZCBzYXZlIGxpbmUgYnJlYWtzIGFzIEJSIGlubGluZSBmb3JtYXR0aW5nLlxuICBpZiAoYmx4Lmxlbmd0aCA+IDApIHtcbiAgICByZXN1bHQudHh0ID0gYmx4WzBdLnR4dDtcbiAgICByZXN1bHQuZm10ID0gKGJseFswXS5mbXQgfHwgW10pLmNvbmNhdChibHhbMF0uZW50IHx8IFtdKTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYmx4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBibG9jayA9IGJseFtpXTtcbiAgICAgIGNvbnN0IG9mZnNldCA9IHJlc3VsdC50eHQubGVuZ3RoICsgMTtcblxuICAgICAgcmVzdWx0LmZtdC5wdXNoKHtcbiAgICAgICAgdHA6ICdCUicsXG4gICAgICAgIGxlbjogMSxcbiAgICAgICAgYXQ6IG9mZnNldCAtIDFcbiAgICAgIH0pO1xuXG4gICAgICByZXN1bHQudHh0ICs9IFwiIFwiICsgYmxvY2sudHh0O1xuICAgICAgaWYgKGJsb2NrLmZtdCkge1xuICAgICAgICByZXN1bHQuZm10ID0gcmVzdWx0LmZtdC5jb25jYXQoYmxvY2suZm10Lm1hcChmdW5jdGlvbihzKSB7XG4gICAgICAgICAgcy5hdCArPSBvZmZzZXQ7XG4gICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIGlmIChibG9jay5lbnQpIHtcbiAgICAgICAgcmVzdWx0LmZtdCA9IHJlc3VsdC5mbXQuY29uY2F0KGJsb2NrLmVudC5tYXAoZnVuY3Rpb24ocykge1xuICAgICAgICAgIHMuYXQgKz0gb2Zmc2V0O1xuICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC5mbXQubGVuZ3RoID09IDApIHtcbiAgICAgIGRlbGV0ZSByZXN1bHQuZm10O1xuICAgIH1cblxuICAgIGlmIChlbnRpdHlNYXAubGVuZ3RoID4gMCkge1xuICAgICAgcmVzdWx0LmVudCA9IGVudGl0eU1hcDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIERyYWZ0eSBkb2N1bWVudCB0byBhIHBsYWluIHRleHQgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwbGFpblRleHQgLSBzdHJpbmcgdG8gdXNlIGFzIERyYWZ0eSBjb250ZW50LlxuICpcbiAqIEByZXR1cm5zIG5ldyBEcmFmdHkgZG9jdW1lbnQgb3IgbnVsbCBpcyBwbGFpblRleHQgaXMgbm90IGEgc3RyaW5nLlxuICovXG5EcmFmdHkuaW5pdCA9IGZ1bmN0aW9uKHBsYWluVGV4dCkge1xuICBpZiAodHlwZW9mIHBsYWluVGV4dCAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB7XG4gICAgdHh0OiBwbGFpblRleHRcbiAgfTtcbn1cblxuLyoqXG4gKiBBcHBlbmQgb25lIERyYWZ0eSBkb2N1bWVudCB0byBhbm90aGVyLlxuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBmaXJzdCAtIERyYWZ0eSBkb2N1bWVudCB0byBhcHBlbmQgdG8uXG4gKiBAcGFyYW0ge0RyYWZ0eX0gc2Vjb25kIC0gRHJhZnR5IGRvY3VtZW50IGJlaW5nIGFwcGVuZGVkLlxuICpcbiAqIEByZXR1cm4ge0RyYWZ0eX0gZmlyc3QgZG9jdW1lbnQgd2l0aCB0aGUgc2Vjb25kIGFwcGVuZGVkIHRvIGl0LlxuICovXG5EcmFmdHkuYXBwZW5kID0gZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xuICBpZiAoZmlyc3QgPT0gbnVsbCkge1xuICAgIHJldHVybiBzZWNvbmQ7XG4gIH1cbiAgaWYgKHNlY29uZCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZpcnN0O1xuICB9XG5cbiAgZmlyc3QudHh0ID0gZmlyc3QudHh0IHx8ICcnO1xuICBzZWNvbmQudHh0ID0gc2Vjb25kLnR4dCB8fCAnJztcbiAgY29uc3QgbGVuID0gZmlyc3QudHh0Lmxlbmd0aDtcblxuICBmaXJzdC50eHQgKz0gc2Vjb25kLnR4dDtcbiAgaWYgKEFycmF5LmlzQXJyYXkoc2Vjb25kLmZtdCkpIHtcbiAgICBmaXJzdC5mbXQgPSBmaXJzdC5mbXQgfHwgW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2Vjb25kLmVudCkpIHtcbiAgICAgIGZpcnN0LmVudCA9IGZpcnN0LmVudCB8fCBbXTtcbiAgICB9XG4gICAgc2Vjb25kLmZtdC5mb3JFYWNoKHNyYyA9PiB7XG4gICAgICBjb25zdCBmbXQgPSB7XG4gICAgICAgIGF0OiBzcmMuYXQgKyBsZW4sXG4gICAgICAgIGxlbjogc3JjLmxlblxuICAgICAgfTtcbiAgICAgIGlmIChzcmMudHApIHtcbiAgICAgICAgZm10LnRwID0gc3JjLnRwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm10LmtleSA9IGZpcnN0LmVudC5sZW5ndGg7XG4gICAgICAgIGZpcnN0LmVudC5wdXNoKHNlY29uZC5lbnRbc3JjLmtleSB8fCAwXSk7XG4gICAgICB9XG4gICAgICBmaXJzdC5mbXQucHVzaChmbXQpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGZpcnN0O1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIERyYWZ0eS5JbWFnZURlc2NcbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEB0eXBlIE9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IG1pbWUgLSBtaW1lLXR5cGUgb2YgdGhlIGltYWdlLCBlLmcuIFwiaW1hZ2UvcG5nXCJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmV2aWV3IC0gYmFzZTY0LWVuY29kZWQgaW1hZ2UgY29udGVudCAob3IgcHJldmlldywgaWYgbGFyZ2UgaW1hZ2UgaXMgYXR0YWNoZWQpLiBDb3VsZCBiZSBudWxsL3VuZGVmaW5lZC5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gd2lkdGggLSB3aWR0aCBvZiB0aGUgaW1hZ2VcbiAqIEBwYXJhbSB7aW50ZWdlcn0gaGVpZ2h0IC0gaGVpZ2h0IG9mIHRoZSBpbWFnZVxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gZmlsZSBuYW1lIHN1Z2dlc3Rpb24gZm9yIGRvd25sb2FkaW5nIHRoZSBpbWFnZS5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gc2l6ZSAtIHNpemUgb2YgdGhlIGltYWdlIGluIGJ5dGVzLiBUcmVhdCBpcyBhcyBhbiB1bnRydXN0ZWQgaGludC5cbiAqIEBwYXJhbSB7c3RyaW5nfSByZWZ1cmwgLSByZWZlcmVuY2UgdG8gdGhlIGNvbnRlbnQuIENvdWxkIGJlIG51bGwvdW5kZWZpbmVkLlxuICogQHBhcmFtIHtzdHJpbmd9IF90ZW1wUHJldmlldyAtIGJhc2U2NC1lbmNvZGVkIGltYWdlIHByZXZpZXcgdXNlZCBkdXJpbmcgdXBsb2FkIHByb2Nlc3M7IG5vdCBzZXJpYWxpemFibGUuXG4gKiBAcGFyYW0ge1Byb21pc2V9IHVybFByb21pc2UgLSBQcm9taXNlIHdoaWNoIHJldHVybnMgY29udGVudCBVUkwgd2hlbiByZXNvbHZlZC5cbiAqL1xuXG4vKipcbiAqIEluc2VydCBpbmxpbmUgaW1hZ2UgaW50byBEcmFmdHkgZG9jdW1lbnQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBkb2N1bWVudCB0byBhZGQgaW1hZ2UgdG8uXG4gKiBAcGFyYW0ge2ludGVnZXJ9IGF0IC0gaW5kZXggd2hlcmUgdGhlIG9iamVjdCBpcyBpbnNlcnRlZC4gVGhlIGxlbmd0aCBvZiB0aGUgaW1hZ2UgaXMgYWx3YXlzIDEuXG4gKiBAcGFyYW0ge0ltYWdlRGVzY30gaW1hZ2VEZXNjIC0gb2JqZWN0IHdpdGggaW1hZ2UgcGFyYW1lbmV0cyBhbmQgZGF0YS5cbiAqXG4gKiBAcmV0dXJuIHtEcmFmdHl9IHVwZGF0ZWQgZG9jdW1lbnQuXG4gKi9cbkRyYWZ0eS5pbnNlcnRJbWFnZSA9IGZ1bmN0aW9uKGNvbnRlbnQsIGF0LCBpbWFnZURlc2MpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogXCIgXCJcbiAgfTtcbiAgY29udGVudC5lbnQgPSBjb250ZW50LmVudCB8fCBbXTtcbiAgY29udGVudC5mbXQgPSBjb250ZW50LmZtdCB8fCBbXTtcblxuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogYXQsXG4gICAgbGVuOiAxLFxuICAgIGtleTogY29udGVudC5lbnQubGVuZ3RoXG4gIH0pO1xuXG4gIGNvbnN0IGV4ID0ge1xuICAgIHRwOiAnSU0nLFxuICAgIGRhdGE6IHtcbiAgICAgIG1pbWU6IGltYWdlRGVzYy5taW1lLFxuICAgICAgdmFsOiBpbWFnZURlc2MucHJldmlldyxcbiAgICAgIHdpZHRoOiBpbWFnZURlc2Mud2lkdGgsXG4gICAgICBoZWlnaHQ6IGltYWdlRGVzYy5oZWlnaHQsXG4gICAgICBuYW1lOiBpbWFnZURlc2MuZmlsZW5hbWUsXG4gICAgICBzaXplOiBpbWFnZURlc2Muc2l6ZSB8IDAsXG4gICAgICByZWY6IGltYWdlRGVzYy5yZWZ1cmxcbiAgICB9XG4gIH07XG5cbiAgaWYgKGltYWdlRGVzYy51cmxQcm9taXNlKSB7XG4gICAgZXguZGF0YS5fdGVtcFByZXZpZXcgPSBpbWFnZURlc2MuX3RlbXBQcmV2aWV3O1xuICAgIGV4LmRhdGEuX3Byb2Nlc3NpbmcgPSB0cnVlO1xuICAgIGltYWdlRGVzYy51cmxQcm9taXNlLnRoZW4oXG4gICAgICAodXJsKSA9PiB7XG4gICAgICAgIGV4LmRhdGEucmVmID0gdXJsO1xuICAgICAgICBleC5kYXRhLl90ZW1wUHJldmlldyA9IHVuZGVmaW5lZDtcbiAgICAgICAgZXguZGF0YS5fcHJvY2Vzc2luZyA9IHVuZGVmaW5lZDtcbiAgICAgIH0sXG4gICAgICAoZXJyKSA9PiB7XG4gICAgICAgIC8qIGNhdGNoIHRoZSBlcnJvciwgb3RoZXJ3aXNlIGl0IHdpbGwgYXBwZWFyIGluIHRoZSBjb25zb2xlLiAqL1xuICAgICAgICBleC5kYXRhLl9wcm9jZXNzaW5nID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBjb250ZW50LmVudC5wdXNoKGV4KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBBcHBlbmQgaW5saW5lIGltYWdlIHRvIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGRvY3VtZW50IHRvIGFkZCBpbWFnZSB0by5cbiAqIEBwYXJhbSB7SW1hZ2VEZXNjfSBpbWFnZURlc2MgLSBvYmplY3Qgd2l0aCBpbWFnZSBwYXJhbWVuZXRzLlxuICpcbiAqIEByZXR1cm4ge0RyYWZ0eX0gdXBkYXRlZCBkb2N1bWVudC5cbiAqL1xuRHJhZnR5LmFwcGVuZEltYWdlID0gZnVuY3Rpb24oY29udGVudCwgaW1hZ2VEZXNjKSB7XG4gIGNvbnRlbnQgPSBjb250ZW50IHx8IHtcbiAgICB0eHQ6IFwiXCJcbiAgfTtcbiAgY29udGVudC50eHQgKz0gXCIgXCI7XG4gIHJldHVybiBEcmFmdHkuaW5zZXJ0SW1hZ2UoY29udGVudCwgY29udGVudC50eHQubGVuZ3RoIC0gMSwgaW1hZ2VEZXNjKTtcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiBEcmFmdHkuQXR0YWNobWVudERlc2NcbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEB0eXBlIE9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IG1pbWUgLSBtaW1lLXR5cGUgb2YgdGhlIGltYWdlLCBlLmcuIFwiaW1hZ2UvcG5nXCJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhIC0gYmFzZTY0LWVuY29kZWQgaW4tYmFuZCBjb250ZW50IG9mIHNtYWxsIGF0dGFjaG1lbnRzLiBDb3VsZCBiZSBudWxsL3VuZGVmaW5lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIGZpbGUgbmFtZSBzdWdnZXN0aW9uIGZvciBkb3dubG9hZGluZyB0aGUgYXR0YWNobWVudC5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gc2l6ZSAtIHNpemUgb2YgdGhlIGZpbGUgaW4gYnl0ZXMuIFRyZWF0IGlzIGFzIGFuIHVudHJ1c3RlZCBoaW50LlxuICogQHBhcmFtIHtzdHJpbmd9IHJlZnVybCAtIHJlZmVyZW5jZSB0byB0aGUgb3V0LW9mLWJhbmQgY29udGVudC4gQ291bGQgYmUgbnVsbC91bmRlZmluZWQuXG4gKiBAcGFyYW0ge1Byb21pc2V9IHVybFByb21pc2UgLSBQcm9taXNlIHdoaWNoIHJldHVybnMgY29udGVudCBVUkwgd2hlbiByZXNvbHZlZC5cbiAqL1xuXG4vKipcbiAqIEF0dGFjaCBmaWxlIHRvIERyYWZ0eSBjb250ZW50LiBFaXRoZXIgYXMgYSBibG9iIG9yIGFzIGEgcmVmZXJlbmNlLlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBjb250ZW50IC0gZG9jdW1lbnQgdG8gYXR0YWNoIGZpbGUgdG8uXG4gKiBAcGFyYW0ge0F0dGFjaG1lbnREZXNjfSBvYmplY3QgLSBjb250YWluaW5nIGF0dGFjaG1lbnQgZGVzY3JpcHRpb24gYW5kIGRhdGEuXG4gKlxuICogQHJldHVybiB7RHJhZnR5fSB1cGRhdGVkIGRvY3VtZW50LlxuICovXG5EcmFmdHkuYXR0YWNoRmlsZSA9IGZ1bmN0aW9uKGNvbnRlbnQsIGF0dGFjaG1lbnREZXNjKSB7XG4gIGNvbnRlbnQgPSBjb250ZW50IHx8IHtcbiAgICB0eHQ6IFwiXCJcbiAgfTtcbiAgY29udGVudC5lbnQgPSBjb250ZW50LmVudCB8fCBbXTtcbiAgY29udGVudC5mbXQgPSBjb250ZW50LmZtdCB8fCBbXTtcblxuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogLTEsXG4gICAgbGVuOiAwLFxuICAgIGtleTogY29udGVudC5lbnQubGVuZ3RoXG4gIH0pO1xuXG4gIGNvbnN0IGV4ID0ge1xuICAgIHRwOiAnRVgnLFxuICAgIGRhdGE6IHtcbiAgICAgIG1pbWU6IGF0dGFjaG1lbnREZXNjLm1pbWUsXG4gICAgICB2YWw6IGF0dGFjaG1lbnREZXNjLmRhdGEsXG4gICAgICBuYW1lOiBhdHRhY2htZW50RGVzYy5maWxlbmFtZSxcbiAgICAgIHJlZjogYXR0YWNobWVudERlc2MucmVmdXJsLFxuICAgICAgc2l6ZTogYXR0YWNobWVudERlc2Muc2l6ZSB8IDBcbiAgICB9XG4gIH1cbiAgaWYgKGF0dGFjaG1lbnREZXNjLnVybFByb21pc2UpIHtcbiAgICBleC5kYXRhLl9wcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICBhdHRhY2htZW50RGVzYy51cmxQcm9taXNlLnRoZW4oXG4gICAgICAodXJsKSA9PiB7XG4gICAgICAgIGV4LmRhdGEucmVmID0gdXJsO1xuICAgICAgICBleC5kYXRhLl9wcm9jZXNzaW5nID0gdW5kZWZpbmVkO1xuICAgICAgfSxcbiAgICAgIChlcnIpID0+IHtcbiAgICAgICAgLyogY2F0Y2ggdGhlIGVycm9yLCBvdGhlcndpc2UgaXQgd2lsbCBhcHBlYXIgaW4gdGhlIGNvbnNvbGUuICovXG4gICAgICAgIGV4LmRhdGEuX3Byb2Nlc3NpbmcgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICBjb250ZW50LmVudC5wdXNoKGV4KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBXcmFwcyBjb250ZW50IGludG8gYW4gaW50ZXJhY3RpdmUgZm9ybS5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eXxzdHJpbmd9IGNvbnRlbnQgLSB0byB3cmFwIGludG8gYSBmb3JtLlxuICogQHBhcmFtIHtudW1iZXJ9IGF0IC0gaW5kZXggd2hlcmUgdGhlIGZvcm1zIHN0YXJ0cy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gLSBsZW5ndGggb2YgdGhlIGZvcm0gY29udGVudC5cbiAqXG4gKiBAcmV0dXJuIHtEcmFmdHl9IHVwZGF0ZWQgZG9jdW1lbnQuXG4gKi9cbkRyYWZ0eS53cmFwQXNGb3JtID0gZnVuY3Rpb24oY29udGVudCwgYXQsIGxlbikge1xuICBpZiAodHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycpIHtcbiAgICBjb250ZW50ID0ge1xuICAgICAgdHh0OiBjb250ZW50XG4gICAgfTtcbiAgfVxuICBjb250ZW50LmZtdCA9IGNvbnRlbnQuZm10IHx8IFtdO1xuXG4gIGNvbnRlbnQuZm10LnB1c2goe1xuICAgIGF0OiBhdCxcbiAgICBsZW46IGxlbixcbiAgICB0cDogJ0ZNJ1xuICB9KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBJbnNlcnQgY2xpY2thYmxlIGJ1dHRvbiBpbnRvIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eXxzdHJpbmd9IGNvbnRlbnQgLSBEcmFmdHkgZG9jdW1lbnQgdG8gaW5zZXJ0IGJ1dHRvbiB0byBvciBhIHN0cmluZyB0byBiZSB1c2VkIGFzIGJ1dHRvbiB0ZXh0LlxuICogQHBhcmFtIHtudW1iZXJ9IGF0IC0gbG9jYXRpb24gd2hlcmUgdGhlIGJ1dHRvbiBpcyBpbnNlcnRlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gLSB0aGUgbGVuZ3RoIG9mIHRoZSB0ZXh0IHRvIGJlIHVzZWQgYXMgYnV0dG9uIHRpdGxlLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSB0aGUgYnV0dG9uLiBDbGllbnQgc2hvdWxkIHJldHVybiBpdCB0byB0aGUgc2VydmVyIHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkLlxuICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvblR5cGUgLSB0aGUgdHlwZSBvZiB0aGUgYnV0dG9uLCBvbmUgb2YgJ3VybCcgb3IgJ3B1YicuXG4gKiBAcGFyYW0ge3N0cmluZ30gYWN0aW9uVmFsdWUgLSB0aGUgdmFsdWUgdG8gcmV0dXJuIG9uIGNsaWNrOlxuICogQHBhcmFtIHtzdHJpbmd9IHJlZlVybCAtIHRoZSBVUkwgdG8gZ28gdG8gd2hlbiB0aGUgJ3VybCcgYnV0dG9uIGlzIGNsaWNrZWQuXG4gKlxuICogQHJldHVybiB7RHJhZnR5fSB1cGRhdGVkIGRvY3VtZW50LlxuICovXG5EcmFmdHkuaW5zZXJ0QnV0dG9uID0gZnVuY3Rpb24oY29udGVudCwgYXQsIGxlbiwgbmFtZSwgYWN0aW9uVHlwZSwgYWN0aW9uVmFsdWUsIHJlZlVybCkge1xuICBpZiAodHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycpIHtcbiAgICBjb250ZW50ID0ge1xuICAgICAgdHh0OiBjb250ZW50XG4gICAgfTtcbiAgfVxuXG4gIGlmICghY29udGVudCB8fCAhY29udGVudC50eHQgfHwgY29udGVudC50eHQubGVuZ3RoIDwgYXQgKyBsZW4pIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChsZW4gPD0gMCB8fCBbJ3VybCcsICdwdWInXS5pbmRleE9mKGFjdGlvblR5cGUpID09IC0xKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gRW5zdXJlIHJlZlVybCBpcyBhIHN0cmluZy5cbiAgaWYgKGFjdGlvblR5cGUgPT0gJ3VybCcgJiYgIXJlZlVybCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJlZlVybCA9ICcnICsgcmVmVXJsO1xuXG4gIGNvbnRlbnQuZW50ID0gY29udGVudC5lbnQgfHwgW107XG4gIGNvbnRlbnQuZm10ID0gY29udGVudC5mbXQgfHwgW107XG5cbiAgY29udGVudC5mbXQucHVzaCh7XG4gICAgYXQ6IGF0LFxuICAgIGxlbjogbGVuLFxuICAgIGtleTogY29udGVudC5lbnQubGVuZ3RoXG4gIH0pO1xuICBjb250ZW50LmVudC5wdXNoKHtcbiAgICB0cDogJ0JOJyxcbiAgICBkYXRhOiB7XG4gICAgICBhY3Q6IGFjdGlvblR5cGUsXG4gICAgICB2YWw6IGFjdGlvblZhbHVlLFxuICAgICAgcmVmOiByZWZVcmwsXG4gICAgICBuYW1lOiBuYW1lXG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBBcHBlbmQgY2xpY2thYmxlIGJ1dHRvbiB0byBEcmFmdHkgZG9jdW1lbnQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl8c3RyaW5nfSBjb250ZW50IC0gRHJhZnR5IGRvY3VtZW50IHRvIGluc2VydCBidXR0b24gdG8gb3IgYSBzdHJpbmcgdG8gYmUgdXNlZCBhcyBidXR0b24gdGV4dC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0aXRsZSAtIHRoZSB0ZXh0IHRvIGJlIHVzZWQgYXMgYnV0dG9uIHRpdGxlLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSB0aGUgYnV0dG9uLiBDbGllbnQgc2hvdWxkIHJldHVybiBpdCB0byB0aGUgc2VydmVyIHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkLlxuICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvblR5cGUgLSB0aGUgdHlwZSBvZiB0aGUgYnV0dG9uLCBvbmUgb2YgJ3VybCcgb3IgJ3B1YicuXG4gKiBAcGFyYW0ge3N0cmluZ30gYWN0aW9uVmFsdWUgLSB0aGUgdmFsdWUgdG8gcmV0dXJuIG9uIGNsaWNrOlxuICogQHBhcmFtIHtzdHJpbmd9IHJlZlVybCAtIHRoZSBVUkwgdG8gZ28gdG8gd2hlbiB0aGUgJ3VybCcgYnV0dG9uIGlzIGNsaWNrZWQuXG4gKlxuICogQHJldHVybiB7RHJhZnR5fSB1cGRhdGVkIGRvY3VtZW50LlxuICovXG5EcmFmdHkuYXBwZW5kQnV0dG9uID0gZnVuY3Rpb24oY29udGVudCwgdGl0bGUsIG5hbWUsIGFjdGlvblR5cGUsIGFjdGlvblZhbHVlLCByZWZVcmwpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogXCJcIlxuICB9O1xuICBjb25zdCBhdCA9IGNvbnRlbnQudHh0Lmxlbmd0aDtcbiAgY29udGVudC50eHQgKz0gdGl0bGU7XG4gIHJldHVybiBEcmFmdHkuaW5zZXJ0QnV0dG9uKGNvbnRlbnQsIGF0LCB0aXRsZS5sZW5ndGgsIG5hbWUsIGFjdGlvblR5cGUsIGFjdGlvblZhbHVlLCByZWZVcmwpO1xufVxuXG4vKipcbiAqIEF0dGFjaCBhIGdlbmVyaWMgSlMgb2JqZWN0LiBUaGUgb2JqZWN0IGlzIGF0dGFjaGVkIGFzIGEganNvbiBzdHJpbmcuXG4gKiBJbnRlbmRlZCBmb3IgcmVwcmVzZW50aW5nIGEgZm9ybSByZXNwb25zZS5cbiAqXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBEcmFmdHkgZG9jdW1lbnQgdG8gYXR0YWNoIGZpbGUgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIGRhdGEgdG8gY29udmVydCB0byBqc29uIHN0cmluZyBhbmQgYXR0YWNoLlxuICogQHJldHVybnMge0RyYWZ0eX0gdGhlIHNhbWUgZG9jdW1lbnQgYXMgPGNvZGU+Y29udGVudDwvY29kZT4uXG4gKi9cbkRyYWZ0eS5hdHRhY2hKU09OID0gZnVuY3Rpb24oY29udGVudCwgZGF0YSkge1xuICBjb250ZW50ID0gY29udGVudCB8fCB7XG4gICAgdHh0OiBcIlwiXG4gIH07XG4gIGNvbnRlbnQuZW50ID0gY29udGVudC5lbnQgfHwgW107XG4gIGNvbnRlbnQuZm10ID0gY29udGVudC5mbXQgfHwgW107XG5cbiAgY29udGVudC5mbXQucHVzaCh7XG4gICAgYXQ6IC0xLFxuICAgIGxlbjogMCxcbiAgICBrZXk6IGNvbnRlbnQuZW50Lmxlbmd0aFxuICB9KTtcblxuICBjb250ZW50LmVudC5wdXNoKHtcbiAgICB0cDogJ0VYJyxcbiAgICBkYXRhOiB7XG4gICAgICBtaW1lOiBKU09OX01JTUVfVFlQRSxcbiAgICAgIHZhbDogZGF0YVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG4vKipcbiAqIEFwcGVuZCBsaW5lIGJyZWFrIHRvIGEgRHJhZnR5IGRvY3VtZW50LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBjb250ZW50IC0gRHJhZnR5IGRvY3VtZW50IHRvIGFwcGVuZCBsaW5lYnJlYWsgdG8uXG4gKiBAcmV0dXJucyB7RHJhZnR5fSB0aGUgc2FtZSBkb2N1bWVudCBhcyA8Y29kZT5jb250ZW50PC9jb2RlPi5cbiAqL1xuRHJhZnR5LmFwcGVuZExpbmVCcmVhayA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogXCJcIlxuICB9O1xuICBjb250ZW50LmZtdCA9IGNvbnRlbnQuZm10IHx8IFtdO1xuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogY29udGVudC50eHQubGVuZ3RoLFxuICAgIGxlbjogMSxcbiAgICB0cDogJ0JSJ1xuICB9KTtcbiAgY29udGVudC50eHQgKz0gXCIgXCI7XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG4vKipcbiAqIEdpdmVuIERyYWZ0eSBkb2N1bWVudCwgY29udmVydCBpdCB0byBIVE1MLlxuICogTm8gYXR0ZW1wdCBpcyBtYWRlIHRvIHN0cmlwIHByZS1leGlzdGluZyBodG1sIG1hcmt1cC5cbiAqIFRoaXMgaXMgcG90ZW50aWFsbHkgdW5zYWZlIGJlY2F1c2UgPGNvZGU+Y29udGVudC50eHQ8L2NvZGU+IG1heSBjb250YWluIG1hbGljaW91c1xuICogbWFya3VwLlxuICogQG1lbWJlcm9mIFRpbm9kZS5EcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ5fSBjb250ZW50IC0gZG9jdW1lbnQgdG8gY29udmVydC5cbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MLXJlcHJlc2VudGF0aW9uIG9mIGNvbnRlbnQuXG4gKi9cbkRyYWZ0eS5VTlNBRkVfdG9IVE1MID0gZnVuY3Rpb24oY29udGVudCkge1xuICBsZXQge1xuICAgIHR4dCxcbiAgICBmbXQsXG4gICAgZW50XG4gIH0gPSBjb250ZW50O1xuXG4gIGNvbnN0IG1hcmt1cCA9IFtdO1xuICBpZiAoZm10KSB7XG4gICAgZm9yIChsZXQgaSBpbiBmbXQpIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gZm10W2ldO1xuICAgICAgY29uc3QgYXQgPSByYW5nZS5hdCB8IDA7XG4gICAgICBsZXQgdHAgPSByYW5nZS50cDtcbiAgICAgIGxldCBkYXRhO1xuICAgICAgaWYgKCF0cCkge1xuICAgICAgICBjb25zdCBlbnRpdHkgPSBlbnRbcmFuZ2Uua2V5IHwgMF07XG4gICAgICAgIGlmIChlbnRpdHkpIHtcbiAgICAgICAgICB0cCA9IGVudGl0eS50cDtcbiAgICAgICAgICBkYXRhID0gZW50aXR5LmRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKERFQ09SQVRPUlNbdHBdKSB7XG4gICAgICAgIC8vIEJlY2F1c2Ugd2UgbGF0ZXIgc29ydCBpbiBkZXNjZW5kaW5nIG9yZGVyLCBjbG9zaW5nIG1hcmt1cCBtdXN0IGNvbWUgZmlyc3QuXG4gICAgICAgIC8vIE90aGVyd2lzZSB6ZXJvLWxlbmd0aCBvYmplY3RzIHdpbGwgbm90IGJlIHJlcHJlc2VudGVkIGNvcnJlY3RseS5cbiAgICAgICAgbWFya3VwLnB1c2goe1xuICAgICAgICAgIGlkeDogYXQgKyByYW5nZS5sZW4sXG4gICAgICAgICAgbGVuOiAtcmFuZ2UubGVuLFxuICAgICAgICAgIHdoYXQ6IERFQ09SQVRPUlNbdHBdLmNsb3NlKGRhdGEpXG4gICAgICAgIH0pO1xuICAgICAgICBtYXJrdXAucHVzaCh7XG4gICAgICAgICAgaWR4OiBhdCxcbiAgICAgICAgICBsZW46IHJhbmdlLmxlbixcbiAgICAgICAgICB3aGF0OiBERUNPUkFUT1JTW3RwXS5vcGVuKGRhdGEpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG1hcmt1cC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYi5pZHggPT0gYS5pZHggPyBiLmxlbiAtIGEubGVuIDogYi5pZHggLSBhLmlkeDsgLy8gaW4gZGVzY2VuZGluZyBvcmRlclxuICB9KTtcblxuICBmb3IgKGxldCBpIGluIG1hcmt1cCkge1xuICAgIGlmIChtYXJrdXBbaV0ud2hhdCkge1xuICAgICAgdHh0ID0gc3BsaWNlKHR4dCwgbWFya3VwW2ldLmlkeCwgbWFya3VwW2ldLndoYXQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0eHQ7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIGFwcGx5aW5nIGN1c3RvbSBmb3JtYXR0aW5nL3RyYW5zZm9ybWF0aW9uIHRvIGEgRHJhZnR5IGRvY3VtZW50LlxuICogQ2FsbGVkIG9uY2UgZm9yIGVhY2ggc3lsZSBzcGFuLlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBjYWxsYmFjayBGb3JtYXR0ZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHlsZSAtIHN0eWxlIGNvZGUgc3VjaCBhcyBcIlNUXCIgb3IgXCJJTVwiLlxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBlbnRpdHkncyBkYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzIC0gcG9zc2libHkgc3R5bGVkIHN1YnNwYW5zIGNvbnRhaW5lZCBpbiB0aGlzIHN0eWxlIHNwYW4uXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBvZiB0aGUgY3VycmVudCBlbGVtZW50IGFtb25nIGl0cyBzaWJsaW5ncy5cbiAqL1xuXG4vKipcbiAqIFRyYW5zZm9ybSBEcmFmdHkgZG9jdW1lbnQgdXNpbmcgY3VzdG9tIGZvcm1hdHRpbmcuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBjb250ZW50IHRvIHRyYW5zZm9ybS5cbiAqIEBwYXJhbSB7Rm9ybWF0dGVyfSBmb3JtYXR0ZXIgLSBjYWxsYmFjayB3aGljaCB0cmFuc2Zvcm1zIGluZGl2aWR1YWwgZWxlbWVudHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gY29udGV4dCBwcm92aWRlZCB0byBmb3JtYXR0ZXIgYXMgPGNvZGU+dGhpczwvY29kZT4uXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSB0cmFuc2Zvcm1lZCBvYmplY3RcbiAqL1xuRHJhZnR5LmZvcm1hdCA9IGZ1bmN0aW9uKGNvbnRlbnQsIGZvcm1hdHRlciwgY29udGV4dCkge1xuICBsZXQge1xuICAgIHR4dCxcbiAgICBmbXQsXG4gICAgZW50XG4gIH0gPSBjb250ZW50O1xuXG4gIC8vIEFzc2lnbiBkZWZhdWx0IHZhbHVlcy5cbiAgdHh0ID0gdHh0IHx8IFwiXCI7XG4gIGlmICghQXJyYXkuaXNBcnJheShlbnQpKSB7XG4gICAgZW50ID0gW107XG4gIH1cblxuICBpZiAoIUFycmF5LmlzQXJyYXkoZm10KSkge1xuICAgIC8vIEhhbmRsZSBzcGVjaWFsIGNhc2Ugd2hlbiBhbGwgdmFsdWVzIGluIGZtdCBhcmUgMCBhbmQgZm10IGlzIHNraXBwZWQuXG4gICAgaWYgKGVudC5sZW5ndGggPT0gMSkge1xuICAgICAgZm10ID0gW3tcbiAgICAgICAgYXQ6IDAsXG4gICAgICAgIGxlbjogMCxcbiAgICAgICAga2V5OiAwXG4gICAgICB9XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFt0eHRdO1xuICAgIH1cbiAgfVxuXG4gIGxldCBzcGFucyA9IFtdLmNvbmNhdChmbXQpO1xuXG4gIC8vIFplcm8gdmFsdWVzIG1heSBoYXZlIGJlZW4gc3RyaXBwZWQuIFJlc3RvcmUgdGhlbS5cbiAgLy8gQWxzbyBlbnN1cmUgaW5kZXhlcyBhbmQgbGVuZ3RocyBhcmUgc2FuZS5cbiAgc3BhbnMubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICBzLmF0ID0gcy5hdCB8fCAwO1xuICAgIHMubGVuID0gcy5sZW4gfHwgMDtcbiAgICBpZiAocy5sZW4gPCAwKSB7XG4gICAgICBzLmxlbiA9IDA7XG4gICAgfVxuICAgIGlmIChzLmF0IDwgLTEpIHtcbiAgICAgIHMuYXQgPSAtMTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFNvcnQgc3BhbnMgZmlyc3QgYnkgc3RhcnQgaW5kZXggKGFzYykgdGhlbiBieSBsZW5ndGggKGRlc2MpLlxuICBzcGFucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICBpZiAoYS5hdCAtIGIuYXQgPT0gMCkge1xuICAgICAgcmV0dXJuIGIubGVuIC0gYS5sZW47IC8vIGxvbmdlciBvbmUgY29tZXMgZmlyc3QgKDwwKVxuICAgIH1cbiAgICByZXR1cm4gYS5hdCAtIGIuYXQ7XG4gIH0pO1xuXG4gIC8vIERlbm9ybWFsaXplIGVudGl0aWVzIGludG8gc3BhbnMuIENyZWF0ZSBhIGNvcHkgb2YgdGhlIG9iamVjdHMgdG8gbGVhdmVcbiAgLy8gb3JpZ2luYWwgRHJhZnR5IG9iamVjdCB1bmNoYW5nZWQuXG4gIHNwYW5zID0gc3BhbnMubWFwKChzKSA9PiB7XG4gICAgbGV0IGRhdGE7XG4gICAgbGV0IHRwID0gcy50cDtcbiAgICBpZiAoIXRwKSB7XG4gICAgICBzLmtleSA9IHMua2V5IHx8IDA7XG4gICAgICBpZiAoZW50W3Mua2V5XSkge1xuICAgICAgICBkYXRhID0gZW50W3Mua2V5XS5kYXRhO1xuICAgICAgICB0cCA9IGVudFtzLmtleV0udHA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVHlwZSBzdGlsbCBub3QgZGVmaW5lZD8gSGlkZSBpbnZhbGlkIGVsZW1lbnQuXG4gICAgdHAgPSB0cCB8fCAnSEQnO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRwOiB0cCxcbiAgICAgIGRhdGE6IGRhdGEsXG4gICAgICBhdDogcy5hdCxcbiAgICAgIGxlbjogcy5sZW5cbiAgICB9O1xuICB9KTtcblxuICByZXR1cm4gZm9yRWFjaCh0eHQsIDAsIHR4dC5sZW5ndGgsIHNwYW5zLCBmb3JtYXR0ZXIsIGNvbnRleHQpO1xufVxuXG4vKipcbiAqIEdpdmVuIERyYWZ0eSBkb2N1bWVudCwgY29udmVydCBpdCB0byBwbGFpbiB0ZXh0LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBjb250ZW50IC0gZG9jdW1lbnQgdG8gY29udmVydCB0byBwbGFpbiB0ZXh0LlxuICogQHJldHVybnMge3N0cmluZ30gcGxhaW4tdGV4dCByZXByZXNlbnRhdGlvbiBvZiB0aGUgZHJhZnR5IGRvY3VtZW50LlxuICovXG5EcmFmdHkudG9QbGFpblRleHQgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIHJldHVybiB0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJyA/IGNvbnRlbnQgOiBjb250ZW50LnR4dDtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZG9jdW1lbnQgaGFzIG5vIG1hcmt1cCBhbmQgbm8gZW50aXRpZXMuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBjb250ZW50IHRvIGNoZWNrIGZvciBwcmVzZW5jZSBvZiBtYXJrdXAuXG4gKiBAcmV0dXJucyA8Y29kZT50cnVlPC9jb2RlPiBpcyBjb250ZW50IGlzIHBsYWluIHRleHQsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gKi9cbkRyYWZ0eS5pc1BsYWluVGV4dCA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09ICdzdHJpbmcnIHx8ICEoY29udGVudC5mbXQgfHwgY29udGVudC5lbnQpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgb2JqZWN0IHJlcHJlc2V0cyBpcyBhIHZhbGlkIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGNvbnRlbnQgdG8gY2hlY2sgZm9yIHZhbGlkaXR5LlxuICogQHJldHVybnMgPGNvZGU+dHJ1ZTwvY29kZT4gaXMgY29udGVudCBpcyB2YWxpZCwgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuRHJhZnR5LmlzVmFsaWQgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIGlmICghY29udGVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICB0eHQsXG4gICAgZm10LFxuICAgIGVudFxuICB9ID0gY29udGVudDtcblxuICBpZiAoIXR4dCAmJiB0eHQgIT09ICcnICYmICFmbXQgJiYgIWVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHR4dF90eXBlID0gdHlwZW9mIHR4dDtcbiAgaWYgKHR4dF90eXBlICE9ICdzdHJpbmcnICYmIHR4dF90eXBlICE9ICd1bmRlZmluZWQnICYmIHR4dCAhPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZm10ICE9ICd1bmRlZmluZWQnICYmICFBcnJheS5pc0FycmF5KGZtdCkgJiYgZm10ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBlbnQgIT0gJ3VuZGVmaW5lZCcgJiYgIUFycmF5LmlzQXJyYXkoZW50KSAmJiBlbnQgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGRyYWZ0eSBkb2N1bWVudCBoYXMgYXR0YWNobWVudHMuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBkb2N1bWVudCB0byBjaGVjayBmb3IgYXR0YWNobWVudHMuXG4gKiBAcmV0dXJucyA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGVyZSBhcmUgYXR0YWNobWVudHMuXG4gKi9cbkRyYWZ0eS5oYXNBdHRhY2htZW50cyA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgaWYgKGNvbnRlbnQuZW50ICYmIGNvbnRlbnQuZW50Lmxlbmd0aCA+IDApIHtcbiAgICBmb3IgKGxldCBpIGluIGNvbnRlbnQuZW50KSB7XG4gICAgICBpZiAoY29udGVudC5lbnRbaV0gJiYgY29udGVudC5lbnRbaV0udHAgPT0gJ0VYJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBhcHBseWluZyBjdXN0b20gZm9ybWF0dGluZy90cmFuc2Zvcm1hdGlvbiB0byBhIERyYWZ0eSBkb2N1bWVudC5cbiAqIENhbGxlZCBvbmNlIGZvciBlYWNoIHN5bGUgc3Bhbi5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAY2FsbGJhY2sgQXR0YWNobWVudENhbGxiYWNrXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBhdHRhY2htZW50IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBhdHRhY2htZW50J3MgaW5kZXggaW4gYGNvbnRlbnQuZW50YC5cbiAqL1xuXG4vKipcbiAqIEVudW1lcmF0ZSBhdHRhY2htZW50cy5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGRvY3VtZW50IHRvIHByb2Nlc3MgZm9yIGF0dGFjaG1lbnRzLlxuICogQHBhcmFtIHtBdHRhY2htZW50Q2FsbGJhY2t9IGNhbGxiYWNrIC0gY2FsbGJhY2sgdG8gY2FsbCBmb3IgZWFjaCBhdHRhY2htZW50LlxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSB2YWx1ZSBvZiBcInRoaXNcIiBmb3IgY2FsbGJhY2suXG4gKi9cbkRyYWZ0eS5hdHRhY2htZW50cyA9IGZ1bmN0aW9uKGNvbnRlbnQsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gIGlmIChjb250ZW50LmVudCAmJiBjb250ZW50LmVudC5sZW5ndGggPiAwKSB7XG4gICAgZm9yIChsZXQgaSBpbiBjb250ZW50LmVudCkge1xuICAgICAgaWYgKGNvbnRlbnQuZW50W2ldICYmIGNvbnRlbnQuZW50W2ldLnRwID09ICdFWCcpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBjb250ZW50LmVudFtpXS5kYXRhLCBpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiB0aGUgZW50aXR5LCBnZXQgVVJMIHdoaWNoIGNhbiBiZSB1c2VkIGZvciBkb3dubG9hZGluZ1xuICogZW50aXR5IGRhdGEuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGVudERhdGEgLSBlbnRpdHkuZGF0YSB0byBnZXQgdGhlIFVSbCBmcm9tLlxuICogQHJldHVybnMge3N0cmluZ30gVVJMIHRvIGRvd25sb2FkIGVudGl0eSBkYXRhIG9yIDxjb2RlPm51bGw8L2NvZGU+LlxuICovXG5EcmFmdHkuZ2V0RG93bmxvYWRVcmwgPSBmdW5jdGlvbihlbnREYXRhKSB7XG4gIGxldCB1cmwgPSBudWxsO1xuICBpZiAoZW50RGF0YS5taW1lICE9IEpTT05fTUlNRV9UWVBFICYmIGVudERhdGEudmFsKSB7XG4gICAgdXJsID0gYmFzZTY0dG9PYmplY3RVcmwoZW50RGF0YS52YWwsIGVudERhdGEubWltZSwgRHJhZnR5LmxvZ2dlcik7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGVudERhdGEucmVmID09ICdzdHJpbmcnKSB7XG4gICAgdXJsID0gZW50RGF0YS5yZWY7XG4gIH1cbiAgcmV0dXJuIHVybDtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZW50aXR5IGRhdGEgaXMgbm90IHJlYWR5IGZvciBzZW5kaW5nLCBzdWNoIGFzIGJlaW5nIHVwbG9hZGVkIHRvIHRoZSBzZXJ2ZXIuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGVudGl0eS5kYXRhIHRvIGdldCB0aGUgVVJsIGZyb20uXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB1cGxvYWQgaXMgaW4gcHJvZ3Jlc3MsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xuRHJhZnR5LmlzUHJvY2Vzc2luZyA9IGZ1bmN0aW9uKGVudERhdGEpIHtcbiAgcmV0dXJuICEhZW50RGF0YS5fcHJvY2Vzc2luZztcbn1cblxuLyoqXG4gKiBHaXZlbiB0aGUgZW50aXR5LCBnZXQgVVJMIHdoaWNoIGNhbiBiZSB1c2VkIGZvciBwcmV2aWV3aW5nXG4gKiB0aGUgZW50aXR5LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnRpdHkuZGF0YSB0byBnZXQgdGhlIFVSbCBmcm9tLlxuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHVybCBmb3IgcHJldmlld2luZyBvciBudWxsIGlmIG5vIHN1Y2ggdXJsIGlzIGF2YWlsYWJsZS5cbiAqL1xuRHJhZnR5LmdldFByZXZpZXdVcmwgPSBmdW5jdGlvbihlbnREYXRhKSB7XG4gIHJldHVybiBlbnREYXRhLnZhbCA/IGJhc2U2NHRvT2JqZWN0VXJsKGVudERhdGEudmFsLCBlbnREYXRhLm1pbWUsIERyYWZ0eS5sb2dnZXIpIDogbnVsbDtcbn1cblxuLyoqXG4gKiBHZXQgYXBwcm94aW1hdGUgc2l6ZSBvZiB0aGUgZW50aXR5LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnREYXRhIC0gZW50aXR5LmRhdGEgdG8gZ2V0IHRoZSBzaXplIGZvci5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IHNpemUgb2YgZW50aXR5IGRhdGEgaW4gYnl0ZXMuXG4gKi9cbkRyYWZ0eS5nZXRFbnRpdHlTaXplID0gZnVuY3Rpb24oZW50RGF0YSkge1xuICAvLyBFaXRoZXIgc2l6ZSBoaW50IG9yIGxlbmd0aCBvZiB2YWx1ZS4gVGhlIHZhbHVlIGlzIGJhc2U2NCBlbmNvZGVkLFxuICAvLyB0aGUgYWN0dWFsIG9iamVjdCBzaXplIGlzIHNtYWxsZXIgdGhhbiB0aGUgZW5jb2RlZCBsZW5ndGguXG4gIHJldHVybiBlbnREYXRhLnNpemUgPyBlbnREYXRhLnNpemUgOiBlbnREYXRhLnZhbCA/IChlbnREYXRhLnZhbC5sZW5ndGggKiAwLjc1KSB8IDAgOiAwO1xufVxuXG4vKipcbiAqIEdldCBlbnRpdHkgbWltZSB0eXBlLlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnREYXRhIC0gZW50aXR5LmRhdGEgdG8gZ2V0IHRoZSB0eXBlIGZvci5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IG1pbWUgdHlwZSBvZiBlbnRpdHkuXG4gKi9cbkRyYWZ0eS5nZXRFbnRpdHlNaW1lVHlwZSA9IGZ1bmN0aW9uKGVudERhdGEpIHtcbiAgcmV0dXJuIGVudERhdGEubWltZSB8fCAndGV4dC9wbGFpbic7XG59XG5cbi8qKlxuICogR2V0IEhUTUwgdGFnIGZvciBhIGdpdmVuIHR3by1sZXR0ZXIgc3R5bGUgbmFtZS5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3R5bGUgLSB0d28tbGV0dGVyIHN0eWxlLCBsaWtlIFNUIG9yIExOLlxuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUwgdGFnIG5hbWUgaWYgc3R5bGUgaXMgZm91bmQsICdfVU5LTicgaWYgbm90IGZvdW5kLCB7Y29kZTogdW5kZWZpbmVkfSBpZiBzdHlsZSBpcyBmYWxzaXNoLlxuICovXG5EcmFmdHkudGFnTmFtZSA9IGZ1bmN0aW9uKHN0eWxlKSB7XG4gIHJldHVybiBzdHlsZSA/IChIVE1MX1RBR1Nbc3R5bGVdID8gSFRNTF9UQUdTW3N0eWxlXS5uYW1lIDogJ19VTktOJykgOiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogRm9yIGEgZ2l2ZW4gZGF0YSBidW5kbGUgZ2VuZXJhdGUgYW4gb2JqZWN0IHdpdGggSFRNTCBhdHRyaWJ1dGVzLFxuICogZm9yIGluc3RhbmNlLCBnaXZlbiB7dXJsOiBcImh0dHA6Ly93d3cuZXhhbXBsZS5jb20vXCJ9IHJldHVyblxuICoge2hyZWY6IFwiaHR0cDovL3d3dy5leGFtcGxlLmNvbS9cIn1cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3R5bGUgLSB0d28tbGV0dGVyIHN0eWxlIHRvIGdlbmVyYXRlIGF0dHJpYnV0ZXMgZm9yLlxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBkYXRhIGJ1bmRsZSB0byBjb252ZXJ0IHRvIGF0dHJpYnV0ZXNcbiAqXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBvYmplY3Qgd2l0aCBIVE1MIGF0dHJpYnV0ZXMuXG4gKi9cbkRyYWZ0eS5hdHRyVmFsdWUgPSBmdW5jdGlvbihzdHlsZSwgZGF0YSkge1xuICBpZiAoZGF0YSAmJiBERUNPUkFUT1JTW3N0eWxlXSkge1xuICAgIHJldHVybiBERUNPUkFUT1JTW3N0eWxlXS5wcm9wcyhkYXRhKTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogRHJhZnR5IE1JTUUgdHlwZS5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIVFRQIENvbnRlbnQtVHlwZSBcInRleHQveC1kcmFmdHlcIi5cbiAqL1xuRHJhZnR5LmdldENvbnRlbnRUeXBlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAndGV4dC94LWRyYWZ0eSc7XG59XG5cbi8qKlxuICogU2hvcnRlbiBEcmFmdHkgZG9jdW1lbnQgYW5kIHN0cmlwIGFsbCBlbnRpdHkgZGF0YSBsZWF2aW5nIGp1c3QgaW5saW5lIHN0eWxlcyBhbmQgZW50aXR5IHJlZmVyZW5jZXMuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IG9yaWdpbmFsIC0gRHJhZnR5IG9iamVjdCB0byBzaG9ydGVuLlxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCAtIGxlbmd0aCBpbiBjaGFyYWN0ZXJzIHRvIHNob3J0ZW4gdG8uXG4gKiBAcmV0dXJucyBuZXcgc2hvcnRlbmVkIERyYWZ0eSBvYmplY3QgbGVhdmluZyB0aGUgb3JpZ2luYWwgaW50YWN0LlxuICovXG5EcmFmdHkucHJldmlldyA9IGZ1bmN0aW9uKG9yaWdpbmFsLCBsZW5ndGgpIHtcbiAgaWYgKCFvcmlnaW5hbCB8fCBsZW5ndGggPD0gMCB8fCB0eXBlb2Ygb3JpZ2luYWwgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICB0eHQsXG4gICAgZm10LFxuICAgIGVudFxuICB9ID0gb3JpZ2luYWw7XG5cbiAgY29uc3QgcHJldmlldyA9IHtcbiAgICB0eHQ6ICcnXG4gIH07XG4gIGxldCBsZW4gPSAwO1xuICBpZiAodHlwZW9mIHR4dCA9PSAnc3RyaW5nJykge1xuICAgIGlmICh0eHQubGVuZ3RoID4gbGVuZ3RoKSB7XG4gICAgICBwcmV2aWV3LnR4dCA9IHR4dC5zdWJzdHIoMCwgbGVuZ3RoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJldmlldy50eHQgPSB0eHQ7XG4gICAgfVxuICAgIGxlbiA9IHByZXZpZXcudHh0Lmxlbmd0aDtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KGZtdCkgJiYgZm10Lmxlbmd0aCA+IDApIHtcbiAgICAvLyBPbGQga2V5IHRvIG5ldyBrZXkgZW50aXR5IG1hcHBpbmcuXG4gICAgY29uc3QgZW50X3JlZnMgPSBbXTtcbiAgICAvLyBDb3VudCBzdHlsZXMgd2hpY2ggc3RhcnQgd2l0aGluIHRoZSBuZXcgbGVuZ3RoIG9mIHRoZSB0ZXh0IGFuZCBzYXZlIGVudGl0eSBrZXlzIGFzIGEgc2V0LlxuICAgIGxldCBmbXRfY291bnQgPSAwO1xuICAgIGxldCBlbnRfY291bnQgPSAwO1xuICAgIGZtdC5mb3JFYWNoKChzdCkgPT4ge1xuICAgICAgaWYgKHN0LmF0IDwgbGVuKSB7XG4gICAgICAgIGZtdF9jb3VudCsrO1xuICAgICAgICBpZiAoIXN0LnRwKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0gc3Qua2V5IHwgMDtcbiAgICAgICAgICBpZiAoIWVudF9yZWZzW2tleV0pIHtcbiAgICAgICAgICAgIGVudF9yZWZzW2tleV0gPSBlbnRfY291bnQ7XG4gICAgICAgICAgICBlbnRfY291bnQrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChmbXRfY291bnQgPT0gMCkge1xuICAgICAgcmV0dXJuIHByZXZpZXc7XG4gICAgfVxuXG4gICAgLy8gQWxsb2NhdGUgc3BhY2UgZm9yIGNvcHlpbmcgc3R5bGVzIGFuZCBlbnRpdGllcy5cbiAgICBwcmV2aWV3LmZtdCA9IFtdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGVudCkgJiYgZW50X3JlZnMubGVuZ3RoID4gMCkge1xuICAgICAgcHJldmlldy5lbnQgPSBbXTtcbiAgICB9XG5cbiAgICAvLyBJbnNlcnRpb24gcG9pbnQgZm9yIHN0eWxlcy5cbiAgICBsZXQgZm10X2lkeCA9IDA7XG4gICAgZm10LmZvckVhY2goKHN0KSA9PiB7XG4gICAgICBpZiAoc3QuYXQgPCBsZW4pIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICAgICAgYXQ6IHN0LmF0LFxuICAgICAgICAgIGxlbjogc3QubGVuXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGtleSA9IHN0LmtleSB8IDA7XG4gICAgICAgIGlmIChzdC50cCkge1xuICAgICAgICAgIHN0eWxlLnRwID0gJycgKyBzdC50cDtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGVudCkgJiYgZW50Lmxlbmd0aCA+IGtleSAmJiB0eXBlb2YgZW50X3JlZnNba2V5XSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIHN0eWxlLmtleSA9IGVudF9yZWZzW2tleV07XG4gICAgICAgICAgcHJldmlldy5lbnRbc3R5bGUua2V5XSA9IGNvcHlMaWdodChlbnRba2V5XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHByZXZpZXcuZm10W2ZtdF9pZHgrK10gPSBzdHlsZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBwcmV2aWV3O1xufVxuXG4vLyBDcmVhdGUgYSBjb3B5IG9mIGFuIGVudGl0eSB3aXRob3V0IGxhcmdlIGRhdGEuXG5mdW5jdGlvbiBjb3B5TGlnaHQoZW50KSB7XG4gIGxldCByZXN1bHQgPSB7XG4gICAgdHA6IGVudC50cFxuICB9O1xuICBpZiAoZW50LmRhdGEgJiYgT2JqZWN0LmVudHJpZXMoZW50LmRhdGEpLmxlbmd0aCAhPSAwKSB7XG4gICAgZGMgPSB7fTtcbiAgICBbXCJtaW1lXCIsIFwibmFtZVwiLCBcIndpZHRoXCIsIFwiaGVpZ2h0XCIsIFwic2l6ZVwiXS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGNvbnN0IHZhbCA9IGVudC5kYXRhW2tleV07XG4gICAgICBpZiAodmFsKSB7XG4gICAgICAgIGRjW2tleV0gPSB2YWw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKE9iamVjdC5lbnRyaWVzKGRjKS5sZW5ndGggIT0gMCkge1xuICAgICAgcmVzdWx0LmRhdGEgPSBkYztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBEcmFmdHk7XG59XG4iLCIvKipcbiAqIEBmaWxlIFNESyB0byBjb25uZWN0IHRvIFRpbm9kZSBjaGF0IHNlcnZlci5cbiAqIFNlZSA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL3Rpbm9kZS93ZWJhcHBcIj5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS90aW5vZGUvd2ViYXBwPC9hPiBmb3IgcmVhbC1saWZlIHVzYWdlLlxuICpcbiAqIEBjb3B5cmlnaHQgMjAxNS0yMDIxIFRpbm9kZVxuICogQHN1bW1hcnkgSmF2YXNjcmlwdCBiaW5kaW5ncyBmb3IgVGlub2RlLlxuICogQGxpY2Vuc2UgQXBhY2hlIDIuMFxuICogQHZlcnNpb24gMC4xN1xuICpcbiAqIEBleGFtcGxlXG4gKiA8aGVhZD5cbiAqIDxzY3JpcHQgc3JjPVwiLi4uL3Rpbm9kZS5qc1wiPjwvc2NyaXB0PlxuICogPC9oZWFkPlxuICpcbiAqIDxib2R5PlxuICogIC4uLlxuICogPHNjcmlwdD5cbiAqICAvLyBJbnN0YW50aWF0ZSB0aW5vZGUuXG4gKiAgY29uc3QgdGlub2RlID0gbmV3IFRpbm9kZShBUFBfTkFNRSwgSE9TVCwgQVBJX0tFWSwgbnVsbCwgdHJ1ZSk7XG4gKiAgdGlub2RlLmVuYWJsZUxvZ2dpbmcodHJ1ZSk7XG4gKiAgLy8gQWRkIGxvZ2ljIHRvIGhhbmRsZSBkaXNjb25uZWN0cy5cbiAqICB0aW5vZGUub25EaXNjb25uZWN0ID0gZnVuY3Rpb24oZXJyKSB7IC4uLiB9O1xuICogIC8vIENvbm5lY3QgdG8gdGhlIHNlcnZlci5cbiAqICB0aW5vZGUuY29ubmVjdCgpLnRoZW4oKCkgPT4ge1xuICogICAgLy8gQ29ubmVjdGVkLiBMb2dpbiBub3cuXG4gKiAgICByZXR1cm4gdGlub2RlLmxvZ2luQmFzaWMobG9naW4sIHBhc3N3b3JkKTtcbiAqICB9KS50aGVuKChjdHJsKSA9PiB7XG4gKiAgICAvLyBMb2dnZWQgaW4gZmluZSwgYXR0YWNoIGNhbGxiYWNrcywgc3Vic2NyaWJlIHRvICdtZScuXG4gKiAgICBjb25zdCBtZSA9IHRpbm9kZS5nZXRNZVRvcGljKCk7XG4gKiAgICBtZS5vbk1ldGFEZXNjID0gZnVuY3Rpb24obWV0YSkgeyAuLi4gfTtcbiAqICAgIC8vIFN1YnNjcmliZSwgZmV0Y2ggdG9waWMgZGVzY3JpcHRpb24gYW5kIHRoZSBsaXN0IG9mIGNvbnRhY3RzLlxuICogICAgbWUuc3Vic2NyaWJlKHtnZXQ6IHtkZXNjOiB7fSwgc3ViOiB7fX0pO1xuICogIH0pLmNhdGNoKChlcnIpID0+IHtcbiAqICAgIC8vIExvZ2luIG9yIHN1YnNjcmlwdGlvbiBmYWlsZWQsIGRvIHNvbWV0aGluZy5cbiAqICAgIC4uLlxuICogIH0pO1xuICogIC4uLlxuICogPC9zY3JpcHQ+XG4gKiA8L2JvZHk+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLy8gTk9URSBUTyBERVZFTE9QRVJTOlxuLy8gTG9jYWxpemFibGUgc3RyaW5ncyBzaG91bGQgYmUgZG91YmxlIHF1b3RlZCBcItGB0YLRgNC+0LrQsCDQvdCwINC00YDRg9Cz0L7QvCDRj9C30YvQutC1XCIsXG4vLyBub24tbG9jYWxpemFibGUgc3RyaW5ncyBzaG91bGQgYmUgc2luZ2xlIHF1b3RlZCAnbm9uLWxvY2FsaXplZCcuXG5cbmlmICh0eXBlb2YgcmVxdWlyZSA9PSAnZnVuY3Rpb24nKSB7XG4gIGlmICh0eXBlb2YgRHJhZnR5ID09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIERyYWZ0eSA9IHJlcXVpcmUoJy4vZHJhZnR5LmpzJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiBEQiA9PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBEQiA9IHJlcXVpcmUoJy4vZGIuanMnKTtcbiAgfVxuICB2YXIgcGFja2FnZV92ZXJzaW9uID0gcmVxdWlyZSgnLi4vdmVyc2lvbi5qc29uJykudmVyc2lvbjtcbn1cblxubGV0IFdlYlNvY2tldFByb3ZpZGVyO1xuaWYgKHR5cGVvZiBXZWJTb2NrZXQgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgV2ViU29ja2V0UHJvdmlkZXIgPSBXZWJTb2NrZXQ7XG59XG5cbmxldCBYSFJQcm92aWRlcjtcbmlmICh0eXBlb2YgWE1MSHR0cFJlcXVlc3QgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgWEhSUHJvdmlkZXIgPSBYTUxIdHRwUmVxdWVzdDtcbn1cbmluaXRGb3JOb25Ccm93c2VyQXBwKCk7XG5cbi8vIEdsb2JhbCBjb25zdGFudHNcbmNvbnN0IFBST1RPQ09MX1ZFUlNJT04gPSAnMCc7IC8vIE1ham9yIGNvbXBvbmVudCBvZiB0aGUgdmVyc2lvbiwgMCBpbiAwLjE2LjlcbmNvbnN0IFZFUlNJT04gPSBwYWNrYWdlX3ZlcnNpb24gfHwgJzAuMTcnO1xuY29uc3QgTElCUkFSWSA9ICd0aW5vZGVqcy8nICsgVkVSU0lPTjtcblxuY29uc3QgVE9QSUNfTkVXID0gJ25ldyc7XG5jb25zdCBUT1BJQ19ORVdfQ0hBTiA9ICduY2gnO1xuY29uc3QgVE9QSUNfTUUgPSAnbWUnO1xuY29uc3QgVE9QSUNfRk5EID0gJ2ZuZCc7XG5jb25zdCBUT1BJQ19TWVMgPSAnc3lzJztcbmNvbnN0IFRPUElDX0NIQU4gPSAnY2huJztcbmNvbnN0IFVTRVJfTkVXID0gJ25ldyc7XG5cbi8vIFN0YXJ0aW5nIHZhbHVlIG9mIGEgbG9jYWxseS1nZW5lcmF0ZWQgc2VxSWQgdXNlZCBmb3IgcGVuZGluZyBtZXNzYWdlcy5cbmNvbnN0IExPQ0FMX1NFUUlEID0gMHhGRkZGRkZGO1xuXG5jb25zdCBNRVNTQUdFX1NUQVRVU19OT05FID0gMDsgLy8gU3RhdHVzIG5vdCBhc3NpZ25lZC5cbmNvbnN0IE1FU1NBR0VfU1RBVFVTX1FVRVVFRCA9IDE7IC8vIExvY2FsIElEIGFzc2lnbmVkLCBpbiBwcm9ncmVzcyB0byBiZSBzZW50LlxuY29uc3QgTUVTU0FHRV9TVEFUVVNfU0VORElORyA9IDI7IC8vIFRyYW5zbWlzc2lvbiBzdGFydGVkLlxuY29uc3QgTUVTU0FHRV9TVEFUVVNfRkFJTEVEID0gMzsgLy8gQXQgbGVhc3Qgb25lIGF0dGVtcHQgd2FzIG1hZGUgdG8gc2VuZCB0aGUgbWVzc2FnZS5cbmNvbnN0IE1FU1NBR0VfU1RBVFVTX1NFTlQgPSA0OyAvLyBEZWxpdmVyZWQgdG8gdGhlIHNlcnZlci5cbmNvbnN0IE1FU1NBR0VfU1RBVFVTX1JFQ0VJVkVEID0gNTsgLy8gUmVjZWl2ZWQgYnkgdGhlIGNsaWVudC5cbmNvbnN0IE1FU1NBR0VfU1RBVFVTX1JFQUQgPSA2OyAvLyBSZWFkIGJ5IHRoZSB1c2VyLlxuY29uc3QgTUVTU0FHRV9TVEFUVVNfVE9fTUUgPSA3OyAvLyBNZXNzYWdlIGZyb20gYW5vdGhlciB1c2VyLlxuXG4vLyBFcnJvciBjb2RlIHRvIHJldHVybiBpbiBjYXNlIG9mIGEgbmV0d29yayBwcm9ibGVtLlxuY29uc3QgTkVUV09SS19FUlJPUiA9IDUwMztcbmNvbnN0IE5FVFdPUktfRVJST1JfVEVYVCA9IFwiQ29ubmVjdGlvbiBmYWlsZWRcIjtcblxuLy8gUmVqZWN0IHVucmVzb2x2ZWQgZnV0dXJlcyBhZnRlciB0aGlzIG1hbnkgbWlsbGlzZWNvbmRzLlxuY29uc3QgRVhQSVJFX1BST01JU0VTX1RJTUVPVVQgPSA1MDAwO1xuLy8gUGVyaW9kaWNpdHkgb2YgZ2FyYmFnZSBjb2xsZWN0aW9uIG9mIHVucmVzb2x2ZWQgZnV0dXJlcy5cbmNvbnN0IEVYUElSRV9QUk9NSVNFU19QRVJJT0QgPSAxMDAwO1xuXG4vLyBFcnJvciBjb2RlIHRvIHJldHVybiB3aGVuIHVzZXIgZGlzY29ubmVjdGVkIGZyb20gc2VydmVyLlxuY29uc3QgTkVUV09SS19VU0VSID0gNDE4O1xuY29uc3QgTkVUV09SS19VU0VSX1RFWFQgPSBcIkRpc2Nvbm5lY3RlZCBieSBjbGllbnRcIjtcblxuLy8gRGVmYXVsdCBudW1iZXIgb2YgbWVzc2FnZXMgdG8gcHVsbCBpbnRvIG1lbW9yeSBmcm9tIHBlcnNpc3RlbnQgY2FjaGUuXG5jb25zdCBERUZBVUxUX01FU1NBR0VTX1BBR0UgPSAyNDtcblxuLy8gVXRpbGl0eSBmdW5jdGlvbnNcblxuLy8gQWRkIGJyb3dlciBtaXNzaW5nIGZ1bmN0aW9uIGZvciBub24gYnJvd3NlciBhcHAsIGVnIG5vZGVKc1xuZnVuY3Rpb24gaW5pdEZvck5vbkJyb3dzZXJBcHAoKSB7XG4gIC8vIFRpbm9kZSByZXF1aXJlbWVudCBpbiBuYXRpdmUgbW9kZSBiZWNhdXNlIHJlYWN0IG5hdGl2ZSBkb2Vzbid0IHByb3ZpZGUgQmFzZTY0IG1ldGhvZFxuICBjb25zdCBjaGFycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPSc7XG5cbiAgaWYgKHR5cGVvZiBidG9hID09ICd1bmRlZmluZWQnKSB7XG4gICAgY29uc3QgY2hhcnMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz0nO1xuICAgIGdsb2JhbC5idG9hID0gZnVuY3Rpb24oaW5wdXQgPSAnJykge1xuICAgICAgbGV0IHN0ciA9IGlucHV0O1xuICAgICAgbGV0IG91dHB1dCA9ICcnO1xuXG4gICAgICBmb3IgKGxldCBibG9jayA9IDAsIGNoYXJDb2RlLCBpID0gMCwgbWFwID0gY2hhcnM7IHN0ci5jaGFyQXQoaSB8IDApIHx8IChtYXAgPSAnPScsIGkgJSAxKTsgb3V0cHV0ICs9IG1hcC5jaGFyQXQoNjMgJiBibG9jayA+PiA4IC0gaSAlIDEgKiA4KSkge1xuXG4gICAgICAgIGNoYXJDb2RlID0gc3RyLmNoYXJDb2RlQXQoaSArPSAzIC8gNCk7XG5cbiAgICAgICAgaWYgKGNoYXJDb2RlID4gMHhGRikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIididG9hJyBmYWlsZWQ6IFRoZSBzdHJpbmcgdG8gYmUgZW5jb2RlZCBjb250YWlucyBjaGFyYWN0ZXJzIG91dHNpZGUgb2YgdGhlIExhdGluMSByYW5nZS5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBibG9jayA9IGJsb2NrIDw8IDggfCBjaGFyQ29kZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHR5cGVvZiBhdG9iID09ICd1bmRlZmluZWQnKSB7XG4gICAgZ2xvYmFsLmF0b2IgPSBmdW5jdGlvbihpbnB1dCA9ICcnKSB7XG4gICAgICBsZXQgc3RyID0gaW5wdXQucmVwbGFjZSgvPSskLywgJycpO1xuICAgICAgbGV0IG91dHB1dCA9ICcnO1xuXG4gICAgICBpZiAoc3RyLmxlbmd0aCAlIDQgPT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInYXRvYicgZmFpbGVkOiBUaGUgc3RyaW5nIHRvIGJlIGRlY29kZWQgaXMgbm90IGNvcnJlY3RseSBlbmNvZGVkLlwiKTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGJjID0gMCwgYnMgPSAwLCBidWZmZXIsIGkgPSAwOyBidWZmZXIgPSBzdHIuY2hhckF0KGkrKyk7XG5cbiAgICAgICAgfmJ1ZmZlciAmJiAoYnMgPSBiYyAlIDQgPyBicyAqIDY0ICsgYnVmZmVyIDogYnVmZmVyLFxuICAgICAgICAgIGJjKysgJSA0KSA/IG91dHB1dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDI1NSAmIGJzID4+ICgtMiAqIGJjICYgNikpIDogMFxuICAgICAgKSB7XG4gICAgICAgIGJ1ZmZlciA9IGNoYXJzLmluZGV4T2YoYnVmZmVyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBnbG9iYWwud2luZG93ID0ge1xuICAgICAgV2ViU29ja2V0OiBXZWJTb2NrZXRQcm92aWRlcixcbiAgICAgIFhNTEh0dHBSZXF1ZXN0OiBYSFJQcm92aWRlcixcbiAgICAgIFVSTDoge1xuICAgICAgICBjcmVhdGVPYmplY3RVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byB1c2UgVVJMLmNyZWF0ZU9iamVjdFVSTCBpbiBhIG5vbi1icm93c2VyIGFwcGxpY2F0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIFJGQzMzMzkgZm9ybWF0ZXIgb2YgRGF0ZVxuZnVuY3Rpb24gcmZjMzMzOURhdGVTdHJpbmcoZCkge1xuICBpZiAoIWQgfHwgZC5nZXRUaW1lKCkgPT0gMCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBwYWQodmFsLCBzcCkge1xuICAgIHNwID0gc3AgfHwgMjtcbiAgICByZXR1cm4gJzAnLnJlcGVhdChzcCAtICgnJyArIHZhbCkubGVuZ3RoKSArIHZhbDtcbiAgfVxuXG4gIGNvbnN0IG1pbGxpcyA9IGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gIHJldHVybiBkLmdldFVUQ0Z1bGxZZWFyKCkgKyAnLScgKyBwYWQoZC5nZXRVVENNb250aCgpICsgMSkgKyAnLScgKyBwYWQoZC5nZXRVVENEYXRlKCkpICtcbiAgICAnVCcgKyBwYWQoZC5nZXRVVENIb3VycygpKSArICc6JyArIHBhZChkLmdldFVUQ01pbnV0ZXMoKSkgKyAnOicgKyBwYWQoZC5nZXRVVENTZWNvbmRzKCkpICtcbiAgICAobWlsbGlzID8gJy4nICsgcGFkKG1pbGxpcywgMykgOiAnJykgKyAnWic7XG59XG5cbi8vIGJ0b2EgcmVwbGFjZW1lbnQuIFN0b2NrIGJ0b2EgZmFpbHMgb24gb24gbm9uLUxhdGluMSBzdHJpbmdzLlxuZnVuY3Rpb24gYjY0RW5jb2RlVW5pY29kZShzdHIpIHtcbiAgLy8gVGhlIGVuY29kZVVSSUNvbXBvbmVudCBwZXJjZW50LWVuY29kZXMgVVRGLTggc3RyaW5nLFxuICAvLyB0aGVuIHRoZSBwZXJjZW50IGVuY29kaW5nIGlzIGNvbnZlcnRlZCBpbnRvIHJhdyBieXRlcyB3aGljaFxuICAvLyBjYW4gYmUgZmVkIGludG8gYnRvYS5cbiAgcmV0dXJuIGJ0b2EoZW5jb2RlVVJJQ29tcG9uZW50KHN0cikucmVwbGFjZSgvJShbMC05QS1GXXsyfSkvZyxcbiAgICBmdW5jdGlvbiB0b1NvbGlkQnl0ZXMobWF0Y2gsIHAxKSB7XG4gICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgnMHgnICsgcDEpO1xuICAgIH0pKTtcbn1cblxuLy8gUmVjdXJzaXZlbHkgbWVyZ2Ugc3JjJ3Mgb3duIHByb3BlcnRpZXMgdG8gZHN0LlxuLy8gSWdub3JlIHByb3BlcnRpZXMgd2hlcmUgaWdub3JlW3Byb3BlcnR5XSBpcyB0cnVlLlxuLy8gQXJyYXkgYW5kIERhdGUgb2JqZWN0cyBhcmUgc2hhbGxvdy1jb3BpZWQuXG5mdW5jdGlvbiBtZXJnZU9iaihkc3QsIHNyYywgaWdub3JlKSB7XG4gIGlmICh0eXBlb2Ygc3JjICE9ICdvYmplY3QnKSB7XG4gICAgaWYgKHNyYyA9PT0gVGlub2RlLkRFTF9DSEFSKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc3JjID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBkc3Q7XG4gICAgfVxuICAgIHJldHVybiBzcmM7XG4gIH1cbiAgLy8gSlMgaXMgY3Jhenk6IHR5cGVvZiBudWxsIGlzICdvYmplY3QnLlxuICBpZiAoc3JjID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHNyYztcbiAgfVxuXG4gIC8vIEhhbmRsZSBEYXRlXG4gIGlmIChzcmMgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuICghZHN0IHx8ICEoZHN0IGluc3RhbmNlb2YgRGF0ZSkgfHwgZHN0IDwgc3JjKSA/IHNyYyA6IGRzdDtcbiAgfVxuXG4gIC8vIEFjY2VzcyBtb2RlXG4gIGlmIChzcmMgaW5zdGFuY2VvZiBBY2Nlc3NNb2RlKSB7XG4gICAgcmV0dXJuIG5ldyBBY2Nlc3NNb2RlKHNyYyk7XG4gIH1cblxuICAvLyBIYW5kbGUgQXJyYXlcbiAgaWYgKHNyYyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgcmV0dXJuIHNyYztcbiAgfVxuXG4gIGlmICghZHN0IHx8IGRzdCA9PT0gVGlub2RlLkRFTF9DSEFSKSB7XG4gICAgZHN0ID0gc3JjLmNvbnN0cnVjdG9yKCk7XG4gIH1cblxuICBmb3IgKGxldCBwcm9wIGluIHNyYykge1xuICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkocHJvcCkgJiZcbiAgICAgICghaWdub3JlIHx8ICFpZ25vcmVbcHJvcF0pICYmXG4gICAgICAocHJvcCAhPSAnX25vRm9yd2FyZGluZycpKSB7XG5cbiAgICAgIGRzdFtwcm9wXSA9IG1lcmdlT2JqKGRzdFtwcm9wXSwgc3JjW3Byb3BdKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRzdDtcbn1cblxuLy8gVXBkYXRlIG9iamVjdCBzdG9yZWQgaW4gYSBjYWNoZS4gUmV0dXJucyB1cGRhdGVkIHZhbHVlLlxuZnVuY3Rpb24gbWVyZ2VUb0NhY2hlKGNhY2hlLCBrZXksIG5ld3ZhbCwgaWdub3JlKSB7XG4gIGNhY2hlW2tleV0gPSBtZXJnZU9iaihjYWNoZVtrZXldLCBuZXd2YWwsIGlnbm9yZSk7XG4gIHJldHVybiBjYWNoZVtrZXldO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdUb0RhdGUob2JqKSB7XG4gIGlmICh0eXBlb2Ygb2JqLmNyZWF0ZWQgPT0gJ3N0cmluZycpIHtcbiAgICBvYmouY3JlYXRlZCA9IG5ldyBEYXRlKG9iai5jcmVhdGVkKTtcbiAgfVxuICBpZiAodHlwZW9mIG9iai51cGRhdGVkID09ICdzdHJpbmcnKSB7XG4gICAgb2JqLnVwZGF0ZWQgPSBuZXcgRGF0ZShvYmoudXBkYXRlZCk7XG4gIH1cbiAgaWYgKHR5cGVvZiBvYmoudG91Y2hlZCA9PSAnc3RyaW5nJykge1xuICAgIG9iai50b3VjaGVkID0gbmV3IERhdGUob2JqLnRvdWNoZWQpO1xuICB9XG59XG5cbi8vIEpTT04gc3RyaW5naWZ5IGhlbHBlciAtIHByZS1wcm9jZXNzb3IgZm9yIEpTT04uc3RyaW5naWZ5XG5mdW5jdGlvbiBqc29uQnVpbGRIZWxwZXIoa2V5LCB2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAvLyBDb252ZXJ0IGphdmFzY3JpcHQgRGF0ZSBvYmplY3RzIHRvIHJmYzMzMzkgc3RyaW5nc1xuICAgIHZhbCA9IHJmYzMzMzlEYXRlU3RyaW5nKHZhbCk7XG4gIH0gZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgQWNjZXNzTW9kZSkge1xuICAgIHZhbCA9IHZhbC5qc29uSGVscGVyKCk7XG4gIH0gZWxzZSBpZiAodmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSBudWxsIHx8IHZhbCA9PT0gZmFsc2UgfHxcbiAgICAoQXJyYXkuaXNBcnJheSh2YWwpICYmIHZhbC5sZW5ndGggPT0gMCkgfHxcbiAgICAoKHR5cGVvZiB2YWwgPT0gJ29iamVjdCcpICYmIChPYmplY3Qua2V5cyh2YWwpLmxlbmd0aCA9PSAwKSkpIHtcbiAgICAvLyBzdHJpcCBvdXQgZW1wdHkgZWxlbWVudHMgd2hpbGUgc2VyaWFsaXppbmcgb2JqZWN0cyB0byBKU09OXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiB2YWw7XG59O1xuXG4vLyBTdHJpcHMgYWxsIHZhbHVlcyBmcm9tIGFuIG9iamVjdCBvZiB0aGV5IGV2YWx1YXRlIHRvIGZhbHNlIG9yIGlmIHRoZWlyIG5hbWUgc3RhcnRzIHdpdGggJ18nLlxuZnVuY3Rpb24gc2ltcGxpZnkob2JqKSB7XG4gIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoa2V5WzBdID09ICdfJykge1xuICAgICAgLy8gU3RyaXAgZmllbGRzIGxpa2UgXCJvYmouX2tleVwiLlxuICAgICAgZGVsZXRlIG9ialtrZXldO1xuICAgIH0gZWxzZSBpZiAoIW9ialtrZXldKSB7XG4gICAgICAvLyBTdHJpcCBmaWVsZHMgd2hpY2ggZXZhbHVhdGUgdG8gZmFsc2UuXG4gICAgICBkZWxldGUgb2JqW2tleV07XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9ialtrZXldKSAmJiBvYmpba2V5XS5sZW5ndGggPT0gMCkge1xuICAgICAgLy8gU3RyaXAgZW1wdHkgYXJyYXlzLlxuICAgICAgZGVsZXRlIG9ialtrZXldO1xuICAgIH0gZWxzZSBpZiAoIW9ialtrZXldKSB7XG4gICAgICAvLyBTdHJpcCBmaWVsZHMgd2hpY2ggZXZhbHVhdGUgdG8gZmFsc2UuXG4gICAgICBkZWxldGUgb2JqW2tleV07XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqW2tleV0gPT0gJ29iamVjdCcgJiYgIShvYmpba2V5XSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICBzaW1wbGlmeShvYmpba2V5XSk7XG4gICAgICAvLyBTdHJpcCBlbXB0eSBvYmplY3RzLlxuICAgICAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9ialtrZXldKS5sZW5ndGggPT0gMCkge1xuICAgICAgICBkZWxldGUgb2JqW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8vIFRyaW0gd2hpdGVzcGFjZSwgc3RyaXAgZW1wdHkgYW5kIGR1cGxpY2F0ZSBlbGVtZW50cyBlbGVtZW50cy5cbi8vIElmIHRoZSByZXN1bHQgaXMgYW4gZW1wdHkgYXJyYXksIGFkZCBhIHNpbmdsZSBlbGVtZW50IFwiXFx1MjQyMVwiIChVbmljb2RlIERlbCBjaGFyYWN0ZXIpLlxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkoYXJyKSB7XG4gIGxldCBvdXQgPSBbXTtcbiAgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkge1xuICAgIC8vIFRyaW0sIHRocm93IGF3YXkgdmVyeSBzaG9ydCBhbmQgZW1wdHkgdGFncy5cbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IGFyci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxldCB0ID0gYXJyW2ldO1xuICAgICAgaWYgKHQpIHtcbiAgICAgICAgdCA9IHQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICh0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBvdXQucHVzaCh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBvdXQuc29ydCgpLmZpbHRlcihmdW5jdGlvbihpdGVtLCBwb3MsIGFyeSkge1xuICAgICAgcmV0dXJuICFwb3MgfHwgaXRlbSAhPSBhcnlbcG9zIC0gMV07XG4gICAgfSk7XG4gIH1cbiAgaWYgKG91dC5sZW5ndGggPT0gMCkge1xuICAgIC8vIEFkZCBzaW5nbGUgdGFnIHdpdGggYSBVbmljb2RlIERlbCBjaGFyYWN0ZXIsIG90aGVyd2lzZSBhbiBhbXB0eSBhcnJheVxuICAgIC8vIGlzIGFtYmlndW9zLiBUaGUgRGVsIHRhZyB3aWxsIGJlIHN0cmlwcGVkIGJ5IHRoZSBzZXJ2ZXIuXG4gICAgb3V0LnB1c2goVGlub2RlLkRFTF9DSEFSKTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vLyBBdHRlbXB0IHRvIGNvbnZlcnQgZGF0ZSBzdHJpbmdzIHRvIG9iamVjdHMuXG5mdW5jdGlvbiBqc29uUGFyc2VIZWxwZXIoa2V5LCB2YWwpIHtcbiAgLy8gQ29udmVydCBzdHJpbmcgdGltZXN0YW1wcyB3aXRoIG9wdGlvbmFsIG1pbGxpc2Vjb25kcyB0byBEYXRlXG4gIC8vIDIwMTUtMDktMDJUMDE6NDU6NDNbLjEyM11aXG4gIGlmIChrZXkgPT09ICd0cycgJiYgdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgJiZcbiAgICB2YWwubGVuZ3RoID49IDIwICYmIHZhbC5sZW5ndGggPD0gMjQpIHtcbiAgICBsZXQgZGF0ZSA9IG5ldyBEYXRlKHZhbCk7XG4gICAgaWYgKGRhdGUpIHtcbiAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChrZXkgPT09ICdhY3MnICYmIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG5ldyBBY2Nlc3NNb2RlKHZhbCk7XG4gIH1cbiAgcmV0dXJuIHZhbDtcbn07XG5cbi8vIFRyaW1zIHZlcnkgbG9uZyBzdHJpbmdzIChlbmNvZGVkIGltYWdlcykgdG8gbWFrZSBsb2dnZWQgcGFja2V0cyBtb3JlIHJlYWRhYmxlLlxuZnVuY3Rpb24ganNvbkxvZ2dlckhlbHBlcihrZXksIHZhbCkge1xuICBpZiAodHlwZW9mIHZhbCA9PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMTI4KSB7XG4gICAgcmV0dXJuICc8JyArIHZhbC5sZW5ndGggKyAnLCBieXRlczogJyArIHZhbC5zdWJzdHJpbmcoMCwgMTIpICsgJy4uLicgKyB2YWwuc3Vic3RyaW5nKHZhbC5sZW5ndGggLSAxMikgKyAnPic7XG4gIH1cbiAgcmV0dXJuIGpzb25CdWlsZEhlbHBlcihrZXksIHZhbCk7XG59O1xuXG4vLyBQYXJzZSBicm93c2VyIHVzZXIgYWdlbnQgdG8gZXh0cmFjdCBicm93c2VyIG5hbWUgYW5kIHZlcnNpb24uXG5mdW5jdGlvbiBnZXRCcm93c2VySW5mbyh1YSwgcHJvZHVjdCkge1xuICB1YSA9IHVhIHx8ICcnO1xuICBsZXQgcmVhY3RuYXRpdmUgPSAnJztcbiAgLy8gQ2hlY2sgaWYgdGhpcyBpcyBhIFJlYWN0TmF0aXZlIGFwcC5cbiAgaWYgKC9yZWFjdG5hdGl2ZS9pLnRlc3QocHJvZHVjdCkpIHtcbiAgICByZWFjdG5hdGl2ZSA9ICdSZWFjdE5hdGl2ZTsgJztcbiAgfVxuICAvLyBUaGVuIHRlc3QgZm9yIFdlYktpdCBiYXNlZCBicm93c2VyLlxuICB1YSA9IHVhLnJlcGxhY2UoJyAoS0hUTUwsIGxpa2UgR2Vja28pJywgJycpO1xuICBsZXQgbSA9IHVhLm1hdGNoKC8oQXBwbGVXZWJLaXRcXC9bLlxcZF0rKS9pKTtcbiAgbGV0IHJlc3VsdDtcbiAgaWYgKG0pIHtcbiAgICAvLyBMaXN0IG9mIGNvbW1vbiBzdHJpbmdzLCBmcm9tIG1vcmUgdXNlZnVsIHRvIGxlc3MgdXNlZnVsLlxuICAgIGxldCBwcmlvcml0eSA9IFsnY2hyb21lJywgJ3NhZmFyaScsICdtb2JpbGUnLCAndmVyc2lvbiddO1xuICAgIGxldCB0bXAgPSB1YS5zdWJzdHIobS5pbmRleCArIG1bMF0ubGVuZ3RoKS5zcGxpdChcIiBcIik7XG4gICAgbGV0IHRva2VucyA9IFtdO1xuICAgIC8vIFNwbGl0IE5hbWUvMC4wLjAgaW50byBOYW1lIGFuZCB2ZXJzaW9uIDAuMC4wXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBtMiA9IC8oW1xcdy5dKylbXFwvXShbXFwuXFxkXSspLy5leGVjKHRtcFtpXSk7XG4gICAgICBpZiAobTIpIHtcbiAgICAgICAgdG9rZW5zLnB1c2goW20yWzFdLCBtMlsyXSwgcHJpb3JpdHkuZmluZEluZGV4KGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICByZXR1cm4gKGUgPT0gbTJbMV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIH0pXSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFNvcnQgYnkgcHJpb3JpdHk6IG1vcmUgaW50ZXJlc3RpbmcgaXMgZWFybGllciB0aGFuIGxlc3MgaW50ZXJlc3RpbmcuXG4gICAgdG9rZW5zLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgbGV0IGRpZmYgPSBhWzJdIC0gYlsyXTtcbiAgICAgIHJldHVybiBkaWZmICE9IDAgPyBkaWZmIDogYlswXS5sZW5ndGggLSBhWzBdLmxlbmd0aDtcbiAgICB9KTtcbiAgICBpZiAodG9rZW5zLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIFJldHVybiB0aGUgbGVhc3QgY29tbW9uIGJyb3dzZXIgc3RyaW5nIGFuZCB2ZXJzaW9uLlxuICAgICAgcmVzdWx0ID0gdG9rZW5zWzBdWzBdICsgJy8nICsgdG9rZW5zWzBdWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBGYWlsZWQgdG8gSUQgdGhlIGJyb3dzZXIuIFJldHVybiB0aGUgd2Via2l0IHZlcnNpb24uXG4gICAgICByZXN1bHQgPSBtWzFdO1xuICAgIH1cbiAgICAvLyBUZXN0IGZvciBNU0lFLlxuICB9IGVsc2UgaWYgKC90cmlkZW50L2kudGVzdCh1YSkpIHtcbiAgICBtID0gLyg/OlxcYnJ2WyA6XSsoWy5cXGRdKykpfCg/OlxcYk1TSUUgKFsuXFxkXSspKS9nLmV4ZWModWEpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXN1bHQgPSAnTVNJRS8nICsgKG1bMV0gfHwgbVsyXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9ICdNU0lFLz8nO1xuICAgIH1cbiAgICAvLyBUZXN0IGZvciBGaXJlZm94LlxuICB9IGVsc2UgaWYgKC9maXJlZm94L2kudGVzdCh1YSkpIHtcbiAgICBtID0gL0ZpcmVmb3hcXC8oWy5cXGRdKykvZy5leGVjKHVhKTtcbiAgICBpZiAobSkge1xuICAgICAgcmVzdWx0ID0gJ0ZpcmVmb3gvJyArIG1bMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9ICdGaXJlZm94Lz8nO1xuICAgIH1cbiAgICAvLyBPbGRlciBPcGVyYS5cbiAgfSBlbHNlIGlmICgvcHJlc3RvL2kudGVzdCh1YSkpIHtcbiAgICBtID0gL09wZXJhXFwvKFsuXFxkXSspL2cuZXhlYyh1YSk7XG4gICAgaWYgKG0pIHtcbiAgICAgIHJlc3VsdCA9ICdPcGVyYS8nICsgbVsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gJ09wZXJhLz8nO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBGYWlsZWQgdG8gcGFyc2UgYW55dGhpbmcgbWVhbmluZ2Z1bGwuIFRyeSB0aGUgbGFzdCByZXNvcnQuXG4gICAgbSA9IC8oW1xcdy5dKylcXC8oWy5cXGRdKykvLmV4ZWModWEpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXN1bHQgPSBtWzFdICsgJy8nICsgbVsyXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHVhLnNwbGl0KCcgJyk7XG4gICAgICByZXN1bHQgPSBtWzBdO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNob3J0ZW4gdGhlIHZlcnNpb24gdG8gb25lIGRvdCAnYS5iYi5jY2MuZCAtPiBhLmJiJyBhdCBtb3N0LlxuICBtID0gcmVzdWx0LnNwbGl0KCcvJyk7XG4gIGlmIChtLmxlbmd0aCA+IDEpIHtcbiAgICBsZXQgdiA9IG1bMV0uc3BsaXQoJy4nKTtcbiAgICByZXN1bHQgPSBtWzBdICsgJy8nICsgdlswXSArICh2WzFdID8gJy4nICsgdlsxXSA6ICcnKTtcbiAgfVxuICByZXR1cm4gcmVhY3RuYXRpdmUgKyByZXN1bHQ7XG59XG5cbi8qKlxuICogSW4tbWVtb3J5IHNvcnRlZCBjYWNoZSBvZiBvYmplY3RzLlxuICpcbiAqIEBjbGFzcyBDQnVmZmVyXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAcHJvdGVjdGVkXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY29tcGFyZSBjdXN0b20gY29tcGFyYXRvciBvZiBvYmplY3RzLiBUYWtlcyB0d28gcGFyYW1ldGVycyA8Y29kZT5hPC9jb2RlPiBhbmQgPGNvZGU+YjwvY29kZT47XG4gKiAgICByZXR1cm5zIDxjb2RlPi0xPC9jb2RlPiBpZiA8Y29kZT5hIDwgYjwvY29kZT4sIDxjb2RlPjA8L2NvZGU+IGlmIDxjb2RlPmEgPT0gYjwvY29kZT4sIDxjb2RlPjE8L2NvZGU+IG90aGVyd2lzZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdW5pcXVlIGVuZm9yY2UgZWxlbWVudCB1bmlxdWVuZXNzOiB3aGVuIDxjb2RlPnRydWU8L2NvZGU+IHJlcGxhY2UgZXhpc3RpbmcgZWxlbWVudCB3aXRoIGEgbmV3XG4gKiAgICBvbmUgb24gY29uZmxpY3Q7IHdoZW4gPGNvZGU+ZmFsc2U8L2NvZGU+IGtlZXAgYm90aCBlbGVtZW50cy5cbiAqL1xudmFyIENCdWZmZXIgPSBmdW5jdGlvbihjb21wYXJlLCB1bmlxdWUpIHtcbiAgbGV0IGJ1ZmZlciA9IFtdO1xuXG4gIGNvbXBhcmUgPSBjb21wYXJlIHx8IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYSA9PT0gYiA/IDAgOiBhIDwgYiA/IC0xIDogMTtcbiAgfTtcblxuICBmdW5jdGlvbiBmaW5kTmVhcmVzdChlbGVtLCBhcnIsIGV4YWN0KSB7XG4gICAgbGV0IHN0YXJ0ID0gMDtcbiAgICBsZXQgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgbGV0IHBpdm90ID0gMDtcbiAgICBsZXQgZGlmZiA9IDA7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG5cbiAgICB3aGlsZSAoc3RhcnQgPD0gZW5kKSB7XG4gICAgICBwaXZvdCA9IChzdGFydCArIGVuZCkgLyAyIHwgMDtcbiAgICAgIGRpZmYgPSBjb21wYXJlKGFycltwaXZvdF0sIGVsZW0pO1xuICAgICAgaWYgKGRpZmYgPCAwKSB7XG4gICAgICAgIHN0YXJ0ID0gcGl2b3QgKyAxO1xuICAgICAgfSBlbHNlIGlmIChkaWZmID4gMCkge1xuICAgICAgICBlbmQgPSBwaXZvdCAtIDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZm91bmQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkeDogcGl2b3QsXG4gICAgICAgIGV4YWN0OiB0cnVlXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoZXhhY3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkeDogLTFcbiAgICAgIH07XG4gICAgfVxuICAgIC8vIE5vdCBleGFjdCAtIGluc2VydGlvbiBwb2ludFxuICAgIHJldHVybiB7XG4gICAgICBpZHg6IGRpZmYgPCAwID8gcGl2b3QgKyAxIDogcGl2b3RcbiAgICB9O1xuICB9XG5cbiAgLy8gSW5zZXJ0IGVsZW1lbnQgaW50byBhIHNvcnRlZCBhcnJheS5cbiAgZnVuY3Rpb24gaW5zZXJ0U29ydGVkKGVsZW0sIGFycikge1xuICAgIGNvbnN0IGZvdW5kID0gZmluZE5lYXJlc3QoZWxlbSwgYXJyLCBmYWxzZSk7XG4gICAgY29uc3QgY291bnQgPSAoZm91bmQuZXhhY3QgJiYgdW5pcXVlKSA/IDEgOiAwO1xuICAgIGFyci5zcGxpY2UoZm91bmQuaWR4LCBjb3VudCwgZWxlbSk7XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLyoqXG4gICAgICogR2V0IGFuIGVsZW1lbnQgYXQgdGhlIGdpdmVuIHBvc2l0aW9uLlxuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYXQgLSBQb3NpdGlvbiB0byBmZXRjaCBmcm9tLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEVsZW1lbnQgYXQgdGhlIGdpdmVuIHBvc2l0aW9uIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4uXG4gICAgICovXG4gICAgZ2V0QXQ6IGZ1bmN0aW9uKGF0KSB7XG4gICAgICByZXR1cm4gYnVmZmVyW2F0XTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ29udmVuaWVuY2UgbWV0aG9kIGZvciBnZXR0aW5nIHRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIGJ1ZmZlci5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGhlIGxhc3QgZWxlbWVudCBpbiB0aGUgYnVmZmVyIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4gaWYgYnVmZmVyIGlzIGVtcHR5LlxuICAgICAqL1xuICAgIGdldExhc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGJ1ZmZlci5sZW5ndGggPiAwID8gYnVmZmVyW2J1ZmZlci5sZW5ndGggLSAxXSA6IHVuZGVmaW5lZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIG5ldyBlbGVtZW50KHMpIHRvIHRoZSBidWZmZXIuIFZhcmlhZGljOiB0YWtlcyBvbmUgb3IgbW9yZSBhcmd1bWVudHMuIElmIGFuIGFycmF5IGlzIHBhc3NlZCBhcyBhIHNpbmdsZVxuICAgICAqIGFyZ3VtZW50LCBpdHMgZWxlbWVudHMgYXJlIGluc2VydGVkIGluZGl2aWR1YWxseS5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICpcbiAgICAgKiBAcGFyYW0gey4uLk9iamVjdHxBcnJheX0gLSBPbmUgb3IgbW9yZSBvYmplY3RzIHRvIGluc2VydC5cbiAgICAgKi9cbiAgICBwdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IGluc2VydDtcbiAgICAgIC8vIGluc3BlY3QgYXJndW1lbnRzOiBpZiBhcnJheSwgaW5zZXJ0IGl0cyBlbGVtZW50cywgaWYgb25lIG9yIG1vcmUgbm9uLWFycmF5IGFyZ3VtZW50cywgaW5zZXJ0IHRoZW0gb25lIGJ5IG9uZVxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiBBcnJheS5pc0FycmF5KGFyZ3VtZW50c1swXSkpIHtcbiAgICAgICAgaW5zZXJ0ID0gYXJndW1lbnRzWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zZXJ0ID0gYXJndW1lbnRzO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaWR4IGluIGluc2VydCkge1xuICAgICAgICBpbnNlcnRTb3J0ZWQoaW5zZXJ0W2lkeF0sIGJ1ZmZlcik7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBlbGVtZW50IGF0IHRoZSBnaXZlbiBwb3NpdGlvbi5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGF0IC0gUG9zaXRpb24gdG8gZGVsZXRlIGF0LlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEVsZW1lbnQgYXQgdGhlIGdpdmVuIHBvc2l0aW9uIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4uXG4gICAgICovXG4gICAgZGVsQXQ6IGZ1bmN0aW9uKGF0KSB7XG4gICAgICBsZXQgciA9IGJ1ZmZlci5zcGxpY2UoYXQsIDEpO1xuICAgICAgaWYgKHIgJiYgci5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiByWzBdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGVsZW1lbnRzIGJldHdlZW4gdHdvIHBvc2l0aW9ucy5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNpbmNlIC0gUG9zaXRpb24gdG8gZGVsZXRlIGZyb20gKGluY2x1c2l2ZSkuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJlZm9yZSAtIFBvc2l0aW9uIHRvIGRlbGV0ZSB0byAoZXhjbHVzaXZlKS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gYXJyYXkgb2YgcmVtb3ZlZCBlbGVtZW50cyAoY291bGQgYmUgemVybyBsZW5ndGgpLlxuICAgICAqL1xuICAgIGRlbFJhbmdlOiBmdW5jdGlvbihzaW5jZSwgYmVmb3JlKSB7XG4gICAgICByZXR1cm4gYnVmZmVyLnNwbGljZShzaW5jZSwgYmVmb3JlIC0gc2luY2UpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyB0aGUgYnVmZmVyIGhvbGRzLlxuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IE51bWJlciBvZiBlbGVtZW50cyBpbiB0aGUgYnVmZmVyLlxuICAgICAqL1xuICAgIGxlbmd0aDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYnVmZmVyLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgdGhlIGJ1ZmZlciBkaXNjYXJkaW5nIGFsbCBlbGVtZW50c1xuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICBidWZmZXIgPSBbXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGl0ZXJhdGluZyBjb250ZW50cyBvZiBidWZmZXIuIFNlZSB7QGxpbmsgVGlub2RlLkNCdWZmZXIjZm9yRWFjaH0uXG4gICAgICogQGNhbGxiYWNrIEZvckVhY2hDYWxsYmFja1R5cGVcbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW0gLSBFbGVtZW50IG9mIHRoZSBidWZmZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gSW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudC5cbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIEFwcGx5IGdpdmVuIDxjb2RlPmNhbGxiYWNrPC9jb2RlPiB0byBhbGwgZWxlbWVudHMgb2YgdGhlIGJ1ZmZlci5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1Rpbm9kZS5Gb3JFYWNoQ2FsbGJhY2tUeXBlfSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnRJZHggLSBPcHRpb25hbCBpbmRleCB0byBzdGFydCBpdGVyYXRpbmcgZnJvbSAoaW5jbHVzaXZlKS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYmVmb3JlSWR4IC0gT3B0aW9uYWwgaW5kZXggdG8gc3RvcCBpdGVyYXRpbmcgYmVmb3JlIChleGNsdXNpdmUpLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gY2FsbGluZyBjb250ZXh0IChpLmUuIHZhbHVlIG9mIDxjb2RlPnRoaXM8L2NvZGU+IGluIGNhbGxiYWNrKVxuICAgICAqL1xuICAgIGZvckVhY2g6IGZ1bmN0aW9uKGNhbGxiYWNrLCBzdGFydElkeCwgYmVmb3JlSWR4LCBjb250ZXh0KSB7XG4gICAgICBzdGFydElkeCA9IHN0YXJ0SWR4IHwgMDtcbiAgICAgIGJlZm9yZUlkeCA9IGJlZm9yZUlkeCB8fCBidWZmZXIubGVuZ3RoO1xuICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0SWR4OyBpIDwgYmVmb3JlSWR4OyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBidWZmZXJbaV0sIGkpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGVsZW1lbnQgaW4gYnVmZmVyIHVzaW5nIGJ1ZmZlcidzIGNvbXBhcmlzb24gZnVuY3Rpb24uXG4gICAgICogQG1lbWJlcm9mIFRpbm9kZS5DQnVmZmVyI1xuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW0gLSBlbGVtZW50IHRvIGZpbmQuXG4gICAgICogQHBhcmFtIHtib29sZWFuPX0gbmVhcmVzdCAtIHdoZW4gdHJ1ZSBhbmQgZXhhY3QgbWF0Y2ggaXMgbm90IGZvdW5kLCByZXR1cm4gdGhlIG5lYXJlc3QgZWxlbWVudCAoaW5zZXJ0aW9uIHBvaW50KS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgYnVmZmVyIG9yIC0xLlxuICAgICAqL1xuICAgIGZpbmQ6IGZ1bmN0aW9uKGVsZW0sIG5lYXJlc3QpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgaWR4XG4gICAgICB9ID0gZmluZE5lYXJlc3QoZWxlbSwgYnVmZmVyLCAhbmVhcmVzdCk7XG4gICAgICByZXR1cm4gaWR4O1xuICAgIH1cbiAgfVxufVxuXG4vLyBIZWxwZXIgZnVuY3Rpb24gZm9yIGNyZWF0aW5nIGFuIGVuZHBvaW50IFVSTC5cbmZ1bmN0aW9uIG1ha2VCYXNlVXJsKGhvc3QsIHByb3RvY29sLCBhcGlLZXkpIHtcbiAgbGV0IHVybCA9IG51bGw7XG5cbiAgaWYgKHByb3RvY29sID09PSAnaHR0cCcgfHwgcHJvdG9jb2wgPT09ICdodHRwcycgfHwgcHJvdG9jb2wgPT09ICd3cycgfHwgcHJvdG9jb2wgPT09ICd3c3MnKSB7XG4gICAgdXJsID0gcHJvdG9jb2wgKyAnOi8vJztcbiAgICB1cmwgKz0gaG9zdDtcbiAgICBpZiAodXJsLmNoYXJBdCh1cmwubGVuZ3RoIC0gMSkgIT09ICcvJykge1xuICAgICAgdXJsICs9ICcvJztcbiAgICB9XG4gICAgdXJsICs9ICd2JyArIFBST1RPQ09MX1ZFUlNJT04gKyAnL2NoYW5uZWxzJztcbiAgICBpZiAocHJvdG9jb2wgPT09ICdodHRwJyB8fCBwcm90b2NvbCA9PT0gJ2h0dHBzJykge1xuICAgICAgLy8gTG9uZyBwb2xsaW5nIGVuZHBvaW50IGVuZCB3aXRoIFwibHBcIiwgaS5lLlxuICAgICAgLy8gJy92MC9jaGFubmVscy9scCcgdnMganVzdCAnL3YwL2NoYW5uZWxzJyBmb3Igd3NcbiAgICAgIHVybCArPSAnL2xwJztcbiAgICB9XG4gICAgdXJsICs9ICc/YXBpa2V5PScgKyBhcGlLZXk7XG4gIH1cblxuICByZXR1cm4gdXJsO1xufVxuXG4vKipcbiAqIEFuIGFic3RyYWN0aW9uIGZvciBhIHdlYnNvY2tldCBvciBhIGxvbmcgcG9sbGluZyBjb25uZWN0aW9uLlxuICpcbiAqIEBjbGFzcyBDb25uZWN0aW9uXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGhvc3RfIC0gSG9zdCBuYW1lIGFuZCBwb3J0IG51bWJlciB0byBjb25uZWN0IHRvLlxuICogQHBhcmFtIHtzdHJpbmd9IGFwaUtleV8gLSBBUEkga2V5IGdlbmVyYXRlZCBieSBrZXlnZW5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0cmFuc3BvcnRfIC0gTmV0d29yayB0cmFuc3BvcnQgdG8gdXNlLCBlaXRoZXIgPGNvZGU+XCJ3c1wiPGNvZGU+Lzxjb2RlPlwid3NzXCI8L2NvZGU+IGZvciB3ZWJzb2NrZXQgb3JcbiAqICAgICAgPGNvZGU+bHA8L2NvZGU+IGZvciBsb25nIHBvbGxpbmcuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHNlY3VyZV8gLSBVc2Ugc2VjdXJlIFdlYlNvY2tldCAod3NzKSBpZiA8Y29kZT50cnVlPC9jb2RlPi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b3JlY29ubmVjdF8gLSBJZiBjb25uZWN0aW9uIGlzIGxvc3QsIHRyeSB0byByZWNvbm5lY3QgYXV0b21hdGljYWxseS5cbiAqL1xudmFyIENvbm5lY3Rpb24gPSBmdW5jdGlvbihob3N0XywgYXBpS2V5XywgdHJhbnNwb3J0Xywgc2VjdXJlXywgYXV0b3JlY29ubmVjdF8pIHtcbiAgbGV0IGhvc3QgPSBob3N0XztcbiAgbGV0IHNlY3VyZSA9IHNlY3VyZV87XG4gIGxldCBhcGlLZXkgPSBhcGlLZXlfO1xuXG4gIGxldCBhdXRvcmVjb25uZWN0ID0gYXV0b3JlY29ubmVjdF87XG5cbiAgLy8gU2V0dGluZ3MgZm9yIGV4cG9uZW50aWFsIGJhY2tvZmZcbiAgY29uc3QgX0JPRkZfQkFTRSA9IDIwMDA7IC8vIDIwMDAgbWlsbGlzZWNvbmRzLCBtaW5pbXVtIGRlbGF5IGJldHdlZW4gcmVjb25uZWN0c1xuICBjb25zdCBfQk9GRl9NQVhfSVRFUiA9IDEwOyAvLyBNYXhpbXVtIGRlbGF5IGJldHdlZW4gcmVjb25uZWN0cyAyXjEwICogMjAwMCB+IDM0IG1pbnV0ZXNcbiAgY29uc3QgX0JPRkZfSklUVEVSID0gMC4zOyAvLyBBZGQgcmFuZG9tIGRlbGF5XG5cbiAgbGV0IF9ib2ZmVGltZXIgPSBudWxsO1xuICBsZXQgX2JvZmZJdGVyYXRpb24gPSAwO1xuICBsZXQgX2JvZmZDbG9zZWQgPSBmYWxzZTsgLy8gSW5kaWNhdG9yIGlmIHRoZSBzb2NrZXQgd2FzIG1hbnVhbGx5IGNsb3NlZCAtIGRvbid0IGF1dG9yZWNvbm5lY3QgaWYgdHJ1ZS5cblxuICBsZXQgbG9nID0gKHRleHQsIC4uLmFyZ3MpID0+IHtcbiAgICBpZiAodGhpcy5sb2dnZXIpIHtcbiAgICAgIHRoaXMubG9nZ2VyKHRleHQsIC4uLmFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJhY2tvZmYgaW1wbGVtZW50YXRpb24gLSByZWNvbm5lY3QgYWZ0ZXIgYSB0aW1lb3V0LlxuICBmdW5jdGlvbiBib2ZmUmVjb25uZWN0KCkge1xuICAgIC8vIENsZWFyIHRpbWVyXG4gICAgY2xlYXJUaW1lb3V0KF9ib2ZmVGltZXIpO1xuICAgIC8vIENhbGN1bGF0ZSB3aGVuIHRvIGZpcmUgdGhlIHJlY29ubmVjdCBhdHRlbXB0XG4gICAgY29uc3QgdGltZW91dCA9IF9CT0ZGX0JBU0UgKiAoTWF0aC5wb3coMiwgX2JvZmZJdGVyYXRpb24pICogKDEuMCArIF9CT0ZGX0pJVFRFUiAqIE1hdGgucmFuZG9tKCkpKTtcbiAgICAvLyBVcGRhdGUgaXRlcmF0aW9uIGNvdW50ZXIgZm9yIGZ1dHVyZSB1c2VcbiAgICBfYm9mZkl0ZXJhdGlvbiA9IChfYm9mZkl0ZXJhdGlvbiA+PSBfQk9GRl9NQVhfSVRFUiA/IF9ib2ZmSXRlcmF0aW9uIDogX2JvZmZJdGVyYXRpb24gKyAxKTtcbiAgICBpZiAodGhpcy5vbkF1dG9yZWNvbm5lY3RJdGVyYXRpb24pIHtcbiAgICAgIHRoaXMub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uKHRpbWVvdXQpO1xuICAgIH1cblxuICAgIF9ib2ZmVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGxvZyhgUmVjb25uZWN0aW5nLCBpdGVyPSR7X2JvZmZJdGVyYXRpb259LCB0aW1lb3V0PSR7dGltZW91dH1gKTtcbiAgICAgIC8vIE1heWJlIHRoZSBzb2NrZXQgd2FzIGNsb3NlZCB3aGlsZSB3ZSB3YWl0ZWQgZm9yIHRoZSB0aW1lcj9cbiAgICAgIGlmICghX2JvZmZDbG9zZWQpIHtcbiAgICAgICAgY29uc3QgcHJvbSA9IHRoaXMuY29ubmVjdCgpO1xuICAgICAgICBpZiAodGhpcy5vbkF1dG9yZWNvbm5lY3RJdGVyYXRpb24pIHtcbiAgICAgICAgICB0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbigwLCBwcm9tKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTdXBwcmVzcyBlcnJvciBpZiBpdCdzIG5vdCB1c2VkLlxuICAgICAgICAgIHByb20uY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgLyogZG8gbm90aGluZyAqL1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uKSB7XG4gICAgICAgIHRoaXMub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uKC0xKTtcbiAgICAgIH1cbiAgICB9LCB0aW1lb3V0KTtcbiAgfVxuXG4gIC8vIFRlcm1pbmF0ZSBhdXRvLXJlY29ubmVjdCBwcm9jZXNzLlxuICBmdW5jdGlvbiBib2ZmU3RvcCgpIHtcbiAgICBjbGVhclRpbWVvdXQoX2JvZmZUaW1lcik7XG4gICAgX2JvZmZUaW1lciA9IG51bGw7XG4gIH1cblxuICAvLyBSZXNldCBhdXRvLXJlY29ubmVjdCBpdGVyYXRpb24gY291bnRlci5cbiAgZnVuY3Rpb24gYm9mZlJlc2V0KCkge1xuICAgIF9ib2ZmSXRlcmF0aW9uID0gMDtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemF0aW9uIGZvciBXZWJzb2NrZXRcbiAgZnVuY3Rpb24gaW5pdF93cyhpbnN0YW5jZSkge1xuICAgIGxldCBfc29ja2V0ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYXRlIGEgbmV3IGNvbm5lY3Rpb25cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGhvc3RfIEhvc3QgbmFtZSB0byBjb25uZWN0IHRvOyBpZiA8Y29kZT5udWxsPC9jb2RlPiB0aGUgb2xkIGhvc3QgbmFtZSB3aWxsIGJlIHVzZWQuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZSBGb3JjZSBuZXcgY29ubmVjdGlvbiBldmVuIGlmIG9uZSBhbHJlYWR5IGV4aXN0cy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBQcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIGNvbm5lY3Rpb24gY2FsbCBjb21wbGV0ZXMsIHJlc29sdXRpb24gaXMgY2FsbGVkIHdpdGhvdXRcbiAgICAgKiAgcGFyYW1ldGVycywgcmVqZWN0aW9uIHBhc3NlcyB0aGUge0Vycm9yfSBhcyBwYXJhbWV0ZXIuXG4gICAgICovXG4gICAgaW5zdGFuY2UuY29ubmVjdCA9IGZ1bmN0aW9uKGhvc3RfLCBmb3JjZSkge1xuICAgICAgX2JvZmZDbG9zZWQgPSBmYWxzZTtcblxuICAgICAgaWYgKF9zb2NrZXQpIHtcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBfc29ja2V0LnJlYWR5U3RhdGUgPT0gX3NvY2tldC5PUEVOKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIF9zb2NrZXQuY2xvc2UoKTtcbiAgICAgICAgX3NvY2tldCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChob3N0Xykge1xuICAgICAgICBob3N0ID0gaG9zdF87XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgY29uc3QgdXJsID0gbWFrZUJhc2VVcmwoaG9zdCwgc2VjdXJlID8gJ3dzcycgOiAnd3MnLCBhcGlLZXkpO1xuXG4gICAgICAgIGxvZyhcIkNvbm5lY3RpbmcgdG86IFwiLCB1cmwpO1xuXG4gICAgICAgIC8vIEl0IHRocm93cyB3aGVuIHRoZSBzZXJ2ZXIgaXMgbm90IGFjY2Vzc2libGUgYnV0IHRoZSBleGNlcHRpb24gY2Fubm90IGJlIGNhdWdodDpcbiAgICAgICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzEwMDI1OTIvamF2YXNjcmlwdC1kb2VzbnQtY2F0Y2gtZXJyb3ItaW4td2Vic29ja2V0LWluc3RhbnRpYXRpb24vMzEwMDMwNTdcbiAgICAgICAgY29uc3QgY29ubiA9IG5ldyBXZWJTb2NrZXRQcm92aWRlcih1cmwpO1xuXG4gICAgICAgIGNvbm4ub25lcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29ubi5vbm9wZW4gPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICBpZiAoYXV0b3JlY29ubmVjdCkge1xuICAgICAgICAgICAgYm9mZlN0b3AoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaW5zdGFuY2Uub25PcGVuKSB7XG4gICAgICAgICAgICBpbnN0YW5jZS5vbk9wZW4oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25uLm9uY2xvc2UgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICBfc29ja2V0ID0gbnVsbDtcblxuICAgICAgICAgIGlmIChpbnN0YW5jZS5vbkRpc2Nvbm5lY3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBfYm9mZkNsb3NlZCA/IE5FVFdPUktfVVNFUiA6IE5FVFdPUktfRVJST1I7XG4gICAgICAgICAgICBpbnN0YW5jZS5vbkRpc2Nvbm5lY3QobmV3IEVycm9yKF9ib2ZmQ2xvc2VkID8gTkVUV09SS19VU0VSX1RFWFQgOiBORVRXT1JLX0VSUk9SX1RFWFQgK1xuICAgICAgICAgICAgICAnICgnICsgY29kZSArICcpJyksIGNvZGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghX2JvZmZDbG9zZWQgJiYgYXV0b3JlY29ubmVjdCkge1xuICAgICAgICAgICAgYm9mZlJlY29ubmVjdC5jYWxsKGluc3RhbmNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25uLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgIGlmIChpbnN0YW5jZS5vbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGluc3RhbmNlLm9uTWVzc2FnZShldnQuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIF9zb2NrZXQgPSBjb25uO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJ5IHRvIHJlc3RvcmUgYSBuZXR3b3JrIGNvbm5lY3Rpb24sIGFsc28gcmVzZXQgYmFja29mZi5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlIC0gcmVjb25uZWN0IGV2ZW4gaWYgdGhlcmUgaXMgYSBsaXZlIGNvbm5lY3Rpb24gYWxyZWFkeS5cbiAgICAgKi9cbiAgICBpbnN0YW5jZS5yZWNvbm5lY3QgPSBmdW5jdGlvbihmb3JjZSkge1xuICAgICAgYm9mZlN0b3AoKTtcbiAgICAgIGluc3RhbmNlLmNvbm5lY3QobnVsbCwgZm9yY2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRlcm1pbmF0ZSB0aGUgbmV0d29yayBjb25uZWN0aW9uXG4gICAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgICAqL1xuICAgIGluc3RhbmNlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIF9ib2ZmQ2xvc2VkID0gdHJ1ZTtcbiAgICAgIGJvZmZTdG9wKCk7XG5cbiAgICAgIGlmICghX3NvY2tldCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBfc29ja2V0LmNsb3NlKCk7XG4gICAgICBfc29ja2V0ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgc3RyaW5nIHRvIHRoZSBzZXJ2ZXIuXG4gICAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1zZyAtIFN0cmluZyB0byBzZW5kLlxuICAgICAqIEB0aHJvd3MgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiB0aGUgdW5kZXJseWluZyBjb25uZWN0aW9uIGlzIG5vdCBsaXZlLlxuICAgICAqL1xuICAgIGluc3RhbmNlLnNlbmRUZXh0ID0gZnVuY3Rpb24obXNnKSB7XG4gICAgICBpZiAoX3NvY2tldCAmJiAoX3NvY2tldC5yZWFkeVN0YXRlID09IF9zb2NrZXQuT1BFTikpIHtcbiAgICAgICAgX3NvY2tldC5zZW5kKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJXZWJzb2NrZXQgaXMgbm90IGNvbm5lY3RlZFwiKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgc29ja2V0IGlzIGFsaXZlLlxuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgY29ubmVjdGlvbiBpcyBsaXZlLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGluc3RhbmNlLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gKF9zb2NrZXQgJiYgKF9zb2NrZXQucmVhZHlTdGF0ZSA9PSBfc29ja2V0Lk9QRU4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIG5hbWUgb2YgdGhlIGN1cnJlbnQgbmV0d29yayB0cmFuc3BvcnQuXG4gICAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IG5hbWUgb2YgdGhlIHRyYW5zcG9ydCBzdWNoIGFzIDxjb2RlPlwid3NcIjwvY29kZT4gb3IgPGNvZGU+XCJscFwiPC9jb2RlPi5cbiAgICAgKi9cbiAgICBpbnN0YW5jZS50cmFuc3BvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnd3MnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgbmV0d29yayBwcm9iZSB0byBjaGVjayBpZiBjb25uZWN0aW9uIGlzIGluZGVlZCBsaXZlLlxuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICAgKi9cbiAgICBpbnN0YW5jZS5wcm9iZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaW5zdGFuY2Uuc2VuZFRleHQoJzEnKTtcbiAgICB9XG4gIH1cblxuICAvLyBJbml0aWFsaXphdGlvbiBmb3IgbG9uZyBwb2xsaW5nLlxuICBmdW5jdGlvbiBpbml0X2xwKGluc3RhbmNlKSB7XG4gICAgY29uc3QgWERSX1VOU0VOVCA9IDA7IC8vXHRDbGllbnQgaGFzIGJlZW4gY3JlYXRlZC4gb3BlbigpIG5vdCBjYWxsZWQgeWV0LlxuICAgIGNvbnN0IFhEUl9PUEVORUQgPSAxOyAvL1x0b3BlbigpIGhhcyBiZWVuIGNhbGxlZC5cbiAgICBjb25zdCBYRFJfSEVBREVSU19SRUNFSVZFRCA9IDI7IC8vIHNlbmQoKSBoYXMgYmVlbiBjYWxsZWQsIGFuZCBoZWFkZXJzIGFuZCBzdGF0dXMgYXJlIGF2YWlsYWJsZS5cbiAgICBjb25zdCBYRFJfTE9BRElORyA9IDM7IC8vXHREb3dubG9hZGluZzsgcmVzcG9uc2VUZXh0IGhvbGRzIHBhcnRpYWwgZGF0YS5cbiAgICBjb25zdCBYRFJfRE9ORSA9IDQ7IC8vIFRoZSBvcGVyYXRpb24gaXMgY29tcGxldGUuXG4gICAgLy8gRnVsbHkgY29tcG9zZWQgZW5kcG9pbnQgVVJMLCB3aXRoIEFQSSBrZXkgJiBTSURcbiAgICBsZXQgX2xwVVJMID0gbnVsbDtcblxuICAgIGxldCBfcG9sbGVyID0gbnVsbDtcbiAgICBsZXQgX3NlbmRlciA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBscF9zZW5kZXIodXJsXykge1xuICAgICAgbGV0IHNlbmRlciA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgc2VuZGVyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICBpZiAoc2VuZGVyLnJlYWR5U3RhdGUgPT0gWERSX0RPTkUgJiYgc2VuZGVyLnN0YXR1cyA+PSA0MDApIHtcbiAgICAgICAgICAvLyBTb21lIHNvcnQgb2YgZXJyb3IgcmVzcG9uc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExQIHNlbmRlciBmYWlsZWQsICR7c2VuZGVyLnN0YXR1c31gKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZW5kZXIub3BlbignUE9TVCcsIHVybF8sIHRydWUpO1xuICAgICAgcmV0dXJuIHNlbmRlcjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBscF9wb2xsZXIodXJsXywgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBsZXQgcG9sbGVyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICBsZXQgcHJvbWlzZUNvbXBsZXRlZCA9IGZhbHNlO1xuXG4gICAgICBwb2xsZXIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oZXZ0KSB7XG5cbiAgICAgICAgaWYgKHBvbGxlci5yZWFkeVN0YXRlID09IFhEUl9ET05FKSB7XG4gICAgICAgICAgaWYgKHBvbGxlci5zdGF0dXMgPT0gMjAxKSB7IC8vIDIwMSA9PSBIVFRQLkNyZWF0ZWQsIGdldCBTSURcbiAgICAgICAgICAgIGxldCBwa3QgPSBKU09OLnBhcnNlKHBvbGxlci5yZXNwb25zZVRleHQsIGpzb25QYXJzZUhlbHBlcik7XG4gICAgICAgICAgICBfbHBVUkwgPSB1cmxfICsgJyZzaWQ9JyArIHBrdC5jdHJsLnBhcmFtcy5zaWRcbiAgICAgICAgICAgIHBvbGxlciA9IGxwX3BvbGxlcihfbHBVUkwpO1xuICAgICAgICAgICAgcG9sbGVyLnNlbmQobnVsbClcbiAgICAgICAgICAgIGlmIChpbnN0YW5jZS5vbk9wZW4pIHtcbiAgICAgICAgICAgICAgaW5zdGFuY2Uub25PcGVuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgIHByb21pc2VDb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhdXRvcmVjb25uZWN0KSB7XG4gICAgICAgICAgICAgIGJvZmZTdG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChwb2xsZXIuc3RhdHVzIDwgNDAwKSB7IC8vIDQwMCA9IEhUVFAuQmFkUmVxdWVzdFxuICAgICAgICAgICAgaWYgKGluc3RhbmNlLm9uTWVzc2FnZSkge1xuICAgICAgICAgICAgICBpbnN0YW5jZS5vbk1lc3NhZ2UocG9sbGVyLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvbGxlciA9IGxwX3BvbGxlcihfbHBVUkwpO1xuICAgICAgICAgICAgcG9sbGVyLnNlbmQobnVsbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIERvbid0IHRocm93IGFuIGVycm9yIGhlcmUsIGdyYWNlZnVsbHkgaGFuZGxlIHNlcnZlciBlcnJvcnNcbiAgICAgICAgICAgIGlmIChyZWplY3QgJiYgIXByb21pc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgICAgICAgcHJvbWlzZUNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgIHJlamVjdChwb2xsZXIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpbnN0YW5jZS5vbk1lc3NhZ2UgJiYgcG9sbGVyLnJlc3BvbnNlVGV4dCkge1xuICAgICAgICAgICAgICBpbnN0YW5jZS5vbk1lc3NhZ2UocG9sbGVyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaW5zdGFuY2Uub25EaXNjb25uZWN0KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBwb2xsZXIuc3RhdHVzIHx8IChfYm9mZkNsb3NlZCA/IE5FVFdPUktfVVNFUiA6IE5FVFdPUktfRVJST1IpO1xuICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gcG9sbGVyLnJlc3BvbnNlVGV4dCB8fCAoX2JvZmZDbG9zZWQgPyBORVRXT1JLX1VTRVJfVEVYVCA6IE5FVFdPUktfRVJST1JfVEVYVCk7XG4gICAgICAgICAgICAgIGluc3RhbmNlLm9uRGlzY29ubmVjdChuZXcgRXJyb3IodGV4dCArICcgKCcgKyBjb2RlICsgJyknKSwgY29kZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBvbGxpbmcgaGFzIHN0b3BwZWQuIEluZGljYXRlIGl0IGJ5IHNldHRpbmcgcG9sbGVyIHRvIG51bGwuXG4gICAgICAgICAgICBwb2xsZXIgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFfYm9mZkNsb3NlZCAmJiBhdXRvcmVjb25uZWN0KSB7XG4gICAgICAgICAgICAgIGJvZmZSZWNvbm5lY3QuY2FsbChpbnN0YW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwb2xsZXIub3BlbignR0VUJywgdXJsXywgdHJ1ZSk7XG4gICAgICByZXR1cm4gcG9sbGVyO1xuICAgIH1cblxuICAgIGluc3RhbmNlLmNvbm5lY3QgPSBmdW5jdGlvbihob3N0XywgZm9yY2UpIHtcbiAgICAgIF9ib2ZmQ2xvc2VkID0gZmFsc2U7XG5cbiAgICAgIGlmIChfcG9sbGVyKSB7XG4gICAgICAgIGlmICghZm9yY2UpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgX3BvbGxlci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIF9wb2xsZXIuYWJvcnQoKTtcbiAgICAgICAgX3BvbGxlciA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChob3N0Xykge1xuICAgICAgICBob3N0ID0gaG9zdF87XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgY29uc3QgdXJsID0gbWFrZUJhc2VVcmwoaG9zdCwgc2VjdXJlID8gJ2h0dHBzJyA6ICdodHRwJywgYXBpS2V5KTtcbiAgICAgICAgbG9nKFwiQ29ubmVjdGluZyB0bzogXCIsIHVybCk7XG4gICAgICAgIF9wb2xsZXIgPSBscF9wb2xsZXIodXJsLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICBfcG9sbGVyLnNlbmQobnVsbClcbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgbG9nKFwiTFAgY29ubmVjdGlvbiBmYWlsZWQ6XCIsIGVycik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgaW5zdGFuY2UucmVjb25uZWN0ID0gZnVuY3Rpb24oZm9yY2UpIHtcbiAgICAgIGJvZmZTdG9wKCk7XG4gICAgICBpbnN0YW5jZS5jb25uZWN0KG51bGwsIGZvcmNlKTtcbiAgICB9O1xuXG4gICAgaW5zdGFuY2UuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgX2JvZmZDbG9zZWQgPSB0cnVlO1xuICAgICAgYm9mZlN0b3AoKTtcblxuICAgICAgaWYgKF9zZW5kZXIpIHtcbiAgICAgICAgX3NlbmRlci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIF9zZW5kZXIuYWJvcnQoKTtcbiAgICAgICAgX3NlbmRlciA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoX3BvbGxlcikge1xuICAgICAgICBfcG9sbGVyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgX3BvbGxlci5hYm9ydCgpO1xuICAgICAgICBfcG9sbGVyID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGluc3RhbmNlLm9uRGlzY29ubmVjdCkge1xuICAgICAgICBpbnN0YW5jZS5vbkRpc2Nvbm5lY3QobmV3IEVycm9yKE5FVFdPUktfVVNFUl9URVhUICsgJyAoJyArIE5FVFdPUktfVVNFUiArICcpJyksIE5FVFdPUktfVVNFUik7XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgaXQncyByZWNvbnN0cnVjdGVkXG4gICAgICBfbHBVUkwgPSBudWxsO1xuICAgIH1cblxuICAgIGluc3RhbmNlLnNlbmRUZXh0ID0gZnVuY3Rpb24obXNnKSB7XG4gICAgICBfc2VuZGVyID0gbHBfc2VuZGVyKF9scFVSTCk7XG4gICAgICBpZiAoX3NlbmRlciAmJiAoX3NlbmRlci5yZWFkeVN0YXRlID09IDEpKSB7IC8vIDEgPT0gT1BFTkVEXG4gICAgICAgIF9zZW5kZXIuc2VuZChtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTG9uZyBwb2xsZXIgZmFpbGVkIHRvIGNvbm5lY3RcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGluc3RhbmNlLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gKF9wb2xsZXIgJiYgdHJ1ZSk7XG4gICAgfVxuXG4gICAgaW5zdGFuY2UudHJhbnNwb3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJ2xwJztcbiAgICB9XG5cbiAgICBpbnN0YW5jZS5wcm9iZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaW5zdGFuY2Uuc2VuZFRleHQoJzEnKTtcbiAgICB9XG4gIH1cblxuICBsZXQgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgaWYgKHRyYW5zcG9ydF8gPT09ICdscCcpIHtcbiAgICAvLyBleHBsaWNpdCByZXF1ZXN0IHRvIHVzZSBsb25nIHBvbGxpbmdcbiAgICBpbml0X2xwKHRoaXMpO1xuICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICh0cmFuc3BvcnRfID09PSAnd3MnKSB7XG4gICAgLy8gZXhwbGljaXQgcmVxdWVzdCB0byB1c2Ugd2ViIHNvY2tldFxuICAgIC8vIGlmIHdlYnNvY2tldHMgYXJlIG5vdCBhdmFpbGFibGUsIGhvcnJpYmxlIHRoaW5ncyB3aWxsIGhhcHBlblxuICAgIGluaXRfd3ModGhpcyk7XG4gICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gICAgLy8gRGVmYXVsdCB0cmFuc3BvcnQgc2VsZWN0aW9uXG4gIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyA9PSAnb2JqZWN0Jykge1xuICAgIGlmICh3aW5kb3dbJ1dlYlNvY2tldCddKSB7XG4gICAgICAvLyBVc2luZyB3ZWIgc29ja2V0cyAtLSBkZWZhdWx0LlxuICAgICAgaW5pdF93cyh0aGlzKTtcbiAgICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHdpbmRvd1snWE1MSHR0cFJlcXVlc3QnXSkge1xuICAgICAgLy8gVGhlIGJyb3dzZXIgaGFzIG5vIHdlYnNvY2tldHMsIHVzaW5nIGxvbmcgcG9sbGluZy5cbiAgICAgIGluaXRfbHAodGhpcyk7XG4gICAgICBpbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpbml0aWFsaXplZCkge1xuICAgIC8vIE5vIHRyYW5zcG9ydCBpcyBhdmFpaWxhYmxlLlxuICAgIGxvZyhcIk5vIG5ldHdvcmsgdHJhbnNwb3J0IGlzIGF2YWlsYWJsZS4gUnVubmluZyB1bmRlciBOb2RlPyBDYWxsICdUaW5vZGUuc2V0TmV0d29ya1Byb3ZpZGVycygpJy5cIik7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbmV0d29yayB0cmFuc3BvcnQgaXMgYXZhaWxhYmxlLiBSdW5uaW5nIHVuZGVyIE5vZGU/IENhbGwgJ1Rpbm9kZS5zZXROZXR3b3JrUHJvdmlkZXJzKCknLlwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gbmV0d29yayB0cmFuc3BvcnQgaXMgYXZhaWxhYmxlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0cmFucyAtIGVpdGhlciA8Y29kZT5cIndzXCI8L2NvZGU+ICh3ZWJzb2NrZXQpIG9yIDxjb2RlPlwibHBcIjwvY29kZT4gKGxvbmcgcG9sbGluZykuXG4gICAqIEByZXR1cm5zIHRydWUgaWYgZ2l2ZW4gdHJhbnNwb3J0IGlzIGF2YWlsYWJsZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgdGhpcy50cmFuc3BvcnRBdmFpbGFibGUgPSBmdW5jdGlvbih0cmFuc3ApIHtcbiAgICBzd2l0Y2ggKHRyYW5zcCkge1xuICAgICAgY2FzZSAnd3MnOlxuICAgICAgICByZXR1cm4gdHlwZW9mIHdpbmRvdyA9PSAnb2JqZWN0JyAmJiB3aW5kb3dbJ1dlYlNvY2tldCddO1xuICAgICAgY2FzZSAnbHAnOlxuICAgICAgICByZXR1cm4gdHlwZW9mIHdpbmRvdyA9PSAnb2JqZWN0JyAmJiB3aW5kb3dbJ1hNTEh0dHBSZXF1ZXN0J107XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsb2coXCJSZXF1ZXN0IGZvciB1bmtub3duIHRyYW5zcG9ydFwiLCB0cmFuc3ApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IGF1dG9yZWNvbm5lY3QgY291bnRlciB0byB6ZXJvLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAqL1xuICB0aGlzLmJhY2tvZmZSZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIGJvZmZSZXNldCgpO1xuICB9XG5cbiAgLy8gQ2FsbGJhY2tzOlxuICAvKipcbiAgICogQSBjYWxsYmFjayB0byBwYXNzIGluY29taW5nIG1lc3NhZ2VzIHRvLiBTZWUge0BsaW5rIFRpbm9kZS5Db25uZWN0aW9uI29uTWVzc2FnZX0uXG4gICAqIEBjYWxsYmFjayBUaW5vZGUuQ29ubmVjdGlvbi5Pbk1lc3NhZ2VcbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gTWVzc2FnZSB0byBwcm9jZXNzLlxuICAgKi9cbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgdG8gcGFzcyBpbmNvbWluZyBtZXNzYWdlcyB0by5cbiAgICogQHR5cGUge1Rpbm9kZS5Db25uZWN0aW9uLk9uTWVzc2FnZX1cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKi9cbiAgdGhpcy5vbk1lc3NhZ2UgPSB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgZm9yIHJlcG9ydGluZyBhIGRyb3BwZWQgY29ubmVjdGlvbi5cbiAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAqL1xuICB0aGlzLm9uRGlzY29ubmVjdCA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQSBjYWxsYmFjayBjYWxsZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyByZWFkeSB0byBiZSB1c2VkIGZvciBzZW5kaW5nLiBGb3Igd2Vic29ja2V0cyBpdCdzIHNvY2tldCBvcGVuLFxuICAgKiBmb3IgbG9uZyBwb2xsaW5nIGl0J3MgPGNvZGU+cmVhZHlTdGF0ZT0xPC9jb2RlPiAoT1BFTkVEKVxuICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICovXG4gIHRoaXMub25PcGVuID0gdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBBIGNhbGxiYWNrIHRvIG5vdGlmeSBvZiByZWNvbm5lY3Rpb24gYXR0ZW1wdHMuIFNlZSB7QGxpbmsgVGlub2RlLkNvbm5lY3Rpb24jb25BdXRvcmVjb25uZWN0SXRlcmF0aW9ufS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uXG4gICAqIEBjYWxsYmFjayBBdXRvcmVjb25uZWN0SXRlcmF0aW9uVHlwZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGltZW91dCAtIHRpbWUgdGlsbCB0aGUgbmV4dCByZWNvbm5lY3QgYXR0ZW1wdCBpbiBtaWxsaXNlY29uZHMuIDxjb2RlPi0xPC9jb2RlPiBtZWFucyByZWNvbm5lY3Qgd2FzIHNraXBwZWQuXG4gICAqIEBwYXJhbSB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIHRoZSByZWNvbm5lY3QgYXR0ZW1wIGNvbXBsZXRlcy5cbiAgICpcbiAgICovXG4gIC8qKlxuICAgKiBBIGNhbGxiYWNrIHRvIGluZm9ybSB3aGVuIHRoZSBuZXh0IGF0dGFtcHQgdG8gcmVjb25uZWN0IHdpbGwgaGFwcGVuIGFuZCB0byByZWNlaXZlIGNvbm5lY3Rpb24gcHJvbWlzZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKiBAdHlwZSB7VGlub2RlLkNvbm5lY3Rpb24uQXV0b3JlY29ubmVjdEl0ZXJhdGlvblR5cGV9XG4gICAqL1xuICB0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbiA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQSBjYWxsYmFjayB0byBsb2cgZXZlbnRzIGZyb20gQ29ubmVjdGlvbi4gU2VlIHtAbGluayBUaW5vZGUuQ29ubmVjdGlvbiNsb2dnZXJ9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb25cbiAgICogQGNhbGxiYWNrIExvZ2dlckNhbGxiYWNrVHlwZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBFdmVudCB0byBsb2cuXG4gICAqL1xuICAvKipcbiAgICogQSBjYWxsYmFjayB0byByZXBvcnQgbG9nZ2luZyBldmVudHMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICogQHR5cGUge1Rpbm9kZS5Db25uZWN0aW9uLkxvZ2dlckNhbGxiYWNrVHlwZX1cbiAgICovXG4gIHRoaXMubG9nZ2VyID0gdW5kZWZpbmVkO1xufTtcblxuLyoqXG4gKiBAY2xhc3MgVGlub2RlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyAtIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcuYXBwTmFtZSAtIE5hbWUgb2YgdGhlIGNhbGxpbmcgYXBwbGljYXRpb24gdG8gYmUgcmVwb3J0ZWQgaW4gdGhlIFVzZXIgQWdlbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmhvc3QgLSBIb3N0IG5hbWUgYW5kIHBvcnQgbnVtYmVyIHRvIGNvbm5lY3QgdG8uXG4gKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFwaUtleSAtIEFQSSBrZXkgZ2VuZXJhdGVkIGJ5IDxjb2RlPmtleWdlbjwvY29kZT4uXG4gKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLnRyYW5zcG9ydCAtIFNlZSB7QGxpbmsgVGlub2RlLkNvbm5lY3Rpb24jdHJhbnNwb3J0fS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY29uZmlnLnNlY3VyZSAtIFVzZSBTZWN1cmUgV2ViU29ja2V0IGlmIDxjb2RlPnRydWU8L2NvZGU+LlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5wbGF0Zm9ybSAtIE9wdGlvbmFsIHBsYXRmb3JtIGlkZW50aWZpZXIsIG9uZSBvZiA8Y29kZT5cImlvc1wiPC9jb2RlPiwgPGNvZGU+XCJ3ZWJcIjwvY29kZT4sIDxjb2RlPlwiYW5kcm9pZFwiPC9jb2RlPi5cbiAqIEBwYXJhbSB7Ym9vbGVufSBjb25maWcucGVyc2lzdCAtIHVzZSBpbmRleERCIHBlcnNpc3RlbnQgc3RvcmFnZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uQ29tcGxldGUgLSBjYWxsYmFjayB0byBjYWxsIHdoZW4gaW5pdGlhbGl6YXRpb24gaXMgY29tcGxldGVkLlxuICovXG52YXIgVGlub2RlID0gZnVuY3Rpb24oY29uZmlnLCBvbkNvbXBsZXRlKSB7XG4gIC8vIENsaWVudC1wcm92aWRlZCBhcHBsaWNhdGlvbiBuYW1lLCBmb3JtYXQgPE5hbWU+Lzx2ZXJzaW9uIG51bWJlcj5cbiAgdGhpcy5fYXBwTmFtZSA9IGNvbmZpZy5hcHBOYW1lIHx8IFwiVW5kZWZpbmVkXCI7XG5cbiAgLy8gQVBJIEtleS5cbiAgdGhpcy5fYXBpS2V5ID0gY29uZmlnLmFwaUtleTtcblxuICAvLyBOYW1lIGFuZCB2ZXJzaW9uIG9mIHRoZSBicm93c2VyLlxuICB0aGlzLl9icm93c2VyID0gJyc7XG4gIHRoaXMuX3BsYXRmb3JtID0gY29uZmlnLnBsYXRmb3JtIHx8ICd3ZWInO1xuICB0aGlzLl9od29zID0gJ3VuZGVmaW5lZCc7XG4gIHRoaXMuX2h1bWFuTGFuZ3VhZ2UgPSAneHgnO1xuICAvLyBVbmRlcmx5aW5nIE9TLlxuICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMuX2Jyb3dzZXIgPSBnZXRCcm93c2VySW5mbyhuYXZpZ2F0b3IudXNlckFnZW50LCBuYXZpZ2F0b3IucHJvZHVjdCk7XG4gICAgdGhpcy5faHdvcyA9IG5hdmlnYXRvci5wbGF0Zm9ybTtcbiAgICAvLyBUaGlzIGlzIHRoZSBkZWZhdWx0IGxhbmd1YWdlLiBJdCBjb3VsZCBiZSBjaGFuZ2VkIGJ5IGNsaWVudC5cbiAgICB0aGlzLl9odW1hbkxhbmd1YWdlID0gbmF2aWdhdG9yLmxhbmd1YWdlIHx8ICdlbi1VUyc7XG4gIH1cbiAgLy8gTG9nZ2luZyB0byBjb25zb2xlIGVuYWJsZWRcbiAgdGhpcy5fbG9nZ2luZ0VuYWJsZWQgPSBmYWxzZTtcbiAgLy8gV2hlbiBsb2dnaW5nLCB0cmlwIGxvbmcgc3RyaW5ncyAoYmFzZTY0LWVuY29kZWQgaW1hZ2VzKSBmb3IgcmVhZGFiaWxpdHlcbiAgdGhpcy5fdHJpbUxvbmdTdHJpbmdzID0gZmFsc2U7XG4gIC8vIFVJRCBvZiB0aGUgY3VycmVudGx5IGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgdGhpcy5fbXlVSUQgPSBudWxsO1xuICAvLyBTdGF0dXMgb2YgY29ubmVjdGlvbjogYXV0aGVudGljYXRlZCBvciBub3QuXG4gIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgLy8gTG9naW4gdXNlZCBpbiB0aGUgbGFzdCBzdWNjZXNzZnVsIGJhc2ljIGF1dGhlbnRpY2F0aW9uXG4gIHRoaXMuX2xvZ2luID0gbnVsbDtcbiAgLy8gVG9rZW4gd2hpY2ggY2FuIGJlIHVzZWQgZm9yIGxvZ2luIGluc3RlYWQgb2YgbG9naW4vcGFzc3dvcmQuXG4gIHRoaXMuX2F1dGhUb2tlbiA9IG51bGw7XG4gIC8vIENvdW50ZXIgb2YgcmVjZWl2ZWQgcGFja2V0c1xuICB0aGlzLl9pblBhY2tldENvdW50ID0gMDtcbiAgLy8gQ291bnRlciBmb3IgZ2VuZXJhdGluZyB1bmlxdWUgbWVzc2FnZSBJRHNcbiAgdGhpcy5fbWVzc2FnZUlkID0gTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIDB4RkZGRikgKyAweEZGRkYpO1xuICAvLyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc2VydmVyLCBpZiBjb25uZWN0ZWRcbiAgdGhpcy5fc2VydmVySW5mbyA9IG51bGw7XG4gIC8vIFB1c2ggbm90aWZpY2F0aW9uIHRva2VuLiBDYWxsZWQgZGV2aWNlVG9rZW4gZm9yIGNvbnNpc3RlbmN5IHdpdGggdGhlIEFuZHJvaWQgU0RLLlxuICB0aGlzLl9kZXZpY2VUb2tlbiA9IG51bGw7XG5cbiAgLy8gQ2FjaGUgb2YgcGVuZGluZyBwcm9taXNlcyBieSBtZXNzYWdlIGlkLlxuICB0aGlzLl9wZW5kaW5nUHJvbWlzZXMgPSB7fTtcblxuICAvLyBUaGUgVGltZW91dCBvYmplY3QgcmV0dXJuZWQgYnkgdGhlIHJlamVjdCBleHBpcmVkIHByb21pc2VzIHNldEludGVydmFsLlxuICB0aGlzLl9leHBpcmVQcm9taXNlcyA9IG51bGw7XG5cbiAgLyoqIEEgY29ubmVjdGlvbiBvYmplY3QsIHNlZSB7QGxpbmsgVGlub2RlLkNvbm5lY3Rpb259LiAqL1xuICB0aGlzLl9jb25uZWN0aW9uID0gbmV3IENvbm5lY3Rpb24oY29uZmlnLmhvc3QsIGNvbmZpZy5hcGlLZXksIGNvbmZpZy50cmFuc3BvcnQsIGNvbmZpZy5zZWN1cmUsIHRydWUpO1xuICAvLyBDb25zb2xlIGxvZ2dlci4gQmFiZWwgc29tZWhvdyBmYWlscyB0byBwYXJzZSAnLi4ucmVzdCcgcGFyYW1ldGVyLlxuICB0aGlzLmxvZ2dlciA9IChzdHIsIC4uLmFyZ3MpID0+IHtcbiAgICBpZiAodGhpcy5fbG9nZ2luZ0VuYWJsZWQpIHtcbiAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSgpXG4gICAgICBjb25zdCBkYXRlU3RyaW5nID0gKCcwJyArIGQuZ2V0VVRDSG91cnMoKSkuc2xpY2UoLTIpICsgJzonICtcbiAgICAgICAgKCcwJyArIGQuZ2V0VVRDTWludXRlcygpKS5zbGljZSgtMikgKyAnOicgK1xuICAgICAgICAoJzAnICsgZC5nZXRVVENTZWNvbmRzKCkpLnNsaWNlKC0yKSArICcuJyArXG4gICAgICAgICgnMDAnICsgZC5nZXRVVENNaWxsaXNlY29uZHMoKSkuc2xpY2UoLTMpO1xuXG4gICAgICBjb25zb2xlLmxvZygnWycgKyBkYXRlU3RyaW5nICsgJ10nLCBzdHIsIGFyZ3Muam9pbignICcpKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5fY29ubmVjdGlvbi5sb2dnZXIgPSB0aGlzLmxvZ2dlcjtcbiAgRHJhZnR5LmxvZ2dlciA9IHRoaXMubG9nZ2VyO1xuXG4gIC8vIFRpbWVzdGFtcCBvZiB0aGUgbW9zdCByZWNlbnQgdXBkYXRlIHRvIHRvcGljcyBpbiBjYWNoZS5cbiAgdGhpcy5fbGFzdFRvcGljVXBkYXRlID0gbnVsbDtcblxuICAvLyBUaW5vZGUncyBjYWNoZSBvZiBvYmplY3RzXG4gIHRoaXMuX2NhY2hlID0ge307XG5cbiAgY29uc3QgY2FjaGVQdXQgPSB0aGlzLmNhY2hlUHV0ID0gKHR5cGUsIG5hbWUsIG9iaikgPT4ge1xuICAgIHRoaXMuX2NhY2hlW3R5cGUgKyAnOicgKyBuYW1lXSA9IG9iajtcbiAgfVxuXG4gIGNvbnN0IGNhY2hlR2V0ID0gdGhpcy5jYWNoZUdldCA9ICh0eXBlLCBuYW1lKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlW3R5cGUgKyAnOicgKyBuYW1lXTtcbiAgfVxuXG4gIGNvbnN0IGNhY2hlRGVsID0gdGhpcy5jYWNoZURlbCA9ICh0eXBlLCBuYW1lKSA9PiB7XG4gICAgZGVsZXRlIHRoaXMuX2NhY2hlW3R5cGUgKyAnOicgKyBuYW1lXTtcbiAgfVxuICAvLyBFbnVtZXJhdGUgYWxsIGl0ZW1zIGluIGNhY2hlLCBjYWxsIGZ1bmMgZm9yIGVhY2ggaXRlbS5cbiAgLy8gRW51bWVyYXRpb24gc3RvcHMgaWYgZnVuYyByZXR1cm5zIHRydWUuXG4gIGNvbnN0IGNhY2hlTWFwID0gdGhpcy5jYWNoZU1hcCA9ICh0eXBlLCBmdW5jLCBjb250ZXh0KSA9PiB7XG4gICAgY29uc3Qga2V5ID0gdHlwZSA/IHR5cGUgKyAnOicgOiB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgaWR4IGluIHRoaXMuX2NhY2hlKSB7XG4gICAgICBpZiAoIWtleSB8fCBpZHguaW5kZXhPZihrZXkpID09IDApIHtcbiAgICAgICAgaWYgKGZ1bmMuY2FsbChjb250ZXh0LCB0aGlzLl9jYWNoZVtpZHhdLCBpZHgpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBNYWtlIGxpbWl0ZWQgY2FjaGUgbWFuYWdlbWVudCBhdmFpbGFibGUgdG8gdG9waWMuXG4gIC8vIENhY2hpbmcgdXNlci5wdWJsaWMgb25seS4gRXZlcnl0aGluZyBlbHNlIGlzIHBlci10b3BpYy5cbiAgdGhpcy5hdHRhY2hDYWNoZVRvVG9waWMgPSAodG9waWMpID0+IHtcbiAgICB0b3BpYy5fdGlub2RlID0gdGhpcztcblxuICAgIHRvcGljLl9jYWNoZUdldFVzZXIgPSAodWlkKSA9PiB7XG4gICAgICBjb25zdCBwdWIgPSBjYWNoZUdldCgndXNlcicsIHVpZCk7XG4gICAgICBpZiAocHViKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdXNlcjogdWlkLFxuICAgICAgICAgIHB1YmxpYzogbWVyZ2VPYmooe30sIHB1YilcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfTtcbiAgICB0b3BpYy5fY2FjaGVQdXRVc2VyID0gKHVpZCwgdXNlcikgPT4ge1xuICAgICAgcmV0dXJuIGNhY2hlUHV0KCd1c2VyJywgdWlkLCBtZXJnZU9iaih7fSwgdXNlci5wdWJsaWMpKTtcbiAgICB9O1xuICAgIHRvcGljLl9jYWNoZURlbFVzZXIgPSAodWlkKSA9PiB7XG4gICAgICByZXR1cm4gY2FjaGVEZWwoJ3VzZXInLCB1aWQpO1xuICAgIH07XG4gICAgdG9waWMuX2NhY2hlUHV0U2VsZiA9ICgpID0+IHtcbiAgICAgIGlmICh0b3BpYy51cGRhdGVkICYmIHRvcGljLnVwZGF0ZWQgPiB0aGlzLl9sYXN0VG9waWNVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5fbGFzdFRvcGljVXBkYXRlID0gdG9waWMudXBkYXRlZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjYWNoZVB1dCgndG9waWMnLCB0b3BpYy5uYW1lLCB0b3BpYyk7XG4gICAgfVxuICAgIHRvcGljLl9jYWNoZURlbFNlbGYgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gY2FjaGVEZWwoJ3RvcGljJywgdG9waWMubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVXNlIGluZGV4REIgZm9yIGNhY2hpbmcgdG9waWNzIGFuZCBtZXNzYWdlcy5cbiAgdGhpcy5fcGVyc2lzdCA9IGNvbmZpZy5wZXJzaXN0O1xuICAvLyBJbml0aWFsaXplIG9iamVjdCByZWdhcmRsZXNzLiBJdCBzaW1wbGlmaWVzIHRoZSBjb2RlLlxuICB0aGlzLl9kYiA9IERCKChlcnIpID0+IHtcbiAgICB0aGlzLmxvZ2dlcihcIkRCXCIsIGVycik7XG4gIH0sIHRoaXMubG9nZ2VyKTtcblxuICBpZiAodGhpcy5fcGVyc2lzdCkge1xuICAgIC8vIENyZWF0ZSB0aGUgcGVyc2lzdGVudCBjYWNoZSBhbmQgcmVhZCB0b3BpY3MgaW50byBtZW1vcnkuXG4gICAgdGhpcy5fZGIuaW5pdERhdGFiYXNlKCkudGhlbigoKSA9PiB7XG4gICAgICAvLyBTdG9yZSBwcm9taXNlcyB0byBiZSByZXNvbHZlZCB3aGVuIG1lc3NhZ2VzIGxvYWQgaW50byBtZW1vcnkuXG4gICAgICBjb25zdCBtc2dzID0gW107XG4gICAgICAvLyBMb2FkIHRvcGljcyB0byBtZW1vcnkuXG4gICAgICByZXR1cm4gdGhpcy5fZGIubWFwVG9waWNzKChkYXRhKSA9PiB7XG4gICAgICAgIGxldCB0b3BpYyA9IHRoaXMuY2FjaGVHZXQoJ3RvcGljJywgZGF0YS5uYW1lKTtcbiAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLm5hbWUgPT0gVE9QSUNfTUUpIHtcbiAgICAgICAgICB0b3BpYyA9IG5ldyBUb3BpY01lKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5uYW1lID09IFRPUElDX0ZORCkge1xuICAgICAgICAgIHRvcGljID0gbmV3IFRvcGljRm5kKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9waWMgPSBuZXcgVG9waWMoZGF0YS5uYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2RiLmRlc2VyaWFsaXplVG9waWModG9waWMsIGRhdGEpO1xuICAgICAgICB0aGlzLmF0dGFjaENhY2hlVG9Ub3BpYyh0b3BpYyk7XG4gICAgICAgIHRvcGljLl9jYWNoZVB1dFNlbGYoKTtcbiAgICAgICAgLy8gUmVxdWVzdCB0byBsb2FkIG1lc3NhZ2VzIGFuZCBzYXZlIHRoZSBwcm9taXNlLlxuICAgICAgICBtc2dzLnB1c2godG9waWMuX2xvYWRNZXNzYWdlcyh0aGlzLl9kYikpO1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vIFdhaXQgZm9yIGFsbCBtZXNzYWdlcyB0byBsb2FkLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwobXNncyk7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKG9uQ29tcGxldGUpIHtcbiAgICAgICAgICBvbkNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2dnZXIoXCJQZXJzaXN0ZW50IGNhY2hlIGluaXRpYWxpemVkLlwiKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gUmVzb2x2ZSBvciByZWplY3QgYSBwZW5kaW5nIHByb21pc2UuXG4gIC8vIFVucmVzb2x2ZWQgcHJvbWlzZXMgYXJlIHN0b3JlZCBpbiBfcGVuZGluZ1Byb21pc2VzLlxuICBjb25zdCBleGVjUHJvbWlzZSA9IChpZCwgY29kZSwgb25PSywgZXJyb3JUZXh0KSA9PiB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5fcGVuZGluZ1Byb21pc2VzW2lkXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICBkZWxldGUgdGhpcy5fcGVuZGluZ1Byb21pc2VzW2lkXTtcbiAgICAgIGlmIChjb2RlID49IDIwMCAmJiBjb2RlIDwgNDAwKSB7XG4gICAgICAgIGlmIChjYWxsYmFja3MucmVzb2x2ZSkge1xuICAgICAgICAgIGNhbGxiYWNrcy5yZXNvbHZlKG9uT0spO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNhbGxiYWNrcy5yZWplY3QpIHtcbiAgICAgICAgY2FsbGJhY2tzLnJlamVjdChuZXcgRXJyb3IoYCR7ZXJyb3JUZXh0fSAoJHtjb2RlfSlgKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gR2VuZXJhdG9yIG9mIGRlZmF1bHQgcHJvbWlzZXMgZm9yIHNlbnQgcGFja2V0cy5cbiAgY29uc3QgbWFrZVByb21pc2UgPSAoaWQpID0+IHtcbiAgICBsZXQgcHJvbWlzZSA9IG51bGw7XG4gICAgaWYgKGlkKSB7XG4gICAgICBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAvLyBTdG9yZWQgY2FsbGJhY2tzIHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIHJlc3BvbnNlIHBhY2tldCB3aXRoIHRoaXMgSWQgYXJyaXZlc1xuICAgICAgICB0aGlzLl9wZW5kaW5nUHJvbWlzZXNbaWRdID0ge1xuICAgICAgICAgICdyZXNvbHZlJzogcmVzb2x2ZSxcbiAgICAgICAgICAncmVqZWN0JzogcmVqZWN0LFxuICAgICAgICAgICd0cyc6IG5ldyBEYXRlKClcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgLy8gR2VuZXJhdGVzIHVuaXF1ZSBtZXNzYWdlIElEc1xuICBjb25zdCBnZXROZXh0VW5pcXVlSWQgPSB0aGlzLmdldE5leHRVbmlxdWVJZCA9ICgpID0+IHtcbiAgICByZXR1cm4gKHRoaXMuX21lc3NhZ2VJZCAhPSAwKSA/ICcnICsgdGhpcy5fbWVzc2FnZUlkKysgOiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBHZXQgVXNlciBBZ2VudCBzdHJpbmdcbiAgY29uc3QgZ2V0VXNlckFnZW50ID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLl9hcHBOYW1lICsgJyAoJyArICh0aGlzLl9icm93c2VyID8gdGhpcy5fYnJvd3NlciArICc7ICcgOiAnJykgKyB0aGlzLl9od29zICsgJyk7ICcgKyBMSUJSQVJZO1xuICB9XG5cbiAgLy8gR2VuZXJhdG9yIG9mIHBhY2tldHMgc3R1YnNcbiAgdGhpcy5pbml0UGFja2V0ID0gKHR5cGUsIHRvcGljKSA9PiB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdoaSc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ2hpJzoge1xuICAgICAgICAgICAgJ2lkJzogZ2V0TmV4dFVuaXF1ZUlkKCksXG4gICAgICAgICAgICAndmVyJzogVkVSU0lPTixcbiAgICAgICAgICAgICd1YSc6IGdldFVzZXJBZ2VudCgpLFxuICAgICAgICAgICAgJ2Rldic6IHRoaXMuX2RldmljZVRva2VuLFxuICAgICAgICAgICAgJ2xhbmcnOiB0aGlzLl9odW1hbkxhbmd1YWdlLFxuICAgICAgICAgICAgJ3BsYXRmJzogdGhpcy5fcGxhdGZvcm1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ2FjYyc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ2FjYyc6IHtcbiAgICAgICAgICAgICdpZCc6IGdldE5leHRVbmlxdWVJZCgpLFxuICAgICAgICAgICAgJ3VzZXInOiBudWxsLFxuICAgICAgICAgICAgJ3NjaGVtZSc6IG51bGwsXG4gICAgICAgICAgICAnc2VjcmV0JzogbnVsbCxcbiAgICAgICAgICAgICdsb2dpbic6IGZhbHNlLFxuICAgICAgICAgICAgJ3RhZ3MnOiBudWxsLFxuICAgICAgICAgICAgJ2Rlc2MnOiB7fSxcbiAgICAgICAgICAgICdjcmVkJzoge31cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ2xvZ2luJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAnbG9naW4nOiB7XG4gICAgICAgICAgICAnaWQnOiBnZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICdzY2hlbWUnOiBudWxsLFxuICAgICAgICAgICAgJ3NlY3JldCc6IG51bGxcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ3N1Yic6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ3N1Yic6IHtcbiAgICAgICAgICAgICdpZCc6IGdldE5leHRVbmlxdWVJZCgpLFxuICAgICAgICAgICAgJ3RvcGljJzogdG9waWMsXG4gICAgICAgICAgICAnc2V0Jzoge30sXG4gICAgICAgICAgICAnZ2V0Jzoge31cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ2xlYXZlJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAnbGVhdmUnOiB7XG4gICAgICAgICAgICAnaWQnOiBnZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICd0b3BpYyc6IHRvcGljLFxuICAgICAgICAgICAgJ3Vuc3ViJzogZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ3B1Yic6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ3B1Yic6IHtcbiAgICAgICAgICAgICdpZCc6IGdldE5leHRVbmlxdWVJZCgpLFxuICAgICAgICAgICAgJ3RvcGljJzogdG9waWMsXG4gICAgICAgICAgICAnbm9lY2hvJzogZmFsc2UsXG4gICAgICAgICAgICAnaGVhZCc6IG51bGwsXG4gICAgICAgICAgICAnY29udGVudCc6IHt9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdnZXQnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdnZXQnOiB7XG4gICAgICAgICAgICAnaWQnOiBnZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICd0b3BpYyc6IHRvcGljLFxuICAgICAgICAgICAgJ3doYXQnOiBudWxsLCAvLyBkYXRhLCBzdWIsIGRlc2MsIHNwYWNlIHNlcGFyYXRlZCBsaXN0OyB1bmtub3duIHN0cmluZ3MgYXJlIGlnbm9yZWRcbiAgICAgICAgICAgICdkZXNjJzoge30sXG4gICAgICAgICAgICAnc3ViJzoge30sXG4gICAgICAgICAgICAnZGF0YSc6IHt9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdzZXQnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdzZXQnOiB7XG4gICAgICAgICAgICAnaWQnOiBnZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICd0b3BpYyc6IHRvcGljLFxuICAgICAgICAgICAgJ2Rlc2MnOiB7fSxcbiAgICAgICAgICAgICdzdWInOiB7fSxcbiAgICAgICAgICAgICd0YWdzJzogW11cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ2RlbCc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ2RlbCc6IHtcbiAgICAgICAgICAgICdpZCc6IGdldE5leHRVbmlxdWVJZCgpLFxuICAgICAgICAgICAgJ3RvcGljJzogdG9waWMsXG4gICAgICAgICAgICAnd2hhdCc6IG51bGwsXG4gICAgICAgICAgICAnZGVsc2VxJzogbnVsbCxcbiAgICAgICAgICAgICd1c2VyJzogbnVsbCxcbiAgICAgICAgICAgICdoYXJkJzogZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ25vdGUnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdub3RlJzoge1xuICAgICAgICAgICAgLy8gbm8gaWQgYnkgZGVzaWduXG4gICAgICAgICAgICAndG9waWMnOiB0b3BpYyxcbiAgICAgICAgICAgICd3aGF0JzogbnVsbCwgLy8gb25lIG9mIFwicmVjdlwiLCBcInJlYWRcIiwgXCJrcFwiXG4gICAgICAgICAgICAnc2VxJzogdW5kZWZpbmVkIC8vIHRoZSBzZXJ2ZXItc2lkZSBtZXNzYWdlIGlkIGFrbm93bGVkZ2VkIGFzIHJlY2VpdmVkIG9yIHJlYWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwYWNrZXQgdHlwZSByZXF1ZXN0ZWQ6ICR7dHlwZX1gKTtcbiAgICB9XG4gIH1cblxuICAvLyBTZW5kIGEgcGFja2V0LiBJZiBwYWNrZXQgaWQgaXMgcHJvdmlkZWQgcmV0dXJuIGEgcHJvbWlzZS5cbiAgdGhpcy5zZW5kID0gKHBrdCwgaWQpID0+IHtcbiAgICBsZXQgcHJvbWlzZTtcbiAgICBpZiAoaWQpIHtcbiAgICAgIHByb21pc2UgPSBtYWtlUHJvbWlzZShpZCk7XG4gICAgfVxuICAgIHBrdCA9IHNpbXBsaWZ5KHBrdCk7XG4gICAgbGV0IG1zZyA9IEpTT04uc3RyaW5naWZ5KHBrdCk7XG4gICAgdGhpcy5sb2dnZXIoXCJvdXQ6IFwiICsgKHRoaXMuX3RyaW1Mb25nU3RyaW5ncyA/IEpTT04uc3RyaW5naWZ5KHBrdCwganNvbkxvZ2dlckhlbHBlcikgOiBtc2cpKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fY29ubmVjdGlvbi5zZW5kVGV4dChtc2cpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gSWYgc2VuZFRleHQgdGhyb3dzLCB3cmFwIHRoZSBlcnJvciBpbiBhIHByb21pc2Ugb3IgcmV0aHJvdy5cbiAgICAgIGlmIChpZCkge1xuICAgICAgICBleGVjUHJvbWlzZShpZCwgTkVUV09SS19FUlJPUiwgbnVsbCwgZXJyLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIC8vIE9uIHN1Y2Nlc3NmdWwgbG9naW4gc2F2ZSBzZXJ2ZXItcHJvdmlkZWQgZGF0YS5cbiAgdGhpcy5sb2dpblN1Y2Nlc3NmdWwgPSAoY3RybCkgPT4ge1xuICAgIGlmICghY3RybC5wYXJhbXMgfHwgIWN0cmwucGFyYW1zLnVzZXIpIHtcbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH1cbiAgICAvLyBUaGlzIGlzIGEgcmVzcG9uc2UgdG8gYSBzdWNjZXNzZnVsIGxvZ2luLFxuICAgIC8vIGV4dHJhY3QgVUlEIGFuZCBzZWN1cml0eSB0b2tlbiwgc2F2ZSBpdCBpbiBUaW5vZGUgbW9kdWxlXG4gICAgdGhpcy5fbXlVSUQgPSBjdHJsLnBhcmFtcy51c2VyO1xuICAgIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSAoY3RybCAmJiBjdHJsLmNvZGUgPj0gMjAwICYmIGN0cmwuY29kZSA8IDMwMCk7XG4gICAgaWYgKGN0cmwucGFyYW1zICYmIGN0cmwucGFyYW1zLnRva2VuICYmIGN0cmwucGFyYW1zLmV4cGlyZXMpIHtcbiAgICAgIHRoaXMuX2F1dGhUb2tlbiA9IHtcbiAgICAgICAgdG9rZW46IGN0cmwucGFyYW1zLnRva2VuLFxuICAgICAgICBleHBpcmVzOiBuZXcgRGF0ZShjdHJsLnBhcmFtcy5leHBpcmVzKVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYXV0aFRva2VuID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vbkxvZ2luKSB7XG4gICAgICB0aGlzLm9uTG9naW4oY3RybC5jb2RlLCBjdHJsLnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBjdHJsO1xuICB9XG5cbiAgLy8gVGhlIG1haW4gbWVzc2FnZSBkaXNwYXRjaGVyLlxuICB0aGlzLl9jb25uZWN0aW9uLm9uTWVzc2FnZSA9IChkYXRhKSA9PiB7XG4gICAgLy8gU2tpcCBlbXB0eSByZXNwb25zZS4gVGhpcyBoYXBwZW5zIHdoZW4gTFAgdGltZXMgb3V0LlxuICAgIGlmICghZGF0YSkgcmV0dXJuO1xuXG4gICAgdGhpcy5faW5QYWNrZXRDb3VudCsrO1xuXG4gICAgLy8gU2VuZCByYXcgbWVzc2FnZSB0byBsaXN0ZW5lclxuICAgIGlmICh0aGlzLm9uUmF3TWVzc2FnZSkge1xuICAgICAgdGhpcy5vblJhd01lc3NhZ2UoZGF0YSk7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEgPT09ICcwJykge1xuICAgICAgLy8gU2VydmVyIHJlc3BvbnNlIHRvIGEgbmV0d29yayBwcm9iZS5cbiAgICAgIGlmICh0aGlzLm9uTmV0d29ya1Byb2JlKSB7XG4gICAgICAgIHRoaXMub25OZXR3b3JrUHJvYmUoKTtcbiAgICAgIH1cbiAgICAgIC8vIE5vIHByb2Nlc3NpbmcgaXMgbmVjZXNzYXJ5LlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBwa3QgPSBKU09OLnBhcnNlKGRhdGEsIGpzb25QYXJzZUhlbHBlcik7XG4gICAgaWYgKCFwa3QpIHtcbiAgICAgIHRoaXMubG9nZ2VyKFwiaW46IFwiICsgZGF0YSk7XG4gICAgICB0aGlzLmxvZ2dlcihcIkVSUk9SOiBmYWlsZWQgdG8gcGFyc2UgZGF0YVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5sb2dnZXIoXCJpbjogXCIgKyAodGhpcy5fdHJpbUxvbmdTdHJpbmdzID8gSlNPTi5zdHJpbmdpZnkocGt0LCBqc29uTG9nZ2VySGVscGVyKSA6IGRhdGEpKTtcblxuICAgICAgLy8gU2VuZCBjb21wbGV0ZSBwYWNrZXQgdG8gbGlzdGVuZXJcbiAgICAgIGlmICh0aGlzLm9uTWVzc2FnZSkge1xuICAgICAgICB0aGlzLm9uTWVzc2FnZShwa3QpO1xuICAgICAgfVxuXG4gICAgICBpZiAocGt0LmN0cmwpIHtcbiAgICAgICAgLy8gSGFuZGxpbmcge2N0cmx9IG1lc3NhZ2VcbiAgICAgICAgaWYgKHRoaXMub25DdHJsTWVzc2FnZSkge1xuICAgICAgICAgIHRoaXMub25DdHJsTWVzc2FnZShwa3QuY3RybCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNvbHZlIG9yIHJlamVjdCBhIHBlbmRpbmcgcHJvbWlzZSwgaWYgYW55XG4gICAgICAgIGlmIChwa3QuY3RybC5pZCkge1xuICAgICAgICAgIGV4ZWNQcm9taXNlKHBrdC5jdHJsLmlkLCBwa3QuY3RybC5jb2RlLCBwa3QuY3RybCwgcGt0LmN0cmwudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKHBrdC5jdHJsLmNvZGUgPT0gMjA1ICYmIHBrdC5jdHJsLnRleHQgPT0gJ2V2aWN0ZWQnKSB7XG4gICAgICAgICAgICAvLyBVc2VyIGV2aWN0ZWQgZnJvbSB0b3BpYy5cbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LmN0cmwudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9yZXNldFN1YigpO1xuICAgICAgICAgICAgICBpZiAocGt0LmN0cmwucGFyYW1zICYmIHBrdC5jdHJsLnBhcmFtcy51bnN1Yikge1xuICAgICAgICAgICAgICAgIHRvcGljLl9nb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBrdC5jdHJsLnBhcmFtcyAmJiBwa3QuY3RybC5wYXJhbXMud2hhdCA9PSAnZGF0YScpIHtcbiAgICAgICAgICAgIC8vIEFsbCBtZXNzYWdlcyByZWNlaXZlZDogXCJwYXJhbXNcIjp7XCJjb3VudFwiOjExLFwid2hhdFwiOlwiZGF0YVwifSxcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LmN0cmwudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9hbGxNZXNzYWdlc1JlY2VpdmVkKHBrdC5jdHJsLnBhcmFtcy5jb3VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChwa3QuY3RybC5wYXJhbXMgJiYgcGt0LmN0cmwucGFyYW1zLndoYXQgPT0gJ3N1YicpIHtcbiAgICAgICAgICAgIC8vIFRoZSB0b3BpYyBoYXMgbm8gc3Vic2NyaXB0aW9ucy5cbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LmN0cmwudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIC8vIFRyaWdnZXIgdG9waWMub25TdWJzVXBkYXRlZC5cbiAgICAgICAgICAgICAgdG9waWMuX3Byb2Nlc3NNZXRhU3ViKFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKHBrdC5tZXRhKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGluZyBhIHttZXRhfSBtZXNzYWdlLlxuXG4gICAgICAgICAgICAvLyBQcmVmZXJyZWQgQVBJOiBSb3V0ZSBtZXRhIHRvIHRvcGljLCBpZiBvbmUgaXMgcmVnaXN0ZXJlZFxuICAgICAgICAgICAgY29uc3QgdG9waWMgPSBjYWNoZUdldCgndG9waWMnLCBwa3QubWV0YS50b3BpYyk7XG4gICAgICAgICAgICBpZiAodG9waWMpIHtcbiAgICAgICAgICAgICAgdG9waWMuX3JvdXRlTWV0YShwa3QubWV0YSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwa3QubWV0YS5pZCkge1xuICAgICAgICAgICAgICBleGVjUHJvbWlzZShwa3QubWV0YS5pZCwgMjAwLCBwa3QubWV0YSwgJ01FVEEnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2Vjb25kYXJ5IEFQSTogY2FsbGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLm9uTWV0YU1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbk1ldGFNZXNzYWdlKHBrdC5tZXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBrdC5kYXRhKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGluZyB7ZGF0YX0gbWVzc2FnZVxuXG4gICAgICAgICAgICAvLyBQcmVmZXJyZWQgQVBJOiBSb3V0ZSBkYXRhIHRvIHRvcGljLCBpZiBvbmUgaXMgcmVnaXN0ZXJlZFxuICAgICAgICAgICAgY29uc3QgdG9waWMgPSBjYWNoZUdldCgndG9waWMnLCBwa3QuZGF0YS50b3BpYyk7XG4gICAgICAgICAgICBpZiAodG9waWMpIHtcbiAgICAgICAgICAgICAgdG9waWMuX3JvdXRlRGF0YShwa3QuZGF0YSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNlY29uZGFyeSBBUEk6IENhbGwgY2FsbGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRGF0YU1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkRhdGFNZXNzYWdlKHBrdC5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBrdC5wcmVzKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGluZyB7cHJlc30gbWVzc2FnZVxuXG4gICAgICAgICAgICAvLyBQcmVmZXJyZWQgQVBJOiBSb3V0ZSBwcmVzZW5jZSB0byB0b3BpYywgaWYgb25lIGlzIHJlZ2lzdGVyZWRcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LnByZXMudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9yb3V0ZVByZXMocGt0LnByZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZWNvbmRhcnkgQVBJIC0gY2FsbGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLm9uUHJlc01lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vblByZXNNZXNzYWdlKHBrdC5wcmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBrdC5pbmZvKSB7XG4gICAgICAgICAgICAvLyB7aW5mb30gbWVzc2FnZSAtIHJlYWQvcmVjZWl2ZWQgbm90aWZpY2F0aW9ucyBhbmQga2V5IHByZXNzZXNcblxuICAgICAgICAgICAgLy8gUHJlZmVycmVkIEFQSTogUm91dGUge2luZm99fSB0byB0b3BpYywgaWYgb25lIGlzIHJlZ2lzdGVyZWRcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LmluZm8udG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9yb3V0ZUluZm8ocGt0LmluZm8pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZWNvbmRhcnkgQVBJIC0gY2FsbGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLm9uSW5mb01lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkluZm9NZXNzYWdlKHBrdC5pbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIoXCJFUlJPUjogVW5rbm93biBwYWNrZXQgcmVjZWl2ZWQuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUmVhZHkgdG8gc3RhcnQgc2VuZGluZy5cbiAgdGhpcy5fY29ubmVjdGlvbi5vbk9wZW4gPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLl9leHBpcmVQcm9taXNlcykge1xuICAgICAgLy8gUmVqZWN0IHByb21pc2VzIHdoaWNoIGhhdmUgbm90IGJlZW4gcmVzb2x2ZWQgZm9yIHRvbyBsb25nLlxuICAgICAgdGhpcy5fZXhwaXJlUHJvbWlzZXMgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihcIlRpbWVvdXQgKDUwNClcIik7XG4gICAgICAgIGNvbnN0IGV4cGlyZXMgPSBuZXcgRGF0ZShuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIEVYUElSRV9QUk9NSVNFU19USU1FT1VUKTtcbiAgICAgICAgZm9yIChsZXQgaWQgaW4gdGhpcy5fcGVuZGluZ1Byb21pc2VzKSB7XG4gICAgICAgICAgbGV0IGNhbGxiYWNrcyA9IHRoaXMuX3BlbmRpbmdQcm9taXNlc1tpZF07XG4gICAgICAgICAgaWYgKGNhbGxiYWNrcyAmJiBjYWxsYmFja3MudHMgPCBleHBpcmVzKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlcihcIlByb21pc2UgZXhwaXJlZFwiLCBpZCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcGVuZGluZ1Byb21pc2VzW2lkXTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFja3MucmVqZWN0KSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrcy5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIEVYUElSRV9QUk9NSVNFU19QRVJJT0QpO1xuICAgIH1cbiAgICB0aGlzLmhlbGxvKCk7XG4gIH1cblxuICAvLyBXcmFwcGVyIGZvciB0aGUgcmVjb25uZWN0IGl0ZXJhdG9yIGNhbGxiYWNrLlxuICB0aGlzLl9jb25uZWN0aW9uLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbiA9ICh0aW1lb3V0LCBwcm9taXNlKSA9PiB7XG4gICAgaWYgKHRoaXMub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uKSB7XG4gICAgICB0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbih0aW1lb3V0LCBwcm9taXNlKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLl9jb25uZWN0aW9uLm9uRGlzY29ubmVjdCA9IChlcnIsIGNvZGUpID0+IHtcbiAgICB0aGlzLl9pblBhY2tldENvdW50ID0gMDtcbiAgICB0aGlzLl9zZXJ2ZXJJbmZvID0gbnVsbDtcbiAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gZmFsc2U7XG5cbiAgICBpZiAodGhpcy5fZXhwaXJlUHJvbWlzZXMpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fZXhwaXJlUHJvbWlzZXMpO1xuICAgICAgdGhpcy5fZXhwaXJlUHJvbWlzZXMgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIE1hcmsgYWxsIHRvcGljcyBhcyB1bnN1YnNjcmliZWRcbiAgICBjYWNoZU1hcCgndG9waWMnLCAodG9waWMsIGtleSkgPT4ge1xuICAgICAgdG9waWMuX3Jlc2V0U3ViKCk7XG4gICAgfSk7XG5cbiAgICAvLyBSZWplY3QgYWxsIHBlbmRpbmcgcHJvbWlzZXNcbiAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fcGVuZGluZ1Byb21pc2VzKSB7XG4gICAgICBjb25zdCBjYWxsYmFja3MgPSB0aGlzLl9wZW5kaW5nUHJvbWlzZXNba2V5XTtcbiAgICAgIGlmIChjYWxsYmFja3MgJiYgY2FsbGJhY2tzLnJlamVjdCkge1xuICAgICAgICBjYWxsYmFja3MucmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3BlbmRpbmdQcm9taXNlcyA9IHt9O1xuXG4gICAgaWYgKHRoaXMub25EaXNjb25uZWN0KSB7XG4gICAgICB0aGlzLm9uRGlzY29ubmVjdChlcnIpO1xuICAgIH1cbiAgfVxufTtcblxuLy8gU3RhdGljIG1ldGhvZHMuXG5cbi8qKlxuICogQHR5cGVkZWYgQ3JlZGVudGlhbFxuICogQHR5cGUge29iamVjdH1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXRoIC0gdmFsaWRhdGlvbiBtZXRob2QuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdmFsIC0gdmFsdWUgdG8gdmFsaWRhdGUgKGUuZy4gZW1haWwgb3IgcGhvbmUgbnVtYmVyKS5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSByZXNwIC0gdmFsaWRhdGlvbiByZXNwb25zZS5cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBwYXJhbXMgLSB2YWxpZGF0aW9uIHBhcmFtZXRlcnMuXG4gKi9cbi8qKlxuICogSGVscGVyIG1ldGhvZCB0byBwYWNrYWdlIGFjY291bnQgY3JlZGVudGlhbC5cbiAqXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmcgfCBDcmVkZW50aWFsfSBtZXRoIC0gdmFsaWRhdGlvbiBtZXRob2Qgb3Igb2JqZWN0IHdpdGggdmFsaWRhdGlvbiBkYXRhLlxuICogQHBhcmFtIHtzdHJpbmc9fSB2YWwgLSB2YWxpZGF0aW9uIHZhbHVlIChlLmcuIGVtYWlsIG9yIHBob25lIG51bWJlcikuXG4gKiBAcGFyYW0ge09iamVjdD19IHBhcmFtcyAtIHZhbGlkYXRpb24gcGFyYW1ldGVycy5cbiAqIEBwYXJhbSB7c3RyaW5nPX0gcmVzcCAtIHZhbGlkYXRpb24gcmVzcG9uc2UuXG4gKlxuICogQHJldHVybnMge0FycmF5LjxDcmVkZW50aWFsPn0gYXJyYXkgd2l0aCBhIHNpbmdsZSBjcmVkZW50aWFsIG9yIDxjb2RlPm51bGw8L2NvZGU+IGlmIG5vIHZhbGlkIGNyZWRlbnRpYWxzIHdlcmUgZ2l2ZW4uXG4gKi9cblRpbm9kZS5jcmVkZW50aWFsID0gZnVuY3Rpb24obWV0aCwgdmFsLCBwYXJhbXMsIHJlc3ApIHtcbiAgaWYgKHR5cGVvZiBtZXRoID09ICdvYmplY3QnKSB7XG4gICAgKHtcbiAgICAgIHZhbCxcbiAgICAgIHBhcmFtcyxcbiAgICAgIHJlc3AsXG4gICAgICBtZXRoXG4gICAgfSA9IG1ldGgpO1xuICB9XG4gIGlmIChtZXRoICYmICh2YWwgfHwgcmVzcCkpIHtcbiAgICByZXR1cm4gW3tcbiAgICAgICdtZXRoJzogbWV0aCxcbiAgICAgICd2YWwnOiB2YWwsXG4gICAgICAncmVzcCc6IHJlc3AsXG4gICAgICAncGFyYW1zJzogcGFyYW1zXG4gICAgfV07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIERldGVybWluZSB0b3BpYyB0eXBlIGZyb20gdG9waWMncyBuYW1lOiBncnAsIHAycCwgbWUsIGZuZCwgc3lzLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gdGVzdC5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IE9uZSBvZiA8Y29kZT5cIm1lXCI8L2NvZGU+LCA8Y29kZT5cImZuZFwiPC9jb2RlPiwgPGNvZGU+XCJzeXNcIjwvY29kZT4sIDxjb2RlPlwiZ3JwXCI8L2NvZGU+LFxuICogICAgPGNvZGU+XCJwMnBcIjwvY29kZT4gb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPi5cbiAqL1xuVGlub2RlLnRvcGljVHlwZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgY29uc3QgdHlwZXMgPSB7XG4gICAgJ21lJzogJ21lJyxcbiAgICAnZm5kJzogJ2ZuZCcsXG4gICAgJ2dycCc6ICdncnAnLFxuICAgICduZXcnOiAnZ3JwJyxcbiAgICAnbmNoJzogJ2dycCcsXG4gICAgJ2Nobic6ICdncnAnLFxuICAgICd1c3InOiAncDJwJyxcbiAgICAnc3lzJzogJ3N5cydcbiAgfTtcbiAgcmV0dXJuIHR5cGVzWyh0eXBlb2YgbmFtZSA9PSAnc3RyaW5nJykgPyBuYW1lLnN1YnN0cmluZygwLCAzKSA6ICd4eHgnXTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgJ21lJyB0b3BpYy5cbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHRlc3QuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdGhlIG5hbWUgaXMgYSBuYW1lIG9mIGEgJ21lJyB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuVGlub2RlLmlzTWVUb3BpY05hbWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBUaW5vZGUudG9waWNUeXBlKG5hbWUpID09ICdtZSc7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBnaXZlbiB0b3BpYyBuYW1lIGlzIGEgbmFtZSBvZiBhIGdyb3VwIHRvcGljLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gdGVzdC5cbiAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBncm91cCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuVGlub2RlLmlzR3JvdXBUb3BpY05hbWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBUaW5vZGUudG9waWNUeXBlKG5hbWUpID09ICdncnAnO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdG9waWMgbmFtZSBpcyBhIG5hbWUgb2YgYSBwMnAgdG9waWMuXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byB0ZXN0LlxuICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZSBuYW1lIGlzIGEgbmFtZSBvZiBhIHAycCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuVGlub2RlLmlzUDJQVG9waWNOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gVGlub2RlLnRvcGljVHlwZShuYW1lKSA9PSAncDJwJztcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgY29tbXVuaWNhdGlvbiB0b3BpYywgaS5lLiBQMlAgb3IgZ3JvdXAuXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byB0ZXN0LlxuICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZSBuYW1lIGlzIGEgbmFtZSBvZiBhIHAycCBvciBncm91cCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuVGlub2RlLmlzQ29tbVRvcGljTmFtZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIFRpbm9kZS5pc1AyUFRvcGljTmFtZShuYW1lKSB8fCBUaW5vZGUuaXNHcm91cFRvcGljTmFtZShuYW1lKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgbmV3IHRvcGljLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gdG9waWMgbmFtZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBuZXcgdG9waWMsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gKi9cblRpbm9kZS5pc05ld0dyb3VwVG9waWNOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gKHR5cGVvZiBuYW1lID09ICdzdHJpbmcnKSAmJlxuICAgIChuYW1lLnN1YnN0cmluZygwLCAzKSA9PSBUT1BJQ19ORVcgfHwgbmFtZS5zdWJzdHJpbmcoMCwgMykgPT0gVE9QSUNfTkVXX0NIQU4pO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgdG9waWMgbmFtZSBpcyBhIG5hbWUgb2YgYSBjaGFubmVsLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gdG9waWMgbmFtZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBjaGFubmVsLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICovXG5UaW5vZGUuaXNDaGFubmVsVG9waWNOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gKHR5cGVvZiBuYW1lID09ICdzdHJpbmcnKSAmJlxuICAgIChuYW1lLnN1YnN0cmluZygwLCAzKSA9PSBUT1BJQ19DSEFOIHx8IG5hbWUuc3Vic3RyaW5nKDAsIDMpID09IFRPUElDX05FV19DSEFOKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHZlcnNpb24gb2YgdGhpcyBUaW5vZGUgY2xpZW50IGxpYnJhcnkuXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHJldHVybnMge3N0cmluZ30gc2VtYW50aWMgdmVyc2lvbiBvZiB0aGUgbGlicmFyeSwgZS5nLiA8Y29kZT5cIjAuMTUuNS1yYzFcIjwvY29kZT4uXG4gKi9cblRpbm9kZS5nZXRWZXJzaW9uID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBWRVJTSU9OO1xufTtcblxuLyoqXG4gKiBUbyB1c2UgVGlub2RlIGluIGEgbm9uIGJyb3dzZXIgY29udGV4dCwgc3VwcGx5IFdlYlNvY2tldCBhbmQgWE1MSHR0cFJlcXVlc3QgcHJvdmlkZXJzLlxuICogQHN0YXRpY1xuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHBhcmFtIHdzUHJvdmlkZXIgV2ViU29ja2V0IHByb3ZpZGVyLCBlLmcuIGZvciBub2RlSlMgLCA8Y29kZT5yZXF1aXJlKCd3cycpPC9jb2RlPi5cbiAqIEBwYXJhbSB4aHJQcm92aWRlciBYTUxIdHRwUmVxdWVzdCBwcm92aWRlciwgZS5nLiBmb3Igbm9kZSA8Y29kZT5yZXF1aXJlKCd4aHInKTwvY29kZT4uXG4gKi9cblRpbm9kZS5zZXROZXR3b3JrUHJvdmlkZXJzID0gZnVuY3Rpb24od3NQcm92aWRlciwgeGhyUHJvdmlkZXIpIHtcbiAgV2ViU29ja2V0UHJvdmlkZXIgPSB3c1Byb3ZpZGVyO1xuICBYSFJQcm92aWRlciA9IHhoclByb3ZpZGVyO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgbmFtZSBhbmQgdmVyc2lvbiBvZiB0aGlzIFRpbm9kZSBsaWJyYXJ5LlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSBsaWJyYXJ5IGFuZCBpdCdzIHZlcnNpb24uXG4gKi9cblRpbm9kZS5nZXRMaWJyYXJ5ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBMSUJSQVJZO1xufTtcblxuLy8gRXhwb3J0ZWQgY29uc3RhbnRzXG5UaW5vZGUuTUVTU0FHRV9TVEFUVVNfTk9ORSA9IE1FU1NBR0VfU1RBVFVTX05PTkU7XG5UaW5vZGUuTUVTU0FHRV9TVEFUVVNfUVVFVUVEID0gTUVTU0FHRV9TVEFUVVNfUVVFVUVEO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX1NFTkRJTkcgPSBNRVNTQUdFX1NUQVRVU19TRU5ESU5HO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX0ZBSUxFRCA9IE1FU1NBR0VfU1RBVFVTX0ZBSUxFRDtcblRpbm9kZS5NRVNTQUdFX1NUQVRVU19TRU5UID0gTUVTU0FHRV9TVEFUVVNfU0VOVDtcblRpbm9kZS5NRVNTQUdFX1NUQVRVU19SRUNFSVZFRCA9IE1FU1NBR0VfU1RBVFVTX1JFQ0VJVkVEO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX1JFQUQgPSBNRVNTQUdFX1NUQVRVU19SRUFEO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX1RPX01FID0gTUVTU0FHRV9TVEFUVVNfVE9fTUU7XG5cbi8vIFVuaWNvZGUgW2RlbF0gc3ltYm9sLlxuVGlub2RlLkRFTF9DSEFSID0gJ1xcdTI0MjEnO1xuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBnaXZlbiBzdHJpbmcgcmVwcmVzZW50cyA8Y29kZT5OVUxMPC9jb2RlPiB2YWx1ZSBhcyBkZWZpbmVkIGJ5IFRpbm9kZSAoPGNvZGU+J1xcdTI0MjEnPC9jb2RlPikuXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciAtIHN0cmluZyB0byBjaGVjayBmb3IgPGNvZGU+TlVMTDwvY29kZT4gdmFsdWUuXG4gKlxuICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHN0cmluZyByZXByZXNlbnRzIDxjb2RlPk5VTEw8L2NvZGU+IHZhbHVlLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICovXG5UaW5vZGUuaXNOdWxsVmFsdWUgPSBmdW5jdGlvbihzdHIpIHtcbiAgcmV0dXJuIHN0ciA9PT0gVGlub2RlLkRFTF9DSEFSO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gVVJMIHN0cmluZyBpcyBhIHJlbGF0aXZlIFVSTC5cbiAqIENoZWNrIGZvciBjYXNlcyBsaWtlOlxuICogIDxjb2RlPidodHRwOi8vZXhhbXBsZS5jb20nPC9jb2RlPlxuICogIDxjb2RlPicgaHR0cDovL2V4YW1wbGUuY29tJzwvY29kZT5cbiAqICA8Y29kZT4nLy9leGFtcGxlLmNvbS8nPC9jb2RlPlxuICogIDxjb2RlPidodHRwOmV4YW1wbGUuY29tJzwvY29kZT5cbiAqICA8Y29kZT4naHR0cDovZXhhbXBsZS5jb20nPC9jb2RlPlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBVUkwgc3RyaW5nIHRvIGNoZWNrLlxuICpcbiAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgVVJMIGlzIHJlbGF0aXZlLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICovXG5UaW5vZGUuaXNSZWxhdGl2ZVVSTCA9IGZ1bmN0aW9uKHVybCkge1xuICByZXR1cm4gIS9eXFxzKihbYS16XVthLXowLTkrLi1dKjp8XFwvXFwvKS9pbS50ZXN0KHVybCk7XG59O1xuXG4vLyBOYW1lcyBvZiBrZXlzIHRvIHNlcnZlci1wcm92aWRlZCBjb25maWd1cmF0aW9uIGxpbWl0cy5cblRpbm9kZS5NQVhfTUVTU0FHRV9TSVpFID0gJ21heE1lc3NhZ2VTaXplJztcblRpbm9kZS5NQVhfU1VCU0NSSUJFUl9DT1VOVCA9ICdtYXhTdWJzY3JpYmVyQ291bnQnO1xuVGlub2RlLk1BWF9UQUdfQ09VTlQgPSAnbWF4VGFnQ291bnQnO1xuVGlub2RlLk1BWF9GSUxFX1VQTE9BRF9TSVpFID0gJ21heEZpbGVVcGxvYWRTaXplJztcblxuLy8gUHVibGljIG1ldGhvZHM7XG5UaW5vZGUucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogQ29ubmVjdCB0byB0aGUgc2VydmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaG9zdF8gLSBuYW1lIG9mIHRoZSBob3N0IHRvIGNvbm5lY3QgdG8uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IFByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBjYWxsIGNvbXBsZXRlczpcbiAgICogICAgPGNvZGU+cmVzb2x2ZSgpPC9jb2RlPiBpcyBjYWxsZWQgd2l0aG91dCBwYXJhbWV0ZXJzLCA8Y29kZT5yZWplY3QoKTwvY29kZT4gcmVjZWl2ZXMgdGhlXG4gICAqICAgIDxjb2RlPkVycm9yPC9jb2RlPiBhcyBhIHNpbmdsZSBwYXJhbWV0ZXIuXG4gICAqL1xuICBjb25uZWN0OiBmdW5jdGlvbihob3N0Xykge1xuICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uLmNvbm5lY3QoaG9zdF8pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBdHRlbXB0IHRvIHJlY29ubmVjdCB0byB0aGUgc2VydmVyIGltbWVkaWF0ZWx5LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZm9yY2UgLSByZWNvbm5lY3QgZXZlbiBpZiB0aGVyZSBpcyBhIGNvbm5lY3Rpb24gYWxyZWFkeS5cbiAgICovXG4gIHJlY29ubmVjdDogZnVuY3Rpb24oZm9yY2UpIHtcbiAgICB0aGlzLl9jb25uZWN0aW9uLnJlY29ubmVjdChmb3JjZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERpc2Nvbm5lY3QgZnJvbSB0aGUgc2VydmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKi9cbiAgZGlzY29ubmVjdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fY29ubmVjdGlvbi5kaXNjb25uZWN0KCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENsZWFyIHBlcnNpc3RlbnQgY2FjaGU6IHJlbW92ZSBpbmRleERCIGNhY2hlIG9mIHRoZSBtb3N0IHJlY2VudGx5IGxvZ2dlZCBpbiB1c2VyLlxuICAgKi9cbiAgY2xlYXJTdG9yYWdlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fZGIpIHtcbiAgICAgIHRoaXMuX2RiLmRlbGV0ZURhdGFiYXNlKCk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBTZW5kIGEgbmV0d29yayBwcm9iZSBtZXNzYWdlIHRvIG1ha2Ugc3VyZSB0aGUgY29ubmVjdGlvbiBpcyBhbGl2ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICovXG4gIG5ldHdvcmtQcm9iZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fY29ubmVjdGlvbi5wcm9iZSgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBmb3IgbGl2ZSBjb25uZWN0aW9uIHRvIHNlcnZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZXJlIGlzIGEgbGl2ZSBjb25uZWN0aW9uLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNDb25uZWN0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uLmlzQ29ubmVjdGVkKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNvbm5lY3Rpb24gaXMgYXV0aGVudGljYXRlZCAobGFzdCBsb2dpbiB3YXMgc3VjY2Vzc2Z1bCkuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiBhdXRoZW50aWNhdGVkLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNBdXRoZW50aWNhdGVkOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fYXV0aGVudGljYXRlZDtcbiAgfSxcblxuICAvKipcbiAgICogQWRkIEFQSSBrZXkgYW5kIGF1dGggdG9rZW4gdG8gdGhlIHJlbGF0aXZlIFVSTCBtYWtpbmcgaXQgdXNhYmxlIGZvciBnZXR0aW5nIGRhdGFcbiAgICogZnJvbSB0aGUgc2VydmVyIGluIGEgc2ltcGxlIDxjb2RlPkhUVFAgR0VUPC9jb2RlPiByZXF1ZXN0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gVVJMIC0gVVJMIHRvIHdyYXAuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFVSTCB3aXRoIGFwcGVuZGVkIEFQSSBrZXkgYW5kIHRva2VuLCBpZiB2YWxpZCB0b2tlbiBpcyBwcmVzZW50LlxuICAgKi9cbiAgYXV0aG9yaXplVVJMOiBmdW5jdGlvbih1cmwpIHtcbiAgICBpZiAoIXVybCkge1xuICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBpZiAoVGlub2RlLmlzUmVsYXRpdmVVUkwodXJsKSkge1xuICAgICAgLy8gRmFrZSBiYXNlIHRvIG1ha2UgdGhlIHJlbGF0aXZlIFVSTCBwYXJzZWFibGUuXG4gICAgICBjb25zdCBiYXNlID0gJ3NjaGVtZTovL2hvc3QvJztcbiAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsLCBiYXNlKTtcbiAgICAgIGlmICh0aGlzLl9hcGlLZXkpIHtcbiAgICAgICAgcGFyc2VkLnNlYXJjaFBhcmFtcy5hcHBlbmQoJ2FwaWtleScsIHRoaXMuX2FwaUtleSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fYXV0aFRva2VuLnRva2VuKSB7XG4gICAgICAgIHBhcnNlZC5zZWFyY2hQYXJhbXMuYXBwZW5kKCdhdXRoJywgJ3Rva2VuJyk7XG4gICAgICAgIHBhcnNlZC5zZWFyY2hQYXJhbXMuYXBwZW5kKCdzZWNyZXQnLCB0aGlzLl9hdXRoVG9rZW4udG9rZW4pO1xuICAgICAgfVxuICAgICAgLy8gQ29udmVydCBiYWNrIHRvIHN0cmluZyBhbmQgc3RyaXAgZmFrZSBiYXNlIFVSTCBleGNlcHQgZm9yIHRoZSByb290IHNsYXNoLlxuICAgICAgdXJsID0gcGFyc2VkLnRvU3RyaW5nKCkuc3Vic3RyaW5nKGJhc2UubGVuZ3RoIC0gMSk7XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIEFjY291bnRQYXJhbXNcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5EZWZBY3M9fSBkZWZhY3MgLSBEZWZhdWx0IGFjY2VzcyBwYXJhbWV0ZXJzIGZvciB1c2VyJ3MgPGNvZGU+bWU8L2NvZGU+IHRvcGljLlxuICAgKiBAcHJvcGVydHkge09iamVjdD19IHB1YmxpYyAtIFB1YmxpYyBhcHBsaWNhdGlvbi1kZWZpbmVkIGRhdGEgZXhwb3NlZCBvbiA8Y29kZT5tZTwvY29kZT4gdG9waWMuXG4gICAqIEBwcm9wZXJ0eSB7T2JqZWN0PX0gcHJpdmF0ZSAtIFByaXZhdGUgYXBwbGljYXRpb24tZGVmaW5lZCBkYXRhIGFjY2Vzc2libGUgb24gPGNvZGU+bWU8L2NvZGU+IHRvcGljLlxuICAgKiBAcHJvcGVydHkge0FycmF5fSB0YWdzIC0gYXJyYXkgb2Ygc3RyaW5nIHRhZ3MgZm9yIHVzZXIgZGlzY292ZXJ5LlxuICAgKiBAcHJvcGVydHkge3N0cmluZz19IHRva2VuIC0gYXV0aGVudGljYXRpb24gdG9rZW4gdG8gdXNlLlxuICAgKi9cbiAgLyoqXG4gICAqIEB0eXBlZGVmIERlZkFjc1xuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gYXV0aCAtIEFjY2VzcyBtb2RlIGZvciA8Y29kZT5tZTwvY29kZT4gZm9yIGF1dGhlbnRpY2F0ZWQgdXNlcnMuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gYW5vbiAtIEFjY2VzcyBtb2RlIGZvciA8Y29kZT5tZTwvY29kZT4gZm9yIGFub255bW91cyB1c2Vycy5cbiAgICovXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBvciB1cGRhdGUgYW4gYWNjb3VudC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIFVzZXIgaWQgdG8gdXBkYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWUgLSBBdXRoZW50aWNhdGlvbiBzY2hlbWU7IDxjb2RlPlwiYmFzaWNcIjwvY29kZT4gYW5kIDxjb2RlPlwiYW5vbnltb3VzXCI8L2NvZGU+IGFyZSB0aGUgY3VycmVudGx5IHN1cHBvcnRlZCBzY2hlbWVzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2VjcmV0IC0gQXV0aGVudGljYXRpb24gc2VjcmV0LCBhc3N1bWVkIHRvIGJlIGFscmVhZHkgYmFzZTY0IGVuY29kZWQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGxvZ2luIC0gVXNlIG5ldyBhY2NvdW50IHRvIGF1dGhlbnRpY2F0ZSBjdXJyZW50IHNlc3Npb25cbiAgICogQHBhcmFtIHtUaW5vZGUuQWNjb3VudFBhcmFtcz19IHBhcmFtcyAtIFVzZXIgZGF0YSB0byBwYXNzIHRvIHRoZSBzZXJ2ZXIuXG4gICAqL1xuICBhY2NvdW50OiBmdW5jdGlvbih1aWQsIHNjaGVtZSwgc2VjcmV0LCBsb2dpbiwgcGFyYW1zKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdhY2MnKTtcbiAgICBwa3QuYWNjLnVzZXIgPSB1aWQ7XG4gICAgcGt0LmFjYy5zY2hlbWUgPSBzY2hlbWU7XG4gICAgcGt0LmFjYy5zZWNyZXQgPSBzZWNyZXQ7XG4gICAgLy8gTG9nIGluIHRvIHRoZSBuZXcgYWNjb3VudCB1c2luZyBzZWxlY3RlZCBzY2hlbWVcbiAgICBwa3QuYWNjLmxvZ2luID0gbG9naW47XG5cbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBwa3QuYWNjLmRlc2MuZGVmYWNzID0gcGFyYW1zLmRlZmFjcztcbiAgICAgIHBrdC5hY2MuZGVzYy5wdWJsaWMgPSBwYXJhbXMucHVibGljO1xuICAgICAgcGt0LmFjYy5kZXNjLnByaXZhdGUgPSBwYXJhbXMucHJpdmF0ZTtcblxuICAgICAgcGt0LmFjYy50YWdzID0gcGFyYW1zLnRhZ3M7XG4gICAgICBwa3QuYWNjLmNyZWQgPSBwYXJhbXMuY3JlZDtcblxuICAgICAgcGt0LmFjYy50b2tlbiA9IHBhcmFtcy50b2tlbjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmFjYy5pZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB1c2VyLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2FjY291bnR9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NoZW1lIC0gQXV0aGVudGljYXRpb24gc2NoZW1lOyA8Y29kZT5cImJhc2ljXCI8L2NvZGU+IGlzIHRoZSBvbmx5IGN1cnJlbnRseSBzdXBwb3J0ZWQgc2NoZW1lLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2VjcmV0IC0gQXV0aGVudGljYXRpb24uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGxvZ2luIC0gVXNlIG5ldyBhY2NvdW50IHRvIGF1dGhlbnRpY2F0ZSBjdXJyZW50IHNlc3Npb25cbiAgICogQHBhcmFtIHtUaW5vZGUuQWNjb3VudFBhcmFtcz19IHBhcmFtcyAtIFVzZXIgZGF0YSB0byBwYXNzIHRvIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiBzZXJ2ZXIgcmVwbHkgaXMgcmVjZWl2ZWQuXG4gICAqL1xuICBjcmVhdGVBY2NvdW50OiBmdW5jdGlvbihzY2hlbWUsIHNlY3JldCwgbG9naW4sIHBhcmFtcykge1xuICAgIGxldCBwcm9taXNlID0gdGhpcy5hY2NvdW50KFVTRVJfTkVXLCBzY2hlbWUsIHNlY3JldCwgbG9naW4sIHBhcmFtcyk7XG4gICAgaWYgKGxvZ2luKSB7XG4gICAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuKChjdHJsKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ2luU3VjY2Vzc2Z1bChjdHJsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIHVzZXIgd2l0aCA8Y29kZT4nYmFzaWMnPC9jb2RlPiBhdXRoZW50aWNhdGlvbiBzY2hlbWUgYW5kIGltbWVkaWF0ZWx5XG4gICAqIHVzZSBpdCBmb3IgYXV0aGVudGljYXRpb24uIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjYWNjb3VudH0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VybmFtZSAtIExvZ2luIHRvIHVzZSBmb3IgdGhlIG5ldyBhY2NvdW50LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSBVc2VyJ3MgcGFzc3dvcmQuXG4gICAqIEBwYXJhbSB7VGlub2RlLkFjY291bnRQYXJhbXM9fSBwYXJhbXMgLSBVc2VyIGRhdGEgdG8gcGFzcyB0byB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gc2VydmVyIHJlcGx5IGlzIHJlY2VpdmVkLlxuICAgKi9cbiAgY3JlYXRlQWNjb3VudEJhc2ljOiBmdW5jdGlvbih1c2VybmFtZSwgcGFzc3dvcmQsIHBhcmFtcykge1xuICAgIC8vIE1ha2Ugc3VyZSB3ZSBhcmUgbm90IHVzaW5nICdudWxsJyBvciAndW5kZWZpbmVkJztcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lIHx8ICcnO1xuICAgIHBhc3N3b3JkID0gcGFzc3dvcmQgfHwgJyc7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlQWNjb3VudCgnYmFzaWMnLFxuICAgICAgYjY0RW5jb2RlVW5pY29kZSh1c2VybmFtZSArICc6JyArIHBhc3N3b3JkKSwgdHJ1ZSwgcGFyYW1zKTtcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHVzZXIncyBjcmVkZW50aWFscyBmb3IgPGNvZGU+J2Jhc2ljJzwvY29kZT4gYXV0aGVudGljYXRpb24gc2NoZW1lLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2FjY291bnR9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gVXNlciBJRCB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VybmFtZSAtIExvZ2luIHRvIHVzZSBmb3IgdGhlIG5ldyBhY2NvdW50LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSBVc2VyJ3MgcGFzc3dvcmQuXG4gICAqIEBwYXJhbSB7VGlub2RlLkFjY291bnRQYXJhbXM9fSBwYXJhbXMgLSBkYXRhIHRvIHBhc3MgdG8gdGhlIHNlcnZlci5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHNlcnZlciByZXBseSBpcyByZWNlaXZlZC5cbiAgICovXG4gIHVwZGF0ZUFjY291bnRCYXNpYzogZnVuY3Rpb24odWlkLCB1c2VybmFtZSwgcGFzc3dvcmQsIHBhcmFtcykge1xuICAgIC8vIE1ha2Ugc3VyZSB3ZSBhcmUgbm90IHVzaW5nICdudWxsJyBvciAndW5kZWZpbmVkJztcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lIHx8ICcnO1xuICAgIHBhc3N3b3JkID0gcGFzc3dvcmQgfHwgJyc7XG4gICAgcmV0dXJuIHRoaXMuYWNjb3VudCh1aWQsICdiYXNpYycsXG4gICAgICBiNjRFbmNvZGVVbmljb2RlKHVzZXJuYW1lICsgJzonICsgcGFzc3dvcmQpLCBmYWxzZSwgcGFyYW1zKTtcbiAgfSxcblxuICAvKipcbiAgICogU2VuZCBoYW5kc2hha2UgdG8gdGhlIHNlcnZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHNlcnZlciByZXBseSBpcyByZWNlaXZlZC5cbiAgICovXG4gIGhlbGxvOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ2hpJyk7XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmhpLmlkKVxuICAgICAgLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgLy8gUmVzZXQgYmFja29mZiBjb3VudGVyIG9uIHN1Y2Nlc3NmdWwgY29ubmVjdGlvbi5cbiAgICAgICAgdGhpcy5fY29ubmVjdGlvbi5iYWNrb2ZmUmVzZXQoKTtcblxuICAgICAgICAvLyBTZXJ2ZXIgcmVzcG9uc2UgY29udGFpbnMgc2VydmVyIHByb3RvY29sIHZlcnNpb24sIGJ1aWxkLCBjb25zdHJhaW50cyxcbiAgICAgICAgLy8gc2Vzc2lvbiBJRCBmb3IgbG9uZyBwb2xsaW5nLiBTYXZlIHRoZW0uXG4gICAgICAgIGlmIChjdHJsLnBhcmFtcykge1xuICAgICAgICAgIHRoaXMuX3NlcnZlckluZm8gPSBjdHJsLnBhcmFtcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9uQ29ubmVjdCkge1xuICAgICAgICAgIHRoaXMub25Db25uZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3RybDtcbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgdGhpcy5fY29ubmVjdGlvbi5yZWNvbm5lY3QodHJ1ZSk7XG5cbiAgICAgICAgaWYgKHRoaXMub25EaXNjb25uZWN0KSB7XG4gICAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3QoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCBvciByZWZyZXNoIHRoZSBwdXNoIG5vdGlmaWNhdGlvbnMvZGV2aWNlIHRva2VuLiBJZiB0aGUgY2xpZW50IGlzIGNvbm5lY3RlZCxcbiAgICogdGhlIGRldmljZVRva2VuIGNhbiBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkdCAtIHRva2VuIG9idGFpbmVkIGZyb20gdGhlIHByb3ZpZGVyLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNlbmRUb1NlcnZlciAtIGlmIHRydWUsIHNlbmQgZHQgdG8gc2VydmVyIGltbWVkaWF0ZWx5LlxuICAgKlxuICAgKiBAcmV0dXJucyB0cnVlIGlmIGF0dGVtcHQgd2FzIG1hZGUgdG8gc2VuZCB0aGUgdG9rZW4gdG8gdGhlIHNlcnZlci5cbiAgICovXG4gIHNldERldmljZVRva2VuOiBmdW5jdGlvbihkdCwgc2VuZFRvU2VydmVyKSB7XG4gICAgbGV0IHNlbnQgPSBmYWxzZTtcbiAgICBpZiAoZHQgJiYgZHQgIT0gdGhpcy5fZGV2aWNlVG9rZW4pIHtcbiAgICAgIHRoaXMuX2RldmljZVRva2VuID0gZHQ7XG4gICAgICBpZiAoc2VuZFRvU2VydmVyICYmIHRoaXMuaXNDb25uZWN0ZWQoKSAmJiB0aGlzLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgIHRoaXMuc2VuZCh7XG4gICAgICAgICAgJ2hpJzoge1xuICAgICAgICAgICAgJ2Rldic6IGR0XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgc2VudCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZW50O1xuICB9LFxuXG4gIC8qKlxuICAgKiBBdXRoZW50aWNhdGUgY3VycmVudCBzZXNzaW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NoZW1lIC0gQXV0aGVudGljYXRpb24gc2NoZW1lOyA8Y29kZT5cImJhc2ljXCI8L2NvZGU+IGlzIHRoZSBvbmx5IGN1cnJlbnRseSBzdXBwb3J0ZWQgc2NoZW1lLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2VjcmV0IC0gQXV0aGVudGljYXRpb24gc2VjcmV0LCBhc3N1bWVkIHRvIGJlIGFscmVhZHkgYmFzZTY0IGVuY29kZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiBzZXJ2ZXIgcmVwbHkgaXMgcmVjZWl2ZWQuXG4gICAqL1xuICBsb2dpbjogZnVuY3Rpb24oc2NoZW1lLCBzZWNyZXQsIGNyZWQpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ2xvZ2luJyk7XG4gICAgcGt0LmxvZ2luLnNjaGVtZSA9IHNjaGVtZTtcbiAgICBwa3QubG9naW4uc2VjcmV0ID0gc2VjcmV0O1xuICAgIHBrdC5sb2dpbi5jcmVkID0gY3JlZDtcblxuICAgIHJldHVybiB0aGlzLnNlbmQocGt0LCBwa3QubG9naW4uaWQpXG4gICAgICAudGhlbigoY3RybCkgPT4ge1xuICAgICAgICBjb25zdCB4ID0gdGhpcy5sb2dpblN1Y2Nlc3NmdWwoY3RybCk7XG4gICAgICAgIHJldHVybiB4O1xuICAgICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjbG9naW59IHdpdGggYmFzaWMgYXV0aGVudGljYXRpb25cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuYW1lIC0gVXNlciBuYW1lLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgIC0gUGFzc3dvcmQuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGxvZ2luQmFzaWM6IGZ1bmN0aW9uKHVuYW1lLCBwYXNzd29yZCwgY3JlZCkge1xuICAgIHJldHVybiB0aGlzLmxvZ2luKCdiYXNpYycsIGI2NEVuY29kZVVuaWNvZGUodW5hbWUgKyAnOicgKyBwYXNzd29yZCksIGNyZWQpXG4gICAgICAudGhlbigoY3RybCkgPT4ge1xuICAgICAgICB0aGlzLl9sb2dpbiA9IHVuYW1lO1xuICAgICAgICByZXR1cm4gY3RybDtcbiAgICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2xvZ2lufSB3aXRoIHRva2VuIGF1dGhlbnRpY2F0aW9uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiAtIFRva2VuIHJlY2VpdmVkIGluIHJlc3BvbnNlIHRvIGVhcmxpZXIgbG9naW4uXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGxvZ2luVG9rZW46IGZ1bmN0aW9uKHRva2VuLCBjcmVkKSB7XG4gICAgcmV0dXJuIHRoaXMubG9naW4oJ3Rva2VuJywgdG9rZW4sIGNyZWQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZW5kIGEgcmVxdWVzdCBmb3IgcmVzZXR0aW5nIGFuIGF1dGhlbnRpY2F0aW9uIHNlY3JldC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNjaGVtZSAtIGF1dGhlbnRpY2F0aW9uIHNjaGVtZSB0byByZXNldC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIG1ldGhvZCB0byB1c2UgZm9yIHJlc2V0dGluZyB0aGUgc2VjcmV0LCBzdWNoIGFzIFwiZW1haWxcIiBvciBcInRlbFwiLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgLSB2YWx1ZSBvZiB0aGUgY3JlZGVudGlhbCB0byB1c2UsIGEgc3BlY2lmaWMgZW1haWwgYWRkcmVzcyBvciBhIHBob25lIG51bWJlci5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgdGhlIHNlcnZlciByZXBseS5cbiAgICovXG4gIHJlcXVlc3RSZXNldEF1dGhTZWNyZXQ6IGZ1bmN0aW9uKHNjaGVtZSwgbWV0aG9kLCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmxvZ2luKCdyZXNldCcsIGI2NEVuY29kZVVuaWNvZGUoc2NoZW1lICsgJzonICsgbWV0aG9kICsgJzonICsgdmFsdWUpKTtcbiAgfSxcblxuICAvKipcbiAgICogQHR5cGVkZWYgQXV0aFRva2VuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IHRva2VuIC0gVG9rZW4gdmFsdWUuXG4gICAqIEBwcm9wZXJ0eSB7RGF0ZX0gZXhwaXJlcyAtIFRva2VuIGV4cGlyYXRpb24gdGltZS5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgc3RvcmVkIGF1dGhlbnRpY2F0aW9uIHRva2VuLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLkF1dGhUb2tlbn0gYXV0aGVudGljYXRpb24gdG9rZW4uXG4gICAqL1xuICBnZXRBdXRoVG9rZW46IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9hdXRoVG9rZW4gJiYgKHRoaXMuX2F1dGhUb2tlbi5leHBpcmVzLmdldFRpbWUoKSA+IERhdGUubm93KCkpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYXV0aFRva2VuO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9hdXRoVG9rZW4gPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogQXBwbGljYXRpb24gbWF5IHByb3ZpZGUgYSBzYXZlZCBhdXRoZW50aWNhdGlvbiB0b2tlbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtUaW5vZGUuQXV0aFRva2VufSB0b2tlbiAtIGF1dGhlbnRpY2F0aW9uIHRva2VuLlxuICAgKi9cbiAgc2V0QXV0aFRva2VuOiBmdW5jdGlvbih0b2tlbikge1xuICAgIHRoaXMuX2F1dGhUb2tlbiA9IHRva2VuO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBTZXRQYXJhbXNcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5TZXREZXNjPX0gZGVzYyAtIFRvcGljIGluaXRpYWxpemF0aW9uIHBhcmFtZXRlcnMgd2hlbiBjcmVhdGluZyBhIG5ldyB0b3BpYyBvciBhIG5ldyBzdWJzY3JpcHRpb24uXG4gICAqIEBwcm9wZXJ0eSB7VGlub2RlLlNldFN1Yj19IHN1YiAtIFN1YnNjcmlwdGlvbiBpbml0aWFsaXphdGlvbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgLyoqXG4gICAqIEB0eXBlZGVmIFNldERlc2NcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5EZWZBY3M9fSBkZWZhY3MgLSBEZWZhdWx0IGFjY2VzcyBtb2RlLlxuICAgKiBAcHJvcGVydHkge09iamVjdD19IHB1YmxpYyAtIEZyZWUtZm9ybSB0b3BpYyBkZXNjcmlwdGlvbiwgcHVibGljYWxseSBhY2Nlc3NpYmxlLlxuICAgKiBAcHJvcGVydHkge09iamVjdD19IHByaXZhdGUgLSBGcmVlLWZvcm0gdG9waWMgZGVzY3JpcHRpb25hY2Nlc3NpYmxlIG9ubHkgdG8gdGhlIG93bmVyLlxuICAgKi9cbiAgLyoqXG4gICAqIEB0eXBlZGVmIFNldFN1YlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gdXNlciAtIFVJRCBvZiB0aGUgdXNlciBhZmZlY3RlZCBieSB0aGUgcmVxdWVzdC4gRGVmYXVsdCAoZW1wdHkpIC0gY3VycmVudCB1c2VyLlxuICAgKiBAcHJvcGVydHkge3N0cmluZz19IG1vZGUgLSBVc2VyIGFjY2VzcyBtb2RlLCBlaXRoZXIgcmVxdWVzdGVkIG9yIGFzc2lnbmVkIGRlcGVuZGVudCBvbiBjb250ZXh0LlxuICAgKiBAcHJvcGVydHkge09iamVjdD19IGluZm8gLSBGcmVlLWZvcm0gcGF5bG9hZCB0byBwYXNzIHRvIHRoZSBpbnZpdGVkIHVzZXIgb3IgdG9waWMgbWFuYWdlci5cbiAgICovXG4gIC8qKlxuICAgKiBQYXJhbWV0ZXJzIHBhc3NlZCB0byB7QGxpbmsgVGlub2RlI3N1YnNjcmliZX0uXG4gICAqXG4gICAqIEB0eXBlZGVmIFN1YnNjcmlwdGlvblBhcmFtc1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBwcm9wZXJ0eSB7VGlub2RlLlNldFBhcmFtcz19IHNldCAtIFBhcmFtZXRlcnMgdXNlZCB0byBpbml0aWFsaXplIHRvcGljXG4gICAqIEBwcm9wZXJ0eSB7VGlub2RlLkdldFF1ZXJ5PX0gZ2V0IC0gUXVlcnkgZm9yIGZldGNoaW5nIGRhdGEgZnJvbSB0b3BpYy5cbiAgICovXG5cbiAgLyoqXG4gICAqIFNlbmQgYSB0b3BpYyBzdWJzY3JpcHRpb24gcmVxdWVzdC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gc3Vic2NyaWJlIHRvLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5HZXRRdWVyeT19IGdldFBhcmFtcyAtIE9wdGlvbmFsIHN1YnNjcmlwdGlvbiBtZXRhZGF0YSBxdWVyeVxuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXRQYXJhbXM9fSBzZXRQYXJhbXMgLSBPcHRpb25hbCBpbml0aWFsaXphdGlvbiBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIHN1YnNjcmliZTogZnVuY3Rpb24odG9waWNOYW1lLCBnZXRQYXJhbXMsIHNldFBhcmFtcykge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuaW5pdFBhY2tldCgnc3ViJywgdG9waWNOYW1lKVxuICAgIGlmICghdG9waWNOYW1lKSB7XG4gICAgICB0b3BpY05hbWUgPSBUT1BJQ19ORVc7XG4gICAgfVxuXG4gICAgcGt0LnN1Yi5nZXQgPSBnZXRQYXJhbXM7XG5cbiAgICBpZiAoc2V0UGFyYW1zKSB7XG4gICAgICBpZiAoc2V0UGFyYW1zLnN1Yikge1xuICAgICAgICBwa3Quc3ViLnNldC5zdWIgPSBzZXRQYXJhbXMuc3ViO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2V0UGFyYW1zLmRlc2MpIHtcbiAgICAgICAgaWYgKFRpbm9kZS5pc05ld0dyb3VwVG9waWNOYW1lKHRvcGljTmFtZSkpIHtcbiAgICAgICAgICAvLyBGdWxsIHNldC5kZXNjIHBhcmFtcyBhcmUgdXNlZCBmb3IgbmV3IHRvcGljcyBvbmx5XG4gICAgICAgICAgcGt0LnN1Yi5zZXQuZGVzYyA9IHNldFBhcmFtcy5kZXNjO1xuICAgICAgICB9IGVsc2UgaWYgKFRpbm9kZS5pc1AyUFRvcGljTmFtZSh0b3BpY05hbWUpICYmIHNldFBhcmFtcy5kZXNjLmRlZmFjcykge1xuICAgICAgICAgIC8vIFVzZSBvcHRpb25hbCBkZWZhdWx0IHBlcm1pc3Npb25zIG9ubHkuXG4gICAgICAgICAgcGt0LnN1Yi5zZXQuZGVzYyA9IHtcbiAgICAgICAgICAgIGRlZmFjczogc2V0UGFyYW1zLmRlc2MuZGVmYWNzXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc2V0UGFyYW1zLnRhZ3MpIHtcbiAgICAgICAgcGt0LnN1Yi5zZXQudGFncyA9IHNldFBhcmFtcy50YWdzO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnNlbmQocGt0LCBwa3Quc3ViLmlkKTtcbiAgfSxcblxuICAvKipcbiAgICogRGV0YWNoIGFuZCBvcHRpb25hbGx5IHVuc3Vic2NyaWJlIGZyb20gdGhlIHRvcGljXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpYyAtIFRvcGljIHRvIGRldGFjaCBmcm9tLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHVuc3ViIC0gSWYgPGNvZGU+dHJ1ZTwvY29kZT4sIGRldGFjaCBhbmQgdW5zdWJzY3JpYmUsIG90aGVyd2lzZSBqdXN0IGRldGFjaC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgbGVhdmU6IGZ1bmN0aW9uKHRvcGljLCB1bnN1Yikge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuaW5pdFBhY2tldCgnbGVhdmUnLCB0b3BpYyk7XG4gICAgcGt0LmxlYXZlLnVuc3ViID0gdW5zdWI7XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmxlYXZlLmlkKTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIG1lc3NhZ2UgZHJhZnQgd2l0aG91dCBzZW5kaW5nIGl0IHRvIHRoZSBzZXJ2ZXIuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpYyAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHB1Ymxpc2ggdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gUGF5bG9hZCB0byBwdWJsaXNoLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBub0VjaG8gLSBJZiA8Y29kZT50cnVlPC9jb2RlPiwgdGVsbCB0aGUgc2VydmVyIG5vdCB0byBlY2hvIHRoZSBtZXNzYWdlIHRvIHRoZSBvcmlnaW5hbCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBuZXcgbWVzc2FnZSB3aGljaCBjYW4gYmUgc2VudCB0byB0aGUgc2VydmVyIG9yIG90aGVyd2lzZSB1c2VkLlxuICAgKi9cbiAgY3JlYXRlTWVzc2FnZTogZnVuY3Rpb24odG9waWMsIGRhdGEsIG5vRWNobykge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuaW5pdFBhY2tldCgncHViJywgdG9waWMpO1xuXG4gICAgbGV0IGRmdCA9IHR5cGVvZiBkYXRhID09ICdzdHJpbmcnID8gRHJhZnR5LnBhcnNlKGRhdGEpIDogZGF0YTtcbiAgICBpZiAoZGZ0ICYmICFEcmFmdHkuaXNQbGFpblRleHQoZGZ0KSkge1xuICAgICAgcGt0LnB1Yi5oZWFkID0ge1xuICAgICAgICBtaW1lOiBEcmFmdHkuZ2V0Q29udGVudFR5cGUoKVxuICAgICAgfTtcbiAgICAgIGRhdGEgPSBkZnQ7XG4gICAgfVxuICAgIHBrdC5wdWIubm9lY2hvID0gbm9FY2hvO1xuICAgIHBrdC5wdWIuY29udGVudCA9IGRhdGE7XG5cbiAgICByZXR1cm4gcGt0LnB1YjtcbiAgfSxcblxuICAvKipcbiAgICogUHVibGlzaCB7ZGF0YX0gbWVzc2FnZSB0byB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gcHVibGlzaCB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBQYXlsb2FkIHRvIHB1Ymxpc2guXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IG5vRWNobyAtIElmIDxjb2RlPnRydWU8L2NvZGU+LCB0ZWxsIHRoZSBzZXJ2ZXIgbm90IHRvIGVjaG8gdGhlIG1lc3NhZ2UgdG8gdGhlIG9yaWdpbmFsIHNlc3Npb24uXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIHB1Ymxpc2g6IGZ1bmN0aW9uKHRvcGljLCBkYXRhLCBub0VjaG8pIHtcbiAgICByZXR1cm4gdGhpcy5wdWJsaXNoTWVzc2FnZShcbiAgICAgIHRoaXMuY3JlYXRlTWVzc2FnZSh0b3BpYywgZGF0YSwgbm9FY2hvKVxuICAgICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFB1Ymxpc2ggbWVzc2FnZSB0byB0b3BpYy4gVGhlIG1lc3NhZ2Ugc2hvdWxkIGJlIGNyZWF0ZWQgYnkge0BsaW5rIFRpbm9kZSNjcmVhdGVNZXNzYWdlfS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHB1YiAtIE1lc3NhZ2UgdG8gcHVibGlzaC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgcHVibGlzaE1lc3NhZ2U6IGZ1bmN0aW9uKHB1Yikge1xuICAgIC8vIE1ha2UgYSBzaGFsbG93IGNvcHkuIE5lZWRlZCBpbiBvcmRlciB0byBjbGVhciBsb2NhbGx5LWFzc2lnbmVkIHRlbXAgdmFsdWVzO1xuICAgIHB1YiA9IE9iamVjdC5hc3NpZ24oe30sIHB1Yik7XG4gICAgcHViLnNlcSA9IHVuZGVmaW5lZDtcbiAgICBwdWIuZnJvbSA9IHVuZGVmaW5lZDtcbiAgICBwdWIudHMgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHRoaXMuc2VuZCh7XG4gICAgICBwdWI6IHB1YlxuICAgIH0sIHB1Yi5pZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIEdldFF1ZXJ5XG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHByb3BlcnR5IHtUaW5vZGUuR2V0T3B0c1R5cGU9fSBkZXNjIC0gSWYgcHJvdmlkZWQgKGV2ZW4gaWYgZW1wdHkpLCBmZXRjaCB0b3BpYyBkZXNjcmlwdGlvbi5cbiAgICogQHByb3BlcnR5IHtUaW5vZGUuR2V0T3B0c1R5cGU9fSBzdWIgLSBJZiBwcm92aWRlZCAoZXZlbiBpZiBlbXB0eSksIGZldGNoIHRvcGljIHN1YnNjcmlwdGlvbnMuXG4gICAqIEBwcm9wZXJ0eSB7VGlub2RlLkdldERhdGFUeXBlPX0gZGF0YSAtIElmIHByb3ZpZGVkIChldmVuIGlmIGVtcHR5KSwgZ2V0IG1lc3NhZ2VzLlxuICAgKi9cblxuICAvKipcbiAgICogQHR5cGVkZWYgR2V0T3B0c1R5cGVcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge0RhdGU9fSBpbXMgLSBcIklmIG1vZGlmaWVkIHNpbmNlXCIsIGZldGNoIGRhdGEgb25seSBpdCB3YXMgd2FzIG1vZGlmaWVkIHNpbmNlIHN0YXRlZCBkYXRlLlxuICAgKiBAcHJvcGVydHkge251bWJlcj19IGxpbWl0IC0gTWF4aW11bSBudW1iZXIgb2YgcmVzdWx0cyB0byByZXR1cm4uIElnbm9yZWQgd2hlbiBxdWVyeWluZyB0b3BpYyBkZXNjcmlwdGlvbi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIEdldERhdGFUeXBlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHByb3BlcnR5IHtudW1iZXI9fSBzaW5jZSAtIExvYWQgbWVzc2FnZXMgd2l0aCBzZXEgaWQgZXF1YWwgb3IgZ3JlYXRlciB0aGFuIHRoaXMgdmFsdWUuXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyPX0gYmVmb3JlIC0gTG9hZCBtZXNzYWdlcyB3aXRoIHNlcSBpZCBsb3dlciB0aGFuIHRoaXMgbnVtYmVyLlxuICAgKiBAcHJvcGVydHkge251bWJlcj19IGxpbWl0IC0gTWF4aW11bSBudW1iZXIgb2YgcmVzdWx0cyB0byByZXR1cm4uXG4gICAqL1xuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRvcGljIG1ldGFkYXRhXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpYyAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHF1ZXJ5LlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5HZXRRdWVyeX0gcGFyYW1zIC0gUGFyYW1ldGVycyBvZiB0aGUgcXVlcnkuIFVzZSB7QGxpbmsgVGlub2RlLk1ldGFHZXRCdWlsZGVyfSB0byBnZW5lcmF0ZS5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgZ2V0TWV0YTogZnVuY3Rpb24odG9waWMsIHBhcmFtcykge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuaW5pdFBhY2tldCgnZ2V0JywgdG9waWMpO1xuXG4gICAgcGt0LmdldCA9IG1lcmdlT2JqKHBrdC5nZXQsIHBhcmFtcyk7XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmdldC5pZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0b3BpYydzIG1ldGFkYXRhOiBkZXNjcmlwdGlvbiwgc3Vic2NyaWJ0aW9ucy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljIC0gVG9waWMgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXRQYXJhbXN9IHBhcmFtcyAtIHRvcGljIG1ldGFkYXRhIHRvIHVwZGF0ZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgc2V0TWV0YTogZnVuY3Rpb24odG9waWMsIHBhcmFtcykge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuaW5pdFBhY2tldCgnc2V0JywgdG9waWMpO1xuICAgIGNvbnN0IHdoYXQgPSBbXTtcblxuICAgIGlmIChwYXJhbXMpIHtcbiAgICAgIFsnZGVzYycsICdzdWInLCAndGFncycsICdjcmVkJ10ubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBpZiAocGFyYW1zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICB3aGF0LnB1c2goa2V5KTtcbiAgICAgICAgICBwa3Quc2V0W2tleV0gPSBwYXJhbXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHdoYXQubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJJbnZhbGlkIHtzZXR9IHBhcmFtZXRlcnNcIikpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnNlbmQocGt0LCBwa3Quc2V0LmlkKTtcbiAgfSxcblxuICAvKipcbiAgICogUmFuZ2Ugb2YgbWVzc2FnZSBJRHMgdG8gZGVsZXRlLlxuICAgKlxuICAgKiBAdHlwZWRlZiBEZWxSYW5nZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb3cgLSBsb3cgZW5kIG9mIHRoZSByYW5nZSwgaW5jbHVzaXZlIChjbG9zZWQpLlxuICAgKiBAcHJvcGVydHkge251bWJlcj19IGhpIC0gaGlnaCBlbmQgb2YgdGhlIHJhbmdlLCBleGNsdXNpdmUgKG9wZW4pLlxuICAgKi9cbiAgLyoqXG4gICAqIERlbGV0ZSBzb21lIG9yIGFsbCBtZXNzYWdlcyBpbiBhIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWMgLSBUb3BpYyBuYW1lIHRvIGRlbGV0ZSBtZXNzYWdlcyBmcm9tLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5EZWxSYW5nZVtdfSBsaXN0IC0gUmFuZ2VzIG9mIG1lc3NhZ2UgSURzIHRvIGRlbGV0ZS5cbiAgICogQHBhcmFtIHtib29sZWFuPX0gaGFyZCAtIEhhcmQgb3Igc29mdCBkZWxldGVcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgZGVsTWVzc2FnZXM6IGZ1bmN0aW9uKHRvcGljLCByYW5nZXMsIGhhcmQpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ2RlbCcsIHRvcGljKTtcblxuICAgIHBrdC5kZWwud2hhdCA9ICdtc2cnO1xuICAgIHBrdC5kZWwuZGVsc2VxID0gcmFuZ2VzO1xuICAgIHBrdC5kZWwuaGFyZCA9IGhhcmQ7XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmRlbC5pZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGUgdG9waWMgYWxsdG9nZXRoZXIuIFJlcXVpcmVzIE93bmVyIHBlcm1pc3Npb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byBkZWxldGVcbiAgICogQHBhcmFtIHtib29sZWFufSBoYXJkIC0gaGFyZC1kZWxldGUgdG9waWMuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGRlbFRvcGljOiBmdW5jdGlvbih0b3BpY05hbWUsIGhhcmQpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ2RlbCcsIHRvcGljTmFtZSk7XG4gICAgcGt0LmRlbC53aGF0ID0gJ3RvcGljJztcbiAgICBwa3QuZGVsLmhhcmQgPSBoYXJkO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VuZChwa3QsIHBrdC5kZWwuaWQpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIHRoaXMuX2RiLnJlbVRvcGljKHRvcGljTmFtZSk7XG4gICAgICB0aGlzLmNhY2hlRGVsKCd0b3BpYycsIHRvcGljTmFtZSk7XG4gICAgICByZXR1cm4gdGhpcy5jdHJsO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBEZWxldGUgc3Vic2NyaXB0aW9uLiBSZXF1aXJlcyBTaGFyZSBwZXJtaXNzaW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWNOYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gZGVsZXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VyIC0gVXNlciBJRCB0byByZW1vdmUuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGRlbFN1YnNjcmlwdGlvbjogZnVuY3Rpb24odG9waWNOYW1lLCB1c2VyKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdkZWwnLCB0b3BpY05hbWUpO1xuICAgIHBrdC5kZWwud2hhdCA9ICdzdWInO1xuICAgIHBrdC5kZWwudXNlciA9IHVzZXI7XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmRlbC5pZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSBjcmVkZW50aWFsLiBBbHdheXMgc2VudCBvbiA8Y29kZT4nbWUnPC9jb2RlPiB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIHZhbGlkYXRpb24gbWV0aG9kIHN1Y2ggYXMgPGNvZGU+J2VtYWlsJzwvY29kZT4gb3IgPGNvZGU+J3RlbCc8L2NvZGU+LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgLSB2YWxpZGF0aW9uIHZhbHVlLCBpLmUuIDxjb2RlPidhbGljZUBleGFtcGxlLmNvbSc8L2NvZGU+LlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBkZWxDcmVkZW50aWFsOiBmdW5jdGlvbihtZXRob2QsIHZhbHVlKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdkZWwnLCBUT1BJQ19NRSk7XG4gICAgcGt0LmRlbC53aGF0ID0gJ2NyZWQnO1xuICAgIHBrdC5kZWwuY3JlZCA9IHtcbiAgICAgIG1ldGg6IG1ldGhvZCxcbiAgICAgIHZhbDogdmFsdWVcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMuc2VuZChwa3QsIHBrdC5kZWwuaWQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRvIGRlbGV0ZSBhY2NvdW50IG9mIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaGFyZCAtIGhhcmQtZGVsZXRlIHVzZXIuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGRlbEN1cnJlbnRVc2VyOiBmdW5jdGlvbihoYXJkKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdkZWwnLCBudWxsKTtcbiAgICBwa3QuZGVsLndoYXQgPSAndXNlcic7XG4gICAgcGt0LmRlbC5oYXJkID0gaGFyZDtcblxuICAgIHJldHVybiB0aGlzLnNlbmQocGt0LCBwa3QuZGVsLmlkKS50aGVuKChjdHJsKSA9PiB7XG4gICAgICB0aGlzLl9teVVJRCA9IG51bGw7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIE5vdGlmeSBzZXJ2ZXIgdGhhdCBhIG1lc3NhZ2Ugb3IgbWVzc2FnZXMgd2VyZSByZWFkIG9yIHJlY2VpdmVkLiBEb2VzIE5PVCByZXR1cm4gcHJvbWlzZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHdoZXJlIHRoZSBtZXNhZ2UgaXMgYmVpbmcgYWtub3dsZWRnZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3aGF0IC0gQWN0aW9uIGJlaW5nIGFrbm93bGVkZ2VkLCBlaXRoZXIgPGNvZGU+XCJyZWFkXCI8L2NvZGU+IG9yIDxjb2RlPlwicmVjdlwiPC9jb2RlPi5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlcSAtIE1heGltdW0gaWQgb2YgdGhlIG1lc3NhZ2UgYmVpbmcgYWNrbm93bGVkZ2VkLlxuICAgKi9cbiAgbm90ZTogZnVuY3Rpb24odG9waWNOYW1lLCB3aGF0LCBzZXEpIHtcbiAgICBpZiAoc2VxIDw9IDAgfHwgc2VxID49IExPQ0FMX1NFUUlEKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbWVzc2FnZSBpZCAke3NlcX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ25vdGUnLCB0b3BpY05hbWUpO1xuICAgIHBrdC5ub3RlLndoYXQgPSB3aGF0O1xuICAgIHBrdC5ub3RlLnNlcSA9IHNlcTtcbiAgICB0aGlzLnNlbmQocGt0KTtcbiAgfSxcblxuICAvKipcbiAgICogQnJvYWRjYXN0IGEga2V5LXByZXNzIG5vdGlmaWNhdGlvbiB0byB0b3BpYyBzdWJzY3JpYmVycy4gVXNlZCB0byBzaG93XG4gICAqIHR5cGluZyBub3RpZmljYXRpb25zIFwidXNlciBYIGlzIHR5cGluZy4uLlwiLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWNOYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gYnJvYWRjYXN0IHRvLlxuICAgKi9cbiAgbm90ZUtleVByZXNzOiBmdW5jdGlvbih0b3BpY05hbWUpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ25vdGUnLCB0b3BpY05hbWUpO1xuICAgIHBrdC5ub3RlLndoYXQgPSAna3AnO1xuICAgIHRoaXMuc2VuZChwa3QpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSBuYW1lZCB0b3BpYywgZWl0aGVyIHB1bGwgaXQgZnJvbSBjYWNoZSBvciBjcmVhdGUgYSBuZXcgaW5zdGFuY2UuXG4gICAqIFRoZXJlIGlzIGEgc2luZ2xlIGluc3RhbmNlIG9mIHRvcGljIGZvciBlYWNoIG5hbWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byBnZXQuXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuVG9waWN9IFJlcXVlc3RlZCBvciBuZXdseSBjcmVhdGVkIHRvcGljIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4gaWYgdG9waWMgbmFtZSBpcyBpbnZhbGlkLlxuICAgKi9cbiAgZ2V0VG9waWM6IGZ1bmN0aW9uKHRvcGljTmFtZSkge1xuICAgIGxldCB0b3BpYyA9IHRoaXMuY2FjaGVHZXQoJ3RvcGljJywgdG9waWNOYW1lKTtcbiAgICBpZiAoIXRvcGljICYmIHRvcGljTmFtZSkge1xuICAgICAgaWYgKHRvcGljTmFtZSA9PSBUT1BJQ19NRSkge1xuICAgICAgICB0b3BpYyA9IG5ldyBUb3BpY01lKCk7XG4gICAgICB9IGVsc2UgaWYgKHRvcGljTmFtZSA9PSBUT1BJQ19GTkQpIHtcbiAgICAgICAgdG9waWMgPSBuZXcgVG9waWNGbmQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRvcGljID0gbmV3IFRvcGljKHRvcGljTmFtZSk7XG4gICAgICB9XG4gICAgICAvLyBDYWNoZSBtYW5hZ2VtZW50LlxuICAgICAgdGhpcy5fZGIudXBkVG9waWModG9waWMpO1xuICAgICAgdGhpcy5hdHRhY2hDYWNoZVRvVG9waWModG9waWMpO1xuICAgICAgdG9waWMuX2NhY2hlUHV0U2VsZigpO1xuICAgIH1cbiAgICByZXR1cm4gdG9waWM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIG5hbWVkIHRvcGljIGlzIGFscmVhZHkgcHJlc2VudCBpbiBjYWNoZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB0b3BpYyBpcyBmb3VuZCBpbiBjYWNoZSwgZmFsc2Ugb3Rlcndpc2UuXG4gICAqL1xuICBpc1RvcGljQ2FjaGVkOiBmdW5jdGlvbih0b3BpY05hbWUpIHtcbiAgICByZXR1cm4gISF0aGlzLmNhY2hlR2V0KCd0b3BpYycsIHRvcGljTmFtZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIHVuaXF1ZSBuYW1lIGxpa2UgPGNvZGU+J25ldzEyMzQ1Nic8L2NvZGU+IHN1aXRhYmxlIGZvciBjcmVhdGluZyBhIG5ldyBncm91cCB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0NoYW4gLSBpZiB0aGUgdG9waWMgaXMgY2hhbm5lbC1lbmFibGVkLlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBuYW1lIHdoaWNoIGNhbiBiZSB1c2VkIGZvciBjcmVhdGluZyBhIG5ldyBncm91cCB0b3BpYy5cbiAgICovXG4gIG5ld0dyb3VwVG9waWNOYW1lOiBmdW5jdGlvbihpc0NoYW4pIHtcbiAgICByZXR1cm4gKGlzQ2hhbiA/IFRPUElDX05FV19DSEFOIDogVE9QSUNfTkVXKSArIHRoaXMuZ2V0TmV4dFVuaXF1ZUlkKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlIDxjb2RlPidtZSc8L2NvZGU+IHRvcGljIG9yIGdldCBpdCBmcm9tIGNhY2hlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLlRvcGljTWV9IEluc3RhbmNlIG9mIDxjb2RlPidtZSc8L2NvZGU+IHRvcGljLlxuICAgKi9cbiAgZ2V0TWVUb3BpYzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VG9waWMoVE9QSUNfTUUpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZSA8Y29kZT4nZm5kJzwvY29kZT4gKGZpbmQpIHRvcGljIG9yIGdldCBpdCBmcm9tIGNhY2hlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLlRvcGljfSBJbnN0YW5jZSBvZiA8Y29kZT4nZm5kJzwvY29kZT4gdG9waWMuXG4gICAqL1xuICBnZXRGbmRUb3BpYzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VG9waWMoVE9QSUNfRk5EKTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHtAbGluayBMYXJnZUZpbGVIZWxwZXJ9IGluc3RhbmNlXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTGFyZ2VGaWxlSGVscGVyfSBpbnN0YW5jZSBvZiBhIHtAbGluayBUaW5vZGUuTGFyZ2VGaWxlSGVscGVyfS5cbiAgICovXG4gIGdldExhcmdlRmlsZUhlbHBlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBMYXJnZUZpbGVIZWxwZXIodGhpcyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgVUlEIG9mIHRoZSB0aGUgY3VycmVudCBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFVJRCBvZiB0aGUgY3VycmVudCB1c2VyIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4gaWYgdGhlIHNlc3Npb24gaXMgbm90IHlldCBhdXRoZW50aWNhdGVkIG9yIGlmIHRoZXJlIGlzIG5vIHNlc3Npb24uXG4gICAqL1xuICBnZXRDdXJyZW50VXNlcklEOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fbXlVSUQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSBnaXZlbiB1c2VyIElEIGlzIGVxdWFsIHRvIHRoZSBjdXJyZW50IHVzZXIncyBVSUQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1aWQgLSBVSUQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBVSUQgYmVsb25ncyB0byB0aGUgY3VycmVudCBsb2dnZWQgaW4gdXNlci5cbiAgICovXG4gIGlzTWU6IGZ1bmN0aW9uKHVpZCkge1xuICAgIHJldHVybiB0aGlzLl9teVVJRCA9PT0gdWlkO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgbG9naW4gdXNlZCBmb3IgbGFzdCBzdWNjZXNzZnVsIGF1dGhlbnRpY2F0aW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBsb2dpbiBsYXN0IHVzZWQgc3VjY2Vzc2Z1bGx5IG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4uXG4gICAqL1xuICBnZXRDdXJyZW50TG9naW46IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9sb2dpbjtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJuIGluZm9ybWF0aW9uIGFib3V0IHRoZSBzZXJ2ZXI6IHByb3RvY29sIHZlcnNpb24gYW5kIGJ1aWxkIHRpbWVzdGFtcC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHJldHVybnMge09iamVjdH0gYnVpbGQgYW5kIHZlcnNpb24gb2YgdGhlIHNlcnZlciBvciA8Y29kZT5udWxsPC9jb2RlPiBpZiB0aGVyZSBpcyBubyBjb25uZWN0aW9uIG9yIGlmIHRoZSBmaXJzdCBzZXJ2ZXIgcmVzcG9uc2UgaGFzIG5vdCBiZWVuIHJlY2VpdmVkIHlldC5cbiAgICovXG4gIGdldFNlcnZlckluZm86IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9zZXJ2ZXJJbmZvO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gc2VydmVyLXByb3ZpZGVkIGNvbmZpZ3VyYXRpb24gdmFsdWUgKGxvbmcgaW50ZWdlcikuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRoZSB2YWx1ZSB0byByZXR1cm5cbiAgICogQHBhcmFtIHtPYmplY3R9IGRlZmF1bHRWYWx1ZSB0byByZXR1cm4gaW4gY2FzZSBzZXJ2ZXIgbGltaXQgaXMgbm90IHNldCBvciBub3QgZm91bmQuXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IG5hbWVkIHZhbHVlLlxuICAgKi9cbiAgZ2V0U2VydmVyTGltaXQ6IGZ1bmN0aW9uKG5hbWUsIGRlZmF1bHRWYWx1ZSkge1xuICAgIHJldHVybiAodGhpcy5fc2VydmVySW5mbyA/IHRoaXMuX3NlcnZlckluZm9bbmFtZV0gOiBudWxsKSB8fCBkZWZhdWx0VmFsdWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRvZ2dsZSBjb25zb2xlIGxvZ2dpbmcuIExvZ2dpbmcgaXMgb2ZmIGJ5IGRlZmF1bHQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZW5hYmxlZCAtIFNldCB0byA8Y29kZT50cnVlPC9jb2RlPiB0byBlbmFibGUgbG9nZ2luZyB0byBjb25zb2xlLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHRyaW1Mb25nU3RyaW5ncyAtIFNldCB0byA8Y29kZT50cnVlPC9jb2RlPiB0byB0cmltIGxvbmcgc3RyaW5ncy5cbiAgICovXG4gIGVuYWJsZUxvZ2dpbmc6IGZ1bmN0aW9uKGVuYWJsZWQsIHRyaW1Mb25nU3RyaW5ncykge1xuICAgIHRoaXMuX2xvZ2dpbmdFbmFibGVkID0gZW5hYmxlZDtcbiAgICB0aGlzLl90cmltTG9uZ1N0cmluZ3MgPSBlbmFibGVkICYmIHRyaW1Mb25nU3RyaW5ncztcbiAgfSxcblxuICAvKipcbiAgICogU2V0IFVJIGxhbmd1YWdlIHRvIHJlcG9ydCB0byB0aGUgc2VydmVyLiBNdXN0IGJlIGNhbGxlZCBiZWZvcmUgPGNvZGU+J2hpJzwvY29kZT4gaXMgc2VudCwgb3RoZXJ3aXNlIGl0IHdpbGwgbm90IGJlIHVzZWQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBobCAtIGh1bWFuIChVSSkgbGFuZ3VhZ2UsIGxpa2UgPGNvZGU+XCJlbl9VU1wiPC9jb2RlPiBvciA8Y29kZT5cInpoLUhhbnNcIjwvY29kZT4uXG4gICAqL1xuICBzZXRIdW1hbkxhbmd1YWdlOiBmdW5jdGlvbihobCkge1xuICAgIGlmIChobCkge1xuICAgICAgdGhpcy5faHVtYW5MYW5ndWFnZSA9IGhsO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgZ2l2ZW4gdG9waWMgaXMgb25saW5lLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0aGUgdG9waWMgdG8gdGVzdC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgdG9waWMgaXMgb25saW5lLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBpc1RvcGljT25saW5lOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc3QgdG9waWMgPSB0aGlzLmNhY2hlR2V0KCd0b3BpYycsIG5hbWUpO1xuICAgIHJldHVybiB0b3BpYyAmJiB0b3BpYy5vbmxpbmU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhY2Nlc3MgbW9kZSBmb3IgdGhlIGdpdmVuIGNvbnRhY3QuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRoZSB0b3BpYyB0byBxdWVyeS5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IGFjY2VzcyBtb2RlIGlmIHRvcGljIGlzIGZvdW5kLCBudWxsIG90aGVyd2lzZS5cbiAgICovXG4gIGdldFRvcGljQWNjZXNzTW9kZTogZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnN0IHRvcGljID0gdGhpcy5jYWNoZUdldCgndG9waWMnLCBuYW1lKTtcbiAgICByZXR1cm4gdG9waWMgPyB0b3BpYy5hY3MgOiBudWxsO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJbmNsdWRlIG1lc3NhZ2UgSUQgaW50byBhbGwgc3Vic2VxdWVzdCBtZXNzYWdlcyB0byBzZXJ2ZXIgaW5zdHJ1Y3RpbiBpdCB0byBzZW5kIGFrbm93bGVkZ2VtZW5zLlxuICAgKiBSZXF1aXJlZCBmb3IgcHJvbWlzZXMgdG8gZnVuY3Rpb24uIERlZmF1bHQgaXMgPGNvZGU+XCJvblwiPC9jb2RlPi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBzdGF0dXMgLSBUdXJuIGFrbm93bGVkZ2VtZW5zIG9uIG9yIG9mZi5cbiAgICogQGRlcHJlY2F0ZWRcbiAgICovXG4gIHdhbnRBa246IGZ1bmN0aW9uKHN0YXR1cykge1xuICAgIGlmIChzdGF0dXMpIHtcbiAgICAgIHRoaXMuX21lc3NhZ2VJZCA9IE1hdGguZmxvb3IoKE1hdGgucmFuZG9tKCkgKiAweEZGRkZGRikgKyAweEZGRkZGRik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX21lc3NhZ2VJZCA9IDA7XG4gICAgfVxuICB9LFxuXG4gIC8vIENhbGxiYWNrczpcbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlcG9ydCB3aGVuIHRoZSB3ZWJzb2NrZXQgaXMgb3BlbmVkLiBUaGUgY2FsbGJhY2sgaGFzIG5vIHBhcmFtZXRlcnMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25XZWJzb2NrZXRPcGVufVxuICAgKi9cbiAgb25XZWJzb2NrZXRPcGVuOiB1bmRlZmluZWQsXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIFRpbm9kZS5TZXJ2ZXJQYXJhbXNcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gdmVyIC0gU2VydmVyIHZlcnNpb25cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGJ1aWxkIC0gU2VydmVyIGJ1aWxkXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gc2lkIC0gU2Vzc2lvbiBJRCwgbG9uZyBwb2xsaW5nIGNvbm5lY3Rpb25zIG9ubHkuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAY2FsbGJhY2sgVGlub2RlLm9uQ29ubmVjdFxuICAgKiBAcGFyYW0ge251bWJlcn0gY29kZSAtIFJlc3VsdCBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGV4dCBlcHhwbGFpbmluZyB0aGUgY29tcGxldGlvbiwgaS5lIFwiT0tcIiBvciBhbiBlcnJvciBtZXNzYWdlLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXJ2ZXJQYXJhbXN9IHBhcmFtcyAtIFBhcmFtZXRlcnMgcmV0dXJuZWQgYnkgdGhlIHNlcnZlci5cbiAgICovXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZXBvcnQgd2hlbiBjb25uZWN0aW9uIHdpdGggVGlub2RlIHNlcnZlciBpcyBlc3RhYmxpc2hlZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbkNvbm5lY3R9XG4gICAqL1xuICBvbkNvbm5lY3Q6IHVuZGVmaW5lZCxcblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVwb3J0IHdoZW4gY29ubmVjdGlvbiBpcyBsb3N0LiBUaGUgY2FsbGJhY2sgaGFzIG5vIHBhcmFtZXRlcnMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25EaXNjb25uZWN0fVxuICAgKi9cbiAgb25EaXNjb25uZWN0OiB1bmRlZmluZWQsXG5cbiAgLyoqXG4gICAqIEBjYWxsYmFjayBUaW5vZGUub25Mb2dpblxuICAgKiBAcGFyYW0ge251bWJlcn0gY29kZSAtIE5VbWVyaWMgY29tcGxldGlvbiBjb2RlLCBzYW1lIGFzIEhUVFAgc3RhdHVzIGNvZGVzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIEV4cGxhbmF0aW9uIG9mIHRoZSBjb21wbGV0aW9uIGNvZGUuXG4gICAqL1xuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVwb3J0IGxvZ2luIGNvbXBsZXRpb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25Mb2dpbn1cbiAgICovXG4gIG9uTG9naW46IHVuZGVmaW5lZCxcblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVjZWl2ZSA8Y29kZT57Y3RybH08L2NvZGU+IChjb250cm9sKSBtZXNzYWdlcy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbkN0cmxNZXNzYWdlfVxuICAgKi9cbiAgb25DdHJsTWVzc2FnZTogdW5kZWZpbmVkLFxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZWNpZXZlIDxjb2RlPntkYXRhfTwvY29kZT4gKGNvbnRlbnQpIG1lc3NhZ2VzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uRGF0YU1lc3NhZ2V9XG4gICAqL1xuICBvbkRhdGFNZXNzYWdlOiB1bmRlZmluZWQsXG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlY2VpdmUgPGNvZGU+e3ByZXN9PC9jb2RlPiAocHJlc2VuY2UpIG1lc3NhZ2VzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uUHJlc01lc3NhZ2V9XG4gICAqL1xuICBvblByZXNNZXNzYWdlOiB1bmRlZmluZWQsXG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlY2VpdmUgYWxsIG1lc3NhZ2VzIGFzIG9iamVjdHMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25NZXNzYWdlfVxuICAgKi9cbiAgb25NZXNzYWdlOiB1bmRlZmluZWQsXG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlY2VpdmUgYWxsIG1lc3NhZ2VzIGFzIHVucGFyc2VkIHRleHQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25SYXdNZXNzYWdlfVxuICAgKi9cbiAgb25SYXdNZXNzYWdlOiB1bmRlZmluZWQsXG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlY2VpdmUgc2VydmVyIHJlc3BvbnNlcyB0byBuZXR3b3JrIHByb2Jlcy4gU2VlIHtAbGluayBUaW5vZGUjbmV0d29ya1Byb2JlfVxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uTmV0d29ya1Byb2JlfVxuICAgKi9cbiAgb25OZXR3b3JrUHJvYmU6IHVuZGVmaW5lZCxcblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBleHBvbmVudGlhbCBiYWNrb2ZmIGlzIGl0ZXJhdGluZy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbkF1dG9yZWNvbm5lY3RJdGVyYXRpb259XG4gICAqL1xuICBvbkF1dG9yZWNvbm5lY3RJdGVyYXRpb246IHVuZGVmaW5lZCxcbn07XG5cbi8qKlxuICogSGVscGVyIGNsYXNzIGZvciBjb25zdHJ1Y3Rpbmcge0BsaW5rIFRpbm9kZS5HZXRRdWVyeX0uXG4gKlxuICogQGNsYXNzIE1ldGFHZXRCdWlsZGVyXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtUaW5vZGUuVG9waWN9IHBhcmVudCB0b3BpYyB3aGljaCBpbnN0YW50aWF0ZWQgdGhpcyBidWlsZGVyLlxuICovXG52YXIgTWV0YUdldEJ1aWxkZXIgPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgdGhpcy50b3BpYyA9IHBhcmVudDtcbiAgdGhpcy53aGF0ID0ge307XG59XG5cbk1ldGFHZXRCdWlsZGVyLnByb3RvdHlwZSA9IHtcblxuICAvLyBHZXQgdGltZXN0YW1wIG9mIHRoZSBtb3N0IHJlY2VudCBkZXNjIHVwZGF0ZS5cbiAgX2dldF9kZXNjX2ltczogZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgdHVwZCA9IHRoaXMudG9waWMuX2xhc3REZXNjVXBkYXRlIHx8IDA7XG4gICAgcmV0dXJuIHRoaXMudG9waWMudXBkYXRlZCA+IHR1cGQgPyB0aGlzLnRvcGljLnVwZGF0ZWQgOiB0dXBkO1xuICB9LFxuXG4gIC8vIEdldCB0aW1lc3RhbXAgb2YgdGhlIG1vc3QgcmVjZW50IHN1YnMgdXBkYXRlLlxuICBfZ2V0X3N1YnNfaW1zOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy50b3BpYy5pc1AyUFR5cGUoKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldF9kZXNjX2ltcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy50b3BpYy5pc01lVHlwZSgpKSB7XG4gICAgICBjb25zdCBndXBkID0gdGhpcy50b3BpYy5fdGlub2RlLl9sYXN0VG9waWNVcGRhdGUgfHwgMDtcbiAgICAgIGlmIChndXBkID4gdGhpcy50b3BpYy5fbGFzdFN1YnNVcGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGd1cGQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnRvcGljLl9sYXN0U3Vic1VwZGF0ZTtcbiAgfSxcblxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggbWVzc2FnZXMgd2l0aGluIGV4cGxpY2l0IGxpbWl0cy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5NZXRhR2V0QnVpbGRlciNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXI9fSBzaW5jZSAtIG1lc3NhZ2VzIG5ld2VyIHRoYW4gdGhpcyAoaW5jbHVzaXZlKTtcbiAgICogQHBhcmFtIHtudW1iZXI9fSBiZWZvcmUgLSBvbGRlciB0aGFuIHRoaXMgKGV4Y2x1c2l2ZSlcbiAgICogQHBhcmFtIHtudW1iZXI9fSBsaW1pdCAtIG51bWJlciBvZiBtZXNzYWdlcyB0byBmZXRjaFxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoRGF0YTogZnVuY3Rpb24oc2luY2UsIGJlZm9yZSwgbGltaXQpIHtcbiAgICB0aGlzLndoYXRbJ2RhdGEnXSA9IHtcbiAgICAgIHNpbmNlOiBzaW5jZSxcbiAgICAgIGJlZm9yZTogYmVmb3JlLFxuICAgICAgbGltaXQ6IGxpbWl0XG4gICAgfTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggbWVzc2FnZXMgbmV3ZXIgdGhhbiB0aGUgbGF0ZXN0IHNhdmVkIG1lc3NhZ2UuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbGltaXQgLSBudW1iZXIgb2YgbWVzc2FnZXMgdG8gZmV0Y2hcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aExhdGVyRGF0YTogZnVuY3Rpb24obGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoRGF0YSh0aGlzLnRvcGljLl9tYXhTZXEgPiAwID8gdGhpcy50b3BpYy5fbWF4U2VxICsgMSA6IHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBsaW1pdCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIG1lc3NhZ2VzIG9sZGVyIHRoYW4gdGhlIGVhcmxpZXN0IHNhdmVkIG1lc3NhZ2UuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbGltaXQgLSBtYXhpbXVtIG51bWJlciBvZiBtZXNzYWdlcyB0byBmZXRjaC5cbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aEVhcmxpZXJEYXRhOiBmdW5jdGlvbihsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLndpdGhEYXRhKHVuZGVmaW5lZCwgdGhpcy50b3BpYy5fbWluU2VxID4gMCA/IHRoaXMudG9waWMuX21pblNlcSA6IHVuZGVmaW5lZCwgbGltaXQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCB0b3BpYyBkZXNjcmlwdGlvbiBpZiBpdCdzIG5ld2VyIHRoYW4gdGhlIGdpdmVuIHRpbWVzdGFtcC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5NZXRhR2V0QnVpbGRlciNcbiAgICpcbiAgICogQHBhcmFtIHtEYXRlPX0gaW1zIC0gZmV0Y2ggbWVzc2FnZXMgbmV3ZXIgdGhhbiB0aGlzIHRpbWVzdGFtcC5cbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aERlc2M6IGZ1bmN0aW9uKGltcykge1xuICAgIHRoaXMud2hhdFsnZGVzYyddID0ge1xuICAgICAgaW1zOiBpbXNcbiAgICB9O1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCB0b3BpYyBkZXNjcmlwdGlvbiBpZiBpdCdzIG5ld2VyIHRoYW4gdGhlIGxhc3QgdXBkYXRlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoTGF0ZXJEZXNjOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoRGVzYyh0aGlzLl9nZXRfZGVzY19pbXMoKSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIHN1YnNjcmlwdGlvbnMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7RGF0ZT19IGltcyAtIGZldGNoIHN1YnNjcmlwdGlvbnMgbW9kaWZpZWQgbW9yZSByZWNlbnRseSB0aGFuIHRoaXMgdGltZXN0YW1wXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbGltaXQgLSBtYXhpbXVtIG51bWJlciBvZiBzdWJzY3JpcHRpb25zIHRvIGZldGNoLlxuICAgKiBAcGFyYW0ge3N0cmluZz19IHVzZXJPclRvcGljIC0gdXNlciBJRCBvciB0b3BpYyBuYW1lIHRvIGZldGNoIGZvciBmZXRjaGluZyBvbmUgc3Vic2NyaXB0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoU3ViOiBmdW5jdGlvbihpbXMsIGxpbWl0LCB1c2VyT3JUb3BpYykge1xuICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICBpbXM6IGltcyxcbiAgICAgIGxpbWl0OiBsaW1pdFxuICAgIH07XG4gICAgaWYgKHRoaXMudG9waWMuZ2V0VHlwZSgpID09ICdtZScpIHtcbiAgICAgIG9wdHMudG9waWMgPSB1c2VyT3JUb3BpYztcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0cy51c2VyID0gdXNlck9yVG9waWM7XG4gICAgfVxuICAgIHRoaXMud2hhdFsnc3ViJ10gPSBvcHRzO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBhIHNpbmdsZSBzdWJzY3JpcHRpb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7RGF0ZT19IGltcyAtIGZldGNoIHN1YnNjcmlwdGlvbnMgbW9kaWZpZWQgbW9yZSByZWNlbnRseSB0aGFuIHRoaXMgdGltZXN0YW1wXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gdXNlck9yVG9waWMgLSB1c2VyIElEIG9yIHRvcGljIG5hbWUgdG8gZmV0Y2ggZm9yIGZldGNoaW5nIG9uZSBzdWJzY3JpcHRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhPbmVTdWI6IGZ1bmN0aW9uKGltcywgdXNlck9yVG9waWMpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoU3ViKGltcywgdW5kZWZpbmVkLCB1c2VyT3JUb3BpYyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIGEgc2luZ2xlIHN1YnNjcmlwdGlvbiBpZiBpdCdzIGJlZW4gdXBkYXRlZCBzaW5jZSB0aGUgbGFzdCB1cGRhdGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gdXNlck9yVG9waWMgLSB1c2VyIElEIG9yIHRvcGljIG5hbWUgdG8gZmV0Y2ggZm9yIGZldGNoaW5nIG9uZSBzdWJzY3JpcHRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhMYXRlck9uZVN1YjogZnVuY3Rpb24odXNlck9yVG9waWMpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoT25lU3ViKHRoaXMudG9waWMuX2xhc3RTdWJzVXBkYXRlLCB1c2VyT3JUb3BpYyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIHN1YnNjcmlwdGlvbnMgdXBkYXRlZCBzaW5jZSB0aGUgbGFzdCB1cGRhdGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbGltaXQgLSBtYXhpbXVtIG51bWJlciBvZiBzdWJzY3JpcHRpb25zIHRvIGZldGNoLlxuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoTGF0ZXJTdWI6IGZ1bmN0aW9uKGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aFN1Yih0aGlzLl9nZXRfc3Vic19pbXMoKSwgbGltaXQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCB0b3BpYyB0YWdzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoVGFnczogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy53aGF0Wyd0YWdzJ10gPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCB1c2VyJ3MgY3JlZGVudGlhbHMuIDxjb2RlPidtZSc8L2NvZGU+IHRvcGljIG9ubHkuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhDcmVkOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy50b3BpYy5nZXRUeXBlKCkgPT0gJ21lJykge1xuICAgICAgdGhpcy53aGF0WydjcmVkJ10gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRvcGljLl90aW5vZGUubG9nZ2VyKFwiRVJST1I6IEludmFsaWQgdG9waWMgdHlwZSBmb3IgTWV0YUdldEJ1aWxkZXI6d2l0aENyZWRzXCIsIHRoaXMudG9waWMuZ2V0VHlwZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIGRlbGV0ZWQgbWVzc2FnZXMgd2l0aGluIGV4cGxpY2l0IGxpbWl0cy4gQW55L2FsbCBwYXJhbWV0ZXJzIGNhbiBiZSBudWxsLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IHNpbmNlIC0gaWRzIG9mIG1lc3NhZ2VzIGRlbGV0ZWQgc2luY2UgdGhpcyAnZGVsJyBpZCAoaW5jbHVzaXZlKVxuICAgKiBAcGFyYW0ge251bWJlcj19IGxpbWl0IC0gbnVtYmVyIG9mIGRlbGV0ZWQgbWVzc2FnZSBpZHMgdG8gZmV0Y2hcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aERlbDogZnVuY3Rpb24oc2luY2UsIGxpbWl0KSB7XG4gICAgaWYgKHNpbmNlIHx8IGxpbWl0KSB7XG4gICAgICB0aGlzLndoYXRbJ2RlbCddID0ge1xuICAgICAgICBzaW5jZTogc2luY2UsXG4gICAgICAgIGxpbWl0OiBsaW1pdFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIG1lc3NhZ2VzIGRlbGV0ZWQgYWZ0ZXIgdGhlIHNhdmVkIDxjb2RlPidkZWwnPC9jb2RlPiBpZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5NZXRhR2V0QnVpbGRlciNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXI9fSBsaW1pdCAtIG51bWJlciBvZiBkZWxldGVkIG1lc3NhZ2UgaWRzIHRvIGZldGNoXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhMYXRlckRlbDogZnVuY3Rpb24obGltaXQpIHtcbiAgICAvLyBTcGVjaWZ5ICdzaW5jZScgb25seSBpZiB3ZSBoYXZlIGFscmVhZHkgcmVjZWl2ZWQgc29tZSBtZXNzYWdlcy4gSWZcbiAgICAvLyB3ZSBoYXZlIG5vIGxvY2FsbHkgY2FjaGVkIG1lc3NhZ2VzIHRoZW4gd2UgZG9uJ3QgY2FyZSBpZiBhbnkgbWVzc2FnZXMgd2VyZSBkZWxldGVkLlxuICAgIHJldHVybiB0aGlzLndpdGhEZWwodGhpcy50b3BpYy5fbWF4U2VxID4gMCA/IHRoaXMudG9waWMuX21heERlbCArIDEgOiB1bmRlZmluZWQsIGxpbWl0KTtcbiAgfSxcblxuICAvKipcbiAgICogQ29uc3RydWN0IHBhcmFtZXRlcnMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuR2V0UXVlcnl9IEdldCBxdWVyeVxuICAgKi9cbiAgYnVpbGQ6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHdoYXQgPSBbXTtcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXM7XG4gICAgbGV0IHBhcmFtcyA9IHt9O1xuICAgIFsnZGF0YScsICdzdWInLCAnZGVzYycsICd0YWdzJywgJ2NyZWQnLCAnZGVsJ10ubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGluc3RhbmNlLndoYXQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICB3aGF0LnB1c2goa2V5KTtcbiAgICAgICAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGluc3RhbmNlLndoYXRba2V5XSkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHBhcmFtc1trZXldID0gaW5zdGFuY2Uud2hhdFtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHdoYXQubGVuZ3RoID4gMCkge1xuICAgICAgcGFyYW1zLndoYXQgPSB3aGF0LmpvaW4oJyAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyYW1zID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gcGFyYW1zO1xuICB9XG59O1xuXG4vKipcbiAqIEhlbHBlciBjbGFzcyBmb3IgaGFuZGxpbmcgYWNjZXNzIG1vZGUuXG4gKlxuICogQGNsYXNzIEFjY2Vzc01vZGVcbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqXG4gKiBAcGFyYW0ge0FjY2Vzc01vZGV8T2JqZWN0PX0gYWNzIC0gQWNjZXNzTW9kZSB0byBjb3B5IG9yIGFjY2VzcyBtb2RlIG9iamVjdCByZWNlaXZlZCBmcm9tIHRoZSBzZXJ2ZXIuXG4gKi9cbnZhciBBY2Nlc3NNb2RlID0gZnVuY3Rpb24oYWNzKSB7XG4gIGlmIChhY3MpIHtcbiAgICB0aGlzLmdpdmVuID0gdHlwZW9mIGFjcy5naXZlbiA9PSAnbnVtYmVyJyA/IGFjcy5naXZlbiA6IEFjY2Vzc01vZGUuZGVjb2RlKGFjcy5naXZlbik7XG4gICAgdGhpcy53YW50ID0gdHlwZW9mIGFjcy53YW50ID09ICdudW1iZXInID8gYWNzLndhbnQgOiBBY2Nlc3NNb2RlLmRlY29kZShhY3Mud2FudCk7XG4gICAgdGhpcy5tb2RlID0gYWNzLm1vZGUgPyAodHlwZW9mIGFjcy5tb2RlID09ICdudW1iZXInID8gYWNzLm1vZGUgOiBBY2Nlc3NNb2RlLmRlY29kZShhY3MubW9kZSkpIDpcbiAgICAgICh0aGlzLmdpdmVuICYgdGhpcy53YW50KTtcbiAgfVxufTtcblxuQWNjZXNzTW9kZS5fTk9ORSA9IDB4MDA7XG5BY2Nlc3NNb2RlLl9KT0lOID0gMHgwMTtcbkFjY2Vzc01vZGUuX1JFQUQgPSAweDAyO1xuQWNjZXNzTW9kZS5fV1JJVEUgPSAweDA0O1xuQWNjZXNzTW9kZS5fUFJFUyA9IDB4MDg7XG5BY2Nlc3NNb2RlLl9BUFBST1ZFID0gMHgxMDtcbkFjY2Vzc01vZGUuX1NIQVJFID0gMHgyMDtcbkFjY2Vzc01vZGUuX0RFTEVURSA9IDB4NDA7XG5BY2Nlc3NNb2RlLl9PV05FUiA9IDB4ODA7XG5cbkFjY2Vzc01vZGUuX0JJVE1BU0sgPSBBY2Nlc3NNb2RlLl9KT0lOIHwgQWNjZXNzTW9kZS5fUkVBRCB8IEFjY2Vzc01vZGUuX1dSSVRFIHwgQWNjZXNzTW9kZS5fUFJFUyB8XG4gIEFjY2Vzc01vZGUuX0FQUFJPVkUgfCBBY2Nlc3NNb2RlLl9TSEFSRSB8IEFjY2Vzc01vZGUuX0RFTEVURSB8IEFjY2Vzc01vZGUuX09XTkVSO1xuQWNjZXNzTW9kZS5fSU5WQUxJRCA9IDB4MTAwMDAwO1xuXG5BY2Nlc3NNb2RlLl9jaGVja0ZsYWcgPSBmdW5jdGlvbih2YWwsIHNpZGUsIGZsYWcpIHtcbiAgc2lkZSA9IHNpZGUgfHwgJ21vZGUnO1xuICBpZiAoWydnaXZlbicsICd3YW50JywgJ21vZGUnXS5pbmNsdWRlcyhzaWRlKSkge1xuICAgIHJldHVybiAoKHZhbFtzaWRlXSAmIGZsYWcpICE9IDApO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBBY2Nlc3NNb2RlIGNvbXBvbmVudCAnJHtzaWRlfSdgKTtcbn1cblxuLyoqXG4gKiBQYXJzZSBzdHJpbmcgaW50byBhbiBhY2Nlc3MgbW9kZSB2YWx1ZS5cbiAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nIHwgTnVtYmVyfSBtb2RlIC0gZWl0aGVyIGEgU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhY2Nlc3MgbW9kZSB0byBwYXJzZSBvciBhIHNldCBvZiBiaXRzIHRvIGFzc2lnbi5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gQWNjZXNzIG1vZGUgYXMgYSBudW1lcmljIHZhbHVlLlxuICovXG5BY2Nlc3NNb2RlLmRlY29kZSA9IGZ1bmN0aW9uKHN0cikge1xuICBpZiAoIXN0cikge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzdHIgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gc3RyICYgQWNjZXNzTW9kZS5fQklUTUFTSztcbiAgfSBlbHNlIGlmIChzdHIgPT09ICdOJyB8fCBzdHIgPT09ICduJykge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLl9OT05FO1xuICB9XG5cbiAgY29uc3QgYml0bWFzayA9IHtcbiAgICAnSic6IEFjY2Vzc01vZGUuX0pPSU4sXG4gICAgJ1InOiBBY2Nlc3NNb2RlLl9SRUFELFxuICAgICdXJzogQWNjZXNzTW9kZS5fV1JJVEUsXG4gICAgJ1AnOiBBY2Nlc3NNb2RlLl9QUkVTLFxuICAgICdBJzogQWNjZXNzTW9kZS5fQVBQUk9WRSxcbiAgICAnUyc6IEFjY2Vzc01vZGUuX1NIQVJFLFxuICAgICdEJzogQWNjZXNzTW9kZS5fREVMRVRFLFxuICAgICdPJzogQWNjZXNzTW9kZS5fT1dORVJcbiAgfTtcblxuICBsZXQgbTAgPSBBY2Nlc3NNb2RlLl9OT05FO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYml0ID0gYml0bWFza1tzdHIuY2hhckF0KGkpLnRvVXBwZXJDYXNlKCldO1xuICAgIGlmICghYml0KSB7XG4gICAgICAvLyBVbnJlY29nbml6ZWQgYml0LCBza2lwLlxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIG0wIHw9IGJpdDtcbiAgfVxuICByZXR1cm4gbTA7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgbnVtZXJpYyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWNjZXNzIG1vZGUgaW50byBhIHN0cmluZy5cbiAqXG4gKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIC0gYWNjZXNzIG1vZGUgdmFsdWUgdG8gY29udmVydCB0byBhIHN0cmluZy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gQWNjZXNzIG1vZGUgYXMgYSBzdHJpbmcuXG4gKi9cbkFjY2Vzc01vZGUuZW5jb2RlID0gZnVuY3Rpb24odmFsKSB7XG4gIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSBBY2Nlc3NNb2RlLl9JTlZBTElEKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSBpZiAodmFsID09PSBBY2Nlc3NNb2RlLl9OT05FKSB7XG4gICAgcmV0dXJuICdOJztcbiAgfVxuXG4gIGNvbnN0IGJpdG1hc2sgPSBbJ0onLCAnUicsICdXJywgJ1AnLCAnQScsICdTJywgJ0QnLCAnTyddO1xuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYml0bWFzay5sZW5ndGg7IGkrKykge1xuICAgIGlmICgodmFsICYgKDEgPDwgaSkpICE9IDApIHtcbiAgICAgIHJlcyA9IHJlcyArIGJpdG1hc2tbaV07XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59O1xuXG4vKipcbiAqIFVwZGF0ZSBudW1lcmljIHJlcHJlc2VudGF0aW9uIG9mIGFjY2VzcyBtb2RlIHdpdGggdGhlIG5ldyB2YWx1ZS4gVGhlIHZhbHVlXG4gKiBpcyBvbmUgb2YgdGhlIGZvbGxvd2luZzpcbiAqICAtIGEgc3RyaW5nIHN0YXJ0aW5nIHdpdGggPGNvZGU+JysnPC9jb2RlPiBvciA8Y29kZT4nLSc8L2NvZGU+IHRoZW4gdGhlIGJpdHMgdG8gYWRkIG9yIHJlbW92ZSwgZS5nLiA8Y29kZT4nK1ItVyc8L2NvZGU+IG9yIDxjb2RlPictUFMnPC9jb2RlPi5cbiAqICAtIGEgbmV3IHZhbHVlIG9mIGFjY2VzcyBtb2RlXG4gKlxuICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCAtIGFjY2VzcyBtb2RlIHZhbHVlIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB1cGQgLSB1cGRhdGUgdG8gYXBwbHkgdG8gdmFsLlxuICogQHJldHVybnMge251bWJlcn0gLSB1cGRhdGVkIGFjY2VzcyBtb2RlLlxuICovXG5BY2Nlc3NNb2RlLnVwZGF0ZSA9IGZ1bmN0aW9uKHZhbCwgdXBkKSB7XG4gIGlmICghdXBkIHx8IHR5cGVvZiB1cGQgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgbGV0IGFjdGlvbiA9IHVwZC5jaGFyQXQoMCk7XG4gIGlmIChhY3Rpb24gPT0gJysnIHx8IGFjdGlvbiA9PSAnLScpIHtcbiAgICBsZXQgdmFsMCA9IHZhbDtcbiAgICAvLyBTcGxpdCBkZWx0YS1zdHJpbmcgbGlrZSAnK0FCQy1ERUYrWicgaW50byBhbiBhcnJheSBvZiBwYXJ0cyBpbmNsdWRpbmcgKyBhbmQgLS5cbiAgICBjb25zdCBwYXJ0cyA9IHVwZC5zcGxpdCgvKFstK10pLyk7XG4gICAgLy8gU3RhcnRpbmcgaXRlcmF0aW9uIGZyb20gMSBiZWNhdXNlIFN0cmluZy5zcGxpdCgpIGNyZWF0ZXMgYW4gYXJyYXkgd2l0aCB0aGUgZmlyc3QgZW1wdHkgZWxlbWVudC5cbiAgICAvLyBJdGVyYXRpbmcgYnkgMiBiZWNhdXNlIHdlIHBhcnNlIHBhaXJzICsvLSB0aGVuIGRhdGEuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwYXJ0cy5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGFjdGlvbiA9IHBhcnRzW2ldO1xuICAgICAgY29uc3QgbTAgPSBBY2Nlc3NNb2RlLmRlY29kZShwYXJ0c1tpICsgMV0pO1xuICAgICAgaWYgKG0wID09IEFjY2Vzc01vZGUuX0lOVkFMSUQpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgIH1cbiAgICAgIGlmIChtMCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGFjdGlvbiA9PT0gJysnKSB7XG4gICAgICAgIHZhbDAgfD0gbTA7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJy0nKSB7XG4gICAgICAgIHZhbDAgJj0gfm0wO1xuICAgICAgfVxuICAgIH1cbiAgICB2YWwgPSB2YWwwO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBzdHJpbmcgaXMgYW4gZXhwbGljaXQgbmV3IHZhbHVlICdBQkMnIHJhdGhlciB0aGFuIGRlbHRhLlxuICAgIGNvbnN0IHZhbDAgPSBBY2Nlc3NNb2RlLmRlY29kZSh1cGQpO1xuICAgIGlmICh2YWwwICE9IEFjY2Vzc01vZGUuX0lOVkFMSUQpIHtcbiAgICAgIHZhbCA9IHZhbDA7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZhbDtcbn07XG5cbi8qKlxuICogQml0cyBwcmVzZW50IGluIGExIGJ1dCBtaXNzaW5nIGluIGEyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqXG4gKiBAcGFyYW0ge251bWJlciB8IHN0cmluZ30gYTEgLSBhY2Nlc3MgbW9kZSB0byBzdWJ0cmFjdCBmcm9tLlxuICogQHBhcmFtIHtudW1iZXIgfCBzdHJpbmd9IGEyIC0gYWNjZXNzIG1vZGUgdG8gc3VidHJhY3QuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBhY2Nlc3MgbW9kZSB3aXRoIGJpdHMgcHJlc2VudCBpbiA8Y29kZT5hMTwvY29kZT4gYnV0IG1pc3NpbmcgaW4gPGNvZGU+YTI8L2NvZGU+LlxuICovXG5BY2Nlc3NNb2RlLmRpZmYgPSBmdW5jdGlvbihhMSwgYTIpIHtcbiAgYTEgPSBBY2Nlc3NNb2RlLmRlY29kZShhMSk7XG4gIGEyID0gQWNjZXNzTW9kZS5kZWNvZGUoYTIpO1xuXG4gIGlmIChhMSA9PSBBY2Nlc3NNb2RlLl9JTlZBTElEIHx8IGEyID09IEFjY2Vzc01vZGUuX0lOVkFMSUQpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5fSU5WQUxJRDtcbiAgfVxuICByZXR1cm4gYTEgJiB+YTI7XG59O1xuXG4vKipcbiAqIEFjY2Vzc01vZGUgaXMgYSBjbGFzcyByZXByZXNlbnRpbmcgdG9waWMgYWNjZXNzIG1vZGUuXG4gKlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQGNsYXNzIEFjY2Vzc01vZGVcbiAqL1xuQWNjZXNzTW9kZS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBDdXN0b20gZm9ybWF0dGVyXG4gICAqL1xuICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICd7XCJtb2RlXCI6IFwiJyArIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMubW9kZSkgK1xuICAgICAgJ1wiLCBcImdpdmVuXCI6IFwiJyArIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMuZ2l2ZW4pICtcbiAgICAgICdcIiwgXCJ3YW50XCI6IFwiJyArIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMud2FudCkgKyAnXCJ9JztcbiAgfSxcbiAgLyoqXG4gICAqIENvbnZlcnRzIG51bWVyaWMgdmFsdWVzIHRvIHN0cmluZ3MuXG4gICAqL1xuICBqc29uSGVscGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbW9kZTogQWNjZXNzTW9kZS5lbmNvZGUodGhpcy5tb2RlKSxcbiAgICAgIGdpdmVuOiBBY2Nlc3NNb2RlLmVuY29kZSh0aGlzLmdpdmVuKSxcbiAgICAgIHdhbnQ6IEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMud2FudClcbiAgICB9O1xuICB9LFxuICAvKipcbiAgICogQXNzaWduIHZhbHVlIHRvICdtb2RlJy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgTnVtYmVyfSBtIC0gZWl0aGVyIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhY2Nlc3MgbW9kZSBvciBhIHNldCBvZiBiaXRzLlxuICAgKiBAcmV0dXJucyB7QWNjZXNzTW9kZX0gLSA8Y29kZT50aGlzPC9jb2RlPiBBY2Nlc3NNb2RlLlxuICAgKi9cbiAgc2V0TW9kZTogZnVuY3Rpb24obSkge1xuICAgIHRoaXMubW9kZSA9IEFjY2Vzc01vZGUuZGVjb2RlKG0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogVXBkYXRlIDxjb2RlPm1vZGU8L2NvZGU+IHZhbHVlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHUgLSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGNoYW5nZXMgdG8gYXBwbHkgdG8gYWNjZXNzIG1vZGUuXG4gICAqIEByZXR1cm5zIHtBY2Nlc3NNb2RlfSAtIDxjb2RlPnRoaXM8L2NvZGU+IEFjY2Vzc01vZGUuXG4gICAqL1xuICB1cGRhdGVNb2RlOiBmdW5jdGlvbih1KSB7XG4gICAgdGhpcy5tb2RlID0gQWNjZXNzTW9kZS51cGRhdGUodGhpcy5tb2RlLCB1KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEdldCA8Y29kZT5tb2RlPC9jb2RlPiB2YWx1ZSBhcyBhIHN0cmluZy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gPGNvZGU+bW9kZTwvY29kZT4gdmFsdWUuXG4gICAqL1xuICBnZXRNb2RlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5lbmNvZGUodGhpcy5tb2RlKTtcbiAgfSxcblxuICAvKipcbiAgICogQXNzaWduIDxjb2RlPmdpdmVuPC9jb2RlPiAgdmFsdWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IE51bWJlcn0gZyAtIGVpdGhlciBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWNjZXNzIG1vZGUgb3IgYSBzZXQgb2YgYml0cy5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IC0gPGNvZGU+dGhpczwvY29kZT4gQWNjZXNzTW9kZS5cbiAgICovXG4gIHNldEdpdmVuOiBmdW5jdGlvbihnKSB7XG4gICAgdGhpcy5naXZlbiA9IEFjY2Vzc01vZGUuZGVjb2RlKGcpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogVXBkYXRlICdnaXZlbicgdmFsdWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdSAtIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgY2hhbmdlcyB0byBhcHBseSB0byBhY2Nlc3MgbW9kZS5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IC0gPGNvZGU+dGhpczwvY29kZT4gQWNjZXNzTW9kZS5cbiAgICovXG4gIHVwZGF0ZUdpdmVuOiBmdW5jdGlvbih1KSB7XG4gICAgdGhpcy5naXZlbiA9IEFjY2Vzc01vZGUudXBkYXRlKHRoaXMuZ2l2ZW4sIHUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogR2V0ICdnaXZlbicgdmFsdWUgYXMgYSBzdHJpbmcuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIDxiPmdpdmVuPC9iPiB2YWx1ZS5cbiAgICovXG4gIGdldEdpdmVuOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5lbmNvZGUodGhpcy5naXZlbik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFzc2lnbiAnd2FudCcgdmFsdWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IE51bWJlcn0gdyAtIGVpdGhlciBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWNjZXNzIG1vZGUgb3IgYSBzZXQgb2YgYml0cy5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IC0gPGNvZGU+dGhpczwvY29kZT4gQWNjZXNzTW9kZS5cbiAgICovXG4gIHNldFdhbnQ6IGZ1bmN0aW9uKHcpIHtcbiAgICB0aGlzLndhbnQgPSBBY2Nlc3NNb2RlLmRlY29kZSh3KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIFVwZGF0ZSAnd2FudCcgdmFsdWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdSAtIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgY2hhbmdlcyB0byBhcHBseSB0byBhY2Nlc3MgbW9kZS5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IC0gPGNvZGU+dGhpczwvY29kZT4gQWNjZXNzTW9kZS5cbiAgICovXG4gIHVwZGF0ZVdhbnQ6IGZ1bmN0aW9uKHUpIHtcbiAgICB0aGlzLndhbnQgPSBBY2Nlc3NNb2RlLnVwZGF0ZSh0aGlzLndhbnQsIHUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogR2V0ICd3YW50JyB2YWx1ZSBhcyBhIHN0cmluZy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gPGI+d2FudDwvYj4gdmFsdWUuXG4gICAqL1xuICBnZXRXYW50OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5lbmNvZGUodGhpcy53YW50KTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHBlcm1pc3Npb25zIHByZXNlbnQgaW4gJ3dhbnQnIGJ1dCBtaXNzaW5nIGluICdnaXZlbicuXG4gICAqIEludmVyc2Ugb2Yge0BsaW5rIFRpbm9kZS5BY2Nlc3NNb2RlI2dldEV4Y2Vzc2l2ZX1cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IHBlcm1pc3Npb25zIHByZXNlbnQgaW4gPGI+d2FudDwvYj4gYnV0IG1pc3NpbmcgaW4gPGI+Z2l2ZW48L2I+LlxuICAgKi9cbiAgZ2V0TWlzc2luZzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMud2FudCAmIH50aGlzLmdpdmVuKTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHBlcm1pc3Npb25zIHByZXNlbnQgaW4gJ2dpdmVuJyBidXQgbWlzc2luZyBpbiAnd2FudCcuXG4gICAqIEludmVyc2Ugb2Yge0BsaW5rIFRpbm9kZS5BY2Nlc3NNb2RlI2dldE1pc3Npbmd9XG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBwZXJtaXNzaW9ucyBwcmVzZW50IGluIDxiPmdpdmVuPC9iPiBidXQgbWlzc2luZyBpbiA8Yj53YW50PC9iPi5cbiAgICovXG4gIGdldEV4Y2Vzc2l2ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMuZ2l2ZW4gJiB+dGhpcy53YW50KTtcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlICd3YW50JywgJ2dpdmUnLCBhbmQgJ21vZGUnIHZhbHVlcy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqXG4gICAqIEBwYXJhbSB7QWNjZXNzTW9kZX0gdmFsIC0gbmV3IGFjY2VzcyBtb2RlIHZhbHVlLlxuICAgKiBAcmV0dXJucyB7QWNjZXNzTW9kZX0gLSA8Y29kZT50aGlzPC9jb2RlPiBBY2Nlc3NNb2RlLlxuICAgKi9cbiAgdXBkYXRlQWxsOiBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAodmFsKSB7XG4gICAgICB0aGlzLnVwZGF0ZUdpdmVuKHZhbC5naXZlbik7XG4gICAgICB0aGlzLnVwZGF0ZVdhbnQodmFsLndhbnQpO1xuICAgICAgdGhpcy5tb2RlID0gdGhpcy5naXZlbiAmIHRoaXMud2FudDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIE93bmVyIChPKSBmbGFnIGlzIHNldC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gc2lkZSAtIHdoaWNoIHBlcm1pc3Npb24gdG8gY2hlY2s6IGdpdmVuLCB3YW50LCBtb2RlOyBkZWZhdWx0OiBtb2RlLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiBmbGFnIGlzIHNldC5cbiAgICovXG4gIGlzT3duZXI6IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5fY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX09XTkVSKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgUHJlc2VuY2UgKFApIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNQcmVzZW5jZXI6IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5fY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX1BSRVMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBQcmVzZW5jZSAoUCkgZmxhZyBpcyBOT1Qgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNNdXRlZDogZnVuY3Rpb24oc2lkZSkge1xuICAgIHJldHVybiAhdGhpcy5pc1ByZXNlbmNlcihzaWRlKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgSm9pbiAoSikgZmxhZyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc0pvaW5lcjogZnVuY3Rpb24oc2lkZSkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLl9jaGVja0ZsYWcodGhpcywgc2lkZSwgQWNjZXNzTW9kZS5fSk9JTik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIFJlYWRlciAoUikgZmxhZyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc1JlYWRlcjogZnVuY3Rpb24oc2lkZSkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLl9jaGVja0ZsYWcodGhpcywgc2lkZSwgQWNjZXNzTW9kZS5fUkVBRCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIFdyaXRlciAoVykgZmxhZyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc1dyaXRlcjogZnVuY3Rpb24oc2lkZSkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLl9jaGVja0ZsYWcodGhpcywgc2lkZSwgQWNjZXNzTW9kZS5fV1JJVEUpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBBcHByb3ZlciAoQSkgZmxhZyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc0FwcHJvdmVyOiBmdW5jdGlvbihzaWRlKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuX2NoZWNrRmxhZyh0aGlzLCBzaWRlLCBBY2Nlc3NNb2RlLl9BUFBST1ZFKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgZWl0aGVyIG9uZSBvZiBPd25lciAoTykgb3IgQXBwcm92ZXIgKEEpIGZsYWdzIGlzIHNldC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gc2lkZSAtIHdoaWNoIHBlcm1pc3Npb24gdG8gY2hlY2s6IGdpdmVuLCB3YW50LCBtb2RlOyBkZWZhdWx0OiBtb2RlLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiBmbGFnIGlzIHNldC5cbiAgICovXG4gIGlzQWRtaW46IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICByZXR1cm4gdGhpcy5pc093bmVyKHNpZGUpIHx8IHRoaXMuaXNBcHByb3ZlcihzaWRlKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgZWl0aGVyIG9uZSBvZiBPd25lciAoTyksIEFwcHJvdmVyIChBKSwgb3IgU2hhcmVyIChTKSBmbGFncyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc1NoYXJlcjogZnVuY3Rpb24oc2lkZSkge1xuICAgIHJldHVybiB0aGlzLmlzQWRtaW4oc2lkZSkgfHwgQWNjZXNzTW9kZS5fY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX1NIQVJFKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgRGVsZXRlciAoRCkgZmxhZyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc0RlbGV0ZXI6IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5fY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX0RFTEVURSk7XG4gIH1cbn07XG5cbi8qKlxuICogQGNhbGxiYWNrIFRpbm9kZS5Ub3BpYy5vbkRhdGFcbiAqIEBwYXJhbSB7RGF0YX0gZGF0YSAtIERhdGEgcGFja2V0XG4gKi9cbi8qKlxuICogVG9waWMgaXMgYSBjbGFzcyByZXByZXNlbnRpbmcgYSBsb2dpY2FsIGNvbW11bmljYXRpb24gY2hhbm5lbC5cbiAqIEBjbGFzcyBUb3BpY1xuICogQG1lbWJlcm9mIFRpbm9kZVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gY3JlYXRlLlxuICogQHBhcmFtIHtPYmplY3Q9fSBjYWxsYmFja3MgLSBPYmplY3Qgd2l0aCB2YXJpb3VzIGV2ZW50IGNhbGxiYWNrcy5cbiAqIEBwYXJhbSB7VGlub2RlLlRvcGljLm9uRGF0YX0gY2FsbGJhY2tzLm9uRGF0YSAtIENhbGxiYWNrIHdoaWNoIHJlY2VpdmVzIGEgPGNvZGU+e2RhdGF9PC9jb2RlPiBtZXNzYWdlLlxuICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2tzLm9uTWV0YSAtIENhbGxiYWNrIHdoaWNoIHJlY2VpdmVzIGEgPGNvZGU+e21ldGF9PC9jb2RlPiBtZXNzYWdlLlxuICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2tzLm9uUHJlcyAtIENhbGxiYWNrIHdoaWNoIHJlY2VpdmVzIGEgPGNvZGU+e3ByZXN9PC9jb2RlPiBtZXNzYWdlLlxuICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2tzLm9uSW5mbyAtIENhbGxiYWNrIHdoaWNoIHJlY2VpdmVzIGFuIDxjb2RlPntpbmZvfTwvY29kZT4gbWVzc2FnZS5cbiAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNhbGxiYWNrcy5vbk1ldGFEZXNjIC0gQ2FsbGJhY2sgd2hpY2ggcmVjZWl2ZXMgY2hhbmdlcyB0byB0b3BpYyBkZXNjdGlvcHRpb24ge0BsaW5rIGRlc2N9LlxuICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2tzLm9uTWV0YVN1YiAtIENhbGxlZCBmb3IgYSBzaW5nbGUgc3Vic2NyaXB0aW9uIHJlY29yZCBjaGFuZ2UuXG4gKiBAcGFyYW0ge2NhbGxiYWNrfSBjYWxsYmFja3Mub25TdWJzVXBkYXRlZCAtIENhbGxlZCBhZnRlciBhIGJhdGNoIG9mIHN1YnNjcmlwdGlvbiBjaGFuZ2VzIGhhdmUgYmVlbiByZWNpZXZlZCBhbmQgY2FjaGVkLlxuICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2tzLm9uRGVsZXRlVG9waWMgLSBDYWxsZWQgYWZ0ZXIgdGhlIHRvcGljIGlzIGRlbGV0ZWQuXG4gKiBAcGFyYW0ge2NhbGxiYWNrfSBjYWxsYmFjbHMub25BbGxNZXNzYWdlc1JlY2VpdmVkIC0gQ2FsbGVkIHdoZW4gYWxsIHJlcXVlc3RlZCA8Y29kZT57ZGF0YX08L2NvZGU+IG1lc3NhZ2VzIGhhdmUgYmVlbiByZWNpdmVkLlxuICovXG52YXIgVG9waWMgPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFja3MpIHtcbiAgLy8gUGFyZW50IFRpbm9kZSBvYmplY3QuXG4gIHRoaXMuX3Rpbm9kZSA9IG51bGw7XG5cbiAgLy8gU2VydmVyLXByb3ZpZGVkIGRhdGEsIGxvY2FsbHkgaW1tdXRhYmxlLlxuICAvLyB0b3BpYyBuYW1lXG4gIHRoaXMubmFtZSA9IG5hbWU7XG4gIC8vIHRpbWVzdGFtcCB3aGVuIHRoZSB0b3BpYyB3YXMgY3JlYXRlZFxuICB0aGlzLmNyZWF0ZWQgPSBudWxsO1xuICAvLyB0aW1lc3RhbXAgd2hlbiB0aGUgdG9waWMgd2FzIGxhc3QgdXBkYXRlZFxuICB0aGlzLnVwZGF0ZWQgPSBudWxsO1xuICAvLyB0aW1lc3RhbXAgb2YgdGhlIGxhc3QgbWVzc2FnZXNcbiAgdGhpcy50b3VjaGVkID0gbnVsbDtcbiAgLy8gYWNjZXNzIG1vZGUsIHNlZSBBY2Nlc3NNb2RlXG4gIHRoaXMuYWNzID0gbmV3IEFjY2Vzc01vZGUobnVsbCk7XG4gIC8vIHBlci10b3BpYyBwcml2YXRlIGRhdGFcbiAgdGhpcy5wcml2YXRlID0gbnVsbDtcbiAgLy8gcGVyLXRvcGljIHB1YmxpYyBkYXRhXG4gIHRoaXMucHVibGljID0gbnVsbDtcblxuICAvLyBMb2NhbGx5IGNhY2hlZCBkYXRhXG4gIC8vIFN1YnNjcmliZWQgdXNlcnMsIGZvciB0cmFja2luZyByZWFkL3JlY3YvbXNnIG5vdGlmaWNhdGlvbnMuXG4gIHRoaXMuX3VzZXJzID0ge307XG5cbiAgLy8gQ3VycmVudCB2YWx1ZSBvZiBsb2NhbGx5IGlzc3VlZCBzZXFJZCwgdXNlZCBmb3IgcGVuZGluZyBtZXNzYWdlcy5cbiAgdGhpcy5fcXVldWVkU2VxSWQgPSBMT0NBTF9TRVFJRDtcblxuICAvLyBUaGUgbWF4aW11bSBrbm93biB7ZGF0YS5zZXF9IHZhbHVlLlxuICB0aGlzLl9tYXhTZXEgPSAwO1xuICAvLyBUaGUgbWluaW11bSBrbm93biB7ZGF0YS5zZXF9IHZhbHVlLlxuICB0aGlzLl9taW5TZXEgPSAwO1xuICAvLyBJbmRpY2F0b3IgdGhhdCB0aGUgbGFzdCByZXF1ZXN0IGZvciBlYXJsaWVyIG1lc3NhZ2VzIHJldHVybmVkIDAuXG4gIHRoaXMuX25vRWFybGllck1zZ3MgPSBmYWxzZTtcbiAgLy8gVGhlIG1heGltdW0ga25vd24gZGVsZXRpb24gSUQuXG4gIHRoaXMuX21heERlbCA9IDA7XG4gIC8vIFVzZXIgZGlzY292ZXJ5IHRhZ3NcbiAgdGhpcy5fdGFncyA9IFtdO1xuICAvLyBDcmVkZW50aWFscyBzdWNoIGFzIGVtYWlsIG9yIHBob25lIG51bWJlci5cbiAgdGhpcy5fY3JlZGVudGlhbHMgPSBbXTtcbiAgLy8gTWVzc2FnZSBjYWNoZSwgc29ydGVkIGJ5IG1lc3NhZ2Ugc2VxIHZhbHVlcywgZnJvbSBvbGQgdG8gbmV3LlxuICB0aGlzLl9tZXNzYWdlcyA9IENCdWZmZXIoZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhLnNlcSAtIGIuc2VxO1xuICB9LCB0cnVlKTtcbiAgLy8gQm9vbGVhbiwgdHJ1ZSBpZiB0aGUgdG9waWMgaXMgY3VycmVudGx5IGxpdmVcbiAgdGhpcy5fc3Vic2NyaWJlZCA9IGZhbHNlO1xuICAvLyBUaW1lc3RhcCB3aGVuIHRvcGljIG1ldGEtZGVzYyB1cGRhdGUgd2FzIHJlY2l2ZWQuXG4gIHRoaXMuX2xhc3REZXNjVXBkYXRlID0gbnVsbDtcbiAgLy8gVGltZXN0YXAgd2hlbiB0b3BpYyBtZXRhLXN1YnMgdXBkYXRlIHdhcyByZWNpdmVkLlxuICB0aGlzLl9sYXN0U3Vic1VwZGF0ZSA9IG51bGw7XG4gIC8vIFRvcGljIGNyZWF0ZWQgYnV0IG5vdCB5ZXQgc3luY2VkIHdpdGggdGhlIHNlcnZlci4gVXNlZCBvbmx5IGR1cmluZyBpbml0aWFsaXphdGlvbi5cbiAgdGhpcy5fbmV3ID0gdHJ1ZTtcblxuICAvLyBDYWxsYmFja3NcbiAgaWYgKGNhbGxiYWNrcykge1xuICAgIHRoaXMub25EYXRhID0gY2FsbGJhY2tzLm9uRGF0YTtcbiAgICB0aGlzLm9uTWV0YSA9IGNhbGxiYWNrcy5vbk1ldGE7XG4gICAgdGhpcy5vblByZXMgPSBjYWxsYmFja3Mub25QcmVzO1xuICAgIHRoaXMub25JbmZvID0gY2FsbGJhY2tzLm9uSW5mbztcbiAgICAvLyBBIHNpbmdsZSBkZXNjIHVwZGF0ZTtcbiAgICB0aGlzLm9uTWV0YURlc2MgPSBjYWxsYmFja3Mub25NZXRhRGVzYztcbiAgICAvLyBBIHNpbmdsZSBzdWJzY3JpcHRpb24gcmVjb3JkO1xuICAgIHRoaXMub25NZXRhU3ViID0gY2FsbGJhY2tzLm9uTWV0YVN1YjtcbiAgICAvLyBBbGwgc3Vic2NyaXB0aW9uIHJlY29yZHMgcmVjZWl2ZWQ7XG4gICAgdGhpcy5vblN1YnNVcGRhdGVkID0gY2FsbGJhY2tzLm9uU3Vic1VwZGF0ZWQ7XG4gICAgdGhpcy5vblRhZ3NVcGRhdGVkID0gY2FsbGJhY2tzLm9uVGFnc1VwZGF0ZWQ7XG4gICAgdGhpcy5vbkNyZWRzVXBkYXRlZCA9IGNhbGxiYWNrcy5vbkNyZWRzVXBkYXRlZDtcbiAgICB0aGlzLm9uRGVsZXRlVG9waWMgPSBjYWxsYmFja3Mub25EZWxldGVUb3BpYztcbiAgICB0aGlzLm9uQWxsTWVzc2FnZXNSZWNlaXZlZCA9IGNhbGxiYWNrcy5vbkFsbE1lc3NhZ2VzUmVjZWl2ZWQ7XG4gIH1cbn07XG5cblRvcGljLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSB0b3BpYyBpcyBzdWJzY3JpYmVkLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpcyB0b3BpYyBpcyBhdHRhY2hlZC9zdWJzY3JpYmVkLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBpc1N1YnNjcmliZWQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9zdWJzY3JpYmVkO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRvcGljIHRvIHN1YnNjcmliZS4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNzdWJzY3JpYmV9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5HZXRRdWVyeT19IGdldFBhcmFtcyAtIGdldCBxdWVyeSBwYXJhbWV0ZXJzLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXRQYXJhbXM9fSBzZXRQYXJhbXMgLSBzZXQgcGFyYW1ldGVycy5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgc3Vic2NyaWJlOiBmdW5jdGlvbihnZXRQYXJhbXMsIHNldFBhcmFtcykge1xuICAgIC8vIElmIHRoZSB0b3BpYyBpcyBhbHJlYWR5IHN1YnNjcmliZWQsIHJldHVybiByZXNvbHZlZCBwcm9taXNlXG4gICAgaWYgKHRoaXMuX3N1YnNjcmliZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gU2VuZCBzdWJzY3JpYmUgbWVzc2FnZSwgaGFuZGxlIGFzeW5jIHJlc3BvbnNlLlxuICAgIC8vIElmIHRvcGljIG5hbWUgaXMgZXhwbGljaXRseSBwcm92aWRlZCwgdXNlIGl0LiBJZiBubyBuYW1lLCB0aGVuIGl0J3MgYSBuZXcgZ3JvdXAgdG9waWMsXG4gICAgLy8gdXNlIFwibmV3XCIuXG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5zdWJzY3JpYmUodGhpcy5uYW1lIHx8IFRPUElDX05FVywgZ2V0UGFyYW1zLCBzZXRQYXJhbXMpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIGlmIChjdHJsLmNvZGUgPj0gMzAwKSB7XG4gICAgICAgIC8vIERvIG5vdGhpbmcgaWYgc3Vic2NyaXB0aW9uIHN0YXR1cyBoYXMgbm90IGNoYW5nZWQuXG4gICAgICAgIHJldHVybiBjdHJsO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9zdWJzY3JpYmVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuYWNzID0gKGN0cmwucGFyYW1zICYmIGN0cmwucGFyYW1zLmFjcykgPyBjdHJsLnBhcmFtcy5hY3MgOiB0aGlzLmFjcztcblxuICAgICAgLy8gU2V0IHRvcGljIG5hbWUgZm9yIG5ldyB0b3BpY3MgYW5kIGFkZCBpdCB0byBjYWNoZS5cbiAgICAgIGlmICh0aGlzLl9uZXcpIHtcbiAgICAgICAgdGhpcy5fbmV3ID0gZmFsc2U7XG5cbiAgICAgICAgLy8gTmFtZSBtYXkgY2hhbmdlIG5ldzEyMzQ1NiAtPiBncnBBYkNkRWZcbiAgICAgICAgdGhpcy5uYW1lID0gY3RybC50b3BpYztcblxuICAgICAgICB0aGlzLmNyZWF0ZWQgPSBjdHJsLnRzO1xuICAgICAgICB0aGlzLnVwZGF0ZWQgPSBjdHJsLnRzO1xuICAgICAgICAvLyBEb24ndCBhc3NpZ24gdG91Y2hlZCwgb3RoZXJ3aXNlIHRvcGljIHdpbGwgYmUgcHV0IG9uIHRvcCBvZiB0aGUgbGlzdCBvbiBzdWJzY3JpYmUuXG5cbiAgICAgICAgdGhpcy5fY2FjaGVQdXRTZWxmKCk7XG5cbiAgICAgICAgaWYgKHRoaXMubmFtZSAhPSBUT1BJQ19NRSAmJiB0aGlzLm5hbWUgIT0gVE9QSUNfRk5EKSB7XG4gICAgICAgICAgLy8gQWRkIHRoZSBuZXcgdG9waWMgdG8gdGhlIGxpc3Qgb2YgY29udGFjdHMgbWFpbnRhaW5lZCBieSB0aGUgJ21lJyB0b3BpYy5cbiAgICAgICAgICBjb25zdCBtZSA9IHRoaXMuX3Rpbm9kZS5nZXRNZVRvcGljKCk7XG4gICAgICAgICAgaWYgKG1lLm9uTWV0YVN1Yikge1xuICAgICAgICAgICAgbWUub25NZXRhU3ViKHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWUub25TdWJzVXBkYXRlZCkge1xuICAgICAgICAgICAgbWUub25TdWJzVXBkYXRlZChbdGhpcy5uYW1lXSwgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNldFBhcmFtcyAmJiBzZXRQYXJhbXMuZGVzYykge1xuICAgICAgICAgIHNldFBhcmFtcy5kZXNjLl9ub0ZvcndhcmRpbmcgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhRGVzYyhzZXRQYXJhbXMuZGVzYyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGN0cmw7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIGRyYWZ0IG9mIGEgbWVzc2FnZSB3aXRob3V0IHNlbmRpbmcgaXQgdG8gdGhlIHNlcnZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBPYmplY3R9IGRhdGEgLSBDb250ZW50IHRvIHdyYXAgaW4gYSBkcmFmdC5cbiAgICogQHBhcmFtIHtib29sZWFuPX0gbm9FY2hvIC0gSWYgPGNvZGU+dHJ1ZTwvY29kZT4gc2VydmVyIHdpbGwgbm90IGVjaG8gbWVzc2FnZSBiYWNrIHRvIG9yaWdpbmF0aW5nXG4gICAqIHNlc3Npb24uIE90aGVyd2lzZSB0aGUgc2VydmVyIHdpbGwgc2VuZCBhIGNvcHkgb2YgdGhlIG1lc3NhZ2UgdG8gc2VuZGVyLlxuICAgKlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBtZXNzYWdlIGRyYWZ0LlxuICAgKi9cbiAgY3JlYXRlTWVzc2FnZTogZnVuY3Rpb24oZGF0YSwgbm9FY2hvKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5jcmVhdGVNZXNzYWdlKHRoaXMubmFtZSwgZGF0YSwgbm9FY2hvKTtcbiAgfSxcblxuICAvKipcbiAgICogSW1tZWRpYXRlbHkgcHVibGlzaCBkYXRhIHRvIHRvcGljLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI3B1Ymxpc2h9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IE9iamVjdH0gZGF0YSAtIERhdGEgdG8gcHVibGlzaCwgZWl0aGVyIHBsYWluIHN0cmluZyBvciBhIERyYWZ0eSBvYmplY3QuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IG5vRWNobyAtIElmIDxjb2RlPnRydWU8L2NvZGU+IHNlcnZlciB3aWxsIG5vdCBlY2hvIG1lc3NhZ2UgYmFjayB0byBvcmlnaW5hdGluZ1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gdGhlIHJlcXVlc3QuXG4gICAqL1xuICBwdWJsaXNoOiBmdW5jdGlvbihkYXRhLCBub0VjaG8pIHtcbiAgICByZXR1cm4gdGhpcy5wdWJsaXNoTWVzc2FnZSh0aGlzLmNyZWF0ZU1lc3NhZ2UoZGF0YSwgbm9FY2hvKSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFB1Ymxpc2ggbWVzc2FnZSBjcmVhdGVkIGJ5IHtAbGluayBUaW5vZGUuVG9waWMjY3JlYXRlTWVzc2FnZX0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwdWIgLSB7ZGF0YX0gb2JqZWN0IHRvIHB1Ymxpc2guIE11c3QgYmUgY3JlYXRlZCBieSB7QGxpbmsgVGlub2RlLlRvcGljI2NyZWF0ZU1lc3NhZ2V9XG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byB0aGUgcmVxdWVzdC5cbiAgICovXG4gIHB1Ymxpc2hNZXNzYWdlOiBmdW5jdGlvbihwdWIpIHtcbiAgICBpZiAoIXRoaXMuX3N1YnNjcmliZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJDYW5ub3QgcHVibGlzaCBvbiBpbmFjdGl2ZSB0b3BpY1wiKSk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIGhlYWRlciB3aXRoIGF0dGFjaG1lbnQgcmVjb3Jkcy5cbiAgICBpZiAoRHJhZnR5Lmhhc0F0dGFjaG1lbnRzKHB1Yi5jb250ZW50KSAmJiAhcHViLmhlYWQuYXR0YWNobWVudHMpIHtcbiAgICAgIGxldCBhdHRhY2htZW50cyA9IFtdO1xuICAgICAgRHJhZnR5LmF0dGFjaG1lbnRzKHB1Yi5jb250ZW50LCAoZGF0YSkgPT4ge1xuICAgICAgICBhdHRhY2htZW50cy5wdXNoKGRhdGEucmVmKTtcbiAgICAgIH0pO1xuICAgICAgcHViLmhlYWQuYXR0YWNobWVudHMgPSBhdHRhY2htZW50cztcbiAgICB9XG5cbiAgICAvLyBTZW5kIGRhdGEuXG4gICAgcHViLl9zZW5kaW5nID0gdHJ1ZTtcbiAgICBwdWIuX2ZhaWxlZCA9IGZhbHNlO1xuICAgIHJldHVybiB0aGlzLl90aW5vZGUucHVibGlzaE1lc3NhZ2UocHViKS50aGVuKChjdHJsKSA9PiB7XG4gICAgICBwdWIuX3NlbmRpbmcgPSBmYWxzZTtcbiAgICAgIHB1Yi50cyA9IGN0cmwudHM7XG4gICAgICB0aGlzLnN3YXBNZXNzYWdlSWQocHViLCBjdHJsLnBhcmFtcy5zZXEpO1xuICAgICAgdGhpcy5fcm91dGVEYXRhKHB1Yik7XG4gICAgICByZXR1cm4gY3RybDtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICB0aGlzLl90aW5vZGUubG9nZ2VyKFwiV0FSTklORzogTWVzc2FnZSByZWplY3RlZCBieSB0aGUgc2VydmVyXCIsIGVycik7XG4gICAgICBwdWIuX3NlbmRpbmcgPSBmYWxzZTtcbiAgICAgIHB1Yi5fZmFpbGVkID0gdHJ1ZTtcbiAgICAgIGlmICh0aGlzLm9uRGF0YSkge1xuICAgICAgICB0aGlzLm9uRGF0YSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgbWVzc2FnZSB0byBsb2NhbCBtZXNzYWdlIGNhY2hlLCBzZW5kIHRvIHRoZSBzZXJ2ZXIgd2hlbiB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZC5cbiAgICogSWYgcHJvbWlzZSBpcyBudWxsIG9yIHVuZGVmaW5lZCwgdGhlIG1lc3NhZ2Ugd2lsbCBiZSBzZW50IGltbWVkaWF0ZWx5LlxuICAgKiBUaGUgbWVzc2FnZSBpcyBzZW50IHdoZW4gdGhlXG4gICAqIFRoZSBtZXNzYWdlIHNob3VsZCBiZSBjcmVhdGVkIGJ5IHtAbGluayBUaW5vZGUuVG9waWMjY3JlYXRlTWVzc2FnZX0uXG4gICAqIFRoaXMgaXMgcHJvYmFibHkgbm90IHRoZSBmaW5hbCBBUEkuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwdWIgLSBNZXNzYWdlIHRvIHVzZSBhcyBhIGRyYWZ0LlxuICAgKiBAcGFyYW0ge1Byb21pc2V9IHByb20gLSBNZXNzYWdlIHdpbGwgYmUgc2VudCB3aGVuIHRoaXMgcHJvbWlzZSBpcyByZXNvbHZlZCwgZGlzY2FyZGVkIGlmIHJlamVjdGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gZGVyaXZlZCBwcm9taXNlLlxuICAgKi9cbiAgcHVibGlzaERyYWZ0OiBmdW5jdGlvbihwdWIsIHByb20pIHtcbiAgICBpZiAoIXByb20gJiYgIXRoaXMuX3N1YnNjcmliZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJDYW5ub3QgcHVibGlzaCBvbiBpbmFjdGl2ZSB0b3BpY1wiKSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VxID0gcHViLnNlcSB8fCB0aGlzLl9nZXRRdWV1ZWRTZXFJZCgpO1xuICAgIGlmICghcHViLl9ub0ZvcndhcmRpbmcpIHtcbiAgICAgIC8vIFRoZSAnc2VxJywgJ3RzJywgYW5kICdmcm9tJyBhcmUgYWRkZWQgdG8gbWltaWMge2RhdGF9LiBUaGV5IGFyZSByZW1vdmVkIGxhdGVyXG4gICAgICAvLyBiZWZvcmUgdGhlIG1lc3NhZ2UgaXMgc2VudC5cblxuICAgICAgcHViLl9ub0ZvcndhcmRpbmcgPSB0cnVlO1xuICAgICAgcHViLnNlcSA9IHNlcTtcbiAgICAgIHB1Yi50cyA9IG5ldyBEYXRlKCk7XG4gICAgICBwdWIuZnJvbSA9IHRoaXMuX3Rpbm9kZS5nZXRDdXJyZW50VXNlcklEKCk7XG5cbiAgICAgIC8vIERvbid0IG5lZWQgYW4gZWNobyBtZXNzYWdlIGJlY2F1c2UgdGhlIG1lc3NhZ2UgaXMgYWRkZWQgdG8gbG9jYWwgY2FjaGUgcmlnaHQgYXdheS5cbiAgICAgIHB1Yi5ub2VjaG8gPSB0cnVlO1xuICAgICAgLy8gQWRkIHRvIGNhY2hlLlxuICAgICAgdGhpcy5fbWVzc2FnZXMucHV0KHB1Yik7XG4gICAgICB0aGlzLl90aW5vZGUuX2RiLmFkZE1lc3NhZ2UocHViKTtcblxuICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgIHRoaXMub25EYXRhKHB1Yik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIElmIHByb21pc2UgaXMgcHJvdmlkZWQsIHNlbmQgdGhlIHF1ZXVlZCBtZXNzYWdlIHdoZW4gaXQncyByZXNvbHZlZC5cbiAgICAvLyBJZiBubyBwcm9taXNlIGlzIHByb3ZpZGVkLCBjcmVhdGUgYSByZXNvbHZlZCBvbmUgYW5kIHNlbmQgaW1tZWRpYXRlbHkuXG4gICAgcHJvbSA9IChwcm9tIHx8IFByb21pc2UucmVzb2x2ZSgpKS50aGVuKFxuICAgICAgKCAvKiBhcmd1bWVudCBpZ25vcmVkICovICkgPT4ge1xuICAgICAgICBpZiAocHViLl9jYW5jZWxsZWQpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29kZTogMzAwLFxuICAgICAgICAgICAgdGV4dDogXCJjYW5jZWxsZWRcIlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHVibGlzaE1lc3NhZ2UocHViKTtcbiAgICAgIH0sXG4gICAgICAoZXJyKSA9PiB7XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5sb2dnZXIoXCJXQVJOSU5HOiBNZXNzYWdlIGRyYWZ0IHJlamVjdGVkXCIsIGVycik7XG4gICAgICAgIHB1Yi5fc2VuZGluZyA9IGZhbHNlO1xuICAgICAgICBwdWIuX2ZhaWxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX21lc3NhZ2VzLmRlbEF0KHRoaXMuX21lc3NhZ2VzLmZpbmQocHViKSk7XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtTWVzc2FnZXModGhpcy5uYW1lLCBwdWIuc2VxKTtcbiAgICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgICAgdGhpcy5vbkRhdGEoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgcmV0dXJuIHByb207XG4gIH0sXG5cbiAgLyoqXG4gICAqIExlYXZlIHRoZSB0b3BpYywgb3B0aW9uYWxseSB1bnNpYnNjcmliZS4gTGVhdmluZyB0aGUgdG9waWMgbWVhbnMgdGhlIHRvcGljIHdpbGwgc3RvcFxuICAgKiByZWNlaXZpbmcgdXBkYXRlcyBmcm9tIHRoZSBzZXJ2ZXIuIFVuc3Vic2NyaWJpbmcgd2lsbCB0ZXJtaW5hdGUgdXNlcidzIHJlbGF0aW9uc2hpcCB3aXRoIHRoZSB0b3BpYy5cbiAgICogV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNsZWF2ZX0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IHVuc3ViIC0gSWYgdHJ1ZSwgdW5zdWJzY3JpYmUsIG90aGVyd2lzZSBqdXN0IGxlYXZlLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gdGhlIHJlcXVlc3QuXG4gICAqL1xuICBsZWF2ZTogZnVuY3Rpb24odW5zdWIpIHtcbiAgICAvLyBJdCdzIHBvc3NpYmxlIHRvIHVuc3Vic2NyaWJlICh1bnN1Yj09dHJ1ZSkgZnJvbSBpbmFjdGl2ZSB0b3BpYy5cbiAgICBpZiAoIXRoaXMuX3N1YnNjcmliZWQgJiYgIXVuc3ViKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2Fubm90IGxlYXZlIGluYWN0aXZlIHRvcGljXCIpKTtcbiAgICB9XG5cbiAgICAvLyBTZW5kIGEgJ2xlYXZlJyBtZXNzYWdlLCBoYW5kbGUgYXN5bmMgcmVzcG9uc2VcbiAgICByZXR1cm4gdGhpcy5fdGlub2RlLmxlYXZlKHRoaXMubmFtZSwgdW5zdWIpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIHRoaXMuX3Jlc2V0U3ViKCk7XG4gICAgICBpZiAodW5zdWIpIHtcbiAgICAgICAgdGhpcy5fdGlub2RlLmNhY2hlRGVsKCd0b3BpYycsIHRoaXMubmFtZSk7XG4gICAgICAgIHRoaXMuX2dvbmUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRvcGljIG1ldGFkYXRhIGZyb20gdGhlIHNlcnZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtUaW5vZGUuR2V0UXVlcnl9IHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gcmVxdWVzdC5cbiAgICovXG4gIGdldE1ldGE6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgIC8vIFNlbmQge2dldH0gbWVzc2FnZSwgcmV0dXJuIHByb21pc2UuXG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5nZXRNZXRhKHRoaXMubmFtZSwgcGFyYW1zKTtcbiAgfSxcblxuICAvKipcbiAgICogUmVxdWVzdCBtb3JlIG1lc3NhZ2VzIGZyb20gdGhlIHNlcnZlclxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbGltaXQgbnVtYmVyIG9mIG1lc3NhZ2VzIHRvIGdldC5cbiAgICogQHBhcmFtIHtib29sZWFufSBmb3J3YXJkIGlmIHRydWUsIHJlcXVlc3QgbmV3ZXIgbWVzc2FnZXMuXG4gICAqL1xuICBnZXRNZXNzYWdlc1BhZ2U6IGZ1bmN0aW9uKGxpbWl0LCBmb3J3YXJkKSB7XG4gICAgY29uc3QgcXVlcnkgPSB0aGlzLnN0YXJ0TWV0YVF1ZXJ5KCk7XG4gICAgaWYgKGZvcndhcmQpIHtcbiAgICAgIHF1ZXJ5LndpdGhMYXRlckRhdGEobGltaXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBxdWVyeS53aXRoRWFybGllckRhdGEobGltaXQpO1xuICAgIH1cbiAgICBsZXQgcHJvbWlzZSA9IHRoaXMuZ2V0TWV0YShxdWVyeS5idWlsZCgpKTtcbiAgICBpZiAoIWZvcndhcmQpIHtcbiAgICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgaWYgKGN0cmwgJiYgY3RybC5wYXJhbXMgJiYgIWN0cmwucGFyYW1zLmNvdW50KSB7XG4gICAgICAgICAgdGhpcy5fbm9FYXJsaWVyTXNncyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHRvcGljIG1ldGFkYXRhLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXRQYXJhbXN9IHBhcmFtcyBwYXJhbWV0ZXJzIHRvIHVwZGF0ZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBzZXRNZXRhOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICBpZiAocGFyYW1zLnRhZ3MpIHtcbiAgICAgIHBhcmFtcy50YWdzID0gbm9ybWFsaXplQXJyYXkocGFyYW1zLnRhZ3MpO1xuICAgIH1cbiAgICAvLyBTZW5kIFNldCBtZXNzYWdlLCBoYW5kbGUgYXN5bmMgcmVzcG9uc2UuXG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5zZXRNZXRhKHRoaXMubmFtZSwgcGFyYW1zKVxuICAgICAgLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgaWYgKGN0cmwgJiYgY3RybC5jb2RlID49IDMwMCkge1xuICAgICAgICAgIC8vIE5vdCBtb2RpZmllZFxuICAgICAgICAgIHJldHVybiBjdHJsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcmFtcy5zdWIpIHtcbiAgICAgICAgICBwYXJhbXMuc3ViLnRvcGljID0gdGhpcy5uYW1lO1xuICAgICAgICAgIGlmIChjdHJsLnBhcmFtcyAmJiBjdHJsLnBhcmFtcy5hY3MpIHtcbiAgICAgICAgICAgIHBhcmFtcy5zdWIuYWNzID0gY3RybC5wYXJhbXMuYWNzO1xuICAgICAgICAgICAgcGFyYW1zLnN1Yi51cGRhdGVkID0gY3RybC50cztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFwYXJhbXMuc3ViLnVzZXIpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdWJzY3JpcHRpb24gdXBkYXRlIG9mIHRoZSBjdXJyZW50IHVzZXIuXG4gICAgICAgICAgICAvLyBBc3NpZ24gdXNlciBJRCBvdGhlcndpc2UgdGhlIHVwZGF0ZSB3aWxsIGJlIGlnbm9yZWQgYnkgX3Byb2Nlc3NNZXRhU3ViLlxuICAgICAgICAgICAgcGFyYW1zLnN1Yi51c2VyID0gdGhpcy5fdGlub2RlLmdldEN1cnJlbnRVc2VySUQoKTtcbiAgICAgICAgICAgIGlmICghcGFyYW1zLmRlc2MpIHtcbiAgICAgICAgICAgICAgLy8gRm9yY2UgdXBkYXRlIHRvIHRvcGljJ3MgYXNjLlxuICAgICAgICAgICAgICBwYXJhbXMuZGVzYyA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJhbXMuc3ViLl9ub0ZvcndhcmRpbmcgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhU3ViKFtwYXJhbXMuc3ViXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFyYW1zLmRlc2MpIHtcbiAgICAgICAgICBpZiAoY3RybC5wYXJhbXMgJiYgY3RybC5wYXJhbXMuYWNzKSB7XG4gICAgICAgICAgICBwYXJhbXMuZGVzYy5hY3MgPSBjdHJsLnBhcmFtcy5hY3M7XG4gICAgICAgICAgICBwYXJhbXMuZGVzYy51cGRhdGVkID0gY3RybC50cztcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fcHJvY2Vzc01ldGFEZXNjKHBhcmFtcy5kZXNjKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXJhbXMudGFncykge1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhVGFncyhwYXJhbXMudGFncyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcmFtcy5jcmVkKSB7XG4gICAgICAgICAgdGhpcy5fcHJvY2Vzc01ldGFDcmVkcyhbcGFyYW1zLmNyZWRdLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdHJsO1xuICAgICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhY2Nlc3MgbW9kZSBvZiB0aGUgY3VycmVudCB1c2VyIG9yIG9mIGFub3RoZXIgdG9waWMgc3Vic3JpYmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gVUlEIG9mIHRoZSB1c2VyIHRvIHVwZGF0ZSBvciBudWxsIHRvIHVwZGF0ZSBjdXJyZW50IHVzZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cGRhdGUgLSB0aGUgdXBkYXRlIHZhbHVlLCBmdWxsIG9yIGRlbHRhLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gcmVxdWVzdC5cbiAgICovXG4gIHVwZGF0ZU1vZGU6IGZ1bmN0aW9uKHVpZCwgdXBkYXRlKSB7XG4gICAgY29uc3QgdXNlciA9IHVpZCA/IHRoaXMuc3Vic2NyaWJlcih1aWQpIDogbnVsbDtcbiAgICBjb25zdCBhbSA9IHVzZXIgP1xuICAgICAgdXNlci5hY3MudXBkYXRlR2l2ZW4odXBkYXRlKS5nZXRHaXZlbigpIDpcbiAgICAgIHRoaXMuZ2V0QWNjZXNzTW9kZSgpLnVwZGF0ZVdhbnQodXBkYXRlKS5nZXRXYW50KCk7XG5cbiAgICByZXR1cm4gdGhpcy5zZXRNZXRhKHtcbiAgICAgIHN1Yjoge1xuICAgICAgICB1c2VyOiB1aWQsXG4gICAgICAgIG1vZGU6IGFtXG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdG9waWMgc3Vic2NyaXB0aW9uLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI3NldE1ldGF9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gSUQgb2YgdGhlIHVzZXIgdG8gaW52aXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gbW9kZSAtIEFjY2VzcyBtb2RlLiA8Y29kZT5udWxsPC9jb2RlPiBtZWFucyB0byB1c2UgZGVmYXVsdC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBpbnZpdGU6IGZ1bmN0aW9uKHVpZCwgbW9kZSkge1xuICAgIHJldHVybiB0aGlzLnNldE1ldGEoe1xuICAgICAgc3ViOiB7XG4gICAgICAgIHVzZXI6IHVpZCxcbiAgICAgICAgbW9kZTogbW9kZVxuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBcmNoaXZlIG9yIHVuLWFyY2hpdmUgdGhlIHRvcGljLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI3NldE1ldGF9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGFyY2ggLSB0cnVlIHRvIGFyY2hpdmUgdGhlIHRvcGljLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byByZXF1ZXN0LlxuICAgKi9cbiAgYXJjaGl2ZTogZnVuY3Rpb24oYXJjaCkge1xuICAgIGlmICh0aGlzLnByaXZhdGUgJiYgdGhpcy5wcml2YXRlLmFyY2ggPT0gYXJjaCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhcmNoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2V0TWV0YSh7XG4gICAgICBkZXNjOiB7XG4gICAgICAgIHByaXZhdGU6IHtcbiAgICAgICAgICBhcmNoOiBhcmNoID8gdHJ1ZSA6IFRpbm9kZS5ERUxfQ0hBUlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSBtZXNzYWdlcy4gSGFyZC1kZWxldGluZyBtZXNzYWdlcyByZXF1aXJlcyBPd25lciBwZXJtaXNzaW9uLlxuICAgKiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2RlbE1lc3NhZ2VzfS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtUaW5vZGUuRGVsUmFuZ2VbXX0gcmFuZ2VzIC0gUmFuZ2VzIG9mIG1lc3NhZ2UgSURzIHRvIGRlbGV0ZS5cbiAgICogQHBhcmFtIHtib29sZWFuPX0gaGFyZCAtIEhhcmQgb3Igc29mdCBkZWxldGVcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBkZWxNZXNzYWdlczogZnVuY3Rpb24ocmFuZ2VzLCBoYXJkKSB7XG4gICAgaWYgKCF0aGlzLl9zdWJzY3JpYmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2Fubm90IGRlbGV0ZSBtZXNzYWdlcyBpbiBpbmFjdGl2ZSB0b3BpY1wiKSk7XG4gICAgfVxuXG4gICAgLy8gU29ydCByYW5nZXMgaW4gYWNjZW5kaW5nIG9yZGVyIGJ5IGxvdywgdGhlIGRlc2NlbmRpbmcgYnkgaGkuXG4gICAgcmFuZ2VzLnNvcnQoKHIxLCByMikgPT4ge1xuICAgICAgaWYgKHIxLmxvdyA8IHIyLmxvdykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChyMS5sb3cgPT0gcjIubG93KSB7XG4gICAgICAgIHJldHVybiAhcjIuaGkgfHwgKHIxLmhpID49IHIyLmhpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIC8vIFJlbW92ZSBwZW5kaW5nIG1lc3NhZ2VzIGZyb20gcmFuZ2VzIHBvc3NpYmx5IGNsaXBwaW5nIHNvbWUgcmFuZ2VzLlxuICAgIGxldCB0b3NlbmQgPSByYW5nZXMucmVkdWNlKChvdXQsIHIpID0+IHtcbiAgICAgIGlmIChyLmxvdyA8IExPQ0FMX1NFUUlEKSB7XG4gICAgICAgIGlmICghci5oaSB8fCByLmhpIDwgTE9DQUxfU0VRSUQpIHtcbiAgICAgICAgICBvdXQucHVzaChyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDbGlwIGhpIHRvIG1heCBhbGxvd2VkIHZhbHVlLlxuICAgICAgICAgIG91dC5wdXNoKHtcbiAgICAgICAgICAgIGxvdzogci5sb3csXG4gICAgICAgICAgICBoaTogdGhpcy5fbWF4U2VxICsgMVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH0sIFtdKTtcblxuICAgIC8vIFNlbmQge2RlbH0gbWVzc2FnZSwgcmV0dXJuIHByb21pc2VcbiAgICBsZXQgcmVzdWx0O1xuICAgIGlmICh0b3NlbmQubGVuZ3RoID4gMCkge1xuICAgICAgcmVzdWx0ID0gdGhpcy5fdGlub2RlLmRlbE1lc3NhZ2VzKHRoaXMubmFtZSwgdG9zZW5kLCBoYXJkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgZGVsOiAwXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgbG9jYWwgY2FjaGUuXG4gICAgcmV0dXJuIHJlc3VsdC50aGVuKChjdHJsKSA9PiB7XG4gICAgICBpZiAoY3RybC5wYXJhbXMuZGVsID4gdGhpcy5fbWF4RGVsKSB7XG4gICAgICAgIHRoaXMuX21heERlbCA9IGN0cmwucGFyYW1zLmRlbDtcbiAgICAgIH1cblxuICAgICAgcmFuZ2VzLm1hcCgocikgPT4ge1xuICAgICAgICBpZiAoci5oaSkge1xuICAgICAgICAgIHRoaXMuZmx1c2hNZXNzYWdlUmFuZ2Uoci5sb3csIHIuaGkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZmx1c2hNZXNzYWdlKHIubG93KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX3VwZGF0ZURlbGV0ZWRSYW5nZXMoKTtcblxuICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgIC8vIENhbGxpbmcgd2l0aCBubyBwYXJhbWV0ZXJzIHRvIGluZGljYXRlIHRoZSBtZXNzYWdlcyB3ZXJlIGRlbGV0ZWQuXG4gICAgICAgIHRoaXMub25EYXRhKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3RybDtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogRGVsZXRlIGFsbCBtZXNzYWdlcy4gSGFyZC1kZWxldGluZyBtZXNzYWdlcyByZXF1aXJlcyBPd25lciBwZXJtaXNzaW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhhcmREZWwgLSB0cnVlIGlmIG1lc3NhZ2VzIHNob3VsZCBiZSBoYXJkLWRlbGV0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byByZXF1ZXN0LlxuICAgKi9cbiAgZGVsTWVzc2FnZXNBbGw6IGZ1bmN0aW9uKGhhcmREZWwpIHtcbiAgICBpZiAoIXRoaXMuX21heFNlcSB8fCB0aGlzLl9tYXhTZXEgPD0gMCkge1xuICAgICAgLy8gVGhlcmUgYXJlIG5vIG1lc3NhZ2VzIHRvIGRlbGV0ZS5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGVsTWVzc2FnZXMoW3tcbiAgICAgIGxvdzogMSxcbiAgICAgIGhpOiB0aGlzLl9tYXhTZXEgKyAxLFxuICAgICAgX2FsbDogdHJ1ZVxuICAgIH1dLCBoYXJkRGVsKTtcbiAgfSxcblxuICAvKipcbiAgICogRGVsZXRlIG11bHRpcGxlIG1lc3NhZ2VzIGRlZmluZWQgYnkgdGhlaXIgSURzLiBIYXJkLWRlbGV0aW5nIG1lc3NhZ2VzIHJlcXVpcmVzIE93bmVyIHBlcm1pc3Npb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7VGlub2RlLkRlbFJhbmdlW119IGxpc3QgLSBsaXN0IG9mIHNlcSBJRHMgdG8gZGVsZXRlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGhhcmREZWwgLSB0cnVlIGlmIG1lc3NhZ2VzIHNob3VsZCBiZSBoYXJkLWRlbGV0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byByZXF1ZXN0LlxuICAgKi9cbiAgZGVsTWVzc2FnZXNMaXN0OiBmdW5jdGlvbihsaXN0LCBoYXJkRGVsKSB7XG4gICAgLy8gU29ydCB0aGUgbGlzdCBpbiBhc2NlbmRpbmcgb3JkZXJcbiAgICBsaXN0LnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgICAvLyBDb252ZXJ0IHRoZSBhcnJheSBvZiBJRHMgdG8gcmFuZ2VzLlxuICAgIGxldCByYW5nZXMgPSBsaXN0LnJlZHVjZSgob3V0LCBpZCkgPT4ge1xuICAgICAgaWYgKG91dC5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBGaXJzdCBlbGVtZW50LlxuICAgICAgICBvdXQucHVzaCh7XG4gICAgICAgICAgbG93OiBpZFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcmV2ID0gb3V0W291dC5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKCghcHJldi5oaSAmJiAoaWQgIT0gcHJldi5sb3cgKyAxKSkgfHwgKGlkID4gcHJldi5oaSkpIHtcbiAgICAgICAgICAvLyBOZXcgcmFuZ2UuXG4gICAgICAgICAgb3V0LnB1c2goe1xuICAgICAgICAgICAgbG93OiBpZFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEV4cGFuZCBleGlzdGluZyByYW5nZS5cbiAgICAgICAgICBwcmV2LmhpID0gcHJldi5oaSA/IE1hdGgubWF4KHByZXYuaGksIGlkICsgMSkgOiBpZCArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfSwgW10pO1xuICAgIC8vIFNlbmQge2RlbH0gbWVzc2FnZSwgcmV0dXJuIHByb21pc2VcbiAgICByZXR1cm4gdGhpcy5kZWxNZXNzYWdlcyhyYW5nZXMsIGhhcmREZWwpXG4gIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0b3BpYy4gUmVxdWlyZXMgT3duZXIgcGVybWlzc2lvbi4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNkZWxUb3BpY30uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaGFyZCAtIGhhZC1kZWxldGUgdG9waWMuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byB0aGUgcmVxdWVzdC5cbiAgICovXG4gIGRlbFRvcGljOiBmdW5jdGlvbihoYXJkKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5kZWxUb3BpYyh0aGlzLm5hbWUsIGhhcmQpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIHRoaXMuX3Jlc2V0U3ViKCk7XG4gICAgICB0aGlzLl9nb25lKCk7XG4gICAgICByZXR1cm4gY3RybDtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogRGVsZXRlIHN1YnNjcmlwdGlvbi4gUmVxdWlyZXMgU2hhcmUgcGVybWlzc2lvbi4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNkZWxTdWJzY3JpcHRpb259LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlciAtIElEIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBzdWJzY3JpcHRpb24gZm9yLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gcmVxdWVzdC5cbiAgICovXG4gIGRlbFN1YnNjcmlwdGlvbjogZnVuY3Rpb24odXNlcikge1xuICAgIGlmICghdGhpcy5fc3Vic2NyaWJlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbm5vdCBkZWxldGUgc3Vic2NyaXB0aW9uIGluIGluYWN0aXZlIHRvcGljXCIpKTtcbiAgICB9XG4gICAgLy8gU2VuZCB7ZGVsfSBtZXNzYWdlLCByZXR1cm4gcHJvbWlzZVxuICAgIHJldHVybiB0aGlzLl90aW5vZGUuZGVsU3Vic2NyaXB0aW9uKHRoaXMubmFtZSwgdXNlcikudGhlbigoY3RybCkgPT4ge1xuICAgICAgLy8gUmVtb3ZlIHRoZSBvYmplY3QgZnJvbSB0aGUgc3Vic2NyaXB0aW9uIGNhY2hlO1xuICAgICAgZGVsZXRlIHRoaXMuX3VzZXJzW3VzZXJdO1xuICAgICAgLy8gTm90aWZ5IGxpc3RlbmVyc1xuICAgICAgaWYgKHRoaXMub25TdWJzVXBkYXRlZCkge1xuICAgICAgICB0aGlzLm9uU3Vic1VwZGF0ZWQoT2JqZWN0LmtleXModGhpcy5fdXNlcnMpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZW5kIGEgcmVhZC9yZWN2IG5vdGlmaWNhdGlvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdoYXQgLSB3aGF0IG5vdGlmaWNhdGlvbiB0byBzZW5kOiA8Y29kZT5yZWN2PC9jb2RlPiwgPGNvZGU+cmVhZDwvY29kZT4uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBJRCBvciB0aGUgbWVzc2FnZSByZWFkIG9yIHJlY2VpdmVkLlxuICAgKi9cbiAgbm90ZTogZnVuY3Rpb24od2hhdCwgc2VxKSB7XG4gICAgaWYgKCF0aGlzLl9zdWJzY3JpYmVkKSB7XG4gICAgICAvLyBDYW5ub3Qgc2VuZGluZyB7bm90ZX0gb24gYW4gaW5hY3RpdmUgdG9waWNcIi5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgbG9jYWwgY2FjaGUgd2l0aCB0aGUgbmV3IGNvdW50LlxuICAgIGNvbnN0IHVzZXIgPSB0aGlzLl91c2Vyc1t0aGlzLl90aW5vZGUuZ2V0Q3VycmVudFVzZXJJRCgpXTtcbiAgICBsZXQgdXBkYXRlID0gZmFsc2U7XG4gICAgaWYgKHVzZXIpIHtcbiAgICAgIC8vIFNlbGYtc3Vic2NyaXB0aW9uIGlzIGZvdW5kLlxuICAgICAgaWYgKCF1c2VyW3doYXRdIHx8IHVzZXJbd2hhdF0gPCBzZXEpIHtcbiAgICAgICAgdXNlclt3aGF0XSA9IHNlcTtcbiAgICAgICAgdXBkYXRlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU2VsZi1zdWJzY3JpcHRpb24gaXMgbm90IGZvdW5kLlxuICAgICAgdXBkYXRlID0gKHRoaXNbd2hhdF0gfCAwKSA8IHNlcTtcbiAgICB9XG5cbiAgICBpZiAodXBkYXRlKSB7XG4gICAgICAvLyBTZW5kIG5vdGlmaWNhdGlvbiB0byB0aGUgc2VydmVyLlxuICAgICAgdGhpcy5fdGlub2RlLm5vdGUodGhpcy5uYW1lLCB3aGF0LCBzZXEpO1xuICAgICAgLy8gVXBkYXRlIGxvY2FsbHkgY2FjaGVkIGNvbnRhY3Qgd2l0aCB0aGUgbmV3IGNvdW50LlxuICAgICAgdGhpcy5fdXBkYXRlUmVhZFJlY3Yod2hhdCwgc2VxKTtcblxuICAgICAgY29uc3QgbWUgPSB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpO1xuICAgICAgaWYgKHRoaXMuYWNzICE9IG51bGwgJiYgIXRoaXMuYWNzLmlzTXV0ZWQoKSkge1xuICAgICAgICAvLyBTZW50IGEgbm90aWZpY2F0aW9uIHRvICdtZScgbGlzdGVuZXJzLlxuICAgICAgICBtZS50aGlzLl9yZWZyZXNoQ29udGFjdCh3aGF0LCB0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNlbmQgYSAncmVjdicgcmVjZWlwdC4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNub3RlUmVjdn0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBJRCBvZiB0aGUgbWVzc2FnZSB0byBha25vd2xlZGdlLlxuICAgKi9cbiAgbm90ZVJlY3Y6IGZ1bmN0aW9uKHNlcSkge1xuICAgIHRoaXMubm90ZSgncmVjdicsIHNlcSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNlbmQgYSAncmVhZCcgcmVjZWlwdC4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNub3RlUmVhZH0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBJRCBvZiB0aGUgbWVzc2FnZSB0byBha25vd2xlZGdlIG9yIDAvdW5kZWZpbmVkIHRvIGFja25vd2xlZGdlIHRoZSBsYXRlc3QgbWVzc2FnZXMuXG4gICAqL1xuICBub3RlUmVhZDogZnVuY3Rpb24oc2VxKSB7XG4gICAgc2VxID0gc2VxIHx8IHRoaXMuX21heFNlcTtcbiAgICBpZiAoc2VxID4gMCkge1xuICAgICAgdGhpcy5ub3RlKCdyZWFkJywgc2VxKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNlbmQgYSBrZXktcHJlc3Mgbm90aWZpY2F0aW9uLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI25vdGVLZXlQcmVzc30uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqL1xuICBub3RlS2V5UHJlc3M6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9zdWJzY3JpYmVkKSB7XG4gICAgICB0aGlzLl90aW5vZGUubm90ZUtleVByZXNzKHRoaXMubmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Rpbm9kZS5sb2dnZXIoXCJJTkZPOiBDYW5ub3Qgc2VuZCBub3RpZmljYXRpb24gaW4gaW5hY3RpdmUgdG9waWNcIik7XG4gICAgfVxuICB9LFxuXG4gIC8vIFVwZGF0ZSBjYWNoZWQgcmVhZC9yZWN2L3VucmVhZCBjb3VudHMuXG4gIF91cGRhdGVSZWFkUmVjdjogZnVuY3Rpb24od2hhdCwgc2VxLCB0cykge1xuICAgIGxldCBvbGRWYWwsIGRvVXBkYXRlID0gZmFsc2U7XG5cbiAgICBzZXEgPSBzZXEgfCAwO1xuICAgIHRoaXMuc2VxID0gdGhpcy5zZXEgfCAwO1xuICAgIHRoaXMucmVhZCA9IHRoaXMucmVhZCB8IDA7XG4gICAgdGhpcy5yZWN2ID0gdGhpcy5yZWN2IHwgMDtcbiAgICBzd2l0Y2ggKHdoYXQpIHtcbiAgICAgIGNhc2UgJ3JlY3YnOlxuICAgICAgICBvbGRWYWwgPSB0aGlzLnJlY3Y7XG4gICAgICAgIHRoaXMucmVjdiA9IE1hdGgubWF4KHRoaXMucmVjdiwgc2VxKTtcbiAgICAgICAgZG9VcGRhdGUgPSAob2xkVmFsICE9IHRoaXMucmVjdik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncmVhZCc6XG4gICAgICAgIG9sZFZhbCA9IHRoaXMucmVhZDtcbiAgICAgICAgdGhpcy5yZWFkID0gTWF0aC5tYXgodGhpcy5yZWFkLCBzZXEpO1xuICAgICAgICBkb1VwZGF0ZSA9IChvbGRWYWwgIT0gdGhpcy5yZWFkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtc2cnOlxuICAgICAgICBvbGRWYWwgPSB0aGlzLnNlcTtcbiAgICAgICAgdGhpcy5zZXEgPSBNYXRoLm1heCh0aGlzLnNlcSwgc2VxKTtcbiAgICAgICAgaWYgKCF0aGlzLnRvdWNoZWQgfHwgdGhpcy50b3VjaGVkIDwgdHMpIHtcbiAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cztcbiAgICAgICAgfVxuICAgICAgICBkb1VwZGF0ZSA9IChvbGRWYWwgIT0gdGhpcy5zZXEpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBTYW5pdHkgY2hlY2tzLlxuICAgIGlmICh0aGlzLnJlY3YgPCB0aGlzLnJlYWQpIHtcbiAgICAgIHRoaXMucmVjdiA9IHRoaXMucmVhZDtcbiAgICAgIGRvVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2VxIDwgdGhpcy5yZWN2KSB7XG4gICAgICB0aGlzLnNlcSA9IHRoaXMucmVjdjtcbiAgICAgIGlmICghdGhpcy50b3VjaGVkIHx8IHRoaXMudG91Y2hlZCA8IHRzKSB7XG4gICAgICAgIHRoaXMudG91Y2hlZCA9IHRzO1xuICAgICAgfVxuICAgICAgZG9VcGRhdGUgPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLnVucmVhZCA9IHRoaXMuc2VxIC0gdGhpcy5yZWFkO1xuICAgIHJldHVybiBkb1VwZGF0ZTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHVzZXIgZGVzY3JpcHRpb24gZnJvbSBnbG9iYWwgY2FjaGUuIFRoZSB1c2VyIGRvZXMgbm90IG5lZWQgdG8gYmUgYVxuICAgKiBzdWJzY3JpYmVyIG9mIHRoaXMgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1aWQgLSBJRCBvZiB0aGUgdXNlciB0byBmZXRjaC5cbiAgICogQHJldHVybiB7T2JqZWN0fSB1c2VyIGRlc2NyaXB0aW9uIG9yIHVuZGVmaW5lZC5cbiAgICovXG4gIHVzZXJEZXNjOiBmdW5jdGlvbih1aWQpIHtcbiAgICAvLyBUT0RPKGdlbmUpOiBoYW5kbGUgYXN5bmNocm9ub3VzIHJlcXVlc3RzXG5cbiAgICBjb25zdCB1c2VyID0gdGhpcy5fY2FjaGVHZXRVc2VyKHVpZCk7XG4gICAgaWYgKHVzZXIpIHtcbiAgICAgIHJldHVybiB1c2VyOyAvLyBQcm9taXNlLnJlc29sdmUodXNlcilcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBkZXNjcmlwdGlvbiBvZiB0aGUgcDJwIHBlZXIgZnJvbSBzdWJzY3JpcHRpb24gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gcGVlcidzIGRlc2NyaXB0aW9uIG9yIHVuZGVmaW5lZC5cbiAgICovXG4gIHAycFBlZXJEZXNjOiBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuaXNQMlBUeXBlKCkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl91c2Vyc1t0aGlzLm5hbWVdO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2FjaGVkIHN1YnNjcmliZXJzLiBJZiBjYWxsYmFjayBpcyB1bmRlZmluZWQsIHVzZSB0aGlzLm9uTWV0YVN1Yi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayB3aGljaCB3aWxsIHJlY2VpdmUgc3Vic2NyaWJlcnMgb25lIGJ5IG9uZS5cbiAgICogQHBhcmFtIHtPYmplY3Q9fSBjb250ZXh0IC0gVmFsdWUgb2YgYHRoaXNgIGluc2lkZSB0aGUgYGNhbGxiYWNrYC5cbiAgICovXG4gIHN1YnNjcmliZXJzOiBmdW5jdGlvbihjYWxsYmFjaywgY29udGV4dCkge1xuICAgIGNvbnN0IGNiID0gKGNhbGxiYWNrIHx8IHRoaXMub25NZXRhU3ViKTtcbiAgICBpZiAoY2IpIHtcbiAgICAgIGZvciAobGV0IGlkeCBpbiB0aGlzLl91c2Vycykge1xuICAgICAgICBjYi5jYWxsKGNvbnRleHQsIHRoaXMuX3VzZXJzW2lkeF0sIGlkeCwgdGhpcy5fdXNlcnMpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgY29weSBvZiBjYWNoZWQgdGFncy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59IGEgY29weSBvZiB0YWdzXG4gICAqL1xuICB0YWdzOiBmdW5jdGlvbigpIHtcbiAgICAvLyBSZXR1cm4gYSBjb3B5LlxuICAgIHJldHVybiB0aGlzLl90YWdzLnNsaWNlKDApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgY2FjaGVkIHN1YnNjcmlwdGlvbiBmb3IgdGhlIGdpdmVuIHVzZXIgSUQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1aWQgLSBpZCBvZiB0aGUgdXNlciB0byBxdWVyeSBmb3JcbiAgICogQHJldHVybiB1c2VyIGRlc2NyaXB0aW9uIG9yIHVuZGVmaW5lZC5cbiAgICovXG4gIHN1YnNjcmliZXI6IGZ1bmN0aW9uKHVpZCkge1xuICAgIHJldHVybiB0aGlzLl91c2Vyc1t1aWRdO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2FjaGVkIG1lc3NhZ2VzLiBJZiBjYWxsYmFjayBpcyB1bmRlZmluZWQsIHVzZSB0aGlzLm9uRGF0YS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayB3aGljaCB3aWxsIHJlY2VpdmUgbWVzc2FnZXMgb25lIGJ5IG9uZS4gU2VlIHtAbGluayBUaW5vZGUuQ0J1ZmZlciNmb3JFYWNofVxuICAgKiBAcGFyYW0ge251bWJlcn0gc2luY2VJZCAtIE9wdGlvbmFsIHNlcUlkIHRvIHN0YXJ0IGl0ZXJhdGluZyBmcm9tIChpbmNsdXNpdmUpLlxuICAgKiBAcGFyYW0ge251bWJlcn0gYmVmb3JlSWQgLSBPcHRpb25hbCBzZXFJZCB0byBzdG9wIGl0ZXJhdGluZyBiZWZvcmUgKGV4Y2x1c2l2ZSkuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gVmFsdWUgb2YgYHRoaXNgIGluc2lkZSB0aGUgYGNhbGxiYWNrYC5cbiAgICovXG4gIG1lc3NhZ2VzOiBmdW5jdGlvbihjYWxsYmFjaywgc2luY2VJZCwgYmVmb3JlSWQsIGNvbnRleHQpIHtcbiAgICBjb25zdCBjYiA9IChjYWxsYmFjayB8fCB0aGlzLm9uRGF0YSk7XG4gICAgaWYgKGNiKSB7XG4gICAgICBsZXQgc3RhcnRJZHggPSB0eXBlb2Ygc2luY2VJZCA9PSAnbnVtYmVyJyA/IHRoaXMuX21lc3NhZ2VzLmZpbmQoe1xuICAgICAgICBzZXE6IHNpbmNlSWRcbiAgICAgIH0sIHRydWUpIDogdW5kZWZpbmVkO1xuICAgICAgbGV0IGJlZm9yZUlkeCA9IHR5cGVvZiBiZWZvcmVJZCA9PSAnbnVtYmVyJyA/IHRoaXMuX21lc3NhZ2VzLmZpbmQoe1xuICAgICAgICBzZXE6IGJlZm9yZUlkXG4gICAgICB9LCB0cnVlKSA6IHVuZGVmaW5lZDtcbiAgICAgIGlmIChzdGFydElkeCAhPSAtMSAmJiBiZWZvcmVJZHggIT0gLTEpIHtcbiAgICAgICAgdGhpcy5fbWVzc2FnZXMuZm9yRWFjaChjYiwgc3RhcnRJZHgsIGJlZm9yZUlkeCwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1vc3QgcmVjZW50IG1lc3NhZ2UgZnJvbSBjYWNoZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH0gdGhlIG1vc3QgcmVjZW50IGNhY2hlZCBtZXNzYWdlIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4sIGlmIG5vIG1lc3NhZ2VzIGFyZSBjYWNoZWQuXG4gICAqL1xuICBsYXRlc3RNZXNzYWdlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fbWVzc2FnZXMuZ2V0TGFzdCgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2FjaGVkIHVuc2VudCBtZXNzYWdlcy4gV3JhcHMge0BsaW5rIFRpbm9kZS5Ub3BpYyNtZXNzYWdlc30uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgd2hpY2ggd2lsbCByZWNlaXZlIG1lc3NhZ2VzIG9uZSBieSBvbmUuIFNlZSB7QGxpbmsgVGlub2RlLkNCdWZmZXIjZm9yRWFjaH1cbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBWYWx1ZSBvZiA8Y29kZT50aGlzPC9jb2RlPiBpbnNpZGUgdGhlIDxjb2RlPmNhbGxiYWNrPC9jb2RlPi5cbiAgICovXG4gIHF1ZXVlZE1lc3NhZ2VzOiBmdW5jdGlvbihjYWxsYmFjaywgY29udGV4dCkge1xuICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbGxiYWNrIG11c3QgYmUgcHJvdmlkZWRcIik7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZXMoY2FsbGJhY2ssIExPQ0FMX1NFUUlELCB1bmRlZmluZWQsIGNvbnRleHQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiB0b3BpYyBzdWJzY3JpYmVycyB3aG8gbWFya2VkIHRoaXMgbWVzc2FnZSBhcyBlaXRoZXIgcmVjdiBvciByZWFkXG4gICAqIEN1cnJlbnQgdXNlciBpcyBleGNsdWRlZCBmcm9tIHRoZSBjb3VudC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdoYXQgLSB3aGF0IGFjdGlvbiB0byBjb25zaWRlcjogcmVjZWl2ZWQgPGNvZGU+XCJyZWN2XCI8L2NvZGU+IG9yIHJlYWQgPGNvZGU+XCJyZWFkXCI8L2NvZGU+LlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxIC0gSUQgb3IgdGhlIG1lc3NhZ2UgcmVhZCBvciByZWNlaXZlZC5cbiAgICpcbiAgICogQHJldHVybnMge251bWJlcn0gdGhlIG51bWJlciBvZiBzdWJzY3JpYmVycyB3aG8gbWFya2VkIHRoZSBtZXNzYWdlIHdpdGggdGhlIGdpdmVuIElEIGFzIHJlYWQgb3IgcmVjZWl2ZWQuXG4gICAqL1xuICBtc2dSZWNlaXB0Q291bnQ6IGZ1bmN0aW9uKHdoYXQsIHNlcSkge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgaWYgKHNlcSA+IDApIHtcbiAgICAgIGNvbnN0IG1lID0gdGhpcy5fdGlub2RlLmdldEN1cnJlbnRVc2VySUQoKTtcbiAgICAgIGZvciAobGV0IGlkeCBpbiB0aGlzLl91c2Vycykge1xuICAgICAgICBjb25zdCB1c2VyID0gdGhpcy5fdXNlcnNbaWR4XTtcbiAgICAgICAgaWYgKHVzZXIudXNlciAhPT0gbWUgJiYgdXNlclt3aGF0XSA+PSBzZXEpIHtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb3VudDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgdG9waWMgc3Vic2NyaWJlcnMgd2hvIG1hcmtlZCB0aGlzIG1lc3NhZ2UgKGFuZCBhbGwgb2xkZXIgbWVzc2FnZXMpIGFzIHJlYWQuXG4gICAqIFRoZSBjdXJyZW50IHVzZXIgaXMgZXhjbHVkZWQgZnJvbSB0aGUgY291bnQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBtZXNzYWdlIGlkIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBudW1iZXIgb2Ygc3Vic2NyaWJlcnMgd2hvIGNsYWltIHRvIGhhdmUgcmVjZWl2ZWQgdGhlIG1lc3NhZ2UuXG4gICAqL1xuICBtc2dSZWFkQ291bnQ6IGZ1bmN0aW9uKHNlcSkge1xuICAgIHJldHVybiB0aGlzLm1zZ1JlY2VpcHRDb3VudCgncmVhZCcsIHNlcSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbnVtYmVyIG9mIHRvcGljIHN1YnNjcmliZXJzIHdobyBtYXJrZWQgdGhpcyBtZXNzYWdlIChhbmQgYWxsIG9sZGVyIG1lc3NhZ2VzKSBhcyByZWNlaXZlZC5cbiAgICogVGhlIGN1cnJlbnQgdXNlciBpcyBleGNsdWRlZCBmcm9tIHRoZSBjb3VudC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlcSAtIE1lc3NhZ2UgaWQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IE51bWJlciBvZiBzdWJzY3JpYmVycyB3aG8gY2xhaW0gdG8gaGF2ZSByZWNlaXZlZCB0aGUgbWVzc2FnZS5cbiAgICovXG4gIG1zZ1JlY3ZDb3VudDogZnVuY3Rpb24oc2VxKSB7XG4gICAgcmV0dXJuIHRoaXMubXNnUmVjZWlwdENvdW50KCdyZWN2Jywgc2VxKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgY2FjaGVkIG1lc3NhZ2UgSURzIGluZGljYXRlIHRoYXQgdGhlIHNlcnZlciBtYXkgaGF2ZSBtb3JlIG1lc3NhZ2VzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IG5ld2VyIC0gaWYgPGNvZGU+dHJ1ZTwvY29kZT4sIGNoZWNrIGZvciBuZXdlciBtZXNzYWdlcyBvbmx5LlxuICAgKi9cbiAgbXNnSGFzTW9yZU1lc3NhZ2VzOiBmdW5jdGlvbihuZXdlcikge1xuICAgIHJldHVybiBuZXdlciA/IHRoaXMuc2VxID4gdGhpcy5fbWF4U2VxIDpcbiAgICAgIC8vIF9taW5TZXEgY291bGQgYmUgbW9yZSB0aGFuIDEsIGJ1dCBlYXJsaWVyIG1lc3NhZ2VzIGNvdWxkIGhhdmUgYmVlbiBkZWxldGVkLlxuICAgICAgKHRoaXMuX21pblNlcSA+IDEgJiYgIXRoaXMuX25vRWFybGllck1zZ3MpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gc2VxIElkIGlzIGlkIG9mIHRoZSBtb3N0IHJlY2VudCBtZXNzYWdlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxSWQgaWQgb2YgdGhlIG1lc3NhZ2UgdG8gY2hlY2tcbiAgICovXG4gIGlzTmV3TWVzc2FnZTogZnVuY3Rpb24oc2VxSWQpIHtcbiAgICByZXR1cm4gdGhpcy5fbWF4U2VxIDw9IHNlcUlkO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgb25lIG1lc3NhZ2UgZnJvbSBsb2NhbCBjYWNoZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlcUlkIGlkIG9mIHRoZSBtZXNzYWdlIHRvIHJlbW92ZSBmcm9tIGNhY2hlLlxuICAgKiBAcmV0dXJucyB7TWVzc2FnZX0gcmVtb3ZlZCBtZXNzYWdlIG9yIHVuZGVmaW5lZCBpZiBzdWNoIG1lc3NhZ2Ugd2FzIG5vdCBmb3VuZC5cbiAgICovXG4gIGZsdXNoTWVzc2FnZTogZnVuY3Rpb24oc2VxSWQpIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLl9tZXNzYWdlcy5maW5kKHtcbiAgICAgIHNlcTogc2VxSWRcbiAgICB9KTtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtTWVzc2FnZXModGhpcy5uYW1lLCBzZXFJZCk7XG4gICAgICByZXR1cm4gdGhpcy5fbWVzc2FnZXMuZGVsQXQoaWR4KTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIG1lc3NhZ2UncyBzZXFJZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHB1YiBtZXNzYWdlIG9iamVjdC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IG5ld1NlcUlkIG5ldyBzZXEgaWQgZm9yIHB1Yi5cbiAgICovXG4gIHN3YXBNZXNzYWdlSWQ6IGZ1bmN0aW9uKHB1YiwgbmV3U2VxSWQpIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLl9tZXNzYWdlcy5maW5kKHB1Yik7XG4gICAgY29uc3QgbnVtTWVzc2FnZXMgPSB0aGlzLl9tZXNzYWdlcy5sZW5ndGgoKTtcbiAgICBpZiAoMCA8PSBpZHggJiYgaWR4IDwgbnVtTWVzc2FnZXMpIHtcbiAgICAgIC8vIFJlbW92ZSBtZXNzYWdlIHdpdGggdGhlIG9sZCBzZXEgSUQuXG4gICAgICB0aGlzLl9tZXNzYWdlcy5kZWxBdChpZHgpO1xuICAgICAgdGhpcy5fdGlub2RlLl9kYi5yZW1NZXNzYWdlcyh0aGlzLm5hbWUsIHB1Yi5zZXEpO1xuICAgICAgLy8gQWRkIG1lc3NhZ2Ugd2l0aCB0aGUgbmV3IHNlcSBJRC5cbiAgICAgIHB1Yi5zZXEgPSBuZXdTZXFJZDtcbiAgICAgIHRoaXMuX21lc3NhZ2VzLnB1dChwdWIpO1xuICAgICAgdGhpcy5fdGlub2RlLl9kYi5hZGRNZXNzYWdlKHB1Yik7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSByYW5nZSBvZiBtZXNzYWdlcyBmcm9tIHRoZSBsb2NhbCBjYWNoZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGZyb21JZCBzZXEgSUQgb2YgdGhlIGZpcnN0IG1lc3NhZ2UgdG8gcmVtb3ZlIChpbmNsdXNpdmUpLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdW50aWxJZCBzZXFJRCBvZiB0aGUgbGFzdCBtZXNzYWdlIHRvIHJlbW92ZSAoZXhjbHVzaXZlKS5cbiAgICpcbiAgICogQHJldHVybnMge01lc3NhZ2VbXX0gYXJyYXkgb2YgcmVtb3ZlZCBtZXNzYWdlcyAoY291bGQgYmUgZW1wdHkpLlxuICAgKi9cbiAgZmx1c2hNZXNzYWdlUmFuZ2U6IGZ1bmN0aW9uKGZyb21JZCwgdW50aWxJZCkge1xuICAgIC8vIFJlbW92ZSByYW5nZSBmcm9tIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgdGhpcy5fdGlub2RlLl9kYi5yZW1NZXNzYWdlcyh0aGlzLm5hbWUsIGZyb21JZCwgdW50aWxJZCk7XG4gICAgLy8gc3RhcnQsIGVuZDogZmluZCBpbnNlcnRpb24gcG9pbnRzIChuZWFyZXN0ID09IHRydWUpLlxuICAgIGNvbnN0IHNpbmNlID0gdGhpcy5fbWVzc2FnZXMuZmluZCh7XG4gICAgICBzZXE6IGZyb21JZFxuICAgIH0sIHRydWUpO1xuICAgIHJldHVybiBzaW5jZSA+PSAwID8gdGhpcy5fbWVzc2FnZXMuZGVsUmFuZ2Uoc2luY2UsIHRoaXMuX21lc3NhZ2VzLmZpbmQoe1xuICAgICAgc2VxOiB1bnRpbElkXG4gICAgfSwgdHJ1ZSkpIDogW107XG4gIH0sXG5cbiAgLyoqXG4gICAqIEF0dGVtcHQgdG8gc3RvcCBtZXNzYWdlIGZyb20gYmVpbmcgc2VudC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlcUlkIGlkIG9mIHRoZSBtZXNzYWdlIHRvIHN0b3Agc2VuZGluZyBhbmQgcmVtb3ZlIGZyb20gY2FjaGUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiBtZXNzYWdlIHdhcyBjYW5jZWxsZWQsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBjYW5jZWxTZW5kOiBmdW5jdGlvbihzZXFJZCkge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuX21lc3NhZ2VzLmZpbmQoe1xuICAgICAgc2VxOiBzZXFJZFxuICAgIH0pO1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgY29uc3QgbXNnID0gdGhpcy5fbWVzc2FnZXMuZ2V0QXQoaWR4KTtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMubXNnU3RhdHVzKG1zZyk7XG4gICAgICBpZiAoc3RhdHVzID09IE1FU1NBR0VfU1RBVFVTX1FVRVVFRCB8fCBzdGF0dXMgPT0gTUVTU0FHRV9TVEFUVVNfRkFJTEVEKSB7XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtTWVzc2FnZXModGhpcy5uYW1lLCBzZXFJZCk7XG4gICAgICAgIG1zZy5fY2FuY2VsbGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fbWVzc2FnZXMuZGVsQXQoaWR4KTtcbiAgICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgICAgLy8gQ2FsbGluZyB3aXRoIG5vIHBhcmFtZXRlcnMgdG8gaW5kaWNhdGUgdGhlIG1lc3NhZ2Ugd2FzIGRlbGV0ZWQuXG4gICAgICAgICAgdGhpcy5vbkRhdGEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdHlwZSBvZiB0aGUgdG9waWM6IG1lLCBwMnAsIGdycCwgZm5kLi4uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IE9uZSBvZiAnbWUnLCAncDJwJywgJ2dycCcsICdmbmQnLCAnc3lzJyBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+LlxuICAgKi9cbiAgZ2V0VHlwZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFRpbm9kZS50b3BpY1R5cGUodGhpcy5uYW1lKTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGN1cnJlbnQgdXNlcidzIGFjY2VzcyBtb2RlIG9mIHRoZSB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5BY2Nlc3NNb2RlfSAtIHVzZXIncyBhY2Nlc3MgbW9kZVxuICAgKi9cbiAgZ2V0QWNjZXNzTW9kZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuYWNzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZXQgY3VycmVudCB1c2VyJ3MgYWNjZXNzIG1vZGUgb2YgdGhlIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge0FjY2Vzc01vZGUgfCBPYmplY3R9IGFjcyAtIGFjY2VzcyBtb2RlIHRvIHNldC5cbiAgICovXG4gIHNldEFjY2Vzc01vZGU6IGZ1bmN0aW9uKGFjcykge1xuICAgIHJldHVybiB0aGlzLmFjcyA9IG5ldyBBY2Nlc3NNb2RlKGFjcyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0b3BpYydzIGRlZmF1bHQgYWNjZXNzIG1vZGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuRGVmQWNzfSAtIGFjY2VzcyBtb2RlLCBzdWNoIGFzIHthdXRoOiBgUldQYCwgYW5vbjogYE5gfS5cbiAgICovXG4gIGdldERlZmF1bHRBY2Nlc3M6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmRlZmFjcztcbiAgfSxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBuZXcgbWV0YSB7QGxpbmsgVGlub2RlLkdldFF1ZXJ5fSBidWlsZGVyLiBUaGUgcXVlcnkgaXMgYXR0Y2hlZCB0byB0aGUgY3VycmVudCB0b3BpYy5cbiAgICogSXQgd2lsbCBub3Qgd29yayBjb3JyZWN0bHkgaWYgdXNlZCB3aXRoIGEgZGlmZmVyZW50IHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSBxdWVyeSBhdHRhY2hlZCB0byB0aGUgY3VycmVudCB0b3BpYy5cbiAgICovXG4gIHN0YXJ0TWV0YVF1ZXJ5OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE1ldGFHZXRCdWlsZGVyKHRoaXMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0b3BpYyBpcyBhcmNoaXZlZCwgaS5lLiBwcml2YXRlLmFyY2ggPT0gdHJ1ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdG9waWMgaXMgYXJjaGl2ZWQsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBpc0FyY2hpdmVkOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5wcml2YXRlICYmIHRoaXMucHJpdmF0ZS5hcmNoID8gdHJ1ZSA6IGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0b3BpYyBpcyBhICdtZScgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIHRvcGljIGlzIGEgJ21lJyB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIGlzTWVUeXBlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gVGlub2RlLmlzTWVUb3BpY05hbWUodGhpcy5uYW1lKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYSBjaGFubmVsLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0b3BpYyBpcyBhIGNoYW5uZWwsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBpc0NoYW5uZWxUeXBlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gVGlub2RlLmlzQ2hhbm5lbFRvcGljTmFtZSh0aGlzLm5hbWUpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0b3BpYyBpcyBhIGdyb3VwIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0b3BpYyBpcyBhIGdyb3VwLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNHcm91cFR5cGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBUaW5vZGUuaXNHcm91cFRvcGljTmFtZSh0aGlzLm5hbWUpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0b3BpYyBpcyBhIHAycCB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdG9waWMgaXMgYSBwMnAgdG9waWMsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBpc1AyUFR5cGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBUaW5vZGUuaXNQMlBUb3BpY05hbWUodGhpcy5uYW1lKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYSBjb21tdW5pY2F0aW9uIHRvcGljLCBpLmUuIGEgZ3JvdXAgb3IgcDJwIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0b3BpYyBpcyBhIHAycCBvciBncm91cCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIGlzQ29tbVR5cGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBUaW5vZGUuaXNDb21tVG9waWNOYW1lKHRoaXMubmFtZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBzdGF0dXMgKHF1ZXVlZCwgc2VudCwgcmVjZWl2ZWQgZXRjKSBvZiBhIGdpdmVuIG1lc3NhZ2UgaW4gdGhlIGNvbnRleHRcbiAgICogb2YgdGhpcyB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtNZXNzYWdlfSBtc2cgLSBtZXNzYWdlIHRvIGNoZWNrIGZvciBzdGF0dXMuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdXBkIC0gdXBkYXRlIGNoYWNoZWQgbWVzc2FnZSBzdGF0dXMuXG4gICAqXG4gICAqIEByZXR1cm5zIG1lc3NhZ2Ugc3RhdHVzIGNvbnN0YW50LlxuICAgKi9cbiAgbXNnU3RhdHVzOiBmdW5jdGlvbihtc2csIHVwZCkge1xuICAgIGxldCBzdGF0dXMgPSBNRVNTQUdFX1NUQVRVU19OT05FO1xuICAgIGlmICh0aGlzLl90aW5vZGUuaXNNZShtc2cuZnJvbSkpIHtcbiAgICAgIGlmIChtc2cuX3NlbmRpbmcpIHtcbiAgICAgICAgc3RhdHVzID0gTUVTU0FHRV9TVEFUVVNfU0VORElORztcbiAgICAgIH0gZWxzZSBpZiAobXNnLl9mYWlsZWQgfHwgbXNnLl9jYW5jZWxsZWQpIHtcbiAgICAgICAgc3RhdHVzID0gTUVTU0FHRV9TVEFUVVNfRkFJTEVEO1xuICAgICAgfSBlbHNlIGlmIChtc2cuc2VxID49IExPQ0FMX1NFUUlEKSB7XG4gICAgICAgIHN0YXR1cyA9IE1FU1NBR0VfU1RBVFVTX1FVRVVFRDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tc2dSZWFkQ291bnQobXNnLnNlcSkgPiAwKSB7XG4gICAgICAgIHN0YXR1cyA9IE1FU1NBR0VfU1RBVFVTX1JFQUQ7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubXNnUmVjdkNvdW50KG1zZy5zZXEpID4gMCkge1xuICAgICAgICBzdGF0dXMgPSBNRVNTQUdFX1NUQVRVU19SRUNFSVZFRDtcbiAgICAgIH0gZWxzZSBpZiAobXNnLnNlcSA+IDApIHtcbiAgICAgICAgc3RhdHVzID0gTUVTU0FHRV9TVEFUVVNfU0VOVDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdHVzID0gTUVTU0FHRV9TVEFUVVNfVE9fTUU7XG4gICAgfVxuXG4gICAgaWYgKHVwZCAmJiBtc2cuX3N0YXR1cyAhPSBzdGF0dXMpIHtcbiAgICAgIG1zZy5fc3RhdHVzID0gc3RhdHVzO1xuICAgICAgdGhpcy5fdGlub2RlLl9kYi51cGRNZXNzYWdlU3RhdHVzKHRoaXMubmFtZSwgbXNnLnNlcSwgc3RhdHVzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdHVzO1xuICB9LFxuXG4gIC8vIFByb2Nlc3MgZGF0YSBtZXNzYWdlXG4gIF9yb3V0ZURhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBpZiAoZGF0YS5jb250ZW50KSB7XG4gICAgICBpZiAoIXRoaXMudG91Y2hlZCB8fCB0aGlzLnRvdWNoZWQgPCBkYXRhLnRzKSB7XG4gICAgICAgIHRoaXMudG91Y2hlZCA9IGRhdGEudHM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuc2VxID4gdGhpcy5fbWF4U2VxKSB7XG4gICAgICB0aGlzLl9tYXhTZXEgPSBkYXRhLnNlcTtcbiAgICB9XG4gICAgaWYgKGRhdGEuc2VxIDwgdGhpcy5fbWluU2VxIHx8IHRoaXMuX21pblNlcSA9PSAwKSB7XG4gICAgICB0aGlzLl9taW5TZXEgPSBkYXRhLnNlcTtcbiAgICB9XG5cbiAgICBpZiAoIWRhdGEuX25vRm9yd2FyZGluZykge1xuICAgICAgdGhpcy5fbWVzc2FnZXMucHV0KGRhdGEpO1xuICAgICAgdGhpcy5fdGlub2RlLl9kYi5hZGRNZXNzYWdlKGRhdGEpO1xuICAgICAgdGhpcy5fdXBkYXRlRGVsZXRlZFJhbmdlcygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9uRGF0YSkge1xuICAgICAgdGhpcy5vbkRhdGEoZGF0YSk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIGxvY2FsbHkgY2FjaGVkIGNvbnRhY3Qgd2l0aCB0aGUgbmV3IG1lc3NhZ2UgY291bnQuXG4gICAgY29uc3Qgd2hhdCA9ICgoIXRoaXMuaXNDaGFubmVsVHlwZSgpICYmICFkYXRhLmZyb20pIHx8IHRoaXMuX3Rpbm9kZS5pc01lKGRhdGEuZnJvbSkpID8gJ3JlYWQnIDogJ21zZyc7XG4gICAgY29uc3QgdXBkYXRlZCA9IHRoaXMuX3VwZGF0ZVJlYWRSZWN2KHdoYXQsIGRhdGEuc2VxLCBkYXRhLnRzKTtcbiAgICBjb25zdCBtZSA9IHRoaXMuX3Rpbm9kZS5nZXRNZVRvcGljKCk7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIC8vIE5vdGlmeSAnbWUnIGxpc3RlbmVycyBvZiB0aGUgY2hhbmdlLlxuICAgICAgbWUuX3JlZnJlc2hDb250YWN0KHdoYXQsIHRoaXMpO1xuICAgIH1cbiAgfSxcblxuICAvLyBQcm9jZXNzIG1ldGFkYXRhIG1lc3NhZ2VcbiAgX3JvdXRlTWV0YTogZnVuY3Rpb24obWV0YSkge1xuICAgIGlmIChtZXRhLmRlc2MpIHtcbiAgICAgIHRoaXMuX2xhc3REZXNjVXBkYXRlID0gbWV0YS50cztcbiAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhRGVzYyhtZXRhLmRlc2MpO1xuICAgIH1cbiAgICBpZiAobWV0YS5zdWIgJiYgbWV0YS5zdWIubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5fbGFzdFN1YnNVcGRhdGUgPSBtZXRhLnRzO1xuICAgICAgdGhpcy5fcHJvY2Vzc01ldGFTdWIobWV0YS5zdWIpO1xuICAgIH1cbiAgICBpZiAobWV0YS5kZWwpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NEZWxNZXNzYWdlcyhtZXRhLmRlbC5jbGVhciwgbWV0YS5kZWwuZGVsc2VxKTtcbiAgICB9XG4gICAgaWYgKG1ldGEudGFncykge1xuICAgICAgdGhpcy5fcHJvY2Vzc01ldGFUYWdzKG1ldGEudGFncyk7XG4gICAgfVxuICAgIGlmIChtZXRhLmNyZWQpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhQ3JlZHMobWV0YS5jcmVkKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub25NZXRhKSB7XG4gICAgICB0aGlzLm9uTWV0YShtZXRhKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gUHJvY2VzcyBwcmVzZW5jZSBjaGFuZ2UgbWVzc2FnZVxuICBfcm91dGVQcmVzOiBmdW5jdGlvbihwcmVzKSB7XG4gICAgbGV0IHVzZXI7XG4gICAgc3dpdGNoIChwcmVzLndoYXQpIHtcbiAgICAgIGNhc2UgJ2RlbCc6XG4gICAgICAgIC8vIERlbGV0ZSBjYWNoZWQgbWVzc2FnZXMuXG4gICAgICAgIHRoaXMuX3Byb2Nlc3NEZWxNZXNzYWdlcyhwcmVzLmNsZWFyLCBwcmVzLmRlbHNlcSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb24nOlxuICAgICAgY2FzZSAnb2ZmJzpcbiAgICAgICAgLy8gVXBkYXRlIG9ubGluZSBzdGF0dXMgb2YgYSBzdWJzY3JpcHRpb24uXG4gICAgICAgIHVzZXIgPSB0aGlzLl91c2Vyc1twcmVzLnNyY107XG4gICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgdXNlci5vbmxpbmUgPSBwcmVzLndoYXQgPT0gJ29uJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl90aW5vZGUubG9nZ2VyKFwiV0FSTklORzogUHJlc2VuY2UgdXBkYXRlIGZvciBhbiB1bmtub3duIHVzZXJcIiwgdGhpcy5uYW1lLCBwcmVzLnNyYyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0ZXJtJzpcbiAgICAgICAgLy8gQXR0YWNobWVudCB0byB0b3BpYyBpcyB0ZXJtaW5hdGVkIHByb2JhYmx5IGR1ZSB0byBjbHVzdGVyIHJlaGFzaGluZy5cbiAgICAgICAgdGhpcy5fcmVzZXRTdWIoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhY3MnOlxuICAgICAgICBjb25zdCB1aWQgPSBwcmVzLnNyYyB8fCB0aGlzLl90aW5vZGUuZ2V0Q3VycmVudFVzZXJJRCgpO1xuICAgICAgICB1c2VyID0gdGhpcy5fdXNlcnNbdWlkXTtcbiAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgLy8gVXBkYXRlIGZvciBhbiB1bmtub3duIHVzZXI6IG5vdGlmaWNhdGlvbiBvZiBhIG5ldyBzdWJzY3JpcHRpb24uXG4gICAgICAgICAgY29uc3QgYWNzID0gbmV3IEFjY2Vzc01vZGUoKS51cGRhdGVBbGwocHJlcy5kYWNzKTtcbiAgICAgICAgICBpZiAoYWNzICYmIGFjcy5tb2RlICE9IEFjY2Vzc01vZGUuX05PTkUpIHtcbiAgICAgICAgICAgIHVzZXIgPSB0aGlzLl9jYWNoZUdldFVzZXIodWlkKTtcbiAgICAgICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgICAgICB1c2VyID0ge1xuICAgICAgICAgICAgICAgIHVzZXI6IHVpZCxcbiAgICAgICAgICAgICAgICBhY3M6IGFjc1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB0aGlzLmdldE1ldGEodGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhPbmVTdWIodW5kZWZpbmVkLCB1aWQpLmJ1aWxkKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdXNlci5hY3MgPSBhY3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1c2VyLnVwZGF0ZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc01ldGFTdWIoW3VzZXJdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gS25vd24gdXNlclxuICAgICAgICAgIHVzZXIuYWNzLnVwZGF0ZUFsbChwcmVzLmRhY3MpO1xuICAgICAgICAgIC8vIFVwZGF0ZSB1c2VyJ3MgYWNjZXNzIG1vZGUuXG4gICAgICAgICAgdGhpcy5fcHJvY2Vzc01ldGFTdWIoW3tcbiAgICAgICAgICAgIHVzZXI6IHVpZCxcbiAgICAgICAgICAgIHVwZGF0ZWQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICBhY3M6IHVzZXIuYWNzXG4gICAgICAgICAgfV0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy5fdGlub2RlLmxvZ2dlcihcIklORk86IElnbm9yZWQgcHJlc2VuY2UgdXBkYXRlXCIsIHByZXMud2hhdCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub25QcmVzKSB7XG4gICAgICB0aGlzLm9uUHJlcyhwcmVzKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gUHJvY2VzcyB7aW5mb30gbWVzc2FnZVxuICBfcm91dGVJbmZvOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgaWYgKGluZm8ud2hhdCAhPT0gJ2twJykge1xuICAgICAgY29uc3QgdXNlciA9IHRoaXMuX3VzZXJzW2luZm8uZnJvbV07XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICB1c2VyW2luZm8ud2hhdF0gPSBpbmZvLnNlcTtcbiAgICAgICAgaWYgKHVzZXIucmVjdiA8IHVzZXIucmVhZCkge1xuICAgICAgICAgIHVzZXIucmVjdiA9IHVzZXIucmVhZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgbXNnID0gdGhpcy5sYXRlc3RNZXNzYWdlKCk7XG4gICAgICB0aGlzLm1zZ1N0YXR1cyhtc2csIHRydWUpO1xuXG4gICAgICAvLyBJZiB0aGlzIGlzIGFuIHVwZGF0ZSBmcm9tIHRoZSBjdXJyZW50IHVzZXIsIHVwZGF0ZSB0aGUgY2FjaGUgd2l0aCB0aGUgbmV3IGNvdW50LlxuICAgICAgaWYgKHRoaXMuX3Rpbm9kZS5pc01lKGluZm8uZnJvbSkpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlUmVhZFJlY3YoaW5mby53aGF0LCBpbmZvLnNlcSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdGlmeSAnbWUnIGxpc3RlbmVyIG9mIHRoZSBzdGF0dXMgY2hhbmdlLlxuICAgICAgdGhpcy5fdGlub2RlLmdldE1lVG9waWMoKS5fcmVmcmVzaENvbnRhY3QoaW5mby53aGF0LCB0aGlzKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub25JbmZvKSB7XG4gICAgICB0aGlzLm9uSW5mbyhpbmZvKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gQ2FsbGVkIGJ5IFRpbm9kZSB3aGVuIG1ldGEuZGVzYyBwYWNrZXQgaXMgcmVjZWl2ZWQuXG4gIC8vIENhbGxlZCBieSAnbWUnIHRvcGljIG9uIGNvbnRhY3QgdXBkYXRlIChkZXNjLl9ub0ZvcndhcmRpbmcgaXMgdHJ1ZSkuXG4gIF9wcm9jZXNzTWV0YURlc2M6IGZ1bmN0aW9uKGRlc2MpIHtcbiAgICBpZiAodGhpcy5pc1AyUFR5cGUoKSkge1xuICAgICAgLy8gU3ludGhldGljIGRlc2MgbWF5IGluY2x1ZGUgZGVmYWNzIGZvciBwMnAgdG9waWNzIHdoaWNoIGlzIHVzZWxlc3MuXG4gICAgICAvLyBSZW1vdmUgaXQuXG4gICAgICBkZWxldGUgZGVzYy5kZWZhY3M7XG5cbiAgICAgIC8vIFVwZGF0ZSB0byBwMnAgZGVzYyBpcyB0aGUgc2FtZSBhcyB1c2VyIHVwZGF0ZS4gVXBkYXRlIGNhY2hlZCB1c2VyLlxuICAgICAgdGhpcy5fdGlub2RlLl9kYi51cGRVc2VyKHRoaXMubmFtZSwgZGVzYy5wdWJsaWMpO1xuICAgIH1cblxuICAgIC8vIENvcHkgcGFyYW1ldGVycyBmcm9tIGRlc2Mgb2JqZWN0IHRvIHRoaXMgdG9waWMuXG4gICAgbWVyZ2VPYmoodGhpcywgZGVzYyk7XG4gICAgLy8gTWFrZSBzdXJlIGRhdGUgZmllbGRzIGFyZSBEYXRlKCkuXG4gICAgc3RyaW5nVG9EYXRlKHRoaXMpO1xuICAgIC8vIFVwZGF0ZSBwZXJzaXN0ZW50IGNhY2hlLlxuICAgIHRoaXMuX3Rpbm9kZS5fZGIudXBkVG9waWModGhpcyk7XG5cbiAgICAvLyBOb3RpZnkgJ21lJyBsaXN0ZW5lciwgaWYgYXZhaWxhYmxlOlxuICAgIGlmICh0aGlzLm5hbWUgIT09IFRPUElDX01FICYmICFkZXNjLl9ub0ZvcndhcmRpbmcpIHtcbiAgICAgIGNvbnN0IG1lID0gdGhpcy5fdGlub2RlLmdldE1lVG9waWMoKTtcbiAgICAgIGlmIChtZS5vbk1ldGFTdWIpIHtcbiAgICAgICAgbWUub25NZXRhU3ViKHRoaXMpO1xuICAgICAgfVxuICAgICAgaWYgKG1lLm9uU3Vic1VwZGF0ZWQpIHtcbiAgICAgICAgbWUub25TdWJzVXBkYXRlZChbdGhpcy5uYW1lXSwgMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub25NZXRhRGVzYykge1xuICAgICAgdGhpcy5vbk1ldGFEZXNjKHRoaXMpO1xuICAgIH1cbiAgfSxcblxuICAvLyBDYWxsZWQgYnkgVGlub2RlIHdoZW4gbWV0YS5zdWIgaXMgcmVjaXZlZCBvciBpbiByZXNwb25zZSB0byByZWNlaXZlZFxuICAvLyB7Y3RybH0gYWZ0ZXIgc2V0TWV0YS1zdWIuXG4gIF9wcm9jZXNzTWV0YVN1YjogZnVuY3Rpb24oc3Vicykge1xuICAgIGZvciAobGV0IGlkeCBpbiBzdWJzKSB7XG4gICAgICBjb25zdCBzdWIgPSBzdWJzW2lkeF07XG5cbiAgICAgIHN1Yi51cGRhdGVkID0gbmV3IERhdGUoc3ViLnVwZGF0ZWQpO1xuICAgICAgc3ViLmRlbGV0ZWQgPSBzdWIuZGVsZXRlZCA/IG5ldyBEYXRlKHN1Yi5kZWxldGVkKSA6IG51bGw7XG5cbiAgICAgIGxldCB1c2VyID0gbnVsbDtcbiAgICAgIGlmICghc3ViLmRlbGV0ZWQpIHtcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGNoYW5nZSB0byB1c2VyJ3Mgb3duIHBlcm1pc3Npb25zLCB1cGRhdGUgdGhlbSBpbiB0b3BpYyB0b28uXG4gICAgICAgIC8vIERlc2Mgd2lsbCB1cGRhdGUgJ21lJyB0b3BpYy5cbiAgICAgICAgaWYgKHRoaXMuX3Rpbm9kZS5pc01lKHN1Yi51c2VyKSAmJiBzdWIuYWNzKSB7XG4gICAgICAgICAgdGhpcy5fcHJvY2Vzc01ldGFEZXNjKHtcbiAgICAgICAgICAgIHVwZGF0ZWQ6IHN1Yi51cGRhdGVkIHx8IG5ldyBEYXRlKCksXG4gICAgICAgICAgICB0b3VjaGVkOiBzdWIudXBkYXRlZCxcbiAgICAgICAgICAgIGFjczogc3ViLmFjc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHVzZXIgPSB0aGlzLl91cGRhdGVDYWNoZWRVc2VyKHN1Yi51c2VyLCBzdWIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3Vic2NyaXB0aW9uIGlzIGRlbGV0ZWQsIHJlbW92ZSBpdCBmcm9tIHRvcGljIChidXQgbGVhdmUgaW4gVXNlcnMgY2FjaGUpXG4gICAgICAgIGRlbGV0ZSB0aGlzLl91c2Vyc1tzdWIudXNlcl07XG4gICAgICAgIHVzZXIgPSBzdWI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9uTWV0YVN1Yikge1xuICAgICAgICB0aGlzLm9uTWV0YVN1Yih1c2VyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5vblN1YnNVcGRhdGVkKSB7XG4gICAgICB0aGlzLm9uU3Vic1VwZGF0ZWQoT2JqZWN0LmtleXModGhpcy5fdXNlcnMpKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gQ2FsbGVkIGJ5IFRpbm9kZSB3aGVuIG1ldGEudGFncyBpcyByZWNpdmVkLlxuICBfcHJvY2Vzc01ldGFUYWdzOiBmdW5jdGlvbih0YWdzKSB7XG4gICAgaWYgKHRhZ3MubGVuZ3RoID09IDEgJiYgdGFnc1swXSA9PSBUaW5vZGUuREVMX0NIQVIpIHtcbiAgICAgIHRhZ3MgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5fdGFncyA9IHRhZ3M7XG4gICAgaWYgKHRoaXMub25UYWdzVXBkYXRlZCkge1xuICAgICAgdGhpcy5vblRhZ3NVcGRhdGVkKHRhZ3MpO1xuICAgIH1cbiAgfSxcblxuICAvLyBEbyBub3RoaW5nIGZvciB0b3BpY3Mgb3RoZXIgdGhhbiAnbWUnXG4gIF9wcm9jZXNzTWV0YUNyZWRzOiBmdW5jdGlvbihjcmVkcykge30sXG5cbiAgLy8gRGVsZXRlIGNhY2hlZCBtZXNzYWdlcyBhbmQgdXBkYXRlIGNhY2hlZCB0cmFuc2FjdGlvbiBJRHNcbiAgX3Byb2Nlc3NEZWxNZXNzYWdlczogZnVuY3Rpb24oY2xlYXIsIGRlbHNlcSkge1xuICAgIHRoaXMuX21heERlbCA9IE1hdGgubWF4KGNsZWFyLCB0aGlzLl9tYXhEZWwpO1xuICAgIHRoaXMuY2xlYXIgPSBNYXRoLm1heChjbGVhciwgdGhpcy5jbGVhcik7XG4gICAgY29uc3QgdG9waWMgPSB0aGlzO1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZGVsc2VxKSkge1xuICAgICAgZGVsc2VxLm1hcChmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICBpZiAoIXJhbmdlLmhpKSB7XG4gICAgICAgICAgY291bnQrKztcbiAgICAgICAgICB0b3BpYy5mbHVzaE1lc3NhZ2UocmFuZ2UubG93KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gcmFuZ2UubG93OyBpIDwgcmFuZ2UuaGk7IGkrKykge1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIHRvcGljLmZsdXNoTWVzc2FnZShpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgIHRoaXMuX3VwZGF0ZURlbGV0ZWRSYW5nZXMoKTtcblxuICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgIHRoaXMub25EYXRhKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIFRvcGljIGlzIGluZm9ybWVkIHRoYXQgdGhlIGVudGlyZSByZXNwb25zZSB0byB7Z2V0IHdoYXQ9ZGF0YX0gaGFzIGJlZW4gcmVjZWl2ZWQuXG4gIF9hbGxNZXNzYWdlc1JlY2VpdmVkOiBmdW5jdGlvbihjb3VudCkge1xuICAgIHRoaXMuX3VwZGF0ZURlbGV0ZWRSYW5nZXMoKTtcblxuICAgIGlmICh0aGlzLm9uQWxsTWVzc2FnZXNSZWNlaXZlZCkge1xuICAgICAgdGhpcy5vbkFsbE1lc3NhZ2VzUmVjZWl2ZWQoY291bnQpO1xuICAgIH1cbiAgfSxcblxuICAvLyBSZXNldCBzdWJzY3JpYmVkIHN0YXRlXG4gIF9yZXNldFN1YjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fc3Vic2NyaWJlZCA9IGZhbHNlO1xuICB9LFxuXG4gIC8vIFRoaXMgdG9waWMgaXMgZWl0aGVyIGRlbGV0ZWQgb3IgdW5zdWJzY3JpYmVkIGZyb20uXG4gIF9nb25lOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9tZXNzYWdlcy5yZXNldCgpO1xuICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtTWVzc2FnZXModGhpcy5uYW1lKTtcbiAgICB0aGlzLl91c2VycyA9IHt9O1xuICAgIHRoaXMuYWNzID0gbmV3IEFjY2Vzc01vZGUobnVsbCk7XG4gICAgdGhpcy5wcml2YXRlID0gbnVsbDtcbiAgICB0aGlzLnB1YmxpYyA9IG51bGw7XG4gICAgdGhpcy5fbWF4U2VxID0gMDtcbiAgICB0aGlzLl9taW5TZXEgPSAwO1xuICAgIHRoaXMuX3N1YnNjcmliZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0IG1lID0gdGhpcy5fdGlub2RlLmdldE1lVG9waWMoKTtcbiAgICBpZiAobWUpIHtcbiAgICAgIG1lLl9yb3V0ZVByZXMoe1xuICAgICAgICBfbm9Gb3J3YXJkaW5nOiB0cnVlLFxuICAgICAgICB3aGF0OiAnZ29uZScsXG4gICAgICAgIHRvcGljOiBUT1BJQ19NRSxcbiAgICAgICAgc3JjOiB0aGlzLm5hbWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5vbkRlbGV0ZVRvcGljKSB7XG4gICAgICB0aGlzLm9uRGVsZXRlVG9waWMoKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gVXBkYXRlIGdsb2JhbCB1c2VyIGNhY2hlIGFuZCBsb2NhbCBzdWJzY3JpYmVycyBjYWNoZS5cbiAgLy8gRG9uJ3QgY2FsbCB0aGlzIG1ldGhvZCBmb3Igbm9uLXN1YnNjcmliZXJzLlxuICBfdXBkYXRlQ2FjaGVkVXNlcjogZnVuY3Rpb24odWlkLCBvYmopIHtcbiAgICAvLyBGZXRjaCB1c2VyIG9iamVjdCBmcm9tIHRoZSBnbG9iYWwgY2FjaGUuXG4gICAgLy8gVGhpcyBpcyBhIGNsb25lIG9mIHRoZSBzdG9yZWQgb2JqZWN0XG4gICAgbGV0IGNhY2hlZCA9IHRoaXMuX2NhY2hlR2V0VXNlcih1aWQpO1xuICAgIGNhY2hlZCA9IG1lcmdlT2JqKGNhY2hlZCB8fCB7fSwgb2JqKTtcbiAgICAvLyBTYXZlIHRvIGdsb2JhbCBjYWNoZVxuICAgIHRoaXMuX2NhY2hlUHV0VXNlcih1aWQsIGNhY2hlZCk7XG4gICAgLy8gU2F2ZSB0byB0aGUgbGlzdCBvZiB0b3BpYyBzdWJzcmliZXJzLlxuICAgIHJldHVybiBtZXJnZVRvQ2FjaGUodGhpcy5fdXNlcnMsIHVpZCwgY2FjaGVkKTtcbiAgfSxcblxuICAvLyBHZXQgbG9jYWwgc2VxSWQgZm9yIGEgcXVldWVkIG1lc3NhZ2UuXG4gIF9nZXRRdWV1ZWRTZXFJZDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3F1ZXVlZFNlcUlkKys7XG4gIH0sXG5cbiAgLy8gQ2FsY3VsYXRlIHJhbmdlcyBvZiBtaXNzaW5nIG1lc3NhZ2VzLlxuICBfdXBkYXRlRGVsZXRlZFJhbmdlczogZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcmFuZ2VzID0gW107XG5cbiAgICBsZXQgcHJldiA9IG51bGw7XG4gICAgLy8gQ2hlY2sgZm9yIGdhcCBpbiB0aGUgYmVnaW5uaW5nLCBiZWZvcmUgdGhlIGZpcnN0IG1lc3NhZ2UuXG4gICAgY29uc3QgZmlyc3QgPSB0aGlzLl9tZXNzYWdlcy5nZXRBdCgwKTtcbiAgICBpZiAoZmlyc3QgJiYgdGhpcy5fbWluU2VxID4gMSAmJiAhdGhpcy5fbm9FYXJsaWVyTXNncykge1xuICAgICAgLy8gU29tZSBtZXNzYWdlcyBhcmUgbWlzc2luZyBpbiB0aGUgYmVnaW5uaW5nLlxuICAgICAgaWYgKGZpcnN0LmhpKSB7XG4gICAgICAgIC8vIFRoZSBmaXJzdCBtZXNzYWdlIGFscmVhZHkgcmVwcmVzZW50cyBhIGdhcC5cbiAgICAgICAgaWYgKGZpcnN0LnNlcSA+IDEpIHtcbiAgICAgICAgICBmaXJzdC5zZXEgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaXJzdC5oaSA8IHRoaXMuX21pblNlcSAtIDEpIHtcbiAgICAgICAgICBmaXJzdC5oaSA9IHRoaXMuX21pblNlcSAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgcHJldiA9IGZpcnN0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ3JlYXRlIG5ldyBnYXAuXG4gICAgICAgIHByZXYgPSB7XG4gICAgICAgICAgc2VxOiAxLFxuICAgICAgICAgIGhpOiB0aGlzLl9taW5TZXEgLSAxXG4gICAgICAgIH07XG4gICAgICAgIHJhbmdlcy5wdXNoKHByZXYpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBObyBnYXAgaW4gdGhlIGJlZ2lubmluZy5cbiAgICAgIHByZXYgPSB7XG4gICAgICAgIHNlcTogMCxcbiAgICAgICAgaGk6IDBcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRmluZCBnYXBzIGluIHRoZSBsaXN0IG9mIHJlY2VpdmVkIG1lc3NhZ2VzLiBUaGUgbGlzdCBjb250YWlucyBtZXNzYWdlcy1wcm9wZXIgYXMgd2VsbFxuICAgIC8vIGFzIHBsYWNlaG9sZXJzIGZvciBkZWxldGVkIHJhbmdlcy5cbiAgICAvLyBUaGUgbWVzc2FnZXMgYXJlIGl0ZXJhdGVkIGJ5IHNlcSBJRCBpbiBhc2NlbmRpbmcgb3JkZXIuXG4gICAgdGhpcy5fbWVzc2FnZXMuZm9yRWFjaCgoZGF0YSkgPT4ge1xuICAgICAgLy8gRG8gbm90IGNyZWF0ZSBhIGdhcCBiZXR3ZWVuIHRoZSBsYXN0IHNlbnQgbWVzc2FnZSBhbmQgdGhlIGZpcnN0IHVuc2VudC5cbiAgICAgIGlmIChkYXRhLnNlcSA+PSBMT0NBTF9TRVFJRCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIE5ldyBtZXNzYWdlIGlzIHJlZHVjaW5nIHRoZSBleGlzdGluZyBnYXBcbiAgICAgIGlmIChkYXRhLnNlcSA9PSAocHJldi5oaSB8fCBwcmV2LnNlcSkgKyAxKSB7XG4gICAgICAgIC8vIE5vIG5ldyBnYXAuIFJlcGxhY2UgcHJldmlvdXMgd2l0aCBjdXJyZW50LlxuICAgICAgICBwcmV2ID0gZGF0YTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3VuZCBhIG5ldyBnYXAuXG4gICAgICBpZiAocHJldi5oaSkge1xuICAgICAgICAvLyBQcmV2aW91cyBpcyBhbHNvIGEgZ2FwLCBhbHRlciBpdC5cbiAgICAgICAgcHJldi5oaSA9IGRhdGEuaGkgfHwgZGF0YS5zZXE7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gUHJldmlvdXMgaXMgbm90IGEgZ2FwLiBDcmVhdGUgYSBuZXcgZ2FwLlxuICAgICAgcHJldiA9IHtcbiAgICAgICAgc2VxOiAocHJldi5oaSB8fCBwcmV2LnNlcSkgKyAxLFxuICAgICAgICBoaTogZGF0YS5oaSB8fCBkYXRhLnNlcVxuICAgICAgfTtcbiAgICAgIHJhbmdlcy5wdXNoKHByZXYpO1xuICAgIH0pO1xuXG4gICAgLy8gQ2hlY2sgZm9yIG1pc3NpbmcgbWVzc2FnZXMgYXQgdGhlIGVuZC5cbiAgICAvLyBBbGwgbWVzc2FnZXMgY291bGQgYmUgbWlzc2luZyBvciBpdCBjb3VsZCBiZSBhIG5ldyB0b3BpYyB3aXRoIG5vIG1lc3NhZ2VzLlxuICAgIGNvbnN0IGxhc3QgPSB0aGlzLl9tZXNzYWdlcy5nZXRMYXN0KCk7XG4gICAgY29uc3QgbWF4U2VxID0gTWF0aC5tYXgodGhpcy5zZXEsIHRoaXMuX21heFNlcSkgfHwgMDtcbiAgICBpZiAoKG1heFNlcSA+IDAgJiYgIWxhc3QpIHx8IChsYXN0ICYmICgobGFzdC5oaSB8fCBsYXN0LnNlcSkgPCBtYXhTZXEpKSkge1xuICAgICAgaWYgKGxhc3QgJiYgbGFzdC5oaSkge1xuICAgICAgICAvLyBFeHRlbmQgZXhpc3RpbmcgZ2FwXG4gICAgICAgIGxhc3QuaGkgPSBtYXhTZXE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDcmVhdGUgbmV3IGdhcC5cbiAgICAgICAgcmFuZ2VzLnB1c2goe1xuICAgICAgICAgIHNlcTogbGFzdCA/IGxhc3Quc2VxICsgMSA6IDEsXG4gICAgICAgICAgaGk6IG1heFNlcVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbnNlcnQgbmV3IGdhcHMgaW50byBjYWNoZS5cbiAgICByYW5nZXMubWFwKChnYXApID0+IHtcbiAgICAgIHRoaXMuX21lc3NhZ2VzLnB1dChnYXApO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIExvYWQgbW9zdCByZWNlbnQgbWVzc2FnZXMgZnJvbSBwZXJzaXN0ZW50IGNhY2hlLlxuICBfbG9hZE1lc3NhZ2VzOiBmdW5jdGlvbihkYikge1xuICAgIHJldHVybiBkYi5yZWFkTWVzc2FnZXModGhpcy5uYW1lLCB7XG4gICAgICAgIGxpbWl0OiBERUZBVUxUX01FU1NBR0VTX1BBR0VcbiAgICAgIH0pXG4gICAgICAudGhlbigobXNncykgPT4ge1xuICAgICAgICBtc2dzLmZvckVhY2goKGRhdGEpID0+IHtcbiAgICAgICAgICBpZiAoZGF0YS5zZXEgPiB0aGlzLl9tYXhTZXEpIHtcbiAgICAgICAgICAgIHRoaXMuX21heFNlcSA9IGRhdGEuc2VxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZGF0YS5zZXEgPCB0aGlzLl9taW5TZXEgfHwgdGhpcy5fbWluU2VxID09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX21pblNlcSA9IGRhdGEuc2VxO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9tZXNzYWdlcy5wdXQoZGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3VwZGF0ZURlbGV0ZWRSYW5nZXMoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIEBjbGFzcyBUb3BpY01lIC0gc3BlY2lhbCBjYXNlIG9mIHtAbGluayBUaW5vZGUuVG9waWN9IGZvclxuICogbWFuYWdpbmcgZGF0YSBvZiB0aGUgY3VycmVudCB1c2VyLCBpbmNsdWRpbmcgY29udGFjdCBsaXN0LlxuICogQGV4dGVuZHMgVGlub2RlLlRvcGljXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtUb3BpY01lLkNhbGxiYWNrc30gY2FsbGJhY2tzIC0gQ2FsbGJhY2tzIHRvIHJlY2VpdmUgdmFyaW91cyBldmVudHMuXG4gKi9cbnZhciBUb3BpY01lID0gZnVuY3Rpb24oY2FsbGJhY2tzKSB7XG4gIFRvcGljLmNhbGwodGhpcywgVE9QSUNfTUUsIGNhbGxiYWNrcyk7XG5cbiAgLy8gbWUtc3BlY2lmaWMgY2FsbGJhY2tzXG4gIGlmIChjYWxsYmFja3MpIHtcbiAgICB0aGlzLm9uQ29udGFjdFVwZGF0ZSA9IGNhbGxiYWNrcy5vbkNvbnRhY3RVcGRhdGU7XG4gIH1cbn07XG5cbi8vIEluaGVyaXQgZXZlcnl0aW5nIGZyb20gdGhlIGdlbmVyaWMgVG9waWNcblRvcGljTWUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUb3BpYy5wcm90b3R5cGUsIHtcbiAgLy8gT3ZlcnJpZGUgdGhlIG9yaWdpbmFsIFRvcGljLl9wcm9jZXNzTWV0YURlc2MuXG4gIF9wcm9jZXNzTWV0YURlc2M6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24oZGVzYykge1xuICAgICAgLy8gQ2hlY2sgaWYgb25saW5lIGNvbnRhY3RzIG5lZWQgdG8gYmUgdHVybmVkIG9mZiBiZWNhdXNlIFAgcGVybWlzc2lvbiB3YXMgcmVtb3ZlZC5cbiAgICAgIGNvbnN0IHR1cm5PZmYgPSAoZGVzYy5hY3MgJiYgIWRlc2MuYWNzLmlzUHJlc2VuY2VyKCkpICYmICh0aGlzLmFjcyAmJiB0aGlzLmFjcy5pc1ByZXNlbmNlcigpKTtcblxuICAgICAgLy8gQ29weSBwYXJhbWV0ZXJzIGZyb20gZGVzYyBvYmplY3QgdG8gdGhpcyB0b3BpYy5cbiAgICAgIG1lcmdlT2JqKHRoaXMsIGRlc2MpO1xuICAgICAgdGhpcy5fdGlub2RlLl9kYi51cGRUb3BpYyh0aGlzKTtcblxuICAgICAgLy8gU3RyaW5nIGRhdGV0aW1lIGhlYWRlcnMgdG8gRGF0ZSgpIG9iamVjdHMuXG4gICAgICBzdHJpbmdUb0RhdGUodGhpcyk7XG5cbiAgICAgIC8vICdQJyBwZXJtaXNzaW9uIHdhcyByZW1vdmVkLiBBbGwgdG9waWNzIGFyZSBvZmZsaW5lIG5vdy5cbiAgICAgIGlmICh0dXJuT2ZmKSB7XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5jYWNoZU1hcCgndG9waWMnLCAoY29udCkgPT4ge1xuICAgICAgICAgIGlmIChjb250Lm9ubGluZSkge1xuICAgICAgICAgICAgY29udC5vbmxpbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChjb250LnNlZW4pIHtcbiAgICAgICAgICAgICAgY29udC5zZWVuLndoZW4gPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29udC5zZWVuID0ge1xuICAgICAgICAgICAgICAgIHdoZW46IG5ldyBEYXRlKClcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hDb250YWN0KCdvZmYnLCBjb250KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5vbk1ldGFEZXNjKSB7XG4gICAgICAgIHRoaXMub25NZXRhRGVzYyh0aGlzKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0sXG5cbiAgLy8gT3ZlcnJpZGUgdGhlIG9yaWdpbmFsIFRvcGljLl9wcm9jZXNzTWV0YVN1YlxuICBfcHJvY2Vzc01ldGFTdWI6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24oc3Vicykge1xuICAgICAgbGV0IHVwZGF0ZUNvdW50ID0gMDtcbiAgICAgIHN1YnMuZm9yRWFjaCgoc3ViKSA9PiB7XG4gICAgICAgIGNvbnN0IHRvcGljTmFtZSA9IHN1Yi50b3BpYztcbiAgICAgICAgLy8gRG9uJ3Qgc2hvdyAnbWUnIGFuZCAnZm5kJyB0b3BpY3MgaW4gdGhlIGxpc3Qgb2YgY29udGFjdHMuXG4gICAgICAgIGlmICh0b3BpY05hbWUgPT0gVE9QSUNfRk5EIHx8IHRvcGljTmFtZSA9PSBUT1BJQ19NRSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdWIudXBkYXRlZCA9IG5ldyBEYXRlKHN1Yi51cGRhdGVkKTtcbiAgICAgICAgc3ViLnRvdWNoZWQgPSBzdWIudG91Y2hlZCA/IG5ldyBEYXRlKHN1Yi50b3VjaGVkKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgc3ViLmRlbGV0ZWQgPSBzdWIuZGVsZXRlZCA/IG5ldyBEYXRlKHN1Yi5kZWxldGVkKSA6IG51bGw7XG5cbiAgICAgICAgbGV0IGNvbnQgPSBudWxsO1xuICAgICAgICBpZiAoc3ViLmRlbGV0ZWQpIHtcbiAgICAgICAgICBjb250ID0gc3ViO1xuICAgICAgICAgIHRoaXMuX3Rpbm9kZS5jYWNoZURlbCgndG9waWMnLCB0b3BpY05hbWUpO1xuICAgICAgICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtVG9waWModG9waWNOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBFbnN1cmUgdGhlIHZhbHVlcyBhcmUgZGVmaW5lZCBhbmQgYXJlIGludGVnZXJzLlxuICAgICAgICAgIGlmICh0eXBlb2Ygc3ViLnNlcSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgc3ViLnNlcSA9IHN1Yi5zZXEgfCAwO1xuICAgICAgICAgICAgc3ViLnJlY3YgPSBzdWIucmVjdiB8IDA7XG4gICAgICAgICAgICBzdWIucmVhZCA9IHN1Yi5yZWFkIHwgMDtcbiAgICAgICAgICAgIHN1Yi51bnJlYWQgPSBzdWIuc2VxIC0gc3ViLnJlYWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHN1Yi5zZWVuICYmIHN1Yi5zZWVuLndoZW4pIHtcbiAgICAgICAgICAgIHN1Yi5zZWVuLndoZW4gPSBuZXcgRGF0ZShzdWIuc2Vlbi53aGVuKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250ID0gbWVyZ2VPYmoodGhpcy5fdGlub2RlLmdldFRvcGljKHRvcGljTmFtZSksIHN1Yik7XG4gICAgICAgICAgdGhpcy5fdGlub2RlLl9kYi51cGRUb3BpYyhjb250KTtcblxuICAgICAgICAgIGlmIChUaW5vZGUuaXNQMlBUb3BpY05hbWUodG9waWNOYW1lKSkge1xuICAgICAgICAgICAgdGhpcy5fY2FjaGVQdXRVc2VyKHRvcGljTmFtZSwgY29udCk7XG4gICAgICAgICAgICB0aGlzLl90aW5vZGUuX2RiLnVwZFVzZXIodG9waWNOYW1lLCBjb250LnB1YmxpYyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIE5vdGlmeSB0b3BpYyBvZiB0aGUgdXBkYXRlIGlmIGl0J3MgYW4gZXh0ZXJuYWwgdXBkYXRlLlxuICAgICAgICAgIGlmICghc3ViLl9ub0ZvcndhcmRpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gdGhpcy5fdGlub2RlLmdldFRvcGljKHRvcGljTmFtZSk7XG4gICAgICAgICAgICBpZiAodG9waWMpIHtcbiAgICAgICAgICAgICAgc3ViLl9ub0ZvcndhcmRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICB0b3BpYy5fcHJvY2Vzc01ldGFEZXNjKHN1Yik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlQ291bnQrKztcblxuICAgICAgICBpZiAodGhpcy5vbk1ldGFTdWIpIHtcbiAgICAgICAgICB0aGlzLm9uTWV0YVN1Yihjb250KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLm9uU3Vic1VwZGF0ZWQgJiYgdXBkYXRlQ291bnQgPiAwKSB7XG4gICAgICAgIGNvbnN0IGtleXMgPSBbXTtcbiAgICAgICAgc3Vicy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgICAga2V5cy5wdXNoKHMudG9waWMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5vblN1YnNVcGRhdGVkKGtleXMsIHVwZGF0ZUNvdW50KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0sXG5cbiAgLy8gQ2FsbGVkIGJ5IFRpbm9kZSB3aGVuIG1ldGEuc3ViIGlzIHJlY2l2ZWQuXG4gIF9wcm9jZXNzTWV0YUNyZWRzOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKGNyZWRzLCB1cGQpIHtcbiAgICAgIGlmIChjcmVkcy5sZW5ndGggPT0gMSAmJiBjcmVkc1swXSA9PSBUaW5vZGUuREVMX0NIQVIpIHtcbiAgICAgICAgY3JlZHMgPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmICh1cGQpIHtcbiAgICAgICAgY3JlZHMubWFwKChjcikgPT4ge1xuICAgICAgICAgIGlmIChjci52YWwpIHtcbiAgICAgICAgICAgIC8vIEFkZGluZyBhIGNyZWRlbnRpYWwuXG4gICAgICAgICAgICBsZXQgaWR4ID0gdGhpcy5fY3JlZGVudGlhbHMuZmluZEluZGV4KChlbCkgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gZWwubWV0aCA9PSBjci5tZXRoICYmIGVsLnZhbCA9PSBjci52YWw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChpZHggPCAwKSB7XG4gICAgICAgICAgICAgIC8vIE5vdCBmb3VuZC5cbiAgICAgICAgICAgICAgaWYgKCFjci5kb25lKSB7XG4gICAgICAgICAgICAgICAgLy8gVW5jb25maXJtZWQgY3JlZGVudGlhbCByZXBsYWNlcyBwcmV2aW91cyB1bmNvbmZpcm1lZCBjcmVkZW50aWFsIG9mIHRoZSBzYW1lIG1ldGhvZC5cbiAgICAgICAgICAgICAgICBpZHggPSB0aGlzLl9jcmVkZW50aWFscy5maW5kSW5kZXgoKGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZWwubWV0aCA9PSBjci5tZXRoICYmICFlbC5kb25lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHByZXZpb3VzIHVuY29uZmlybWVkIGNyZWRlbnRpYWwuXG4gICAgICAgICAgICAgICAgICB0aGlzLl9jcmVkZW50aWFscy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5fY3JlZGVudGlhbHMucHVzaChjcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBGb3VuZC4gTWF5YmUgY2hhbmdlICdkb25lJyBzdGF0dXMuXG4gICAgICAgICAgICAgIHRoaXMuX2NyZWRlbnRpYWxzW2lkeF0uZG9uZSA9IGNyLmRvbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjci5yZXNwKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGUgY3JlZGVudGlhbCBjb25maXJtYXRpb24uXG4gICAgICAgICAgICBjb25zdCBpZHggPSB0aGlzLl9jcmVkZW50aWFscy5maW5kSW5kZXgoKGVsKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBlbC5tZXRoID09IGNyLm1ldGggJiYgIWVsLmRvbmU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgICAgICB0aGlzLl9jcmVkZW50aWFsc1tpZHhdLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jcmVkZW50aWFscyA9IGNyZWRzO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub25DcmVkc1VwZGF0ZWQpIHtcbiAgICAgICAgdGhpcy5vbkNyZWRzVXBkYXRlZCh0aGlzLl9jcmVkZW50aWFscyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8vIFByb2Nlc3MgcHJlc2VuY2UgY2hhbmdlIG1lc3NhZ2VcbiAgX3JvdXRlUHJlczoge1xuICAgIHZhbHVlOiBmdW5jdGlvbihwcmVzKSB7XG4gICAgICBpZiAocHJlcy53aGF0ID09ICd0ZXJtJykge1xuICAgICAgICAvLyBUaGUgJ21lJyB0b3BpYyBpdHNlbGYgaXMgZGV0YWNoZWQuIE1hcmsgYXMgdW5zdWJzY3JpYmVkLlxuICAgICAgICB0aGlzLl9yZXNldFN1YigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChwcmVzLndoYXQgPT0gJ3VwZCcgJiYgcHJlcy5zcmMgPT0gVE9QSUNfTUUpIHtcbiAgICAgICAgLy8gVXBkYXRlIHRvIG1lJ3MgZGVzY3JpcHRpb24uIFJlcXVlc3QgdXBkYXRlZCB2YWx1ZS5cbiAgICAgICAgdGhpcy5nZXRNZXRhKHRoaXMuc3RhcnRNZXRhUXVlcnkoKS53aXRoRGVzYygpLmJ1aWxkKCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnQgPSB0aGlzLl90aW5vZGUuY2FjaGVHZXQoJ3RvcGljJywgcHJlcy5zcmMpO1xuICAgICAgaWYgKGNvbnQpIHtcbiAgICAgICAgc3dpdGNoIChwcmVzLndoYXQpIHtcbiAgICAgICAgICBjYXNlICdvbic6IC8vIHRvcGljIGNhbWUgb25saW5lXG4gICAgICAgICAgICBjb250Lm9ubGluZSA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdvZmYnOiAvLyB0b3BpYyB3ZW50IG9mZmxpbmVcbiAgICAgICAgICAgIGlmIChjb250Lm9ubGluZSkge1xuICAgICAgICAgICAgICBjb250Lm9ubGluZSA9IGZhbHNlO1xuICAgICAgICAgICAgICBpZiAoY29udC5zZWVuKSB7XG4gICAgICAgICAgICAgICAgY29udC5zZWVuLndoZW4gPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnQuc2VlbiA9IHtcbiAgICAgICAgICAgICAgICAgIHdoZW46IG5ldyBEYXRlKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdtc2cnOiAvLyBuZXcgbWVzc2FnZSByZWNlaXZlZFxuICAgICAgICAgICAgY29udC50b3VjaGVkID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGNvbnQuc2VxID0gcHJlcy5zZXEgfCAwO1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgbWVzc2FnZSBpcyBzZW50IGJ5IHRoZSBjdXJyZW50IHVzZXIuIElmIHNvIGl0J3MgYmVlbiByZWFkIGFscmVhZHkuXG4gICAgICAgICAgICBpZiAoIXByZXMuYWN0IHx8IHRoaXMuX3Rpbm9kZS5pc01lKHByZXMuYWN0KSkge1xuICAgICAgICAgICAgICBjb250LnJlYWQgPSBjb250LnJlYWQgPyBNYXRoLm1heChjb250LnJlYWQsIGNvbnQuc2VxKSA6IGNvbnQuc2VxO1xuICAgICAgICAgICAgICBjb250LnJlY3YgPSBjb250LnJlY3YgPyBNYXRoLm1heChjb250LnJlYWQsIGNvbnQucmVjdikgOiBjb250LnJlYWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250LnVucmVhZCA9IGNvbnQuc2VxIC0gKGNvbnQucmVhZCB8IDApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAndXBkJzogLy8gZGVzYyB1cGRhdGVkXG4gICAgICAgICAgICAvLyBSZXF1ZXN0IHVwZGF0ZWQgc3Vic2NyaXB0aW9uLlxuICAgICAgICAgICAgdGhpcy5nZXRNZXRhKHRoaXMuc3RhcnRNZXRhUXVlcnkoKS53aXRoTGF0ZXJPbmVTdWIocHJlcy5zcmMpLmJ1aWxkKCkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYWNzJzogLy8gYWNjZXNzIG1vZGUgY2hhbmdlZFxuICAgICAgICAgICAgaWYgKGNvbnQuYWNzKSB7XG4gICAgICAgICAgICAgIGNvbnQuYWNzLnVwZGF0ZUFsbChwcmVzLmRhY3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29udC5hY3MgPSBuZXcgQWNjZXNzTW9kZSgpLnVwZGF0ZUFsbChwcmVzLmRhY3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udC50b3VjaGVkID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3VhJzpcbiAgICAgICAgICAgIC8vIHVzZXIgYWdlbnQgY2hhbmdlZC5cbiAgICAgICAgICAgIGNvbnQuc2VlbiA9IHtcbiAgICAgICAgICAgICAgd2hlbjogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgdWE6IHByZXMudWFcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdyZWN2JzpcbiAgICAgICAgICAgIC8vIHVzZXIncyBvdGhlciBzZXNzaW9uIG1hcmtlZCBzb21lIG1lc3NnZXMgYXMgcmVjZWl2ZWQuXG4gICAgICAgICAgICBwcmVzLnNlcSA9IHByZXMuc2VxIHwgMDtcbiAgICAgICAgICAgIGNvbnQucmVjdiA9IGNvbnQucmVjdiA/IE1hdGgubWF4KGNvbnQucmVjdiwgcHJlcy5zZXEpIDogcHJlcy5zZXE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdyZWFkJzpcbiAgICAgICAgICAgIC8vIHVzZXIncyBvdGhlciBzZXNzaW9uIG1hcmtlZCBzb21lIG1lc3NhZ2VzIGFzIHJlYWQuXG4gICAgICAgICAgICBwcmVzLnNlcSA9IHByZXMuc2VxIHwgMDtcbiAgICAgICAgICAgIGNvbnQucmVhZCA9IGNvbnQucmVhZCA/IE1hdGgubWF4KGNvbnQucmVhZCwgcHJlcy5zZXEpIDogcHJlcy5zZXE7XG4gICAgICAgICAgICBjb250LnJlY3YgPSBjb250LnJlY3YgPyBNYXRoLm1heChjb250LnJlYWQsIGNvbnQucmVjdikgOiBjb250LnJlY3Y7XG4gICAgICAgICAgICBjb250LnVucmVhZCA9IGNvbnQuc2VxIC0gY29udC5yZWFkO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnZ29uZSc6XG4gICAgICAgICAgICAvLyB0b3BpYyBkZWxldGVkIG9yIHVuc3Vic2NyaWJlZCBmcm9tLlxuICAgICAgICAgICAgdGhpcy5fdGlub2RlLmNhY2hlRGVsKCd0b3BpYycsIHByZXMuc3JjKTtcbiAgICAgICAgICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtVG9waWMocHJlcy5zcmMpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnZGVsJzpcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0b3BpYy5kZWwgdmFsdWUuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhpcy5fdGlub2RlLmxvZ2dlcihcIklORk86IFVuc3VwcG9ydGVkIHByZXNlbmNlIHVwZGF0ZSBpbiAnbWUnXCIsIHByZXMud2hhdCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZWZyZXNoQ29udGFjdChwcmVzLndoYXQsIGNvbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByZXMud2hhdCA9PSAnYWNzJykge1xuICAgICAgICAgIC8vIE5ldyBzdWJzY3JpcHRpb25zIGFuZCBkZWxldGVkL2Jhbm5lZCBzdWJzY3JpcHRpb25zIGhhdmUgZnVsbFxuICAgICAgICAgIC8vIGFjY2VzcyBtb2RlIChubyArIG9yIC0gaW4gdGhlIGRhY3Mgc3RyaW5nKS4gQ2hhbmdlcyB0byBrbm93biBzdWJzY3JpcHRpb25zIGFyZSBzZW50IGFzXG4gICAgICAgICAgLy8gZGVsdGFzLCBidXQgdGhleSBzaG91bGQgbm90IGhhcHBlbiBoZXJlLlxuICAgICAgICAgIGNvbnN0IGFjcyA9IG5ldyBBY2Nlc3NNb2RlKHByZXMuZGFjcyk7XG4gICAgICAgICAgaWYgKCFhY3MgfHwgYWNzLm1vZGUgPT0gQWNjZXNzTW9kZS5fSU5WQUxJRCkge1xuICAgICAgICAgICAgdGhpcy5fdGlub2RlLmxvZ2dlcihcIkVSUk9SOiBJbnZhbGlkIGFjY2VzcyBtb2RlIHVwZGF0ZVwiLCBwcmVzLnNyYywgcHJlcy5kYWNzKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFjcy5tb2RlID09IEFjY2Vzc01vZGUuX05PTkUpIHtcbiAgICAgICAgICAgIHRoaXMuX3Rpbm9kZS5sb2dnZXIoXCJXQVJOSU5HOiBSZW1vdmluZyBub24tZXhpc3RlbnQgc3Vic2NyaXB0aW9uXCIsIHByZXMuc3JjLCBwcmVzLmRhY3MpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBOZXcgc3Vic2NyaXB0aW9uLiBTZW5kIHJlcXVlc3QgZm9yIHRoZSBmdWxsIGRlc2NyaXB0aW9uLlxuICAgICAgICAgICAgLy8gVXNpbmcgLndpdGhPbmVTdWIgKG5vdCAud2l0aExhdGVyT25lU3ViKSB0byBtYWtlIHN1cmUgSWZNb2RpZmllZFNpbmNlIGlzIG5vdCBzZXQuXG4gICAgICAgICAgICB0aGlzLmdldE1ldGEodGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhPbmVTdWIodW5kZWZpbmVkLCBwcmVzLnNyYykuYnVpbGQoKSk7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBkdW1teSBlbnRyeSB0byBjYXRjaCBvbmxpbmUgc3RhdHVzIHVwZGF0ZS5cbiAgICAgICAgICAgIGNvbnN0IGR1bW15ID0gdGhpcy5fdGlub2RlLmdldFRvcGljKHByZXMuc3JjKTtcbiAgICAgICAgICAgIGR1bW15LnRvdWNoZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgZHVtbXkudG9waWMgPSBwcmVzLnNyYztcbiAgICAgICAgICAgIGR1bW15Lm9ubGluZSA9IGZhbHNlO1xuICAgICAgICAgICAgZHVtbXkuYWNzID0gYWNzO1xuICAgICAgICAgICAgdGhpcy5fdGlub2RlLmF0dGFjaENhY2hlVG9Ub3BpYyhkdW1teSk7XG4gICAgICAgICAgICBkdW1teS5fY2FjaGVQdXRTZWxmKCk7XG4gICAgICAgICAgICB0aGlzLl9kYi51cGRUb3BpYyhkdW1teSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHByZXMud2hhdCA9PSAndGFncycpIHtcbiAgICAgICAgICB0aGlzLmdldE1ldGEodGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhUYWdzKCkuYnVpbGQoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub25QcmVzKSB7XG4gICAgICAgIHRoaXMub25QcmVzKHByZXMpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSxcblxuICAvLyBDb250YWN0IGlzIHVwZGF0ZWQsIGV4ZWN1dGUgY2FsbGJhY2tzLlxuICBfcmVmcmVzaENvbnRhY3Q6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24od2hhdCwgY29udCkge1xuICAgICAgaWYgKHRoaXMub25Db250YWN0VXBkYXRlKSB7XG4gICAgICAgIHRoaXMub25Db250YWN0VXBkYXRlKHdoYXQsIGNvbnQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSxcblxuICAvKipcbiAgICogUHVibGlzaGluZyB0byBUb3BpY01lIGlzIG5vdCBzdXBwb3J0ZWQuIHtAbGluayBUb3BpYyNwdWJsaXNofSBpcyBvdmVycmlkZW4gYW5kIHRob3dzIGFuIHtFcnJvcn0gaWYgY2FsbGVkLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljTWUjXG4gICAqIEB0aHJvd3Mge0Vycm9yfSBBbHdheXMgdGhyb3dzIGFuIGVycm9yLlxuICAgKi9cbiAgcHVibGlzaDoge1xuICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJQdWJsaXNoaW5nIHRvICdtZScgaXMgbm90IHN1cHBvcnRlZFwiKSk7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBEZWxldGUgdmFsaWRhdGlvbiBjcmVkZW50aWFsLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljTWUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpYyAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIGRlbGV0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlciAtIFVzZXIgSUQgdG8gcmVtb3ZlLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBkZWxDcmVkZW50aWFsOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKG1ldGhvZCwgdmFsdWUpIHtcbiAgICAgIGlmICghdGhpcy5fc3Vic2NyaWJlZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2Fubm90IGRlbGV0ZSBjcmVkZW50aWFsIGluIGluYWN0aXZlICdtZScgdG9waWNcIikpO1xuICAgICAgfVxuICAgICAgLy8gU2VuZCB7ZGVsfSBtZXNzYWdlLCByZXR1cm4gcHJvbWlzZVxuICAgICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5kZWxDcmVkZW50aWFsKG1ldGhvZCwgdmFsdWUpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgLy8gUmVtb3ZlIGRlbGV0ZWQgY3JlZGVudGlhbCBmcm9tIHRoZSBjYWNoZS5cbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9jcmVkZW50aWFscy5maW5kSW5kZXgoKGVsKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGVsLm1ldGggPT0gbWV0aG9kICYmIGVsLnZhbCA9PSB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgdGhpcy5fY3JlZGVudGlhbHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3RpZnkgbGlzdGVuZXJzXG4gICAgICAgIGlmICh0aGlzLm9uQ3JlZHNVcGRhdGVkKSB7XG4gICAgICAgICAgdGhpcy5vbkNyZWRzVXBkYXRlZCh0aGlzLl9jcmVkZW50aWFscyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN0cmw7XG4gICAgICB9KTtcblxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSxcblxuICAvKipcbiAgICogQGNhbGxiYWNrIGNvbnRhY3RGaWx0ZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRhY3QgdG8gY2hlY2sgZm9yIGluY2x1c2lvbi5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIGNvbnRhY3Qgc2hvdWxkIGJlIHByb2Nlc3NlZCwgPGNvZGU+ZmFsc2U8L2NvZGU+IHRvIGV4Y2x1ZGUgaXQuXG4gICAqL1xuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGNhY2hlZCBjb250YWN0cy5cbiAgICpcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICogQHBhcmFtIHtUb3BpY01lLkNvbnRhY3RDYWxsYmFja30gY2FsbGJhY2sgLSBDYWxsYmFjayB0byBjYWxsIGZvciBlYWNoIGNvbnRhY3QuXG4gICAqIEBwYXJhbSB7Y29udGFjdEZpbHRlcj19IGZpbHRlciAtIE9wdGlvbmFsbHkgZmlsdGVyIGNvbnRhY3RzOyBpbmNsdWRlIGFsbCBpZiBmaWx0ZXIgaXMgZmFsc2UtaXNoLCBvdGhlcndpc2VcbiAgICogICAgICBpbmNsdWRlIHRob3NlIGZvciB3aGljaCBmaWx0ZXIgcmV0dXJucyB0cnVlLWlzaC5cbiAgICogQHBhcmFtIHtPYmplY3Q9fSBjb250ZXh0IC0gQ29udGV4dCB0byB1c2UgZm9yIGNhbGxpbmcgdGhlIGBjYWxsYmFja2AsIGkuZS4gdGhlIHZhbHVlIG9mIGB0aGlzYCBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuICAgKi9cbiAgY29udGFjdHM6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24oY2FsbGJhY2ssIGZpbHRlciwgY29udGV4dCkge1xuICAgICAgdGhpcy5fdGlub2RlLmNhY2hlTWFwKCd0b3BpYycsIChjLCBpZHgpID0+IHtcbiAgICAgICAgaWYgKGMuaXNDb21tVHlwZSgpICYmICghZmlsdGVyIHx8IGZpbHRlcihjKSkpIHtcbiAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGMsIGlkeCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgY29udGFjdCBmcm9tIGNhY2hlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljTWUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgY29udGFjdCB0byBnZXQsIGVpdGhlciBhIFVJRCAoZm9yIHAycCB0b3BpY3MpIG9yIGEgdG9waWMgbmFtZS5cbiAgICogQHJldHVybnMge1Rpbm9kZS5Db250YWN0fSAtIENvbnRhY3Qgb3IgYHVuZGVmaW5lZGAuXG4gICAqL1xuICBnZXRDb250YWN0OiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLl90aW5vZGUuY2FjaGVHZXQoJ3RvcGljJywgbmFtZSk7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYWNjZXNzIG1vZGUgb2YgYSBnaXZlbiBjb250YWN0IGZyb20gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSBjb250YWN0IHRvIGdldCBhY2Nlc3MgbW9kZSBmb3IsIGVpdGhlciBhIFVJRCAoZm9yIHAycCB0b3BpY3MpXG4gICAqICAgICAgICBvciBhIHRvcGljIG5hbWU7IGlmIG1pc3NpbmcsIGFjY2VzcyBtb2RlIGZvciB0aGUgJ21lJyB0b3BpYyBpdHNlbGYuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gYWNjZXNzIG1vZGUsIHN1Y2ggYXMgYFJXUGAuXG4gICAqL1xuICBnZXRBY2Nlc3NNb2RlOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgIGNvbnN0IGNvbnQgPSB0aGlzLl90aW5vZGUuY2FjaGVHZXQoJ3RvcGljJywgbmFtZSk7XG4gICAgICAgIHJldHVybiBjb250ID8gY29udC5hY3MgOiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYWNzO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgY29udGFjdCBpcyBhcmNoaXZlZCwgaS5lLiBjb250YWN0LnByaXZhdGUuYXJjaCA9PSB0cnVlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljTWUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgY29udGFjdCB0byBjaGVjayBhcmNoaXZlZCBzdGF0dXMsIGVpdGhlciBhIFVJRCAoZm9yIHAycCB0b3BpY3MpIG9yIGEgdG9waWMgbmFtZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gdHJ1ZSBpZiBjb250YWN0IGlzIGFyY2hpdmVkLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBpc0FyY2hpdmVkOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNvbnN0IGNvbnQgPSB0aGlzLl90aW5vZGUuY2FjaGVHZXQoJ3RvcGljJywgbmFtZSk7XG4gICAgICByZXR1cm4gY29udCA/ICgoY29udC5wcml2YXRlICYmIGNvbnQucHJpdmF0ZS5hcmNoKSA/IHRydWUgOiBmYWxzZSkgOiBudWxsO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSxcblxuICAvKipcbiAgICogQHR5cGVkZWYgVGlub2RlLkNyZWRlbnRpYWxcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAdHlwZSBPYmplY3RcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IG1ldGggLSB2YWxpZGF0aW9uIG1ldGhvZCBzdWNoIGFzICdlbWFpbCcgb3IgJ3RlbCcuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2YWwgLSBjcmVkZW50aWFsIHZhbHVlLCBpLmUuICdqZG9lQGV4YW1wbGUuY29tJyBvciAnKzE3MDI1NTUxMjM0J1xuICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IGRvbmUgLSB0cnVlIGlmIGNyZWRlbnRpYWwgaXMgdmFsaWRhdGVkLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgdXNlcidzIGNyZWRlbnRpYWxzOiBlbWFpbCwgcGhvbmUsIGV0Yy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpY01lI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLkNyZWRlbnRpYWxbXX0gLSBhcnJheSBvZiBjcmVkZW50aWFscy5cbiAgICovXG4gIGdldENyZWRlbnRpYWxzOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NyZWRlbnRpYWxzO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfVxufSk7XG5Ub3BpY01lLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRvcGljTWU7XG5cbi8qKlxuICogQGNsYXNzIFRvcGljRm5kIC0gc3BlY2lhbCBjYXNlIG9mIHtAbGluayBUaW5vZGUuVG9waWN9IGZvciBzZWFyY2hpbmcgZm9yXG4gKiBjb250YWN0cyBhbmQgZ3JvdXAgdG9waWNzLlxuICogQGV4dGVuZHMgVGlub2RlLlRvcGljXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtUb3BpY0ZuZC5DYWxsYmFja3N9IGNhbGxiYWNrcyAtIENhbGxiYWNrcyB0byByZWNlaXZlIHZhcmlvdXMgZXZlbnRzLlxuICovXG52YXIgVG9waWNGbmQgPSBmdW5jdGlvbihjYWxsYmFja3MpIHtcbiAgVG9waWMuY2FsbCh0aGlzLCBUT1BJQ19GTkQsIGNhbGxiYWNrcyk7XG4gIC8vIExpc3Qgb2YgdXNlcnMgYW5kIHRvcGljcyB1aWQgb3IgdG9waWNfbmFtZSAtPiBDb250YWN0IG9iamVjdClcbiAgdGhpcy5fY29udGFjdHMgPSB7fTtcbn07XG5cbi8vIEluaGVyaXQgZXZlcnl0aW5nIGZyb20gdGhlIGdlbmVyaWMgVG9waWNcblRvcGljRm5kLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVG9waWMucHJvdG90eXBlLCB7XG4gIC8vIE92ZXJyaWRlIHRoZSBvcmlnaW5hbCBUb3BpYy5fcHJvY2Vzc01ldGFTdWJcbiAgX3Byb2Nlc3NNZXRhU3ViOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKHN1YnMpIHtcbiAgICAgIGxldCB1cGRhdGVDb3VudCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMuX2NvbnRhY3RzKS5sZW5ndGg7XG4gICAgICAvLyBSZXNldCBjb250YWN0IGxpc3QuXG4gICAgICB0aGlzLl9jb250YWN0cyA9IHt9O1xuICAgICAgZm9yIChsZXQgaWR4IGluIHN1YnMpIHtcbiAgICAgICAgbGV0IHN1YiA9IHN1YnNbaWR4XTtcbiAgICAgICAgY29uc3QgaW5kZXhCeSA9IHN1Yi50b3BpYyA/IHN1Yi50b3BpYyA6IHN1Yi51c2VyO1xuXG4gICAgICAgIHN1Yi51cGRhdGVkID0gbmV3IERhdGUoc3ViLnVwZGF0ZWQpO1xuICAgICAgICBpZiAoc3ViLnNlZW4gJiYgc3ViLnNlZW4ud2hlbikge1xuICAgICAgICAgIHN1Yi5zZWVuLndoZW4gPSBuZXcgRGF0ZShzdWIuc2Vlbi53aGVuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1YiA9IG1lcmdlVG9DYWNoZSh0aGlzLl9jb250YWN0cywgaW5kZXhCeSwgc3ViKTtcbiAgICAgICAgdXBkYXRlQ291bnQrKztcblxuICAgICAgICBpZiAodGhpcy5vbk1ldGFTdWIpIHtcbiAgICAgICAgICB0aGlzLm9uTWV0YVN1YihzdWIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh1cGRhdGVDb3VudCA+IDAgJiYgdGhpcy5vblN1YnNVcGRhdGVkKSB7XG4gICAgICAgIHRoaXMub25TdWJzVXBkYXRlZChPYmplY3Qua2V5cyh0aGlzLl9jb250YWN0cykpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSxcblxuICAvKipcbiAgICogUHVibGlzaGluZyB0byBUb3BpY0ZuZCBpcyBub3Qgc3VwcG9ydGVkLiB7QGxpbmsgVG9waWMjcHVibGlzaH0gaXMgb3ZlcnJpZGVuIGFuZCB0aG93cyBhbiB7RXJyb3J9IGlmIGNhbGxlZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpY0ZuZCNcbiAgICogQHRocm93cyB7RXJyb3J9IEFsd2F5cyB0aHJvd3MgYW4gZXJyb3IuXG4gICAqL1xuICBwdWJsaXNoOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIlB1Ymxpc2hpbmcgdG8gJ2ZuZCcgaXMgbm90IHN1cHBvcnRlZFwiKSk7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBzZXRNZXRhIHRvIFRvcGljRm5kIHJlc2V0cyBjb250YWN0IGxpc3QgaW4gYWRkaXRpb24gdG8gc2VuZGluZyB0aGUgbWVzc2FnZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpY0ZuZCNcbiAgICogQHBhcmFtIHtUaW5vZGUuU2V0UGFyYW1zfSBwYXJhbXMgcGFyYW1ldGVycyB0byB1cGRhdGUuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byByZXF1ZXN0LlxuICAgKi9cbiAgc2V0TWV0YToge1xuICAgIHZhbHVlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcztcbiAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoVG9waWNGbmQucHJvdG90eXBlKS5zZXRNZXRhLmNhbGwodGhpcywgcGFyYW1zKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoT2JqZWN0LmtleXMoaW5zdGFuY2UuX2NvbnRhY3RzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgaW5zdGFuY2UuX2NvbnRhY3RzID0ge307XG4gICAgICAgICAgaWYgKGluc3RhbmNlLm9uU3Vic1VwZGF0ZWQpIHtcbiAgICAgICAgICAgIGluc3RhbmNlLm9uU3Vic1VwZGF0ZWQoW10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgZm91bmQgY29udGFjdHMuIElmIGNhbGxiYWNrIGlzIHVuZGVmaW5lZCwgdXNlIHtAbGluayB0aGlzLm9uTWV0YVN1Yn0uXG4gICAqIEBmdW5jdGlvblxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljRm5kI1xuICAgKiBAcGFyYW0ge1RvcGljRm5kLkNvbnRhY3RDYWxsYmFja30gY2FsbGJhY2sgLSBDYWxsYmFjayB0byBjYWxsIGZvciBlYWNoIGNvbnRhY3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gQ29udGV4dCB0byB1c2UgZm9yIGNhbGxpbmcgdGhlIGBjYWxsYmFja2AsIGkuZS4gdGhlIHZhbHVlIG9mIGB0aGlzYCBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuICAgKi9cbiAgY29udGFjdHM6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24oY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIGNvbnN0IGNiID0gKGNhbGxiYWNrIHx8IHRoaXMub25NZXRhU3ViKTtcbiAgICAgIGlmIChjYikge1xuICAgICAgICBmb3IgKGxldCBpZHggaW4gdGhpcy5fY29udGFjdHMpIHtcbiAgICAgICAgICBjYi5jYWxsKGNvbnRleHQsIHRoaXMuX2NvbnRhY3RzW2lkeF0sIGlkeCwgdGhpcy5fY29udGFjdHMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9XG59KTtcblRvcGljRm5kLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRvcGljRm5kO1xuXG4vKipcbiAqIEBjbGFzcyBMYXJnZUZpbGVIZWxwZXIgLSBjb2xsZWN0aW9uIG9mIHV0aWxpdGllcyBmb3IgdXBsb2FkaW5nIGFuZCBkb3dubG9hZGluZyBmaWxlc1xuICogb3V0IG9mIGJhbmQuIERvbid0IGluc3RhbnRpYXRlIHRoaXMgY2xhc3MgZGlyZWN0bHkuIFVzZSB7VGlub2RlLmdldExhcmdlRmlsZUhlbHBlcn0gaW5zdGVhZC5cbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqXG4gKiBAcGFyYW0ge1Rpbm9kZX0gdGlub2RlIC0gdGhlIG1haW4gVGlub2RlIG9iamVjdC5cbiAqL1xudmFyIExhcmdlRmlsZUhlbHBlciA9IGZ1bmN0aW9uKHRpbm9kZSkge1xuICB0aGlzLl90aW5vZGUgPSB0aW5vZGU7XG5cbiAgdGhpcy5fYXBpS2V5ID0gdGlub2RlLl9hcGlLZXk7XG4gIHRoaXMuX2F1dGhUb2tlbiA9IHRpbm9kZS5nZXRBdXRoVG9rZW4oKTtcbiAgdGhpcy5fbXNnSWQgPSB0aW5vZGUuZ2V0TmV4dFVuaXF1ZUlkKCk7XG4gIHRoaXMueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgLy8gUHJvbWlzZVxuICB0aGlzLnRvUmVzb2x2ZSA9IG51bGw7XG4gIHRoaXMudG9SZWplY3QgPSBudWxsO1xuXG4gIC8vIENhbGxiYWNrc1xuICB0aGlzLm9uUHJvZ3Jlc3MgPSBudWxsO1xuICB0aGlzLm9uU3VjY2VzcyA9IG51bGw7XG4gIHRoaXMub25GYWlsdXJlID0gbnVsbDtcbn1cblxuTGFyZ2VGaWxlSGVscGVyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIFN0YXJ0IHVwbG9hZGluZyB0aGUgZmlsZSB0byBhIG5vbi1kZWZhdWx0IGVuZHBvaW50LlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkxhcmdlRmlsZUhlbHBlciNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJhc2VVcmwgYWx0ZXJuYXRpdmUgYmFzZSBVUkwgb2YgdXBsb2FkIHNlcnZlci5cbiAgICogQHBhcmFtIHtGaWxlfEJsb2J9IGRhdGEgdG8gdXBsb2FkXG4gICAqIEBwYXJhbSB7Q2FsbGJhY2t9IG9uUHJvZ3Jlc3MgY2FsbGJhY2suIFRha2VzIG9uZSB7ZmxvYXR9IHBhcmFtZXRlciAwLi4xXG4gICAqIEBwYXJhbSB7Q2FsbGJhY2t9IG9uU3VjY2VzcyBjYWxsYmFjay4gQ2FsbGVkIHdoZW4gdGhlIGZpbGUgaXMgc3VjY2Vzc2Z1bGx5IHVwbG9hZGVkLlxuICAgKiBAcGFyYW0ge0NhbGxiYWNrfSBvbkZhaWx1cmUgY2FsbGJhY2suIENhbGxlZCBpbiBjYXNlIG9mIGEgZmFpbHVyZS5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHVwbG9hZCBpcyBjb21wbGV0ZWQvZmFpbGVkLlxuICAgKi9cbiAgdXBsb2FkV2l0aEJhc2VVcmw6IGZ1bmN0aW9uKGJhc2VVcmwsIGRhdGEsIG9uUHJvZ3Jlc3MsIG9uU3VjY2Vzcywgb25GYWlsdXJlKSB7XG4gICAgaWYgKCF0aGlzLl9hdXRoVG9rZW4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgYXV0aGVudGljYXRlIGZpcnN0XCIpO1xuICAgIH1cbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXM7XG5cbiAgICBsZXQgdXJsID0gJy92JyArIFBST1RPQ09MX1ZFUlNJT04gKyAnL2ZpbGUvdS8nO1xuICAgIGlmIChiYXNlVXJsKSB7XG4gICAgICBpZiAoYmFzZVVybC5pbmRleE9mKCdodHRwOi8vJykgPT0gMCB8fCBiYXNlVXJsLmluZGV4T2YoJ2h0dHBzOi8vJykgPT0gMCkge1xuICAgICAgICB1cmwgPSBiYXNlVXJsICsgdXJsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGJhc2UgVVJMICcke2Jhc2VVcmx9J2ApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnhoci5vcGVuKCdQT1NUJywgdXJsLCB0cnVlKTtcbiAgICB0aGlzLnhoci5zZXRSZXF1ZXN0SGVhZGVyKCdYLVRpbm9kZS1BUElLZXknLCB0aGlzLl9hcGlLZXkpO1xuICAgIHRoaXMueGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtVGlub2RlLUF1dGgnLCAnVG9rZW4gJyArIHRoaXMuX2F1dGhUb2tlbi50b2tlbik7XG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy50b1Jlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy50b1JlamVjdCA9IHJlamVjdDtcbiAgICB9KTtcblxuICAgIHRoaXMub25Qcm9ncmVzcyA9IG9uUHJvZ3Jlc3M7XG4gICAgdGhpcy5vblN1Y2Nlc3MgPSBvblN1Y2Nlc3M7XG4gICAgdGhpcy5vbkZhaWx1cmUgPSBvbkZhaWx1cmU7XG5cbiAgICB0aGlzLnhoci51cGxvYWQub25wcm9ncmVzcyA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlICYmIGluc3RhbmNlLm9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgaW5zdGFuY2Uub25Qcm9ncmVzcyhlLmxvYWRlZCAvIGUudG90YWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMueGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IHBrdDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHBrdCA9IEpTT04ucGFyc2UodGhpcy5yZXNwb25zZSwganNvblBhcnNlSGVscGVyKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpbnN0YW5jZS5fdGlub2RlLmxvZ2dlcihcIkVSUk9SOiBJbnZhbGlkIHNlcnZlciByZXNwb25zZSBpbiBMYXJnZUZpbGVIZWxwZXJcIiwgdGhpcy5yZXNwb25zZSk7XG4gICAgICAgIHBrdCA9IHtcbiAgICAgICAgICBjdHJsOiB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLnN0YXR1cyxcbiAgICAgICAgICAgIHRleHQ6IHRoaXMuc3RhdHVzVGV4dFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMCkge1xuICAgICAgICBpZiAoaW5zdGFuY2UudG9SZXNvbHZlKSB7XG4gICAgICAgICAgaW5zdGFuY2UudG9SZXNvbHZlKHBrdC5jdHJsLnBhcmFtcy51cmwpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnN0YW5jZS5vblN1Y2Nlc3MpIHtcbiAgICAgICAgICBpbnN0YW5jZS5vblN1Y2Nlc3MocGt0LmN0cmwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdHVzID49IDQwMCkge1xuICAgICAgICBpZiAoaW5zdGFuY2UudG9SZWplY3QpIHtcbiAgICAgICAgICBpbnN0YW5jZS50b1JlamVjdChuZXcgRXJyb3IoYCR7cGt0LmN0cmwudGV4dH0gKCR7cGt0LmN0cmwuY29kZX0pYCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnN0YW5jZS5vbkZhaWx1cmUpIHtcbiAgICAgICAgICBpbnN0YW5jZS5vbkZhaWx1cmUocGt0LmN0cmwpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluc3RhbmNlLl90aW5vZGUubG9nZ2VyKFwiRVJST1I6IFVuZXhwZWN0ZWQgc2VydmVyIHJlc3BvbnNlIHN0YXR1c1wiLCB0aGlzLnN0YXR1cywgdGhpcy5yZXNwb25zZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMueGhyLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoaW5zdGFuY2UudG9SZWplY3QpIHtcbiAgICAgICAgaW5zdGFuY2UudG9SZWplY3QobmV3IEVycm9yKFwiZmFpbGVkXCIpKTtcbiAgICAgIH1cbiAgICAgIGlmIChpbnN0YW5jZS5vbkZhaWx1cmUpIHtcbiAgICAgICAgaW5zdGFuY2Uub25GYWlsdXJlKG51bGwpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnhoci5vbmFib3J0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGluc3RhbmNlLnRvUmVqZWN0KSB7XG4gICAgICAgIGluc3RhbmNlLnRvUmVqZWN0KG5ldyBFcnJvcihcInVwbG9hZCBjYW5jZWxsZWQgYnkgdXNlclwiKSk7XG4gICAgICB9XG4gICAgICBpZiAoaW5zdGFuY2Uub25GYWlsdXJlKSB7XG4gICAgICAgIGluc3RhbmNlLm9uRmFpbHVyZShudWxsKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgIGZvcm0uYXBwZW5kKCdmaWxlJywgZGF0YSk7XG4gICAgICBmb3JtLnNldCgnaWQnLCB0aGlzLl9tc2dJZCk7XG4gICAgICB0aGlzLnhoci5zZW5kKGZvcm0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKHRoaXMudG9SZWplY3QpIHtcbiAgICAgICAgdGhpcy50b1JlamVjdChlcnIpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub25GYWlsdXJlKSB7XG4gICAgICAgIHRoaXMub25GYWlsdXJlKG51bGwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFN0YXJ0IHVwbG9hZGluZyB0aGUgZmlsZSB0byBkZWZhdWx0IGVuZHBvaW50LlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkxhcmdlRmlsZUhlbHBlciNcbiAgICpcbiAgICogQHBhcmFtIHtGaWxlfEJsb2J9IGRhdGEgdG8gdXBsb2FkXG4gICAqIEBwYXJhbSB7Q2FsbGJhY2t9IG9uUHJvZ3Jlc3MgY2FsbGJhY2suIFRha2VzIG9uZSB7ZmxvYXR9IHBhcmFtZXRlciAwLi4xXG4gICAqIEBwYXJhbSB7Q2FsbGJhY2t9IG9uU3VjY2VzcyBjYWxsYmFjay4gQ2FsbGVkIHdoZW4gdGhlIGZpbGUgaXMgc3VjY2Vzc2Z1bGx5IHVwbG9hZGVkLlxuICAgKiBAcGFyYW0ge0NhbGxiYWNrfSBvbkZhaWx1cmUgY2FsbGJhY2suIENhbGxlZCBpbiBjYXNlIG9mIGEgZmFpbHVyZS5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHVwbG9hZCBpcyBjb21wbGV0ZWQvZmFpbGVkLlxuICAgKi9cbiAgdXBsb2FkOiBmdW5jdGlvbihkYXRhLCBvblByb2dyZXNzLCBvblN1Y2Nlc3MsIG9uRmFpbHVyZSkge1xuICAgIHJldHVybiB0aGlzLnVwbG9hZFdpdGhCYXNlVXJsKHVuZGVmaW5lZCwgZGF0YSwgb25Qcm9ncmVzcywgb25TdWNjZXNzLCBvbkZhaWx1cmUpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBEb3dubG9hZCB0aGUgZmlsZSBmcm9tIGEgZ2l2ZW4gVVJMIHVzaW5nIEdFVCByZXF1ZXN0LiBUaGlzIG1ldGhvZCB3b3JrcyB3aXRoIHRoZSBUaW5vZGUgc2VydmVyIG9ubHkuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTGFyZ2VGaWxlSGVscGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVsYXRpdmVVcmwgLSBVUkwgdG8gZG93bmxvYWQgdGhlIGZpbGUgZnJvbS4gTXVzdCBiZSByZWxhdGl2ZSB1cmwsIGkuZS4gbXVzdCBub3QgY29udGFpbiB0aGUgaG9zdC5cbiAgICogQHBhcmFtIHtzdHJpbmc9fSBmaWxlbmFtZSAtIGZpbGUgbmFtZSB0byB1c2UgZm9yIHRoZSBkb3dubG9hZGVkIGZpbGUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBkb3dubG9hZCBpcyBjb21wbGV0ZWQvZmFpbGVkLlxuICAgKi9cbiAgZG93bmxvYWQ6IGZ1bmN0aW9uKHJlbGF0aXZlVXJsLCBmaWxlbmFtZSwgbWltZXR5cGUsIG9uUHJvZ3Jlc3MsIG9uRXJyb3IpIHtcbiAgICBpZiAoIVRpbm9kZS5pc1JlbGF0aXZlVVJMKHJlbGF0aXZlVXJsKSkge1xuICAgICAgLy8gQXMgYSBzZWN1cml0eSBtZWFzdXJlIHJlZnVzZSB0byBkb3dubG9hZCBmcm9tIGFuIGFic29sdXRlIFVSTC5cbiAgICAgIGlmIChvbkVycm9yKSB7XG4gICAgICAgIG9uRXJyb3IoYFRoZSBVUkwgJyR7cmVsYXRpdmVVcmx9JyBtdXN0IGJlIHJlbGF0aXZlLCBub3QgYWJzb2x1dGVgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9hdXRoVG9rZW4pIHtcbiAgICAgIGlmIChvbkVycm9yKSB7XG4gICAgICAgIG9uRXJyb3IoXCJNdXN0IGF1dGhlbnRpY2F0ZSBmaXJzdFwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzO1xuICAgIC8vIEdldCBkYXRhIGFzIGJsb2IgKHN0b3JlZCBieSB0aGUgYnJvd3NlciBhcyBhIHRlbXBvcmFyeSBmaWxlKS5cbiAgICB0aGlzLnhoci5vcGVuKCdHRVQnLCByZWxhdGl2ZVVybCwgdHJ1ZSk7XG4gICAgdGhpcy54aHIuc2V0UmVxdWVzdEhlYWRlcignWC1UaW5vZGUtQVBJS2V5JywgdGhpcy5fYXBpS2V5KTtcbiAgICB0aGlzLnhoci5zZXRSZXF1ZXN0SGVhZGVyKCdYLVRpbm9kZS1BdXRoJywgJ1Rva2VuICcgKyB0aGlzLl9hdXRoVG9rZW4udG9rZW4pO1xuICAgIHRoaXMueGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJztcblxuICAgIHRoaXMub25Qcm9ncmVzcyA9IG9uUHJvZ3Jlc3M7XG4gICAgdGhpcy54aHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChpbnN0YW5jZS5vblByb2dyZXNzKSB7XG4gICAgICAgIC8vIFBhc3NpbmcgZS5sb2FkZWQgaW5zdGVhZCBvZiBlLmxvYWRlZC9lLnRvdGFsIGJlY2F1c2UgZS50b3RhbFxuICAgICAgICAvLyBpcyBhbHdheXMgMCB3aXRoIGd6aXAgY29tcHJlc3Npb24gZW5hYmxlZCBieSB0aGUgc2VydmVyLlxuICAgICAgICBpbnN0YW5jZS5vblByb2dyZXNzKGUubG9hZGVkKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy50b1Jlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy50b1JlamVjdCA9IHJlamVjdDtcbiAgICB9KTtcblxuICAgIC8vIFRoZSBibG9iIG5lZWRzIHRvIGJlIHNhdmVkIGFzIGZpbGUuIFRoZXJlIGlzIG5vIGtub3duIHdheSB0b1xuICAgIC8vIHNhdmUgdGhlIGJsb2IgYXMgZmlsZSBvdGhlciB0aGFuIHRvIGZha2UgYSBjbGljayBvbiBhbiA8YSBocmVmLi4uIGRvd25sb2FkPS4uLj4uXG4gICAgdGhpcy54aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgIGNvbnN0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIC8vIFVSTC5jcmVhdGVPYmplY3RVUkwgaXMgbm90IGF2YWlsYWJsZSBpbiBub24tYnJvd3NlciBlbnZpcm9ubWVudC4gVGhpcyBjYWxsIHdpbGwgZmFpbC5cbiAgICAgICAgbGluay5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW3RoaXMucmVzcG9uc2VdLCB7XG4gICAgICAgICAgdHlwZTogbWltZXR5cGVcbiAgICAgICAgfSkpO1xuICAgICAgICBsaW5rLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGxpbmsuc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIGZpbGVuYW1lKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsaW5rKTtcbiAgICAgICAgbGluay5jbGljaygpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGxpbmspO1xuICAgICAgICB3aW5kb3cuVVJMLnJldm9rZU9iamVjdFVSTChsaW5rLmhyZWYpO1xuICAgICAgICBpZiAoaW5zdGFuY2UudG9SZXNvbHZlKSB7XG4gICAgICAgICAgaW5zdGFuY2UudG9SZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0dXMgPj0gNDAwICYmIGluc3RhbmNlLnRvUmVqZWN0KSB7XG4gICAgICAgIC8vIFRoZSB0aGlzLnJlc3BvbnNlVGV4dCBpcyB1bmRlZmluZWQsIG11c3QgdXNlIHRoaXMucmVzcG9uc2Ugd2hpY2ggaXMgYSBibG9iLlxuICAgICAgICAvLyBOZWVkIHRvIGNvbnZlcnQgdGhpcy5yZXNwb25zZSB0byBKU09OLiBUaGUgYmxvYiBjYW4gb25seSBiZSBhY2Nlc3NlZCBieSB0aGVcbiAgICAgICAgLy8gRmlsZVJlYWRlci5cbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwa3QgPSBKU09OLnBhcnNlKHRoaXMucmVzdWx0LCBqc29uUGFyc2VIZWxwZXIpO1xuICAgICAgICAgICAgaW5zdGFuY2UudG9SZWplY3QobmV3IEVycm9yKGAke3BrdC5jdHJsLnRleHR9ICgke3BrdC5jdHJsLmNvZGV9KWApKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGluc3RhbmNlLl90aW5vZGUubG9nZ2VyKFwiRVJST1I6IEludmFsaWQgc2VydmVyIHJlc3BvbnNlIGluIExhcmdlRmlsZUhlbHBlclwiLCB0aGlzLnJlc3VsdCk7XG4gICAgICAgICAgICBpbnN0YW5jZS50b1JlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQodGhpcy5yZXNwb25zZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMueGhyLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoaW5zdGFuY2UudG9SZWplY3QpIHtcbiAgICAgICAgaW5zdGFuY2UudG9SZWplY3QobmV3IEVycm9yKFwiZmFpbGVkXCIpKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy54aHIub25hYm9ydCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGluc3RhbmNlLnRvUmVqZWN0KSB7XG4gICAgICAgIGluc3RhbmNlLnRvUmVqZWN0KG51bGwpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy54aHIuc2VuZCgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKHRoaXMudG9SZWplY3QpIHtcbiAgICAgICAgdGhpcy50b1JlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRyeSB0byBjYW5jZWwgYW4gb25nb2luZyB1cGxvYWQgb3IgZG93bmxvYWQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTGFyZ2VGaWxlSGVscGVyI1xuICAgKi9cbiAgY2FuY2VsOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy54aHIgJiYgdGhpcy54aHIucmVhZHlTdGF0ZSA8IDQpIHtcbiAgICAgIHRoaXMueGhyLmFib3J0KCk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdW5pcXVlIGlkIG9mIHRoaXMgcmVxdWVzdC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5MYXJnZUZpbGVIZWxwZXIjXG4gICAqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IHVuaXF1ZSBpZFxuICAgKi9cbiAgZ2V0SWQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9tc2dJZDtcbiAgfVxufTtcblxuLyoqXG4gKiBAY2xhc3MgTWVzc2FnZSAtIGRlZmluaXRpb24gYSBjb21tdW5pY2F0aW9uIG1lc3NhZ2UuXG4gKiBXb3JrIGluIHByb2dyZXNzLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY18gLSBuYW1lIG9mIHRoZSB0b3BpYyB0aGUgbWVzc2FnZSBiZWxvbmdzIHRvLlxuICogQHBhcmFtIHtzdHJpbmcgfCBEcmFmdHl9IGNvbnRlbnRfIC0gbWVzc2FnZSBjb250YW50LlxuICovXG52YXIgTWVzc2FnZSA9IGZ1bmN0aW9uKHRvcGljXywgY29udGVudF8pIHtcbiAgdGhpcy5zdGF0dXMgPSBNZXNzYWdlLlNUQVRVU19OT05FO1xuICB0aGlzLnRvcGljID0gdG9waWNfO1xuICB0aGlzLmNvbnRlbnQgPSBjb250ZW50Xztcbn1cblxuTWVzc2FnZS5TVEFUVVNfTk9ORSA9IE1FU1NBR0VfU1RBVFVTX05PTkU7XG5NZXNzYWdlLlNUQVRVU19RVUVVRUQgPSBNRVNTQUdFX1NUQVRVU19RVUVVRUQ7XG5NZXNzYWdlLlNUQVRVU19TRU5ESU5HID0gTUVTU0FHRV9TVEFUVVNfU0VORElORztcbk1lc3NhZ2UuU1RBVFVTX0ZBSUxFRCA9IE1FU1NBR0VfU1RBVFVTX0ZBSUxFRDtcbk1lc3NhZ2UuU1RBVFVTX1NFTlQgPSBNRVNTQUdFX1NUQVRVU19TRU5UO1xuTWVzc2FnZS5TVEFUVVNfUkVDRUlWRUQgPSBNRVNTQUdFX1NUQVRVU19SRUNFSVZFRDtcbk1lc3NhZ2UuU1RBVFVTX1JFQUQgPSBNRVNTQUdFX1NUQVRVU19SRUFEO1xuTWVzc2FnZS5TVEFUVVNfVE9fTUUgPSBNRVNTQUdFX1NUQVRVU19UT19NRTtcblxuTWVzc2FnZS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBDb252ZXJ0IG1lc3NhZ2Ugb2JqZWN0IHRvIHtwdWJ9IHBhY2tldC5cbiAgICovXG4gIHRvSlNPTjogZnVuY3Rpb24oKSB7XG5cbiAgfSxcbiAgLyoqXG4gICAqIFBhcnNlIEpTT04gaW50byBtZXNzYWdlLlxuICAgKi9cbiAgZnJvbUpTT046IGZ1bmN0aW9uKGpzb24pIHtcblxuICB9XG59XG5NZXNzYWdlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1lc3NhZ2U7XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gVGlub2RlO1xuICBtb2R1bGUuZXhwb3J0cy5EcmFmdHkgPSBEcmFmdHk7XG4gIG1vZHVsZS5leHBvcnRzLkFjY2Vzc01vZGUgPSBBY2Nlc3NNb2RlO1xufVxuIiwibW9kdWxlLmV4cG9ydHM9e1widmVyc2lvblwiOiBcIjAuMTcuMFwifVxuIl19
