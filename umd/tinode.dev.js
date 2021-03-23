(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Tinode = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * @file In-memory sorted cache of objects..
 *
 * @copyright 2015-2021 Tinode
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.17
 */
'use strict';

/**
 * In-memory sorted cache of objects.
 *
 * @class CBuffer
 * @memberof Tinode
 * @protected
 *
 * @param {function} compare custom comparator of objects. Takes two parameters <code>a</code> and <code>b</code>;
 *    returns <code>-1</code> if <code>a < b</code>, <code>0</code> if <code>a == b</code>, <code>1</code> otherwise.
 * @param {boolean} unique enforce element uniqueness: when <code>true</code> replace existing element with a new
 *    one on conflict; when <code>false</code> keep both elements.
 */
const CBuffer = function(compare, unique) {
  let buffer = [];

  compare = compare || function(a, b) {
    return a === b ? 0 : a < b ? -1 : 1;
  };

  function findNearest(elem, arr, exact) {
    let start = 0;
    let end = arr.length - 1;
    let pivot = 0;
    let diff = 0;
    let found = false;

    while (start <= end) {
      pivot = (start + end) / 2 | 0;
      diff = compare(arr[pivot], elem);
      if (diff < 0) {
        start = pivot + 1;
      } else if (diff > 0) {
        end = pivot - 1;
      } else {
        found = true;
        break;
      }
    }
    if (found) {
      return {
        idx: pivot,
        exact: true
      };
    }
    if (exact) {
      return {
        idx: -1
      };
    }
    // Not exact - insertion point
    return {
      idx: diff < 0 ? pivot + 1 : pivot
    };
  }

  // Insert element into a sorted array.
  function insertSorted(elem, arr) {
    const found = findNearest(elem, arr, false);
    const count = (found.exact && unique) ? 1 : 0;
    arr.splice(found.idx, count, elem);
    return arr;
  }

  return {
    /**
     * Get an element at the given position.
     * @memberof Tinode.CBuffer#
     * @param {number} at - Position to fetch from.
     * @returns {Object} Element at the given position or <code>undefined</code>.
     */
    getAt: function(at) {
      return buffer[at];
    },

    /**
     * Convenience method for getting the last element of the buffer.
     * @memberof Tinode.CBuffer#
     * @returns {Object} The last element in the buffer or <code>undefined</code> if buffer is empty.
     */
    getLast: function() {
      return buffer.length > 0 ? buffer[buffer.length - 1] : undefined;
    },

    /**
     * Add new element(s) to the buffer. Variadic: takes one or more arguments. If an array is passed as a single
     * argument, its elements are inserted individually.
     * @memberof Tinode.CBuffer#
     *
     * @param {...Object|Array} - One or more objects to insert.
     */
    put: function() {
      let insert;
      // inspect arguments: if array, insert its elements, if one or more non-array arguments, insert them one by one
      if (arguments.length == 1 && Array.isArray(arguments[0])) {
        insert = arguments[0];
      } else {
        insert = arguments;
      }
      for (let idx in insert) {
        insertSorted(insert[idx], buffer);
      }
    },

    /**
     * Remove element at the given position.
     * @memberof Tinode.CBuffer#
     * @param {number} at - Position to delete at.
     * @returns {Object} Element at the given position or <code>undefined</code>.
     */
    delAt: function(at) {
      let r = buffer.splice(at, 1);
      if (r && r.length > 0) {
        return r[0];
      }
      return undefined;
    },

    /**
     * Remove elements between two positions.
     * @memberof Tinode.CBuffer#
     * @param {number} since - Position to delete from (inclusive).
     * @param {number} before - Position to delete to (exclusive).
     *
     * @returns {Array} array of removed elements (could be zero length).
     */
    delRange: function(since, before) {
      return buffer.splice(since, before - since);
    },

    /**
     * Return the number of elements the buffer holds.
     * @memberof Tinode.CBuffer#
     * @return {number} Number of elements in the buffer.
     */
    length: function() {
      return buffer.length;
    },

    /**
     * Reset the buffer discarding all elements
     * @memberof Tinode.CBuffer#
     */
    reset: function() {
      buffer = [];
    },

    /**
     * Callback for iterating contents of buffer. See {@link Tinode.CBuffer#forEach}.
     * @callback ForEachCallbackType
     * @memberof Tinode.CBuffer#
     * @param {Object} elem - Element of the buffer.
     * @param {number} index - Index of the current element.
     */

    /**
     * Apply given <code>callback</code> to all elements of the buffer.
     * @memberof Tinode.CBuffer#
     *
     * @param {Tinode.ForEachCallbackType} callback - Function to call for each element.
     * @param {number} startIdx - Optional index to start iterating from (inclusive).
     * @param {number} beforeIdx - Optional index to stop iterating before (exclusive).
     * @param {Object} context - calling context (i.e. value of <code>this</code> in callback)
     */
    forEach: function(callback, startIdx, beforeIdx, context) {
      startIdx = startIdx | 0;
      beforeIdx = beforeIdx || buffer.length;
      for (let i = startIdx; i < beforeIdx; i++) {
        callback.call(context, buffer[i], i);
      }
    },

    /**
     * Find element in buffer using buffer's comparison function.
     * @memberof Tinode.CBuffer#
     *
     * @param {Object} elem - element to find.
     * @param {boolean=} nearest - when true and exact match is not found, return the nearest element (insertion point).
     * @returns {number} index of the element in the buffer or -1.
     */
    find: function(elem, nearest) {
      const {
        idx
      } = findNearest(elem, buffer, !nearest);
      return idx;
    }
  }
}

if (typeof module != 'undefined') {
  module.exports = CBuffer;
}

},{}],2:[function(require,module,exports){
(function (global){(function (){
/**
 * @file Abstraction layer for websocket and long polling connections.
 * See <a href="https://github.com/tinode/webapp">https://github.com/tinode/webapp</a> for real-life usage.
 *
 * @copyright 2015-2021 Tinode
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.17
 */
'use strict';

let WebSocketProvider;
if (typeof WebSocket != 'undefined') {
  WebSocketProvider = WebSocket;
}

let XHRProvider;
if (typeof XMLHttpRequest != 'undefined') {
  XHRProvider = XMLHttpRequest;
}

if (typeof window == 'undefined') {
  global.window = {
    WebSocket: WebSocketProvider,
    XMLHttpRequest: XHRProvider,
  }
}

// Error code to return in case of a network problem.
const NETWORK_ERROR = 503;
const NETWORK_ERROR_TEXT = "Connection failed";

// Error code to return when user disconnected from server.
const NETWORK_USER = 418;
const NETWORK_USER_TEXT = "Disconnected by client";

// Helper function for creating an endpoint URL.
function makeBaseUrl(host, protocol, version, apiKey) {
  let url = null;

  if (protocol === 'http' || protocol === 'https' || protocol === 'ws' || protocol === 'wss') {
    url = protocol + '://';
    url += host;
    if (url.charAt(url.length - 1) !== '/') {
      url += '/';
    }
    url += 'v' + version + '/channels';
    if (protocol === 'http' || protocol === 'https') {
      // Long polling endpoint end with "lp", i.e.
      // '/v0/channels/lp' vs just '/v0/channels' for ws
      url += '/lp';
    }
    url += '?apikey=' + apiKey;
  }

  return url;
}

/**
 * An abstraction for a websocket or a long polling connection.
 *
 * @class Connection
 * @memberof Tinode
 *
 * @param {string} host_ - Host name and port number to connect to.
 * @param {string} version_ - Major value of the protocol version, e.g. '0' in '0.17.1'.
 * @param {string} apiKey_ - API key generated by keygen
 * @param {string} transport_ - Network transport to use, either <code>"ws"<code>/<code>"wss"</code> for websocket or
 *      <code>lp</code> for long polling.
 * @param {boolean} secure_ - Use secure WebSocket (wss) if <code>true</code>.
 * @param {boolean} autoreconnect_ - If connection is lost, try to reconnect automatically.
 */
const Connection = function(host_, version_, apiKey_, transport_, secure_, autoreconnect_) {
  let host = host_;
  let version = version_;
  let secure = secure_;
  let apiKey = apiKey_;

  let autoreconnect = autoreconnect_;

  // Settings for exponential backoff
  const _BOFF_BASE = 2000; // 2000 milliseconds, minimum delay between reconnects
  const _BOFF_MAX_ITER = 10; // Maximum delay between reconnects 2^10 * 2000 ~ 34 minutes
  const _BOFF_JITTER = 0.3; // Add random delay

  let _boffTimer = null;
  let _boffIteration = 0;
  let _boffClosed = false; // Indicator if the socket was manually closed - don't autoreconnect if true.

  const log = (text, ...args) => {
    if (this.logger) {
      this.logger(text, ...args);
    }
  }

  // Backoff implementation - reconnect after a timeout.
  function boffReconnect() {
    // Clear timer
    clearTimeout(_boffTimer);
    // Calculate when to fire the reconnect attempt
    const timeout = _BOFF_BASE * (Math.pow(2, _boffIteration) * (1.0 + _BOFF_JITTER * Math.random()));
    // Update iteration counter for future use
    _boffIteration = (_boffIteration >= _BOFF_MAX_ITER ? _boffIteration : _boffIteration + 1);
    if (this.onAutoreconnectIteration) {
      this.onAutoreconnectIteration(timeout);
    }

    _boffTimer = setTimeout(() => {
      log(`Reconnecting, iter=${_boffIteration}, timeout=${timeout}`);
      // Maybe the socket was closed while we waited for the timer?
      if (!_boffClosed) {
        const prom = this.connect();
        if (this.onAutoreconnectIteration) {
          this.onAutoreconnectIteration(0, prom);
        } else {
          // Suppress error if it's not used.
          prom.catch(() => {
            /* do nothing */
          });
        }
      } else if (this.onAutoreconnectIteration) {
        this.onAutoreconnectIteration(-1);
      }
    }, timeout);
  }

  // Terminate auto-reconnect process.
  function boffStop() {
    clearTimeout(_boffTimer);
    _boffTimer = null;
  }

  // Reset auto-reconnect iteration counter.
  function boffReset() {
    _boffIteration = 0;
  }

  // Initialization for Websocket
  function init_ws(instance) {
    let _socket = null;

    /**
     * Initiate a new connection
     * @memberof Tinode.Connection#
     * @param {string} host_ Host name to connect to; if <code>null</code> the old host name will be used.
     * @param {boolean} force Force new connection even if one already exists.
     * @return {Promise} Promise resolved/rejected when the connection call completes, resolution is called without
     *  parameters, rejection passes the {Error} as parameter.
     */
    instance.connect = function(host_, force) {
      _boffClosed = false;

      if (_socket) {
        if (!force && _socket.readyState == _socket.OPEN) {
          return Promise.resolve();
        }
        _socket.close();
        _socket = null;
      }

      if (host_) {
        host = host_;
      }

      return new Promise(function(resolve, reject) {
        const url = makeBaseUrl(host, secure ? 'wss' : 'ws', version, apiKey);

        log("Connecting to: ", url);

        // It throws when the server is not accessible but the exception cannot be caught:
        // https://stackoverflow.com/questions/31002592/javascript-doesnt-catch-error-in-websocket-instantiation/31003057
        const conn = new WebSocketProvider(url);

        conn.onerror = function(err) {
          reject(err);
        }

        conn.onopen = function(evt) {
          if (autoreconnect) {
            boffStop();
          }

          if (instance.onOpen) {
            instance.onOpen();
          }

          resolve();
        }

        conn.onclose = function(evt) {
          _socket = null;

          if (instance.onDisconnect) {
            const code = _boffClosed ? NETWORK_USER : NETWORK_ERROR;
            instance.onDisconnect(new Error(_boffClosed ? NETWORK_USER_TEXT : NETWORK_ERROR_TEXT +
              ' (' + code + ')'), code);
          }

          if (!_boffClosed && autoreconnect) {
            boffReconnect.call(instance);
          }
        }

        conn.onmessage = function(evt) {
          if (instance.onMessage) {
            instance.onMessage(evt.data);
          }
        }
        _socket = conn;
      });
    }

    /**
     * Try to restore a network connection, also reset backoff.
     * @memberof Tinode.Connection#
     *
     * @param {boolean} force - reconnect even if there is a live connection already.
     */
    instance.reconnect = function(force) {
      boffStop();
      instance.connect(null, force);
    }

    /**
     * Terminate the network connection
     * @memberof Tinode.Connection#
     */
    instance.disconnect = function() {
      _boffClosed = true;
      boffStop();

      if (!_socket) {
        return;
      }
      _socket.close();
      _socket = null;
    }

    /**
     * Send a string to the server.
     * @memberof Tinode.Connection#
     *
     * @param {string} msg - String to send.
     * @throws Throws an exception if the underlying connection is not live.
     */
    instance.sendText = function(msg) {
      if (_socket && (_socket.readyState == _socket.OPEN)) {
        _socket.send(msg);
      } else {
        throw new Error("Websocket is not connected");
      }
    };

    /**
     * Check if socket is alive.
     * @memberof Tinode.Connection#
     * @returns {boolean} <code>true</code> if connection is live, <code>false</code> otherwise.
     */
    instance.isConnected = function() {
      return (_socket && (_socket.readyState == _socket.OPEN));
    }

    /**
     * Get the name of the current network transport.
     * @memberof Tinode.Connection#
     * @returns {string} name of the transport such as <code>"ws"</code> or <code>"lp"</code>.
     */
    instance.transport = function() {
      return 'ws';
    }

    /**
     * Send network probe to check if connection is indeed live.
     * @memberof Tinode.Connection#
     */
    instance.probe = function() {
      instance.sendText('1');
    }
  }

  // Initialization for long polling.
  function init_lp(instance) {
    const XDR_UNSENT = 0; // Client has been created. open() not called yet.
    const XDR_OPENED = 1; // open() has been called.
    const XDR_HEADERS_RECEIVED = 2; // send() has been called, and headers and status are available.
    const XDR_LOADING = 3; // Downloading; responseText holds partial data.
    const XDR_DONE = 4; // The operation is complete.
    // Fully composed endpoint URL, with API key & SID
    let _lpURL = null;

    let _poller = null;
    let _sender = null;

    function lp_sender(url_) {
      let sender = new XMLHttpRequest();
      sender.onreadystatechange = function(evt) {
        if (sender.readyState == XDR_DONE && sender.status >= 400) {
          // Some sort of error response
          throw new Error(`LP sender failed, ${sender.status}`);
        }
      }

      sender.open('POST', url_, true);
      return sender;
    }

    function lp_poller(url_, resolve, reject) {
      let poller = new XMLHttpRequest();
      let promiseCompleted = false;

      poller.onreadystatechange = function(evt) {

        if (poller.readyState == XDR_DONE) {
          if (poller.status == 201) { // 201 == HTTP.Created, get SID
            let pkt = JSON.parse(poller.responseText, jsonParseHelper);
            _lpURL = url_ + '&sid=' + pkt.ctrl.params.sid
            poller = lp_poller(_lpURL);
            poller.send(null)
            if (instance.onOpen) {
              instance.onOpen();
            }

            if (resolve) {
              promiseCompleted = true;
              resolve();
            }

            if (autoreconnect) {
              boffStop();
            }
          } else if (poller.status < 400) { // 400 = HTTP.BadRequest
            if (instance.onMessage) {
              instance.onMessage(poller.responseText)
            }
            poller = lp_poller(_lpURL);
            poller.send(null);
          } else {
            // Don't throw an error here, gracefully handle server errors
            if (reject && !promiseCompleted) {
              promiseCompleted = true;
              reject(poller.responseText);
            }
            if (instance.onMessage && poller.responseText) {
              instance.onMessage(poller.responseText);
            }
            if (instance.onDisconnect) {
              const code = poller.status || (_boffClosed ? NETWORK_USER : NETWORK_ERROR);
              const text = poller.responseText || (_boffClosed ? NETWORK_USER_TEXT : NETWORK_ERROR_TEXT);
              instance.onDisconnect(new Error(text + ' (' + code + ')'), code);
            }

            // Polling has stopped. Indicate it by setting poller to null.
            poller = null;
            if (!_boffClosed && autoreconnect) {
              boffReconnect.call(instance);
            }
          }
        }
      }
      poller.open('GET', url_, true);
      return poller;
    }

    instance.connect = function(host_, force) {
      _boffClosed = false;

      if (_poller) {
        if (!force) {
          return Promise.resolve();
        }
        _poller.onreadystatechange = undefined;
        _poller.abort();
        _poller = null;
      }

      if (host_) {
        host = host_;
      }

      return new Promise(function(resolve, reject) {
        const url = makeBaseUrl(host, secure ? 'https' : 'http', version, apiKey);
        log("Connecting to: ", url);
        _poller = lp_poller(url, resolve, reject);
        _poller.send(null)
      }).catch((err) => {
        log("LP connection failed:", err);
      });
    };

    instance.reconnect = function(force) {
      boffStop();
      instance.connect(null, force);
    };

    instance.disconnect = function() {
      _boffClosed = true;
      boffStop();

      if (_sender) {
        _sender.onreadystatechange = undefined;
        _sender.abort();
        _sender = null;
      }
      if (_poller) {
        _poller.onreadystatechange = undefined;
        _poller.abort();
        _poller = null;
      }

      if (instance.onDisconnect) {
        instance.onDisconnect(new Error(NETWORK_USER_TEXT + ' (' + NETWORK_USER + ')'), NETWORK_USER);
      }
      // Ensure it's reconstructed
      _lpURL = null;
    }

    instance.sendText = function(msg) {
      _sender = lp_sender(_lpURL);
      if (_sender && (_sender.readyState == 1)) { // 1 == OPENED
        _sender.send(msg);
      } else {
        throw new Error("Long poller failed to connect");
      }
    };

    instance.isConnected = function() {
      return (_poller && true);
    }

    instance.transport = function() {
      return 'lp';
    }

    instance.probe = function() {
      instance.sendText('1');
    }
  }

  let initialized = false;
  if (transport_ === 'lp') {
    // explicit request to use long polling
    init_lp(this);
    initialized = true;
  } else if (transport_ === 'ws') {
    // explicit request to use web socket
    // if websockets are not available, horrible things will happen
    init_ws(this);
    initialized = true;

    // Default transport selection
  } else if (typeof window == 'object') {
    if (window['WebSocket']) {
      // Using web sockets -- default.
      init_ws(this);
      initialized = true;
    } else if (window['XMLHttpRequest']) {
      // The browser has no websockets, using long polling.
      init_lp(this);
      initialized = true;
    }
  }

  if (!initialized) {
    // No transport is avaiilable.
    log("No network transport is available. Running under Node? Call 'Tinode.setNetworkProviders()'.");
    throw new Error("No network transport is available. Running under Node? Call 'Tinode.setNetworkProviders()'.");
  }

  /**
   * Check if the given network transport is available.
   * @memberof Tinode.Connection#
   * @param {string} trans - either <code>"ws"</code> (websocket) or <code>"lp"</code> (long polling).
   * @returns true if given transport is available, false otherwise.
   */
  this.transportAvailable = function(transp) {
    switch (transp) {
      case 'ws':
        return typeof window == 'object' && window['WebSocket'];
      case 'lp':
        return typeof window == 'object' && window['XMLHttpRequest'];
      default:
        log("Request for unknown transport", transp);
        return false;
    }
  }

  /**
   * Reset autoreconnect counter to zero.
   * @memberof Tinode.Connection#
   */
  this.backoffReset = function() {
    boffReset();
  }

  // Callbacks:
  /**
   * A callback to pass incoming messages to. See {@link Tinode.Connection#onMessage}.
   * @callback Tinode.Connection.OnMessage
   * @memberof Tinode.Connection
   * @param {string} message - Message to process.
   */
  /**
   * A callback to pass incoming messages to.
   * @type {Tinode.Connection.OnMessage}
   * @memberof Tinode.Connection#
   */
  this.onMessage = undefined;

  /**
   * A callback for reporting a dropped connection.
   * @type {function}
   * @memberof Tinode.Connection#
   */
  this.onDisconnect = undefined;

  /**
   * A callback called when the connection is ready to be used for sending. For websockets it's socket open,
   * for long polling it's <code>readyState=1</code> (OPENED)
   * @type {function}
   * @memberof Tinode.Connection#
   */
  this.onOpen = undefined;

  /**
   * A callback to notify of reconnection attempts. See {@link Tinode.Connection#onAutoreconnectIteration}.
   * @memberof Tinode.Connection
   * @callback AutoreconnectIterationType
   * @param {string} timeout - time till the next reconnect attempt in milliseconds. <code>-1</code> means reconnect was skipped.
   * @param {Promise} promise resolved or rejected when the reconnect attemp completes.
   *
   */
  /**
   * A callback to inform when the next attampt to reconnect will happen and to receive connection promise.
   * @memberof Tinode.Connection#
   * @type {Tinode.Connection.AutoreconnectIterationType}
   */
  this.onAutoreconnectIteration = undefined;

  /**
   * A callback to log events from Connection. See {@link Tinode.Connection#logger}.
   * @memberof Tinode.Connection
   * @callback LoggerCallbackType
   * @param {string} event - Event to log.
   */
  /**
   * A callback to report logging events.
   * @memberof Tinode.Connection#
   * @type {Tinode.Connection.LoggerCallbackType}
   */
  this.logger = undefined;
};

/**
 * To use Connection in a non browser context, supply WebSocket and XMLHttpRequest providers.
 * @static
 * @memberof Connection
 * @param wsProvider WebSocket provider, e.g. for nodeJS , <code>require('ws')</code>.
 * @param xhrProvider XMLHttpRequest provider, e.g. for node <code>require('xhr')</code>.
 */
Connection.setNetworkProviders = function(wsProvider, xhrProvider) {
  WebSocketProvider = wsProvider;
  XHRProvider = xhrProvider;
};

Connection.NETWORK_ERROR = NETWORK_ERROR;
Connection.NETWORK_ERROR_TEXT = NETWORK_ERROR_TEXT;
Connection.NETWORK_USER = NETWORK_USER;
Connection.NETWORK_USER_TEXT = NETWORK_USER_TEXT;

if (typeof module != 'undefined') {
  module.exports = Connection;
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
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

// NOTE TO DEVELOPERS:
// Localizable strings should be double quoted "строка на другом языке",
// non-localizable strings should be single quoted 'non-localized'.

const DB_VERSION = 1;
const DB_NAME = 'tinode-web';

const DB = function(onError, logger) {
  onError = onError || function() {}
  logger = logger || function() {}

  // Placeholder DB which does nothing.
  let db = null;
  // Indicator that the cache is disabled.
  let disabled = false;

  // Serializable topic fields.
  const topic_fields = ['created', 'updated', 'deleted', 'read', 'recv', 'seq', 'clear', 'defacs',
    'creds', 'public', 'private', 'touched'
  ];

  // Copy values from 'src' to 'dst'. Allocate dst if 'it's null or undefined.
  function serializeTopic(dst, src) {
    const res = dst || {
      name: src.name
    };
    topic_fields.forEach((f) => {
      if (src.hasOwnProperty(f)) {
        res[f] = src[f];
      }
    });
    if (Array.isArray(src._tags)) {
      res.tags = src._tags;
    }
    if (src.acs) {
      res.acs = src.getAccessMode().jsonHelper();
    }
    return res;
  }

  // Copy data from src to Topic object.
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

  function serializeSubscription(dst, topicName, uid, sub) {
    const fields = ['updated', 'mode', 'read', 'recv', 'clear', 'lastSeen', 'userAgent'];
    const res = dst || {
      topic: topicName,
      uid: uid
    };

    fields.forEach((f) => {
      if (sub.hasOwnProperty(f)) {
        res[f] = sub[f];
      }
    });

    return res;
  }

  function serializeMessage(dst, msg) {
    // Serializable fields.
    const fields = ['topic', 'seq', 'ts', '_status', 'from', 'head', 'content'];
    const res = dst || {};
    fields.forEach((f) => {
      if (msg.hasOwnProperty(f)) {
        res[f] = msg[f];
      }
    });
    return res;
  }

  return {
    /**
     * Initialize persistent cache: open or create/upgrade if needed.
     * @returns {Promise} promise to be resolved/rejected when the DB is initialized.
     */
    initDatabase: function() {
      return new Promise((resolve, reject) => {
        // Open the database and initialize callbacks.
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (event) => {
          db = event.target.result;
          resolve(db);
        };
        req.onerror = (event) => {
          logger("PCache", "failed to initialize", event);
          reject(event.target.error);
          if (onError) {
            onError(event.target.error);
          }
        };
        req.onupgradeneeded = function(event) {
          db = event.target.result;

          db.onerror = function(event) {
            logger("PCache", "failed to create storage", event);
            if (onError) {
              onError(event.target.error);
            }
          };

          // Individual object stores.

          // Object store (table) for topics. The primary key is topic name.
          db.createObjectStore('topic', {
            keyPath: 'name'
          });

          // Users object store. UID is the primary key.
          db.createObjectStore('user', {
            keyPath: 'uid'
          });

          // Subscriptions object store topic <-> user. Topic name + UID is the primary key.
          db.createObjectStore('subscription', {
            keyPath: ['topic', 'uid']
          });

          // Messages object store. The primary key is topic name + seq.
          db.createObjectStore('message', {
            keyPath: ['topic', 'seq']
          });
        };
      });
    },

    /**
     * Delete persistent cache.
     */
    deleteDatabase: function() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = function(event) {
          resolve(true);
        };
        req.onerror = function(event) {
          logger("PCache", "deleteDatabase", event.target.error);
          reject(event.target.error);
        };
      });
    },

    /**
     * Check if persistent cache is ready for use.
     * @returns {boolean} <code>true</code> if cache is ready, <code>false</code> otherwise.
     */
    isReady: function() {
      return !!db;
    },

    /**
     * Disable persistent cache: all operations do nothing but return success.
     */
    disable: function() {
      db = null;
      disabled = true;
    },

    // Topics.
    /**
     * Add or update topic in persistent cache.
     * @memberOf DB
     * @param {Topic} topic - topic to be added to persistent storage.
     * @returns {Promise} promise resolved/rejected on operation completion.
     */
    updTopic: function(topic) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve() :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "updTopic", event.target.error);
          reject(event.target.error);
        };
        const req = trx.objectStore('topic').get(topic.name);
        req.onsuccess = (event) => {
          trx.objectStore('topic').put(serializeTopic(req.result, topic));
          trx.commit();
        };
      });
    },

    /**
     * Remove topic from persistent cache.
     * @memberOf DB
     * @param {string} name - name of the topic to remove from database.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    remTopic: function(name) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve() :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic', 'subscription', 'message'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "remTopic", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('topic').delete(IDBKeyRange.only(name));
        trx.objectStore('subscription').delete(IDBKeyRange.bound([name, '-'], [name, '~']));
        trx.objectStore('message').delete(IDBKeyRange.bound([name, 0], [name, Number.MAX_SAFE_INTEGER]));
        trx.commit();
      });
    },

    /**
     * Execute a callback for each stored topic.
     * @memberOf DB
     * @param {function} callback - function to call for each topic.
     * @param {Object} context - the value or <code>this</code> inside the callback.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    mapTopics: function(callback, context) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve([]) :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['topic']);
        trx.onerror = (event) => {
          logger("PCache", "mapTopics", event.target.error);
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
    /**
     * Add or update user object in the persistent cache.
     * @memberOf DB
     * @param {string} uid - ID of the user to save.
     * @param {Object} pub - user's <code>public</code> information.
     * @returns {Promise} promise resolved/rejected on operation completion.
     */
    updUser: function(uid, pub) {
      if (arguments.length < 2 || pub === undefined) {
        // No point inupdating user with invalid data.
        return;
      }
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve() :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['user'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "updUser", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('user').put({
          uid: uid,
          public: pub
        });
        trx.commit();
      });
    },

    /**
     * Remove user from persistent cache.
     * @memberOf DB
     * @param {string} uid - ID of the user to remove from the cache.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    remUser: function(uid) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve() :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['user'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "remUser", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('user').delete(IDBKeyRange.only(uid));
        trx.commit();
      });
    },

    /**
     * Read a single user from persistent cache.
     * @memberOf DB
     * @param {string} uid - ID of the user to fetch from cache.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    getUser: function(uid) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve() :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['user']);
        trx.oncomplete = (event) => {
          const user = event.target.result;
          resolve({
            user: user.uid,
            public: user.public
          });
        };
        trx.onerror = (event) => {
          logger("PCache", "getUser", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('user').get(uid);
      });
    },

    // Subscriptions.

    /**
     * Add or update subscription in persistent cache.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the message.
     * @param {string} uid - ID of the subscribed user.
     * @param {Object} sub - subscription to save.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    updSubscription: function(topicName, uid, sub) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve() :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['subscription'], 'readwrite');
        trx.oncomplete = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "updSubscription", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('subscription').get([topicName, uid]).onsuccess = (event) => {
          trx.objectStore('subscription').put(serializeSubscription(event.target.result, topicName, uid, sub));
          trx.commit();
        };
      });
    },

    /**
     * Execute a callback for each cached subscription in a given topic.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the subscriptions.
     * @param {function} callback - function to call for each subscription.
     * @param {Object} context - the value or <code>this</code> inside the callback.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    mapSubscriptions: function(topicName, callback, context) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve([]) :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['subscription']);
        trx.onerror = (event) => {
          logger("PCache", "mapSubscriptions", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('subscription').getAll(IDBKeyRange.bound([topicName, '-'], [topicName, '~'])).onsuccess = (event) => {
          if (callback) {
            event.target.result.forEach((topic) => {
              callback.call(context, topic);
            });
          }
          resolve(event.target.result);
        };
      });
    },

    // Messages.

    /**
     * Save message to persistent cache.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the message.
     * @param {Object} msg - message to save.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    addMessage: function(msg) {
      if (!this.isReady()) {
        return Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "addMesssage", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('message').add(serializeMessage(null, msg));
        trx.commit();
      });
    },

    /**
     * Update delivery status of a message stored in persistent cache.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the message.
     * @param {number} seq - ID of the message to update
     * @param {number} status - new delivery status of the message.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    updMessageStatus: function(topicName, seq, status) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve() :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        const trx = db.transaction(['message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "updMessageStatus", event.target.error);
          reject(event.target.error);
        };
        const req = trx.objectStore('message').get(IDBKeyRange.only([topicName, seq]));
        req.onsuccess = (event) => {
          const src = req.result || event.target.result;
          if (!src || src._status == status) {
            trx.commit();
            return;
          }
          trx.objectStore('message').put(serializeMessage(src, {
            topic: topicName,
            seq: seq,
            _status: status
          }));
          trx.commit();
        };
      });
    },

    /**
     * Remove one or more messages from persistent cache.
     * @memberOf DB
     * @param {string} topicName - name of the topic which owns the message.
     * @param {number} from - id of the message to remove or lower boundary when removing range (inclusive).
     * @param {number=} to - upper boundary (exclusive) when removing a range of messages.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    remMessages: function(topicName, from, to) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve() :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        if (!from && !to) {
          from = 0;
          to = Number.MAX_SAFE_INTEGER;
        }
        const range = to > 0 ? IDBKeyRange.bound([topicName, from], [topicName, to], false, true) :
          IDBKeyRange.only([topicName, from]);
        const trx = db.transaction(['message'], 'readwrite');
        trx.onsuccess = (event) => {
          resolve(event.target.result);
        };
        trx.onerror = (event) => {
          logger("PCache", "remMessages", event.target.error);
          reject(event.target.error);
        };
        trx.objectStore('message').delete(range);
        trx.commit();
      });
    },

    /**
     * Retrieve messages from persistent store.
     * @memberOf DB
     * @param {string} topicName - name of the topic to retrieve messages from.
     * @param {function} callback to call for each retrieved message.
     * @param {Object} query - parameters of the message range to retrieve.
     * @param {number=} query.from - the least message ID to retrieve (inclusive).
     * @param {number=} query.to - the greatest message ID to retrieve (exclusive).
     * @param {number=} query.limit - the maximum number of messages to retrieve.
     * @return {Promise} promise resolved/rejected on operation completion.
     */
    readMessages: function(topicName, query, callback, context) {
      if (!this.isReady()) {
        return disabled ?
          Promise.resolve([]) :
          Promise.reject(new Error("not initialized"));
      }
      return new Promise((resolve, reject) => {
        query = query || {};
        const from = query.from > 0 ? query.from : 0;
        const to = query.to > 0 ? query.to : Number.MAX_SAFE_INTEGER;
        const limit = query.limit | 0;

        const result = [];
        const range = IDBKeyRange.bound([topicName, from], [topicName, to], false, true);
        const trx = db.transaction(['message']);
        trx.onerror = (event) => {
          logger("PCache", "readMessages", event.target.error);
          reject(event.target.error);
        };
        // Iterate in descending order.
        trx.objectStore('message').openCursor(range, 'prev').onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            if (callback) {
              callback.call(context, cursor.value);
            }
            result.push(cursor.value);
            if (limit <= 0 || result.length < limit) {
              cursor.continue();
            } else {
              resolve(result);
            }
          } else {
            resolve(result);
          }
        };
      });
    }
  };
}

if (typeof module != 'undefined') {
  module.exports = DB;
}

},{}],4:[function(require,module,exports){
/**
 * @copyright 2015-2021 Tinode
 * @summary Minimally rich text representation and formatting for Tinode.
 * @license Apache 2.0
 * @version 0.16
 *
 * @file Basic parser and formatter for very simple text markup. Mostly targeted at
 * mobile use cases similar to Telegram, WhatsApp, and FB Messenger.
 *
 * <p>Supports conversion of user keyboard input to formatted text:</p>
 * <ul>
 *   <li>*abc* &rarr; <b>abc</b></li>
 *   <li>_abc_ &rarr; <i>abc</i></li>
 *   <li>~abc~ &rarr; <del>abc</del></li>
 *   <li>`abc` &rarr; <tt>abc</tt></li>
 * </ul>
 * Also supports forms and buttons.
 *
 * Nested formatting is supported, e.g. *abc _def_* -> <b>abc <i>def</i></b>
 * URLs, @mentions, and #hashtags are extracted and converted into links.
 * Forms and buttons can be added procedurally.
 * JSON data representation is inspired by Draft.js raw formatting.
 *
 *
 * @example
 * Text:
 * <pre>
 *     this is *bold*, `code` and _italic_, ~strike~
 *     combined *bold and _italic_*
 *     an url: https://www.example.com/abc#fragment and another _www.tinode.co_
 *     this is a @mention and a #hashtag in a string
 *     second #hashtag
 * </pre>
 *
 *  Sample JSON representation of the text above:
 *  {
 *     "txt": "this is bold, code and italic, strike combined bold and italic an url: https://www.example.com/abc#fragment " +
 *             "and another www.tinode.co this is a @mention and a #hashtag in a string second #hashtag",
 *     "fmt": [
 *         { "at":8, "len":4,"tp":"ST" },{ "at":14, "len":4, "tp":"CO" },{ "at":23, "len":6, "tp":"EM"},
 *         { "at":31, "len":6, "tp":"DL" },{ "tp":"BR", "len":1, "at":37 },{ "at":56, "len":6, "tp":"EM" },
 *         { "at":47, "len":15, "tp":"ST" },{ "tp":"BR", "len":1, "at":62 },{ "at":120, "len":13, "tp":"EM" },
 *         { "at":71, "len":36, "key":0 },{ "at":120, "len":13, "key":1 },{ "tp":"BR", "len":1, "at":133 },
 *         { "at":144, "len":8, "key":2 },{ "at":159, "len":8, "key":3 },{ "tp":"BR", "len":1, "at":179 },
 *         { "at":187, "len":8, "key":3 },{ "tp":"BR", "len":1, "at":195 }
 *     ],
 *     "ent": [
 *         { "tp":"LN", "data":{ "url":"https://www.example.com/abc#fragment" } },
 *         { "tp":"LN", "data":{ "url":"http://www.tinode.co" } },
 *         { "tp":"MN", "data":{ "val":"mention" } },
 *         { "tp":"HT", "data":{ "val":"hashtag" } }
 *     ]
 *  }
 */

'use strict';

// NOTE TO DEVELOPERS:
// Localizable strings should be double quoted "строка на другом языке",
// non-localizable strings should be single quoted 'non-localized'.

const MAX_FORM_ELEMENTS = 8;
const JSON_MIME_TYPE = 'application/json';

// Regular expressions for parsing inline formats. Javascript does not support lookbehind,
// so it's a bit messy.
const INLINE_STYLES = [
  // Strong = bold, *bold text*
  {
    name: 'ST',
    start: /(?:^|[\W_])(\*)[^\s*]/,
    end: /[^\s*](\*)(?=$|[\W_])/
  },
  // Emphesized = italic, _italic text_
  {
    name: 'EM',
    start: /(?:^|\W)(_)[^\s_]/,
    end: /[^\s_](_)(?=$|\W)/
  },
  // Deleted, ~strike this though~
  {
    name: 'DL',
    start: /(?:^|[\W_])(~)[^\s~]/,
    end: /[^\s~](~)(?=$|[\W_])/
  },
  // Code block `this is monospace`
  {
    name: 'CO',
    start: /(?:^|\W)(`)[^`]/,
    end: /[^`](`)(?=$|\W)/
  }
];

// RegExps for entity extraction (RF = reference)
const ENTITY_TYPES = [
  // URLs
  {
    name: 'LN',
    dataName: 'url',
    pack: function(val) {
      // Check if the protocol is specified, if not use http
      if (!/^[a-z]+:\/\//i.test(val)) {
        val = 'http://' + val;
      }
      return {
        url: val
      };
    },
    re: /(?:(?:https?|ftp):\/\/|www\.|ftp\.)[-A-Z0-9+&@#\/%=~_|$?!:,.]*[A-Z0-9+&@#\/%=~_|$]/ig
  },
  // Mentions @user (must be 2 or more characters)
  {
    name: 'MN',
    dataName: 'val',
    pack: function(val) {
      return {
        val: val.slice(1)
      };
    },
    re: /\B@(\w\w+)/g
  },
  // Hashtags #hashtag, like metion 2 or more characters.
  {
    name: 'HT',
    dataName: 'val',
    pack: function(val) {
      return {
        val: val.slice(1)
      };
    },
    re: /\B#(\w\w+)/g
  }
];

// HTML tag name suggestions
const HTML_TAGS = {
  ST: {
    name: 'b',
    isVoid: false
  },
  EM: {
    name: 'i',
    isVoid: false
  },
  DL: {
    name: 'del',
    isVoid: false
  },
  CO: {
    name: 'tt',
    isVoid: false
  },
  BR: {
    name: 'br',
    isVoid: true
  },
  LN: {
    name: 'a',
    isVoid: false
  },
  MN: {
    name: 'a',
    isVoid: false
  },
  HT: {
    name: 'a',
    isVoid: false
  },
  IM: {
    name: 'img',
    isVoid: true
  },
  FM: {
    name: 'div',
    isVoid: false
  },
  RW: {
    name: 'div',
    isVoid: false,
  },
  BN: {
    name: 'button',
    isVoid: false
  },
  HD: {
    name: '',
    isVoid: false
  },
  HL: {
    name: 'span',
    isVoid: false
  }
};

// Convert base64-encoded string into Blob.
function base64toObjectUrl(b64, contentType, logger) {
  if (!b64) {
    return null;
  }

  try {
    const bin = atob(b64);
    const length = bin.length;
    const buf = new ArrayBuffer(length);
    const arr = new Uint8Array(buf);
    for (let i = 0; i < length; i++) {
      arr[i] = bin.charCodeAt(i);
    }

    return URL.createObjectURL(new Blob([buf], {
      type: contentType
    }));
  } catch (err) {
    if (logger) {
      logger("Drafty: failed to convert object.", err.message);
    }
  }

  return null;
}

function base64toDataUrl(b64, contentType) {
  if (!b64) {
    return null;
  }
  contentType = contentType || 'image/jpeg';
  return 'data:' + contentType + ';base64,' + b64;
}

// Helpers for converting Drafty to HTML.
const DECORATORS = {
  // Visial styles
  ST: {
    open: function() {
      return '<b>';
    },
    close: function() {
      return '</b>';
    }
  },
  EM: {
    open: function() {
      return '<i>';
    },
    close: function() {
      return '</i>'
    }
  },
  DL: {
    open: function() {
      return '<del>';
    },
    close: function() {
      return '</del>'
    }
  },
  CO: {
    open: function() {
      return '<tt>';
    },
    close: function() {
      return '</tt>'
    }
  },
  // Line break
  BR: {
    open: function() {
      return '<br/>';
    },
    close: function() {
      return ''
    }
  },
  // Hidden element
  HD: {
    open: function() {
      return '';
    },
    close: function() {
      return '';
    }
  },
  // Highlighted element.
  HL: {
    open: function() {
      return '<span style="color:teal">';
    },
    close: function() {
      return '</span>';
    }
  },
  // Link (URL)
  LN: {
    open: function(data) {
      return '<a href="' + data.url + '">';
    },
    close: function(data) {
      return '</a>';
    },
    props: function(data) {
      return data ? {
        href: data.url,
        target: "_blank"
      } : null;
    },
  },
  // Mention
  MN: {
    open: function(data) {
      return '<a href="#' + data.val + '">';
    },
    close: function(data) {
      return '</a>';
    },
    props: function(data) {
      return data ? {
        name: data.val
      } : null;
    },
  },
  // Hashtag
  HT: {
    open: function(data) {
      return '<a href="#' + data.val + '">';
    },
    close: function(data) {
      return '</a>';
    },
    props: function(data) {
      return data ? {
        name: data.val
      } : null;
    },
  },
  // Button
  BN: {
    open: function(data) {
      return '<button>';
    },
    close: function(data) {
      return '</button>';
    },
    props: function(data) {
      return data ? {
        'data-act': data.act,
        'data-val': data.val,
        'data-name': data.name,
        'data-ref': data.ref
      } : null;
    },
  },
  // Image
  IM: {
    open: function(data) {
      // Don't use data.ref for preview: it's a security risk.
      const tmpPreviewUrl = base64toDataUrl(data._tempPreview, data.mime);
      const previewUrl = base64toObjectUrl(data.val, data.mime, Drafty.logger);
      const downloadUrl = data.ref || previewUrl;
      return (data.name ? '<a href="' + downloadUrl + '" download="' + data.name + '">' : '') +
        '<img src="' + (tmpPreviewUrl || previewUrl) + '"' +
        (data.width ? ' width="' + data.width + '"' : '') +
        (data.height ? ' height="' + data.height + '"' : '') + ' border="0" />';
    },
    close: function(data) {
      return (data.name ? '</a>' : '');
    },
    props: function(data) {
      if (!data) return null;
      return {
        // Temporary preview, or permanent preview, or external link.
        src: base64toDataUrl(data._tempPreview, data.mime) ||
          data.ref || base64toObjectUrl(data.val, data.mime, Drafty.logger),
        title: data.name,
        'data-width': data.width,
        'data-height': data.height,
        'data-name': data.name,
        'data-size': data.val ? ((data.val.length * 0.75) | 0) : (data.size | 0),
        'data-mime': data.mime
      };
    },
  },
  // Form - structured layout of elements.
  FM: {
    open: function(data) {
      return '<div>';
    },
    close: function(data) {
      return '</div>';
    }
  },
  // Row: logic grouping of elements
  RW: {
    open: function(data) {
      return '<div>';
    },
    close: function(data) {
      return '</div>';
    }
  }
};

/**
 * The main object which performs all the formatting actions.
 * @class Drafty
 * @constructor
 */
const Drafty = function() {}

// Take a string and defined earlier style spans, re-compose them into a tree where each leaf is
// a same-style (including unstyled) string. I.e. 'hello *bold _italic_* and ~more~ world' ->
// ('hello ', (b: 'bold ', (i: 'italic')), ' and ', (s: 'more'), ' world');
//
// This is needed in order to clear markup, i.e. 'hello *world*' -> 'hello world' and convert
// ranges from markup-ed offsets to plain text offsets.
function chunkify(line, start, end, spans) {
  const chunks = [];

  if (spans.length == 0) {
    return [];
  }

  for (let i in spans) {
    // Get the next chunk from the queue
    const span = spans[i];

    // Grab the initial unstyled chunk
    if (span.start > start) {
      chunks.push({
        text: line.slice(start, span.start)
      });
    }

    // Grab the styled chunk. It may include subchunks.
    const chunk = {
      type: span.type
    };
    const chld = chunkify(line, span.start + 1, span.end, span.children);
    if (chld.length > 0) {
      chunk.children = chld;
    } else {
      chunk.text = span.text;
    }
    chunks.push(chunk);
    start = span.end + 1; // '+1' is to skip the formatting character
  }

  // Grab the remaining unstyled chunk, after the last span
  if (start < end) {
    chunks.push({
      text: line.slice(start, end)
    });
  }

  return chunks;
}

// Inverse of chunkify. Returns a tree of formatted spans.
function forEach(line, start, end, spans, formatter, context) {
  const result = [];

  // Process ranges calling formatter for each range.
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    if (span.at < 0) {
      // Ask formatter if it wants to do anything with the non-visual span.
      const s = formatter.call(context, span.tp, span.data, undefined, result.length);
      if (s) {
        result.push(s);
      }
      continue;
    }
    // Add un-styled range before the styled span starts.
    if (start < span.at) {
      result.push(formatter.call(context, null, undefined, line.slice(start, span.at), result.length));
      start = span.at;
    }
    // Get all spans which are within current span.
    const subspans = [];
    for (let si = i + 1; si < spans.length && spans[si].at < span.at + span.len; si++) {
      subspans.push(spans[si]);
      i = si;
    }

    const tag = HTML_TAGS[span.tp] || {}
    result.push(formatter.call(context, span.tp, span.data,
      tag.isVoid ? null : forEach(line, start, span.at + span.len, subspans, formatter, context),
      result.length));

    start = span.at + span.len;
  }

  // Add the last unformatted range.
  if (start < end) {
    result.push(formatter.call(context, null, undefined, line.slice(start, end), result.length));
  }

  return result;
}

// Detect starts and ends of formatting spans. Unformatted spans are
// ignored at this stage.
function spannify(original, re_start, re_end, type) {
  const result = [];
  let index = 0;
  let line = original.slice(0); // make a copy;

  while (line.length > 0) {
    // match[0]; // match, like '*abc*'
    // match[1]; // match captured in parenthesis, like 'abc'
    // match['index']; // offset where the match started.

    // Find the opening token.
    const start = re_start.exec(line);
    if (start == null) {
      break;
    }

    // Because javascript RegExp does not support lookbehind, the actual offset may not point
    // at the markup character. Find it in the matched string.
    let start_offset = start['index'] + start[0].lastIndexOf(start[1]);
    // Clip the processed part of the string.
    line = line.slice(start_offset + 1);
    // start_offset is an offset within the clipped string. Convert to original index.
    start_offset += index;
    // Index now point to the beginning of 'line' within the 'original' string.
    index = start_offset + 1;

    // Find the matching closing token.
    const end = re_end ? re_end.exec(line) : null;
    if (end == null) {
      break;
    }
    let end_offset = end['index'] + end[0].indexOf(end[1]);
    // Clip the processed part of the string.
    line = line.slice(end_offset + 1);
    // Update offsets
    end_offset += index;
    // Index now point to the beginning of 'line' within the 'original' string.
    index = end_offset + 1;

    result.push({
      text: original.slice(start_offset + 1, end_offset),
      children: [],
      start: start_offset,
      end: end_offset,
      type: type
    });
  }

  return result;
}

// Convert linear array or spans into a tree representation.
// Keep standalone and nested spans, throw away partially overlapping spans.
function toTree(spans) {
  if (spans.length == 0) {
    return [];
  }

  const tree = [spans[0]];
  let last = spans[0];
  for (let i = 1; i < spans.length; i++) {
    // Keep spans which start after the end of the previous span or those which
    // are complete within the previous span.

    if (spans[i].start > last.end) {
      // Span is completely outside of the previous span.
      tree.push(spans[i]);
      last = spans[i];
    } else if (spans[i].end < last.end) {
      // Span is fully inside of the previous span. Push to subnode.
      last.children.push(spans[i]);
    }
    // Span could partially overlap, ignoring it as invalid.
  }

  // Recursively rearrange the subnodes.
  for (let i in tree) {
    tree[i].children = toTree(tree[i].children);
  }

  return tree;
}

// Get a list of entities from a text.
function extractEntities(line) {
  let match;
  let extracted = [];
  ENTITY_TYPES.map(function(entity) {
    while ((match = entity.re.exec(line)) !== null) {
      extracted.push({
        offset: match['index'],
        len: match[0].length,
        unique: match[0],
        data: entity.pack(match[0]),
        type: entity.name
      });
    }
  });

  if (extracted.length == 0) {
    return extracted;
  }

  // Remove entities detected inside other entities, like #hashtag in a URL.
  extracted.sort(function(a, b) {
    return a.offset - b.offset;
  });

  let idx = -1;
  extracted = extracted.filter(function(el) {
    const result = (el.offset > idx);
    idx = el.offset + el.len;
    return result;
  });

  return extracted;
}

// Convert the chunks into format suitable for serialization.
function draftify(chunks, startAt) {
  let plain = "";
  let ranges = [];
  for (let i in chunks) {
    const chunk = chunks[i];
    if (!chunk.text) {
      const drafty = draftify(chunk.children, plain.length + startAt);
      chunk.text = drafty.txt;
      ranges = ranges.concat(drafty.fmt);
    }

    if (chunk.type) {
      ranges.push({
        at: plain.length + startAt,
        len: chunk.text.length,
        tp: chunk.type
      });
    }

    plain += chunk.text;
  }
  return {
    txt: plain,
    fmt: ranges
  };
}

// Splice two strings: insert second string into the first one at the given index
function splice(src, at, insert) {
  return src.slice(0, at) + insert + src.slice(at);
}

/**
 * Parse plain text into Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {String} content - plain-text content to parse.
 * @return {Drafty} parsed document or null if the source is not plain text.
 */
Drafty.parse = function(content) {
  // Make sure we are parsing strings only.
  if (typeof content != 'string') {
    return null;
  }

  // Split text into lines. It makes further processing easier.
  const lines = content.split(/\r?\n/);

  // Holds entities referenced from text
  const entityMap = [];
  const entityIndex = {};

  // Processing lines one by one, hold intermediate result in blx.
  const blx = [];
  lines.map(function(line) {
    let spans = [];
    let entities;

    // Find formatted spans in the string.
    // Try to match each style.
    INLINE_STYLES.map(function(style) {
      // Each style could be matched multiple times.
      spans = spans.concat(spannify(line, style.start, style.end, style.name));
    });

    let block;
    if (spans.length == 0) {
      block = {
        txt: line
      };
    } else {
      // Sort spans by style occurence early -> late
      spans.sort(function(a, b) {
        return a.start - b.start;
      });

      // Convert an array of possibly overlapping spans into a tree
      spans = toTree(spans);

      // Build a tree representation of the entire string, not
      // just the formatted parts.
      const chunks = chunkify(line, 0, line.length, spans);

      const drafty = draftify(chunks, 0);

      block = {
        txt: drafty.txt,
        fmt: drafty.fmt
      };
    }

    // Extract entities from the cleaned up string.
    entities = extractEntities(block.txt);
    if (entities.length > 0) {
      const ranges = [];
      for (let i in entities) {
        // {offset: match['index'], unique: match[0], len: match[0].length, data: ent.packer(), type: ent.name}
        const entity = entities[i];
        let index = entityIndex[entity.unique];
        if (!index) {
          index = entityMap.length;
          entityIndex[entity.unique] = index;
          entityMap.push({
            tp: entity.type,
            data: entity.data
          });
        }
        ranges.push({
          at: entity.offset,
          len: entity.len,
          key: index
        });
      }
      block.ent = ranges;
    }

    blx.push(block);
  });

  const result = {
    txt: ""
  };

  // Merge lines and save line breaks as BR inline formatting.
  if (blx.length > 0) {
    result.txt = blx[0].txt;
    result.fmt = (blx[0].fmt || []).concat(blx[0].ent || []);

    for (let i = 1; i < blx.length; i++) {
      const block = blx[i];
      const offset = result.txt.length + 1;

      result.fmt.push({
        tp: 'BR',
        len: 1,
        at: offset - 1
      });

      result.txt += " " + block.txt;
      if (block.fmt) {
        result.fmt = result.fmt.concat(block.fmt.map(function(s) {
          s.at += offset;
          return s;
        }));
      }
      if (block.ent) {
        result.fmt = result.fmt.concat(block.ent.map(function(s) {
          s.at += offset;
          return s;
        }));
      }
    }

    if (result.fmt.length == 0) {
      delete result.fmt;
    }

    if (entityMap.length > 0) {
      result.ent = entityMap;
    }
  }
  return result;
}

/**
 * Initialize Drafty document to a plain text string.
 *
 * @param {String} plainText - string to use as Drafty content.
 *
 * @returns new Drafty document or null is plainText is not a string.
 */
Drafty.init = function(plainText) {
  if (typeof plainText != 'string') {
    return null;
  }
  return {
    txt: plainText
  };
}

/**
 * Append one Drafty document to another.
 *
 * @param {Drafty} first - Drafty document to append to.
 * @param {Drafty} second - Drafty document being appended.
 *
 * @return {Drafty} first document with the second appended to it.
 */
Drafty.append = function(first, second) {
  if (first == null) {
    return second;
  }
  if (second == null) {
    return first;
  }

  first.txt = first.txt || '';
  second.txt = second.txt || '';
  const len = first.txt.length;

  first.txt += second.txt;
  if (Array.isArray(second.fmt)) {
    first.fmt = first.fmt || [];
    if (Array.isArray(second.ent)) {
      first.ent = first.ent || [];
    }
    second.fmt.forEach(src => {
      const fmt = {
        at: src.at + len,
        len: src.len
      };
      if (src.tp) {
        fmt.tp = src.tp;
      } else {
        fmt.key = first.ent.length;
        first.ent.push(second.ent[src.key || 0]);
      }
      first.fmt.push(fmt);
    });
  }

  return first;
}

/**
 * @typedef Drafty.ImageDesc
 * @memberof Drafty
 * @type Object
 * @param {string} mime - mime-type of the image, e.g. "image/png"
 * @param {string} preview - base64-encoded image content (or preview, if large image is attached). Could be null/undefined.
 * @param {integer} width - width of the image
 * @param {integer} height - height of the image
 * @param {string} filename - file name suggestion for downloading the image.
 * @param {integer} size - size of the image in bytes. Treat is as an untrusted hint.
 * @param {string} refurl - reference to the content. Could be null/undefined.
 * @param {string} _tempPreview - base64-encoded image preview used during upload process; not serializable.
 * @param {Promise} urlPromise - Promise which returns content URL when resolved.
 */

/**
 * Insert inline image into Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to add image to.
 * @param {integer} at - index where the object is inserted. The length of the image is always 1.
 * @param {ImageDesc} imageDesc - object with image paramenets and data.
 *
 * @return {Drafty} updated document.
 */
Drafty.insertImage = function(content, at, imageDesc) {
  content = content || {
    txt: " "
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: at,
    len: 1,
    key: content.ent.length
  });

  const ex = {
    tp: 'IM',
    data: {
      mime: imageDesc.mime,
      val: imageDesc.preview,
      width: imageDesc.width,
      height: imageDesc.height,
      name: imageDesc.filename,
      size: imageDesc.size | 0,
      ref: imageDesc.refurl
    }
  };

  if (imageDesc.urlPromise) {
    ex.data._tempPreview = imageDesc._tempPreview;
    ex.data._processing = true;
    imageDesc.urlPromise.then(
      (url) => {
        ex.data.ref = url;
        ex.data._tempPreview = undefined;
        ex.data._processing = undefined;
      },
      (err) => {
        /* catch the error, otherwise it will appear in the console. */
        ex.data._processing = undefined;
      }
    );
  }

  content.ent.push(ex);

  return content;
}

/**
 * Append inline image to Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to add image to.
 * @param {ImageDesc} imageDesc - object with image paramenets.
 *
 * @return {Drafty} updated document.
 */
Drafty.appendImage = function(content, imageDesc) {
  content = content || {
    txt: ""
  };
  content.txt += " ";
  return Drafty.insertImage(content, content.txt.length - 1, imageDesc);
}

/**
 * @typedef Drafty.AttachmentDesc
 * @memberof Drafty
 * @type Object
 * @param {string} mime - mime-type of the image, e.g. "image/png"
 * @param {string} data - base64-encoded in-band content of small attachments. Could be null/undefined.
 * @param {string} filename - file name suggestion for downloading the attachment.
 * @param {integer} size - size of the file in bytes. Treat is as an untrusted hint.
 * @param {string} refurl - reference to the out-of-band content. Could be null/undefined.
 * @param {Promise} urlPromise - Promise which returns content URL when resolved.
 */

/**
 * Attach file to Drafty content. Either as a blob or as a reference.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to attach file to.
 * @param {AttachmentDesc} object - containing attachment description and data.
 *
 * @return {Drafty} updated document.
 */
Drafty.attachFile = function(content, attachmentDesc) {
  content = content || {
    txt: ""
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: -1,
    len: 0,
    key: content.ent.length
  });

  const ex = {
    tp: 'EX',
    data: {
      mime: attachmentDesc.mime,
      val: attachmentDesc.data,
      name: attachmentDesc.filename,
      ref: attachmentDesc.refurl,
      size: attachmentDesc.size | 0
    }
  }
  if (attachmentDesc.urlPromise) {
    ex.data._processing = true;
    attachmentDesc.urlPromise.then(
      (url) => {
        ex.data.ref = url;
        ex.data._processing = undefined;
      },
      (err) => {
        /* catch the error, otherwise it will appear in the console. */
        ex.data._processing = undefined;
      }
    );
  }
  content.ent.push(ex);

  return content;
}

/**
 * Wraps content into an interactive form.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty|string} content - to wrap into a form.
 * @param {number} at - index where the forms starts.
 * @param {number} len - length of the form content.
 *
 * @return {Drafty} updated document.
 */
Drafty.wrapAsForm = function(content, at, len) {
  if (typeof content == 'string') {
    content = {
      txt: content
    };
  }
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: at,
    len: len,
    tp: 'FM'
  });

  return content;
}

/**
 * Insert clickable button into Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty|string} content - Drafty document to insert button to or a string to be used as button text.
 * @param {number} at - location where the button is inserted.
 * @param {number} len - the length of the text to be used as button title.
 * @param {string} name - the button. Client should return it to the server when the button is clicked.
 * @param {string} actionType - the type of the button, one of 'url' or 'pub'.
 * @param {string} actionValue - the value to return on click:
 * @param {string} refUrl - the URL to go to when the 'url' button is clicked.
 *
 * @return {Drafty} updated document.
 */
Drafty.insertButton = function(content, at, len, name, actionType, actionValue, refUrl) {
  if (typeof content == 'string') {
    content = {
      txt: content
    };
  }

  if (!content || !content.txt || content.txt.length < at + len) {
    return null;
  }

  if (len <= 0 || ['url', 'pub'].indexOf(actionType) == -1) {
    return null;
  }
  // Ensure refUrl is a string.
  if (actionType == 'url' && !refUrl) {
    return null;
  }
  refUrl = '' + refUrl;

  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: at,
    len: len,
    key: content.ent.length
  });
  content.ent.push({
    tp: 'BN',
    data: {
      act: actionType,
      val: actionValue,
      ref: refUrl,
      name: name
    }
  });

  return content;
}

/**
 * Append clickable button to Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty|string} content - Drafty document to insert button to or a string to be used as button text.
 * @param {string} title - the text to be used as button title.
 * @param {string} name - the button. Client should return it to the server when the button is clicked.
 * @param {string} actionType - the type of the button, one of 'url' or 'pub'.
 * @param {string} actionValue - the value to return on click:
 * @param {string} refUrl - the URL to go to when the 'url' button is clicked.
 *
 * @return {Drafty} updated document.
 */
Drafty.appendButton = function(content, title, name, actionType, actionValue, refUrl) {
  content = content || {
    txt: ""
  };
  const at = content.txt.length;
  content.txt += title;
  return Drafty.insertButton(content, at, title.length, name, actionType, actionValue, refUrl);
}

/**
 * Attach a generic JS object. The object is attached as a json string.
 * Intended for representing a form response.
 *
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - Drafty document to attach file to.
 * @param {Object} data - data to convert to json string and attach.
 * @returns {Drafty} the same document as <code>content</code>.
 */
Drafty.attachJSON = function(content, data) {
  content = content || {
    txt: ""
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: -1,
    len: 0,
    key: content.ent.length
  });

  content.ent.push({
    tp: 'EX',
    data: {
      mime: JSON_MIME_TYPE,
      val: data
    }
  });

  return content;
}
/**
 * Append line break to a Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - Drafty document to append linebreak to.
 * @returns {Drafty} the same document as <code>content</code>.
 */
Drafty.appendLineBreak = function(content) {
  content = content || {
    txt: ""
  };
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: content.txt.length,
    len: 1,
    tp: 'BR'
  });
  content.txt += " ";

  return content;
}
/**
 * Given Drafty document, convert it to HTML.
 * No attempt is made to strip pre-existing html markup.
 * This is potentially unsafe because <code>content.txt</code> may contain malicious
 * markup.
 * @memberof Tinode.Drafty
 * @static
 *
 * @param {Drafy} content - document to convert.
 *
 * @returns {string} HTML-representation of content.
 */
Drafty.UNSAFE_toHTML = function(content) {
  let {
    txt,
    fmt,
    ent
  } = content;

  const markup = [];
  if (fmt) {
    for (let i in fmt) {
      const range = fmt[i];
      const at = range.at | 0;
      let tp = range.tp;
      let data;
      if (!tp) {
        const entity = ent[range.key | 0];
        if (entity) {
          tp = entity.tp;
          data = entity.data;
        }
      }

      if (DECORATORS[tp]) {
        // Because we later sort in descending order, closing markup must come first.
        // Otherwise zero-length objects will not be represented correctly.
        markup.push({
          idx: at + range.len,
          len: -range.len,
          what: DECORATORS[tp].close(data)
        });
        markup.push({
          idx: at,
          len: range.len,
          what: DECORATORS[tp].open(data)
        });
      }
    }
  }

  markup.sort(function(a, b) {
    return b.idx == a.idx ? b.len - a.len : b.idx - a.idx; // in descending order
  });

  for (let i in markup) {
    if (markup[i].what) {
      txt = splice(txt, markup[i].idx, markup[i].what);
    }
  }

  return txt;
}

/**
 * Callback for applying custom formatting/transformation to a Drafty document.
 * Called once for each syle span.
 * @memberof Drafty
 * @static
 *
 * @callback Formatter
 * @param {string} style - style code such as "ST" or "IM".
 * @param {Object} data - entity's data
 * @param {Object} values - possibly styled subspans contained in this style span.
 * @param {number} index - of the current element among its siblings.
 */

/**
 * Transform Drafty document using custom formatting.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to transform.
 * @param {Formatter} formatter - callback which transforms individual elements
 * @param {Object} context - context provided to formatter as <code>this</code>.
 *
 * @return {Object} transformed object
 */
Drafty.format = function(content, formatter, context) {
  let {
    txt,
    fmt,
    ent
  } = content;

  // Assign default values.
  txt = txt || "";
  if (!Array.isArray(ent)) {
    ent = [];
  }

  if (!Array.isArray(fmt)) {
    // Handle special case when all values in fmt are 0 and fmt is skipped.
    if (ent.length == 1) {
      fmt = [{
        at: 0,
        len: 0,
        key: 0
      }];
    } else {
      return [txt];
    }
  }

  let spans = [].concat(fmt);

  // Zero values may have been stripped. Restore them.
  // Also ensure indexes and lengths are sane.
  spans.map(function(s) {
    s.at = s.at || 0;
    s.len = s.len || 0;
    if (s.len < 0) {
      s.len = 0;
    }
    if (s.at < -1) {
      s.at = -1;
    }
  });

  // Sort spans first by start index (asc) then by length (desc).
  spans.sort(function(a, b) {
    if (a.at - b.at == 0) {
      return b.len - a.len; // longer one comes first (<0)
    }
    return a.at - b.at;
  });

  // Denormalize entities into spans. Create a copy of the objects to leave
  // original Drafty object unchanged.
  spans = spans.map((s) => {
    let data;
    let tp = s.tp;
    if (!tp) {
      s.key = s.key || 0;
      if (ent[s.key]) {
        data = ent[s.key].data;
        tp = ent[s.key].tp;
      }
    }

    // Type still not defined? Hide invalid element.
    tp = tp || 'HD';

    return {
      tp: tp,
      data: data,
      at: s.at,
      len: s.len
    };
  });

  return forEach(txt, 0, txt.length, spans, formatter, context);
}

/**
 * Given Drafty document, convert it to plain text.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to convert to plain text.
 * @returns {string} plain-text representation of the drafty document.
 */
Drafty.toPlainText = function(content) {
  return typeof content == 'string' ? content : content.txt;
}

/**
 * Check if the document has no markup and no entities.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to check for presence of markup.
 * @returns <code>true</code> is content is plain text, <code>false</code> otherwise.
 */
Drafty.isPlainText = function(content) {
  return typeof content == 'string' || !(content.fmt || content.ent);
}

/**
 * Checks if the object represets is a valid Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to check for validity.
 * @returns <code>true</code> is content is valid, <code>false</code> otherwise.
 */
Drafty.isValid = function(content) {
  if (!content) {
    return false;
  }

  const {
    txt,
    fmt,
    ent
  } = content;

  if (!txt && txt !== '' && !fmt && !ent) {
    return false;
  }

  const txt_type = typeof txt;
  if (txt_type != 'string' && txt_type != 'undefined' && txt !== null) {
    return false;
  }

  if (typeof fmt != 'undefined' && !Array.isArray(fmt) && fmt !== null) {
    return false;
  }

  if (typeof ent != 'undefined' && !Array.isArray(ent) && ent !== null) {
    return false;
  }
  return true;
}

/**
 * Check if the drafty document has attachments.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to check for attachments.
 * @returns <code>true</code> if there are attachments.
 */
Drafty.hasAttachments = function(content) {
  if (content.ent && content.ent.length > 0) {
    for (let i in content.ent) {
      if (content.ent[i] && content.ent[i].tp == 'EX') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Callback for applying custom formatting/transformation to a Drafty document.
 * Called once for each syle span.
 * @memberof Drafty
 * @static
 *
 * @callback AttachmentCallback
 * @param {Object} data attachment data
 * @param {number} index attachment's index in `content.ent`.
 */

/**
 * Enumerate attachments.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - document to process for attachments.
 * @param {AttachmentCallback} callback - callback to call for each attachment.
 * @param {Object} context - value of "this" for callback.
 */
Drafty.attachments = function(content, callback, context) {
  if (content.ent && content.ent.length > 0) {
    for (let i in content.ent) {
      if (content.ent[i] && content.ent[i].tp == 'EX') {
        callback.call(context, content.ent[i].data, i);
      }
    }
  }
}

/**
 * Given the entity, get URL which can be used for downloading
 * entity data.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entData - entity.data to get the URl from.
 * @returns {string} URL to download entity data or <code>null</code>.
 */
Drafty.getDownloadUrl = function(entData) {
  let url = null;
  if (entData.mime != JSON_MIME_TYPE && entData.val) {
    url = base64toObjectUrl(entData.val, entData.mime, Drafty.logger);
  } else if (typeof entData.ref == 'string') {
    url = entData.ref;
  }
  return url;
}

/**
 * Check if the entity data is not ready for sending, such as being uploaded to the server.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entity.data to get the URl from.
 * @returns {boolean} true if upload is in progress, false otherwise.
 */
Drafty.isProcessing = function(entData) {
  return !!entData._processing;
}

/**
 * Given the entity, get URL which can be used for previewing
 * the entity.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entity.data to get the URl from.
 *
 * @returns {string} url for previewing or null if no such url is available.
 */
Drafty.getPreviewUrl = function(entData) {
  return entData.val ? base64toObjectUrl(entData.val, entData.mime, Drafty.logger) : null;
}

/**
 * Get approximate size of the entity.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entData - entity.data to get the size for.
 * @returns {number} size of entity data in bytes.
 */
Drafty.getEntitySize = function(entData) {
  // Either size hint or length of value. The value is base64 encoded,
  // the actual object size is smaller than the encoded length.
  return entData.size ? entData.size : entData.val ? (entData.val.length * 0.75) | 0 : 0;
}

/**
 * Get entity mime type.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entData - entity.data to get the type for.
 * @returns {string} mime type of entity.
 */
Drafty.getEntityMimeType = function(entData) {
  return entData.mime || 'text/plain';
}

/**
 * Get HTML tag for a given two-letter style name.
 * @memberof Drafty
 * @static
 *
 * @param {string} style - two-letter style, like ST or LN.
 *
 * @returns {string} HTML tag name if style is found, '_UNKN' if not found, {code: undefined} if style is falsish.
 */
Drafty.tagName = function(style) {
  return style ? (HTML_TAGS[style] ? HTML_TAGS[style].name : '_UNKN') : undefined;
}

/**
 * For a given data bundle generate an object with HTML attributes,
 * for instance, given {url: "http://www.example.com/"} return
 * {href: "http://www.example.com/"}
 * @memberof Drafty
 * @static
 *
 * @param {string} style - two-letter style to generate attributes for.
 * @param {Object} data - data bundle to convert to attributes
 *
 * @returns {Object} object with HTML attributes.
 */
Drafty.attrValue = function(style, data) {
  if (data && DECORATORS[style]) {
    return DECORATORS[style].props(data);
  }

  return undefined;
}

/**
 * Drafty MIME type.
 * @memberof Drafty
 * @static
 *
 * @returns {string} HTTP Content-Type "text/x-drafty".
 */
Drafty.getContentType = function() {
  return 'text/x-drafty';
}

/**
 * Shorten Drafty document and strip all entity data leaving just inline styles and entity references.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} original - Drafty object to shorten.
 * @param {number} length - length in characters to shorten to.
 * @returns new shortened Drafty object leaving the original intact.
 */
Drafty.preview = function(original, length) {
  if (!original || length <= 0 || typeof original != 'object') {
    return null;
  }

  const {
    txt,
    fmt,
    ent
  } = original;

  const preview = {
    txt: ''
  };
  let len = 0;
  if (typeof txt == 'string') {
    if (txt.length > length) {
      preview.txt = txt.substr(0, length);
    } else {
      preview.txt = txt;
    }
    len = preview.txt.length;
  }

  if (Array.isArray(fmt) && fmt.length > 0) {
    // Old key to new key entity mapping.
    const ent_refs = [];
    // Count styles which start within the new length of the text and save entity keys as a set.
    let fmt_count = 0;
    let ent_count = 0;
    fmt.forEach((st) => {
      if (st.at < len) {
        fmt_count++;
        if (!st.tp) {
          const key = st.key | 0;
          if (!ent_refs[key]) {
            ent_refs[key] = ent_count;
            ent_count++;
          }
        }
      }
    });

    if (fmt_count == 0) {
      return preview;
    }

    // Allocate space for copying styles and entities.
    preview.fmt = [];
    if (Array.isArray(ent) && ent_refs.length > 0) {
      preview.ent = [];
    }

    // Insertion point for styles.
    let fmt_idx = 0;
    fmt.forEach((st) => {
      if (st.at < len) {
        const style = {
          at: st.at,
          len: st.len
        };
        const key = st.key | 0;
        if (st.tp) {
          style.tp = '' + st.tp;
        } else if (Array.isArray(ent) && ent.length > key && typeof ent_refs[key] == 'number') {
          style.key = ent_refs[key];
          preview.ent[style.key] = copyLight(ent[key]);
        } else {
          return;
        }
        preview.fmt[fmt_idx++] = style;
      }
    });
  }

  return preview;
}

// Create a copy of an entity without large data.
function copyLight(ent) {
  let result = {
    tp: ent.tp
  };
  if (ent.data && Object.entries(ent.data).length != 0) {
    const dc = {};
    ["mime", "name", "width", "height", "size"].forEach((key) => {
      const val = ent.data[key];
      if (val) {
        dc[key] = val;
      }
    });
    if (Object.entries(dc).length != 0) {
      result.data = dc;
    }
  }
  return result;
}

if (typeof module != 'undefined') {
  module.exports = Drafty;
}

},{}],5:[function(require,module,exports){
(function (global){(function (){
/**
 * @file SDK to connect to Tinode chat server.
 * See <a href="https://github.com/tinode/webapp">
 * https://github.com/tinode/webapp</a> for real-life usage.
 *
 * @copyright 2015-2021 Tinode
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.17
 *
 * @example
 * <head>
 * <script src=".../tinode.js"></script>
 * </head>
 *
 * <body>
 *  ...
 * <script>
 *  // Instantiate tinode.
 *  const tinode = new Tinode(APP_NAME, HOST, API_KEY, null, true);
 *  tinode.enableLogging(true);
 *  // Add logic to handle disconnects.
 *  tinode.onDisconnect = function(err) { ... };
 *  // Connect to the server.
 *  tinode.connect().then(() => {
 *    // Connected. Login now.
 *    return tinode.loginBasic(login, password);
 *  }).then((ctrl) => {
 *    // Logged in fine, attach callbacks, subscribe to 'me'.
 *    const me = tinode.getMeTopic();
 *    me.onMetaDesc = function(meta) { ... };
 *    // Subscribe, fetch topic description and the list of contacts.
 *    me.subscribe({get: {desc: {}, sub: {}});
 *  }).catch((err) => {
 *    // Login or subscription failed, do something.
 *    ...
 *  });
 *  ...
 * </script>
 * </body>
 */
'use strict';

// NOTE TO DEVELOPERS:
// Localizable strings should be double quoted "строка на другом языке",
// non-localizable strings should be single quoted 'non-localized'.

// Module imports Node.js style.
if (typeof require == 'function') {
  if (typeof CBuffer == 'undefined') {
    const CBuffer = require('./cbuffer.js');
  }
  if (typeof Connection == 'undefined') {
    const Connection = require('./connection.js');
  }
  if (typeof DBCache == 'undefined') {
    const DBCache = require('./db.js');
  }
  if (typeof Drafty == 'undefined') {
    const Drafty = require('./drafty.js');
  }
  const package_version = require('../version.json').version;
}

let WebSocketProvider;
if (typeof WebSocket != 'undefined') {
  WebSocketProvider = WebSocket;
}

let XHRProvider;
if (typeof XMLHttpRequest != 'undefined') {
  XHRProvider = XMLHttpRequest;
}
initForNonBrowserApp();

// Global constants
const PROTOCOL_VERSION = '0'; // Major component of the version, e.g. '0' in '0.17.1'.
const VERSION = package_version || '0.17';
const LIBRARY = 'tinodejs/' + VERSION;

const TOPIC_NEW = 'new';
const TOPIC_NEW_CHAN = 'nch';
const TOPIC_ME = 'me';
const TOPIC_FND = 'fnd';
const TOPIC_SYS = 'sys';
const TOPIC_CHAN = 'chn';
const USER_NEW = 'new';

// Starting value of a locally-generated seqId used for pending messages.
const LOCAL_SEQID = 0xFFFFFFF;

const MESSAGE_STATUS_NONE = 0; // Status not assigned.
const MESSAGE_STATUS_QUEUED = 1; // Local ID assigned, in progress to be sent.
const MESSAGE_STATUS_SENDING = 2; // Transmission started.
const MESSAGE_STATUS_FAILED = 3; // At least one attempt was made to send the message.
const MESSAGE_STATUS_SENT = 4; // Delivered to the server.
const MESSAGE_STATUS_RECEIVED = 5; // Received by the client.
const MESSAGE_STATUS_READ = 6; // Read by the user.
const MESSAGE_STATUS_TO_ME = 7; // Message from another user.

// Reject unresolved futures after this many milliseconds.
const EXPIRE_PROMISES_TIMEOUT = 5000;
// Periodicity of garbage collection of unresolved futures.
const EXPIRE_PROMISES_PERIOD = 1000;

// Default number of messages to pull into memory from persistent cache.
const DEFAULT_MESSAGES_PAGE = 24;

// Utility functions

// Polyfill for non-browser context, e.g. NodeJs.
function initForNonBrowserApp() {
  // Tinode requirement in native mode because react native doesn't provide Base64 method
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  if (typeof btoa == 'undefined') {
    global.btoa = function(input = '') {
      let str = input;
      let output = '';

      for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || (map = '=', i % 1); output += map.charAt(63 & block >> 8 - i % 1 * 8)) {

        charCode = str.charCodeAt(i += 3 / 4);

        if (charCode > 0xFF) {
          throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
        }

        block = block << 8 | charCode;
      }

      return output;
    };
  }

  if (typeof atob == 'undefined') {
    global.atob = function(input = '') {
      let str = input.replace(/=+$/, '');
      let output = '';

      if (str.length % 4 == 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
      }
      for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++);

        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
          bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
      ) {
        buffer = chars.indexOf(buffer);
      }

      return output;
    };
  }

  if (typeof window == 'undefined') {
    global.window = {
      WebSocket: WebSocketProvider,
      XMLHttpRequest: XHRProvider,
      URL: {
        createObjectURL: function() {
          throw new Error("Unable to use URL.createObjectURL in a non-browser application");
        }
      }
    }
  }

  Connection.setNetworkProviders(WebSocketProvider, XHRProvider);
}

// RFC3339 formater of Date
function rfc3339DateString(d) {
  if (!d || d.getTime() == 0) {
    return undefined;
  }

  function pad(val, sp) {
    sp = sp || 2;
    return '0'.repeat(sp - ('' + val).length) + val;
  }

  const millis = d.getUTCMilliseconds();
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) +
    'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) +
    (millis ? '.' + pad(millis, 3) : '') + 'Z';
}

// btoa replacement. Stock btoa fails on on non-Latin1 strings.
function b64EncodeUnicode(str) {
  // The encodeURIComponent percent-encodes UTF-8 string,
  // then the percent encoding is converted into raw bytes which
  // can be fed into btoa.
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
}

// Recursively merge src's own properties to dst.
// Ignore properties where ignore[property] is true.
// Array and Date objects are shallow-copied.
function mergeObj(dst, src, ignore) {
  if (typeof src != 'object') {
    if (src === Tinode.DEL_CHAR) {
      return undefined;
    }
    if (src === undefined) {
      return dst;
    }
    return src;
  }
  // JS is crazy: typeof null is 'object'.
  if (src === null) {
    return src;
  }

  // Handle Date
  if (src instanceof Date) {
    return (!dst || !(dst instanceof Date) || dst < src) ? src : dst;
  }

  // Access mode
  if (src instanceof AccessMode) {
    return new AccessMode(src);
  }

  // Handle Array
  if (src instanceof Array) {
    return src;
  }

  if (!dst || dst === Tinode.DEL_CHAR) {
    dst = src.constructor();
  }

  for (let prop in src) {
    if (src.hasOwnProperty(prop) &&
      (!ignore || !ignore[prop]) &&
      (prop != '_noForwarding')) {

      dst[prop] = mergeObj(dst[prop], src[prop]);
    }
  }
  return dst;
}

// Update object stored in a cache. Returns updated value.
function mergeToCache(cache, key, newval, ignore) {
  cache[key] = mergeObj(cache[key], newval, ignore);
  return cache[key];
}

function stringToDate(obj) {
  if (typeof obj.created == 'string') {
    obj.created = new Date(obj.created);
  }
  if (typeof obj.updated == 'string') {
    obj.updated = new Date(obj.updated);
  }
  if (typeof obj.touched == 'string') {
    obj.touched = new Date(obj.touched);
  }
}

// JSON stringify helper - pre-processor for JSON.stringify
function jsonBuildHelper(key, val) {
  if (val instanceof Date) {
    // Convert javascript Date objects to rfc3339 strings
    val = rfc3339DateString(val);
  } else if (val instanceof AccessMode) {
    val = val.jsonHelper();
  } else if (val === undefined || val === null || val === false ||
    (Array.isArray(val) && val.length == 0) ||
    ((typeof val == 'object') && (Object.keys(val).length == 0))) {
    // strip out empty elements while serializing objects to JSON
    return undefined;
  }

  return val;
};

// Strips all values from an object of they evaluate to false or if their name starts with '_'.
function simplify(obj) {
  Object.keys(obj).forEach(function(key) {
    if (key[0] == '_') {
      // Strip fields like "obj._key".
      delete obj[key];
    } else if (!obj[key]) {
      // Strip fields which evaluate to false.
      delete obj[key];
    } else if (Array.isArray(obj[key]) && obj[key].length == 0) {
      // Strip empty arrays.
      delete obj[key];
    } else if (!obj[key]) {
      // Strip fields which evaluate to false.
      delete obj[key];
    } else if (typeof obj[key] == 'object' && !(obj[key] instanceof Date)) {
      simplify(obj[key]);
      // Strip empty objects.
      if (Object.getOwnPropertyNames(obj[key]).length == 0) {
        delete obj[key];
      }
    }
  });
  return obj;
};

// Trim whitespace, strip empty and duplicate elements elements.
// If the result is an empty array, add a single element "\u2421" (Unicode Del character).
function normalizeArray(arr) {
  let out = [];
  if (Array.isArray(arr)) {
    // Trim, throw away very short and empty tags.
    for (let i = 0, l = arr.length; i < l; i++) {
      let t = arr[i];
      if (t) {
        t = t.trim().toLowerCase();
        if (t.length > 1) {
          out.push(t);
        }
      }
    }
    out.sort().filter(function(item, pos, ary) {
      return !pos || item != ary[pos - 1];
    });
  }
  if (out.length == 0) {
    // Add single tag with a Unicode Del character, otherwise an ampty array
    // is ambiguos. The Del tag will be stripped by the server.
    out.push(Tinode.DEL_CHAR);
  }
  return out;
}

// Attempt to convert date strings to objects.
function jsonParseHelper(key, val) {
  // Convert string timestamps with optional milliseconds to Date
  // 2015-09-02T01:45:43[.123]Z
  if (key === 'ts' && typeof val === 'string' &&
    val.length >= 20 && val.length <= 24) {
    let date = new Date(val);
    if (date) {
      return date;
    }
  } else if (key === 'acs' && typeof val === 'object') {
    return new AccessMode(val);
  }
  return val;
};

// Trims very long strings (encoded images) to make logged packets more readable.
function jsonLoggerHelper(key, val) {
  if (typeof val == 'string' && val.length > 128) {
    return '<' + val.length + ', bytes: ' + val.substring(0, 12) + '...' + val.substring(val.length - 12) + '>';
  }
  return jsonBuildHelper(key, val);
};

// Parse browser user agent to extract browser name and version.
function getBrowserInfo(ua, product) {
  ua = ua || '';
  let reactnative = '';
  // Check if this is a ReactNative app.
  if (/reactnative/i.test(product)) {
    reactnative = 'ReactNative; ';
  }
  // Then test for WebKit based browser.
  ua = ua.replace(' (KHTML, like Gecko)', '');
  let m = ua.match(/(AppleWebKit\/[.\d]+)/i);
  let result;
  if (m) {
    // List of common strings, from more useful to less useful.
    let priority = ['chrome', 'safari', 'mobile', 'version'];
    let tmp = ua.substr(m.index + m[0].length).split(' ');
    let tokens = [];
    // Split Name/0.0.0 into Name and version 0.0.0
    for (let i = 0; i < tmp.length; i++) {
      let m2 = /([\w.]+)[\/]([\.\d]+)/.exec(tmp[i]);
      if (m2) {
        tokens.push([m2[1], m2[2], priority.findIndex(function(e) {
          return (e == m2[1].toLowerCase());
        })]);
      }
    }
    // Sort by priority: more interesting is earlier than less interesting.
    tokens.sort(function(a, b) {
      let diff = a[2] - b[2];
      return diff != 0 ? diff : b[0].length - a[0].length;
    });
    if (tokens.length > 0) {
      // Return the least common browser string and version.
      result = tokens[0][0] + '/' + tokens[0][1];
    } else {
      // Failed to ID the browser. Return the webkit version.
      result = m[1];
    }
    // Test for MSIE.
  } else if (/trident/i.test(ua)) {
    m = /(?:\brv[ :]+([.\d]+))|(?:\bMSIE ([.\d]+))/g.exec(ua);
    if (m) {
      result = 'MSIE/' + (m[1] || m[2]);
    } else {
      result = 'MSIE/?';
    }
    // Test for Firefox.
  } else if (/firefox/i.test(ua)) {
    m = /Firefox\/([.\d]+)/g.exec(ua);
    if (m) {
      result = 'Firefox/' + m[1];
    } else {
      result = 'Firefox/?';
    }
    // Older Opera.
  } else if (/presto/i.test(ua)) {
    m = /Opera\/([.\d]+)/g.exec(ua);
    if (m) {
      result = 'Opera/' + m[1];
    } else {
      result = 'Opera/?';
    }
  } else {
    // Failed to parse anything meaningfull. Try the last resort.
    m = /([\w.]+)\/([.\d]+)/.exec(ua);
    if (m) {
      result = m[1] + '/' + m[2];
    } else {
      m = ua.split(' ');
      result = m[0];
    }
  }

  // Shorten the version to one dot 'a.bb.ccc.d -> a.bb' at most.
  m = result.split('/');
  if (m.length > 1) {
    let v = m[1].split('.');
    result = m[0] + '/' + v[0] + (v[1] ? '.' + v[1] : '');
  }
  return reactnative + result;
}

/**
 * @class Tinode
 *
 * @param {Object} config - configuration parameters.
 * @param {string} config.appName - Name of the calling application to be reported in the User Agent.
 * @param {string} config.host - Host name and port number to connect to.
 * @param {string} config.apiKey - API key generated by <code>keygen</code>.
 * @param {string} config.transport - See {@link Tinode.Connection#transport}.
 * @param {boolean} config.secure - Use Secure WebSocket if <code>true</code>.
 * @param {string} config.platform - Optional platform identifier, one of <code>"ios"</code>, <code>"web"</code>, <code>"android"</code>.
 * @param {boolen} config.persist - use indexDB persistent storage.
 * @param {function} onComplete - callback to call when initialization is completed.
 */
var Tinode = function(config, onComplete) {
  // Client-provided application name, format <Name>/<version number>
  this._appName = config.appName || "Undefined";

  // API Key.
  this._apiKey = config.apiKey;

  // Name and version of the browser.
  this._browser = '';
  this._platform = config.platform || 'web';
  this._hwos = 'undefined';
  this._humanLanguage = 'xx';
  // Underlying OS.
  if (typeof navigator != 'undefined') {
    this._browser = getBrowserInfo(navigator.userAgent, navigator.product);
    this._hwos = navigator.platform;
    // This is the default language. It could be changed by client.
    this._humanLanguage = navigator.language || 'en-US';
  }
  // Logging to console enabled
  this._loggingEnabled = false;
  // When logging, trip long strings (base64-encoded images) for readability
  this._trimLongStrings = false;
  // UID of the currently authenticated user.
  this._myUID = null;
  // Status of connection: authenticated or not.
  this._authenticated = false;
  // Login used in the last successful basic authentication
  this._login = null;
  // Token which can be used for login instead of login/password.
  this._authToken = null;
  // Counter of received packets
  this._inPacketCount = 0;
  // Counter for generating unique message IDs
  this._messageId = Math.floor((Math.random() * 0xFFFF) + 0xFFFF);
  // Information about the server, if connected
  this._serverInfo = null;
  // Push notification token. Called deviceToken for consistency with the Android SDK.
  this._deviceToken = null;

  // Cache of pending promises by message id.
  this._pendingPromises = {};

  // The Timeout object returned by the reject expired promises setInterval.
  this._expirePromises = null;

  /** A connection object, see {@link Tinode.Connection}. */
  this._connection = new Connection(config.host, config.apiKey, config.transport, config.secure, true);
  // Console logger. Babel somehow fails to parse '...rest' parameter.
  this.logger = (str, ...args) => {
    if (this._loggingEnabled) {
      const d = new Date()
      const dateString = ('0' + d.getUTCHours()).slice(-2) + ':' +
        ('0' + d.getUTCMinutes()).slice(-2) + ':' +
        ('0' + d.getUTCSeconds()).slice(-2) + '.' +
        ('00' + d.getUTCMilliseconds()).slice(-3);

      console.log('[' + dateString + ']', str, args.join(' '));
    }
  }
  this._connection.logger = this.logger;
  Drafty.logger = this.logger;

  // Timestamp of the most recent update to topics in cache.
  this._lastTopicUpdate = null;

  // Tinode's cache of objects
  this._cache = {};

  const cachePut = this.cachePut = (type, name, obj) => {
    this._cache[type + ':' + name] = obj;
  }

  const cacheGet = this.cacheGet = (type, name) => {
    return this._cache[type + ':' + name];
  }

  const cacheDel = this.cacheDel = (type, name) => {
    delete this._cache[type + ':' + name];
  }
  // Enumerate all items in cache, call func for each item.
  // Enumeration stops if func returns true.
  const cacheMap = this.cacheMap = (type, func, context) => {
    const key = type ? type + ':' : undefined;
    for (let idx in this._cache) {
      if (!key || idx.indexOf(key) == 0) {
        if (func.call(context, this._cache[idx], idx)) {
          break;
        }
      }
    }
  }

  // Make limited cache management available to topic.
  // Caching user.public only. Everything else is per-topic.
  this.attachCacheToTopic = (topic) => {
    topic._tinode = this;

    topic._cacheGetUser = (uid) => {
      const pub = cacheGet('user', uid);
      if (pub) {
        return {
          user: uid,
          public: mergeObj({}, pub)
        };
      }
      return undefined;
    };
    topic._cachePutUser = (uid, user) => {
      return cachePut('user', uid, mergeObj({}, user.public));
    };
    topic._cacheDelUser = (uid) => {
      return cacheDel('user', uid);
    };
    topic._cachePutSelf = () => {
      if (topic.updated && topic.updated > this._lastTopicUpdate) {
        this._lastTopicUpdate = topic.updated;
      }
      return cachePut('topic', topic.name, topic);
    }
    topic._cacheDelSelf = () => {
      return cacheDel('topic', topic.name);
    }
  }

  // Use indexDB for caching topics and messages.
  this._persist = config.persist;
  // Initialize object regardless. It simplifies the code.
  this._db = DBCache((err) => {
    this.logger("DB", err);
  }, this.logger);

  if (this._persist) {
    // Create the persistent cache and read topics into memory.
    this._db.initDatabase().then(() => {
      // Store promises to be resolved when messages load into memory.
      const msgs = [];
      // Load topics to memory.
      return this._db.mapTopics((data) => {
        let topic = this.cacheGet('topic', data.name);
        if (topic) {
          return;
        }
        if (data.name == TOPIC_ME) {
          topic = new TopicMe();
        } else if (data.name == TOPIC_FND) {
          topic = new TopicFnd();
        } else {
          topic = new Topic(data.name);
        }

        this._db.deserializeTopic(topic, data);
        this.attachCacheToTopic(topic);
        topic._cachePutSelf();
        // Request to load messages and save the promise.
        msgs.push(topic._loadMessages(this._db));
      }).then(() => {
        // Wait for all messages to load.
        return Promise.all(msgs);
      }).then(() => {
        if (onComplete) {
          onComplete();
        }
        this.logger("Persistent cache initialized.");
      });
    });
  } else {
    this._db.disable();
  }

  // Resolve or reject a pending promise.
  // Unresolved promises are stored in _pendingPromises.
  const execPromise = (id, code, onOK, errorText) => {
    const callbacks = this._pendingPromises[id];
    if (callbacks) {
      delete this._pendingPromises[id];
      if (code >= 200 && code < 400) {
        if (callbacks.resolve) {
          callbacks.resolve(onOK);
        }
      } else if (callbacks.reject) {
        callbacks.reject(new Error(`${errorText} (${code})`));
      }
    }
  }

  // Generator of default promises for sent packets.
  const makePromise = (id) => {
    let promise = null;
    if (id) {
      promise = new Promise((resolve, reject) => {
        // Stored callbacks will be called when the response packet with this Id arrives
        this._pendingPromises[id] = {
          'resolve': resolve,
          'reject': reject,
          'ts': new Date()
        };
      })
    }
    return promise;
  }

  // Generates unique message IDs
  const getNextUniqueId = this.getNextUniqueId = () => {
    return (this._messageId != 0) ? '' + this._messageId++ : undefined;
  }

  // Get User Agent string
  const getUserAgent = () => {
    return this._appName + ' (' + (this._browser ? this._browser + '; ' : '') + this._hwos + '); ' + LIBRARY;
  }

  // Generator of packets stubs
  this.initPacket = (type, topic) => {
    switch (type) {
      case 'hi':
        return {
          'hi': {
            'id': getNextUniqueId(),
            'ver': VERSION,
            'ua': getUserAgent(),
            'dev': this._deviceToken,
            'lang': this._humanLanguage,
            'platf': this._platform
          }
        };

      case 'acc':
        return {
          'acc': {
            'id': getNextUniqueId(),
            'user': null,
            'scheme': null,
            'secret': null,
            'login': false,
            'tags': null,
            'desc': {},
            'cred': {}
          }
        };

      case 'login':
        return {
          'login': {
            'id': getNextUniqueId(),
            'scheme': null,
            'secret': null
          }
        };

      case 'sub':
        return {
          'sub': {
            'id': getNextUniqueId(),
            'topic': topic,
            'set': {},
            'get': {}
          }
        };

      case 'leave':
        return {
          'leave': {
            'id': getNextUniqueId(),
            'topic': topic,
            'unsub': false
          }
        };

      case 'pub':
        return {
          'pub': {
            'id': getNextUniqueId(),
            'topic': topic,
            'noecho': false,
            'head': null,
            'content': {}
          }
        };

      case 'get':
        return {
          'get': {
            'id': getNextUniqueId(),
            'topic': topic,
            'what': null, // data, sub, desc, space separated list; unknown strings are ignored
            'desc': {},
            'sub': {},
            'data': {}
          }
        };

      case 'set':
        return {
          'set': {
            'id': getNextUniqueId(),
            'topic': topic,
            'desc': {},
            'sub': {},
            'tags': []
          }
        };

      case 'del':
        return {
          'del': {
            'id': getNextUniqueId(),
            'topic': topic,
            'what': null,
            'delseq': null,
            'user': null,
            'hard': false
          }
        };

      case 'note':
        return {
          'note': {
            // no id by design
            'topic': topic,
            'what': null, // one of "recv", "read", "kp"
            'seq': undefined // the server-side message id aknowledged as received or read
          }
        };

      default:
        throw new Error(`Unknown packet type requested: ${type}`);
    }
  }

  // Send a packet. If packet id is provided return a promise.
  this.send = (pkt, id) => {
    let promise;
    if (id) {
      promise = makePromise(id);
    }
    pkt = simplify(pkt);
    let msg = JSON.stringify(pkt);
    this.logger("out: " + (this._trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : msg));
    try {
      this._connection.sendText(msg);
    } catch (err) {
      // If sendText throws, wrap the error in a promise or rethrow.
      if (id) {
        execPromise(id, Connection.NETWORK_ERROR, null, err.message);
      } else {
        throw err;
      }
    }
    return promise;
  }

  // On successful login save server-provided data.
  this.loginSuccessful = (ctrl) => {
    if (!ctrl.params || !ctrl.params.user) {
      return ctrl;
    }
    // This is a response to a successful login,
    // extract UID and security token, save it in Tinode module
    this._myUID = ctrl.params.user;
    this._authenticated = (ctrl && ctrl.code >= 200 && ctrl.code < 300);
    if (ctrl.params && ctrl.params.token && ctrl.params.expires) {
      this._authToken = {
        token: ctrl.params.token,
        expires: new Date(ctrl.params.expires)
      };
    } else {
      this._authToken = null;
    }

    if (this.onLogin) {
      this.onLogin(ctrl.code, ctrl.text);
    }

    return ctrl;
  }

  // The main message dispatcher.
  this._connection.onMessage = (data) => {
    // Skip empty response. This happens when LP times out.
    if (!data) return;

    this._inPacketCount++;

    // Send raw message to listener
    if (this.onRawMessage) {
      this.onRawMessage(data);
    }

    if (data === '0') {
      // Server response to a network probe.
      if (this.onNetworkProbe) {
        this.onNetworkProbe();
      }
      // No processing is necessary.
      return;
    }

    let pkt = JSON.parse(data, jsonParseHelper);
    if (!pkt) {
      this.logger("in: " + data);
      this.logger("ERROR: failed to parse data");
    } else {
      this.logger("in: " + (this._trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : data));

      // Send complete packet to listener
      if (this.onMessage) {
        this.onMessage(pkt);
      }

      if (pkt.ctrl) {
        // Handling {ctrl} message
        if (this.onCtrlMessage) {
          this.onCtrlMessage(pkt.ctrl);
        }

        // Resolve or reject a pending promise, if any
        if (pkt.ctrl.id) {
          execPromise(pkt.ctrl.id, pkt.ctrl.code, pkt.ctrl, pkt.ctrl.text);
        }
        setTimeout(() => {
          if (pkt.ctrl.code == 205 && pkt.ctrl.text == 'evicted') {
            // User evicted from topic.
            const topic = cacheGet('topic', pkt.ctrl.topic);
            if (topic) {
              topic._resetSub();
              if (pkt.ctrl.params && pkt.ctrl.params.unsub) {
                topic._gone();
              }
            }
          } else if (pkt.ctrl.params && pkt.ctrl.params.what == 'data') {
            // All messages received: "params":{"count":11,"what":"data"},
            const topic = cacheGet('topic', pkt.ctrl.topic);
            if (topic) {
              topic._allMessagesReceived(pkt.ctrl.params.count);
            }
          } else if (pkt.ctrl.params && pkt.ctrl.params.what == 'sub') {
            // The topic has no subscriptions.
            const topic = cacheGet('topic', pkt.ctrl.topic);
            if (topic) {
              // Trigger topic.onSubsUpdated.
              topic._processMetaSub([]);
            }
          }
        }, 0);
      } else {
        setTimeout(() => {
          if (pkt.meta) {
            // Handling a {meta} message.

            // Preferred API: Route meta to topic, if one is registered
            const topic = cacheGet('topic', pkt.meta.topic);
            if (topic) {
              topic._routeMeta(pkt.meta);
            }

            if (pkt.meta.id) {
              execPromise(pkt.meta.id, 200, pkt.meta, 'META');
            }

            // Secondary API: callback
            if (this.onMetaMessage) {
              this.onMetaMessage(pkt.meta);
            }
          } else if (pkt.data) {
            // Handling {data} message

            // Preferred API: Route data to topic, if one is registered
            const topic = cacheGet('topic', pkt.data.topic);
            if (topic) {
              topic._routeData(pkt.data);
            }

            // Secondary API: Call callback
            if (this.onDataMessage) {
              this.onDataMessage(pkt.data);
            }
          } else if (pkt.pres) {
            // Handling {pres} message

            // Preferred API: Route presence to topic, if one is registered
            const topic = cacheGet('topic', pkt.pres.topic);
            if (topic) {
              topic._routePres(pkt.pres);
            }

            // Secondary API - callback
            if (this.onPresMessage) {
              this.onPresMessage(pkt.pres);
            }
          } else if (pkt.info) {
            // {info} message - read/received notifications and key presses

            // Preferred API: Route {info}} to topic, if one is registered
            const topic = cacheGet('topic', pkt.info.topic);
            if (topic) {
              topic._routeInfo(pkt.info);
            }

            // Secondary API - callback
            if (this.onInfoMessage) {
              this.onInfoMessage(pkt.info);
            }
          } else {
            this.logger("ERROR: Unknown packet received.");
          }
        }, 0);
      }
    }
  }

  // Ready to start sending.
  this._connection.onOpen = () => {
    if (!this._expirePromises) {
      // Reject promises which have not been resolved for too long.
      this._expirePromises = setInterval(() => {
        const err = new Error("Timeout (504)");
        const expires = new Date(new Date().getTime() - EXPIRE_PROMISES_TIMEOUT);
        for (let id in this._pendingPromises) {
          let callbacks = this._pendingPromises[id];
          if (callbacks && callbacks.ts < expires) {
            this.logger("Promise expired", id);
            delete this._pendingPromises[id];
            if (callbacks.reject) {
              callbacks.reject(err);
            }
          }
        }
      }, EXPIRE_PROMISES_PERIOD);
    }
    this.hello();
  }

  // Wrapper for the reconnect iterator callback.
  this._connection.onAutoreconnectIteration = (timeout, promise) => {
    if (this.onAutoreconnectIteration) {
      this.onAutoreconnectIteration(timeout, promise);
    }
  }

  this._connection.onDisconnect = (err, code) => {
    this._inPacketCount = 0;
    this._serverInfo = null;
    this._authenticated = false;

    if (this._expirePromises) {
      clearInterval(this._expirePromises);
      this._expirePromises = null;
    }

    // Mark all topics as unsubscribed
    cacheMap('topic', (topic, key) => {
      topic._resetSub();
    });

    // Reject all pending promises
    for (let key in this._pendingPromises) {
      const callbacks = this._pendingPromises[key];
      if (callbacks && callbacks.reject) {
        callbacks.reject(err);
      }
    }
    this._pendingPromises = {};

    if (this.onDisconnect) {
      this.onDisconnect(err);
    }
  }
};

// Static methods.

/**
 * @typedef Credential
 * @type {object}
 * @property {string} meth - validation method.
 * @property {string} val - value to validate (e.g. email or phone number).
 * @property {string} resp - validation response.
 * @property {Object} params - validation parameters.
 */
/**
 * Helper method to package account credential.
 *
 * @memberof Tinode
 * @static
 *
 * @param {string | Credential} meth - validation method or object with validation data.
 * @param {string=} val - validation value (e.g. email or phone number).
 * @param {Object=} params - validation parameters.
 * @param {string=} resp - validation response.
 *
 * @returns {Array.<Credential>} array with a single credential or <code>null</code> if no valid credentials were given.
 */
Tinode.credential = function(meth, val, params, resp) {
  if (typeof meth == 'object') {
    ({
      val,
      params,
      resp,
      meth
    } = meth);
  }
  if (meth && (val || resp)) {
    return [{
      'meth': meth,
      'val': val,
      'resp': resp,
      'params': params
    }];
  }
  return null;
};

/**
 * Determine topic type from topic's name: grp, p2p, me, fnd, sys.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {string} One of <code>"me"</code>, <code>"fnd"</code>, <code>"sys"</code>, <code>"grp"</code>,
 *    <code>"p2p"</code> or <code>undefined</code>.
 */
Tinode.topicType = function(name) {
  const types = {
    'me': 'me',
    'fnd': 'fnd',
    'grp': 'grp',
    'new': 'grp',
    'nch': 'grp',
    'chn': 'grp',
    'usr': 'p2p',
    'sys': 'sys'
  };
  return types[(typeof name == 'string') ? name.substring(0, 3) : 'xxx'];
};

/**
 * Check if the given topic name is a name of a 'me' topic.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {boolean} <code>true</code> if the name is a name of a 'me' topic, <code>false</code> otherwise.
 */
Tinode.isMeTopicName = function(name) {
  return Tinode.topicType(name) == 'me';
};

/**
 * Check if the given topic name is a name of a group topic.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {boolean} <code>true</code> if the name is a name of a group topic, <code>false</code> otherwise.
 */
Tinode.isGroupTopicName = function(name) {
  return Tinode.topicType(name) == 'grp';
};

/**
 * Check if the given topic name is a name of a p2p topic.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {boolean} <code>true</code> if the name is a name of a p2p topic, <code>false</code> otherwise.
 */
Tinode.isP2PTopicName = function(name) {
  return Tinode.topicType(name) == 'p2p';
};

/**
 * Check if the given topic name is a name of a communication topic, i.e. P2P or group.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - Name of the topic to test.
 * @returns {boolean} <code>true</code> if the name is a name of a p2p or group topic, <code>false</code> otherwise.
 */
Tinode.isCommTopicName = function(name) {
  return Tinode.isP2PTopicName(name) || Tinode.isGroupTopicName(name);
};

/**
 * Check if the topic name is a name of a new topic.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - topic name to check.
 * @returns {boolean} <code>true</code> if the name is a name of a new topic, <code>false</code> otherwise.
 */
Tinode.isNewGroupTopicName = function(name) {
  return (typeof name == 'string') &&
    (name.substring(0, 3) == TOPIC_NEW || name.substring(0, 3) == TOPIC_NEW_CHAN);
};

/**
 * Check if the topic name is a name of a channel.
 * @memberof Tinode
 * @static
 *
 * @param {string} name - topic name to check.
 * @returns {boolean} <code>true</code> if the name is a name of a channel, <code>false</code> otherwise.
 */
Tinode.isChannelTopicName = function(name) {
  return (typeof name == 'string') &&
    (name.substring(0, 3) == TOPIC_CHAN || name.substring(0, 3) == TOPIC_NEW_CHAN);
};

/**
 * Return information about the current version of this Tinode client library.
 * @memberof Tinode
 * @static
 *
 * @returns {string} semantic version of the library, e.g. <code>"0.15.5-rc1"</code>.
 */
Tinode.getVersion = function() {
  return VERSION;
};

/**
 * To use Tinode in a non browser context, supply WebSocket and XMLHttpRequest providers.
 * @static
 * @memberof Tinode
 * @param wsProvider WebSocket provider, e.g. for nodeJS , <code>require('ws')</code>.
 * @param xhrProvider XMLHttpRequest provider, e.g. for node <code>require('xhr')</code>.
 */
Tinode.setNetworkProviders = function(wsProvider, xhrProvider) {
  WebSocketProvider = wsProvider;
  XHRProvider = xhrProvider;
};

/**
 * Return information about the current name and version of this Tinode library.
 * @memberof Tinode
 * @static
 *
 * @returns {string} the name of the library and it's version.
 */
Tinode.getLibrary = function() {
  return LIBRARY;
};

// Exported constants
Tinode.MESSAGE_STATUS_NONE = MESSAGE_STATUS_NONE;
Tinode.MESSAGE_STATUS_QUEUED = MESSAGE_STATUS_QUEUED;
Tinode.MESSAGE_STATUS_SENDING = MESSAGE_STATUS_SENDING;
Tinode.MESSAGE_STATUS_FAILED = MESSAGE_STATUS_FAILED;
Tinode.MESSAGE_STATUS_SENT = MESSAGE_STATUS_SENT;
Tinode.MESSAGE_STATUS_RECEIVED = MESSAGE_STATUS_RECEIVED;
Tinode.MESSAGE_STATUS_READ = MESSAGE_STATUS_READ;
Tinode.MESSAGE_STATUS_TO_ME = MESSAGE_STATUS_TO_ME;

// Unicode [del] symbol.
Tinode.DEL_CHAR = '\u2421';

/**
 * Check if the given string represents <code>NULL</code> value as defined by Tinode (<code>'\u2421'</code>).
 * @memberof Tinode
 * @static
 *
 * @param {string} str - string to check for <code>NULL</code> value.
 *
 * @returns {boolean} <code>true</code> if string represents <code>NULL</code> value, <code>false</code> otherwise.
 */
Tinode.isNullValue = function(str) {
  return str === Tinode.DEL_CHAR;
};

/**
 * Check if the given URL string is a relative URL.
 * Check for cases like:
 *  <code>'http://example.com'</code>
 *  <code>' http://example.com'</code>
 *  <code>'//example.com/'</code>
 *  <code>'http:example.com'</code>
 *  <code>'http:/example.com'</code>
 * @memberof Tinode
 * @static
 *
 * @param {string} url - URL string to check.
 *
 * @returns {boolean} <code>true</code> if the URL is relative, <code>false</code> otherwise.
 */
Tinode.isRelativeURL = function(url) {
  return !/^\s*([a-z][a-z0-9+.-]*:|\/\/)/im.test(url);
};

// Names of keys to server-provided configuration limits.
Tinode.MAX_MESSAGE_SIZE = 'maxMessageSize';
Tinode.MAX_SUBSCRIBER_COUNT = 'maxSubscriberCount';
Tinode.MAX_TAG_COUNT = 'maxTagCount';
Tinode.MAX_FILE_UPLOAD_SIZE = 'maxFileUploadSize';

// Public methods;
Tinode.prototype = {
  /**
   * Connect to the server.
   * @memberof Tinode#
   *
   * @param {string} host_ - name of the host to connect to.
   *
   * @return {Promise} Promise resolved/rejected when the connection call completes:
   *    <code>resolve()</code> is called without parameters, <code>reject()</code> receives the
   *    <code>Error</code> as a single parameter.
   */
  connect: function(host_) {
    return this._connection.connect(host_);
  },

  /**
   * Attempt to reconnect to the server immediately.
   * @memberof Tinode#
   *
   * @param {string} force - reconnect even if there is a connection already.
   */
  reconnect: function(force) {
    this._connection.reconnect(force);
  },

  /**
   * Disconnect from the server.
   * @memberof Tinode#
   */
  disconnect: function() {
    this._connection.disconnect();
  },

  /**
   * Clear persistent cache: remove indexDB cache of the most recently logged in user.
   */
  clearStorage: function() {
    if (this._db) {
      this._db.deleteDatabase();
    }
  },

  /**
   * Send a network probe message to make sure the connection is alive.
   * @memberof Tinode#
   */
  networkProbe: function() {
    this._connection.probe();
  },

  /**
   * Check for live connection to server.
   * @memberof Tinode#
   *
   * @returns {boolean} <code>true</code> if there is a live connection, <code>false</code> otherwise.
   */
  isConnected: function() {
    return this._connection.isConnected();
  },

  /**
   * Check if connection is authenticated (last login was successful).
   * @memberof Tinode#
   * @returns {boolean} <code>true</code> if authenticated, <code>false</code> otherwise.
   */
  isAuthenticated: function() {
    return this._authenticated;
  },

  /**
   * Add API key and auth token to the relative URL making it usable for getting data
   * from the server in a simple <code>HTTP GET</code> request.
   * @memberof Tinode#
   *
   * @param {string} URL - URL to wrap.
   * @returns {string} URL with appended API key and token, if valid token is present.
   */
  authorizeURL: function(url) {
    if (!url) {
      return url;
    }

    if (Tinode.isRelativeURL(url)) {
      // Fake base to make the relative URL parseable.
      const base = 'scheme://host/';
      const parsed = new URL(url, base);
      if (this._apiKey) {
        parsed.searchParams.append('apikey', this._apiKey);
      }
      if (this._authToken.token) {
        parsed.searchParams.append('auth', 'token');
        parsed.searchParams.append('secret', this._authToken.token);
      }
      // Convert back to string and strip fake base URL except for the root slash.
      url = parsed.toString().substring(base.length - 1);
    }
    return url;
  },

  /**
   * @typedef AccountParams
   * @memberof Tinode
   * @type {Object}
   * @property {Tinode.DefAcs=} defacs - Default access parameters for user's <code>me</code> topic.
   * @property {Object=} public - Public application-defined data exposed on <code>me</code> topic.
   * @property {Object=} private - Private application-defined data accessible on <code>me</code> topic.
   * @property {Array} tags - array of string tags for user discovery.
   * @property {string=} token - authentication token to use.
   */
  /**
   * @typedef DefAcs
   * @memberof Tinode
   * @type {Object}
   * @property {string=} auth - Access mode for <code>me</code> for authenticated users.
   * @property {string=} anon - Access mode for <code>me</code> for anonymous users.
   */

  /**
   * Create or update an account.
   * @memberof Tinode#
   *
   * @param {string} uid - User id to update
   * @param {string} scheme - Authentication scheme; <code>"basic"</code> and <code>"anonymous"</code> are the currently supported schemes.
   * @param {string} secret - Authentication secret, assumed to be already base64 encoded.
   * @param {boolean=} login - Use new account to authenticate current session
   * @param {Tinode.AccountParams=} params - User data to pass to the server.
   */
  account: function(uid, scheme, secret, login, params) {
    const pkt = this.initPacket('acc');
    pkt.acc.user = uid;
    pkt.acc.scheme = scheme;
    pkt.acc.secret = secret;
    // Log in to the new account using selected scheme
    pkt.acc.login = login;

    if (params) {
      pkt.acc.desc.defacs = params.defacs;
      pkt.acc.desc.public = params.public;
      pkt.acc.desc.private = params.private;

      pkt.acc.tags = params.tags;
      pkt.acc.cred = params.cred;

      pkt.acc.token = params.token;
    }

    return this.send(pkt, pkt.acc.id);
  },

  /**
   * Create a new user. Wrapper for {@link Tinode#account}.
   * @memberof Tinode#
   *
   * @param {string} scheme - Authentication scheme; <code>"basic"</code> is the only currently supported scheme.
   * @param {string} secret - Authentication.
   * @param {boolean=} login - Use new account to authenticate current session
   * @param {Tinode.AccountParams=} params - User data to pass to the server.
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  createAccount: function(scheme, secret, login, params) {
    let promise = this.account(USER_NEW, scheme, secret, login, params);
    if (login) {
      promise = promise.then((ctrl) => {
        return this.loginSuccessful(ctrl);
      });
    }
    return promise;
  },

  /**
   * Create user with <code>'basic'</code> authentication scheme and immediately
   * use it for authentication. Wrapper for {@link Tinode#account}.
   * @memberof Tinode#
   *
   * @param {string} username - Login to use for the new account.
   * @param {string} password - User's password.
   * @param {Tinode.AccountParams=} params - User data to pass to the server.
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  createAccountBasic: function(username, password, params) {
    // Make sure we are not using 'null' or 'undefined';
    username = username || '';
    password = password || '';
    return this.createAccount('basic',
      b64EncodeUnicode(username + ':' + password), true, params);
  },

  /**
   * Update user's credentials for <code>'basic'</code> authentication scheme. Wrapper for {@link Tinode#account}.
   * @memberof Tinode#
   *
   * @param {string} uid - User ID to update.
   * @param {string} username - Login to use for the new account.
   * @param {string} password - User's password.
   * @param {Tinode.AccountParams=} params - data to pass to the server.
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  updateAccountBasic: function(uid, username, password, params) {
    // Make sure we are not using 'null' or 'undefined';
    username = username || '';
    password = password || '';
    return this.account(uid, 'basic',
      b64EncodeUnicode(username + ':' + password), false, params);
  },

  /**
   * Send handshake to the server.
   * @memberof Tinode#
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  hello: function() {
    const pkt = this.initPacket('hi');

    return this.send(pkt, pkt.hi.id)
      .then((ctrl) => {
        // Reset backoff counter on successful connection.
        this._connection.backoffReset();

        // Server response contains server protocol version, build, constraints,
        // session ID for long polling. Save them.
        if (ctrl.params) {
          this._serverInfo = ctrl.params;
        }

        if (this.onConnect) {
          this.onConnect();
        }

        return ctrl;
      }).catch((err) => {
        this._connection.reconnect(true);

        if (this.onDisconnect) {
          this.onDisconnect(err);
        }
      });
  },

  /**
   * Set or refresh the push notifications/device token. If the client is connected,
   * the deviceToken can be sent to the server.
   *
   * @memberof Tinode#
   * @param {string} dt - token obtained from the provider or <code>false</code>,
   *    <code>null</code> or <code>undefined</code> to clear the token.
   *
   * @returns <code>true</code> if attempt was made to send the update to the server.
   */
  setDeviceToken: function(dt) {
    let sent = false;
    // Convert any falsish value to null.
    dt = dt || null;
    if (dt != this._deviceToken) {
      this._deviceToken = dt;
      if (this.isConnected() && this.isAuthenticated()) {
        this.send({
          'hi': {
            'dev': dt || Tinode.DEL_CHAR
          }
        });
        sent = true;
      }
    }
    return sent;
  },

  /**
   * Authenticate current session.
   * @memberof Tinode#
   *
   * @param {string} scheme - Authentication scheme; <code>"basic"</code> is the only currently supported scheme.
   * @param {string} secret - Authentication secret, assumed to be already base64 encoded.
   *
   * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
   */
  login: function(scheme, secret, cred) {
    const pkt = this.initPacket('login');
    pkt.login.scheme = scheme;
    pkt.login.secret = secret;
    pkt.login.cred = cred;

    return this.send(pkt, pkt.login.id)
      .then((ctrl) => {
        const x = this.loginSuccessful(ctrl);
        return x;
      });
  },

  /**
   * Wrapper for {@link Tinode#login} with basic authentication
   * @memberof Tinode#
   *
   * @param {string} uname - User name.
   * @param {string} password  - Password.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  loginBasic: function(uname, password, cred) {
    return this.login('basic', b64EncodeUnicode(uname + ':' + password), cred)
      .then((ctrl) => {
        this._login = uname;
        return ctrl;
      });
  },

  /**
   * Wrapper for {@link Tinode#login} with token authentication
   * @memberof Tinode#
   *
   * @param {string} token - Token received in response to earlier login.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  loginToken: function(token, cred) {
    return this.login('token', token, cred);
  },

  /**
   * Send a request for resetting an authentication secret.
   * @memberof Tinode#
   *
   * @param {string} scheme - authentication scheme to reset.
   * @param {string} method - method to use for resetting the secret, such as "email" or "tel".
   * @param {string} value - value of the credential to use, a specific email address or a phone number.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving the server reply.
   */
  requestResetAuthSecret: function(scheme, method, value) {
    return this.login('reset', b64EncodeUnicode(scheme + ':' + method + ':' + value));
  },

  /**
   * @typedef AuthToken
   * @memberof Tinode
   * @type {Object}
   * @property {string} token - Token value.
   * @property {Date} expires - Token expiration time.
   */
  /**
   * Get stored authentication token.
   * @memberof Tinode#
   *
   * @returns {Tinode.AuthToken} authentication token.
   */
  getAuthToken: function() {
    if (this._authToken && (this._authToken.expires.getTime() > Date.now())) {
      return this._authToken;
    } else {
      this._authToken = null;
    }
    return null;
  },

  /**
   * Application may provide a saved authentication token.
   * @memberof Tinode#
   *
   * @param {Tinode.AuthToken} token - authentication token.
   */
  setAuthToken: function(token) {
    this._authToken = token;
  },

  /**
   * @typedef SetParams
   * @type {Object}
   * @memberof Tinode
   * @property {Tinode.SetDesc=} desc - Topic initialization parameters when creating a new topic or a new subscription.
   * @property {Tinode.SetSub=} sub - Subscription initialization parameters.
   */
  /**
   * @typedef SetDesc
   * @type {Object}
   * @memberof Tinode
   * @property {Tinode.DefAcs=} defacs - Default access mode.
   * @property {Object=} public - Free-form topic description, publically accessible.
   * @property {Object=} private - Free-form topic descriptionaccessible only to the owner.
   */
  /**
   * @typedef SetSub
   * @type {Object}
   * @memberof Tinode
   * @property {string=} user - UID of the user affected by the request. Default (empty) - current user.
   * @property {string=} mode - User access mode, either requested or assigned dependent on context.
   * @property {Object=} info - Free-form payload to pass to the invited user or topic manager.
   */
  /**
   * Parameters passed to {@link Tinode#subscribe}.
   *
   * @typedef SubscriptionParams
   * @type {Object}
   * @memberof Tinode
   * @property {Tinode.SetParams=} set - Parameters used to initialize topic
   * @property {Tinode.GetQuery=} get - Query for fetching data from topic.
   */

  /**
   * Send a topic subscription request.
   * @memberof Tinode#
   *
   * @param {string} topic - Name of the topic to subscribe to.
   * @param {Tinode.GetQuery=} getParams - Optional subscription metadata query
   * @param {Tinode.SetParams=} setParams - Optional initialization parameters
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  subscribe: function(topicName, getParams, setParams) {
    const pkt = this.initPacket('sub', topicName)
    if (!topicName) {
      topicName = TOPIC_NEW;
    }

    pkt.sub.get = getParams;

    if (setParams) {
      if (setParams.sub) {
        pkt.sub.set.sub = setParams.sub;
      }

      if (setParams.desc) {
        if (Tinode.isNewGroupTopicName(topicName)) {
          // Full set.desc params are used for new topics only
          pkt.sub.set.desc = setParams.desc;
        } else if (Tinode.isP2PTopicName(topicName) && setParams.desc.defacs) {
          // Use optional default permissions only.
          pkt.sub.set.desc = {
            defacs: setParams.desc.defacs
          };
        }
      }

      if (setParams.tags) {
        pkt.sub.set.tags = setParams.tags;
      }
    }

    return this.send(pkt, pkt.sub.id);
  },

  /**
   * Detach and optionally unsubscribe from the topic
   * @memberof Tinode#
   *
   * @param {string} topic - Topic to detach from.
   * @param {boolean} unsub - If <code>true</code>, detach and unsubscribe, otherwise just detach.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  leave: function(topic, unsub) {
    const pkt = this.initPacket('leave', topic);
    pkt.leave.unsub = unsub;

    return this.send(pkt, pkt.leave.id);
  },

  /**
   * Create message draft without sending it to the server.
   * @memberof Tinode#
   *
   * @param {string} topic - Name of the topic to publish to.
   * @param {Object} data - Payload to publish.
   * @param {boolean=} noEcho - If <code>true</code>, tell the server not to echo the message to the original session.
   *
   * @returns {Object} new message which can be sent to the server or otherwise used.
   */
  createMessage: function(topic, data, noEcho) {
    const pkt = this.initPacket('pub', topic);

    let dft = typeof data == 'string' ? Drafty.parse(data) : data;
    if (dft && !Drafty.isPlainText(dft)) {
      pkt.pub.head = {
        mime: Drafty.getContentType()
      };
      data = dft;
    }
    pkt.pub.noecho = noEcho;
    pkt.pub.content = data;

    return pkt.pub;
  },

  /**
   * Publish {data} message to topic.
   * @memberof Tinode#
   *
   * @param {string} topic - Name of the topic to publish to.
   * @param {Object} data - Payload to publish.
   * @param {boolean=} noEcho - If <code>true</code>, tell the server not to echo the message to the original session.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  publish: function(topic, data, noEcho) {
    return this.publishMessage(
      this.createMessage(topic, data, noEcho)
    );
  },

  /**
   * Publish message to topic. The message should be created by {@link Tinode#createMessage}.
   * @memberof Tinode#
   *
   * @param {Object} pub - Message to publish.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  publishMessage: function(pub) {
    // Make a shallow copy. Needed in order to clear locally-assigned temp values;
    pub = Object.assign({}, pub);
    pub.seq = undefined;
    pub.from = undefined;
    pub.ts = undefined;
    return this.send({
      pub: pub
    }, pub.id);
  },

  /**
   * @typedef GetQuery
   * @type {Object}
   * @memberof Tinode
   * @property {Tinode.GetOptsType=} desc - If provided (even if empty), fetch topic description.
   * @property {Tinode.GetOptsType=} sub - If provided (even if empty), fetch topic subscriptions.
   * @property {Tinode.GetDataType=} data - If provided (even if empty), get messages.
   */

  /**
   * @typedef GetOptsType
   * @type {Object}
   * @memberof Tinode
   * @property {Date=} ims - "If modified since", fetch data only it was was modified since stated date.
   * @property {number=} limit - Maximum number of results to return. Ignored when querying topic description.
   */

  /**
   * @typedef GetDataType
   * @type {Object}
   * @memberof Tinode
   * @property {number=} since - Load messages with seq id equal or greater than this value.
   * @property {number=} before - Load messages with seq id lower than this number.
   * @property {number=} limit - Maximum number of results to return.
   */

  /**
   * Request topic metadata
   * @memberof Tinode#
   *
   * @param {string} topic - Name of the topic to query.
   * @param {Tinode.GetQuery} params - Parameters of the query. Use {@link Tinode.MetaGetBuilder} to generate.
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  getMeta: function(topic, params) {
    const pkt = this.initPacket('get', topic);

    pkt.get = mergeObj(pkt.get, params);

    return this.send(pkt, pkt.get.id);
  },

  /**
   * Update topic's metadata: description, subscribtions.
   * @memberof Tinode#
   *
   * @param {string} topic - Topic to update.
   * @param {Tinode.SetParams} params - topic metadata to update.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  setMeta: function(topic, params) {
    const pkt = this.initPacket('set', topic);
    const what = [];

    if (params) {
      ['desc', 'sub', 'tags', 'cred'].map(function(key) {
        if (params.hasOwnProperty(key)) {
          what.push(key);
          pkt.set[key] = params[key];
        }
      });
    }

    if (what.length == 0) {
      return Promise.reject(new Error("Invalid {set} parameters"));
    }

    return this.send(pkt, pkt.set.id);
  },

  /**
   * Range of message IDs to delete.
   *
   * @typedef DelRange
   * @type {Object}
   * @memberof Tinode
   * @property {number} low - low end of the range, inclusive (closed).
   * @property {number=} hi - high end of the range, exclusive (open).
   */
  /**
   * Delete some or all messages in a topic.
   * @memberof Tinode#
   *
   * @param {string} topic - Topic name to delete messages from.
   * @param {Tinode.DelRange[]} list - Ranges of message IDs to delete.
   * @param {boolean=} hard - Hard or soft delete
   *
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delMessages: function(topic, ranges, hard) {
    const pkt = this.initPacket('del', topic);

    pkt.del.what = 'msg';
    pkt.del.delseq = ranges;
    pkt.del.hard = hard;

    return this.send(pkt, pkt.del.id);
  },

  /**
   * Delete the topic alltogether. Requires Owner permission.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to delete
   * @param {boolean} hard - hard-delete topic.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delTopic: function(topicName, hard) {
    const pkt = this.initPacket('del', topicName);
    pkt.del.what = 'topic';
    pkt.del.hard = hard;

    return this.send(pkt, pkt.del.id).then((ctrl) => {
      this._db.remTopic(topicName);
      this.cacheDel('topic', topicName);
      return this.ctrl;
    });
  },

  /**
   * Delete subscription. Requires Share permission.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to delete
   * @param {string} user - User ID to remove.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delSubscription: function(topicName, user) {
    const pkt = this.initPacket('del', topicName);
    pkt.del.what = 'sub';
    pkt.del.user = user;

    return this.send(pkt, pkt.del.id);
  },

  /**
   * Delete credential. Always sent on <code>'me'</code> topic.
   * @memberof Tinode#
   *
   * @param {string} method - validation method such as <code>'email'</code> or <code>'tel'</code>.
   * @param {string} value - validation value, i.e. <code>'alice@example.com'</code>.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delCredential: function(method, value) {
    const pkt = this.initPacket('del', TOPIC_ME);
    pkt.del.what = 'cred';
    pkt.del.cred = {
      meth: method,
      val: value
    };

    return this.send(pkt, pkt.del.id);
  },

  /**
   * Request to delete account of the current user.
   * @memberof Tinode#
   *
   * @param {boolean} hard - hard-delete user.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delCurrentUser: function(hard) {
    const pkt = this.initPacket('del', null);
    pkt.del.what = 'user';
    pkt.del.hard = hard;

    return this.send(pkt, pkt.del.id).then((ctrl) => {
      this._myUID = null;
    });
  },

  /**
   * Notify server that a message or messages were read or received. Does NOT return promise.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic where the mesage is being aknowledged.
   * @param {string} what - Action being aknowledged, either <code>"read"</code> or <code>"recv"</code>.
   * @param {number} seq - Maximum id of the message being acknowledged.
   */
  note: function(topicName, what, seq) {
    if (seq <= 0 || seq >= LOCAL_SEQID) {
      throw new Error(`Invalid message id ${seq}`);
    }

    const pkt = this.initPacket('note', topicName);
    pkt.note.what = what;
    pkt.note.seq = seq;
    this.send(pkt);
  },

  /**
   * Broadcast a key-press notification to topic subscribers. Used to show
   * typing notifications "user X is typing...".
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to broadcast to.
   */
  noteKeyPress: function(topicName) {
    const pkt = this.initPacket('note', topicName);
    pkt.note.what = 'kp';
    this.send(pkt);
  },

  /**
   * Get a named topic, either pull it from cache or create a new instance.
   * There is a single instance of topic for each name.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to get.
   * @returns {Tinode.Topic} Requested or newly created topic or <code>undefined</code> if topic name is invalid.
   */
  getTopic: function(topicName) {
    let topic = this.cacheGet('topic', topicName);
    if (!topic && topicName) {
      if (topicName == TOPIC_ME) {
        topic = new TopicMe();
      } else if (topicName == TOPIC_FND) {
        topic = new TopicFnd();
      } else {
        topic = new Topic(topicName);
      }
      // Cache management.
      this._db.updTopic(topic);
      this.attachCacheToTopic(topic);
      topic._cachePutSelf();
    }
    return topic;
  },

  /**
   * Check if named topic is already present in cache.
   * @memberof Tinode#
   *
   * @param {string} topicName - Name of the topic to check.
   * @returns {boolean} true if topic is found in cache, false oterwise.
   */
  isTopicCached: function(topicName) {
    return !!this.cacheGet('topic', topicName);
  },

  /**
   * Generate unique name like <code>'new123456'</code> suitable for creating a new group topic.
   * @memberof Tinode#
   *
   * @param {boolean} isChan - if the topic is channel-enabled.
   * @returns {string} name which can be used for creating a new group topic.
   */
  newGroupTopicName: function(isChan) {
    return (isChan ? TOPIC_NEW_CHAN : TOPIC_NEW) + this.getNextUniqueId();
  },

  /**
   * Instantiate <code>'me'</code> topic or get it from cache.
   * @memberof Tinode#
   *
   * @returns {Tinode.TopicMe} Instance of <code>'me'</code> topic.
   */
  getMeTopic: function() {
    return this.getTopic(TOPIC_ME);
  },

  /**
   * Instantiate <code>'fnd'</code> (find) topic or get it from cache.
   * @memberof Tinode#
   *
   * @returns {Tinode.Topic} Instance of <code>'fnd'</code> topic.
   */
  getFndTopic: function() {
    return this.getTopic(TOPIC_FND);
  },

  /**
   * Create a new {@link LargeFileHelper} instance
   * @memberof Tinode#
   *
   * @returns {Tinode.LargeFileHelper} instance of a {@link Tinode.LargeFileHelper}.
   */
  getLargeFileHelper: function() {
    return new LargeFileHelper(this);
  },

  /**
   * Get the UID of the the current authenticated user.
   * @memberof Tinode#
   * @returns {string} UID of the current user or <code>undefined</code> if the session is not yet authenticated or if there is no session.
   */
  getCurrentUserID: function() {
    return this._myUID;
  },

  /**
   * Check if the given user ID is equal to the current user's UID.
   * @memberof Tinode#
   * @param {string} uid - UID to check.
   * @returns {boolean} true if the given UID belongs to the current logged in user.
   */
  isMe: function(uid) {
    return this._myUID === uid;
  },

  /**
   * Get login used for last successful authentication.
   * @memberof Tinode#
   * @returns {string} login last used successfully or <code>undefined</code>.
   */
  getCurrentLogin: function() {
    return this._login;
  },

  /**
   * Return information about the server: protocol version and build timestamp.
   * @memberof Tinode#
   * @returns {Object} build and version of the server or <code>null</code> if there is no connection or if the first server response has not been received yet.
   */
  getServerInfo: function() {
    return this._serverInfo;
  },

  /**
   * Return server-provided configuration value (long integer).
   * @memberof Tinode#
   * @param {string} name of the value to return
   * @param {Object} defaultValue to return in case server limit is not set or not found.
   * @returns {number} named value.
   */
  getServerLimit: function(name, defaultValue) {
    return (this._serverInfo ? this._serverInfo[name] : null) || defaultValue;
  },

  /**
   * Toggle console logging. Logging is off by default.
   * @memberof Tinode#
   * @param {boolean} enabled - Set to <code>true</code> to enable logging to console.
   * @param {boolean} trimLongStrings - Set to <code>true</code> to trim long strings.
   */
  enableLogging: function(enabled, trimLongStrings) {
    this._loggingEnabled = enabled;
    this._trimLongStrings = enabled && trimLongStrings;
  },

  /**
   * Set UI language to report to the server. Must be called before <code>'hi'</code> is sent, otherwise it will not be used.
   * @memberof Tinode#
   *
   * @param {string} hl - human (UI) language, like <code>"en_US"</code> or <code>"zh-Hans"</code>.
   */
  setHumanLanguage: function(hl) {
    if (hl) {
      this._humanLanguage = hl;
    }
  },

  /**
   * Check if given topic is online.
   * @memberof Tinode#
   *
   * @param {string} name of the topic to test.
   * @returns {boolean} true if topic is online, false otherwise.
   */
  isTopicOnline: function(name) {
    const topic = this.cacheGet('topic', name);
    return topic && topic.online;
  },

  /**
   * Get access mode for the given contact.
   * @memberof Tinode#
   *
   * @param {string} name of the topic to query.
   * @returns {AccessMode} access mode if topic is found, null otherwise.
   */
  getTopicAccessMode: function(name) {
    const topic = this.cacheGet('topic', name);
    return topic ? topic.acs : null;
  },

  /**
   * Include message ID into all subsequest messages to server instructin it to send aknowledgemens.
   * Required for promises to function. Default is <code>"on"</code>.
   * @memberof Tinode#
   *
   * @param {boolean} status - Turn aknowledgemens on or off.
   * @deprecated
   */
  wantAkn: function(status) {
    if (status) {
      this._messageId = Math.floor((Math.random() * 0xFFFFFF) + 0xFFFFFF);
    } else {
      this._messageId = 0;
    }
  },

  // Callbacks:
  /**
   * Callback to report when the websocket is opened. The callback has no parameters.
   * @memberof Tinode#
   * @type {Tinode.onWebsocketOpen}
   */
  onWebsocketOpen: undefined,

  /**
   * @typedef Tinode.ServerParams
   * @memberof Tinode
   * @type {Object}
   * @property {string} ver - Server version
   * @property {string} build - Server build
   * @property {string=} sid - Session ID, long polling connections only.
   */

  /**
   * @callback Tinode.onConnect
   * @param {number} code - Result code
   * @param {string} text - Text epxplaining the completion, i.e "OK" or an error message.
   * @param {Tinode.ServerParams} params - Parameters returned by the server.
   */
  /**
   * Callback to report when connection with Tinode server is established.
   * @memberof Tinode#
   * @type {Tinode.onConnect}
   */
  onConnect: undefined,

  /**
   * Callback to report when connection is lost. The callback has no parameters.
   * @memberof Tinode#
   * @type {Tinode.onDisconnect}
   */
  onDisconnect: undefined,

  /**
   * @callback Tinode.onLogin
   * @param {number} code - NUmeric completion code, same as HTTP status codes.
   * @param {string} text - Explanation of the completion code.
   */
  /**
   * Callback to report login completion.
   * @memberof Tinode#
   * @type {Tinode.onLogin}
   */
  onLogin: undefined,

  /**
   * Callback to receive <code>{ctrl}</code> (control) messages.
   * @memberof Tinode#
   * @type {Tinode.onCtrlMessage}
   */
  onCtrlMessage: undefined,

  /**
   * Callback to recieve <code>{data}</code> (content) messages.
   * @memberof Tinode#
   * @type {Tinode.onDataMessage}
   */
  onDataMessage: undefined,

  /**
   * Callback to receive <code>{pres}</code> (presence) messages.
   * @memberof Tinode#
   * @type {Tinode.onPresMessage}
   */
  onPresMessage: undefined,

  /**
   * Callback to receive all messages as objects.
   * @memberof Tinode#
   * @type {Tinode.onMessage}
   */
  onMessage: undefined,

  /**
   * Callback to receive all messages as unparsed text.
   * @memberof Tinode#
   * @type {Tinode.onRawMessage}
   */
  onRawMessage: undefined,

  /**
   * Callback to receive server responses to network probes. See {@link Tinode#networkProbe}
   * @memberof Tinode#
   * @type {Tinode.onNetworkProbe}
   */
  onNetworkProbe: undefined,

  /**
   * Callback to be notified when exponential backoff is iterating.
   * @memberof Tinode#
   * @type {Tinode.onAutoreconnectIteration}
   */
  onAutoreconnectIteration: undefined,
};

/**
 * Helper class for constructing {@link Tinode.GetQuery}.
 *
 * @class MetaGetBuilder
 * @memberof Tinode
 *
 * @param {Tinode.Topic} parent topic which instantiated this builder.
 */
var MetaGetBuilder = function(parent) {
  this.topic = parent;
  this.what = {};
}

MetaGetBuilder.prototype = {

  // Get timestamp of the most recent desc update.
  _get_desc_ims: function() {
    const tupd = this.topic._lastDescUpdate || 0;
    return this.topic.updated > tupd ? this.topic.updated : tupd;
  },

  // Get timestamp of the most recent subs update.
  _get_subs_ims: function() {
    if (this.topic.isP2PType()) {
      return this._get_desc_ims();
    }
    if (this.topic.isMeType()) {
      const gupd = this.topic._tinode._lastTopicUpdate || 0;
      if (gupd > this.topic._lastSubsUpdate) {
        return gupd;
      }
    }
    return this.topic._lastSubsUpdate;
  },

  /**
   * Add query parameters to fetch messages within explicit limits.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} since - messages newer than this (inclusive);
   * @param {number=} before - older than this (exclusive)
   * @param {number=} limit - number of messages to fetch
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withData: function(since, before, limit) {
    this.what['data'] = {
      since: since,
      before: before,
      limit: limit
    };
    return this;
  },

  /**
   * Add query parameters to fetch messages newer than the latest saved message.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} limit - number of messages to fetch
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterData: function(limit) {
    return this.withData(this.topic._maxSeq > 0 ? this.topic._maxSeq + 1 : undefined, undefined, limit);
  },

  /**
   * Add query parameters to fetch messages older than the earliest saved message.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} limit - maximum number of messages to fetch.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withEarlierData: function(limit) {
    return this.withData(undefined, this.topic._minSeq > 0 ? this.topic._minSeq : undefined, limit);
  },

  /**
   * Add query parameters to fetch topic description if it's newer than the given timestamp.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {Date=} ims - fetch messages newer than this timestamp.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withDesc: function(ims) {
    this.what['desc'] = {
      ims: ims
    };
    return this;
  },

  /**
   * Add query parameters to fetch topic description if it's newer than the last update.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterDesc: function() {
    return this.withDesc(this._get_desc_ims());
  },

  /**
   * Add query parameters to fetch subscriptions.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {Date=} ims - fetch subscriptions modified more recently than this timestamp
   * @param {number=} limit - maximum number of subscriptions to fetch.
   * @param {string=} userOrTopic - user ID or topic name to fetch for fetching one subscription.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withSub: function(ims, limit, userOrTopic) {
    const opts = {
      ims: ims,
      limit: limit
    };
    if (this.topic.getType() == 'me') {
      opts.topic = userOrTopic;
    } else {
      opts.user = userOrTopic;
    }
    this.what['sub'] = opts;
    return this;
  },

  /**
   * Add query parameters to fetch a single subscription.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {Date=} ims - fetch subscriptions modified more recently than this timestamp
   * @param {string=} userOrTopic - user ID or topic name to fetch for fetching one subscription.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withOneSub: function(ims, userOrTopic) {
    return this.withSub(ims, undefined, userOrTopic);
  },

  /**
   * Add query parameters to fetch a single subscription if it's been updated since the last update.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {string=} userOrTopic - user ID or topic name to fetch for fetching one subscription.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterOneSub: function(userOrTopic) {
    return this.withOneSub(this.topic._lastSubsUpdate, userOrTopic);
  },

  /**
   * Add query parameters to fetch subscriptions updated since the last update.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} limit - maximum number of subscriptions to fetch.
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterSub: function(limit) {
    return this.withSub(this._get_subs_ims(), limit);
  },

  /**
   * Add query parameters to fetch topic tags.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withTags: function() {
    this.what['tags'] = true;
    return this;
  },

  /**
   * Add query parameters to fetch user's credentials. <code>'me'</code> topic only.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withCred: function() {
    if (this.topic.getType() == 'me') {
      this.what['cred'] = true;
    } else {
      this.topic._tinode.logger("ERROR: Invalid topic type for MetaGetBuilder:withCreds", this.topic.getType());
    }
    return this;
  },

  /**
   * Add query parameters to fetch deleted messages within explicit limits. Any/all parameters can be null.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} since - ids of messages deleted since this 'del' id (inclusive)
   * @param {number=} limit - number of deleted message ids to fetch
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withDel: function(since, limit) {
    if (since || limit) {
      this.what['del'] = {
        since: since,
        limit: limit
      };
    }
    return this;
  },

  /**
   * Add query parameters to fetch messages deleted after the saved <code>'del'</code> id.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @param {number=} limit - number of deleted message ids to fetch
   *
   * @returns {Tinode.MetaGetBuilder} <code>this</code> object.
   */
  withLaterDel: function(limit) {
    // Specify 'since' only if we have already received some messages. If
    // we have no locally cached messages then we don't care if any messages were deleted.
    return this.withDel(this.topic._maxSeq > 0 ? this.topic._maxDel + 1 : undefined, limit);
  },

  /**
   * Construct parameters.
   * @memberof Tinode.MetaGetBuilder#
   *
   * @returns {Tinode.GetQuery} Get query
   */
  build: function() {
    const what = [];
    const instance = this;
    let params = {};
    ['data', 'sub', 'desc', 'tags', 'cred', 'del'].map(function(key) {
      if (instance.what.hasOwnProperty(key)) {
        what.push(key);
        if (Object.getOwnPropertyNames(instance.what[key]).length > 0) {
          params[key] = instance.what[key];
        }
      }
    });
    if (what.length > 0) {
      params.what = what.join(' ');
    } else {
      params = undefined;
    }
    return params;
  }
};

/**
 * Helper class for handling access mode.
 *
 * @class AccessMode
 * @memberof Tinode
 *
 * @param {AccessMode|Object=} acs - AccessMode to copy or access mode object received from the server.
 */
var AccessMode = function(acs) {
  if (acs) {
    this.given = typeof acs.given == 'number' ? acs.given : AccessMode.decode(acs.given);
    this.want = typeof acs.want == 'number' ? acs.want : AccessMode.decode(acs.want);
    this.mode = acs.mode ? (typeof acs.mode == 'number' ? acs.mode : AccessMode.decode(acs.mode)) :
      (this.given & this.want);
  }
};

AccessMode._NONE = 0x00;
AccessMode._JOIN = 0x01;
AccessMode._READ = 0x02;
AccessMode._WRITE = 0x04;
AccessMode._PRES = 0x08;
AccessMode._APPROVE = 0x10;
AccessMode._SHARE = 0x20;
AccessMode._DELETE = 0x40;
AccessMode._OWNER = 0x80;

AccessMode._BITMASK = AccessMode._JOIN | AccessMode._READ | AccessMode._WRITE | AccessMode._PRES |
  AccessMode._APPROVE | AccessMode._SHARE | AccessMode._DELETE | AccessMode._OWNER;
AccessMode._INVALID = 0x100000;

AccessMode._checkFlag = function(val, side, flag) {
  side = side || 'mode';
  if (['given', 'want', 'mode'].includes(side)) {
    return ((val[side] & flag) != 0);
  }
  throw new Error(`Invalid AccessMode component '${side}'`);
}

/**
 * Parse string into an access mode value.
 * @memberof Tinode.AccessMode
 * @static
 *
 * @param {string | Number} mode - either a String representation of the access mode to parse or a set of bits to assign.
 * @returns {number} - Access mode as a numeric value.
 */
AccessMode.decode = function(str) {
  if (!str) {
    return null;
  } else if (typeof str == 'number') {
    return str & AccessMode._BITMASK;
  } else if (str === 'N' || str === 'n') {
    return AccessMode._NONE;
  }

  const bitmask = {
    'J': AccessMode._JOIN,
    'R': AccessMode._READ,
    'W': AccessMode._WRITE,
    'P': AccessMode._PRES,
    'A': AccessMode._APPROVE,
    'S': AccessMode._SHARE,
    'D': AccessMode._DELETE,
    'O': AccessMode._OWNER
  };

  let m0 = AccessMode._NONE;

  for (let i = 0; i < str.length; i++) {
    const bit = bitmask[str.charAt(i).toUpperCase()];
    if (!bit) {
      // Unrecognized bit, skip.
      continue;
    }
    m0 |= bit;
  }
  return m0;
};

/**
 * Convert numeric representation of the access mode into a string.
 *
 * @memberof Tinode.AccessMode
 * @static
 *
 * @param {number} val - access mode value to convert to a string.
 * @returns {string} - Access mode as a string.
 */
AccessMode.encode = function(val) {
  if (val === null || val === AccessMode._INVALID) {
    return null;
  } else if (val === AccessMode._NONE) {
    return 'N';
  }

  const bitmask = ['J', 'R', 'W', 'P', 'A', 'S', 'D', 'O'];
  let res = '';
  for (let i = 0; i < bitmask.length; i++) {
    if ((val & (1 << i)) != 0) {
      res = res + bitmask[i];
    }
  }
  return res;
};

/**
 * Update numeric representation of access mode with the new value. The value
 * is one of the following:
 *  - a string starting with <code>'+'</code> or <code>'-'</code> then the bits to add or remove, e.g. <code>'+R-W'</code> or <code>'-PS'</code>.
 *  - a new value of access mode
 *
 * @memberof Tinode.AccessMode
 * @static
 *
 * @param {number} val - access mode value to update.
 * @param {string} upd - update to apply to val.
 * @returns {number} - updated access mode.
 */
AccessMode.update = function(val, upd) {
  if (!upd || typeof upd != 'string') {
    return val;
  }

  let action = upd.charAt(0);
  if (action == '+' || action == '-') {
    let val0 = val;
    // Split delta-string like '+ABC-DEF+Z' into an array of parts including + and -.
    const parts = upd.split(/([-+])/);
    // Starting iteration from 1 because String.split() creates an array with the first empty element.
    // Iterating by 2 because we parse pairs +/- then data.
    for (let i = 1; i < parts.length - 1; i += 2) {
      action = parts[i];
      const m0 = AccessMode.decode(parts[i + 1]);
      if (m0 == AccessMode._INVALID) {
        return val;
      }
      if (m0 == null) {
        continue;
      }
      if (action === '+') {
        val0 |= m0;
      } else if (action === '-') {
        val0 &= ~m0;
      }
    }
    val = val0;
  } else {
    // The string is an explicit new value 'ABC' rather than delta.
    const val0 = AccessMode.decode(upd);
    if (val0 != AccessMode._INVALID) {
      val = val0;
    }
  }

  return val;
};

/**
 * Bits present in a1 but missing in a2.
 *
 * @static
 * @memberof Tinode
 *
 * @param {number | string} a1 - access mode to subtract from.
 * @param {number | string} a2 - access mode to subtract.
 * @returns {number} access mode with bits present in <code>a1</code> but missing in <code>a2</code>.
 */
AccessMode.diff = function(a1, a2) {
  a1 = AccessMode.decode(a1);
  a2 = AccessMode.decode(a2);

  if (a1 == AccessMode._INVALID || a2 == AccessMode._INVALID) {
    return AccessMode._INVALID;
  }
  return a1 & ~a2;
};

/**
 * AccessMode is a class representing topic access mode.
 *
 * @memberof Tinode
 * @class AccessMode
 */
AccessMode.prototype = {
  /**
   * Custom formatter
   */
  toString: function() {
    return '{"mode": "' + AccessMode.encode(this.mode) +
      '", "given": "' + AccessMode.encode(this.given) +
      '", "want": "' + AccessMode.encode(this.want) + '"}';
  },
  /**
   * Converts numeric values to strings.
   */
  jsonHelper: function() {
    return {
      mode: AccessMode.encode(this.mode),
      given: AccessMode.encode(this.given),
      want: AccessMode.encode(this.want)
    };
  },
  /**
   * Assign value to 'mode'.
   * @memberof Tinode.AccessMode
   *
   * @param {string | Number} m - either a string representation of the access mode or a set of bits.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  setMode: function(m) {
    this.mode = AccessMode.decode(m);
    return this;
  },
  /**
   * Update <code>mode</code> value.
   * @memberof Tinode.AccessMode
   *
   * @param {string} u - string representation of the changes to apply to access mode.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  updateMode: function(u) {
    this.mode = AccessMode.update(this.mode, u);
    return this;
  },
  /**
   * Get <code>mode</code> value as a string.
   * @memberof Tinode.AccessMode
   *
   * @returns {string} - <code>mode</code> value.
   */
  getMode: function() {
    return AccessMode.encode(this.mode);
  },

  /**
   * Assign <code>given</code>  value.
   * @memberof Tinode.AccessMode
   *
   * @param {string | Number} g - either a string representation of the access mode or a set of bits.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  setGiven: function(g) {
    this.given = AccessMode.decode(g);
    return this;
  },
  /**
   * Update 'given' value.
   * @memberof Tinode.AccessMode
   *
   * @param {string} u - string representation of the changes to apply to access mode.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  updateGiven: function(u) {
    this.given = AccessMode.update(this.given, u);
    return this;
  },
  /**
   * Get 'given' value as a string.
   * @memberof Tinode.AccessMode
   *
   * @returns {string} - <b>given</b> value.
   */
  getGiven: function() {
    return AccessMode.encode(this.given);
  },

  /**
   * Assign 'want' value.
   * @memberof Tinode.AccessMode
   *
   * @param {string | Number} w - either a string representation of the access mode or a set of bits.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  setWant: function(w) {
    this.want = AccessMode.decode(w);
    return this;
  },
  /**
   * Update 'want' value.
   * @memberof Tinode.AccessMode
   *
   * @param {string} u - string representation of the changes to apply to access mode.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  updateWant: function(u) {
    this.want = AccessMode.update(this.want, u);
    return this;
  },
  /**
   * Get 'want' value as a string.
   * @memberof Tinode.AccessMode
   *
   * @returns {string} - <b>want</b> value.
   */
  getWant: function() {
    return AccessMode.encode(this.want);
  },

  /**
   * Get permissions present in 'want' but missing in 'given'.
   * Inverse of {@link Tinode.AccessMode#getExcessive}
   *
   * @memberof Tinode.AccessMode
   *
   * @returns {string} permissions present in <b>want</b> but missing in <b>given</b>.
   */
  getMissing: function() {
    return AccessMode.encode(this.want & ~this.given);
  },

  /**
   * Get permissions present in 'given' but missing in 'want'.
   * Inverse of {@link Tinode.AccessMode#getMissing}
   * @memberof Tinode.AccessMode
   *
   * @returns {string} permissions present in <b>given</b> but missing in <b>want</b>.
   */
  getExcessive: function() {
    return AccessMode.encode(this.given & ~this.want);
  },

  /**
   * Update 'want', 'give', and 'mode' values.
   * @memberof Tinode.AccessMode
   *
   * @param {AccessMode} val - new access mode value.
   * @returns {AccessMode} - <code>this</code> AccessMode.
   */
  updateAll: function(val) {
    if (val) {
      this.updateGiven(val.given);
      this.updateWant(val.want);
      this.mode = this.given & this.want;
    }
    return this;
  },

  /**
   * Check if Owner (O) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isOwner: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._OWNER);
  },

  /**
   * Check if Presence (P) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isPresencer: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._PRES);
  },

  /**
   * Check if Presence (P) flag is NOT set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isMuted: function(side) {
    return !this.isPresencer(side);
  },

  /**
   * Check if Join (J) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isJoiner: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._JOIN);
  },

  /**
   * Check if Reader (R) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isReader: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._READ);
  },

  /**
   * Check if Writer (W) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isWriter: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._WRITE);
  },

  /**
   * Check if Approver (A) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isApprover: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._APPROVE);
  },

  /**
   * Check if either one of Owner (O) or Approver (A) flags is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isAdmin: function(side) {
    return this.isOwner(side) || this.isApprover(side);
  },

  /**
   * Check if either one of Owner (O), Approver (A), or Sharer (S) flags is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isSharer: function(side) {
    return this.isAdmin(side) || AccessMode._checkFlag(this, side, AccessMode._SHARE);
  },

  /**
   * Check if Deleter (D) flag is set.
   * @memberof Tinode.AccessMode
   * @param {string=} side - which permission to check: given, want, mode; default: mode.
   * @returns {boolean} - <code>true</code> if flag is set.
   */
  isDeleter: function(side) {
    return AccessMode._checkFlag(this, side, AccessMode._DELETE);
  }
};

/**
 * @callback Tinode.Topic.onData
 * @param {Data} data - Data packet
 */
/**
 * Topic is a class representing a logical communication channel.
 * @class Topic
 * @memberof Tinode
 *
 * @param {string} name - Name of the topic to create.
 * @param {Object=} callbacks - Object with various event callbacks.
 * @param {Tinode.Topic.onData} callbacks.onData - Callback which receives a <code>{data}</code> message.
 * @param {callback} callbacks.onMeta - Callback which receives a <code>{meta}</code> message.
 * @param {callback} callbacks.onPres - Callback which receives a <code>{pres}</code> message.
 * @param {callback} callbacks.onInfo - Callback which receives an <code>{info}</code> message.
 * @param {callback} callbacks.onMetaDesc - Callback which receives changes to topic desctioption {@link desc}.
 * @param {callback} callbacks.onMetaSub - Called for a single subscription record change.
 * @param {callback} callbacks.onSubsUpdated - Called after a batch of subscription changes have been recieved and cached.
 * @param {callback} callbacks.onDeleteTopic - Called after the topic is deleted.
 * @param {callback} callbacls.onAllMessagesReceived - Called when all requested <code>{data}</code> messages have been recived.
 */
var Topic = function(name, callbacks) {
  // Parent Tinode object.
  this._tinode = null;

  // Server-provided data, locally immutable.
  // topic name
  this.name = name;
  // timestamp when the topic was created
  this.created = null;
  // timestamp when the topic was last updated
  this.updated = null;
  // timestamp of the last messages
  this.touched = null;
  // access mode, see AccessMode
  this.acs = new AccessMode(null);
  // per-topic private data
  this.private = null;
  // per-topic public data
  this.public = null;

  // Locally cached data
  // Subscribed users, for tracking read/recv/msg notifications.
  this._users = {};

  // Current value of locally issued seqId, used for pending messages.
  this._queuedSeqId = LOCAL_SEQID;

  // The maximum known {data.seq} value.
  this._maxSeq = 0;
  // The minimum known {data.seq} value.
  this._minSeq = 0;
  // Indicator that the last request for earlier messages returned 0.
  this._noEarlierMsgs = false;
  // The maximum known deletion ID.
  this._maxDel = 0;
  // User discovery tags
  this._tags = [];
  // Credentials such as email or phone number.
  this._credentials = [];
  // Message cache, sorted by message seq values, from old to new.
  this._messages = CBuffer(function(a, b) {
    return a.seq - b.seq;
  }, true);
  // Boolean, true if the topic is currently live
  this._subscribed = false;
  // Timestap when topic meta-desc update was recived.
  this._lastDescUpdate = null;
  // Timestap when topic meta-subs update was recived.
  this._lastSubsUpdate = null;
  // Topic created but not yet synced with the server. Used only during initialization.
  this._new = true;

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
    this.onDeleteTopic = callbacks.onDeleteTopic;
    this.onAllMessagesReceived = callbacks.onAllMessagesReceived;
  }
};

Topic.prototype = {
  /**
   * Check if the topic is subscribed.
   * @memberof Tinode.Topic#
   * @returns {boolean} True is topic is attached/subscribed, false otherwise.
   */
  isSubscribed: function() {
    return this._subscribed;
  },

  /**
   * Request topic to subscribe. Wrapper for {@link Tinode#subscribe}.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.GetQuery=} getParams - get query parameters.
   * @param {Tinode.SetParams=} setParams - set parameters.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  subscribe: function(getParams, setParams) {
    // If the topic is already subscribed, return resolved promise
    if (this._subscribed) {
      return Promise.resolve(this);
    }

    // Send subscribe message, handle async response.
    // If topic name is explicitly provided, use it. If no name, then it's a new group topic,
    // use "new".
    return this._tinode.subscribe(this.name || TOPIC_NEW, getParams, setParams).then((ctrl) => {
      if (ctrl.code >= 300) {
        // Do nothing if subscription status has not changed.
        return ctrl;
      }

      this._subscribed = true;
      this.acs = (ctrl.params && ctrl.params.acs) ? ctrl.params.acs : this.acs;

      // Set topic name for new topics and add it to cache.
      if (this._new) {
        this._new = false;

        // Name may change new123456 -> grpAbCdEf
        this.name = ctrl.topic;

        this.created = ctrl.ts;
        this.updated = ctrl.ts;
        // Don't assign touched, otherwise topic will be put on top of the list on subscribe.

        this._cachePutSelf();

        if (this.name != TOPIC_ME && this.name != TOPIC_FND) {
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
  },

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
  createMessage: function(data, noEcho) {
    return this._tinode.createMessage(this.name, data, noEcho);
  },

  /**
   * Immediately publish data to topic. Wrapper for {@link Tinode#publish}.
   * @memberof Tinode.Topic#
   *
   * @param {string | Object} data - Data to publish, either plain string or a Drafty object.
   * @param {boolean=} noEcho - If <code>true</code> server will not echo message back to originating
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  publish: function(data, noEcho) {
    return this.publishMessage(this.createMessage(data, noEcho));
  },

  /**
   * Publish message created by {@link Tinode.Topic#createMessage}.
   * @memberof Tinode.Topic#
   *
   * @param {Object} pub - {data} object to publish. Must be created by {@link Tinode.Topic#createMessage}
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  publishMessage: function(pub) {
    if (!this._subscribed) {
      return Promise.reject(new Error("Cannot publish on inactive topic"));
    }

    // Update header with attachment records.
    if (Drafty.hasAttachments(pub.content) && !pub.head.attachments) {
      let attachments = [];
      Drafty.attachments(pub.content, (data) => {
        attachments.push(data.ref);
      });
      pub.head.attachments = attachments;
    }

    // Send data.
    pub._sending = true;
    pub._failed = false;
    return this._tinode.publishMessage(pub).then((ctrl) => {
      pub._sending = false;
      pub.ts = ctrl.ts;
      this.swapMessageId(pub, ctrl.params.seq);
      this._routeData(pub);
      return ctrl;
    }).catch((err) => {
      this._tinode.logger("WARNING: Message rejected by the server", err);
      pub._sending = false;
      pub._failed = true;
      if (this.onData) {
        this.onData();
      }
    });
  },

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
  publishDraft: function(pub, prom) {
    if (!prom && !this._subscribed) {
      return Promise.reject(new Error("Cannot publish on inactive topic"));
    }

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
    prom = (prom || Promise.resolve()).then(
      ( /* argument ignored */ ) => {
        if (pub._cancelled) {
          return {
            code: 300,
            text: "cancelled"
          };
        }
        return this.publishMessage(pub);
      },
      (err) => {
        this._tinode.logger("WARNING: Message draft rejected", err);
        pub._sending = false;
        pub._failed = true;
        this._messages.delAt(this._messages.find(pub));
        this._tinode._db.remMessages(this.name, pub.seq);
        if (this.onData) {
          this.onData();
        }
      });
    return prom;
  },

  /**
   * Leave the topic, optionally unsibscribe. Leaving the topic means the topic will stop
   * receiving updates from the server. Unsubscribing will terminate user's relationship with the topic.
   * Wrapper for {@link Tinode#leave}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean=} unsub - If true, unsubscribe, otherwise just leave.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  leave: function(unsub) {
    // It's possible to unsubscribe (unsub==true) from inactive topic.
    if (!this._subscribed && !unsub) {
      return Promise.reject(new Error("Cannot leave inactive topic"));
    }

    // Send a 'leave' message, handle async response
    return this._tinode.leave(this.name, unsub).then((ctrl) => {
      this._resetSub();
      if (unsub) {
        this._tinode._db.remTopic(this.name);
        this._tinode.cacheDel('topic', this.name);
        this._gone();
      }
      return ctrl;
    });
  },

  /**
   * Request topic metadata from the server.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.GetQuery} request parameters
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  getMeta: function(params) {
    // Send {get} message, return promise.
    return this._tinode.getMeta(this.name, params);
  },

  /**
   * Request more messages from the server
   * @memberof Tinode.Topic#
   *
   * @param {number} limit number of messages to get.
   * @param {boolean} forward if true, request newer messages.
   */
  getMessagesPage: function(limit, forward) {
    const query = this.startMetaQuery();
    if (forward) {
      query.withLaterData(limit);
    } else {
      query.withEarlierData(limit);
    }
    let promise = this.getMeta(query.build());
    if (!forward) {
      promise = promise.then((ctrl) => {
        if (ctrl && ctrl.params && !ctrl.params.count) {
          this._noEarlierMsgs = true;
        }
      });
    }
    return promise;
  },

  /**
   * Update topic metadata.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.SetParams} params parameters to update.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  setMeta: function(params) {
    if (params.tags) {
      params.tags = normalizeArray(params.tags);
    }
    // Send Set message, handle async response.
    return this._tinode.setMeta(this.name, params)
      .then((ctrl) => {
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
            // Assign user ID otherwise the update will be ignored by _processMetaSub.
            params.sub.user = this._tinode.getCurrentUserID();
            if (!params.desc) {
              // Force update to topic's asc.
              params.desc = {};
            }
          }
          params.sub._noForwarding = true;
          this._processMetaSub([params.sub]);
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

        return ctrl;
      });
  },

  /**
   * Update access mode of the current user or of another topic subsriber.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - UID of the user to update or null to update current user.
   * @param {string} update - the update value, full or delta.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  updateMode: function(uid, update) {
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
  },

  /**
   * Create new topic subscription. Wrapper for {@link Tinode#setMeta}.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - ID of the user to invite
   * @param {string=} mode - Access mode. <code>null</code> means to use default.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  invite: function(uid, mode) {
    return this.setMeta({
      sub: {
        user: uid,
        mode: mode
      }
    });
  },

  /**
   * Archive or un-archive the topic. Wrapper for {@link Tinode#setMeta}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} arch - true to archive the topic, false otherwise.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  archive: function(arch) {
    if (this.private && this.private.arch == arch) {
      return Promise.resolve(arch);
    }
    return this.setMeta({
      desc: {
        private: {
          arch: arch ? true : Tinode.DEL_CHAR
        }
      }
    });
  },

  /**
   * Delete messages. Hard-deleting messages requires Owner permission.
   * Wrapper for {@link Tinode#delMessages}.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.DelRange[]} ranges - Ranges of message IDs to delete.
   * @param {boolean=} hard - Hard or soft delete
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delMessages: function(ranges, hard) {
    if (!this._subscribed) {
      return Promise.reject(new Error("Cannot delete messages in inactive topic"));
    }

    // Sort ranges in accending order by low, the descending by hi.
    ranges.sort((r1, r2) => {
      if (r1.low < r2.low) {
        return true;
      }
      if (r1.low == r2.low) {
        return !r2.hi || (r1.hi >= r2.hi);
      }
      return false;
    });

    // Remove pending messages from ranges possibly clipping some ranges.
    let tosend = ranges.reduce((out, r) => {
      if (r.low < LOCAL_SEQID) {
        if (!r.hi || r.hi < LOCAL_SEQID) {
          out.push(r);
        } else {
          // Clip hi to max allowed value.
          out.push({
            low: r.low,
            hi: this._maxSeq + 1
          });
        }
      }
      return out;
    }, []);

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
    return result.then((ctrl) => {
      if (ctrl.params.del > this._maxDel) {
        this._maxDel = ctrl.params.del;
      }

      ranges.map((r) => {
        if (r.hi) {
          this.flushMessageRange(r.low, r.hi);
        } else {
          this.flushMessage(r.low);
        }
      });

      this._updateDeletedRanges();

      if (this.onData) {
        // Calling with no parameters to indicate the messages were deleted.
        this.onData();
      }
      return ctrl;
    });
  },

  /**
   * Delete all messages. Hard-deleting messages requires Owner permission.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} hardDel - true if messages should be hard-deleted.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delMessagesAll: function(hardDel) {
    if (!this._maxSeq || this._maxSeq <= 0) {
      // There are no messages to delete.
      return Promise.resolve();
    }
    return this.delMessages([{
      low: 1,
      hi: this._maxSeq + 1,
      _all: true
    }], hardDel);
  },

  /**
   * Delete multiple messages defined by their IDs. Hard-deleting messages requires Owner permission.
   * @memberof Tinode.Topic#
   *
   * @param {Tinode.DelRange[]} list - list of seq IDs to delete
   * @param {boolean=} hardDel - true if messages should be hard-deleted.
   *
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delMessagesList: function(list, hardDel) {
    // Sort the list in ascending order
    list.sort((a, b) => a - b);
    // Convert the array of IDs to ranges.
    let ranges = list.reduce((out, id) => {
      if (out.length == 0) {
        // First element.
        out.push({
          low: id
        });
      } else {
        let prev = out[out.length - 1];
        if ((!prev.hi && (id != prev.low + 1)) || (id > prev.hi)) {
          // New range.
          out.push({
            low: id
          });
        } else {
          // Expand existing range.
          prev.hi = prev.hi ? Math.max(prev.hi, id + 1) : id + 1;
        }
      }
      return out;
    }, []);
    // Send {del} message, return promise
    return this.delMessages(ranges, hardDel)
  },

  /**
   * Delete topic. Requires Owner permission. Wrapper for {@link Tinode#delTopic}.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} hard - had-delete topic.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
   */
  delTopic: function(hard) {
    return this._tinode.delTopic(this.name, hard).then((ctrl) => {
      this._resetSub();
      this._gone();
      return ctrl;
    });
  },

  /**
   * Delete subscription. Requires Share permission. Wrapper for {@link Tinode#delSubscription}.
   * @memberof Tinode.Topic#
   *
   * @param {string} user - ID of the user to remove subscription for.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  delSubscription: function(user) {
    if (!this._subscribed) {
      return Promise.reject(new Error("Cannot delete subscription in inactive topic"));
    }
    // Send {del} message, return promise
    return this._tinode.delSubscription(this.name, user).then((ctrl) => {
      // Remove the object from the subscription cache;
      delete this._users[user];
      // Notify listeners
      if (this.onSubsUpdated) {
        this.onSubsUpdated(Object.keys(this._users));
      }
      return ctrl;
    });
  },

  /**
   * Send a read/recv notification.
   * @memberof Tinode.Topic#
   *
   * @param {string} what - what notification to send: <code>recv</code>, <code>read</code>.
   * @param {number} seq - ID or the message read or received.
   */
  note: function(what, seq) {
    if (!this._subscribed) {
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
      this._updateReadRecv(what, seq);

      const me = this._tinode.getMeTopic();
      if (this.acs != null && !this.acs.isMuted()) {
        // Sent a notification to 'me' listeners.
        me._refreshContact(what, this);
      }
    }
  },

  /**
   * Send a 'recv' receipt. Wrapper for {@link Tinode#noteRecv}.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - ID of the message to aknowledge.
   */
  noteRecv: function(seq) {
    this.note('recv', seq);
  },

  /**
   * Send a 'read' receipt. Wrapper for {@link Tinode#noteRead}.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - ID of the message to aknowledge or 0/undefined to acknowledge the latest messages.
   */
  noteRead: function(seq) {
    seq = seq || this._maxSeq;
    if (seq > 0) {
      this.note('read', seq);
    }
  },

  /**
   * Send a key-press notification. Wrapper for {@link Tinode#noteKeyPress}.
   * @memberof Tinode.Topic#
   */
  noteKeyPress: function() {
    if (this._subscribed) {
      this._tinode.noteKeyPress(this.name);
    } else {
      this._tinode.logger("INFO: Cannot send notification in inactive topic");
    }
  },

  // Update cached read/recv/unread counts.
  _updateReadRecv: function(what, seq, ts) {
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
  },

  /**
   * Get user description from global cache. The user does not need to be a
   * subscriber of this topic.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - ID of the user to fetch.
   * @return {Object} user description or undefined.
   */
  userDesc: function(uid) {
    // TODO(gene): handle asynchronous requests

    const user = this._cacheGetUser(uid);
    if (user) {
      return user; // Promise.resolve(user)
    }
  },

  /**
   * Get description of the p2p peer from subscription cache.
   * @memberof Tinode.Topic#
   *
   * @return {Object} peer's description or undefined.
   */
  p2pPeerDesc: function() {
    if (!this.isP2PType()) {
      return undefined;
    }
    return this._users[this.name];
  },

  /**
   * Iterate over cached subscribers. If callback is undefined, use this.onMetaSub.
   * @memberof Tinode.Topic#
   *
   * @param {function} callback - Callback which will receive subscribers one by one.
   * @param {Object=} context - Value of `this` inside the `callback`.
   */
  subscribers: function(callback, context) {
    const cb = (callback || this.onMetaSub);
    if (cb) {
      for (let idx in this._users) {
        cb.call(context, this._users[idx], idx, this._users);
      }
    }
  },

  /**
   * Get a copy of cached tags.
   * @memberof Tinode.Topic#
   *
   * @return {Array.<string>} a copy of tags
   */
  tags: function() {
    // Return a copy.
    return this._tags.slice(0);
  },

  /**
   * Get cached subscription for the given user ID.
   * @memberof Tinode.Topic#
   *
   * @param {string} uid - id of the user to query for
   * @return user description or undefined.
   */
  subscriber: function(uid) {
    return this._users[uid];
  },

  /**
   * Iterate over cached messages. If callback is undefined, use this.onData.
   * @memberof Tinode.Topic#
   *
   * @param {function} callback - Callback which will receive messages one by one. See {@link Tinode.CBuffer#forEach}
   * @param {number} sinceId - Optional seqId to start iterating from (inclusive).
   * @param {number} beforeId - Optional seqId to stop iterating before (exclusive).
   * @param {Object} context - Value of `this` inside the `callback`.
   */
  messages: function(callback, sinceId, beforeId, context) {
    const cb = (callback || this.onData);
    if (cb) {
      let startIdx = typeof sinceId == 'number' ? this._messages.find({
        seq: sinceId
      }, true) : undefined;
      let beforeIdx = typeof beforeId == 'number' ? this._messages.find({
        seq: beforeId
      }, true) : undefined;
      if (startIdx != -1 && beforeIdx != -1) {
        this._messages.forEach(cb, startIdx, beforeIdx, context);
      }
    }
  },

  /**
   * Get the most recent message from cache.
   * @memberof Tinode.Topic#
   *
   * @returns {Object} the most recent cached message or <code>undefined</code>, if no messages are cached.
   */
  latestMessage: function() {
    return this._messages.getLast();
  },

  /**
   * Iterate over cached unsent messages. Wraps {@link Tinode.Topic#messages}.
   * @memberof Tinode.Topic#
   *
   * @param {function} callback - Callback which will receive messages one by one. See {@link Tinode.CBuffer#forEach}
   * @param {Object} context - Value of <code>this</code> inside the <code>callback</code>.
   */
  queuedMessages: function(callback, context) {
    if (!callback) {
      throw new Error("Callback must be provided");
    }
    this.messages(callback, LOCAL_SEQID, undefined, context);
  },

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
  msgReceiptCount: function(what, seq) {
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
  },

  /**
   * Get the number of topic subscribers who marked this message (and all older messages) as read.
   * The current user is excluded from the count.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - message id to check.
   * @returns {number} number of subscribers who claim to have received the message.
   */
  msgReadCount: function(seq) {
    return this.msgReceiptCount('read', seq);
  },

  /**
   * Get the number of topic subscribers who marked this message (and all older messages) as received.
   * The current user is excluded from the count.
   * @memberof Tinode.Topic#
   *
   * @param {number} seq - Message id to check.
   * @returns {number} Number of subscribers who claim to have received the message.
   */
  msgRecvCount: function(seq) {
    return this.msgReceiptCount('recv', seq);
  },

  /**
   * Check if cached message IDs indicate that the server may have more messages.
   * @memberof Tinode.Topic#
   *
   * @param {boolean} newer - if <code>true</code>, check for newer messages only.
   */
  msgHasMoreMessages: function(newer) {
    return newer ? this.seq > this._maxSeq :
      // _minSeq could be more than 1, but earlier messages could have been deleted.
      (this._minSeq > 1 && !this._noEarlierMsgs);
  },

  /**
   * Check if the given seq Id is id of the most recent message.
   * @memberof Tinode.Topic#
   *
   * @param {number} seqId id of the message to check
   */
  isNewMessage: function(seqId) {
    return this._maxSeq <= seqId;
  },

  /**
   * Remove one message from local cache.
   * @memberof Tinode.Topic#
   *
   * @param {number} seqId id of the message to remove from cache.
   * @returns {Message} removed message or undefined if such message was not found.
   */
  flushMessage: function(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });
    if (idx >= 0) {
      this._tinode._db.remMessages(this.name, seqId);
      return this._messages.delAt(idx);
    }
    return undefined;
  },

  /**
   * Update message's seqId.
   * @memberof Tinode.Topic#
   *
   * @param {Object} pub message object.
   * @param {number} newSeqId new seq id for pub.
   */
  swapMessageId: function(pub, newSeqId) {
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
  },

  /**
   * Remove a range of messages from the local cache.
   * @memberof Tinode.Topic#
   *
   * @param {number} fromId seq ID of the first message to remove (inclusive).
   * @param {number} untilId seqID of the last message to remove (exclusive).
   *
   * @returns {Message[]} array of removed messages (could be empty).
   */
  flushMessageRange: function(fromId, untilId) {
    // Remove range from persistent cache.
    this._tinode._db.remMessages(this.name, fromId, untilId);
    // start, end: find insertion points (nearest == true).
    const since = this._messages.find({
      seq: fromId
    }, true);
    return since >= 0 ? this._messages.delRange(since, this._messages.find({
      seq: untilId
    }, true)) : [];
  },

  /**
   * Attempt to stop message from being sent.
   * @memberof Tinode.Topic#
   *
   * @param {number} seqId id of the message to stop sending and remove from cache.
   *
   * @returns {boolean} <code>true</code> if message was cancelled, <code>false</code> otherwise.
   */
  cancelSend: function(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });
    if (idx >= 0) {
      const msg = this._messages.getAt(idx);
      const status = this.msgStatus(msg);
      if (status == MESSAGE_STATUS_QUEUED || status == MESSAGE_STATUS_FAILED) {
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
  },

  /**
   * Get type of the topic: me, p2p, grp, fnd...
   * @memberof Tinode.Topic#
   *
   * @returns {string} One of 'me', 'p2p', 'grp', 'fnd', 'sys' or <code>undefined</code>.
   */
  getType: function() {
    return Tinode.topicType(this.name);
  },

  /**
   * Get current user's access mode of the topic.
   * @memberof Tinode.Topic#
   *
   * @returns {Tinode.AccessMode} - user's access mode
   */
  getAccessMode: function() {
    return this.acs;
  },

  /**
   * Set current user's access mode of the topic.
   * @memberof Tinode.Topic#
   *
   * @param {AccessMode | Object} acs - access mode to set.
   */
  setAccessMode: function(acs) {
    return this.acs = new AccessMode(acs);
  },

  /**
   * Get topic's default access mode.
   * @memberof Tinode.Topic#
   *
   * @returns {Tinode.DefAcs} - access mode, such as {auth: `RWP`, anon: `N`}.
   */
  getDefaultAccess: function() {
    return this.defacs;
  },

  /**
   * Initialize new meta {@link Tinode.GetQuery} builder. The query is attched to the current topic.
   * It will not work correctly if used with a different topic.
   * @memberof Tinode.Topic#
   *
   * @returns {Tinode.MetaGetBuilder} query attached to the current topic.
   */
  startMetaQuery: function() {
    return new MetaGetBuilder(this);
  },

  /**
   * Check if topic is archived, i.e. private.arch == true.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is archived, <code>false</code> otherwise.
   */
  isArchived: function() {
    return this.private && this.private.arch ? true : false;
  },

  /**
   * Check if topic is a 'me' topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a 'me' topic, <code>false</code> otherwise.
   */
  isMeType: function() {
    return Tinode.isMeTopicName(this.name);
  },

  /**
   * Check if topic is a channel.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a channel, <code>false</code> otherwise.
   */
  isChannelType: function() {
    return Tinode.isChannelTopicName(this.name);
  },

  /**
   * Check if topic is a group topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a group, <code>false</code> otherwise.
   */
  isGroupType: function() {
    return Tinode.isGroupTopicName(this.name);
  },

  /**
   * Check if topic is a p2p topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a p2p topic, <code>false</code> otherwise.
   */
  isP2PType: function() {
    return Tinode.isP2PTopicName(this.name);
  },

  /**
   * Check if topic is a communication topic, i.e. a group or p2p topic.
   * @memberof Tinode.Topic#
   *
   * @returns {boolean} - <code>true</code> if topic is a p2p or group topic, <code>false</code> otherwise.
   */
  isCommType: function() {
    return Tinode.isCommTopicName(this.name);
  },

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
  msgStatus: function(msg, upd) {
    let status = MESSAGE_STATUS_NONE;
    if (this._tinode.isMe(msg.from)) {
      if (msg._sending) {
        status = MESSAGE_STATUS_SENDING;
      } else if (msg._failed || msg._cancelled) {
        status = MESSAGE_STATUS_FAILED;
      } else if (msg.seq >= LOCAL_SEQID) {
        status = MESSAGE_STATUS_QUEUED;
      } else if (this.msgReadCount(msg.seq) > 0) {
        status = MESSAGE_STATUS_READ;
      } else if (this.msgRecvCount(msg.seq) > 0) {
        status = MESSAGE_STATUS_RECEIVED;
      } else if (msg.seq > 0) {
        status = MESSAGE_STATUS_SENT;
      }
    } else {
      status = MESSAGE_STATUS_TO_ME;
    }

    if (upd && msg._status != status) {
      msg._status = status;
      this._tinode._db.updMessageStatus(this.name, msg.seq, status);
    }

    return status;
  },

  // Process data message
  _routeData: function(data) {
    if (data.content) {
      if (!this.touched || this.touched < data.ts) {
        this.touched = data.ts;
      }
    }

    if (data.seq > this._maxSeq) {
      this._maxSeq = data.seq;
    }
    if (data.seq < this._minSeq || this._minSeq == 0) {
      this._minSeq = data.seq;
    }

    if (!data._noForwarding) {
      this._messages.put(data);
      this._tinode._db.addMessage(data);
      this._updateDeletedRanges();
    }

    if (this.onData) {
      this.onData(data);
    }

    // Update locally cached contact with the new message count.
    const what = ((!this.isChannelType() && !data.from) || this._tinode.isMe(data.from)) ? 'read' : 'msg';
    this._updateReadRecv(what, data.seq, data.ts);
    // Notify 'me' listeners of the change.
    this._tinode.getMeTopic()._refreshContact(what, this);
  },

  // Process metadata message
  _routeMeta: function(meta) {
    if (meta.desc) {
      this._lastDescUpdate = meta.ts;
      this._processMetaDesc(meta.desc);
    }
    if (meta.sub && meta.sub.length > 0) {
      this._lastSubsUpdate = meta.ts;
      this._processMetaSub(meta.sub);
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
    if (this.onMeta) {
      this.onMeta(meta);
    }
  },

  // Process presence change message
  _routePres: function(pres) {
    let user;
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
      case 'acs':
        const uid = pres.src || this._tinode.getCurrentUserID();
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
            this._processMetaSub([user]);
          }
        } else {
          // Known user
          user.acs.updateAll(pres.dacs);
          // Update user's access mode.
          this._processMetaSub([{
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
  },

  // Process {info} message
  _routeInfo: function(info) {
    if (info.what !== 'kp') {
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
      if (this._tinode.isMe(info.from)) {
        this._updateReadRecv(info.what, info.seq);
      }

      // Notify 'me' listener of the status change.
      this._tinode.getMeTopic()._refreshContact(info.what, this);
    }
    if (this.onInfo) {
      this.onInfo(info);
    }
  },

  // Called by Tinode when meta.desc packet is received.
  // Called by 'me' topic on contact update (desc._noForwarding is true).
  _processMetaDesc: function(desc) {
    if (this.isP2PType()) {
      // Synthetic desc may include defacs for p2p topics which is useless.
      // Remove it.
      delete desc.defacs;

      // Update to p2p desc is the same as user update. Update cached user.
      this._tinode._db.updUser(this.name, desc.public);
    }

    // Copy parameters from desc object to this topic.
    mergeObj(this, desc);
    // Make sure date fields are Date().
    stringToDate(this);
    // Update persistent cache.
    this._tinode._db.updTopic(this);

    // Notify 'me' listener, if available:
    if (this.name !== TOPIC_ME && !desc._noForwarding) {
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
  },

  // Called by Tinode when meta.sub is recived or in response to received
  // {ctrl} after setMeta-sub.
  _processMetaSub: function(subs) {
    for (let idx in subs) {
      const sub = subs[idx];

      sub.updated = new Date(sub.updated);
      sub.deleted = sub.deleted ? new Date(sub.deleted) : null;

      let user = null;
      if (!sub.deleted) {
        // If this is a change to user's own permissions, update them in topic too.
        // Desc will update 'me' topic.
        if (this._tinode.isMe(sub.user) && sub.acs) {
          this._processMetaDesc({
            updated: sub.updated || new Date(),
            touched: sub.updated,
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
  },

  // Called by Tinode when meta.tags is recived.
  _processMetaTags: function(tags) {
    if (tags.length == 1 && tags[0] == Tinode.DEL_CHAR) {
      tags = [];
    }
    this._tags = tags;
    if (this.onTagsUpdated) {
      this.onTagsUpdated(tags);
    }
  },

  // Do nothing for topics other than 'me'
  _processMetaCreds: function(creds) {},

  // Delete cached messages and update cached transaction IDs
  _processDelMessages: function(clear, delseq) {
    this._maxDel = Math.max(clear, this._maxDel);
    this.clear = Math.max(clear, this.clear);
    const topic = this;
    let count = 0;
    if (Array.isArray(delseq)) {
      delseq.map(function(range) {
        if (!range.hi) {
          count++;
          topic.flushMessage(range.low);
        } else {
          for (let i = range.low; i < range.hi; i++) {
            count++;
            topic.flushMessage(i);
          }
        }
      });
    }

    if (count > 0) {
      this._updateDeletedRanges();

      if (this.onData) {
        this.onData();
      }
    }
  },

  // Topic is informed that the entire response to {get what=data} has been received.
  _allMessagesReceived: function(count) {
    this._updateDeletedRanges();

    if (this.onAllMessagesReceived) {
      this.onAllMessagesReceived(count);
    }
  },

  // Reset subscribed state
  _resetSub: function() {
    this._subscribed = false;
  },

  // This topic is either deleted or unsubscribed from.
  _gone: function() {
    this._messages.reset();
    this._tinode._db.remMessages(this.name);
    this._users = {};
    this.acs = new AccessMode(null);
    this.private = null;
    this.public = null;
    this._maxSeq = 0;
    this._minSeq = 0;
    this._subscribed = false;

    const me = this._tinode.getMeTopic();
    if (me) {
      me._routePres({
        _noForwarding: true,
        what: 'gone',
        topic: TOPIC_ME,
        src: this.name
      });
    }
    if (this.onDeleteTopic) {
      this.onDeleteTopic();
    }
  },

  // Update global user cache and local subscribers cache.
  // Don't call this method for non-subscribers.
  _updateCachedUser: function(uid, obj) {
    // Fetch user object from the global cache.
    // This is a clone of the stored object
    let cached = this._cacheGetUser(uid);
    cached = mergeObj(cached || {}, obj);
    // Save to global cache
    this._cachePutUser(uid, cached);
    // Save to the list of topic subsribers.
    return mergeToCache(this._users, uid, cached);
  },

  // Get local seqId for a queued message.
  _getQueuedSeqId: function() {
    return this._queuedSeqId++;
  },

  // Calculate ranges of missing messages.
  _updateDeletedRanges: function() {
    const ranges = [];

    let prev = null;
    // Check for gap in the beginning, before the first message.
    const first = this._messages.getAt(0);
    if (first && this._minSeq > 1 && !this._noEarlierMsgs) {
      // Some messages are missing in the beginning.
      if (first.hi) {
        // The first message already represents a gap.
        if (first.seq > 1) {
          first.seq = 1;
        }
        if (first.hi < this._minSeq - 1) {
          first.hi = this._minSeq - 1;
        }
        prev = first;
      } else {
        // Create new gap.
        prev = {
          seq: 1,
          hi: this._minSeq - 1
        };
        ranges.push(prev);
      }
    } else {
      // No gap in the beginning.
      prev = {
        seq: 0,
        hi: 0
      };
    }

    // Find gaps in the list of received messages. The list contains messages-proper as well
    // as placeholers for deleted ranges.
    // The messages are iterated by seq ID in ascending order.
    this._messages.forEach((data) => {
      // Do not create a gap between the last sent message and the first unsent.
      if (data.seq >= LOCAL_SEQID) {
        return;
      }

      // New message is reducing the existing gap
      if (data.seq == (prev.hi || prev.seq) + 1) {
        // No new gap. Replace previous with current.
        prev = data;
        return;
      }

      // Found a new gap.
      if (prev.hi) {
        // Previous is also a gap, alter it.
        prev.hi = data.hi || data.seq;
        return;
      }

      // Previous is not a gap. Create a new gap.
      prev = {
        seq: (prev.hi || prev.seq) + 1,
        hi: data.hi || data.seq
      };
      ranges.push(prev);
    });

    // Check for missing messages at the end.
    // All messages could be missing or it could be a new topic with no messages.
    const last = this._messages.getLast();
    const maxSeq = Math.max(this.seq, this._maxSeq) || 0;
    if ((maxSeq > 0 && !last) || (last && ((last.hi || last.seq) < maxSeq))) {
      if (last && last.hi) {
        // Extend existing gap
        last.hi = maxSeq;
      } else {
        // Create new gap.
        ranges.push({
          seq: last ? last.seq + 1 : 1,
          hi: maxSeq
        });
      }
    }

    // Insert new gaps into cache.
    ranges.map((gap) => {
      this._messages.put(gap);
    });
  },

  // Load most recent messages from persistent cache.
  _loadMessages: function(db) {
    return db.readMessages(this.name, {
        limit: DEFAULT_MESSAGES_PAGE
      })
      .then((msgs) => {
        msgs.forEach((data) => {
          if (data.seq > this._maxSeq) {
            this._maxSeq = data.seq;
          }
          if (data.seq < this._minSeq || this._minSeq == 0) {
            this._minSeq = data.seq;
          }
          this._messages.put(data);
        });

        this._updateDeletedRanges();
        return this.name;
      });
  }
};

/**
 * @class TopicMe - special case of {@link Tinode.Topic} for
 * managing data of the current user, including contact list.
 * @extends Tinode.Topic
 * @memberof Tinode
 *
 * @param {TopicMe.Callbacks} callbacks - Callbacks to receive various events.
 */
var TopicMe = function(callbacks) {
  Topic.call(this, TOPIC_ME, callbacks);

  // me-specific callbacks
  if (callbacks) {
    this.onContactUpdate = callbacks.onContactUpdate;
  }
};

// Inherit everyting from the generic Topic
TopicMe.prototype = Object.create(Topic.prototype, {
  // Override the original Topic._processMetaDesc.
  _processMetaDesc: {
    value: function(desc) {
      // Check if online contacts need to be turned off because P permission was removed.
      const turnOff = (desc.acs && !desc.acs.isPresencer()) && (this.acs && this.acs.isPresencer());

      // Copy parameters from desc object to this topic.
      mergeObj(this, desc);
      this._tinode._db.updTopic(this);

      // String datetime headers to Date() objects.
      stringToDate(this);

      // 'P' permission was removed. All topics are offline now.
      if (turnOff) {
        this._tinode.cacheMap('topic', (cont) => {
          if (cont.online) {
            cont.online = false;
            if (cont.seen) {
              cont.seen.when = new Date();
            } else {
              cont.seen = {
                when: new Date()
              };
            }
            this._refreshContact('off', cont);
          }
        });
      }

      if (this.onMetaDesc) {
        this.onMetaDesc(this);
      }
    },
    enumerable: true,
    configurable: true
  },

  // Override the original Topic._processMetaSub
  _processMetaSub: {
    value: function(subs) {
      let updateCount = 0;
      subs.forEach((sub) => {
        const topicName = sub.topic;
        // Don't show 'me' and 'fnd' topics in the list of contacts.
        if (topicName == TOPIC_FND || topicName == TOPIC_ME) {
          return;
        }
        sub.updated = new Date(sub.updated);
        sub.touched = sub.touched ? new Date(sub.touched) : undefined;
        sub.deleted = sub.deleted ? new Date(sub.deleted) : null;

        let cont = null;
        if (sub.deleted) {
          cont = sub;
          this._tinode.cacheDel('topic', topicName);
          this._tinode._db.remTopic(topicName);
        } else {
          // Ensure the values are defined and are integers.
          if (typeof sub.seq != 'undefined') {
            sub.seq = sub.seq | 0;
            sub.recv = sub.recv | 0;
            sub.read = sub.read | 0;
            sub.unread = sub.seq - sub.read;
          }

          if (sub.seen && sub.seen.when) {
            sub.seen.when = new Date(sub.seen.when);
          }

          cont = mergeObj(this._tinode.getTopic(topicName), sub);
          this._tinode._db.updTopic(cont);

          if (Tinode.isP2PTopicName(topicName)) {
            this._cachePutUser(topicName, cont);
            this._tinode._db.updUser(topicName, cont.public);
          }
          // Notify topic of the update if it's an external update.
          if (!sub._noForwarding) {
            const topic = this._tinode.getTopic(topicName);
            if (topic) {
              sub._noForwarding = true;
              topic._processMetaDesc(sub);
            }
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
    },
    enumerable: true,
    configurable: true
  },

  // Called by Tinode when meta.sub is recived.
  _processMetaCreds: {
    value: function(creds, upd) {
      if (creds.length == 1 && creds[0] == Tinode.DEL_CHAR) {
        creds = [];
      }
      if (upd) {
        creds.map((cr) => {
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
    },
    enumerable: true,
    configurable: true
  },

  // Process presence change message
  _routePres: {
    value: function(pres) {
      if (pres.what == 'term') {
        // The 'me' topic itself is detached. Mark as unsubscribed.
        this._resetSub();
        return;
      }

      if (pres.what == 'upd' && pres.src == TOPIC_ME) {
        // Update to me's description. Request updated value.
        this.getMeta(this.startMetaQuery().withDesc().build());
        return;
      }

      const cont = this._tinode.cacheGet('topic', pres.src);
      if (cont) {
        switch (pres.what) {
          case 'on': // topic came online
            cont.online = true;
            break;
          case 'off': // topic went offline
            if (cont.online) {
              cont.online = false;
              if (cont.seen) {
                cont.seen.when = new Date();
              } else {
                cont.seen = {
                  when: new Date()
                };
              }
            }
            break;
          case 'msg': // new message received
            cont.touched = new Date();
            cont.seq = pres.seq | 0;
            // Check if message is sent by the current user. If so it's been read already.
            if (!pres.act || this._tinode.isMe(pres.act)) {
              cont.read = cont.read ? Math.max(cont.read, cont.seq) : cont.seq;
              cont.recv = cont.recv ? Math.max(cont.read, cont.recv) : cont.read;
            }
            cont.unread = cont.seq - (cont.read | 0);
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
            this._tinode.cacheDel('topic', pres.src);
            this._tinode._db.remTopic(pres.src);
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
            dummy.touched = new Date();
            dummy.topic = pres.src;
            dummy.online = false;
            dummy.acs = acs;
            this._tinode.attachCacheToTopic(dummy);
            dummy._cachePutSelf();
            this._db.updTopic(dummy);
          }
        } else if (pres.what == 'tags') {
          this.getMeta(this.startMetaQuery().withTags().build());
        }
      }

      if (this.onPres) {
        this.onPres(pres);
      }
    },
    enumerable: true,
    configurable: true
  },

  // Contact is updated, execute callbacks.
  _refreshContact: {
    value: function(what, cont) {
      if (this.onContactUpdate) {
        this.onContactUpdate(what, cont);
      }
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Publishing to TopicMe is not supported. {@link Topic#publish} is overriden and thows an {Error} if called.
   * @memberof Tinode.TopicMe#
   * @throws {Error} Always throws an error.
   */
  publish: {
    value: function() {
      return Promise.reject(new Error("Publishing to 'me' is not supported"));
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Delete validation credential.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} topic - Name of the topic to delete
   * @param {string} user - User ID to remove.
   * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
   */
  delCredential: {
    value: function(method, value) {
      if (!this._subscribed) {
        return Promise.reject(new Error("Cannot delete credential in inactive 'me' topic"));
      }
      // Send {del} message, return promise
      return this._tinode.delCredential(method, value).then((ctrl) => {
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

    },
    enumerable: true,
    configurable: true
  },

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
  contacts: {
    value: function(callback, filter, context) {
      this._tinode.cacheMap('topic', (c, idx) => {
        if (c.isCommType() && (!filter || filter(c))) {
          callback.call(context, c, idx);
        }
      });
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Get a contact from cache.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} name - Name of the contact to get, either a UID (for p2p topics) or a topic name.
   * @returns {Tinode.Contact} - Contact or `undefined`.
   */
  getContact: {
    value: function(name) {
      return this._tinode.cacheGet('topic', name);
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Get access mode of a given contact from cache.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} name - Name of the contact to get access mode for, either a UID (for p2p topics)
   *        or a topic name; if missing, access mode for the 'me' topic itself.
   * @returns {string} - access mode, such as `RWP`.
   */
  getAccessMode: {
    value: function(name) {
      if (name) {
        const cont = this._tinode.cacheGet('topic', name);
        return cont ? cont.acs : null;
      }
      return this.acs;
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Check if contact is archived, i.e. contact.private.arch == true.
   * @memberof Tinode.TopicMe#
   *
   * @param {string} name - Name of the contact to check archived status, either a UID (for p2p topics) or a topic name.
   * @returns {boolean} - true if contact is archived, false otherwise.
   */
  isArchived: {
    value: function(name) {
      const cont = this._tinode.cacheGet('topic', name);
      return cont ? ((cont.private && cont.private.arch) ? true : false) : null;
    },
    enumerable: true,
    configurable: true
  },

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
  getCredentials: {
    value: function() {
      return this._credentials;
    },
    enumerable: true,
    configurable: true
  }
});
TopicMe.prototype.constructor = TopicMe;

/**
 * @class TopicFnd - special case of {@link Tinode.Topic} for searching for
 * contacts and group topics.
 * @extends Tinode.Topic
 * @memberof Tinode
 *
 * @param {TopicFnd.Callbacks} callbacks - Callbacks to receive various events.
 */
var TopicFnd = function(callbacks) {
  Topic.call(this, TOPIC_FND, callbacks);
  // List of users and topics uid or topic_name -> Contact object)
  this._contacts = {};
};

// Inherit everyting from the generic Topic
TopicFnd.prototype = Object.create(Topic.prototype, {
  // Override the original Topic._processMetaSub
  _processMetaSub: {
    value: function(subs) {
      let updateCount = Object.getOwnPropertyNames(this._contacts).length;
      // Reset contact list.
      this._contacts = {};
      for (let idx in subs) {
        let sub = subs[idx];
        const indexBy = sub.topic ? sub.topic : sub.user;

        sub.updated = new Date(sub.updated);
        if (sub.seen && sub.seen.when) {
          sub.seen.when = new Date(sub.seen.when);
        }

        sub = mergeToCache(this._contacts, indexBy, sub);
        updateCount++;

        if (this.onMetaSub) {
          this.onMetaSub(sub);
        }
      }

      if (updateCount > 0 && this.onSubsUpdated) {
        this.onSubsUpdated(Object.keys(this._contacts));
      }
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Publishing to TopicFnd is not supported. {@link Topic#publish} is overriden and thows an {Error} if called.
   * @memberof Tinode.TopicFnd#
   * @throws {Error} Always throws an error.
   */
  publish: {
    value: function() {
      return Promise.reject(new Error("Publishing to 'fnd' is not supported"));
    },
    enumerable: true,
    configurable: true
  },

  /**
   * setMeta to TopicFnd resets contact list in addition to sending the message.
   * @memberof Tinode.TopicFnd#
   * @param {Tinode.SetParams} params parameters to update.
   * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
   */
  setMeta: {
    value: function(params) {
      const instance = this;
      return Object.getPrototypeOf(TopicFnd.prototype).setMeta.call(this, params).then(function() {
        if (Object.keys(instance._contacts).length > 0) {
          instance._contacts = {};
          if (instance.onSubsUpdated) {
            instance.onSubsUpdated([]);
          }
        }
      });
    },
    enumerable: true,
    configurable: true
  },

  /**
   * Iterate over found contacts. If callback is undefined, use {@link this.onMetaSub}.
   * @function
   * @memberof Tinode.TopicFnd#
   * @param {TopicFnd.ContactCallback} callback - Callback to call for each contact.
   * @param {Object} context - Context to use for calling the `callback`, i.e. the value of `this` inside the callback.
   */
  contacts: {
    value: function(callback, context) {
      const cb = (callback || this.onMetaSub);
      if (cb) {
        for (let idx in this._contacts) {
          cb.call(context, this._contacts[idx], idx, this._contacts);
        }
      }
    },
    enumerable: true,
    configurable: true
  }
});
TopicFnd.prototype.constructor = TopicFnd;

/**
 * @class LargeFileHelper - collection of utilities for uploading and downloading files
 * out of band. Don't instantiate this class directly. Use {Tinode.getLargeFileHelper} instead.
 * @memberof Tinode
 *
 * @param {Tinode} tinode - the main Tinode object.
 */
var LargeFileHelper = function(tinode) {
  this._tinode = tinode;

  this._apiKey = tinode._apiKey;
  this._authToken = tinode.getAuthToken();
  this._msgId = tinode.getNextUniqueId();
  this.xhr = new XMLHttpRequest();

  // Promise
  this.toResolve = null;
  this.toReject = null;

  // Callbacks
  this.onProgress = null;
  this.onSuccess = null;
  this.onFailure = null;
}

LargeFileHelper.prototype = {
  /**
   * Start uploading the file to a non-default endpoint.
   *
   * @memberof Tinode.LargeFileHelper#
   *
   * @param {string} baseUrl alternative base URL of upload server.
   * @param {File|Blob} data to upload
   * @param {Callback} onProgress callback. Takes one {float} parameter 0..1
   * @param {Callback} onSuccess callback. Called when the file is successfully uploaded.
   * @param {Callback} onFailure callback. Called in case of a failure.
   *
   * @returns {Promise} resolved/rejected when the upload is completed/failed.
   */
  uploadWithBaseUrl: function(baseUrl, data, onProgress, onSuccess, onFailure) {
    if (!this._authToken) {
      throw new Error("Must authenticate first");
    }
    const instance = this;

    let url = '/v' + PROTOCOL_VERSION + '/file/u/';
    if (baseUrl) {
      if (baseUrl.indexOf('http://') == 0 || baseUrl.indexOf('https://') == 0) {
        url = baseUrl + url;
      } else {
        throw new Error(`Invalid base URL '${baseUrl}'`);
      }
    }
    this.xhr.open('POST', url, true);
    this.xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    this.xhr.setRequestHeader('X-Tinode-Auth', 'Token ' + this._authToken.token);
    const result = new Promise((resolve, reject) => {
      this.toResolve = resolve;
      this.toReject = reject;
    });

    this.onProgress = onProgress;
    this.onSuccess = onSuccess;
    this.onFailure = onFailure;

    this.xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && instance.onProgress) {
        instance.onProgress(e.loaded / e.total);
      }
    }

    this.xhr.onload = function() {
      let pkt;
      try {
        pkt = JSON.parse(this.response, jsonParseHelper);
      } catch (err) {
        instance._tinode.logger("ERROR: Invalid server response in LargeFileHelper", this.response);
        pkt = {
          ctrl: {
            code: this.status,
            text: this.statusText
          }
        };
      }

      if (this.status >= 200 && this.status < 300) {
        if (instance.toResolve) {
          instance.toResolve(pkt.ctrl.params.url);
        }
        if (instance.onSuccess) {
          instance.onSuccess(pkt.ctrl);
        }
      } else if (this.status >= 400) {
        if (instance.toReject) {
          instance.toReject(new Error(`${pkt.ctrl.text} (${pkt.ctrl.code})`));
        }
        if (instance.onFailure) {
          instance.onFailure(pkt.ctrl)
        }
      } else {
        instance._tinode.logger("ERROR: Unexpected server response status", this.status, this.response);
      }
    };

    this.xhr.onerror = function(e) {
      if (instance.toReject) {
        instance.toReject(new Error("failed"));
      }
      if (instance.onFailure) {
        instance.onFailure(null);
      }
    };

    this.xhr.onabort = function(e) {
      if (instance.toReject) {
        instance.toReject(new Error("upload cancelled by user"));
      }
      if (instance.onFailure) {
        instance.onFailure(null);
      }
    };

    try {
      const form = new FormData();
      form.append('file', data);
      form.set('id', this._msgId);
      this.xhr.send(form);
    } catch (err) {
      if (this.toReject) {
        this.toReject(err);
      }
      if (this.onFailure) {
        this.onFailure(null);
      }
    }

    return result;
  },

  /**
   * Start uploading the file to default endpoint.
   *
   * @memberof Tinode.LargeFileHelper#
   *
   * @param {File|Blob} data to upload
   * @param {Callback} onProgress callback. Takes one {float} parameter 0..1
   * @param {Callback} onSuccess callback. Called when the file is successfully uploaded.
   * @param {Callback} onFailure callback. Called in case of a failure.
   *
   * @returns {Promise} resolved/rejected when the upload is completed/failed.
   */
  upload: function(data, onProgress, onSuccess, onFailure) {
    return this.uploadWithBaseUrl(undefined, data, onProgress, onSuccess, onFailure);
  },

  /**
   * Download the file from a given URL using GET request. This method works with the Tinode server only.
   *
   * @memberof Tinode.LargeFileHelper#
   *
   * @param {string} relativeUrl - URL to download the file from. Must be relative url, i.e. must not contain the host.
   * @param {string=} filename - file name to use for the downloaded file.
   *
   * @returns {Promise} resolved/rejected when the download is completed/failed.
   */
  download: function(relativeUrl, filename, mimetype, onProgress, onError) {
    if (!Tinode.isRelativeURL(relativeUrl)) {
      // As a security measure refuse to download from an absolute URL.
      if (onError) {
        onError(`The URL '${relativeUrl}' must be relative, not absolute`);
      }
      return;
    }
    if (!this._authToken) {
      if (onError) {
        onError("Must authenticate first");
      }
      return;
    }
    const instance = this;
    // Get data as blob (stored by the browser as a temporary file).
    this.xhr.open('GET', relativeUrl, true);
    this.xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    this.xhr.setRequestHeader('X-Tinode-Auth', 'Token ' + this._authToken.token);
    this.xhr.responseType = 'blob';

    this.onProgress = onProgress;
    this.xhr.onprogress = function(e) {
      if (instance.onProgress) {
        // Passing e.loaded instead of e.loaded/e.total because e.total
        // is always 0 with gzip compression enabled by the server.
        instance.onProgress(e.loaded);
      }
    };

    const result = new Promise((resolve, reject) => {
      this.toResolve = resolve;
      this.toReject = reject;
    });

    // The blob needs to be saved as file. There is no known way to
    // save the blob as file other than to fake a click on an <a href... download=...>.
    this.xhr.onload = function() {
      if (this.status == 200) {
        const link = document.createElement('a');
        // URL.createObjectURL is not available in non-browser environment. This call will fail.
        link.href = window.URL.createObjectURL(new Blob([this.response], {
          type: mimetype
        }));
        link.style.display = 'none';
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        if (instance.toResolve) {
          instance.toResolve();
        }
      } else if (this.status >= 400 && instance.toReject) {
        // The this.responseText is undefined, must use this.response which is a blob.
        // Need to convert this.response to JSON. The blob can only be accessed by the
        // FileReader.
        const reader = new FileReader();
        reader.onload = function() {
          try {
            const pkt = JSON.parse(this.result, jsonParseHelper);
            instance.toReject(new Error(`${pkt.ctrl.text} (${pkt.ctrl.code})`));
          } catch (err) {
            instance._tinode.logger("ERROR: Invalid server response in LargeFileHelper", this.result);
            instance.toReject(err);
          }
        };
        reader.readAsText(this.response);
      }
    };

    this.xhr.onerror = function(e) {
      if (instance.toReject) {
        instance.toReject(new Error("failed"));
      }
    };

    this.xhr.onabort = function() {
      if (instance.toReject) {
        instance.toReject(null);
      }
    };

    try {
      this.xhr.send();
    } catch (err) {
      if (this.toReject) {
        this.toReject(err);
      }
    }

    return result;
  },

  /**
   * Try to cancel an ongoing upload or download.
   * @memberof Tinode.LargeFileHelper#
   */
  cancel: function() {
    if (this.xhr && this.xhr.readyState < 4) {
      this.xhr.abort();
    }
  },

  /**
   * Get unique id of this request.
   * @memberof Tinode.LargeFileHelper#
   *
   * @returns {string} unique id
   */
  getId: function() {
    return this._msgId;
  }
};

/**
 * @class Message - definition a communication message.
 * Work in progress.
 * @memberof Tinode
 *
 * @param {string} topic_ - name of the topic the message belongs to.
 * @param {string | Drafty} content_ - message contant.
 */
var Message = function(topic_, content_) {
  this.status = Message.STATUS_NONE;
  this.topic = topic_;
  this.content = content_;
}

Message.STATUS_NONE = MESSAGE_STATUS_NONE;
Message.STATUS_QUEUED = MESSAGE_STATUS_QUEUED;
Message.STATUS_SENDING = MESSAGE_STATUS_SENDING;
Message.STATUS_FAILED = MESSAGE_STATUS_FAILED;
Message.STATUS_SENT = MESSAGE_STATUS_SENT;
Message.STATUS_RECEIVED = MESSAGE_STATUS_RECEIVED;
Message.STATUS_READ = MESSAGE_STATUS_READ;
Message.STATUS_TO_ME = MESSAGE_STATUS_TO_ME;

Message.prototype = {
  /**
   * Convert message object to {pub} packet.
   */
  toJSON: function() {

  },
  /**
   * Parse JSON into message.
   */
  fromJSON: function(json) {

  }
}
Message.prototype.constructor = Message;

if (typeof module != 'undefined') {
  module.exports = Tinode;
  module.exports.Drafty = Drafty;
  module.exports.AccessMode = AccessMode;
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../version.json":6,"./cbuffer.js":1,"./connection.js":2,"./db.js":3,"./drafty.js":4}],6:[function(require,module,exports){
module.exports={"version": "0.17.0-alpha3"}

},{}]},{},[5])(5)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2J1ZmZlci5qcyIsInNyYy9jb25uZWN0aW9uLmpzIiwic3JjL2RiLmpzIiwic3JjL2RyYWZ0eS5qcyIsInNyYy90aW5vZGUuanMiLCJ2ZXJzaW9uLmpzb24iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDek1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOW5EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2oxS0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qKlxuICogQGZpbGUgSW4tbWVtb3J5IHNvcnRlZCBjYWNoZSBvZiBvYmplY3RzLi5cbiAqXG4gKiBAY29weXJpZ2h0IDIwMTUtMjAyMSBUaW5vZGVcbiAqIEBzdW1tYXJ5IEphdmFzY3JpcHQgYmluZGluZ3MgZm9yIFRpbm9kZS5cbiAqIEBsaWNlbnNlIEFwYWNoZSAyLjBcbiAqIEB2ZXJzaW9uIDAuMTdcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEluLW1lbW9yeSBzb3J0ZWQgY2FjaGUgb2Ygb2JqZWN0cy5cbiAqXG4gKiBAY2xhc3MgQ0J1ZmZlclxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHByb3RlY3RlZFxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBhcmUgY3VzdG9tIGNvbXBhcmF0b3Igb2Ygb2JqZWN0cy4gVGFrZXMgdHdvIHBhcmFtZXRlcnMgPGNvZGU+YTwvY29kZT4gYW5kIDxjb2RlPmI8L2NvZGU+O1xuICogICAgcmV0dXJucyA8Y29kZT4tMTwvY29kZT4gaWYgPGNvZGU+YSA8IGI8L2NvZGU+LCA8Y29kZT4wPC9jb2RlPiBpZiA8Y29kZT5hID09IGI8L2NvZGU+LCA8Y29kZT4xPC9jb2RlPiBvdGhlcndpc2UuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHVuaXF1ZSBlbmZvcmNlIGVsZW1lbnQgdW5pcXVlbmVzczogd2hlbiA8Y29kZT50cnVlPC9jb2RlPiByZXBsYWNlIGV4aXN0aW5nIGVsZW1lbnQgd2l0aCBhIG5ld1xuICogICAgb25lIG9uIGNvbmZsaWN0OyB3aGVuIDxjb2RlPmZhbHNlPC9jb2RlPiBrZWVwIGJvdGggZWxlbWVudHMuXG4gKi9cbmNvbnN0IENCdWZmZXIgPSBmdW5jdGlvbihjb21wYXJlLCB1bmlxdWUpIHtcbiAgbGV0IGJ1ZmZlciA9IFtdO1xuXG4gIGNvbXBhcmUgPSBjb21wYXJlIHx8IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYSA9PT0gYiA/IDAgOiBhIDwgYiA/IC0xIDogMTtcbiAgfTtcblxuICBmdW5jdGlvbiBmaW5kTmVhcmVzdChlbGVtLCBhcnIsIGV4YWN0KSB7XG4gICAgbGV0IHN0YXJ0ID0gMDtcbiAgICBsZXQgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgbGV0IHBpdm90ID0gMDtcbiAgICBsZXQgZGlmZiA9IDA7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG5cbiAgICB3aGlsZSAoc3RhcnQgPD0gZW5kKSB7XG4gICAgICBwaXZvdCA9IChzdGFydCArIGVuZCkgLyAyIHwgMDtcbiAgICAgIGRpZmYgPSBjb21wYXJlKGFycltwaXZvdF0sIGVsZW0pO1xuICAgICAgaWYgKGRpZmYgPCAwKSB7XG4gICAgICAgIHN0YXJ0ID0gcGl2b3QgKyAxO1xuICAgICAgfSBlbHNlIGlmIChkaWZmID4gMCkge1xuICAgICAgICBlbmQgPSBwaXZvdCAtIDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZm91bmQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkeDogcGl2b3QsXG4gICAgICAgIGV4YWN0OiB0cnVlXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoZXhhY3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkeDogLTFcbiAgICAgIH07XG4gICAgfVxuICAgIC8vIE5vdCBleGFjdCAtIGluc2VydGlvbiBwb2ludFxuICAgIHJldHVybiB7XG4gICAgICBpZHg6IGRpZmYgPCAwID8gcGl2b3QgKyAxIDogcGl2b3RcbiAgICB9O1xuICB9XG5cbiAgLy8gSW5zZXJ0IGVsZW1lbnQgaW50byBhIHNvcnRlZCBhcnJheS5cbiAgZnVuY3Rpb24gaW5zZXJ0U29ydGVkKGVsZW0sIGFycikge1xuICAgIGNvbnN0IGZvdW5kID0gZmluZE5lYXJlc3QoZWxlbSwgYXJyLCBmYWxzZSk7XG4gICAgY29uc3QgY291bnQgPSAoZm91bmQuZXhhY3QgJiYgdW5pcXVlKSA/IDEgOiAwO1xuICAgIGFyci5zcGxpY2UoZm91bmQuaWR4LCBjb3VudCwgZWxlbSk7XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLyoqXG4gICAgICogR2V0IGFuIGVsZW1lbnQgYXQgdGhlIGdpdmVuIHBvc2l0aW9uLlxuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYXQgLSBQb3NpdGlvbiB0byBmZXRjaCBmcm9tLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEVsZW1lbnQgYXQgdGhlIGdpdmVuIHBvc2l0aW9uIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4uXG4gICAgICovXG4gICAgZ2V0QXQ6IGZ1bmN0aW9uKGF0KSB7XG4gICAgICByZXR1cm4gYnVmZmVyW2F0XTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ29udmVuaWVuY2UgbWV0aG9kIGZvciBnZXR0aW5nIHRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIGJ1ZmZlci5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGhlIGxhc3QgZWxlbWVudCBpbiB0aGUgYnVmZmVyIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4gaWYgYnVmZmVyIGlzIGVtcHR5LlxuICAgICAqL1xuICAgIGdldExhc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGJ1ZmZlci5sZW5ndGggPiAwID8gYnVmZmVyW2J1ZmZlci5sZW5ndGggLSAxXSA6IHVuZGVmaW5lZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIG5ldyBlbGVtZW50KHMpIHRvIHRoZSBidWZmZXIuIFZhcmlhZGljOiB0YWtlcyBvbmUgb3IgbW9yZSBhcmd1bWVudHMuIElmIGFuIGFycmF5IGlzIHBhc3NlZCBhcyBhIHNpbmdsZVxuICAgICAqIGFyZ3VtZW50LCBpdHMgZWxlbWVudHMgYXJlIGluc2VydGVkIGluZGl2aWR1YWxseS5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICpcbiAgICAgKiBAcGFyYW0gey4uLk9iamVjdHxBcnJheX0gLSBPbmUgb3IgbW9yZSBvYmplY3RzIHRvIGluc2VydC5cbiAgICAgKi9cbiAgICBwdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IGluc2VydDtcbiAgICAgIC8vIGluc3BlY3QgYXJndW1lbnRzOiBpZiBhcnJheSwgaW5zZXJ0IGl0cyBlbGVtZW50cywgaWYgb25lIG9yIG1vcmUgbm9uLWFycmF5IGFyZ3VtZW50cywgaW5zZXJ0IHRoZW0gb25lIGJ5IG9uZVxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiBBcnJheS5pc0FycmF5KGFyZ3VtZW50c1swXSkpIHtcbiAgICAgICAgaW5zZXJ0ID0gYXJndW1lbnRzWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zZXJ0ID0gYXJndW1lbnRzO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaWR4IGluIGluc2VydCkge1xuICAgICAgICBpbnNlcnRTb3J0ZWQoaW5zZXJ0W2lkeF0sIGJ1ZmZlcik7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBlbGVtZW50IGF0IHRoZSBnaXZlbiBwb3NpdGlvbi5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGF0IC0gUG9zaXRpb24gdG8gZGVsZXRlIGF0LlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEVsZW1lbnQgYXQgdGhlIGdpdmVuIHBvc2l0aW9uIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4uXG4gICAgICovXG4gICAgZGVsQXQ6IGZ1bmN0aW9uKGF0KSB7XG4gICAgICBsZXQgciA9IGJ1ZmZlci5zcGxpY2UoYXQsIDEpO1xuICAgICAgaWYgKHIgJiYgci5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiByWzBdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGVsZW1lbnRzIGJldHdlZW4gdHdvIHBvc2l0aW9ucy5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNpbmNlIC0gUG9zaXRpb24gdG8gZGVsZXRlIGZyb20gKGluY2x1c2l2ZSkuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJlZm9yZSAtIFBvc2l0aW9uIHRvIGRlbGV0ZSB0byAoZXhjbHVzaXZlKS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gYXJyYXkgb2YgcmVtb3ZlZCBlbGVtZW50cyAoY291bGQgYmUgemVybyBsZW5ndGgpLlxuICAgICAqL1xuICAgIGRlbFJhbmdlOiBmdW5jdGlvbihzaW5jZSwgYmVmb3JlKSB7XG4gICAgICByZXR1cm4gYnVmZmVyLnNwbGljZShzaW5jZSwgYmVmb3JlIC0gc2luY2UpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyB0aGUgYnVmZmVyIGhvbGRzLlxuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IE51bWJlciBvZiBlbGVtZW50cyBpbiB0aGUgYnVmZmVyLlxuICAgICAqL1xuICAgIGxlbmd0aDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYnVmZmVyLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgdGhlIGJ1ZmZlciBkaXNjYXJkaW5nIGFsbCBlbGVtZW50c1xuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICBidWZmZXIgPSBbXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGl0ZXJhdGluZyBjb250ZW50cyBvZiBidWZmZXIuIFNlZSB7QGxpbmsgVGlub2RlLkNCdWZmZXIjZm9yRWFjaH0uXG4gICAgICogQGNhbGxiYWNrIEZvckVhY2hDYWxsYmFja1R5cGVcbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW0gLSBFbGVtZW50IG9mIHRoZSBidWZmZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gSW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudC5cbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIEFwcGx5IGdpdmVuIDxjb2RlPmNhbGxiYWNrPC9jb2RlPiB0byBhbGwgZWxlbWVudHMgb2YgdGhlIGJ1ZmZlci5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1Rpbm9kZS5Gb3JFYWNoQ2FsbGJhY2tUeXBlfSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnRJZHggLSBPcHRpb25hbCBpbmRleCB0byBzdGFydCBpdGVyYXRpbmcgZnJvbSAoaW5jbHVzaXZlKS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYmVmb3JlSWR4IC0gT3B0aW9uYWwgaW5kZXggdG8gc3RvcCBpdGVyYXRpbmcgYmVmb3JlIChleGNsdXNpdmUpLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gY2FsbGluZyBjb250ZXh0IChpLmUuIHZhbHVlIG9mIDxjb2RlPnRoaXM8L2NvZGU+IGluIGNhbGxiYWNrKVxuICAgICAqL1xuICAgIGZvckVhY2g6IGZ1bmN0aW9uKGNhbGxiYWNrLCBzdGFydElkeCwgYmVmb3JlSWR4LCBjb250ZXh0KSB7XG4gICAgICBzdGFydElkeCA9IHN0YXJ0SWR4IHwgMDtcbiAgICAgIGJlZm9yZUlkeCA9IGJlZm9yZUlkeCB8fCBidWZmZXIubGVuZ3RoO1xuICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0SWR4OyBpIDwgYmVmb3JlSWR4OyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBidWZmZXJbaV0sIGkpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGVsZW1lbnQgaW4gYnVmZmVyIHVzaW5nIGJ1ZmZlcidzIGNvbXBhcmlzb24gZnVuY3Rpb24uXG4gICAgICogQG1lbWJlcm9mIFRpbm9kZS5DQnVmZmVyI1xuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW0gLSBlbGVtZW50IHRvIGZpbmQuXG4gICAgICogQHBhcmFtIHtib29sZWFuPX0gbmVhcmVzdCAtIHdoZW4gdHJ1ZSBhbmQgZXhhY3QgbWF0Y2ggaXMgbm90IGZvdW5kLCByZXR1cm4gdGhlIG5lYXJlc3QgZWxlbWVudCAoaW5zZXJ0aW9uIHBvaW50KS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgYnVmZmVyIG9yIC0xLlxuICAgICAqL1xuICAgIGZpbmQ6IGZ1bmN0aW9uKGVsZW0sIG5lYXJlc3QpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgaWR4XG4gICAgICB9ID0gZmluZE5lYXJlc3QoZWxlbSwgYnVmZmVyLCAhbmVhcmVzdCk7XG4gICAgICByZXR1cm4gaWR4O1xuICAgIH1cbiAgfVxufVxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IENCdWZmZXI7XG59XG4iLCIvKipcbiAqIEBmaWxlIEFic3RyYWN0aW9uIGxheWVyIGZvciB3ZWJzb2NrZXQgYW5kIGxvbmcgcG9sbGluZyBjb25uZWN0aW9ucy5cbiAqIFNlZSA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL3Rpbm9kZS93ZWJhcHBcIj5odHRwczovL2dpdGh1Yi5jb20vdGlub2RlL3dlYmFwcDwvYT4gZm9yIHJlYWwtbGlmZSB1c2FnZS5cbiAqXG4gKiBAY29weXJpZ2h0IDIwMTUtMjAyMSBUaW5vZGVcbiAqIEBzdW1tYXJ5IEphdmFzY3JpcHQgYmluZGluZ3MgZm9yIFRpbm9kZS5cbiAqIEBsaWNlbnNlIEFwYWNoZSAyLjBcbiAqIEB2ZXJzaW9uIDAuMTdcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5sZXQgV2ViU29ja2V0UHJvdmlkZXI7XG5pZiAodHlwZW9mIFdlYlNvY2tldCAhPSAndW5kZWZpbmVkJykge1xuICBXZWJTb2NrZXRQcm92aWRlciA9IFdlYlNvY2tldDtcbn1cblxubGV0IFhIUlByb3ZpZGVyO1xuaWYgKHR5cGVvZiBYTUxIdHRwUmVxdWVzdCAhPSAndW5kZWZpbmVkJykge1xuICBYSFJQcm92aWRlciA9IFhNTEh0dHBSZXF1ZXN0O1xufVxuXG5pZiAodHlwZW9mIHdpbmRvdyA9PSAndW5kZWZpbmVkJykge1xuICBnbG9iYWwud2luZG93ID0ge1xuICAgIFdlYlNvY2tldDogV2ViU29ja2V0UHJvdmlkZXIsXG4gICAgWE1MSHR0cFJlcXVlc3Q6IFhIUlByb3ZpZGVyLFxuICB9XG59XG5cbi8vIEVycm9yIGNvZGUgdG8gcmV0dXJuIGluIGNhc2Ugb2YgYSBuZXR3b3JrIHByb2JsZW0uXG5jb25zdCBORVRXT1JLX0VSUk9SID0gNTAzO1xuY29uc3QgTkVUV09SS19FUlJPUl9URVhUID0gXCJDb25uZWN0aW9uIGZhaWxlZFwiO1xuXG4vLyBFcnJvciBjb2RlIHRvIHJldHVybiB3aGVuIHVzZXIgZGlzY29ubmVjdGVkIGZyb20gc2VydmVyLlxuY29uc3QgTkVUV09SS19VU0VSID0gNDE4O1xuY29uc3QgTkVUV09SS19VU0VSX1RFWFQgPSBcIkRpc2Nvbm5lY3RlZCBieSBjbGllbnRcIjtcblxuLy8gSGVscGVyIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBhbiBlbmRwb2ludCBVUkwuXG5mdW5jdGlvbiBtYWtlQmFzZVVybChob3N0LCBwcm90b2NvbCwgdmVyc2lvbiwgYXBpS2V5KSB7XG4gIGxldCB1cmwgPSBudWxsO1xuXG4gIGlmIChwcm90b2NvbCA9PT0gJ2h0dHAnIHx8IHByb3RvY29sID09PSAnaHR0cHMnIHx8IHByb3RvY29sID09PSAnd3MnIHx8IHByb3RvY29sID09PSAnd3NzJykge1xuICAgIHVybCA9IHByb3RvY29sICsgJzovLyc7XG4gICAgdXJsICs9IGhvc3Q7XG4gICAgaWYgKHVybC5jaGFyQXQodXJsLmxlbmd0aCAtIDEpICE9PSAnLycpIHtcbiAgICAgIHVybCArPSAnLyc7XG4gICAgfVxuICAgIHVybCArPSAndicgKyB2ZXJzaW9uICsgJy9jaGFubmVscyc7XG4gICAgaWYgKHByb3RvY29sID09PSAnaHR0cCcgfHwgcHJvdG9jb2wgPT09ICdodHRwcycpIHtcbiAgICAgIC8vIExvbmcgcG9sbGluZyBlbmRwb2ludCBlbmQgd2l0aCBcImxwXCIsIGkuZS5cbiAgICAgIC8vICcvdjAvY2hhbm5lbHMvbHAnIHZzIGp1c3QgJy92MC9jaGFubmVscycgZm9yIHdzXG4gICAgICB1cmwgKz0gJy9scCc7XG4gICAgfVxuICAgIHVybCArPSAnP2FwaWtleT0nICsgYXBpS2V5O1xuICB9XG5cbiAgcmV0dXJuIHVybDtcbn1cblxuLyoqXG4gKiBBbiBhYnN0cmFjdGlvbiBmb3IgYSB3ZWJzb2NrZXQgb3IgYSBsb25nIHBvbGxpbmcgY29ubmVjdGlvbi5cbiAqXG4gKiBAY2xhc3MgQ29ubmVjdGlvblxuICogQG1lbWJlcm9mIFRpbm9kZVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBob3N0XyAtIEhvc3QgbmFtZSBhbmQgcG9ydCBudW1iZXIgdG8gY29ubmVjdCB0by5cbiAqIEBwYXJhbSB7c3RyaW5nfSB2ZXJzaW9uXyAtIE1ham9yIHZhbHVlIG9mIHRoZSBwcm90b2NvbCB2ZXJzaW9uLCBlLmcuICcwJyBpbiAnMC4xNy4xJy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBhcGlLZXlfIC0gQVBJIGtleSBnZW5lcmF0ZWQgYnkga2V5Z2VuXG4gKiBAcGFyYW0ge3N0cmluZ30gdHJhbnNwb3J0XyAtIE5ldHdvcmsgdHJhbnNwb3J0IHRvIHVzZSwgZWl0aGVyIDxjb2RlPlwid3NcIjxjb2RlPi88Y29kZT5cIndzc1wiPC9jb2RlPiBmb3Igd2Vic29ja2V0IG9yXG4gKiAgICAgIDxjb2RlPmxwPC9jb2RlPiBmb3IgbG9uZyBwb2xsaW5nLlxuICogQHBhcmFtIHtib29sZWFufSBzZWN1cmVfIC0gVXNlIHNlY3VyZSBXZWJTb2NrZXQgKHdzcykgaWYgPGNvZGU+dHJ1ZTwvY29kZT4uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG9yZWNvbm5lY3RfIC0gSWYgY29ubmVjdGlvbiBpcyBsb3N0LCB0cnkgdG8gcmVjb25uZWN0IGF1dG9tYXRpY2FsbHkuXG4gKi9cbmNvbnN0IENvbm5lY3Rpb24gPSBmdW5jdGlvbihob3N0XywgdmVyc2lvbl8sIGFwaUtleV8sIHRyYW5zcG9ydF8sIHNlY3VyZV8sIGF1dG9yZWNvbm5lY3RfKSB7XG4gIGxldCBob3N0ID0gaG9zdF87XG4gIGxldCB2ZXJzaW9uID0gdmVyc2lvbl87XG4gIGxldCBzZWN1cmUgPSBzZWN1cmVfO1xuICBsZXQgYXBpS2V5ID0gYXBpS2V5XztcblxuICBsZXQgYXV0b3JlY29ubmVjdCA9IGF1dG9yZWNvbm5lY3RfO1xuXG4gIC8vIFNldHRpbmdzIGZvciBleHBvbmVudGlhbCBiYWNrb2ZmXG4gIGNvbnN0IF9CT0ZGX0JBU0UgPSAyMDAwOyAvLyAyMDAwIG1pbGxpc2Vjb25kcywgbWluaW11bSBkZWxheSBiZXR3ZWVuIHJlY29ubmVjdHNcbiAgY29uc3QgX0JPRkZfTUFYX0lURVIgPSAxMDsgLy8gTWF4aW11bSBkZWxheSBiZXR3ZWVuIHJlY29ubmVjdHMgMl4xMCAqIDIwMDAgfiAzNCBtaW51dGVzXG4gIGNvbnN0IF9CT0ZGX0pJVFRFUiA9IDAuMzsgLy8gQWRkIHJhbmRvbSBkZWxheVxuXG4gIGxldCBfYm9mZlRpbWVyID0gbnVsbDtcbiAgbGV0IF9ib2ZmSXRlcmF0aW9uID0gMDtcbiAgbGV0IF9ib2ZmQ2xvc2VkID0gZmFsc2U7IC8vIEluZGljYXRvciBpZiB0aGUgc29ja2V0IHdhcyBtYW51YWxseSBjbG9zZWQgLSBkb24ndCBhdXRvcmVjb25uZWN0IGlmIHRydWUuXG5cbiAgY29uc3QgbG9nID0gKHRleHQsIC4uLmFyZ3MpID0+IHtcbiAgICBpZiAodGhpcy5sb2dnZXIpIHtcbiAgICAgIHRoaXMubG9nZ2VyKHRleHQsIC4uLmFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJhY2tvZmYgaW1wbGVtZW50YXRpb24gLSByZWNvbm5lY3QgYWZ0ZXIgYSB0aW1lb3V0LlxuICBmdW5jdGlvbiBib2ZmUmVjb25uZWN0KCkge1xuICAgIC8vIENsZWFyIHRpbWVyXG4gICAgY2xlYXJUaW1lb3V0KF9ib2ZmVGltZXIpO1xuICAgIC8vIENhbGN1bGF0ZSB3aGVuIHRvIGZpcmUgdGhlIHJlY29ubmVjdCBhdHRlbXB0XG4gICAgY29uc3QgdGltZW91dCA9IF9CT0ZGX0JBU0UgKiAoTWF0aC5wb3coMiwgX2JvZmZJdGVyYXRpb24pICogKDEuMCArIF9CT0ZGX0pJVFRFUiAqIE1hdGgucmFuZG9tKCkpKTtcbiAgICAvLyBVcGRhdGUgaXRlcmF0aW9uIGNvdW50ZXIgZm9yIGZ1dHVyZSB1c2VcbiAgICBfYm9mZkl0ZXJhdGlvbiA9IChfYm9mZkl0ZXJhdGlvbiA+PSBfQk9GRl9NQVhfSVRFUiA/IF9ib2ZmSXRlcmF0aW9uIDogX2JvZmZJdGVyYXRpb24gKyAxKTtcbiAgICBpZiAodGhpcy5vbkF1dG9yZWNvbm5lY3RJdGVyYXRpb24pIHtcbiAgICAgIHRoaXMub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uKHRpbWVvdXQpO1xuICAgIH1cblxuICAgIF9ib2ZmVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGxvZyhgUmVjb25uZWN0aW5nLCBpdGVyPSR7X2JvZmZJdGVyYXRpb259LCB0aW1lb3V0PSR7dGltZW91dH1gKTtcbiAgICAgIC8vIE1heWJlIHRoZSBzb2NrZXQgd2FzIGNsb3NlZCB3aGlsZSB3ZSB3YWl0ZWQgZm9yIHRoZSB0aW1lcj9cbiAgICAgIGlmICghX2JvZmZDbG9zZWQpIHtcbiAgICAgICAgY29uc3QgcHJvbSA9IHRoaXMuY29ubmVjdCgpO1xuICAgICAgICBpZiAodGhpcy5vbkF1dG9yZWNvbm5lY3RJdGVyYXRpb24pIHtcbiAgICAgICAgICB0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbigwLCBwcm9tKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTdXBwcmVzcyBlcnJvciBpZiBpdCdzIG5vdCB1c2VkLlxuICAgICAgICAgIHByb20uY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgLyogZG8gbm90aGluZyAqL1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uKSB7XG4gICAgICAgIHRoaXMub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uKC0xKTtcbiAgICAgIH1cbiAgICB9LCB0aW1lb3V0KTtcbiAgfVxuXG4gIC8vIFRlcm1pbmF0ZSBhdXRvLXJlY29ubmVjdCBwcm9jZXNzLlxuICBmdW5jdGlvbiBib2ZmU3RvcCgpIHtcbiAgICBjbGVhclRpbWVvdXQoX2JvZmZUaW1lcik7XG4gICAgX2JvZmZUaW1lciA9IG51bGw7XG4gIH1cblxuICAvLyBSZXNldCBhdXRvLXJlY29ubmVjdCBpdGVyYXRpb24gY291bnRlci5cbiAgZnVuY3Rpb24gYm9mZlJlc2V0KCkge1xuICAgIF9ib2ZmSXRlcmF0aW9uID0gMDtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemF0aW9uIGZvciBXZWJzb2NrZXRcbiAgZnVuY3Rpb24gaW5pdF93cyhpbnN0YW5jZSkge1xuICAgIGxldCBfc29ja2V0ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYXRlIGEgbmV3IGNvbm5lY3Rpb25cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGhvc3RfIEhvc3QgbmFtZSB0byBjb25uZWN0IHRvOyBpZiA8Y29kZT5udWxsPC9jb2RlPiB0aGUgb2xkIGhvc3QgbmFtZSB3aWxsIGJlIHVzZWQuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZSBGb3JjZSBuZXcgY29ubmVjdGlvbiBldmVuIGlmIG9uZSBhbHJlYWR5IGV4aXN0cy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBQcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIGNvbm5lY3Rpb24gY2FsbCBjb21wbGV0ZXMsIHJlc29sdXRpb24gaXMgY2FsbGVkIHdpdGhvdXRcbiAgICAgKiAgcGFyYW1ldGVycywgcmVqZWN0aW9uIHBhc3NlcyB0aGUge0Vycm9yfSBhcyBwYXJhbWV0ZXIuXG4gICAgICovXG4gICAgaW5zdGFuY2UuY29ubmVjdCA9IGZ1bmN0aW9uKGhvc3RfLCBmb3JjZSkge1xuICAgICAgX2JvZmZDbG9zZWQgPSBmYWxzZTtcblxuICAgICAgaWYgKF9zb2NrZXQpIHtcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBfc29ja2V0LnJlYWR5U3RhdGUgPT0gX3NvY2tldC5PUEVOKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIF9zb2NrZXQuY2xvc2UoKTtcbiAgICAgICAgX3NvY2tldCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChob3N0Xykge1xuICAgICAgICBob3N0ID0gaG9zdF87XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgY29uc3QgdXJsID0gbWFrZUJhc2VVcmwoaG9zdCwgc2VjdXJlID8gJ3dzcycgOiAnd3MnLCB2ZXJzaW9uLCBhcGlLZXkpO1xuXG4gICAgICAgIGxvZyhcIkNvbm5lY3RpbmcgdG86IFwiLCB1cmwpO1xuXG4gICAgICAgIC8vIEl0IHRocm93cyB3aGVuIHRoZSBzZXJ2ZXIgaXMgbm90IGFjY2Vzc2libGUgYnV0IHRoZSBleGNlcHRpb24gY2Fubm90IGJlIGNhdWdodDpcbiAgICAgICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzEwMDI1OTIvamF2YXNjcmlwdC1kb2VzbnQtY2F0Y2gtZXJyb3ItaW4td2Vic29ja2V0LWluc3RhbnRpYXRpb24vMzEwMDMwNTdcbiAgICAgICAgY29uc3QgY29ubiA9IG5ldyBXZWJTb2NrZXRQcm92aWRlcih1cmwpO1xuXG4gICAgICAgIGNvbm4ub25lcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29ubi5vbm9wZW4gPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICBpZiAoYXV0b3JlY29ubmVjdCkge1xuICAgICAgICAgICAgYm9mZlN0b3AoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaW5zdGFuY2Uub25PcGVuKSB7XG4gICAgICAgICAgICBpbnN0YW5jZS5vbk9wZW4oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25uLm9uY2xvc2UgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICBfc29ja2V0ID0gbnVsbDtcblxuICAgICAgICAgIGlmIChpbnN0YW5jZS5vbkRpc2Nvbm5lY3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBfYm9mZkNsb3NlZCA/IE5FVFdPUktfVVNFUiA6IE5FVFdPUktfRVJST1I7XG4gICAgICAgICAgICBpbnN0YW5jZS5vbkRpc2Nvbm5lY3QobmV3IEVycm9yKF9ib2ZmQ2xvc2VkID8gTkVUV09SS19VU0VSX1RFWFQgOiBORVRXT1JLX0VSUk9SX1RFWFQgK1xuICAgICAgICAgICAgICAnICgnICsgY29kZSArICcpJyksIGNvZGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghX2JvZmZDbG9zZWQgJiYgYXV0b3JlY29ubmVjdCkge1xuICAgICAgICAgICAgYm9mZlJlY29ubmVjdC5jYWxsKGluc3RhbmNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25uLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgIGlmIChpbnN0YW5jZS5vbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGluc3RhbmNlLm9uTWVzc2FnZShldnQuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIF9zb2NrZXQgPSBjb25uO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJ5IHRvIHJlc3RvcmUgYSBuZXR3b3JrIGNvbm5lY3Rpb24sIGFsc28gcmVzZXQgYmFja29mZi5cbiAgICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlIC0gcmVjb25uZWN0IGV2ZW4gaWYgdGhlcmUgaXMgYSBsaXZlIGNvbm5lY3Rpb24gYWxyZWFkeS5cbiAgICAgKi9cbiAgICBpbnN0YW5jZS5yZWNvbm5lY3QgPSBmdW5jdGlvbihmb3JjZSkge1xuICAgICAgYm9mZlN0b3AoKTtcbiAgICAgIGluc3RhbmNlLmNvbm5lY3QobnVsbCwgZm9yY2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRlcm1pbmF0ZSB0aGUgbmV0d29yayBjb25uZWN0aW9uXG4gICAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgICAqL1xuICAgIGluc3RhbmNlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIF9ib2ZmQ2xvc2VkID0gdHJ1ZTtcbiAgICAgIGJvZmZTdG9wKCk7XG5cbiAgICAgIGlmICghX3NvY2tldCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBfc29ja2V0LmNsb3NlKCk7XG4gICAgICBfc29ja2V0ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgc3RyaW5nIHRvIHRoZSBzZXJ2ZXIuXG4gICAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1zZyAtIFN0cmluZyB0byBzZW5kLlxuICAgICAqIEB0aHJvd3MgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiB0aGUgdW5kZXJseWluZyBjb25uZWN0aW9uIGlzIG5vdCBsaXZlLlxuICAgICAqL1xuICAgIGluc3RhbmNlLnNlbmRUZXh0ID0gZnVuY3Rpb24obXNnKSB7XG4gICAgICBpZiAoX3NvY2tldCAmJiAoX3NvY2tldC5yZWFkeVN0YXRlID09IF9zb2NrZXQuT1BFTikpIHtcbiAgICAgICAgX3NvY2tldC5zZW5kKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJXZWJzb2NrZXQgaXMgbm90IGNvbm5lY3RlZFwiKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgc29ja2V0IGlzIGFsaXZlLlxuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgY29ubmVjdGlvbiBpcyBsaXZlLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGluc3RhbmNlLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gKF9zb2NrZXQgJiYgKF9zb2NrZXQucmVhZHlTdGF0ZSA9PSBfc29ja2V0Lk9QRU4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIG5hbWUgb2YgdGhlIGN1cnJlbnQgbmV0d29yayB0cmFuc3BvcnQuXG4gICAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IG5hbWUgb2YgdGhlIHRyYW5zcG9ydCBzdWNoIGFzIDxjb2RlPlwid3NcIjwvY29kZT4gb3IgPGNvZGU+XCJscFwiPC9jb2RlPi5cbiAgICAgKi9cbiAgICBpbnN0YW5jZS50cmFuc3BvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnd3MnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgbmV0d29yayBwcm9iZSB0byBjaGVjayBpZiBjb25uZWN0aW9uIGlzIGluZGVlZCBsaXZlLlxuICAgICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICAgKi9cbiAgICBpbnN0YW5jZS5wcm9iZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaW5zdGFuY2Uuc2VuZFRleHQoJzEnKTtcbiAgICB9XG4gIH1cblxuICAvLyBJbml0aWFsaXphdGlvbiBmb3IgbG9uZyBwb2xsaW5nLlxuICBmdW5jdGlvbiBpbml0X2xwKGluc3RhbmNlKSB7XG4gICAgY29uc3QgWERSX1VOU0VOVCA9IDA7IC8vIENsaWVudCBoYXMgYmVlbiBjcmVhdGVkLiBvcGVuKCkgbm90IGNhbGxlZCB5ZXQuXG4gICAgY29uc3QgWERSX09QRU5FRCA9IDE7IC8vIG9wZW4oKSBoYXMgYmVlbiBjYWxsZWQuXG4gICAgY29uc3QgWERSX0hFQURFUlNfUkVDRUlWRUQgPSAyOyAvLyBzZW5kKCkgaGFzIGJlZW4gY2FsbGVkLCBhbmQgaGVhZGVycyBhbmQgc3RhdHVzIGFyZSBhdmFpbGFibGUuXG4gICAgY29uc3QgWERSX0xPQURJTkcgPSAzOyAvLyBEb3dubG9hZGluZzsgcmVzcG9uc2VUZXh0IGhvbGRzIHBhcnRpYWwgZGF0YS5cbiAgICBjb25zdCBYRFJfRE9ORSA9IDQ7IC8vIFRoZSBvcGVyYXRpb24gaXMgY29tcGxldGUuXG4gICAgLy8gRnVsbHkgY29tcG9zZWQgZW5kcG9pbnQgVVJMLCB3aXRoIEFQSSBrZXkgJiBTSURcbiAgICBsZXQgX2xwVVJMID0gbnVsbDtcblxuICAgIGxldCBfcG9sbGVyID0gbnVsbDtcbiAgICBsZXQgX3NlbmRlciA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBscF9zZW5kZXIodXJsXykge1xuICAgICAgbGV0IHNlbmRlciA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgc2VuZGVyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICBpZiAoc2VuZGVyLnJlYWR5U3RhdGUgPT0gWERSX0RPTkUgJiYgc2VuZGVyLnN0YXR1cyA+PSA0MDApIHtcbiAgICAgICAgICAvLyBTb21lIHNvcnQgb2YgZXJyb3IgcmVzcG9uc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExQIHNlbmRlciBmYWlsZWQsICR7c2VuZGVyLnN0YXR1c31gKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZW5kZXIub3BlbignUE9TVCcsIHVybF8sIHRydWUpO1xuICAgICAgcmV0dXJuIHNlbmRlcjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBscF9wb2xsZXIodXJsXywgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBsZXQgcG9sbGVyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICBsZXQgcHJvbWlzZUNvbXBsZXRlZCA9IGZhbHNlO1xuXG4gICAgICBwb2xsZXIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oZXZ0KSB7XG5cbiAgICAgICAgaWYgKHBvbGxlci5yZWFkeVN0YXRlID09IFhEUl9ET05FKSB7XG4gICAgICAgICAgaWYgKHBvbGxlci5zdGF0dXMgPT0gMjAxKSB7IC8vIDIwMSA9PSBIVFRQLkNyZWF0ZWQsIGdldCBTSURcbiAgICAgICAgICAgIGxldCBwa3QgPSBKU09OLnBhcnNlKHBvbGxlci5yZXNwb25zZVRleHQsIGpzb25QYXJzZUhlbHBlcik7XG4gICAgICAgICAgICBfbHBVUkwgPSB1cmxfICsgJyZzaWQ9JyArIHBrdC5jdHJsLnBhcmFtcy5zaWRcbiAgICAgICAgICAgIHBvbGxlciA9IGxwX3BvbGxlcihfbHBVUkwpO1xuICAgICAgICAgICAgcG9sbGVyLnNlbmQobnVsbClcbiAgICAgICAgICAgIGlmIChpbnN0YW5jZS5vbk9wZW4pIHtcbiAgICAgICAgICAgICAgaW5zdGFuY2Uub25PcGVuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgIHByb21pc2VDb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhdXRvcmVjb25uZWN0KSB7XG4gICAgICAgICAgICAgIGJvZmZTdG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChwb2xsZXIuc3RhdHVzIDwgNDAwKSB7IC8vIDQwMCA9IEhUVFAuQmFkUmVxdWVzdFxuICAgICAgICAgICAgaWYgKGluc3RhbmNlLm9uTWVzc2FnZSkge1xuICAgICAgICAgICAgICBpbnN0YW5jZS5vbk1lc3NhZ2UocG9sbGVyLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvbGxlciA9IGxwX3BvbGxlcihfbHBVUkwpO1xuICAgICAgICAgICAgcG9sbGVyLnNlbmQobnVsbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIERvbid0IHRocm93IGFuIGVycm9yIGhlcmUsIGdyYWNlZnVsbHkgaGFuZGxlIHNlcnZlciBlcnJvcnNcbiAgICAgICAgICAgIGlmIChyZWplY3QgJiYgIXByb21pc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgICAgICAgcHJvbWlzZUNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgIHJlamVjdChwb2xsZXIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpbnN0YW5jZS5vbk1lc3NhZ2UgJiYgcG9sbGVyLnJlc3BvbnNlVGV4dCkge1xuICAgICAgICAgICAgICBpbnN0YW5jZS5vbk1lc3NhZ2UocG9sbGVyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaW5zdGFuY2Uub25EaXNjb25uZWN0KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBwb2xsZXIuc3RhdHVzIHx8IChfYm9mZkNsb3NlZCA/IE5FVFdPUktfVVNFUiA6IE5FVFdPUktfRVJST1IpO1xuICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gcG9sbGVyLnJlc3BvbnNlVGV4dCB8fCAoX2JvZmZDbG9zZWQgPyBORVRXT1JLX1VTRVJfVEVYVCA6IE5FVFdPUktfRVJST1JfVEVYVCk7XG4gICAgICAgICAgICAgIGluc3RhbmNlLm9uRGlzY29ubmVjdChuZXcgRXJyb3IodGV4dCArICcgKCcgKyBjb2RlICsgJyknKSwgY29kZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBvbGxpbmcgaGFzIHN0b3BwZWQuIEluZGljYXRlIGl0IGJ5IHNldHRpbmcgcG9sbGVyIHRvIG51bGwuXG4gICAgICAgICAgICBwb2xsZXIgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFfYm9mZkNsb3NlZCAmJiBhdXRvcmVjb25uZWN0KSB7XG4gICAgICAgICAgICAgIGJvZmZSZWNvbm5lY3QuY2FsbChpbnN0YW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwb2xsZXIub3BlbignR0VUJywgdXJsXywgdHJ1ZSk7XG4gICAgICByZXR1cm4gcG9sbGVyO1xuICAgIH1cblxuICAgIGluc3RhbmNlLmNvbm5lY3QgPSBmdW5jdGlvbihob3N0XywgZm9yY2UpIHtcbiAgICAgIF9ib2ZmQ2xvc2VkID0gZmFsc2U7XG5cbiAgICAgIGlmIChfcG9sbGVyKSB7XG4gICAgICAgIGlmICghZm9yY2UpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgX3BvbGxlci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIF9wb2xsZXIuYWJvcnQoKTtcbiAgICAgICAgX3BvbGxlciA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChob3N0Xykge1xuICAgICAgICBob3N0ID0gaG9zdF87XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgY29uc3QgdXJsID0gbWFrZUJhc2VVcmwoaG9zdCwgc2VjdXJlID8gJ2h0dHBzJyA6ICdodHRwJywgdmVyc2lvbiwgYXBpS2V5KTtcbiAgICAgICAgbG9nKFwiQ29ubmVjdGluZyB0bzogXCIsIHVybCk7XG4gICAgICAgIF9wb2xsZXIgPSBscF9wb2xsZXIodXJsLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICBfcG9sbGVyLnNlbmQobnVsbClcbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgbG9nKFwiTFAgY29ubmVjdGlvbiBmYWlsZWQ6XCIsIGVycik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgaW5zdGFuY2UucmVjb25uZWN0ID0gZnVuY3Rpb24oZm9yY2UpIHtcbiAgICAgIGJvZmZTdG9wKCk7XG4gICAgICBpbnN0YW5jZS5jb25uZWN0KG51bGwsIGZvcmNlKTtcbiAgICB9O1xuXG4gICAgaW5zdGFuY2UuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgX2JvZmZDbG9zZWQgPSB0cnVlO1xuICAgICAgYm9mZlN0b3AoKTtcblxuICAgICAgaWYgKF9zZW5kZXIpIHtcbiAgICAgICAgX3NlbmRlci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIF9zZW5kZXIuYWJvcnQoKTtcbiAgICAgICAgX3NlbmRlciA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoX3BvbGxlcikge1xuICAgICAgICBfcG9sbGVyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgX3BvbGxlci5hYm9ydCgpO1xuICAgICAgICBfcG9sbGVyID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGluc3RhbmNlLm9uRGlzY29ubmVjdCkge1xuICAgICAgICBpbnN0YW5jZS5vbkRpc2Nvbm5lY3QobmV3IEVycm9yKE5FVFdPUktfVVNFUl9URVhUICsgJyAoJyArIE5FVFdPUktfVVNFUiArICcpJyksIE5FVFdPUktfVVNFUik7XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgaXQncyByZWNvbnN0cnVjdGVkXG4gICAgICBfbHBVUkwgPSBudWxsO1xuICAgIH1cblxuICAgIGluc3RhbmNlLnNlbmRUZXh0ID0gZnVuY3Rpb24obXNnKSB7XG4gICAgICBfc2VuZGVyID0gbHBfc2VuZGVyKF9scFVSTCk7XG4gICAgICBpZiAoX3NlbmRlciAmJiAoX3NlbmRlci5yZWFkeVN0YXRlID09IDEpKSB7IC8vIDEgPT0gT1BFTkVEXG4gICAgICAgIF9zZW5kZXIuc2VuZChtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTG9uZyBwb2xsZXIgZmFpbGVkIHRvIGNvbm5lY3RcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGluc3RhbmNlLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gKF9wb2xsZXIgJiYgdHJ1ZSk7XG4gICAgfVxuXG4gICAgaW5zdGFuY2UudHJhbnNwb3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJ2xwJztcbiAgICB9XG5cbiAgICBpbnN0YW5jZS5wcm9iZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaW5zdGFuY2Uuc2VuZFRleHQoJzEnKTtcbiAgICB9XG4gIH1cblxuICBsZXQgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgaWYgKHRyYW5zcG9ydF8gPT09ICdscCcpIHtcbiAgICAvLyBleHBsaWNpdCByZXF1ZXN0IHRvIHVzZSBsb25nIHBvbGxpbmdcbiAgICBpbml0X2xwKHRoaXMpO1xuICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICh0cmFuc3BvcnRfID09PSAnd3MnKSB7XG4gICAgLy8gZXhwbGljaXQgcmVxdWVzdCB0byB1c2Ugd2ViIHNvY2tldFxuICAgIC8vIGlmIHdlYnNvY2tldHMgYXJlIG5vdCBhdmFpbGFibGUsIGhvcnJpYmxlIHRoaW5ncyB3aWxsIGhhcHBlblxuICAgIGluaXRfd3ModGhpcyk7XG4gICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gICAgLy8gRGVmYXVsdCB0cmFuc3BvcnQgc2VsZWN0aW9uXG4gIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyA9PSAnb2JqZWN0Jykge1xuICAgIGlmICh3aW5kb3dbJ1dlYlNvY2tldCddKSB7XG4gICAgICAvLyBVc2luZyB3ZWIgc29ja2V0cyAtLSBkZWZhdWx0LlxuICAgICAgaW5pdF93cyh0aGlzKTtcbiAgICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHdpbmRvd1snWE1MSHR0cFJlcXVlc3QnXSkge1xuICAgICAgLy8gVGhlIGJyb3dzZXIgaGFzIG5vIHdlYnNvY2tldHMsIHVzaW5nIGxvbmcgcG9sbGluZy5cbiAgICAgIGluaXRfbHAodGhpcyk7XG4gICAgICBpbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpbml0aWFsaXplZCkge1xuICAgIC8vIE5vIHRyYW5zcG9ydCBpcyBhdmFpaWxhYmxlLlxuICAgIGxvZyhcIk5vIG5ldHdvcmsgdHJhbnNwb3J0IGlzIGF2YWlsYWJsZS4gUnVubmluZyB1bmRlciBOb2RlPyBDYWxsICdUaW5vZGUuc2V0TmV0d29ya1Byb3ZpZGVycygpJy5cIik7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbmV0d29yayB0cmFuc3BvcnQgaXMgYXZhaWxhYmxlLiBSdW5uaW5nIHVuZGVyIE5vZGU/IENhbGwgJ1Rpbm9kZS5zZXROZXR3b3JrUHJvdmlkZXJzKCknLlwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gbmV0d29yayB0cmFuc3BvcnQgaXMgYXZhaWxhYmxlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0cmFucyAtIGVpdGhlciA8Y29kZT5cIndzXCI8L2NvZGU+ICh3ZWJzb2NrZXQpIG9yIDxjb2RlPlwibHBcIjwvY29kZT4gKGxvbmcgcG9sbGluZykuXG4gICAqIEByZXR1cm5zIHRydWUgaWYgZ2l2ZW4gdHJhbnNwb3J0IGlzIGF2YWlsYWJsZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgdGhpcy50cmFuc3BvcnRBdmFpbGFibGUgPSBmdW5jdGlvbih0cmFuc3ApIHtcbiAgICBzd2l0Y2ggKHRyYW5zcCkge1xuICAgICAgY2FzZSAnd3MnOlxuICAgICAgICByZXR1cm4gdHlwZW9mIHdpbmRvdyA9PSAnb2JqZWN0JyAmJiB3aW5kb3dbJ1dlYlNvY2tldCddO1xuICAgICAgY2FzZSAnbHAnOlxuICAgICAgICByZXR1cm4gdHlwZW9mIHdpbmRvdyA9PSAnb2JqZWN0JyAmJiB3aW5kb3dbJ1hNTEh0dHBSZXF1ZXN0J107XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsb2coXCJSZXF1ZXN0IGZvciB1bmtub3duIHRyYW5zcG9ydFwiLCB0cmFuc3ApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IGF1dG9yZWNvbm5lY3QgY291bnRlciB0byB6ZXJvLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAqL1xuICB0aGlzLmJhY2tvZmZSZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIGJvZmZSZXNldCgpO1xuICB9XG5cbiAgLy8gQ2FsbGJhY2tzOlxuICAvKipcbiAgICogQSBjYWxsYmFjayB0byBwYXNzIGluY29taW5nIG1lc3NhZ2VzIHRvLiBTZWUge0BsaW5rIFRpbm9kZS5Db25uZWN0aW9uI29uTWVzc2FnZX0uXG4gICAqIEBjYWxsYmFjayBUaW5vZGUuQ29ubmVjdGlvbi5Pbk1lc3NhZ2VcbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gTWVzc2FnZSB0byBwcm9jZXNzLlxuICAgKi9cbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgdG8gcGFzcyBpbmNvbWluZyBtZXNzYWdlcyB0by5cbiAgICogQHR5cGUge1Rpbm9kZS5Db25uZWN0aW9uLk9uTWVzc2FnZX1cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKi9cbiAgdGhpcy5vbk1lc3NhZ2UgPSB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgZm9yIHJlcG9ydGluZyBhIGRyb3BwZWQgY29ubmVjdGlvbi5cbiAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAqL1xuICB0aGlzLm9uRGlzY29ubmVjdCA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQSBjYWxsYmFjayBjYWxsZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyByZWFkeSB0byBiZSB1c2VkIGZvciBzZW5kaW5nLiBGb3Igd2Vic29ja2V0cyBpdCdzIHNvY2tldCBvcGVuLFxuICAgKiBmb3IgbG9uZyBwb2xsaW5nIGl0J3MgPGNvZGU+cmVhZHlTdGF0ZT0xPC9jb2RlPiAoT1BFTkVEKVxuICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICovXG4gIHRoaXMub25PcGVuID0gdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBBIGNhbGxiYWNrIHRvIG5vdGlmeSBvZiByZWNvbm5lY3Rpb24gYXR0ZW1wdHMuIFNlZSB7QGxpbmsgVGlub2RlLkNvbm5lY3Rpb24jb25BdXRvcmVjb25uZWN0SXRlcmF0aW9ufS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uXG4gICAqIEBjYWxsYmFjayBBdXRvcmVjb25uZWN0SXRlcmF0aW9uVHlwZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGltZW91dCAtIHRpbWUgdGlsbCB0aGUgbmV4dCByZWNvbm5lY3QgYXR0ZW1wdCBpbiBtaWxsaXNlY29uZHMuIDxjb2RlPi0xPC9jb2RlPiBtZWFucyByZWNvbm5lY3Qgd2FzIHNraXBwZWQuXG4gICAqIEBwYXJhbSB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIHRoZSByZWNvbm5lY3QgYXR0ZW1wIGNvbXBsZXRlcy5cbiAgICpcbiAgICovXG4gIC8qKlxuICAgKiBBIGNhbGxiYWNrIHRvIGluZm9ybSB3aGVuIHRoZSBuZXh0IGF0dGFtcHQgdG8gcmVjb25uZWN0IHdpbGwgaGFwcGVuIGFuZCB0byByZWNlaXZlIGNvbm5lY3Rpb24gcHJvbWlzZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKiBAdHlwZSB7VGlub2RlLkNvbm5lY3Rpb24uQXV0b3JlY29ubmVjdEl0ZXJhdGlvblR5cGV9XG4gICAqL1xuICB0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbiA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQSBjYWxsYmFjayB0byBsb2cgZXZlbnRzIGZyb20gQ29ubmVjdGlvbi4gU2VlIHtAbGluayBUaW5vZGUuQ29ubmVjdGlvbiNsb2dnZXJ9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb25cbiAgICogQGNhbGxiYWNrIExvZ2dlckNhbGxiYWNrVHlwZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBFdmVudCB0byBsb2cuXG4gICAqL1xuICAvKipcbiAgICogQSBjYWxsYmFjayB0byByZXBvcnQgbG9nZ2luZyBldmVudHMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICogQHR5cGUge1Rpbm9kZS5Db25uZWN0aW9uLkxvZ2dlckNhbGxiYWNrVHlwZX1cbiAgICovXG4gIHRoaXMubG9nZ2VyID0gdW5kZWZpbmVkO1xufTtcblxuLyoqXG4gKiBUbyB1c2UgQ29ubmVjdGlvbiBpbiBhIG5vbiBicm93c2VyIGNvbnRleHQsIHN1cHBseSBXZWJTb2NrZXQgYW5kIFhNTEh0dHBSZXF1ZXN0IHByb3ZpZGVycy5cbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJvZiBDb25uZWN0aW9uXG4gKiBAcGFyYW0gd3NQcm92aWRlciBXZWJTb2NrZXQgcHJvdmlkZXIsIGUuZy4gZm9yIG5vZGVKUyAsIDxjb2RlPnJlcXVpcmUoJ3dzJyk8L2NvZGU+LlxuICogQHBhcmFtIHhoclByb3ZpZGVyIFhNTEh0dHBSZXF1ZXN0IHByb3ZpZGVyLCBlLmcuIGZvciBub2RlIDxjb2RlPnJlcXVpcmUoJ3hocicpPC9jb2RlPi5cbiAqL1xuQ29ubmVjdGlvbi5zZXROZXR3b3JrUHJvdmlkZXJzID0gZnVuY3Rpb24od3NQcm92aWRlciwgeGhyUHJvdmlkZXIpIHtcbiAgV2ViU29ja2V0UHJvdmlkZXIgPSB3c1Byb3ZpZGVyO1xuICBYSFJQcm92aWRlciA9IHhoclByb3ZpZGVyO1xufTtcblxuQ29ubmVjdGlvbi5ORVRXT1JLX0VSUk9SID0gTkVUV09SS19FUlJPUjtcbkNvbm5lY3Rpb24uTkVUV09SS19FUlJPUl9URVhUID0gTkVUV09SS19FUlJPUl9URVhUO1xuQ29ubmVjdGlvbi5ORVRXT1JLX1VTRVIgPSBORVRXT1JLX1VTRVI7XG5Db25uZWN0aW9uLk5FVFdPUktfVVNFUl9URVhUID0gTkVUV09SS19VU0VSX1RFWFQ7XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gQ29ubmVjdGlvbjtcbn1cbiIsIi8qKlxuICogQGZpbGUgSGVscGVyIG1ldGhvZHMgZm9yIGRlYWxpbmcgd2l0aCBJbmRleGVkREIgY2FjaGUgb2YgbWVzc2FnZXMsIHVzZXJzLCBhbmQgdG9waWNzLlxuICogU2VlIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vdGlub2RlL3dlYmFwcFwiPmh0dHBzOi8vZ2l0aHViLmNvbS90aW5vZGUvd2ViYXBwPC9hPiBmb3IgcmVhbC1saWZlIHVzYWdlLlxuICpcbiAqIEBjb3B5cmlnaHQgMjAxNS0yMDIxIFRpbm9kZVxuICogQHN1bW1hcnkgSmF2YXNjcmlwdCBiaW5kaW5ncyBmb3IgVGlub2RlLlxuICogQGxpY2Vuc2UgQXBhY2hlIDIuMFxuICogQHZlcnNpb24gMC4xN1xuICovXG4ndXNlIHN0cmljdCc7XG5cbi8vIE5PVEUgVE8gREVWRUxPUEVSUzpcbi8vIExvY2FsaXphYmxlIHN0cmluZ3Mgc2hvdWxkIGJlIGRvdWJsZSBxdW90ZWQgXCLRgdGC0YDQvtC60LAg0L3QsCDQtNGA0YPQs9C+0Lwg0Y/Qt9GL0LrQtVwiLFxuLy8gbm9uLWxvY2FsaXphYmxlIHN0cmluZ3Mgc2hvdWxkIGJlIHNpbmdsZSBxdW90ZWQgJ25vbi1sb2NhbGl6ZWQnLlxuXG5jb25zdCBEQl9WRVJTSU9OID0gMTtcbmNvbnN0IERCX05BTUUgPSAndGlub2RlLXdlYic7XG5cbmNvbnN0IERCID0gZnVuY3Rpb24ob25FcnJvciwgbG9nZ2VyKSB7XG4gIG9uRXJyb3IgPSBvbkVycm9yIHx8IGZ1bmN0aW9uKCkge31cbiAgbG9nZ2VyID0gbG9nZ2VyIHx8IGZ1bmN0aW9uKCkge31cblxuICAvLyBQbGFjZWhvbGRlciBEQiB3aGljaCBkb2VzIG5vdGhpbmcuXG4gIGxldCBkYiA9IG51bGw7XG4gIC8vIEluZGljYXRvciB0aGF0IHRoZSBjYWNoZSBpcyBkaXNhYmxlZC5cbiAgbGV0IGRpc2FibGVkID0gZmFsc2U7XG5cbiAgLy8gU2VyaWFsaXphYmxlIHRvcGljIGZpZWxkcy5cbiAgY29uc3QgdG9waWNfZmllbGRzID0gWydjcmVhdGVkJywgJ3VwZGF0ZWQnLCAnZGVsZXRlZCcsICdyZWFkJywgJ3JlY3YnLCAnc2VxJywgJ2NsZWFyJywgJ2RlZmFjcycsXG4gICAgJ2NyZWRzJywgJ3B1YmxpYycsICdwcml2YXRlJywgJ3RvdWNoZWQnXG4gIF07XG5cbiAgLy8gQ29weSB2YWx1ZXMgZnJvbSAnc3JjJyB0byAnZHN0Jy4gQWxsb2NhdGUgZHN0IGlmICdpdCdzIG51bGwgb3IgdW5kZWZpbmVkLlxuICBmdW5jdGlvbiBzZXJpYWxpemVUb3BpYyhkc3QsIHNyYykge1xuICAgIGNvbnN0IHJlcyA9IGRzdCB8fCB7XG4gICAgICBuYW1lOiBzcmMubmFtZVxuICAgIH07XG4gICAgdG9waWNfZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgcmVzW2ZdID0gc3JjW2ZdO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHNyYy5fdGFncykpIHtcbiAgICAgIHJlcy50YWdzID0gc3JjLl90YWdzO1xuICAgIH1cbiAgICBpZiAoc3JjLmFjcykge1xuICAgICAgcmVzLmFjcyA9IHNyYy5nZXRBY2Nlc3NNb2RlKCkuanNvbkhlbHBlcigpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgLy8gQ29weSBkYXRhIGZyb20gc3JjIHRvIFRvcGljIG9iamVjdC5cbiAgZnVuY3Rpb24gZGVzZXJpYWxpemVUb3BpYyh0b3BpYywgc3JjKSB7XG4gICAgdG9waWNfZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgdG9waWNbZl0gPSBzcmNbZl07XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc3JjLnRhZ3MpKSB7XG4gICAgICB0b3BpYy5fdGFncyA9IHNyYy50YWdzO1xuICAgIH1cbiAgICBpZiAoc3JjLmFjcykge1xuICAgICAgdG9waWMuc2V0QWNjZXNzTW9kZShzcmMuYWNzKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXJpYWxpemVTdWJzY3JpcHRpb24oZHN0LCB0b3BpY05hbWUsIHVpZCwgc3ViKSB7XG4gICAgY29uc3QgZmllbGRzID0gWyd1cGRhdGVkJywgJ21vZGUnLCAncmVhZCcsICdyZWN2JywgJ2NsZWFyJywgJ2xhc3RTZWVuJywgJ3VzZXJBZ2VudCddO1xuICAgIGNvbnN0IHJlcyA9IGRzdCB8fCB7XG4gICAgICB0b3BpYzogdG9waWNOYW1lLFxuICAgICAgdWlkOiB1aWRcbiAgICB9O1xuXG4gICAgZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChzdWIuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgcmVzW2ZdID0gc3ViW2ZdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZU1lc3NhZ2UoZHN0LCBtc2cpIHtcbiAgICAvLyBTZXJpYWxpemFibGUgZmllbGRzLlxuICAgIGNvbnN0IGZpZWxkcyA9IFsndG9waWMnLCAnc2VxJywgJ3RzJywgJ19zdGF0dXMnLCAnZnJvbScsICdoZWFkJywgJ2NvbnRlbnQnXTtcbiAgICBjb25zdCByZXMgPSBkc3QgfHwge307XG4gICAgZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChtc2cuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgcmVzW2ZdID0gbXNnW2ZdO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgcGVyc2lzdGVudCBjYWNoZTogb3BlbiBvciBjcmVhdGUvdXBncmFkZSBpZiBuZWVkZWQuXG4gICAgICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgREIgaXMgaW5pdGlhbGl6ZWQuXG4gICAgICovXG4gICAgaW5pdERhdGFiYXNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIC8vIE9wZW4gdGhlIGRhdGFiYXNlIGFuZCBpbml0aWFsaXplIGNhbGxiYWNrcy5cbiAgICAgICAgY29uc3QgcmVxID0gaW5kZXhlZERCLm9wZW4oREJfTkFNRSwgREJfVkVSU0lPTik7XG4gICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgcmVzb2x2ZShkYik7XG4gICAgICAgIH07XG4gICAgICAgIHJlcS5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwiZmFpbGVkIHRvIGluaXRpYWxpemVcIiwgZXZlbnQpO1xuICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICAgIGlmIChvbkVycm9yKSB7XG4gICAgICAgICAgICBvbkVycm9yKGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXEub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgICAgICBkYi5vbmVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcImZhaWxlZCB0byBjcmVhdGUgc3RvcmFnZVwiLCBldmVudCk7XG4gICAgICAgICAgICBpZiAob25FcnJvcikge1xuICAgICAgICAgICAgICBvbkVycm9yKGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vIEluZGl2aWR1YWwgb2JqZWN0IHN0b3Jlcy5cblxuICAgICAgICAgIC8vIE9iamVjdCBzdG9yZSAodGFibGUpIGZvciB0b3BpY3MuIFRoZSBwcmltYXJ5IGtleSBpcyB0b3BpYyBuYW1lLlxuICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKCd0b3BpYycsIHtcbiAgICAgICAgICAgIGtleVBhdGg6ICduYW1lJ1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gVXNlcnMgb2JqZWN0IHN0b3JlLiBVSUQgaXMgdGhlIHByaW1hcnkga2V5LlxuICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKCd1c2VyJywge1xuICAgICAgICAgICAga2V5UGF0aDogJ3VpZCdcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIFN1YnNjcmlwdGlvbnMgb2JqZWN0IHN0b3JlIHRvcGljIDwtPiB1c2VyLiBUb3BpYyBuYW1lICsgVUlEIGlzIHRoZSBwcmltYXJ5IGtleS5cbiAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZSgnc3Vic2NyaXB0aW9uJywge1xuICAgICAgICAgICAga2V5UGF0aDogWyd0b3BpYycsICd1aWQnXVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gTWVzc2FnZXMgb2JqZWN0IHN0b3JlLiBUaGUgcHJpbWFyeSBrZXkgaXMgdG9waWMgbmFtZSArIHNlcS5cbiAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZSgnbWVzc2FnZScsIHtcbiAgICAgICAgICAgIGtleVBhdGg6IFsndG9waWMnLCAnc2VxJ11cbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZWxldGUgcGVyc2lzdGVudCBjYWNoZS5cbiAgICAgKi9cbiAgICBkZWxldGVEYXRhYmFzZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCByZXEgPSBpbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoREJfTkFNRSk7XG4gICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBsb2dnZXIoXCJQQ2FjaGVcIiwgXCJkZWxldGVEYXRhYmFzZVwiLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHBlcnNpc3RlbnQgY2FjaGUgaXMgcmVhZHkgZm9yIHVzZS5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgY2FjaGUgaXMgcmVhZHksIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAgICovXG4gICAgaXNSZWFkeTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISFkYjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBwZXJzaXN0ZW50IGNhY2hlOiBhbGwgb3BlcmF0aW9ucyBkbyBub3RoaW5nIGJ1dCByZXR1cm4gc3VjY2Vzcy5cbiAgICAgKi9cbiAgICBkaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgIGRiID0gbnVsbDtcbiAgICAgIGRpc2FibGVkID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgLy8gVG9waWNzLlxuICAgIC8qKlxuICAgICAqIEFkZCBvciB1cGRhdGUgdG9waWMgaW4gcGVyc2lzdGVudCBjYWNoZS5cbiAgICAgKiBAbWVtYmVyT2YgREJcbiAgICAgKiBAcGFyYW0ge1RvcGljfSB0b3BpYyAtIHRvcGljIHRvIGJlIGFkZGVkIHRvIHBlcnNpc3RlbnQgc3RvcmFnZS5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICB1cGRUb3BpYzogZnVuY3Rpb24odG9waWMpIHtcbiAgICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHtcbiAgICAgICAgcmV0dXJuIGRpc2FibGVkID9cbiAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKSA6XG4gICAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsndG9waWMnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICB0cngub25jb21wbGV0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwidXBkVG9waWNcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVxID0gdHJ4Lm9iamVjdFN0b3JlKCd0b3BpYycpLmdldCh0b3BpYy5uYW1lKTtcbiAgICAgICAgcmVxLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHRyeC5vYmplY3RTdG9yZSgndG9waWMnKS5wdXQoc2VyaWFsaXplVG9waWMocmVxLnJlc3VsdCwgdG9waWMpKTtcbiAgICAgICAgICB0cnguY29tbWl0KCk7XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHRvcGljIGZyb20gcGVyc2lzdGVudCBjYWNoZS5cbiAgICAgKiBAbWVtYmVyT2YgREJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHRvIHJlbW92ZSBmcm9tIGRhdGFiYXNlLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAgICovXG4gICAgcmVtVG9waWM6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHtcbiAgICAgICAgcmV0dXJuIGRpc2FibGVkID9cbiAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKSA6XG4gICAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsndG9waWMnLCAnc3Vic2NyaXB0aW9uJywgJ21lc3NhZ2UnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICB0cngub25jb21wbGV0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwicmVtVG9waWNcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd0b3BpYycpLmRlbGV0ZShJREJLZXlSYW5nZS5vbmx5KG5hbWUpKTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdzdWJzY3JpcHRpb24nKS5kZWxldGUoSURCS2V5UmFuZ2UuYm91bmQoW25hbWUsICctJ10sIFtuYW1lLCAnfiddKSk7XG4gICAgICAgIHRyeC5vYmplY3RTdG9yZSgnbWVzc2FnZScpLmRlbGV0ZShJREJLZXlSYW5nZS5ib3VuZChbbmFtZSwgMF0sIFtuYW1lLCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUl0pKTtcbiAgICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBjYWxsYmFjayBmb3IgZWFjaCBzdG9yZWQgdG9waWMuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBmdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHRvcGljLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gdGhlIHZhbHVlIG9yIDxjb2RlPnRoaXM8L2NvZGU+IGluc2lkZSB0aGUgY2FsbGJhY2suXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICBtYXBUb3BpY3M6IGZ1bmN0aW9uKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICAgIHJldHVybiBkaXNhYmxlZCA/XG4gICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKFtdKSA6XG4gICAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsndG9waWMnXSk7XG4gICAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwibWFwVG9waWNzXCIsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vYmplY3RTdG9yZSgndG9waWMnKS5nZXRBbGwoKS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGV2ZW50LnRhcmdldC5yZXN1bHQuZm9yRWFjaCgodG9waWMpID0+IHtcbiAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB0b3BpYyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb3B5IGRhdGEgZnJvbSBzZXJpYWxpemVkIG9iamVjdCB0byB0b3BpYy5cbiAgICAgKiBAbWVtYmVyT2YgREJcbiAgICAgKiBAcGFyYW0ge1RvcGljfSB0b3BpYyAtIHRhcmdldCB0byBkZXNlcmlhbGl6ZSB0by5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3JjIC0gc2VyaWFsaXplZCBkYXRhIHRvIGNvcHkgZnJvbS5cbiAgICAgKi9cbiAgICBkZXNlcmlhbGl6ZVRvcGljOiBmdW5jdGlvbih0b3BpYywgc3JjKSB7XG4gICAgICBkZXNlcmlhbGl6ZVRvcGljKHRvcGljLCBzcmMpO1xuICAgIH0sXG5cbiAgICAvLyBVc2Vycy5cbiAgICAvKipcbiAgICAgKiBBZGQgb3IgdXBkYXRlIHVzZXIgb2JqZWN0IGluIHRoZSBwZXJzaXN0ZW50IGNhY2hlLlxuICAgICAqIEBtZW1iZXJPZiBEQlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1aWQgLSBJRCBvZiB0aGUgdXNlciB0byBzYXZlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwdWIgLSB1c2VyJ3MgPGNvZGU+cHVibGljPC9jb2RlPiBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICB1cGRVc2VyOiBmdW5jdGlvbih1aWQsIHB1Yikge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyIHx8IHB1YiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIE5vIHBvaW50IGludXBkYXRpbmcgdXNlciB3aXRoIGludmFsaWQgZGF0YS5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gZGlzYWJsZWQgP1xuICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgICBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJub3QgaW5pdGlhbGl6ZWRcIikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdHJ4ID0gZGIudHJhbnNhY3Rpb24oWyd1c2VyJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgdHJ4Lm9uY29tcGxldGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcInVwZFVzZXJcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd1c2VyJykucHV0KHtcbiAgICAgICAgICB1aWQ6IHVpZCxcbiAgICAgICAgICBwdWJsaWM6IHB1YlxuICAgICAgICB9KTtcbiAgICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSB1c2VyIGZyb20gcGVyc2lzdGVudCBjYWNoZS5cbiAgICAgKiBAbWVtYmVyT2YgREJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gSUQgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIGNhY2hlLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAgICovXG4gICAgcmVtVXNlcjogZnVuY3Rpb24odWlkKSB7XG4gICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICAgIHJldHVybiBkaXNhYmxlZCA/XG4gICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgOlxuICAgICAgICAgIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIm5vdCBpbml0aWFsaXplZFwiKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCB0cnggPSBkYi50cmFuc2FjdGlvbihbJ3VzZXInXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICB0cngub25jb21wbGV0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwicmVtVXNlclwiLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICB0cngub2JqZWN0U3RvcmUoJ3VzZXInKS5kZWxldGUoSURCS2V5UmFuZ2Uub25seSh1aWQpKTtcbiAgICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlYWQgYSBzaW5nbGUgdXNlciBmcm9tIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIElEIG9mIHRoZSB1c2VyIHRvIGZldGNoIGZyb20gY2FjaGUuXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICBnZXRVc2VyOiBmdW5jdGlvbih1aWQpIHtcbiAgICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHtcbiAgICAgICAgcmV0dXJuIGRpc2FibGVkID9cbiAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKSA6XG4gICAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsndXNlciddKTtcbiAgICAgICAgdHJ4Lm9uY29tcGxldGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCB1c2VyID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgIHVzZXI6IHVzZXIudWlkLFxuICAgICAgICAgICAgcHVibGljOiB1c2VyLnB1YmxpY1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcImdldFVzZXJcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd1c2VyJykuZ2V0KHVpZCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gU3Vic2NyaXB0aW9ucy5cblxuICAgIC8qKlxuICAgICAqIEFkZCBvciB1cGRhdGUgc3Vic2NyaXB0aW9uIGluIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHdoaWNoIG93bnMgdGhlIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIElEIG9mIHRoZSBzdWJzY3JpYmVkIHVzZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHN1YiAtIHN1YnNjcmlwdGlvbiB0byBzYXZlLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAgICovXG4gICAgdXBkU3Vic2NyaXB0aW9uOiBmdW5jdGlvbih0b3BpY05hbWUsIHVpZCwgc3ViKSB7XG4gICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICAgIHJldHVybiBkaXNhYmxlZCA/XG4gICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgOlxuICAgICAgICAgIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIm5vdCBpbml0aWFsaXplZFwiKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCB0cnggPSBkYi50cmFuc2FjdGlvbihbJ3N1YnNjcmlwdGlvbiddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIHRyeC5vbmNvbXBsZXRlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBsb2dnZXIoXCJQQ2FjaGVcIiwgXCJ1cGRTdWJzY3JpcHRpb25cIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdzdWJzY3JpcHRpb24nKS5nZXQoW3RvcGljTmFtZSwgdWlkXSkub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdzdWJzY3JpcHRpb24nKS5wdXQoc2VyaWFsaXplU3Vic2NyaXB0aW9uKGV2ZW50LnRhcmdldC5yZXN1bHQsIHRvcGljTmFtZSwgdWlkLCBzdWIpKTtcbiAgICAgICAgICB0cnguY29tbWl0KCk7XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIGNhbGxiYWNrIGZvciBlYWNoIGNhY2hlZCBzdWJzY3JpcHRpb24gaW4gYSBnaXZlbiB0b3BpYy5cbiAgICAgKiBAbWVtYmVyT2YgREJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWNOYW1lIC0gbmFtZSBvZiB0aGUgdG9waWMgd2hpY2ggb3ducyB0aGUgc3Vic2NyaXB0aW9ucy5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIGZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggc3Vic2NyaXB0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gdGhlIHZhbHVlIG9yIDxjb2RlPnRoaXM8L2NvZGU+IGluc2lkZSB0aGUgY2FsbGJhY2suXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICAgKi9cbiAgICBtYXBTdWJzY3JpcHRpb25zOiBmdW5jdGlvbih0b3BpY05hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICAgIHJldHVybiBkaXNhYmxlZCA/XG4gICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKFtdKSA6XG4gICAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsnc3Vic2NyaXB0aW9uJ10pO1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcIm1hcFN1YnNjcmlwdGlvbnNcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdzdWJzY3JpcHRpb24nKS5nZXRBbGwoSURCS2V5UmFuZ2UuYm91bmQoW3RvcGljTmFtZSwgJy0nXSwgW3RvcGljTmFtZSwgJ34nXSkpLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgZXZlbnQudGFyZ2V0LnJlc3VsdC5mb3JFYWNoKCh0b3BpYykgPT4ge1xuICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRvcGljKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIE1lc3NhZ2VzLlxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBtZXNzYWdlIHRvIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHdoaWNoIG93bnMgdGhlIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG1zZyAtIG1lc3NhZ2UgdG8gc2F2ZS5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgICAqL1xuICAgIGFkZE1lc3NhZ2U6IGZ1bmN0aW9uKG1zZykge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsnbWVzc2FnZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIHRyeC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcImFkZE1lc3NzYWdlXCIsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vYmplY3RTdG9yZSgnbWVzc2FnZScpLmFkZChzZXJpYWxpemVNZXNzYWdlKG51bGwsIG1zZykpO1xuICAgICAgICB0cnguY29tbWl0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGRlbGl2ZXJ5IHN0YXR1cyBvZiBhIG1lc3NhZ2Ugc3RvcmVkIGluIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHdoaWNoIG93bnMgdGhlIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNlcSAtIElEIG9mIHRoZSBtZXNzYWdlIHRvIHVwZGF0ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXMgLSBuZXcgZGVsaXZlcnkgc3RhdHVzIG9mIHRoZSBtZXNzYWdlLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAgICovXG4gICAgdXBkTWVzc2FnZVN0YXR1czogZnVuY3Rpb24odG9waWNOYW1lLCBzZXEsIHN0YXR1cykge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gZGlzYWJsZWQgP1xuICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgICBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJub3QgaW5pdGlhbGl6ZWRcIikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdHJ4ID0gZGIudHJhbnNhY3Rpb24oWydtZXNzYWdlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgdHJ4Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbG9nZ2VyKFwiUENhY2hlXCIsIFwidXBkTWVzc2FnZVN0YXR1c1wiLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZXEgPSB0cngub2JqZWN0U3RvcmUoJ21lc3NhZ2UnKS5nZXQoSURCS2V5UmFuZ2Uub25seShbdG9waWNOYW1lLCBzZXFdKSk7XG4gICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCBzcmMgPSByZXEucmVzdWx0IHx8IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgaWYgKCFzcmMgfHwgc3JjLl9zdGF0dXMgPT0gc3RhdHVzKSB7XG4gICAgICAgICAgICB0cnguY29tbWl0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHRyeC5vYmplY3RTdG9yZSgnbWVzc2FnZScpLnB1dChzZXJpYWxpemVNZXNzYWdlKHNyYywge1xuICAgICAgICAgICAgdG9waWM6IHRvcGljTmFtZSxcbiAgICAgICAgICAgIHNlcTogc2VxLFxuICAgICAgICAgICAgX3N0YXR1czogc3RhdHVzXG4gICAgICAgICAgfSkpO1xuICAgICAgICAgIHRyeC5jb21taXQoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgb25lIG9yIG1vcmUgbWVzc2FnZXMgZnJvbSBwZXJzaXN0ZW50IGNhY2hlLlxuICAgICAqIEBtZW1iZXJPZiBEQlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBuYW1lIG9mIHRoZSB0b3BpYyB3aGljaCBvd25zIHRoZSBtZXNzYWdlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tIC0gaWQgb2YgdGhlIG1lc3NhZ2UgdG8gcmVtb3ZlIG9yIGxvd2VyIGJvdW5kYXJ5IHdoZW4gcmVtb3ZpbmcgcmFuZ2UgKGluY2x1c2l2ZSkuXG4gICAgICogQHBhcmFtIHtudW1iZXI9fSB0byAtIHVwcGVyIGJvdW5kYXJ5IChleGNsdXNpdmUpIHdoZW4gcmVtb3ZpbmcgYSByYW5nZSBvZiBtZXNzYWdlcy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgICAqL1xuICAgIHJlbU1lc3NhZ2VzOiBmdW5jdGlvbih0b3BpY05hbWUsIGZyb20sIHRvKSB7XG4gICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICAgIHJldHVybiBkaXNhYmxlZCA/XG4gICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgOlxuICAgICAgICAgIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIm5vdCBpbml0aWFsaXplZFwiKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoIWZyb20gJiYgIXRvKSB7XG4gICAgICAgICAgZnJvbSA9IDA7XG4gICAgICAgICAgdG8gPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByYW5nZSA9IHRvID4gMCA/IElEQktleVJhbmdlLmJvdW5kKFt0b3BpY05hbWUsIGZyb21dLCBbdG9waWNOYW1lLCB0b10sIGZhbHNlLCB0cnVlKSA6XG4gICAgICAgICAgSURCS2V5UmFuZ2Uub25seShbdG9waWNOYW1lLCBmcm9tXSk7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsnbWVzc2FnZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIHRyeC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGxvZ2dlcihcIlBDYWNoZVwiLCBcInJlbU1lc3NhZ2VzXCIsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHRyeC5vYmplY3RTdG9yZSgnbWVzc2FnZScpLmRlbGV0ZShyYW5nZSk7XG4gICAgICAgIHRyeC5jb21taXQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSBtZXNzYWdlcyBmcm9tIHBlcnNpc3RlbnQgc3RvcmUuXG4gICAgICogQG1lbWJlck9mIERCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHRvIHJldHJpZXZlIG1lc3NhZ2VzIGZyb20uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgdG8gY2FsbCBmb3IgZWFjaCByZXRyaWV2ZWQgbWVzc2FnZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcXVlcnkgLSBwYXJhbWV0ZXJzIG9mIHRoZSBtZXNzYWdlIHJhbmdlIHRvIHJldHJpZXZlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gcXVlcnkuZnJvbSAtIHRoZSBsZWFzdCBtZXNzYWdlIElEIHRvIHJldHJpZXZlIChpbmNsdXNpdmUpLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gcXVlcnkudG8gLSB0aGUgZ3JlYXRlc3QgbWVzc2FnZSBJRCB0byByZXRyaWV2ZSAoZXhjbHVzaXZlKS5cbiAgICAgKiBAcGFyYW0ge251bWJlcj19IHF1ZXJ5LmxpbWl0IC0gdGhlIG1heGltdW0gbnVtYmVyIG9mIG1lc3NhZ2VzIHRvIHJldHJpZXZlLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAgICovXG4gICAgcmVhZE1lc3NhZ2VzOiBmdW5jdGlvbih0b3BpY05hbWUsIHF1ZXJ5LCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgICByZXR1cm4gZGlzYWJsZWQgP1xuICAgICAgICAgIFByb21pc2UucmVzb2x2ZShbXSkgOlxuICAgICAgICAgIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIm5vdCBpbml0aWFsaXplZFwiKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBxdWVyeSA9IHF1ZXJ5IHx8IHt9O1xuICAgICAgICBjb25zdCBmcm9tID0gcXVlcnkuZnJvbSA+IDAgPyBxdWVyeS5mcm9tIDogMDtcbiAgICAgICAgY29uc3QgdG8gPSBxdWVyeS50byA+IDAgPyBxdWVyeS50byA6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuICAgICAgICBjb25zdCBsaW1pdCA9IHF1ZXJ5LmxpbWl0IHwgMDtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBJREJLZXlSYW5nZS5ib3VuZChbdG9waWNOYW1lLCBmcm9tXSwgW3RvcGljTmFtZSwgdG9dLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgIGNvbnN0IHRyeCA9IGRiLnRyYW5zYWN0aW9uKFsnbWVzc2FnZSddKTtcbiAgICAgICAgdHJ4Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICBsb2dnZXIoXCJQQ2FjaGVcIiwgXCJyZWFkTWVzc2FnZXNcIiwgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gSXRlcmF0ZSBpbiBkZXNjZW5kaW5nIG9yZGVyLlxuICAgICAgICB0cngub2JqZWN0U3RvcmUoJ21lc3NhZ2UnKS5vcGVuQ3Vyc29yKHJhbmdlLCAncHJldicpLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgICBpZiAobGltaXQgPD0gMCB8fCByZXN1bHQubGVuZ3RoIDwgbGltaXQpIHtcbiAgICAgICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gREI7XG59XG4iLCIvKipcbiAqIEBjb3B5cmlnaHQgMjAxNS0yMDIxIFRpbm9kZVxuICogQHN1bW1hcnkgTWluaW1hbGx5IHJpY2ggdGV4dCByZXByZXNlbnRhdGlvbiBhbmQgZm9ybWF0dGluZyBmb3IgVGlub2RlLlxuICogQGxpY2Vuc2UgQXBhY2hlIDIuMFxuICogQHZlcnNpb24gMC4xNlxuICpcbiAqIEBmaWxlIEJhc2ljIHBhcnNlciBhbmQgZm9ybWF0dGVyIGZvciB2ZXJ5IHNpbXBsZSB0ZXh0IG1hcmt1cC4gTW9zdGx5IHRhcmdldGVkIGF0XG4gKiBtb2JpbGUgdXNlIGNhc2VzIHNpbWlsYXIgdG8gVGVsZWdyYW0sIFdoYXRzQXBwLCBhbmQgRkIgTWVzc2VuZ2VyLlxuICpcbiAqIDxwPlN1cHBvcnRzIGNvbnZlcnNpb24gb2YgdXNlciBrZXlib2FyZCBpbnB1dCB0byBmb3JtYXR0ZWQgdGV4dDo8L3A+XG4gKiA8dWw+XG4gKiAgIDxsaT4qYWJjKiAmcmFycjsgPGI+YWJjPC9iPjwvbGk+XG4gKiAgIDxsaT5fYWJjXyAmcmFycjsgPGk+YWJjPC9pPjwvbGk+XG4gKiAgIDxsaT5+YWJjfiAmcmFycjsgPGRlbD5hYmM8L2RlbD48L2xpPlxuICogICA8bGk+YGFiY2AgJnJhcnI7IDx0dD5hYmM8L3R0PjwvbGk+XG4gKiA8L3VsPlxuICogQWxzbyBzdXBwb3J0cyBmb3JtcyBhbmQgYnV0dG9ucy5cbiAqXG4gKiBOZXN0ZWQgZm9ybWF0dGluZyBpcyBzdXBwb3J0ZWQsIGUuZy4gKmFiYyBfZGVmXyogLT4gPGI+YWJjIDxpPmRlZjwvaT48L2I+XG4gKiBVUkxzLCBAbWVudGlvbnMsIGFuZCAjaGFzaHRhZ3MgYXJlIGV4dHJhY3RlZCBhbmQgY29udmVydGVkIGludG8gbGlua3MuXG4gKiBGb3JtcyBhbmQgYnV0dG9ucyBjYW4gYmUgYWRkZWQgcHJvY2VkdXJhbGx5LlxuICogSlNPTiBkYXRhIHJlcHJlc2VudGF0aW9uIGlzIGluc3BpcmVkIGJ5IERyYWZ0LmpzIHJhdyBmb3JtYXR0aW5nLlxuICpcbiAqXG4gKiBAZXhhbXBsZVxuICogVGV4dDpcbiAqIDxwcmU+XG4gKiAgICAgdGhpcyBpcyAqYm9sZCosIGBjb2RlYCBhbmQgX2l0YWxpY18sIH5zdHJpa2V+XG4gKiAgICAgY29tYmluZWQgKmJvbGQgYW5kIF9pdGFsaWNfKlxuICogICAgIGFuIHVybDogaHR0cHM6Ly93d3cuZXhhbXBsZS5jb20vYWJjI2ZyYWdtZW50IGFuZCBhbm90aGVyIF93d3cudGlub2RlLmNvX1xuICogICAgIHRoaXMgaXMgYSBAbWVudGlvbiBhbmQgYSAjaGFzaHRhZyBpbiBhIHN0cmluZ1xuICogICAgIHNlY29uZCAjaGFzaHRhZ1xuICogPC9wcmU+XG4gKlxuICogIFNhbXBsZSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0ZXh0IGFib3ZlOlxuICogIHtcbiAqICAgICBcInR4dFwiOiBcInRoaXMgaXMgYm9sZCwgY29kZSBhbmQgaXRhbGljLCBzdHJpa2UgY29tYmluZWQgYm9sZCBhbmQgaXRhbGljIGFuIHVybDogaHR0cHM6Ly93d3cuZXhhbXBsZS5jb20vYWJjI2ZyYWdtZW50IFwiICtcbiAqICAgICAgICAgICAgIFwiYW5kIGFub3RoZXIgd3d3LnRpbm9kZS5jbyB0aGlzIGlzIGEgQG1lbnRpb24gYW5kIGEgI2hhc2h0YWcgaW4gYSBzdHJpbmcgc2Vjb25kICNoYXNodGFnXCIsXG4gKiAgICAgXCJmbXRcIjogW1xuICogICAgICAgICB7IFwiYXRcIjo4LCBcImxlblwiOjQsXCJ0cFwiOlwiU1RcIiB9LHsgXCJhdFwiOjE0LCBcImxlblwiOjQsIFwidHBcIjpcIkNPXCIgfSx7IFwiYXRcIjoyMywgXCJsZW5cIjo2LCBcInRwXCI6XCJFTVwifSxcbiAqICAgICAgICAgeyBcImF0XCI6MzEsIFwibGVuXCI6NiwgXCJ0cFwiOlwiRExcIiB9LHsgXCJ0cFwiOlwiQlJcIiwgXCJsZW5cIjoxLCBcImF0XCI6MzcgfSx7IFwiYXRcIjo1NiwgXCJsZW5cIjo2LCBcInRwXCI6XCJFTVwiIH0sXG4gKiAgICAgICAgIHsgXCJhdFwiOjQ3LCBcImxlblwiOjE1LCBcInRwXCI6XCJTVFwiIH0seyBcInRwXCI6XCJCUlwiLCBcImxlblwiOjEsIFwiYXRcIjo2MiB9LHsgXCJhdFwiOjEyMCwgXCJsZW5cIjoxMywgXCJ0cFwiOlwiRU1cIiB9LFxuICogICAgICAgICB7IFwiYXRcIjo3MSwgXCJsZW5cIjozNiwgXCJrZXlcIjowIH0seyBcImF0XCI6MTIwLCBcImxlblwiOjEzLCBcImtleVwiOjEgfSx7IFwidHBcIjpcIkJSXCIsIFwibGVuXCI6MSwgXCJhdFwiOjEzMyB9LFxuICogICAgICAgICB7IFwiYXRcIjoxNDQsIFwibGVuXCI6OCwgXCJrZXlcIjoyIH0seyBcImF0XCI6MTU5LCBcImxlblwiOjgsIFwia2V5XCI6MyB9LHsgXCJ0cFwiOlwiQlJcIiwgXCJsZW5cIjoxLCBcImF0XCI6MTc5IH0sXG4gKiAgICAgICAgIHsgXCJhdFwiOjE4NywgXCJsZW5cIjo4LCBcImtleVwiOjMgfSx7IFwidHBcIjpcIkJSXCIsIFwibGVuXCI6MSwgXCJhdFwiOjE5NSB9XG4gKiAgICAgXSxcbiAqICAgICBcImVudFwiOiBbXG4gKiAgICAgICAgIHsgXCJ0cFwiOlwiTE5cIiwgXCJkYXRhXCI6eyBcInVybFwiOlwiaHR0cHM6Ly93d3cuZXhhbXBsZS5jb20vYWJjI2ZyYWdtZW50XCIgfSB9LFxuICogICAgICAgICB7IFwidHBcIjpcIkxOXCIsIFwiZGF0YVwiOnsgXCJ1cmxcIjpcImh0dHA6Ly93d3cudGlub2RlLmNvXCIgfSB9LFxuICogICAgICAgICB7IFwidHBcIjpcIk1OXCIsIFwiZGF0YVwiOnsgXCJ2YWxcIjpcIm1lbnRpb25cIiB9IH0sXG4gKiAgICAgICAgIHsgXCJ0cFwiOlwiSFRcIiwgXCJkYXRhXCI6eyBcInZhbFwiOlwiaGFzaHRhZ1wiIH0gfVxuICogICAgIF1cbiAqICB9XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBOT1RFIFRPIERFVkVMT1BFUlM6XG4vLyBMb2NhbGl6YWJsZSBzdHJpbmdzIHNob3VsZCBiZSBkb3VibGUgcXVvdGVkIFwi0YHRgtGA0L7QutCwINC90LAg0LTRgNGD0LPQvtC8INGP0LfRi9C60LVcIixcbi8vIG5vbi1sb2NhbGl6YWJsZSBzdHJpbmdzIHNob3VsZCBiZSBzaW5nbGUgcXVvdGVkICdub24tbG9jYWxpemVkJy5cblxuY29uc3QgTUFYX0ZPUk1fRUxFTUVOVFMgPSA4O1xuY29uc3QgSlNPTl9NSU1FX1RZUEUgPSAnYXBwbGljYXRpb24vanNvbic7XG5cbi8vIFJlZ3VsYXIgZXhwcmVzc2lvbnMgZm9yIHBhcnNpbmcgaW5saW5lIGZvcm1hdHMuIEphdmFzY3JpcHQgZG9lcyBub3Qgc3VwcG9ydCBsb29rYmVoaW5kLFxuLy8gc28gaXQncyBhIGJpdCBtZXNzeS5cbmNvbnN0IElOTElORV9TVFlMRVMgPSBbXG4gIC8vIFN0cm9uZyA9IGJvbGQsICpib2xkIHRleHQqXG4gIHtcbiAgICBuYW1lOiAnU1QnLFxuICAgIHN0YXJ0OiAvKD86XnxbXFxXX10pKFxcKilbXlxccypdLyxcbiAgICBlbmQ6IC9bXlxccypdKFxcKikoPz0kfFtcXFdfXSkvXG4gIH0sXG4gIC8vIEVtcGhlc2l6ZWQgPSBpdGFsaWMsIF9pdGFsaWMgdGV4dF9cbiAge1xuICAgIG5hbWU6ICdFTScsXG4gICAgc3RhcnQ6IC8oPzpefFxcVykoXylbXlxcc19dLyxcbiAgICBlbmQ6IC9bXlxcc19dKF8pKD89JHxcXFcpL1xuICB9LFxuICAvLyBEZWxldGVkLCB+c3RyaWtlIHRoaXMgdGhvdWdoflxuICB7XG4gICAgbmFtZTogJ0RMJyxcbiAgICBzdGFydDogLyg/Ol58W1xcV19dKSh+KVteXFxzfl0vLFxuICAgIGVuZDogL1teXFxzfl0ofikoPz0kfFtcXFdfXSkvXG4gIH0sXG4gIC8vIENvZGUgYmxvY2sgYHRoaXMgaXMgbW9ub3NwYWNlYFxuICB7XG4gICAgbmFtZTogJ0NPJyxcbiAgICBzdGFydDogLyg/Ol58XFxXKShgKVteYF0vLFxuICAgIGVuZDogL1teYF0oYCkoPz0kfFxcVykvXG4gIH1cbl07XG5cbi8vIFJlZ0V4cHMgZm9yIGVudGl0eSBleHRyYWN0aW9uIChSRiA9IHJlZmVyZW5jZSlcbmNvbnN0IEVOVElUWV9UWVBFUyA9IFtcbiAgLy8gVVJMc1xuICB7XG4gICAgbmFtZTogJ0xOJyxcbiAgICBkYXRhTmFtZTogJ3VybCcsXG4gICAgcGFjazogZnVuY3Rpb24odmFsKSB7XG4gICAgICAvLyBDaGVjayBpZiB0aGUgcHJvdG9jb2wgaXMgc3BlY2lmaWVkLCBpZiBub3QgdXNlIGh0dHBcbiAgICAgIGlmICghL15bYS16XSs6XFwvXFwvL2kudGVzdCh2YWwpKSB7XG4gICAgICAgIHZhbCA9ICdodHRwOi8vJyArIHZhbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogdmFsXG4gICAgICB9O1xuICAgIH0sXG4gICAgcmU6IC8oPzooPzpodHRwcz98ZnRwKTpcXC9cXC98d3d3XFwufGZ0cFxcLilbLUEtWjAtOSsmQCNcXC8lPX5ffCQ/ITosLl0qW0EtWjAtOSsmQCNcXC8lPX5ffCRdL2lnXG4gIH0sXG4gIC8vIE1lbnRpb25zIEB1c2VyIChtdXN0IGJlIDIgb3IgbW9yZSBjaGFyYWN0ZXJzKVxuICB7XG4gICAgbmFtZTogJ01OJyxcbiAgICBkYXRhTmFtZTogJ3ZhbCcsXG4gICAgcGFjazogZnVuY3Rpb24odmFsKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWw6IHZhbC5zbGljZSgxKVxuICAgICAgfTtcbiAgICB9LFxuICAgIHJlOiAvXFxCQChcXHdcXHcrKS9nXG4gIH0sXG4gIC8vIEhhc2h0YWdzICNoYXNodGFnLCBsaWtlIG1ldGlvbiAyIG9yIG1vcmUgY2hhcmFjdGVycy5cbiAge1xuICAgIG5hbWU6ICdIVCcsXG4gICAgZGF0YU5hbWU6ICd2YWwnLFxuICAgIHBhY2s6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsOiB2YWwuc2xpY2UoMSlcbiAgICAgIH07XG4gICAgfSxcbiAgICByZTogL1xcQiMoXFx3XFx3KykvZ1xuICB9XG5dO1xuXG4vLyBIVE1MIHRhZyBuYW1lIHN1Z2dlc3Rpb25zXG5jb25zdCBIVE1MX1RBR1MgPSB7XG4gIFNUOiB7XG4gICAgbmFtZTogJ2InLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgRU06IHtcbiAgICBuYW1lOiAnaScsXG4gICAgaXNWb2lkOiBmYWxzZVxuICB9LFxuICBETDoge1xuICAgIG5hbWU6ICdkZWwnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgQ086IHtcbiAgICBuYW1lOiAndHQnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgQlI6IHtcbiAgICBuYW1lOiAnYnInLFxuICAgIGlzVm9pZDogdHJ1ZVxuICB9LFxuICBMTjoge1xuICAgIG5hbWU6ICdhJyxcbiAgICBpc1ZvaWQ6IGZhbHNlXG4gIH0sXG4gIE1OOiB7XG4gICAgbmFtZTogJ2EnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgSFQ6IHtcbiAgICBuYW1lOiAnYScsXG4gICAgaXNWb2lkOiBmYWxzZVxuICB9LFxuICBJTToge1xuICAgIG5hbWU6ICdpbWcnLFxuICAgIGlzVm9pZDogdHJ1ZVxuICB9LFxuICBGTToge1xuICAgIG5hbWU6ICdkaXYnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgUlc6IHtcbiAgICBuYW1lOiAnZGl2JyxcbiAgICBpc1ZvaWQ6IGZhbHNlLFxuICB9LFxuICBCTjoge1xuICAgIG5hbWU6ICdidXR0b24nLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgSEQ6IHtcbiAgICBuYW1lOiAnJyxcbiAgICBpc1ZvaWQ6IGZhbHNlXG4gIH0sXG4gIEhMOiB7XG4gICAgbmFtZTogJ3NwYW4nLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfVxufTtcblxuLy8gQ29udmVydCBiYXNlNjQtZW5jb2RlZCBzdHJpbmcgaW50byBCbG9iLlxuZnVuY3Rpb24gYmFzZTY0dG9PYmplY3RVcmwoYjY0LCBjb250ZW50VHlwZSwgbG9nZ2VyKSB7XG4gIGlmICghYjY0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGJpbiA9IGF0b2IoYjY0KTtcbiAgICBjb25zdCBsZW5ndGggPSBiaW4ubGVuZ3RoO1xuICAgIGNvbnN0IGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpO1xuICAgIGNvbnN0IGFyciA9IG5ldyBVaW50OEFycmF5KGJ1Zik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgYXJyW2ldID0gYmluLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW2J1Zl0sIHtcbiAgICAgIHR5cGU6IGNvbnRlbnRUeXBlXG4gICAgfSkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAobG9nZ2VyKSB7XG4gICAgICBsb2dnZXIoXCJEcmFmdHk6IGZhaWxlZCB0byBjb252ZXJ0IG9iamVjdC5cIiwgZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBiYXNlNjR0b0RhdGFVcmwoYjY0LCBjb250ZW50VHlwZSkge1xuICBpZiAoIWI2NCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnRlbnRUeXBlID0gY29udGVudFR5cGUgfHwgJ2ltYWdlL2pwZWcnO1xuICByZXR1cm4gJ2RhdGE6JyArIGNvbnRlbnRUeXBlICsgJztiYXNlNjQsJyArIGI2NDtcbn1cblxuLy8gSGVscGVycyBmb3IgY29udmVydGluZyBEcmFmdHkgdG8gSFRNTC5cbmNvbnN0IERFQ09SQVRPUlMgPSB7XG4gIC8vIFZpc2lhbCBzdHlsZXNcbiAgU1Q6IHtcbiAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPGI+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPC9iPic7XG4gICAgfVxuICB9LFxuICBFTToge1xuICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8aT4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8L2k+J1xuICAgIH1cbiAgfSxcbiAgREw6IHtcbiAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPGRlbD4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8L2RlbD4nXG4gICAgfVxuICB9LFxuICBDTzoge1xuICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8dHQ+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPC90dD4nXG4gICAgfVxuICB9LFxuICAvLyBMaW5lIGJyZWFrXG4gIEJSOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzxici8+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfSxcbiAgLy8gSGlkZGVuIGVsZW1lbnRcbiAgSEQ6IHtcbiAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH0sXG4gIC8vIEhpZ2hsaWdodGVkIGVsZW1lbnQuXG4gIEhMOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzxzcGFuIHN0eWxlPVwiY29sb3I6dGVhbFwiPic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzwvc3Bhbj4nO1xuICAgIH1cbiAgfSxcbiAgLy8gTGluayAoVVJMKVxuICBMTjoge1xuICAgIG9wZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPGEgaHJlZj1cIicgKyBkYXRhLnVybCArICdcIj4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPC9hPic7XG4gICAgfSxcbiAgICBwcm9wczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIGRhdGEgPyB7XG4gICAgICAgIGhyZWY6IGRhdGEudXJsLFxuICAgICAgICB0YXJnZXQ6IFwiX2JsYW5rXCJcbiAgICAgIH0gOiBudWxsO1xuICAgIH0sXG4gIH0sXG4gIC8vIE1lbnRpb25cbiAgTU46IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzxhIGhyZWY9XCIjJyArIGRhdGEudmFsICsgJ1wiPic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8L2E+JztcbiAgICB9LFxuICAgIHByb3BzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSA/IHtcbiAgICAgICAgbmFtZTogZGF0YS52YWxcbiAgICAgIH0gOiBudWxsO1xuICAgIH0sXG4gIH0sXG4gIC8vIEhhc2h0YWdcbiAgSFQ6IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzxhIGhyZWY9XCIjJyArIGRhdGEudmFsICsgJ1wiPic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8L2E+JztcbiAgICB9LFxuICAgIHByb3BzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSA/IHtcbiAgICAgICAgbmFtZTogZGF0YS52YWxcbiAgICAgIH0gOiBudWxsO1xuICAgIH0sXG4gIH0sXG4gIC8vIEJ1dHRvblxuICBCTjoge1xuICAgIG9wZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPGJ1dHRvbj4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPC9idXR0b24+JztcbiAgICB9LFxuICAgIHByb3BzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSA/IHtcbiAgICAgICAgJ2RhdGEtYWN0JzogZGF0YS5hY3QsXG4gICAgICAgICdkYXRhLXZhbCc6IGRhdGEudmFsLFxuICAgICAgICAnZGF0YS1uYW1lJzogZGF0YS5uYW1lLFxuICAgICAgICAnZGF0YS1yZWYnOiBkYXRhLnJlZlxuICAgICAgfSA6IG51bGw7XG4gICAgfSxcbiAgfSxcbiAgLy8gSW1hZ2VcbiAgSU06IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyBEb24ndCB1c2UgZGF0YS5yZWYgZm9yIHByZXZpZXc6IGl0J3MgYSBzZWN1cml0eSByaXNrLlxuICAgICAgY29uc3QgdG1wUHJldmlld1VybCA9IGJhc2U2NHRvRGF0YVVybChkYXRhLl90ZW1wUHJldmlldywgZGF0YS5taW1lKTtcbiAgICAgIGNvbnN0IHByZXZpZXdVcmwgPSBiYXNlNjR0b09iamVjdFVybChkYXRhLnZhbCwgZGF0YS5taW1lLCBEcmFmdHkubG9nZ2VyKTtcbiAgICAgIGNvbnN0IGRvd25sb2FkVXJsID0gZGF0YS5yZWYgfHwgcHJldmlld1VybDtcbiAgICAgIHJldHVybiAoZGF0YS5uYW1lID8gJzxhIGhyZWY9XCInICsgZG93bmxvYWRVcmwgKyAnXCIgZG93bmxvYWQ9XCInICsgZGF0YS5uYW1lICsgJ1wiPicgOiAnJykgK1xuICAgICAgICAnPGltZyBzcmM9XCInICsgKHRtcFByZXZpZXdVcmwgfHwgcHJldmlld1VybCkgKyAnXCInICtcbiAgICAgICAgKGRhdGEud2lkdGggPyAnIHdpZHRoPVwiJyArIGRhdGEud2lkdGggKyAnXCInIDogJycpICtcbiAgICAgICAgKGRhdGEuaGVpZ2h0ID8gJyBoZWlnaHQ9XCInICsgZGF0YS5oZWlnaHQgKyAnXCInIDogJycpICsgJyBib3JkZXI9XCIwXCIgLz4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAoZGF0YS5uYW1lID8gJzwvYT4nIDogJycpO1xuICAgIH0sXG4gICAgcHJvcHM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGlmICghZGF0YSkgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAvLyBUZW1wb3JhcnkgcHJldmlldywgb3IgcGVybWFuZW50IHByZXZpZXcsIG9yIGV4dGVybmFsIGxpbmsuXG4gICAgICAgIHNyYzogYmFzZTY0dG9EYXRhVXJsKGRhdGEuX3RlbXBQcmV2aWV3LCBkYXRhLm1pbWUpIHx8XG4gICAgICAgICAgZGF0YS5yZWYgfHwgYmFzZTY0dG9PYmplY3RVcmwoZGF0YS52YWwsIGRhdGEubWltZSwgRHJhZnR5LmxvZ2dlciksXG4gICAgICAgIHRpdGxlOiBkYXRhLm5hbWUsXG4gICAgICAgICdkYXRhLXdpZHRoJzogZGF0YS53aWR0aCxcbiAgICAgICAgJ2RhdGEtaGVpZ2h0JzogZGF0YS5oZWlnaHQsXG4gICAgICAgICdkYXRhLW5hbWUnOiBkYXRhLm5hbWUsXG4gICAgICAgICdkYXRhLXNpemUnOiBkYXRhLnZhbCA/ICgoZGF0YS52YWwubGVuZ3RoICogMC43NSkgfCAwKSA6IChkYXRhLnNpemUgfCAwKSxcbiAgICAgICAgJ2RhdGEtbWltZSc6IGRhdGEubWltZVxuICAgICAgfTtcbiAgICB9LFxuICB9LFxuICAvLyBGb3JtIC0gc3RydWN0dXJlZCBsYXlvdXQgb2YgZWxlbWVudHMuXG4gIEZNOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8ZGl2Pic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8L2Rpdj4nO1xuICAgIH1cbiAgfSxcbiAgLy8gUm93OiBsb2dpYyBncm91cGluZyBvZiBlbGVtZW50c1xuICBSVzoge1xuICAgIG9wZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPGRpdj4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPC9kaXY+JztcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogVGhlIG1haW4gb2JqZWN0IHdoaWNoIHBlcmZvcm1zIGFsbCB0aGUgZm9ybWF0dGluZyBhY3Rpb25zLlxuICogQGNsYXNzIERyYWZ0eVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmNvbnN0IERyYWZ0eSA9IGZ1bmN0aW9uKCkge31cblxuLy8gVGFrZSBhIHN0cmluZyBhbmQgZGVmaW5lZCBlYXJsaWVyIHN0eWxlIHNwYW5zLCByZS1jb21wb3NlIHRoZW0gaW50byBhIHRyZWUgd2hlcmUgZWFjaCBsZWFmIGlzXG4vLyBhIHNhbWUtc3R5bGUgKGluY2x1ZGluZyB1bnN0eWxlZCkgc3RyaW5nLiBJLmUuICdoZWxsbyAqYm9sZCBfaXRhbGljXyogYW5kIH5tb3JlfiB3b3JsZCcgLT5cbi8vICgnaGVsbG8gJywgKGI6ICdib2xkICcsIChpOiAnaXRhbGljJykpLCAnIGFuZCAnLCAoczogJ21vcmUnKSwgJyB3b3JsZCcpO1xuLy9cbi8vIFRoaXMgaXMgbmVlZGVkIGluIG9yZGVyIHRvIGNsZWFyIG1hcmt1cCwgaS5lLiAnaGVsbG8gKndvcmxkKicgLT4gJ2hlbGxvIHdvcmxkJyBhbmQgY29udmVydFxuLy8gcmFuZ2VzIGZyb20gbWFya3VwLWVkIG9mZnNldHMgdG8gcGxhaW4gdGV4dCBvZmZzZXRzLlxuZnVuY3Rpb24gY2h1bmtpZnkobGluZSwgc3RhcnQsIGVuZCwgc3BhbnMpIHtcbiAgY29uc3QgY2h1bmtzID0gW107XG5cbiAgaWYgKHNwYW5zLmxlbmd0aCA9PSAwKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZm9yIChsZXQgaSBpbiBzcGFucykge1xuICAgIC8vIEdldCB0aGUgbmV4dCBjaHVuayBmcm9tIHRoZSBxdWV1ZVxuICAgIGNvbnN0IHNwYW4gPSBzcGFuc1tpXTtcblxuICAgIC8vIEdyYWIgdGhlIGluaXRpYWwgdW5zdHlsZWQgY2h1bmtcbiAgICBpZiAoc3Bhbi5zdGFydCA+IHN0YXJ0KSB7XG4gICAgICBjaHVua3MucHVzaCh7XG4gICAgICAgIHRleHQ6IGxpbmUuc2xpY2Uoc3RhcnQsIHNwYW4uc3RhcnQpXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBHcmFiIHRoZSBzdHlsZWQgY2h1bmsuIEl0IG1heSBpbmNsdWRlIHN1YmNodW5rcy5cbiAgICBjb25zdCBjaHVuayA9IHtcbiAgICAgIHR5cGU6IHNwYW4udHlwZVxuICAgIH07XG4gICAgY29uc3QgY2hsZCA9IGNodW5raWZ5KGxpbmUsIHNwYW4uc3RhcnQgKyAxLCBzcGFuLmVuZCwgc3Bhbi5jaGlsZHJlbik7XG4gICAgaWYgKGNobGQubGVuZ3RoID4gMCkge1xuICAgICAgY2h1bmsuY2hpbGRyZW4gPSBjaGxkO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaHVuay50ZXh0ID0gc3Bhbi50ZXh0O1xuICAgIH1cbiAgICBjaHVua3MucHVzaChjaHVuayk7XG4gICAgc3RhcnQgPSBzcGFuLmVuZCArIDE7IC8vICcrMScgaXMgdG8gc2tpcCB0aGUgZm9ybWF0dGluZyBjaGFyYWN0ZXJcbiAgfVxuXG4gIC8vIEdyYWIgdGhlIHJlbWFpbmluZyB1bnN0eWxlZCBjaHVuaywgYWZ0ZXIgdGhlIGxhc3Qgc3BhblxuICBpZiAoc3RhcnQgPCBlbmQpIHtcbiAgICBjaHVua3MucHVzaCh7XG4gICAgICB0ZXh0OiBsaW5lLnNsaWNlKHN0YXJ0LCBlbmQpXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gY2h1bmtzO1xufVxuXG4vLyBJbnZlcnNlIG9mIGNodW5raWZ5LiBSZXR1cm5zIGEgdHJlZSBvZiBmb3JtYXR0ZWQgc3BhbnMuXG5mdW5jdGlvbiBmb3JFYWNoKGxpbmUsIHN0YXJ0LCBlbmQsIHNwYW5zLCBmb3JtYXR0ZXIsIGNvbnRleHQpIHtcbiAgY29uc3QgcmVzdWx0ID0gW107XG5cbiAgLy8gUHJvY2VzcyByYW5nZXMgY2FsbGluZyBmb3JtYXR0ZXIgZm9yIGVhY2ggcmFuZ2UuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3BhbnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBzcGFuID0gc3BhbnNbaV07XG4gICAgaWYgKHNwYW4uYXQgPCAwKSB7XG4gICAgICAvLyBBc2sgZm9ybWF0dGVyIGlmIGl0IHdhbnRzIHRvIGRvIGFueXRoaW5nIHdpdGggdGhlIG5vbi12aXN1YWwgc3Bhbi5cbiAgICAgIGNvbnN0IHMgPSBmb3JtYXR0ZXIuY2FsbChjb250ZXh0LCBzcGFuLnRwLCBzcGFuLmRhdGEsIHVuZGVmaW5lZCwgcmVzdWx0Lmxlbmd0aCk7XG4gICAgICBpZiAocykge1xuICAgICAgICByZXN1bHQucHVzaChzKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICAvLyBBZGQgdW4tc3R5bGVkIHJhbmdlIGJlZm9yZSB0aGUgc3R5bGVkIHNwYW4gc3RhcnRzLlxuICAgIGlmIChzdGFydCA8IHNwYW4uYXQpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGZvcm1hdHRlci5jYWxsKGNvbnRleHQsIG51bGwsIHVuZGVmaW5lZCwgbGluZS5zbGljZShzdGFydCwgc3Bhbi5hdCksIHJlc3VsdC5sZW5ndGgpKTtcbiAgICAgIHN0YXJ0ID0gc3Bhbi5hdDtcbiAgICB9XG4gICAgLy8gR2V0IGFsbCBzcGFucyB3aGljaCBhcmUgd2l0aGluIGN1cnJlbnQgc3Bhbi5cbiAgICBjb25zdCBzdWJzcGFucyA9IFtdO1xuICAgIGZvciAobGV0IHNpID0gaSArIDE7IHNpIDwgc3BhbnMubGVuZ3RoICYmIHNwYW5zW3NpXS5hdCA8IHNwYW4uYXQgKyBzcGFuLmxlbjsgc2krKykge1xuICAgICAgc3Vic3BhbnMucHVzaChzcGFuc1tzaV0pO1xuICAgICAgaSA9IHNpO1xuICAgIH1cblxuICAgIGNvbnN0IHRhZyA9IEhUTUxfVEFHU1tzcGFuLnRwXSB8fCB7fVxuICAgIHJlc3VsdC5wdXNoKGZvcm1hdHRlci5jYWxsKGNvbnRleHQsIHNwYW4udHAsIHNwYW4uZGF0YSxcbiAgICAgIHRhZy5pc1ZvaWQgPyBudWxsIDogZm9yRWFjaChsaW5lLCBzdGFydCwgc3Bhbi5hdCArIHNwYW4ubGVuLCBzdWJzcGFucywgZm9ybWF0dGVyLCBjb250ZXh0KSxcbiAgICAgIHJlc3VsdC5sZW5ndGgpKTtcblxuICAgIHN0YXJ0ID0gc3Bhbi5hdCArIHNwYW4ubGVuO1xuICB9XG5cbiAgLy8gQWRkIHRoZSBsYXN0IHVuZm9ybWF0dGVkIHJhbmdlLlxuICBpZiAoc3RhcnQgPCBlbmQpIHtcbiAgICByZXN1bHQucHVzaChmb3JtYXR0ZXIuY2FsbChjb250ZXh0LCBudWxsLCB1bmRlZmluZWQsIGxpbmUuc2xpY2Uoc3RhcnQsIGVuZCksIHJlc3VsdC5sZW5ndGgpKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIERldGVjdCBzdGFydHMgYW5kIGVuZHMgb2YgZm9ybWF0dGluZyBzcGFucy4gVW5mb3JtYXR0ZWQgc3BhbnMgYXJlXG4vLyBpZ25vcmVkIGF0IHRoaXMgc3RhZ2UuXG5mdW5jdGlvbiBzcGFubmlmeShvcmlnaW5hbCwgcmVfc3RhcnQsIHJlX2VuZCwgdHlwZSkge1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IGxpbmUgPSBvcmlnaW5hbC5zbGljZSgwKTsgLy8gbWFrZSBhIGNvcHk7XG5cbiAgd2hpbGUgKGxpbmUubGVuZ3RoID4gMCkge1xuICAgIC8vIG1hdGNoWzBdOyAvLyBtYXRjaCwgbGlrZSAnKmFiYyonXG4gICAgLy8gbWF0Y2hbMV07IC8vIG1hdGNoIGNhcHR1cmVkIGluIHBhcmVudGhlc2lzLCBsaWtlICdhYmMnXG4gICAgLy8gbWF0Y2hbJ2luZGV4J107IC8vIG9mZnNldCB3aGVyZSB0aGUgbWF0Y2ggc3RhcnRlZC5cblxuICAgIC8vIEZpbmQgdGhlIG9wZW5pbmcgdG9rZW4uXG4gICAgY29uc3Qgc3RhcnQgPSByZV9zdGFydC5leGVjKGxpbmUpO1xuICAgIGlmIChzdGFydCA9PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBCZWNhdXNlIGphdmFzY3JpcHQgUmVnRXhwIGRvZXMgbm90IHN1cHBvcnQgbG9va2JlaGluZCwgdGhlIGFjdHVhbCBvZmZzZXQgbWF5IG5vdCBwb2ludFxuICAgIC8vIGF0IHRoZSBtYXJrdXAgY2hhcmFjdGVyLiBGaW5kIGl0IGluIHRoZSBtYXRjaGVkIHN0cmluZy5cbiAgICBsZXQgc3RhcnRfb2Zmc2V0ID0gc3RhcnRbJ2luZGV4J10gKyBzdGFydFswXS5sYXN0SW5kZXhPZihzdGFydFsxXSk7XG4gICAgLy8gQ2xpcCB0aGUgcHJvY2Vzc2VkIHBhcnQgb2YgdGhlIHN0cmluZy5cbiAgICBsaW5lID0gbGluZS5zbGljZShzdGFydF9vZmZzZXQgKyAxKTtcbiAgICAvLyBzdGFydF9vZmZzZXQgaXMgYW4gb2Zmc2V0IHdpdGhpbiB0aGUgY2xpcHBlZCBzdHJpbmcuIENvbnZlcnQgdG8gb3JpZ2luYWwgaW5kZXguXG4gICAgc3RhcnRfb2Zmc2V0ICs9IGluZGV4O1xuICAgIC8vIEluZGV4IG5vdyBwb2ludCB0byB0aGUgYmVnaW5uaW5nIG9mICdsaW5lJyB3aXRoaW4gdGhlICdvcmlnaW5hbCcgc3RyaW5nLlxuICAgIGluZGV4ID0gc3RhcnRfb2Zmc2V0ICsgMTtcblxuICAgIC8vIEZpbmQgdGhlIG1hdGNoaW5nIGNsb3NpbmcgdG9rZW4uXG4gICAgY29uc3QgZW5kID0gcmVfZW5kID8gcmVfZW5kLmV4ZWMobGluZSkgOiBudWxsO1xuICAgIGlmIChlbmQgPT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGxldCBlbmRfb2Zmc2V0ID0gZW5kWydpbmRleCddICsgZW5kWzBdLmluZGV4T2YoZW5kWzFdKTtcbiAgICAvLyBDbGlwIHRoZSBwcm9jZXNzZWQgcGFydCBvZiB0aGUgc3RyaW5nLlxuICAgIGxpbmUgPSBsaW5lLnNsaWNlKGVuZF9vZmZzZXQgKyAxKTtcbiAgICAvLyBVcGRhdGUgb2Zmc2V0c1xuICAgIGVuZF9vZmZzZXQgKz0gaW5kZXg7XG4gICAgLy8gSW5kZXggbm93IHBvaW50IHRvIHRoZSBiZWdpbm5pbmcgb2YgJ2xpbmUnIHdpdGhpbiB0aGUgJ29yaWdpbmFsJyBzdHJpbmcuXG4gICAgaW5kZXggPSBlbmRfb2Zmc2V0ICsgMTtcblxuICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgIHRleHQ6IG9yaWdpbmFsLnNsaWNlKHN0YXJ0X29mZnNldCArIDEsIGVuZF9vZmZzZXQpLFxuICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgc3RhcnQ6IHN0YXJ0X29mZnNldCxcbiAgICAgIGVuZDogZW5kX29mZnNldCxcbiAgICAgIHR5cGU6IHR5cGVcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIENvbnZlcnQgbGluZWFyIGFycmF5IG9yIHNwYW5zIGludG8gYSB0cmVlIHJlcHJlc2VudGF0aW9uLlxuLy8gS2VlcCBzdGFuZGFsb25lIGFuZCBuZXN0ZWQgc3BhbnMsIHRocm93IGF3YXkgcGFydGlhbGx5IG92ZXJsYXBwaW5nIHNwYW5zLlxuZnVuY3Rpb24gdG9UcmVlKHNwYW5zKSB7XG4gIGlmIChzcGFucy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IHRyZWUgPSBbc3BhbnNbMF1dO1xuICBsZXQgbGFzdCA9IHNwYW5zWzBdO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHNwYW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gS2VlcCBzcGFucyB3aGljaCBzdGFydCBhZnRlciB0aGUgZW5kIG9mIHRoZSBwcmV2aW91cyBzcGFuIG9yIHRob3NlIHdoaWNoXG4gICAgLy8gYXJlIGNvbXBsZXRlIHdpdGhpbiB0aGUgcHJldmlvdXMgc3Bhbi5cblxuICAgIGlmIChzcGFuc1tpXS5zdGFydCA+IGxhc3QuZW5kKSB7XG4gICAgICAvLyBTcGFuIGlzIGNvbXBsZXRlbHkgb3V0c2lkZSBvZiB0aGUgcHJldmlvdXMgc3Bhbi5cbiAgICAgIHRyZWUucHVzaChzcGFuc1tpXSk7XG4gICAgICBsYXN0ID0gc3BhbnNbaV07XG4gICAgfSBlbHNlIGlmIChzcGFuc1tpXS5lbmQgPCBsYXN0LmVuZCkge1xuICAgICAgLy8gU3BhbiBpcyBmdWxseSBpbnNpZGUgb2YgdGhlIHByZXZpb3VzIHNwYW4uIFB1c2ggdG8gc3Vibm9kZS5cbiAgICAgIGxhc3QuY2hpbGRyZW4ucHVzaChzcGFuc1tpXSk7XG4gICAgfVxuICAgIC8vIFNwYW4gY291bGQgcGFydGlhbGx5IG92ZXJsYXAsIGlnbm9yaW5nIGl0IGFzIGludmFsaWQuXG4gIH1cblxuICAvLyBSZWN1cnNpdmVseSByZWFycmFuZ2UgdGhlIHN1Ym5vZGVzLlxuICBmb3IgKGxldCBpIGluIHRyZWUpIHtcbiAgICB0cmVlW2ldLmNoaWxkcmVuID0gdG9UcmVlKHRyZWVbaV0uY2hpbGRyZW4pO1xuICB9XG5cbiAgcmV0dXJuIHRyZWU7XG59XG5cbi8vIEdldCBhIGxpc3Qgb2YgZW50aXRpZXMgZnJvbSBhIHRleHQuXG5mdW5jdGlvbiBleHRyYWN0RW50aXRpZXMobGluZSkge1xuICBsZXQgbWF0Y2g7XG4gIGxldCBleHRyYWN0ZWQgPSBbXTtcbiAgRU5USVRZX1RZUEVTLm1hcChmdW5jdGlvbihlbnRpdHkpIHtcbiAgICB3aGlsZSAoKG1hdGNoID0gZW50aXR5LnJlLmV4ZWMobGluZSkpICE9PSBudWxsKSB7XG4gICAgICBleHRyYWN0ZWQucHVzaCh7XG4gICAgICAgIG9mZnNldDogbWF0Y2hbJ2luZGV4J10sXG4gICAgICAgIGxlbjogbWF0Y2hbMF0ubGVuZ3RoLFxuICAgICAgICB1bmlxdWU6IG1hdGNoWzBdLFxuICAgICAgICBkYXRhOiBlbnRpdHkucGFjayhtYXRjaFswXSksXG4gICAgICAgIHR5cGU6IGVudGl0eS5uYW1lXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChleHRyYWN0ZWQubGVuZ3RoID09IDApIHtcbiAgICByZXR1cm4gZXh0cmFjdGVkO1xuICB9XG5cbiAgLy8gUmVtb3ZlIGVudGl0aWVzIGRldGVjdGVkIGluc2lkZSBvdGhlciBlbnRpdGllcywgbGlrZSAjaGFzaHRhZyBpbiBhIFVSTC5cbiAgZXh0cmFjdGVkLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhLm9mZnNldCAtIGIub2Zmc2V0O1xuICB9KTtcblxuICBsZXQgaWR4ID0gLTE7XG4gIGV4dHJhY3RlZCA9IGV4dHJhY3RlZC5maWx0ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBjb25zdCByZXN1bHQgPSAoZWwub2Zmc2V0ID4gaWR4KTtcbiAgICBpZHggPSBlbC5vZmZzZXQgKyBlbC5sZW47XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG5cbiAgcmV0dXJuIGV4dHJhY3RlZDtcbn1cblxuLy8gQ29udmVydCB0aGUgY2h1bmtzIGludG8gZm9ybWF0IHN1aXRhYmxlIGZvciBzZXJpYWxpemF0aW9uLlxuZnVuY3Rpb24gZHJhZnRpZnkoY2h1bmtzLCBzdGFydEF0KSB7XG4gIGxldCBwbGFpbiA9IFwiXCI7XG4gIGxldCByYW5nZXMgPSBbXTtcbiAgZm9yIChsZXQgaSBpbiBjaHVua3MpIHtcbiAgICBjb25zdCBjaHVuayA9IGNodW5rc1tpXTtcbiAgICBpZiAoIWNodW5rLnRleHQpIHtcbiAgICAgIGNvbnN0IGRyYWZ0eSA9IGRyYWZ0aWZ5KGNodW5rLmNoaWxkcmVuLCBwbGFpbi5sZW5ndGggKyBzdGFydEF0KTtcbiAgICAgIGNodW5rLnRleHQgPSBkcmFmdHkudHh0O1xuICAgICAgcmFuZ2VzID0gcmFuZ2VzLmNvbmNhdChkcmFmdHkuZm10KTtcbiAgICB9XG5cbiAgICBpZiAoY2h1bmsudHlwZSkge1xuICAgICAgcmFuZ2VzLnB1c2goe1xuICAgICAgICBhdDogcGxhaW4ubGVuZ3RoICsgc3RhcnRBdCxcbiAgICAgICAgbGVuOiBjaHVuay50ZXh0Lmxlbmd0aCxcbiAgICAgICAgdHA6IGNodW5rLnR5cGVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHBsYWluICs9IGNodW5rLnRleHQ7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0eHQ6IHBsYWluLFxuICAgIGZtdDogcmFuZ2VzXG4gIH07XG59XG5cbi8vIFNwbGljZSB0d28gc3RyaW5nczogaW5zZXJ0IHNlY29uZCBzdHJpbmcgaW50byB0aGUgZmlyc3Qgb25lIGF0IHRoZSBnaXZlbiBpbmRleFxuZnVuY3Rpb24gc3BsaWNlKHNyYywgYXQsIGluc2VydCkge1xuICByZXR1cm4gc3JjLnNsaWNlKDAsIGF0KSArIGluc2VydCArIHNyYy5zbGljZShhdCk7XG59XG5cbi8qKlxuICogUGFyc2UgcGxhaW4gdGV4dCBpbnRvIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gY29udGVudCAtIHBsYWluLXRleHQgY29udGVudCB0byBwYXJzZS5cbiAqIEByZXR1cm4ge0RyYWZ0eX0gcGFyc2VkIGRvY3VtZW50IG9yIG51bGwgaWYgdGhlIHNvdXJjZSBpcyBub3QgcGxhaW4gdGV4dC5cbiAqL1xuRHJhZnR5LnBhcnNlID0gZnVuY3Rpb24oY29udGVudCkge1xuICAvLyBNYWtlIHN1cmUgd2UgYXJlIHBhcnNpbmcgc3RyaW5ncyBvbmx5LlxuICBpZiAodHlwZW9mIGNvbnRlbnQgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFNwbGl0IHRleHQgaW50byBsaW5lcy4gSXQgbWFrZXMgZnVydGhlciBwcm9jZXNzaW5nIGVhc2llci5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgLy8gSG9sZHMgZW50aXRpZXMgcmVmZXJlbmNlZCBmcm9tIHRleHRcbiAgY29uc3QgZW50aXR5TWFwID0gW107XG4gIGNvbnN0IGVudGl0eUluZGV4ID0ge307XG5cbiAgLy8gUHJvY2Vzc2luZyBsaW5lcyBvbmUgYnkgb25lLCBob2xkIGludGVybWVkaWF0ZSByZXN1bHQgaW4gYmx4LlxuICBjb25zdCBibHggPSBbXTtcbiAgbGluZXMubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICBsZXQgc3BhbnMgPSBbXTtcbiAgICBsZXQgZW50aXRpZXM7XG5cbiAgICAvLyBGaW5kIGZvcm1hdHRlZCBzcGFucyBpbiB0aGUgc3RyaW5nLlxuICAgIC8vIFRyeSB0byBtYXRjaCBlYWNoIHN0eWxlLlxuICAgIElOTElORV9TVFlMRVMubWFwKGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgICAvLyBFYWNoIHN0eWxlIGNvdWxkIGJlIG1hdGNoZWQgbXVsdGlwbGUgdGltZXMuXG4gICAgICBzcGFucyA9IHNwYW5zLmNvbmNhdChzcGFubmlmeShsaW5lLCBzdHlsZS5zdGFydCwgc3R5bGUuZW5kLCBzdHlsZS5uYW1lKSk7XG4gICAgfSk7XG5cbiAgICBsZXQgYmxvY2s7XG4gICAgaWYgKHNwYW5zLmxlbmd0aCA9PSAwKSB7XG4gICAgICBibG9jayA9IHtcbiAgICAgICAgdHh0OiBsaW5lXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTb3J0IHNwYW5zIGJ5IHN0eWxlIG9jY3VyZW5jZSBlYXJseSAtPiBsYXRlXG4gICAgICBzcGFucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEuc3RhcnQgLSBiLnN0YXJ0O1xuICAgICAgfSk7XG5cbiAgICAgIC8vIENvbnZlcnQgYW4gYXJyYXkgb2YgcG9zc2libHkgb3ZlcmxhcHBpbmcgc3BhbnMgaW50byBhIHRyZWVcbiAgICAgIHNwYW5zID0gdG9UcmVlKHNwYW5zKTtcblxuICAgICAgLy8gQnVpbGQgYSB0cmVlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBlbnRpcmUgc3RyaW5nLCBub3RcbiAgICAgIC8vIGp1c3QgdGhlIGZvcm1hdHRlZCBwYXJ0cy5cbiAgICAgIGNvbnN0IGNodW5rcyA9IGNodW5raWZ5KGxpbmUsIDAsIGxpbmUubGVuZ3RoLCBzcGFucyk7XG5cbiAgICAgIGNvbnN0IGRyYWZ0eSA9IGRyYWZ0aWZ5KGNodW5rcywgMCk7XG5cbiAgICAgIGJsb2NrID0ge1xuICAgICAgICB0eHQ6IGRyYWZ0eS50eHQsXG4gICAgICAgIGZtdDogZHJhZnR5LmZtdFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBFeHRyYWN0IGVudGl0aWVzIGZyb20gdGhlIGNsZWFuZWQgdXAgc3RyaW5nLlxuICAgIGVudGl0aWVzID0gZXh0cmFjdEVudGl0aWVzKGJsb2NrLnR4dCk7XG4gICAgaWYgKGVudGl0aWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHJhbmdlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSBpbiBlbnRpdGllcykge1xuICAgICAgICAvLyB7b2Zmc2V0OiBtYXRjaFsnaW5kZXgnXSwgdW5pcXVlOiBtYXRjaFswXSwgbGVuOiBtYXRjaFswXS5sZW5ndGgsIGRhdGE6IGVudC5wYWNrZXIoKSwgdHlwZTogZW50Lm5hbWV9XG4gICAgICAgIGNvbnN0IGVudGl0eSA9IGVudGl0aWVzW2ldO1xuICAgICAgICBsZXQgaW5kZXggPSBlbnRpdHlJbmRleFtlbnRpdHkudW5pcXVlXTtcbiAgICAgICAgaWYgKCFpbmRleCkge1xuICAgICAgICAgIGluZGV4ID0gZW50aXR5TWFwLmxlbmd0aDtcbiAgICAgICAgICBlbnRpdHlJbmRleFtlbnRpdHkudW5pcXVlXSA9IGluZGV4O1xuICAgICAgICAgIGVudGl0eU1hcC5wdXNoKHtcbiAgICAgICAgICAgIHRwOiBlbnRpdHkudHlwZSxcbiAgICAgICAgICAgIGRhdGE6IGVudGl0eS5kYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmFuZ2VzLnB1c2goe1xuICAgICAgICAgIGF0OiBlbnRpdHkub2Zmc2V0LFxuICAgICAgICAgIGxlbjogZW50aXR5LmxlbixcbiAgICAgICAgICBrZXk6IGluZGV4XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgYmxvY2suZW50ID0gcmFuZ2VzO1xuICAgIH1cblxuICAgIGJseC5wdXNoKGJsb2NrKTtcbiAgfSk7XG5cbiAgY29uc3QgcmVzdWx0ID0ge1xuICAgIHR4dDogXCJcIlxuICB9O1xuXG4gIC8vIE1lcmdlIGxpbmVzIGFuZCBzYXZlIGxpbmUgYnJlYWtzIGFzIEJSIGlubGluZSBmb3JtYXR0aW5nLlxuICBpZiAoYmx4Lmxlbmd0aCA+IDApIHtcbiAgICByZXN1bHQudHh0ID0gYmx4WzBdLnR4dDtcbiAgICByZXN1bHQuZm10ID0gKGJseFswXS5mbXQgfHwgW10pLmNvbmNhdChibHhbMF0uZW50IHx8IFtdKTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYmx4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBibG9jayA9IGJseFtpXTtcbiAgICAgIGNvbnN0IG9mZnNldCA9IHJlc3VsdC50eHQubGVuZ3RoICsgMTtcblxuICAgICAgcmVzdWx0LmZtdC5wdXNoKHtcbiAgICAgICAgdHA6ICdCUicsXG4gICAgICAgIGxlbjogMSxcbiAgICAgICAgYXQ6IG9mZnNldCAtIDFcbiAgICAgIH0pO1xuXG4gICAgICByZXN1bHQudHh0ICs9IFwiIFwiICsgYmxvY2sudHh0O1xuICAgICAgaWYgKGJsb2NrLmZtdCkge1xuICAgICAgICByZXN1bHQuZm10ID0gcmVzdWx0LmZtdC5jb25jYXQoYmxvY2suZm10Lm1hcChmdW5jdGlvbihzKSB7XG4gICAgICAgICAgcy5hdCArPSBvZmZzZXQ7XG4gICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIGlmIChibG9jay5lbnQpIHtcbiAgICAgICAgcmVzdWx0LmZtdCA9IHJlc3VsdC5mbXQuY29uY2F0KGJsb2NrLmVudC5tYXAoZnVuY3Rpb24ocykge1xuICAgICAgICAgIHMuYXQgKz0gb2Zmc2V0O1xuICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC5mbXQubGVuZ3RoID09IDApIHtcbiAgICAgIGRlbGV0ZSByZXN1bHQuZm10O1xuICAgIH1cblxuICAgIGlmIChlbnRpdHlNYXAubGVuZ3RoID4gMCkge1xuICAgICAgcmVzdWx0LmVudCA9IGVudGl0eU1hcDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIERyYWZ0eSBkb2N1bWVudCB0byBhIHBsYWluIHRleHQgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwbGFpblRleHQgLSBzdHJpbmcgdG8gdXNlIGFzIERyYWZ0eSBjb250ZW50LlxuICpcbiAqIEByZXR1cm5zIG5ldyBEcmFmdHkgZG9jdW1lbnQgb3IgbnVsbCBpcyBwbGFpblRleHQgaXMgbm90IGEgc3RyaW5nLlxuICovXG5EcmFmdHkuaW5pdCA9IGZ1bmN0aW9uKHBsYWluVGV4dCkge1xuICBpZiAodHlwZW9mIHBsYWluVGV4dCAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB7XG4gICAgdHh0OiBwbGFpblRleHRcbiAgfTtcbn1cblxuLyoqXG4gKiBBcHBlbmQgb25lIERyYWZ0eSBkb2N1bWVudCB0byBhbm90aGVyLlxuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBmaXJzdCAtIERyYWZ0eSBkb2N1bWVudCB0byBhcHBlbmQgdG8uXG4gKiBAcGFyYW0ge0RyYWZ0eX0gc2Vjb25kIC0gRHJhZnR5IGRvY3VtZW50IGJlaW5nIGFwcGVuZGVkLlxuICpcbiAqIEByZXR1cm4ge0RyYWZ0eX0gZmlyc3QgZG9jdW1lbnQgd2l0aCB0aGUgc2Vjb25kIGFwcGVuZGVkIHRvIGl0LlxuICovXG5EcmFmdHkuYXBwZW5kID0gZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xuICBpZiAoZmlyc3QgPT0gbnVsbCkge1xuICAgIHJldHVybiBzZWNvbmQ7XG4gIH1cbiAgaWYgKHNlY29uZCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZpcnN0O1xuICB9XG5cbiAgZmlyc3QudHh0ID0gZmlyc3QudHh0IHx8ICcnO1xuICBzZWNvbmQudHh0ID0gc2Vjb25kLnR4dCB8fCAnJztcbiAgY29uc3QgbGVuID0gZmlyc3QudHh0Lmxlbmd0aDtcblxuICBmaXJzdC50eHQgKz0gc2Vjb25kLnR4dDtcbiAgaWYgKEFycmF5LmlzQXJyYXkoc2Vjb25kLmZtdCkpIHtcbiAgICBmaXJzdC5mbXQgPSBmaXJzdC5mbXQgfHwgW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2Vjb25kLmVudCkpIHtcbiAgICAgIGZpcnN0LmVudCA9IGZpcnN0LmVudCB8fCBbXTtcbiAgICB9XG4gICAgc2Vjb25kLmZtdC5mb3JFYWNoKHNyYyA9PiB7XG4gICAgICBjb25zdCBmbXQgPSB7XG4gICAgICAgIGF0OiBzcmMuYXQgKyBsZW4sXG4gICAgICAgIGxlbjogc3JjLmxlblxuICAgICAgfTtcbiAgICAgIGlmIChzcmMudHApIHtcbiAgICAgICAgZm10LnRwID0gc3JjLnRwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm10LmtleSA9IGZpcnN0LmVudC5sZW5ndGg7XG4gICAgICAgIGZpcnN0LmVudC5wdXNoKHNlY29uZC5lbnRbc3JjLmtleSB8fCAwXSk7XG4gICAgICB9XG4gICAgICBmaXJzdC5mbXQucHVzaChmbXQpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGZpcnN0O1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIERyYWZ0eS5JbWFnZURlc2NcbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEB0eXBlIE9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IG1pbWUgLSBtaW1lLXR5cGUgb2YgdGhlIGltYWdlLCBlLmcuIFwiaW1hZ2UvcG5nXCJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmV2aWV3IC0gYmFzZTY0LWVuY29kZWQgaW1hZ2UgY29udGVudCAob3IgcHJldmlldywgaWYgbGFyZ2UgaW1hZ2UgaXMgYXR0YWNoZWQpLiBDb3VsZCBiZSBudWxsL3VuZGVmaW5lZC5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gd2lkdGggLSB3aWR0aCBvZiB0aGUgaW1hZ2VcbiAqIEBwYXJhbSB7aW50ZWdlcn0gaGVpZ2h0IC0gaGVpZ2h0IG9mIHRoZSBpbWFnZVxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gZmlsZSBuYW1lIHN1Z2dlc3Rpb24gZm9yIGRvd25sb2FkaW5nIHRoZSBpbWFnZS5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gc2l6ZSAtIHNpemUgb2YgdGhlIGltYWdlIGluIGJ5dGVzLiBUcmVhdCBpcyBhcyBhbiB1bnRydXN0ZWQgaGludC5cbiAqIEBwYXJhbSB7c3RyaW5nfSByZWZ1cmwgLSByZWZlcmVuY2UgdG8gdGhlIGNvbnRlbnQuIENvdWxkIGJlIG51bGwvdW5kZWZpbmVkLlxuICogQHBhcmFtIHtzdHJpbmd9IF90ZW1wUHJldmlldyAtIGJhc2U2NC1lbmNvZGVkIGltYWdlIHByZXZpZXcgdXNlZCBkdXJpbmcgdXBsb2FkIHByb2Nlc3M7IG5vdCBzZXJpYWxpemFibGUuXG4gKiBAcGFyYW0ge1Byb21pc2V9IHVybFByb21pc2UgLSBQcm9taXNlIHdoaWNoIHJldHVybnMgY29udGVudCBVUkwgd2hlbiByZXNvbHZlZC5cbiAqL1xuXG4vKipcbiAqIEluc2VydCBpbmxpbmUgaW1hZ2UgaW50byBEcmFmdHkgZG9jdW1lbnQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBkb2N1bWVudCB0byBhZGQgaW1hZ2UgdG8uXG4gKiBAcGFyYW0ge2ludGVnZXJ9IGF0IC0gaW5kZXggd2hlcmUgdGhlIG9iamVjdCBpcyBpbnNlcnRlZC4gVGhlIGxlbmd0aCBvZiB0aGUgaW1hZ2UgaXMgYWx3YXlzIDEuXG4gKiBAcGFyYW0ge0ltYWdlRGVzY30gaW1hZ2VEZXNjIC0gb2JqZWN0IHdpdGggaW1hZ2UgcGFyYW1lbmV0cyBhbmQgZGF0YS5cbiAqXG4gKiBAcmV0dXJuIHtEcmFmdHl9IHVwZGF0ZWQgZG9jdW1lbnQuXG4gKi9cbkRyYWZ0eS5pbnNlcnRJbWFnZSA9IGZ1bmN0aW9uKGNvbnRlbnQsIGF0LCBpbWFnZURlc2MpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogXCIgXCJcbiAgfTtcbiAgY29udGVudC5lbnQgPSBjb250ZW50LmVudCB8fCBbXTtcbiAgY29udGVudC5mbXQgPSBjb250ZW50LmZtdCB8fCBbXTtcblxuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogYXQsXG4gICAgbGVuOiAxLFxuICAgIGtleTogY29udGVudC5lbnQubGVuZ3RoXG4gIH0pO1xuXG4gIGNvbnN0IGV4ID0ge1xuICAgIHRwOiAnSU0nLFxuICAgIGRhdGE6IHtcbiAgICAgIG1pbWU6IGltYWdlRGVzYy5taW1lLFxuICAgICAgdmFsOiBpbWFnZURlc2MucHJldmlldyxcbiAgICAgIHdpZHRoOiBpbWFnZURlc2Mud2lkdGgsXG4gICAgICBoZWlnaHQ6IGltYWdlRGVzYy5oZWlnaHQsXG4gICAgICBuYW1lOiBpbWFnZURlc2MuZmlsZW5hbWUsXG4gICAgICBzaXplOiBpbWFnZURlc2Muc2l6ZSB8IDAsXG4gICAgICByZWY6IGltYWdlRGVzYy5yZWZ1cmxcbiAgICB9XG4gIH07XG5cbiAgaWYgKGltYWdlRGVzYy51cmxQcm9taXNlKSB7XG4gICAgZXguZGF0YS5fdGVtcFByZXZpZXcgPSBpbWFnZURlc2MuX3RlbXBQcmV2aWV3O1xuICAgIGV4LmRhdGEuX3Byb2Nlc3NpbmcgPSB0cnVlO1xuICAgIGltYWdlRGVzYy51cmxQcm9taXNlLnRoZW4oXG4gICAgICAodXJsKSA9PiB7XG4gICAgICAgIGV4LmRhdGEucmVmID0gdXJsO1xuICAgICAgICBleC5kYXRhLl90ZW1wUHJldmlldyA9IHVuZGVmaW5lZDtcbiAgICAgICAgZXguZGF0YS5fcHJvY2Vzc2luZyA9IHVuZGVmaW5lZDtcbiAgICAgIH0sXG4gICAgICAoZXJyKSA9PiB7XG4gICAgICAgIC8qIGNhdGNoIHRoZSBlcnJvciwgb3RoZXJ3aXNlIGl0IHdpbGwgYXBwZWFyIGluIHRoZSBjb25zb2xlLiAqL1xuICAgICAgICBleC5kYXRhLl9wcm9jZXNzaW5nID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBjb250ZW50LmVudC5wdXNoKGV4KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBBcHBlbmQgaW5saW5lIGltYWdlIHRvIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGRvY3VtZW50IHRvIGFkZCBpbWFnZSB0by5cbiAqIEBwYXJhbSB7SW1hZ2VEZXNjfSBpbWFnZURlc2MgLSBvYmplY3Qgd2l0aCBpbWFnZSBwYXJhbWVuZXRzLlxuICpcbiAqIEByZXR1cm4ge0RyYWZ0eX0gdXBkYXRlZCBkb2N1bWVudC5cbiAqL1xuRHJhZnR5LmFwcGVuZEltYWdlID0gZnVuY3Rpb24oY29udGVudCwgaW1hZ2VEZXNjKSB7XG4gIGNvbnRlbnQgPSBjb250ZW50IHx8IHtcbiAgICB0eHQ6IFwiXCJcbiAgfTtcbiAgY29udGVudC50eHQgKz0gXCIgXCI7XG4gIHJldHVybiBEcmFmdHkuaW5zZXJ0SW1hZ2UoY29udGVudCwgY29udGVudC50eHQubGVuZ3RoIC0gMSwgaW1hZ2VEZXNjKTtcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiBEcmFmdHkuQXR0YWNobWVudERlc2NcbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEB0eXBlIE9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IG1pbWUgLSBtaW1lLXR5cGUgb2YgdGhlIGltYWdlLCBlLmcuIFwiaW1hZ2UvcG5nXCJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhIC0gYmFzZTY0LWVuY29kZWQgaW4tYmFuZCBjb250ZW50IG9mIHNtYWxsIGF0dGFjaG1lbnRzLiBDb3VsZCBiZSBudWxsL3VuZGVmaW5lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIGZpbGUgbmFtZSBzdWdnZXN0aW9uIGZvciBkb3dubG9hZGluZyB0aGUgYXR0YWNobWVudC5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gc2l6ZSAtIHNpemUgb2YgdGhlIGZpbGUgaW4gYnl0ZXMuIFRyZWF0IGlzIGFzIGFuIHVudHJ1c3RlZCBoaW50LlxuICogQHBhcmFtIHtzdHJpbmd9IHJlZnVybCAtIHJlZmVyZW5jZSB0byB0aGUgb3V0LW9mLWJhbmQgY29udGVudC4gQ291bGQgYmUgbnVsbC91bmRlZmluZWQuXG4gKiBAcGFyYW0ge1Byb21pc2V9IHVybFByb21pc2UgLSBQcm9taXNlIHdoaWNoIHJldHVybnMgY29udGVudCBVUkwgd2hlbiByZXNvbHZlZC5cbiAqL1xuXG4vKipcbiAqIEF0dGFjaCBmaWxlIHRvIERyYWZ0eSBjb250ZW50LiBFaXRoZXIgYXMgYSBibG9iIG9yIGFzIGEgcmVmZXJlbmNlLlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBjb250ZW50IC0gZG9jdW1lbnQgdG8gYXR0YWNoIGZpbGUgdG8uXG4gKiBAcGFyYW0ge0F0dGFjaG1lbnREZXNjfSBvYmplY3QgLSBjb250YWluaW5nIGF0dGFjaG1lbnQgZGVzY3JpcHRpb24gYW5kIGRhdGEuXG4gKlxuICogQHJldHVybiB7RHJhZnR5fSB1cGRhdGVkIGRvY3VtZW50LlxuICovXG5EcmFmdHkuYXR0YWNoRmlsZSA9IGZ1bmN0aW9uKGNvbnRlbnQsIGF0dGFjaG1lbnREZXNjKSB7XG4gIGNvbnRlbnQgPSBjb250ZW50IHx8IHtcbiAgICB0eHQ6IFwiXCJcbiAgfTtcbiAgY29udGVudC5lbnQgPSBjb250ZW50LmVudCB8fCBbXTtcbiAgY29udGVudC5mbXQgPSBjb250ZW50LmZtdCB8fCBbXTtcblxuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogLTEsXG4gICAgbGVuOiAwLFxuICAgIGtleTogY29udGVudC5lbnQubGVuZ3RoXG4gIH0pO1xuXG4gIGNvbnN0IGV4ID0ge1xuICAgIHRwOiAnRVgnLFxuICAgIGRhdGE6IHtcbiAgICAgIG1pbWU6IGF0dGFjaG1lbnREZXNjLm1pbWUsXG4gICAgICB2YWw6IGF0dGFjaG1lbnREZXNjLmRhdGEsXG4gICAgICBuYW1lOiBhdHRhY2htZW50RGVzYy5maWxlbmFtZSxcbiAgICAgIHJlZjogYXR0YWNobWVudERlc2MucmVmdXJsLFxuICAgICAgc2l6ZTogYXR0YWNobWVudERlc2Muc2l6ZSB8IDBcbiAgICB9XG4gIH1cbiAgaWYgKGF0dGFjaG1lbnREZXNjLnVybFByb21pc2UpIHtcbiAgICBleC5kYXRhLl9wcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICBhdHRhY2htZW50RGVzYy51cmxQcm9taXNlLnRoZW4oXG4gICAgICAodXJsKSA9PiB7XG4gICAgICAgIGV4LmRhdGEucmVmID0gdXJsO1xuICAgICAgICBleC5kYXRhLl9wcm9jZXNzaW5nID0gdW5kZWZpbmVkO1xuICAgICAgfSxcbiAgICAgIChlcnIpID0+IHtcbiAgICAgICAgLyogY2F0Y2ggdGhlIGVycm9yLCBvdGhlcndpc2UgaXQgd2lsbCBhcHBlYXIgaW4gdGhlIGNvbnNvbGUuICovXG4gICAgICAgIGV4LmRhdGEuX3Byb2Nlc3NpbmcgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICBjb250ZW50LmVudC5wdXNoKGV4KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBXcmFwcyBjb250ZW50IGludG8gYW4gaW50ZXJhY3RpdmUgZm9ybS5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eXxzdHJpbmd9IGNvbnRlbnQgLSB0byB3cmFwIGludG8gYSBmb3JtLlxuICogQHBhcmFtIHtudW1iZXJ9IGF0IC0gaW5kZXggd2hlcmUgdGhlIGZvcm1zIHN0YXJ0cy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gLSBsZW5ndGggb2YgdGhlIGZvcm0gY29udGVudC5cbiAqXG4gKiBAcmV0dXJuIHtEcmFmdHl9IHVwZGF0ZWQgZG9jdW1lbnQuXG4gKi9cbkRyYWZ0eS53cmFwQXNGb3JtID0gZnVuY3Rpb24oY29udGVudCwgYXQsIGxlbikge1xuICBpZiAodHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycpIHtcbiAgICBjb250ZW50ID0ge1xuICAgICAgdHh0OiBjb250ZW50XG4gICAgfTtcbiAgfVxuICBjb250ZW50LmZtdCA9IGNvbnRlbnQuZm10IHx8IFtdO1xuXG4gIGNvbnRlbnQuZm10LnB1c2goe1xuICAgIGF0OiBhdCxcbiAgICBsZW46IGxlbixcbiAgICB0cDogJ0ZNJ1xuICB9KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBJbnNlcnQgY2xpY2thYmxlIGJ1dHRvbiBpbnRvIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eXxzdHJpbmd9IGNvbnRlbnQgLSBEcmFmdHkgZG9jdW1lbnQgdG8gaW5zZXJ0IGJ1dHRvbiB0byBvciBhIHN0cmluZyB0byBiZSB1c2VkIGFzIGJ1dHRvbiB0ZXh0LlxuICogQHBhcmFtIHtudW1iZXJ9IGF0IC0gbG9jYXRpb24gd2hlcmUgdGhlIGJ1dHRvbiBpcyBpbnNlcnRlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gLSB0aGUgbGVuZ3RoIG9mIHRoZSB0ZXh0IHRvIGJlIHVzZWQgYXMgYnV0dG9uIHRpdGxlLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSB0aGUgYnV0dG9uLiBDbGllbnQgc2hvdWxkIHJldHVybiBpdCB0byB0aGUgc2VydmVyIHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkLlxuICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvblR5cGUgLSB0aGUgdHlwZSBvZiB0aGUgYnV0dG9uLCBvbmUgb2YgJ3VybCcgb3IgJ3B1YicuXG4gKiBAcGFyYW0ge3N0cmluZ30gYWN0aW9uVmFsdWUgLSB0aGUgdmFsdWUgdG8gcmV0dXJuIG9uIGNsaWNrOlxuICogQHBhcmFtIHtzdHJpbmd9IHJlZlVybCAtIHRoZSBVUkwgdG8gZ28gdG8gd2hlbiB0aGUgJ3VybCcgYnV0dG9uIGlzIGNsaWNrZWQuXG4gKlxuICogQHJldHVybiB7RHJhZnR5fSB1cGRhdGVkIGRvY3VtZW50LlxuICovXG5EcmFmdHkuaW5zZXJ0QnV0dG9uID0gZnVuY3Rpb24oY29udGVudCwgYXQsIGxlbiwgbmFtZSwgYWN0aW9uVHlwZSwgYWN0aW9uVmFsdWUsIHJlZlVybCkge1xuICBpZiAodHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycpIHtcbiAgICBjb250ZW50ID0ge1xuICAgICAgdHh0OiBjb250ZW50XG4gICAgfTtcbiAgfVxuXG4gIGlmICghY29udGVudCB8fCAhY29udGVudC50eHQgfHwgY29udGVudC50eHQubGVuZ3RoIDwgYXQgKyBsZW4pIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChsZW4gPD0gMCB8fCBbJ3VybCcsICdwdWInXS5pbmRleE9mKGFjdGlvblR5cGUpID09IC0xKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gRW5zdXJlIHJlZlVybCBpcyBhIHN0cmluZy5cbiAgaWYgKGFjdGlvblR5cGUgPT0gJ3VybCcgJiYgIXJlZlVybCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJlZlVybCA9ICcnICsgcmVmVXJsO1xuXG4gIGNvbnRlbnQuZW50ID0gY29udGVudC5lbnQgfHwgW107XG4gIGNvbnRlbnQuZm10ID0gY29udGVudC5mbXQgfHwgW107XG5cbiAgY29udGVudC5mbXQucHVzaCh7XG4gICAgYXQ6IGF0LFxuICAgIGxlbjogbGVuLFxuICAgIGtleTogY29udGVudC5lbnQubGVuZ3RoXG4gIH0pO1xuICBjb250ZW50LmVudC5wdXNoKHtcbiAgICB0cDogJ0JOJyxcbiAgICBkYXRhOiB7XG4gICAgICBhY3Q6IGFjdGlvblR5cGUsXG4gICAgICB2YWw6IGFjdGlvblZhbHVlLFxuICAgICAgcmVmOiByZWZVcmwsXG4gICAgICBuYW1lOiBuYW1lXG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBBcHBlbmQgY2xpY2thYmxlIGJ1dHRvbiB0byBEcmFmdHkgZG9jdW1lbnQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl8c3RyaW5nfSBjb250ZW50IC0gRHJhZnR5IGRvY3VtZW50IHRvIGluc2VydCBidXR0b24gdG8gb3IgYSBzdHJpbmcgdG8gYmUgdXNlZCBhcyBidXR0b24gdGV4dC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0aXRsZSAtIHRoZSB0ZXh0IHRvIGJlIHVzZWQgYXMgYnV0dG9uIHRpdGxlLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSB0aGUgYnV0dG9uLiBDbGllbnQgc2hvdWxkIHJldHVybiBpdCB0byB0aGUgc2VydmVyIHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkLlxuICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvblR5cGUgLSB0aGUgdHlwZSBvZiB0aGUgYnV0dG9uLCBvbmUgb2YgJ3VybCcgb3IgJ3B1YicuXG4gKiBAcGFyYW0ge3N0cmluZ30gYWN0aW9uVmFsdWUgLSB0aGUgdmFsdWUgdG8gcmV0dXJuIG9uIGNsaWNrOlxuICogQHBhcmFtIHtzdHJpbmd9IHJlZlVybCAtIHRoZSBVUkwgdG8gZ28gdG8gd2hlbiB0aGUgJ3VybCcgYnV0dG9uIGlzIGNsaWNrZWQuXG4gKlxuICogQHJldHVybiB7RHJhZnR5fSB1cGRhdGVkIGRvY3VtZW50LlxuICovXG5EcmFmdHkuYXBwZW5kQnV0dG9uID0gZnVuY3Rpb24oY29udGVudCwgdGl0bGUsIG5hbWUsIGFjdGlvblR5cGUsIGFjdGlvblZhbHVlLCByZWZVcmwpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogXCJcIlxuICB9O1xuICBjb25zdCBhdCA9IGNvbnRlbnQudHh0Lmxlbmd0aDtcbiAgY29udGVudC50eHQgKz0gdGl0bGU7XG4gIHJldHVybiBEcmFmdHkuaW5zZXJ0QnV0dG9uKGNvbnRlbnQsIGF0LCB0aXRsZS5sZW5ndGgsIG5hbWUsIGFjdGlvblR5cGUsIGFjdGlvblZhbHVlLCByZWZVcmwpO1xufVxuXG4vKipcbiAqIEF0dGFjaCBhIGdlbmVyaWMgSlMgb2JqZWN0LiBUaGUgb2JqZWN0IGlzIGF0dGFjaGVkIGFzIGEganNvbiBzdHJpbmcuXG4gKiBJbnRlbmRlZCBmb3IgcmVwcmVzZW50aW5nIGEgZm9ybSByZXNwb25zZS5cbiAqXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBEcmFmdHkgZG9jdW1lbnQgdG8gYXR0YWNoIGZpbGUgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIGRhdGEgdG8gY29udmVydCB0byBqc29uIHN0cmluZyBhbmQgYXR0YWNoLlxuICogQHJldHVybnMge0RyYWZ0eX0gdGhlIHNhbWUgZG9jdW1lbnQgYXMgPGNvZGU+Y29udGVudDwvY29kZT4uXG4gKi9cbkRyYWZ0eS5hdHRhY2hKU09OID0gZnVuY3Rpb24oY29udGVudCwgZGF0YSkge1xuICBjb250ZW50ID0gY29udGVudCB8fCB7XG4gICAgdHh0OiBcIlwiXG4gIH07XG4gIGNvbnRlbnQuZW50ID0gY29udGVudC5lbnQgfHwgW107XG4gIGNvbnRlbnQuZm10ID0gY29udGVudC5mbXQgfHwgW107XG5cbiAgY29udGVudC5mbXQucHVzaCh7XG4gICAgYXQ6IC0xLFxuICAgIGxlbjogMCxcbiAgICBrZXk6IGNvbnRlbnQuZW50Lmxlbmd0aFxuICB9KTtcblxuICBjb250ZW50LmVudC5wdXNoKHtcbiAgICB0cDogJ0VYJyxcbiAgICBkYXRhOiB7XG4gICAgICBtaW1lOiBKU09OX01JTUVfVFlQRSxcbiAgICAgIHZhbDogZGF0YVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG4vKipcbiAqIEFwcGVuZCBsaW5lIGJyZWFrIHRvIGEgRHJhZnR5IGRvY3VtZW50LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBjb250ZW50IC0gRHJhZnR5IGRvY3VtZW50IHRvIGFwcGVuZCBsaW5lYnJlYWsgdG8uXG4gKiBAcmV0dXJucyB7RHJhZnR5fSB0aGUgc2FtZSBkb2N1bWVudCBhcyA8Y29kZT5jb250ZW50PC9jb2RlPi5cbiAqL1xuRHJhZnR5LmFwcGVuZExpbmVCcmVhayA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogXCJcIlxuICB9O1xuICBjb250ZW50LmZtdCA9IGNvbnRlbnQuZm10IHx8IFtdO1xuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogY29udGVudC50eHQubGVuZ3RoLFxuICAgIGxlbjogMSxcbiAgICB0cDogJ0JSJ1xuICB9KTtcbiAgY29udGVudC50eHQgKz0gXCIgXCI7XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG4vKipcbiAqIEdpdmVuIERyYWZ0eSBkb2N1bWVudCwgY29udmVydCBpdCB0byBIVE1MLlxuICogTm8gYXR0ZW1wdCBpcyBtYWRlIHRvIHN0cmlwIHByZS1leGlzdGluZyBodG1sIG1hcmt1cC5cbiAqIFRoaXMgaXMgcG90ZW50aWFsbHkgdW5zYWZlIGJlY2F1c2UgPGNvZGU+Y29udGVudC50eHQ8L2NvZGU+IG1heSBjb250YWluIG1hbGljaW91c1xuICogbWFya3VwLlxuICogQG1lbWJlcm9mIFRpbm9kZS5EcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ5fSBjb250ZW50IC0gZG9jdW1lbnQgdG8gY29udmVydC5cbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MLXJlcHJlc2VudGF0aW9uIG9mIGNvbnRlbnQuXG4gKi9cbkRyYWZ0eS5VTlNBRkVfdG9IVE1MID0gZnVuY3Rpb24oY29udGVudCkge1xuICBsZXQge1xuICAgIHR4dCxcbiAgICBmbXQsXG4gICAgZW50XG4gIH0gPSBjb250ZW50O1xuXG4gIGNvbnN0IG1hcmt1cCA9IFtdO1xuICBpZiAoZm10KSB7XG4gICAgZm9yIChsZXQgaSBpbiBmbXQpIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gZm10W2ldO1xuICAgICAgY29uc3QgYXQgPSByYW5nZS5hdCB8IDA7XG4gICAgICBsZXQgdHAgPSByYW5nZS50cDtcbiAgICAgIGxldCBkYXRhO1xuICAgICAgaWYgKCF0cCkge1xuICAgICAgICBjb25zdCBlbnRpdHkgPSBlbnRbcmFuZ2Uua2V5IHwgMF07XG4gICAgICAgIGlmIChlbnRpdHkpIHtcbiAgICAgICAgICB0cCA9IGVudGl0eS50cDtcbiAgICAgICAgICBkYXRhID0gZW50aXR5LmRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKERFQ09SQVRPUlNbdHBdKSB7XG4gICAgICAgIC8vIEJlY2F1c2Ugd2UgbGF0ZXIgc29ydCBpbiBkZXNjZW5kaW5nIG9yZGVyLCBjbG9zaW5nIG1hcmt1cCBtdXN0IGNvbWUgZmlyc3QuXG4gICAgICAgIC8vIE90aGVyd2lzZSB6ZXJvLWxlbmd0aCBvYmplY3RzIHdpbGwgbm90IGJlIHJlcHJlc2VudGVkIGNvcnJlY3RseS5cbiAgICAgICAgbWFya3VwLnB1c2goe1xuICAgICAgICAgIGlkeDogYXQgKyByYW5nZS5sZW4sXG4gICAgICAgICAgbGVuOiAtcmFuZ2UubGVuLFxuICAgICAgICAgIHdoYXQ6IERFQ09SQVRPUlNbdHBdLmNsb3NlKGRhdGEpXG4gICAgICAgIH0pO1xuICAgICAgICBtYXJrdXAucHVzaCh7XG4gICAgICAgICAgaWR4OiBhdCxcbiAgICAgICAgICBsZW46IHJhbmdlLmxlbixcbiAgICAgICAgICB3aGF0OiBERUNPUkFUT1JTW3RwXS5vcGVuKGRhdGEpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG1hcmt1cC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYi5pZHggPT0gYS5pZHggPyBiLmxlbiAtIGEubGVuIDogYi5pZHggLSBhLmlkeDsgLy8gaW4gZGVzY2VuZGluZyBvcmRlclxuICB9KTtcblxuICBmb3IgKGxldCBpIGluIG1hcmt1cCkge1xuICAgIGlmIChtYXJrdXBbaV0ud2hhdCkge1xuICAgICAgdHh0ID0gc3BsaWNlKHR4dCwgbWFya3VwW2ldLmlkeCwgbWFya3VwW2ldLndoYXQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0eHQ7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIGFwcGx5aW5nIGN1c3RvbSBmb3JtYXR0aW5nL3RyYW5zZm9ybWF0aW9uIHRvIGEgRHJhZnR5IGRvY3VtZW50LlxuICogQ2FsbGVkIG9uY2UgZm9yIGVhY2ggc3lsZSBzcGFuLlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBjYWxsYmFjayBGb3JtYXR0ZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHlsZSAtIHN0eWxlIGNvZGUgc3VjaCBhcyBcIlNUXCIgb3IgXCJJTVwiLlxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBlbnRpdHkncyBkYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzIC0gcG9zc2libHkgc3R5bGVkIHN1YnNwYW5zIGNvbnRhaW5lZCBpbiB0aGlzIHN0eWxlIHNwYW4uXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBvZiB0aGUgY3VycmVudCBlbGVtZW50IGFtb25nIGl0cyBzaWJsaW5ncy5cbiAqL1xuXG4vKipcbiAqIFRyYW5zZm9ybSBEcmFmdHkgZG9jdW1lbnQgdXNpbmcgY3VzdG9tIGZvcm1hdHRpbmcuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBjb250ZW50IHRvIHRyYW5zZm9ybS5cbiAqIEBwYXJhbSB7Rm9ybWF0dGVyfSBmb3JtYXR0ZXIgLSBjYWxsYmFjayB3aGljaCB0cmFuc2Zvcm1zIGluZGl2aWR1YWwgZWxlbWVudHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gY29udGV4dCBwcm92aWRlZCB0byBmb3JtYXR0ZXIgYXMgPGNvZGU+dGhpczwvY29kZT4uXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSB0cmFuc2Zvcm1lZCBvYmplY3RcbiAqL1xuRHJhZnR5LmZvcm1hdCA9IGZ1bmN0aW9uKGNvbnRlbnQsIGZvcm1hdHRlciwgY29udGV4dCkge1xuICBsZXQge1xuICAgIHR4dCxcbiAgICBmbXQsXG4gICAgZW50XG4gIH0gPSBjb250ZW50O1xuXG4gIC8vIEFzc2lnbiBkZWZhdWx0IHZhbHVlcy5cbiAgdHh0ID0gdHh0IHx8IFwiXCI7XG4gIGlmICghQXJyYXkuaXNBcnJheShlbnQpKSB7XG4gICAgZW50ID0gW107XG4gIH1cblxuICBpZiAoIUFycmF5LmlzQXJyYXkoZm10KSkge1xuICAgIC8vIEhhbmRsZSBzcGVjaWFsIGNhc2Ugd2hlbiBhbGwgdmFsdWVzIGluIGZtdCBhcmUgMCBhbmQgZm10IGlzIHNraXBwZWQuXG4gICAgaWYgKGVudC5sZW5ndGggPT0gMSkge1xuICAgICAgZm10ID0gW3tcbiAgICAgICAgYXQ6IDAsXG4gICAgICAgIGxlbjogMCxcbiAgICAgICAga2V5OiAwXG4gICAgICB9XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFt0eHRdO1xuICAgIH1cbiAgfVxuXG4gIGxldCBzcGFucyA9IFtdLmNvbmNhdChmbXQpO1xuXG4gIC8vIFplcm8gdmFsdWVzIG1heSBoYXZlIGJlZW4gc3RyaXBwZWQuIFJlc3RvcmUgdGhlbS5cbiAgLy8gQWxzbyBlbnN1cmUgaW5kZXhlcyBhbmQgbGVuZ3RocyBhcmUgc2FuZS5cbiAgc3BhbnMubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICBzLmF0ID0gcy5hdCB8fCAwO1xuICAgIHMubGVuID0gcy5sZW4gfHwgMDtcbiAgICBpZiAocy5sZW4gPCAwKSB7XG4gICAgICBzLmxlbiA9IDA7XG4gICAgfVxuICAgIGlmIChzLmF0IDwgLTEpIHtcbiAgICAgIHMuYXQgPSAtMTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFNvcnQgc3BhbnMgZmlyc3QgYnkgc3RhcnQgaW5kZXggKGFzYykgdGhlbiBieSBsZW5ndGggKGRlc2MpLlxuICBzcGFucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICBpZiAoYS5hdCAtIGIuYXQgPT0gMCkge1xuICAgICAgcmV0dXJuIGIubGVuIC0gYS5sZW47IC8vIGxvbmdlciBvbmUgY29tZXMgZmlyc3QgKDwwKVxuICAgIH1cbiAgICByZXR1cm4gYS5hdCAtIGIuYXQ7XG4gIH0pO1xuXG4gIC8vIERlbm9ybWFsaXplIGVudGl0aWVzIGludG8gc3BhbnMuIENyZWF0ZSBhIGNvcHkgb2YgdGhlIG9iamVjdHMgdG8gbGVhdmVcbiAgLy8gb3JpZ2luYWwgRHJhZnR5IG9iamVjdCB1bmNoYW5nZWQuXG4gIHNwYW5zID0gc3BhbnMubWFwKChzKSA9PiB7XG4gICAgbGV0IGRhdGE7XG4gICAgbGV0IHRwID0gcy50cDtcbiAgICBpZiAoIXRwKSB7XG4gICAgICBzLmtleSA9IHMua2V5IHx8IDA7XG4gICAgICBpZiAoZW50W3Mua2V5XSkge1xuICAgICAgICBkYXRhID0gZW50W3Mua2V5XS5kYXRhO1xuICAgICAgICB0cCA9IGVudFtzLmtleV0udHA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVHlwZSBzdGlsbCBub3QgZGVmaW5lZD8gSGlkZSBpbnZhbGlkIGVsZW1lbnQuXG4gICAgdHAgPSB0cCB8fCAnSEQnO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRwOiB0cCxcbiAgICAgIGRhdGE6IGRhdGEsXG4gICAgICBhdDogcy5hdCxcbiAgICAgIGxlbjogcy5sZW5cbiAgICB9O1xuICB9KTtcblxuICByZXR1cm4gZm9yRWFjaCh0eHQsIDAsIHR4dC5sZW5ndGgsIHNwYW5zLCBmb3JtYXR0ZXIsIGNvbnRleHQpO1xufVxuXG4vKipcbiAqIEdpdmVuIERyYWZ0eSBkb2N1bWVudCwgY29udmVydCBpdCB0byBwbGFpbiB0ZXh0LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBjb250ZW50IC0gZG9jdW1lbnQgdG8gY29udmVydCB0byBwbGFpbiB0ZXh0LlxuICogQHJldHVybnMge3N0cmluZ30gcGxhaW4tdGV4dCByZXByZXNlbnRhdGlvbiBvZiB0aGUgZHJhZnR5IGRvY3VtZW50LlxuICovXG5EcmFmdHkudG9QbGFpblRleHQgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIHJldHVybiB0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJyA/IGNvbnRlbnQgOiBjb250ZW50LnR4dDtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZG9jdW1lbnQgaGFzIG5vIG1hcmt1cCBhbmQgbm8gZW50aXRpZXMuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBjb250ZW50IHRvIGNoZWNrIGZvciBwcmVzZW5jZSBvZiBtYXJrdXAuXG4gKiBAcmV0dXJucyA8Y29kZT50cnVlPC9jb2RlPiBpcyBjb250ZW50IGlzIHBsYWluIHRleHQsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gKi9cbkRyYWZ0eS5pc1BsYWluVGV4dCA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09ICdzdHJpbmcnIHx8ICEoY29udGVudC5mbXQgfHwgY29udGVudC5lbnQpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgb2JqZWN0IHJlcHJlc2V0cyBpcyBhIHZhbGlkIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGNvbnRlbnQgdG8gY2hlY2sgZm9yIHZhbGlkaXR5LlxuICogQHJldHVybnMgPGNvZGU+dHJ1ZTwvY29kZT4gaXMgY29udGVudCBpcyB2YWxpZCwgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuRHJhZnR5LmlzVmFsaWQgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIGlmICghY29udGVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICB0eHQsXG4gICAgZm10LFxuICAgIGVudFxuICB9ID0gY29udGVudDtcblxuICBpZiAoIXR4dCAmJiB0eHQgIT09ICcnICYmICFmbXQgJiYgIWVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHR4dF90eXBlID0gdHlwZW9mIHR4dDtcbiAgaWYgKHR4dF90eXBlICE9ICdzdHJpbmcnICYmIHR4dF90eXBlICE9ICd1bmRlZmluZWQnICYmIHR4dCAhPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZm10ICE9ICd1bmRlZmluZWQnICYmICFBcnJheS5pc0FycmF5KGZtdCkgJiYgZm10ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBlbnQgIT0gJ3VuZGVmaW5lZCcgJiYgIUFycmF5LmlzQXJyYXkoZW50KSAmJiBlbnQgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGRyYWZ0eSBkb2N1bWVudCBoYXMgYXR0YWNobWVudHMuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBkb2N1bWVudCB0byBjaGVjayBmb3IgYXR0YWNobWVudHMuXG4gKiBAcmV0dXJucyA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGVyZSBhcmUgYXR0YWNobWVudHMuXG4gKi9cbkRyYWZ0eS5oYXNBdHRhY2htZW50cyA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgaWYgKGNvbnRlbnQuZW50ICYmIGNvbnRlbnQuZW50Lmxlbmd0aCA+IDApIHtcbiAgICBmb3IgKGxldCBpIGluIGNvbnRlbnQuZW50KSB7XG4gICAgICBpZiAoY29udGVudC5lbnRbaV0gJiYgY29udGVudC5lbnRbaV0udHAgPT0gJ0VYJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBhcHBseWluZyBjdXN0b20gZm9ybWF0dGluZy90cmFuc2Zvcm1hdGlvbiB0byBhIERyYWZ0eSBkb2N1bWVudC5cbiAqIENhbGxlZCBvbmNlIGZvciBlYWNoIHN5bGUgc3Bhbi5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAY2FsbGJhY2sgQXR0YWNobWVudENhbGxiYWNrXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBhdHRhY2htZW50IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBhdHRhY2htZW50J3MgaW5kZXggaW4gYGNvbnRlbnQuZW50YC5cbiAqL1xuXG4vKipcbiAqIEVudW1lcmF0ZSBhdHRhY2htZW50cy5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGRvY3VtZW50IHRvIHByb2Nlc3MgZm9yIGF0dGFjaG1lbnRzLlxuICogQHBhcmFtIHtBdHRhY2htZW50Q2FsbGJhY2t9IGNhbGxiYWNrIC0gY2FsbGJhY2sgdG8gY2FsbCBmb3IgZWFjaCBhdHRhY2htZW50LlxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSB2YWx1ZSBvZiBcInRoaXNcIiBmb3IgY2FsbGJhY2suXG4gKi9cbkRyYWZ0eS5hdHRhY2htZW50cyA9IGZ1bmN0aW9uKGNvbnRlbnQsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gIGlmIChjb250ZW50LmVudCAmJiBjb250ZW50LmVudC5sZW5ndGggPiAwKSB7XG4gICAgZm9yIChsZXQgaSBpbiBjb250ZW50LmVudCkge1xuICAgICAgaWYgKGNvbnRlbnQuZW50W2ldICYmIGNvbnRlbnQuZW50W2ldLnRwID09ICdFWCcpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBjb250ZW50LmVudFtpXS5kYXRhLCBpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiB0aGUgZW50aXR5LCBnZXQgVVJMIHdoaWNoIGNhbiBiZSB1c2VkIGZvciBkb3dubG9hZGluZ1xuICogZW50aXR5IGRhdGEuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGVudERhdGEgLSBlbnRpdHkuZGF0YSB0byBnZXQgdGhlIFVSbCBmcm9tLlxuICogQHJldHVybnMge3N0cmluZ30gVVJMIHRvIGRvd25sb2FkIGVudGl0eSBkYXRhIG9yIDxjb2RlPm51bGw8L2NvZGU+LlxuICovXG5EcmFmdHkuZ2V0RG93bmxvYWRVcmwgPSBmdW5jdGlvbihlbnREYXRhKSB7XG4gIGxldCB1cmwgPSBudWxsO1xuICBpZiAoZW50RGF0YS5taW1lICE9IEpTT05fTUlNRV9UWVBFICYmIGVudERhdGEudmFsKSB7XG4gICAgdXJsID0gYmFzZTY0dG9PYmplY3RVcmwoZW50RGF0YS52YWwsIGVudERhdGEubWltZSwgRHJhZnR5LmxvZ2dlcik7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGVudERhdGEucmVmID09ICdzdHJpbmcnKSB7XG4gICAgdXJsID0gZW50RGF0YS5yZWY7XG4gIH1cbiAgcmV0dXJuIHVybDtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZW50aXR5IGRhdGEgaXMgbm90IHJlYWR5IGZvciBzZW5kaW5nLCBzdWNoIGFzIGJlaW5nIHVwbG9hZGVkIHRvIHRoZSBzZXJ2ZXIuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGVudGl0eS5kYXRhIHRvIGdldCB0aGUgVVJsIGZyb20uXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB1cGxvYWQgaXMgaW4gcHJvZ3Jlc3MsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xuRHJhZnR5LmlzUHJvY2Vzc2luZyA9IGZ1bmN0aW9uKGVudERhdGEpIHtcbiAgcmV0dXJuICEhZW50RGF0YS5fcHJvY2Vzc2luZztcbn1cblxuLyoqXG4gKiBHaXZlbiB0aGUgZW50aXR5LCBnZXQgVVJMIHdoaWNoIGNhbiBiZSB1c2VkIGZvciBwcmV2aWV3aW5nXG4gKiB0aGUgZW50aXR5LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnRpdHkuZGF0YSB0byBnZXQgdGhlIFVSbCBmcm9tLlxuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHVybCBmb3IgcHJldmlld2luZyBvciBudWxsIGlmIG5vIHN1Y2ggdXJsIGlzIGF2YWlsYWJsZS5cbiAqL1xuRHJhZnR5LmdldFByZXZpZXdVcmwgPSBmdW5jdGlvbihlbnREYXRhKSB7XG4gIHJldHVybiBlbnREYXRhLnZhbCA/IGJhc2U2NHRvT2JqZWN0VXJsKGVudERhdGEudmFsLCBlbnREYXRhLm1pbWUsIERyYWZ0eS5sb2dnZXIpIDogbnVsbDtcbn1cblxuLyoqXG4gKiBHZXQgYXBwcm94aW1hdGUgc2l6ZSBvZiB0aGUgZW50aXR5LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnREYXRhIC0gZW50aXR5LmRhdGEgdG8gZ2V0IHRoZSBzaXplIGZvci5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IHNpemUgb2YgZW50aXR5IGRhdGEgaW4gYnl0ZXMuXG4gKi9cbkRyYWZ0eS5nZXRFbnRpdHlTaXplID0gZnVuY3Rpb24oZW50RGF0YSkge1xuICAvLyBFaXRoZXIgc2l6ZSBoaW50IG9yIGxlbmd0aCBvZiB2YWx1ZS4gVGhlIHZhbHVlIGlzIGJhc2U2NCBlbmNvZGVkLFxuICAvLyB0aGUgYWN0dWFsIG9iamVjdCBzaXplIGlzIHNtYWxsZXIgdGhhbiB0aGUgZW5jb2RlZCBsZW5ndGguXG4gIHJldHVybiBlbnREYXRhLnNpemUgPyBlbnREYXRhLnNpemUgOiBlbnREYXRhLnZhbCA/IChlbnREYXRhLnZhbC5sZW5ndGggKiAwLjc1KSB8IDAgOiAwO1xufVxuXG4vKipcbiAqIEdldCBlbnRpdHkgbWltZSB0eXBlLlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnREYXRhIC0gZW50aXR5LmRhdGEgdG8gZ2V0IHRoZSB0eXBlIGZvci5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IG1pbWUgdHlwZSBvZiBlbnRpdHkuXG4gKi9cbkRyYWZ0eS5nZXRFbnRpdHlNaW1lVHlwZSA9IGZ1bmN0aW9uKGVudERhdGEpIHtcbiAgcmV0dXJuIGVudERhdGEubWltZSB8fCAndGV4dC9wbGFpbic7XG59XG5cbi8qKlxuICogR2V0IEhUTUwgdGFnIGZvciBhIGdpdmVuIHR3by1sZXR0ZXIgc3R5bGUgbmFtZS5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3R5bGUgLSB0d28tbGV0dGVyIHN0eWxlLCBsaWtlIFNUIG9yIExOLlxuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUwgdGFnIG5hbWUgaWYgc3R5bGUgaXMgZm91bmQsICdfVU5LTicgaWYgbm90IGZvdW5kLCB7Y29kZTogdW5kZWZpbmVkfSBpZiBzdHlsZSBpcyBmYWxzaXNoLlxuICovXG5EcmFmdHkudGFnTmFtZSA9IGZ1bmN0aW9uKHN0eWxlKSB7XG4gIHJldHVybiBzdHlsZSA/IChIVE1MX1RBR1Nbc3R5bGVdID8gSFRNTF9UQUdTW3N0eWxlXS5uYW1lIDogJ19VTktOJykgOiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogRm9yIGEgZ2l2ZW4gZGF0YSBidW5kbGUgZ2VuZXJhdGUgYW4gb2JqZWN0IHdpdGggSFRNTCBhdHRyaWJ1dGVzLFxuICogZm9yIGluc3RhbmNlLCBnaXZlbiB7dXJsOiBcImh0dHA6Ly93d3cuZXhhbXBsZS5jb20vXCJ9IHJldHVyblxuICoge2hyZWY6IFwiaHR0cDovL3d3dy5leGFtcGxlLmNvbS9cIn1cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3R5bGUgLSB0d28tbGV0dGVyIHN0eWxlIHRvIGdlbmVyYXRlIGF0dHJpYnV0ZXMgZm9yLlxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBkYXRhIGJ1bmRsZSB0byBjb252ZXJ0IHRvIGF0dHJpYnV0ZXNcbiAqXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBvYmplY3Qgd2l0aCBIVE1MIGF0dHJpYnV0ZXMuXG4gKi9cbkRyYWZ0eS5hdHRyVmFsdWUgPSBmdW5jdGlvbihzdHlsZSwgZGF0YSkge1xuICBpZiAoZGF0YSAmJiBERUNPUkFUT1JTW3N0eWxlXSkge1xuICAgIHJldHVybiBERUNPUkFUT1JTW3N0eWxlXS5wcm9wcyhkYXRhKTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogRHJhZnR5IE1JTUUgdHlwZS5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIVFRQIENvbnRlbnQtVHlwZSBcInRleHQveC1kcmFmdHlcIi5cbiAqL1xuRHJhZnR5LmdldENvbnRlbnRUeXBlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAndGV4dC94LWRyYWZ0eSc7XG59XG5cbi8qKlxuICogU2hvcnRlbiBEcmFmdHkgZG9jdW1lbnQgYW5kIHN0cmlwIGFsbCBlbnRpdHkgZGF0YSBsZWF2aW5nIGp1c3QgaW5saW5lIHN0eWxlcyBhbmQgZW50aXR5IHJlZmVyZW5jZXMuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IG9yaWdpbmFsIC0gRHJhZnR5IG9iamVjdCB0byBzaG9ydGVuLlxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCAtIGxlbmd0aCBpbiBjaGFyYWN0ZXJzIHRvIHNob3J0ZW4gdG8uXG4gKiBAcmV0dXJucyBuZXcgc2hvcnRlbmVkIERyYWZ0eSBvYmplY3QgbGVhdmluZyB0aGUgb3JpZ2luYWwgaW50YWN0LlxuICovXG5EcmFmdHkucHJldmlldyA9IGZ1bmN0aW9uKG9yaWdpbmFsLCBsZW5ndGgpIHtcbiAgaWYgKCFvcmlnaW5hbCB8fCBsZW5ndGggPD0gMCB8fCB0eXBlb2Ygb3JpZ2luYWwgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICB0eHQsXG4gICAgZm10LFxuICAgIGVudFxuICB9ID0gb3JpZ2luYWw7XG5cbiAgY29uc3QgcHJldmlldyA9IHtcbiAgICB0eHQ6ICcnXG4gIH07XG4gIGxldCBsZW4gPSAwO1xuICBpZiAodHlwZW9mIHR4dCA9PSAnc3RyaW5nJykge1xuICAgIGlmICh0eHQubGVuZ3RoID4gbGVuZ3RoKSB7XG4gICAgICBwcmV2aWV3LnR4dCA9IHR4dC5zdWJzdHIoMCwgbGVuZ3RoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJldmlldy50eHQgPSB0eHQ7XG4gICAgfVxuICAgIGxlbiA9IHByZXZpZXcudHh0Lmxlbmd0aDtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KGZtdCkgJiYgZm10Lmxlbmd0aCA+IDApIHtcbiAgICAvLyBPbGQga2V5IHRvIG5ldyBrZXkgZW50aXR5IG1hcHBpbmcuXG4gICAgY29uc3QgZW50X3JlZnMgPSBbXTtcbiAgICAvLyBDb3VudCBzdHlsZXMgd2hpY2ggc3RhcnQgd2l0aGluIHRoZSBuZXcgbGVuZ3RoIG9mIHRoZSB0ZXh0IGFuZCBzYXZlIGVudGl0eSBrZXlzIGFzIGEgc2V0LlxuICAgIGxldCBmbXRfY291bnQgPSAwO1xuICAgIGxldCBlbnRfY291bnQgPSAwO1xuICAgIGZtdC5mb3JFYWNoKChzdCkgPT4ge1xuICAgICAgaWYgKHN0LmF0IDwgbGVuKSB7XG4gICAgICAgIGZtdF9jb3VudCsrO1xuICAgICAgICBpZiAoIXN0LnRwKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0gc3Qua2V5IHwgMDtcbiAgICAgICAgICBpZiAoIWVudF9yZWZzW2tleV0pIHtcbiAgICAgICAgICAgIGVudF9yZWZzW2tleV0gPSBlbnRfY291bnQ7XG4gICAgICAgICAgICBlbnRfY291bnQrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChmbXRfY291bnQgPT0gMCkge1xuICAgICAgcmV0dXJuIHByZXZpZXc7XG4gICAgfVxuXG4gICAgLy8gQWxsb2NhdGUgc3BhY2UgZm9yIGNvcHlpbmcgc3R5bGVzIGFuZCBlbnRpdGllcy5cbiAgICBwcmV2aWV3LmZtdCA9IFtdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGVudCkgJiYgZW50X3JlZnMubGVuZ3RoID4gMCkge1xuICAgICAgcHJldmlldy5lbnQgPSBbXTtcbiAgICB9XG5cbiAgICAvLyBJbnNlcnRpb24gcG9pbnQgZm9yIHN0eWxlcy5cbiAgICBsZXQgZm10X2lkeCA9IDA7XG4gICAgZm10LmZvckVhY2goKHN0KSA9PiB7XG4gICAgICBpZiAoc3QuYXQgPCBsZW4pIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICAgICAgYXQ6IHN0LmF0LFxuICAgICAgICAgIGxlbjogc3QubGVuXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGtleSA9IHN0LmtleSB8IDA7XG4gICAgICAgIGlmIChzdC50cCkge1xuICAgICAgICAgIHN0eWxlLnRwID0gJycgKyBzdC50cDtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGVudCkgJiYgZW50Lmxlbmd0aCA+IGtleSAmJiB0eXBlb2YgZW50X3JlZnNba2V5XSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIHN0eWxlLmtleSA9IGVudF9yZWZzW2tleV07XG4gICAgICAgICAgcHJldmlldy5lbnRbc3R5bGUua2V5XSA9IGNvcHlMaWdodChlbnRba2V5XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHByZXZpZXcuZm10W2ZtdF9pZHgrK10gPSBzdHlsZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBwcmV2aWV3O1xufVxuXG4vLyBDcmVhdGUgYSBjb3B5IG9mIGFuIGVudGl0eSB3aXRob3V0IGxhcmdlIGRhdGEuXG5mdW5jdGlvbiBjb3B5TGlnaHQoZW50KSB7XG4gIGxldCByZXN1bHQgPSB7XG4gICAgdHA6IGVudC50cFxuICB9O1xuICBpZiAoZW50LmRhdGEgJiYgT2JqZWN0LmVudHJpZXMoZW50LmRhdGEpLmxlbmd0aCAhPSAwKSB7XG4gICAgY29uc3QgZGMgPSB7fTtcbiAgICBbXCJtaW1lXCIsIFwibmFtZVwiLCBcIndpZHRoXCIsIFwiaGVpZ2h0XCIsIFwic2l6ZVwiXS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGNvbnN0IHZhbCA9IGVudC5kYXRhW2tleV07XG4gICAgICBpZiAodmFsKSB7XG4gICAgICAgIGRjW2tleV0gPSB2YWw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKE9iamVjdC5lbnRyaWVzKGRjKS5sZW5ndGggIT0gMCkge1xuICAgICAgcmVzdWx0LmRhdGEgPSBkYztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBEcmFmdHk7XG59XG4iLCIvKipcbiAqIEBmaWxlIFNESyB0byBjb25uZWN0IHRvIFRpbm9kZSBjaGF0IHNlcnZlci5cbiAqIFNlZSA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL3Rpbm9kZS93ZWJhcHBcIj5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS90aW5vZGUvd2ViYXBwPC9hPiBmb3IgcmVhbC1saWZlIHVzYWdlLlxuICpcbiAqIEBjb3B5cmlnaHQgMjAxNS0yMDIxIFRpbm9kZVxuICogQHN1bW1hcnkgSmF2YXNjcmlwdCBiaW5kaW5ncyBmb3IgVGlub2RlLlxuICogQGxpY2Vuc2UgQXBhY2hlIDIuMFxuICogQHZlcnNpb24gMC4xN1xuICpcbiAqIEBleGFtcGxlXG4gKiA8aGVhZD5cbiAqIDxzY3JpcHQgc3JjPVwiLi4uL3Rpbm9kZS5qc1wiPjwvc2NyaXB0PlxuICogPC9oZWFkPlxuICpcbiAqIDxib2R5PlxuICogIC4uLlxuICogPHNjcmlwdD5cbiAqICAvLyBJbnN0YW50aWF0ZSB0aW5vZGUuXG4gKiAgY29uc3QgdGlub2RlID0gbmV3IFRpbm9kZShBUFBfTkFNRSwgSE9TVCwgQVBJX0tFWSwgbnVsbCwgdHJ1ZSk7XG4gKiAgdGlub2RlLmVuYWJsZUxvZ2dpbmcodHJ1ZSk7XG4gKiAgLy8gQWRkIGxvZ2ljIHRvIGhhbmRsZSBkaXNjb25uZWN0cy5cbiAqICB0aW5vZGUub25EaXNjb25uZWN0ID0gZnVuY3Rpb24oZXJyKSB7IC4uLiB9O1xuICogIC8vIENvbm5lY3QgdG8gdGhlIHNlcnZlci5cbiAqICB0aW5vZGUuY29ubmVjdCgpLnRoZW4oKCkgPT4ge1xuICogICAgLy8gQ29ubmVjdGVkLiBMb2dpbiBub3cuXG4gKiAgICByZXR1cm4gdGlub2RlLmxvZ2luQmFzaWMobG9naW4sIHBhc3N3b3JkKTtcbiAqICB9KS50aGVuKChjdHJsKSA9PiB7XG4gKiAgICAvLyBMb2dnZWQgaW4gZmluZSwgYXR0YWNoIGNhbGxiYWNrcywgc3Vic2NyaWJlIHRvICdtZScuXG4gKiAgICBjb25zdCBtZSA9IHRpbm9kZS5nZXRNZVRvcGljKCk7XG4gKiAgICBtZS5vbk1ldGFEZXNjID0gZnVuY3Rpb24obWV0YSkgeyAuLi4gfTtcbiAqICAgIC8vIFN1YnNjcmliZSwgZmV0Y2ggdG9waWMgZGVzY3JpcHRpb24gYW5kIHRoZSBsaXN0IG9mIGNvbnRhY3RzLlxuICogICAgbWUuc3Vic2NyaWJlKHtnZXQ6IHtkZXNjOiB7fSwgc3ViOiB7fX0pO1xuICogIH0pLmNhdGNoKChlcnIpID0+IHtcbiAqICAgIC8vIExvZ2luIG9yIHN1YnNjcmlwdGlvbiBmYWlsZWQsIGRvIHNvbWV0aGluZy5cbiAqICAgIC4uLlxuICogIH0pO1xuICogIC4uLlxuICogPC9zY3JpcHQ+XG4gKiA8L2JvZHk+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLy8gTk9URSBUTyBERVZFTE9QRVJTOlxuLy8gTG9jYWxpemFibGUgc3RyaW5ncyBzaG91bGQgYmUgZG91YmxlIHF1b3RlZCBcItGB0YLRgNC+0LrQsCDQvdCwINC00YDRg9Cz0L7QvCDRj9C30YvQutC1XCIsXG4vLyBub24tbG9jYWxpemFibGUgc3RyaW5ncyBzaG91bGQgYmUgc2luZ2xlIHF1b3RlZCAnbm9uLWxvY2FsaXplZCcuXG5cbi8vIE1vZHVsZSBpbXBvcnRzIE5vZGUuanMgc3R5bGUuXG5pZiAodHlwZW9mIHJlcXVpcmUgPT0gJ2Z1bmN0aW9uJykge1xuICBpZiAodHlwZW9mIENCdWZmZXIgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zdCBDQnVmZmVyID0gcmVxdWlyZSgnLi9jYnVmZmVyLmpzJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiBDb25uZWN0aW9uID09ICd1bmRlZmluZWQnKSB7XG4gICAgY29uc3QgQ29ubmVjdGlvbiA9IHJlcXVpcmUoJy4vY29ubmVjdGlvbi5qcycpO1xuICB9XG4gIGlmICh0eXBlb2YgREJDYWNoZSA9PSAndW5kZWZpbmVkJykge1xuICAgIGNvbnN0IERCQ2FjaGUgPSByZXF1aXJlKCcuL2RiLmpzJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiBEcmFmdHkgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zdCBEcmFmdHkgPSByZXF1aXJlKCcuL2RyYWZ0eS5qcycpO1xuICB9XG4gIGNvbnN0IHBhY2thZ2VfdmVyc2lvbiA9IHJlcXVpcmUoJy4uL3ZlcnNpb24uanNvbicpLnZlcnNpb247XG59XG5cbmxldCBXZWJTb2NrZXRQcm92aWRlcjtcbmlmICh0eXBlb2YgV2ViU29ja2V0ICE9ICd1bmRlZmluZWQnKSB7XG4gIFdlYlNvY2tldFByb3ZpZGVyID0gV2ViU29ja2V0O1xufVxuXG5sZXQgWEhSUHJvdmlkZXI7XG5pZiAodHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9ICd1bmRlZmluZWQnKSB7XG4gIFhIUlByb3ZpZGVyID0gWE1MSHR0cFJlcXVlc3Q7XG59XG5pbml0Rm9yTm9uQnJvd3NlckFwcCgpO1xuXG4vLyBHbG9iYWwgY29uc3RhbnRzXG5jb25zdCBQUk9UT0NPTF9WRVJTSU9OID0gJzAnOyAvLyBNYWpvciBjb21wb25lbnQgb2YgdGhlIHZlcnNpb24sIGUuZy4gJzAnIGluICcwLjE3LjEnLlxuY29uc3QgVkVSU0lPTiA9IHBhY2thZ2VfdmVyc2lvbiB8fCAnMC4xNyc7XG5jb25zdCBMSUJSQVJZID0gJ3Rpbm9kZWpzLycgKyBWRVJTSU9OO1xuXG5jb25zdCBUT1BJQ19ORVcgPSAnbmV3JztcbmNvbnN0IFRPUElDX05FV19DSEFOID0gJ25jaCc7XG5jb25zdCBUT1BJQ19NRSA9ICdtZSc7XG5jb25zdCBUT1BJQ19GTkQgPSAnZm5kJztcbmNvbnN0IFRPUElDX1NZUyA9ICdzeXMnO1xuY29uc3QgVE9QSUNfQ0hBTiA9ICdjaG4nO1xuY29uc3QgVVNFUl9ORVcgPSAnbmV3JztcblxuLy8gU3RhcnRpbmcgdmFsdWUgb2YgYSBsb2NhbGx5LWdlbmVyYXRlZCBzZXFJZCB1c2VkIGZvciBwZW5kaW5nIG1lc3NhZ2VzLlxuY29uc3QgTE9DQUxfU0VRSUQgPSAweEZGRkZGRkY7XG5cbmNvbnN0IE1FU1NBR0VfU1RBVFVTX05PTkUgPSAwOyAvLyBTdGF0dXMgbm90IGFzc2lnbmVkLlxuY29uc3QgTUVTU0FHRV9TVEFUVVNfUVVFVUVEID0gMTsgLy8gTG9jYWwgSUQgYXNzaWduZWQsIGluIHByb2dyZXNzIHRvIGJlIHNlbnQuXG5jb25zdCBNRVNTQUdFX1NUQVRVU19TRU5ESU5HID0gMjsgLy8gVHJhbnNtaXNzaW9uIHN0YXJ0ZWQuXG5jb25zdCBNRVNTQUdFX1NUQVRVU19GQUlMRUQgPSAzOyAvLyBBdCBsZWFzdCBvbmUgYXR0ZW1wdCB3YXMgbWFkZSB0byBzZW5kIHRoZSBtZXNzYWdlLlxuY29uc3QgTUVTU0FHRV9TVEFUVVNfU0VOVCA9IDQ7IC8vIERlbGl2ZXJlZCB0byB0aGUgc2VydmVyLlxuY29uc3QgTUVTU0FHRV9TVEFUVVNfUkVDRUlWRUQgPSA1OyAvLyBSZWNlaXZlZCBieSB0aGUgY2xpZW50LlxuY29uc3QgTUVTU0FHRV9TVEFUVVNfUkVBRCA9IDY7IC8vIFJlYWQgYnkgdGhlIHVzZXIuXG5jb25zdCBNRVNTQUdFX1NUQVRVU19UT19NRSA9IDc7IC8vIE1lc3NhZ2UgZnJvbSBhbm90aGVyIHVzZXIuXG5cbi8vIFJlamVjdCB1bnJlc29sdmVkIGZ1dHVyZXMgYWZ0ZXIgdGhpcyBtYW55IG1pbGxpc2Vjb25kcy5cbmNvbnN0IEVYUElSRV9QUk9NSVNFU19USU1FT1VUID0gNTAwMDtcbi8vIFBlcmlvZGljaXR5IG9mIGdhcmJhZ2UgY29sbGVjdGlvbiBvZiB1bnJlc29sdmVkIGZ1dHVyZXMuXG5jb25zdCBFWFBJUkVfUFJPTUlTRVNfUEVSSU9EID0gMTAwMDtcblxuLy8gRGVmYXVsdCBudW1iZXIgb2YgbWVzc2FnZXMgdG8gcHVsbCBpbnRvIG1lbW9yeSBmcm9tIHBlcnNpc3RlbnQgY2FjaGUuXG5jb25zdCBERUZBVUxUX01FU1NBR0VTX1BBR0UgPSAyNDtcblxuLy8gVXRpbGl0eSBmdW5jdGlvbnNcblxuLy8gUG9seWZpbGwgZm9yIG5vbi1icm93c2VyIGNvbnRleHQsIGUuZy4gTm9kZUpzLlxuZnVuY3Rpb24gaW5pdEZvck5vbkJyb3dzZXJBcHAoKSB7XG4gIC8vIFRpbm9kZSByZXF1aXJlbWVudCBpbiBuYXRpdmUgbW9kZSBiZWNhdXNlIHJlYWN0IG5hdGl2ZSBkb2Vzbid0IHByb3ZpZGUgQmFzZTY0IG1ldGhvZFxuICBjb25zdCBjaGFycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPSc7XG5cbiAgaWYgKHR5cGVvZiBidG9hID09ICd1bmRlZmluZWQnKSB7XG4gICAgZ2xvYmFsLmJ0b2EgPSBmdW5jdGlvbihpbnB1dCA9ICcnKSB7XG4gICAgICBsZXQgc3RyID0gaW5wdXQ7XG4gICAgICBsZXQgb3V0cHV0ID0gJyc7XG5cbiAgICAgIGZvciAobGV0IGJsb2NrID0gMCwgY2hhckNvZGUsIGkgPSAwLCBtYXAgPSBjaGFyczsgc3RyLmNoYXJBdChpIHwgMCkgfHwgKG1hcCA9ICc9JywgaSAlIDEpOyBvdXRwdXQgKz0gbWFwLmNoYXJBdCg2MyAmIGJsb2NrID4+IDggLSBpICUgMSAqIDgpKSB7XG5cbiAgICAgICAgY2hhckNvZGUgPSBzdHIuY2hhckNvZGVBdChpICs9IDMgLyA0KTtcblxuICAgICAgICBpZiAoY2hhckNvZGUgPiAweEZGKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ2J0b2EnIGZhaWxlZDogVGhlIHN0cmluZyB0byBiZSBlbmNvZGVkIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3V0c2lkZSBvZiB0aGUgTGF0aW4xIHJhbmdlLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJsb2NrID0gYmxvY2sgPDwgOCB8IGNoYXJDb2RlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG4gIH1cblxuICBpZiAodHlwZW9mIGF0b2IgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBnbG9iYWwuYXRvYiA9IGZ1bmN0aW9uKGlucHV0ID0gJycpIHtcbiAgICAgIGxldCBzdHIgPSBpbnB1dC5yZXBsYWNlKC89KyQvLCAnJyk7XG4gICAgICBsZXQgb3V0cHV0ID0gJyc7XG5cbiAgICAgIGlmIChzdHIubGVuZ3RoICUgNCA9PSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIidhdG9iJyBmYWlsZWQ6IFRoZSBzdHJpbmcgdG8gYmUgZGVjb2RlZCBpcyBub3QgY29ycmVjdGx5IGVuY29kZWQuXCIpO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgYmMgPSAwLCBicyA9IDAsIGJ1ZmZlciwgaSA9IDA7IGJ1ZmZlciA9IHN0ci5jaGFyQXQoaSsrKTtcblxuICAgICAgICB+YnVmZmVyICYmIChicyA9IGJjICUgNCA/IGJzICogNjQgKyBidWZmZXIgOiBidWZmZXIsXG4gICAgICAgICAgYmMrKyAlIDQpID8gb3V0cHV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoMjU1ICYgYnMgPj4gKC0yICogYmMgJiA2KSkgOiAwXG4gICAgICApIHtcbiAgICAgICAgYnVmZmVyID0gY2hhcnMuaW5kZXhPZihidWZmZXIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG4gIH1cblxuICBpZiAodHlwZW9mIHdpbmRvdyA9PSAndW5kZWZpbmVkJykge1xuICAgIGdsb2JhbC53aW5kb3cgPSB7XG4gICAgICBXZWJTb2NrZXQ6IFdlYlNvY2tldFByb3ZpZGVyLFxuICAgICAgWE1MSHR0cFJlcXVlc3Q6IFhIUlByb3ZpZGVyLFxuICAgICAgVVJMOiB7XG4gICAgICAgIGNyZWF0ZU9iamVjdFVSTDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIHVzZSBVUkwuY3JlYXRlT2JqZWN0VVJMIGluIGEgbm9uLWJyb3dzZXIgYXBwbGljYXRpb25cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBDb25uZWN0aW9uLnNldE5ldHdvcmtQcm92aWRlcnMoV2ViU29ja2V0UHJvdmlkZXIsIFhIUlByb3ZpZGVyKTtcbn1cblxuLy8gUkZDMzMzOSBmb3JtYXRlciBvZiBEYXRlXG5mdW5jdGlvbiByZmMzMzM5RGF0ZVN0cmluZyhkKSB7XG4gIGlmICghZCB8fCBkLmdldFRpbWUoKSA9PSAwKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhZCh2YWwsIHNwKSB7XG4gICAgc3AgPSBzcCB8fCAyO1xuICAgIHJldHVybiAnMCcucmVwZWF0KHNwIC0gKCcnICsgdmFsKS5sZW5ndGgpICsgdmFsO1xuICB9XG5cbiAgY29uc3QgbWlsbGlzID0gZC5nZXRVVENNaWxsaXNlY29uZHMoKTtcbiAgcmV0dXJuIGQuZ2V0VVRDRnVsbFllYXIoKSArICctJyArIHBhZChkLmdldFVUQ01vbnRoKCkgKyAxKSArICctJyArIHBhZChkLmdldFVUQ0RhdGUoKSkgK1xuICAgICdUJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICsgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgK1xuICAgIChtaWxsaXMgPyAnLicgKyBwYWQobWlsbGlzLCAzKSA6ICcnKSArICdaJztcbn1cblxuLy8gYnRvYSByZXBsYWNlbWVudC4gU3RvY2sgYnRvYSBmYWlscyBvbiBvbiBub24tTGF0aW4xIHN0cmluZ3MuXG5mdW5jdGlvbiBiNjRFbmNvZGVVbmljb2RlKHN0cikge1xuICAvLyBUaGUgZW5jb2RlVVJJQ29tcG9uZW50IHBlcmNlbnQtZW5jb2RlcyBVVEYtOCBzdHJpbmcsXG4gIC8vIHRoZW4gdGhlIHBlcmNlbnQgZW5jb2RpbmcgaXMgY29udmVydGVkIGludG8gcmF3IGJ5dGVzIHdoaWNoXG4gIC8vIGNhbiBiZSBmZWQgaW50byBidG9hLlxuICByZXR1cm4gYnRvYShlbmNvZGVVUklDb21wb25lbnQoc3RyKS5yZXBsYWNlKC8lKFswLTlBLUZdezJ9KS9nLFxuICAgIGZ1bmN0aW9uIHRvU29saWRCeXRlcyhtYXRjaCwgcDEpIHtcbiAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKCcweCcgKyBwMSk7XG4gICAgfSkpO1xufVxuXG4vLyBSZWN1cnNpdmVseSBtZXJnZSBzcmMncyBvd24gcHJvcGVydGllcyB0byBkc3QuXG4vLyBJZ25vcmUgcHJvcGVydGllcyB3aGVyZSBpZ25vcmVbcHJvcGVydHldIGlzIHRydWUuXG4vLyBBcnJheSBhbmQgRGF0ZSBvYmplY3RzIGFyZSBzaGFsbG93LWNvcGllZC5cbmZ1bmN0aW9uIG1lcmdlT2JqKGRzdCwgc3JjLCBpZ25vcmUpIHtcbiAgaWYgKHR5cGVvZiBzcmMgIT0gJ29iamVjdCcpIHtcbiAgICBpZiAoc3JjID09PSBUaW5vZGUuREVMX0NIQVIpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChzcmMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGRzdDtcbiAgICB9XG4gICAgcmV0dXJuIHNyYztcbiAgfVxuICAvLyBKUyBpcyBjcmF6eTogdHlwZW9mIG51bGwgaXMgJ29iamVjdCcuXG4gIGlmIChzcmMgPT09IG51bGwpIHtcbiAgICByZXR1cm4gc3JjO1xuICB9XG5cbiAgLy8gSGFuZGxlIERhdGVcbiAgaWYgKHNyYyBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gKCFkc3QgfHwgIShkc3QgaW5zdGFuY2VvZiBEYXRlKSB8fCBkc3QgPCBzcmMpID8gc3JjIDogZHN0O1xuICB9XG5cbiAgLy8gQWNjZXNzIG1vZGVcbiAgaWYgKHNyYyBpbnN0YW5jZW9mIEFjY2Vzc01vZGUpIHtcbiAgICByZXR1cm4gbmV3IEFjY2Vzc01vZGUoc3JjKTtcbiAgfVxuXG4gIC8vIEhhbmRsZSBBcnJheVxuICBpZiAoc3JjIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICByZXR1cm4gc3JjO1xuICB9XG5cbiAgaWYgKCFkc3QgfHwgZHN0ID09PSBUaW5vZGUuREVMX0NIQVIpIHtcbiAgICBkc3QgPSBzcmMuY29uc3RydWN0b3IoKTtcbiAgfVxuXG4gIGZvciAobGV0IHByb3AgaW4gc3JjKSB7XG4gICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShwcm9wKSAmJlxuICAgICAgKCFpZ25vcmUgfHwgIWlnbm9yZVtwcm9wXSkgJiZcbiAgICAgIChwcm9wICE9ICdfbm9Gb3J3YXJkaW5nJykpIHtcblxuICAgICAgZHN0W3Byb3BdID0gbWVyZ2VPYmooZHN0W3Byb3BdLCBzcmNbcHJvcF0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZHN0O1xufVxuXG4vLyBVcGRhdGUgb2JqZWN0IHN0b3JlZCBpbiBhIGNhY2hlLiBSZXR1cm5zIHVwZGF0ZWQgdmFsdWUuXG5mdW5jdGlvbiBtZXJnZVRvQ2FjaGUoY2FjaGUsIGtleSwgbmV3dmFsLCBpZ25vcmUpIHtcbiAgY2FjaGVba2V5XSA9IG1lcmdlT2JqKGNhY2hlW2tleV0sIG5ld3ZhbCwgaWdub3JlKTtcbiAgcmV0dXJuIGNhY2hlW2tleV07XG59XG5cbmZ1bmN0aW9uIHN0cmluZ1RvRGF0ZShvYmopIHtcbiAgaWYgKHR5cGVvZiBvYmouY3JlYXRlZCA9PSAnc3RyaW5nJykge1xuICAgIG9iai5jcmVhdGVkID0gbmV3IERhdGUob2JqLmNyZWF0ZWQpO1xuICB9XG4gIGlmICh0eXBlb2Ygb2JqLnVwZGF0ZWQgPT0gJ3N0cmluZycpIHtcbiAgICBvYmoudXBkYXRlZCA9IG5ldyBEYXRlKG9iai51cGRhdGVkKTtcbiAgfVxuICBpZiAodHlwZW9mIG9iai50b3VjaGVkID09ICdzdHJpbmcnKSB7XG4gICAgb2JqLnRvdWNoZWQgPSBuZXcgRGF0ZShvYmoudG91Y2hlZCk7XG4gIH1cbn1cblxuLy8gSlNPTiBzdHJpbmdpZnkgaGVscGVyIC0gcHJlLXByb2Nlc3NvciBmb3IgSlNPTi5zdHJpbmdpZnlcbmZ1bmN0aW9uIGpzb25CdWlsZEhlbHBlcihrZXksIHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIC8vIENvbnZlcnQgamF2YXNjcmlwdCBEYXRlIG9iamVjdHMgdG8gcmZjMzMzOSBzdHJpbmdzXG4gICAgdmFsID0gcmZjMzMzOURhdGVTdHJpbmcodmFsKTtcbiAgfSBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBBY2Nlc3NNb2RlKSB7XG4gICAgdmFsID0gdmFsLmpzb25IZWxwZXIoKTtcbiAgfSBlbHNlIGlmICh2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09IG51bGwgfHwgdmFsID09PSBmYWxzZSB8fFxuICAgIChBcnJheS5pc0FycmF5KHZhbCkgJiYgdmFsLmxlbmd0aCA9PSAwKSB8fFxuICAgICgodHlwZW9mIHZhbCA9PSAnb2JqZWN0JykgJiYgKE9iamVjdC5rZXlzKHZhbCkubGVuZ3RoID09IDApKSkge1xuICAgIC8vIHN0cmlwIG91dCBlbXB0eSBlbGVtZW50cyB3aGlsZSBzZXJpYWxpemluZyBvYmplY3RzIHRvIEpTT05cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIHZhbDtcbn07XG5cbi8vIFN0cmlwcyBhbGwgdmFsdWVzIGZyb20gYW4gb2JqZWN0IG9mIHRoZXkgZXZhbHVhdGUgdG8gZmFsc2Ugb3IgaWYgdGhlaXIgbmFtZSBzdGFydHMgd2l0aCAnXycuXG5mdW5jdGlvbiBzaW1wbGlmeShvYmopIHtcbiAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmIChrZXlbMF0gPT0gJ18nKSB7XG4gICAgICAvLyBTdHJpcCBmaWVsZHMgbGlrZSBcIm9iai5fa2V5XCIuXG4gICAgICBkZWxldGUgb2JqW2tleV07XG4gICAgfSBlbHNlIGlmICghb2JqW2tleV0pIHtcbiAgICAgIC8vIFN0cmlwIGZpZWxkcyB3aGljaCBldmFsdWF0ZSB0byBmYWxzZS5cbiAgICAgIGRlbGV0ZSBvYmpba2V5XTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqW2tleV0pICYmIG9ialtrZXldLmxlbmd0aCA9PSAwKSB7XG4gICAgICAvLyBTdHJpcCBlbXB0eSBhcnJheXMuXG4gICAgICBkZWxldGUgb2JqW2tleV07XG4gICAgfSBlbHNlIGlmICghb2JqW2tleV0pIHtcbiAgICAgIC8vIFN0cmlwIGZpZWxkcyB3aGljaCBldmFsdWF0ZSB0byBmYWxzZS5cbiAgICAgIGRlbGV0ZSBvYmpba2V5XTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmpba2V5XSA9PSAnb2JqZWN0JyAmJiAhKG9ialtrZXldIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgIHNpbXBsaWZ5KG9ialtrZXldKTtcbiAgICAgIC8vIFN0cmlwIGVtcHR5IG9iamVjdHMuXG4gICAgICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqW2tleV0pLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGRlbGV0ZSBvYmpba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuLy8gVHJpbSB3aGl0ZXNwYWNlLCBzdHJpcCBlbXB0eSBhbmQgZHVwbGljYXRlIGVsZW1lbnRzIGVsZW1lbnRzLlxuLy8gSWYgdGhlIHJlc3VsdCBpcyBhbiBlbXB0eSBhcnJheSwgYWRkIGEgc2luZ2xlIGVsZW1lbnQgXCJcXHUyNDIxXCIgKFVuaWNvZGUgRGVsIGNoYXJhY3RlcikuXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShhcnIpIHtcbiAgbGV0IG91dCA9IFtdO1xuICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgLy8gVHJpbSwgdGhyb3cgYXdheSB2ZXJ5IHNob3J0IGFuZCBlbXB0eSB0YWdzLlxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gYXJyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGV0IHQgPSBhcnJbaV07XG4gICAgICBpZiAodCkge1xuICAgICAgICB0ID0gdC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKHQubGVuZ3RoID4gMSkge1xuICAgICAgICAgIG91dC5wdXNoKHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIG91dC5zb3J0KCkuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0sIHBvcywgYXJ5KSB7XG4gICAgICByZXR1cm4gIXBvcyB8fCBpdGVtICE9IGFyeVtwb3MgLSAxXTtcbiAgICB9KTtcbiAgfVxuICBpZiAob3V0Lmxlbmd0aCA9PSAwKSB7XG4gICAgLy8gQWRkIHNpbmdsZSB0YWcgd2l0aCBhIFVuaWNvZGUgRGVsIGNoYXJhY3Rlciwgb3RoZXJ3aXNlIGFuIGFtcHR5IGFycmF5XG4gICAgLy8gaXMgYW1iaWd1b3MuIFRoZSBEZWwgdGFnIHdpbGwgYmUgc3RyaXBwZWQgYnkgdGhlIHNlcnZlci5cbiAgICBvdXQucHVzaChUaW5vZGUuREVMX0NIQVIpO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8vIEF0dGVtcHQgdG8gY29udmVydCBkYXRlIHN0cmluZ3MgdG8gb2JqZWN0cy5cbmZ1bmN0aW9uIGpzb25QYXJzZUhlbHBlcihrZXksIHZhbCkge1xuICAvLyBDb252ZXJ0IHN0cmluZyB0aW1lc3RhbXBzIHdpdGggb3B0aW9uYWwgbWlsbGlzZWNvbmRzIHRvIERhdGVcbiAgLy8gMjAxNS0wOS0wMlQwMTo0NTo0M1suMTIzXVpcbiAgaWYgKGtleSA9PT0gJ3RzJyAmJiB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyAmJlxuICAgIHZhbC5sZW5ndGggPj0gMjAgJiYgdmFsLmxlbmd0aCA8PSAyNCkge1xuICAgIGxldCBkYXRlID0gbmV3IERhdGUodmFsKTtcbiAgICBpZiAoZGF0ZSkge1xuICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuICB9IGVsc2UgaWYgKGtleSA9PT0gJ2FjcycgJiYgdHlwZW9mIHZhbCA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gbmV3IEFjY2Vzc01vZGUodmFsKTtcbiAgfVxuICByZXR1cm4gdmFsO1xufTtcblxuLy8gVHJpbXMgdmVyeSBsb25nIHN0cmluZ3MgKGVuY29kZWQgaW1hZ2VzKSB0byBtYWtlIGxvZ2dlZCBwYWNrZXRzIG1vcmUgcmVhZGFibGUuXG5mdW5jdGlvbiBqc29uTG9nZ2VySGVscGVyKGtleSwgdmFsKSB7XG4gIGlmICh0eXBlb2YgdmFsID09ICdzdHJpbmcnICYmIHZhbC5sZW5ndGggPiAxMjgpIHtcbiAgICByZXR1cm4gJzwnICsgdmFsLmxlbmd0aCArICcsIGJ5dGVzOiAnICsgdmFsLnN1YnN0cmluZygwLCAxMikgKyAnLi4uJyArIHZhbC5zdWJzdHJpbmcodmFsLmxlbmd0aCAtIDEyKSArICc+JztcbiAgfVxuICByZXR1cm4ganNvbkJ1aWxkSGVscGVyKGtleSwgdmFsKTtcbn07XG5cbi8vIFBhcnNlIGJyb3dzZXIgdXNlciBhZ2VudCB0byBleHRyYWN0IGJyb3dzZXIgbmFtZSBhbmQgdmVyc2lvbi5cbmZ1bmN0aW9uIGdldEJyb3dzZXJJbmZvKHVhLCBwcm9kdWN0KSB7XG4gIHVhID0gdWEgfHwgJyc7XG4gIGxldCByZWFjdG5hdGl2ZSA9ICcnO1xuICAvLyBDaGVjayBpZiB0aGlzIGlzIGEgUmVhY3ROYXRpdmUgYXBwLlxuICBpZiAoL3JlYWN0bmF0aXZlL2kudGVzdChwcm9kdWN0KSkge1xuICAgIHJlYWN0bmF0aXZlID0gJ1JlYWN0TmF0aXZlOyAnO1xuICB9XG4gIC8vIFRoZW4gdGVzdCBmb3IgV2ViS2l0IGJhc2VkIGJyb3dzZXIuXG4gIHVhID0gdWEucmVwbGFjZSgnIChLSFRNTCwgbGlrZSBHZWNrbyknLCAnJyk7XG4gIGxldCBtID0gdWEubWF0Y2goLyhBcHBsZVdlYktpdFxcL1suXFxkXSspL2kpO1xuICBsZXQgcmVzdWx0O1xuICBpZiAobSkge1xuICAgIC8vIExpc3Qgb2YgY29tbW9uIHN0cmluZ3MsIGZyb20gbW9yZSB1c2VmdWwgdG8gbGVzcyB1c2VmdWwuXG4gICAgbGV0IHByaW9yaXR5ID0gWydjaHJvbWUnLCAnc2FmYXJpJywgJ21vYmlsZScsICd2ZXJzaW9uJ107XG4gICAgbGV0IHRtcCA9IHVhLnN1YnN0cihtLmluZGV4ICsgbVswXS5sZW5ndGgpLnNwbGl0KCcgJyk7XG4gICAgbGV0IHRva2VucyA9IFtdO1xuICAgIC8vIFNwbGl0IE5hbWUvMC4wLjAgaW50byBOYW1lIGFuZCB2ZXJzaW9uIDAuMC4wXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBtMiA9IC8oW1xcdy5dKylbXFwvXShbXFwuXFxkXSspLy5leGVjKHRtcFtpXSk7XG4gICAgICBpZiAobTIpIHtcbiAgICAgICAgdG9rZW5zLnB1c2goW20yWzFdLCBtMlsyXSwgcHJpb3JpdHkuZmluZEluZGV4KGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICByZXR1cm4gKGUgPT0gbTJbMV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIH0pXSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFNvcnQgYnkgcHJpb3JpdHk6IG1vcmUgaW50ZXJlc3RpbmcgaXMgZWFybGllciB0aGFuIGxlc3MgaW50ZXJlc3RpbmcuXG4gICAgdG9rZW5zLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgbGV0IGRpZmYgPSBhWzJdIC0gYlsyXTtcbiAgICAgIHJldHVybiBkaWZmICE9IDAgPyBkaWZmIDogYlswXS5sZW5ndGggLSBhWzBdLmxlbmd0aDtcbiAgICB9KTtcbiAgICBpZiAodG9rZW5zLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIFJldHVybiB0aGUgbGVhc3QgY29tbW9uIGJyb3dzZXIgc3RyaW5nIGFuZCB2ZXJzaW9uLlxuICAgICAgcmVzdWx0ID0gdG9rZW5zWzBdWzBdICsgJy8nICsgdG9rZW5zWzBdWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBGYWlsZWQgdG8gSUQgdGhlIGJyb3dzZXIuIFJldHVybiB0aGUgd2Via2l0IHZlcnNpb24uXG4gICAgICByZXN1bHQgPSBtWzFdO1xuICAgIH1cbiAgICAvLyBUZXN0IGZvciBNU0lFLlxuICB9IGVsc2UgaWYgKC90cmlkZW50L2kudGVzdCh1YSkpIHtcbiAgICBtID0gLyg/OlxcYnJ2WyA6XSsoWy5cXGRdKykpfCg/OlxcYk1TSUUgKFsuXFxkXSspKS9nLmV4ZWModWEpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXN1bHQgPSAnTVNJRS8nICsgKG1bMV0gfHwgbVsyXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9ICdNU0lFLz8nO1xuICAgIH1cbiAgICAvLyBUZXN0IGZvciBGaXJlZm94LlxuICB9IGVsc2UgaWYgKC9maXJlZm94L2kudGVzdCh1YSkpIHtcbiAgICBtID0gL0ZpcmVmb3hcXC8oWy5cXGRdKykvZy5leGVjKHVhKTtcbiAgICBpZiAobSkge1xuICAgICAgcmVzdWx0ID0gJ0ZpcmVmb3gvJyArIG1bMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9ICdGaXJlZm94Lz8nO1xuICAgIH1cbiAgICAvLyBPbGRlciBPcGVyYS5cbiAgfSBlbHNlIGlmICgvcHJlc3RvL2kudGVzdCh1YSkpIHtcbiAgICBtID0gL09wZXJhXFwvKFsuXFxkXSspL2cuZXhlYyh1YSk7XG4gICAgaWYgKG0pIHtcbiAgICAgIHJlc3VsdCA9ICdPcGVyYS8nICsgbVsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gJ09wZXJhLz8nO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBGYWlsZWQgdG8gcGFyc2UgYW55dGhpbmcgbWVhbmluZ2Z1bGwuIFRyeSB0aGUgbGFzdCByZXNvcnQuXG4gICAgbSA9IC8oW1xcdy5dKylcXC8oWy5cXGRdKykvLmV4ZWModWEpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXN1bHQgPSBtWzFdICsgJy8nICsgbVsyXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHVhLnNwbGl0KCcgJyk7XG4gICAgICByZXN1bHQgPSBtWzBdO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNob3J0ZW4gdGhlIHZlcnNpb24gdG8gb25lIGRvdCAnYS5iYi5jY2MuZCAtPiBhLmJiJyBhdCBtb3N0LlxuICBtID0gcmVzdWx0LnNwbGl0KCcvJyk7XG4gIGlmIChtLmxlbmd0aCA+IDEpIHtcbiAgICBsZXQgdiA9IG1bMV0uc3BsaXQoJy4nKTtcbiAgICByZXN1bHQgPSBtWzBdICsgJy8nICsgdlswXSArICh2WzFdID8gJy4nICsgdlsxXSA6ICcnKTtcbiAgfVxuICByZXR1cm4gcmVhY3RuYXRpdmUgKyByZXN1bHQ7XG59XG5cbi8qKlxuICogQGNsYXNzIFRpbm9kZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgLSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFwcE5hbWUgLSBOYW1lIG9mIHRoZSBjYWxsaW5nIGFwcGxpY2F0aW9uIHRvIGJlIHJlcG9ydGVkIGluIHRoZSBVc2VyIEFnZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5ob3N0IC0gSG9zdCBuYW1lIGFuZCBwb3J0IG51bWJlciB0byBjb25uZWN0IHRvLlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hcGlLZXkgLSBBUEkga2V5IGdlbmVyYXRlZCBieSA8Y29kZT5rZXlnZW48L2NvZGU+LlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy50cmFuc3BvcnQgLSBTZWUge0BsaW5rIFRpbm9kZS5Db25uZWN0aW9uI3RyYW5zcG9ydH0uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNvbmZpZy5zZWN1cmUgLSBVc2UgU2VjdXJlIFdlYlNvY2tldCBpZiA8Y29kZT50cnVlPC9jb2RlPi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcucGxhdGZvcm0gLSBPcHRpb25hbCBwbGF0Zm9ybSBpZGVudGlmaWVyLCBvbmUgb2YgPGNvZGU+XCJpb3NcIjwvY29kZT4sIDxjb2RlPlwid2ViXCI8L2NvZGU+LCA8Y29kZT5cImFuZHJvaWRcIjwvY29kZT4uXG4gKiBAcGFyYW0ge2Jvb2xlbn0gY29uZmlnLnBlcnNpc3QgLSB1c2UgaW5kZXhEQiBwZXJzaXN0ZW50IHN0b3JhZ2UuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvbkNvbXBsZXRlIC0gY2FsbGJhY2sgdG8gY2FsbCB3aGVuIGluaXRpYWxpemF0aW9uIGlzIGNvbXBsZXRlZC5cbiAqL1xudmFyIFRpbm9kZSA9IGZ1bmN0aW9uKGNvbmZpZywgb25Db21wbGV0ZSkge1xuICAvLyBDbGllbnQtcHJvdmlkZWQgYXBwbGljYXRpb24gbmFtZSwgZm9ybWF0IDxOYW1lPi88dmVyc2lvbiBudW1iZXI+XG4gIHRoaXMuX2FwcE5hbWUgPSBjb25maWcuYXBwTmFtZSB8fCBcIlVuZGVmaW5lZFwiO1xuXG4gIC8vIEFQSSBLZXkuXG4gIHRoaXMuX2FwaUtleSA9IGNvbmZpZy5hcGlLZXk7XG5cbiAgLy8gTmFtZSBhbmQgdmVyc2lvbiBvZiB0aGUgYnJvd3Nlci5cbiAgdGhpcy5fYnJvd3NlciA9ICcnO1xuICB0aGlzLl9wbGF0Zm9ybSA9IGNvbmZpZy5wbGF0Zm9ybSB8fCAnd2ViJztcbiAgdGhpcy5faHdvcyA9ICd1bmRlZmluZWQnO1xuICB0aGlzLl9odW1hbkxhbmd1YWdlID0gJ3h4JztcbiAgLy8gVW5kZXJseWluZyBPUy5cbiAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLl9icm93c2VyID0gZ2V0QnJvd3NlckluZm8obmF2aWdhdG9yLnVzZXJBZ2VudCwgbmF2aWdhdG9yLnByb2R1Y3QpO1xuICAgIHRoaXMuX2h3b3MgPSBuYXZpZ2F0b3IucGxhdGZvcm07XG4gICAgLy8gVGhpcyBpcyB0aGUgZGVmYXVsdCBsYW5ndWFnZS4gSXQgY291bGQgYmUgY2hhbmdlZCBieSBjbGllbnQuXG4gICAgdGhpcy5faHVtYW5MYW5ndWFnZSA9IG5hdmlnYXRvci5sYW5ndWFnZSB8fCAnZW4tVVMnO1xuICB9XG4gIC8vIExvZ2dpbmcgdG8gY29uc29sZSBlbmFibGVkXG4gIHRoaXMuX2xvZ2dpbmdFbmFibGVkID0gZmFsc2U7XG4gIC8vIFdoZW4gbG9nZ2luZywgdHJpcCBsb25nIHN0cmluZ3MgKGJhc2U2NC1lbmNvZGVkIGltYWdlcykgZm9yIHJlYWRhYmlsaXR5XG4gIHRoaXMuX3RyaW1Mb25nU3RyaW5ncyA9IGZhbHNlO1xuICAvLyBVSUQgb2YgdGhlIGN1cnJlbnRseSBhdXRoZW50aWNhdGVkIHVzZXIuXG4gIHRoaXMuX215VUlEID0gbnVsbDtcbiAgLy8gU3RhdHVzIG9mIGNvbm5lY3Rpb246IGF1dGhlbnRpY2F0ZWQgb3Igbm90LlxuICB0aGlzLl9hdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gIC8vIExvZ2luIHVzZWQgaW4gdGhlIGxhc3Qgc3VjY2Vzc2Z1bCBiYXNpYyBhdXRoZW50aWNhdGlvblxuICB0aGlzLl9sb2dpbiA9IG51bGw7XG4gIC8vIFRva2VuIHdoaWNoIGNhbiBiZSB1c2VkIGZvciBsb2dpbiBpbnN0ZWFkIG9mIGxvZ2luL3Bhc3N3b3JkLlxuICB0aGlzLl9hdXRoVG9rZW4gPSBudWxsO1xuICAvLyBDb3VudGVyIG9mIHJlY2VpdmVkIHBhY2tldHNcbiAgdGhpcy5faW5QYWNrZXRDb3VudCA9IDA7XG4gIC8vIENvdW50ZXIgZm9yIGdlbmVyYXRpbmcgdW5pcXVlIG1lc3NhZ2UgSURzXG4gIHRoaXMuX21lc3NhZ2VJZCA9IE1hdGguZmxvb3IoKE1hdGgucmFuZG9tKCkgKiAweEZGRkYpICsgMHhGRkZGKTtcbiAgLy8gSW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlcnZlciwgaWYgY29ubmVjdGVkXG4gIHRoaXMuX3NlcnZlckluZm8gPSBudWxsO1xuICAvLyBQdXNoIG5vdGlmaWNhdGlvbiB0b2tlbi4gQ2FsbGVkIGRldmljZVRva2VuIGZvciBjb25zaXN0ZW5jeSB3aXRoIHRoZSBBbmRyb2lkIFNESy5cbiAgdGhpcy5fZGV2aWNlVG9rZW4gPSBudWxsO1xuXG4gIC8vIENhY2hlIG9mIHBlbmRpbmcgcHJvbWlzZXMgYnkgbWVzc2FnZSBpZC5cbiAgdGhpcy5fcGVuZGluZ1Byb21pc2VzID0ge307XG5cbiAgLy8gVGhlIFRpbWVvdXQgb2JqZWN0IHJldHVybmVkIGJ5IHRoZSByZWplY3QgZXhwaXJlZCBwcm9taXNlcyBzZXRJbnRlcnZhbC5cbiAgdGhpcy5fZXhwaXJlUHJvbWlzZXMgPSBudWxsO1xuXG4gIC8qKiBBIGNvbm5lY3Rpb24gb2JqZWN0LCBzZWUge0BsaW5rIFRpbm9kZS5Db25uZWN0aW9ufS4gKi9cbiAgdGhpcy5fY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKGNvbmZpZy5ob3N0LCBjb25maWcuYXBpS2V5LCBjb25maWcudHJhbnNwb3J0LCBjb25maWcuc2VjdXJlLCB0cnVlKTtcbiAgLy8gQ29uc29sZSBsb2dnZXIuIEJhYmVsIHNvbWVob3cgZmFpbHMgdG8gcGFyc2UgJy4uLnJlc3QnIHBhcmFtZXRlci5cbiAgdGhpcy5sb2dnZXIgPSAoc3RyLCAuLi5hcmdzKSA9PiB7XG4gICAgaWYgKHRoaXMuX2xvZ2dpbmdFbmFibGVkKSB7XG4gICAgICBjb25zdCBkID0gbmV3IERhdGUoKVxuICAgICAgY29uc3QgZGF0ZVN0cmluZyA9ICgnMCcgKyBkLmdldFVUQ0hvdXJzKCkpLnNsaWNlKC0yKSArICc6JyArXG4gICAgICAgICgnMCcgKyBkLmdldFVUQ01pbnV0ZXMoKSkuc2xpY2UoLTIpICsgJzonICtcbiAgICAgICAgKCcwJyArIGQuZ2V0VVRDU2Vjb25kcygpKS5zbGljZSgtMikgKyAnLicgK1xuICAgICAgICAoJzAwJyArIGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkpLnNsaWNlKC0zKTtcblxuICAgICAgY29uc29sZS5sb2coJ1snICsgZGF0ZVN0cmluZyArICddJywgc3RyLCBhcmdzLmpvaW4oJyAnKSk7XG4gICAgfVxuICB9XG4gIHRoaXMuX2Nvbm5lY3Rpb24ubG9nZ2VyID0gdGhpcy5sb2dnZXI7XG4gIERyYWZ0eS5sb2dnZXIgPSB0aGlzLmxvZ2dlcjtcblxuICAvLyBUaW1lc3RhbXAgb2YgdGhlIG1vc3QgcmVjZW50IHVwZGF0ZSB0byB0b3BpY3MgaW4gY2FjaGUuXG4gIHRoaXMuX2xhc3RUb3BpY1VwZGF0ZSA9IG51bGw7XG5cbiAgLy8gVGlub2RlJ3MgY2FjaGUgb2Ygb2JqZWN0c1xuICB0aGlzLl9jYWNoZSA9IHt9O1xuXG4gIGNvbnN0IGNhY2hlUHV0ID0gdGhpcy5jYWNoZVB1dCA9ICh0eXBlLCBuYW1lLCBvYmopID0+IHtcbiAgICB0aGlzLl9jYWNoZVt0eXBlICsgJzonICsgbmFtZV0gPSBvYmo7XG4gIH1cblxuICBjb25zdCBjYWNoZUdldCA9IHRoaXMuY2FjaGVHZXQgPSAodHlwZSwgbmFtZSkgPT4ge1xuICAgIHJldHVybiB0aGlzLl9jYWNoZVt0eXBlICsgJzonICsgbmFtZV07XG4gIH1cblxuICBjb25zdCBjYWNoZURlbCA9IHRoaXMuY2FjaGVEZWwgPSAodHlwZSwgbmFtZSkgPT4ge1xuICAgIGRlbGV0ZSB0aGlzLl9jYWNoZVt0eXBlICsgJzonICsgbmFtZV07XG4gIH1cbiAgLy8gRW51bWVyYXRlIGFsbCBpdGVtcyBpbiBjYWNoZSwgY2FsbCBmdW5jIGZvciBlYWNoIGl0ZW0uXG4gIC8vIEVudW1lcmF0aW9uIHN0b3BzIGlmIGZ1bmMgcmV0dXJucyB0cnVlLlxuICBjb25zdCBjYWNoZU1hcCA9IHRoaXMuY2FjaGVNYXAgPSAodHlwZSwgZnVuYywgY29udGV4dCkgPT4ge1xuICAgIGNvbnN0IGtleSA9IHR5cGUgPyB0eXBlICsgJzonIDogdW5kZWZpbmVkO1xuICAgIGZvciAobGV0IGlkeCBpbiB0aGlzLl9jYWNoZSkge1xuICAgICAgaWYgKCFrZXkgfHwgaWR4LmluZGV4T2Yoa2V5KSA9PSAwKSB7XG4gICAgICAgIGlmIChmdW5jLmNhbGwoY29udGV4dCwgdGhpcy5fY2FjaGVbaWR4XSwgaWR4KSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTWFrZSBsaW1pdGVkIGNhY2hlIG1hbmFnZW1lbnQgYXZhaWxhYmxlIHRvIHRvcGljLlxuICAvLyBDYWNoaW5nIHVzZXIucHVibGljIG9ubHkuIEV2ZXJ5dGhpbmcgZWxzZSBpcyBwZXItdG9waWMuXG4gIHRoaXMuYXR0YWNoQ2FjaGVUb1RvcGljID0gKHRvcGljKSA9PiB7XG4gICAgdG9waWMuX3Rpbm9kZSA9IHRoaXM7XG5cbiAgICB0b3BpYy5fY2FjaGVHZXRVc2VyID0gKHVpZCkgPT4ge1xuICAgICAgY29uc3QgcHViID0gY2FjaGVHZXQoJ3VzZXInLCB1aWQpO1xuICAgICAgaWYgKHB1Yikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVzZXI6IHVpZCxcbiAgICAgICAgICBwdWJsaWM6IG1lcmdlT2JqKHt9LCBwdWIpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG4gICAgdG9waWMuX2NhY2hlUHV0VXNlciA9ICh1aWQsIHVzZXIpID0+IHtcbiAgICAgIHJldHVybiBjYWNoZVB1dCgndXNlcicsIHVpZCwgbWVyZ2VPYmooe30sIHVzZXIucHVibGljKSk7XG4gICAgfTtcbiAgICB0b3BpYy5fY2FjaGVEZWxVc2VyID0gKHVpZCkgPT4ge1xuICAgICAgcmV0dXJuIGNhY2hlRGVsKCd1c2VyJywgdWlkKTtcbiAgICB9O1xuICAgIHRvcGljLl9jYWNoZVB1dFNlbGYgPSAoKSA9PiB7XG4gICAgICBpZiAodG9waWMudXBkYXRlZCAmJiB0b3BpYy51cGRhdGVkID4gdGhpcy5fbGFzdFRvcGljVXBkYXRlKSB7XG4gICAgICAgIHRoaXMuX2xhc3RUb3BpY1VwZGF0ZSA9IHRvcGljLnVwZGF0ZWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2FjaGVQdXQoJ3RvcGljJywgdG9waWMubmFtZSwgdG9waWMpO1xuICAgIH1cbiAgICB0b3BpYy5fY2FjaGVEZWxTZWxmID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGNhY2hlRGVsKCd0b3BpYycsIHRvcGljLm5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFVzZSBpbmRleERCIGZvciBjYWNoaW5nIHRvcGljcyBhbmQgbWVzc2FnZXMuXG4gIHRoaXMuX3BlcnNpc3QgPSBjb25maWcucGVyc2lzdDtcbiAgLy8gSW5pdGlhbGl6ZSBvYmplY3QgcmVnYXJkbGVzcy4gSXQgc2ltcGxpZmllcyB0aGUgY29kZS5cbiAgdGhpcy5fZGIgPSBEQkNhY2hlKChlcnIpID0+IHtcbiAgICB0aGlzLmxvZ2dlcihcIkRCXCIsIGVycik7XG4gIH0sIHRoaXMubG9nZ2VyKTtcblxuICBpZiAodGhpcy5fcGVyc2lzdCkge1xuICAgIC8vIENyZWF0ZSB0aGUgcGVyc2lzdGVudCBjYWNoZSBhbmQgcmVhZCB0b3BpY3MgaW50byBtZW1vcnkuXG4gICAgdGhpcy5fZGIuaW5pdERhdGFiYXNlKCkudGhlbigoKSA9PiB7XG4gICAgICAvLyBTdG9yZSBwcm9taXNlcyB0byBiZSByZXNvbHZlZCB3aGVuIG1lc3NhZ2VzIGxvYWQgaW50byBtZW1vcnkuXG4gICAgICBjb25zdCBtc2dzID0gW107XG4gICAgICAvLyBMb2FkIHRvcGljcyB0byBtZW1vcnkuXG4gICAgICByZXR1cm4gdGhpcy5fZGIubWFwVG9waWNzKChkYXRhKSA9PiB7XG4gICAgICAgIGxldCB0b3BpYyA9IHRoaXMuY2FjaGVHZXQoJ3RvcGljJywgZGF0YS5uYW1lKTtcbiAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLm5hbWUgPT0gVE9QSUNfTUUpIHtcbiAgICAgICAgICB0b3BpYyA9IG5ldyBUb3BpY01lKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5uYW1lID09IFRPUElDX0ZORCkge1xuICAgICAgICAgIHRvcGljID0gbmV3IFRvcGljRm5kKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9waWMgPSBuZXcgVG9waWMoZGF0YS5uYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2RiLmRlc2VyaWFsaXplVG9waWModG9waWMsIGRhdGEpO1xuICAgICAgICB0aGlzLmF0dGFjaENhY2hlVG9Ub3BpYyh0b3BpYyk7XG4gICAgICAgIHRvcGljLl9jYWNoZVB1dFNlbGYoKTtcbiAgICAgICAgLy8gUmVxdWVzdCB0byBsb2FkIG1lc3NhZ2VzIGFuZCBzYXZlIHRoZSBwcm9taXNlLlxuICAgICAgICBtc2dzLnB1c2godG9waWMuX2xvYWRNZXNzYWdlcyh0aGlzLl9kYikpO1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vIFdhaXQgZm9yIGFsbCBtZXNzYWdlcyB0byBsb2FkLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwobXNncyk7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKG9uQ29tcGxldGUpIHtcbiAgICAgICAgICBvbkNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2dnZXIoXCJQZXJzaXN0ZW50IGNhY2hlIGluaXRpYWxpemVkLlwiKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX2RiLmRpc2FibGUoKTtcbiAgfVxuXG4gIC8vIFJlc29sdmUgb3IgcmVqZWN0IGEgcGVuZGluZyBwcm9taXNlLlxuICAvLyBVbnJlc29sdmVkIHByb21pc2VzIGFyZSBzdG9yZWQgaW4gX3BlbmRpbmdQcm9taXNlcy5cbiAgY29uc3QgZXhlY1Byb21pc2UgPSAoaWQsIGNvZGUsIG9uT0ssIGVycm9yVGV4dCkgPT4ge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuX3BlbmRpbmdQcm9taXNlc1tpZF07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgZGVsZXRlIHRoaXMuX3BlbmRpbmdQcm9taXNlc1tpZF07XG4gICAgICBpZiAoY29kZSA+PSAyMDAgJiYgY29kZSA8IDQwMCkge1xuICAgICAgICBpZiAoY2FsbGJhY2tzLnJlc29sdmUpIHtcbiAgICAgICAgICBjYWxsYmFja3MucmVzb2x2ZShvbk9LKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjYWxsYmFja3MucmVqZWN0KSB7XG4gICAgICAgIGNhbGxiYWNrcy5yZWplY3QobmV3IEVycm9yKGAke2Vycm9yVGV4dH0gKCR7Y29kZX0pYCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEdlbmVyYXRvciBvZiBkZWZhdWx0IHByb21pc2VzIGZvciBzZW50IHBhY2tldHMuXG4gIGNvbnN0IG1ha2VQcm9taXNlID0gKGlkKSA9PiB7XG4gICAgbGV0IHByb21pc2UgPSBudWxsO1xuICAgIGlmIChpZCkge1xuICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgLy8gU3RvcmVkIGNhbGxiYWNrcyB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSByZXNwb25zZSBwYWNrZXQgd2l0aCB0aGlzIElkIGFycml2ZXNcbiAgICAgICAgdGhpcy5fcGVuZGluZ1Byb21pc2VzW2lkXSA9IHtcbiAgICAgICAgICAncmVzb2x2ZSc6IHJlc29sdmUsXG4gICAgICAgICAgJ3JlamVjdCc6IHJlamVjdCxcbiAgICAgICAgICAndHMnOiBuZXcgRGF0ZSgpXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIC8vIEdlbmVyYXRlcyB1bmlxdWUgbWVzc2FnZSBJRHNcbiAgY29uc3QgZ2V0TmV4dFVuaXF1ZUlkID0gdGhpcy5nZXROZXh0VW5pcXVlSWQgPSAoKSA9PiB7XG4gICAgcmV0dXJuICh0aGlzLl9tZXNzYWdlSWQgIT0gMCkgPyAnJyArIHRoaXMuX21lc3NhZ2VJZCsrIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gR2V0IFVzZXIgQWdlbnQgc3RyaW5nXG4gIGNvbnN0IGdldFVzZXJBZ2VudCA9ICgpID0+IHtcbiAgICByZXR1cm4gdGhpcy5fYXBwTmFtZSArICcgKCcgKyAodGhpcy5fYnJvd3NlciA/IHRoaXMuX2Jyb3dzZXIgKyAnOyAnIDogJycpICsgdGhpcy5faHdvcyArICcpOyAnICsgTElCUkFSWTtcbiAgfVxuXG4gIC8vIEdlbmVyYXRvciBvZiBwYWNrZXRzIHN0dWJzXG4gIHRoaXMuaW5pdFBhY2tldCA9ICh0eXBlLCB0b3BpYykgPT4ge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnaGknOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdoaSc6IHtcbiAgICAgICAgICAgICdpZCc6IGdldE5leHRVbmlxdWVJZCgpLFxuICAgICAgICAgICAgJ3Zlcic6IFZFUlNJT04sXG4gICAgICAgICAgICAndWEnOiBnZXRVc2VyQWdlbnQoKSxcbiAgICAgICAgICAgICdkZXYnOiB0aGlzLl9kZXZpY2VUb2tlbixcbiAgICAgICAgICAgICdsYW5nJzogdGhpcy5faHVtYW5MYW5ndWFnZSxcbiAgICAgICAgICAgICdwbGF0Zic6IHRoaXMuX3BsYXRmb3JtXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdhY2MnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdhY2MnOiB7XG4gICAgICAgICAgICAnaWQnOiBnZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICd1c2VyJzogbnVsbCxcbiAgICAgICAgICAgICdzY2hlbWUnOiBudWxsLFxuICAgICAgICAgICAgJ3NlY3JldCc6IG51bGwsXG4gICAgICAgICAgICAnbG9naW4nOiBmYWxzZSxcbiAgICAgICAgICAgICd0YWdzJzogbnVsbCxcbiAgICAgICAgICAgICdkZXNjJzoge30sXG4gICAgICAgICAgICAnY3JlZCc6IHt9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdsb2dpbic6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ2xvZ2luJzoge1xuICAgICAgICAgICAgJ2lkJzogZ2V0TmV4dFVuaXF1ZUlkKCksXG4gICAgICAgICAgICAnc2NoZW1lJzogbnVsbCxcbiAgICAgICAgICAgICdzZWNyZXQnOiBudWxsXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdzdWInOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdzdWInOiB7XG4gICAgICAgICAgICAnaWQnOiBnZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICd0b3BpYyc6IHRvcGljLFxuICAgICAgICAgICAgJ3NldCc6IHt9LFxuICAgICAgICAgICAgJ2dldCc6IHt9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdsZWF2ZSc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ2xlYXZlJzoge1xuICAgICAgICAgICAgJ2lkJzogZ2V0TmV4dFVuaXF1ZUlkKCksXG4gICAgICAgICAgICAndG9waWMnOiB0b3BpYyxcbiAgICAgICAgICAgICd1bnN1Yic6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdwdWInOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdwdWInOiB7XG4gICAgICAgICAgICAnaWQnOiBnZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICd0b3BpYyc6IHRvcGljLFxuICAgICAgICAgICAgJ25vZWNobyc6IGZhbHNlLFxuICAgICAgICAgICAgJ2hlYWQnOiBudWxsLFxuICAgICAgICAgICAgJ2NvbnRlbnQnOiB7fVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgY2FzZSAnZ2V0JzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAnZ2V0Jzoge1xuICAgICAgICAgICAgJ2lkJzogZ2V0TmV4dFVuaXF1ZUlkKCksXG4gICAgICAgICAgICAndG9waWMnOiB0b3BpYyxcbiAgICAgICAgICAgICd3aGF0JzogbnVsbCwgLy8gZGF0YSwgc3ViLCBkZXNjLCBzcGFjZSBzZXBhcmF0ZWQgbGlzdDsgdW5rbm93biBzdHJpbmdzIGFyZSBpZ25vcmVkXG4gICAgICAgICAgICAnZGVzYyc6IHt9LFxuICAgICAgICAgICAgJ3N1Yic6IHt9LFxuICAgICAgICAgICAgJ2RhdGEnOiB7fVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgY2FzZSAnc2V0JzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAnc2V0Jzoge1xuICAgICAgICAgICAgJ2lkJzogZ2V0TmV4dFVuaXF1ZUlkKCksXG4gICAgICAgICAgICAndG9waWMnOiB0b3BpYyxcbiAgICAgICAgICAgICdkZXNjJzoge30sXG4gICAgICAgICAgICAnc3ViJzoge30sXG4gICAgICAgICAgICAndGFncyc6IFtdXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdkZWwnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdkZWwnOiB7XG4gICAgICAgICAgICAnaWQnOiBnZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICd0b3BpYyc6IHRvcGljLFxuICAgICAgICAgICAgJ3doYXQnOiBudWxsLFxuICAgICAgICAgICAgJ2RlbHNlcSc6IG51bGwsXG4gICAgICAgICAgICAndXNlcic6IG51bGwsXG4gICAgICAgICAgICAnaGFyZCc6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdub3RlJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAnbm90ZSc6IHtcbiAgICAgICAgICAgIC8vIG5vIGlkIGJ5IGRlc2lnblxuICAgICAgICAgICAgJ3RvcGljJzogdG9waWMsXG4gICAgICAgICAgICAnd2hhdCc6IG51bGwsIC8vIG9uZSBvZiBcInJlY3ZcIiwgXCJyZWFkXCIsIFwia3BcIlxuICAgICAgICAgICAgJ3NlcSc6IHVuZGVmaW5lZCAvLyB0aGUgc2VydmVyLXNpZGUgbWVzc2FnZSBpZCBha25vd2xlZGdlZCBhcyByZWNlaXZlZCBvciByZWFkXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcGFja2V0IHR5cGUgcmVxdWVzdGVkOiAke3R5cGV9YCk7XG4gICAgfVxuICB9XG5cbiAgLy8gU2VuZCBhIHBhY2tldC4gSWYgcGFja2V0IGlkIGlzIHByb3ZpZGVkIHJldHVybiBhIHByb21pc2UuXG4gIHRoaXMuc2VuZCA9IChwa3QsIGlkKSA9PiB7XG4gICAgbGV0IHByb21pc2U7XG4gICAgaWYgKGlkKSB7XG4gICAgICBwcm9taXNlID0gbWFrZVByb21pc2UoaWQpO1xuICAgIH1cbiAgICBwa3QgPSBzaW1wbGlmeShwa3QpO1xuICAgIGxldCBtc2cgPSBKU09OLnN0cmluZ2lmeShwa3QpO1xuICAgIHRoaXMubG9nZ2VyKFwib3V0OiBcIiArICh0aGlzLl90cmltTG9uZ1N0cmluZ3MgPyBKU09OLnN0cmluZ2lmeShwa3QsIGpzb25Mb2dnZXJIZWxwZXIpIDogbXNnKSk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uc2VuZFRleHQobXNnKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIElmIHNlbmRUZXh0IHRocm93cywgd3JhcCB0aGUgZXJyb3IgaW4gYSBwcm9taXNlIG9yIHJldGhyb3cuXG4gICAgICBpZiAoaWQpIHtcbiAgICAgICAgZXhlY1Byb21pc2UoaWQsIENvbm5lY3Rpb24uTkVUV09SS19FUlJPUiwgbnVsbCwgZXJyLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIC8vIE9uIHN1Y2Nlc3NmdWwgbG9naW4gc2F2ZSBzZXJ2ZXItcHJvdmlkZWQgZGF0YS5cbiAgdGhpcy5sb2dpblN1Y2Nlc3NmdWwgPSAoY3RybCkgPT4ge1xuICAgIGlmICghY3RybC5wYXJhbXMgfHwgIWN0cmwucGFyYW1zLnVzZXIpIHtcbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH1cbiAgICAvLyBUaGlzIGlzIGEgcmVzcG9uc2UgdG8gYSBzdWNjZXNzZnVsIGxvZ2luLFxuICAgIC8vIGV4dHJhY3QgVUlEIGFuZCBzZWN1cml0eSB0b2tlbiwgc2F2ZSBpdCBpbiBUaW5vZGUgbW9kdWxlXG4gICAgdGhpcy5fbXlVSUQgPSBjdHJsLnBhcmFtcy51c2VyO1xuICAgIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSAoY3RybCAmJiBjdHJsLmNvZGUgPj0gMjAwICYmIGN0cmwuY29kZSA8IDMwMCk7XG4gICAgaWYgKGN0cmwucGFyYW1zICYmIGN0cmwucGFyYW1zLnRva2VuICYmIGN0cmwucGFyYW1zLmV4cGlyZXMpIHtcbiAgICAgIHRoaXMuX2F1dGhUb2tlbiA9IHtcbiAgICAgICAgdG9rZW46IGN0cmwucGFyYW1zLnRva2VuLFxuICAgICAgICBleHBpcmVzOiBuZXcgRGF0ZShjdHJsLnBhcmFtcy5leHBpcmVzKVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYXV0aFRva2VuID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vbkxvZ2luKSB7XG4gICAgICB0aGlzLm9uTG9naW4oY3RybC5jb2RlLCBjdHJsLnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBjdHJsO1xuICB9XG5cbiAgLy8gVGhlIG1haW4gbWVzc2FnZSBkaXNwYXRjaGVyLlxuICB0aGlzLl9jb25uZWN0aW9uLm9uTWVzc2FnZSA9IChkYXRhKSA9PiB7XG4gICAgLy8gU2tpcCBlbXB0eSByZXNwb25zZS4gVGhpcyBoYXBwZW5zIHdoZW4gTFAgdGltZXMgb3V0LlxuICAgIGlmICghZGF0YSkgcmV0dXJuO1xuXG4gICAgdGhpcy5faW5QYWNrZXRDb3VudCsrO1xuXG4gICAgLy8gU2VuZCByYXcgbWVzc2FnZSB0byBsaXN0ZW5lclxuICAgIGlmICh0aGlzLm9uUmF3TWVzc2FnZSkge1xuICAgICAgdGhpcy5vblJhd01lc3NhZ2UoZGF0YSk7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEgPT09ICcwJykge1xuICAgICAgLy8gU2VydmVyIHJlc3BvbnNlIHRvIGEgbmV0d29yayBwcm9iZS5cbiAgICAgIGlmICh0aGlzLm9uTmV0d29ya1Byb2JlKSB7XG4gICAgICAgIHRoaXMub25OZXR3b3JrUHJvYmUoKTtcbiAgICAgIH1cbiAgICAgIC8vIE5vIHByb2Nlc3NpbmcgaXMgbmVjZXNzYXJ5LlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBwa3QgPSBKU09OLnBhcnNlKGRhdGEsIGpzb25QYXJzZUhlbHBlcik7XG4gICAgaWYgKCFwa3QpIHtcbiAgICAgIHRoaXMubG9nZ2VyKFwiaW46IFwiICsgZGF0YSk7XG4gICAgICB0aGlzLmxvZ2dlcihcIkVSUk9SOiBmYWlsZWQgdG8gcGFyc2UgZGF0YVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5sb2dnZXIoXCJpbjogXCIgKyAodGhpcy5fdHJpbUxvbmdTdHJpbmdzID8gSlNPTi5zdHJpbmdpZnkocGt0LCBqc29uTG9nZ2VySGVscGVyKSA6IGRhdGEpKTtcblxuICAgICAgLy8gU2VuZCBjb21wbGV0ZSBwYWNrZXQgdG8gbGlzdGVuZXJcbiAgICAgIGlmICh0aGlzLm9uTWVzc2FnZSkge1xuICAgICAgICB0aGlzLm9uTWVzc2FnZShwa3QpO1xuICAgICAgfVxuXG4gICAgICBpZiAocGt0LmN0cmwpIHtcbiAgICAgICAgLy8gSGFuZGxpbmcge2N0cmx9IG1lc3NhZ2VcbiAgICAgICAgaWYgKHRoaXMub25DdHJsTWVzc2FnZSkge1xuICAgICAgICAgIHRoaXMub25DdHJsTWVzc2FnZShwa3QuY3RybCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNvbHZlIG9yIHJlamVjdCBhIHBlbmRpbmcgcHJvbWlzZSwgaWYgYW55XG4gICAgICAgIGlmIChwa3QuY3RybC5pZCkge1xuICAgICAgICAgIGV4ZWNQcm9taXNlKHBrdC5jdHJsLmlkLCBwa3QuY3RybC5jb2RlLCBwa3QuY3RybCwgcGt0LmN0cmwudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKHBrdC5jdHJsLmNvZGUgPT0gMjA1ICYmIHBrdC5jdHJsLnRleHQgPT0gJ2V2aWN0ZWQnKSB7XG4gICAgICAgICAgICAvLyBVc2VyIGV2aWN0ZWQgZnJvbSB0b3BpYy5cbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LmN0cmwudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9yZXNldFN1YigpO1xuICAgICAgICAgICAgICBpZiAocGt0LmN0cmwucGFyYW1zICYmIHBrdC5jdHJsLnBhcmFtcy51bnN1Yikge1xuICAgICAgICAgICAgICAgIHRvcGljLl9nb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBrdC5jdHJsLnBhcmFtcyAmJiBwa3QuY3RybC5wYXJhbXMud2hhdCA9PSAnZGF0YScpIHtcbiAgICAgICAgICAgIC8vIEFsbCBtZXNzYWdlcyByZWNlaXZlZDogXCJwYXJhbXNcIjp7XCJjb3VudFwiOjExLFwid2hhdFwiOlwiZGF0YVwifSxcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LmN0cmwudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9hbGxNZXNzYWdlc1JlY2VpdmVkKHBrdC5jdHJsLnBhcmFtcy5jb3VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChwa3QuY3RybC5wYXJhbXMgJiYgcGt0LmN0cmwucGFyYW1zLndoYXQgPT0gJ3N1YicpIHtcbiAgICAgICAgICAgIC8vIFRoZSB0b3BpYyBoYXMgbm8gc3Vic2NyaXB0aW9ucy5cbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LmN0cmwudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIC8vIFRyaWdnZXIgdG9waWMub25TdWJzVXBkYXRlZC5cbiAgICAgICAgICAgICAgdG9waWMuX3Byb2Nlc3NNZXRhU3ViKFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKHBrdC5tZXRhKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGluZyBhIHttZXRhfSBtZXNzYWdlLlxuXG4gICAgICAgICAgICAvLyBQcmVmZXJyZWQgQVBJOiBSb3V0ZSBtZXRhIHRvIHRvcGljLCBpZiBvbmUgaXMgcmVnaXN0ZXJlZFxuICAgICAgICAgICAgY29uc3QgdG9waWMgPSBjYWNoZUdldCgndG9waWMnLCBwa3QubWV0YS50b3BpYyk7XG4gICAgICAgICAgICBpZiAodG9waWMpIHtcbiAgICAgICAgICAgICAgdG9waWMuX3JvdXRlTWV0YShwa3QubWV0YSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwa3QubWV0YS5pZCkge1xuICAgICAgICAgICAgICBleGVjUHJvbWlzZShwa3QubWV0YS5pZCwgMjAwLCBwa3QubWV0YSwgJ01FVEEnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2Vjb25kYXJ5IEFQSTogY2FsbGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLm9uTWV0YU1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbk1ldGFNZXNzYWdlKHBrdC5tZXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBrdC5kYXRhKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGluZyB7ZGF0YX0gbWVzc2FnZVxuXG4gICAgICAgICAgICAvLyBQcmVmZXJyZWQgQVBJOiBSb3V0ZSBkYXRhIHRvIHRvcGljLCBpZiBvbmUgaXMgcmVnaXN0ZXJlZFxuICAgICAgICAgICAgY29uc3QgdG9waWMgPSBjYWNoZUdldCgndG9waWMnLCBwa3QuZGF0YS50b3BpYyk7XG4gICAgICAgICAgICBpZiAodG9waWMpIHtcbiAgICAgICAgICAgICAgdG9waWMuX3JvdXRlRGF0YShwa3QuZGF0YSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNlY29uZGFyeSBBUEk6IENhbGwgY2FsbGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRGF0YU1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkRhdGFNZXNzYWdlKHBrdC5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBrdC5wcmVzKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGluZyB7cHJlc30gbWVzc2FnZVxuXG4gICAgICAgICAgICAvLyBQcmVmZXJyZWQgQVBJOiBSb3V0ZSBwcmVzZW5jZSB0byB0b3BpYywgaWYgb25lIGlzIHJlZ2lzdGVyZWRcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LnByZXMudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9yb3V0ZVByZXMocGt0LnByZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZWNvbmRhcnkgQVBJIC0gY2FsbGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLm9uUHJlc01lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vblByZXNNZXNzYWdlKHBrdC5wcmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBrdC5pbmZvKSB7XG4gICAgICAgICAgICAvLyB7aW5mb30gbWVzc2FnZSAtIHJlYWQvcmVjZWl2ZWQgbm90aWZpY2F0aW9ucyBhbmQga2V5IHByZXNzZXNcblxuICAgICAgICAgICAgLy8gUHJlZmVycmVkIEFQSTogUm91dGUge2luZm99fSB0byB0b3BpYywgaWYgb25lIGlzIHJlZ2lzdGVyZWRcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gY2FjaGVHZXQoJ3RvcGljJywgcGt0LmluZm8udG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9yb3V0ZUluZm8ocGt0LmluZm8pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZWNvbmRhcnkgQVBJIC0gY2FsbGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLm9uSW5mb01lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkluZm9NZXNzYWdlKHBrdC5pbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIoXCJFUlJPUjogVW5rbm93biBwYWNrZXQgcmVjZWl2ZWQuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUmVhZHkgdG8gc3RhcnQgc2VuZGluZy5cbiAgdGhpcy5fY29ubmVjdGlvbi5vbk9wZW4gPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLl9leHBpcmVQcm9taXNlcykge1xuICAgICAgLy8gUmVqZWN0IHByb21pc2VzIHdoaWNoIGhhdmUgbm90IGJlZW4gcmVzb2x2ZWQgZm9yIHRvbyBsb25nLlxuICAgICAgdGhpcy5fZXhwaXJlUHJvbWlzZXMgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihcIlRpbWVvdXQgKDUwNClcIik7XG4gICAgICAgIGNvbnN0IGV4cGlyZXMgPSBuZXcgRGF0ZShuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIEVYUElSRV9QUk9NSVNFU19USU1FT1VUKTtcbiAgICAgICAgZm9yIChsZXQgaWQgaW4gdGhpcy5fcGVuZGluZ1Byb21pc2VzKSB7XG4gICAgICAgICAgbGV0IGNhbGxiYWNrcyA9IHRoaXMuX3BlbmRpbmdQcm9taXNlc1tpZF07XG4gICAgICAgICAgaWYgKGNhbGxiYWNrcyAmJiBjYWxsYmFja3MudHMgPCBleHBpcmVzKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlcihcIlByb21pc2UgZXhwaXJlZFwiLCBpZCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcGVuZGluZ1Byb21pc2VzW2lkXTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFja3MucmVqZWN0KSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrcy5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIEVYUElSRV9QUk9NSVNFU19QRVJJT0QpO1xuICAgIH1cbiAgICB0aGlzLmhlbGxvKCk7XG4gIH1cblxuICAvLyBXcmFwcGVyIGZvciB0aGUgcmVjb25uZWN0IGl0ZXJhdG9yIGNhbGxiYWNrLlxuICB0aGlzLl9jb25uZWN0aW9uLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbiA9ICh0aW1lb3V0LCBwcm9taXNlKSA9PiB7XG4gICAgaWYgKHRoaXMub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uKSB7XG4gICAgICB0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbih0aW1lb3V0LCBwcm9taXNlKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLl9jb25uZWN0aW9uLm9uRGlzY29ubmVjdCA9IChlcnIsIGNvZGUpID0+IHtcbiAgICB0aGlzLl9pblBhY2tldENvdW50ID0gMDtcbiAgICB0aGlzLl9zZXJ2ZXJJbmZvID0gbnVsbDtcbiAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gZmFsc2U7XG5cbiAgICBpZiAodGhpcy5fZXhwaXJlUHJvbWlzZXMpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fZXhwaXJlUHJvbWlzZXMpO1xuICAgICAgdGhpcy5fZXhwaXJlUHJvbWlzZXMgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIE1hcmsgYWxsIHRvcGljcyBhcyB1bnN1YnNjcmliZWRcbiAgICBjYWNoZU1hcCgndG9waWMnLCAodG9waWMsIGtleSkgPT4ge1xuICAgICAgdG9waWMuX3Jlc2V0U3ViKCk7XG4gICAgfSk7XG5cbiAgICAvLyBSZWplY3QgYWxsIHBlbmRpbmcgcHJvbWlzZXNcbiAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fcGVuZGluZ1Byb21pc2VzKSB7XG4gICAgICBjb25zdCBjYWxsYmFja3MgPSB0aGlzLl9wZW5kaW5nUHJvbWlzZXNba2V5XTtcbiAgICAgIGlmIChjYWxsYmFja3MgJiYgY2FsbGJhY2tzLnJlamVjdCkge1xuICAgICAgICBjYWxsYmFja3MucmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3BlbmRpbmdQcm9taXNlcyA9IHt9O1xuXG4gICAgaWYgKHRoaXMub25EaXNjb25uZWN0KSB7XG4gICAgICB0aGlzLm9uRGlzY29ubmVjdChlcnIpO1xuICAgIH1cbiAgfVxufTtcblxuLy8gU3RhdGljIG1ldGhvZHMuXG5cbi8qKlxuICogQHR5cGVkZWYgQ3JlZGVudGlhbFxuICogQHR5cGUge29iamVjdH1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXRoIC0gdmFsaWRhdGlvbiBtZXRob2QuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdmFsIC0gdmFsdWUgdG8gdmFsaWRhdGUgKGUuZy4gZW1haWwgb3IgcGhvbmUgbnVtYmVyKS5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSByZXNwIC0gdmFsaWRhdGlvbiByZXNwb25zZS5cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBwYXJhbXMgLSB2YWxpZGF0aW9uIHBhcmFtZXRlcnMuXG4gKi9cbi8qKlxuICogSGVscGVyIG1ldGhvZCB0byBwYWNrYWdlIGFjY291bnQgY3JlZGVudGlhbC5cbiAqXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmcgfCBDcmVkZW50aWFsfSBtZXRoIC0gdmFsaWRhdGlvbiBtZXRob2Qgb3Igb2JqZWN0IHdpdGggdmFsaWRhdGlvbiBkYXRhLlxuICogQHBhcmFtIHtzdHJpbmc9fSB2YWwgLSB2YWxpZGF0aW9uIHZhbHVlIChlLmcuIGVtYWlsIG9yIHBob25lIG51bWJlcikuXG4gKiBAcGFyYW0ge09iamVjdD19IHBhcmFtcyAtIHZhbGlkYXRpb24gcGFyYW1ldGVycy5cbiAqIEBwYXJhbSB7c3RyaW5nPX0gcmVzcCAtIHZhbGlkYXRpb24gcmVzcG9uc2UuXG4gKlxuICogQHJldHVybnMge0FycmF5LjxDcmVkZW50aWFsPn0gYXJyYXkgd2l0aCBhIHNpbmdsZSBjcmVkZW50aWFsIG9yIDxjb2RlPm51bGw8L2NvZGU+IGlmIG5vIHZhbGlkIGNyZWRlbnRpYWxzIHdlcmUgZ2l2ZW4uXG4gKi9cblRpbm9kZS5jcmVkZW50aWFsID0gZnVuY3Rpb24obWV0aCwgdmFsLCBwYXJhbXMsIHJlc3ApIHtcbiAgaWYgKHR5cGVvZiBtZXRoID09ICdvYmplY3QnKSB7XG4gICAgKHtcbiAgICAgIHZhbCxcbiAgICAgIHBhcmFtcyxcbiAgICAgIHJlc3AsXG4gICAgICBtZXRoXG4gICAgfSA9IG1ldGgpO1xuICB9XG4gIGlmIChtZXRoICYmICh2YWwgfHwgcmVzcCkpIHtcbiAgICByZXR1cm4gW3tcbiAgICAgICdtZXRoJzogbWV0aCxcbiAgICAgICd2YWwnOiB2YWwsXG4gICAgICAncmVzcCc6IHJlc3AsXG4gICAgICAncGFyYW1zJzogcGFyYW1zXG4gICAgfV07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIERldGVybWluZSB0b3BpYyB0eXBlIGZyb20gdG9waWMncyBuYW1lOiBncnAsIHAycCwgbWUsIGZuZCwgc3lzLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gdGVzdC5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IE9uZSBvZiA8Y29kZT5cIm1lXCI8L2NvZGU+LCA8Y29kZT5cImZuZFwiPC9jb2RlPiwgPGNvZGU+XCJzeXNcIjwvY29kZT4sIDxjb2RlPlwiZ3JwXCI8L2NvZGU+LFxuICogICAgPGNvZGU+XCJwMnBcIjwvY29kZT4gb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPi5cbiAqL1xuVGlub2RlLnRvcGljVHlwZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgY29uc3QgdHlwZXMgPSB7XG4gICAgJ21lJzogJ21lJyxcbiAgICAnZm5kJzogJ2ZuZCcsXG4gICAgJ2dycCc6ICdncnAnLFxuICAgICduZXcnOiAnZ3JwJyxcbiAgICAnbmNoJzogJ2dycCcsXG4gICAgJ2Nobic6ICdncnAnLFxuICAgICd1c3InOiAncDJwJyxcbiAgICAnc3lzJzogJ3N5cydcbiAgfTtcbiAgcmV0dXJuIHR5cGVzWyh0eXBlb2YgbmFtZSA9PSAnc3RyaW5nJykgPyBuYW1lLnN1YnN0cmluZygwLCAzKSA6ICd4eHgnXTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgJ21lJyB0b3BpYy5cbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHRlc3QuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdGhlIG5hbWUgaXMgYSBuYW1lIG9mIGEgJ21lJyB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuVGlub2RlLmlzTWVUb3BpY05hbWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBUaW5vZGUudG9waWNUeXBlKG5hbWUpID09ICdtZSc7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBnaXZlbiB0b3BpYyBuYW1lIGlzIGEgbmFtZSBvZiBhIGdyb3VwIHRvcGljLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gdGVzdC5cbiAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBncm91cCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuVGlub2RlLmlzR3JvdXBUb3BpY05hbWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBUaW5vZGUudG9waWNUeXBlKG5hbWUpID09ICdncnAnO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdG9waWMgbmFtZSBpcyBhIG5hbWUgb2YgYSBwMnAgdG9waWMuXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byB0ZXN0LlxuICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZSBuYW1lIGlzIGEgbmFtZSBvZiBhIHAycCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuVGlub2RlLmlzUDJQVG9waWNOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gVGlub2RlLnRvcGljVHlwZShuYW1lKSA9PSAncDJwJztcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgY29tbXVuaWNhdGlvbiB0b3BpYywgaS5lLiBQMlAgb3IgZ3JvdXAuXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byB0ZXN0LlxuICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZSBuYW1lIGlzIGEgbmFtZSBvZiBhIHAycCBvciBncm91cCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuVGlub2RlLmlzQ29tbVRvcGljTmFtZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIFRpbm9kZS5pc1AyUFRvcGljTmFtZShuYW1lKSB8fCBUaW5vZGUuaXNHcm91cFRvcGljTmFtZShuYW1lKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgbmV3IHRvcGljLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gdG9waWMgbmFtZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBuZXcgdG9waWMsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gKi9cblRpbm9kZS5pc05ld0dyb3VwVG9waWNOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gKHR5cGVvZiBuYW1lID09ICdzdHJpbmcnKSAmJlxuICAgIChuYW1lLnN1YnN0cmluZygwLCAzKSA9PSBUT1BJQ19ORVcgfHwgbmFtZS5zdWJzdHJpbmcoMCwgMykgPT0gVE9QSUNfTkVXX0NIQU4pO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgdG9waWMgbmFtZSBpcyBhIG5hbWUgb2YgYSBjaGFubmVsLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gdG9waWMgbmFtZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBjaGFubmVsLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICovXG5UaW5vZGUuaXNDaGFubmVsVG9waWNOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gKHR5cGVvZiBuYW1lID09ICdzdHJpbmcnKSAmJlxuICAgIChuYW1lLnN1YnN0cmluZygwLCAzKSA9PSBUT1BJQ19DSEFOIHx8IG5hbWUuc3Vic3RyaW5nKDAsIDMpID09IFRPUElDX05FV19DSEFOKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHZlcnNpb24gb2YgdGhpcyBUaW5vZGUgY2xpZW50IGxpYnJhcnkuXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHJldHVybnMge3N0cmluZ30gc2VtYW50aWMgdmVyc2lvbiBvZiB0aGUgbGlicmFyeSwgZS5nLiA8Y29kZT5cIjAuMTUuNS1yYzFcIjwvY29kZT4uXG4gKi9cblRpbm9kZS5nZXRWZXJzaW9uID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBWRVJTSU9OO1xufTtcblxuLyoqXG4gKiBUbyB1c2UgVGlub2RlIGluIGEgbm9uIGJyb3dzZXIgY29udGV4dCwgc3VwcGx5IFdlYlNvY2tldCBhbmQgWE1MSHR0cFJlcXVlc3QgcHJvdmlkZXJzLlxuICogQHN0YXRpY1xuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHBhcmFtIHdzUHJvdmlkZXIgV2ViU29ja2V0IHByb3ZpZGVyLCBlLmcuIGZvciBub2RlSlMgLCA8Y29kZT5yZXF1aXJlKCd3cycpPC9jb2RlPi5cbiAqIEBwYXJhbSB4aHJQcm92aWRlciBYTUxIdHRwUmVxdWVzdCBwcm92aWRlciwgZS5nLiBmb3Igbm9kZSA8Y29kZT5yZXF1aXJlKCd4aHInKTwvY29kZT4uXG4gKi9cblRpbm9kZS5zZXROZXR3b3JrUHJvdmlkZXJzID0gZnVuY3Rpb24od3NQcm92aWRlciwgeGhyUHJvdmlkZXIpIHtcbiAgV2ViU29ja2V0UHJvdmlkZXIgPSB3c1Byb3ZpZGVyO1xuICBYSFJQcm92aWRlciA9IHhoclByb3ZpZGVyO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgbmFtZSBhbmQgdmVyc2lvbiBvZiB0aGlzIFRpbm9kZSBsaWJyYXJ5LlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSBsaWJyYXJ5IGFuZCBpdCdzIHZlcnNpb24uXG4gKi9cblRpbm9kZS5nZXRMaWJyYXJ5ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBMSUJSQVJZO1xufTtcblxuLy8gRXhwb3J0ZWQgY29uc3RhbnRzXG5UaW5vZGUuTUVTU0FHRV9TVEFUVVNfTk9ORSA9IE1FU1NBR0VfU1RBVFVTX05PTkU7XG5UaW5vZGUuTUVTU0FHRV9TVEFUVVNfUVVFVUVEID0gTUVTU0FHRV9TVEFUVVNfUVVFVUVEO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX1NFTkRJTkcgPSBNRVNTQUdFX1NUQVRVU19TRU5ESU5HO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX0ZBSUxFRCA9IE1FU1NBR0VfU1RBVFVTX0ZBSUxFRDtcblRpbm9kZS5NRVNTQUdFX1NUQVRVU19TRU5UID0gTUVTU0FHRV9TVEFUVVNfU0VOVDtcblRpbm9kZS5NRVNTQUdFX1NUQVRVU19SRUNFSVZFRCA9IE1FU1NBR0VfU1RBVFVTX1JFQ0VJVkVEO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX1JFQUQgPSBNRVNTQUdFX1NUQVRVU19SRUFEO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX1RPX01FID0gTUVTU0FHRV9TVEFUVVNfVE9fTUU7XG5cbi8vIFVuaWNvZGUgW2RlbF0gc3ltYm9sLlxuVGlub2RlLkRFTF9DSEFSID0gJ1xcdTI0MjEnO1xuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBnaXZlbiBzdHJpbmcgcmVwcmVzZW50cyA8Y29kZT5OVUxMPC9jb2RlPiB2YWx1ZSBhcyBkZWZpbmVkIGJ5IFRpbm9kZSAoPGNvZGU+J1xcdTI0MjEnPC9jb2RlPikuXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciAtIHN0cmluZyB0byBjaGVjayBmb3IgPGNvZGU+TlVMTDwvY29kZT4gdmFsdWUuXG4gKlxuICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHN0cmluZyByZXByZXNlbnRzIDxjb2RlPk5VTEw8L2NvZGU+IHZhbHVlLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICovXG5UaW5vZGUuaXNOdWxsVmFsdWUgPSBmdW5jdGlvbihzdHIpIHtcbiAgcmV0dXJuIHN0ciA9PT0gVGlub2RlLkRFTF9DSEFSO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gVVJMIHN0cmluZyBpcyBhIHJlbGF0aXZlIFVSTC5cbiAqIENoZWNrIGZvciBjYXNlcyBsaWtlOlxuICogIDxjb2RlPidodHRwOi8vZXhhbXBsZS5jb20nPC9jb2RlPlxuICogIDxjb2RlPicgaHR0cDovL2V4YW1wbGUuY29tJzwvY29kZT5cbiAqICA8Y29kZT4nLy9leGFtcGxlLmNvbS8nPC9jb2RlPlxuICogIDxjb2RlPidodHRwOmV4YW1wbGUuY29tJzwvY29kZT5cbiAqICA8Y29kZT4naHR0cDovZXhhbXBsZS5jb20nPC9jb2RlPlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBVUkwgc3RyaW5nIHRvIGNoZWNrLlxuICpcbiAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgVVJMIGlzIHJlbGF0aXZlLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICovXG5UaW5vZGUuaXNSZWxhdGl2ZVVSTCA9IGZ1bmN0aW9uKHVybCkge1xuICByZXR1cm4gIS9eXFxzKihbYS16XVthLXowLTkrLi1dKjp8XFwvXFwvKS9pbS50ZXN0KHVybCk7XG59O1xuXG4vLyBOYW1lcyBvZiBrZXlzIHRvIHNlcnZlci1wcm92aWRlZCBjb25maWd1cmF0aW9uIGxpbWl0cy5cblRpbm9kZS5NQVhfTUVTU0FHRV9TSVpFID0gJ21heE1lc3NhZ2VTaXplJztcblRpbm9kZS5NQVhfU1VCU0NSSUJFUl9DT1VOVCA9ICdtYXhTdWJzY3JpYmVyQ291bnQnO1xuVGlub2RlLk1BWF9UQUdfQ09VTlQgPSAnbWF4VGFnQ291bnQnO1xuVGlub2RlLk1BWF9GSUxFX1VQTE9BRF9TSVpFID0gJ21heEZpbGVVcGxvYWRTaXplJztcblxuLy8gUHVibGljIG1ldGhvZHM7XG5UaW5vZGUucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogQ29ubmVjdCB0byB0aGUgc2VydmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaG9zdF8gLSBuYW1lIG9mIHRoZSBob3N0IHRvIGNvbm5lY3QgdG8uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IFByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBjYWxsIGNvbXBsZXRlczpcbiAgICogICAgPGNvZGU+cmVzb2x2ZSgpPC9jb2RlPiBpcyBjYWxsZWQgd2l0aG91dCBwYXJhbWV0ZXJzLCA8Y29kZT5yZWplY3QoKTwvY29kZT4gcmVjZWl2ZXMgdGhlXG4gICAqICAgIDxjb2RlPkVycm9yPC9jb2RlPiBhcyBhIHNpbmdsZSBwYXJhbWV0ZXIuXG4gICAqL1xuICBjb25uZWN0OiBmdW5jdGlvbihob3N0Xykge1xuICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uLmNvbm5lY3QoaG9zdF8pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBdHRlbXB0IHRvIHJlY29ubmVjdCB0byB0aGUgc2VydmVyIGltbWVkaWF0ZWx5LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZm9yY2UgLSByZWNvbm5lY3QgZXZlbiBpZiB0aGVyZSBpcyBhIGNvbm5lY3Rpb24gYWxyZWFkeS5cbiAgICovXG4gIHJlY29ubmVjdDogZnVuY3Rpb24oZm9yY2UpIHtcbiAgICB0aGlzLl9jb25uZWN0aW9uLnJlY29ubmVjdChmb3JjZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERpc2Nvbm5lY3QgZnJvbSB0aGUgc2VydmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKi9cbiAgZGlzY29ubmVjdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fY29ubmVjdGlvbi5kaXNjb25uZWN0KCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENsZWFyIHBlcnNpc3RlbnQgY2FjaGU6IHJlbW92ZSBpbmRleERCIGNhY2hlIG9mIHRoZSBtb3N0IHJlY2VudGx5IGxvZ2dlZCBpbiB1c2VyLlxuICAgKi9cbiAgY2xlYXJTdG9yYWdlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fZGIpIHtcbiAgICAgIHRoaXMuX2RiLmRlbGV0ZURhdGFiYXNlKCk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBTZW5kIGEgbmV0d29yayBwcm9iZSBtZXNzYWdlIHRvIG1ha2Ugc3VyZSB0aGUgY29ubmVjdGlvbiBpcyBhbGl2ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICovXG4gIG5ldHdvcmtQcm9iZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fY29ubmVjdGlvbi5wcm9iZSgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBmb3IgbGl2ZSBjb25uZWN0aW9uIHRvIHNlcnZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZXJlIGlzIGEgbGl2ZSBjb25uZWN0aW9uLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNDb25uZWN0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uLmlzQ29ubmVjdGVkKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNvbm5lY3Rpb24gaXMgYXV0aGVudGljYXRlZCAobGFzdCBsb2dpbiB3YXMgc3VjY2Vzc2Z1bCkuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiBhdXRoZW50aWNhdGVkLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNBdXRoZW50aWNhdGVkOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fYXV0aGVudGljYXRlZDtcbiAgfSxcblxuICAvKipcbiAgICogQWRkIEFQSSBrZXkgYW5kIGF1dGggdG9rZW4gdG8gdGhlIHJlbGF0aXZlIFVSTCBtYWtpbmcgaXQgdXNhYmxlIGZvciBnZXR0aW5nIGRhdGFcbiAgICogZnJvbSB0aGUgc2VydmVyIGluIGEgc2ltcGxlIDxjb2RlPkhUVFAgR0VUPC9jb2RlPiByZXF1ZXN0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gVVJMIC0gVVJMIHRvIHdyYXAuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFVSTCB3aXRoIGFwcGVuZGVkIEFQSSBrZXkgYW5kIHRva2VuLCBpZiB2YWxpZCB0b2tlbiBpcyBwcmVzZW50LlxuICAgKi9cbiAgYXV0aG9yaXplVVJMOiBmdW5jdGlvbih1cmwpIHtcbiAgICBpZiAoIXVybCkge1xuICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBpZiAoVGlub2RlLmlzUmVsYXRpdmVVUkwodXJsKSkge1xuICAgICAgLy8gRmFrZSBiYXNlIHRvIG1ha2UgdGhlIHJlbGF0aXZlIFVSTCBwYXJzZWFibGUuXG4gICAgICBjb25zdCBiYXNlID0gJ3NjaGVtZTovL2hvc3QvJztcbiAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsLCBiYXNlKTtcbiAgICAgIGlmICh0aGlzLl9hcGlLZXkpIHtcbiAgICAgICAgcGFyc2VkLnNlYXJjaFBhcmFtcy5hcHBlbmQoJ2FwaWtleScsIHRoaXMuX2FwaUtleSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fYXV0aFRva2VuLnRva2VuKSB7XG4gICAgICAgIHBhcnNlZC5zZWFyY2hQYXJhbXMuYXBwZW5kKCdhdXRoJywgJ3Rva2VuJyk7XG4gICAgICAgIHBhcnNlZC5zZWFyY2hQYXJhbXMuYXBwZW5kKCdzZWNyZXQnLCB0aGlzLl9hdXRoVG9rZW4udG9rZW4pO1xuICAgICAgfVxuICAgICAgLy8gQ29udmVydCBiYWNrIHRvIHN0cmluZyBhbmQgc3RyaXAgZmFrZSBiYXNlIFVSTCBleGNlcHQgZm9yIHRoZSByb290IHNsYXNoLlxuICAgICAgdXJsID0gcGFyc2VkLnRvU3RyaW5nKCkuc3Vic3RyaW5nKGJhc2UubGVuZ3RoIC0gMSk7XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIEFjY291bnRQYXJhbXNcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5EZWZBY3M9fSBkZWZhY3MgLSBEZWZhdWx0IGFjY2VzcyBwYXJhbWV0ZXJzIGZvciB1c2VyJ3MgPGNvZGU+bWU8L2NvZGU+IHRvcGljLlxuICAgKiBAcHJvcGVydHkge09iamVjdD19IHB1YmxpYyAtIFB1YmxpYyBhcHBsaWNhdGlvbi1kZWZpbmVkIGRhdGEgZXhwb3NlZCBvbiA8Y29kZT5tZTwvY29kZT4gdG9waWMuXG4gICAqIEBwcm9wZXJ0eSB7T2JqZWN0PX0gcHJpdmF0ZSAtIFByaXZhdGUgYXBwbGljYXRpb24tZGVmaW5lZCBkYXRhIGFjY2Vzc2libGUgb24gPGNvZGU+bWU8L2NvZGU+IHRvcGljLlxuICAgKiBAcHJvcGVydHkge0FycmF5fSB0YWdzIC0gYXJyYXkgb2Ygc3RyaW5nIHRhZ3MgZm9yIHVzZXIgZGlzY292ZXJ5LlxuICAgKiBAcHJvcGVydHkge3N0cmluZz19IHRva2VuIC0gYXV0aGVudGljYXRpb24gdG9rZW4gdG8gdXNlLlxuICAgKi9cbiAgLyoqXG4gICAqIEB0eXBlZGVmIERlZkFjc1xuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gYXV0aCAtIEFjY2VzcyBtb2RlIGZvciA8Y29kZT5tZTwvY29kZT4gZm9yIGF1dGhlbnRpY2F0ZWQgdXNlcnMuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gYW5vbiAtIEFjY2VzcyBtb2RlIGZvciA8Y29kZT5tZTwvY29kZT4gZm9yIGFub255bW91cyB1c2Vycy5cbiAgICovXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBvciB1cGRhdGUgYW4gYWNjb3VudC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIFVzZXIgaWQgdG8gdXBkYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWUgLSBBdXRoZW50aWNhdGlvbiBzY2hlbWU7IDxjb2RlPlwiYmFzaWNcIjwvY29kZT4gYW5kIDxjb2RlPlwiYW5vbnltb3VzXCI8L2NvZGU+IGFyZSB0aGUgY3VycmVudGx5IHN1cHBvcnRlZCBzY2hlbWVzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2VjcmV0IC0gQXV0aGVudGljYXRpb24gc2VjcmV0LCBhc3N1bWVkIHRvIGJlIGFscmVhZHkgYmFzZTY0IGVuY29kZWQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGxvZ2luIC0gVXNlIG5ldyBhY2NvdW50IHRvIGF1dGhlbnRpY2F0ZSBjdXJyZW50IHNlc3Npb25cbiAgICogQHBhcmFtIHtUaW5vZGUuQWNjb3VudFBhcmFtcz19IHBhcmFtcyAtIFVzZXIgZGF0YSB0byBwYXNzIHRvIHRoZSBzZXJ2ZXIuXG4gICAqL1xuICBhY2NvdW50OiBmdW5jdGlvbih1aWQsIHNjaGVtZSwgc2VjcmV0LCBsb2dpbiwgcGFyYW1zKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdhY2MnKTtcbiAgICBwa3QuYWNjLnVzZXIgPSB1aWQ7XG4gICAgcGt0LmFjYy5zY2hlbWUgPSBzY2hlbWU7XG4gICAgcGt0LmFjYy5zZWNyZXQgPSBzZWNyZXQ7XG4gICAgLy8gTG9nIGluIHRvIHRoZSBuZXcgYWNjb3VudCB1c2luZyBzZWxlY3RlZCBzY2hlbWVcbiAgICBwa3QuYWNjLmxvZ2luID0gbG9naW47XG5cbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBwa3QuYWNjLmRlc2MuZGVmYWNzID0gcGFyYW1zLmRlZmFjcztcbiAgICAgIHBrdC5hY2MuZGVzYy5wdWJsaWMgPSBwYXJhbXMucHVibGljO1xuICAgICAgcGt0LmFjYy5kZXNjLnByaXZhdGUgPSBwYXJhbXMucHJpdmF0ZTtcblxuICAgICAgcGt0LmFjYy50YWdzID0gcGFyYW1zLnRhZ3M7XG4gICAgICBwa3QuYWNjLmNyZWQgPSBwYXJhbXMuY3JlZDtcblxuICAgICAgcGt0LmFjYy50b2tlbiA9IHBhcmFtcy50b2tlbjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmFjYy5pZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB1c2VyLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2FjY291bnR9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NoZW1lIC0gQXV0aGVudGljYXRpb24gc2NoZW1lOyA8Y29kZT5cImJhc2ljXCI8L2NvZGU+IGlzIHRoZSBvbmx5IGN1cnJlbnRseSBzdXBwb3J0ZWQgc2NoZW1lLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2VjcmV0IC0gQXV0aGVudGljYXRpb24uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGxvZ2luIC0gVXNlIG5ldyBhY2NvdW50IHRvIGF1dGhlbnRpY2F0ZSBjdXJyZW50IHNlc3Npb25cbiAgICogQHBhcmFtIHtUaW5vZGUuQWNjb3VudFBhcmFtcz19IHBhcmFtcyAtIFVzZXIgZGF0YSB0byBwYXNzIHRvIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiBzZXJ2ZXIgcmVwbHkgaXMgcmVjZWl2ZWQuXG4gICAqL1xuICBjcmVhdGVBY2NvdW50OiBmdW5jdGlvbihzY2hlbWUsIHNlY3JldCwgbG9naW4sIHBhcmFtcykge1xuICAgIGxldCBwcm9taXNlID0gdGhpcy5hY2NvdW50KFVTRVJfTkVXLCBzY2hlbWUsIHNlY3JldCwgbG9naW4sIHBhcmFtcyk7XG4gICAgaWYgKGxvZ2luKSB7XG4gICAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuKChjdHJsKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ2luU3VjY2Vzc2Z1bChjdHJsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIHVzZXIgd2l0aCA8Y29kZT4nYmFzaWMnPC9jb2RlPiBhdXRoZW50aWNhdGlvbiBzY2hlbWUgYW5kIGltbWVkaWF0ZWx5XG4gICAqIHVzZSBpdCBmb3IgYXV0aGVudGljYXRpb24uIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjYWNjb3VudH0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VybmFtZSAtIExvZ2luIHRvIHVzZSBmb3IgdGhlIG5ldyBhY2NvdW50LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSBVc2VyJ3MgcGFzc3dvcmQuXG4gICAqIEBwYXJhbSB7VGlub2RlLkFjY291bnRQYXJhbXM9fSBwYXJhbXMgLSBVc2VyIGRhdGEgdG8gcGFzcyB0byB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gc2VydmVyIHJlcGx5IGlzIHJlY2VpdmVkLlxuICAgKi9cbiAgY3JlYXRlQWNjb3VudEJhc2ljOiBmdW5jdGlvbih1c2VybmFtZSwgcGFzc3dvcmQsIHBhcmFtcykge1xuICAgIC8vIE1ha2Ugc3VyZSB3ZSBhcmUgbm90IHVzaW5nICdudWxsJyBvciAndW5kZWZpbmVkJztcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lIHx8ICcnO1xuICAgIHBhc3N3b3JkID0gcGFzc3dvcmQgfHwgJyc7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlQWNjb3VudCgnYmFzaWMnLFxuICAgICAgYjY0RW5jb2RlVW5pY29kZSh1c2VybmFtZSArICc6JyArIHBhc3N3b3JkKSwgdHJ1ZSwgcGFyYW1zKTtcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHVzZXIncyBjcmVkZW50aWFscyBmb3IgPGNvZGU+J2Jhc2ljJzwvY29kZT4gYXV0aGVudGljYXRpb24gc2NoZW1lLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2FjY291bnR9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gVXNlciBJRCB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VybmFtZSAtIExvZ2luIHRvIHVzZSBmb3IgdGhlIG5ldyBhY2NvdW50LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSBVc2VyJ3MgcGFzc3dvcmQuXG4gICAqIEBwYXJhbSB7VGlub2RlLkFjY291bnRQYXJhbXM9fSBwYXJhbXMgLSBkYXRhIHRvIHBhc3MgdG8gdGhlIHNlcnZlci5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHNlcnZlciByZXBseSBpcyByZWNlaXZlZC5cbiAgICovXG4gIHVwZGF0ZUFjY291bnRCYXNpYzogZnVuY3Rpb24odWlkLCB1c2VybmFtZSwgcGFzc3dvcmQsIHBhcmFtcykge1xuICAgIC8vIE1ha2Ugc3VyZSB3ZSBhcmUgbm90IHVzaW5nICdudWxsJyBvciAndW5kZWZpbmVkJztcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lIHx8ICcnO1xuICAgIHBhc3N3b3JkID0gcGFzc3dvcmQgfHwgJyc7XG4gICAgcmV0dXJuIHRoaXMuYWNjb3VudCh1aWQsICdiYXNpYycsXG4gICAgICBiNjRFbmNvZGVVbmljb2RlKHVzZXJuYW1lICsgJzonICsgcGFzc3dvcmQpLCBmYWxzZSwgcGFyYW1zKTtcbiAgfSxcblxuICAvKipcbiAgICogU2VuZCBoYW5kc2hha2UgdG8gdGhlIHNlcnZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHNlcnZlciByZXBseSBpcyByZWNlaXZlZC5cbiAgICovXG4gIGhlbGxvOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ2hpJyk7XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmhpLmlkKVxuICAgICAgLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgLy8gUmVzZXQgYmFja29mZiBjb3VudGVyIG9uIHN1Y2Nlc3NmdWwgY29ubmVjdGlvbi5cbiAgICAgICAgdGhpcy5fY29ubmVjdGlvbi5iYWNrb2ZmUmVzZXQoKTtcblxuICAgICAgICAvLyBTZXJ2ZXIgcmVzcG9uc2UgY29udGFpbnMgc2VydmVyIHByb3RvY29sIHZlcnNpb24sIGJ1aWxkLCBjb25zdHJhaW50cyxcbiAgICAgICAgLy8gc2Vzc2lvbiBJRCBmb3IgbG9uZyBwb2xsaW5nLiBTYXZlIHRoZW0uXG4gICAgICAgIGlmIChjdHJsLnBhcmFtcykge1xuICAgICAgICAgIHRoaXMuX3NlcnZlckluZm8gPSBjdHJsLnBhcmFtcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9uQ29ubmVjdCkge1xuICAgICAgICAgIHRoaXMub25Db25uZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3RybDtcbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgdGhpcy5fY29ubmVjdGlvbi5yZWNvbm5lY3QodHJ1ZSk7XG5cbiAgICAgICAgaWYgKHRoaXMub25EaXNjb25uZWN0KSB7XG4gICAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3QoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCBvciByZWZyZXNoIHRoZSBwdXNoIG5vdGlmaWNhdGlvbnMvZGV2aWNlIHRva2VuLiBJZiB0aGUgY2xpZW50IGlzIGNvbm5lY3RlZCxcbiAgICogdGhlIGRldmljZVRva2VuIGNhbiBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkdCAtIHRva2VuIG9idGFpbmVkIGZyb20gdGhlIHByb3ZpZGVyIG9yIDxjb2RlPmZhbHNlPC9jb2RlPixcbiAgICogICAgPGNvZGU+bnVsbDwvY29kZT4gb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPiB0byBjbGVhciB0aGUgdG9rZW4uXG4gICAqXG4gICAqIEByZXR1cm5zIDxjb2RlPnRydWU8L2NvZGU+IGlmIGF0dGVtcHQgd2FzIG1hZGUgdG8gc2VuZCB0aGUgdXBkYXRlIHRvIHRoZSBzZXJ2ZXIuXG4gICAqL1xuICBzZXREZXZpY2VUb2tlbjogZnVuY3Rpb24oZHQpIHtcbiAgICBsZXQgc2VudCA9IGZhbHNlO1xuICAgIC8vIENvbnZlcnQgYW55IGZhbHNpc2ggdmFsdWUgdG8gbnVsbC5cbiAgICBkdCA9IGR0IHx8IG51bGw7XG4gICAgaWYgKGR0ICE9IHRoaXMuX2RldmljZVRva2VuKSB7XG4gICAgICB0aGlzLl9kZXZpY2VUb2tlbiA9IGR0O1xuICAgICAgaWYgKHRoaXMuaXNDb25uZWN0ZWQoKSAmJiB0aGlzLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgIHRoaXMuc2VuZCh7XG4gICAgICAgICAgJ2hpJzoge1xuICAgICAgICAgICAgJ2Rldic6IGR0IHx8IFRpbm9kZS5ERUxfQ0hBUlxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHNlbnQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VudDtcbiAgfSxcblxuICAvKipcbiAgICogQXV0aGVudGljYXRlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNjaGVtZSAtIEF1dGhlbnRpY2F0aW9uIHNjaGVtZTsgPGNvZGU+XCJiYXNpY1wiPC9jb2RlPiBpcyB0aGUgb25seSBjdXJyZW50bHkgc3VwcG9ydGVkIHNjaGVtZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlY3JldCAtIEF1dGhlbnRpY2F0aW9uIHNlY3JldCwgYXNzdW1lZCB0byBiZSBhbHJlYWR5IGJhc2U2NCBlbmNvZGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gc2VydmVyIHJlcGx5IGlzIHJlY2VpdmVkLlxuICAgKi9cbiAgbG9naW46IGZ1bmN0aW9uKHNjaGVtZSwgc2VjcmV0LCBjcmVkKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdsb2dpbicpO1xuICAgIHBrdC5sb2dpbi5zY2hlbWUgPSBzY2hlbWU7XG4gICAgcGt0LmxvZ2luLnNlY3JldCA9IHNlY3JldDtcbiAgICBwa3QubG9naW4uY3JlZCA9IGNyZWQ7XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmxvZ2luLmlkKVxuICAgICAgLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgY29uc3QgeCA9IHRoaXMubG9naW5TdWNjZXNzZnVsKGN0cmwpO1xuICAgICAgICByZXR1cm4geDtcbiAgICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2xvZ2lufSB3aXRoIGJhc2ljIGF1dGhlbnRpY2F0aW9uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1bmFtZSAtIFVzZXIgbmFtZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkICAtIFBhc3N3b3JkLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBsb2dpbkJhc2ljOiBmdW5jdGlvbih1bmFtZSwgcGFzc3dvcmQsIGNyZWQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2dpbignYmFzaWMnLCBiNjRFbmNvZGVVbmljb2RlKHVuYW1lICsgJzonICsgcGFzc3dvcmQpLCBjcmVkKVxuICAgICAgLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgdGhpcy5fbG9naW4gPSB1bmFtZTtcbiAgICAgICAgcmV0dXJuIGN0cmw7XG4gICAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNsb2dpbn0gd2l0aCB0b2tlbiBhdXRoZW50aWNhdGlvblxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gLSBUb2tlbiByZWNlaXZlZCBpbiByZXNwb25zZSB0byBlYXJsaWVyIGxvZ2luLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBsb2dpblRva2VuOiBmdW5jdGlvbih0b2tlbiwgY3JlZCkge1xuICAgIHJldHVybiB0aGlzLmxvZ2luKCd0b2tlbicsIHRva2VuLCBjcmVkKTtcbiAgfSxcblxuICAvKipcbiAgICogU2VuZCBhIHJlcXVlc3QgZm9yIHJlc2V0dGluZyBhbiBhdXRoZW50aWNhdGlvbiBzZWNyZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWUgLSBhdXRoZW50aWNhdGlvbiBzY2hlbWUgdG8gcmVzZXQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSBtZXRob2QgdG8gdXNlIGZvciByZXNldHRpbmcgdGhlIHNlY3JldCwgc3VjaCBhcyBcImVtYWlsXCIgb3IgXCJ0ZWxcIi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gdmFsdWUgb2YgdGhlIGNyZWRlbnRpYWwgdG8gdXNlLCBhIHNwZWNpZmljIGVtYWlsIGFkZHJlc3Mgb3IgYSBwaG9uZSBudW1iZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHRoZSBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICByZXF1ZXN0UmVzZXRBdXRoU2VjcmV0OiBmdW5jdGlvbihzY2hlbWUsIG1ldGhvZCwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5sb2dpbigncmVzZXQnLCBiNjRFbmNvZGVVbmljb2RlKHNjaGVtZSArICc6JyArIG1ldGhvZCArICc6JyArIHZhbHVlKSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIEF1dGhUb2tlblxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0b2tlbiAtIFRva2VuIHZhbHVlLlxuICAgKiBAcHJvcGVydHkge0RhdGV9IGV4cGlyZXMgLSBUb2tlbiBleHBpcmF0aW9uIHRpbWUuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHN0b3JlZCBhdXRoZW50aWNhdGlvbiB0b2tlbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5BdXRoVG9rZW59IGF1dGhlbnRpY2F0aW9uIHRva2VuLlxuICAgKi9cbiAgZ2V0QXV0aFRva2VuOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fYXV0aFRva2VuICYmICh0aGlzLl9hdXRoVG9rZW4uZXhwaXJlcy5nZXRUaW1lKCkgPiBEYXRlLm5vdygpKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2F1dGhUb2tlbjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYXV0aFRva2VuID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFwcGxpY2F0aW9uIG1heSBwcm92aWRlIGEgc2F2ZWQgYXV0aGVudGljYXRpb24gdG9rZW4uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7VGlub2RlLkF1dGhUb2tlbn0gdG9rZW4gLSBhdXRoZW50aWNhdGlvbiB0b2tlbi5cbiAgICovXG4gIHNldEF1dGhUb2tlbjogZnVuY3Rpb24odG9rZW4pIHtcbiAgICB0aGlzLl9hdXRoVG9rZW4gPSB0b2tlbjtcbiAgfSxcblxuICAvKipcbiAgICogQHR5cGVkZWYgU2V0UGFyYW1zXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHByb3BlcnR5IHtUaW5vZGUuU2V0RGVzYz19IGRlc2MgLSBUb3BpYyBpbml0aWFsaXphdGlvbiBwYXJhbWV0ZXJzIHdoZW4gY3JlYXRpbmcgYSBuZXcgdG9waWMgb3IgYSBuZXcgc3Vic2NyaXB0aW9uLlxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5TZXRTdWI9fSBzdWIgLSBTdWJzY3JpcHRpb24gaW5pdGlhbGl6YXRpb24gcGFyYW1ldGVycy5cbiAgICovXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBTZXREZXNjXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHByb3BlcnR5IHtUaW5vZGUuRGVmQWNzPX0gZGVmYWNzIC0gRGVmYXVsdCBhY2Nlc3MgbW9kZS5cbiAgICogQHByb3BlcnR5IHtPYmplY3Q9fSBwdWJsaWMgLSBGcmVlLWZvcm0gdG9waWMgZGVzY3JpcHRpb24sIHB1YmxpY2FsbHkgYWNjZXNzaWJsZS5cbiAgICogQHByb3BlcnR5IHtPYmplY3Q9fSBwcml2YXRlIC0gRnJlZS1mb3JtIHRvcGljIGRlc2NyaXB0aW9uYWNjZXNzaWJsZSBvbmx5IHRvIHRoZSBvd25lci5cbiAgICovXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBTZXRTdWJcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge3N0cmluZz19IHVzZXIgLSBVSUQgb2YgdGhlIHVzZXIgYWZmZWN0ZWQgYnkgdGhlIHJlcXVlc3QuIERlZmF1bHQgKGVtcHR5KSAtIGN1cnJlbnQgdXNlci5cbiAgICogQHByb3BlcnR5IHtzdHJpbmc9fSBtb2RlIC0gVXNlciBhY2Nlc3MgbW9kZSwgZWl0aGVyIHJlcXVlc3RlZCBvciBhc3NpZ25lZCBkZXBlbmRlbnQgb24gY29udGV4dC5cbiAgICogQHByb3BlcnR5IHtPYmplY3Q9fSBpbmZvIC0gRnJlZS1mb3JtIHBheWxvYWQgdG8gcGFzcyB0byB0aGUgaW52aXRlZCB1c2VyIG9yIHRvcGljIG1hbmFnZXIuXG4gICAqL1xuICAvKipcbiAgICogUGFyYW1ldGVycyBwYXNzZWQgdG8ge0BsaW5rIFRpbm9kZSNzdWJzY3JpYmV9LlxuICAgKlxuICAgKiBAdHlwZWRlZiBTdWJzY3JpcHRpb25QYXJhbXNcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5TZXRQYXJhbXM9fSBzZXQgLSBQYXJhbWV0ZXJzIHVzZWQgdG8gaW5pdGlhbGl6ZSB0b3BpY1xuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5HZXRRdWVyeT19IGdldCAtIFF1ZXJ5IGZvciBmZXRjaGluZyBkYXRhIGZyb20gdG9waWMuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBTZW5kIGEgdG9waWMgc3Vic2NyaXB0aW9uIHJlcXVlc3QuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpYyAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHN1YnNjcmliZSB0by5cbiAgICogQHBhcmFtIHtUaW5vZGUuR2V0UXVlcnk9fSBnZXRQYXJhbXMgLSBPcHRpb25hbCBzdWJzY3JpcHRpb24gbWV0YWRhdGEgcXVlcnlcbiAgICogQHBhcmFtIHtUaW5vZGUuU2V0UGFyYW1zPX0gc2V0UGFyYW1zIC0gT3B0aW9uYWwgaW5pdGlhbGl6YXRpb24gcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBzdWJzY3JpYmU6IGZ1bmN0aW9uKHRvcGljTmFtZSwgZ2V0UGFyYW1zLCBzZXRQYXJhbXMpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ3N1YicsIHRvcGljTmFtZSlcbiAgICBpZiAoIXRvcGljTmFtZSkge1xuICAgICAgdG9waWNOYW1lID0gVE9QSUNfTkVXO1xuICAgIH1cblxuICAgIHBrdC5zdWIuZ2V0ID0gZ2V0UGFyYW1zO1xuXG4gICAgaWYgKHNldFBhcmFtcykge1xuICAgICAgaWYgKHNldFBhcmFtcy5zdWIpIHtcbiAgICAgICAgcGt0LnN1Yi5zZXQuc3ViID0gc2V0UGFyYW1zLnN1YjtcbiAgICAgIH1cblxuICAgICAgaWYgKHNldFBhcmFtcy5kZXNjKSB7XG4gICAgICAgIGlmIChUaW5vZGUuaXNOZXdHcm91cFRvcGljTmFtZSh0b3BpY05hbWUpKSB7XG4gICAgICAgICAgLy8gRnVsbCBzZXQuZGVzYyBwYXJhbXMgYXJlIHVzZWQgZm9yIG5ldyB0b3BpY3Mgb25seVxuICAgICAgICAgIHBrdC5zdWIuc2V0LmRlc2MgPSBzZXRQYXJhbXMuZGVzYztcbiAgICAgICAgfSBlbHNlIGlmIChUaW5vZGUuaXNQMlBUb3BpY05hbWUodG9waWNOYW1lKSAmJiBzZXRQYXJhbXMuZGVzYy5kZWZhY3MpIHtcbiAgICAgICAgICAvLyBVc2Ugb3B0aW9uYWwgZGVmYXVsdCBwZXJtaXNzaW9ucyBvbmx5LlxuICAgICAgICAgIHBrdC5zdWIuc2V0LmRlc2MgPSB7XG4gICAgICAgICAgICBkZWZhY3M6IHNldFBhcmFtcy5kZXNjLmRlZmFjc1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNldFBhcmFtcy50YWdzKSB7XG4gICAgICAgIHBrdC5zdWIuc2V0LnRhZ3MgPSBzZXRQYXJhbXMudGFncztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LnN1Yi5pZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERldGFjaCBhbmQgb3B0aW9uYWxseSB1bnN1YnNjcmliZSBmcm9tIHRoZSB0b3BpY1xuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWMgLSBUb3BpYyB0byBkZXRhY2ggZnJvbS5cbiAgICogQHBhcmFtIHtib29sZWFufSB1bnN1YiAtIElmIDxjb2RlPnRydWU8L2NvZGU+LCBkZXRhY2ggYW5kIHVuc3Vic2NyaWJlLCBvdGhlcndpc2UganVzdCBkZXRhY2guXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGxlYXZlOiBmdW5jdGlvbih0b3BpYywgdW5zdWIpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ2xlYXZlJywgdG9waWMpO1xuICAgIHBrdC5sZWF2ZS51bnN1YiA9IHVuc3ViO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VuZChwa3QsIHBrdC5sZWF2ZS5pZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBtZXNzYWdlIGRyYWZ0IHdpdGhvdXQgc2VuZGluZyBpdCB0byB0aGUgc2VydmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWMgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byBwdWJsaXNoIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIFBheWxvYWQgdG8gcHVibGlzaC5cbiAgICogQHBhcmFtIHtib29sZWFuPX0gbm9FY2hvIC0gSWYgPGNvZGU+dHJ1ZTwvY29kZT4sIHRlbGwgdGhlIHNlcnZlciBub3QgdG8gZWNobyB0aGUgbWVzc2FnZSB0byB0aGUgb3JpZ2luYWwgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH0gbmV3IG1lc3NhZ2Ugd2hpY2ggY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBvciBvdGhlcndpc2UgdXNlZC5cbiAgICovXG4gIGNyZWF0ZU1lc3NhZ2U6IGZ1bmN0aW9uKHRvcGljLCBkYXRhLCBub0VjaG8pIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ3B1YicsIHRvcGljKTtcblxuICAgIGxldCBkZnQgPSB0eXBlb2YgZGF0YSA9PSAnc3RyaW5nJyA/IERyYWZ0eS5wYXJzZShkYXRhKSA6IGRhdGE7XG4gICAgaWYgKGRmdCAmJiAhRHJhZnR5LmlzUGxhaW5UZXh0KGRmdCkpIHtcbiAgICAgIHBrdC5wdWIuaGVhZCA9IHtcbiAgICAgICAgbWltZTogRHJhZnR5LmdldENvbnRlbnRUeXBlKClcbiAgICAgIH07XG4gICAgICBkYXRhID0gZGZ0O1xuICAgIH1cbiAgICBwa3QucHViLm5vZWNobyA9IG5vRWNobztcbiAgICBwa3QucHViLmNvbnRlbnQgPSBkYXRhO1xuXG4gICAgcmV0dXJuIHBrdC5wdWI7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFB1Ymxpc2gge2RhdGF9IG1lc3NhZ2UgdG8gdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpYyAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHB1Ymxpc2ggdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gUGF5bG9hZCB0byBwdWJsaXNoLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBub0VjaG8gLSBJZiA8Y29kZT50cnVlPC9jb2RlPiwgdGVsbCB0aGUgc2VydmVyIG5vdCB0byBlY2hvIHRoZSBtZXNzYWdlIHRvIHRoZSBvcmlnaW5hbCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBwdWJsaXNoOiBmdW5jdGlvbih0b3BpYywgZGF0YSwgbm9FY2hvKSB7XG4gICAgcmV0dXJuIHRoaXMucHVibGlzaE1lc3NhZ2UoXG4gICAgICB0aGlzLmNyZWF0ZU1lc3NhZ2UodG9waWMsIGRhdGEsIG5vRWNobylcbiAgICApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBQdWJsaXNoIG1lc3NhZ2UgdG8gdG9waWMuIFRoZSBtZXNzYWdlIHNob3VsZCBiZSBjcmVhdGVkIGJ5IHtAbGluayBUaW5vZGUjY3JlYXRlTWVzc2FnZX0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwdWIgLSBNZXNzYWdlIHRvIHB1Ymxpc2guXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIHB1Ymxpc2hNZXNzYWdlOiBmdW5jdGlvbihwdWIpIHtcbiAgICAvLyBNYWtlIGEgc2hhbGxvdyBjb3B5LiBOZWVkZWQgaW4gb3JkZXIgdG8gY2xlYXIgbG9jYWxseS1hc3NpZ25lZCB0ZW1wIHZhbHVlcztcbiAgICBwdWIgPSBPYmplY3QuYXNzaWduKHt9LCBwdWIpO1xuICAgIHB1Yi5zZXEgPSB1bmRlZmluZWQ7XG4gICAgcHViLmZyb20gPSB1bmRlZmluZWQ7XG4gICAgcHViLnRzID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiB0aGlzLnNlbmQoe1xuICAgICAgcHViOiBwdWJcbiAgICB9LCBwdWIuaWQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBHZXRRdWVyeVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBwcm9wZXJ0eSB7VGlub2RlLkdldE9wdHNUeXBlPX0gZGVzYyAtIElmIHByb3ZpZGVkIChldmVuIGlmIGVtcHR5KSwgZmV0Y2ggdG9waWMgZGVzY3JpcHRpb24uXG4gICAqIEBwcm9wZXJ0eSB7VGlub2RlLkdldE9wdHNUeXBlPX0gc3ViIC0gSWYgcHJvdmlkZWQgKGV2ZW4gaWYgZW1wdHkpLCBmZXRjaCB0b3BpYyBzdWJzY3JpcHRpb25zLlxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5HZXREYXRhVHlwZT19IGRhdGEgLSBJZiBwcm92aWRlZCAoZXZlbiBpZiBlbXB0eSksIGdldCBtZXNzYWdlcy5cbiAgICovXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIEdldE9wdHNUeXBlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHByb3BlcnR5IHtEYXRlPX0gaW1zIC0gXCJJZiBtb2RpZmllZCBzaW5jZVwiLCBmZXRjaCBkYXRhIG9ubHkgaXQgd2FzIHdhcyBtb2RpZmllZCBzaW5jZSBzdGF0ZWQgZGF0ZS5cbiAgICogQHByb3BlcnR5IHtudW1iZXI9fSBsaW1pdCAtIE1heGltdW0gbnVtYmVyIG9mIHJlc3VsdHMgdG8gcmV0dXJuLiBJZ25vcmVkIHdoZW4gcXVlcnlpbmcgdG9waWMgZGVzY3JpcHRpb24uXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBHZXREYXRhVHlwZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyPX0gc2luY2UgLSBMb2FkIG1lc3NhZ2VzIHdpdGggc2VxIGlkIGVxdWFsIG9yIGdyZWF0ZXIgdGhhbiB0aGlzIHZhbHVlLlxuICAgKiBAcHJvcGVydHkge251bWJlcj19IGJlZm9yZSAtIExvYWQgbWVzc2FnZXMgd2l0aCBzZXEgaWQgbG93ZXIgdGhhbiB0aGlzIG51bWJlci5cbiAgICogQHByb3BlcnR5IHtudW1iZXI9fSBsaW1pdCAtIE1heGltdW0gbnVtYmVyIG9mIHJlc3VsdHMgdG8gcmV0dXJuLlxuICAgKi9cblxuICAvKipcbiAgICogUmVxdWVzdCB0b3BpYyBtZXRhZGF0YVxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWMgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byBxdWVyeS5cbiAgICogQHBhcmFtIHtUaW5vZGUuR2V0UXVlcnl9IHBhcmFtcyAtIFBhcmFtZXRlcnMgb2YgdGhlIHF1ZXJ5LiBVc2Uge0BsaW5rIFRpbm9kZS5NZXRhR2V0QnVpbGRlcn0gdG8gZ2VuZXJhdGUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGdldE1ldGE6IGZ1bmN0aW9uKHRvcGljLCBwYXJhbXMpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ2dldCcsIHRvcGljKTtcblxuICAgIHBrdC5nZXQgPSBtZXJnZU9iaihwa3QuZ2V0LCBwYXJhbXMpO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VuZChwa3QsIHBrdC5nZXQuaWQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdG9waWMncyBtZXRhZGF0YTogZGVzY3JpcHRpb24sIHN1YnNjcmlidGlvbnMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpYyAtIFRvcGljIHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHtUaW5vZGUuU2V0UGFyYW1zfSBwYXJhbXMgLSB0b3BpYyBtZXRhZGF0YSB0byB1cGRhdGUuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIHNldE1ldGE6IGZ1bmN0aW9uKHRvcGljLCBwYXJhbXMpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLmluaXRQYWNrZXQoJ3NldCcsIHRvcGljKTtcbiAgICBjb25zdCB3aGF0ID0gW107XG5cbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBbJ2Rlc2MnLCAnc3ViJywgJ3RhZ3MnLCAnY3JlZCddLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKHBhcmFtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgd2hhdC5wdXNoKGtleSk7XG4gICAgICAgICAgcGt0LnNldFtrZXldID0gcGFyYW1zW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh3aGF0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiSW52YWxpZCB7c2V0fSBwYXJhbWV0ZXJzXCIpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LnNldC5pZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJhbmdlIG9mIG1lc3NhZ2UgSURzIHRvIGRlbGV0ZS5cbiAgICpcbiAgICogQHR5cGVkZWYgRGVsUmFuZ2VcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge251bWJlcn0gbG93IC0gbG93IGVuZCBvZiB0aGUgcmFuZ2UsIGluY2x1c2l2ZSAoY2xvc2VkKS5cbiAgICogQHByb3BlcnR5IHtudW1iZXI9fSBoaSAtIGhpZ2ggZW5kIG9mIHRoZSByYW5nZSwgZXhjbHVzaXZlIChvcGVuKS5cbiAgICovXG4gIC8qKlxuICAgKiBEZWxldGUgc29tZSBvciBhbGwgbWVzc2FnZXMgaW4gYSB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljIC0gVG9waWMgbmFtZSB0byBkZWxldGUgbWVzc2FnZXMgZnJvbS5cbiAgICogQHBhcmFtIHtUaW5vZGUuRGVsUmFuZ2VbXX0gbGlzdCAtIFJhbmdlcyBvZiBtZXNzYWdlIElEcyB0byBkZWxldGUuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGhhcmQgLSBIYXJkIG9yIHNvZnQgZGVsZXRlXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGRlbE1lc3NhZ2VzOiBmdW5jdGlvbih0b3BpYywgcmFuZ2VzLCBoYXJkKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdkZWwnLCB0b3BpYyk7XG5cbiAgICBwa3QuZGVsLndoYXQgPSAnbXNnJztcbiAgICBwa3QuZGVsLmRlbHNlcSA9IHJhbmdlcztcbiAgICBwa3QuZGVsLmhhcmQgPSBoYXJkO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VuZChwa3QsIHBrdC5kZWwuaWQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhlIHRvcGljIGFsbHRvZ2V0aGVyLiBSZXF1aXJlcyBPd25lciBwZXJtaXNzaW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWNOYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gZGVsZXRlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaGFyZCAtIGhhcmQtZGVsZXRlIHRvcGljLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBkZWxUb3BpYzogZnVuY3Rpb24odG9waWNOYW1lLCBoYXJkKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdkZWwnLCB0b3BpY05hbWUpO1xuICAgIHBrdC5kZWwud2hhdCA9ICd0b3BpYyc7XG4gICAgcGt0LmRlbC5oYXJkID0gaGFyZDtcblxuICAgIHJldHVybiB0aGlzLnNlbmQocGt0LCBwa3QuZGVsLmlkKS50aGVuKChjdHJsKSA9PiB7XG4gICAgICB0aGlzLl9kYi5yZW1Ub3BpYyh0b3BpY05hbWUpO1xuICAgICAgdGhpcy5jYWNoZURlbCgndG9waWMnLCB0b3BpY05hbWUpO1xuICAgICAgcmV0dXJuIHRoaXMuY3RybDtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogRGVsZXRlIHN1YnNjcmlwdGlvbi4gUmVxdWlyZXMgU2hhcmUgcGVybWlzc2lvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIGRlbGV0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlciAtIFVzZXIgSUQgdG8gcmVtb3ZlLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBkZWxTdWJzY3JpcHRpb246IGZ1bmN0aW9uKHRvcGljTmFtZSwgdXNlcikge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuaW5pdFBhY2tldCgnZGVsJywgdG9waWNOYW1lKTtcbiAgICBwa3QuZGVsLndoYXQgPSAnc3ViJztcbiAgICBwa3QuZGVsLnVzZXIgPSB1c2VyO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VuZChwa3QsIHBrdC5kZWwuaWQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBEZWxldGUgY3JlZGVudGlhbC4gQWx3YXlzIHNlbnQgb24gPGNvZGU+J21lJzwvY29kZT4gdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSB2YWxpZGF0aW9uIG1ldGhvZCBzdWNoIGFzIDxjb2RlPidlbWFpbCc8L2NvZGU+IG9yIDxjb2RlPid0ZWwnPC9jb2RlPi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gdmFsaWRhdGlvbiB2YWx1ZSwgaS5lLiA8Y29kZT4nYWxpY2VAZXhhbXBsZS5jb20nPC9jb2RlPi5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgZGVsQ3JlZGVudGlhbDogZnVuY3Rpb24obWV0aG9kLCB2YWx1ZSkge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuaW5pdFBhY2tldCgnZGVsJywgVE9QSUNfTUUpO1xuICAgIHBrdC5kZWwud2hhdCA9ICdjcmVkJztcbiAgICBwa3QuZGVsLmNyZWQgPSB7XG4gICAgICBtZXRoOiBtZXRob2QsXG4gICAgICB2YWw6IHZhbHVlXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnNlbmQocGt0LCBwa3QuZGVsLmlkKTtcbiAgfSxcblxuICAvKipcbiAgICogUmVxdWVzdCB0byBkZWxldGUgYWNjb3VudCBvZiB0aGUgY3VycmVudCB1c2VyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhhcmQgLSBoYXJkLWRlbGV0ZSB1c2VyLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBkZWxDdXJyZW50VXNlcjogZnVuY3Rpb24oaGFyZCkge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuaW5pdFBhY2tldCgnZGVsJywgbnVsbCk7XG4gICAgcGt0LmRlbC53aGF0ID0gJ3VzZXInO1xuICAgIHBrdC5kZWwuaGFyZCA9IGhhcmQ7XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKHBrdCwgcGt0LmRlbC5pZCkudGhlbigoY3RybCkgPT4ge1xuICAgICAgdGhpcy5fbXlVSUQgPSBudWxsO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBOb3RpZnkgc2VydmVyIHRoYXQgYSBtZXNzYWdlIG9yIG1lc3NhZ2VzIHdlcmUgcmVhZCBvciByZWNlaXZlZC4gRG9lcyBOT1QgcmV0dXJuIHByb21pc2UuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB3aGVyZSB0aGUgbWVzYWdlIGlzIGJlaW5nIGFrbm93bGVkZ2VkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gd2hhdCAtIEFjdGlvbiBiZWluZyBha25vd2xlZGdlZCwgZWl0aGVyIDxjb2RlPlwicmVhZFwiPC9jb2RlPiBvciA8Y29kZT5cInJlY3ZcIjwvY29kZT4uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBNYXhpbXVtIGlkIG9mIHRoZSBtZXNzYWdlIGJlaW5nIGFja25vd2xlZGdlZC5cbiAgICovXG4gIG5vdGU6IGZ1bmN0aW9uKHRvcGljTmFtZSwgd2hhdCwgc2VxKSB7XG4gICAgaWYgKHNlcSA8PSAwIHx8IHNlcSA+PSBMT0NBTF9TRVFJRCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG1lc3NhZ2UgaWQgJHtzZXF9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdub3RlJywgdG9waWNOYW1lKTtcbiAgICBwa3Qubm90ZS53aGF0ID0gd2hhdDtcbiAgICBwa3Qubm90ZS5zZXEgPSBzZXE7XG4gICAgdGhpcy5zZW5kKHBrdCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEJyb2FkY2FzdCBhIGtleS1wcmVzcyBub3RpZmljYXRpb24gdG8gdG9waWMgc3Vic2NyaWJlcnMuIFVzZWQgdG8gc2hvd1xuICAgKiB0eXBpbmcgbm90aWZpY2F0aW9ucyBcInVzZXIgWCBpcyB0eXBpbmcuLi5cIi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIGJyb2FkY2FzdCB0by5cbiAgICovXG4gIG5vdGVLZXlQcmVzczogZnVuY3Rpb24odG9waWNOYW1lKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy5pbml0UGFja2V0KCdub3RlJywgdG9waWNOYW1lKTtcbiAgICBwa3Qubm90ZS53aGF0ID0gJ2twJztcbiAgICB0aGlzLnNlbmQocGt0KTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgbmFtZWQgdG9waWMsIGVpdGhlciBwdWxsIGl0IGZyb20gY2FjaGUgb3IgY3JlYXRlIGEgbmV3IGluc3RhbmNlLlxuICAgKiBUaGVyZSBpcyBhIHNpbmdsZSBpbnN0YW5jZSBvZiB0b3BpYyBmb3IgZWFjaCBuYW1lLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWNOYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyB7VGlub2RlLlRvcGljfSBSZXF1ZXN0ZWQgb3IgbmV3bHkgY3JlYXRlZCB0b3BpYyBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+IGlmIHRvcGljIG5hbWUgaXMgaW52YWxpZC5cbiAgICovXG4gIGdldFRvcGljOiBmdW5jdGlvbih0b3BpY05hbWUpIHtcbiAgICBsZXQgdG9waWMgPSB0aGlzLmNhY2hlR2V0KCd0b3BpYycsIHRvcGljTmFtZSk7XG4gICAgaWYgKCF0b3BpYyAmJiB0b3BpY05hbWUpIHtcbiAgICAgIGlmICh0b3BpY05hbWUgPT0gVE9QSUNfTUUpIHtcbiAgICAgICAgdG9waWMgPSBuZXcgVG9waWNNZSgpO1xuICAgICAgfSBlbHNlIGlmICh0b3BpY05hbWUgPT0gVE9QSUNfRk5EKSB7XG4gICAgICAgIHRvcGljID0gbmV3IFRvcGljRm5kKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b3BpYyA9IG5ldyBUb3BpYyh0b3BpY05hbWUpO1xuICAgICAgfVxuICAgICAgLy8gQ2FjaGUgbWFuYWdlbWVudC5cbiAgICAgIHRoaXMuX2RiLnVwZFRvcGljKHRvcGljKTtcbiAgICAgIHRoaXMuYXR0YWNoQ2FjaGVUb1RvcGljKHRvcGljKTtcbiAgICAgIHRvcGljLl9jYWNoZVB1dFNlbGYoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRvcGljO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBuYW1lZCB0b3BpYyBpcyBhbHJlYWR5IHByZXNlbnQgaW4gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgdG9waWMgaXMgZm91bmQgaW4gY2FjaGUsIGZhbHNlIG90ZXJ3aXNlLlxuICAgKi9cbiAgaXNUb3BpY0NhY2hlZDogZnVuY3Rpb24odG9waWNOYW1lKSB7XG4gICAgcmV0dXJuICEhdGhpcy5jYWNoZUdldCgndG9waWMnLCB0b3BpY05hbWUpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSB1bmlxdWUgbmFtZSBsaWtlIDxjb2RlPiduZXcxMjM0NTYnPC9jb2RlPiBzdWl0YWJsZSBmb3IgY3JlYXRpbmcgYSBuZXcgZ3JvdXAgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNDaGFuIC0gaWYgdGhlIHRvcGljIGlzIGNoYW5uZWwtZW5hYmxlZC5cbiAgICogQHJldHVybnMge3N0cmluZ30gbmFtZSB3aGljaCBjYW4gYmUgdXNlZCBmb3IgY3JlYXRpbmcgYSBuZXcgZ3JvdXAgdG9waWMuXG4gICAqL1xuICBuZXdHcm91cFRvcGljTmFtZTogZnVuY3Rpb24oaXNDaGFuKSB7XG4gICAgcmV0dXJuIChpc0NoYW4gPyBUT1BJQ19ORVdfQ0hBTiA6IFRPUElDX05FVykgKyB0aGlzLmdldE5leHRVbmlxdWVJZCgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZSA8Y29kZT4nbWUnPC9jb2RlPiB0b3BpYyBvciBnZXQgaXQgZnJvbSBjYWNoZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5Ub3BpY01lfSBJbnN0YW5jZSBvZiA8Y29kZT4nbWUnPC9jb2RlPiB0b3BpYy5cbiAgICovXG4gIGdldE1lVG9waWM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdldFRvcGljKFRPUElDX01FKTtcbiAgfSxcblxuICAvKipcbiAgICogSW5zdGFudGlhdGUgPGNvZGU+J2ZuZCc8L2NvZGU+IChmaW5kKSB0b3BpYyBvciBnZXQgaXQgZnJvbSBjYWNoZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5Ub3BpY30gSW5zdGFuY2Ugb2YgPGNvZGU+J2ZuZCc8L2NvZGU+IHRvcGljLlxuICAgKi9cbiAgZ2V0Rm5kVG9waWM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdldFRvcGljKFRPUElDX0ZORCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB7QGxpbmsgTGFyZ2VGaWxlSGVscGVyfSBpbnN0YW5jZVxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLkxhcmdlRmlsZUhlbHBlcn0gaW5zdGFuY2Ugb2YgYSB7QGxpbmsgVGlub2RlLkxhcmdlRmlsZUhlbHBlcn0uXG4gICAqL1xuICBnZXRMYXJnZUZpbGVIZWxwZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgTGFyZ2VGaWxlSGVscGVyKHRoaXMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIFVJRCBvZiB0aGUgdGhlIGN1cnJlbnQgYXV0aGVudGljYXRlZCB1c2VyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBVSUQgb2YgdGhlIGN1cnJlbnQgdXNlciBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+IGlmIHRoZSBzZXNzaW9uIGlzIG5vdCB5ZXQgYXV0aGVudGljYXRlZCBvciBpZiB0aGVyZSBpcyBubyBzZXNzaW9uLlxuICAgKi9cbiAgZ2V0Q3VycmVudFVzZXJJRDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX215VUlEO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdXNlciBJRCBpcyBlcXVhbCB0byB0aGUgY3VycmVudCB1c2VyJ3MgVUlELlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gVUlEIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2l2ZW4gVUlEIGJlbG9uZ3MgdG8gdGhlIGN1cnJlbnQgbG9nZ2VkIGluIHVzZXIuXG4gICAqL1xuICBpc01lOiBmdW5jdGlvbih1aWQpIHtcbiAgICByZXR1cm4gdGhpcy5fbXlVSUQgPT09IHVpZDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGxvZ2luIHVzZWQgZm9yIGxhc3Qgc3VjY2Vzc2Z1bCBhdXRoZW50aWNhdGlvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHJldHVybnMge3N0cmluZ30gbG9naW4gbGFzdCB1c2VkIHN1Y2Nlc3NmdWxseSBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+LlxuICAgKi9cbiAgZ2V0Q3VycmVudExvZ2luOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fbG9naW47XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgc2VydmVyOiBwcm90b2NvbCB2ZXJzaW9uIGFuZCBidWlsZCB0aW1lc3RhbXAuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IGJ1aWxkIGFuZCB2ZXJzaW9uIG9mIHRoZSBzZXJ2ZXIgb3IgPGNvZGU+bnVsbDwvY29kZT4gaWYgdGhlcmUgaXMgbm8gY29ubmVjdGlvbiBvciBpZiB0aGUgZmlyc3Qgc2VydmVyIHJlc3BvbnNlIGhhcyBub3QgYmVlbiByZWNlaXZlZCB5ZXQuXG4gICAqL1xuICBnZXRTZXJ2ZXJJbmZvOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VydmVySW5mbztcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJuIHNlcnZlci1wcm92aWRlZCBjb25maWd1cmF0aW9uIHZhbHVlIChsb25nIGludGVnZXIpLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0aGUgdmFsdWUgdG8gcmV0dXJuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkZWZhdWx0VmFsdWUgdG8gcmV0dXJuIGluIGNhc2Ugc2VydmVyIGxpbWl0IGlzIG5vdCBzZXQgb3Igbm90IGZvdW5kLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBuYW1lZCB2YWx1ZS5cbiAgICovXG4gIGdldFNlcnZlckxpbWl0OiBmdW5jdGlvbihuYW1lLCBkZWZhdWx0VmFsdWUpIHtcbiAgICByZXR1cm4gKHRoaXMuX3NlcnZlckluZm8gPyB0aGlzLl9zZXJ2ZXJJbmZvW25hbWVdIDogbnVsbCkgfHwgZGVmYXVsdFZhbHVlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBUb2dnbGUgY29uc29sZSBsb2dnaW5nLiBMb2dnaW5nIGlzIG9mZiBieSBkZWZhdWx0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGVuYWJsZWQgLSBTZXQgdG8gPGNvZGU+dHJ1ZTwvY29kZT4gdG8gZW5hYmxlIGxvZ2dpbmcgdG8gY29uc29sZS5cbiAgICogQHBhcmFtIHtib29sZWFufSB0cmltTG9uZ1N0cmluZ3MgLSBTZXQgdG8gPGNvZGU+dHJ1ZTwvY29kZT4gdG8gdHJpbSBsb25nIHN0cmluZ3MuXG4gICAqL1xuICBlbmFibGVMb2dnaW5nOiBmdW5jdGlvbihlbmFibGVkLCB0cmltTG9uZ1N0cmluZ3MpIHtcbiAgICB0aGlzLl9sb2dnaW5nRW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgdGhpcy5fdHJpbUxvbmdTdHJpbmdzID0gZW5hYmxlZCAmJiB0cmltTG9uZ1N0cmluZ3M7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCBVSSBsYW5ndWFnZSB0byByZXBvcnQgdG8gdGhlIHNlcnZlci4gTXVzdCBiZSBjYWxsZWQgYmVmb3JlIDxjb2RlPidoaSc8L2NvZGU+IGlzIHNlbnQsIG90aGVyd2lzZSBpdCB3aWxsIG5vdCBiZSB1c2VkLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGwgLSBodW1hbiAoVUkpIGxhbmd1YWdlLCBsaWtlIDxjb2RlPlwiZW5fVVNcIjwvY29kZT4gb3IgPGNvZGU+XCJ6aC1IYW5zXCI8L2NvZGU+LlxuICAgKi9cbiAgc2V0SHVtYW5MYW5ndWFnZTogZnVuY3Rpb24oaGwpIHtcbiAgICBpZiAoaGwpIHtcbiAgICAgIHRoaXMuX2h1bWFuTGFuZ3VhZ2UgPSBobDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGdpdmVuIHRvcGljIGlzIG9ubGluZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGhlIHRvcGljIHRvIHRlc3QuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRvcGljIGlzIG9ubGluZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNUb3BpY09ubGluZTogZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnN0IHRvcGljID0gdGhpcy5jYWNoZUdldCgndG9waWMnLCBuYW1lKTtcbiAgICByZXR1cm4gdG9waWMgJiYgdG9waWMub25saW5lO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYWNjZXNzIG1vZGUgZm9yIHRoZSBnaXZlbiBjb250YWN0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0aGUgdG9waWMgdG8gcXVlcnkuXG4gICAqIEByZXR1cm5zIHtBY2Nlc3NNb2RlfSBhY2Nlc3MgbW9kZSBpZiB0b3BpYyBpcyBmb3VuZCwgbnVsbCBvdGhlcndpc2UuXG4gICAqL1xuICBnZXRUb3BpY0FjY2Vzc01vZGU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zdCB0b3BpYyA9IHRoaXMuY2FjaGVHZXQoJ3RvcGljJywgbmFtZSk7XG4gICAgcmV0dXJuIHRvcGljID8gdG9waWMuYWNzIDogbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogSW5jbHVkZSBtZXNzYWdlIElEIGludG8gYWxsIHN1YnNlcXVlc3QgbWVzc2FnZXMgdG8gc2VydmVyIGluc3RydWN0aW4gaXQgdG8gc2VuZCBha25vd2xlZGdlbWVucy5cbiAgICogUmVxdWlyZWQgZm9yIHByb21pc2VzIHRvIGZ1bmN0aW9uLiBEZWZhdWx0IGlzIDxjb2RlPlwib25cIjwvY29kZT4uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc3RhdHVzIC0gVHVybiBha25vd2xlZGdlbWVucyBvbiBvciBvZmYuXG4gICAqIEBkZXByZWNhdGVkXG4gICAqL1xuICB3YW50QWtuOiBmdW5jdGlvbihzdGF0dXMpIHtcbiAgICBpZiAoc3RhdHVzKSB7XG4gICAgICB0aGlzLl9tZXNzYWdlSWQgPSBNYXRoLmZsb29yKChNYXRoLnJhbmRvbSgpICogMHhGRkZGRkYpICsgMHhGRkZGRkYpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9tZXNzYWdlSWQgPSAwO1xuICAgIH1cbiAgfSxcblxuICAvLyBDYWxsYmFja3M6XG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZXBvcnQgd2hlbiB0aGUgd2Vic29ja2V0IGlzIG9wZW5lZC4gVGhlIGNhbGxiYWNrIGhhcyBubyBwYXJhbWV0ZXJzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uV2Vic29ja2V0T3Blbn1cbiAgICovXG4gIG9uV2Vic29ja2V0T3BlbjogdW5kZWZpbmVkLFxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBUaW5vZGUuU2VydmVyUGFyYW1zXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IHZlciAtIFNlcnZlciB2ZXJzaW9uXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBidWlsZCAtIFNlcnZlciBidWlsZFxuICAgKiBAcHJvcGVydHkge3N0cmluZz19IHNpZCAtIFNlc3Npb24gSUQsIGxvbmcgcG9sbGluZyBjb25uZWN0aW9ucyBvbmx5LlxuICAgKi9cblxuICAvKipcbiAgICogQGNhbGxiYWNrIFRpbm9kZS5vbkNvbm5lY3RcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvZGUgLSBSZXN1bHQgY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRleHQgZXB4cGxhaW5pbmcgdGhlIGNvbXBsZXRpb24sIGkuZSBcIk9LXCIgb3IgYW4gZXJyb3IgbWVzc2FnZS5cbiAgICogQHBhcmFtIHtUaW5vZGUuU2VydmVyUGFyYW1zfSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHJldHVybmVkIGJ5IHRoZSBzZXJ2ZXIuXG4gICAqL1xuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVwb3J0IHdoZW4gY29ubmVjdGlvbiB3aXRoIFRpbm9kZSBzZXJ2ZXIgaXMgZXN0YWJsaXNoZWQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25Db25uZWN0fVxuICAgKi9cbiAgb25Db25uZWN0OiB1bmRlZmluZWQsXG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlcG9ydCB3aGVuIGNvbm5lY3Rpb24gaXMgbG9zdC4gVGhlIGNhbGxiYWNrIGhhcyBubyBwYXJhbWV0ZXJzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uRGlzY29ubmVjdH1cbiAgICovXG4gIG9uRGlzY29ubmVjdDogdW5kZWZpbmVkLFxuXG4gIC8qKlxuICAgKiBAY2FsbGJhY2sgVGlub2RlLm9uTG9naW5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvZGUgLSBOVW1lcmljIGNvbXBsZXRpb24gY29kZSwgc2FtZSBhcyBIVFRQIHN0YXR1cyBjb2Rlcy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBFeHBsYW5hdGlvbiBvZiB0aGUgY29tcGxldGlvbiBjb2RlLlxuICAgKi9cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlcG9ydCBsb2dpbiBjb21wbGV0aW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uTG9naW59XG4gICAqL1xuICBvbkxvZ2luOiB1bmRlZmluZWQsXG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlY2VpdmUgPGNvZGU+e2N0cmx9PC9jb2RlPiAoY29udHJvbCkgbWVzc2FnZXMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25DdHJsTWVzc2FnZX1cbiAgICovXG4gIG9uQ3RybE1lc3NhZ2U6IHVuZGVmaW5lZCxcblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVjaWV2ZSA8Y29kZT57ZGF0YX08L2NvZGU+IChjb250ZW50KSBtZXNzYWdlcy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbkRhdGFNZXNzYWdlfVxuICAgKi9cbiAgb25EYXRhTWVzc2FnZTogdW5kZWZpbmVkLFxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZWNlaXZlIDxjb2RlPntwcmVzfTwvY29kZT4gKHByZXNlbmNlKSBtZXNzYWdlcy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vblByZXNNZXNzYWdlfVxuICAgKi9cbiAgb25QcmVzTWVzc2FnZTogdW5kZWZpbmVkLFxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZWNlaXZlIGFsbCBtZXNzYWdlcyBhcyBvYmplY3RzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uTWVzc2FnZX1cbiAgICovXG4gIG9uTWVzc2FnZTogdW5kZWZpbmVkLFxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZWNlaXZlIGFsbCBtZXNzYWdlcyBhcyB1bnBhcnNlZCB0ZXh0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uUmF3TWVzc2FnZX1cbiAgICovXG4gIG9uUmF3TWVzc2FnZTogdW5kZWZpbmVkLFxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZWNlaXZlIHNlcnZlciByZXNwb25zZXMgdG8gbmV0d29yayBwcm9iZXMuIFNlZSB7QGxpbmsgVGlub2RlI25ldHdvcmtQcm9iZX1cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbk5ldHdvcmtQcm9iZX1cbiAgICovXG4gIG9uTmV0d29ya1Byb2JlOiB1bmRlZmluZWQsXG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gZXhwb25lbnRpYWwgYmFja29mZiBpcyBpdGVyYXRpbmcuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25BdXRvcmVjb25uZWN0SXRlcmF0aW9ufVxuICAgKi9cbiAgb25BdXRvcmVjb25uZWN0SXRlcmF0aW9uOiB1bmRlZmluZWQsXG59O1xuXG4vKipcbiAqIEhlbHBlciBjbGFzcyBmb3IgY29uc3RydWN0aW5nIHtAbGluayBUaW5vZGUuR2V0UXVlcnl9LlxuICpcbiAqIEBjbGFzcyBNZXRhR2V0QnVpbGRlclxuICogQG1lbWJlcm9mIFRpbm9kZVxuICpcbiAqIEBwYXJhbSB7VGlub2RlLlRvcGljfSBwYXJlbnQgdG9waWMgd2hpY2ggaW5zdGFudGlhdGVkIHRoaXMgYnVpbGRlci5cbiAqL1xudmFyIE1ldGFHZXRCdWlsZGVyID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gIHRoaXMudG9waWMgPSBwYXJlbnQ7XG4gIHRoaXMud2hhdCA9IHt9O1xufVxuXG5NZXRhR2V0QnVpbGRlci5wcm90b3R5cGUgPSB7XG5cbiAgLy8gR2V0IHRpbWVzdGFtcCBvZiB0aGUgbW9zdCByZWNlbnQgZGVzYyB1cGRhdGUuXG4gIF9nZXRfZGVzY19pbXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHR1cGQgPSB0aGlzLnRvcGljLl9sYXN0RGVzY1VwZGF0ZSB8fCAwO1xuICAgIHJldHVybiB0aGlzLnRvcGljLnVwZGF0ZWQgPiB0dXBkID8gdGhpcy50b3BpYy51cGRhdGVkIDogdHVwZDtcbiAgfSxcblxuICAvLyBHZXQgdGltZXN0YW1wIG9mIHRoZSBtb3N0IHJlY2VudCBzdWJzIHVwZGF0ZS5cbiAgX2dldF9zdWJzX2ltczogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMudG9waWMuaXNQMlBUeXBlKCkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRfZGVzY19pbXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudG9waWMuaXNNZVR5cGUoKSkge1xuICAgICAgY29uc3QgZ3VwZCA9IHRoaXMudG9waWMuX3Rpbm9kZS5fbGFzdFRvcGljVXBkYXRlIHx8IDA7XG4gICAgICBpZiAoZ3VwZCA+IHRoaXMudG9waWMuX2xhc3RTdWJzVXBkYXRlKSB7XG4gICAgICAgIHJldHVybiBndXBkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy50b3BpYy5fbGFzdFN1YnNVcGRhdGU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIG1lc3NhZ2VzIHdpdGhpbiBleHBsaWNpdCBsaW1pdHMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gc2luY2UgLSBtZXNzYWdlcyBuZXdlciB0aGFuIHRoaXMgKGluY2x1c2l2ZSk7XG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gYmVmb3JlIC0gb2xkZXIgdGhhbiB0aGlzIChleGNsdXNpdmUpXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbGltaXQgLSBudW1iZXIgb2YgbWVzc2FnZXMgdG8gZmV0Y2hcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aERhdGE6IGZ1bmN0aW9uKHNpbmNlLCBiZWZvcmUsIGxpbWl0KSB7XG4gICAgdGhpcy53aGF0WydkYXRhJ10gPSB7XG4gICAgICBzaW5jZTogc2luY2UsXG4gICAgICBiZWZvcmU6IGJlZm9yZSxcbiAgICAgIGxpbWl0OiBsaW1pdFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIG1lc3NhZ2VzIG5ld2VyIHRoYW4gdGhlIGxhdGVzdCBzYXZlZCBtZXNzYWdlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IGxpbWl0IC0gbnVtYmVyIG9mIG1lc3NhZ2VzIHRvIGZldGNoXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhMYXRlckRhdGE6IGZ1bmN0aW9uKGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aERhdGEodGhpcy50b3BpYy5fbWF4U2VxID4gMCA/IHRoaXMudG9waWMuX21heFNlcSArIDEgOiB1bmRlZmluZWQsIHVuZGVmaW5lZCwgbGltaXQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBtZXNzYWdlcyBvbGRlciB0aGFuIHRoZSBlYXJsaWVzdCBzYXZlZCBtZXNzYWdlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IGxpbWl0IC0gbWF4aW11bSBudW1iZXIgb2YgbWVzc2FnZXMgdG8gZmV0Y2guXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhFYXJsaWVyRGF0YTogZnVuY3Rpb24obGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoRGF0YSh1bmRlZmluZWQsIHRoaXMudG9waWMuX21pblNlcSA+IDAgPyB0aGlzLnRvcGljLl9taW5TZXEgOiB1bmRlZmluZWQsIGxpbWl0KTtcbiAgfSxcblxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggdG9waWMgZGVzY3JpcHRpb24gaWYgaXQncyBuZXdlciB0aGFuIHRoZSBnaXZlbiB0aW1lc3RhbXAuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7RGF0ZT19IGltcyAtIGZldGNoIG1lc3NhZ2VzIG5ld2VyIHRoYW4gdGhpcyB0aW1lc3RhbXAuXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhEZXNjOiBmdW5jdGlvbihpbXMpIHtcbiAgICB0aGlzLndoYXRbJ2Rlc2MnXSA9IHtcbiAgICAgIGltczogaW1zXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggdG9waWMgZGVzY3JpcHRpb24gaWYgaXQncyBuZXdlciB0aGFuIHRoZSBsYXN0IHVwZGF0ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5NZXRhR2V0QnVpbGRlciNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aExhdGVyRGVzYzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aERlc2ModGhpcy5fZ2V0X2Rlc2NfaW1zKCkpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBzdWJzY3JpcHRpb25zLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge0RhdGU9fSBpbXMgLSBmZXRjaCBzdWJzY3JpcHRpb25zIG1vZGlmaWVkIG1vcmUgcmVjZW50bHkgdGhhbiB0aGlzIHRpbWVzdGFtcFxuICAgKiBAcGFyYW0ge251bWJlcj19IGxpbWl0IC0gbWF4aW11bSBudW1iZXIgb2Ygc3Vic2NyaXB0aW9ucyB0byBmZXRjaC5cbiAgICogQHBhcmFtIHtzdHJpbmc9fSB1c2VyT3JUb3BpYyAtIHVzZXIgSUQgb3IgdG9waWMgbmFtZSB0byBmZXRjaCBmb3IgZmV0Y2hpbmcgb25lIHN1YnNjcmlwdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aFN1YjogZnVuY3Rpb24oaW1zLCBsaW1pdCwgdXNlck9yVG9waWMpIHtcbiAgICBjb25zdCBvcHRzID0ge1xuICAgICAgaW1zOiBpbXMsXG4gICAgICBsaW1pdDogbGltaXRcbiAgICB9O1xuICAgIGlmICh0aGlzLnRvcGljLmdldFR5cGUoKSA9PSAnbWUnKSB7XG4gICAgICBvcHRzLnRvcGljID0gdXNlck9yVG9waWM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdHMudXNlciA9IHVzZXJPclRvcGljO1xuICAgIH1cbiAgICB0aGlzLndoYXRbJ3N1YiddID0gb3B0cztcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggYSBzaW5nbGUgc3Vic2NyaXB0aW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge0RhdGU9fSBpbXMgLSBmZXRjaCBzdWJzY3JpcHRpb25zIG1vZGlmaWVkIG1vcmUgcmVjZW50bHkgdGhhbiB0aGlzIHRpbWVzdGFtcFxuICAgKiBAcGFyYW0ge3N0cmluZz19IHVzZXJPclRvcGljIC0gdXNlciBJRCBvciB0b3BpYyBuYW1lIHRvIGZldGNoIGZvciBmZXRjaGluZyBvbmUgc3Vic2NyaXB0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoT25lU3ViOiBmdW5jdGlvbihpbXMsIHVzZXJPclRvcGljKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aFN1YihpbXMsIHVuZGVmaW5lZCwgdXNlck9yVG9waWMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBhIHNpbmdsZSBzdWJzY3JpcHRpb24gaWYgaXQncyBiZWVuIHVwZGF0ZWQgc2luY2UgdGhlIGxhc3QgdXBkYXRlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZz19IHVzZXJPclRvcGljIC0gdXNlciBJRCBvciB0b3BpYyBuYW1lIHRvIGZldGNoIGZvciBmZXRjaGluZyBvbmUgc3Vic2NyaXB0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoTGF0ZXJPbmVTdWI6IGZ1bmN0aW9uKHVzZXJPclRvcGljKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aE9uZVN1Yih0aGlzLnRvcGljLl9sYXN0U3Vic1VwZGF0ZSwgdXNlck9yVG9waWMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBzdWJzY3JpcHRpb25zIHVwZGF0ZWQgc2luY2UgdGhlIGxhc3QgdXBkYXRlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IGxpbWl0IC0gbWF4aW11bSBudW1iZXIgb2Ygc3Vic2NyaXB0aW9ucyB0byBmZXRjaC5cbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aExhdGVyU3ViOiBmdW5jdGlvbihsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLndpdGhTdWIodGhpcy5fZ2V0X3N1YnNfaW1zKCksIGxpbWl0KTtcbiAgfSxcblxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggdG9waWMgdGFncy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5NZXRhR2V0QnVpbGRlciNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aFRhZ3M6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMud2hhdFsndGFncyddID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggdXNlcidzIGNyZWRlbnRpYWxzLiA8Y29kZT4nbWUnPC9jb2RlPiB0b3BpYyBvbmx5LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoQ3JlZDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMudG9waWMuZ2V0VHlwZSgpID09ICdtZScpIHtcbiAgICAgIHRoaXMud2hhdFsnY3JlZCddID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50b3BpYy5fdGlub2RlLmxvZ2dlcihcIkVSUk9SOiBJbnZhbGlkIHRvcGljIHR5cGUgZm9yIE1ldGFHZXRCdWlsZGVyOndpdGhDcmVkc1wiLCB0aGlzLnRvcGljLmdldFR5cGUoKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBkZWxldGVkIG1lc3NhZ2VzIHdpdGhpbiBleHBsaWNpdCBsaW1pdHMuIEFueS9hbGwgcGFyYW1ldGVycyBjYW4gYmUgbnVsbC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5NZXRhR2V0QnVpbGRlciNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXI9fSBzaW5jZSAtIGlkcyBvZiBtZXNzYWdlcyBkZWxldGVkIHNpbmNlIHRoaXMgJ2RlbCcgaWQgKGluY2x1c2l2ZSlcbiAgICogQHBhcmFtIHtudW1iZXI9fSBsaW1pdCAtIG51bWJlciBvZiBkZWxldGVkIG1lc3NhZ2UgaWRzIHRvIGZldGNoXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhEZWw6IGZ1bmN0aW9uKHNpbmNlLCBsaW1pdCkge1xuICAgIGlmIChzaW5jZSB8fCBsaW1pdCkge1xuICAgICAgdGhpcy53aGF0WydkZWwnXSA9IHtcbiAgICAgICAgc2luY2U6IHNpbmNlLFxuICAgICAgICBsaW1pdDogbGltaXRcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBtZXNzYWdlcyBkZWxldGVkIGFmdGVyIHRoZSBzYXZlZCA8Y29kZT4nZGVsJzwvY29kZT4gaWQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbGltaXQgLSBudW1iZXIgb2YgZGVsZXRlZCBtZXNzYWdlIGlkcyB0byBmZXRjaFxuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoTGF0ZXJEZWw6IGZ1bmN0aW9uKGxpbWl0KSB7XG4gICAgLy8gU3BlY2lmeSAnc2luY2UnIG9ubHkgaWYgd2UgaGF2ZSBhbHJlYWR5IHJlY2VpdmVkIHNvbWUgbWVzc2FnZXMuIElmXG4gICAgLy8gd2UgaGF2ZSBubyBsb2NhbGx5IGNhY2hlZCBtZXNzYWdlcyB0aGVuIHdlIGRvbid0IGNhcmUgaWYgYW55IG1lc3NhZ2VzIHdlcmUgZGVsZXRlZC5cbiAgICByZXR1cm4gdGhpcy53aXRoRGVsKHRoaXMudG9waWMuX21heFNlcSA+IDAgPyB0aGlzLnRvcGljLl9tYXhEZWwgKyAxIDogdW5kZWZpbmVkLCBsaW1pdCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBwYXJhbWV0ZXJzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLkdldFF1ZXJ5fSBHZXQgcXVlcnlcbiAgICovXG4gIGJ1aWxkOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCB3aGF0ID0gW107XG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzO1xuICAgIGxldCBwYXJhbXMgPSB7fTtcbiAgICBbJ2RhdGEnLCAnc3ViJywgJ2Rlc2MnLCAndGFncycsICdjcmVkJywgJ2RlbCddLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChpbnN0YW5jZS53aGF0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgd2hhdC5wdXNoKGtleSk7XG4gICAgICAgIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhpbnN0YW5jZS53aGF0W2tleV0pLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBwYXJhbXNba2V5XSA9IGluc3RhbmNlLndoYXRba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh3aGF0Lmxlbmd0aCA+IDApIHtcbiAgICAgIHBhcmFtcy53aGF0ID0gd2hhdC5qb2luKCcgJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcyA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtcztcbiAgfVxufTtcblxuLyoqXG4gKiBIZWxwZXIgY2xhc3MgZm9yIGhhbmRsaW5nIGFjY2VzcyBtb2RlLlxuICpcbiAqIEBjbGFzcyBBY2Nlc3NNb2RlXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtBY2Nlc3NNb2RlfE9iamVjdD19IGFjcyAtIEFjY2Vzc01vZGUgdG8gY29weSBvciBhY2Nlc3MgbW9kZSBvYmplY3QgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyLlxuICovXG52YXIgQWNjZXNzTW9kZSA9IGZ1bmN0aW9uKGFjcykge1xuICBpZiAoYWNzKSB7XG4gICAgdGhpcy5naXZlbiA9IHR5cGVvZiBhY3MuZ2l2ZW4gPT0gJ251bWJlcicgPyBhY3MuZ2l2ZW4gOiBBY2Nlc3NNb2RlLmRlY29kZShhY3MuZ2l2ZW4pO1xuICAgIHRoaXMud2FudCA9IHR5cGVvZiBhY3Mud2FudCA9PSAnbnVtYmVyJyA/IGFjcy53YW50IDogQWNjZXNzTW9kZS5kZWNvZGUoYWNzLndhbnQpO1xuICAgIHRoaXMubW9kZSA9IGFjcy5tb2RlID8gKHR5cGVvZiBhY3MubW9kZSA9PSAnbnVtYmVyJyA/IGFjcy5tb2RlIDogQWNjZXNzTW9kZS5kZWNvZGUoYWNzLm1vZGUpKSA6XG4gICAgICAodGhpcy5naXZlbiAmIHRoaXMud2FudCk7XG4gIH1cbn07XG5cbkFjY2Vzc01vZGUuX05PTkUgPSAweDAwO1xuQWNjZXNzTW9kZS5fSk9JTiA9IDB4MDE7XG5BY2Nlc3NNb2RlLl9SRUFEID0gMHgwMjtcbkFjY2Vzc01vZGUuX1dSSVRFID0gMHgwNDtcbkFjY2Vzc01vZGUuX1BSRVMgPSAweDA4O1xuQWNjZXNzTW9kZS5fQVBQUk9WRSA9IDB4MTA7XG5BY2Nlc3NNb2RlLl9TSEFSRSA9IDB4MjA7XG5BY2Nlc3NNb2RlLl9ERUxFVEUgPSAweDQwO1xuQWNjZXNzTW9kZS5fT1dORVIgPSAweDgwO1xuXG5BY2Nlc3NNb2RlLl9CSVRNQVNLID0gQWNjZXNzTW9kZS5fSk9JTiB8IEFjY2Vzc01vZGUuX1JFQUQgfCBBY2Nlc3NNb2RlLl9XUklURSB8IEFjY2Vzc01vZGUuX1BSRVMgfFxuICBBY2Nlc3NNb2RlLl9BUFBST1ZFIHwgQWNjZXNzTW9kZS5fU0hBUkUgfCBBY2Nlc3NNb2RlLl9ERUxFVEUgfCBBY2Nlc3NNb2RlLl9PV05FUjtcbkFjY2Vzc01vZGUuX0lOVkFMSUQgPSAweDEwMDAwMDtcblxuQWNjZXNzTW9kZS5fY2hlY2tGbGFnID0gZnVuY3Rpb24odmFsLCBzaWRlLCBmbGFnKSB7XG4gIHNpZGUgPSBzaWRlIHx8ICdtb2RlJztcbiAgaWYgKFsnZ2l2ZW4nLCAnd2FudCcsICdtb2RlJ10uaW5jbHVkZXMoc2lkZSkpIHtcbiAgICByZXR1cm4gKCh2YWxbc2lkZV0gJiBmbGFnKSAhPSAwKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgQWNjZXNzTW9kZSBjb21wb25lbnQgJyR7c2lkZX0nYCk7XG59XG5cbi8qKlxuICogUGFyc2Ugc3RyaW5nIGludG8gYW4gYWNjZXNzIG1vZGUgdmFsdWUuXG4gKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZyB8IE51bWJlcn0gbW9kZSAtIGVpdGhlciBhIFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWNjZXNzIG1vZGUgdG8gcGFyc2Ugb3IgYSBzZXQgb2YgYml0cyB0byBhc3NpZ24uXG4gKiBAcmV0dXJucyB7bnVtYmVyfSAtIEFjY2VzcyBtb2RlIGFzIGEgbnVtZXJpYyB2YWx1ZS5cbiAqL1xuQWNjZXNzTW9kZS5kZWNvZGUgPSBmdW5jdGlvbihzdHIpIHtcbiAgaWYgKCFzdHIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygc3RyID09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIHN0ciAmIEFjY2Vzc01vZGUuX0JJVE1BU0s7XG4gIH0gZWxzZSBpZiAoc3RyID09PSAnTicgfHwgc3RyID09PSAnbicpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5fTk9ORTtcbiAgfVxuXG4gIGNvbnN0IGJpdG1hc2sgPSB7XG4gICAgJ0onOiBBY2Nlc3NNb2RlLl9KT0lOLFxuICAgICdSJzogQWNjZXNzTW9kZS5fUkVBRCxcbiAgICAnVyc6IEFjY2Vzc01vZGUuX1dSSVRFLFxuICAgICdQJzogQWNjZXNzTW9kZS5fUFJFUyxcbiAgICAnQSc6IEFjY2Vzc01vZGUuX0FQUFJPVkUsXG4gICAgJ1MnOiBBY2Nlc3NNb2RlLl9TSEFSRSxcbiAgICAnRCc6IEFjY2Vzc01vZGUuX0RFTEVURSxcbiAgICAnTyc6IEFjY2Vzc01vZGUuX09XTkVSXG4gIH07XG5cbiAgbGV0IG0wID0gQWNjZXNzTW9kZS5fTk9ORTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGJpdCA9IGJpdG1hc2tbc3RyLmNoYXJBdChpKS50b1VwcGVyQ2FzZSgpXTtcbiAgICBpZiAoIWJpdCkge1xuICAgICAgLy8gVW5yZWNvZ25pemVkIGJpdCwgc2tpcC5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBtMCB8PSBiaXQ7XG4gIH1cbiAgcmV0dXJuIG0wO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0IG51bWVyaWMgcmVwcmVzZW50YXRpb24gb2YgdGhlIGFjY2VzcyBtb2RlIGludG8gYSBzdHJpbmcuXG4gKlxuICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCAtIGFjY2VzcyBtb2RlIHZhbHVlIHRvIGNvbnZlcnQgdG8gYSBzdHJpbmcuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIEFjY2VzcyBtb2RlIGFzIGEgc3RyaW5nLlxuICovXG5BY2Nlc3NNb2RlLmVuY29kZSA9IGZ1bmN0aW9uKHZhbCkge1xuICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gQWNjZXNzTW9kZS5fSU5WQUxJRCkge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2UgaWYgKHZhbCA9PT0gQWNjZXNzTW9kZS5fTk9ORSkge1xuICAgIHJldHVybiAnTic7XG4gIH1cblxuICBjb25zdCBiaXRtYXNrID0gWydKJywgJ1InLCAnVycsICdQJywgJ0EnLCAnUycsICdEJywgJ08nXTtcbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJpdG1hc2subGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKHZhbCAmICgxIDw8IGkpKSAhPSAwKSB7XG4gICAgICByZXMgPSByZXMgKyBiaXRtYXNrW2ldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgbnVtZXJpYyByZXByZXNlbnRhdGlvbiBvZiBhY2Nlc3MgbW9kZSB3aXRoIHRoZSBuZXcgdmFsdWUuIFRoZSB2YWx1ZVxuICogaXMgb25lIG9mIHRoZSBmb2xsb3dpbmc6XG4gKiAgLSBhIHN0cmluZyBzdGFydGluZyB3aXRoIDxjb2RlPicrJzwvY29kZT4gb3IgPGNvZGU+Jy0nPC9jb2RlPiB0aGVuIHRoZSBiaXRzIHRvIGFkZCBvciByZW1vdmUsIGUuZy4gPGNvZGU+JytSLVcnPC9jb2RlPiBvciA8Y29kZT4nLVBTJzwvY29kZT4uXG4gKiAgLSBhIG5ldyB2YWx1ZSBvZiBhY2Nlc3MgbW9kZVxuICpcbiAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgLSBhY2Nlc3MgbW9kZSB2YWx1ZSB0byB1cGRhdGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gdXBkIC0gdXBkYXRlIHRvIGFwcGx5IHRvIHZhbC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gdXBkYXRlZCBhY2Nlc3MgbW9kZS5cbiAqL1xuQWNjZXNzTW9kZS51cGRhdGUgPSBmdW5jdGlvbih2YWwsIHVwZCkge1xuICBpZiAoIXVwZCB8fCB0eXBlb2YgdXBkICE9ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIGxldCBhY3Rpb24gPSB1cGQuY2hhckF0KDApO1xuICBpZiAoYWN0aW9uID09ICcrJyB8fCBhY3Rpb24gPT0gJy0nKSB7XG4gICAgbGV0IHZhbDAgPSB2YWw7XG4gICAgLy8gU3BsaXQgZGVsdGEtc3RyaW5nIGxpa2UgJytBQkMtREVGK1onIGludG8gYW4gYXJyYXkgb2YgcGFydHMgaW5jbHVkaW5nICsgYW5kIC0uXG4gICAgY29uc3QgcGFydHMgPSB1cGQuc3BsaXQoLyhbLStdKS8pO1xuICAgIC8vIFN0YXJ0aW5nIGl0ZXJhdGlvbiBmcm9tIDEgYmVjYXVzZSBTdHJpbmcuc3BsaXQoKSBjcmVhdGVzIGFuIGFycmF5IHdpdGggdGhlIGZpcnN0IGVtcHR5IGVsZW1lbnQuXG4gICAgLy8gSXRlcmF0aW5nIGJ5IDIgYmVjYXVzZSB3ZSBwYXJzZSBwYWlycyArLy0gdGhlbiBkYXRhLlxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcGFydHMubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBhY3Rpb24gPSBwYXJ0c1tpXTtcbiAgICAgIGNvbnN0IG0wID0gQWNjZXNzTW9kZS5kZWNvZGUocGFydHNbaSArIDFdKTtcbiAgICAgIGlmIChtMCA9PSBBY2Nlc3NNb2RlLl9JTlZBTElEKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgICB9XG4gICAgICBpZiAobTAgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChhY3Rpb24gPT09ICcrJykge1xuICAgICAgICB2YWwwIHw9IG0wO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICctJykge1xuICAgICAgICB2YWwwICY9IH5tMDtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFsID0gdmFsMDtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGUgc3RyaW5nIGlzIGFuIGV4cGxpY2l0IG5ldyB2YWx1ZSAnQUJDJyByYXRoZXIgdGhhbiBkZWx0YS5cbiAgICBjb25zdCB2YWwwID0gQWNjZXNzTW9kZS5kZWNvZGUodXBkKTtcbiAgICBpZiAodmFsMCAhPSBBY2Nlc3NNb2RlLl9JTlZBTElEKSB7XG4gICAgICB2YWwgPSB2YWwwO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB2YWw7XG59O1xuXG4vKipcbiAqIEJpdHMgcHJlc2VudCBpbiBhMSBidXQgbWlzc2luZyBpbiBhMi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtudW1iZXIgfCBzdHJpbmd9IGExIC0gYWNjZXNzIG1vZGUgdG8gc3VidHJhY3QgZnJvbS5cbiAqIEBwYXJhbSB7bnVtYmVyIHwgc3RyaW5nfSBhMiAtIGFjY2VzcyBtb2RlIHRvIHN1YnRyYWN0LlxuICogQHJldHVybnMge251bWJlcn0gYWNjZXNzIG1vZGUgd2l0aCBiaXRzIHByZXNlbnQgaW4gPGNvZGU+YTE8L2NvZGU+IGJ1dCBtaXNzaW5nIGluIDxjb2RlPmEyPC9jb2RlPi5cbiAqL1xuQWNjZXNzTW9kZS5kaWZmID0gZnVuY3Rpb24oYTEsIGEyKSB7XG4gIGExID0gQWNjZXNzTW9kZS5kZWNvZGUoYTEpO1xuICBhMiA9IEFjY2Vzc01vZGUuZGVjb2RlKGEyKTtcblxuICBpZiAoYTEgPT0gQWNjZXNzTW9kZS5fSU5WQUxJRCB8fCBhMiA9PSBBY2Nlc3NNb2RlLl9JTlZBTElEKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuX0lOVkFMSUQ7XG4gIH1cbiAgcmV0dXJuIGExICYgfmEyO1xufTtcblxuLyoqXG4gKiBBY2Nlc3NNb2RlIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIHRvcGljIGFjY2VzcyBtb2RlLlxuICpcbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqIEBjbGFzcyBBY2Nlc3NNb2RlXG4gKi9cbkFjY2Vzc01vZGUucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogQ3VzdG9tIGZvcm1hdHRlclxuICAgKi9cbiAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAne1wibW9kZVwiOiBcIicgKyBBY2Nlc3NNb2RlLmVuY29kZSh0aGlzLm1vZGUpICtcbiAgICAgICdcIiwgXCJnaXZlblwiOiBcIicgKyBBY2Nlc3NNb2RlLmVuY29kZSh0aGlzLmdpdmVuKSArXG4gICAgICAnXCIsIFwid2FudFwiOiBcIicgKyBBY2Nlc3NNb2RlLmVuY29kZSh0aGlzLndhbnQpICsgJ1wifSc7XG4gIH0sXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBudW1lcmljIHZhbHVlcyB0byBzdHJpbmdzLlxuICAgKi9cbiAganNvbkhlbHBlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1vZGU6IEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMubW9kZSksXG4gICAgICBnaXZlbjogQWNjZXNzTW9kZS5lbmNvZGUodGhpcy5naXZlbiksXG4gICAgICB3YW50OiBBY2Nlc3NNb2RlLmVuY29kZSh0aGlzLndhbnQpXG4gICAgfTtcbiAgfSxcbiAgLyoqXG4gICAqIEFzc2lnbiB2YWx1ZSB0byAnbW9kZScuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IE51bWJlcn0gbSAtIGVpdGhlciBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWNjZXNzIG1vZGUgb3IgYSBzZXQgb2YgYml0cy5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IC0gPGNvZGU+dGhpczwvY29kZT4gQWNjZXNzTW9kZS5cbiAgICovXG4gIHNldE1vZGU6IGZ1bmN0aW9uKG0pIHtcbiAgICB0aGlzLm1vZGUgPSBBY2Nlc3NNb2RlLmRlY29kZShtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIFVwZGF0ZSA8Y29kZT5tb2RlPC9jb2RlPiB2YWx1ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1IC0gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjaGFuZ2VzIHRvIGFwcGx5IHRvIGFjY2VzcyBtb2RlLlxuICAgKiBAcmV0dXJucyB7QWNjZXNzTW9kZX0gLSA8Y29kZT50aGlzPC9jb2RlPiBBY2Nlc3NNb2RlLlxuICAgKi9cbiAgdXBkYXRlTW9kZTogZnVuY3Rpb24odSkge1xuICAgIHRoaXMubW9kZSA9IEFjY2Vzc01vZGUudXBkYXRlKHRoaXMubW9kZSwgdSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBHZXQgPGNvZGU+bW9kZTwvY29kZT4gdmFsdWUgYXMgYSBzdHJpbmcuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIDxjb2RlPm1vZGU8L2NvZGU+IHZhbHVlLlxuICAgKi9cbiAgZ2V0TW9kZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMubW9kZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFzc2lnbiA8Y29kZT5naXZlbjwvY29kZT4gIHZhbHVlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBOdW1iZXJ9IGcgLSBlaXRoZXIgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGFjY2VzcyBtb2RlIG9yIGEgc2V0IG9mIGJpdHMuXG4gICAqIEByZXR1cm5zIHtBY2Nlc3NNb2RlfSAtIDxjb2RlPnRoaXM8L2NvZGU+IEFjY2Vzc01vZGUuXG4gICAqL1xuICBzZXRHaXZlbjogZnVuY3Rpb24oZykge1xuICAgIHRoaXMuZ2l2ZW4gPSBBY2Nlc3NNb2RlLmRlY29kZShnKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIFVwZGF0ZSAnZ2l2ZW4nIHZhbHVlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHUgLSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGNoYW5nZXMgdG8gYXBwbHkgdG8gYWNjZXNzIG1vZGUuXG4gICAqIEByZXR1cm5zIHtBY2Nlc3NNb2RlfSAtIDxjb2RlPnRoaXM8L2NvZGU+IEFjY2Vzc01vZGUuXG4gICAqL1xuICB1cGRhdGVHaXZlbjogZnVuY3Rpb24odSkge1xuICAgIHRoaXMuZ2l2ZW4gPSBBY2Nlc3NNb2RlLnVwZGF0ZSh0aGlzLmdpdmVuLCB1KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEdldCAnZ2l2ZW4nIHZhbHVlIGFzIGEgc3RyaW5nLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHJldHVybnMge3N0cmluZ30gLSA8Yj5naXZlbjwvYj4gdmFsdWUuXG4gICAqL1xuICBnZXRHaXZlbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMuZ2l2ZW4pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBc3NpZ24gJ3dhbnQnIHZhbHVlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBOdW1iZXJ9IHcgLSBlaXRoZXIgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGFjY2VzcyBtb2RlIG9yIGEgc2V0IG9mIGJpdHMuXG4gICAqIEByZXR1cm5zIHtBY2Nlc3NNb2RlfSAtIDxjb2RlPnRoaXM8L2NvZGU+IEFjY2Vzc01vZGUuXG4gICAqL1xuICBzZXRXYW50OiBmdW5jdGlvbih3KSB7XG4gICAgdGhpcy53YW50ID0gQWNjZXNzTW9kZS5kZWNvZGUodyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBVcGRhdGUgJ3dhbnQnIHZhbHVlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHUgLSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGNoYW5nZXMgdG8gYXBwbHkgdG8gYWNjZXNzIG1vZGUuXG4gICAqIEByZXR1cm5zIHtBY2Nlc3NNb2RlfSAtIDxjb2RlPnRoaXM8L2NvZGU+IEFjY2Vzc01vZGUuXG4gICAqL1xuICB1cGRhdGVXYW50OiBmdW5jdGlvbih1KSB7XG4gICAgdGhpcy53YW50ID0gQWNjZXNzTW9kZS51cGRhdGUodGhpcy53YW50LCB1KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEdldCAnd2FudCcgdmFsdWUgYXMgYSBzdHJpbmcuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIDxiPndhbnQ8L2I+IHZhbHVlLlxuICAgKi9cbiAgZ2V0V2FudDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMud2FudCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBwZXJtaXNzaW9ucyBwcmVzZW50IGluICd3YW50JyBidXQgbWlzc2luZyBpbiAnZ2l2ZW4nLlxuICAgKiBJbnZlcnNlIG9mIHtAbGluayBUaW5vZGUuQWNjZXNzTW9kZSNnZXRFeGNlc3NpdmV9XG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBwZXJtaXNzaW9ucyBwcmVzZW50IGluIDxiPndhbnQ8L2I+IGJ1dCBtaXNzaW5nIGluIDxiPmdpdmVuPC9iPi5cbiAgICovXG4gIGdldE1pc3Npbmc6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLmVuY29kZSh0aGlzLndhbnQgJiB+dGhpcy5naXZlbik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBwZXJtaXNzaW9ucyBwcmVzZW50IGluICdnaXZlbicgYnV0IG1pc3NpbmcgaW4gJ3dhbnQnLlxuICAgKiBJbnZlcnNlIG9mIHtAbGluayBUaW5vZGUuQWNjZXNzTW9kZSNnZXRNaXNzaW5nfVxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHJldHVybnMge3N0cmluZ30gcGVybWlzc2lvbnMgcHJlc2VudCBpbiA8Yj5naXZlbjwvYj4gYnV0IG1pc3NpbmcgaW4gPGI+d2FudDwvYj4uXG4gICAqL1xuICBnZXRFeGNlc3NpdmU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLmVuY29kZSh0aGlzLmdpdmVuICYgfnRoaXMud2FudCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVwZGF0ZSAnd2FudCcsICdnaXZlJywgYW5kICdtb2RlJyB2YWx1ZXMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcGFyYW0ge0FjY2Vzc01vZGV9IHZhbCAtIG5ldyBhY2Nlc3MgbW9kZSB2YWx1ZS5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IC0gPGNvZGU+dGhpczwvY29kZT4gQWNjZXNzTW9kZS5cbiAgICovXG4gIHVwZGF0ZUFsbDogZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKHZhbCkge1xuICAgICAgdGhpcy51cGRhdGVHaXZlbih2YWwuZ2l2ZW4pO1xuICAgICAgdGhpcy51cGRhdGVXYW50KHZhbC53YW50KTtcbiAgICAgIHRoaXMubW9kZSA9IHRoaXMuZ2l2ZW4gJiB0aGlzLndhbnQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBPd25lciAoTykgZmxhZyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc093bmVyOiBmdW5jdGlvbihzaWRlKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuX2NoZWNrRmxhZyh0aGlzLCBzaWRlLCBBY2Nlc3NNb2RlLl9PV05FUik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIFByZXNlbmNlIChQKSBmbGFnIGlzIHNldC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gc2lkZSAtIHdoaWNoIHBlcm1pc3Npb24gdG8gY2hlY2s6IGdpdmVuLCB3YW50LCBtb2RlOyBkZWZhdWx0OiBtb2RlLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiBmbGFnIGlzIHNldC5cbiAgICovXG4gIGlzUHJlc2VuY2VyOiBmdW5jdGlvbihzaWRlKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuX2NoZWNrRmxhZyh0aGlzLCBzaWRlLCBBY2Nlc3NNb2RlLl9QUkVTKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgUHJlc2VuY2UgKFApIGZsYWcgaXMgTk9UIHNldC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gc2lkZSAtIHdoaWNoIHBlcm1pc3Npb24gdG8gY2hlY2s6IGdpdmVuLCB3YW50LCBtb2RlOyBkZWZhdWx0OiBtb2RlLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiBmbGFnIGlzIHNldC5cbiAgICovXG4gIGlzTXV0ZWQ6IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNQcmVzZW5jZXIoc2lkZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIEpvaW4gKEopIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNKb2luZXI6IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5fY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX0pPSU4pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBSZWFkZXIgKFIpIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNSZWFkZXI6IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5fY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX1JFQUQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBXcml0ZXIgKFcpIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNXcml0ZXI6IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5fY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX1dSSVRFKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgQXBwcm92ZXIgKEEpIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNBcHByb3ZlcjogZnVuY3Rpb24oc2lkZSkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLl9jaGVja0ZsYWcodGhpcywgc2lkZSwgQWNjZXNzTW9kZS5fQVBQUk9WRSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGVpdGhlciBvbmUgb2YgT3duZXIgKE8pIG9yIEFwcHJvdmVyIChBKSBmbGFncyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc0FkbWluOiBmdW5jdGlvbihzaWRlKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNPd25lcihzaWRlKSB8fCB0aGlzLmlzQXBwcm92ZXIoc2lkZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGVpdGhlciBvbmUgb2YgT3duZXIgKE8pLCBBcHByb3ZlciAoQSksIG9yIFNoYXJlciAoUykgZmxhZ3MgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNTaGFyZXI6IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICByZXR1cm4gdGhpcy5pc0FkbWluKHNpZGUpIHx8IEFjY2Vzc01vZGUuX2NoZWNrRmxhZyh0aGlzLCBzaWRlLCBBY2Nlc3NNb2RlLl9TSEFSRSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIERlbGV0ZXIgKEQpIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNEZWxldGVyOiBmdW5jdGlvbihzaWRlKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuX2NoZWNrRmxhZyh0aGlzLCBzaWRlLCBBY2Nlc3NNb2RlLl9ERUxFVEUpO1xuICB9XG59O1xuXG4vKipcbiAqIEBjYWxsYmFjayBUaW5vZGUuVG9waWMub25EYXRhXG4gKiBAcGFyYW0ge0RhdGF9IGRhdGEgLSBEYXRhIHBhY2tldFxuICovXG4vKipcbiAqIFRvcGljIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIGEgbG9naWNhbCBjb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKiBAY2xhc3MgVG9waWNcbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIGNyZWF0ZS5cbiAqIEBwYXJhbSB7T2JqZWN0PX0gY2FsbGJhY2tzIC0gT2JqZWN0IHdpdGggdmFyaW91cyBldmVudCBjYWxsYmFja3MuXG4gKiBAcGFyYW0ge1Rpbm9kZS5Ub3BpYy5vbkRhdGF9IGNhbGxiYWNrcy5vbkRhdGEgLSBDYWxsYmFjayB3aGljaCByZWNlaXZlcyBhIDxjb2RlPntkYXRhfTwvY29kZT4gbWVzc2FnZS5cbiAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNhbGxiYWNrcy5vbk1ldGEgLSBDYWxsYmFjayB3aGljaCByZWNlaXZlcyBhIDxjb2RlPnttZXRhfTwvY29kZT4gbWVzc2FnZS5cbiAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNhbGxiYWNrcy5vblByZXMgLSBDYWxsYmFjayB3aGljaCByZWNlaXZlcyBhIDxjb2RlPntwcmVzfTwvY29kZT4gbWVzc2FnZS5cbiAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNhbGxiYWNrcy5vbkluZm8gLSBDYWxsYmFjayB3aGljaCByZWNlaXZlcyBhbiA8Y29kZT57aW5mb308L2NvZGU+IG1lc3NhZ2UuXG4gKiBAcGFyYW0ge2NhbGxiYWNrfSBjYWxsYmFja3Mub25NZXRhRGVzYyAtIENhbGxiYWNrIHdoaWNoIHJlY2VpdmVzIGNoYW5nZXMgdG8gdG9waWMgZGVzY3Rpb3B0aW9uIHtAbGluayBkZXNjfS5cbiAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNhbGxiYWNrcy5vbk1ldGFTdWIgLSBDYWxsZWQgZm9yIGEgc2luZ2xlIHN1YnNjcmlwdGlvbiByZWNvcmQgY2hhbmdlLlxuICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2tzLm9uU3Vic1VwZGF0ZWQgLSBDYWxsZWQgYWZ0ZXIgYSBiYXRjaCBvZiBzdWJzY3JpcHRpb24gY2hhbmdlcyBoYXZlIGJlZW4gcmVjaWV2ZWQgYW5kIGNhY2hlZC5cbiAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNhbGxiYWNrcy5vbkRlbGV0ZVRvcGljIC0gQ2FsbGVkIGFmdGVyIHRoZSB0b3BpYyBpcyBkZWxldGVkLlxuICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2xzLm9uQWxsTWVzc2FnZXNSZWNlaXZlZCAtIENhbGxlZCB3aGVuIGFsbCByZXF1ZXN0ZWQgPGNvZGU+e2RhdGF9PC9jb2RlPiBtZXNzYWdlcyBoYXZlIGJlZW4gcmVjaXZlZC5cbiAqL1xudmFyIFRvcGljID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2tzKSB7XG4gIC8vIFBhcmVudCBUaW5vZGUgb2JqZWN0LlxuICB0aGlzLl90aW5vZGUgPSBudWxsO1xuXG4gIC8vIFNlcnZlci1wcm92aWRlZCBkYXRhLCBsb2NhbGx5IGltbXV0YWJsZS5cbiAgLy8gdG9waWMgbmFtZVxuICB0aGlzLm5hbWUgPSBuYW1lO1xuICAvLyB0aW1lc3RhbXAgd2hlbiB0aGUgdG9waWMgd2FzIGNyZWF0ZWRcbiAgdGhpcy5jcmVhdGVkID0gbnVsbDtcbiAgLy8gdGltZXN0YW1wIHdoZW4gdGhlIHRvcGljIHdhcyBsYXN0IHVwZGF0ZWRcbiAgdGhpcy51cGRhdGVkID0gbnVsbDtcbiAgLy8gdGltZXN0YW1wIG9mIHRoZSBsYXN0IG1lc3NhZ2VzXG4gIHRoaXMudG91Y2hlZCA9IG51bGw7XG4gIC8vIGFjY2VzcyBtb2RlLCBzZWUgQWNjZXNzTW9kZVxuICB0aGlzLmFjcyA9IG5ldyBBY2Nlc3NNb2RlKG51bGwpO1xuICAvLyBwZXItdG9waWMgcHJpdmF0ZSBkYXRhXG4gIHRoaXMucHJpdmF0ZSA9IG51bGw7XG4gIC8vIHBlci10b3BpYyBwdWJsaWMgZGF0YVxuICB0aGlzLnB1YmxpYyA9IG51bGw7XG5cbiAgLy8gTG9jYWxseSBjYWNoZWQgZGF0YVxuICAvLyBTdWJzY3JpYmVkIHVzZXJzLCBmb3IgdHJhY2tpbmcgcmVhZC9yZWN2L21zZyBub3RpZmljYXRpb25zLlxuICB0aGlzLl91c2VycyA9IHt9O1xuXG4gIC8vIEN1cnJlbnQgdmFsdWUgb2YgbG9jYWxseSBpc3N1ZWQgc2VxSWQsIHVzZWQgZm9yIHBlbmRpbmcgbWVzc2FnZXMuXG4gIHRoaXMuX3F1ZXVlZFNlcUlkID0gTE9DQUxfU0VRSUQ7XG5cbiAgLy8gVGhlIG1heGltdW0ga25vd24ge2RhdGEuc2VxfSB2YWx1ZS5cbiAgdGhpcy5fbWF4U2VxID0gMDtcbiAgLy8gVGhlIG1pbmltdW0ga25vd24ge2RhdGEuc2VxfSB2YWx1ZS5cbiAgdGhpcy5fbWluU2VxID0gMDtcbiAgLy8gSW5kaWNhdG9yIHRoYXQgdGhlIGxhc3QgcmVxdWVzdCBmb3IgZWFybGllciBtZXNzYWdlcyByZXR1cm5lZCAwLlxuICB0aGlzLl9ub0VhcmxpZXJNc2dzID0gZmFsc2U7XG4gIC8vIFRoZSBtYXhpbXVtIGtub3duIGRlbGV0aW9uIElELlxuICB0aGlzLl9tYXhEZWwgPSAwO1xuICAvLyBVc2VyIGRpc2NvdmVyeSB0YWdzXG4gIHRoaXMuX3RhZ3MgPSBbXTtcbiAgLy8gQ3JlZGVudGlhbHMgc3VjaCBhcyBlbWFpbCBvciBwaG9uZSBudW1iZXIuXG4gIHRoaXMuX2NyZWRlbnRpYWxzID0gW107XG4gIC8vIE1lc3NhZ2UgY2FjaGUsIHNvcnRlZCBieSBtZXNzYWdlIHNlcSB2YWx1ZXMsIGZyb20gb2xkIHRvIG5ldy5cbiAgdGhpcy5fbWVzc2FnZXMgPSBDQnVmZmVyKGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYS5zZXEgLSBiLnNlcTtcbiAgfSwgdHJ1ZSk7XG4gIC8vIEJvb2xlYW4sIHRydWUgaWYgdGhlIHRvcGljIGlzIGN1cnJlbnRseSBsaXZlXG4gIHRoaXMuX3N1YnNjcmliZWQgPSBmYWxzZTtcbiAgLy8gVGltZXN0YXAgd2hlbiB0b3BpYyBtZXRhLWRlc2MgdXBkYXRlIHdhcyByZWNpdmVkLlxuICB0aGlzLl9sYXN0RGVzY1VwZGF0ZSA9IG51bGw7XG4gIC8vIFRpbWVzdGFwIHdoZW4gdG9waWMgbWV0YS1zdWJzIHVwZGF0ZSB3YXMgcmVjaXZlZC5cbiAgdGhpcy5fbGFzdFN1YnNVcGRhdGUgPSBudWxsO1xuICAvLyBUb3BpYyBjcmVhdGVkIGJ1dCBub3QgeWV0IHN5bmNlZCB3aXRoIHRoZSBzZXJ2ZXIuIFVzZWQgb25seSBkdXJpbmcgaW5pdGlhbGl6YXRpb24uXG4gIHRoaXMuX25ldyA9IHRydWU7XG5cbiAgLy8gQ2FsbGJhY2tzXG4gIGlmIChjYWxsYmFja3MpIHtcbiAgICB0aGlzLm9uRGF0YSA9IGNhbGxiYWNrcy5vbkRhdGE7XG4gICAgdGhpcy5vbk1ldGEgPSBjYWxsYmFja3Mub25NZXRhO1xuICAgIHRoaXMub25QcmVzID0gY2FsbGJhY2tzLm9uUHJlcztcbiAgICB0aGlzLm9uSW5mbyA9IGNhbGxiYWNrcy5vbkluZm87XG4gICAgLy8gQSBzaW5nbGUgZGVzYyB1cGRhdGU7XG4gICAgdGhpcy5vbk1ldGFEZXNjID0gY2FsbGJhY2tzLm9uTWV0YURlc2M7XG4gICAgLy8gQSBzaW5nbGUgc3Vic2NyaXB0aW9uIHJlY29yZDtcbiAgICB0aGlzLm9uTWV0YVN1YiA9IGNhbGxiYWNrcy5vbk1ldGFTdWI7XG4gICAgLy8gQWxsIHN1YnNjcmlwdGlvbiByZWNvcmRzIHJlY2VpdmVkO1xuICAgIHRoaXMub25TdWJzVXBkYXRlZCA9IGNhbGxiYWNrcy5vblN1YnNVcGRhdGVkO1xuICAgIHRoaXMub25UYWdzVXBkYXRlZCA9IGNhbGxiYWNrcy5vblRhZ3NVcGRhdGVkO1xuICAgIHRoaXMub25DcmVkc1VwZGF0ZWQgPSBjYWxsYmFja3Mub25DcmVkc1VwZGF0ZWQ7XG4gICAgdGhpcy5vbkRlbGV0ZVRvcGljID0gY2FsbGJhY2tzLm9uRGVsZXRlVG9waWM7XG4gICAgdGhpcy5vbkFsbE1lc3NhZ2VzUmVjZWl2ZWQgPSBjYWxsYmFja3Mub25BbGxNZXNzYWdlc1JlY2VpdmVkO1xuICB9XG59O1xuXG5Ub3BpYy5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgdG9waWMgaXMgc3Vic2NyaWJlZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaXMgdG9waWMgaXMgYXR0YWNoZWQvc3Vic2NyaWJlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNTdWJzY3JpYmVkOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fc3Vic2NyaWJlZDtcbiAgfSxcblxuICAvKipcbiAgICogUmVxdWVzdCB0b3BpYyB0byBzdWJzY3JpYmUuIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjc3Vic2NyaWJlfS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtUaW5vZGUuR2V0UXVlcnk9fSBnZXRQYXJhbXMgLSBnZXQgcXVlcnkgcGFyYW1ldGVycy5cbiAgICogQHBhcmFtIHtUaW5vZGUuU2V0UGFyYW1zPX0gc2V0UGFyYW1zIC0gc2V0IHBhcmFtZXRlcnMuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byB0aGUgcmVxdWVzdC5cbiAgICovXG4gIHN1YnNjcmliZTogZnVuY3Rpb24oZ2V0UGFyYW1zLCBzZXRQYXJhbXMpIHtcbiAgICAvLyBJZiB0aGUgdG9waWMgaXMgYWxyZWFkeSBzdWJzY3JpYmVkLCByZXR1cm4gcmVzb2x2ZWQgcHJvbWlzZVxuICAgIGlmICh0aGlzLl9zdWJzY3JpYmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMpO1xuICAgIH1cblxuICAgIC8vIFNlbmQgc3Vic2NyaWJlIG1lc3NhZ2UsIGhhbmRsZSBhc3luYyByZXNwb25zZS5cbiAgICAvLyBJZiB0b3BpYyBuYW1lIGlzIGV4cGxpY2l0bHkgcHJvdmlkZWQsIHVzZSBpdC4gSWYgbm8gbmFtZSwgdGhlbiBpdCdzIGEgbmV3IGdyb3VwIHRvcGljLFxuICAgIC8vIHVzZSBcIm5ld1wiLlxuICAgIHJldHVybiB0aGlzLl90aW5vZGUuc3Vic2NyaWJlKHRoaXMubmFtZSB8fCBUT1BJQ19ORVcsIGdldFBhcmFtcywgc2V0UGFyYW1zKS50aGVuKChjdHJsKSA9PiB7XG4gICAgICBpZiAoY3RybC5jb2RlID49IDMwMCkge1xuICAgICAgICAvLyBEbyBub3RoaW5nIGlmIHN1YnNjcmlwdGlvbiBzdGF0dXMgaGFzIG5vdCBjaGFuZ2VkLlxuICAgICAgICByZXR1cm4gY3RybDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fc3Vic2NyaWJlZCA9IHRydWU7XG4gICAgICB0aGlzLmFjcyA9IChjdHJsLnBhcmFtcyAmJiBjdHJsLnBhcmFtcy5hY3MpID8gY3RybC5wYXJhbXMuYWNzIDogdGhpcy5hY3M7XG5cbiAgICAgIC8vIFNldCB0b3BpYyBuYW1lIGZvciBuZXcgdG9waWNzIGFuZCBhZGQgaXQgdG8gY2FjaGUuXG4gICAgICBpZiAodGhpcy5fbmV3KSB7XG4gICAgICAgIHRoaXMuX25ldyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIE5hbWUgbWF5IGNoYW5nZSBuZXcxMjM0NTYgLT4gZ3JwQWJDZEVmXG4gICAgICAgIHRoaXMubmFtZSA9IGN0cmwudG9waWM7XG5cbiAgICAgICAgdGhpcy5jcmVhdGVkID0gY3RybC50cztcbiAgICAgICAgdGhpcy51cGRhdGVkID0gY3RybC50cztcbiAgICAgICAgLy8gRG9uJ3QgYXNzaWduIHRvdWNoZWQsIG90aGVyd2lzZSB0b3BpYyB3aWxsIGJlIHB1dCBvbiB0b3Agb2YgdGhlIGxpc3Qgb24gc3Vic2NyaWJlLlxuXG4gICAgICAgIHRoaXMuX2NhY2hlUHV0U2VsZigpO1xuXG4gICAgICAgIGlmICh0aGlzLm5hbWUgIT0gVE9QSUNfTUUgJiYgdGhpcy5uYW1lICE9IFRPUElDX0ZORCkge1xuICAgICAgICAgIC8vIEFkZCB0aGUgbmV3IHRvcGljIHRvIHRoZSBsaXN0IG9mIGNvbnRhY3RzIG1haW50YWluZWQgYnkgdGhlICdtZScgdG9waWMuXG4gICAgICAgICAgY29uc3QgbWUgPSB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpO1xuICAgICAgICAgIGlmIChtZS5vbk1ldGFTdWIpIHtcbiAgICAgICAgICAgIG1lLm9uTWV0YVN1Yih0aGlzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1lLm9uU3Vic1VwZGF0ZWQpIHtcbiAgICAgICAgICAgIG1lLm9uU3Vic1VwZGF0ZWQoW3RoaXMubmFtZV0sIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZXRQYXJhbXMgJiYgc2V0UGFyYW1zLmRlc2MpIHtcbiAgICAgICAgICBzZXRQYXJhbXMuZGVzYy5fbm9Gb3J3YXJkaW5nID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLl9wcm9jZXNzTWV0YURlc2Moc2V0UGFyYW1zLmRlc2MpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBkcmFmdCBvZiBhIG1lc3NhZ2Ugd2l0aG91dCBzZW5kaW5nIGl0IHRvIHRoZSBzZXJ2ZXIuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgT2JqZWN0fSBkYXRhIC0gQ29udGVudCB0byB3cmFwIGluIGEgZHJhZnQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IG5vRWNobyAtIElmIDxjb2RlPnRydWU8L2NvZGU+IHNlcnZlciB3aWxsIG5vdCBlY2hvIG1lc3NhZ2UgYmFjayB0byBvcmlnaW5hdGluZ1xuICAgKiBzZXNzaW9uLiBPdGhlcndpc2UgdGhlIHNlcnZlciB3aWxsIHNlbmQgYSBjb3B5IG9mIHRoZSBtZXNzYWdlIHRvIHNlbmRlci5cbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH0gbWVzc2FnZSBkcmFmdC5cbiAgICovXG4gIGNyZWF0ZU1lc3NhZ2U6IGZ1bmN0aW9uKGRhdGEsIG5vRWNobykge1xuICAgIHJldHVybiB0aGlzLl90aW5vZGUuY3JlYXRlTWVzc2FnZSh0aGlzLm5hbWUsIGRhdGEsIG5vRWNobyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEltbWVkaWF0ZWx5IHB1Ymxpc2ggZGF0YSB0byB0b3BpYy4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNwdWJsaXNofS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBPYmplY3R9IGRhdGEgLSBEYXRhIHRvIHB1Ymxpc2gsIGVpdGhlciBwbGFpbiBzdHJpbmcgb3IgYSBEcmFmdHkgb2JqZWN0LlxuICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBub0VjaG8gLSBJZiA8Y29kZT50cnVlPC9jb2RlPiBzZXJ2ZXIgd2lsbCBub3QgZWNobyBtZXNzYWdlIGJhY2sgdG8gb3JpZ2luYXRpbmdcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgcHVibGlzaDogZnVuY3Rpb24oZGF0YSwgbm9FY2hvKSB7XG4gICAgcmV0dXJuIHRoaXMucHVibGlzaE1lc3NhZ2UodGhpcy5jcmVhdGVNZXNzYWdlKGRhdGEsIG5vRWNobykpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBQdWJsaXNoIG1lc3NhZ2UgY3JlYXRlZCBieSB7QGxpbmsgVGlub2RlLlRvcGljI2NyZWF0ZU1lc3NhZ2V9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcHViIC0ge2RhdGF9IG9iamVjdCB0byBwdWJsaXNoLiBNdXN0IGJlIGNyZWF0ZWQgYnkge0BsaW5rIFRpbm9kZS5Ub3BpYyNjcmVhdGVNZXNzYWdlfVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gdGhlIHJlcXVlc3QuXG4gICAqL1xuICBwdWJsaXNoTWVzc2FnZTogZnVuY3Rpb24ocHViKSB7XG4gICAgaWYgKCF0aGlzLl9zdWJzY3JpYmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2Fubm90IHB1Ymxpc2ggb24gaW5hY3RpdmUgdG9waWNcIikpO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBoZWFkZXIgd2l0aCBhdHRhY2htZW50IHJlY29yZHMuXG4gICAgaWYgKERyYWZ0eS5oYXNBdHRhY2htZW50cyhwdWIuY29udGVudCkgJiYgIXB1Yi5oZWFkLmF0dGFjaG1lbnRzKSB7XG4gICAgICBsZXQgYXR0YWNobWVudHMgPSBbXTtcbiAgICAgIERyYWZ0eS5hdHRhY2htZW50cyhwdWIuY29udGVudCwgKGRhdGEpID0+IHtcbiAgICAgICAgYXR0YWNobWVudHMucHVzaChkYXRhLnJlZik7XG4gICAgICB9KTtcbiAgICAgIHB1Yi5oZWFkLmF0dGFjaG1lbnRzID0gYXR0YWNobWVudHM7XG4gICAgfVxuXG4gICAgLy8gU2VuZCBkYXRhLlxuICAgIHB1Yi5fc2VuZGluZyA9IHRydWU7XG4gICAgcHViLl9mYWlsZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gdGhpcy5fdGlub2RlLnB1Ymxpc2hNZXNzYWdlKHB1YikudGhlbigoY3RybCkgPT4ge1xuICAgICAgcHViLl9zZW5kaW5nID0gZmFsc2U7XG4gICAgICBwdWIudHMgPSBjdHJsLnRzO1xuICAgICAgdGhpcy5zd2FwTWVzc2FnZUlkKHB1YiwgY3RybC5wYXJhbXMuc2VxKTtcbiAgICAgIHRoaXMuX3JvdXRlRGF0YShwdWIpO1xuICAgICAgcmV0dXJuIGN0cmw7XG4gICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgdGhpcy5fdGlub2RlLmxvZ2dlcihcIldBUk5JTkc6IE1lc3NhZ2UgcmVqZWN0ZWQgYnkgdGhlIHNlcnZlclwiLCBlcnIpO1xuICAgICAgcHViLl9zZW5kaW5nID0gZmFsc2U7XG4gICAgICBwdWIuX2ZhaWxlZCA9IHRydWU7XG4gICAgICBpZiAodGhpcy5vbkRhdGEpIHtcbiAgICAgICAgdGhpcy5vbkRhdGEoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQWRkIG1lc3NhZ2UgdG8gbG9jYWwgbWVzc2FnZSBjYWNoZSwgc2VuZCB0byB0aGUgc2VydmVyIHdoZW4gdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQuXG4gICAqIElmIHByb21pc2UgaXMgbnVsbCBvciB1bmRlZmluZWQsIHRoZSBtZXNzYWdlIHdpbGwgYmUgc2VudCBpbW1lZGlhdGVseS5cbiAgICogVGhlIG1lc3NhZ2UgaXMgc2VudCB3aGVuIHRoZVxuICAgKiBUaGUgbWVzc2FnZSBzaG91bGQgYmUgY3JlYXRlZCBieSB7QGxpbmsgVGlub2RlLlRvcGljI2NyZWF0ZU1lc3NhZ2V9LlxuICAgKiBUaGlzIGlzIHByb2JhYmx5IG5vdCB0aGUgZmluYWwgQVBJLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcHViIC0gTWVzc2FnZSB0byB1c2UgYXMgYSBkcmFmdC5cbiAgICogQHBhcmFtIHtQcm9taXNlfSBwcm9tIC0gTWVzc2FnZSB3aWxsIGJlIHNlbnQgd2hlbiB0aGlzIHByb21pc2UgaXMgcmVzb2x2ZWQsIGRpc2NhcmRlZCBpZiByZWplY3RlZC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IGRlcml2ZWQgcHJvbWlzZS5cbiAgICovXG4gIHB1Ymxpc2hEcmFmdDogZnVuY3Rpb24ocHViLCBwcm9tKSB7XG4gICAgaWYgKCFwcm9tICYmICF0aGlzLl9zdWJzY3JpYmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2Fubm90IHB1Ymxpc2ggb24gaW5hY3RpdmUgdG9waWNcIikpO1xuICAgIH1cblxuICAgIGNvbnN0IHNlcSA9IHB1Yi5zZXEgfHwgdGhpcy5fZ2V0UXVldWVkU2VxSWQoKTtcbiAgICBpZiAoIXB1Yi5fbm9Gb3J3YXJkaW5nKSB7XG4gICAgICAvLyBUaGUgJ3NlcScsICd0cycsIGFuZCAnZnJvbScgYXJlIGFkZGVkIHRvIG1pbWljIHtkYXRhfS4gVGhleSBhcmUgcmVtb3ZlZCBsYXRlclxuICAgICAgLy8gYmVmb3JlIHRoZSBtZXNzYWdlIGlzIHNlbnQuXG5cbiAgICAgIHB1Yi5fbm9Gb3J3YXJkaW5nID0gdHJ1ZTtcbiAgICAgIHB1Yi5zZXEgPSBzZXE7XG4gICAgICBwdWIudHMgPSBuZXcgRGF0ZSgpO1xuICAgICAgcHViLmZyb20gPSB0aGlzLl90aW5vZGUuZ2V0Q3VycmVudFVzZXJJRCgpO1xuXG4gICAgICAvLyBEb24ndCBuZWVkIGFuIGVjaG8gbWVzc2FnZSBiZWNhdXNlIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIGxvY2FsIGNhY2hlIHJpZ2h0IGF3YXkuXG4gICAgICBwdWIubm9lY2hvID0gdHJ1ZTtcbiAgICAgIC8vIEFkZCB0byBjYWNoZS5cbiAgICAgIHRoaXMuX21lc3NhZ2VzLnB1dChwdWIpO1xuICAgICAgdGhpcy5fdGlub2RlLl9kYi5hZGRNZXNzYWdlKHB1Yik7XG5cbiAgICAgIGlmICh0aGlzLm9uRGF0YSkge1xuICAgICAgICB0aGlzLm9uRGF0YShwdWIpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBJZiBwcm9taXNlIGlzIHByb3ZpZGVkLCBzZW5kIHRoZSBxdWV1ZWQgbWVzc2FnZSB3aGVuIGl0J3MgcmVzb2x2ZWQuXG4gICAgLy8gSWYgbm8gcHJvbWlzZSBpcyBwcm92aWRlZCwgY3JlYXRlIGEgcmVzb2x2ZWQgb25lIGFuZCBzZW5kIGltbWVkaWF0ZWx5LlxuICAgIHByb20gPSAocHJvbSB8fCBQcm9taXNlLnJlc29sdmUoKSkudGhlbihcbiAgICAgICggLyogYXJndW1lbnQgaWdub3JlZCAqLyApID0+IHtcbiAgICAgICAgaWYgKHB1Yi5fY2FuY2VsbGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvZGU6IDMwMCxcbiAgICAgICAgICAgIHRleHQ6IFwiY2FuY2VsbGVkXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnB1Ymxpc2hNZXNzYWdlKHB1Yik7XG4gICAgICB9LFxuICAgICAgKGVycikgPT4ge1xuICAgICAgICB0aGlzLl90aW5vZGUubG9nZ2VyKFwiV0FSTklORzogTWVzc2FnZSBkcmFmdCByZWplY3RlZFwiLCBlcnIpO1xuICAgICAgICBwdWIuX3NlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgcHViLl9mYWlsZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9tZXNzYWdlcy5kZWxBdCh0aGlzLl9tZXNzYWdlcy5maW5kKHB1YikpO1xuICAgICAgICB0aGlzLl90aW5vZGUuX2RiLnJlbU1lc3NhZ2VzKHRoaXMubmFtZSwgcHViLnNlcSk7XG4gICAgICAgIGlmICh0aGlzLm9uRGF0YSkge1xuICAgICAgICAgIHRoaXMub25EYXRhKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHJldHVybiBwcm9tO1xuICB9LFxuXG4gIC8qKlxuICAgKiBMZWF2ZSB0aGUgdG9waWMsIG9wdGlvbmFsbHkgdW5zaWJzY3JpYmUuIExlYXZpbmcgdGhlIHRvcGljIG1lYW5zIHRoZSB0b3BpYyB3aWxsIHN0b3BcbiAgICogcmVjZWl2aW5nIHVwZGF0ZXMgZnJvbSB0aGUgc2VydmVyLiBVbnN1YnNjcmliaW5nIHdpbGwgdGVybWluYXRlIHVzZXIncyByZWxhdGlvbnNoaXAgd2l0aCB0aGUgdG9waWMuXG4gICAqIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjbGVhdmV9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW49fSB1bnN1YiAtIElmIHRydWUsIHVuc3Vic2NyaWJlLCBvdGhlcndpc2UganVzdCBsZWF2ZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgbGVhdmU6IGZ1bmN0aW9uKHVuc3ViKSB7XG4gICAgLy8gSXQncyBwb3NzaWJsZSB0byB1bnN1YnNjcmliZSAodW5zdWI9PXRydWUpIGZyb20gaW5hY3RpdmUgdG9waWMuXG4gICAgaWYgKCF0aGlzLl9zdWJzY3JpYmVkICYmICF1bnN1Yikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbm5vdCBsZWF2ZSBpbmFjdGl2ZSB0b3BpY1wiKSk7XG4gICAgfVxuXG4gICAgLy8gU2VuZCBhICdsZWF2ZScgbWVzc2FnZSwgaGFuZGxlIGFzeW5jIHJlc3BvbnNlXG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5sZWF2ZSh0aGlzLm5hbWUsIHVuc3ViKS50aGVuKChjdHJsKSA9PiB7XG4gICAgICB0aGlzLl9yZXNldFN1YigpO1xuICAgICAgaWYgKHVuc3ViKSB7XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtVG9waWModGhpcy5uYW1lKTtcbiAgICAgICAgdGhpcy5fdGlub2RlLmNhY2hlRGVsKCd0b3BpYycsIHRoaXMubmFtZSk7XG4gICAgICAgIHRoaXMuX2dvbmUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRvcGljIG1ldGFkYXRhIGZyb20gdGhlIHNlcnZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtUaW5vZGUuR2V0UXVlcnl9IHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gcmVxdWVzdC5cbiAgICovXG4gIGdldE1ldGE6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgIC8vIFNlbmQge2dldH0gbWVzc2FnZSwgcmV0dXJuIHByb21pc2UuXG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5nZXRNZXRhKHRoaXMubmFtZSwgcGFyYW1zKTtcbiAgfSxcblxuICAvKipcbiAgICogUmVxdWVzdCBtb3JlIG1lc3NhZ2VzIGZyb20gdGhlIHNlcnZlclxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbGltaXQgbnVtYmVyIG9mIG1lc3NhZ2VzIHRvIGdldC5cbiAgICogQHBhcmFtIHtib29sZWFufSBmb3J3YXJkIGlmIHRydWUsIHJlcXVlc3QgbmV3ZXIgbWVzc2FnZXMuXG4gICAqL1xuICBnZXRNZXNzYWdlc1BhZ2U6IGZ1bmN0aW9uKGxpbWl0LCBmb3J3YXJkKSB7XG4gICAgY29uc3QgcXVlcnkgPSB0aGlzLnN0YXJ0TWV0YVF1ZXJ5KCk7XG4gICAgaWYgKGZvcndhcmQpIHtcbiAgICAgIHF1ZXJ5LndpdGhMYXRlckRhdGEobGltaXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBxdWVyeS53aXRoRWFybGllckRhdGEobGltaXQpO1xuICAgIH1cbiAgICBsZXQgcHJvbWlzZSA9IHRoaXMuZ2V0TWV0YShxdWVyeS5idWlsZCgpKTtcbiAgICBpZiAoIWZvcndhcmQpIHtcbiAgICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgaWYgKGN0cmwgJiYgY3RybC5wYXJhbXMgJiYgIWN0cmwucGFyYW1zLmNvdW50KSB7XG4gICAgICAgICAgdGhpcy5fbm9FYXJsaWVyTXNncyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHRvcGljIG1ldGFkYXRhLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXRQYXJhbXN9IHBhcmFtcyBwYXJhbWV0ZXJzIHRvIHVwZGF0ZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBzZXRNZXRhOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICBpZiAocGFyYW1zLnRhZ3MpIHtcbiAgICAgIHBhcmFtcy50YWdzID0gbm9ybWFsaXplQXJyYXkocGFyYW1zLnRhZ3MpO1xuICAgIH1cbiAgICAvLyBTZW5kIFNldCBtZXNzYWdlLCBoYW5kbGUgYXN5bmMgcmVzcG9uc2UuXG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5zZXRNZXRhKHRoaXMubmFtZSwgcGFyYW1zKVxuICAgICAgLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgaWYgKGN0cmwgJiYgY3RybC5jb2RlID49IDMwMCkge1xuICAgICAgICAgIC8vIE5vdCBtb2RpZmllZFxuICAgICAgICAgIHJldHVybiBjdHJsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcmFtcy5zdWIpIHtcbiAgICAgICAgICBwYXJhbXMuc3ViLnRvcGljID0gdGhpcy5uYW1lO1xuICAgICAgICAgIGlmIChjdHJsLnBhcmFtcyAmJiBjdHJsLnBhcmFtcy5hY3MpIHtcbiAgICAgICAgICAgIHBhcmFtcy5zdWIuYWNzID0gY3RybC5wYXJhbXMuYWNzO1xuICAgICAgICAgICAgcGFyYW1zLnN1Yi51cGRhdGVkID0gY3RybC50cztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFwYXJhbXMuc3ViLnVzZXIpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdWJzY3JpcHRpb24gdXBkYXRlIG9mIHRoZSBjdXJyZW50IHVzZXIuXG4gICAgICAgICAgICAvLyBBc3NpZ24gdXNlciBJRCBvdGhlcndpc2UgdGhlIHVwZGF0ZSB3aWxsIGJlIGlnbm9yZWQgYnkgX3Byb2Nlc3NNZXRhU3ViLlxuICAgICAgICAgICAgcGFyYW1zLnN1Yi51c2VyID0gdGhpcy5fdGlub2RlLmdldEN1cnJlbnRVc2VySUQoKTtcbiAgICAgICAgICAgIGlmICghcGFyYW1zLmRlc2MpIHtcbiAgICAgICAgICAgICAgLy8gRm9yY2UgdXBkYXRlIHRvIHRvcGljJ3MgYXNjLlxuICAgICAgICAgICAgICBwYXJhbXMuZGVzYyA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJhbXMuc3ViLl9ub0ZvcndhcmRpbmcgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhU3ViKFtwYXJhbXMuc3ViXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFyYW1zLmRlc2MpIHtcbiAgICAgICAgICBpZiAoY3RybC5wYXJhbXMgJiYgY3RybC5wYXJhbXMuYWNzKSB7XG4gICAgICAgICAgICBwYXJhbXMuZGVzYy5hY3MgPSBjdHJsLnBhcmFtcy5hY3M7XG4gICAgICAgICAgICBwYXJhbXMuZGVzYy51cGRhdGVkID0gY3RybC50cztcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fcHJvY2Vzc01ldGFEZXNjKHBhcmFtcy5kZXNjKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXJhbXMudGFncykge1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhVGFncyhwYXJhbXMudGFncyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcmFtcy5jcmVkKSB7XG4gICAgICAgICAgdGhpcy5fcHJvY2Vzc01ldGFDcmVkcyhbcGFyYW1zLmNyZWRdLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdHJsO1xuICAgICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhY2Nlc3MgbW9kZSBvZiB0aGUgY3VycmVudCB1c2VyIG9yIG9mIGFub3RoZXIgdG9waWMgc3Vic3JpYmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gVUlEIG9mIHRoZSB1c2VyIHRvIHVwZGF0ZSBvciBudWxsIHRvIHVwZGF0ZSBjdXJyZW50IHVzZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cGRhdGUgLSB0aGUgdXBkYXRlIHZhbHVlLCBmdWxsIG9yIGRlbHRhLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gcmVxdWVzdC5cbiAgICovXG4gIHVwZGF0ZU1vZGU6IGZ1bmN0aW9uKHVpZCwgdXBkYXRlKSB7XG4gICAgY29uc3QgdXNlciA9IHVpZCA/IHRoaXMuc3Vic2NyaWJlcih1aWQpIDogbnVsbDtcbiAgICBjb25zdCBhbSA9IHVzZXIgP1xuICAgICAgdXNlci5hY3MudXBkYXRlR2l2ZW4odXBkYXRlKS5nZXRHaXZlbigpIDpcbiAgICAgIHRoaXMuZ2V0QWNjZXNzTW9kZSgpLnVwZGF0ZVdhbnQodXBkYXRlKS5nZXRXYW50KCk7XG5cbiAgICByZXR1cm4gdGhpcy5zZXRNZXRhKHtcbiAgICAgIHN1Yjoge1xuICAgICAgICB1c2VyOiB1aWQsXG4gICAgICAgIG1vZGU6IGFtXG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdG9waWMgc3Vic2NyaXB0aW9uLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI3NldE1ldGF9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gSUQgb2YgdGhlIHVzZXIgdG8gaW52aXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gbW9kZSAtIEFjY2VzcyBtb2RlLiA8Y29kZT5udWxsPC9jb2RlPiBtZWFucyB0byB1c2UgZGVmYXVsdC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBpbnZpdGU6IGZ1bmN0aW9uKHVpZCwgbW9kZSkge1xuICAgIHJldHVybiB0aGlzLnNldE1ldGEoe1xuICAgICAgc3ViOiB7XG4gICAgICAgIHVzZXI6IHVpZCxcbiAgICAgICAgbW9kZTogbW9kZVxuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBcmNoaXZlIG9yIHVuLWFyY2hpdmUgdGhlIHRvcGljLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI3NldE1ldGF9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGFyY2ggLSB0cnVlIHRvIGFyY2hpdmUgdGhlIHRvcGljLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byByZXF1ZXN0LlxuICAgKi9cbiAgYXJjaGl2ZTogZnVuY3Rpb24oYXJjaCkge1xuICAgIGlmICh0aGlzLnByaXZhdGUgJiYgdGhpcy5wcml2YXRlLmFyY2ggPT0gYXJjaCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhcmNoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2V0TWV0YSh7XG4gICAgICBkZXNjOiB7XG4gICAgICAgIHByaXZhdGU6IHtcbiAgICAgICAgICBhcmNoOiBhcmNoID8gdHJ1ZSA6IFRpbm9kZS5ERUxfQ0hBUlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSBtZXNzYWdlcy4gSGFyZC1kZWxldGluZyBtZXNzYWdlcyByZXF1aXJlcyBPd25lciBwZXJtaXNzaW9uLlxuICAgKiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2RlbE1lc3NhZ2VzfS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtUaW5vZGUuRGVsUmFuZ2VbXX0gcmFuZ2VzIC0gUmFuZ2VzIG9mIG1lc3NhZ2UgSURzIHRvIGRlbGV0ZS5cbiAgICogQHBhcmFtIHtib29sZWFuPX0gaGFyZCAtIEhhcmQgb3Igc29mdCBkZWxldGVcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBkZWxNZXNzYWdlczogZnVuY3Rpb24ocmFuZ2VzLCBoYXJkKSB7XG4gICAgaWYgKCF0aGlzLl9zdWJzY3JpYmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2Fubm90IGRlbGV0ZSBtZXNzYWdlcyBpbiBpbmFjdGl2ZSB0b3BpY1wiKSk7XG4gICAgfVxuXG4gICAgLy8gU29ydCByYW5nZXMgaW4gYWNjZW5kaW5nIG9yZGVyIGJ5IGxvdywgdGhlIGRlc2NlbmRpbmcgYnkgaGkuXG4gICAgcmFuZ2VzLnNvcnQoKHIxLCByMikgPT4ge1xuICAgICAgaWYgKHIxLmxvdyA8IHIyLmxvdykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChyMS5sb3cgPT0gcjIubG93KSB7XG4gICAgICAgIHJldHVybiAhcjIuaGkgfHwgKHIxLmhpID49IHIyLmhpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIC8vIFJlbW92ZSBwZW5kaW5nIG1lc3NhZ2VzIGZyb20gcmFuZ2VzIHBvc3NpYmx5IGNsaXBwaW5nIHNvbWUgcmFuZ2VzLlxuICAgIGxldCB0b3NlbmQgPSByYW5nZXMucmVkdWNlKChvdXQsIHIpID0+IHtcbiAgICAgIGlmIChyLmxvdyA8IExPQ0FMX1NFUUlEKSB7XG4gICAgICAgIGlmICghci5oaSB8fCByLmhpIDwgTE9DQUxfU0VRSUQpIHtcbiAgICAgICAgICBvdXQucHVzaChyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDbGlwIGhpIHRvIG1heCBhbGxvd2VkIHZhbHVlLlxuICAgICAgICAgIG91dC5wdXNoKHtcbiAgICAgICAgICAgIGxvdzogci5sb3csXG4gICAgICAgICAgICBoaTogdGhpcy5fbWF4U2VxICsgMVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH0sIFtdKTtcblxuICAgIC8vIFNlbmQge2RlbH0gbWVzc2FnZSwgcmV0dXJuIHByb21pc2VcbiAgICBsZXQgcmVzdWx0O1xuICAgIGlmICh0b3NlbmQubGVuZ3RoID4gMCkge1xuICAgICAgcmVzdWx0ID0gdGhpcy5fdGlub2RlLmRlbE1lc3NhZ2VzKHRoaXMubmFtZSwgdG9zZW5kLCBoYXJkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgZGVsOiAwXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgbG9jYWwgY2FjaGUuXG4gICAgcmV0dXJuIHJlc3VsdC50aGVuKChjdHJsKSA9PiB7XG4gICAgICBpZiAoY3RybC5wYXJhbXMuZGVsID4gdGhpcy5fbWF4RGVsKSB7XG4gICAgICAgIHRoaXMuX21heERlbCA9IGN0cmwucGFyYW1zLmRlbDtcbiAgICAgIH1cblxuICAgICAgcmFuZ2VzLm1hcCgocikgPT4ge1xuICAgICAgICBpZiAoci5oaSkge1xuICAgICAgICAgIHRoaXMuZmx1c2hNZXNzYWdlUmFuZ2Uoci5sb3csIHIuaGkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZmx1c2hNZXNzYWdlKHIubG93KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX3VwZGF0ZURlbGV0ZWRSYW5nZXMoKTtcblxuICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgIC8vIENhbGxpbmcgd2l0aCBubyBwYXJhbWV0ZXJzIHRvIGluZGljYXRlIHRoZSBtZXNzYWdlcyB3ZXJlIGRlbGV0ZWQuXG4gICAgICAgIHRoaXMub25EYXRhKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3RybDtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogRGVsZXRlIGFsbCBtZXNzYWdlcy4gSGFyZC1kZWxldGluZyBtZXNzYWdlcyByZXF1aXJlcyBPd25lciBwZXJtaXNzaW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhhcmREZWwgLSB0cnVlIGlmIG1lc3NhZ2VzIHNob3VsZCBiZSBoYXJkLWRlbGV0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byByZXF1ZXN0LlxuICAgKi9cbiAgZGVsTWVzc2FnZXNBbGw6IGZ1bmN0aW9uKGhhcmREZWwpIHtcbiAgICBpZiAoIXRoaXMuX21heFNlcSB8fCB0aGlzLl9tYXhTZXEgPD0gMCkge1xuICAgICAgLy8gVGhlcmUgYXJlIG5vIG1lc3NhZ2VzIHRvIGRlbGV0ZS5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGVsTWVzc2FnZXMoW3tcbiAgICAgIGxvdzogMSxcbiAgICAgIGhpOiB0aGlzLl9tYXhTZXEgKyAxLFxuICAgICAgX2FsbDogdHJ1ZVxuICAgIH1dLCBoYXJkRGVsKTtcbiAgfSxcblxuICAvKipcbiAgICogRGVsZXRlIG11bHRpcGxlIG1lc3NhZ2VzIGRlZmluZWQgYnkgdGhlaXIgSURzLiBIYXJkLWRlbGV0aW5nIG1lc3NhZ2VzIHJlcXVpcmVzIE93bmVyIHBlcm1pc3Npb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7VGlub2RlLkRlbFJhbmdlW119IGxpc3QgLSBsaXN0IG9mIHNlcSBJRHMgdG8gZGVsZXRlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGhhcmREZWwgLSB0cnVlIGlmIG1lc3NhZ2VzIHNob3VsZCBiZSBoYXJkLWRlbGV0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byByZXF1ZXN0LlxuICAgKi9cbiAgZGVsTWVzc2FnZXNMaXN0OiBmdW5jdGlvbihsaXN0LCBoYXJkRGVsKSB7XG4gICAgLy8gU29ydCB0aGUgbGlzdCBpbiBhc2NlbmRpbmcgb3JkZXJcbiAgICBsaXN0LnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgICAvLyBDb252ZXJ0IHRoZSBhcnJheSBvZiBJRHMgdG8gcmFuZ2VzLlxuICAgIGxldCByYW5nZXMgPSBsaXN0LnJlZHVjZSgob3V0LCBpZCkgPT4ge1xuICAgICAgaWYgKG91dC5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBGaXJzdCBlbGVtZW50LlxuICAgICAgICBvdXQucHVzaCh7XG4gICAgICAgICAgbG93OiBpZFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcmV2ID0gb3V0W291dC5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKCghcHJldi5oaSAmJiAoaWQgIT0gcHJldi5sb3cgKyAxKSkgfHwgKGlkID4gcHJldi5oaSkpIHtcbiAgICAgICAgICAvLyBOZXcgcmFuZ2UuXG4gICAgICAgICAgb3V0LnB1c2goe1xuICAgICAgICAgICAgbG93OiBpZFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEV4cGFuZCBleGlzdGluZyByYW5nZS5cbiAgICAgICAgICBwcmV2LmhpID0gcHJldi5oaSA/IE1hdGgubWF4KHByZXYuaGksIGlkICsgMSkgOiBpZCArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfSwgW10pO1xuICAgIC8vIFNlbmQge2RlbH0gbWVzc2FnZSwgcmV0dXJuIHByb21pc2VcbiAgICByZXR1cm4gdGhpcy5kZWxNZXNzYWdlcyhyYW5nZXMsIGhhcmREZWwpXG4gIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0b3BpYy4gUmVxdWlyZXMgT3duZXIgcGVybWlzc2lvbi4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNkZWxUb3BpY30uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaGFyZCAtIGhhZC1kZWxldGUgdG9waWMuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byB0aGUgcmVxdWVzdC5cbiAgICovXG4gIGRlbFRvcGljOiBmdW5jdGlvbihoYXJkKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5kZWxUb3BpYyh0aGlzLm5hbWUsIGhhcmQpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIHRoaXMuX3Jlc2V0U3ViKCk7XG4gICAgICB0aGlzLl9nb25lKCk7XG4gICAgICByZXR1cm4gY3RybDtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogRGVsZXRlIHN1YnNjcmlwdGlvbi4gUmVxdWlyZXMgU2hhcmUgcGVybWlzc2lvbi4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNkZWxTdWJzY3JpcHRpb259LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlciAtIElEIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBzdWJzY3JpcHRpb24gZm9yLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gcmVxdWVzdC5cbiAgICovXG4gIGRlbFN1YnNjcmlwdGlvbjogZnVuY3Rpb24odXNlcikge1xuICAgIGlmICghdGhpcy5fc3Vic2NyaWJlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbm5vdCBkZWxldGUgc3Vic2NyaXB0aW9uIGluIGluYWN0aXZlIHRvcGljXCIpKTtcbiAgICB9XG4gICAgLy8gU2VuZCB7ZGVsfSBtZXNzYWdlLCByZXR1cm4gcHJvbWlzZVxuICAgIHJldHVybiB0aGlzLl90aW5vZGUuZGVsU3Vic2NyaXB0aW9uKHRoaXMubmFtZSwgdXNlcikudGhlbigoY3RybCkgPT4ge1xuICAgICAgLy8gUmVtb3ZlIHRoZSBvYmplY3QgZnJvbSB0aGUgc3Vic2NyaXB0aW9uIGNhY2hlO1xuICAgICAgZGVsZXRlIHRoaXMuX3VzZXJzW3VzZXJdO1xuICAgICAgLy8gTm90aWZ5IGxpc3RlbmVyc1xuICAgICAgaWYgKHRoaXMub25TdWJzVXBkYXRlZCkge1xuICAgICAgICB0aGlzLm9uU3Vic1VwZGF0ZWQoT2JqZWN0LmtleXModGhpcy5fdXNlcnMpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZW5kIGEgcmVhZC9yZWN2IG5vdGlmaWNhdGlvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdoYXQgLSB3aGF0IG5vdGlmaWNhdGlvbiB0byBzZW5kOiA8Y29kZT5yZWN2PC9jb2RlPiwgPGNvZGU+cmVhZDwvY29kZT4uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBJRCBvciB0aGUgbWVzc2FnZSByZWFkIG9yIHJlY2VpdmVkLlxuICAgKi9cbiAgbm90ZTogZnVuY3Rpb24od2hhdCwgc2VxKSB7XG4gICAgaWYgKCF0aGlzLl9zdWJzY3JpYmVkKSB7XG4gICAgICAvLyBDYW5ub3Qgc2VuZGluZyB7bm90ZX0gb24gYW4gaW5hY3RpdmUgdG9waWNcIi5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgbG9jYWwgY2FjaGUgd2l0aCB0aGUgbmV3IGNvdW50LlxuICAgIGNvbnN0IHVzZXIgPSB0aGlzLl91c2Vyc1t0aGlzLl90aW5vZGUuZ2V0Q3VycmVudFVzZXJJRCgpXTtcbiAgICBsZXQgdXBkYXRlID0gZmFsc2U7XG4gICAgaWYgKHVzZXIpIHtcbiAgICAgIC8vIFNlbGYtc3Vic2NyaXB0aW9uIGlzIGZvdW5kLlxuICAgICAgaWYgKCF1c2VyW3doYXRdIHx8IHVzZXJbd2hhdF0gPCBzZXEpIHtcbiAgICAgICAgdXNlclt3aGF0XSA9IHNlcTtcbiAgICAgICAgdXBkYXRlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU2VsZi1zdWJzY3JpcHRpb24gaXMgbm90IGZvdW5kLlxuICAgICAgdXBkYXRlID0gKHRoaXNbd2hhdF0gfCAwKSA8IHNlcTtcbiAgICB9XG5cbiAgICBpZiAodXBkYXRlKSB7XG4gICAgICAvLyBTZW5kIG5vdGlmaWNhdGlvbiB0byB0aGUgc2VydmVyLlxuICAgICAgdGhpcy5fdGlub2RlLm5vdGUodGhpcy5uYW1lLCB3aGF0LCBzZXEpO1xuICAgICAgLy8gVXBkYXRlIGxvY2FsbHkgY2FjaGVkIGNvbnRhY3Qgd2l0aCB0aGUgbmV3IGNvdW50LlxuICAgICAgdGhpcy5fdXBkYXRlUmVhZFJlY3Yod2hhdCwgc2VxKTtcblxuICAgICAgY29uc3QgbWUgPSB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpO1xuICAgICAgaWYgKHRoaXMuYWNzICE9IG51bGwgJiYgIXRoaXMuYWNzLmlzTXV0ZWQoKSkge1xuICAgICAgICAvLyBTZW50IGEgbm90aWZpY2F0aW9uIHRvICdtZScgbGlzdGVuZXJzLlxuICAgICAgICBtZS5fcmVmcmVzaENvbnRhY3Qod2hhdCwgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBTZW5kIGEgJ3JlY3YnIHJlY2VpcHQuIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjbm90ZVJlY3Z9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxIC0gSUQgb2YgdGhlIG1lc3NhZ2UgdG8gYWtub3dsZWRnZS5cbiAgICovXG4gIG5vdGVSZWN2OiBmdW5jdGlvbihzZXEpIHtcbiAgICB0aGlzLm5vdGUoJ3JlY3YnLCBzZXEpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZW5kIGEgJ3JlYWQnIHJlY2VpcHQuIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjbm90ZVJlYWR9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxIC0gSUQgb2YgdGhlIG1lc3NhZ2UgdG8gYWtub3dsZWRnZSBvciAwL3VuZGVmaW5lZCB0byBhY2tub3dsZWRnZSB0aGUgbGF0ZXN0IG1lc3NhZ2VzLlxuICAgKi9cbiAgbm90ZVJlYWQ6IGZ1bmN0aW9uKHNlcSkge1xuICAgIHNlcSA9IHNlcSB8fCB0aGlzLl9tYXhTZXE7XG4gICAgaWYgKHNlcSA+IDApIHtcbiAgICAgIHRoaXMubm90ZSgncmVhZCcsIHNlcSk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBTZW5kIGEga2V5LXByZXNzIG5vdGlmaWNhdGlvbi4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNub3RlS2V5UHJlc3N9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKi9cbiAgbm90ZUtleVByZXNzOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fc3Vic2NyaWJlZCkge1xuICAgICAgdGhpcy5fdGlub2RlLm5vdGVLZXlQcmVzcyh0aGlzLm5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90aW5vZGUubG9nZ2VyKFwiSU5GTzogQ2Fubm90IHNlbmQgbm90aWZpY2F0aW9uIGluIGluYWN0aXZlIHRvcGljXCIpO1xuICAgIH1cbiAgfSxcblxuICAvLyBVcGRhdGUgY2FjaGVkIHJlYWQvcmVjdi91bnJlYWQgY291bnRzLlxuICBfdXBkYXRlUmVhZFJlY3Y6IGZ1bmN0aW9uKHdoYXQsIHNlcSwgdHMpIHtcbiAgICBsZXQgb2xkVmFsLCBkb1VwZGF0ZSA9IGZhbHNlO1xuXG4gICAgc2VxID0gc2VxIHwgMDtcbiAgICB0aGlzLnNlcSA9IHRoaXMuc2VxIHwgMDtcbiAgICB0aGlzLnJlYWQgPSB0aGlzLnJlYWQgfCAwO1xuICAgIHRoaXMucmVjdiA9IHRoaXMucmVjdiB8IDA7XG4gICAgc3dpdGNoICh3aGF0KSB7XG4gICAgICBjYXNlICdyZWN2JzpcbiAgICAgICAgb2xkVmFsID0gdGhpcy5yZWN2O1xuICAgICAgICB0aGlzLnJlY3YgPSBNYXRoLm1heCh0aGlzLnJlY3YsIHNlcSk7XG4gICAgICAgIGRvVXBkYXRlID0gKG9sZFZhbCAhPSB0aGlzLnJlY3YpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3JlYWQnOlxuICAgICAgICBvbGRWYWwgPSB0aGlzLnJlYWQ7XG4gICAgICAgIHRoaXMucmVhZCA9IE1hdGgubWF4KHRoaXMucmVhZCwgc2VxKTtcbiAgICAgICAgZG9VcGRhdGUgPSAob2xkVmFsICE9IHRoaXMucmVhZCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbXNnJzpcbiAgICAgICAgb2xkVmFsID0gdGhpcy5zZXE7XG4gICAgICAgIHRoaXMuc2VxID0gTWF0aC5tYXgodGhpcy5zZXEsIHNlcSk7XG4gICAgICAgIGlmICghdGhpcy50b3VjaGVkIHx8IHRoaXMudG91Y2hlZCA8IHRzKSB7XG4gICAgICAgICAgdGhpcy50b3VjaGVkID0gdHM7XG4gICAgICAgIH1cbiAgICAgICAgZG9VcGRhdGUgPSAob2xkVmFsICE9IHRoaXMuc2VxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gU2FuaXR5IGNoZWNrcy5cbiAgICBpZiAodGhpcy5yZWN2IDwgdGhpcy5yZWFkKSB7XG4gICAgICB0aGlzLnJlY3YgPSB0aGlzLnJlYWQ7XG4gICAgICBkb1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLnNlcSA8IHRoaXMucmVjdikge1xuICAgICAgdGhpcy5zZXEgPSB0aGlzLnJlY3Y7XG4gICAgICBpZiAoIXRoaXMudG91Y2hlZCB8fCB0aGlzLnRvdWNoZWQgPCB0cykge1xuICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cztcbiAgICAgIH1cbiAgICAgIGRvVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy51bnJlYWQgPSB0aGlzLnNlcSAtIHRoaXMucmVhZDtcbiAgICByZXR1cm4gZG9VcGRhdGU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGRlc2NyaXB0aW9uIGZyb20gZ2xvYmFsIGNhY2hlLiBUaGUgdXNlciBkb2VzIG5vdCBuZWVkIHRvIGJlIGFcbiAgICogc3Vic2NyaWJlciBvZiB0aGlzIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gSUQgb2YgdGhlIHVzZXIgdG8gZmV0Y2guXG4gICAqIEByZXR1cm4ge09iamVjdH0gdXNlciBkZXNjcmlwdGlvbiBvciB1bmRlZmluZWQuXG4gICAqL1xuICB1c2VyRGVzYzogZnVuY3Rpb24odWlkKSB7XG4gICAgLy8gVE9ETyhnZW5lKTogaGFuZGxlIGFzeW5jaHJvbm91cyByZXF1ZXN0c1xuXG4gICAgY29uc3QgdXNlciA9IHRoaXMuX2NhY2hlR2V0VXNlcih1aWQpO1xuICAgIGlmICh1c2VyKSB7XG4gICAgICByZXR1cm4gdXNlcjsgLy8gUHJvbWlzZS5yZXNvbHZlKHVzZXIpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgZGVzY3JpcHRpb24gb2YgdGhlIHAycCBwZWVyIGZyb20gc3Vic2NyaXB0aW9uIGNhY2hlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IHBlZXIncyBkZXNjcmlwdGlvbiBvciB1bmRlZmluZWQuXG4gICAqL1xuICBwMnBQZWVyRGVzYzogZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLmlzUDJQVHlwZSgpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdXNlcnNbdGhpcy5uYW1lXTtcbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGNhY2hlZCBzdWJzY3JpYmVycy4gSWYgY2FsbGJhY2sgaXMgdW5kZWZpbmVkLCB1c2UgdGhpcy5vbk1ldGFTdWIuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgd2hpY2ggd2lsbCByZWNlaXZlIHN1YnNjcmliZXJzIG9uZSBieSBvbmUuXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gY29udGV4dCAtIFZhbHVlIG9mIGB0aGlzYCBpbnNpZGUgdGhlIGBjYWxsYmFja2AuXG4gICAqL1xuICBzdWJzY3JpYmVyczogZnVuY3Rpb24oY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBjb25zdCBjYiA9IChjYWxsYmFjayB8fCB0aGlzLm9uTWV0YVN1Yik7XG4gICAgaWYgKGNiKSB7XG4gICAgICBmb3IgKGxldCBpZHggaW4gdGhpcy5fdXNlcnMpIHtcbiAgICAgICAgY2IuY2FsbChjb250ZXh0LCB0aGlzLl91c2Vyc1tpZHhdLCBpZHgsIHRoaXMuX3VzZXJzKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhIGNvcHkgb2YgY2FjaGVkIHRhZ3MuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm4ge0FycmF5LjxzdHJpbmc+fSBhIGNvcHkgb2YgdGFnc1xuICAgKi9cbiAgdGFnczogZnVuY3Rpb24oKSB7XG4gICAgLy8gUmV0dXJuIGEgY29weS5cbiAgICByZXR1cm4gdGhpcy5fdGFncy5zbGljZSgwKTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGNhY2hlZCBzdWJzY3JpcHRpb24gZm9yIHRoZSBnaXZlbiB1c2VyIElELlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gaWQgb2YgdGhlIHVzZXIgdG8gcXVlcnkgZm9yXG4gICAqIEByZXR1cm4gdXNlciBkZXNjcmlwdGlvbiBvciB1bmRlZmluZWQuXG4gICAqL1xuICBzdWJzY3JpYmVyOiBmdW5jdGlvbih1aWQpIHtcbiAgICByZXR1cm4gdGhpcy5fdXNlcnNbdWlkXTtcbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGNhY2hlZCBtZXNzYWdlcy4gSWYgY2FsbGJhY2sgaXMgdW5kZWZpbmVkLCB1c2UgdGhpcy5vbkRhdGEuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgd2hpY2ggd2lsbCByZWNlaXZlIG1lc3NhZ2VzIG9uZSBieSBvbmUuIFNlZSB7QGxpbmsgVGlub2RlLkNCdWZmZXIjZm9yRWFjaH1cbiAgICogQHBhcmFtIHtudW1iZXJ9IHNpbmNlSWQgLSBPcHRpb25hbCBzZXFJZCB0byBzdGFydCBpdGVyYXRpbmcgZnJvbSAoaW5jbHVzaXZlKS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGJlZm9yZUlkIC0gT3B0aW9uYWwgc2VxSWQgdG8gc3RvcCBpdGVyYXRpbmcgYmVmb3JlIChleGNsdXNpdmUpLlxuICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIFZhbHVlIG9mIGB0aGlzYCBpbnNpZGUgdGhlIGBjYWxsYmFja2AuXG4gICAqL1xuICBtZXNzYWdlczogZnVuY3Rpb24oY2FsbGJhY2ssIHNpbmNlSWQsIGJlZm9yZUlkLCBjb250ZXh0KSB7XG4gICAgY29uc3QgY2IgPSAoY2FsbGJhY2sgfHwgdGhpcy5vbkRhdGEpO1xuICAgIGlmIChjYikge1xuICAgICAgbGV0IHN0YXJ0SWR4ID0gdHlwZW9mIHNpbmNlSWQgPT0gJ251bWJlcicgPyB0aGlzLl9tZXNzYWdlcy5maW5kKHtcbiAgICAgICAgc2VxOiBzaW5jZUlkXG4gICAgICB9LCB0cnVlKSA6IHVuZGVmaW5lZDtcbiAgICAgIGxldCBiZWZvcmVJZHggPSB0eXBlb2YgYmVmb3JlSWQgPT0gJ251bWJlcicgPyB0aGlzLl9tZXNzYWdlcy5maW5kKHtcbiAgICAgICAgc2VxOiBiZWZvcmVJZFxuICAgICAgfSwgdHJ1ZSkgOiB1bmRlZmluZWQ7XG4gICAgICBpZiAoc3RhcnRJZHggIT0gLTEgJiYgYmVmb3JlSWR4ICE9IC0xKSB7XG4gICAgICAgIHRoaXMuX21lc3NhZ2VzLmZvckVhY2goY2IsIHN0YXJ0SWR4LCBiZWZvcmVJZHgsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBtb3N0IHJlY2VudCBtZXNzYWdlIGZyb20gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IHRoZSBtb3N0IHJlY2VudCBjYWNoZWQgbWVzc2FnZSBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+LCBpZiBubyBtZXNzYWdlcyBhcmUgY2FjaGVkLlxuICAgKi9cbiAgbGF0ZXN0TWVzc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX21lc3NhZ2VzLmdldExhc3QoKTtcbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGNhY2hlZCB1bnNlbnQgbWVzc2FnZXMuIFdyYXBzIHtAbGluayBUaW5vZGUuVG9waWMjbWVzc2FnZXN9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIHdoaWNoIHdpbGwgcmVjZWl2ZSBtZXNzYWdlcyBvbmUgYnkgb25lLiBTZWUge0BsaW5rIFRpbm9kZS5DQnVmZmVyI2ZvckVhY2h9XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gVmFsdWUgb2YgPGNvZGU+dGhpczwvY29kZT4gaW5zaWRlIHRoZSA8Y29kZT5jYWxsYmFjazwvY29kZT4uXG4gICAqL1xuICBxdWV1ZWRNZXNzYWdlczogZnVuY3Rpb24oY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayBtdXN0IGJlIHByb3ZpZGVkXCIpO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VzKGNhbGxiYWNrLCBMT0NBTF9TRVFJRCwgdW5kZWZpbmVkLCBjb250ZXh0KTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgdG9waWMgc3Vic2NyaWJlcnMgd2hvIG1hcmtlZCB0aGlzIG1lc3NhZ2UgYXMgZWl0aGVyIHJlY3Ygb3IgcmVhZFxuICAgKiBDdXJyZW50IHVzZXIgaXMgZXhjbHVkZWQgZnJvbSB0aGUgY291bnQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3aGF0IC0gd2hhdCBhY3Rpb24gdG8gY29uc2lkZXI6IHJlY2VpdmVkIDxjb2RlPlwicmVjdlwiPC9jb2RlPiBvciByZWFkIDxjb2RlPlwicmVhZFwiPC9jb2RlPi5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlcSAtIElEIG9yIHRoZSBtZXNzYWdlIHJlYWQgb3IgcmVjZWl2ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBudW1iZXIgb2Ygc3Vic2NyaWJlcnMgd2hvIG1hcmtlZCB0aGUgbWVzc2FnZSB3aXRoIHRoZSBnaXZlbiBJRCBhcyByZWFkIG9yIHJlY2VpdmVkLlxuICAgKi9cbiAgbXNnUmVjZWlwdENvdW50OiBmdW5jdGlvbih3aGF0LCBzZXEpIHtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGlmIChzZXEgPiAwKSB7XG4gICAgICBjb25zdCBtZSA9IHRoaXMuX3Rpbm9kZS5nZXRDdXJyZW50VXNlcklEKCk7XG4gICAgICBmb3IgKGxldCBpZHggaW4gdGhpcy5fdXNlcnMpIHtcbiAgICAgICAgY29uc3QgdXNlciA9IHRoaXMuX3VzZXJzW2lkeF07XG4gICAgICAgIGlmICh1c2VyLnVzZXIgIT09IG1lICYmIHVzZXJbd2hhdF0gPj0gc2VxKSB7XG4gICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY291bnQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbnVtYmVyIG9mIHRvcGljIHN1YnNjcmliZXJzIHdobyBtYXJrZWQgdGhpcyBtZXNzYWdlIChhbmQgYWxsIG9sZGVyIG1lc3NhZ2VzKSBhcyByZWFkLlxuICAgKiBUaGUgY3VycmVudCB1c2VyIGlzIGV4Y2x1ZGVkIGZyb20gdGhlIGNvdW50LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxIC0gbWVzc2FnZSBpZCB0byBjaGVjay5cbiAgICogQHJldHVybnMge251bWJlcn0gbnVtYmVyIG9mIHN1YnNjcmliZXJzIHdobyBjbGFpbSB0byBoYXZlIHJlY2VpdmVkIHRoZSBtZXNzYWdlLlxuICAgKi9cbiAgbXNnUmVhZENvdW50OiBmdW5jdGlvbihzZXEpIHtcbiAgICByZXR1cm4gdGhpcy5tc2dSZWNlaXB0Q291bnQoJ3JlYWQnLCBzZXEpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiB0b3BpYyBzdWJzY3JpYmVycyB3aG8gbWFya2VkIHRoaXMgbWVzc2FnZSAoYW5kIGFsbCBvbGRlciBtZXNzYWdlcykgYXMgcmVjZWl2ZWQuXG4gICAqIFRoZSBjdXJyZW50IHVzZXIgaXMgZXhjbHVkZWQgZnJvbSB0aGUgY291bnQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBNZXNzYWdlIGlkIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBOdW1iZXIgb2Ygc3Vic2NyaWJlcnMgd2hvIGNsYWltIHRvIGhhdmUgcmVjZWl2ZWQgdGhlIG1lc3NhZ2UuXG4gICAqL1xuICBtc2dSZWN2Q291bnQ6IGZ1bmN0aW9uKHNlcSkge1xuICAgIHJldHVybiB0aGlzLm1zZ1JlY2VpcHRDb3VudCgncmVjdicsIHNlcSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNhY2hlZCBtZXNzYWdlIElEcyBpbmRpY2F0ZSB0aGF0IHRoZSBzZXJ2ZXIgbWF5IGhhdmUgbW9yZSBtZXNzYWdlcy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBuZXdlciAtIGlmIDxjb2RlPnRydWU8L2NvZGU+LCBjaGVjayBmb3IgbmV3ZXIgbWVzc2FnZXMgb25seS5cbiAgICovXG4gIG1zZ0hhc01vcmVNZXNzYWdlczogZnVuY3Rpb24obmV3ZXIpIHtcbiAgICByZXR1cm4gbmV3ZXIgPyB0aGlzLnNlcSA+IHRoaXMuX21heFNlcSA6XG4gICAgICAvLyBfbWluU2VxIGNvdWxkIGJlIG1vcmUgdGhhbiAxLCBidXQgZWFybGllciBtZXNzYWdlcyBjb3VsZCBoYXZlIGJlZW4gZGVsZXRlZC5cbiAgICAgICh0aGlzLl9taW5TZXEgPiAxICYmICF0aGlzLl9ub0VhcmxpZXJNc2dzKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIGdpdmVuIHNlcSBJZCBpcyBpZCBvZiB0aGUgbW9zdCByZWNlbnQgbWVzc2FnZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlcUlkIGlkIG9mIHRoZSBtZXNzYWdlIHRvIGNoZWNrXG4gICAqL1xuICBpc05ld01lc3NhZ2U6IGZ1bmN0aW9uKHNlcUlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX21heFNlcSA8PSBzZXFJZDtcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIG9uZSBtZXNzYWdlIGZyb20gbG9jYWwgY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXFJZCBpZCBvZiB0aGUgbWVzc2FnZSB0byByZW1vdmUgZnJvbSBjYWNoZS5cbiAgICogQHJldHVybnMge01lc3NhZ2V9IHJlbW92ZWQgbWVzc2FnZSBvciB1bmRlZmluZWQgaWYgc3VjaCBtZXNzYWdlIHdhcyBub3QgZm91bmQuXG4gICAqL1xuICBmbHVzaE1lc3NhZ2U6IGZ1bmN0aW9uKHNlcUlkKSB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5fbWVzc2FnZXMuZmluZCh7XG4gICAgICBzZXE6IHNlcUlkXG4gICAgfSk7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICB0aGlzLl90aW5vZGUuX2RiLnJlbU1lc3NhZ2VzKHRoaXMubmFtZSwgc2VxSWQpO1xuICAgICAgcmV0dXJuIHRoaXMuX21lc3NhZ2VzLmRlbEF0KGlkeCk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBtZXNzYWdlJ3Mgc2VxSWQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwdWIgbWVzc2FnZSBvYmplY3QuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBuZXdTZXFJZCBuZXcgc2VxIGlkIGZvciBwdWIuXG4gICAqL1xuICBzd2FwTWVzc2FnZUlkOiBmdW5jdGlvbihwdWIsIG5ld1NlcUlkKSB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5fbWVzc2FnZXMuZmluZChwdWIpO1xuICAgIGNvbnN0IG51bU1lc3NhZ2VzID0gdGhpcy5fbWVzc2FnZXMubGVuZ3RoKCk7XG4gICAgaWYgKDAgPD0gaWR4ICYmIGlkeCA8IG51bU1lc3NhZ2VzKSB7XG4gICAgICAvLyBSZW1vdmUgbWVzc2FnZSB3aXRoIHRoZSBvbGQgc2VxIElELlxuICAgICAgdGhpcy5fbWVzc2FnZXMuZGVsQXQoaWR4KTtcbiAgICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtTWVzc2FnZXModGhpcy5uYW1lLCBwdWIuc2VxKTtcbiAgICAgIC8vIEFkZCBtZXNzYWdlIHdpdGggdGhlIG5ldyBzZXEgSUQuXG4gICAgICBwdWIuc2VxID0gbmV3U2VxSWQ7XG4gICAgICB0aGlzLl9tZXNzYWdlcy5wdXQocHViKTtcbiAgICAgIHRoaXMuX3Rpbm9kZS5fZGIuYWRkTWVzc2FnZShwdWIpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGEgcmFuZ2Ugb2YgbWVzc2FnZXMgZnJvbSB0aGUgbG9jYWwgY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tSWQgc2VxIElEIG9mIHRoZSBmaXJzdCBtZXNzYWdlIHRvIHJlbW92ZSAoaW5jbHVzaXZlKS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHVudGlsSWQgc2VxSUQgb2YgdGhlIGxhc3QgbWVzc2FnZSB0byByZW1vdmUgKGV4Y2x1c2l2ZSkuXG4gICAqXG4gICAqIEByZXR1cm5zIHtNZXNzYWdlW119IGFycmF5IG9mIHJlbW92ZWQgbWVzc2FnZXMgKGNvdWxkIGJlIGVtcHR5KS5cbiAgICovXG4gIGZsdXNoTWVzc2FnZVJhbmdlOiBmdW5jdGlvbihmcm9tSWQsIHVudGlsSWQpIHtcbiAgICAvLyBSZW1vdmUgcmFuZ2UgZnJvbSBwZXJzaXN0ZW50IGNhY2hlLlxuICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtTWVzc2FnZXModGhpcy5uYW1lLCBmcm9tSWQsIHVudGlsSWQpO1xuICAgIC8vIHN0YXJ0LCBlbmQ6IGZpbmQgaW5zZXJ0aW9uIHBvaW50cyAobmVhcmVzdCA9PSB0cnVlKS5cbiAgICBjb25zdCBzaW5jZSA9IHRoaXMuX21lc3NhZ2VzLmZpbmQoe1xuICAgICAgc2VxOiBmcm9tSWRcbiAgICB9LCB0cnVlKTtcbiAgICByZXR1cm4gc2luY2UgPj0gMCA/IHRoaXMuX21lc3NhZ2VzLmRlbFJhbmdlKHNpbmNlLCB0aGlzLl9tZXNzYWdlcy5maW5kKHtcbiAgICAgIHNlcTogdW50aWxJZFxuICAgIH0sIHRydWUpKSA6IFtdO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBdHRlbXB0IHRvIHN0b3AgbWVzc2FnZSBmcm9tIGJlaW5nIHNlbnQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXFJZCBpZCBvZiB0aGUgbWVzc2FnZSB0byBzdG9wIHNlbmRpbmcgYW5kIHJlbW92ZSBmcm9tIGNhY2hlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgbWVzc2FnZSB3YXMgY2FuY2VsbGVkLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgY2FuY2VsU2VuZDogZnVuY3Rpb24oc2VxSWQpIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLl9tZXNzYWdlcy5maW5kKHtcbiAgICAgIHNlcTogc2VxSWRcbiAgICB9KTtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGNvbnN0IG1zZyA9IHRoaXMuX21lc3NhZ2VzLmdldEF0KGlkeCk7XG4gICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLm1zZ1N0YXR1cyhtc2cpO1xuICAgICAgaWYgKHN0YXR1cyA9PSBNRVNTQUdFX1NUQVRVU19RVUVVRUQgfHwgc3RhdHVzID09IE1FU1NBR0VfU1RBVFVTX0ZBSUxFRCkge1xuICAgICAgICB0aGlzLl90aW5vZGUuX2RiLnJlbU1lc3NhZ2VzKHRoaXMubmFtZSwgc2VxSWQpO1xuICAgICAgICBtc2cuX2NhbmNlbGxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX21lc3NhZ2VzLmRlbEF0KGlkeCk7XG4gICAgICAgIGlmICh0aGlzLm9uRGF0YSkge1xuICAgICAgICAgIC8vIENhbGxpbmcgd2l0aCBubyBwYXJhbWV0ZXJzIHRvIGluZGljYXRlIHRoZSBtZXNzYWdlIHdhcyBkZWxldGVkLlxuICAgICAgICAgIHRoaXMub25EYXRhKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHR5cGUgb2YgdGhlIHRvcGljOiBtZSwgcDJwLCBncnAsIGZuZC4uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBPbmUgb2YgJ21lJywgJ3AycCcsICdncnAnLCAnZm5kJywgJ3N5cycgb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPi5cbiAgICovXG4gIGdldFR5cGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBUaW5vZGUudG9waWNUeXBlKHRoaXMubmFtZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBjdXJyZW50IHVzZXIncyBhY2Nlc3MgbW9kZSBvZiB0aGUgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuQWNjZXNzTW9kZX0gLSB1c2VyJ3MgYWNjZXNzIG1vZGVcbiAgICovXG4gIGdldEFjY2Vzc01vZGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmFjcztcbiAgfSxcblxuICAvKipcbiAgICogU2V0IGN1cnJlbnQgdXNlcidzIGFjY2VzcyBtb2RlIG9mIHRoZSB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtBY2Nlc3NNb2RlIHwgT2JqZWN0fSBhY3MgLSBhY2Nlc3MgbW9kZSB0byBzZXQuXG4gICAqL1xuICBzZXRBY2Nlc3NNb2RlOiBmdW5jdGlvbihhY3MpIHtcbiAgICByZXR1cm4gdGhpcy5hY3MgPSBuZXcgQWNjZXNzTW9kZShhY3MpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdG9waWMncyBkZWZhdWx0IGFjY2VzcyBtb2RlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLkRlZkFjc30gLSBhY2Nlc3MgbW9kZSwgc3VjaCBhcyB7YXV0aDogYFJXUGAsIGFub246IGBOYH0uXG4gICAqL1xuICBnZXREZWZhdWx0QWNjZXNzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kZWZhY3M7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgbmV3IG1ldGEge0BsaW5rIFRpbm9kZS5HZXRRdWVyeX0gYnVpbGRlci4gVGhlIHF1ZXJ5IGlzIGF0dGNoZWQgdG8gdGhlIGN1cnJlbnQgdG9waWMuXG4gICAqIEl0IHdpbGwgbm90IHdvcmsgY29ycmVjdGx5IGlmIHVzZWQgd2l0aCBhIGRpZmZlcmVudCB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gcXVlcnkgYXR0YWNoZWQgdG8gdGhlIGN1cnJlbnQgdG9waWMuXG4gICAqL1xuICBzdGFydE1ldGFRdWVyeTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBNZXRhR2V0QnVpbGRlcih0aGlzKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYXJjaGl2ZWQsIGkuZS4gcHJpdmF0ZS5hcmNoID09IHRydWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIHRvcGljIGlzIGFyY2hpdmVkLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNBcmNoaXZlZDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucHJpdmF0ZSAmJiB0aGlzLnByaXZhdGUuYXJjaCA/IHRydWUgOiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYSAnbWUnIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0b3BpYyBpcyBhICdtZScgdG9waWMsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBpc01lVHlwZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFRpbm9kZS5pc01lVG9waWNOYW1lKHRoaXMubmFtZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRvcGljIGlzIGEgY2hhbm5lbC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdG9waWMgaXMgYSBjaGFubmVsLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNDaGFubmVsVHlwZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFRpbm9kZS5pc0NoYW5uZWxUb3BpY05hbWUodGhpcy5uYW1lKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYSBncm91cCB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdG9waWMgaXMgYSBncm91cCwgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIGlzR3JvdXBUeXBlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gVGlub2RlLmlzR3JvdXBUb3BpY05hbWUodGhpcy5uYW1lKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYSBwMnAgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIHRvcGljIGlzIGEgcDJwIHRvcGljLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNQMlBUeXBlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gVGlub2RlLmlzUDJQVG9waWNOYW1lKHRoaXMubmFtZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRvcGljIGlzIGEgY29tbXVuaWNhdGlvbiB0b3BpYywgaS5lLiBhIGdyb3VwIG9yIHAycCB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdG9waWMgaXMgYSBwMnAgb3IgZ3JvdXAgdG9waWMsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBpc0NvbW1UeXBlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gVGlub2RlLmlzQ29tbVRvcGljTmFtZSh0aGlzLm5hbWUpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgc3RhdHVzIChxdWV1ZWQsIHNlbnQsIHJlY2VpdmVkIGV0Yykgb2YgYSBnaXZlbiBtZXNzYWdlIGluIHRoZSBjb250ZXh0XG4gICAqIG9mIHRoaXMgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7TWVzc2FnZX0gbXNnIC0gbWVzc2FnZSB0byBjaGVjayBmb3Igc3RhdHVzLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHVwZCAtIHVwZGF0ZSBjaGFjaGVkIG1lc3NhZ2Ugc3RhdHVzLlxuICAgKlxuICAgKiBAcmV0dXJucyBtZXNzYWdlIHN0YXR1cyBjb25zdGFudC5cbiAgICovXG4gIG1zZ1N0YXR1czogZnVuY3Rpb24obXNnLCB1cGQpIHtcbiAgICBsZXQgc3RhdHVzID0gTUVTU0FHRV9TVEFUVVNfTk9ORTtcbiAgICBpZiAodGhpcy5fdGlub2RlLmlzTWUobXNnLmZyb20pKSB7XG4gICAgICBpZiAobXNnLl9zZW5kaW5nKSB7XG4gICAgICAgIHN0YXR1cyA9IE1FU1NBR0VfU1RBVFVTX1NFTkRJTkc7XG4gICAgICB9IGVsc2UgaWYgKG1zZy5fZmFpbGVkIHx8IG1zZy5fY2FuY2VsbGVkKSB7XG4gICAgICAgIHN0YXR1cyA9IE1FU1NBR0VfU1RBVFVTX0ZBSUxFRDtcbiAgICAgIH0gZWxzZSBpZiAobXNnLnNlcSA+PSBMT0NBTF9TRVFJRCkge1xuICAgICAgICBzdGF0dXMgPSBNRVNTQUdFX1NUQVRVU19RVUVVRUQ7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubXNnUmVhZENvdW50KG1zZy5zZXEpID4gMCkge1xuICAgICAgICBzdGF0dXMgPSBNRVNTQUdFX1NUQVRVU19SRUFEO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1zZ1JlY3ZDb3VudChtc2cuc2VxKSA+IDApIHtcbiAgICAgICAgc3RhdHVzID0gTUVTU0FHRV9TVEFUVVNfUkVDRUlWRUQ7XG4gICAgICB9IGVsc2UgaWYgKG1zZy5zZXEgPiAwKSB7XG4gICAgICAgIHN0YXR1cyA9IE1FU1NBR0VfU1RBVFVTX1NFTlQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXR1cyA9IE1FU1NBR0VfU1RBVFVTX1RPX01FO1xuICAgIH1cblxuICAgIGlmICh1cGQgJiYgbXNnLl9zdGF0dXMgIT0gc3RhdHVzKSB7XG4gICAgICBtc2cuX3N0YXR1cyA9IHN0YXR1cztcbiAgICAgIHRoaXMuX3Rpbm9kZS5fZGIudXBkTWVzc2FnZVN0YXR1cyh0aGlzLm5hbWUsIG1zZy5zZXEsIHN0YXR1cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXR1cztcbiAgfSxcblxuICAvLyBQcm9jZXNzIGRhdGEgbWVzc2FnZVxuICBfcm91dGVEYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgaWYgKGRhdGEuY29udGVudCkge1xuICAgICAgaWYgKCF0aGlzLnRvdWNoZWQgfHwgdGhpcy50b3VjaGVkIDwgZGF0YS50cykge1xuICAgICAgICB0aGlzLnRvdWNoZWQgPSBkYXRhLnRzO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkYXRhLnNlcSA+IHRoaXMuX21heFNlcSkge1xuICAgICAgdGhpcy5fbWF4U2VxID0gZGF0YS5zZXE7XG4gICAgfVxuICAgIGlmIChkYXRhLnNlcSA8IHRoaXMuX21pblNlcSB8fCB0aGlzLl9taW5TZXEgPT0gMCkge1xuICAgICAgdGhpcy5fbWluU2VxID0gZGF0YS5zZXE7XG4gICAgfVxuXG4gICAgaWYgKCFkYXRhLl9ub0ZvcndhcmRpbmcpIHtcbiAgICAgIHRoaXMuX21lc3NhZ2VzLnB1dChkYXRhKTtcbiAgICAgIHRoaXMuX3Rpbm9kZS5fZGIuYWRkTWVzc2FnZShkYXRhKTtcbiAgICAgIHRoaXMuX3VwZGF0ZURlbGV0ZWRSYW5nZXMoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vbkRhdGEpIHtcbiAgICAgIHRoaXMub25EYXRhKGRhdGEpO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBsb2NhbGx5IGNhY2hlZCBjb250YWN0IHdpdGggdGhlIG5ldyBtZXNzYWdlIGNvdW50LlxuICAgIGNvbnN0IHdoYXQgPSAoKCF0aGlzLmlzQ2hhbm5lbFR5cGUoKSAmJiAhZGF0YS5mcm9tKSB8fCB0aGlzLl90aW5vZGUuaXNNZShkYXRhLmZyb20pKSA/ICdyZWFkJyA6ICdtc2cnO1xuICAgIHRoaXMuX3VwZGF0ZVJlYWRSZWN2KHdoYXQsIGRhdGEuc2VxLCBkYXRhLnRzKTtcbiAgICAvLyBOb3RpZnkgJ21lJyBsaXN0ZW5lcnMgb2YgdGhlIGNoYW5nZS5cbiAgICB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpLl9yZWZyZXNoQ29udGFjdCh3aGF0LCB0aGlzKTtcbiAgfSxcblxuICAvLyBQcm9jZXNzIG1ldGFkYXRhIG1lc3NhZ2VcbiAgX3JvdXRlTWV0YTogZnVuY3Rpb24obWV0YSkge1xuICAgIGlmIChtZXRhLmRlc2MpIHtcbiAgICAgIHRoaXMuX2xhc3REZXNjVXBkYXRlID0gbWV0YS50cztcbiAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhRGVzYyhtZXRhLmRlc2MpO1xuICAgIH1cbiAgICBpZiAobWV0YS5zdWIgJiYgbWV0YS5zdWIubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5fbGFzdFN1YnNVcGRhdGUgPSBtZXRhLnRzO1xuICAgICAgdGhpcy5fcHJvY2Vzc01ldGFTdWIobWV0YS5zdWIpO1xuICAgIH1cbiAgICBpZiAobWV0YS5kZWwpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NEZWxNZXNzYWdlcyhtZXRhLmRlbC5jbGVhciwgbWV0YS5kZWwuZGVsc2VxKTtcbiAgICB9XG4gICAgaWYgKG1ldGEudGFncykge1xuICAgICAgdGhpcy5fcHJvY2Vzc01ldGFUYWdzKG1ldGEudGFncyk7XG4gICAgfVxuICAgIGlmIChtZXRhLmNyZWQpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhQ3JlZHMobWV0YS5jcmVkKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub25NZXRhKSB7XG4gICAgICB0aGlzLm9uTWV0YShtZXRhKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gUHJvY2VzcyBwcmVzZW5jZSBjaGFuZ2UgbWVzc2FnZVxuICBfcm91dGVQcmVzOiBmdW5jdGlvbihwcmVzKSB7XG4gICAgbGV0IHVzZXI7XG4gICAgc3dpdGNoIChwcmVzLndoYXQpIHtcbiAgICAgIGNhc2UgJ2RlbCc6XG4gICAgICAgIC8vIERlbGV0ZSBjYWNoZWQgbWVzc2FnZXMuXG4gICAgICAgIHRoaXMuX3Byb2Nlc3NEZWxNZXNzYWdlcyhwcmVzLmNsZWFyLCBwcmVzLmRlbHNlcSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb24nOlxuICAgICAgY2FzZSAnb2ZmJzpcbiAgICAgICAgLy8gVXBkYXRlIG9ubGluZSBzdGF0dXMgb2YgYSBzdWJzY3JpcHRpb24uXG4gICAgICAgIHVzZXIgPSB0aGlzLl91c2Vyc1twcmVzLnNyY107XG4gICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgdXNlci5vbmxpbmUgPSBwcmVzLndoYXQgPT0gJ29uJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl90aW5vZGUubG9nZ2VyKFwiV0FSTklORzogUHJlc2VuY2UgdXBkYXRlIGZvciBhbiB1bmtub3duIHVzZXJcIiwgdGhpcy5uYW1lLCBwcmVzLnNyYyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0ZXJtJzpcbiAgICAgICAgLy8gQXR0YWNobWVudCB0byB0b3BpYyBpcyB0ZXJtaW5hdGVkIHByb2JhYmx5IGR1ZSB0byBjbHVzdGVyIHJlaGFzaGluZy5cbiAgICAgICAgdGhpcy5fcmVzZXRTdWIoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhY3MnOlxuICAgICAgICBjb25zdCB1aWQgPSBwcmVzLnNyYyB8fCB0aGlzLl90aW5vZGUuZ2V0Q3VycmVudFVzZXJJRCgpO1xuICAgICAgICB1c2VyID0gdGhpcy5fdXNlcnNbdWlkXTtcbiAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgLy8gVXBkYXRlIGZvciBhbiB1bmtub3duIHVzZXI6IG5vdGlmaWNhdGlvbiBvZiBhIG5ldyBzdWJzY3JpcHRpb24uXG4gICAgICAgICAgY29uc3QgYWNzID0gbmV3IEFjY2Vzc01vZGUoKS51cGRhdGVBbGwocHJlcy5kYWNzKTtcbiAgICAgICAgICBpZiAoYWNzICYmIGFjcy5tb2RlICE9IEFjY2Vzc01vZGUuX05PTkUpIHtcbiAgICAgICAgICAgIHVzZXIgPSB0aGlzLl9jYWNoZUdldFVzZXIodWlkKTtcbiAgICAgICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgICAgICB1c2VyID0ge1xuICAgICAgICAgICAgICAgIHVzZXI6IHVpZCxcbiAgICAgICAgICAgICAgICBhY3M6IGFjc1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB0aGlzLmdldE1ldGEodGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhPbmVTdWIodW5kZWZpbmVkLCB1aWQpLmJ1aWxkKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdXNlci5hY3MgPSBhY3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1c2VyLnVwZGF0ZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc01ldGFTdWIoW3VzZXJdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gS25vd24gdXNlclxuICAgICAgICAgIHVzZXIuYWNzLnVwZGF0ZUFsbChwcmVzLmRhY3MpO1xuICAgICAgICAgIC8vIFVwZGF0ZSB1c2VyJ3MgYWNjZXNzIG1vZGUuXG4gICAgICAgICAgdGhpcy5fcHJvY2Vzc01ldGFTdWIoW3tcbiAgICAgICAgICAgIHVzZXI6IHVpZCxcbiAgICAgICAgICAgIHVwZGF0ZWQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICBhY3M6IHVzZXIuYWNzXG4gICAgICAgICAgfV0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy5fdGlub2RlLmxvZ2dlcihcIklORk86IElnbm9yZWQgcHJlc2VuY2UgdXBkYXRlXCIsIHByZXMud2hhdCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub25QcmVzKSB7XG4gICAgICB0aGlzLm9uUHJlcyhwcmVzKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gUHJvY2VzcyB7aW5mb30gbWVzc2FnZVxuICBfcm91dGVJbmZvOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgaWYgKGluZm8ud2hhdCAhPT0gJ2twJykge1xuICAgICAgY29uc3QgdXNlciA9IHRoaXMuX3VzZXJzW2luZm8uZnJvbV07XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICB1c2VyW2luZm8ud2hhdF0gPSBpbmZvLnNlcTtcbiAgICAgICAgaWYgKHVzZXIucmVjdiA8IHVzZXIucmVhZCkge1xuICAgICAgICAgIHVzZXIucmVjdiA9IHVzZXIucmVhZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgbXNnID0gdGhpcy5sYXRlc3RNZXNzYWdlKCk7XG4gICAgICBpZiAobXNnKSB7XG4gICAgICAgIHRoaXMubXNnU3RhdHVzKG1zZywgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoaXMgaXMgYW4gdXBkYXRlIGZyb20gdGhlIGN1cnJlbnQgdXNlciwgdXBkYXRlIHRoZSBjYWNoZSB3aXRoIHRoZSBuZXcgY291bnQuXG4gICAgICBpZiAodGhpcy5fdGlub2RlLmlzTWUoaW5mby5mcm9tKSkge1xuICAgICAgICB0aGlzLl91cGRhdGVSZWFkUmVjdihpbmZvLndoYXQsIGluZm8uc2VxKTtcbiAgICAgIH1cblxuICAgICAgLy8gTm90aWZ5ICdtZScgbGlzdGVuZXIgb2YgdGhlIHN0YXR1cyBjaGFuZ2UuXG4gICAgICB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpLl9yZWZyZXNoQ29udGFjdChpbmZvLndoYXQsIHRoaXMpO1xuICAgIH1cbiAgICBpZiAodGhpcy5vbkluZm8pIHtcbiAgICAgIHRoaXMub25JbmZvKGluZm8pO1xuICAgIH1cbiAgfSxcblxuICAvLyBDYWxsZWQgYnkgVGlub2RlIHdoZW4gbWV0YS5kZXNjIHBhY2tldCBpcyByZWNlaXZlZC5cbiAgLy8gQ2FsbGVkIGJ5ICdtZScgdG9waWMgb24gY29udGFjdCB1cGRhdGUgKGRlc2MuX25vRm9yd2FyZGluZyBpcyB0cnVlKS5cbiAgX3Byb2Nlc3NNZXRhRGVzYzogZnVuY3Rpb24oZGVzYykge1xuICAgIGlmICh0aGlzLmlzUDJQVHlwZSgpKSB7XG4gICAgICAvLyBTeW50aGV0aWMgZGVzYyBtYXkgaW5jbHVkZSBkZWZhY3MgZm9yIHAycCB0b3BpY3Mgd2hpY2ggaXMgdXNlbGVzcy5cbiAgICAgIC8vIFJlbW92ZSBpdC5cbiAgICAgIGRlbGV0ZSBkZXNjLmRlZmFjcztcblxuICAgICAgLy8gVXBkYXRlIHRvIHAycCBkZXNjIGlzIHRoZSBzYW1lIGFzIHVzZXIgdXBkYXRlLiBVcGRhdGUgY2FjaGVkIHVzZXIuXG4gICAgICB0aGlzLl90aW5vZGUuX2RiLnVwZFVzZXIodGhpcy5uYW1lLCBkZXNjLnB1YmxpYyk7XG4gICAgfVxuXG4gICAgLy8gQ29weSBwYXJhbWV0ZXJzIGZyb20gZGVzYyBvYmplY3QgdG8gdGhpcyB0b3BpYy5cbiAgICBtZXJnZU9iaih0aGlzLCBkZXNjKTtcbiAgICAvLyBNYWtlIHN1cmUgZGF0ZSBmaWVsZHMgYXJlIERhdGUoKS5cbiAgICBzdHJpbmdUb0RhdGUodGhpcyk7XG4gICAgLy8gVXBkYXRlIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgdGhpcy5fdGlub2RlLl9kYi51cGRUb3BpYyh0aGlzKTtcblxuICAgIC8vIE5vdGlmeSAnbWUnIGxpc3RlbmVyLCBpZiBhdmFpbGFibGU6XG4gICAgaWYgKHRoaXMubmFtZSAhPT0gVE9QSUNfTUUgJiYgIWRlc2MuX25vRm9yd2FyZGluZykge1xuICAgICAgY29uc3QgbWUgPSB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpO1xuICAgICAgaWYgKG1lLm9uTWV0YVN1Yikge1xuICAgICAgICBtZS5vbk1ldGFTdWIodGhpcyk7XG4gICAgICB9XG4gICAgICBpZiAobWUub25TdWJzVXBkYXRlZCkge1xuICAgICAgICBtZS5vblN1YnNVcGRhdGVkKFt0aGlzLm5hbWVdLCAxKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5vbk1ldGFEZXNjKSB7XG4gICAgICB0aGlzLm9uTWV0YURlc2ModGhpcyk7XG4gICAgfVxuICB9LFxuXG4gIC8vIENhbGxlZCBieSBUaW5vZGUgd2hlbiBtZXRhLnN1YiBpcyByZWNpdmVkIG9yIGluIHJlc3BvbnNlIHRvIHJlY2VpdmVkXG4gIC8vIHtjdHJsfSBhZnRlciBzZXRNZXRhLXN1Yi5cbiAgX3Byb2Nlc3NNZXRhU3ViOiBmdW5jdGlvbihzdWJzKSB7XG4gICAgZm9yIChsZXQgaWR4IGluIHN1YnMpIHtcbiAgICAgIGNvbnN0IHN1YiA9IHN1YnNbaWR4XTtcblxuICAgICAgc3ViLnVwZGF0ZWQgPSBuZXcgRGF0ZShzdWIudXBkYXRlZCk7XG4gICAgICBzdWIuZGVsZXRlZCA9IHN1Yi5kZWxldGVkID8gbmV3IERhdGUoc3ViLmRlbGV0ZWQpIDogbnVsbDtcblxuICAgICAgbGV0IHVzZXIgPSBudWxsO1xuICAgICAgaWYgKCFzdWIuZGVsZXRlZCkge1xuICAgICAgICAvLyBJZiB0aGlzIGlzIGEgY2hhbmdlIHRvIHVzZXIncyBvd24gcGVybWlzc2lvbnMsIHVwZGF0ZSB0aGVtIGluIHRvcGljIHRvby5cbiAgICAgICAgLy8gRGVzYyB3aWxsIHVwZGF0ZSAnbWUnIHRvcGljLlxuICAgICAgICBpZiAodGhpcy5fdGlub2RlLmlzTWUoc3ViLnVzZXIpICYmIHN1Yi5hY3MpIHtcbiAgICAgICAgICB0aGlzLl9wcm9jZXNzTWV0YURlc2Moe1xuICAgICAgICAgICAgdXBkYXRlZDogc3ViLnVwZGF0ZWQgfHwgbmV3IERhdGUoKSxcbiAgICAgICAgICAgIHRvdWNoZWQ6IHN1Yi51cGRhdGVkLFxuICAgICAgICAgICAgYWNzOiBzdWIuYWNzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdXNlciA9IHRoaXMuX3VwZGF0ZUNhY2hlZFVzZXIoc3ViLnVzZXIsIHN1Yik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTdWJzY3JpcHRpb24gaXMgZGVsZXRlZCwgcmVtb3ZlIGl0IGZyb20gdG9waWMgKGJ1dCBsZWF2ZSBpbiBVc2VycyBjYWNoZSlcbiAgICAgICAgZGVsZXRlIHRoaXMuX3VzZXJzW3N1Yi51c2VyXTtcbiAgICAgICAgdXNlciA9IHN1YjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub25NZXRhU3ViKSB7XG4gICAgICAgIHRoaXMub25NZXRhU3ViKHVzZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLm9uU3Vic1VwZGF0ZWQpIHtcbiAgICAgIHRoaXMub25TdWJzVXBkYXRlZChPYmplY3Qua2V5cyh0aGlzLl91c2VycykpO1xuICAgIH1cbiAgfSxcblxuICAvLyBDYWxsZWQgYnkgVGlub2RlIHdoZW4gbWV0YS50YWdzIGlzIHJlY2l2ZWQuXG4gIF9wcm9jZXNzTWV0YVRhZ3M6IGZ1bmN0aW9uKHRhZ3MpIHtcbiAgICBpZiAodGFncy5sZW5ndGggPT0gMSAmJiB0YWdzWzBdID09IFRpbm9kZS5ERUxfQ0hBUikge1xuICAgICAgdGFncyA9IFtdO1xuICAgIH1cbiAgICB0aGlzLl90YWdzID0gdGFncztcbiAgICBpZiAodGhpcy5vblRhZ3NVcGRhdGVkKSB7XG4gICAgICB0aGlzLm9uVGFnc1VwZGF0ZWQodGFncyk7XG4gICAgfVxuICB9LFxuXG4gIC8vIERvIG5vdGhpbmcgZm9yIHRvcGljcyBvdGhlciB0aGFuICdtZSdcbiAgX3Byb2Nlc3NNZXRhQ3JlZHM6IGZ1bmN0aW9uKGNyZWRzKSB7fSxcblxuICAvLyBEZWxldGUgY2FjaGVkIG1lc3NhZ2VzIGFuZCB1cGRhdGUgY2FjaGVkIHRyYW5zYWN0aW9uIElEc1xuICBfcHJvY2Vzc0RlbE1lc3NhZ2VzOiBmdW5jdGlvbihjbGVhciwgZGVsc2VxKSB7XG4gICAgdGhpcy5fbWF4RGVsID0gTWF0aC5tYXgoY2xlYXIsIHRoaXMuX21heERlbCk7XG4gICAgdGhpcy5jbGVhciA9IE1hdGgubWF4KGNsZWFyLCB0aGlzLmNsZWFyKTtcbiAgICBjb25zdCB0b3BpYyA9IHRoaXM7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShkZWxzZXEpKSB7XG4gICAgICBkZWxzZXEubWFwKGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIGlmICghcmFuZ2UuaGkpIHtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgIHRvcGljLmZsdXNoTWVzc2FnZShyYW5nZS5sb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAobGV0IGkgPSByYW5nZS5sb3c7IGkgPCByYW5nZS5oaTsgaSsrKSB7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgdG9waWMuZmx1c2hNZXNzYWdlKGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgdGhpcy5fdXBkYXRlRGVsZXRlZFJhbmdlcygpO1xuXG4gICAgICBpZiAodGhpcy5vbkRhdGEpIHtcbiAgICAgICAgdGhpcy5vbkRhdGEoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gVG9waWMgaXMgaW5mb3JtZWQgdGhhdCB0aGUgZW50aXJlIHJlc3BvbnNlIHRvIHtnZXQgd2hhdD1kYXRhfSBoYXMgYmVlbiByZWNlaXZlZC5cbiAgX2FsbE1lc3NhZ2VzUmVjZWl2ZWQ6IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgdGhpcy5fdXBkYXRlRGVsZXRlZFJhbmdlcygpO1xuXG4gICAgaWYgKHRoaXMub25BbGxNZXNzYWdlc1JlY2VpdmVkKSB7XG4gICAgICB0aGlzLm9uQWxsTWVzc2FnZXNSZWNlaXZlZChjb3VudCk7XG4gICAgfVxuICB9LFxuXG4gIC8vIFJlc2V0IHN1YnNjcmliZWQgc3RhdGVcbiAgX3Jlc2V0U3ViOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9zdWJzY3JpYmVkID0gZmFsc2U7XG4gIH0sXG5cbiAgLy8gVGhpcyB0b3BpYyBpcyBlaXRoZXIgZGVsZXRlZCBvciB1bnN1YnNjcmliZWQgZnJvbS5cbiAgX2dvbmU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX21lc3NhZ2VzLnJlc2V0KCk7XG4gICAgdGhpcy5fdGlub2RlLl9kYi5yZW1NZXNzYWdlcyh0aGlzLm5hbWUpO1xuICAgIHRoaXMuX3VzZXJzID0ge307XG4gICAgdGhpcy5hY3MgPSBuZXcgQWNjZXNzTW9kZShudWxsKTtcbiAgICB0aGlzLnByaXZhdGUgPSBudWxsO1xuICAgIHRoaXMucHVibGljID0gbnVsbDtcbiAgICB0aGlzLl9tYXhTZXEgPSAwO1xuICAgIHRoaXMuX21pblNlcSA9IDA7XG4gICAgdGhpcy5fc3Vic2NyaWJlZCA9IGZhbHNlO1xuXG4gICAgY29uc3QgbWUgPSB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpO1xuICAgIGlmIChtZSkge1xuICAgICAgbWUuX3JvdXRlUHJlcyh7XG4gICAgICAgIF9ub0ZvcndhcmRpbmc6IHRydWUsXG4gICAgICAgIHdoYXQ6ICdnb25lJyxcbiAgICAgICAgdG9waWM6IFRPUElDX01FLFxuICAgICAgICBzcmM6IHRoaXMubmFtZVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9uRGVsZXRlVG9waWMpIHtcbiAgICAgIHRoaXMub25EZWxldGVUb3BpYygpO1xuICAgIH1cbiAgfSxcblxuICAvLyBVcGRhdGUgZ2xvYmFsIHVzZXIgY2FjaGUgYW5kIGxvY2FsIHN1YnNjcmliZXJzIGNhY2hlLlxuICAvLyBEb24ndCBjYWxsIHRoaXMgbWV0aG9kIGZvciBub24tc3Vic2NyaWJlcnMuXG4gIF91cGRhdGVDYWNoZWRVc2VyOiBmdW5jdGlvbih1aWQsIG9iaikge1xuICAgIC8vIEZldGNoIHVzZXIgb2JqZWN0IGZyb20gdGhlIGdsb2JhbCBjYWNoZS5cbiAgICAvLyBUaGlzIGlzIGEgY2xvbmUgb2YgdGhlIHN0b3JlZCBvYmplY3RcbiAgICBsZXQgY2FjaGVkID0gdGhpcy5fY2FjaGVHZXRVc2VyKHVpZCk7XG4gICAgY2FjaGVkID0gbWVyZ2VPYmooY2FjaGVkIHx8IHt9LCBvYmopO1xuICAgIC8vIFNhdmUgdG8gZ2xvYmFsIGNhY2hlXG4gICAgdGhpcy5fY2FjaGVQdXRVc2VyKHVpZCwgY2FjaGVkKTtcbiAgICAvLyBTYXZlIHRvIHRoZSBsaXN0IG9mIHRvcGljIHN1YnNyaWJlcnMuXG4gICAgcmV0dXJuIG1lcmdlVG9DYWNoZSh0aGlzLl91c2VycywgdWlkLCBjYWNoZWQpO1xuICB9LFxuXG4gIC8vIEdldCBsb2NhbCBzZXFJZCBmb3IgYSBxdWV1ZWQgbWVzc2FnZS5cbiAgX2dldFF1ZXVlZFNlcUlkOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fcXVldWVkU2VxSWQrKztcbiAgfSxcblxuICAvLyBDYWxjdWxhdGUgcmFuZ2VzIG9mIG1pc3NpbmcgbWVzc2FnZXMuXG4gIF91cGRhdGVEZWxldGVkUmFuZ2VzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCByYW5nZXMgPSBbXTtcblxuICAgIGxldCBwcmV2ID0gbnVsbDtcbiAgICAvLyBDaGVjayBmb3IgZ2FwIGluIHRoZSBiZWdpbm5pbmcsIGJlZm9yZSB0aGUgZmlyc3QgbWVzc2FnZS5cbiAgICBjb25zdCBmaXJzdCA9IHRoaXMuX21lc3NhZ2VzLmdldEF0KDApO1xuICAgIGlmIChmaXJzdCAmJiB0aGlzLl9taW5TZXEgPiAxICYmICF0aGlzLl9ub0VhcmxpZXJNc2dzKSB7XG4gICAgICAvLyBTb21lIG1lc3NhZ2VzIGFyZSBtaXNzaW5nIGluIHRoZSBiZWdpbm5pbmcuXG4gICAgICBpZiAoZmlyc3QuaGkpIHtcbiAgICAgICAgLy8gVGhlIGZpcnN0IG1lc3NhZ2UgYWxyZWFkeSByZXByZXNlbnRzIGEgZ2FwLlxuICAgICAgICBpZiAoZmlyc3Quc2VxID4gMSkge1xuICAgICAgICAgIGZpcnN0LnNlcSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpcnN0LmhpIDwgdGhpcy5fbWluU2VxIC0gMSkge1xuICAgICAgICAgIGZpcnN0LmhpID0gdGhpcy5fbWluU2VxIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBwcmV2ID0gZmlyc3Q7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDcmVhdGUgbmV3IGdhcC5cbiAgICAgICAgcHJldiA9IHtcbiAgICAgICAgICBzZXE6IDEsXG4gICAgICAgICAgaGk6IHRoaXMuX21pblNlcSAtIDFcbiAgICAgICAgfTtcbiAgICAgICAgcmFuZ2VzLnB1c2gocHJldik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5vIGdhcCBpbiB0aGUgYmVnaW5uaW5nLlxuICAgICAgcHJldiA9IHtcbiAgICAgICAgc2VxOiAwLFxuICAgICAgICBoaTogMFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIGdhcHMgaW4gdGhlIGxpc3Qgb2YgcmVjZWl2ZWQgbWVzc2FnZXMuIFRoZSBsaXN0IGNvbnRhaW5zIG1lc3NhZ2VzLXByb3BlciBhcyB3ZWxsXG4gICAgLy8gYXMgcGxhY2Vob2xlcnMgZm9yIGRlbGV0ZWQgcmFuZ2VzLlxuICAgIC8vIFRoZSBtZXNzYWdlcyBhcmUgaXRlcmF0ZWQgYnkgc2VxIElEIGluIGFzY2VuZGluZyBvcmRlci5cbiAgICB0aGlzLl9tZXNzYWdlcy5mb3JFYWNoKChkYXRhKSA9PiB7XG4gICAgICAvLyBEbyBub3QgY3JlYXRlIGEgZ2FwIGJldHdlZW4gdGhlIGxhc3Qgc2VudCBtZXNzYWdlIGFuZCB0aGUgZmlyc3QgdW5zZW50LlxuICAgICAgaWYgKGRhdGEuc2VxID49IExPQ0FMX1NFUUlEKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gTmV3IG1lc3NhZ2UgaXMgcmVkdWNpbmcgdGhlIGV4aXN0aW5nIGdhcFxuICAgICAgaWYgKGRhdGEuc2VxID09IChwcmV2LmhpIHx8IHByZXYuc2VxKSArIDEpIHtcbiAgICAgICAgLy8gTm8gbmV3IGdhcC4gUmVwbGFjZSBwcmV2aW91cyB3aXRoIGN1cnJlbnQuXG4gICAgICAgIHByZXYgPSBkYXRhO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEZvdW5kIGEgbmV3IGdhcC5cbiAgICAgIGlmIChwcmV2LmhpKSB7XG4gICAgICAgIC8vIFByZXZpb3VzIGlzIGFsc28gYSBnYXAsIGFsdGVyIGl0LlxuICAgICAgICBwcmV2LmhpID0gZGF0YS5oaSB8fCBkYXRhLnNlcTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBQcmV2aW91cyBpcyBub3QgYSBnYXAuIENyZWF0ZSBhIG5ldyBnYXAuXG4gICAgICBwcmV2ID0ge1xuICAgICAgICBzZXE6IChwcmV2LmhpIHx8IHByZXYuc2VxKSArIDEsXG4gICAgICAgIGhpOiBkYXRhLmhpIHx8IGRhdGEuc2VxXG4gICAgICB9O1xuICAgICAgcmFuZ2VzLnB1c2gocHJldik7XG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBmb3IgbWlzc2luZyBtZXNzYWdlcyBhdCB0aGUgZW5kLlxuICAgIC8vIEFsbCBtZXNzYWdlcyBjb3VsZCBiZSBtaXNzaW5nIG9yIGl0IGNvdWxkIGJlIGEgbmV3IHRvcGljIHdpdGggbm8gbWVzc2FnZXMuXG4gICAgY29uc3QgbGFzdCA9IHRoaXMuX21lc3NhZ2VzLmdldExhc3QoKTtcbiAgICBjb25zdCBtYXhTZXEgPSBNYXRoLm1heCh0aGlzLnNlcSwgdGhpcy5fbWF4U2VxKSB8fCAwO1xuICAgIGlmICgobWF4U2VxID4gMCAmJiAhbGFzdCkgfHwgKGxhc3QgJiYgKChsYXN0LmhpIHx8IGxhc3Quc2VxKSA8IG1heFNlcSkpKSB7XG4gICAgICBpZiAobGFzdCAmJiBsYXN0LmhpKSB7XG4gICAgICAgIC8vIEV4dGVuZCBleGlzdGluZyBnYXBcbiAgICAgICAgbGFzdC5oaSA9IG1heFNlcTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENyZWF0ZSBuZXcgZ2FwLlxuICAgICAgICByYW5nZXMucHVzaCh7XG4gICAgICAgICAgc2VxOiBsYXN0ID8gbGFzdC5zZXEgKyAxIDogMSxcbiAgICAgICAgICBoaTogbWF4U2VxXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEluc2VydCBuZXcgZ2FwcyBpbnRvIGNhY2hlLlxuICAgIHJhbmdlcy5tYXAoKGdhcCkgPT4ge1xuICAgICAgdGhpcy5fbWVzc2FnZXMucHV0KGdhcCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gTG9hZCBtb3N0IHJlY2VudCBtZXNzYWdlcyBmcm9tIHBlcnNpc3RlbnQgY2FjaGUuXG4gIF9sb2FkTWVzc2FnZXM6IGZ1bmN0aW9uKGRiKSB7XG4gICAgcmV0dXJuIGRiLnJlYWRNZXNzYWdlcyh0aGlzLm5hbWUsIHtcbiAgICAgICAgbGltaXQ6IERFRkFVTFRfTUVTU0FHRVNfUEFHRVxuICAgICAgfSlcbiAgICAgIC50aGVuKChtc2dzKSA9PiB7XG4gICAgICAgIG1zZ3MuZm9yRWFjaCgoZGF0YSkgPT4ge1xuICAgICAgICAgIGlmIChkYXRhLnNlcSA+IHRoaXMuX21heFNlcSkge1xuICAgICAgICAgICAgdGhpcy5fbWF4U2VxID0gZGF0YS5zZXE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChkYXRhLnNlcSA8IHRoaXMuX21pblNlcSB8fCB0aGlzLl9taW5TZXEgPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fbWluU2VxID0gZGF0YS5zZXE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX21lc3NhZ2VzLnB1dChkYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlRGVsZXRlZFJhbmdlcygpO1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICAgICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogQGNsYXNzIFRvcGljTWUgLSBzcGVjaWFsIGNhc2Ugb2Yge0BsaW5rIFRpbm9kZS5Ub3BpY30gZm9yXG4gKiBtYW5hZ2luZyBkYXRhIG9mIHRoZSBjdXJyZW50IHVzZXIsIGluY2x1ZGluZyBjb250YWN0IGxpc3QuXG4gKiBAZXh0ZW5kcyBUaW5vZGUuVG9waWNcbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqXG4gKiBAcGFyYW0ge1RvcGljTWUuQ2FsbGJhY2tzfSBjYWxsYmFja3MgLSBDYWxsYmFja3MgdG8gcmVjZWl2ZSB2YXJpb3VzIGV2ZW50cy5cbiAqL1xudmFyIFRvcGljTWUgPSBmdW5jdGlvbihjYWxsYmFja3MpIHtcbiAgVG9waWMuY2FsbCh0aGlzLCBUT1BJQ19NRSwgY2FsbGJhY2tzKTtcblxuICAvLyBtZS1zcGVjaWZpYyBjYWxsYmFja3NcbiAgaWYgKGNhbGxiYWNrcykge1xuICAgIHRoaXMub25Db250YWN0VXBkYXRlID0gY2FsbGJhY2tzLm9uQ29udGFjdFVwZGF0ZTtcbiAgfVxufTtcblxuLy8gSW5oZXJpdCBldmVyeXRpbmcgZnJvbSB0aGUgZ2VuZXJpYyBUb3BpY1xuVG9waWNNZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFRvcGljLnByb3RvdHlwZSwge1xuICAvLyBPdmVycmlkZSB0aGUgb3JpZ2luYWwgVG9waWMuX3Byb2Nlc3NNZXRhRGVzYy5cbiAgX3Byb2Nlc3NNZXRhRGVzYzoge1xuICAgIHZhbHVlOiBmdW5jdGlvbihkZXNjKSB7XG4gICAgICAvLyBDaGVjayBpZiBvbmxpbmUgY29udGFjdHMgbmVlZCB0byBiZSB0dXJuZWQgb2ZmIGJlY2F1c2UgUCBwZXJtaXNzaW9uIHdhcyByZW1vdmVkLlxuICAgICAgY29uc3QgdHVybk9mZiA9IChkZXNjLmFjcyAmJiAhZGVzYy5hY3MuaXNQcmVzZW5jZXIoKSkgJiYgKHRoaXMuYWNzICYmIHRoaXMuYWNzLmlzUHJlc2VuY2VyKCkpO1xuXG4gICAgICAvLyBDb3B5IHBhcmFtZXRlcnMgZnJvbSBkZXNjIG9iamVjdCB0byB0aGlzIHRvcGljLlxuICAgICAgbWVyZ2VPYmoodGhpcywgZGVzYyk7XG4gICAgICB0aGlzLl90aW5vZGUuX2RiLnVwZFRvcGljKHRoaXMpO1xuXG4gICAgICAvLyBTdHJpbmcgZGF0ZXRpbWUgaGVhZGVycyB0byBEYXRlKCkgb2JqZWN0cy5cbiAgICAgIHN0cmluZ1RvRGF0ZSh0aGlzKTtcblxuICAgICAgLy8gJ1AnIHBlcm1pc3Npb24gd2FzIHJlbW92ZWQuIEFsbCB0b3BpY3MgYXJlIG9mZmxpbmUgbm93LlxuICAgICAgaWYgKHR1cm5PZmYpIHtcbiAgICAgICAgdGhpcy5fdGlub2RlLmNhY2hlTWFwKCd0b3BpYycsIChjb250KSA9PiB7XG4gICAgICAgICAgaWYgKGNvbnQub25saW5lKSB7XG4gICAgICAgICAgICBjb250Lm9ubGluZSA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGNvbnQuc2Vlbikge1xuICAgICAgICAgICAgICBjb250LnNlZW4ud2hlbiA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb250LnNlZW4gPSB7XG4gICAgICAgICAgICAgICAgd2hlbjogbmV3IERhdGUoKVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaENvbnRhY3QoJ29mZicsIGNvbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9uTWV0YURlc2MpIHtcbiAgICAgICAgdGhpcy5vbk1ldGFEZXNjKHRoaXMpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSxcblxuICAvLyBPdmVycmlkZSB0aGUgb3JpZ2luYWwgVG9waWMuX3Byb2Nlc3NNZXRhU3ViXG4gIF9wcm9jZXNzTWV0YVN1Yjoge1xuICAgIHZhbHVlOiBmdW5jdGlvbihzdWJzKSB7XG4gICAgICBsZXQgdXBkYXRlQ291bnQgPSAwO1xuICAgICAgc3Vicy5mb3JFYWNoKChzdWIpID0+IHtcbiAgICAgICAgY29uc3QgdG9waWNOYW1lID0gc3ViLnRvcGljO1xuICAgICAgICAvLyBEb24ndCBzaG93ICdtZScgYW5kICdmbmQnIHRvcGljcyBpbiB0aGUgbGlzdCBvZiBjb250YWN0cy5cbiAgICAgICAgaWYgKHRvcGljTmFtZSA9PSBUT1BJQ19GTkQgfHwgdG9waWNOYW1lID09IFRPUElDX01FKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN1Yi51cGRhdGVkID0gbmV3IERhdGUoc3ViLnVwZGF0ZWQpO1xuICAgICAgICBzdWIudG91Y2hlZCA9IHN1Yi50b3VjaGVkID8gbmV3IERhdGUoc3ViLnRvdWNoZWQpIDogdW5kZWZpbmVkO1xuICAgICAgICBzdWIuZGVsZXRlZCA9IHN1Yi5kZWxldGVkID8gbmV3IERhdGUoc3ViLmRlbGV0ZWQpIDogbnVsbDtcblxuICAgICAgICBsZXQgY29udCA9IG51bGw7XG4gICAgICAgIGlmIChzdWIuZGVsZXRlZCkge1xuICAgICAgICAgIGNvbnQgPSBzdWI7XG4gICAgICAgICAgdGhpcy5fdGlub2RlLmNhY2hlRGVsKCd0b3BpYycsIHRvcGljTmFtZSk7XG4gICAgICAgICAgdGhpcy5fdGlub2RlLl9kYi5yZW1Ub3BpYyh0b3BpY05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEVuc3VyZSB0aGUgdmFsdWVzIGFyZSBkZWZpbmVkIGFuZCBhcmUgaW50ZWdlcnMuXG4gICAgICAgICAgaWYgKHR5cGVvZiBzdWIuc2VxICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBzdWIuc2VxID0gc3ViLnNlcSB8IDA7XG4gICAgICAgICAgICBzdWIucmVjdiA9IHN1Yi5yZWN2IHwgMDtcbiAgICAgICAgICAgIHN1Yi5yZWFkID0gc3ViLnJlYWQgfCAwO1xuICAgICAgICAgICAgc3ViLnVucmVhZCA9IHN1Yi5zZXEgLSBzdWIucmVhZDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc3ViLnNlZW4gJiYgc3ViLnNlZW4ud2hlbikge1xuICAgICAgICAgICAgc3ViLnNlZW4ud2hlbiA9IG5ldyBEYXRlKHN1Yi5zZWVuLndoZW4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnQgPSBtZXJnZU9iaih0aGlzLl90aW5vZGUuZ2V0VG9waWModG9waWNOYW1lKSwgc3ViKTtcbiAgICAgICAgICB0aGlzLl90aW5vZGUuX2RiLnVwZFRvcGljKGNvbnQpO1xuXG4gICAgICAgICAgaWYgKFRpbm9kZS5pc1AyUFRvcGljTmFtZSh0b3BpY05hbWUpKSB7XG4gICAgICAgICAgICB0aGlzLl9jYWNoZVB1dFVzZXIodG9waWNOYW1lLCBjb250KTtcbiAgICAgICAgICAgIHRoaXMuX3Rpbm9kZS5fZGIudXBkVXNlcih0b3BpY05hbWUsIGNvbnQucHVibGljKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gTm90aWZ5IHRvcGljIG9mIHRoZSB1cGRhdGUgaWYgaXQncyBhbiBleHRlcm5hbCB1cGRhdGUuXG4gICAgICAgICAgaWYgKCFzdWIuX25vRm9yd2FyZGluZykge1xuICAgICAgICAgICAgY29uc3QgdG9waWMgPSB0aGlzLl90aW5vZGUuZ2V0VG9waWModG9waWNOYW1lKTtcbiAgICAgICAgICAgIGlmICh0b3BpYykge1xuICAgICAgICAgICAgICBzdWIuX25vRm9yd2FyZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgIHRvcGljLl9wcm9jZXNzTWV0YURlc2Moc3ViKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVDb3VudCsrO1xuXG4gICAgICAgIGlmICh0aGlzLm9uTWV0YVN1Yikge1xuICAgICAgICAgIHRoaXMub25NZXRhU3ViKGNvbnQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMub25TdWJzVXBkYXRlZCAmJiB1cGRhdGVDb3VudCA+IDApIHtcbiAgICAgICAgY29uc3Qga2V5cyA9IFtdO1xuICAgICAgICBzdWJzLmZvckVhY2goKHMpID0+IHtcbiAgICAgICAgICBrZXlzLnB1c2gocy50b3BpYyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm9uU3Vic1VwZGF0ZWQoa2V5cywgdXBkYXRlQ291bnQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSxcblxuICAvLyBDYWxsZWQgYnkgVGlub2RlIHdoZW4gbWV0YS5zdWIgaXMgcmVjaXZlZC5cbiAgX3Byb2Nlc3NNZXRhQ3JlZHM6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24oY3JlZHMsIHVwZCkge1xuICAgICAgaWYgKGNyZWRzLmxlbmd0aCA9PSAxICYmIGNyZWRzWzBdID09IFRpbm9kZS5ERUxfQ0hBUikge1xuICAgICAgICBjcmVkcyA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKHVwZCkge1xuICAgICAgICBjcmVkcy5tYXAoKGNyKSA9PiB7XG4gICAgICAgICAgaWYgKGNyLnZhbCkge1xuICAgICAgICAgICAgLy8gQWRkaW5nIGEgY3JlZGVudGlhbC5cbiAgICAgICAgICAgIGxldCBpZHggPSB0aGlzLl9jcmVkZW50aWFscy5maW5kSW5kZXgoKGVsKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBlbC5tZXRoID09IGNyLm1ldGggJiYgZWwudmFsID09IGNyLnZhbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGlkeCA8IDApIHtcbiAgICAgICAgICAgICAgLy8gTm90IGZvdW5kLlxuICAgICAgICAgICAgICBpZiAoIWNyLmRvbmUpIHtcbiAgICAgICAgICAgICAgICAvLyBVbmNvbmZpcm1lZCBjcmVkZW50aWFsIHJlcGxhY2VzIHByZXZpb3VzIHVuY29uZmlybWVkIGNyZWRlbnRpYWwgb2YgdGhlIHNhbWUgbWV0aG9kLlxuICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMuX2NyZWRlbnRpYWxzLmZpbmRJbmRleCgoZWwpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBlbC5tZXRoID09IGNyLm1ldGggJiYgIWVsLmRvbmU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgcHJldmlvdXMgdW5jb25maXJtZWQgY3JlZGVudGlhbC5cbiAgICAgICAgICAgICAgICAgIHRoaXMuX2NyZWRlbnRpYWxzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLl9jcmVkZW50aWFscy5wdXNoKGNyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIEZvdW5kLiBNYXliZSBjaGFuZ2UgJ2RvbmUnIHN0YXR1cy5cbiAgICAgICAgICAgICAgdGhpcy5fY3JlZGVudGlhbHNbaWR4XS5kb25lID0gY3IuZG9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGNyLnJlc3ApIHtcbiAgICAgICAgICAgIC8vIEhhbmRsZSBjcmVkZW50aWFsIGNvbmZpcm1hdGlvbi5cbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IHRoaXMuX2NyZWRlbnRpYWxzLmZpbmRJbmRleCgoZWwpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGVsLm1ldGggPT0gY3IubWV0aCAmJiAhZWwuZG9uZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2NyZWRlbnRpYWxzW2lkeF0uZG9uZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2NyZWRlbnRpYWxzID0gY3JlZHM7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vbkNyZWRzVXBkYXRlZCkge1xuICAgICAgICB0aGlzLm9uQ3JlZHNVcGRhdGVkKHRoaXMuX2NyZWRlbnRpYWxzKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0sXG5cbiAgLy8gUHJvY2VzcyBwcmVzZW5jZSBjaGFuZ2UgbWVzc2FnZVxuICBfcm91dGVQcmVzOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKHByZXMpIHtcbiAgICAgIGlmIChwcmVzLndoYXQgPT0gJ3Rlcm0nKSB7XG4gICAgICAgIC8vIFRoZSAnbWUnIHRvcGljIGl0c2VsZiBpcyBkZXRhY2hlZC4gTWFyayBhcyB1bnN1YnNjcmliZWQuXG4gICAgICAgIHRoaXMuX3Jlc2V0U3ViKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHByZXMud2hhdCA9PSAndXBkJyAmJiBwcmVzLnNyYyA9PSBUT1BJQ19NRSkge1xuICAgICAgICAvLyBVcGRhdGUgdG8gbWUncyBkZXNjcmlwdGlvbi4gUmVxdWVzdCB1cGRhdGVkIHZhbHVlLlxuICAgICAgICB0aGlzLmdldE1ldGEodGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhEZXNjKCkuYnVpbGQoKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udCA9IHRoaXMuX3Rpbm9kZS5jYWNoZUdldCgndG9waWMnLCBwcmVzLnNyYyk7XG4gICAgICBpZiAoY29udCkge1xuICAgICAgICBzd2l0Y2ggKHByZXMud2hhdCkge1xuICAgICAgICAgIGNhc2UgJ29uJzogLy8gdG9waWMgY2FtZSBvbmxpbmVcbiAgICAgICAgICAgIGNvbnQub25saW5lID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ29mZic6IC8vIHRvcGljIHdlbnQgb2ZmbGluZVxuICAgICAgICAgICAgaWYgKGNvbnQub25saW5lKSB7XG4gICAgICAgICAgICAgIGNvbnQub25saW5lID0gZmFsc2U7XG4gICAgICAgICAgICAgIGlmIChjb250LnNlZW4pIHtcbiAgICAgICAgICAgICAgICBjb250LnNlZW4ud2hlbiA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udC5zZWVuID0ge1xuICAgICAgICAgICAgICAgICAgd2hlbjogbmV3IERhdGUoKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ21zZyc6IC8vIG5ldyBtZXNzYWdlIHJlY2VpdmVkXG4gICAgICAgICAgICBjb250LnRvdWNoZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgY29udC5zZXEgPSBwcmVzLnNlcSB8IDA7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiBtZXNzYWdlIGlzIHNlbnQgYnkgdGhlIGN1cnJlbnQgdXNlci4gSWYgc28gaXQncyBiZWVuIHJlYWQgYWxyZWFkeS5cbiAgICAgICAgICAgIGlmICghcHJlcy5hY3QgfHwgdGhpcy5fdGlub2RlLmlzTWUocHJlcy5hY3QpKSB7XG4gICAgICAgICAgICAgIGNvbnQucmVhZCA9IGNvbnQucmVhZCA/IE1hdGgubWF4KGNvbnQucmVhZCwgY29udC5zZXEpIDogY29udC5zZXE7XG4gICAgICAgICAgICAgIGNvbnQucmVjdiA9IGNvbnQucmVjdiA/IE1hdGgubWF4KGNvbnQucmVhZCwgY29udC5yZWN2KSA6IGNvbnQucmVhZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnQudW5yZWFkID0gY29udC5zZXEgLSAoY29udC5yZWFkIHwgMCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICd1cGQnOiAvLyBkZXNjIHVwZGF0ZWRcbiAgICAgICAgICAgIC8vIFJlcXVlc3QgdXBkYXRlZCBzdWJzY3JpcHRpb24uXG4gICAgICAgICAgICB0aGlzLmdldE1ldGEodGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhMYXRlck9uZVN1YihwcmVzLnNyYykuYnVpbGQoKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdhY3MnOiAvLyBhY2Nlc3MgbW9kZSBjaGFuZ2VkXG4gICAgICAgICAgICBpZiAoY29udC5hY3MpIHtcbiAgICAgICAgICAgICAgY29udC5hY3MudXBkYXRlQWxsKHByZXMuZGFjcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb250LmFjcyA9IG5ldyBBY2Nlc3NNb2RlKCkudXBkYXRlQWxsKHByZXMuZGFjcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250LnRvdWNoZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAndWEnOlxuICAgICAgICAgICAgLy8gdXNlciBhZ2VudCBjaGFuZ2VkLlxuICAgICAgICAgICAgY29udC5zZWVuID0ge1xuICAgICAgICAgICAgICB3aGVuOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICB1YTogcHJlcy51YVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3JlY3YnOlxuICAgICAgICAgICAgLy8gdXNlcidzIG90aGVyIHNlc3Npb24gbWFya2VkIHNvbWUgbWVzc2dlcyBhcyByZWNlaXZlZC5cbiAgICAgICAgICAgIHByZXMuc2VxID0gcHJlcy5zZXEgfCAwO1xuICAgICAgICAgICAgY29udC5yZWN2ID0gY29udC5yZWN2ID8gTWF0aC5tYXgoY29udC5yZWN2LCBwcmVzLnNlcSkgOiBwcmVzLnNlcTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3JlYWQnOlxuICAgICAgICAgICAgLy8gdXNlcidzIG90aGVyIHNlc3Npb24gbWFya2VkIHNvbWUgbWVzc2FnZXMgYXMgcmVhZC5cbiAgICAgICAgICAgIHByZXMuc2VxID0gcHJlcy5zZXEgfCAwO1xuICAgICAgICAgICAgY29udC5yZWFkID0gY29udC5yZWFkID8gTWF0aC5tYXgoY29udC5yZWFkLCBwcmVzLnNlcSkgOiBwcmVzLnNlcTtcbiAgICAgICAgICAgIGNvbnQucmVjdiA9IGNvbnQucmVjdiA/IE1hdGgubWF4KGNvbnQucmVhZCwgY29udC5yZWN2KSA6IGNvbnQucmVjdjtcbiAgICAgICAgICAgIGNvbnQudW5yZWFkID0gY29udC5zZXEgLSBjb250LnJlYWQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdnb25lJzpcbiAgICAgICAgICAgIC8vIHRvcGljIGRlbGV0ZWQgb3IgdW5zdWJzY3JpYmVkIGZyb20uXG4gICAgICAgICAgICB0aGlzLl90aW5vZGUuY2FjaGVEZWwoJ3RvcGljJywgcHJlcy5zcmMpO1xuICAgICAgICAgICAgdGhpcy5fdGlub2RlLl9kYi5yZW1Ub3BpYyhwcmVzLnNyYyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdkZWwnOlxuICAgICAgICAgICAgLy8gVXBkYXRlIHRvcGljLmRlbCB2YWx1ZS5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aGlzLl90aW5vZGUubG9nZ2VyKFwiSU5GTzogVW5zdXBwb3J0ZWQgcHJlc2VuY2UgdXBkYXRlIGluICdtZSdcIiwgcHJlcy53aGF0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3JlZnJlc2hDb250YWN0KHByZXMud2hhdCwgY29udCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocHJlcy53aGF0ID09ICdhY3MnKSB7XG4gICAgICAgICAgLy8gTmV3IHN1YnNjcmlwdGlvbnMgYW5kIGRlbGV0ZWQvYmFubmVkIHN1YnNjcmlwdGlvbnMgaGF2ZSBmdWxsXG4gICAgICAgICAgLy8gYWNjZXNzIG1vZGUgKG5vICsgb3IgLSBpbiB0aGUgZGFjcyBzdHJpbmcpLiBDaGFuZ2VzIHRvIGtub3duIHN1YnNjcmlwdGlvbnMgYXJlIHNlbnQgYXNcbiAgICAgICAgICAvLyBkZWx0YXMsIGJ1dCB0aGV5IHNob3VsZCBub3QgaGFwcGVuIGhlcmUuXG4gICAgICAgICAgY29uc3QgYWNzID0gbmV3IEFjY2Vzc01vZGUocHJlcy5kYWNzKTtcbiAgICAgICAgICBpZiAoIWFjcyB8fCBhY3MubW9kZSA9PSBBY2Nlc3NNb2RlLl9JTlZBTElEKSB7XG4gICAgICAgICAgICB0aGlzLl90aW5vZGUubG9nZ2VyKFwiRVJST1I6IEludmFsaWQgYWNjZXNzIG1vZGUgdXBkYXRlXCIsIHByZXMuc3JjLCBwcmVzLmRhY3MpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYWNzLm1vZGUgPT0gQWNjZXNzTW9kZS5fTk9ORSkge1xuICAgICAgICAgICAgdGhpcy5fdGlub2RlLmxvZ2dlcihcIldBUk5JTkc6IFJlbW92aW5nIG5vbi1leGlzdGVudCBzdWJzY3JpcHRpb25cIiwgcHJlcy5zcmMsIHByZXMuZGFjcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE5ldyBzdWJzY3JpcHRpb24uIFNlbmQgcmVxdWVzdCBmb3IgdGhlIGZ1bGwgZGVzY3JpcHRpb24uXG4gICAgICAgICAgICAvLyBVc2luZyAud2l0aE9uZVN1YiAobm90IC53aXRoTGF0ZXJPbmVTdWIpIHRvIG1ha2Ugc3VyZSBJZk1vZGlmaWVkU2luY2UgaXMgbm90IHNldC5cbiAgICAgICAgICAgIHRoaXMuZ2V0TWV0YSh0aGlzLnN0YXJ0TWV0YVF1ZXJ5KCkud2l0aE9uZVN1Yih1bmRlZmluZWQsIHByZXMuc3JjKS5idWlsZCgpKTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIGR1bW15IGVudHJ5IHRvIGNhdGNoIG9ubGluZSBzdGF0dXMgdXBkYXRlLlxuICAgICAgICAgICAgY29uc3QgZHVtbXkgPSB0aGlzLl90aW5vZGUuZ2V0VG9waWMocHJlcy5zcmMpO1xuICAgICAgICAgICAgZHVtbXkudG91Y2hlZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBkdW1teS50b3BpYyA9IHByZXMuc3JjO1xuICAgICAgICAgICAgZHVtbXkub25saW5lID0gZmFsc2U7XG4gICAgICAgICAgICBkdW1teS5hY3MgPSBhY3M7XG4gICAgICAgICAgICB0aGlzLl90aW5vZGUuYXR0YWNoQ2FjaGVUb1RvcGljKGR1bW15KTtcbiAgICAgICAgICAgIGR1bW15Ll9jYWNoZVB1dFNlbGYoKTtcbiAgICAgICAgICAgIHRoaXMuX2RiLnVwZFRvcGljKGR1bW15KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocHJlcy53aGF0ID09ICd0YWdzJykge1xuICAgICAgICAgIHRoaXMuZ2V0TWV0YSh0aGlzLnN0YXJ0TWV0YVF1ZXJ5KCkud2l0aFRhZ3MoKS5idWlsZCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5vblByZXMpIHtcbiAgICAgICAgdGhpcy5vblByZXMocHJlcyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8vIENvbnRhY3QgaXMgdXBkYXRlZCwgZXhlY3V0ZSBjYWxsYmFja3MuXG4gIF9yZWZyZXNoQ29udGFjdDoge1xuICAgIHZhbHVlOiBmdW5jdGlvbih3aGF0LCBjb250KSB7XG4gICAgICBpZiAodGhpcy5vbkNvbnRhY3RVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5vbkNvbnRhY3RVcGRhdGUod2hhdCwgY29udCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBQdWJsaXNoaW5nIHRvIFRvcGljTWUgaXMgbm90IHN1cHBvcnRlZC4ge0BsaW5rIFRvcGljI3B1Ymxpc2h9IGlzIG92ZXJyaWRlbiBhbmQgdGhvd3MgYW4ge0Vycm9yfSBpZiBjYWxsZWQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICogQHRocm93cyB7RXJyb3J9IEFsd2F5cyB0aHJvd3MgYW4gZXJyb3IuXG4gICAqL1xuICBwdWJsaXNoOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIlB1Ymxpc2hpbmcgdG8gJ21lJyBpcyBub3Qgc3VwcG9ydGVkXCIpKTtcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSB2YWxpZGF0aW9uIGNyZWRlbnRpYWwuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gZGVsZXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VyIC0gVXNlciBJRCB0byByZW1vdmUuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGRlbENyZWRlbnRpYWw6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24obWV0aG9kLCB2YWx1ZSkge1xuICAgICAgaWYgKCF0aGlzLl9zdWJzY3JpYmVkKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJDYW5ub3QgZGVsZXRlIGNyZWRlbnRpYWwgaW4gaW5hY3RpdmUgJ21lJyB0b3BpY1wiKSk7XG4gICAgICB9XG4gICAgICAvLyBTZW5kIHtkZWx9IG1lc3NhZ2UsIHJldHVybiBwcm9taXNlXG4gICAgICByZXR1cm4gdGhpcy5fdGlub2RlLmRlbENyZWRlbnRpYWwobWV0aG9kLCB2YWx1ZSkudGhlbigoY3RybCkgPT4ge1xuICAgICAgICAvLyBSZW1vdmUgZGVsZXRlZCBjcmVkZW50aWFsIGZyb20gdGhlIGNhY2hlLlxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX2NyZWRlbnRpYWxzLmZpbmRJbmRleCgoZWwpID0+IHtcbiAgICAgICAgICByZXR1cm4gZWwubWV0aCA9PSBtZXRob2QgJiYgZWwudmFsID09IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICB0aGlzLl9jcmVkZW50aWFscy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdGlmeSBsaXN0ZW5lcnNcbiAgICAgICAgaWYgKHRoaXMub25DcmVkc1VwZGF0ZWQpIHtcbiAgICAgICAgICB0aGlzLm9uQ3JlZHNVcGRhdGVkKHRoaXMuX2NyZWRlbnRpYWxzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3RybDtcbiAgICAgIH0pO1xuXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBAY2FsbGJhY2sgY29udGFjdEZpbHRlclxuICAgKiBAcGFyYW0ge09iamVjdH0gY29udGFjdCB0byBjaGVjayBmb3IgaW5jbHVzaW9uLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgY29udGFjdCBzaG91bGQgYmUgcHJvY2Vzc2VkLCA8Y29kZT5mYWxzZTwvY29kZT4gdG8gZXhjbHVkZSBpdC5cbiAgICovXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2FjaGVkIGNvbnRhY3RzLlxuICAgKlxuICAgKiBAZnVuY3Rpb25cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpY01lI1xuICAgKiBAcGFyYW0ge1RvcGljTWUuQ29udGFjdENhbGxiYWNrfSBjYWxsYmFjayAtIENhbGxiYWNrIHRvIGNhbGwgZm9yIGVhY2ggY29udGFjdC5cbiAgICogQHBhcmFtIHtjb250YWN0RmlsdGVyPX0gZmlsdGVyIC0gT3B0aW9uYWxseSBmaWx0ZXIgY29udGFjdHM7IGluY2x1ZGUgYWxsIGlmIGZpbHRlciBpcyBmYWxzZS1pc2gsIG90aGVyd2lzZVxuICAgKiAgICAgIGluY2x1ZGUgdGhvc2UgZm9yIHdoaWNoIGZpbHRlciByZXR1cm5zIHRydWUtaXNoLlxuICAgKiBAcGFyYW0ge09iamVjdD19IGNvbnRleHQgLSBDb250ZXh0IHRvIHVzZSBmb3IgY2FsbGluZyB0aGUgYGNhbGxiYWNrYCwgaS5lLiB0aGUgdmFsdWUgb2YgYHRoaXNgIGluc2lkZSB0aGUgY2FsbGJhY2suXG4gICAqL1xuICBjb250YWN0czoge1xuICAgIHZhbHVlOiBmdW5jdGlvbihjYWxsYmFjaywgZmlsdGVyLCBjb250ZXh0KSB7XG4gICAgICB0aGlzLl90aW5vZGUuY2FjaGVNYXAoJ3RvcGljJywgKGMsIGlkeCkgPT4ge1xuICAgICAgICBpZiAoYy5pc0NvbW1UeXBlKCkgJiYgKCFmaWx0ZXIgfHwgZmlsdGVyKGMpKSkge1xuICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgYywgaWR4KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSBjb250YWN0IGZyb20gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSBjb250YWN0IHRvIGdldCwgZWl0aGVyIGEgVUlEIChmb3IgcDJwIHRvcGljcykgb3IgYSB0b3BpYyBuYW1lLlxuICAgKiBAcmV0dXJucyB7VGlub2RlLkNvbnRhY3R9IC0gQ29udGFjdCBvciBgdW5kZWZpbmVkYC5cbiAgICovXG4gIGdldENvbnRhY3Q6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5jYWNoZUdldCgndG9waWMnLCBuYW1lKTtcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhY2Nlc3MgbW9kZSBvZiBhIGdpdmVuIGNvbnRhY3QgZnJvbSBjYWNoZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpY01lI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIGNvbnRhY3QgdG8gZ2V0IGFjY2VzcyBtb2RlIGZvciwgZWl0aGVyIGEgVUlEIChmb3IgcDJwIHRvcGljcylcbiAgICogICAgICAgIG9yIGEgdG9waWMgbmFtZTsgaWYgbWlzc2luZywgYWNjZXNzIG1vZGUgZm9yIHRoZSAnbWUnIHRvcGljIGl0c2VsZi5cbiAgICogQHJldHVybnMge3N0cmluZ30gLSBhY2Nlc3MgbW9kZSwgc3VjaCBhcyBgUldQYC5cbiAgICovXG4gIGdldEFjY2Vzc01vZGU6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgY29uc3QgY29udCA9IHRoaXMuX3Rpbm9kZS5jYWNoZUdldCgndG9waWMnLCBuYW1lKTtcbiAgICAgICAgcmV0dXJuIGNvbnQgPyBjb250LmFjcyA6IG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5hY3M7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBjb250YWN0IGlzIGFyY2hpdmVkLCBpLmUuIGNvbnRhY3QucHJpdmF0ZS5hcmNoID09IHRydWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSBjb250YWN0IHRvIGNoZWNrIGFyY2hpdmVkIHN0YXR1cywgZWl0aGVyIGEgVUlEIChmb3IgcDJwIHRvcGljcykgb3IgYSB0b3BpYyBuYW1lLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSB0cnVlIGlmIGNvbnRhY3QgaXMgYXJjaGl2ZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGlzQXJjaGl2ZWQ6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgY29uc3QgY29udCA9IHRoaXMuX3Rpbm9kZS5jYWNoZUdldCgndG9waWMnLCBuYW1lKTtcbiAgICAgIHJldHVybiBjb250ID8gKChjb250LnByaXZhdGUgJiYgY29udC5wcml2YXRlLmFyY2gpID8gdHJ1ZSA6IGZhbHNlKSA6IG51bGw7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBUaW5vZGUuQ3JlZGVudGlhbFxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEB0eXBlIE9iamVjdFxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbWV0aCAtIHZhbGlkYXRpb24gbWV0aG9kIHN1Y2ggYXMgJ2VtYWlsJyBvciAndGVsJy5cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IHZhbCAtIGNyZWRlbnRpYWwgdmFsdWUsIGkuZS4gJ2pkb2VAZXhhbXBsZS5jb20nIG9yICcrMTcwMjU1NTEyMzQnXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZG9uZSAtIHRydWUgaWYgY3JlZGVudGlhbCBpcyB2YWxpZGF0ZWQuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSB1c2VyJ3MgY3JlZGVudGlhbHM6IGVtYWlsLCBwaG9uZSwgZXRjLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljTWUjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuQ3JlZGVudGlhbFtdfSAtIGFycmF5IG9mIGNyZWRlbnRpYWxzLlxuICAgKi9cbiAgZ2V0Q3JlZGVudGlhbHM6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY3JlZGVudGlhbHM7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9XG59KTtcblRvcGljTWUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVG9waWNNZTtcblxuLyoqXG4gKiBAY2xhc3MgVG9waWNGbmQgLSBzcGVjaWFsIGNhc2Ugb2Yge0BsaW5rIFRpbm9kZS5Ub3BpY30gZm9yIHNlYXJjaGluZyBmb3JcbiAqIGNvbnRhY3RzIGFuZCBncm91cCB0b3BpY3MuXG4gKiBAZXh0ZW5kcyBUaW5vZGUuVG9waWNcbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqXG4gKiBAcGFyYW0ge1RvcGljRm5kLkNhbGxiYWNrc30gY2FsbGJhY2tzIC0gQ2FsbGJhY2tzIHRvIHJlY2VpdmUgdmFyaW91cyBldmVudHMuXG4gKi9cbnZhciBUb3BpY0ZuZCA9IGZ1bmN0aW9uKGNhbGxiYWNrcykge1xuICBUb3BpYy5jYWxsKHRoaXMsIFRPUElDX0ZORCwgY2FsbGJhY2tzKTtcbiAgLy8gTGlzdCBvZiB1c2VycyBhbmQgdG9waWNzIHVpZCBvciB0b3BpY19uYW1lIC0+IENvbnRhY3Qgb2JqZWN0KVxuICB0aGlzLl9jb250YWN0cyA9IHt9O1xufTtcblxuLy8gSW5oZXJpdCBldmVyeXRpbmcgZnJvbSB0aGUgZ2VuZXJpYyBUb3BpY1xuVG9waWNGbmQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUb3BpYy5wcm90b3R5cGUsIHtcbiAgLy8gT3ZlcnJpZGUgdGhlIG9yaWdpbmFsIFRvcGljLl9wcm9jZXNzTWV0YVN1YlxuICBfcHJvY2Vzc01ldGFTdWI6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24oc3Vicykge1xuICAgICAgbGV0IHVwZGF0ZUNvdW50ID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGhpcy5fY29udGFjdHMpLmxlbmd0aDtcbiAgICAgIC8vIFJlc2V0IGNvbnRhY3QgbGlzdC5cbiAgICAgIHRoaXMuX2NvbnRhY3RzID0ge307XG4gICAgICBmb3IgKGxldCBpZHggaW4gc3Vicykge1xuICAgICAgICBsZXQgc3ViID0gc3Vic1tpZHhdO1xuICAgICAgICBjb25zdCBpbmRleEJ5ID0gc3ViLnRvcGljID8gc3ViLnRvcGljIDogc3ViLnVzZXI7XG5cbiAgICAgICAgc3ViLnVwZGF0ZWQgPSBuZXcgRGF0ZShzdWIudXBkYXRlZCk7XG4gICAgICAgIGlmIChzdWIuc2VlbiAmJiBzdWIuc2Vlbi53aGVuKSB7XG4gICAgICAgICAgc3ViLnNlZW4ud2hlbiA9IG5ldyBEYXRlKHN1Yi5zZWVuLndoZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgc3ViID0gbWVyZ2VUb0NhY2hlKHRoaXMuX2NvbnRhY3RzLCBpbmRleEJ5LCBzdWIpO1xuICAgICAgICB1cGRhdGVDb3VudCsrO1xuXG4gICAgICAgIGlmICh0aGlzLm9uTWV0YVN1Yikge1xuICAgICAgICAgIHRoaXMub25NZXRhU3ViKHN1Yik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHVwZGF0ZUNvdW50ID4gMCAmJiB0aGlzLm9uU3Vic1VwZGF0ZWQpIHtcbiAgICAgICAgdGhpcy5vblN1YnNVcGRhdGVkKE9iamVjdC5rZXlzKHRoaXMuX2NvbnRhY3RzKSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBQdWJsaXNoaW5nIHRvIFRvcGljRm5kIGlzIG5vdCBzdXBwb3J0ZWQuIHtAbGluayBUb3BpYyNwdWJsaXNofSBpcyBvdmVycmlkZW4gYW5kIHRob3dzIGFuIHtFcnJvcn0gaWYgY2FsbGVkLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljRm5kI1xuICAgKiBAdGhyb3dzIHtFcnJvcn0gQWx3YXlzIHRocm93cyBhbiBlcnJvci5cbiAgICovXG4gIHB1Ymxpc2g6IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiUHVibGlzaGluZyB0byAnZm5kJyBpcyBub3Qgc3VwcG9ydGVkXCIpKTtcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0sXG5cbiAgLyoqXG4gICAqIHNldE1ldGEgdG8gVG9waWNGbmQgcmVzZXRzIGNvbnRhY3QgbGlzdCBpbiBhZGRpdGlvbiB0byBzZW5kaW5nIHRoZSBtZXNzYWdlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljRm5kI1xuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXRQYXJhbXN9IHBhcmFtcyBwYXJhbWV0ZXJzIHRvIHVwZGF0ZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBzZXRNZXRhOiB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZihUb3BpY0ZuZC5wcm90b3R5cGUpLnNldE1ldGEuY2FsbCh0aGlzLCBwYXJhbXMpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhpbnN0YW5jZS5fY29udGFjdHMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBpbnN0YW5jZS5fY29udGFjdHMgPSB7fTtcbiAgICAgICAgICBpZiAoaW5zdGFuY2Uub25TdWJzVXBkYXRlZCkge1xuICAgICAgICAgICAgaW5zdGFuY2Uub25TdWJzVXBkYXRlZChbXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0sXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBmb3VuZCBjb250YWN0cy4gSWYgY2FsbGJhY2sgaXMgdW5kZWZpbmVkLCB1c2Uge0BsaW5rIHRoaXMub25NZXRhU3VifS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNGbmQjXG4gICAqIEBwYXJhbSB7VG9waWNGbmQuQ29udGFjdENhbGxiYWNrfSBjYWxsYmFjayAtIENhbGxiYWNrIHRvIGNhbGwgZm9yIGVhY2ggY29udGFjdC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBDb250ZXh0IHRvIHVzZSBmb3IgY2FsbGluZyB0aGUgYGNhbGxiYWNrYCwgaS5lLiB0aGUgdmFsdWUgb2YgYHRoaXNgIGluc2lkZSB0aGUgY2FsbGJhY2suXG4gICAqL1xuICBjb250YWN0czoge1xuICAgIHZhbHVlOiBmdW5jdGlvbihjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgY29uc3QgY2IgPSAoY2FsbGJhY2sgfHwgdGhpcy5vbk1ldGFTdWIpO1xuICAgICAgaWYgKGNiKSB7XG4gICAgICAgIGZvciAobGV0IGlkeCBpbiB0aGlzLl9jb250YWN0cykge1xuICAgICAgICAgIGNiLmNhbGwoY29udGV4dCwgdGhpcy5fY29udGFjdHNbaWR4XSwgaWR4LCB0aGlzLl9jb250YWN0cyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH1cbn0pO1xuVG9waWNGbmQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVG9waWNGbmQ7XG5cbi8qKlxuICogQGNsYXNzIExhcmdlRmlsZUhlbHBlciAtIGNvbGxlY3Rpb24gb2YgdXRpbGl0aWVzIGZvciB1cGxvYWRpbmcgYW5kIGRvd25sb2FkaW5nIGZpbGVzXG4gKiBvdXQgb2YgYmFuZC4gRG9uJ3QgaW5zdGFudGlhdGUgdGhpcyBjbGFzcyBkaXJlY3RseS4gVXNlIHtUaW5vZGUuZ2V0TGFyZ2VGaWxlSGVscGVyfSBpbnN0ZWFkLlxuICogQG1lbWJlcm9mIFRpbm9kZVxuICpcbiAqIEBwYXJhbSB7VGlub2RlfSB0aW5vZGUgLSB0aGUgbWFpbiBUaW5vZGUgb2JqZWN0LlxuICovXG52YXIgTGFyZ2VGaWxlSGVscGVyID0gZnVuY3Rpb24odGlub2RlKSB7XG4gIHRoaXMuX3Rpbm9kZSA9IHRpbm9kZTtcblxuICB0aGlzLl9hcGlLZXkgPSB0aW5vZGUuX2FwaUtleTtcbiAgdGhpcy5fYXV0aFRva2VuID0gdGlub2RlLmdldEF1dGhUb2tlbigpO1xuICB0aGlzLl9tc2dJZCA9IHRpbm9kZS5nZXROZXh0VW5pcXVlSWQoKTtcbiAgdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAvLyBQcm9taXNlXG4gIHRoaXMudG9SZXNvbHZlID0gbnVsbDtcbiAgdGhpcy50b1JlamVjdCA9IG51bGw7XG5cbiAgLy8gQ2FsbGJhY2tzXG4gIHRoaXMub25Qcm9ncmVzcyA9IG51bGw7XG4gIHRoaXMub25TdWNjZXNzID0gbnVsbDtcbiAgdGhpcy5vbkZhaWx1cmUgPSBudWxsO1xufVxuXG5MYXJnZUZpbGVIZWxwZXIucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogU3RhcnQgdXBsb2FkaW5nIHRoZSBmaWxlIHRvIGEgbm9uLWRlZmF1bHQgZW5kcG9pbnQuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTGFyZ2VGaWxlSGVscGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gYmFzZVVybCBhbHRlcm5hdGl2ZSBiYXNlIFVSTCBvZiB1cGxvYWQgc2VydmVyLlxuICAgKiBAcGFyYW0ge0ZpbGV8QmxvYn0gZGF0YSB0byB1cGxvYWRcbiAgICogQHBhcmFtIHtDYWxsYmFja30gb25Qcm9ncmVzcyBjYWxsYmFjay4gVGFrZXMgb25lIHtmbG9hdH0gcGFyYW1ldGVyIDAuLjFcbiAgICogQHBhcmFtIHtDYWxsYmFja30gb25TdWNjZXNzIGNhbGxiYWNrLiBDYWxsZWQgd2hlbiB0aGUgZmlsZSBpcyBzdWNjZXNzZnVsbHkgdXBsb2FkZWQuXG4gICAqIEBwYXJhbSB7Q2FsbGJhY2t9IG9uRmFpbHVyZSBjYWxsYmFjay4gQ2FsbGVkIGluIGNhc2Ugb2YgYSBmYWlsdXJlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgdXBsb2FkIGlzIGNvbXBsZXRlZC9mYWlsZWQuXG4gICAqL1xuICB1cGxvYWRXaXRoQmFzZVVybDogZnVuY3Rpb24oYmFzZVVybCwgZGF0YSwgb25Qcm9ncmVzcywgb25TdWNjZXNzLCBvbkZhaWx1cmUpIHtcbiAgICBpZiAoIXRoaXMuX2F1dGhUb2tlbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBhdXRoZW50aWNhdGUgZmlyc3RcIik7XG4gICAgfVxuICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcztcblxuICAgIGxldCB1cmwgPSAnL3YnICsgUFJPVE9DT0xfVkVSU0lPTiArICcvZmlsZS91Lyc7XG4gICAgaWYgKGJhc2VVcmwpIHtcbiAgICAgIGlmIChiYXNlVXJsLmluZGV4T2YoJ2h0dHA6Ly8nKSA9PSAwIHx8IGJhc2VVcmwuaW5kZXhPZignaHR0cHM6Ly8nKSA9PSAwKSB7XG4gICAgICAgIHVybCA9IGJhc2VVcmwgKyB1cmw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYmFzZSBVUkwgJyR7YmFzZVVybH0nYCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMueGhyLm9wZW4oJ1BPU1QnLCB1cmwsIHRydWUpO1xuICAgIHRoaXMueGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtVGlub2RlLUFQSUtleScsIHRoaXMuX2FwaUtleSk7XG4gICAgdGhpcy54aHIuc2V0UmVxdWVzdEhlYWRlcignWC1UaW5vZGUtQXV0aCcsICdUb2tlbiAnICsgdGhpcy5fYXV0aFRva2VuLnRva2VuKTtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLnRvUmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLnRvUmVqZWN0ID0gcmVqZWN0O1xuICAgIH0pO1xuXG4gICAgdGhpcy5vblByb2dyZXNzID0gb25Qcm9ncmVzcztcbiAgICB0aGlzLm9uU3VjY2VzcyA9IG9uU3VjY2VzcztcbiAgICB0aGlzLm9uRmFpbHVyZSA9IG9uRmFpbHVyZTtcblxuICAgIHRoaXMueGhyLnVwbG9hZC5vbnByb2dyZXNzID0gKGUpID0+IHtcbiAgICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUgJiYgaW5zdGFuY2Uub25Qcm9ncmVzcykge1xuICAgICAgICBpbnN0YW5jZS5vblByb2dyZXNzKGUubG9hZGVkIC8gZS50b3RhbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy54aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgcGt0O1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGt0ID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlLCBqc29uUGFyc2VIZWxwZXIpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGluc3RhbmNlLl90aW5vZGUubG9nZ2VyKFwiRVJST1I6IEludmFsaWQgc2VydmVyIHJlc3BvbnNlIGluIExhcmdlRmlsZUhlbHBlclwiLCB0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgcGt0ID0ge1xuICAgICAgICAgIGN0cmw6IHtcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuc3RhdHVzLFxuICAgICAgICAgICAgdGV4dDogdGhpcy5zdGF0dXNUZXh0XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS50b1Jlc29sdmUpIHtcbiAgICAgICAgICBpbnN0YW5jZS50b1Jlc29sdmUocGt0LmN0cmwucGFyYW1zLnVybCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluc3RhbmNlLm9uU3VjY2Vzcykge1xuICAgICAgICAgIGluc3RhbmNlLm9uU3VjY2Vzcyhwa3QuY3RybCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS50b1JlamVjdCkge1xuICAgICAgICAgIGluc3RhbmNlLnRvUmVqZWN0KG5ldyBFcnJvcihgJHtwa3QuY3RybC50ZXh0fSAoJHtwa3QuY3RybC5jb2RlfSlgKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluc3RhbmNlLm9uRmFpbHVyZSkge1xuICAgICAgICAgIGluc3RhbmNlLm9uRmFpbHVyZShwa3QuY3RybClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zdGFuY2UuX3Rpbm9kZS5sb2dnZXIoXCJFUlJPUjogVW5leHBlY3RlZCBzZXJ2ZXIgcmVzcG9uc2Ugc3RhdHVzXCIsIHRoaXMuc3RhdHVzLCB0aGlzLnJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy54aHIub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChpbnN0YW5jZS50b1JlamVjdCkge1xuICAgICAgICBpbnN0YW5jZS50b1JlamVjdChuZXcgRXJyb3IoXCJmYWlsZWRcIikpO1xuICAgICAgfVxuICAgICAgaWYgKGluc3RhbmNlLm9uRmFpbHVyZSkge1xuICAgICAgICBpbnN0YW5jZS5vbkZhaWx1cmUobnVsbCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMueGhyLm9uYWJvcnQgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoaW5zdGFuY2UudG9SZWplY3QpIHtcbiAgICAgICAgaW5zdGFuY2UudG9SZWplY3QobmV3IEVycm9yKFwidXBsb2FkIGNhbmNlbGxlZCBieSB1c2VyXCIpKTtcbiAgICAgIH1cbiAgICAgIGlmIChpbnN0YW5jZS5vbkZhaWx1cmUpIHtcbiAgICAgICAgaW5zdGFuY2Uub25GYWlsdXJlKG51bGwpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgZm9ybS5hcHBlbmQoJ2ZpbGUnLCBkYXRhKTtcbiAgICAgIGZvcm0uc2V0KCdpZCcsIHRoaXMuX21zZ0lkKTtcbiAgICAgIHRoaXMueGhyLnNlbmQoZm9ybSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAodGhpcy50b1JlamVjdCkge1xuICAgICAgICB0aGlzLnRvUmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vbkZhaWx1cmUpIHtcbiAgICAgICAgdGhpcy5vbkZhaWx1cmUobnVsbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICAvKipcbiAgICogU3RhcnQgdXBsb2FkaW5nIHRoZSBmaWxlIHRvIGRlZmF1bHQgZW5kcG9pbnQuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTGFyZ2VGaWxlSGVscGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge0ZpbGV8QmxvYn0gZGF0YSB0byB1cGxvYWRcbiAgICogQHBhcmFtIHtDYWxsYmFja30gb25Qcm9ncmVzcyBjYWxsYmFjay4gVGFrZXMgb25lIHtmbG9hdH0gcGFyYW1ldGVyIDAuLjFcbiAgICogQHBhcmFtIHtDYWxsYmFja30gb25TdWNjZXNzIGNhbGxiYWNrLiBDYWxsZWQgd2hlbiB0aGUgZmlsZSBpcyBzdWNjZXNzZnVsbHkgdXBsb2FkZWQuXG4gICAqIEBwYXJhbSB7Q2FsbGJhY2t9IG9uRmFpbHVyZSBjYWxsYmFjay4gQ2FsbGVkIGluIGNhc2Ugb2YgYSBmYWlsdXJlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgdXBsb2FkIGlzIGNvbXBsZXRlZC9mYWlsZWQuXG4gICAqL1xuICB1cGxvYWQ6IGZ1bmN0aW9uKGRhdGEsIG9uUHJvZ3Jlc3MsIG9uU3VjY2Vzcywgb25GYWlsdXJlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBsb2FkV2l0aEJhc2VVcmwodW5kZWZpbmVkLCBkYXRhLCBvblByb2dyZXNzLCBvblN1Y2Nlc3MsIG9uRmFpbHVyZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERvd25sb2FkIHRoZSBmaWxlIGZyb20gYSBnaXZlbiBVUkwgdXNpbmcgR0VUIHJlcXVlc3QuIFRoaXMgbWV0aG9kIHdvcmtzIHdpdGggdGhlIFRpbm9kZSBzZXJ2ZXIgb25seS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZS5MYXJnZUZpbGVIZWxwZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZWxhdGl2ZVVybCAtIFVSTCB0byBkb3dubG9hZCB0aGUgZmlsZSBmcm9tLiBNdXN0IGJlIHJlbGF0aXZlIHVybCwgaS5lLiBtdXN0IG5vdCBjb250YWluIHRoZSBob3N0LlxuICAgKiBAcGFyYW0ge3N0cmluZz19IGZpbGVuYW1lIC0gZmlsZSBuYW1lIHRvIHVzZSBmb3IgdGhlIGRvd25sb2FkZWQgZmlsZS5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIGRvd25sb2FkIGlzIGNvbXBsZXRlZC9mYWlsZWQuXG4gICAqL1xuICBkb3dubG9hZDogZnVuY3Rpb24ocmVsYXRpdmVVcmwsIGZpbGVuYW1lLCBtaW1ldHlwZSwgb25Qcm9ncmVzcywgb25FcnJvcikge1xuICAgIGlmICghVGlub2RlLmlzUmVsYXRpdmVVUkwocmVsYXRpdmVVcmwpKSB7XG4gICAgICAvLyBBcyBhIHNlY3VyaXR5IG1lYXN1cmUgcmVmdXNlIHRvIGRvd25sb2FkIGZyb20gYW4gYWJzb2x1dGUgVVJMLlxuICAgICAgaWYgKG9uRXJyb3IpIHtcbiAgICAgICAgb25FcnJvcihgVGhlIFVSTCAnJHtyZWxhdGl2ZVVybH0nIG11c3QgYmUgcmVsYXRpdmUsIG5vdCBhYnNvbHV0ZWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2F1dGhUb2tlbikge1xuICAgICAgaWYgKG9uRXJyb3IpIHtcbiAgICAgICAgb25FcnJvcihcIk11c3QgYXV0aGVudGljYXRlIGZpcnN0XCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXM7XG4gICAgLy8gR2V0IGRhdGEgYXMgYmxvYiAoc3RvcmVkIGJ5IHRoZSBicm93c2VyIGFzIGEgdGVtcG9yYXJ5IGZpbGUpLlxuICAgIHRoaXMueGhyLm9wZW4oJ0dFVCcsIHJlbGF0aXZlVXJsLCB0cnVlKTtcbiAgICB0aGlzLnhoci5zZXRSZXF1ZXN0SGVhZGVyKCdYLVRpbm9kZS1BUElLZXknLCB0aGlzLl9hcGlLZXkpO1xuICAgIHRoaXMueGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtVGlub2RlLUF1dGgnLCAnVG9rZW4gJyArIHRoaXMuX2F1dGhUb2tlbi50b2tlbik7XG4gICAgdGhpcy54aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InO1xuXG4gICAgdGhpcy5vblByb2dyZXNzID0gb25Qcm9ncmVzcztcbiAgICB0aGlzLnhoci5vbnByb2dyZXNzID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGluc3RhbmNlLm9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgLy8gUGFzc2luZyBlLmxvYWRlZCBpbnN0ZWFkIG9mIGUubG9hZGVkL2UudG90YWwgYmVjYXVzZSBlLnRvdGFsXG4gICAgICAgIC8vIGlzIGFsd2F5cyAwIHdpdGggZ3ppcCBjb21wcmVzc2lvbiBlbmFibGVkIGJ5IHRoZSBzZXJ2ZXIuXG4gICAgICAgIGluc3RhbmNlLm9uUHJvZ3Jlc3MoZS5sb2FkZWQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCByZXN1bHQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLnRvUmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLnRvUmVqZWN0ID0gcmVqZWN0O1xuICAgIH0pO1xuXG4gICAgLy8gVGhlIGJsb2IgbmVlZHMgdG8gYmUgc2F2ZWQgYXMgZmlsZS4gVGhlcmUgaXMgbm8ga25vd24gd2F5IHRvXG4gICAgLy8gc2F2ZSB0aGUgYmxvYiBhcyBmaWxlIG90aGVyIHRoYW4gdG8gZmFrZSBhIGNsaWNrIG9uIGFuIDxhIGhyZWYuLi4gZG93bmxvYWQ9Li4uPi5cbiAgICB0aGlzLnhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgLy8gVVJMLmNyZWF0ZU9iamVjdFVSTCBpcyBub3QgYXZhaWxhYmxlIGluIG5vbi1icm93c2VyIGVudmlyb25tZW50LiBUaGlzIGNhbGwgd2lsbCBmYWlsLlxuICAgICAgICBsaW5rLmhyZWYgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbdGhpcy5yZXNwb25zZV0sIHtcbiAgICAgICAgICB0eXBlOiBtaW1ldHlwZVxuICAgICAgICB9KSk7XG4gICAgICAgIGxpbmsuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgbGluay5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgZmlsZW5hbWUpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpbmspO1xuICAgICAgICBsaW5rLmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobGluayk7XG4gICAgICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKGxpbmsuaHJlZik7XG4gICAgICAgIGlmIChpbnN0YW5jZS50b1Jlc29sdmUpIHtcbiAgICAgICAgICBpbnN0YW5jZS50b1Jlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXR1cyA+PSA0MDAgJiYgaW5zdGFuY2UudG9SZWplY3QpIHtcbiAgICAgICAgLy8gVGhlIHRoaXMucmVzcG9uc2VUZXh0IGlzIHVuZGVmaW5lZCwgbXVzdCB1c2UgdGhpcy5yZXNwb25zZSB3aGljaCBpcyBhIGJsb2IuXG4gICAgICAgIC8vIE5lZWQgdG8gY29udmVydCB0aGlzLnJlc3BvbnNlIHRvIEpTT04uIFRoZSBibG9iIGNhbiBvbmx5IGJlIGFjY2Vzc2VkIGJ5IHRoZVxuICAgICAgICAvLyBGaWxlUmVhZGVyLlxuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBrdCA9IEpTT04ucGFyc2UodGhpcy5yZXN1bHQsIGpzb25QYXJzZUhlbHBlcik7XG4gICAgICAgICAgICBpbnN0YW5jZS50b1JlamVjdChuZXcgRXJyb3IoYCR7cGt0LmN0cmwudGV4dH0gKCR7cGt0LmN0cmwuY29kZX0pYCkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgaW5zdGFuY2UuX3Rpbm9kZS5sb2dnZXIoXCJFUlJPUjogSW52YWxpZCBzZXJ2ZXIgcmVzcG9uc2UgaW4gTGFyZ2VGaWxlSGVscGVyXCIsIHRoaXMucmVzdWx0KTtcbiAgICAgICAgICAgIGluc3RhbmNlLnRvUmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dCh0aGlzLnJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy54aHIub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChpbnN0YW5jZS50b1JlamVjdCkge1xuICAgICAgICBpbnN0YW5jZS50b1JlamVjdChuZXcgRXJyb3IoXCJmYWlsZWRcIikpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnhoci5vbmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoaW5zdGFuY2UudG9SZWplY3QpIHtcbiAgICAgICAgaW5zdGFuY2UudG9SZWplY3QobnVsbCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICB0aGlzLnhoci5zZW5kKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAodGhpcy50b1JlamVjdCkge1xuICAgICAgICB0aGlzLnRvUmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICAvKipcbiAgICogVHJ5IHRvIGNhbmNlbCBhbiBvbmdvaW5nIHVwbG9hZCBvciBkb3dubG9hZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5MYXJnZUZpbGVIZWxwZXIjXG4gICAqL1xuICBjYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnhociAmJiB0aGlzLnhoci5yZWFkeVN0YXRlIDwgNCkge1xuICAgICAgdGhpcy54aHIuYWJvcnQoKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB1bmlxdWUgaWQgb2YgdGhpcyByZXF1ZXN0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkxhcmdlRmlsZUhlbHBlciNcbiAgICpcbiAgICogQHJldHVybnMge3N0cmluZ30gdW5pcXVlIGlkXG4gICAqL1xuICBnZXRJZDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX21zZ0lkO1xuICB9XG59O1xuXG4vKipcbiAqIEBjbGFzcyBNZXNzYWdlIC0gZGVmaW5pdGlvbiBhIGNvbW11bmljYXRpb24gbWVzc2FnZS5cbiAqIFdvcmsgaW4gcHJvZ3Jlc3MuXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRvcGljXyAtIG5hbWUgb2YgdGhlIHRvcGljIHRoZSBtZXNzYWdlIGJlbG9uZ3MgdG8uXG4gKiBAcGFyYW0ge3N0cmluZyB8IERyYWZ0eX0gY29udGVudF8gLSBtZXNzYWdlIGNvbnRhbnQuXG4gKi9cbnZhciBNZXNzYWdlID0gZnVuY3Rpb24odG9waWNfLCBjb250ZW50Xykge1xuICB0aGlzLnN0YXR1cyA9IE1lc3NhZ2UuU1RBVFVTX05PTkU7XG4gIHRoaXMudG9waWMgPSB0b3BpY187XG4gIHRoaXMuY29udGVudCA9IGNvbnRlbnRfO1xufVxuXG5NZXNzYWdlLlNUQVRVU19OT05FID0gTUVTU0FHRV9TVEFUVVNfTk9ORTtcbk1lc3NhZ2UuU1RBVFVTX1FVRVVFRCA9IE1FU1NBR0VfU1RBVFVTX1FVRVVFRDtcbk1lc3NhZ2UuU1RBVFVTX1NFTkRJTkcgPSBNRVNTQUdFX1NUQVRVU19TRU5ESU5HO1xuTWVzc2FnZS5TVEFUVVNfRkFJTEVEID0gTUVTU0FHRV9TVEFUVVNfRkFJTEVEO1xuTWVzc2FnZS5TVEFUVVNfU0VOVCA9IE1FU1NBR0VfU1RBVFVTX1NFTlQ7XG5NZXNzYWdlLlNUQVRVU19SRUNFSVZFRCA9IE1FU1NBR0VfU1RBVFVTX1JFQ0VJVkVEO1xuTWVzc2FnZS5TVEFUVVNfUkVBRCA9IE1FU1NBR0VfU1RBVFVTX1JFQUQ7XG5NZXNzYWdlLlNUQVRVU19UT19NRSA9IE1FU1NBR0VfU1RBVFVTX1RPX01FO1xuXG5NZXNzYWdlLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIENvbnZlcnQgbWVzc2FnZSBvYmplY3QgdG8ge3B1Yn0gcGFja2V0LlxuICAgKi9cbiAgdG9KU09OOiBmdW5jdGlvbigpIHtcblxuICB9LFxuICAvKipcbiAgICogUGFyc2UgSlNPTiBpbnRvIG1lc3NhZ2UuXG4gICAqL1xuICBmcm9tSlNPTjogZnVuY3Rpb24oanNvbikge1xuXG4gIH1cbn1cbk1lc3NhZ2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTWVzc2FnZTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBUaW5vZGU7XG4gIG1vZHVsZS5leHBvcnRzLkRyYWZ0eSA9IERyYWZ0eTtcbiAgbW9kdWxlLmV4cG9ydHMuQWNjZXNzTW9kZSA9IEFjY2Vzc01vZGU7XG59XG4iLCJtb2R1bGUuZXhwb3J0cz17XCJ2ZXJzaW9uXCI6IFwiMC4xNy4wLWFscGhhM1wifVxuIl19
