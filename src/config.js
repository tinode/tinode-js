/**
 * @file Global constants and configuration parameters.
 *
 * @copyright 2015-2025 Tinode LLC
 */
'use strict';

import {
  PACKAGE_VERSION
} from '../version.js';

// Global constants
export const PROTOCOL_VERSION = '0'; // Major component of the version, e.g. '0' in '0.17.1'.
export const VERSION = PACKAGE_VERSION || '0.24';
export const LIBRARY = 'tinodejs/' + VERSION;

// Topic name prefixes.
export const TOPIC_NEW = 'new';
export const TOPIC_NEW_CHAN = 'nch';
export const TOPIC_ME = 'me';
export const TOPIC_FND = 'fnd';
export const TOPIC_SYS = 'sys';
export const TOPIC_SLF = 'slf';
export const TOPIC_CHAN = 'chn';
export const TOPIC_GRP = 'grp';
export const TOPIC_P2P = 'p2p';
export const USER_NEW = 'new';

// Starting value of a locally-generated seqId used for pending messages.
export const LOCAL_SEQID = 0xFFFFFFF;

// Status codes.
export const MESSAGE_STATUS_NONE = 0; // Status not assigned.
export const MESSAGE_STATUS_QUEUED = 10; // Local ID assigned, in progress to be sent.
export const MESSAGE_STATUS_SENDING = 20; // Transmission started.
export const MESSAGE_STATUS_FAILED = 30; // At least one attempt was made to send the message.
export const MESSAGE_STATUS_FATAL = 40; // Message sending failed and it should not be retried.
export const MESSAGE_STATUS_SENT = 50; // Delivered to the server.
export const MESSAGE_STATUS_RECEIVED = 60; // Received by the client.
export const MESSAGE_STATUS_READ = 70; // Read by the user.
export const MESSAGE_STATUS_TO_ME = 80; // The message is received from another user.

// Reject unresolved futures after this many milliseconds.
export const EXPIRE_PROMISES_TIMEOUT = 5_000;
// Periodicity of garbage collection of unresolved futures.
export const EXPIRE_PROMISES_PERIOD = 1_000;

// Delay before acknowledging that a message was recived.
export const RECV_TIMEOUT = 100;

// Default number of messages to pull into memory from persistent cache.
export const DEFAULT_MESSAGES_PAGE = 24;

// Unicode DEL character indicating data was deleted.
export const DEL_CHAR = '\u2421';

// Maximum number of pinnned messages;
export const MAX_PINNED_COUNT = 5;
