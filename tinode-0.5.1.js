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

(function(environment) { // closure for web browsers
  'use strict';

  // Global constants
  var PROTOVERSION = "0";
  var VERSION = "0.5";
  var USER_AGENT = "JS/0.5";

  // Utility functions

  // RFC3339 formater of Date
  var rfc3339DateString = function(d) {
    function pad(n) {
      return n < 10 ? '0' + n : n;
    }
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) +
      'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
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
    if (val === null || val.length === 0 ||
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
    // Convert timestamps with optional milliseconds
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

  // Basic circular buffer for caching messages
  var CBuffer = function(size) {
    var pointer = 0,
      buffer = [],
      contains = 0;

    return {
      get: function(at) {
        if (at >= contains || at < 0) return undefined;
        return buffer[(at + pointer) % size];
      },
      // Variadic: takes one or more arguments. If a single array is passed, it's elements are
      // inserted individually
      put: function() {
        var insert;
        // inspect arguments: if array, insert its elements, if one or more arguments, insert them one by one
        if (arguments.length == 1 && Array.isArray(arguments[0])) {
          insert = arguments[0];
        } else {
          insert = arguments;
        }
        for (var idx in insert) {
          buffer[pointer] = insert[idx];
          pointer = (pointer + 1) % size;
          contains = (contains == size ? size : contains + 1);
        }
      },
      size: function() {
        return size;
      },
      contains: function() {
        return contains;
      },
      reset: function(newSize) {
        if (newSize) {
          size = newSize;
        }
        pointer = 0;
        contains = 0;
      },
      forEach: function(callback, context) {
        for (var i = 0; i < contains; i++) {
          if (callback(buffer[(i + pointer) % size], context)) {
            break;
          }
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

  // Abstract websocket or long polling connection.
  // Returns an object with the following methods defined:
  //  connect()
  //  disconnect()
  //  sendText()
  // It also takes callbacks:
  //  onMessage: called when a new message is received
  //  onDisconnect: connection lost
  //  onWebsocketOpen: connection established (websocket only)
  var Connection = (function(transport_) {
    var instance;

    var host;
    var secure;
    var apiKey;

    function log(text) {
      if (instance.logger) {
        instance.logger(text);
      }
    }

    // Initialization for Websocket
    function init_ws() {
      var _socket = null;

      return {
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
        disconnect: function() {
          if (_socket) {
            _socket.close();
          }
          _socket = null;
        },
        sendText: function(msg) {
          if (_socket && (_socket.readyState == _socket.OPEN)) {
            _socket.send(msg);
          } else {
            throw new Error("Websocket is not connected");
          }
        },
        // Callbacks:
        onMessage: undefined,
        onDisconnect: undefined,
        onWebsocketOpen: undefined,
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

  // The base Tinode functionality
  var Tinode = (function() {
    var instance;

    var TOPIC_NEW = "new";
    var TOPIC_ME = "me";
    var USER_NEW = "new";

    // Initialize Tinode instance
    function init() {
      // Private variables

      // Logging to console enabled
      var _loggingEnabled = false;
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
      // Pending promises are stored in _pendingPromises
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
                "init": {}
              }
            };

          case "login":
            return {
              "login": {
                "id": getNextMessageId(),
                "ua": USER_AGENT,
                "scheme": null,
                "secret": null
              }
            };

          case "sub":
            return {
              "sub": {
                "id": getNextMessageId(),
                "topic": topic,
                "mode": null,
                "init": {},
                "browse": {}
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
                "what": null, // data, sub, info, space separated list; unknown strings are ignored
                "browse": {}
              }
            };

          case "set":
            return {
              "set": {
                "id": getNextMessageId(),
                "topic": topic,
                "what": null,
                "info": {},
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

          default:
            throw new Error("Unknown packet type requested: " + type);
        }
      }

      // Send a packet
      function sendBasic(pkt) {
        var msg = JSON.stringify(pkt, jsonBuildHelper);
        log("out: " + msg);
        _connection.sendText(msg);
      }
      // Send a packet returning a promise
      function sendWithPromise(pkt, id) {
        var promise = makePromise(id);
        var msg = JSON.stringify(pkt, jsonBuildHelper);
        log("out: " + msg);
        _connection.sendText(msg);
        return promise;
      }

      // The main message dispatcher
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
                streaming.onConnect(pkt.ctrl.code, pkt.ctrl.text, pkt.ctrl.params);
              }
            }

            // Resolve or reject a pending promise, if any
            if (pkt.ctrl.id) {
              execPromise(pkt.ctrl.id, pkt.ctrl.code, pkt.ctrl, pkt.ctrl.text);
            }
          } else if (pkt.meta) {
            // Handling a {meta} message.

            // Preferred API: Route meta to topic, if one is registered
            var topic = Tinode.cacheGet("topic", pkt.meta.topic)
            if (topic) {
              topic.routeMeta(pkt.meta);
            }

            // Secondary API: callback
            if (instance.onMetaMessage) {
              instance.onMetaMessage(pkt.meta);
            }
          } else if (pkt.data) {
            // Handling {data} message

            // Preferred API: Route data to topic, if one is registered
            var topic = Tinode.cacheGet("topic", pkt.data.topic)
            if (topic) {
              topic.routeData(pkt.data);
            }

            // Secondary API: Call callback
            if (streaming.onDataMessage) {
              streaming.onDataMessage(pkt.data);
            }
          } else if (pkt.pres) {
            // Handling {pres} message

            // Preferred API: Route presence to topic, if one is registered
            var topic = Tinode.cacheGet("topic", pkt.pres.topic);
            if (topic) {
              topic.routePres(pkt.pres);
            }

            // Secondary API - callback
            if (streaming.onPresMessage) {
              streaming.onPresMessage(pkt.pres);
            }
          } else {
            log("ERROR: Unknown packet received.");
          }
        }
      }

      // Returning an initialized instance with public methods;
      return {
        // Instance configuration.
        setup: function(host_, apiKey_, transport_) {
          // Initialize with a random id each time, to avoid confusing packet
          // from a previous session.
          _messageId = Math.floor((Math.random() * 0xFFFF) + 0xFFFF);

          _connection = Connection(transport_);
          _connection.logger = log;
          _connection.onMessage = dispatchMessage;
          _connection.onDisconnect = instance.onDisconnect;
          _connection.onWebsocketOpen = instance.onWebsocketOpen;
          _connection.setup(host_, false, apiKey_);
        },
        connect: function() {
          return _connection.connect();
        },
        disconnect: function() {
          _connection.disconnect();
        },
        // Return ID of the current authenticated user.
        getCurrentUserID: function() {
          return _myUID;
        },
        // Toggle console logging. Logging is off by default.
        enableLogging: function(val) {
          _loggingEnabled = val;
        },
        // Create new user
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
            if (params.login) {
              pkt.acc.login = scheme;
            }
            pkt.acc.init.defacs = params.acs;
            pkt.acc.init.public = params.public;
            pkt.acc.init.private = params.private;
          }

          return sendWithPromise(pkt, pkt.acc.id);
        },
        // Create user using 'basic' authentication scheme
        createUserBasic: function(username, password, params) {
          return instance.CreateUser([{
            "basic": username + ":" + password
          }], params);
        },

        // Authenticate current session
        // 	@authentication scheme. "basic" is the only currently supported scheme
        //	@secret	-- authentication secret
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
        // Wrapper for Login with basic authentication
        // @uname -- user name
        // @password -- self explanatory
        loginBasic: function(uname, password) {
          return instance.login("basic", uname + ":" + password);
        },

        // Send a subscription request to topic
        // 	@topic -- topic name to subscribe to
        // 	@params -- optional object with request parameters:
        //     @params.init -- initializing parameters for new topics. See streaming.Set
        //		 @params.sub
        //     @params.mode -- access mode, optional
        //     @params.get -- list of data to fetch, see streaming.Get
        //     @params.browse -- optional parameters for get.data. See streaming.Get
        subscribe: function(topic, params) {
          var pkt = initPacket("sub", topic)
          if (params) {
            pkt.sub.get = params.get;
            if (params.sub) {
              pkt.sub.sub.mode = params.sub.mode;
              pkt.sub.sub.info = params.sub.info;
            }
            // .init params are used for new topics only
            if (topic === Tinode.TOPIC_NEW) {
              pkt.sub.init.defacs = params.init.acs;
              pkt.sub.init.public = params.init.public;
              pkt.sub.init.private = params.init.private;
            } else {
              // browse makes sense only in context of an existing topic
              pkt.sub.browse = params.browse;
            }
          }

          return sendWithPromise(pkt, pkt.sub.id);
        },
        // Leave topic
        leave: function(topic, unsub) {
          var pkt = initPacket("leave", topic);
          pkt.leave.unsub = unsub;

          return sendWithPromise(pkt, pkt.leave.id);
        },
        // Pub {data} to topic
        publish: function(topic, data, params) {
          var pkt = initPacket("pub", topic);
          if (params) {
            pkt.pub.params = params;
          }
          pkt.pub.content = data;

          return sendWithPromise(pkt, pkt.pub.id);
        },
        // Request topic metadata
        get: function(topic, what, browse) {
          var pkt = initPacket("get", topic);
          pkt.get.what = (what || "info");
          pkt.get.browse = browse;

          return sendWithPromise(pkt, pkt.get.id);
        },

        // Update topic's metadata: description (info), subscribtions (sub), or delete messages (del)
        // @topic: topic to Update
        // @params:
        // 	@params.info: update to topic description
        //  @params.sub: update to a subscription
        set: function(topic, params) {
          var pkt = initPacket("set", topic);
          var what = [];

          if (params) {
            if ((typeof params.info === "object") && (Object.keys(params.info).length > 0)) {
              what.push("info");

              pkt.set.info.defacs = params.info.acs;
              pkt.set.info.public = params.info.public;
              pkt.set.info.private = params.info.private;
            }
            if ((typeof params.sub === "object") && (Object.keys(params.sub).length > 0)) {
              what.push("sub");

              pkt.set.sub.user = params.sub.user;
              pkt.set.sub.mode = params.sub.mode;
              pkt.set.sub.info = params.sub.info;
            }
          }

          if (what.length > 0) {
            pkt.set.what = what.join(" ");
          } else {
            throw new Error("Invalid {set} parameters.");
          }

          return sendWithPromise(pkt, pkt.set.id);
        },
        // Delete some or all messages in a topic
        delMessages: function(topic, params) {
          var pkt = initPacket("del", topic);

          pkt.del.what = "msg";
          pkt.del.before = params.before;
          pkt.del.hard = params.hard;

          return sendWithPromise(pkt, pkt.del.id);
        },
        // Delete entire topic
        delTopic: function(topic) {
          var pkt = initPacket("del", topic);
          pkt.del.what = "topic";

          return sendWithPromise(pkt, pkt.del.id);
        },
        // Deprecated? Remove?
        wantAkn: function(status) {
          if (status) {
            _messageId = Math.floor((Math.random() * 0xFFFFFF) + 0xFFFFFF);
          } else {
            _messageId = 0;
          }
        },
        // Callbacks:
        // Websocket opened
        onWebsocketOpen: undefined,
        // Connection completed, sucess or failure
        // @code -- result code
        // @text -- "OK" or text of an error message
        // @params -- connection parametes
        onConnect: undefined,
        // Connection closed
        onDisconnect: undefined,
        // Login completed
        onLogin: undefined,
        // Control message received
        onCtrlMessage: undefined,
        // Content message received
        onDataMessage: undefined,
        // Presence message received
        onPresMessage: undefined,
        // Complete data packet, as object
        onMessage: undefined,
        // Unparsed data as text
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

  /*
   * Logic for a single topic
   */
  Tinode.Topic = (function(name, callbacks) {
    // Check if topic with this name is already registered
    var topic = Tinode.cacheGet("topic", name)
    if (topic) {
      return topic;
    }

    topic = {
      // Server-side data
      "name": name, // topic name
      "created": null, // timestamp when the topic was created
      "updated": null, // timestamp when the topic was updated
      "mode": null, // access mode
      "private": null, // per-topic private data
      "public": null, // per-topic public data

      // Local data
      "_users": {}, // List of subscribed users' IDs
      "_messages": Tinode.CBuffer(100), // message cache, sorted by message timestamp, from old to new, keep 100 messages
      "_subscribed": false, // boolean, true if the topic is currently live
      "_changes": [], // list of properties changed, for cache management
      "_callbacks": callbacks // onData, onMeta, onPres, onInfoChange, onSubsChange, onOffline
    }

    topic.isSubscribed = function() {
      return topic._subscribed
    }

    var processInfo = function(info) {
      // Copy parameters from obj.info to this topic.
      for (var prop in info) {
        if (info.hasOwnProperty(prop) && info[prop]) {
          topic[prop] = info[prop]
        }
      }

      if (typeof topic.created === "string") {
        topic.created = new Date(topic.created)
      }
      if (typeof topic.updated === "string") {
        topic.updated = new Date(topic.updated)
      }

      if (topic._callbacks && topic._callbacks.onInfoChange) {
        topic._callbacks.onInfoChange(info)
      }
    }

    var processSub = function(subs) {
      if (topic._callbacks && topic._callbacks.onSubsChange) {
        for (var idx in subs) {
          topic._callbacks.onSubsChange(subs[idx])
        }
      }

      for (var idx in subs) {
        var sub = subs[idx]
        if (sub.user) { // response to get.sub on !me topic does not have .user set
          Tinode.cachePut("user", sub.user, sub)
          topic._users[sub.user] = sub.user
        }
      }
    }

    topic.Subscribe = function(params) {
      // If the topic is already subscribed, return resolved promise
      if (topic._subscribed) {
        return Promise.resolve(topic)
      }

      var name = topic.name
        // Send subscribe message, handle async response
      return Tinode.streaming.Subscribe((name || Tinode.TOPIC_NEW), params)
        .then(function(ctrl) {

          // Handle payload
          if (ctrl.params) {
            // Handle "info" part of response - topic description
            if (ctrl.params.info) {
              processInfo(ctrl.params.info)
            }

            // Handle "sub" part of response - list of topic subscribers
            // or subscriptions in case of 'me' topic
            if (ctrl.params.sub && ctrl.params.sub.length > 0) {
              processSub(ctrl.params.sub)
            }
          }

          topic._subscribed = true

          if (topic.name != name) {
            Tinode.cacheDel("topic", name)
            Tinode.cachePut("topic", topic.name, topic)
          }

          return topic
        })
    }

    topic.Publish = function(data, params) {
      if (!topic._subscribed) {
        throw new Error("Cannot publish on inactive topic")
      }
      // Send data
      return Tinode.streaming.Publish(topic.name, data, params)
    }

    // Leave topic
    // @unsub: boolean, leave and unsubscribe
    topic.Leave = function(unsub) {
      if (!topic._subscribed) {
        throw new Error("Cannot leave inactive topic")
      }
      // Send unsubscribe message, handle async response
      return Tinode.streaming.Leave(topic.name, unsub)
        .then(function(obj) {
          topic.resetSub()
        })
    }

    topic.Set = function(params) {
      if (!topic._subscribed) {
        throw new Error("Cannot update inactive topic")
      }
      // Send Set message, handle async response
      return Tinode.streaming.Set(topic.name, params)
    }

    // Delete messages
    topic.Delete = function(params) {
      if (!topic._subscribed) {
        throw new Error("Cannot delete messages in inactive topic")
      }
      // Send Set message, handle async response
      return Tinode.streaming.DelMessages(topic.name, params)
    }

    topic.DelTopic = function(params) {
      if (!topic._subscribed) {
        throw new Error("Cannot delete inactive topic")
      }

      // Delete topic, handle async response
      return Tinode.streaming.DelTopic(topic.name)
        .then(function(obj) {
          topic.resetSub()
          Tinode.cacheDel("topic", topic.name)
        })
    }

    // Sync topic.info updates to the server
    topic.Sync = function() {
      // TODO(gene): make info object with just the updated topic fields, send it to the server
      throw new Error("Not implemented")
        // Tinode.streaming.Set(name, obj)
    }

    topic.UserInfo = function(uid) {
      // TODO(gene): handle asynchronous requests

      var user = Tinode.cacheGet("user", uid)
      if (user) {
        return user // Promise.resolve(user)
      }
      //return Tinode.streaming.Get(uid)
    }

    // Iterate over stored messages
    // Iteration stops if callback returns true
    topic.Messages = function(callback, context) {
      topic._messages.forEach(callback, context)
    }

    // Process data message
    topic.routeData = function(data) {
      topic._messages.put(data)
      if (topic._callbacks && topic._callbacks.onData) {
        topic._callbacks.onData(data)
      }
    }

    // Process metadata message
    topic.routeMeta = function(meta) {
      if (topic._callbacks && topic._callbacks.onMeta) {
        topic._callbacks.onMeta(meta)
      }

      if (meta.info) {
        processInfo(meta.info)
      }

      if (meta.sub && meta.sub.length > 0) {
        processSub(meta.sub)
      }
    }

    // Process presence change message
    topic.routePres = function(pres) {
      if (topic._callbacks && topic._callbacks.onPres) {
        topic._callbacks.onPres(pres)
      }
    }

    // Reset subscribed state
    topic.resetSub = function() {
      topic._subscribed = false
    }

    // Save topic in cache if it's a named topic
    if (name) {
      Tinode.cachePut("topic", name, topic)
    }

    return topic
  })

  // Special 'me' topic
  Tinode.TopicMe = (function(callbacks) {
    return Tinode.Topic(Tinode.TOPIC_ME, {
      "onData": function(data) {
        if (callbacks && callbacks.onData) {
          callbacks.onData(data)
        }
      },
      "onMeta": function(meta) {
        if (callbacks && callbacks.onMeta) {
          callbacks.onMeta(meta)
        }
      },
      "onPres": function(pres) {
        if (callbacks && callbacks.onPres) {
          callbacks.onPres(pres)
        }
      },
      "onSubsChange": function(sub) {
        if (callbacks && callbacks.onSubsChange) {
          callbacks.onSubsChange(sub)
        }
      },
      "onInfoChange": function(info) {
        if (callbacks && callbacks.onInfoChange) {
          callbacks.onInfoChange(info)
        }
      }
    })
  })

  // Export for the window object or node; Check that is not already defined.
  if (typeof(environment.Tinode) === 'undefined') {
    environment.Tinode = Tinode.getInstance();
  }

})(this); // this will be window object for the browsers.
