/**
 * @file Definition of 'me' topic.
 *
 * @copyright 2015-2023 Tinode LLC.
 */
'use strict';

import AccessMode from './access-mode.js';
import * as Const from './config.js';
import Topic from './topic.js';
import {
  mergeObj
} from './utils.js';

/**
 * @class TopicMe - special case of {@link Tinode.Topic} for
 * managing data of the current user, including contact list.
 * @extends Tinode.Topic
 * @memberof Tinode
 *
 * @param {TopicMe.Callbacks} callbacks - Callbacks to receive various events.
 */
export default class TopicMe extends Topic {
  onContactUpdate;

  constructor(callbacks) {
    super(Const.TOPIC_ME, callbacks);

    // me-specific callbacks
    if (callbacks) {
      this.onContactUpdate = callbacks.onContactUpdate;
    }
  }

  // Override the original Topic._processMetaDesc.
  _processMetaDesc(desc) {
    // Check if online contacts need to be turned off because P permission was removed.
    const turnOff = (desc.acs && !desc.acs.isPresencer()) && (this.acs && this.acs.isPresencer());

    // Copy parameters from desc object to this topic.
    mergeObj(this, desc);
    this._tinode._db.updTopic(this);
    // Update current user's record in the global cache.
    this._updateCachedUser(this._tinode._myUID, desc);

    // 'P' permission was removed. All topics are offline now.
    if (turnOff) {
      this._tinode.mapTopics((cont) => {
        if (cont.online) {
          cont.online = false;
          cont.seen = Object.assign(cont.seen || {}, {
            when: new Date()
          });
          this._refreshContact('off', cont);
        }
      });
    }

    if (this.onMetaDesc) {
      this.onMetaDesc(this);
    }
  }

  // Override the original Topic._processMetaSub
  _processMetaSub(subs) {
    let updateCount = 0;
    subs.forEach((sub) => {
      const topicName = sub.topic;
      // Don't show 'me' and 'fnd' topics in the list of contacts.
      if (topicName == Const.TOPIC_FND || topicName == Const.TOPIC_ME) {
        return;
      }
      sub.online = !!sub.online;

      let cont = null;
      if (sub.deleted) {
        cont = sub;
        this._tinode.cacheRemTopic(topicName);
        this._tinode._db.remTopic(topicName);
      } else {
        // Ensure the values are defined and are integers.
        if (typeof sub.seq != 'undefined') {
          sub.seq = sub.seq | 0;
          sub.recv = sub.recv | 0;
          sub.read = sub.read | 0;
          sub.unread = sub.seq - sub.read;
        }

        const topic = this._tinode.getTopic(topicName);
        if (topic._new) {
          delete topic._new;
        }

        cont = mergeObj(topic, sub);
        this._tinode._db.updTopic(cont);

        if (Topic.isP2PTopicName(topicName)) {
          this._cachePutUser(topicName, cont);
          this._tinode._db.updUser(topicName, cont.public);
        }
        // Notify topic of the update if it's an external update.
        if (!sub._noForwarding && topic) {
          sub._noForwarding = true;
          topic._processMetaDesc(sub);
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
  }

  // Called by Tinode when meta.sub is recived.
  _processMetaCreds(creds, upd) {
    if (creds.length == 1 && creds[0] == Const.DEL_CHAR) {
      creds = [];
    }
    if (upd) {
      creds.forEach((cr) => {
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
  }

  // Process presence change message
  _routePres(pres) {
    if (pres.what == 'term') {
      // The 'me' topic itself is detached. Mark as unsubscribed.
      this._resetSub();
      return;
    }

    if (pres.what == 'upd' && pres.src == Const.TOPIC_ME) {
      // Update to me's description. Request updated value.
      this.getMeta(this.startMetaQuery().withDesc().build());
      return;
    }

    const cont = this._tinode.cacheGetTopic(pres.src);
    if (cont) {
      switch (pres.what) {
        case 'on': // topic came online
          cont.online = true;
          break;
        case 'off': // topic went offline
          if (cont.online) {
            cont.online = false;
            cont.seen = Object.assign(cont.seen || {}, {
              when: new Date()
            });
          }
          break;
        case 'msg': // new message received
          cont._updateReceived(pres.seq, pres.act);
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
          if (!cont._deleted) {
            cont._deleted = true;
            cont._attached = false;
            this._tinode._db.markTopicAsDeleted(pres.src);
          } else {
            this._tinode._db.remTopic(pres.src);
          }
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
          dummy.topic = pres.src;
          dummy.online = false;
          dummy.acs = acs;
          this._tinode._db.updTopic(dummy);
        }
      } else if (pres.what == 'tags') {
        this.getMeta(this.startMetaQuery().withTags().build());
      }
    }

    if (this.onPres) {
      this.onPres(pres);
    }
  }

  // Contact is updated, execute callbacks.
  _refreshContact(what, cont) {
    if (this.onContactUpdate) {
      this.onContactUpdate(what, cont);
    }
  }

  /**
   * Publishing to TopicMe is not supported. {@link Topic#publish} is overriden and thows an {Error} if called.
   * @memberof Tinode.TopicMe#
   * @throws {Error} Always throws an error.
   */
  publish() {
    return Promise.reject(new Error("Publishing to 'me' is not supported"));
  }

  /**
   * Delete validation credential.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} topic - Name of the topic to delete
   * @param {string} user - User ID to remove.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delCredential(method, value) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot delete credential in inactive 'me' topic"));
    }
    // Send {del} message, return promise
    return this._tinode.delCredential(method, value).then(ctrl => {
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
  }

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
  contacts(callback, filter, context) {
    this._tinode.mapTopics((c, idx) => {
      if (c.isCommType() && (!filter || filter(c))) {
        callback.call(context, c, idx);
      }
    });
  }

  /**
   * Get a contact from cache.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} name - Name of the contact to get, either a UID (for p2p topics) or a topic name.
   * @returns {Tinode.Contact} - Contact or `undefined`.
   */
  getContact(name) {
    return this._tinode.cacheGetTopic(name);
  }

  /**
   * Get access mode of a given contact from cache.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} name - Name of the contact to get access mode for, either a UID (for p2p topics)
   *        or a topic name; if missing, access mode for the 'me' topic itself.
   * @returns {string} - access mode, such as `RWP`.
   */
  getAccessMode(name) {
    if (name) {
      const cont = this._tinode.cacheGetTopic(name);
      return cont ? cont.acs : null;
    }
    return this.acs;
  }

  /**
   * Check if contact is archived, i.e. contact.private.arch == true.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} name - Name of the contact to check archived status, either a UID (for p2p topics) or a topic name.
   * @returns {boolean} - true if contact is archived, false otherwise.
   */
  isArchived(name) {
    const cont = this._tinode.cacheGetTopic(name);
    return cont && cont.private && !!cont.private.arch;
  }

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
  getCredentials() {
    return this._credentials;
  }
}
