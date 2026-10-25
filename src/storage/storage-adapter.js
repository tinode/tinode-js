/**
 * @file Storage adapter interface for the persistent cache.
 *
 * @copyright 2015-2026 Tinode LLC.
 */
'use strict';

/**
 * Largest possible message seq ID.
 * @memberof Tinode
 * @type {number}
 */
export const MAX_SEQ = Number.MAX_SAFE_INTEGER;

/**
 * Range of message seq IDs, <code>low</code> inclusive, <code>hi</code> exclusive.
 * @typedef SeqRange
 * @memberof Tinode
 * @type {Object}
 * @property {number} low - first seq ID of the range.
 * @property {number=} hi - seq ID after the last one of the range; a single seq ID if missing.
 */

/**
 * Window of message seq IDs to read, newest first.
 * @typedef SeqWindow
 * @memberof Tinode
 * @type {Object}
 * @property {number} since - lowest seq ID to read, inclusive.
 * @property {number} before - seq ID to read up to, exclusive.
 * @property {number} limit - maximum number of items to read; 0 for no limit.
 */

/**
 * Stored topic.
 * @typedef TopicRecord
 * @memberof Tinode
 * @type {Object}
 * @property {string} name - topic name, primary key.
 * @property {Date=} created - timestamp when the topic was created.
 * @property {Date=} updated - timestamp of the last update of the topic.
 * @property {Date=} deleted - timestamp when the topic was deleted.
 * @property {Date=} touched - timestamp of the last message in the topic.
 * @property {number=} read - id of the last read message.
 * @property {number=} recv - id of the last received message.
 * @property {number=} seq - id of the last message.
 * @property {number=} clear - id of the last delete operation.
 * @property {Object=} defacs - default access mode.
 * @property {Array=} creds - user credentials.
 * @property {Object=} public - public data of the topic.
 * @property {Object=} trusted - trusted data of the topic.
 * @property {Object=} private - private data of the topic.
 * @property {Object=} _aux - auxiliary data of the topic.
 * @property {boolean=} _deleted - topic is marked as deleted.
 * @property {Array.<string>=} tags - topic tags.
 * @property {Object=} acs - access mode of the current user.
 */

/**
 * Stored user.
 * @typedef UserRecord
 * @memberof Tinode
 * @type {Object}
 * @property {string} uid - user ID, primary key.
 * @property {Object} public - public data of the user.
 */

/**
 * Stored subscription of a user to a topic.
 * @typedef SubscriptionRecord
 * @memberof Tinode
 * @type {Object}
 * @property {string} topic - topic name.
 * @property {string} uid - user ID.
 * @property {Date=} updated - timestamp of the last update of the subscription.
 * @property {string=} mode - access mode.
 * @property {number=} read - id of the last message read by the user.
 * @property {number=} recv - id of the last message received by the user.
 * @property {number=} clear - id of the last delete operation seen by the user.
 * @property {Object=} lastSeen - when and from what device the user was last seen.
 * @property {string=} userAgent - user agent of the last seen device.
 */

/**
 * Stored message.
 * @typedef MessageRecord
 * @memberof Tinode
 * @type {Object}
 * @property {string} topic - name of the topic which owns the message.
 * @property {number} seq - message seq ID.
 * @property {Date=} ts - timestamp of the message.
 * @property {number=} _status - local delivery status of the message.
 * @property {string=} from - ID of the user who sent the message.
 * @property {Object=} head - message headers.
 * @property {Object=} content - message content.
 */

/**
 * Stored record of a deleted range of messages.
 * @typedef DelLogRecord
 * @memberof Tinode
 * @type {Object}
 * @property {string} topic - topic name.
 * @property {number} clear - id of the delete operation.
 * @property {number} low - first deleted seq ID, inclusive.
 * @property {number} hi - seq ID after the last deleted one, exclusive.
 */

/**
 * Range of deleted messages.
 * @typedef DelLogRange
 * @memberof Tinode
 * @type {Object}
 * @property {number} low - first deleted seq ID, inclusive.
 * @property {number} hi - seq ID after the last deleted one, exclusive.
 */

/**
 * Storage backend for the persistent cache. Implement it to supply custom storage.
 * @interface StorageAdapter
 * @memberof Tinode
 */

/**
 * Open the storage, creating it if needed.
 * @function
 * @name Tinode.StorageAdapter#open
 * @returns {Promise} resolved when the storage is ready.
 */

/**
 * Close the storage. The data is kept.
 * @function
 * @name Tinode.StorageAdapter#close
 * @returns {Promise} resolved when the storage is closed.
 */

/**
 * Close the storage and delete all data.
 * @function
 * @name Tinode.StorageAdapter#destroy
 * @returns {Promise} resolved when the data is deleted.
 */

/**
 * Check if the storage is open.
 * @function
 * @name Tinode.StorageAdapter#isOpen
 * @returns {boolean} <code>true</code> if the storage is open, <code>false</code> otherwise.
 */

/**
 * Read all topics.
 * @function
 * @name Tinode.StorageAdapter#getTopics
 * @returns {Promise.<Array.<Tinode.TopicRecord>>} resolved with the topics.
 */

/**
 * Read one topic.
 * @function
 * @name Tinode.StorageAdapter#getTopic
 * @param {string} name - name of the topic.
 * @returns {Promise.<Tinode.TopicRecord|undefined>} resolved with the topic or <code>undefined</code> if not found.
 */

