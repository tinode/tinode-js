/*****************************************************************************
 *
 * Copyright 2014-2016, Tinode, All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file All the logic need to connect to Tinode chat server. Tinode is a single js
 * file with no dependencies. Just include <tt>tinode.js</tt> into your project.
 * It will add a singleton Tinode object to the top level object, usually <tt>window</tt>.
 * See <a href="https://github.com/tinode/example-react-js">https://github.com/tinode/example-react-js</a> for real-life usage.
 *
 * @copyright 2015 Tinode
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.6
 *
 * @example
 * <head>
 * <script src=".../tinode.js"></script>
 * </head>
 *
 * <body>
 *  ...
 * <script>
 *  Tinode.enableLogging(true);
 *  // Add logic to handle disconnects.
 *  Tinode.onDisconnect = function() { ... };
 *  // Setup with the default transport, usually websocket.
 *  Tinode.setup(APP_NAME, HOST, API_KEY);
 *  // Connect to the server.
 *  Tinode.connect().then(function() {
 *    // Login.
 *    return Tinode.loginBasic(login, password);
 *  }).then(function(ctrl) {
 *    // Loggedin fine, attach callbacks, subscribe to 'me'.
 *    var me = Tinode.getMeTopic();
 *    me.onMetaDesc = function(meta) { ... };
 *    me.onData = function(invite) { ... };
 *    // Subscribe, fetch topic description, the list of contacts and messages (invites).
 *    me.subscribe({get: {desc: {}, sub: {}, data: {}}});
 *  }).catch(function(err) {
 *    // Login or subscription failed, do something.
 *    ...
 *  });
 *  ...
 * </script>
 * </body>
 */

/**
 * Tinode object is automatically accessible in the top scope, usually <tt>window</tt>.
 * <i>DO NOT call the constructor. It's shown here due to a
 * <a href="https://github.com/jsdoc3/jsdoc/issues/952">deficiency in jsdoc</a>.</i>
 *
 * @class Tinode
 */
