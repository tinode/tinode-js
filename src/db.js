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

const DB = function(onError) {
  // Account which owns currently open database.
  let account = null;
  // Placeholder DB which does nothing.
  let db = {
    transaction: function() {
      console.log("IndexedDB is not initialized");
      onError("not initialized");
      this.error = new Error("not initialized");
      const event = {
        target: {
          error: this.error
        }
      };
      return {
        commit: () => {},
        objectStore: () => {
          return {
            add: () => {
              if (this.onerror) {
                this.onerror(event);
              }
            },
            delete: () => {
              if (this.onerror) {
                this.onerror(event);
              }
            },
            put: () => {
              if (this.onerror) {
                this.onerror(event);
              }
            },
            getAll: () => {
              if (this.onerror) {
                this.onerror(event);
              }
            }
          };
        }
      };
    }
  };

  // Serializable topic fields.
  const topic_fields = ['created', 'updated', 'deleted', 'read', 'recv', 'seq', 'clear', 'defacs',
    'creds', 'public', 'private', 'touched'
  ];

  function serializeTopic(topic) {
    const res = {
      name: topic.name
    };
    topic_fields.forEach((f) => {
      if (topic.hasOwnProperty(f)) {
        res[f] = topic[f];
      }
    });
    if (Array.isArray(topic._tags)) {
      res.tags = topic._tags;
    }
    if (topic.acs) {
      res.acs = topic.getAccessMode().jsonHelper();
    }
    return res;
  }

  // Copy data from src to topic.
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

  function serializeUser(user) {
    return {};
  }

  function serializeMessage(topicName, msg) {
    // Serializable fields.
    const fields = ['topic', 'seq', 'ts', 'status', 'from', 'head', 'content'];
    const res = {};
    fields.forEach((f) => {
      if (msg.hasOwnProperty(f)) {
        res[f] = msg[f];
      }
    });
    return res;
  }

  return {
    /**
     * Open (and optionally create) indexedDB for the provided account.
     * @param {string} account - UID of the account which owns the database.
     * @returns {Promise} promise to be resolved/rejected when the DB is initialized.
     */
    initDatabase: function(account) {
      return new Promise((resolve, reject) => {
        // Open the database and initialize callbacks.
        const req = indexedDB.open(`tinode_${account}`, DB_VERSION);
        req.onerror = (event) => {
          console.log("Failed to initialize indexedDB", event);
          reject(event.target.error);
          if (onError) {
            onError(event.target.error);
          }
        };

        req.onsuccess = (event) => {
          db = event.target.result;
          resolve(db);
          console.log("Initialized indexedDB");
        };

        req.onupgradeneeded = function(event) {
          db = event.target.result;

          db.onerror = function(event) {
            console.log("Failed to create indexedDB storage", event);
            if (onError) {
              onError(event.target.error);
            }
          };

          // Object store (table) for topics. The primary key is topic name.
          db.createObjectStore('topic', {
            keyPath: 'name'
          });

          // Users object store. UID is the primary key.
          db.createObjectStore('user', {
            keyPath: 'uid'
          });

          // Messages object store. The primary key is topic name + seq.
          db.createObjectStore('message', {
            keyPath: ['topic', 'seq']
          });
        };
      });
    },

    /**
     * Delete currently open database.
     */
    deleteDatabase: function() {
      if (account) {
        indexedDB.deleteDatabase(`tinode_${account}`);
      }
    },
    // Topics.
    /**
     * Serialize topic and write to database.
     * @memberOf DB
     * @param {Topic} topic - topic to be added to persistent storage.
     * @returns {Promise} promise resolved/rejected on operation completion.
     */
    addTopic: function(topic) {
      console.log("DB.addTopic", topic.name);
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          reject(event.target.error);
        };
        trx.objectStore('topic').add(serializeTopic(topic));
        trx.commit();
      });
    },
    /**
     * Remove topic from the database.
     * @memberOf DB
     * @param {string} name - name of the topic to remove from database.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    remTopic: function(name) {
      console.log("DB.remTopic", name);
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic', 'message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          reject(event.target.error);
        };
        trx.objectStore('topic').delete(name);
        trx.objectStore('message').delete(IDBKeyRange.bound([name, 0], [name, Number.MAX_SAFE_INTEGER]));
        trx.commit();
      });
    },
    /**
     * Update stored topic.
     * @memberOf DB
     * @param {Topic} topic - topic to update.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    updTopic: function(topic) {
      console.log("DB.updTopic", topic.name);
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          reject(event.target.error);
        };
        trx.objectStore('topic').put(serializeTopic(topic));
        trx.commit();
      });
    },
    /**
     * Execute a callback for each stored topic.
     * @memberOf DB
     * @param {Function} callback - function to call for each topic.
     * @param {Object} context - the value or <code>this</code> inside the callback.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    mapTopics: function(callback, context) {
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic']);
        trx.onerror = (event) => {
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
    addUser: function(user) {
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['user'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          reject(event.target.error);
        };
        trx.objectStore('user').add(serializeUser(user));
        trx.commit();
      });
    },
    remUser: function(uid) {
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['user'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          reject(event.target.error);
        };
        trx.objectStore('user').delete(uid);
        trx.commit();
      });
    },

    // Messages.
    addMessage: function(topic, msg) {
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          reject(event.target.error);
        };
        trx.objectStore('message').add(serializeMessage(topic, msg));
        trx.commit();
      });
    },

    updMessage: function(topic, msg) {
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          reject(event.target.error);
        };
        trx.objectStore('message').put(serializeMessage(topic, msg));
        trx.commit();
      });
    },

    remMessage: function(topic, seq) {
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          reject(event.target.error);
        };
        trx.objectStore('message').delete([topic, seq]);
        trx.commit();
      });
    },

    getMessages: function(topic, from, to, context) {
      const range = IDBKeyRange.bound([topic, from], [topic, to]);
      db.transaction(['message']).objectStore('message').getAll(range).onsuccess = (event) => {
        callback.call(context, event.target.result);
      };
    },
  };
}

if (typeof module != 'undefined') {
  module.exports = DB;
}
