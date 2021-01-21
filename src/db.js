/**
 * @file Helper methods for dealing with IndexedDB cache of messages, users, and topics.
 * See <a href="https://github.com/tinode/webapp">https://github.com/tinode/webapp</a> for real-life usage.
 *
 * @copyright 2015-2021 Tinode
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.16
 */
'use strict';

const DB_VERSION = 1;

const DB = function(myUID, onError) {
  const account = myUID;
  let db;
  // Open the database and initialize callbacks.
  const req = window.indexedDB.open(`tinode_${account}`, DB_VERSION);

  req.onerror = function(event) {
    console.log("Failed to initialize indexedDB", event);
    if (onError) {
      onError(event);
    }
  };

  req.onsuccess = function(event) {
    db = event.target.result;
    console.log("Initialized indexedDB");
  };

  req.onupgradeneeded = function(event) {
    db = event.target.result;

    db.onerror = function(event) {
      console.log("Failed to create indexedDB storage", event);
      if (onError) {
        onError(event);
      }
    };

    // Object store (table) for topics. The primary key is topic name.
    db.createObjectStore("topic", {
      keyPath: "name"
    });

    // Users object store. UID is the primary key.
    db.createObjectStore("user", {
      keyPath: "uid"
    });

    // Messages object store. The primary key is topic name + seq.
    db.createObjectStore("message", {
      keyPath: "name_seq"
    });
  };

  function serializeTopic(topic) {
    // Serializable fields.
    const fields = ['name', 'created', 'updated', 'deleted', 'read', 'recv', 'seq', 'clear', 'defacs',
      'creds', 'public', 'private', 'touched'
    ];
    const res = {};
    fields.forEach((f) => {
      if (topic.hasOwnProperty(f)) {
        res[f] = topic[f];
      }
    });
    if (Array.isArray(topic._tags)) {
      res.tags = topic._tags;
    }
    if (topic.acs) {
      res.acs = topic.acs.jsonHelper();
    }
    return res;
  }

  function serializeUser(user) {
    return {};
  }

  function serializeMessage(topicName, msg) {
    // Serializable fields.
    const fields = ['topic', 'seq', 'ts', 'status', 'from', 'head', 'content'];
    const res = { name_seq: `${topicName}_${msg.seq}` };
    fields.forEach((f) => {
      if (msg.hasOwnProperty(f)) {
        res[f] = msg[f];
      }
    });
    return res;
  }

  return {
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
     */
    addTopic: function(topic) {
      db.transaction(["topic"], "readwrite").objectStore("topic").add(serializeTopic(topic));
    },
    /**
     * Remove topic from the database.
     */
    remTopic: function(name) {
      db.transaction(["topic"], "readwrite").objectStore("topic").delete(name);
    },
    /**
     * Update stored topic.
     */
    updTopic: function(topic) {
      db.transaction(["topic"], "readwrite").objectStore("topic").put(serializeTopic(topic));
    },
    /**
     * Execute a callback for each stored topic.
     */
    mapTopics: function(callback, context) {
      db.transaction(["topic"]).objectStore("topic").getAll().onsuccess = (event) => {
        callback.call(context, event.target.result);
      };
    },

    // Users.
    addUser: function(user) {
      db.transaction(["user"], "readwrite").objectStore("user").add(serializeUser(user));
    },
    remUser: function(uid) {
      db.transaction(["user"], "readwrite").objectStore("user").delete(uid);
    },

    // Messages.
    addMessage: function(topic, msg) {
      db.transaction(["message"], "readwrite").objectStore("message").add(serializeMessage(topic, msg));
    },
    remMessage: function(topic, seq) {
      db.transaction(["message"], "readwrite").objectStore("message").delete(`${topic}_${seq}`);
    },
    getMessages: function(topic, from, to) {},
  };
}

if (typeof module != 'undefined') {
  module.exports = DB;
}
