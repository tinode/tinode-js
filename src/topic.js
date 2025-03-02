/**
 * @file Topic management.
 *
 * @copyright 2015-2023 Tinode LLC.
 */
'use strict';

import AccessMode from './access-mode.js';
import CBuffer from './cbuffer.js';
import CommError from './comm-error.js';
import * as Const from './config.js';
import Drafty from './drafty.js';
import MetaGetBuilder from './meta-builder.js';
import {
  listToRanges,
  mergeObj,
  mergeToCache,
  normalizeArray,
  normalizeRanges
} from './utils.js';

/**
 * Topic is a class representing a logical communication channel.
 */
export default class Topic {
  /**
   * @callback onData
   * @param {Data} data - Data packet
   */

  /**
   * Create topic.
   * @param {string} name - Name of the topic to create.
   * @param {Object=} callbacks - Object with various event callbacks.
   * @param {onData} callbacks.onData - Callback which receives a <code>{data}</code> message.
   * @param {callback} callbacks.onMeta - Callback which receives a <code>{meta}</code> message.
   * @param {callback} callbacks.onPres - Callback which receives a <code>{pres}</code> message.
   * @param {callback} callbacks.onInfo - Callback which receives an <code>{info}</code> message.
   * @param {callback} callbacks.onMetaDesc - Callback which receives changes to topic desctioption {@link desc}.
   * @param {callback} callbacks.onMetaSub - Called for a single subscription record change.
   * @param {callback} callbacks.onSubsUpdated - Called after a batch of subscription changes have been recieved and cached.
   * @param {callback} callbacks.onDeleteTopic - Called after the topic is deleted.
   * @param {callback} callbacls.onAllMessagesReceived - Called when all requested <code>{data}</code> messages have been recived.
   */
  constructor(name, callbacks) {
    // Parent Tinode object.
    this._tinode = null;

    // Server-provided data, locally immutable.
    // topic name
    this.name = name;
    // Timestamp when the topic was created.
    this.created = null;
    // Timestamp when the topic was last updated.
    this.updated = null;
    // Timestamp of the last messages
    this.touched = new Date(0);
    // Access mode, see AccessMode
    this.acs = new AccessMode(null);
    // Per-topic private data (accessible by current user only).
    this.private = null;
    // Per-topic public data (accessible by all users).
    this.public = null;
    // Per-topic system-provided data (accessible by all users).
    this.trusted = null;

    // Locally cached data
    // Subscribed users, for tracking read/recv/msg notifications.
    this._users = {};

    // Current value of locally issued seqId, used for pending messages.
    this._queuedSeqId = Const.LOCAL_SEQID;

    // The maximum known {data.seq} value.
    this._maxSeq = 0;
    // The minimum known {data.seq} value.
    this._minSeq = 0;
    // Indicator that the last request for earlier messages returned 0.
    this._noEarlierMsgs = false;
    // The maximum known deletion ID.
    this._maxDel = 0;
    // Timer object used to send 'recv' notifications.
    this._recvNotificationTimer = null;

    // User discovery tags
    this._tags = [];
    // Credentials such as email or phone number.
    this._credentials = [];
    // Auxiliary data
    this._aux = {};

    // Message versions cache (e.g. for edited messages).
    // Keys: original message seq ID.
    // Values: CBuffers containing newer versions of the original message
    // ordered by seq id.
    this._messageVersions = {};
    // Message cache, sorted by message seq values, from old to new.
    this._messages = new CBuffer((a, b) => {
      return a.seq - b.seq;
    }, true);
    // Boolean, true if the topic is currently live
    this._attached = false;
    // Timestap of the most recently updated subscription.
    this._lastSubsUpdate = new Date(0);
    // Topic created but not yet synced with the server. Used only during initialization.
    this._new = true;
    // The topic is deleted at the server, this is a local copy.
    this._deleted = false;

    // Timer used to trgger {leave} request after a delay.
    this._delayedLeaveTimer = null;

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
      this.onAuxUpdated = callbacks.onAuxUpdated;
      this.onDeleteTopic = callbacks.onDeleteTopic;
      this.onAllMessagesReceived = callbacks.onAllMessagesReceived;
    }
  }

  // Static methods.

  /**
   * Determine topic type from topic's name: grp, p2p, me, fnd, sys.
   *
   * @param {string} name - Name of the topic to test.
   * @returns {string} One of <code>"me"</code>, <code>"fnd"</code>, <code>"sys"</code>, <code>"grp"</code>,
   *    <code>"p2p"</code> or <code>undefined</code>.
   */
  static topicType(name) {
    const types = {
      'me': Const.TOPIC_ME,
      'fnd': Const.TOPIC_FND,
      'grp': Const.TOPIC_GRP,
      'new': Const.TOPIC_GRP,
      'nch': Const.TOPIC_GRP,
      'chn': Const.TOPIC_GRP,
      'usr': Const.TOPIC_P2P,
      'sys': Const.TOPIC_SYS,
      'slf': Const.TOPIC_SLF
    };
    return types[(typeof name == 'string') ? name.substring(0, 3) : 'xxx'];
  }

  /**
   * Check if the given topic name is a name of a 'me' topic.
   *
   * @param {string} name - Name of the topic to test.
   * @returns {boolean} <code>true</code> if the name is a name of a 'me' topic, <code>false</code> otherwise.
   */
  static isMeTopicName(name) {
    return Topic.topicType(name) == Const.TOPIC_ME;
  }

  /**
   * Check if the given topic name is a name of a 'slf' topic.
   *
   * @param {string} name - Name of the topic to test.
   * @returns {boolean} <code>true</code> if the name is a name of a 'slf' topic, <code>false</code> otherwise.
   */
  static isSelfTopicName(name) {
    return Topic.topicType(name) == Const.TOPIC_SLF;
  }

  /**
   * Check if the given topic name is a name of a group topic.
   * @static
   *
   * @param {string} name - Name of the topic to test.
   * @returns {boolean} <code>true</code> if the name is a name of a group topic, <code>false</code> otherwise.
   */
  static isGroupTopicName(name) {
    return Topic.topicType(name) == Const.TOPIC_GRP;
  }

  /**
   * Check if the given topic name is a name of a p2p topic.
   * @static
   *
   * @param {string} name - Name of the topic to test.
   * @returns {boolean} <code>true</code> if the name is a name of a p2p topic, <code>false</code> otherwise.
   */
  static isP2PTopicName(name) {
    return Topic.topicType(name) == Const.TOPIC_P2P;
  }

  /**
   * Check if the given topic name is a name of a communication topic, i.e. P2P or group.
   * @static
   *
   * @param {string} name - Name of the topic to test.
   * @returns {boolean} <code>true</code> if the name is a name of a p2p or group topic, <code>false</code> otherwise.
   */
  static isCommTopicName(name) {
    return Topic.isP2PTopicName(name) || Topic.isGroupTopicName(name) || Topic.isSelfTopicName(name);
  }

  /**
   * Check if the topic name is a name of a new topic.
   * @static
   *
   * @param {string} name - topic name to check.
   * @returns {boolean} <code>true</code> if the name is a name of a new topic, <code>false</code> otherwise.
   */
  static isNewGroupTopicName(name) {
    return (typeof name == 'string') &&
      (name.substring(0, 3) == Const.TOPIC_NEW || name.substring(0, 3) == Const.TOPIC_NEW_CHAN);
  }

  /**
   * Check if the topic name is a name of a channel.
   * @static
   *
   * @param {string} name - topic name to check.
   * @returns {boolean} <code>true</code> if the name is a name of a channel, <code>false</code> otherwise.
   */
  static isChannelTopicName(name) {
    return (typeof name == 'string') &&
      (name.substring(0, 3) == Const.TOPIC_CHAN || name.substring(0, 3) == Const.TOPIC_NEW_CHAN);
  }

  // Returns true if pub is meant to replace another message (e.g. original message was edited).
  static #isReplacementMsg(pub) {
    return pub.head && pub.head.replace;
  }

  /**
   * Check if the topic is subscribed.
   * @returns {boolean} True is topic is attached/subscribed, false otherwise.
   */
  isSubscribed() {
    return this._attached;
  }

  /**
   * Request topic to subscribe. Wrapper for {@link Tinode#subscribe}.
   *
   * @param {Tinode.GetQuery=} getParams - get query parameters.
   * @param {Tinode.SetParams=} setParams - set parameters.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  subscribe(getParams, setParams) {
    // Clear request to leave topic.
    clearTimeout(this._delayedLeaveTimer);
    this._delayedLeaveTimer = null;

    // If the topic is already subscribed, return resolved promise
    if (this._attached) {
      return Promise.resolve(this);
    }

    // Send subscribe message, handle async response.
    // If topic name is explicitly provided, use it. If no name, then it's a new group topic,
    // use "new".
    return this._tinode.subscribe(this.name || Const.TOPIC_NEW, getParams, setParams).then(ctrl => {
      if (ctrl.code >= 300) {
        // Do nothing if subscription status has not changed.
        return ctrl;
      }

      this._attached = true;
      this._deleted = false;
      this.acs = (ctrl.params && ctrl.params.acs) ? ctrl.params.acs : this.acs;

      // Set topic name for new topics and add it to cache.
      if (this._new) {
        delete this._new;

        if (this.name != ctrl.topic) {
          // Name may change new123456 -> grpAbCdEf. Remove from cache under the old name.
          this._cacheDelSelf();
          this.name = ctrl.topic;
        }
        this._cachePutSelf();

        this.created = ctrl.ts;
        this.updated = ctrl.ts;

        if (this.name != Const.TOPIC_ME && this.name != Const.TOPIC_FND) {
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
  }

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
  createMessage(data, noEcho) {
    return this._tinode.createMessage(this.name, data, noEcho);
  }

  /**
   * Immediately publish data to topic. Wrapper for {@link Tinode#publish}.
   * @memberof Tinode.Topic#
   *
   * @param {string | Object} data - Message to publish, either plain string or a Drafty object.
   * @param {boolean=} noEcho - If <code>true</code> server will not echo message back to originating
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  publish(data, noEcho) {
    return this.publishMessage(this.createMessage(data, noEcho));
  }

  /**
   * Publish message created by {@link Tinode.Topic#createMessage}.
   * @memberof Tinode.Topic#
   *
   * @param {Object} pub - {data} object to publish. Must be created by {@link Tinode.Topic#createMessage}
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  publishMessage(pub) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot publish on inactive topic"));
    }
    if (this._sending) {
      return Promise.reject(new Error("The message is already being sent"));
    }

    // Send data.
    pub._sending = true;
    pub._failed = false;

    // Extract refereces to attachments and out of band image records.
    let attachments = null;
    if (Drafty.hasEntities(pub.content)) {
      attachments = [];
      Drafty.entities(pub.content, data => {
        if (data) {
          if (data.ref) {
            attachments.push(data.ref);
          }
          if (data.preref) {
            attachments.push(data.preref);
          }
        }
      });
      if (attachments.length == 0) {
        attachments = null;
      }
    }

    return this._tinode.publishMessage(pub, attachments).then(ctrl => {
      pub._sending = false;
      pub.ts = ctrl.ts;
      this.swapMessageId(pub, ctrl.params.seq);
      this._maybeUpdateMessageVersionsCache(pub);
      this._routeData(pub);
      return ctrl;
    }).catch(err => {
      this._tinode.logger("WARNING: Message rejected by the server", err);
      pub._sending = false;
      pub._failed = true;
      if (this.onData) {
        this.onData();
      }
    });
  }

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
  publishDraft(pub, prom) {
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
    return (prom || Promise.resolve())
      .then(_ => {
        if (pub._cancelled) {
          return {
            code: 300,
            text: "cancelled"
          };
        }
        return this.publishMessage(pub);
      }).catch(err => {
        this._tinode.logger("WARNING: Message draft rejected", err);
        pub._sending = false;
        pub._failed = true;
        pub._fatal = err instanceof CommError ? (err.code >= 400 && err.code < 500) : false;
        if (this.onData) {
          this.onData();
        }
        // Rethrow to let caller know that the operation failed.
        throw err;
      });
  }

  /**
   * Leave the topic, optionally unsibscribe. Leaving the topic means the topic will stop
   * receiving updates from the server. Unsubscribing will terminate user's relationship with the topic.
   * Wrapper for {@link Tinode#leave}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean=} unsub - If true, unsubscribe, otherwise just leave.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  leave(unsub) {
    // It's possible to unsubscribe (unsub==true) from inactive topic.
    if (!this._attached && !unsub) {
      return Promise.reject(new Error("Cannot leave inactive topic"));
    }

    // Send a 'leave' message, handle async response
    return this._tinode.leave(this.name, unsub).then(ctrl => {
      this._resetSub();
      if (unsub) {
        this._gone();
      }
      return ctrl;
    });
  }

  /**
   * Leave the topic, optionally unsibscribe after a delay. Leaving the topic means the topic will stop
   * receiving updates from the server. Unsubscribing will terminate user's relationship with the topic.
   * Wrapper for {@link Tinode#leave}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} unsub - If true, unsubscribe, otherwise just leave.
   * @param {number} delay - time in milliseconds to delay leave request.
   */
  leaveDelayed(unsub, delay) {
    clearTimeout(this._delayedLeaveTimer);
    this._delayedLeaveTimer = setTimeout(_ => {
      this._delayedLeaveTimer = null;
      this.leave(unsub)
    }, delay);
  }

  /**
   * Request topic metadata from the local cache or from the server.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.GetQuery} request parameters
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  getMeta(params) {
    // Send {get} message, return promise.
    return this._tinode.getMeta(this.name, params);
  }

  /**
   * Request more messages from the server. The goal is to load continous range of messages
   * covering at least between 'min' and 'max' + one full page forward (newer = true) or backwards
   * (newer=false).
   * @memberof Tinode.Topic#
   *
   * @param {number} limit number of messages to get.
   * @param {Array.<Range>} gaps - ranges of messages to load.
   * @param {number} min if non-negative, request newer messages with seq >= min.
   * @param {number} max if positive, request older messages with seq < max.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  getMessagesPage(limit, gaps, min, max, newer) {
    let query = gaps ?
      this.startMetaQuery().withDataRanges(gaps, limit) :
      newer ?
      this.startMetaQuery().withData(min, undefined, limit) :
      this.startMetaQuery().withData(undefined, max, limit);
    // First try fetching from DB, then from the server.
    return this._loadMessages(this._tinode._db, query.extract('data'))
      .then(count => {
        // Recalculate missing ranges.
        gaps = this.msgHasMoreMessages(min, max, newer);
        if (gaps.length == 0) {
          // All messages loaded.
          return Promise.resolve({
            topic: this.name,
            code: 200,
            params: {
              count: count
            }
          });
        }

        // Reduce the count of requested messages.
        limit -= count;
        // Update query with new values loaded from DB.
        query = this.startMetaQuery().withDataRanges(gaps, limit);
        return this.getMeta(query.build());
      });
  }

  /**
   * Request to get pinned messages from the local cache or from the server.
   * @memberof Tinode.Topic#
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  getPinnedMessages() {
    const pins = this.aux('pins');
    if (!Array.isArray(pins)) {
      return Promise.resolve(0);
    }

    const loaded = [];
    let remains = pins;
    // First try fetching from DB, then check deleted log, then ask the server.
    return this._tinode._db.readMessages(this.name, {
        ranges: listToRanges(remains)
      })
      .then(msgs => {
        msgs.forEach(data => {
          // The 'data' could be undefined.
          if (data) {
            loaded.push(data.seq);
            this._messages.put(data);
            this._maybeUpdateMessageVersionsCache(data);
          }
        });
        if (loaded.length < pins.length) {
          // Some messages are missing, try dellog.
          remains = pins.filter(seq => !loaded.includes(seq));
          return this._tinode._db.readMessages(this.name, {
            ranges: listToRanges(remains)
          });
        }
        return null;
      })
      .then(ranges => {
        if (ranges) {
          // Found some deleted ranges in dellog.
          remains.forEach(seq => {
            if (ranges.find(r => r.low <= seq && r.hi > seq)) {
              loaded.push(seq);
            }
          });
        }
        if (loaded.length == pins.length) {
          // Got all pinned messages from the local cache.
          return Promise.resolve({
            topic: this.name,
            code: 200,
            params: {
              count: loaded.length
            }
          });
        }

        remains = pins.filter(seq => !loaded.includes(seq));
        return this.getMeta(this.startMetaQuery().withDataList(remains).build());
      });
  }

  /**
   * Update topic metadata.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.SetParams} params parameters to update.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  setMeta(params) {
    if (params.tags) {
      params.tags = normalizeArray(params.tags);
    }
    // Send Set message, handle async response.
    return this._tinode.setMeta(this.name, params)
      .then(ctrl => {
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
            // Assign user ID otherwise the update will be ignored by _processMetaSubs.
            params.sub.user = this._tinode.getCurrentUserID();
            if (!params.desc) {
              // Force update to topic's asc.
              params.desc = {};
            }
          }
          params.sub._noForwarding = true;
          this._processMetaSubs([params.sub]);
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
        if (params.aux) {
          this._processMetaAux(params.aux);
        }

        return ctrl;
      });
  }
  /**
   * Update access mode of the current user or of another topic subsriber.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - UID of the user to update or null to update current user.
   * @param {string} update - the update value, full or delta.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  updateMode(uid, update) {
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
  }
  /**
   * Create new topic subscription. Wrapper for {@link Tinode#setMeta}.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - ID of the user to invite
   * @param {string=} mode - Access mode. <code>null</code> means to use default.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  invite(uid, mode) {
    return this.setMeta({
      sub: {
        user: uid,
        mode: mode
      }
    });
  }
  /**
   * Archive or un-archive the topic. Wrapper for {@link Tinode#setMeta}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} arch - true to archive the topic, false otherwise.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  archive(arch) {
    if (this.private && (!this.private.arch == !arch)) {
      return Promise.resolve(arch);
    }
    return this.setMeta({
      desc: {
        private: {
          arch: arch ? true : Const.DEL_CHAR
        }
      }
    });
  }
  /**
   * Set message as pinned or unpinned by adding it to aux.pins array. Wrapper for {@link Tinode#setMeta}.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - seq ID of the message to pin or un-pin.
   * @param {boolean} pin - true to pin the message, false to un-pin.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  pinMessage(seq, pin) {
    let pinned = this.aux('pins');
    if (!Array.isArray(pinned)) {
      pinned = [];
    }
    let changed = false;
    if (pin) {
      if (!pinned.includes(seq)) {
        changed = true;
        if (pinned.length == Const.MAX_PINNED_COUNT) {
          pinned.shift();
        }
        pinned.push(seq);
      }
    } else {
      if (pinned.includes(seq)) {
        changed = true;
        pinned = pinned.filter(id => id != seq);
        if (pinned.length == 0) {
          pinned = Const.DEL_CHAR;
        }
      }
    }
    if (changed) {
      return this.setMeta({
        aux: {
          pins: pinned
        }
      });
    }
    return Promise.resolve();
  }
  /**
   * Delete messages. Hard-deleting messages requires Deleter (D) permission.
   * Wrapper for {@link Tinode#delMessages}.
   * @memberof Tinode.Topic#
   *
   * @param {Array.<Tinode.SeqRange>} ranges - Ranges of message IDs to delete.
   * @param {boolean=} hard - Hard or soft delete
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delMessages(ranges, hard) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot delete messages in inactive topic"));
    }

    const tosend = normalizeRanges(ranges, this._maxSeq)

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
    return result.then(ctrl => {
      if (ctrl.params.del > this._maxDel) {
        this._maxDel = Math.max(ctrl.params.del, this._maxDel);
        this.clear = Math.max(ctrl.params.del, this.clear);
      }

      ranges.forEach(rec => {
        if (rec.hi) {
          this.flushMessageRange(rec.low, rec.hi);
        } else {
          this.flushMessage(rec.low);
        }
        this._messages.put({
          seq: rec.low,
          low: rec.low,
          hi: rec.hi,
          _deleted: true
        });
      });

      // Make a record.
      this._tinode._db.addDelLog(this.name, ctrl.params.del, ranges);

      if (this.onData) {
        // Calling with no parameters to indicate the messages were deleted.
        this.onData();
      }
      return ctrl;
    });
  }
  /**
   * Delete all messages. Hard-deleting messages requires Deleter permission.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} hardDel - true if messages should be hard-deleted.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delMessagesAll(hardDel) {
    if (!this._maxSeq || this._maxSeq <= 0) {
      // There are no messages to delete.
      return Promise.resolve();
    }
    return this.delMessages([{
      low: 1,
      hi: this._maxSeq + 1,
      _all: true
    }], hardDel);
  }

  /**
   * Delete multiple messages defined by their IDs. Hard-deleting messages requires Deleter permission.
   * @memberof Tinode.Topic#
   *
   * @param {Array.<number>} list - list of seq IDs to delete.
   * @param {boolean=} hardDel - true if messages should be hard-deleted.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delMessagesList(list, hardDel) {
    // Send {del} message, return promise
    return this.delMessages(listToRanges(list), hardDel);
  }

  /**
   * Delete original message and edited variants. Hard-deleting messages requires Deleter permission.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - original seq ID of the message to delete.
   * @param {boolean=} hardDel - true if messages should be hard-deleted.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  delMessagesEdits(seq, hardDel) {
    const list = [seq];
    this.messageVersions(seq, msg => list.push(msg.seq));
    // Send {del} message, return promise
    return this.delMessagesList(list, hardDel);
  }

  /**
   * Delete topic. Requires Owner permission. Wrapper for {@link Tinode#delTopic}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} hard - had-delete topic.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  delTopic(hard) {
    if (this._deleted) {
      // The topic is already deleted at the server, just remove from DB.
      this._gone();
      return Promise.resolve(null);
    }

    return this._tinode.delTopic(this.name, hard).then(ctrl => {
      this._deleted = true;
      this._resetSub();
      this._gone();
      return ctrl;
    });
  }
  /**
   * Delete subscription. Requires Share permission. Wrapper for {@link Tinode#delSubscription}.
   * @memberof Tinode.Topic#
   *
   * @param {string} user - ID of the user to remove subscription for.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delSubscription(user) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot delete subscription in inactive topic"));
    }
    // Send {del} message, return promise
    return this._tinode.delSubscription(this.name, user).then(ctrl => {
      // Remove the object from the subscription cache;
      delete this._users[user];
      // Notify listeners
      if (this.onSubsUpdated) {
        this.onSubsUpdated(Object.keys(this._users));
      }
      return ctrl;
    });
  }
  /**
   * Send a read/recv notification.
   * @memberof Tinode.Topic#
   *
   * @param {string} what - what notification to send: <code>recv</code>, <code>read</code>.
   * @param {number} seq - ID or the message read or received.
   */
  note(what, seq) {
    if (!this._attached) {
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
      this._updateMyReadRecv(what, seq);

      if (this.acs != null && !this.acs.isMuted()) {
        const me = this._tinode.getMeTopic();
        // Sent a notification to 'me' listeners.
        me._refreshContact(what, this);
      }
    }
  }

  /**
   * Send a 'recv' receipt. Wrapper for {@link Tinode#noteRecv}.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - ID of the message to aknowledge.
   */
  noteRecv(seq) {
    this.note('recv', seq);
  }
  /**
   * Send a 'read' receipt. Wrapper for {@link Tinode#noteRead}.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - ID of the message to aknowledge or 0/undefined to acknowledge the latest messages.
   */
  noteRead(seq) {
    seq = seq || this._maxSeq;
    if (seq > 0) {
      this.note('read', seq);
    }
  }
  /**
   * Send a key-press notification. Wrapper for {@link Tinode#noteKeyPress}.
   * @memberof Tinode.Topic#
   */
  noteKeyPress() {
    if (this._attached) {
      this._tinode.noteKeyPress(this.name);
    } else {
      this._tinode.logger("INFO: Cannot send notification in inactive topic");
    }
  }
  /**
   * Send a notification than a video or audio message is . Wrapper for {@link Tinode#noteKeyPress}.
   * @memberof Tinode.Topic#
   * @param audioOnly - true if the recording is audio-only, false if it's a video recording.
   */
  noteRecording(audioOnly) {
    if (this._attached) {
      this._tinode.noteKeyPress(this.name, audioOnly ? 'kpa' : 'kpv');
    } else {
      this._tinode.logger("INFO: Cannot send notification in inactive topic");
    }
  }

  /**
   * Send a {note what='call'}. Wrapper for {@link Tinode#videoCall}.
   * @memberof Tinode#
   *
   * @param {string} evt - Call event.
   * @param {int} seq - ID of the call message the event pertains to.
   * @param {string} payload - Payload associated with this event (e.g. SDP string).
   *
   * @returns {Promise} Promise (for some call events) which will
   *                    be resolved/rejected on receiving server reply
   */
  videoCall(evt, seq, payload) {
    if (!this._attached && !['ringing', 'hang-up'].includes(evt)) {
      // Cannot {call} on an inactive topic".
      return;
    }
    return this._tinode.videoCall(this.name, seq, evt, payload);
  }

  // Update cached read/recv/unread counts for the current user.
  _updateMyReadRecv(what, seq, ts) {
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
  }
  /**
   * Get user description from global cache. The user does not need to be a
   * subscriber of this topic.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - ID of the user to fetch.
   * @return {Object} user description or undefined.
   */
  userDesc(uid) {
    // TODO: handle asynchronous requests
    const user = this._cacheGetUser(uid);
    if (user) {
      return user; // Promise.resolve(user)
    }
  }
  /**
   * Get description of the p2p peer from subscription cache.
   * @memberof Tinode.Topic#
   *
   * @return {Object} peer's description or undefined.
   */
  p2pPeerDesc() {
    if (!this.isP2PType()) {
      return undefined;
    }
    return this._users[this.name];
  }
  /**
   * Iterate over cached subscribers. If callback is undefined, use this.onMetaSub.
   * @memberof Tinode.Topic#
   *
   * @param {function} callback - Callback which will receive subscribers one by one.
   * @param {Object=} context - Value of `this` inside the `callback`.
   */
  subscribers(callback, context) {
    const cb = (callback || this.onMetaSub);
    if (cb) {
      for (let idx in this._users) {
        cb.call(context, this._users[idx], idx, this._users);
      }
    }
  }
  /**
   * Get a copy of cached tags.
   * @memberof Tinode.Topic#
   *
   * @return {Array.<string>} a copy of tags
   */
  tags() {
    // Return a copy.
    return this._tags.slice(0);
  }
  /**
   * Get auxiliary entry by key.
   * @memberof Tinode.Topic#
   * @param {string} key - auxiliary data key to retrieve.
   * @return {Object} value for the <code>key</code> or <code>undefined</code>.
   */
  aux(key) {
    return this._aux[key];
  }
  /**
   * Get alias (unique tag with alias: prefix), if present.
   * @memberof Tinode.Topic#
   * @return {string} alias or <code>undefined</code>.
   */
  alias() {
    let alias = this._tags && this._tags.find(t => t.startsWith('alias:'));
    if (alias) {
      // Remove 'alias:' prefix.
      alias = alias.substring(6);
    }
    return alias;
  }
  /**
   * Get cached subscription for the given user ID.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - id of the user to query for
   * @return user description or undefined.
   */
  subscriber(uid) {
    return this._users[uid];
  }
  /**
   * Iterate over versions of a message: call <code>callback</code> for each version (excluding original).
   * If <code>callback</code> is undefined, does nothing.
   * @memberof Tinode.Topic#
   *
   * @param {number} origSeq - seq ID of the original message.
   * @param {Tinode.ForEachCallbackType} callback - Callback which will receive messages one by one. See {@link Tinode.CBuffer#forEach}
   * @param {Object} context - Value of `this` inside the `callback`.
   */
  messageVersions(origSeq, callback, context) {
    if (!callback) {
      // No callback? We are done then.
      return;
    }
    const versions = this._messageVersions[origSeq];
    if (!versions) {
      return;
    }
    versions.forEach(callback, undefined, undefined, context);
  }
  /**
   * Iterate over cached messages: call <code>callback</code> for each message in the range [sinceIdx, beforeIdx).
   * If <code>callback</code> is undefined, use <code>this.onData</code>.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.ForEachCallbackType} callback - Callback which will receive messages one by one. See {@link Tinode.CBuffer#forEach}
   * @param {number} sinceId - Optional seqId to start iterating from (inclusive).
   * @param {number} beforeId - Optional seqId to stop iterating before it is reached (exclusive).
   * @param {Object} context - Value of `this` inside the `callback`.
   */
  messages(callback, sinceId, beforeId, context) {
    const cb = (callback || this.onData);
    if (cb) {
      const startIdx = typeof sinceId == 'number' ? this._messages.find({
        seq: sinceId
      }, true) : undefined;
      const beforeIdx = typeof beforeId == 'number' ? this._messages.find({
        seq: beforeId
      }, true) : undefined;
      if (startIdx != -1 && beforeIdx != -1) {
        // Step 1. Filter out all replacement messages and
        // save displayable messages in a temporary buffer.
        let msgs = [];
        this._messages.forEach((msg, unused1, unused2, i) => {
          if (Topic.#isReplacementMsg(msg)) {
            // Skip replacements.
            return;
          }
          if (msg._deleted) {
            // Skip deleted ranges.
            return;
          }
          // In case the massage was edited, replace timestamp of the version with the original's timestamp.
          const latest = this.latestMsgVersion(msg.seq) || msg;
          if (!latest._origTs) {
            latest._origTs = latest.ts;
            latest._origSeq = latest.seq;
            latest.ts = msg.ts;
            latest.seq = msg.seq;
          }
          msgs.push({
            data: latest,
            idx: i
          });
        }, startIdx, beforeIdx, {});
        // Step 2. Loop over displayble messages invoking cb on each of them.
        msgs.forEach((val, i) => {
          cb.call(context, val.data,
            (i > 0 ? msgs[i - 1].data : undefined),
            (i < msgs.length - 1 ? msgs[i + 1].data : undefined), val.idx);
        });
      }
    }
  }
  /**
   * Get the message from cache by literal <code>seq</code> (does not resolve message edits).
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - message seqId to search for.
   * @returns {Object} the message with the given <code>seq</code> or <code>undefined</code>, if no such message is found.
   */
  findMessage(seq) {
    const idx = this._messages.find({
      seq: seq
    });
    if (idx >= 0) {
      return this._messages.getAt(idx);
    }
    return undefined;
  }
  /**
   * Get the most recent non-deleted message from cache.
   * @memberof Tinode.Topic#
   *
   * @returns {Object} the most recent cached message or <code>undefined</code>, if no messages are cached.
   */
  latestMessage() {
    return this._messages.getLast(msg => !msg._deleted);
  }
  /**
   * Get the latest version for message.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - original seq ID of the message.
   * @returns {Object} the latest version of the message or null if message not found.
   */
  latestMsgVersion(seq) {
    const versions = this._messageVersions[seq];
    return versions ? versions.getLast() : null;
  }
  /**
   * Get the maximum cached seq ID.
   * @memberof Tinode.Topic#
   *
   * @returns {number} the greatest seq ID in cache.
   */
  maxMsgSeq() {
    return this._maxSeq;
  }
  /**
   * Get the minimum cached seq ID.
   * @memberof Tinode.Topic#
   *
   * @returns {number} the smallest seq ID in cache or 0.
   */
  minMsgSeq() {
    return this._minSeq;
  }
  /**
   * Get the maximum deletion ID.
   * @memberof Tinode.Topic#
   *
   * @returns {number} the greatest deletion ID.
   */
  maxClearId() {
    return this._maxDel;
  }
  /**
   * Get the number of messages in the cache.
   * @memberof Tinode.Topic#
   *
   * @returns {number} count of cached messages.
   */
  messageCount() {
    return this._messages.length();
  }
  /**
   * Iterate over cached unsent messages. Wraps {@link Tinode.Topic#messages}.
   * @memberof Tinode.Topic#
   *
   * @param {function} callback - Callback which will receive messages one by one. See {@link Tinode.CBuffer#forEach}
   * @param {Object} context - Value of <code>this</code> inside the <code>callback</code>.
   */
  queuedMessages(callback, context) {
    if (!callback) {
      throw new Error("Callback must be provided");
    }
    this.messages(callback, Const.LOCAL_SEQID, undefined, context);
  }
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
  msgReceiptCount(what, seq) {
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
  }
  /**
   * Get the number of topic subscribers who marked this message (and all older messages) as read.
   * The current user is excluded from the count.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - message id to check.
   * @returns {number} number of subscribers who claim to have received the message.
   */
  msgReadCount(seq) {
    return this.msgReceiptCount('read', seq);
  }
  /**
   * Get the number of topic subscribers who marked this message (and all older messages) as received.
   * The current user is excluded from the count.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - Message id to check.
   * @returns {number} Number of subscribers who claim to have received the message.
   */
  msgRecvCount(seq) {
    return this.msgReceiptCount('recv', seq);
  }
  /**
   * Check if cached message IDs indicate that the server may have more messages.
   * @memberof Tinode.Topic#
   *
   * @param {number} min - smallest seq ID loaded range.
   * @param {number} max - greatest seq ID in loaded range.
   * @param {boolean} newer - if <code>true</code>, check for newer messages only.
   * @returns {Array.<Range>} - missing ranges in the selected direction.
   */
  msgHasMoreMessages(min, max, newer) {
    // Find gaps in cached messages.
    const gaps = [];
    if (min >= max) {
      return gaps;
    }
    let maxSeq = 0;
    let gap;
    this._messages.forEach((msg, prev) => {
      const p = prev || {
        seq: 0
      };
      const expected = p._deleted ? p.hi : p.seq + 1;
      if (msg.seq > expected) {
        gap = {
          low: expected,
          hi: msg.seq
        };
      } else {
        gap = null;
      }
      // If newer: collect all gaps from min to infinity.
      // If older: collect all gaps from max to zero.
      if (gap && (newer ? gap.hi >= min : gap.low < max)) {
        gaps.push(gap);
      }
      maxSeq = expected;
    });

    if (maxSeq < this.seq) {
      gap = {
        low: maxSeq + 1,
        hi: this.seq + 1
      };
      if (newer ? gap.hi >= min : gap.low < max) {
        gaps.push(gap);
      }
    }
    return gaps;
  }
  /**
   * Check if the given seq Id is id of the most recent message.
   * @memberof Tinode.Topic#
   *
   * @param {number} seqId id of the message to check
   */
  isNewMessage(seqId) {
    return this._maxSeq <= seqId;
  }
  /**
   * Remove one message from local cache.
   * @memberof Tinode.Topic#
   *
   * @param {number} seqId id of the message to remove from cache.
   * @returns {Message} removed message or undefined if such message was not found.
   */
  flushMessage(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });
    delete this._messageVersions[seqId];
    if (idx >= 0) {
      this._tinode._db.remMessages(this.name, seqId);
      return this._messages.delAt(idx);
    }
    return undefined;
  }
  /**
   * Remove a range of messages from the local cache.
   * @memberof Tinode.Topic#
   *
   * @param {number} fromId seq ID of the first message to remove (inclusive).
   * @param {number} untilId seqID of the last message to remove (exclusive).
   *
   * @returns {Message[]} array of removed messages (could be empty).
   */
  flushMessageRange(fromId, untilId) {
    // Remove range from persistent cache.
    this._tinode._db.remMessages(this.name, fromId, untilId);

    // Remove all versions keyed by IDs in the range.
    for (let i = fromId; i < untilId; i++) {
      delete this._messageVersions[i];
    }

    // start, end: find insertion points (nearest == true).
    const since = this._messages.find({
      seq: fromId
    }, true);
    return since >= 0 ? this._messages.delRange(since, this._messages.find({
      seq: untilId
    }, true)) : [];
  }
  /**
   * Update message's seqId.
   * @memberof Tinode.Topic#
   *
   * @param {Object} pub message object.
   * @param {number} newSeqId new seq id for pub.
   */
  swapMessageId(pub, newSeqId) {
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
  }
  /**
   * Attempt to stop message from being sent.
   * @memberof Tinode.Topic#
   *
   * @param {number} seqId id of the message to stop sending and remove from cache.
   *
   * @returns {boolean} <code>true</code> if message was cancelled, <code>false</code> otherwise.
   */
  cancelSend(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });
    if (idx >= 0) {
      const msg = this._messages.getAt(idx);
      const status = this.msgStatus(msg);
      if (status == Const.MESSAGE_STATUS_QUEUED ||
        status == Const.MESSAGE_STATUS_FAILED ||
        status == Const.MESSAGE_STATUS_FATAL) {
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
  }
  /**
   * Get type of the topic: me, p2p, grp, fnd...
   * @memberof Tinode.Topic#
   *
   * @returns {string} One of 'me', 'p2p', 'grp', 'fnd', 'sys' or <code>undefined</code>.
   */
  getType() {
    return Topic.topicType(this.name);
  }
  /**
   * Get current user's access mode of the topic.
   * @memberof Tinode.Topic#
   *
   * @returns {Tinode.AccessMode} - user's access mode
   */
  getAccessMode() {
    return this.acs;
  }
  /**
   * Set current user's access mode of the topic.
   * @memberof Tinode.Topic#
   *
   * @param {AccessMode | Object} acs - access mode to set.
   */
  setAccessMode(acs) {
    return this.acs = new AccessMode(acs);
  }
  /**
   * Get topic's default access mode.
   * @memberof Tinode.Topic#
   *
   * @returns {Tinode.DefAcs} - access mode, such as {auth: `RWP`, anon: `N`}.
   */
  getDefaultAccess() {
    return this.defacs;
  }
  /**
   * Initialize new meta {@link Tinode.GetQuery} builder. The query is attched to the current topic.
   * It will not work correctly if used with a different topic.
   * @memberof Tinode.Topic#
   *
   * @returns {Tinode.MetaGetBuilder} query attached to the current topic.
   */
  startMetaQuery() {
    return new MetaGetBuilder(this);
  }
  /**
   * Check if topic is archived, i.e. private.arch == true.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is archived, <code>false</code> otherwise.
   */
  isArchived() {
    return this.private && !!this.private.arch;
  }
  /**
   * Check if topic is a 'me' topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a 'me' topic, <code>false</code> otherwise.
   */
  isMeType() {
    return Topic.isMeTopicName(this.name);
  }
  /**
   * Check if topic is a 'slf' topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a 'slf' topic, <code>false</code> otherwise.
   */
  isSelfType() {
    return Topic.isSelfTopicName(this.name);
  }
  /**
   * Check if topic is a channel.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a channel, <code>false</code> otherwise.
   */
  isChannelType() {
    return Topic.isChannelTopicName(this.name);
  }
  /**
   * Check if topic is a group topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a group, <code>false</code> otherwise.
   */
  isGroupType() {
    return Topic.isGroupTopicName(this.name);
  }
  /**
   * Check if topic is a p2p topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a p2p topic, <code>false</code> otherwise.
   */
  isP2PType() {
    return Topic.isP2PTopicName(this.name);
  }
  /**
   * Check if topic is a communication topic, i.e. a group or p2p topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a p2p or group topic, <code>false</code> otherwise.
   */
  isCommType() {
    return Topic.isCommTopicName(this.name);
  }
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
  msgStatus(msg, upd) {
    let status = Const.MESSAGE_STATUS_NONE;
    if (this._tinode.isMe(msg.from)) {
      if (msg._sending) {
        status = Const.MESSAGE_STATUS_SENDING;
      } else if (msg._fatal || msg._cancelled) {
        status = Const.MESSAGE_STATUS_FATAL;
      } else if (msg._failed) {
        status = Const.MESSAGE_STATUS_FAILED;
      } else if (msg.seq >= Const.LOCAL_SEQID) {
        status = Const.MESSAGE_STATUS_QUEUED;
      } else if (this.msgReadCount(msg.seq) > 0) {
        status = Const.MESSAGE_STATUS_READ;
      } else if (this.msgRecvCount(msg.seq) > 0) {
        status = Const.MESSAGE_STATUS_RECEIVED;
      } else if (msg.seq > 0) {
        status = Const.MESSAGE_STATUS_SENT;
      }
    } else {
      status = Const.MESSAGE_STATUS_TO_ME;
    }

    if (upd && msg._status != status) {
      msg._status = status;
      this._tinode._db.updMessageStatus(this.name, msg.seq, status);
    }

    return status;
  }

  // If msg is a replacement for another message, save the msg in the message versions cache
  // as a newer version for the message it's supposed to replace.
  _maybeUpdateMessageVersionsCache(msg) {
    if (!Topic.#isReplacementMsg(msg)) {
      // Check if this message is the original in the chain of edits and if so
      // ensure all version have the same sender.
      if (this._messageVersions[msg.seq]) {
        // Remove versions with different 'from'.
        this._messageVersions[msg.seq].filter(version => version.from == msg.from);
        if (this._messageVersions[msg.seq].isEmpty()) {
          delete this._messageVersions[msg.seq];
        }
      }
      return;
    }

    const targetSeq = parseInt(msg.head.replace.split(':')[1]);
    if (targetSeq > msg.seq) {
      // Substitutes are supposed to have higher seq ids.
      return;
    }
    const targetMsg = this.findMessage(targetSeq);
    if (targetMsg && targetMsg.from != msg.from) {
      // Substitute cannot change the sender.
      return;
    }
    const versions = this._messageVersions[targetSeq] || new CBuffer((a, b) => {
      return a.seq - b.seq;
    }, true);
    versions.put(msg);
    this._messageVersions[targetSeq] = versions;
  }

  // Process data message
  _routeData(data) {
    if (data.content) {
      if (!this.touched || this.touched < data.ts) {
        this.touched = data.ts;
        this._tinode._db.updTopic(this);
      }
    }

    if (data.seq > this._maxSeq) {
      this._maxSeq = data.seq;
      this.msgStatus(data, true);
      // Ackn receiving the message.
      clearTimeout(this._recvNotificationTimer);
      this._recvNotificationTimer = setTimeout(_ => {
        this._recvNotificationTimer = null;
        this.noteRecv(this._maxSeq);
      }, Const.RECV_TIMEOUT);
    }

    if (data.seq < this._minSeq || this._minSeq == 0) {
      this._minSeq = data.seq;
    }

    const outgoing = ((!this.isChannelType() && !data.from) || this._tinode.isMe(data.from));

    if (data.head && data.head.webrtc && data.head.mime == Drafty.getContentType() && data.content) {
      // Rewrite VC body with info from the headers.
      const upd = {
        state: data.head.webrtc,
        duration: data.head['webrtc-duration'],
        incoming: !outgoing,
      };
      if (data.head.vc) {
        upd.vc = true;
      }
      data.content = Drafty.updateVideoCall(data.content, upd);
    }

    if (!data._noForwarding) {
      this._messages.put(data);
      this._tinode._db.addMessage(data);
      this._maybeUpdateMessageVersionsCache(data);
    }

    if (this.onData) {
      this.onData(data);
    }

    // Update locally cached contact with the new message count.
    const what = outgoing ? 'read' : 'msg';
    this._updateMyReadRecv(what, data.seq, data.ts);

    if (!outgoing && data.from) {
      // Mark messages as read by the sender.
      this._routeInfo({
        what: 'read',
        from: data.from,
        seq: data.seq,
        _noForwarding: true
      });
    }

    // Notify 'me' listeners of the change.
    this._tinode.getMeTopic()._refreshContact(what, this);
  }

  // Process metadata message
  _routeMeta(meta) {
    if (meta.desc) {
      this._processMetaDesc(meta.desc);
    }
    if (meta.sub && meta.sub.length > 0) {
      this._processMetaSubs(meta.sub);
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
    if (meta.aux) {
      this._processMetaAux(meta.aux);
    }
    if (this.onMeta) {
      this.onMeta(meta);
    }
  }
  // Process presence change message
  _routePres(pres) {
    let user, uid;
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
      case 'upd':
        // A topic subscriber has updated his description.
        // Issue {get sub} only if the current user has no p2p topics with the updated user (p2p name is not in cache).
        // Otherwise 'me' will issue a {get desc} request.
        if (pres.src && !this._tinode.isTopicCached(pres.src)) {
          this.getMeta(this.startMetaQuery().withOneSub(undefined, pres.src).build());
        }
        break;
      case 'aux':
        // Auxiliary data updated.
        this.getMeta(this.startMetaQuery().withAux().build());
        break;
      case 'acs':
        uid = pres.src || this._tinode.getCurrentUserID();
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
            this._processMetaSubs([user]);
          }
        } else {
          // Known user
          user.acs.updateAll(pres.dacs);
          // Update user's access mode.
          this._processMetaSubs([{
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
  }
  // Process {info} message
  _routeInfo(info) {
    switch (info.what) {
      case 'recv':
      case 'read':
        const user = this._users[info.from];
        if (user) {
          user[info.what] = info.seq;
          if (user.recv < user.read) {
            user.recv = user.read;
          }
        }
        const msg = this.latestMessage();
        if (msg) {
          this.msgStatus(msg, true);
        }

        // If this is an update from the current user, update the cache with the new count.
        if (this._tinode.isMe(info.from) && !info._noForwarding) {
          this._updateMyReadRecv(info.what, info.seq);
        }

        // Notify 'me' listener of the status change.
        this._tinode.getMeTopic()._refreshContact(info.what, this);
        break;
      case 'kp':
      case 'kpa':
      case 'kpv':
        // Typing or audio/video recording notification. Do nothing.
        break;
      case 'call':
        // Do nothing here.
        break;
      default:
        this._tinode.logger("INFO: Ignored info update", info.what);
    }

    if (this.onInfo) {
      this.onInfo(info);
    }
  }
  // Called by Tinode when meta.desc packet is received.
  // Called by 'me' topic on contact update (desc._noForwarding is true).
  _processMetaDesc(desc) {
    if (this.isP2PType()) {
      // Synthetic desc may include defacs for p2p topics which is useless.
      // Remove it.
      delete desc.defacs;

      // Update to p2p desc is the same as user update. Update cached user.
      this._tinode._db.updUser(this.name, desc.public);
    }

    // Copy parameters from desc object to this topic.
    mergeObj(this, desc);
    // Update persistent cache.
    this._tinode._db.updTopic(this);

    // Notify 'me' listener, if available:
    if (this.name !== Const.TOPIC_ME && !desc._noForwarding) {
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
  }
  // Called by Tinode when meta.sub is recived or in response to received
  // {ctrl} after setMeta-sub.
  _processMetaSubs(subs) {
    for (let idx in subs) {
      const sub = subs[idx];

      // Fill defaults.
      sub.online = !!sub.online;
      // Update timestamp of the most recent subscription update.
      this._lastSubsUpdate = new Date(Math.max(this._lastSubsUpdate, sub.updated));

      let user = null;
      if (!sub.deleted) {
        // If this is a change to user's own permissions, update them in topic too.
        // Desc will update 'me' topic.
        if (this._tinode.isMe(sub.user) && sub.acs) {
          this._processMetaDesc({
            updated: sub.updated,
            touched: sub.touched,
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
  }
  // Called by Tinode when meta.tags is recived.
  _processMetaTags(tags) {
    if (tags == Const.DEL_CHAR || (tags.length == 1 && tags[0] == Const.DEL_CHAR)) {
      tags = [];
    }
    this._tags = tags;
    this._tinode._db.updTopic(this);
    if (this.onTagsUpdated) {
      this.onTagsUpdated(tags);
    }
  }
  // Do nothing for topics other than 'me'
  _processMetaCreds(creds) {}

  // Called by Tinode when meta.aux is recived.
  _processMetaAux(aux) {
    aux = (!aux || aux == Const.DEL_CHAR) ? {} : aux;
    this._aux = mergeObj(this._aux, aux);
    this._tinode._db.updTopic(this);
    if (this.onAuxUpdated) {
      this.onAuxUpdated(this._aux);
    }
  }

  // Delete cached messages and update cached transaction IDs
  _processDelMessages(clear, delseq) {
    this._maxDel = Math.max(clear, this._maxDel);
    this.clear = Math.max(clear, this.clear);
    let count = 0;
    if (Array.isArray(delseq)) {
      delseq.forEach(rec => {
        if (!rec.hi) {
          count++;
          this.flushMessage(rec.low);
        } else {
          count += rec.hi - rec.low;
          this.flushMessageRange(rec.low, rec.hi);
        }
        this._messages.put({
          seq: rec.low,
          low: rec.low,
          hi: rec.hi,
          _deleted: true
        });
      });

      this._tinode._db.addDelLog(this.name, clear, delseq);
    }

    if (count > 0) {
      if (this.onData) {
        this.onData();
      }
    }
  }
  // Topic is informed that the entire response to {get what=data} has been received.
  _allMessagesReceived(count) {

    if (this.onAllMessagesReceived) {
      this.onAllMessagesReceived(count);
    }
  }
  // Reset subscribed state
  _resetSub() {
    this._attached = false;
  }
  // This topic is either deleted or unsubscribed from.
  _gone() {
    this._messages.reset();
    this._tinode._db.remMessages(this.name);
    this._users = {};
    this.acs = new AccessMode(null);
    this.private = null;
    this.public = null;
    this.trusted = null;
    this._maxSeq = 0;
    this._minSeq = 0;
    this._attached = false;

    const me = this._tinode.getMeTopic();
    if (me) {
      me._routePres({
        _noForwarding: true,
        what: 'gone',
        topic: Const.TOPIC_ME,
        src: this.name
      });
    }
    if (this.onDeleteTopic) {
      this.onDeleteTopic();
    }
  }
  // Update global user cache and local subscribers cache.
  // Don't call this method for non-subscribers.
  _updateCachedUser(uid, obj) {
    // Fetch user object from the global cache.
    // This is a clone of the stored object
    let cached = this._cacheGetUser(uid);
    cached = mergeObj(cached || {}, obj);
    // Save to global cache
    this._cachePutUser(uid, cached);
    // Save to the list of topic subsribers.
    return mergeToCache(this._users, uid, cached);
  }
  // Get local seqId for a queued message.
  _getQueuedSeqId() {
    return this._queuedSeqId++;
  }

  // Load most recent messages from persistent cache.
  _loadMessages(db, query) {
    query = query || {};
    query.limit = query.limit || Const.DEFAULT_MESSAGES_PAGE;

    // Count of message loaded from DB.
    let count = 0;
    return db.readMessages(this.name, query)
      .then(msgs => {
        msgs.forEach(data => {
          if (data.seq > this._maxSeq) {
            this._maxSeq = data.seq;
          }
          if (data.seq < this._minSeq || this._minSeq == 0) {
            this._minSeq = data.seq;
          }
          this._messages.put(data);
          this._maybeUpdateMessageVersionsCache(data);
        });
        count = msgs.length;
      })
      .then(_ => db.readDelLog(this.name, query))
      .then(dellog => {
        return dellog.forEach(rec => {
          this._messages.put({
            seq: rec.low,
            low: rec.low,
            hi: rec.hi,
            _deleted: true
          });
        });
      })
      .then(_ => {
        // DEBUG
        return count;
      });
  }

  // Push or {pres}: message received.
  _updateReceived(seq, act) {
    this.touched = new Date();
    this.seq = seq | 0;
    // Check if message is sent by the current user. If so it's been read already.
    if (!act || this._tinode.isMe(act)) {
      this.read = this.read ? Math.max(this.read, this.seq) : this.seq;
      this.recv = this.recv ? Math.max(this.read, this.recv) : this.read;
    }
    this.unread = this.seq - (this.read | 0);
    this._tinode._db.updTopic(this);
  }
}
