/**
 * @file Throwable error with numeric error code.
 *
 * @copyright 2015-2023 Tinode LLC.
 */
'use strict';

/**
 * Throwable error with a numeric error code, as returned by the server.
 * @class CommError
 * @extends Error
 * @memberof Tinode
 *
 * @param {string} message - Human-readable error description.
 * @param {number} code - Numeric error code (mirrors HTTP status codes).
 */
export default class CommError extends Error {
  constructor(message, code) {
    super(`${message} (${code})`);
    this.name = 'CommError';
    this.code = code;
  }
}