(function(environment) { // closure for web browsers
  'use strict';

  // Global constants
  var PROTOVERSION = "0";
  var VERSION = "0.6";
  var LIBRARY = "tinodejs/" + VERSION;

  var TOPIC_NEW = "new";
  var TOPIC_ME = "me";
  var USER_NEW = "new";

  // Utility functions

  // RFC3339 formater of Date
  var rfc3339DateString = function(d) {
    function pad(n) {
      return n < 10 ? '0' + n : n;
    }
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) +
      'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
  }

  // Copy src's own properties to dst.
  var mergeObj = function(dst, src) {
    for (var prop in src) {
      if (src.hasOwnProperty(prop) && src[prop]) {
        dst[prop] = src[prop];
      }
    }
  }

  // Basic cross-domain requester. Supports normal browsers and IE8+
  var xdreq = function() {
    var xdreq = null;

    // Detect browser support for CORS
    if ('withCredentials' in new XMLHttpRequest()) {
      // Support for standard cross-domain requests
      xdreq = new XMLHttpRequest();
    } else if (typeof XDomainRequest !== "undefined") {
      // IE-specific "CORS" with XDR
      xdreq = new XDomainRequest();
    } else {
      // Browser without CORS support, don't know how to handle
      throw new Error("browser not supported");
    }

    return xdreq;
  }

  // JSON stringify helper - pre-processor for JSON.stringify
  var jsonBuildHelper = function(key, val) {
    // strip out empty elements while serializing objects to JSON
    if (val === undefined || val === null || val.length === 0 ||
      ((typeof val === "object") && (Object.keys(val).length === 0))) {
      return undefined;
      // Convert javascript Date objects to rfc3339 strings
    } else if (val instanceof Date) {
      val = rfc3339DateString(val);
    }
    return val;
  }

  // Attempt to convert some date strings to objects
  var jsonParseHelper = function(key, val) {
    // Convert string timestamps with optional milliseconds to Date
    // 2015-09-02T01:45:43[.123]Z
    if (key === 'ts' && typeof val == 'string' &&
      val.length >= 20 && val.length <= 24) {
      var date = new Date(val);
      if (date) {
        return date;
      }
    }
    return val;
  };

  // Trims verly long strings (encoded images) to make logged packets more readable
  var jsonLoggerHelper = function(key, val) {
    if (typeof val == 'string' && val.length > 128) {
      return "<" + val.length + " bytes: " + val.substring(0, 32) + "..." + val.substring(-32) + ">";
    }
    return val;
  };

  /**
   * Circular buffer: holds at most 'size' objects. Once the limit is reached,
   * the new object overwrites the oldest one.
   *
   * @class CBuffer
   * @memberof Tinode
   * @protected
   *
   * @param {number} size - Maximum number of elements to hold in the buffer.
   */
  var CBuffer = function(size) {
    var base = 0,
      buffer = [],
      contains = 0;

    return {
      /**
       * Get an element at the given position.
       * @memberof Tinode.CBuffer#
       * @param {number} position - Position to fetch from.
       * @returns {Object} Element at the given position or <tt>undefined</tt>
       */
      getAt: function(at) {
        if (at >= contains || at < 0) return undefined;
        return buffer[(at + base) % size];
      },

      /** Add new element(s) to the buffer. Variadic: takes one or more arguments. If an array is passed as a single
       * argument, its elements are inserted individually.
       * @memberof Tinode.CBuffer#
       *
       * @param {(Array|...Object)} - One or more objects to insert.
       */
      put: function() {
        var insert;
        // inspect arguments: if array, insert its elements, if one or more arguments, insert them one by one
        if (arguments.length === 1 && Array.isArray(arguments[0])) {
          insert = arguments[0];
        } else {
          insert = arguments;
        }
        for (var idx in insert) {
          buffer[(base + contains) % size] = insert[idx];
          contains += 1;
          if (contains > size) {
            contains = size;
            base = (base + 1) % size;
          }
        }
      },

    /**
     * Return the maximum number of element the buffer can hold
     * @memberof Tinode.CBuffer#
     * @return {number} The size of the buffer.
     */
      size: function() {
        return size;
      },

      /**
      * Return the number of elements the buffer holds
      * @memberof Tinode.CBuffer#
      * @returns {number} Number of elements in the buffer.
      */
      contains: function() {
        return contains;
      },

      /**
       * Discard all elements and reset the buffer to the new size (maximum number of elements).
       * @memberof Tinode.CBuffer#
       * @param {number} newSize - New size of the buffer.
       */
      reset: function(newSize) {
        if (newSize) {
          size = newSize;
        }
        base = 0;
        contains = 0;
      },

      /**
       * Callback for iterating contents of buffer. See {@link Tinode.CBuffer#forEach}.
       * @callback ForEachCallbackType
       * @memberof Tinode.CBuffer#
       * @param {Object} elem - Element of the buffer.
       * @param {number} index - Index of the current element.
       */

      /**
       * Apply given function `callback` to all elements of the buffer.
       * @memberof Tinode.CBuffer#
       *
       * @param {ForEachCallbackType} callback - Function to call for each element.
       * @param {Object} context - calling context (i.e. value of 'this' in callback)
       */
      forEach: function(callback, context) {
        for (var i = 0; i < contains; i++) {
          callback.call(context, buffer[(i + base) % size], i);
        }
      }
    }
  }

  // Helper function for creating an endpoint URL
  function makeBaseUrl(host, protocol, apiKey) {
    var url = null;

    if (protocol === 'http' || protocol === 'https' || protocol === 'ws' || protocol === 'wss') {
      url = protocol + '://';
      url += host;
      if (url.charAt(url.length - 1) !== '/') {
        url += '/';
      }
      url += "v" + PROTOVERSION + "/channels";
      if (protocol === "http" || protocol === "https") {
        // Long polling endpoint end with "lp", i.e.
        // '/v0/channels/lp' vs just '/v0/channels'
        url += "/lp";
      }
      url += "?apikey=" + apiKey;
    }

    return url;
  }

  /**
  * An abstraction for a websocket or a long polling connection.
  *
  * @class Connection
  * @memberof Tinode
  * @protected
  *
  * @param {string} transport_ - network transport to use, either `ws`/`wss` for websocket or `lp` for long polling.
  * @returns a connection object.
  */
  var Connection = (function(transport_) {
    var instance;

    var host;
    var secure;
    var apiKey;

    // Settings for exponential backoff
    var _boffBase = 2000; // 2000 milliseconds, minimum delay between reconnects
    var _boffMaxIter = 10; // Maximum delay between reconnects 2^10 * 2000 ~ 34 minutes
    var _boffJitter = 0.3; // Add random delay
    var _boffTimer = null;

    function log(text) {
      if (instance.logger) {
        instance.logger(text);
      }
    }

    function reconnect(iter) {
      clearTimeout(_boffTimer);
      var timeout = _boffBase * (Math.pow(2, iter) * (1.0 + 0.3 * Math.random()));
      iter = (iter == _boffMaxIter ? iter : iter + 1);
      _boffTimer = setTimeout(function() {
        console.log("Reconnecting, iter=" + iter + ", timeout=" + timeout);
        reconnect(iter);
      }, timeout);
    }

    // Initialization for Websocket
    function init_ws() {
      var _socket = null;

      return {
        /**
        * Initiate a new connection
        * @memberof Tinode.Connection#
        * @return {Promise} Promise resolved/rejected when the connection call completes,
            resolution is called without parameters, rejection passes the {Error} as parameter.
        */
        connect: function() {
          return new Promise(function(resolve, reject) {
            var url = makeBaseUrl(host, secure ? "wss" : "ws", apiKey);

            log("Connecting to: " + url);

            var conn = new WebSocket(url);

            conn.onopen = function(evt) {
              if (instance.onWebsocketOpen) {
                instance.onWebsocketOpen();
              }
              resolve();
            }
            conn.onclose = function(evt) {
              _socket = null;

              if (instance.onDisconnect) {
                instance.onDisconnect();
              }
            }
            conn.onerror = function(err) {
              reject(err);
            }
            conn.onmessage = function(evt) {
              if (instance.onMessage) {
                instance.onMessage(evt.data);
              }
            }
            _socket = conn;
          });
        },

        /** Terminate the network connection
         * @memberof Tinode.Connection#
         */
        disconnect: function() {
          if (_socket) {
            _socket.close();
          }
          _socket = null;
        },

        /**
         * Send a string to the server.
         * @memberof Tinode.Connection#
         *
         * @param {string} msg - String to send.
         * @throws Throws an exception if the underlying connection is not live.
         */
        sendText: function(msg) {
          if (_socket && (_socket.readyState == _socket.OPEN)) {
            _socket.send(msg);
          } else {
            throw new Error("Websocket is not connected");
          }
        },

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
        onMessage: undefined,

        /**
        * A callback for reporting a dropped connection.
        * @type {function}
        * @memberof Tinode.Connection#
        */
        onDisconnect: undefined,

        /**
         * A callback to call when the websocket is connected. There is no equivalent callback for long polling connections.
         * @type {function}
         * @memberof Tinode.Connection#
         */
        onWebsocketOpen: undefined,

       /**
        * A callback to log events from Connection. See {@link Tinode.Connection#logger}.
        * @callback LoggerCallbackType
        * @memberof Tinode.Connection
        * @param {string} event - Event to log.
        */
        /**
        * A callback to report logging events.
        * @memberof Tinode.Connection#
        * @type {Tinode.Connection.LoggerCallbackType}
        */
        logger: undefined
      }
    }

    // Initialization for long polling.
    function init_lp() {
      // Fully composed endpoint URL, with API key & SID
      var _lpURL = null;

      var _poller = null;
      var _sender = null;

      function lp_sender(url_) {
        var sender = xdreq();
        sender.open('POST', url_, true);

        sender.onreadystatechange = function(evt) {
          if (sender.readyState == 4 && sender.status >= 400) {
            // Some sort of error response
            throw new Error("LP sender failed, " + sender.status);
          }
        }

        return sender;
      }

      function lp_poller(url_, resolve, reject) {
        var poller = xdreq();
        poller.open('GET', url_, true);

        poller.onreadystatechange = function(evt) {
          if (poller.readyState == 4) { // 4 == DONE
            if (poller.status == 201) { // 201 == HTTP.Created, get SID
              var pkt = JSON.parse(poller.responseText);
              var text = poller.responseText;

              _lpURL = url_ + "&sid=" + pkt.ctrl.params.sid
              poller = lp_poller(_lpURL);
              poller.send(null)
              if (resolve) {
                resolve();
              }
              if (instance.onMessage) {
                onMessage(text);
              }
            } else if (poller.status == 200) { // 200 = HTTP.OK
              if (instance.onMessage) {
                instance.onMessage(poller.responseText)
              }
              poller = lp_poller(_lpURL);
              poller.send(null);
            } else {
              // Don't throw an error here, gracefully handle server errors
              if (reject) {
                reject(poller.responseText);
              }
              if (instance.onMessage) {
                instance.onMessage(poller.responseText);
              }
              if (instance.onDisconnect) {
                instance.onDisconnect();
              }
            }
          }
        }

        return poller;
      }

      return {
        connect: function() {
          return new Promise(function(resolve, reject){
            var url = makeBaseUrl(host, secure ? "https" : "http", apiKey);
            log("Connecting to: " + url);
            _poller = lp_poller(url);
            _poller.send(null)
          }).catch(function() {

          });
        },
        disconnect: function() {
          if (_sender) {
            _sender.abort();
            _sender = null;
          }
          if (_poller) {
            _poller.abort();
            _poller = null;
          }
          if (instance.onDisconnect) {
            instance.onDisconnect();
          }
          // Ensure it's reconstructed
          _lpURL = null;
        },
        sendText: function(msg) {
          _sender = lp_sender(_lpURL);
          if (_sender && (_sender.readyState == 1)) { // 1 == OPENED
            _sender.send(msg);
          } else {
            throw new Error("Long poller failed to connect");
          }
        },
        // Callbacks:
        onMessage: undefined,
        onDisconnect: undefined,
        // Callback for logging
        logger: undefined
      };
    }

    if (transport_ === "lp") {
      // explicit request to use long polling
      instance = init_lp();
    } else if (transport_ === "ws") {
      // explicit request to use web socket
      // if websockets are not available, horrible things will happen
      instance = init_ws();
    } else {
      // Default transport selection
      if (!window["WebSocket"]) {
        // The browser has no websockets
        instance = init_lp();
      } else {
        // Using web sockets -- default
        instance = init_ws();
      }
    }

    instance.setup = function(host_, secure_, apiKey_) {
      host = host_;
      secure = secure_;
      apiKey = apiKey_;
    };

    return instance;
  });


  // Core Tinode functionality.
  var Tinode = (function() {
    var instance;

    // Initialize Tinode instance
    function init() {
      // Private variables

      // Client-provided application name, format <Name>/<version number>
      var _appName = "Undefined";
      var _platform = navigator.platform;
      // Logging to console enabled
      var _loggingEnabled = false;
      // When logging, trip long strings (base64-encoded images) for readability
      var _trimLongStrings = false;
      // The name of the host and TCP port to connect to, i.e. api.tinode.co
      // or localhost:8000
      var _hostNameAndPort = '';
      // A connection object, see Connection above.
      var _connection = null;
      // UID of the currently authenticated user
      var _myUID = null;
      // Counter of received packets
      var _inPacketCount = 0;
      // Counter for generating unique message IDs
      var _messageId = 0;

      // Generic cache, currently used for topics/users
      var _cache = {};
      // Cache of pending promises
      var _pendingPromises = {};

      // Private methods

      // Console logger
      function log(str) {
        if (_loggingEnabled) {
          var d = new Date()
          var dateString = ('0' + d.getUTCHours()).slice(-2) + ':' +
            ('0' + d.getUTCMinutes()).slice(-2) + ':' +
            ('0' + d.getUTCSeconds()).slice(-2) + ':' +
            ('0' + d.getUTCMilliseconds()).slice(-3);

          console.log('[' + dateString + '] ' + str);
        }
      }

      // Access to Tinode's cache of objects
      function cachePut(type, name, obj) {
        _cache[type + ":" + name] = obj;
      }

      function cacheGet(type, name) {
        return _cache[type + ":" + name];
      }

      function cacheDel(type, name) {
        delete _cache[type + ":" + name]
      }
      // Enumerate all items in cache, call func for each item.
      // Enumeration stops if func returns true.
      function cacheMap(func, context) {
        for (var idx in _cache) {
          if (func(_cache[idx], context)) {
            break;
          }
        }
      }

      // Resolve or reject a pending promise.
      // Unresolved promises are stored in _pendingPromises.
      function execPromise(id, code, onOK, errorText) {
        var callbacks = _pendingPromises[id];
        if (callbacks) {
          delete _pendingPromises[id];
          if (code >= 200 && code < 400) {
            if (callbacks.resolve) {
              callbacks.resolve(onOK);
            }
          } else if (callbacks.reject) {
            callbacks.reject(new Error("" + code + " " + errorText));
          }
        }
      }

      // Generator of default promises for sent packets
      var makePromise = function(id) {
        var promise = null;
        if (id) {
          var promise = new Promise(function(resolve, reject) {
            // Stored callbacks will be called when the response packet with this Id arrives
            _pendingPromises[id] = {
              "resolve": resolve,
              "reject": reject
            };
          })
        }
        return promise;
      }

      // Generates unique message IDs
      function getNextMessageId() {
        return (_messageId != 0) ? '' + _messageId++ : undefined;
      }

      // Get User Agent string
      function getUserAgent() {
        return _appName + " (" + _platform + ") " + LIBRARY;
      }

      // Generator of packets stubs
      function initPacket(type, topic) {
        var pkt = null;
        switch (type) {
          case "acc":
            return {
              "acc": {
                "id": getNextMessageId(),
                "user": null,
                "auth": [],
                "login": null,
                "desc": {}
              }
            };

          case "login":
            return {
              "login": {
                "id": getNextMessageId(),
                "ua": getUserAgent(),
                "scheme": null,
                "secret": null
              }
            };

          case "sub":
            return {
              "sub": {
                "id": getNextMessageId(),
                "topic": topic,
                "set": {},
                "get": {}
              }
            };

          case "leave":
            return {
              "leave": {
                "id": getNextMessageId(),
                "topic": topic,
                "unsub": false
              }
            };

          case "pub":
            return {
              "pub": {
                "id": getNextMessageId(),
                "topic": topic,
                "params": {},
                "content": {}
              }
            };

          case "get":
            return {
              "get": {
                "id": getNextMessageId(),
                "topic": topic,
                "what": null, // data, sub, desc, space separated list; unknown strings are ignored
                "desc": {},
                "sub": {},
                "data": {}
              }
            };

          case "set":
            return {
              "set": {
                "id": getNextMessageId(),
                "topic": topic,
                "desc": {},
                "sub": {}
              }
            };

          case "del":
            return {
              "del": {
                "id": getNextMessageId(),
                "topic": topic
              }
            };
          case "note":
            return {
              "note": {
                // no id by design
                "topic": topic,
                "what": null, // one of "recv", "read", "kp"
                "seq": undefined // the server-side message id aknowledged as received or read
              }
            };
          default:
            throw new Error("Unknown packet type requested: " + type);
        }
      }

      // Send a packet.
      function sendBasic(pkt) {
        var msg = JSON.stringify(pkt, jsonBuildHelper);
        log("out: " + (_trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : msg));
        _connection.sendText(msg);
      }

      // Send a packet returning a promise.
      function sendWithPromise(pkt, id) {
        var promise = makePromise(id);
        var msg = JSON.stringify(pkt, jsonBuildHelper);
        log("out: " + (_trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : msg));
        _connection.sendText(msg);
        return promise;
      }

      // The main message dispatcher.
      function dispatchMessage(data) {
        // Skip empty response. This happens when LP times out.
        if (!data) return;

        _inPacketCount++;

        log("in: " + data);

        // Send raw message to listener
        if (instance.onRawMessage) {
          instance.onRawMessage(data);
        }

        var pkt = JSON.parse(data, jsonParseHelper);
        if (!pkt) {
          log("ERROR: failed to parse data '" + data + "'");
        } else {
          // Send complete packet to listener
          if (instance.onMessage) {
            instance.onMessage(pkt);
          }

          if (pkt.ctrl) {
            // Handling {ctrl} message
            if (instance.onCtrlMessage) {
              instance.onCtrlMessage(pkt.ctrl);
            }

            // The very first incoming packet. This is a response to the connection attempt
            if (_inPacketCount == 1) {
              if (instance.onConnect) {
                instance.onConnect(pkt.ctrl.code, pkt.ctrl.text, pkt.ctrl.params);
              }
            }

            // Resolve or reject a pending promise, if any
            if (pkt.ctrl.id) {
              execPromise(pkt.ctrl.id, pkt.ctrl.code, pkt.ctrl, pkt.ctrl.text);
            }
          } else if (pkt.meta) {
            // Handling a {meta} message.

            // Preferred API: Route meta to topic, if one is registered
            var topic = cacheGet("topic", pkt.meta.topic);
            if (topic) {
              topic._routeMeta(pkt.meta);
            }

            // Secondary API: callback
            if (instance.onMetaMessage) {
              instance.onMetaMessage(pkt.meta);
            }
          } else if (pkt.data) {
            // Handling {data} message

            // Preferred API: Route data to topic, if one is registered
            var topic = cacheGet("topic", pkt.data.topic);
            if (topic) {
              topic._routeData(pkt.data);
            }

            // Secondary API: Call callback
            if (instance.onDataMessage) {
              instance.onDataMessage(pkt.data);
            }
          } else if (pkt.pres) {
            // Handling {pres} message

            // Preferred API: Route presence to topic, if one is registered
            var topic = cacheGet("topic", pkt.pres.topic);
            if (topic) {
              topic._routePres(pkt.pres);
            }

            // Secondary API - callback
            if (instance.onPresMessage) {
              instance.onPresMessage(pkt.pres);
            }
          } else if (pkt.info) {
            // {info} message - read/received notifications and key presses

            // Preferred API: Route {info}} to topic, if one is registered
            var topic = cacheGet("topic", pkt.info.topic);
            if (topic) {
              topic._routeInfo(pkt.info);
            }

            // Secondary API - callback
            if (instance.onInfoMessage) {
              instance.onInfoMessage(pkt.info);
            }
          } else {
            log("ERROR: Unknown packet received.");
          }
        }
      }

      // Helper function to construct {get} and {sub.get} packet.
      function parseGetParams(params) {
        var what = [];
        var result = {};

        if (params) {
          ["data", "sub", "desc"].map(function(key) {
            if (params.hasOwnProperty(key)) {
              what.push(key);
              result[key] = params[key];
            }
          });
        }

        if (what.length > 0) {
          result.what = what.join(" ");
        } else {
          throw new Error("Invalid 'get' parameters.");
        }

        return result;
      }

      // Returning an initialized instance with public methods;
      return {

        /** Instance configuration.
         * @memberof Tinode#
         *
         * @param {string} appname - Name of the caliing application to be reported in User Agent.
         * @param {string} host - Host name and port number to connect to.
         * @param {string} apiKey - API key generated by keygen
         * @param {string} transport - See {@link Tinode.Connection#transport}.
         */
        setup: function(appname_, host_, apiKey_, transport_) {
          // Initialize with a random id each time, to avoid confusing with a packet
          // from a previous session.
          _messageId = Math.floor((Math.random() * 0xFFFF) + 0xFFFF);

          if (appname_) {
            _appName = appname_;
          }

          _connection = Connection(transport_);
          _connection.logger = log;
          _connection.onMessage = dispatchMessage;
          _connection.onDisconnect = instance.onDisconnect;
          _connection.onWebsocketOpen = instance.onWebsocketOpen;
          _connection.setup(host_, false, apiKey_);
        },

        /**
         * Connect to the server.
         * @memberof Tinode#
         *
         * @return {Promise} Promise resolved/rejected when the connection call completes:
         * <tt>resolve()</tt> is called without parameters, <tt>reject()</tt> receives the <tt>Error</tt> as a single parameter.
         */
        connect: function() {
          return _connection.connect();
        },

        /**
         * Disconnect from the server.
         * @memberof Tinode#
         */
        disconnect: function() {
          _connection.disconnect();
        },
        /**
         * @typedef AccountCreationParams
         * @memberof Tinode
         * @type Object
         * @property {string} login - Name of the scheme to use to authenticate the session with the newly created account.
         * @property {Tinode.DefAcs=} defacs - Default access parameters for user's <tt>me</tt> topic.
         * @property {Object=} public - Public application-defined data exposed on <tt>me</tt> topic.
         * @property {Object=} private - Private application-defined data accessible on <tt>me</tt> topic.
         */
        /**
         * @typedef DefAcs
         * @memberof Tinode
         * @type Object
         * @property {string=} auth - Access mode for <tt>me</tt> for authenticated users.
         * @property {string=} anon - Access mode for <tt>me</tt>  anonymous users.
         */
        /**
         * @typedef AuthScheme
         * @memberof Tinode
         * @type Object
         * @property {string} scheme - Name of the authentication scheme.
         * @property {string} secret - Secret.
         */

        /**
         * Create a new user.
         * @memberof Tinode#
         *
         * @param {Tinode.AuthScheme[]} auth - One or more authentication schemes.
         * @param {Tinode.AccountCreationParams} params - User data to pass to the server.
         */
        createUser: function(auth, params) {
          var pkt = initPacket("acc");
          pkt.acc.user = USER_NEW;
          for (var idx in auth) {
            if (auth[idx].scheme && auth[idx].secret) {
              pkt.acc.auth.push({
                "scheme": auth[idx].scheme,
                "secret": auth[idx].secret
              });
            }
          }
          if (params) {
            // Log in to the new account using selected scheme
            pkt.acc.login = params.login;
            pkt.acc.desc.defacs = params.defacs;
            pkt.acc.desc.public = params.public;
            pkt.acc.desc.private = params.private;
          }

          return sendWithPromise(pkt, pkt.acc.id);
        },

        /**
         * Create user with 'basic' authentication scheme
         * @memberof Tinode#
         */
        createUserBasic: function(username, password, params) {
          return instance.createUser(
            [{
              scheme: "basic",
              secret: username + ":" + password
            }], params);
        },

        /**
         * Authenticate current session.
         * @memberof Tinode#
         *
         * @param {string} scheme - Authentication scheme; <tt>"basic"</tt> is the only currently supported scheme.
         * @param {string} secret - Authentication secret.
         * @returns {Promise} Promise which will be resolved/rejected when server reply is received.
         */
        login: function(scheme, secret) {
          var pkt = initPacket("login");
          pkt.login.scheme = scheme
          pkt.login.secret = secret

          // Setup promise
          var promise = null;
          if (pkt.login.id) {
            var promise = new Promise(function(resolve, reject) {
              // Stored callbacks will be called when the response packet with this Id arrives
              _pendingPromises[pkt.login.id] = {
                "resolve": function(ctrl) {
                  // This is a response to a successful login, extract UID and security token, save it in Tinode module
                  _myUID = ctrl.params.uid;

                  if (instance.onLogin) {
                    instance.onLogin(ctrl.code, ctrl.text);
                  }

                  if (resolve) {
                    resolve(ctrl);
                  }
                },
                "reject": reject
              }
            });
          }

          sendBasic(pkt);
          return promise;
        },

        /**
         * Wrapper for {@link Tinode#login} with basic authentication
         * @memberof Tinode#
         *
         * @param {string} uname - User name.
         * @param {string} password  - Password.
         * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
         */
        loginBasic: function(uname, password) {
          return instance.login("basic", uname + ":" + password);
        },

        /**
         * @typedef SetParams
         * @memberof Tinode
         * @property {Tinode.SetDesc=} desc - Topic initialization parameters when creating a new topic or a new subscription.
         * @property {Tinode.SetSub=} sub - Subscription initialization parameters.
         */
       /**
        * @typedef SetDesc
        * @memberof Tinode
        * @property {Tinode.DefAcs=} defacs - Default access mode.
        * @property {Object=} public - Free-form topic description, publically accessible.
        * @property {Object=} private - Free-form topic descriptionaccessible only to the owner.
        */
        /**
         * @typedef SetSub
         * @memberof Tinode
         * @property {string=} user - UID of the user affected by the request. Default (empty) - current user.
         * @property {string=} mode - User access mode, either requested or assigned dependent on context.
         * @property {Object=} info - Free-form payload to pass to the invited user or topic manager.
         */
        /**
         * Parameters passed to {@link Tinode#subscribe}
         * @typedef SubscriptionParams
         * @memberof Tinode
         * @property {Tinode.SetParams=} set - Parameters used to initialize topic
         * @property {Tinode.GetQuery=} get - Query for fetching data from topic.
         */

        /**
         * Send a topic subscription request.
         * @memberof Tinode#
         *
         * @param {string} topic - Name of the topic to subscribe to.
         * @param {Tinode.SubscriptionParams=} params - Optional subscription parameters:
         * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
         */
        subscribe: function(topic, params) {
          var pkt = initPacket("sub", topic)
          if (!topic) {
            topic = TOPIC_NEW;
          }

          if (params) {
            pkt.sub.get = parseGetParams(params.get);

            if (params.set) {
              pkt.sub.set.sub = params.set.sub;

              if (topic === TOPIC_NEW) {
                // set.desc params are used for new topics only
                pkt.sub.set.desc = params.set.desc
              } else {
                // browse makes sense only in context of an existing topic
                pkt.sub.set.data = params.set.data;
              }
            }
          }

          return sendWithPromise(pkt, pkt.sub.id).then(function(ctrl){
            // Is this a new topic? Replace "new" with the issued name and add topic to cache.
            if (topic === TOPIC_NEW) {
              topic.name = ctrl.topic;
              cachePut("topic", ctrl.topic, topic);
            }
            return ctrl;
          });
        },

        /**
         * Detach and optionally unsubscribe from the topic
         * @memberof Tinode#
         *
         * @param {string} topic - Topic to detach from.
         * @param {boolean} unsub - If <tt>true</tt>, detach and unsubscribe, otherwise just detach.
         * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
         */
        leave: function(topic, unsub) {
          var pkt = initPacket("leave", topic);
          pkt.leave.unsub = unsub;

          return sendWithPromise(pkt, pkt.leave.id);
        },

        /**
         * Publish {data} message to topic.
         * @memberof Tinode#
         *
         * @param {string} topic - Name of the topic to publish to.
         * @param {Object} data - Payload to publish.
         * @param {boolean} noEcho - If <tt>true</tt>, do not echo the message to the original session.
         * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
         */
        publish: function(topic, data, noEcho) {
          var pkt = initPacket("pub", topic);
          pkt.pub.noecho = noEcho;
          pkt.pub.content = data;

          return sendWithPromise(pkt, pkt.pub.id);
        },

        /**
         * @typedef GetQuery
         * @type Object
         * @memberof Tinode
         * @property {Tinode.GetOptsType} desc - If provided (even if empty), fetch topic description.
         * @property {Tinode.GetOptsType} sub - If provided (even if empty), fetch topic subscriptions.
         * @property {Tinode.GetDataType} data - If provided (even if empty), get messages.
         */

        /**
         * @typedef GetOptsType
         * @type Object
         * @memberof Tinode
         * @property {Date} ims - "If modified since", fetch data only it was was modified since stated date.
         * @property {number} limit - Maximum number of results to return. Ignored when querying topic description.
         */

         /**
          * @typedef GetDataType
          * @type Object
          * @memberof Tinode
          * @property {number} since - Load messages with seq id equal or greater than this value.
          * @property {number} before - Load messages with seq id lower than this number.
          * @property {number} limit - Maximum number of results to return.
          */

        /**
         * Request topic metadata
         * @memberof Tinode#
         *
         * @param {string} topic - Name of the topic to query.
         * @param {Tinode.GetQuery} params - Parameters of the query.
         * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
         */
        getMeta: function(topic, params) {
          var pkt = initPacket("get", topic);

          pkt.get = parseGetParams(params);

          return sendWithPromise(pkt, pkt.get.id);
        },

        /**
         * Update topic's metadata: description (desc), subscribtions (sub).
         * @memberof Tinode#
         *
         * @param {string} topic - Topic to update.
         * @param {Object} desc - Update to topic description.
         * @param {Object} sub - Update to a subscription.
         * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
         */
        setMeta: function(topic, params) {
          var pkt = initPacket("set", topic);
          var what = [];

          if (params) {
            ["desc", "sub"].map(function(key){
              if (params.hasOwnProperty(key)) {
                what.push(key);
                pkt.set[key] = params[key];
              }
            });
          }

          if (what.length == 0) {
            throw new Error("Invalid {set} parameters.");
          }

          return sendWithPromise(pkt, pkt.set.id);
        },

        /**
         * Delete some or all messages in a topic.
         * @memberof Tinode#
         *
         * @param {string} topic - Topic name to delete messages from.
         * @param {Object} params - What messages to delete.
         * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
         */
        delMessages: function(topic, params) {
          var pkt = initPacket("del", topic);

          pkt.del.what = "msg";
          pkt.del.before = params.before;
          pkt.del.hard = params.hard;

          return sendWithPromise(pkt, pkt.del.id);
        },

        /**
         * Delete the topic alltogether. Requires Owner permission.
         * @memberof Tinode#
         *
         * @param {string} topic - Name of the topic to delete
         * @returns {Promise} Promise which will be resolved/rejected on receiving server reply.
         */
        delTopic: function(topic) {
          var pkt = initPacket("del", topic);
          pkt.del.what = "topic";

          return sendWithPromise(pkt, pkt.del.id).then(function(ctrl) {
            cacheDel("topic", topic);
            return ctrl;
          });
        },

        /**
         * Notify server that a message or messages were a read or received.
         * @memberof Tinode#
         *
         * @param {string} topic - Name of the topic where the mesage is being aknowledged.
         * @param {string} what - Action being aknowledged, either "read" or "recv".
         * @param {number} seq - Maximum id of the message being acknowledged.
         */
        note: function(topic, what, seq) {
          if (seq <= 0) {
            throw new Error("Invalid message id");
          }
          var pkt = initPacket("note", topic);
          pkt.note.what = what;
          pkt.note.seq = seq;
          sendBasic(pkt);
        },

        /**
         * Broadcast a key-press notification to topic subscribers. Used to show
         * typing notifications "user X is typing...".
         * @memberof Tinode#
         *
         * @param {string} topic - Name of the topic to broadcast to.
         */
        noteKeyPress: function(topic) {
          var pkt = initPacket("note", topic);
          pkt.note.what = "kp";
          sendBasic(pkt);
        },

        /**
         * Get a named topic, either pull it from cache or create a new instance.
         * There is a single instance of topic for each name.
         * @memberof Tinode#
         *
         * @param {string} topic - Name of the topic to get.
         * @returns {Tinode.Topic} Requested or newly created topic or <tt>undefined</tt> if topic name is invalid.
         */
        getTopic: function(name) {
          var topic = cacheGet("topic", name);
          if (!topic && name) {
            if (name === TOPIC_ME) {
              topic = new TopicMe();
            } else {
              topic = new Topic(name);
            }
            cachePut("topic", name, topic);
          }
          if (topic) {
            topic._cacheGetUser = function(uid) {
              return cacheGet("user", uid);
            };
            topic._cachePutUser = function(uid, user) {
              return cachePut("user", uid, user);
            };
            topic._cacheDelUser = function(uid) {
              return cacheDel("user", uid);
            };
          }
          return topic;
        },

        /**
         * Instantiate 'me' topic or get it from cache.
         * @memberof Tinode#
         *
         * @returns {Tinode.TopicMe} Instance of 'me' topic.
         */
        getMeTopic: function() {
          return instance.getTopic(TOPIC_ME);
        },

        /**
         * Instantiate a new unnamed topic. Name will be assigned by the server on {@link Tinode.Topic.subscribe}.
         * @memberof Tinode#
         *
         * @param {Tinode.Callbacks} callbacks - Object with callbacks for various events.
         * @returns {Tinode.Topic} Newly created topic.
         */
        newTopic: function(callbacks) {
          return new Topic(undefined, callbacks);
        },

        /**
         * Get the UID of the the current authenticated user.
         * @memberof Tinode#
         * @returns {string} UID of the current user or <tt>undefined</uu> if the session is not yet authenticated or if there is no session.
         */
        getCurrentUserID: function() {
          return _myUID;
        },

        /**
         * Toggle console logging. Logging is off by default.
         * @memberof Tinode#
         * @param {boolean} enabled - Set to <tt>true</tt> to enable logging to console.
         */
        enableLogging: function(enabled, trimLongStrings) {
          _loggingEnabled = enabled;
          _trimLongStrings = trimLongStrings;
        },

        /**
         * Determine topic type from topic's name: grp, p2p, me.
         * @memberof Tinode
         *
         * @param {string} name - Name of the topic to test.
         * @returns {string} One of <tt>'me'</tt>, <tt>'grp'</tt>, <tt>'p2p'</tt> or <tt>undefined</tt>.
         */
        getTopicType: function(name) {
          var tp = name ? name.substring(0, 3) : undefined;
          return (tp === "me" || tp === "grp" || tp === "p2p") ? tp : undefined;
        },

        /**
         * Request server to aknowledge messages. Required for promises to function. Default "on".
         * @memberof Tinode#
         *
         * @param {boolean} status - Turn aknowledgemens on or off.
         * @deprecated
         */
        wantAkn: function(status) {
          if (status) {
            _messageId = Math.floor((Math.random() * 0xFFFFFF) + 0xFFFFFF);
          } else {
            _messageId = 0;
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
         * @type Object
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
         * Callback to receive {ctrl} (control) messages.
         * @memberof Tinode#
         * @type {Tinode.onCtrlMessage}
         */
        onCtrlMessage: undefined,

        /**
         * Callback to recieve {data} (content) messages.
         * @memberof Tinode#
         * @type {Tinode.onDataMessage}
         */
        onDataMessage: undefined,

        /**
         * Callback to receive {pres} (presence) messages.
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
        onRawMessage: undefined
      };
    }

    return {
      // Get the Singleton instance if one exists or create one if it doesn't.
      getInstance: function() {
        if (!instance) {
          instance = init();
        }
        return instance;
      }
    };
  })();

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
   * @param {Object} callbacks - Object with various event callbacks.
   * @param {Tinode.Topic.onData} callbacks.onData - Callback which receives a {data} message.
   * @param {callback} callbacks.onMeta - Callback which receives a {meta} message.
   * @param {callback} callbacks.onPres - Callback which receives a {pres} message.
   * @param {callback} callbacks.onInfo - Callback which receives an {info} message.
   * @param {callback} callbacks.onMetaDesc - Callback which receives changes to topic desctioption {@link desc}.
   * @param {callback} callbacks.onMetaSub - Called for a single subscription record change.
   * @param {callback} callbacks.onSubsUpdated - Called after a batch of subscription changes have been recieved and cached.
   * @param {callback} callbacks.onDeleteTopic - Called when the topic is being deleted.
   */
  var Topic = function(name, callbacks) {
    // Server-provided data, locally immutable.
    // topic name
    this.name = name;
    // timestamp when the topic was created
    this.created = null;
    // timestamp when the topic was last updated
    this.updated = null;
    // access mode
    this.mode = null;
    // per-topic private data
    this.private = null;
    // per-topic public data
    this.public = null;

    // Locally cached data
    // Subscribed users, for tracking read/recv/msg notifications.
    this._users = {};
    // The maximum known {data.seq} value.
    this._seq = 0;
    // Message cache, sorted by message timestamp, from old to new, keep up to 100 messages
    this._messages = CBuffer(100);
    // Boolean, true if the topic is currently live
    this._subscribed = false;

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
      this.onDeleteTopic = callbacks.onDeleteTopic;
    }
  };

  Topic.prototype = {

    /**
     * Check if the topic is subscribed.
     * @memberof Tinode.Topic#
     * @returns {boolean} True is topic is subscribed, false otherwise.
     */
    isSubscribed: function() {
      return this._subscribed;
    },

    /**
     * Request topic to subscribe. Wrapper for {@link Tinode#subscribe}.
     * @memberof Tinode.Topic#
     *
     * @param {Tinode.Topic.Subscription} params - Subscription parameters.
     * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
     */
    subscribe: function(params) {
      // If the topic is already subscribed, return resolved promise
      if (this._subscribed) {
        return Promise.resolve(this);
      }

      var name = this.name;
      var tinode = Tinode.getInstance();
      // Closure for the promise below.
      var topic = this;
      // Send subscribe message, handle async response
      return tinode.subscribe(name || TOPIC_NEW, params).then(function(ctrl) {
        // Set topic name for new topics and add it to cache.
        if (!name) {
          topic.name = ctrl.topic;
          tinode.cachePut("topic", topic.name, topic);
        }
        topic._subscribed = true;
        return topic;
      });
    },

    /**
     * Publish data to topic. Wrapper for {@link Tinode#publish}.
     * @memberof Tinode.Topic#
     *
     * @param {Object} data - Data to publish.
     * @param {boolean} noEcho - If <tt>true</tt> server will not echo message back to originating session.
     * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
     */
    publish: function(data, noEcho) {
      if (!this._subscribed) {
        throw new Error("Cannot publish on inactive topic");
      }
      // Send data
      return Tinode.getInstance().publish(this.name, data, noEcho);
    },

    /**
     * Leave the topic, optionally unsibscribe. Leaving the topic means the topic will stop
     * receiving updates from the server. Unsubscribing will terminate user's relationship with the topic.
     * Wrapper for {@link Tinode#leave}.
     * @memberof Tinode.Topic#
     *
     * @param {boolean} unsub - If true, unsubscribe, otherwise just leave.
     * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
     */
    leave: function(unsub) {
      // FIXME(gene): It's possible to unsubscribe (unsub==true) from inactive topic.
      if (!this._subscribed && !unsub) {
        throw new Error("Cannot leave inactive topic");
      }
      // Send a 'leave' message, handle async response
      var topic = this;
      return Tinode.getInstance().leave(this.name, unsub).then(function(obj) {
        topic._resetSub();
      });
    },

    /**
     * Request topic metagate from the server.
     * @memberof Tinode.Topic#
     *
     * @returns {Promise} Promise to be resolved/rejected when the server responds to request.
     */
    getMeta: function(what, browse) {
      if (!this._subscribed) {
        throw new Error("Cannot query inactive topic");
      }
      // Send {get} message, return promise.
      return Tinode.getInstance().get(this.name, what, browse);
    },

    setMeta: function(params) {
      if (!this._subscribed) {
        throw new Error("Cannot update inactive topic");
      }
      // Send Set message, handle async response
      return Tinode.getInstance().set(topic.name, params);
    },

    /**
     * @typedef Tinode.Topic.DelMessages
     * @type Object
     * @property {number} before - Delete messages with id less or equal to <tt>before</tt>.
     * @property {boolean} hard - Hard-delete messages, i.e. delete from storage. Otherwise just hide them. Requires Owner permission.
     */
    /**
     * Delete messages. Hard-deleting messages requires Owner permission. Wrapper for {@link Tinode#delMessages}.
     * @memberof Tinode.Topic#
     *
     * @param {Tinode.Topic.DelMessages} params - What messages to delete.
     */
    delMessages: function(params) {
      if (!this._subscribed) {
        throw new Error("Cannot delete messages in inactive topic");
      }
      // Send {del} message, return promise
      return Tinode.getInstance().delMessages(this.name, params);
    },

    /**
     * Delete topic. Requires Owner permission. Wrapper for {@link Tinode#delTopic}.
     * @memberof Tinode.Topic#
     *
     * @returns {Promise} Promise to be resolved/rejected when the server responds to the request.
     */
    delTopic: function() {
      if (!this._subscribed) {
        throw new Error("Cannot delete inactive topic");
      }

      var topic = this;
      var tinode = Tinode.getInstance();
      return tinode.delTopic(this.name).then(function(obj) {
        topic._resetSub();
        if (topic.onDeleteTopic) {
          topic.onDeleteTopic();
        }
      });
    },

    // Send a read/recv notification
    note: function(what, seq) {
      var tinode = Tinode.getInstance();
      var user = this._users[tinode.getCurrentUserID()];
      if (user) {
        if (!user[what] || user[what] < seq) {
          if (!this._subscribed) {
            throw new Error("Cannot send notification in inactive topic");
          }
          tinode.note(this.name, what, seq);
        }
        user[what] = seq;
      } else {
        console.log("note(): user not found " + tinode.getCurrentUserID());
      }

      // Update locally cached contact with the new count
      var me = tinode.getMeTopic();
      if (me) {
        me.setMsgReadRecv(this.name, what, seq);
      }
    },

    /**
     * Send a 'recv' receipt. Wrapper for {@link Tinode#noteRecv}.
     * @memberof Tinode.Topic#
     *
     * @param {number} seq - ID of the message to aknowledge.
     */
    noteRecv: function(seq) {
      this.note("recv", seq);
    },

    /**
     * Send a 'read' receipt. Wrapper for {@link Tinode#noteRead}.
     * @memberof Tinode.Topic#
     *
     * @param {number} seq - ID of the message to aknowledge.
     */
    noteRead: function(seq) {
      this.note("read", seq);
    },

    /**
     * Send a key-press notification. Wrapper for {@link Tinode#noteKeyPress}.
     * @memberof Tinode.Topic#
     */
    noteKeyPress: function() {
      if (!this._subscribed) {
        throw new Error("Cannot send notification in inactive topic");
      }
      Tinode.getInstance().noteKeyPress(this.name);
    },

    // Get user description
    userDesc: function(uid) {
      // TODO(gene): handle asynchronous requests

      var user = this._cacheGetUser(uid);
      if (user) {
        return user; // Promise.resolve(user)
      }
      //return Tinode.getInstance().get(uid);
    },

    /**
     * Iterate over cached messages. If callback is undefined, use this.onData.
     * @memberof Tinode.Topic#
     *
     * @param {function} callback - Callback which will receive messages one by one.
     * @param {Object} context - Value of `this` inside the `callback`.
     */
    messages: function(callback, context) {
      var cb = (callback || this.onData);
      if (cb) {
        this._messages.forEach(cb, context);
      }
    },

    // Get the number of topic subscribers who marked this message as either recv or read
    // Current user is excluded from the count.
    msgReceiptCount: function(what, seq) {
      var count = 0;
      var me = Tinode.getInstance().getCurrentUserID();
      if (seq > 0) {
        for (var idx in this._users) {
          var user = this._users[idx];
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
     * @param {number} seq - Message id to check.
     * @returns {number} Number of subscribers who claim to have received the message.
     */
    msgReadCount: function(seq) {
      return this.msgReceiptCount("read", seq);
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
      return this.msgReceiptCount("recv", seq);
    },

    /**
     * Get type of the topic: me, p2p, grp.
     * @memberof Tinode.Topic#
     *
     * @returns {string} One of 'me', 'p2p', 'grp' or <tt>undefined</tt>.
     */
    getType: function() {
      return Tinode.getInstance().getTopicType(this.name);
    },

    // Process data message
    _routeData: function(data) {
      // Generate a topic-unique index for the sender. It can be used to
      // differentiate messages by sender, such as different message background
      // for different senders.
      var idx = Object.keys(this._users).indexOf(data.from);
      if (idx < 0) {
        idx = Object.keys(this._users).length;
        this._user[data.from] = {user: data.from};
      }
      data.$userIndex = idx;

      this._messages.put(data);

      if (data.seq > this._seq) {
        this._seq = data.seq;
      }

      if (this.onData) {
        this.onData(data);
      }

      // Update locally cached contact with the new message count
      var me = Tinode.getInstance().getMeTopic();
      if (me) {
        me.setMsgReadRecv(this.name, "msg", data.seq);
      }
    },

    // Process metadata message
    _routeMeta: function(meta) {
      if (meta.desc) {
        this._processMetaDesc(meta.desc);
      }
      if (meta.sub && meta.sub.length > 0) {
        this._processMetaSub(meta.sub);
      }
      if (this.onMeta) {
        this.onMeta(meta);
      }
    },

    // Process presence change message
    _routePres: function(pres) {
      if (this.onPres) {
        this.onPres(pres);
      }
    },

    // Process {info} message
    _routeInfo: function(info) {
      if (info.what !== "kp") {
        var user = this._users[info.from];
        if (user) {
          user[info.what] = info.seq;
        }
      }
      if (this.onInfo) {
        this.onInfo(info);
      }
    },

    // Called by Tinode when meta.desc packet is received.
    _processMetaDesc: function(desc) {
      // Copy parameters from desc object to this topic.
      mergeObj(this, desc);

      if (typeof this.created === "string") {
        this.created = new Date(this.created);
      }
      if (typeof this.updated === "string") {
          this.updated = new Date(this.updated);
      }

      if (this.onMetaDesc) {
          this.onMetaDesc(desc);
      }
    },

    // Called by Tinode when meta.sub is recived.
    _processMetaSub: function(subs) {
      for (var idx in subs) {
        var sub = subs[idx];
        if (sub.user) { // Response to get.sub on 'me' topic does not have .user set
          // Save the object to global cache.
          this._cachePutUser(sub.user, sub);
          // Cache user in the topic as well.
          var cached = this._users[sub.user];
          if (cached) {
            mergeObj(cached, sub);
          } else {
            this._users[sub.user] = sub;
          }
        }

        if (this.onMetaSub) {
          this.onMetaSub(subs[idx]);
        }
      }

      if (this.onSubsUpdated) {
        this.onSubsUpdated(Object.keys(this._users));
      }
    },

    // Reset subscribed state
    // TODO(gene): should it also clear the message cache?
    _resetSub: function() {
      topic._subscribed = false;
    }
  };

  /**
   * @class TopicMe - special case of {@link Tinode.Topic} for receiving and confirming invitations,
   * managing data of the current user, including contact list.
   * @extends Tinode.Topic
   * @memberof Tinode
   *
   * @param {TopicMe.Callbacks} callbacks - Callbacks to receive various events.
   */
  var TopicMe = function(callbacks) {
    Topic.call(this, TOPIC_ME, callbacks);
    // List of contacts (topic_name -> Contact object)
    this._contacts = {};
    // Map of p2p topics indexed by the other user ID (uid -> p2p_topic_name)
    this._p2p = {};

    // me-specific callbacks
    if (callbacks) {
      this.onContactUpdate = callbacks.onContactUpdate;
    }
  };

  // Inherit everyting from the generic Topic
  TopicMe.prototype = Object.create(Topic.prototype, {
    // Override the original Topic._processMetaSub
    _processMetaSub: {
      value: function(subs) {
        for (var idx in subs) {
          var cont = this._contacts[subs[idx].topic];
          subs[idx].updated = new Date(subs[idx].updated);
          if (subs[idx].seen && subs[idx].seen.when) {
            subs[idx].seen.when = new Date(subs[idx].seen.when);
          }
          if (cont) {
            mergeObj(cont, subs[idx]);
          } else {
            cont = subs[idx];
          }
          this._contacts[cont.topic] = cont;
          if (cont.with) {
            this._p2p[cont.with] = cont.topic;
          }

          if (this.onMetaSub) {
            this.onMetaSub(cont);
          }
        }

        if (this.onSubsUpdated) {
          this.onSubsUpdated(Object.keys(this._contacts));
        }
      },
      enumerable: true,
      configurable: true,
      writable: true
    },

    // Process presence change message
    _routePres: {
      value: function(pres) {
        // p2p topics are not getting what=on/off/upd updates,
        // such updates are sent with pres.topic set to user ID
        var contactName = this._p2p[pres.src] || pres.src;
        var cont = this._contacts[contactName];
        if (cont) {
          switch(pres.what) {
            case "on": // topic came online
              cont.online = true;
              break;
            case "off": // topic went offline
              cont.online = false;
              if (cont.seen) {
                cont.seen.when = new Date();
              } else {
                cont.seen = {when: new Date()};
              }
              break;
            case "msg": // new message received
              cont.seq = pres.seq;
              break;
            case "upd": // desc updated
              // TODO(gene): request updated description
              break;
            case "ua": // user agent changed
              cont.seen = {when: new Date(), ua: pres.ua};
              break;
            case "recv": // user's other session marked some messges as received
              cont.recv = cont.recv ? Math.max(cont.recv, pres.seq) : pres.seq;
              break;
            case "read": // user's other session marked some messages as read
              cont.read = cont.read ? Math.max(cont.read, pres.seq) : pres.seq;
              break;
            case "del": // messages or topic deleted in other session
              // TODO(gene): add handling for del
          }
          if (this.onContactUpdate) {
            this.onContactUpdate(pres.what, cont);
          }
        }
        if (this.onPres) {
          this.onPres(pres);
        }
      },
      enumerable: true,
      configurable: true,
      writable: true
    },

    /**
     * Publishing to TopicMe is not supported. {@link Topic#publish} is overriden and thows an {Error} if called.
     * @memberof Tinode.TopicMe#
     * @throws {Error} Always throws an error.
     */
    publish: {
      value: function(data, noEcho) {
        throw new Error("Publishing to 'me' is not supported");
      },
      enumerable: true,
      configurable: true,
      writable: true
    },

    /**
     * Iterate over cached contacts. If callback is undefined, use {@link this.onMetaSub}.
     * @function
     * @memberof Tinode.TopicMe#
     * @param {TopicMe.ContactCallback} callback - Callback to call for each contact.
     * @param {Object} context - Context to use for calling the `callback`, i.e. the value of `this` inside the callback.
     */
    contacts: {
      value: function(callback, context) {
        var cb = (callback || this.onMetaSub);
        if (cb) {
          for (var idx in this._contacts) {
            cb.call(context, this._contacts[idx], idx, this._contacts);
          }
        }
      },
      enumerable: true,
      configurable: true,
      writable: true
    },

    /**
     * Update a cached contact with new read/received/message count.
     * @function
     * @memberof Tinode.TopicMe#
     *
     * @param {string} contactName - UID of contact to update.
     * @param {string} what - Whach count to update, one of <tt>"read", "recv", "msg"</tt>
     * @param {number} seq - New value of the count.
     */
    setMsgReadRecv: {
      value: function(contactName, what, seq) {
        var cont = this._contacts[contactName];
        var oldVal, newVal;
        if (cont) {
          if (what === "recv") {
            oldVal = cont.recv;
            cont.recv = cont.recv ? Math.max(cont.recv, seq) : seq;
            newVal = cont.recv;
          } else if (what === "read") {
            oldVal = cont.read;
            cont.read = cont.read ? Math.max(cont.read, seq) : seq;
            newVal = cont.read;
          } else if (what === "msg") {
            oldVal = cont.seq;
            cont.seq = cont.seq ? Math.max(cont.seq, seq) : seq;
            newVal = cont.seq;
          }

          if ((oldVal != newVal) && this.onContactUpdate) {
            this.onContactUpdate(what, cont);
          }
        }
      },
      enumerable: true,
      configurable: true,
      writable: true
    },

    /**
     * Get a contact from cache.
     * @memberof Tinode.TopicMe#
     *
     * @param {string} name - Name of the contact to get, aither a UID (for p2p topics) or a topic name.
     * @returns {Tinode.Contact} - Contact or `undefined`.
     */
    getContact: {
      value: function(name) {
        var contactName = this._p2p[name] || name;
        return this._contacts[contactName];
      },
      enumerable: true,
      configurable: true,
      writable: true
    }
  });
  TopicMe.prototype.constructor = TopicMe;

  // Export for the window object or node; Check that is not already defined.
  if (typeof(environment.Tinode) === 'undefined') {
    environment.Tinode = Tinode.getInstance();
  }

})(this); // 'this' will be window object for the browsers.
