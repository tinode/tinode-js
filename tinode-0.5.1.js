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

  var CBuffer = function(size) {
    var base = 0,
      buffer = [],
      contains = 0;

    return {
      get: function(at) {
        if (at >= contains || at < 0) return undefined;
        return buffer[(at + base) % size];
      },
      // Variadic: takes one or more arguments. If a single array is passed, it's elements are
      // inserted individually
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
        base = 0;
        contains = 0;
      },
      forEach: function(callback, context) {
        for (var i = 0; i < contains; i++) {
          if (callback(buffer[(i + base) % size], context)) {
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
          case "note":
            return {
              "note": {
                // no id by design
                "topic": topic,
                "what": null, // one of "recv", "read", "kp"
                "seq": 0 // the server-side message id aknowledged as received or read
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
        //     @params.get -- list of data to fetch, see Tinode.get
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
            if (topic === undefined) {
              topic = TOPIC_NEW;
            }
            if (topic === TOPIC_NEW) {
              pkt.sub.init.defacs = params.init.acs;
              pkt.sub.init.public = params.init.public;
              pkt.sub.init.private = params.init.private;
            } else {
              // browse makes sense only in context of an existing topic
              pkt.sub.browse = params.browse;
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

          return sendWithPromise(pkt, pkt.del.id).then(function(ctrl) {
            cacheDel("topic", topic);
            return ctrl;
          });
        },
        // Send a read/recv notification
        note: function(topic, what, seq) {
          if (seq <= 0) {
            throw new Error("Invalid message id");
          }
          var pkt = initPacket("note", topic);
          pkt.note.what = what;
          pkt.note.seq = seq;
          return sendBasic(pkt);
        },
        // Send a key-press notification
        noteKeyPress: function(topic) {
          var pkt = initPacket("note", topic);
          pkt.note.what = "kp";
          return sendBasic(pkt);
        },
        // Get named topic, either pull it from cache or create a new instance.
        getTopic: function(name) {
          var topic = cacheGet("topic", name);
          if (!topic) {
            topic = new Topic(name);
            topic._cacheGetUser = function(uid) {
              return cacheGet("user", uid);
            };
            topic._cachePutUser = function(uid, user) {
              return cachePut("user", uid, user);
            };
            topic._cacheDelUser = function(uid) {
              return cacheDel("user", uid);
            };
            cachePut("topic", name, topic);
          }
          return topic;
        },
        // Instantiate 'me' topic or get it from cache.
        getMeTopic: function() {
          return instance.getTopic(TOPIC_ME);
        },
        newTopic: function(callbacks) {
          return new Topic(undefined, callbacks);
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
  var Topic = function(name, callbacks) {
    // Server-side data
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
    // List of subscribed users' IDs
    this._users = {};
    // Message cache, sorted by message timestamp, from old to new, keep up to 100 messages
    this._messages = CBuffer(100);
    // boolean, true if the topic is currently live
    this._subscribed = false;

    // Callbacks
    if (callbacks) {
      this.onData = callbacks.onData;
      this.onMeta = callbacks.onMeta;
      this.onPres = callbacks.onPres;
      // A single info update;
      this.onInfoChange = callbacks.onInfoChange;
      // A single subscription record;
      this.onSubsChange = callbacks.onSubsChange;
      // All subscription records received;
      this.onSubsUpdated = callbacks.onSubsUpdated;
      this.onDeleteTopic = callbacks.onDeleteTopic;
    }
  };

  Topic.prototype.isSubscribed = function() {
    return this._subscribed;
  }

  Topic.prototype._resetSub = function() {
    // clear all caches
  }

  // Called by Tinode when meta.info packet is received.
  Topic.prototype._processInfo = function(info) {
    // Copy parameters from info object to this topic.
    for (var prop in info) {
      if (info.hasOwnProperty(prop) && info[prop]) {
        this[prop] = info[prop];
      }
    }

    if (typeof this.created === "string") {
      this.created = new Date(this.created);
    }
    if (typeof this.updated === "string") {
        this.updated = new Date(this.updated);
    }

    if (this.onInfoChange) {
        this.onInfoChange(info);
    }
  };

  // Called by Tinode when meta.sub is recived.
  Topic.prototype._processSub = function(subs) {
    var tinode = Tinode.getInstance();
    for (var idx in subs) {
      var sub = subs[idx];
      if (sub.user) { // response to get.sub on !me topic does not have .user set
        // Same the object to global cache
        this._cachePutUser(sub.user, sub);
        // Save the reference to user in the topic.
        this._users[sub.user] = sub.user;
      }
    }

    if (this.onSubsChange) {
      for (var idx in subs) {
        this.onSubsChange(subs[idx]);
      }
    }

    if (this.onSubsUpdated) {
      this.onSubsUpdated(Object.keys(this._users));
    }
  };

  // Subscribe to topic
  Topic.prototype.subscribe = function(params) {
    // If the topic is already subscribed, return resolved promise
    if (this._subscribed) {
      return Promise.resolve(this);
    }

    var name = this.name;
    var tinode = Tinode.getInstance();
    // Closure for the promise below.
    var topic = this;
    // Send subscribe message, handle async response
    return tinode.subscribe((name || TOPIC_NEW), params).then(function(ctrl) {
      topic._subscribed = true;
      return topic;
    });
  }

  Topic.prototype.publish = function(data, params) {
    if (!this._subscribed) {
      throw new Error("Cannot publish on inactive topic");
    }
    // Send data
    return Tinode.getInstance().publish(this.name, data, params);
  }

  // Leave topic
  // @unsub: boolean, leave and unsubscribe
  Topic.prototype.leave = function(unsub) {
    // FIXME(gene): It's possible to unsubscribe (unsub==true) from inactive topic.
    if (!this._subscribed && !unsub) {
      throw new Error("Cannot leave inactive topic");
    }
    // Send unsubscribe message, handle async response
    var topic = this;
    return Tinode.getInstance().leave(this.name, unsub).then(function(obj) {
      topic._resetSub();
    });
  }

  Topic.prototype.get = function(what, browse) {
    if (!this._subscribed) {
      throw new Error("Cannot query inactive topic");
    }
    // Send {get} message, return promise.
    return Tinode.getInstance().get(this.name, what, browse);
  }

  Topic.prototype.set = function(params) {
    if (!this._subscribed) {
      throw new Error("Cannot update inactive topic");
    }
    // Send Set message, handle async response
    return Tinode.getInstance().set(topic.name, params);
  }

  // Delete messages
  Topic.prototype.delete = function(params) {
    if (!this._subscribed) {
      throw new Error("Cannot delete messages in inactive topic");
    }
    // Send {del} message, return promise
    return Tinode.getInstance().delMessages(this.name, params);
  }

  Topic.prototype.delTopic = function(params) {
    if (!this._subscribed) {
      throw new Error("Cannot delete inactive topic");
    }

    // Delete topic
    var topic = this;
    var tinode = Tinode.getInstance();
    return tinode.delTopic(this.name).then(function(obj) {
      topic._resetSub();
      if (topic.onDeleteTopic) {
        topic.onDeleteTopic();
      }
    });
  }

  Topic.prototype.userInfo = function(uid) {
    // TODO(gene): handle asynchronous requests

    var user = this._cacheGetUser(uid);
    if (user) {
      return user; // Promise.resolve(user)
    }
    //return Tinode.getInstance().get(uid);
  }

    // Iterate over stored messages. If callback is undefined, use the onData callback.
    // Iteration stops if callback returns true
  Topic.prototype.messages = function(callback, context) {
    var cb = (callback || this.onData);
    this._messages.forEach(cb, context);
  }

  // Process data message
  Topic.prototype._routeData = function(data) {
    this._messages.put(data);
    if (this.onData) {
      this.onData(data);
    }
  }

  // Process metadata message
  Topic.prototype._routeMeta = function(meta) {
    if (meta.info) {
      this._processInfo(meta.info);
    }
    if (meta.sub && meta.sub.length > 0) {
      this._processSub(meta.sub);
    }
    if (this.onMeta) {
      this.onMeta(meta);
    }
  }

  // Process presence change message
  Topic.prototype._routePres = function(pres) {
    if (this.onPres) {
      this.onPres(pres);
    }
  }

  // Reset subscribed state
  // TODO(gene): should it also clear the message cache?
  Topic.prototype._resetSub = function() {
    topic._subscribed = false;
  }

  // Special 'me' topic
  /*
  var TopicMe = function(callbacks) {
    var me = this;
    return new Topic(TOPIC_ME, {
      onData: function(data) {
        if (me.onData) {
          me.onData(data)
        }
      },
      onMeta: function(meta) {
        if (me.onMeta) {
          me.onMeta(meta);
        }
      },
      onPres: function(pres) {
        if (me.onPres) {
          me.onPres(pres);
        }
      },
      onSubsChange: function(sub) {
        if (me.onSubsChange) {
          me.onSubsChange(sub);
        }
      },
      onInfoChange: function(info) {
        if (me.onInfoChange) {
          me.onInfoChange(info);
        }
      }
    });
  }
  */

  // Export for the window object or node; Check that is not already defined.
  if (typeof(environment.Tinode) === 'undefined') {
    environment.Tinode = Tinode.getInstance();
  }

})(this); // 'this' will be window object for the browsers.