/**
 * Add or replace a topic.
 * @function
 * @name Tinode.StorageAdapter#putTopic
 * @param {Tinode.TopicRecord} record - topic to save.
 * @returns {Promise} resolved when the topic is saved.
 */

/**
 * Delete a topic with its subscriptions, messages and delete log.
 * @function
 * @name Tinode.StorageAdapter#removeTopic
 * @param {string} name - name of the topic.
 * @returns {Promise} resolved when the topic is deleted.
 */

/**
 * Read all users.
 * @function
 * @name Tinode.StorageAdapter#getUsers
 * @returns {Promise.<Array.<Tinode.UserRecord>>} resolved with the users.
 */

/**
 * Read one user.
 * @function
 * @name Tinode.StorageAdapter#getUser
 * @param {string} uid - ID of the user.
 * @returns {Promise.<Tinode.UserRecord|undefined>} resolved with the user or <code>undefined</code> if not found.
 */

/**
 * Add or replace a user.
 * @function
 * @name Tinode.StorageAdapter#putUser
 * @param {Tinode.UserRecord} record - user to save.
 * @returns {Promise} resolved when the user is saved.
 */

/**
 * Delete a user.
 * @function
 * @name Tinode.StorageAdapter#removeUser
 * @param {string} uid - ID of the user.
 * @returns {Promise} resolved when the user is deleted.
 */

/**
 * Read all subscriptions of a topic.
 * @function
 * @name Tinode.StorageAdapter#getSubscriptions
 * @param {string} topic - name of the topic.
 * @returns {Promise.<Array.<Tinode.SubscriptionRecord>>} resolved with the subscriptions.
 */

/**
 * Read one subscription.
 * @function
 * @name Tinode.StorageAdapter#getSubscription
 * @param {string} topic - name of the topic.
 * @param {string} uid - ID of the user.
 * @returns {Promise.<Tinode.SubscriptionRecord|undefined>} resolved with the subscription or <code>undefined</code> if not found.
 */

/**
 * Add or replace a subscription.
 * @function
 * @name Tinode.StorageAdapter#putSubscription
 * @param {Tinode.SubscriptionRecord} record - subscription to save.
 * @returns {Promise} resolved when the subscription is saved.
 */

/**
 * Delete a subscription.
 * @function
 * @name Tinode.StorageAdapter#removeSubscription
 * @param {string} topic - name of the topic.
 * @param {string} uid - ID of the user.
 * @returns {Promise} resolved when the subscription is deleted.
 */

/**
 * Add or replace a message.
 * @function
 * @name Tinode.StorageAdapter#putMessage
 * @param {Tinode.MessageRecord} record - message to save.
 * @returns {Promise} resolved when the message is saved.
 */

/**
 * Change the local delivery status of a message. Missing messages are ignored.
 * @function
 * @name Tinode.StorageAdapter#updateMessageStatus
 * @param {string} topic - name of the topic.
 * @param {number} seq - seq ID of the message.
 * @param {number} status - new status.
 * @returns {Promise} resolved when the status is saved.
 */

/**
 * Delete messages with seq IDs in [low, hi).
 * @function
 * @name Tinode.StorageAdapter#removeMessages
 * @param {string} topic - name of the topic.
 * @param {number} low - first seq ID to delete, inclusive.
 * @param {number} hi - seq ID to delete up to, exclusive.
 * @returns {Promise} resolved when the messages are deleted.
 */

/**
 * Read messages in a window, newest first.
 * @function
 * @name Tinode.StorageAdapter#readMessages
 * @param {string} topic - name of the topic.
 * @param {Tinode.SeqWindow} window - messages to read.
 * @returns {Promise.<Array.<Tinode.MessageRecord>>} resolved with the messages.
 */

/**
 * Read messages in a list of ranges, oldest first in each range.
 * @function
 * @name Tinode.StorageAdapter#readMessageRanges
 * @param {string} topic - name of the topic.
 * @param {Array.<Tinode.SeqRange>} ranges - messages to read.
 * @returns {Promise.<Array.<Tinode.MessageRecord>>} resolved with the messages.
 */

/**
 * Add records of deleted messages.
 * @function
 * @name Tinode.StorageAdapter#addDelLog
 * @param {Array.<Tinode.DelLogRecord>} records - records to save.
 * @returns {Promise} resolved when the records are saved.
 */

/**
 * Read ranges of deleted messages which overlap a window, newest first.
 * The limit is applied to the number of deleted messages, not ranges.
 * @function
 * @name Tinode.StorageAdapter#readDelLog
 * @param {string} topic - name of the topic.
 * @param {Tinode.SeqWindow} window - ranges to read.
 * @returns {Promise.<Array.<Tinode.DelLogRange>>} resolved with the ranges.
 */

/**
 * Read ranges of deleted messages which overlap a list of ranges.
 * @function
 * @name Tinode.StorageAdapter#readDelLogRanges
 * @param {string} topic - name of the topic.
 * @param {Array.<Tinode.SeqRange>} ranges - ranges to check.
 * @returns {Promise.<Array.<Tinode.DelLogRange>>} resolved with the ranges.
 */

/**
 * Find the largest delete operation ID of a topic.
 * @function
 * @name Tinode.StorageAdapter#maxDelId
 * @param {string} topic - name of the topic.
 * @returns {Promise.<number>} resolved with the ID, or 0 if nothing was deleted.
 */
