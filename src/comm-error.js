/**
 * @file Throwable error with numeric error code.
 *
 * @copyright 2015-2023 Tinode LLC.
 */
'use strict';

export default class CommError extends Error {
  constructor(message, code) {
    super(`${message} (${code})`);
    this.name = 'CommError';
    this.code = code;
  }
}
