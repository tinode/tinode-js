/**
 * @file Global constants and configuration parameters.
 *
 * @copyright 2015-2022 Tinode LLC
 */
'use strict';

import {
  version as package_version
} from '../version.json';

// Global constants
export const PROTOCOL_VERSION = '0'; // Major component of the version, e.g. '0' in '0.17.1'.
export const VERSION = package_version || '0.20';
export const LIBRARY = 'tinodejs/' + VERSION;

// Topic name prefixes.
export const TOPIC_NEW = 'new';
export const TOPIC_NEW_CHAN = 'nch';
export const TOPIC_ME = 'me';
export const TOPIC_FND = 'fnd';
export const TOPIC_SYS = 'sys';
export const TOPIC_CHAN = 'chn';
export const TOPIC_GRP = 'grp';
export const TOPIC_P2P = 'p2p';
export const USER_NEW = 'new';

// Starting value of a locally-generated seqId used for pending messages.
export const LOCAL_SEQID = 0xFFFFFFF;

// Status codes.
export const MESSAGE_STATUS_NONE = 0; // Status not assigned.
export const MESSAGE_STATUS_QUEUED = 1; // Local ID assigned, in progress to be sent.
export const MESSAGE_STATUS_SENDING = 2; // Transmission started.
export const MESSAGE_STATUS_FAILED = 3; // At least one attempt was made to send the message.
export const MESSAGE_STATUS_SENT = 4; // Delivered to the server.
export const MESSAGE_STATUS_RECEIVED = 5; // Received by the client.
export const MESSAGE_STATUS_READ = 6; // Read by the user.
export const MESSAGE_STATUS_TO_ME = 7; // The message is received from another user.

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
