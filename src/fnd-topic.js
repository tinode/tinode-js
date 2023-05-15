/**
 * @file Definition of 'fnd' topic.
 *
 * @copyright 2015-2023 Tinode LLC.
 */
'use strict';

import * as Const from './config.js';
import Topic from './topic.js';
import {
  mergeToCache
} from './utils.js';


/**
 * Special case of {@link Tinode.Topic} for searching for contacts and group topics
 * @extends Tinode.Topic
 *
 */
export default class TopicFnd extends Topic {
  // List of users and topics uid or topic_name -> Contact object)
  _contacts = {};

  /**
   * Create TopicFnd.
   *
   * @param {TopicFnd.Callbacks} callbacks - Callbacks to receive various events.
   */
  constructor(callbacks) {
    super(Const.TOPIC_FND, callbacks);
  }

  // Override the original Topic._processMetaSubs
  _processMetaSubs(subs) {
    let updateCount = Object.getOwnPropertyNames(this._contacts).length;
    // Reset contact list.
    this._contacts = {};
    for (let idx in subs) {
      let sub = subs[idx];
      const indexBy = sub.topic ? sub.topic : sub.user;

      sub = mergeToCache(this._contacts, indexBy, sub);
      updateCount++;

      if (this.onMetaSub) {
        this.onMetaSub(sub);
      }
    }

    if (updateCount > 0 && this.onSubsUpdated) {
      this.onSubsUpdated(Object.keys(this._contacts));
    }
  }

  /**
   * Publishing to TopicFnd is not supported. {@link Topic#publish} is overriden and thows an {Error} if called.
   * @memberof Tinode.TopicFnd#
   * @throws {Error} Always throws an error.
   */
  publish() {
    return Promise.reject(new Error("Publishing to 'fnd' is not supported"));
  }

  /**
   * setMeta to TopicFnd resets contact list in addition to sending the message.
   * @memberof Tinode.TopicFnd#
   * @param {Tinode.SetParams} params parameters to update.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  setMeta(params) {
    return Object.getPrototypeOf(TopicFnd.prototype).setMeta.call(this, params).then(_ => {
      if (Object.keys(this._contacts).length > 0) {
        this._contacts = {};
        if (this.onSubsUpdated) {
          this.onSubsUpdated([]);
        }
      }
    });
  }

  /**
   * Iterate over found contacts. If callback is undefined, use {@link this.onMetaSub}.
   * @function
   * @memberof Tinode.TopicFnd#
   * @param {TopicFnd.ContactCallback} callback - Callback to call for each contact.
   * @param {Object} context - Context to use for calling the `callback`, i.e. the value of `this` inside the callback.
   */
  contacts(callback, context) {
    const cb = (callback || this.onMetaSub);
    if (cb) {
      for (let idx in this._contacts) {
        cb.call(context, this._contacts[idx], idx, this._contacts);
      }
    }
  }
}
