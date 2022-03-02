(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Tinode = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classStaticPrivateMethodGet(receiver, classConstructor, method) { _classCheckPrivateStaticAccess(receiver, classConstructor); return method; }

function _classCheckPrivateStaticAccess(receiver, classConstructor) { if (receiver !== classConstructor) { throw new TypeError("Private static access of wrong provenance"); } }

class AccessMode {
  constructor(acs) {
    if (acs) {
      this.given = typeof acs.given == 'number' ? acs.given : AccessMode.decode(acs.given);
      this.want = typeof acs.want == 'number' ? acs.want : AccessMode.decode(acs.want);
      this.mode = acs.mode ? typeof acs.mode == 'number' ? acs.mode : AccessMode.decode(acs.mode) : this.given & this.want;
    }
  }

  static decode(str) {
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
        continue;
      }

      m0 |= bit;
    }

    return m0;
  }

  static encode(val) {
    if (val === null || val === AccessMode._INVALID) {
      return null;
    } else if (val === AccessMode._NONE) {
      return 'N';
    }

    const bitmask = ['J', 'R', 'W', 'P', 'A', 'S', 'D', 'O'];
    let res = '';

    for (let i = 0; i < bitmask.length; i++) {
      if ((val & 1 << i) != 0) {
        res = res + bitmask[i];
      }
    }

    return res;
  }

  static update(val, upd) {
    if (!upd || typeof upd != 'string') {
      return val;
    }

    let action = upd.charAt(0);

    if (action == '+' || action == '-') {
      let val0 = val;
      const parts = upd.split(/([-+])/);

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
      const val0 = AccessMode.decode(upd);

      if (val0 != AccessMode._INVALID) {
        val = val0;
      }
    }

    return val;
  }

  static diff(a1, a2) {
    a1 = AccessMode.decode(a1);
    a2 = AccessMode.decode(a2);

    if (a1 == AccessMode._INVALID || a2 == AccessMode._INVALID) {
      return AccessMode._INVALID;
    }

    return a1 & ~a2;
  }

  toString() {
    return '{"mode": "' + AccessMode.encode(this.mode) + '", "given": "' + AccessMode.encode(this.given) + '", "want": "' + AccessMode.encode(this.want) + '"}';
  }

  jsonHelper() {
    return {
      mode: AccessMode.encode(this.mode),
      given: AccessMode.encode(this.given),
      want: AccessMode.encode(this.want)
    };
  }

  setMode(m) {
    this.mode = AccessMode.decode(m);
    return this;
  }

  updateMode(u) {
    this.mode = AccessMode.update(this.mode, u);
    return this;
  }

  getMode() {
    return AccessMode.encode(this.mode);
  }

  setGiven(g) {
    this.given = AccessMode.decode(g);
    return this;
  }

  updateGiven(u) {
    this.given = AccessMode.update(this.given, u);
    return this;
  }

  getGiven() {
    return AccessMode.encode(this.given);
  }

  setWant(w) {
    this.want = AccessMode.decode(w);
    return this;
  }

  updateWant(u) {
    this.want = AccessMode.update(this.want, u);
    return this;
  }

  getWant() {
    return AccessMode.encode(this.want);
  }

  getMissing() {
    return AccessMode.encode(this.want & ~this.given);
  }

  getExcessive() {
    return AccessMode.encode(this.given & ~this.want);
  }

  updateAll(val) {
    if (val) {
      this.updateGiven(val.given);
      this.updateWant(val.want);
      this.mode = this.given & this.want;
    }

    return this;
  }

  isOwner(side) {
    return _classStaticPrivateMethodGet(AccessMode, AccessMode, _checkFlag).call(AccessMode, this, side, AccessMode._OWNER);
  }

  isPresencer(side) {
    return _classStaticPrivateMethodGet(AccessMode, AccessMode, _checkFlag).call(AccessMode, this, side, AccessMode._PRES);
  }

  isMuted(side) {
    return !this.isPresencer(side);
  }

  isJoiner(side) {
    return _classStaticPrivateMethodGet(AccessMode, AccessMode, _checkFlag).call(AccessMode, this, side, AccessMode._JOIN);
  }

  isReader(side) {
    return _classStaticPrivateMethodGet(AccessMode, AccessMode, _checkFlag).call(AccessMode, this, side, AccessMode._READ);
  }

  isWriter(side) {
    return _classStaticPrivateMethodGet(AccessMode, AccessMode, _checkFlag).call(AccessMode, this, side, AccessMode._WRITE);
  }

  isApprover(side) {
    return _classStaticPrivateMethodGet(AccessMode, AccessMode, _checkFlag).call(AccessMode, this, side, AccessMode._APPROVE);
  }

  isAdmin(side) {
    return this.isOwner(side) || this.isApprover(side);
  }

  isSharer(side) {
    return this.isAdmin(side) || _classStaticPrivateMethodGet(AccessMode, AccessMode, _checkFlag).call(AccessMode, this, side, AccessMode._SHARE);
  }

  isDeleter(side) {
    return _classStaticPrivateMethodGet(AccessMode, AccessMode, _checkFlag).call(AccessMode, this, side, AccessMode._DELETE);
  }

}

exports.default = AccessMode;

function _checkFlag(val, side, flag) {
  side = side || 'mode';

  if (['given', 'want', 'mode'].includes(side)) {
    return (val[side] & flag) != 0;
  }

  throw new Error("Invalid AccessMode component '".concat(side, "'"));
}

AccessMode._NONE = 0x00;
AccessMode._JOIN = 0x01;
AccessMode._READ = 0x02;
AccessMode._WRITE = 0x04;
AccessMode._PRES = 0x08;
AccessMode._APPROVE = 0x10;
AccessMode._SHARE = 0x20;
AccessMode._DELETE = 0x40;
AccessMode._OWNER = 0x80;
AccessMode._BITMASK = AccessMode._JOIN | AccessMode._READ | AccessMode._WRITE | AccessMode._PRES | AccessMode._APPROVE | AccessMode._SHARE | AccessMode._DELETE | AccessMode._OWNER;
AccessMode._INVALID = 0x100000;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

var _comparator = new WeakMap();

var _unique = new WeakMap();

var _findNearest = new WeakSet();

var _insertSorted = new WeakSet();

class CBuffer {
  constructor(compare_, unique_) {
    _classPrivateMethodInitSpec(this, _insertSorted);

    _classPrivateMethodInitSpec(this, _findNearest);

    _classPrivateFieldInitSpec(this, _comparator, {
      writable: true,
      value: undefined
    });

    _classPrivateFieldInitSpec(this, _unique, {
      writable: true,
      value: false
    });

    _defineProperty(this, "buffer", []);

    _classPrivateFieldSet(this, _comparator, compare_ || ((a, b) => {
      return a === b ? 0 : a < b ? -1 : 1;
    }));

    _classPrivateFieldSet(this, _unique, unique_);
  }

  getAt(at) {
    return this.buffer[at];
  }

  getLast(at) {
    at |= 0;
    return this.buffer.length > at ? this.buffer[this.buffer.length - 1 - at] : undefined;
  }

  put() {
    let insert;

    if (arguments.length == 1 && Array.isArray(arguments[0])) {
      insert = arguments[0];
    } else {
      insert = arguments;
    }

    for (let idx in insert) {
      _classPrivateMethodGet(this, _insertSorted, _insertSorted2).call(this, insert[idx], this.buffer);
    }
  }

  delAt(at) {
    at |= 0;
    let r = this.buffer.splice(at, 1);

    if (r && r.length > 0) {
      return r[0];
    }

    return undefined;
  }

  delRange(since, before) {
    return this.buffer.splice(since, before - since);
  }

  length() {
    return this.buffer.length;
  }

  reset() {
    this.buffer = [];
  }

  forEach(callback, startIdx, beforeIdx, context) {
    startIdx = startIdx | 0;
    beforeIdx = beforeIdx || this.buffer.length;

    for (let i = startIdx; i < beforeIdx; i++) {
      callback.call(context, this.buffer[i], i > startIdx ? this.buffer[i - 1] : undefined, i < beforeIdx - 1 ? this.buffer[i + 1] : undefined, i);
    }
  }

  find(elem, nearest) {
    const {
      idx
    } = _classPrivateMethodGet(this, _findNearest, _findNearest2).call(this, elem, this.buffer, !nearest);

    return idx;
  }

  filter(callback, context) {
    let count = 0;

    for (let i = 0; i < this.buffer.length; i++) {
      if (callback.call(context, this.buffer[i], i)) {
        this.buffer[count] = this.buffer[i];
        count++;
      }
    }

    this.buffer.splice(count);
  }

}

exports.default = CBuffer;

function _findNearest2(elem, arr, exact) {
  let start = 0;
  let end = arr.length - 1;
  let pivot = 0;
  let diff = 0;
  let found = false;

  while (start <= end) {
    pivot = (start + end) / 2 | 0;
    diff = _classPrivateFieldGet(this, _comparator).call(this, arr[pivot], elem);

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

  return {
    idx: diff < 0 ? pivot + 1 : pivot
  };
}

function _insertSorted2(elem, arr) {
  const found = _classPrivateMethodGet(this, _findNearest, _findNearest2).call(this, elem, arr, false);

  const count = found.exact && _classPrivateFieldGet(this, _unique) ? 1 : 0;
  arr.splice(found.idx, count, elem);
  return arr;
}

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VERSION = exports.USER_NEW = exports.TOPIC_SYS = exports.TOPIC_P2P = exports.TOPIC_NEW_CHAN = exports.TOPIC_NEW = exports.TOPIC_ME = exports.TOPIC_GRP = exports.TOPIC_FND = exports.TOPIC_CHAN = exports.PROTOCOL_VERSION = exports.MESSAGE_STATUS_TO_ME = exports.MESSAGE_STATUS_SENT = exports.MESSAGE_STATUS_SENDING = exports.MESSAGE_STATUS_RECEIVED = exports.MESSAGE_STATUS_READ = exports.MESSAGE_STATUS_QUEUED = exports.MESSAGE_STATUS_NONE = exports.MESSAGE_STATUS_FAILED = exports.MESSAGE_STATUS_DEL_RANGE = exports.LOCAL_SEQID = exports.LIBRARY = exports.EXPIRE_PROMISES_TIMEOUT = exports.EXPIRE_PROMISES_PERIOD = exports.DEL_CHAR = exports.DEFAULT_MESSAGES_PAGE = void 0;

var _version = require("../version.json");

const PROTOCOL_VERSION = '0';
exports.PROTOCOL_VERSION = PROTOCOL_VERSION;
const VERSION = _version.version || '0.18';
exports.VERSION = VERSION;
const LIBRARY = 'tinodejs/' + VERSION;
exports.LIBRARY = LIBRARY;
const TOPIC_NEW = 'new';
exports.TOPIC_NEW = TOPIC_NEW;
const TOPIC_NEW_CHAN = 'nch';
exports.TOPIC_NEW_CHAN = TOPIC_NEW_CHAN;
const TOPIC_ME = 'me';
exports.TOPIC_ME = TOPIC_ME;
const TOPIC_FND = 'fnd';
exports.TOPIC_FND = TOPIC_FND;
const TOPIC_SYS = 'sys';
exports.TOPIC_SYS = TOPIC_SYS;
const TOPIC_CHAN = 'chn';
exports.TOPIC_CHAN = TOPIC_CHAN;
const TOPIC_GRP = 'grp;';
exports.TOPIC_GRP = TOPIC_GRP;
const TOPIC_P2P = 'p2p';
exports.TOPIC_P2P = TOPIC_P2P;
const USER_NEW = 'new';
exports.USER_NEW = USER_NEW;
const LOCAL_SEQID = 0xFFFFFFF;
exports.LOCAL_SEQID = LOCAL_SEQID;
const MESSAGE_STATUS_NONE = 0;
exports.MESSAGE_STATUS_NONE = MESSAGE_STATUS_NONE;
const MESSAGE_STATUS_QUEUED = 1;
exports.MESSAGE_STATUS_QUEUED = MESSAGE_STATUS_QUEUED;
const MESSAGE_STATUS_SENDING = 2;
exports.MESSAGE_STATUS_SENDING = MESSAGE_STATUS_SENDING;
const MESSAGE_STATUS_FAILED = 3;
exports.MESSAGE_STATUS_FAILED = MESSAGE_STATUS_FAILED;
const MESSAGE_STATUS_SENT = 4;
exports.MESSAGE_STATUS_SENT = MESSAGE_STATUS_SENT;
const MESSAGE_STATUS_RECEIVED = 5;
exports.MESSAGE_STATUS_RECEIVED = MESSAGE_STATUS_RECEIVED;
const MESSAGE_STATUS_READ = 6;
exports.MESSAGE_STATUS_READ = MESSAGE_STATUS_READ;
const MESSAGE_STATUS_TO_ME = 7;
exports.MESSAGE_STATUS_TO_ME = MESSAGE_STATUS_TO_ME;
const MESSAGE_STATUS_DEL_RANGE = 8;
exports.MESSAGE_STATUS_DEL_RANGE = MESSAGE_STATUS_DEL_RANGE;
const EXPIRE_PROMISES_TIMEOUT = 5000;
exports.EXPIRE_PROMISES_TIMEOUT = EXPIRE_PROMISES_TIMEOUT;
const EXPIRE_PROMISES_PERIOD = 1000;
exports.EXPIRE_PROMISES_PERIOD = EXPIRE_PROMISES_PERIOD;
const DEFAULT_MESSAGES_PAGE = 24;
exports.DEFAULT_MESSAGES_PAGE = DEFAULT_MESSAGES_PAGE;
const DEL_CHAR = '\u2421';
exports.DEL_CHAR = DEL_CHAR;

},{"../version.json":12}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = require("./utils.js");

function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

let WebSocketProvider;
let XHRProvider;
const NETWORK_ERROR = 503;
const NETWORK_ERROR_TEXT = "Connection failed";
const NETWORK_USER = 418;
const NETWORK_USER_TEXT = "Disconnected by client";
const _BOFF_BASE = 2000;
const _BOFF_MAX_ITER = 10;
const _BOFF_JITTER = 0.3;

function makeBaseUrl(host, protocol, version, apiKey) {
  let url = null;

  if (['http', 'https', 'ws', 'wss'].includes(protocol)) {
    url = "".concat(protocol, "://").concat(host);

    if (url.charAt(url.length - 1) !== '/') {
      url += '/';
    }

    url += 'v' + version + '/channels';

    if (['http', 'https'].includes(protocol)) {
      url += '/lp';
    }

    url += '?apikey=' + apiKey;
  }

  return url;
}

var _boffTimer = new WeakMap();

var _boffIteration = new WeakMap();

var _boffClosed = new WeakMap();

var _socket = new WeakMap();

var _log = new WeakSet();

var _boffReconnect = new WeakSet();

var _boffStop = new WeakSet();

var _boffReset = new WeakSet();

var _init_lp = new WeakSet();

var _init_ws = new WeakSet();

class Connection {
  constructor(config, version_, autoreconnect_) {
    _classPrivateMethodInitSpec(this, _init_ws);

    _classPrivateMethodInitSpec(this, _init_lp);

    _classPrivateMethodInitSpec(this, _boffReset);

    _classPrivateMethodInitSpec(this, _boffStop);

    _classPrivateMethodInitSpec(this, _boffReconnect);

    _classPrivateMethodInitSpec(this, _log);

    _classPrivateFieldInitSpec(this, _boffTimer, {
      writable: true,
      value: null
    });

    _classPrivateFieldInitSpec(this, _boffIteration, {
      writable: true,
      value: 0
    });

    _classPrivateFieldInitSpec(this, _boffClosed, {
      writable: true,
      value: false
    });

    _classPrivateFieldInitSpec(this, _socket, {
      writable: true,
      value: null
    });

    _defineProperty(this, "host", void 0);

    _defineProperty(this, "secure", void 0);

    _defineProperty(this, "apiKey", void 0);

    _defineProperty(this, "version", void 0);

    _defineProperty(this, "autoreconnect", void 0);

    _defineProperty(this, "initialized", void 0);

    _defineProperty(this, "onMessage", undefined);

    _defineProperty(this, "onDisconnect", undefined);

    _defineProperty(this, "onOpen", undefined);

    _defineProperty(this, "onAutoreconnectIteration", undefined);

    _defineProperty(this, "logger", undefined);

    this.host = config.host;
    this.secure = config.secure;
    this.apiKey = config.apiKey;
    this.version = version_;
    this.autoreconnect = autoreconnect_;

    if (config.transport === 'lp') {
      _classPrivateMethodGet(this, _init_lp, _init_lp2).call(this);

      this.initialized = 'lp';
    } else if (config.transport === 'ws') {
      _classPrivateMethodGet(this, _init_ws, _init_ws2).call(this);

      this.initialized = 'ws';
    }

    if (!this.initialized) {
      _classPrivateMethodGet(this, _log, _log2).call(this, "Unknown or invalid network transport. Running under Node? Call 'Tinode.setNetworkProviders()'.");

      throw new Error("Unknown or invalid network transport. Running under Node? Call 'Tinode.setNetworkProviders()'.");
    }
  }

  static setNetworkProviders(wsProvider, xhrProvider) {
    WebSocketProvider = wsProvider;
    XHRProvider = xhrProvider;
  }

  connect(host_, force) {
    return Promise.reject(null);
  }

  reconnect(force) {}

  disconnect() {}

  sendText(msg) {}

  isConnected() {
    return false;
  }

  transport() {
    return this.initialized;
  }

  probe() {
    this.sendText('1');
  }

  backoffReset() {
    _classPrivateMethodGet(this, _boffReset, _boffReset2).call(this);
  }

}

exports.default = Connection;

function _log2(text) {
  if (Connection.logger) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    Connection.logger(text, ...args);
  }
}

function _boffReconnect2() {
  clearTimeout(_classPrivateFieldGet(this, _boffTimer));

  const timeout = _BOFF_BASE * (Math.pow(2, _classPrivateFieldGet(this, _boffIteration)) * (1.0 + _BOFF_JITTER * Math.random()));

  _classPrivateFieldSet(this, _boffIteration, _classPrivateFieldGet(this, _boffIteration) >= _BOFF_MAX_ITER ? _classPrivateFieldGet(this, _boffIteration) : _classPrivateFieldGet(this, _boffIteration) + 1);

  if (this.onAutoreconnectIteration) {
    this.onAutoreconnectIteration(timeout);
  }

  _classPrivateFieldSet(this, _boffTimer, setTimeout(() => {
    _classPrivateMethodGet(this, _log, _log2).call(this, "Reconnecting, iter=".concat(_classPrivateFieldGet(this, _boffIteration), ", timeout=").concat(timeout));

    if (!_classPrivateFieldGet(this, _boffClosed)) {
      const prom = this.connect();

      if (this.onAutoreconnectIteration) {
        this.onAutoreconnectIteration(0, prom);
      } else {
        prom.catch(() => {});
      }
    } else if (this.onAutoreconnectIteration) {
      this.onAutoreconnectIteration(-1);
    }
  }, timeout));
}

function _boffStop2() {
  clearTimeout(_classPrivateFieldGet(this, _boffTimer));

  _classPrivateFieldSet(this, _boffTimer, null);
}

function _boffReset2() {
  _classPrivateFieldSet(this, _boffIteration, 0);
}

function _init_lp2() {
  const XDR_UNSENT = 0;
  const XDR_OPENED = 1;
  const XDR_HEADERS_RECEIVED = 2;
  const XDR_LOADING = 3;
  const XDR_DONE = 4;
  let _lpURL = null;
  let _poller = null;
  let _sender = null;

  let lp_sender = url_ => {
    const sender = new XHRProvider();

    sender.onreadystatechange = evt => {
      if (sender.readyState == XDR_DONE && sender.status >= 400) {
        throw new Error("LP sender failed, ".concat(sender.status));
      }
    };

    sender.open('POST', url_, true);
    return sender;
  };

  let lp_poller = (url_, resolve, reject) => {
    let poller = new XHRProvider();
    let promiseCompleted = false;

    poller.onreadystatechange = evt => {
      if (poller.readyState == XDR_DONE) {
        if (poller.status == 201) {
          let pkt = JSON.parse(poller.responseText, _utils.jsonParseHelper);
          _lpURL = url_ + '&sid=' + pkt.ctrl.params.sid;
          poller = lp_poller(_lpURL);
          poller.send(null);

          if (this.onOpen) {
            this.onOpen();
          }

          if (resolve) {
            promiseCompleted = true;
            resolve();
          }

          if (this.autoreconnect) {
            _classPrivateMethodGet(this, _boffStop, _boffStop2).call(this);
          }
        } else if (poller.status < 400) {
          if (this.onMessage) {
            this.onMessage(poller.responseText);
          }

          poller = lp_poller(_lpURL);
          poller.send(null);
        } else {
          if (reject && !promiseCompleted) {
            promiseCompleted = true;
            reject(poller.responseText);
          }

          if (this.onMessage && poller.responseText) {
            this.onMessage(poller.responseText);
          }

          if (this.onDisconnect) {
            const code = poller.status || (_classPrivateFieldGet(this, _boffClosed) ? NETWORK_USER : NETWORK_ERROR);
            const text = poller.responseText || (_classPrivateFieldGet(this, _boffClosed) ? NETWORK_USER_TEXT : NETWORK_ERROR_TEXT);
            this.onDisconnect(new Error(text + ' (' + code + ')'), code);
          }

          poller = null;

          if (!_classPrivateFieldGet(this, _boffClosed) && this.autoreconnect) {
            _classPrivateMethodGet(this, _boffReconnect, _boffReconnect2).call(this);
          }
        }
      }
    };

    poller.open('GET', url_, true);
    return poller;
  };

  this.connect = (host_, force) => {
    _classPrivateFieldSet(this, _boffClosed, false);

    if (_poller) {
      if (!force) {
        return Promise.resolve();
      }

      _poller.onreadystatechange = undefined;

      _poller.abort();

      _poller = null;
    }

    if (host_) {
      this.host = host_;
    }

    return new Promise((resolve, reject) => {
      const url = makeBaseUrl(this.host, this.secure ? 'https' : 'http', this.version, this.apiKey);

      _classPrivateMethodGet(this, _log, _log2).call(this, "Connecting to:", url);

      _poller = lp_poller(url, resolve, reject);

      _poller.send(null);
    }).catch(err => {
      _classPrivateMethodGet(this, _log, _log2).call(this, "LP connection failed:", err);
    });
  };

  this.reconnect = force => {
    _classPrivateMethodGet(this, _boffStop, _boffStop2).call(this);

    this.connect(null, force);
  };

  this.disconnect = () => {
    _classPrivateFieldSet(this, _boffClosed, true);

    _classPrivateMethodGet(this, _boffStop, _boffStop2).call(this);

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

    if (this.onDisconnect) {
      this.onDisconnect(new Error(NETWORK_USER_TEXT + ' (' + NETWORK_USER + ')'), NETWORK_USER);
    }

    _lpURL = null;
  };

  this.sendText = msg => {
    _sender = lp_sender(_lpURL);

    if (_sender && _sender.readyState == XDR_OPENED) {
      _sender.send(msg);
    } else {
      throw new Error("Long poller failed to connect");
    }
  };

  this.isConnected = () => {
    return _poller && true;
  };
}

function _init_ws2() {
  this.connect = (host_, force) => {
    _classPrivateFieldSet(this, _boffClosed, false);

    if (_classPrivateFieldGet(this, _socket)) {
      if (!force && _classPrivateFieldGet(this, _socket).readyState == _classPrivateFieldGet(this, _socket).OPEN) {
        return Promise.resolve();
      }

      _classPrivateFieldGet(this, _socket).close();

      _classPrivateFieldSet(this, _socket, null);
    }

    if (host_) {
      this.host = host_;
    }

    return new Promise((resolve, reject) => {
      const url = makeBaseUrl(this.host, this.secure ? 'wss' : 'ws', this.version, this.apiKey);

      _classPrivateMethodGet(this, _log, _log2).call(this, "Connecting to: ", url);

      const conn = new WebSocketProvider(url);

      conn.onerror = err => {
        reject(err);
      };

      conn.onopen = evt => {
        if (this.autoreconnect) {
          _classPrivateMethodGet(this, _boffStop, _boffStop2).call(this);
        }

        if (this.onOpen) {
          this.onOpen();
        }

        resolve();
      };

      conn.onclose = evt => {
        _classPrivateFieldSet(this, _socket, null);

        if (this.onDisconnect) {
          const code = _classPrivateFieldGet(this, _boffClosed) ? NETWORK_USER : NETWORK_ERROR;
          this.onDisconnect(new Error(_classPrivateFieldGet(this, _boffClosed) ? NETWORK_USER_TEXT : NETWORK_ERROR_TEXT + ' (' + code + ')'), code);
        }

        if (!_classPrivateFieldGet(this, _boffClosed) && this.autoreconnect) {
          _classPrivateMethodGet(this, _boffReconnect, _boffReconnect2).call(this);
        }
      };

      conn.onmessage = evt => {
        if (this.onMessage) {
          this.onMessage(evt.data);
        }
      };

      _classPrivateFieldSet(this, _socket, conn);
    });
  };

  this.reconnect = force => {
    _classPrivateMethodGet(this, _boffStop, _boffStop2).call(this);

    this.connect(null, force);
  };

  this.disconnect = () => {
    _classPrivateFieldSet(this, _boffClosed, true);

    _classPrivateMethodGet(this, _boffStop, _boffStop2).call(this);

    if (!_classPrivateFieldGet(this, _socket)) {
      return;
    }

    _classPrivateFieldGet(this, _socket).close();

    _classPrivateFieldSet(this, _socket, null);
  };

  this.sendText = msg => {
    if (_classPrivateFieldGet(this, _socket) && _classPrivateFieldGet(this, _socket).readyState == _classPrivateFieldGet(this, _socket).OPEN) {
      _classPrivateFieldGet(this, _socket).send(msg);
    } else {
      throw new Error("Websocket is not connected");
    }
  };

  this.isConnected = () => {
    return _classPrivateFieldGet(this, _socket) && _classPrivateFieldGet(this, _socket).readyState == _classPrivateFieldGet(this, _socket).OPEN;
  };
}

Connection.NETWORK_ERROR = NETWORK_ERROR;
Connection.NETWORK_ERROR_TEXT = NETWORK_ERROR_TEXT;
Connection.NETWORK_USER = NETWORK_USER;
Connection.NETWORK_USER_TEXT = NETWORK_USER_TEXT;

},{"./utils.js":11}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classStaticPrivateFieldSpecGet(receiver, classConstructor, descriptor) { _classCheckPrivateStaticAccess(receiver, classConstructor); _classCheckPrivateStaticFieldDescriptor(descriptor, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classCheckPrivateStaticFieldDescriptor(descriptor, action) { if (descriptor === undefined) { throw new TypeError("attempted to " + action + " private static field before its declaration"); } }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

function _classStaticPrivateMethodGet(receiver, classConstructor, method) { _classCheckPrivateStaticAccess(receiver, classConstructor); return method; }

function _classCheckPrivateStaticAccess(receiver, classConstructor) { if (receiver !== classConstructor) { throw new TypeError("Private static access of wrong provenance"); } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

const DB_VERSION = 1;
const DB_NAME = 'tinode-web';
let IDBProvider;

var _onError = new WeakMap();

var _logger = new WeakMap();

var _mapObjects = new WeakSet();

class DB {
  constructor(onError, logger) {
    _classPrivateMethodInitSpec(this, _mapObjects);

    _classPrivateFieldInitSpec(this, _onError, {
      writable: true,
      value: function () {}
    });

    _classPrivateFieldInitSpec(this, _logger, {
      writable: true,
      value: function () {}
    });

    _defineProperty(this, "db", null);

    _defineProperty(this, "disabled", false);

    _classPrivateFieldSet(this, _onError, onError || _classPrivateFieldGet(this, _onError));

    _classPrivateFieldSet(this, _logger, logger || _classPrivateFieldGet(this, _logger));
  }

  initDatabase() {
    return new Promise((resolve, reject) => {
      const req = IDBProvider.open(DB_NAME, DB_VERSION);

      req.onsuccess = event => {
        this.db = event.target.result;
        this.disabled = false;
        resolve(this.db);
      };

      req.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', "failed to initialize", event);

        reject(event.target.error);

        _classPrivateFieldGet(this, _onError).call(this, event.target.error);
      };

      req.onupgradeneeded = function (event) {
        this.db = event.target.result;

        this.db.onerror = function (event) {
          _classPrivateFieldGet(this, _logger).call(this, 'PCache', "failed to create storage", event);

          _classPrivateFieldGet(this, _onError).call(this, event.target.error);
        };

        this.db.createObjectStore('topic', {
          keyPath: 'name'
        });
        this.db.createObjectStore('user', {
          keyPath: 'uid'
        });
        this.db.createObjectStore('subscription', {
          keyPath: ['topic', 'uid']
        });
        this.db.createObjectStore('message', {
          keyPath: ['topic', 'seq']
        });
      };
    });
  }

  deleteDatabase() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const req = IDBProvider.deleteDatabase(DB_NAME);

      req.onblocked = function (event) {
        if (this.db) {
          this.db.close();
        }

        const err = new Error("blocked");

        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'deleteDatabase', err);

        reject(err);
      };

      req.onsuccess = event => {
        this.db = null;
        this.disabled = true;
        resolve(true);
      };

      req.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'deleteDatabase', event.target.error);

        reject(event.target.error);
      };
    });
  }

  isReady() {
    return !!this.db;
  }

  updTopic(topic) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['topic'], 'readwrite');

      trx.oncomplete = event => {
        resolve(event.target.result);
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'updTopic', event.target.error);

        reject(event.target.error);
      };

      const req = trx.objectStore('topic').get(topic.name);

      req.onsuccess = event => {
        trx.objectStore('topic').put(_classStaticPrivateMethodGet(DB, DB, _serializeTopic).call(DB, req.result, topic));
        trx.commit();
      };
    });
  }

  markTopicAsDeleted(name, deleted) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['topic'], 'readwrite');

      trx.oncomplete = event => {
        resolve(event.target.result);
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'markTopicAsDeleted', event.target.error);

        reject(event.target.error);
      };

      const req = trx.objectStore('topic').get(name);

      req.onsuccess = event => {
        const topic = event.target.result;

        if (topic._deleted != deleted) {
          topic._deleted = true;
          trx.objectStore('topic').put(topic);
        }

        trx.commit();
      };
    });
  }

  remTopic(name) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['topic', 'subscription', 'message'], 'readwrite');

      trx.oncomplete = event => {
        resolve(event.target.result);
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'remTopic', event.target.error);

        reject(event.target.error);
      };

      trx.objectStore('topic').delete(IDBKeyRange.only(name));
      trx.objectStore('subscription').delete(IDBKeyRange.bound([name, '-'], [name, '~']));
      trx.objectStore('message').delete(IDBKeyRange.bound([name, 0], [name, Number.MAX_SAFE_INTEGER]));
      trx.commit();
    });
  }

  mapTopics(callback, context) {
    return _classPrivateMethodGet(this, _mapObjects, _mapObjects2).call(this, 'topic', callback, context);
  }

  deserializeTopic(topic, src) {
    _classStaticPrivateMethodGet(DB, DB, _deserializeTopic).call(DB, topic, src);
  }

  updUser(uid, pub) {
    if (arguments.length < 2 || pub === undefined) {
      return;
    }

    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['user'], 'readwrite');

      trx.oncomplete = event => {
        resolve(event.target.result);
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'updUser', event.target.error);

        reject(event.target.error);
      };

      trx.objectStore('user').put({
        uid: uid,
        public: pub
      });
      trx.commit();
    });
  }

  remUser(uid) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['user'], 'readwrite');

      trx.oncomplete = event => {
        resolve(event.target.result);
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'remUser', event.target.error);

        reject(event.target.error);
      };

      trx.objectStore('user').delete(IDBKeyRange.only(uid));
      trx.commit();
    });
  }

  mapUsers(callback, context) {
    return _classPrivateMethodGet(this, _mapObjects, _mapObjects2).call(this, 'user', callback, context);
  }

  getUser(uid) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['user']);

      trx.oncomplete = event => {
        const user = event.target.result;
        resolve({
          user: user.uid,
          public: user.public
        });
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'getUser', event.target.error);

        reject(event.target.error);
      };

      trx.objectStore('user').get(uid);
    });
  }

  updSubscription(topicName, uid, sub) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['subscription'], 'readwrite');

      trx.oncomplete = event => {
        resolve(event.target.result);
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'updSubscription', event.target.error);

        reject(event.target.error);
      };

      trx.objectStore('subscription').get([topicName, uid]).onsuccess = event => {
        trx.objectStore('subscription').put(_classStaticPrivateMethodGet(DB, DB, _serializeSubscription).call(DB, event.target.result, topicName, uid, sub));
        trx.commit();
      };
    });
  }

  mapSubscriptions(topicName, callback, context) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve([]) : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['subscription']);

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'mapSubscriptions', event.target.error);

        reject(event.target.error);
      };

      trx.objectStore('subscription').getAll(IDBKeyRange.bound([topicName, '-'], [topicName, '~'])).onsuccess = event => {
        if (callback) {
          event.target.result.forEach(topic => {
            callback.call(context, topic);
          });
        }

        resolve(event.target.result);
      };
    });
  }

  addMessage(msg) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['message'], 'readwrite');

      trx.onsuccess = event => {
        resolve(event.target.result);
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'addMessage', event.target.error);

        reject(event.target.error);
      };

      trx.objectStore('message').add(_classStaticPrivateMethodGet(DB, DB, _serializeMessage).call(DB, null, msg));
      trx.commit();
    });
  }

  updMessageStatus(topicName, seq, status) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['message'], 'readwrite');

      trx.onsuccess = event => {
        resolve(event.target.result);
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'updMessageStatus', event.target.error);

        reject(event.target.error);
      };

      const req = trx.objectStore('message').get(IDBKeyRange.only([topicName, seq]));

      req.onsuccess = event => {
        const src = req.result || event.target.result;

        if (!src || src._status == status) {
          trx.commit();
          return;
        }

        trx.objectStore('message').put(_classStaticPrivateMethodGet(DB, DB, _serializeMessage).call(DB, src, {
          topic: topicName,
          seq: seq,
          _status: status
        }));
        trx.commit();
      };
    });
  }

  remMessages(topicName, from, to) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      if (!from && !to) {
        from = 0;
        to = Number.MAX_SAFE_INTEGER;
      }

      const range = to > 0 ? IDBKeyRange.bound([topicName, from], [topicName, to], false, true) : IDBKeyRange.only([topicName, from]);
      const trx = this.db.transaction(['message'], 'readwrite');

      trx.onsuccess = event => {
        resolve(event.target.result);
      };

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'remMessages', event.target.error);

        reject(event.target.error);
      };

      trx.objectStore('message').delete(range);
      trx.commit();
    });
  }

  readMessages(topicName, query, callback, context) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve([]) : Promise.reject(new Error("not initialized"));
    }

    return new Promise((resolve, reject) => {
      query = query || {};
      const since = query.since > 0 ? query.since : 0;
      const before = query.before > 0 ? query.before : Number.MAX_SAFE_INTEGER;
      const limit = query.limit | 0;
      const result = [];
      const range = IDBKeyRange.bound([topicName, since], [topicName, before], false, true);
      const trx = this.db.transaction(['message']);

      trx.onerror = event => {
        _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'readMessages', event.target.error);

        reject(event.target.error);
      };

      trx.objectStore('message').openCursor(range, 'prev').onsuccess = event => {
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

  static setDatabaseProvider(idbProvider) {
    IDBProvider = idbProvider;
  }

}

exports.default = DB;

function _mapObjects2(source, callback, context) {
  if (!this.db) {
    return disabled ? Promise.resolve([]) : Promise.reject(new Error("not initialized"));
  }

  return new Promise((resolve, reject) => {
    const trx = this.db.transaction([source]);

    trx.onerror = event => {
      _classPrivateFieldGet(this, _logger).call(this, 'PCache', 'mapObjects', source, event.target.error);

      reject(event.target.error);
    };

    trx.objectStore(source).getAll().onsuccess = event => {
      if (callback) {
        event.target.result.forEach(topic => {
          callback.call(context, topic);
        });
      }

      resolve(event.target.result);
    };
  });
}

function _deserializeTopic(topic, src) {
  _classStaticPrivateFieldSpecGet(DB, DB, _topic_fields).forEach(f => {
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

  topic.seq |= 0;
  topic.read |= 0;
  topic.unread = Math.max(0, topic.seq - topic.read);
}

function _serializeTopic(dst, src) {
  const res = dst || {
    name: src.name
  };

  _classStaticPrivateFieldSpecGet(DB, DB, _topic_fields).forEach(f => {
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

function _serializeSubscription(dst, topicName, uid, sub) {
  const fields = ['updated', 'mode', 'read', 'recv', 'clear', 'lastSeen', 'userAgent'];
  const res = dst || {
    topic: topicName,
    uid: uid
  };
  fields.forEach(f => {
    if (sub.hasOwnProperty(f)) {
      res[f] = sub[f];
    }
  });
  return res;
}

function _serializeMessage(dst, msg) {
  const fields = ['topic', 'seq', 'ts', '_status', 'from', 'head', 'content'];
  const res = dst || {};
  fields.forEach(f => {
    if (msg.hasOwnProperty(f)) {
      res[f] = msg[f];
    }
  });
  return res;
}

var _topic_fields = {
  writable: true,
  value: ['created', 'updated', 'deleted', 'read', 'recv', 'seq', 'clear', 'defacs', 'creds', 'public', 'trusted', 'private', 'touched', '_deleted']
};

},{}],6:[function(require,module,exports){
/**
 * @copyright 2015-2022 Tinode LLC.
 * @summary Minimally rich text representation and formatting for Tinode.
 * @license Apache 2.0
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

const MAX_FORM_ELEMENTS = 8;
const MAX_PREVIEW_ATTACHMENTS = 3;
const MAX_PREVIEW_DATA_SIZE = 64;
const JSON_MIME_TYPE = 'application/json';
const DRAFTY_MIME_TYPE = 'text/x-drafty';
const ALLOWED_ENT_FIELDS = ['act', 'height', 'mime', 'name', 'ref', 'size', 'url', 'val', 'width'];
const INLINE_STYLES = [{
  name: 'ST',
  start: /(?:^|[\W_])(\*)[^\s*]/,
  end: /[^\s*](\*)(?=$|[\W_])/
}, {
  name: 'EM',
  start: /(?:^|\W)(_)[^\s_]/,
  end: /[^\s_](_)(?=$|\W)/
}, {
  name: 'DL',
  start: /(?:^|[\W_])(~)[^\s~]/,
  end: /[^\s~](~)(?=$|[\W_])/
}, {
  name: 'CO',
  start: /(?:^|\W)(`)[^`]/,
  end: /[^`](`)(?=$|\W)/
}];
const FMT_WEIGHT = ['QQ'];
const ENTITY_TYPES = [{
  name: 'LN',
  dataName: 'url',
  pack: function (val) {
    if (!/^[a-z]+:\/\//i.test(val)) {
      val = 'http://' + val;
    }

    return {
      url: val
    };
  },
  re: /(?:(?:https?|ftp):\/\/|www\.|ftp\.)[-A-Z0-9+&@#\/%=~_|$?!:,.]*[A-Z0-9+&@#\/%=~_|$]/ig
}, {
  name: 'MN',
  dataName: 'val',
  pack: function (val) {
    return {
      val: val.slice(1)
    };
  },
  re: /\B@([\p{L}\p{N}][._\p{L}\p{N}]*[\p{L}\p{N}])/ug
}, {
  name: 'HT',
  dataName: 'val',
  pack: function (val) {
    return {
      val: val.slice(1)
    };
  },
  re: /\B#([\p{L}\p{N}][._\p{L}\p{N}]*[\p{L}\p{N}])/ug
}];
const HTML_TAGS = {
  BN: {
    name: 'button',
    isVoid: false
  },
  BR: {
    name: 'br',
    isVoid: true
  },
  CO: {
    name: 'tt',
    isVoid: false
  },
  DL: {
    name: 'del',
    isVoid: false
  },
  EM: {
    name: 'i',
    isVoid: false
  },
  EX: {
    name: '',
    isVoid: true
  },
  FM: {
    name: 'div',
    isVoid: false
  },
  HD: {
    name: '',
    isVoid: false
  },
  HL: {
    name: 'span',
    isVoid: false
  },
  HT: {
    name: 'a',
    isVoid: false
  },
  IM: {
    name: 'img',
    isVoid: false
  },
  LN: {
    name: 'a',
    isVoid: false
  },
  MN: {
    name: 'a',
    isVoid: false
  },
  RW: {
    name: 'div',
    isVoid: false
  },
  QQ: {
    name: 'div',
    isVoid: false
  },
  ST: {
    name: 'b',
    isVoid: false
  }
};

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

const DECORATORS = {
  ST: {
    open: function () {
      return '<b>';
    },
    close: function () {
      return '</b>';
    }
  },
  EM: {
    open: function () {
      return '<i>';
    },
    close: function () {
      return '</i>';
    }
  },
  DL: {
    open: function () {
      return '<del>';
    },
    close: function () {
      return '</del>';
    }
  },
  CO: {
    open: function () {
      return '<tt>';
    },
    close: function () {
      return '</tt>';
    }
  },
  BR: {
    open: function () {
      return '<br/>';
    },
    close: function () {
      return '';
    }
  },
  HD: {
    open: function () {
      return '';
    },
    close: function () {
      return '';
    }
  },
  HL: {
    open: function () {
      return '<span style="color:teal">';
    },
    close: function () {
      return '</span>';
    }
  },
  LN: {
    open: function (data) {
      return '<a href="' + data.url + '">';
    },
    close: function (data) {
      return '</a>';
    },
    props: function (data) {
      return data ? {
        href: data.url,
        target: '_blank'
      } : null;
    }
  },
  MN: {
    open: function (data) {
      return '<a href="#' + data.val + '">';
    },
    close: function (data) {
      return '</a>';
    },
    props: function (data) {
      return data ? {
        id: data.val
      } : null;
    }
  },
  HT: {
    open: function (data) {
      return '<a href="#' + data.val + '">';
    },
    close: function (data) {
      return '</a>';
    },
    props: function (data) {
      return data ? {
        id: data.val
      } : null;
    }
  },
  BN: {
    open: function (data) {
      return '<button>';
    },
    close: function (data) {
      return '</button>';
    },
    props: function (data) {
      return data ? {
        'data-act': data.act,
        'data-val': data.val,
        'data-name': data.name,
        'data-ref': data.ref
      } : null;
    }
  },
  IM: {
    open: function (data) {
      const tmpPreviewUrl = base64toDataUrl(data._tempPreview, data.mime);
      const previewUrl = base64toObjectUrl(data.val, data.mime, Drafty.logger);
      const downloadUrl = data.ref || previewUrl;
      return (data.name ? '<a href="' + downloadUrl + '" download="' + data.name + '">' : '') + '<img src="' + (tmpPreviewUrl || previewUrl) + '"' + (data.width ? ' width="' + data.width + '"' : '') + (data.height ? ' height="' + data.height + '"' : '') + ' border="0" />';
    },
    close: function (data) {
      return data.name ? '</a>' : '';
    },
    props: function (data) {
      if (!data) return null;
      return {
        src: base64toDataUrl(data._tempPreview, data.mime) || data.ref || base64toObjectUrl(data.val, data.mime, Drafty.logger),
        title: data.name,
        alt: data.name,
        'data-width': data.width,
        'data-height': data.height,
        'data-name': data.name,
        'data-size': data.val ? data.val.length * 0.75 | 0 : data.size | 0,
        'data-mime': data.mime
      };
    }
  },
  FM: {
    open: function (data) {
      return '<div>';
    },
    close: function (data) {
      return '</div>';
    }
  },
  RW: {
    open: function (data) {
      return '<div>';
    },
    close: function (data) {
      return '</div>';
    }
  },
  QQ: {
    open: function (data) {
      return '<div>';
    },
    close: function (data) {
      return '</div>';
    },
    props: function (data) {
      if (!data) return null;
      return {};
    }
  }
};

const Drafty = function () {
  this.txt = '';
  this.fmt = [];
  this.ent = [];
};

Drafty.init = function (plainText) {
  if (typeof plainText == 'undefined') {
    plainText = '';
  } else if (typeof plainText != 'string') {
    return null;
  }

  return {
    txt: plainText
  };
};

Drafty.parse = function (content) {
  if (typeof content != 'string') {
    return null;
  }

  const lines = content.split(/\r?\n/);
  const entityMap = [];
  const entityIndex = {};
  const blx = [];
  lines.forEach(line => {
    let spans = [];
    let entities;
    INLINE_STYLES.forEach(tag => {
      spans = spans.concat(spannify(line, tag.start, tag.end, tag.name));
    });
    let block;

    if (spans.length == 0) {
      block = {
        txt: line
      };
    } else {
      spans.sort((a, b) => {
        const diff = a.at - b.at;
        return diff != 0 ? diff : b.end - a.end;
      });
      spans = toSpanTree(spans);
      const chunks = chunkify(line, 0, line.length, spans);
      const drafty = draftify(chunks, 0);
      block = {
        txt: drafty.txt,
        fmt: drafty.fmt
      };
    }

    entities = extractEntities(block.txt);

    if (entities.length > 0) {
      const ranges = [];

      for (let i in entities) {
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
    txt: ''
  };

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
      result.txt += ' ' + block.txt;

      if (block.fmt) {
        result.fmt = result.fmt.concat(block.fmt.map(s => {
          s.at += offset;
          return s;
        }));
      }

      if (block.ent) {
        result.fmt = result.fmt.concat(block.ent.map(s => {
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
};

Drafty.append = function (first, second) {
  if (!first) {
    return second;
  }

  if (!second) {
    return first;
  }

  first.txt = first.txt || '';
  const len = first.txt.length;

  if (typeof second == 'string') {
    first.txt += second;
  } else if (second.txt) {
    first.txt += second.txt;
  }

  if (Array.isArray(second.fmt)) {
    first.fmt = first.fmt || [];

    if (Array.isArray(second.ent)) {
      first.ent = first.ent || [];
    }

    second.fmt.forEach(src => {
      const fmt = {
        at: (src.at | 0) + len,
        len: src.len | 0
      };

      if (src.at == -1) {
        fmt.at = -1;
        fmt.len = 0;
      }

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
};

Drafty.insertImage = function (content, at, imageDesc) {
  content = content || {
    txt: ' '
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: at | 0,
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
    imageDesc.urlPromise.then(url => {
      ex.data.ref = url;
      ex.data._tempPreview = undefined;
      ex.data._processing = undefined;
    }, err => {
      ex.data._processing = undefined;
    });
  }

  content.ent.push(ex);
  return content;
};

Drafty.quote = function (header, uid, body) {
  const quote = Drafty.append(Drafty.appendLineBreak(Drafty.mention(header, uid)), body);
  quote.fmt.push({
    at: 0,
    len: quote.txt.length,
    tp: 'QQ'
  });
  return quote;
};

Drafty.mention = function (name, uid) {
  return {
    txt: name || '',
    fmt: [{
      at: 0,
      len: (name || '').length,
      key: 0
    }],
    ent: [{
      tp: 'MN',
      data: {
        val: uid
      }
    }]
  };
};

Drafty.appendLink = function (content, linkData) {
  content = content || {
    txt: ''
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: content.txt.length,
    len: linkData.txt.length,
    key: content.ent.length
  });
  content.txt += linkData.txt;
  const ex = {
    tp: 'LN',
    data: {
      url: linkData.url
    }
  };
  content.ent.push(ex);
  return content;
};

Drafty.appendImage = function (content, imageDesc) {
  content = content || {
    txt: ''
  };
  content.txt += ' ';
  return Drafty.insertImage(content, content.txt.length - 1, imageDesc);
};

Drafty.attachFile = function (content, attachmentDesc) {
  content = content || {
    txt: ''
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
  };

  if (attachmentDesc.urlPromise) {
    ex.data._processing = true;
    attachmentDesc.urlPromise.then(url => {
      ex.data.ref = url;
      ex.data._processing = undefined;
    }, err => {
      ex.data._processing = undefined;
    });
  }

  content.ent.push(ex);
  return content;
};

Drafty.wrapInto = function (content, style, at, len) {
  if (typeof content == 'string') {
    content = {
      txt: content
    };
  }

  content.fmt = content.fmt || [];
  content.fmt.push({
    at: at || 0,
    len: len || content.txt.length,
    tp: style
  });
  return content;
};

Drafty.wrapAsForm = function (content, at, len) {
  return Drafty.wrapInto(content, 'FM', at, len);
};

Drafty.insertButton = function (content, at, len, name, actionType, actionValue, refUrl) {
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

  if (actionType == 'url' && !refUrl) {
    return null;
  }

  refUrl = '' + refUrl;
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: at | 0,
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
};

Drafty.appendButton = function (content, title, name, actionType, actionValue, refUrl) {
  content = content || {
    txt: ''
  };
  const at = content.txt.length;
  content.txt += title;
  return Drafty.insertButton(content, at, title.length, name, actionType, actionValue, refUrl);
};

Drafty.attachJSON = function (content, data) {
  content = content || {
    txt: ''
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
};

Drafty.appendLineBreak = function (content) {
  content = content || {
    txt: ''
  };
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: content.txt.length,
    len: 1,
    tp: 'BR'
  });
  content.txt += ' ';
  return content;
};

Drafty.UNSAFE_toHTML = function (doc) {
  let tree = draftyToTree(doc);

  const htmlFormatter = function (type, data, values) {
    const tag = DECORATORS[type];
    let result = values ? values.join('') : '';

    if (tag) {
      result = tag.open(data) + result + tag.close(data);
    }

    return result;
  };

  return treeBottomUp(tree, htmlFormatter, 0);
};

Drafty.format = function (original, formatter, context) {
  return treeBottomUp(draftyToTree(original), formatter, 0, [], context);
};

Drafty.shorten = function (original, limit, light) {
  let tree = draftyToTree(original);
  tree = shortenTree(tree, limit, '…');

  if (tree && light) {
    tree = lightEntity(tree);
  }

  return treeToDrafty({}, tree, []);
};

Drafty.forwardedContent = function (original) {
  let tree = draftyToTree(original);

  const rmMention = function (node) {
    if (node.type == 'MN') {
      if (!node.parent || !node.parent.type) {
        return null;
      }
    }

    return node;
  };

  tree = treeTopDown(tree, rmMention);
  tree = lTrim(tree);
  return treeToDrafty({}, tree, []);
};

Drafty.replyContent = function (original, limit) {
  const convMNnQQnBR = function (node) {
    if (node.type == 'QQ') {
      return null;
    } else if (node.type == 'MN') {
      if ((!node.parent || !node.parent.type) && (node.text || '').startsWith('➦')) {
        node.text = '➦';
        delete node.children;
        delete node.data;
      }
    } else if (node.type == 'BR') {
      node.text = ' ';
      delete node.type;
      delete node.children;
    }

    return node;
  };

  let tree = draftyToTree(original);

  if (!tree) {
    return original;
  }

  tree = treeTopDown(tree, convMNnQQnBR);
  tree = attachmentsToEnd(tree, MAX_PREVIEW_ATTACHMENTS);
  tree = shortenTree(tree, limit, '…');
  tree = treeTopDown(tree, node => {
    const data = copyEntData(node.data, true, node.type == 'IM' ? ['val'] : null);

    if (data) {
      node.data = data;
    } else {
      delete node.data;
    }

    return node;
  });
  return treeToDrafty({}, tree, []);
};

Drafty.preview = function (original, limit) {
  let tree = draftyToTree(original);
  tree = attachmentsToEnd(tree, MAX_PREVIEW_ATTACHMENTS);

  const convMNnQQnBR = function (node) {
    if (node.type == 'MN') {
      if ((!node.parent || !node.parent.type) && (node.text || '').startsWith('➦')) {
        node.text = '➦';
        delete node.children;
      }
    } else if (node.type == 'QQ') {
      node.text = ' ';
      delete node.children;
    } else if (node.type == 'BR') {
      node.text = ' ';
      delete node.children;
      delete node.type;
    }

    return node;
  };

  tree = treeTopDown(tree, convMNnQQnBR);
  tree = shortenTree(tree, limit, '…');
  tree = lightEntity(tree);
  return treeToDrafty({}, tree, []);
};

Drafty.toPlainText = function (content) {
  return typeof content == 'string' ? content : content.txt;
};

Drafty.isPlainText = function (content) {
  return typeof content == 'string' || !(content.fmt || content.ent);
};

Drafty.isValid = function (content) {
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
};

Drafty.hasAttachments = function (content) {
  if (!Array.isArray(content.fmt)) {
    return false;
  }

  for (let i in content.fmt) {
    const fmt = content.fmt[i];

    if (fmt && fmt.at < 0) {
      const ent = content.ent[fmt.key | 0];
      return ent && ent.tp == 'EX' && ent.data;
    }
  }

  return false;
};

Drafty.attachments = function (content, callback, context) {
  if (!Array.isArray(content.fmt)) {
    return;
  }

  let i = 0;
  content.fmt.forEach(fmt => {
    if (fmt && fmt.at < 0) {
      const ent = content.ent[fmt.key | 0];

      if (ent && ent.tp == 'EX' && ent.data) {
        callback.call(context, ent.data, i++, 'EX');
      }
    }
  });
};

Drafty.hasEntities = function (content) {
  return content.ent && content.ent.length > 0;
};

Drafty.entities = function (content, callback, context) {
  if (content.ent && content.ent.length > 0) {
    for (let i in content.ent) {
      if (content.ent[i]) {
        callback.call(context, content.ent[i].data, i, content.ent[i].tp);
      }
    }
  }
};

Drafty.sanitizeEntities = function (content) {
  if (content && content.ent && content.ent.length > 0) {
    for (let i in content.ent) {
      const ent = content.ent[i];

      if (ent && ent.data) {
        const data = copyEntData(ent.data);

        if (data) {
          content.ent[i].data = data;
        } else {
          delete content.ent[i].data;
        }
      }
    }
  }

  return content;
};

Drafty.getDownloadUrl = function (entData) {
  let url = null;

  if (entData.mime != JSON_MIME_TYPE && entData.val) {
    url = base64toObjectUrl(entData.val, entData.mime, Drafty.logger);
  } else if (typeof entData.ref == 'string') {
    url = entData.ref;
  }

  return url;
};

Drafty.isProcessing = function (entData) {
  return !!entData._processing;
};

Drafty.getPreviewUrl = function (entData) {
  return entData.val ? base64toObjectUrl(entData.val, entData.mime, Drafty.logger) : null;
};

Drafty.getEntitySize = function (entData) {
  return entData.size ? entData.size : entData.val ? entData.val.length * 0.75 | 0 : 0;
};

Drafty.getEntityMimeType = function (entData) {
  return entData.mime || 'text/plain';
};

Drafty.tagName = function (style) {
  return style ? HTML_TAGS[style] ? HTML_TAGS[style].name : '_UNKN' : undefined;
};

Drafty.attrValue = function (style, data) {
  if (data && DECORATORS[style]) {
    return DECORATORS[style].props(data);
  }

  return undefined;
};

Drafty.getContentType = function () {
  return DRAFTY_MIME_TYPE;
};

function chunkify(line, start, end, spans) {
  const chunks = [];

  if (spans.length == 0) {
    return [];
  }

  for (let i in spans) {
    const span = spans[i];

    if (span.at > start) {
      chunks.push({
        txt: line.slice(start, span.at)
      });
    }

    const chunk = {
      tp: span.tp
    };
    const chld = chunkify(line, span.at + 1, span.end, span.children);

    if (chld.length > 0) {
      chunk.children = chld;
    } else {
      chunk.txt = span.txt;
    }

    chunks.push(chunk);
    start = span.end + 1;
  }

  if (start < end) {
    chunks.push({
      txt: line.slice(start, end)
    });
  }

  return chunks;
}

function spannify(original, re_start, re_end, type) {
  const result = [];
  let index = 0;
  let line = original.slice(0);

  while (line.length > 0) {
    const start = re_start.exec(line);

    if (start == null) {
      break;
    }

    let start_offset = start['index'] + start[0].lastIndexOf(start[1]);
    line = line.slice(start_offset + 1);
    start_offset += index;
    index = start_offset + 1;
    const end = re_end ? re_end.exec(line) : null;

    if (end == null) {
      break;
    }

    let end_offset = end['index'] + end[0].indexOf(end[1]);
    line = line.slice(end_offset + 1);
    end_offset += index;
    index = end_offset + 1;
    result.push({
      txt: original.slice(start_offset + 1, end_offset),
      children: [],
      at: start_offset,
      end: end_offset,
      tp: type
    });
  }

  return result;
}

function toSpanTree(spans) {
  if (spans.length == 0) {
    return [];
  }

  const tree = [spans[0]];
  let last = spans[0];

  for (let i = 1; i < spans.length; i++) {
    if (spans[i].at > last.end) {
      tree.push(spans[i]);
      last = spans[i];
    } else if (spans[i].end <= last.end) {
      last.children.push(spans[i]);
    }
  }

  for (let i in tree) {
    tree[i].children = toSpanTree(tree[i].children);
  }

  return tree;
}

function draftyToTree(doc) {
  if (!doc) {
    return null;
  }

  doc = typeof doc == 'string' ? {
    txt: doc
  } : doc;
  let {
    txt,
    fmt,
    ent
  } = doc;
  txt = txt || '';

  if (!Array.isArray(ent)) {
    ent = [];
  }

  if (!Array.isArray(fmt) || fmt.length == 0) {
    if (ent.length == 0) {
      return {
        text: txt
      };
    }

    fmt = [{
      at: 0,
      len: 0,
      key: 0
    }];
  }

  const spans = [];
  const attachments = [];
  fmt.forEach(span => {
    if (!span || typeof span != 'object') {
      return;
    }

    if (!['undefined', 'number'].includes(typeof span.at)) {
      return;
    }

    if (!['undefined', 'number'].includes(typeof span.len)) {
      return;
    }

    let at = span.at | 0;
    let len = span.len | 0;

    if (len < 0) {
      return;
    }

    let key = span.key || 0;

    if (ent.length > 0 && (typeof key != 'number' || key < 0 || key >= ent.length)) {
      return;
    }

    if (at <= -1) {
      attachments.push({
        start: -1,
        end: 0,
        key: key
      });
      return;
    } else if (at + len > txt.length) {
      return;
    }

    if (!span.tp) {
      if (ent.length > 0 && typeof ent[key] == 'object') {
        spans.push({
          start: at,
          end: at + len,
          key: key
        });
      }
    } else {
      spans.push({
        type: span.tp,
        start: at,
        end: at + len
      });
    }
  });
  spans.sort((a, b) => {
    let diff = a.start - b.start;

    if (diff != 0) {
      return diff;
    }

    diff = b.end - a.end;

    if (diff != 0) {
      return diff;
    }

    return FMT_WEIGHT.indexOf(b.type) - FMT_WEIGHT.indexOf(a.type);
  });

  if (attachments.length > 0) {
    spans.push(...attachments);
  }

  spans.forEach(span => {
    if (ent.length > 0 && !span.type && ent[span.key] && typeof ent[span.key] == 'object') {
      span.type = ent[span.key].tp;
      span.data = ent[span.key].data;
    }

    if (!span.type) {
      span.type = 'HD';
    }
  });
  let tree = spansToTree({}, txt, 0, txt.length, spans);

  const flatten = function (node) {
    if (Array.isArray(node.children) && node.children.length == 1) {
      const child = node.children[0];

      if (!node.type) {
        const parent = node.parent;
        node = child;
        node.parent = parent;
      } else if (!child.type && !child.children) {
        node.text = child.text;
        delete node.children;
      }
    }

    return node;
  };

  tree = treeTopDown(tree, flatten);
  return tree;
}

function addNode(parent, n) {
  if (!n) {
    return parent;
  }

  if (!parent.children) {
    parent.children = [];
  }

  if (parent.text) {
    parent.children.push({
      text: parent.text,
      parent: parent
    });
    delete parent.text;
  }

  n.parent = parent;
  parent.children.push(n);
  return parent;
}

function spansToTree(parent, text, start, end, spans) {
  if (!spans || spans.length == 0) {
    if (start < end) {
      addNode(parent, {
        text: text.substring(start, end)
      });
    }

    return parent;
  }

  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];

    if (span.start < 0 && span.type == 'EX') {
      addNode(parent, {
        type: span.type,
        data: span.data,
        key: span.key,
        att: true
      });
      continue;
    }

    if (start < span.start) {
      addNode(parent, {
        text: text.substring(start, span.start)
      });
      start = span.start;
    }

    const subspans = [];

    while (i < spans.length - 1) {
      const inner = spans[i + 1];

      if (inner.start < 0) {
        break;
      } else if (inner.start < span.end) {
        if (inner.end <= span.end) {
          const tag = HTML_TAGS[inner.tp] || {};

          if (inner.start < inner.end || tag.isVoid) {
            subspans.push(inner);
          }
        }

        i++;
      } else {
        break;
      }
    }

    addNode(parent, spansToTree({
      type: span.type,
      data: span.data,
      key: span.key
    }, text, start, span.end, subspans));
    start = span.end;
  }

  if (start < end) {
    addNode(parent, {
      text: text.substring(start, end)
    });
  }

  return parent;
}

function treeToDrafty(doc, tree, keymap) {
  if (!tree) {
    return doc;
  }

  doc.txt = doc.txt || '';
  const start = doc.txt.length;

  if (tree.text) {
    doc.txt += tree.text;
  } else if (Array.isArray(tree.children)) {
    tree.children.forEach(c => {
      treeToDrafty(doc, c, keymap);
    });
  }

  if (tree.type) {
    const len = doc.txt.length - start;
    doc.fmt = doc.fmt || [];

    if (Object.keys(tree.data || {}).length > 0) {
      doc.ent = doc.ent || [];
      const newKey = typeof keymap[tree.key] == 'undefined' ? doc.ent.length : keymap[tree.key];
      keymap[tree.key] = newKey;
      doc.ent[newKey] = {
        tp: tree.type,
        data: tree.data
      };

      if (tree.att) {
        doc.fmt.push({
          at: -1,
          len: 0,
          key: newKey
        });
      } else {
        doc.fmt.push({
          at: start,
          len: len,
          key: newKey
        });
      }
    } else {
      doc.fmt.push({
        tp: tree.type,
        at: start,
        len: len
      });
    }
  }

  return doc;
}

function treeTopDown(src, transformer, context) {
  if (!src) {
    return null;
  }

  let dst = transformer.call(context, src);

  if (!dst || !dst.children) {
    return dst;
  }

  const children = [];

  for (let i in dst.children) {
    let n = dst.children[i];

    if (n) {
      n = treeTopDown(n, transformer, context);

      if (n) {
        children.push(n);
      }
    }
  }

  if (children.length == 0) {
    dst.children = null;
  } else {
    dst.children = children;
  }

  return dst;
}

function treeBottomUp(src, formatter, index, stack, context) {
  if (!src) {
    return null;
  }

  if (stack && src.type) {
    stack.push(src.type);
  }

  let values = [];

  for (let i in src.children) {
    const n = treeBottomUp(src.children[i], formatter, i, stack, context);

    if (n) {
      values.push(n);
    }
  }

  if (values.length == 0) {
    if (src.text) {
      values = [src.text];
    } else {
      values = null;
    }
  }

  if (stack && src.type) {
    stack.pop();
  }

  return formatter.call(context, src.type, src.data, values, index, stack);
}

function shortenTree(tree, limit, tail) {
  if (!tree) {
    return null;
  }

  if (tail) {
    limit -= tail.length;
  }

  const shortener = function (node) {
    if (limit <= -1) {
      return null;
    }

    if (node.att) {
      return node;
    }

    if (limit == 0) {
      node.text = tail;
      limit = -1;
    } else if (node.text) {
      const len = node.text.length;

      if (len > limit) {
        node.text = node.text.substring(0, limit) + tail;
        limit = -1;
      } else {
        limit -= len;
      }
    }

    return node;
  };

  return treeTopDown(tree, shortener);
}

function lightEntity(tree) {
  const lightCopy = function (node) {
    const data = copyEntData(node.data, true);

    if (data) {
      node.data = data;
    } else {
      delete node.data;
    }

    return node;
  };

  return treeTopDown(tree, lightCopy);
}

function lTrim(tree) {
  if (tree.type == 'BR') {
    tree = null;
  } else if (tree.text) {
    if (!tree.type) {
      tree.text = tree.text.trimStart();

      if (!tree.text) {
        tree = null;
      }
    }
  } else if (tree.children && tree.children.length > 0) {
    const c = lTrim(tree.children[0]);

    if (c) {
      tree.children[0] = c;
    } else {
      tree.children.shift();

      if (!tree.type && tree.children.length == 0) {
        tree = null;
      }
    }
  }

  return tree;
}

function attachmentsToEnd(tree, limit) {
  if (!tree) {
    return null;
  }

  if (tree.att) {
    tree.text = ' ';
    delete tree.att;
    delete tree.children;
  } else if (tree.children) {
    const attachments = [];
    const children = [];

    for (let i in tree.children) {
      const c = tree.children[i];

      if (c.att) {
        if (attachments.length == limit) {
          continue;
        }

        if (c.data['mime'] == JSON_MIME_TYPE) {
          continue;
        }

        delete c.att;
        delete c.children;
        c.text = ' ';
        attachments.push(c);
      } else {
        children.push(c);
      }
    }

    tree.children = children.concat(attachments);
  }

  return tree;
}

function extractEntities(line) {
  let match;
  let extracted = [];
  ENTITY_TYPES.forEach(entity => {
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

  extracted.sort((a, b) => {
    return a.offset - b.offset;
  });
  let idx = -1;
  extracted = extracted.filter(el => {
    const result = el.offset > idx;
    idx = el.offset + el.len;
    return result;
  });
  return extracted;
}

function draftify(chunks, startAt) {
  let plain = '';
  let ranges = [];

  for (let i in chunks) {
    const chunk = chunks[i];

    if (!chunk.txt) {
      const drafty = draftify(chunk.children, plain.length + startAt);
      chunk.txt = drafty.txt;
      ranges = ranges.concat(drafty.fmt);
    }

    if (chunk.tp) {
      ranges.push({
        at: plain.length + startAt,
        len: chunk.txt.length,
        tp: chunk.tp
      });
    }

    plain += chunk.txt;
  }

  return {
    txt: plain,
    fmt: ranges
  };
}

function copyEntData(data, light, allow) {
  if (data && Object.entries(data).length > 0) {
    allow = allow || [];
    const dc = {};
    ALLOWED_ENT_FIELDS.forEach(key => {
      if (data[key]) {
        if (light && !allow.includes(key) && (typeof data[key] == 'string' || Array.isArray(data[key])) && data[key].length > MAX_PREVIEW_DATA_SIZE) {
          return;
        }

        if (typeof data[key] == 'object') {
          return;
        }

        dc[key] = data[key];
      }
    });

    if (Object.entries(dc).length != 0) {
      return dc;
    }
  }

  return null;
}

if (typeof module != 'undefined') {
  module.exports = Drafty;
}

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = require("./utils.js");

let XHRProvider;

class LargeFileHelper {
  constructor(tinode, version) {
    this._tinode = tinode;
    this._version = version;
    this._apiKey = tinode._apiKey;
    this._authToken = tinode.getAuthToken();
    this._reqId = tinode.getNextUniqueId();
    this.xhr = new XHRProvider();
    this.toResolve = null;
    this.toReject = null;
    this.onProgress = null;
    this.onSuccess = null;
    this.onFailure = null;
  }

  uploadWithBaseUrl(baseUrl, data, avatarFor, onProgress, onSuccess, onFailure) {
    if (!this._authToken) {
      throw new Error("Must authenticate first");
    }

    const instance = this;
    let url = "/v".concat(this._version, "/file/u/");

    if (baseUrl) {
      let base = baseUrl;

      if (base.endsWith('/')) {
        base = base.slice(0, -1);
      }

      if (base.startsWith('http://') || base.startsWith('https://')) {
        url = base + url;
      } else {
        throw new Error("Invalid base URL '".concat(baseUrl, "'"));
      }
    }

    this.xhr.open('POST', url, true);
    this.xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    this.xhr.setRequestHeader('X-Tinode-Auth', "Token ".concat(this._authToken.token));
    const result = new Promise((resolve, reject) => {
      this.toResolve = resolve;
      this.toReject = reject;
    });
    this.onProgress = onProgress;
    this.onSuccess = onSuccess;
    this.onFailure = onFailure;

    this.xhr.upload.onprogress = e => {
      if (e.lengthComputable && instance.onProgress) {
        instance.onProgress(e.loaded / e.total);
      }
    };

    this.xhr.onload = function () {
      let pkt;

      try {
        pkt = JSON.parse(this.response, _utils.jsonParseHelper);
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
          instance.toReject(new Error("".concat(pkt.ctrl.text, " (").concat(pkt.ctrl.code, ")")));
        }

        if (instance.onFailure) {
          instance.onFailure(pkt.ctrl);
        }
      } else {
        instance._tinode.logger("ERROR: Unexpected server response status", this.status, this.response);
      }
    };

    this.xhr.onerror = function (e) {
      if (instance.toReject) {
        instance.toReject(new Error("failed"));
      }

      if (instance.onFailure) {
        instance.onFailure(null);
      }
    };

    this.xhr.onabort = function (e) {
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
      form.set('id', this._reqId);

      if (avatarFor) {
        form.set('topic', avatarFor);
      }

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
  }

  upload(data, avatarFor, onProgress, onSuccess, onFailure) {
    const baseUrl = (this._tinode._secure ? 'https://' : 'http://') + this._tinode._host;
    return this.uploadWithBaseUrl(baseUrl, data, avatarFor, onProgress, onSuccess, onFailure);
  }

  download(relativeUrl, filename, mimetype, onProgress, onError) {
    if (!Tinode.isRelativeURL(relativeUrl)) {
      if (onError) {
        onError("The URL '".concat(relativeUrl, "' must be relative, not absolute"));
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
    this.xhr.open('GET', relativeUrl, true);
    this.xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    this.xhr.setRequestHeader('X-Tinode-Auth', 'Token ' + this._authToken.token);
    this.xhr.responseType = 'blob';
    this.onProgress = onProgress;

    this.xhr.onprogress = function (e) {
      if (instance.onProgress) {
        instance.onProgress(e.loaded);
      }
    };

    const result = new Promise((resolve, reject) => {
      this.toResolve = resolve;
      this.toReject = reject;
    });

    this.xhr.onload = function () {
      if (this.status == 200) {
        const link = document.createElement('a');
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
        const reader = new FileReader();

        reader.onload = function () {
          try {
            const pkt = JSON.parse(this.result, _utils.jsonParseHelper);
            instance.toReject(new Error("".concat(pkt.ctrl.text, " (").concat(pkt.ctrl.code, ")")));
          } catch (err) {
            instance._tinode.logger("ERROR: Invalid server response in LargeFileHelper", this.result);

            instance.toReject(err);
          }
        };

        reader.readAsText(this.response);
      }
    };

    this.xhr.onerror = function (e) {
      if (instance.toReject) {
        instance.toReject(new Error("failed"));
      }
    };

    this.xhr.onabort = function () {
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
  }

  cancel() {
    if (this.xhr && this.xhr.readyState < 4) {
      this.xhr.abort();
    }
  }

  getId() {
    return this._reqId;
  }

  static setNetworkProvider(xhrProvider) {
    XHRProvider = xhrProvider;
  }

}

exports.default = LargeFileHelper;

},{"./utils.js":11}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

var _get_desc_ims = new WeakSet();

var _get_subs_ims = new WeakSet();

class MetaGetBuilder {
  constructor(parent) {
    _classPrivateMethodInitSpec(this, _get_subs_ims);

    _classPrivateMethodInitSpec(this, _get_desc_ims);

    this.topic = parent;
    this.what = {};
  }

  withData(since, before, limit) {
    this.what['data'] = {
      since: since,
      before: before,
      limit: limit
    };
    return this;
  }

  withLaterData(limit) {
    return this.withData(this.topic._maxSeq > 0 ? this.topic._maxSeq + 1 : undefined, undefined, limit);
  }

  withEarlierData(limit) {
    return this.withData(undefined, this.topic._minSeq > 0 ? this.topic._minSeq : undefined, limit);
  }

  withDesc(ims) {
    this.what['desc'] = {
      ims: ims
    };
    return this;
  }

  withLaterDesc() {
    return this.withDesc(_classPrivateMethodGet(this, _get_desc_ims, _get_desc_ims2).call(this));
  }

  withSub(ims, limit, userOrTopic) {
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
  }

  withOneSub(ims, userOrTopic) {
    return this.withSub(ims, undefined, userOrTopic);
  }

  withLaterOneSub(userOrTopic) {
    return this.withOneSub(this.topic._lastSubsUpdate, userOrTopic);
  }

  withLaterSub(limit) {
    return this.withSub(_classPrivateMethodGet(this, _get_subs_ims, _get_subs_ims2).call(this), limit);
  }

  withTags() {
    this.what['tags'] = true;
    return this;
  }

  withCred() {
    if (this.topic.getType() == 'me') {
      this.what['cred'] = true;
    } else {
      this.topic._tinode.logger("ERROR: Invalid topic type for MetaGetBuilder:withCreds", this.topic.getType());
    }

    return this;
  }

  withDel(since, limit) {
    if (since || limit) {
      this.what['del'] = {
        since: since,
        limit: limit
      };
    }

    return this;
  }

  withLaterDel(limit) {
    return this.withDel(this.topic._maxSeq > 0 ? this.topic._maxDel + 1 : undefined, limit);
  }

  extract(what) {
    return this.what[what];
  }

  build() {
    const what = [];
    let params = {};
    ['data', 'sub', 'desc', 'tags', 'cred', 'del'].map(key => {
      if (this.what.hasOwnProperty(key)) {
        what.push(key);

        if (Object.getOwnPropertyNames(this.what[key]).length > 0) {
          params[key] = this.what[key];
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

}

exports.default = MetaGetBuilder;

function _get_desc_ims2() {
  return this.topic.updated;
}

function _get_subs_ims2() {
  if (this.topic.isP2PType()) {
    return _classPrivateMethodGet(this, _get_desc_ims, _get_desc_ims2).call(this);
  }

  return this.topic._lastSubsUpdate;
}

},{}],9:[function(require,module,exports){
(function (global){(function (){
/**
 * @file SDK to connect to Tinode chat server.
 * See <a href="https://github.com/tinode/webapp">https://github.com/tinode/webapp</a> for real-life usage.
 *
 * @copyright 2015-2022 Tinode LLC.
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.18
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
 *  const tinode = new Tinode(config, () => {
 *    // Called on init completion.
 *  });
 *  tinode.enableLogging(true);
 *  tinode.onDisconnect = (err) => {
 *    // Handle disconnect.
 *  };
 *  // Connect to the server.
 *  tinode.connect('https://example.com/').then(() => {
 *    // Connected. Login now.
 *    return tinode.loginBasic(login, password);
 *  }).then((ctrl) => {
 *    // Logged in fine, attach callbacks, subscribe to 'me'.
 *    const me = tinode.getMeTopic();
 *    me.onMetaDesc = function(meta) { ... };
 *    // Subscribe, fetch topic description and the list of contacts.
 *    me.subscribe({get: {desc: {}, sub: {}}});
 *  }).catch((err) => {
 *    // Login or subscription failed, do something.
 *    ...
 *  });
 *  ...
 * </script>
 * </body>
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Drafty", {
  enumerable: true,
  get: function () {
    return _drafty.default;
  }
});
exports.default = void 0;

var _accessMode = _interopRequireDefault(require("./access-mode.js"));

var Const = _interopRequireWildcard(require("./config.js"));

var _connection = _interopRequireDefault(require("./connection.js"));

var _db = _interopRequireDefault(require("./db.js"));

var _drafty = _interopRequireDefault(require("./drafty.js"));

var _largeFile = _interopRequireDefault(require("./large-file.js"));

var _topic = require("./topic.js");

var _utils = require("./utils.js");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

let WebSocketProvider;

if (typeof WebSocket != 'undefined') {
  WebSocketProvider = WebSocket;
}

let XHRProvider;

if (typeof XMLHttpRequest != 'undefined') {
  XHRProvider = XMLHttpRequest;
}

let IndexedDBProvider;

if (typeof indexedDB != 'undefined') {
  IndexedDBProvider = indexedDB;
}

initForNonBrowserApp();

function initForNonBrowserApp() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  if (typeof btoa == 'undefined') {
    global.btoa = function () {
      let input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
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
    global.atob = function () {
      let input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      let str = input.replace(/=+$/, '');
      let output = '';

      if (str.length % 4 == 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
      }

      for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
      }

      return output;
    };
  }

  if (typeof window == 'undefined') {
    global.window = {
      WebSocket: WebSocketProvider,
      XMLHttpRequest: XHRProvider,
      indexedDB: IndexedDBProvider,
      URL: {
        createObjectURL: function () {
          throw new Error("Unable to use URL.createObjectURL in a non-browser application");
        }
      }
    };
  }

  _connection.default.setNetworkProviders(WebSocketProvider, XHRProvider);

  _largeFile.default.setNetworkProvider(XHRProvider);

  _db.default.setDatabaseProvider(IndexedDBProvider);
}

function detectTransport() {
  if (typeof window == 'object') {
    if (window['WebSocket']) {
      return 'ws';
    } else if (window['XMLHttpRequest']) {
      return 'lp';
    }
  }

  return null;
}

function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}

function jsonBuildHelper(key, val) {
  if (val instanceof Date) {
    val = (0, _utils.rfc3339DateString)(val);
  } else if (val instanceof _accessMode.default) {
    val = val.jsonHelper();
  } else if (val === undefined || val === null || val === false || Array.isArray(val) && val.length == 0 || typeof val == 'object' && Object.keys(val).length == 0) {
    return undefined;
  }

  return val;
}

;

function jsonLoggerHelper(key, val) {
  if (typeof val == 'string' && val.length > 128) {
    return '<' + val.length + ', bytes: ' + val.substring(0, 12) + '...' + val.substring(val.length - 12) + '>';
  }

  return jsonBuildHelper(key, val);
}

;

function getBrowserInfo(ua, product) {
  ua = ua || '';
  let reactnative = '';

  if (/reactnative/i.test(product)) {
    reactnative = 'ReactNative; ';
  }

  let result;
  ua = ua.replace(' (KHTML, like Gecko)', '');
  let m = ua.match(/(AppleWebKit\/[.\d]+)/i);

  if (m) {
    const priority = ['edg', 'chrome', 'safari', 'mobile', 'version'];
    let tmp = ua.substr(m.index + m[0].length).split(' ');
    let tokens = [];
    let version;

    for (let i = 0; i < tmp.length; i++) {
      let m2 = /([\w.]+)[\/]([\.\d]+)/.exec(tmp[i]);

      if (m2) {
        tokens.push([m2[1], m2[2], priority.findIndex(e => {
          return m2[1].toLowerCase().startsWith(e);
        })]);

        if (m2[1] == 'Version') {
          version = m2[2];
        }
      }
    }

    tokens.sort((a, b) => {
      return a[2] - b[2];
    });

    if (tokens.length > 0) {
      if (tokens[0][0].toLowerCase().startsWith('edg')) {
        tokens[0][0] = 'Edge';
      } else if (tokens[0][0] == 'OPR') {
        tokens[0][0] = 'Opera';
      } else if (tokens[0][0] == 'Safari' && version) {
        tokens[0][1] = version;
      }

      result = tokens[0][0] + '/' + tokens[0][1];
    } else {
      result = m[1];
    }
  } else if (/firefox/i.test(ua)) {
    m = /Firefox\/([.\d]+)/g.exec(ua);

    if (m) {
      result = 'Firefox/' + m[1];
    } else {
      result = 'Firefox/?';
    }
  } else {
    m = /([\w.]+)\/([.\d]+)/.exec(ua);

    if (m) {
      result = m[1] + '/' + m[2];
    } else {
      m = ua.split(' ');
      result = m[0];
    }
  }

  m = result.split('/');

  if (m.length > 1) {
    const v = m[1].split('.');
    const minor = v[1] ? '.' + v[1].substr(0, 2) : '';
    result = "".concat(m[0], "/").concat(v[0]).concat(minor);
  }

  return reactnative + result;
}

var _logger = new WeakSet();

var _makePromise = new WeakSet();

var _execPromise = new WeakSet();

var _send = new WeakSet();

var _dispatchMessage = new WeakSet();

var _connectionOpen = new WeakSet();

var _disconnected = new WeakSet();

var _getUserAgent = new WeakSet();

var _initPacket = new WeakSet();

var _cachePut = new WeakSet();

var _cacheGet = new WeakSet();

var _cacheDel = new WeakSet();

var _cacheMap = new WeakSet();

var _attachCacheToTopic = new WeakSet();

var _loginSuccessful = new WeakSet();

class Tinode {
  constructor(config, onComplete) {
    var _this = this;

    _classPrivateMethodInitSpec(this, _loginSuccessful);

    _classPrivateMethodInitSpec(this, _attachCacheToTopic);

    _classPrivateMethodInitSpec(this, _cacheMap);

    _classPrivateMethodInitSpec(this, _cacheDel);

    _classPrivateMethodInitSpec(this, _cacheGet);

    _classPrivateMethodInitSpec(this, _cachePut);

    _classPrivateMethodInitSpec(this, _initPacket);

    _classPrivateMethodInitSpec(this, _getUserAgent);

    _classPrivateMethodInitSpec(this, _disconnected);

    _classPrivateMethodInitSpec(this, _connectionOpen);

    _classPrivateMethodInitSpec(this, _dispatchMessage);

    _classPrivateMethodInitSpec(this, _send);

    _classPrivateMethodInitSpec(this, _execPromise);

    _classPrivateMethodInitSpec(this, _makePromise);

    _classPrivateMethodInitSpec(this, _logger);

    _defineProperty(this, "_host", void 0);

    _defineProperty(this, "_secure", void 0);

    _defineProperty(this, "_appName", void 0);

    _defineProperty(this, "_apiKey", void 0);

    _defineProperty(this, "_browser", '');

    _defineProperty(this, "_platform", void 0);

    _defineProperty(this, "_hwos", 'undefined');

    _defineProperty(this, "_humanLanguage", 'xx');

    _defineProperty(this, "_loggingEnabled", false);

    _defineProperty(this, "_trimLongStrings", false);

    _defineProperty(this, "_myUID", null);

    _defineProperty(this, "_authenticated", false);

    _defineProperty(this, "_login", null);

    _defineProperty(this, "_authToken", null);

    _defineProperty(this, "_inPacketCount", 0);

    _defineProperty(this, "_messageId", Math.floor(Math.random() * 0xFFFF + 0xFFFF));

    _defineProperty(this, "_serverInfo", null);

    _defineProperty(this, "_deviceToken", null);

    _defineProperty(this, "_pendingPromises", {});

    _defineProperty(this, "_expirePromises", null);

    _defineProperty(this, "_connection", null);

    _defineProperty(this, "_persist", false);

    _defineProperty(this, "_db", null);

    _defineProperty(this, "_cache", {});

    _defineProperty(this, "onWebsocketOpen", undefined);

    _defineProperty(this, "onConnect", undefined);

    _defineProperty(this, "onDisconnect", undefined);

    _defineProperty(this, "onLogin", undefined);

    _defineProperty(this, "onCtrlMessage", undefined);

    _defineProperty(this, "onDataMessage", undefined);

    _defineProperty(this, "onPresMessage", undefined);

    _defineProperty(this, "onMessage", undefined);

    _defineProperty(this, "onRawMessage", undefined);

    _defineProperty(this, "onNetworkProbe", undefined);

    _defineProperty(this, "onAutoreconnectIteration", undefined);

    this._host = config.host;
    this._secure = config.secure;
    this._appName = config.appName || "Undefined";
    this._apiKey = config.apiKey;
    this._platform = config.platform || 'web';

    if (typeof navigator != 'undefined') {
      this._browser = getBrowserInfo(navigator.userAgent, navigator.product);
      this._hwos = navigator.platform;
      this._humanLanguage = navigator.language || 'en-US';
    }

    _connection.default.logger = function (str) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      _classPrivateMethodGet(_this, _logger, _logger2).call(_this, str, args);
    };

    _drafty.default.logger = function (str) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      _classPrivateMethodGet(_this, _logger, _logger2).call(_this, str, args);
    };

    if (config.transport != 'lp' && config.transport != 'ws') {
      config.transport = detectTransport();
    }

    this._connection = new _connection.default(config, Const.PROTOCOL_VERSION, true);

    this._connection.onMessage = data => {
      _classPrivateMethodGet(this, _dispatchMessage, _dispatchMessage2).call(this, data);
    };

    this._connection.onOpen = () => {
      _classPrivateMethodGet(this, _connectionOpen, _connectionOpen2).call(this);
    };

    this._connection.onDisconnect = (err, code) => {
      _classPrivateMethodGet(this, _disconnected, _disconnected2).call(this, err, code);
    };

    this._connection.onAutoreconnectIteration = (timeout, promise) => {
      if (this.onAutoreconnectIteration) {
        this.onAutoreconnectIteration(timeout, promise);
      }
    };

    this._persist = config.persist;
    this._db = new _db.default(err => {
      _classPrivateMethodGet(this, _logger, _logger2).call(this, 'DB', err);
    }, this.logger);

    if (this._persist) {
      const prom = [];

      this._db.initDatabase().then(() => {
        return this._db.mapTopics(data => {
          let topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', data.name);

          if (topic) {
            return;
          }

          if (data.name == Const.TOPIC_ME) {
            topic = new _topic.TopicMe();
          } else if (data.name == Const.TOPIC_FND) {
            topic = new _topic.TopicFnd();
          } else {
            topic = new _topic.Topic(data.name);
          }

          this._db.deserializeTopic(topic, data);

          _classPrivateMethodGet(this, _attachCacheToTopic, _attachCacheToTopic2).call(this, topic);

          topic._cachePutSelf();

          prom.push(topic._loadMessages(this._db));
        });
      }).then(() => {
        return this._db.mapUsers(data => {
          _classPrivateMethodGet(this, _cachePut, _cachePut2).call(this, 'user', data.uid, (0, _utils.mergeObj)({}, data.public));
        });
      }).then(() => {
        return Promise.all(prom);
      }).then(() => {
        if (onComplete) {
          onComplete();
        }

        _classPrivateMethodGet(this, _logger, _logger2).call(this, "Persistent cache initialized.");
      }).catch(err => {
        if (onComplete) {
          onComplete(err);
        }

        _classPrivateMethodGet(this, _logger, _logger2).call(this, "Failed to initialize persistent cache:", err);
      });
    } else {
      this._db.deleteDatabase().then(() => {
        if (onComplete) {
          onComplete();
        }
      });
    }
  }

  static credential(meth, val, params, resp) {
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
  }

  static topicType(name) {
    return _topic.Topic.topicType(name);
  }

  static isMeTopicName(name) {
    return _topic.Topic.isMeTopicName(name);
  }

  static isGroupTopicName(name) {
    return _topic.Topic.isGroupTopicName(name);
  }

  static isP2PTopicName(name) {
    return _topic.Topic.isP2PTopicName(name);
  }

  static isCommTopicName(name) {
    return _topic.Topic.isCommTopicName(name);
  }

  static isNewGroupTopicName(name) {
    return _topic.Topic.isNewGroupTopicName(name);
  }

  static isChannelTopicName(name) {
    return _topic.Topic.isChannelTopicName(name);
  }

  static getVersion() {
    return Const.VERSION;
  }

  static setNetworkProviders(wsProvider, xhrProvider) {
    WebSocketProvider = wsProvider;
    XHRProvider = xhrProvider;

    _connection.default.setNetworkProviders(WebSocketProvider, XHRProvider);

    _largeFile.default.setNetworkProvider(XHRProvider);
  }

  static setDatabaseProvider(idbProvider) {
    IndexedDBProvider = idbProvider;

    _db.default.setDatabaseProvider(IndexedDBProvider);
  }

  static getLibrary() {
    return Const.LIBRARY;
  }

  static isNullValue(str) {
    return str === Const.DEL_CHAR;
  }

  static isRelativeURL(url) {
    return !/^\s*([a-z][a-z0-9+.-]*:|\/\/)/im.test(url);
  }

  getNextUniqueId() {
    return this._messageId != 0 ? '' + this._messageId++ : undefined;
  }

  connect(host_) {
    return this._connection.connect(host_);
  }

  reconnect(force) {
    this._connection.reconnect(force);
  }

  disconnect() {
    this._connection.disconnect();
  }

  clearStorage() {
    if (this._db.isReady()) {
      return this._db.deleteDatabase();
    }

    return Promise.resolve();
  }

  initStorage() {
    if (!this._db.isReady()) {
      return this._db.initDatabase();
    }

    return Promise.resolve();
  }

  networkProbe() {
    this._connection.probe();
  }

  isConnected() {
    return this._connection.isConnected();
  }

  isAuthenticated() {
    return this._authenticated;
  }

  authorizeURL(url) {
    if (typeof url != 'string') {
      return url;
    }

    if (Tinode.isRelativeURL(url)) {
      const base = 'scheme://host/';
      const parsed = new URL(url, base);

      if (this._apiKey) {
        parsed.searchParams.append('apikey', this._apiKey);
      }

      if (this._authToken && this._authToken.token) {
        parsed.searchParams.append('auth', 'token');
        parsed.searchParams.append('secret', this._authToken.token);
      }

      url = parsed.toString().substring(base.length - 1);
    }

    return url;
  }

  account(uid, scheme, secret, login, params) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'acc');

    pkt.acc.user = uid;
    pkt.acc.scheme = scheme;
    pkt.acc.secret = secret;
    pkt.acc.login = login;

    if (params) {
      pkt.acc.desc.defacs = params.defacs;
      pkt.acc.desc.public = params.public;
      pkt.acc.desc.private = params.private;
      pkt.acc.desc.trusted = params.trusted;
      pkt.acc.tags = params.tags;
      pkt.acc.cred = params.cred;
      pkt.acc.token = params.token;

      if (Array.isArray(params.attachments) && params.attachments.length > 0) {
        pkt.extra = {
          attachments: params.attachments.filter(ref => Tinode.isRelativeURL(ref))
        };
      }
    }

    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.acc.id);
  }

  createAccount(scheme, secret, login, params) {
    let promise = this.account(USER_NEW, scheme, secret, login, params);

    if (login) {
      promise = promise.then(ctrl => {
        return _classPrivateMethodGet(this, _loginSuccessful, _loginSuccessful2).call(this, ctrl);
      });
    }

    return promise;
  }

  createAccountBasic(username, password, params) {
    username = username || '';
    password = password || '';
    return this.createAccount('basic', b64EncodeUnicode(username + ':' + password), true, params);
  }

  updateAccountBasic(uid, username, password, params) {
    username = username || '';
    password = password || '';
    return this.account(uid, 'basic', b64EncodeUnicode(username + ':' + password), false, params);
  }

  hello() {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'hi');

    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.hi.id).then(ctrl => {
      this._connection.backoffReset();

      if (ctrl.params) {
        this._serverInfo = ctrl.params;
      }

      if (this.onConnect) {
        this.onConnect();
      }

      return ctrl;
    }).catch(err => {
      this._connection.reconnect(true);

      if (this.onDisconnect) {
        this.onDisconnect(err);
      }
    });
  }

  setDeviceToken(dt) {
    let sent = false;
    dt = dt || null;

    if (dt != this._deviceToken) {
      this._deviceToken = dt;

      if (this.isConnected() && this.isAuthenticated()) {
        _classPrivateMethodGet(this, _send, _send2).call(this, {
          'hi': {
            'dev': dt || Tinode.DEL_CHAR
          }
        });

        sent = true;
      }
    }

    return sent;
  }

  login(scheme, secret, cred) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'login');

    pkt.login.scheme = scheme;
    pkt.login.secret = secret;
    pkt.login.cred = cred;
    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.login.id).then(ctrl => {
      return _classPrivateMethodGet(this, _loginSuccessful, _loginSuccessful2).call(this, ctrl);
    });
  }

  loginBasic(uname, password, cred) {
    return this.login('basic', b64EncodeUnicode(uname + ':' + password), cred).then(ctrl => {
      this._login = uname;
      return ctrl;
    });
  }

  loginToken(token, cred) {
    return this.login('token', token, cred);
  }

  requestResetAuthSecret(scheme, method, value) {
    return this.login('reset', b64EncodeUnicode(scheme + ':' + method + ':' + value));
  }

  getAuthToken() {
    if (this._authToken && this._authToken.expires.getTime() > Date.now()) {
      return this._authToken;
    } else {
      this._authToken = null;
    }

    return null;
  }

  setAuthToken(token) {
    this._authToken = token;
  }

  subscribe(topicName, getParams, setParams) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'sub', topicName);

    if (!topicName) {
      topicName = Const.TOPIC_NEW;
    }

    pkt.sub.get = getParams;

    if (setParams) {
      if (setParams.sub) {
        pkt.sub.set.sub = setParams.sub;
      }

      if (setParams.desc) {
        const desc = setParams.desc;

        if (Tinode.isNewGroupTopicName(topicName)) {
          pkt.sub.set.desc = desc;
        } else if (Tinode.isP2PTopicName(topicName) && desc.defacs) {
          pkt.sub.set.desc = {
            defacs: desc.defacs
          };
        }
      }

      if (Array.isArray(setParams.attachments) && setParams.attachments.length > 0) {
        pkt.extra = {
          attachments: setParams.attachments.filter(ref => Tinode.isRelativeURL(ref))
        };
      }

      if (setParams.tags) {
        pkt.sub.set.tags = setParams.tags;
      }
    }

    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.sub.id);
  }

  leave(topic, unsub) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'leave', topic);

    pkt.leave.unsub = unsub;
    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.leave.id);
  }

  createMessage(topic, content, noEcho) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'pub', topic);

    let dft = typeof content == 'string' ? _drafty.default.parse(content) : content;

    if (dft && !_drafty.default.isPlainText(dft)) {
      pkt.pub.head = {
        mime: _drafty.default.getContentType()
      };
      content = dft;
    }

    pkt.pub.noecho = noEcho;
    pkt.pub.content = content;
    return pkt.pub;
  }

  publish(topic, content, noEcho) {
    return this.publishMessage(this.createMessage(topic, content, noEcho));
  }

  publishMessage(pub, attachments) {
    pub = Object.assign({}, pub);
    pub.seq = undefined;
    pub.from = undefined;
    pub.ts = undefined;
    const msg = {
      pub: pub
    };

    if (attachments) {
      msg.extra = {
        attachments: attachments.filter(ref => Tinode.isRelativeURL(ref))
      };
    }

    return _classPrivateMethodGet(this, _send, _send2).call(this, msg, pub.id);
  }

  oobNotification(topicName, seq, act) {
    const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', topicName);

    if (topic) {
      topic._updateReceived(seq, act);

      this.getMeTopic()._refreshContact('msg', topic);
    }
  }

  getMeta(topic, params) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'get', topic);

    pkt.get = (0, _utils.mergeObj)(pkt.get, params);
    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.get.id);
  }

  setMeta(topic, params) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'set', topic);

    const what = [];

    if (params) {
      ['desc', 'sub', 'tags', 'cred'].forEach(function (key) {
        if (params.hasOwnProperty(key)) {
          what.push(key);
          pkt.set[key] = params[key];
        }
      });

      if (Array.isArray(params.attachments) && params.attachments.length > 0) {
        pkt.extra = {
          attachments: params.attachments.filter(ref => Tinode.isRelativeURL(ref))
        };
      }
    }

    if (what.length == 0) {
      return Promise.reject(new Error("Invalid {set} parameters"));
    }

    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.set.id);
  }

  delMessages(topic, ranges, hard) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'del', topic);

    pkt.del.what = 'msg';
    pkt.del.delseq = ranges;
    pkt.del.hard = hard;
    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.del.id);
  }

  delTopic(topicName, hard) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'del', topicName);

    pkt.del.what = 'topic';
    pkt.del.hard = hard;
    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.del.id);
  }

  delSubscription(topicName, user) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'del', topicName);

    pkt.del.what = 'sub';
    pkt.del.user = user;
    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.del.id);
  }

  delCredential(method, value) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'del', Const.TOPIC_ME);

    pkt.del.what = 'cred';
    pkt.del.cred = {
      meth: method,
      val: value
    };
    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.del.id);
  }

  delCurrentUser(hard) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'del', null);

    pkt.del.what = 'user';
    pkt.del.hard = hard;
    return _classPrivateMethodGet(this, _send, _send2).call(this, pkt, pkt.del.id).then(ctrl => {
      this._myUID = null;
    });
  }

  note(topicName, what, seq) {
    if (seq <= 0 || seq >= Const.LOCAL_SEQID) {
      throw new Error("Invalid message id ".concat(seq));
    }

    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'note', topicName);

    pkt.note.what = what;
    pkt.note.seq = seq;

    _classPrivateMethodGet(this, _send, _send2).call(this, pkt);
  }

  noteKeyPress(topicName) {
    const pkt = _classPrivateMethodGet(this, _initPacket, _initPacket2).call(this, 'note', topicName);

    pkt.note.what = 'kp';

    _classPrivateMethodGet(this, _send, _send2).call(this, pkt);
  }

  getTopic(topicName) {
    let topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', topicName);

    if (!topic && topicName) {
      if (topicName == Const.TOPIC_ME) {
        topic = new _topic.TopicMe();
      } else if (topicName == Const.TOPIC_FND) {
        topic = new _topic.TopicFnd();
      } else {
        topic = new _topic.Topic(topicName);
      }

      _classPrivateMethodGet(this, _attachCacheToTopic, _attachCacheToTopic2).call(this, topic);

      topic._cachePutSelf();
    }

    return topic;
  }

  cacheGetTopic(topicName) {
    return _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', topicName);
  }

  cacheRemTopic(topicName) {
    _classPrivateMethodGet(this, _cacheDel, _cacheDel2).call(this, 'topic', topicName);
  }

  mapTopics(func, context) {
    _classPrivateMethodGet(this, _cacheMap, _cacheMap2).call(this, 'topic', func, context);
  }

  isTopicCached(topicName) {
    return !!_classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', topicName);
  }

  newGroupTopicName(isChan) {
    return (isChan ? Const.TOPIC_NEW_CHAN : Const.TOPIC_NEW) + this.getNextUniqueId();
  }

  getMeTopic() {
    return this.getTopic(Const.TOPIC_ME);
  }

  getFndTopic() {
    return this.getTopic(Const.TOPIC_FND);
  }

  getLargeFileHelper() {
    return new _largeFile.default(this, Const.PROTOCOL_VERSION);
  }

  getCurrentUserID() {
    return this._myUID;
  }

  isMe(uid) {
    return this._myUID === uid;
  }

  getCurrentLogin() {
    return this._login;
  }

  getServerInfo() {
    return this._serverInfo;
  }

  getServerLimit(name, defaultValue) {
    return (this._serverInfo ? this._serverInfo[name] : null) || defaultValue;
  }

  enableLogging(enabled, trimLongStrings) {
    this._loggingEnabled = enabled;
    this._trimLongStrings = enabled && trimLongStrings;
  }

  setHumanLanguage(hl) {
    if (hl) {
      this._humanLanguage = hl;
    }
  }

  isTopicOnline(name) {
    const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', name);

    return topic && topic.online;
  }

  getTopicAccessMode(name) {
    const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', name);

    return topic ? topic.acs : null;
  }

  wantAkn(status) {
    if (status) {
      this._messageId = Math.floor(Math.random() * 0xFFFFFF + 0xFFFFFF);
    } else {
      this._messageId = 0;
    }
  }

}

exports.default = Tinode;

function _logger2(str) {
  if (this._loggingEnabled) {
    const d = new Date();
    const dateString = ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2) + ':' + ('0' + d.getUTCSeconds()).slice(-2) + '.' + ('00' + d.getUTCMilliseconds()).slice(-3);

    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }

    console.log('[' + dateString + ']', str, args.join(' '));
  }
}

function _makePromise2(id) {
  let promise = null;

  if (id) {
    promise = new Promise((resolve, reject) => {
      this._pendingPromises[id] = {
        'resolve': resolve,
        'reject': reject,
        'ts': new Date()
      };
    });
  }

  return promise;
}

function _execPromise2(id, code, onOK, errorText) {
  const callbacks = this._pendingPromises[id];

  if (callbacks) {
    delete this._pendingPromises[id];

    if (code >= 200 && code < 400) {
      if (callbacks.resolve) {
        callbacks.resolve(onOK);
      }
    } else if (callbacks.reject) {
      callbacks.reject(new Error("".concat(errorText, " (").concat(code, ")")));
    }
  }
}

function _send2(pkt, id) {
  let promise;

  if (id) {
    promise = _classPrivateMethodGet(this, _makePromise, _makePromise2).call(this, id);
  }

  pkt = (0, _utils.simplify)(pkt);
  let msg = JSON.stringify(pkt);

  _classPrivateMethodGet(this, _logger, _logger2).call(this, "out: " + (this._trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : msg));

  try {
    this._connection.sendText(msg);
  } catch (err) {
    if (id) {
      _classPrivateMethodGet(this, _execPromise, _execPromise2).call(this, id, _connection.default.NETWORK_ERROR, null, err.message);
    } else {
      throw err;
    }
  }

  return promise;
}

function _dispatchMessage2(data) {
  if (!data) return;
  this._inPacketCount++;

  if (this.onRawMessage) {
    this.onRawMessage(data);
  }

  if (data === '0') {
    if (this.onNetworkProbe) {
      this.onNetworkProbe();
    }

    return;
  }

  let pkt = JSON.parse(data, _utils.jsonParseHelper);

  if (!pkt) {
    _classPrivateMethodGet(this, _logger, _logger2).call(this, "in: " + data);

    _classPrivateMethodGet(this, _logger, _logger2).call(this, "ERROR: failed to parse data");
  } else {
    _classPrivateMethodGet(this, _logger, _logger2).call(this, "in: " + (this._trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : data));

    if (this.onMessage) {
      this.onMessage(pkt);
    }

    if (pkt.ctrl) {
      if (this.onCtrlMessage) {
        this.onCtrlMessage(pkt.ctrl);
      }

      if (pkt.ctrl.id) {
        _classPrivateMethodGet(this, _execPromise, _execPromise2).call(this, pkt.ctrl.id, pkt.ctrl.code, pkt.ctrl, pkt.ctrl.text);
      }

      setTimeout(() => {
        if (pkt.ctrl.code == 205 && pkt.ctrl.text == 'evicted') {
          const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', pkt.ctrl.topic);

          if (topic) {
            topic._resetSub();

            if (pkt.ctrl.params && pkt.ctrl.params.unsub) {
              topic._gone();
            }
          }
        } else if (pkt.ctrl.code < 300 && pkt.ctrl.params) {
          if (pkt.ctrl.params.what == 'data') {
            const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', pkt.ctrl.topic);

            if (topic) {
              topic._allMessagesReceived(pkt.ctrl.params.count);
            }
          } else if (pkt.ctrl.params.what == 'sub') {
            const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', pkt.ctrl.topic);

            if (topic) {
              topic._processMetaSub([]);
            }
          }
        }
      }, 0);
    } else {
      setTimeout(() => {
        if (pkt.meta) {
          const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', pkt.meta.topic);

          if (topic) {
            topic._routeMeta(pkt.meta);
          }

          if (pkt.meta.id) {
            _classPrivateMethodGet(this, _execPromise, _execPromise2).call(this, pkt.meta.id, 200, pkt.meta, 'META');
          }

          if (this.onMetaMessage) {
            this.onMetaMessage(pkt.meta);
          }
        } else if (pkt.data) {
          const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', pkt.data.topic);

          if (topic) {
            topic._routeData(pkt.data);
          }

          if (this.onDataMessage) {
            this.onDataMessage(pkt.data);
          }
        } else if (pkt.pres) {
          const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', pkt.pres.topic);

          if (topic) {
            topic._routePres(pkt.pres);
          }

          if (this.onPresMessage) {
            this.onPresMessage(pkt.pres);
          }
        } else if (pkt.info) {
          const topic = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'topic', pkt.info.topic);

          if (topic) {
            topic._routeInfo(pkt.info);
          }

          if (this.onInfoMessage) {
            this.onInfoMessage(pkt.info);
          }
        } else {
          _classPrivateMethodGet(this, _logger, _logger2).call(this, "ERROR: Unknown packet received.");
        }
      }, 0);
    }
  }
}

function _connectionOpen2() {
  if (!this._expirePromises) {
    this._expirePromises = setInterval(() => {
      const err = new Error("Timeout (504)");
      const expires = new Date(new Date().getTime() - Const.EXPIRE_PROMISES_TIMEOUT);

      for (let id in this._pendingPromises) {
        let callbacks = this._pendingPromises[id];

        if (callbacks && callbacks.ts < expires) {
          _classPrivateMethodGet(this, _logger, _logger2).call(this, "Promise expired", id);

          delete this._pendingPromises[id];

          if (callbacks.reject) {
            callbacks.reject(err);
          }
        }
      }
    }, Const.EXPIRE_PROMISES_PERIOD);
  }

  this.hello();
}

function _disconnected2(err, code) {
  this._inPacketCount = 0;
  this._serverInfo = null;
  this._authenticated = false;

  if (this._expirePromises) {
    clearInterval(this._expirePromises);
    this._expirePromises = null;
  }

  _classPrivateMethodGet(this, _cacheMap, _cacheMap2).call(this, 'topic', (topic, key) => {
    topic._resetSub();
  });

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

function _getUserAgent2() {
  return this._appName + ' (' + (this._browser ? this._browser + '; ' : '') + this._hwos + '); ' + Const.LIBRARY;
}

function _initPacket2(type, topic) {
  switch (type) {
    case 'hi':
      return {
        'hi': {
          'id': this.getNextUniqueId(),
          'ver': Const.VERSION,
          'ua': _classPrivateMethodGet(this, _getUserAgent, _getUserAgent2).call(this),
          'dev': this._deviceToken,
          'lang': this._humanLanguage,
          'platf': this._platform
        }
      };

    case 'acc':
      return {
        'acc': {
          'id': this.getNextUniqueId(),
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
          'id': this.getNextUniqueId(),
          'scheme': null,
          'secret': null
        }
      };

    case 'sub':
      return {
        'sub': {
          'id': this.getNextUniqueId(),
          'topic': topic,
          'set': {},
          'get': {}
        }
      };

    case 'leave':
      return {
        'leave': {
          'id': this.getNextUniqueId(),
          'topic': topic,
          'unsub': false
        }
      };

    case 'pub':
      return {
        'pub': {
          'id': this.getNextUniqueId(),
          'topic': topic,
          'noecho': false,
          'head': null,
          'content': {}
        }
      };

    case 'get':
      return {
        'get': {
          'id': this.getNextUniqueId(),
          'topic': topic,
          'what': null,
          'desc': {},
          'sub': {},
          'data': {}
        }
      };

    case 'set':
      return {
        'set': {
          'id': this.getNextUniqueId(),
          'topic': topic,
          'desc': {},
          'sub': {},
          'tags': []
        }
      };

    case 'del':
      return {
        'del': {
          'id': this.getNextUniqueId(),
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
          'topic': topic,
          'what': null,
          'seq': undefined
        }
      };

    default:
      throw new Error("Unknown packet type requested: ".concat(type));
  }
}

function _cachePut2(type, name, obj) {
  this._cache[type + ':' + name] = obj;
}

function _cacheGet2(type, name) {
  return this._cache[type + ':' + name];
}

function _cacheDel2(type, name) {
  delete this._cache[type + ':' + name];
}

function _cacheMap2(type, func, context) {
  const key = type ? type + ':' : undefined;

  for (let idx in this._cache) {
    if (!key || idx.indexOf(key) == 0) {
      if (func.call(context, this._cache[idx], idx)) {
        break;
      }
    }
  }
}

function _attachCacheToTopic2(topic) {
  topic._tinode = this;

  topic._cacheGetUser = uid => {
    const pub = _classPrivateMethodGet(this, _cacheGet, _cacheGet2).call(this, 'user', uid);

    if (pub) {
      return {
        user: uid,
        public: (0, _utils.mergeObj)({}, pub)
      };
    }

    return undefined;
  };

  topic._cachePutUser = (uid, user) => {
    _classPrivateMethodGet(this, _cachePut, _cachePut2).call(this, 'user', uid, (0, _utils.mergeObj)({}, user.public));
  };

  topic._cacheDelUser = uid => {
    _classPrivateMethodGet(this, _cacheDel, _cacheDel2).call(this, 'user', uid);
  };

  topic._cachePutSelf = () => {
    _classPrivateMethodGet(this, _cachePut, _cachePut2).call(this, 'topic', topic.name, topic);
  };

  topic._cacheDelSelf = () => {
    _classPrivateMethodGet(this, _cacheDel, _cacheDel2).call(this, 'topic', topic.name);
  };
}

function _loginSuccessful2(ctrl) {
  if (!ctrl.params || !ctrl.params.user) {
    return ctrl;
  }

  this._myUID = ctrl.params.user;
  this._authenticated = ctrl && ctrl.code >= 200 && ctrl.code < 300;

  if (ctrl.params && ctrl.params.token && ctrl.params.expires) {
    this._authToken = {
      token: ctrl.params.token,
      expires: ctrl.params.expires
    };
  } else {
    this._authToken = null;
  }

  if (this.onLogin) {
    this.onLogin(ctrl.code, ctrl.text);
  }

  return ctrl;
}

;
Tinode.MESSAGE_STATUS_NONE = Const.MESSAGE_STATUS_NONE;
Tinode.MESSAGE_STATUS_QUEUED = Const.MESSAGE_STATUS_QUEUED;
Tinode.MESSAGE_STATUS_SENDING = Const.MESSAGE_STATUS_SENDING;
Tinode.MESSAGE_STATUS_FAILED = Const.MESSAGE_STATUS_FAILED;
Tinode.MESSAGE_STATUS_SENT = Const.MESSAGE_STATUS_SENT;
Tinode.MESSAGE_STATUS_RECEIVED = Const.MESSAGE_STATUS_RECEIVED;
Tinode.MESSAGE_STATUS_READ = Const.MESSAGE_STATUS_READ;
Tinode.MESSAGE_STATUS_TO_ME = Const.MESSAGE_STATUS_TO_ME;
Tinode.MESSAGE_STATUS_DEL_RANGE = Const.MESSAGE_STATUS_DEL_RANGE;
Tinode.DEL_CHAR = Const.DEL_CHAR;
Tinode.MAX_MESSAGE_SIZE = 'maxMessageSize';
Tinode.MAX_SUBSCRIBER_COUNT = 'maxSubscriberCount';
Tinode.MAX_TAG_COUNT = 'maxTagCount';
Tinode.MAX_FILE_UPLOAD_SIZE = 'maxFileUploadSize';

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./access-mode.js":1,"./config.js":3,"./connection.js":4,"./db.js":5,"./drafty.js":6,"./large-file.js":7,"./topic.js":10,"./utils.js":11}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TopicMe = exports.TopicFnd = exports.Topic = void 0;

var _accessMode = _interopRequireDefault(require("./access-mode.js"));

var _cbuffer = _interopRequireDefault(require("./cbuffer.js"));

var Const = _interopRequireWildcard(require("./config.js"));

var _drafty = _interopRequireDefault(require("./drafty.js"));

var _metaBuilder = _interopRequireDefault(require("./meta-builder.js"));

var _utils = require("./utils.js");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Topic {
  constructor(name, callbacks) {
    this._tinode = null;
    this.name = name;
    this.created = null;
    this.updated = null;
    this.touched = new Date(0);
    this.acs = new _accessMode.default(null);
    this.private = null;
    this.public = null;
    this.trusted = null;
    this._users = {};
    this._queuedSeqId = Const.LOCAL_SEQID;
    this._maxSeq = 0;
    this._minSeq = 0;
    this._noEarlierMsgs = false;
    this._maxDel = 0;
    this._tags = [];
    this._credentials = [];
    this._messages = new _cbuffer.default((a, b) => {
      return a.seq - b.seq;
    }, true);
    this._attached = false;
    this._lastSubsUpdate = new Date(0);
    this._new = true;
    this._deleted = false;

    if (callbacks) {
      this.onData = callbacks.onData;
      this.onMeta = callbacks.onMeta;
      this.onPres = callbacks.onPres;
      this.onInfo = callbacks.onInfo;
      this.onMetaDesc = callbacks.onMetaDesc;
      this.onMetaSub = callbacks.onMetaSub;
      this.onSubsUpdated = callbacks.onSubsUpdated;
      this.onTagsUpdated = callbacks.onTagsUpdated;
      this.onCredsUpdated = callbacks.onCredsUpdated;
      this.onDeleteTopic = callbacks.onDeleteTopic;
      this.onAllMessagesReceived = callbacks.onAllMessagesReceived;
    }
  }

  static topicType(name) {
    const types = {
      'me': Const.TOPIC_ME,
      'fnd': Const.TOPIC_FND,
      'grp': Const.TOPIC_GRP,
      'new': Const.TOPIC_GRP,
      'nch': Const.TOPIC_GRP,
      'chn': Const.TOPIC_GRP,
      'usr': Const.TOPIC_P2P,
      'sys': Const.TOPIC_SYS
    };
    return types[typeof name == 'string' ? name.substring(0, 3) : 'xxx'];
  }

  static isMeTopicName(name) {
    return Topic.topicType(name) == Const.TOPIC_ME;
  }

  static isGroupTopicName(name) {
    return Topic.topicType(name) == Const.TOPIC_GRP;
  }

  static isP2PTopicName(name) {
    return Topic.topicType(name) == Const.TOPIC_P2P;
  }

  static isCommTopicName(name) {
    return Topic.isP2PTopicName(name) || Topic.isGroupTopicName(name);
  }

  static isNewGroupTopicName(name) {
    return typeof name == 'string' && (name.substring(0, 3) == Const.TOPIC_NEW || name.substring(0, 3) == Const.TOPIC_NEW_CHAN);
  }

  static isChannelTopicName(name) {
    return typeof name == 'string' && (name.substring(0, 3) == Const.TOPIC_CHAN || name.substring(0, 3) == Const.TOPIC_NEW_CHAN);
  }

  isSubscribed() {
    return this._attached;
  }

  subscribe(getParams, setParams) {
    if (this._attached) {
      return Promise.resolve(this);
    }

    if (this._deleted) {
      return Promise.reject(new Error("Conversation deleted"));
    }

    return this._tinode.subscribe(this.name || Const.TOPIC_NEW, getParams, setParams).then(ctrl => {
      if (ctrl.code >= 300) {
        return ctrl;
      }

      this._attached = true;
      this._deleted = false;
      this.acs = ctrl.params && ctrl.params.acs ? ctrl.params.acs : this.acs;

      if (this._new) {
        this._new = false;

        if (this.name != ctrl.topic) {
          this._cacheDelSelf();

          this.name = ctrl.topic;
        }

        this._cachePutSelf();

        this.created = ctrl.ts;
        this.updated = ctrl.ts;

        if (this.name != Const.TOPIC_ME && this.name != Const.TOPIC_FND) {
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
  }

  createMessage(data, noEcho) {
    return this._tinode.createMessage(this.name, data, noEcho);
  }

  publish(data, noEcho) {
    return this.publishMessage(this.createMessage(data, noEcho));
  }

  publishMessage(pub) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot publish on inactive topic"));
    }

    let attachments = null;

    if (_drafty.default.hasEntities(pub.content)) {
      attachments = [];

      _drafty.default.entities(pub.content, data => {
        if (data && data.ref) {
          attachments.push(data.ref);
        }
      });

      if (attachments.length == 0) {
        attachments = null;
      }
    }

    pub._sending = true;
    pub._failed = false;
    return this._tinode.publishMessage(pub, attachments).then(ctrl => {
      pub._sending = false;
      pub.ts = ctrl.ts;
      this.swapMessageId(pub, ctrl.params.seq);

      this._routeData(pub);

      return ctrl;
    }).catch(err => {
      this._tinode.logger("WARNING: Message rejected by the server", err);

      pub._sending = false;
      pub._failed = true;

      if (this.onData) {
        this.onData();
      }
    });
  }

  publishDraft(pub, prom) {
    if (!prom && !this._attached) {
      return Promise.reject(new Error("Cannot publish on inactive topic"));
    }

    const seq = pub.seq || this._getQueuedSeqId();

    if (!pub._noForwarding) {
      pub._noForwarding = true;
      pub.seq = seq;
      pub.ts = new Date();
      pub.from = this._tinode.getCurrentUserID();
      pub.noecho = true;

      this._messages.put(pub);

      this._tinode._db.addMessage(pub);

      if (this.onData) {
        this.onData(pub);
      }
    }

    prom = (prom || Promise.resolve()).then(() => {
      if (pub._cancelled) {
        return {
          code: 300,
          text: "cancelled"
        };
      }

      return this.publishMessage(pub);
    }, err => {
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
  }

  leave(unsub) {
    if (!this._attached && !unsub) {
      return Promise.reject(new Error("Cannot leave inactive topic"));
    }

    return this._tinode.leave(this.name, unsub).then(ctrl => {
      this._resetSub();

      if (unsub) {
        this._gone();
      }

      return ctrl;
    });
  }

  getMeta(params) {
    return this._tinode.getMeta(this.name, params);
  }

  getMessagesPage(limit, forward) {
    let query = forward ? this.startMetaQuery().withLaterData(limit) : this.startMetaQuery().withEarlierData(limit);
    return this._loadMessages(this._tinode._db, query.extract('data')).then(count => {
      if (count == limit) {
        return Promise.resolve({
          topic: this.name,
          code: 200,
          params: {
            count: count
          }
        });
      }

      limit -= count;
      query = forward ? this.startMetaQuery().withLaterData(limit) : this.startMetaQuery().withEarlierData(limit);
      let promise = this.getMeta(query.build());

      if (!forward) {
        promise = promise.then(ctrl => {
          if (ctrl && ctrl.params && !ctrl.params.count) {
            this._noEarlierMsgs = true;
          }
        });
      }

      return promise;
    });
  }

  setMeta(params) {
    if (params.tags) {
      params.tags = (0, _utils.normalizeArray)(params.tags);
    }

    return this._tinode.setMeta(this.name, params).then(ctrl => {
      if (ctrl && ctrl.code >= 300) {
        return ctrl;
      }

      if (params.sub) {
        params.sub.topic = this.name;

        if (ctrl.params && ctrl.params.acs) {
          params.sub.acs = ctrl.params.acs;
          params.sub.updated = ctrl.ts;
        }

        if (!params.sub.user) {
          params.sub.user = this._tinode.getCurrentUserID();

          if (!params.desc) {
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
  }

  updateMode(uid, update) {
    const user = uid ? this.subscriber(uid) : null;
    const am = user ? user.acs.updateGiven(update).getGiven() : this.getAccessMode().updateWant(update).getWant();
    return this.setMeta({
      sub: {
        user: uid,
        mode: am
      }
    });
  }

  invite(uid, mode) {
    return this.setMeta({
      sub: {
        user: uid,
        mode: mode
      }
    });
  }

  archive(arch) {
    if (this.private && !this.private.arch == !arch) {
      return Promise.resolve(arch);
    }

    return this.setMeta({
      desc: {
        private: {
          arch: arch ? true : Const.DEL_CHAR
        }
      }
    });
  }

  delMessages(ranges, hard) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot delete messages in inactive topic"));
    }

    ranges.sort((r1, r2) => {
      if (r1.low < r2.low) {
        return true;
      }

      if (r1.low == r2.low) {
        return !r2.hi || r1.hi >= r2.hi;
      }

      return false;
    });
    let tosend = ranges.reduce((out, r) => {
      if (r.low < Const.LOCAL_SEQID) {
        if (!r.hi || r.hi < Const.LOCAL_SEQID) {
          out.push(r);
        } else {
          out.push({
            low: r.low,
            hi: this._maxSeq + 1
          });
        }
      }

      return out;
    }, []);
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

    return result.then(ctrl => {
      if (ctrl.params.del > this._maxDel) {
        this._maxDel = ctrl.params.del;
      }

      ranges.forEach(r => {
        if (r.hi) {
          this.flushMessageRange(r.low, r.hi);
        } else {
          this.flushMessage(r.low);
        }
      });

      this._updateDeletedRanges();

      if (this.onData) {
        this.onData();
      }

      return ctrl;
    });
  }

  delMessagesAll(hardDel) {
    if (!this._maxSeq || this._maxSeq <= 0) {
      return Promise.resolve();
    }

    return this.delMessages([{
      low: 1,
      hi: this._maxSeq + 1,
      _all: true
    }], hardDel);
  }

  delMessagesList(list, hardDel) {
    list.sort((a, b) => a - b);
    let ranges = list.reduce((out, id) => {
      if (out.length == 0) {
        out.push({
          low: id
        });
      } else {
        let prev = out[out.length - 1];

        if (!prev.hi && id != prev.low + 1 || id > prev.hi) {
          out.push({
            low: id
          });
        } else {
          prev.hi = prev.hi ? Math.max(prev.hi, id + 1) : id + 1;
        }
      }

      return out;
    }, []);
    return this.delMessages(ranges, hardDel);
  }

  delTopic(hard) {
    if (this._deleted) {
      this._gone();

      return new Promise.resolve(null);
    }

    return this._tinode.delTopic(this.name, hard).then(ctrl => {
      this._resetSub();

      this._gone();

      return ctrl;
    });
  }

  delSubscription(user) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot delete subscription in inactive topic"));
    }

    return this._tinode.delSubscription(this.name, user).then(ctrl => {
      delete this._users[user];

      if (this.onSubsUpdated) {
        this.onSubsUpdated(Object.keys(this._users));
      }

      return ctrl;
    });
  }

  note(what, seq) {
    if (!this._attached) {
      return;
    }

    const user = this._users[this._tinode.getCurrentUserID()];

    let update = false;

    if (user) {
      if (!user[what] || user[what] < seq) {
        user[what] = seq;
        update = true;
      }
    } else {
      update = (this[what] | 0) < seq;
    }

    if (update) {
      this._tinode.note(this.name, what, seq);

      this._updateReadRecv(what, seq);

      if (this.acs != null && !this.acs.isMuted()) {
        const me = this._tinode.getMeTopic();

        me._refreshContact(what, this);
      }
    }
  }

  noteRecv(seq) {
    this.note('recv', seq);
  }

  noteRead(seq) {
    seq = seq || this._maxSeq;

    if (seq > 0) {
      this.note('read', seq);
    }
  }

  noteKeyPress() {
    if (this._attached) {
      this._tinode.noteKeyPress(this.name);
    } else {
      this._tinode.logger("INFO: Cannot send notification in inactive topic");
    }
  }

  _updateReadRecv(what, seq, ts) {
    let oldVal,
        doUpdate = false;
    seq = seq | 0;
    this.seq = this.seq | 0;
    this.read = this.read | 0;
    this.recv = this.recv | 0;

    switch (what) {
      case 'recv':
        oldVal = this.recv;
        this.recv = Math.max(this.recv, seq);
        doUpdate = oldVal != this.recv;
        break;

      case 'read':
        oldVal = this.read;
        this.read = Math.max(this.read, seq);
        doUpdate = oldVal != this.read;
        break;

      case 'msg':
        oldVal = this.seq;
        this.seq = Math.max(this.seq, seq);

        if (!this.touched || this.touched < ts) {
          this.touched = ts;
        }

        doUpdate = oldVal != this.seq;
        break;
    }

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
  }

  userDesc(uid) {
    const user = this._cacheGetUser(uid);

    if (user) {
      return user;
    }
  }

  p2pPeerDesc() {
    if (!this.isP2PType()) {
      return undefined;
    }

    return this._users[this.name];
  }

  subscribers(callback, context) {
    const cb = callback || this.onMetaSub;

    if (cb) {
      for (let idx in this._users) {
        cb.call(context, this._users[idx], idx, this._users);
      }
    }
  }

  tags() {
    return this._tags.slice(0);
  }

  subscriber(uid) {
    return this._users[uid];
  }

  messages(callback, sinceId, beforeId, context) {
    const cb = callback || this.onData;

    if (cb) {
      const startIdx = typeof sinceId == 'number' ? this._messages.find({
        seq: sinceId
      }, true) : undefined;
      const beforeIdx = typeof beforeId == 'number' ? this._messages.find({
        seq: beforeId
      }, true) : undefined;

      if (startIdx != -1 && beforeIdx != -1) {
        this._messages.forEach(cb, startIdx, beforeIdx, context);
      }
    }
  }

  findMessage(seq) {
    const idx = this._messages.find({
      seq: seq
    });

    if (idx >= 0) {
      return this._messages.getAt(idx);
    }

    return undefined;
  }

  latestMessage(skipDeleted) {
    const msg = this._messages.getLast();

    if (!skipDeleted || !msg || msg._status != Const.MESSAGE_STATUS_DEL_RANGE) {
      return msg;
    }

    return this._messages.getLast(1);
  }

  maxMsgSeq() {
    return this._maxSeq;
  }

  maxClearId() {
    return this._maxDel;
  }

  messageCount() {
    return this._messages.length();
  }

  queuedMessages(callback, context) {
    if (!callback) {
      throw new Error("Callback must be provided");
    }

    this.messages(callback, Const.LOCAL_SEQID, undefined, context);
  }

  msgReceiptCount(what, seq) {
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
  }

  msgReadCount(seq) {
    return this.msgReceiptCount('read', seq);
  }

  msgRecvCount(seq) {
    return this.msgReceiptCount('recv', seq);
  }

  msgHasMoreMessages(newer) {
    return newer ? this.seq > this._maxSeq : this._minSeq > 1 && !this._noEarlierMsgs;
  }

  isNewMessage(seqId) {
    return this._maxSeq <= seqId;
  }

  flushMessage(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });

    if (idx >= 0) {
      this._tinode._db.remMessages(this.name, seqId);

      return this._messages.delAt(idx);
    }

    return undefined;
  }

  swapMessageId(pub, newSeqId) {
    const idx = this._messages.find(pub);

    const numMessages = this._messages.length();

    if (0 <= idx && idx < numMessages) {
      this._messages.delAt(idx);

      this._tinode._db.remMessages(this.name, pub.seq);

      pub.seq = newSeqId;

      this._messages.put(pub);

      this._tinode._db.addMessage(pub);
    }
  }

  flushMessageRange(fromId, untilId) {
    this._tinode._db.remMessages(this.name, fromId, untilId);

    const since = this._messages.find({
      seq: fromId
    }, true);

    return since >= 0 ? this._messages.delRange(since, this._messages.find({
      seq: untilId
    }, true)) : [];
  }

  cancelSend(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });

    if (idx >= 0) {
      const msg = this._messages.getAt(idx);

      const status = this.msgStatus(msg);

      if (status == Const.MESSAGE_STATUS_QUEUED || status == Const.MESSAGE_STATUS_FAILED) {
        this._tinode._db.remMessages(this.name, seqId);

        msg._cancelled = true;

        this._messages.delAt(idx);

        if (this.onData) {
          this.onData();
        }

        return true;
      }
    }

    return false;
  }

  getType() {
    return Topic.topicType(this.name);
  }

  getAccessMode() {
    return this.acs;
  }

  setAccessMode(acs) {
    return this.acs = new _accessMode.default(acs);
  }

  getDefaultAccess() {
    return this.defacs;
  }

  startMetaQuery() {
    return new _metaBuilder.default(this);
  }

  isArchived() {
    return this.private && !!this.private.arch;
  }

  isMeType() {
    return Topic.isMeTopicName(this.name);
  }

  isChannelType() {
    return Topic.isChannelTopicName(this.name);
  }

  isGroupType() {
    return Topic.isGroupTopicName(this.name);
  }

  isP2PType() {
    return Topic.isP2PTopicName(this.name);
  }

  isCommType() {
    return Topic.isCommTopicName(this.name);
  }

  msgStatus(msg, upd) {
    let status = Const.MESSAGE_STATUS_NONE;

    if (this._tinode.isMe(msg.from)) {
      if (msg._sending) {
        status = Const.MESSAGE_STATUS_SENDING;
      } else if (msg._failed || msg._cancelled) {
        status = Const.MESSAGE_STATUS_FAILED;
      } else if (msg.seq >= Const.LOCAL_SEQID) {
        status = Const.MESSAGE_STATUS_QUEUED;
      } else if (this.msgReadCount(msg.seq) > 0) {
        status = Const.MESSAGE_STATUS_READ;
      } else if (this.msgRecvCount(msg.seq) > 0) {
        status = Const.MESSAGE_STATUS_RECEIVED;
      } else if (msg.seq > 0) {
        status = Const.MESSAGE_STATUS_SENT;
      }
    } else if (msg._status == Const.MESSAGE_STATUS_DEL_RANGE) {
      status == Const.MESSAGE_STATUS_DEL_RANGE;
    } else {
      status = Const.MESSAGE_STATUS_TO_ME;
    }

    if (upd && msg._status != status) {
      msg._status = status;

      this._tinode._db.updMessageStatus(this.name, msg.seq, status);
    }

    return status;
  }

  _routeData(data) {
    if (data.content) {
      if (!this.touched || this.touched < data.ts) {
        this.touched = data.ts;

        this._tinode._db.updTopic(this);
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

    const what = !this.isChannelType() && !data.from || this._tinode.isMe(data.from) ? 'read' : 'msg';

    this._updateReadRecv(what, data.seq, data.ts);

    this._tinode.getMeTopic()._refreshContact(what, this);
  }

  _routeMeta(meta) {
    if (meta.desc) {
      this._processMetaDesc(meta.desc);
    }

    if (meta.sub && meta.sub.length > 0) {
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
  }

  _routePres(pres) {
    let user, uid;

    switch (pres.what) {
      case 'del':
        this._processDelMessages(pres.clear, pres.delseq);

        break;

      case 'on':
      case 'off':
        user = this._users[pres.src];

        if (user) {
          user.online = pres.what == 'on';
        } else {
          this._tinode.logger("WARNING: Presence update for an unknown user", this.name, pres.src);
        }

        break;

      case 'term':
        this._resetSub();

        break;

      case 'upd':
        if (pres.src && !this._tinode.isTopicCached(pres.src)) {
          this.getMeta(this.startMetaQuery().withLaterOneSub(pres.src).build());
        }

        break;

      case 'acs':
        uid = pres.src || this._tinode.getCurrentUserID();
        user = this._users[uid];

        if (!user) {
          const acs = new _accessMode.default().updateAll(pres.dacs);

          if (acs && acs.mode != _accessMode.default._NONE) {
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
          user.acs.updateAll(pres.dacs);

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
  }

  _routeInfo(info) {
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

      if (this._tinode.isMe(info.from)) {
        this._updateReadRecv(info.what, info.seq);
      }

      this._tinode.getMeTopic()._refreshContact(info.what, this);
    }

    if (this.onInfo) {
      this.onInfo(info);
    }
  }

  _processMetaDesc(desc) {
    if (this.isP2PType()) {
      delete desc.defacs;

      this._tinode._db.updUser(this.name, desc.public);
    }

    (0, _utils.mergeObj)(this, desc);

    this._tinode._db.updTopic(this);

    if (this.name !== Const.TOPIC_ME && !desc._noForwarding) {
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
  }

  _processMetaSub(subs) {
    for (let idx in subs) {
      const sub = subs[idx];
      sub.online = !!sub.online;
      this._lastSubsUpdate = new Date(Math.max(this._lastSubsUpdate, sub.updated));
      let user = null;

      if (!sub.deleted) {
        if (this._tinode.isMe(sub.user) && sub.acs) {
          this._processMetaDesc({
            updated: sub.updated,
            touched: sub.touched,
            acs: sub.acs
          });
        }

        user = this._updateCachedUser(sub.user, sub);
      } else {
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
  }

  _processMetaTags(tags) {
    if (tags.length == 1 && tags[0] == Const.DEL_CHAR) {
      tags = [];
    }

    this._tags = tags;

    if (this.onTagsUpdated) {
      this.onTagsUpdated(tags);
    }
  }

  _processMetaCreds(creds) {}

  _processDelMessages(clear, delseq) {
    this._maxDel = Math.max(clear, this._maxDel);
    this.clear = Math.max(clear, this.clear);
    const topic = this;
    let count = 0;

    if (Array.isArray(delseq)) {
      delseq.forEach(function (range) {
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
  }

  _allMessagesReceived(count) {
    this._updateDeletedRanges();

    if (this.onAllMessagesReceived) {
      this.onAllMessagesReceived(count);
    }
  }

  _resetSub() {
    this._attached = false;
  }

  _gone() {
    this._messages.reset();

    this._tinode._db.remMessages(this.name);

    this._users = {};
    this.acs = new _accessMode.default(null);
    this.private = null;
    this.public = null;
    this.trusted = null;
    this._maxSeq = 0;
    this._minSeq = 0;
    this._attached = false;

    const me = this._tinode.getMeTopic();

    if (me) {
      me._routePres({
        _noForwarding: true,
        what: 'gone',
        topic: Const.TOPIC_ME,
        src: this.name
      });
    }

    if (this.onDeleteTopic) {
      this.onDeleteTopic();
    }
  }

  _updateCachedUser(uid, obj) {
    let cached = this._cacheGetUser(uid);

    cached = (0, _utils.mergeObj)(cached || {}, obj);

    this._cachePutUser(uid, cached);

    return (0, _utils.mergeToCache)(this._users, uid, cached);
  }

  _getQueuedSeqId() {
    return this._queuedSeqId++;
  }

  _updateDeletedRanges() {
    const ranges = [];
    let prev = null;

    const first = this._messages.getAt(0);

    if (first && this._minSeq > 1 && !this._noEarlierMsgs) {
      if (first.hi) {
        if (first.seq > 1) {
          first.seq = 1;
        }

        if (first.hi < this._minSeq - 1) {
          first.hi = this._minSeq - 1;
        }

        prev = first;
      } else {
        prev = {
          seq: 1,
          hi: this._minSeq - 1
        };
        ranges.push(prev);
      }
    } else {
      prev = {
        seq: 0,
        hi: 0
      };
    }

    this._messages.filter(data => {
      if (data.seq >= Const.LOCAL_SEQID) {
        return true;
      }

      if (data.seq == (prev.hi || prev.seq) + 1) {
        if (data.hi && prev.hi) {
          prev.hi = data.hi;
          return false;
        }

        prev = data;
        return true;
      }

      if (prev.hi) {
        prev.hi = data.hi || data.seq;
      } else {
        prev = {
          seq: prev.seq + 1,
          hi: data.hi || data.seq
        };
        ranges.push(prev);
      }

      if (!data.hi) {
        prev = data;
        return true;
      }

      return false;
    });

    const last = this._messages.getLast();

    const maxSeq = Math.max(this.seq, this._maxSeq) || 0;

    if (maxSeq > 0 && !last || last && (last.hi || last.seq) < maxSeq) {
      if (last && last.hi) {
        last.hi = maxSeq;
      } else {
        ranges.push({
          seq: last ? last.seq + 1 : 1,
          hi: maxSeq
        });
      }
    }

    ranges.forEach(gap => {
      gap._status = Const.MESSAGE_STATUS_DEL_RANGE;

      this._messages.put(gap);
    });
  }

  _loadMessages(db, params) {
    const {
      since,
      before,
      limit
    } = params || {};
    return db.readMessages(this.name, {
      since: since,
      before: before,
      limit: limit || Const.DEFAULT_MESSAGES_PAGE
    }).then(msgs => {
      msgs.forEach(data => {
        if (data.seq > this._maxSeq) {
          this._maxSeq = data.seq;
        }

        if (data.seq < this._minSeq || this._minSeq == 0) {
          this._minSeq = data.seq;
        }

        this._messages.put(data);
      });

      if (msgs.length > 0) {
        this._updateDeletedRanges();
      }

      return msgs.length;
    });
  }

  _updateReceived(seq, act) {
    this.touched = new Date();
    this.seq = seq | 0;

    if (!act || this._tinode.isMe(act)) {
      this.read = this.read ? Math.max(this.read, this.seq) : this.seq;
      this.recv = this.recv ? Math.max(this.read, this.recv) : this.read;
    }

    this.unread = this.seq - (this.read | 0);

    this._tinode._db.updTopic(this);
  }

}

exports.Topic = Topic;

class TopicMe extends Topic {
  constructor(callbacks) {
    super(Const.TOPIC_ME, callbacks);

    _defineProperty(this, "onContactUpdate", void 0);

    if (callbacks) {
      this.onContactUpdate = callbacks.onContactUpdate;
    }
  }

  _processMetaDesc(desc) {
    const turnOff = desc.acs && !desc.acs.isPresencer() && this.acs && this.acs.isPresencer();
    (0, _utils.mergeObj)(this, desc);

    this._tinode._db.updTopic(this);

    this._updateCachedUser(this._tinode._myUID, desc);

    if (turnOff) {
      this._tinode.mapTopics(cont => {
        if (cont.online) {
          cont.online = false;
          cont.seen = Object.assign(cont.seen || {}, {
            when: new Date()
          });

          this._refreshContact('off', cont);
        }
      });
    }

    if (this.onMetaDesc) {
      this.onMetaDesc(this);
    }
  }

  _processMetaSub(subs) {
    let updateCount = 0;
    subs.forEach(sub => {
      const topicName = sub.topic;

      if (topicName == Const.TOPIC_FND || topicName == Const.TOPIC_ME) {
        return;
      }

      sub.online = !!sub.online;
      let cont = null;

      if (sub.deleted) {
        cont = sub;

        this._tinode.cacheRemTopic(topicName);

        this._tinode._db.remTopic(topicName);
      } else {
        if (typeof sub.seq != 'undefined') {
          sub.seq = sub.seq | 0;
          sub.recv = sub.recv | 0;
          sub.read = sub.read | 0;
          sub.unread = sub.seq - sub.read;
        }

        cont = (0, _utils.mergeObj)(this._tinode.getTopic(topicName), sub);

        this._tinode._db.updTopic(cont);

        if (Topic.isP2PTopicName(topicName)) {
          this._cachePutUser(topicName, cont);

          this._tinode._db.updUser(topicName, cont.public);
        }

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
      subs.forEach(s => {
        keys.push(s.topic);
      });
      this.onSubsUpdated(keys, updateCount);
    }
  }

  _processMetaCreds(creds, upd) {
    if (creds.length == 1 && creds[0] == Const.DEL_CHAR) {
      creds = [];
    }

    if (upd) {
      creds.forEach(cr => {
        if (cr.val) {
          let idx = this._credentials.findIndex(el => {
            return el.meth == cr.meth && el.val == cr.val;
          });

          if (idx < 0) {
            if (!cr.done) {
              idx = this._credentials.findIndex(el => {
                return el.meth == cr.meth && !el.done;
              });

              if (idx >= 0) {
                this._credentials.splice(idx, 1);
              }
            }

            this._credentials.push(cr);
          } else {
            this._credentials[idx].done = cr.done;
          }
        } else if (cr.resp) {
          const idx = this._credentials.findIndex(el => {
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
  }

  _routePres(pres) {
    if (pres.what == 'term') {
      this._resetSub();

      return;
    }

    if (pres.what == 'upd' && pres.src == Const.TOPIC_ME) {
      this.getMeta(this.startMetaQuery().withDesc().build());
      return;
    }

    const cont = this._tinode.cacheGetTopic(pres.src);

    if (cont) {
      switch (pres.what) {
        case 'on':
          cont.online = true;
          break;

        case 'off':
          if (cont.online) {
            cont.online = false;
            cont.seen = Object.assign(cont.seen || {}, {
              when: new Date()
            });
          }

          break;

        case 'msg':
          cont._updateReceived(pres.seq, pres.act);

          break;

        case 'upd':
          this.getMeta(this.startMetaQuery().withLaterOneSub(pres.src).build());
          break;

        case 'acs':
          if (cont.acs) {
            cont.acs.updateAll(pres.dacs);
          } else {
            cont.acs = new _accessMode.default().updateAll(pres.dacs);
          }

          cont.touched = new Date();
          break;

        case 'ua':
          cont.seen = {
            when: new Date(),
            ua: pres.ua
          };
          break;

        case 'recv':
          pres.seq = pres.seq | 0;
          cont.recv = cont.recv ? Math.max(cont.recv, pres.seq) : pres.seq;
          break;

        case 'read':
          pres.seq = pres.seq | 0;
          cont.read = cont.read ? Math.max(cont.read, pres.seq) : pres.seq;
          cont.recv = cont.recv ? Math.max(cont.read, cont.recv) : cont.recv;
          cont.unread = cont.seq - cont.read;
          break;

        case 'gone':
          if (!cont._deleted) {
            cont._deleted = true;
            cont._attached = false;

            this._tinode._db.markTopicAsDeleted(pres.src, true);
          }

          break;

        case 'del':
          break;

        default:
          this._tinode.logger("INFO: Unsupported presence update in 'me'", pres.what);

      }

      this._refreshContact(pres.what, cont);
    } else {
      if (pres.what == 'acs') {
        const acs = new _accessMode.default(pres.dacs);

        if (!acs || acs.mode == _accessMode.default._INVALID) {
          this._tinode.logger("ERROR: Invalid access mode update", pres.src, pres.dacs);

          return;
        } else if (acs.mode == _accessMode.default._NONE) {
          this._tinode.logger("WARNING: Removing non-existent subscription", pres.src, pres.dacs);

          return;
        } else {
          this.getMeta(this.startMetaQuery().withOneSub(undefined, pres.src).build());

          const dummy = this._tinode.getTopic(pres.src);

          dummy.topic = pres.src;
          dummy.online = false;
          dummy.acs = acs;

          this._tinode._db.updTopic(dummy);
        }
      } else if (pres.what == 'tags') {
        this.getMeta(this.startMetaQuery().withTags().build());
      }
    }

    if (this.onPres) {
      this.onPres(pres);
    }
  }

  _refreshContact(what, cont) {
    if (this.onContactUpdate) {
      this.onContactUpdate(what, cont);
    }
  }

  publish() {
    return Promise.reject(new Error("Publishing to 'me' is not supported"));
  }

  delCredential(method, value) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot delete credential in inactive 'me' topic"));
    }

    return this._tinode.delCredential(method, value).then(ctrl => {
      const index = this._credentials.findIndex(el => {
        return el.meth == method && el.val == value;
      });

      if (index > -1) {
        this._credentials.splice(index, 1);
      }

      if (this.onCredsUpdated) {
        this.onCredsUpdated(this._credentials);
      }

      return ctrl;
    });
  }

  contacts(callback, filter, context) {
    this._tinode.mapTopics((c, idx) => {
      if (c.isCommType() && (!filter || filter(c))) {
        callback.call(context, c, idx);
      }
    });
  }

  getContact(name) {
    return this._tinode.cacheGetTopic(name);
  }

  getAccessMode(name) {
    if (name) {
      const cont = this._tinode.cacheGetTopic(name);

      return cont ? cont.acs : null;
    }

    return this.acs;
  }

  isArchived(name) {
    const cont = this._tinode.cacheGetTopic(name);

    return cont && cont.private && !!cont.private.arch;
  }

  getCredentials() {
    return this._credentials;
  }

}

exports.TopicMe = TopicMe;

class TopicFnd extends Topic {
  constructor(callbacks) {
    super(Const.TOPIC_FND, callbacks);

    _defineProperty(this, "_contacts", {});
  }

  _processMetaSub(subs) {
    let updateCount = Object.getOwnPropertyNames(this._contacts).length;
    this._contacts = {};

    for (let idx in subs) {
      let sub = subs[idx];
      const indexBy = sub.topic ? sub.topic : sub.user;
      sub = (0, _utils.mergeToCache)(this._contacts, indexBy, sub);
      updateCount++;

      if (this.onMetaSub) {
        this.onMetaSub(sub);
      }
    }

    if (updateCount > 0 && this.onSubsUpdated) {
      this.onSubsUpdated(Object.keys(this._contacts));
    }
  }

  publish() {
    return Promise.reject(new Error("Publishing to 'fnd' is not supported"));
  }

  setMeta(params) {
    return Object.getPrototypeOf(TopicFnd.prototype).setMeta.call(this, params).then(() => {
      if (Object.keys(this._contacts).length > 0) {
        this._contacts = {};

        if (this.onSubsUpdated) {
          this.onSubsUpdated([]);
        }
      }
    });
  }

  contacts(callback, context) {
    const cb = callback || this.onMetaSub;

    if (cb) {
      for (let idx in this._contacts) {
        cb.call(context, this._contacts[idx], idx, this._contacts);
      }
    }
  }

}

exports.TopicFnd = TopicFnd;

},{"./access-mode.js":1,"./cbuffer.js":2,"./config.js":3,"./drafty.js":6,"./meta-builder.js":8,"./utils.js":11}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isUrlRelative = isUrlRelative;
exports.jsonParseHelper = jsonParseHelper;
exports.mergeObj = mergeObj;
exports.mergeToCache = mergeToCache;
exports.normalizeArray = normalizeArray;
exports.rfc3339DateString = rfc3339DateString;
exports.simplify = simplify;

var _accessMode = _interopRequireDefault(require("./access-mode.js"));

var _config = _interopRequireDefault(require("./config.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function jsonParseHelper(key, val) {
  if (typeof val == 'string' && val.length >= 20 && val.length <= 24 && ['ts', 'touched', 'updated', 'created', 'when', 'deleted', 'expires'].includes(key)) {
    const date = new Date(val);

    if (!isNaN(date)) {
      return date;
    }
  } else if (key === 'acs' && typeof val === 'object') {
    return new _accessMode.default(val);
  }

  return val;
}

function isUrlRelative(url) {
  return url && !/^\s*([a-z][a-z0-9+.-]*:|\/\/)/im.test(url);
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d) && d.getTime() != 0;
}

function rfc3339DateString(d) {
  if (!isValidDate(d)) {
    return undefined;
  }

  const pad = function (val, sp) {
    sp = sp || 2;
    return '0'.repeat(sp - ('' + val).length) + val;
  };

  const millis = d.getUTCMilliseconds();
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + (millis ? '.' + pad(millis, 3) : '') + 'Z';
}

function mergeObj(dst, src, ignore) {
  if (typeof src != 'object') {
    if (src === undefined) {
      return dst;
    }

    if (src === _config.default) {
      return undefined;
    }

    return src;
  }

  if (src === null) {
    return src;
  }

  if (src instanceof Date && !isNaN(src)) {
    return !dst || !(dst instanceof Date) || isNaN(dst) || dst < src ? src : dst;
  }

  if (src instanceof _accessMode.default) {
    return new _accessMode.default(src);
  }

  if (src instanceof Array) {
    return src;
  }

  if (!dst || dst === _config.default) {
    dst = src.constructor();
  }

  for (let prop in src) {
    if (src.hasOwnProperty(prop) && (!ignore || !ignore[prop]) && prop != '_noForwarding') {
      dst[prop] = mergeObj(dst[prop], src[prop]);
    }
  }

  return dst;
}

function mergeToCache(cache, key, newval, ignore) {
  cache[key] = mergeObj(cache[key], newval, ignore);
  return cache[key];
}

function simplify(obj) {
  Object.keys(obj).forEach(key => {
    if (key[0] == '_') {
      delete obj[key];
    } else if (!obj[key]) {
      delete obj[key];
    } else if (Array.isArray(obj[key]) && obj[key].length == 0) {
      delete obj[key];
    } else if (!obj[key]) {
      delete obj[key];
    } else if (obj[key] instanceof Date) {
      if (!isValidDate(obj[key])) {
        delete obj[key];
      }
    } else if (typeof obj[key] == 'object') {
      simplify(obj[key]);

      if (Object.getOwnPropertyNames(obj[key]).length == 0) {
        delete obj[key];
      }
    }
  });
  return obj;
}

;

function normalizeArray(arr) {
  let out = [];

  if (Array.isArray(arr)) {
    for (let i = 0, l = arr.length; i < l; i++) {
      let t = arr[i];

      if (t) {
        t = t.trim().toLowerCase();

        if (t.length > 1) {
          out.push(t);
        }
      }
    }

    out.sort().filter(function (item, pos, ary) {
      return !pos || item != ary[pos - 1];
    });
  }

  if (out.length == 0) {
    out.push(_config.default);
  }

  return out;
}

},{"./access-mode.js":1,"./config.js":3}],12:[function(require,module,exports){
module.exports={"version": "0.18.3-beta1"}

},{}]},{},[9])(9)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYWNjZXNzLW1vZGUuanMiLCJzcmMvY2J1ZmZlci5qcyIsInNyYy9jb25maWcuanMiLCJzcmMvY29ubmVjdGlvbi5qcyIsInNyYy9kYi5qcyIsInNyYy9kcmFmdHkuanMiLCJzcmMvbGFyZ2UtZmlsZS5qcyIsInNyYy9tZXRhLWJ1aWxkZXIuanMiLCJzcmMvdGlub2RlLmpzIiwic3JjL3RvcGljLmpzIiwic3JjL3V0aWxzLmpzIiwidmVyc2lvbi5qc29uIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDS0E7Ozs7Ozs7Ozs7O0FBY2UsTUFBTSxVQUFOLENBQWlCO0FBQzlCLEVBQUEsV0FBVyxDQUFDLEdBQUQsRUFBTTtBQUNmLFFBQUksR0FBSixFQUFTO0FBQ1AsV0FBSyxLQUFMLEdBQWEsT0FBTyxHQUFHLENBQUMsS0FBWCxJQUFvQixRQUFwQixHQUErQixHQUFHLENBQUMsS0FBbkMsR0FBMkMsVUFBVSxDQUFDLE1BQVgsQ0FBa0IsR0FBRyxDQUFDLEtBQXRCLENBQXhEO0FBQ0EsV0FBSyxJQUFMLEdBQVksT0FBTyxHQUFHLENBQUMsSUFBWCxJQUFtQixRQUFuQixHQUE4QixHQUFHLENBQUMsSUFBbEMsR0FBeUMsVUFBVSxDQUFDLE1BQVgsQ0FBa0IsR0FBRyxDQUFDLElBQXRCLENBQXJEO0FBQ0EsV0FBSyxJQUFMLEdBQVksR0FBRyxDQUFDLElBQUosR0FBWSxPQUFPLEdBQUcsQ0FBQyxJQUFYLElBQW1CLFFBQW5CLEdBQThCLEdBQUcsQ0FBQyxJQUFsQyxHQUF5QyxVQUFVLENBQUMsTUFBWCxDQUFrQixHQUFHLENBQUMsSUFBdEIsQ0FBckQsR0FDVCxLQUFLLEtBQUwsR0FBYSxLQUFLLElBRHJCO0FBRUQ7QUFDRjs7QUFpQlksU0FBTixNQUFNLENBQUMsR0FBRCxFQUFNO0FBQ2pCLFFBQUksQ0FBQyxHQUFMLEVBQVU7QUFDUixhQUFPLElBQVA7QUFDRCxLQUZELE1B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SUFBK0MsQ0FBbkQsRUFBc0Q7QUFDcEQsZUFBTyxHQUFHLENBQUMsR0FBRCxDQUFWO0FBQ0Q7QUFDRjtBQUNGLEdBekJEO0FBMEJBLFNBQU8sR0FBUDtBQUNEOztBQUFBOztBQUtNLFNBQVMsY0FBVCxDQUF3QixHQUF4QixFQUE2QjtBQUNsQyxNQUFJLEdBQUcsR0FBRyxFQUFWOztBQUNBLE1BQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQUosRUFBd0I7QUFFdEIsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFSLEVBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUF4QixFQUFnQyxDQUFDLEdBQUcsQ0FBcEMsRUFBdUMsQ0FBQyxFQUF4QyxFQUE0QztBQUMxQyxVQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBRCxDQUFYOztBQUNBLFVBQUksQ0FBSixFQUFPO0FBQ0wsUUFBQSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUYsR0FBUyxXQUFULEVBQUo7O0FBQ0EsWUFBSSxDQUFDLENBQUMsTUFBRixHQUFXLENBQWYsRUFBa0I7QUFDaEIsVUFBQSxHQUFHLENBQUMsSUFBSixDQUFTLENBQVQ7QUFDRDtBQUNGO0FBQ0Y7O0FBQ0QsSUFBQSxHQUFHLENBQUMsSUFBSixHQUFXLE1BQVgsQ0FBa0IsVUFBUyxJQUFULEVBQWUsR0FBZixFQUFvQixHQUFwQixFQUF5QjtBQUN6QyxhQUFPLENBQUMsR0FBRCxJQUFRLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQVAsQ0FBMUI7QUFDRCxLQUZEO0FBR0Q7O0FBQ0QsTUFBSSxHQUFHLENBQUMsTUFBSixJQUFjLENBQWxCLEVBQXFCO0FBR25CLElBQUEsR0FBRyxDQUFDLElBQUosQ0FBUyxlQUFUO0FBQ0Q7O0FBQ0QsU0FBTyxHQUFQO0FBQ0Q7OztBQ3RLRDtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyoqXG4gKiBAZmlsZSBBY2Nlc3MgY29udHJvbCBtb2RlbC5cbiAqXG4gKiBAY29weXJpZ2h0IDIwMTUtMjAyMiBUaW5vZGUgTExDLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbi8vIE5PVEUgVE8gREVWRUxPUEVSUzpcbi8vIExvY2FsaXphYmxlIHN0cmluZ3Mgc2hvdWxkIGJlIGRvdWJsZSBxdW90ZWQgXCLRgdGC0YDQvtC60LAg0L3QsCDQtNGA0YPQs9C+0Lwg0Y/Qt9GL0LrQtVwiLFxuLy8gbm9uLWxvY2FsaXphYmxlIHN0cmluZ3Mgc2hvdWxkIGJlIHNpbmdsZSBxdW90ZWQgJ25vbi1sb2NhbGl6ZWQnLlxuXG4vKipcbiAqIEhlbHBlciBjbGFzcyBmb3IgaGFuZGxpbmcgYWNjZXNzIG1vZGUuXG4gKlxuICogQGNsYXNzIEFjY2Vzc01vZGVcbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqXG4gKiBAcGFyYW0ge0FjY2Vzc01vZGV8T2JqZWN0PX0gYWNzIC0gQWNjZXNzTW9kZSB0byBjb3B5IG9yIGFjY2VzcyBtb2RlIG9iamVjdCByZWNlaXZlZCBmcm9tIHRoZSBzZXJ2ZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFjY2Vzc01vZGUge1xuICBjb25zdHJ1Y3RvcihhY3MpIHtcbiAgICBpZiAoYWNzKSB7XG4gICAgICB0aGlzLmdpdmVuID0gdHlwZW9mIGFjcy5naXZlbiA9PSAnbnVtYmVyJyA/IGFjcy5naXZlbiA6IEFjY2Vzc01vZGUuZGVjb2RlKGFjcy5naXZlbik7XG4gICAgICB0aGlzLndhbnQgPSB0eXBlb2YgYWNzLndhbnQgPT0gJ251bWJlcicgPyBhY3Mud2FudCA6IEFjY2Vzc01vZGUuZGVjb2RlKGFjcy53YW50KTtcbiAgICAgIHRoaXMubW9kZSA9IGFjcy5tb2RlID8gKHR5cGVvZiBhY3MubW9kZSA9PSAnbnVtYmVyJyA/IGFjcy5tb2RlIDogQWNjZXNzTW9kZS5kZWNvZGUoYWNzLm1vZGUpKSA6XG4gICAgICAgICh0aGlzLmdpdmVuICYgdGhpcy53YW50KTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgI2NoZWNrRmxhZyh2YWwsIHNpZGUsIGZsYWcpIHtcbiAgICBzaWRlID0gc2lkZSB8fCAnbW9kZSc7XG4gICAgaWYgKFsnZ2l2ZW4nLCAnd2FudCcsICdtb2RlJ10uaW5jbHVkZXMoc2lkZSkpIHtcbiAgICAgIHJldHVybiAoKHZhbFtzaWRlXSAmIGZsYWcpICE9IDApO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgQWNjZXNzTW9kZSBjb21wb25lbnQgJyR7c2lkZX0nYCk7XG4gIH1cbiAgLyoqXG4gICAqIFBhcnNlIHN0cmluZyBpbnRvIGFuIGFjY2VzcyBtb2RlIHZhbHVlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IE51bWJlcn0gbW9kZSAtIGVpdGhlciBhIFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWNjZXNzIG1vZGUgdG8gcGFyc2Ugb3IgYSBzZXQgb2YgYml0cyB0byBhc3NpZ24uXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IC0gQWNjZXNzIG1vZGUgYXMgYSBudW1lcmljIHZhbHVlLlxuICAgKi9cbiAgc3RhdGljIGRlY29kZShzdHIpIHtcbiAgICBpZiAoIXN0cikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3RyID09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gc3RyICYgQWNjZXNzTW9kZS5fQklUTUFTSztcbiAgICB9IGVsc2UgaWYgKHN0ciA9PT0gJ04nIHx8IHN0ciA9PT0gJ24nKSB7XG4gICAgICByZXR1cm4gQWNjZXNzTW9kZS5fTk9ORTtcbiAgICB9XG5cbiAgICBjb25zdCBiaXRtYXNrID0ge1xuICAgICAgJ0onOiBBY2Nlc3NNb2RlLl9KT0lOLFxuICAgICAgJ1InOiBBY2Nlc3NNb2RlLl9SRUFELFxuICAgICAgJ1cnOiBBY2Nlc3NNb2RlLl9XUklURSxcbiAgICAgICdQJzogQWNjZXNzTW9kZS5fUFJFUyxcbiAgICAgICdBJzogQWNjZXNzTW9kZS5fQVBQUk9WRSxcbiAgICAgICdTJzogQWNjZXNzTW9kZS5fU0hBUkUsXG4gICAgICAnRCc6IEFjY2Vzc01vZGUuX0RFTEVURSxcbiAgICAgICdPJzogQWNjZXNzTW9kZS5fT1dORVJcbiAgICB9O1xuXG4gICAgbGV0IG0wID0gQWNjZXNzTW9kZS5fTk9ORTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBiaXQgPSBiaXRtYXNrW3N0ci5jaGFyQXQoaSkudG9VcHBlckNhc2UoKV07XG4gICAgICBpZiAoIWJpdCkge1xuICAgICAgICAvLyBVbnJlY29nbml6ZWQgYml0LCBza2lwLlxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG0wIHw9IGJpdDtcbiAgICB9XG4gICAgcmV0dXJuIG0wO1xuICB9XG4gIC8qKlxuICAgKiBDb252ZXJ0IG51bWVyaWMgcmVwcmVzZW50YXRpb24gb2YgdGhlIGFjY2VzcyBtb2RlIGludG8gYSBzdHJpbmcuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAc3RhdGljXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgLSBhY2Nlc3MgbW9kZSB2YWx1ZSB0byBjb252ZXJ0IHRvIGEgc3RyaW5nLlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIEFjY2VzcyBtb2RlIGFzIGEgc3RyaW5nLlxuICAgKi9cbiAgc3RhdGljIGVuY29kZSh2YWwpIHtcbiAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gQWNjZXNzTW9kZS5fSU5WQUxJRCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmICh2YWwgPT09IEFjY2Vzc01vZGUuX05PTkUpIHtcbiAgICAgIHJldHVybiAnTic7XG4gICAgfVxuXG4gICAgY29uc3QgYml0bWFzayA9IFsnSicsICdSJywgJ1cnLCAnUCcsICdBJywgJ1MnLCAnRCcsICdPJ107XG4gICAgbGV0IHJlcyA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYml0bWFzay5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCh2YWwgJiAoMSA8PCBpKSkgIT0gMCkge1xuICAgICAgICByZXMgPSByZXMgKyBiaXRtYXNrW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIC8qKlxuICAgKiBVcGRhdGUgbnVtZXJpYyByZXByZXNlbnRhdGlvbiBvZiBhY2Nlc3MgbW9kZSB3aXRoIHRoZSBuZXcgdmFsdWUuIFRoZSB2YWx1ZVxuICAgKiBpcyBvbmUgb2YgdGhlIGZvbGxvd2luZzpcbiAgICogIC0gYSBzdHJpbmcgc3RhcnRpbmcgd2l0aCA8Y29kZT4nKyc8L2NvZGU+IG9yIDxjb2RlPictJzwvY29kZT4gdGhlbiB0aGUgYml0cyB0byBhZGQgb3IgcmVtb3ZlLCBlLmcuIDxjb2RlPicrUi1XJzwvY29kZT4gb3IgPGNvZGU+Jy1QUyc8L2NvZGU+LlxuICAgKiAgLSBhIG5ldyB2YWx1ZSBvZiBhY2Nlc3MgbW9kZVxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsIC0gYWNjZXNzIG1vZGUgdmFsdWUgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXBkIC0gdXBkYXRlIHRvIGFwcGx5IHRvIHZhbC5cbiAgICogQHJldHVybnMge251bWJlcn0gLSB1cGRhdGVkIGFjY2VzcyBtb2RlLlxuICAgKi9cbiAgc3RhdGljIHVwZGF0ZSh2YWwsIHVwZCkge1xuICAgIGlmICghdXBkIHx8IHR5cGVvZiB1cGQgIT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuXG4gICAgbGV0IGFjdGlvbiA9IHVwZC5jaGFyQXQoMCk7XG4gICAgaWYgKGFjdGlvbiA9PSAnKycgfHwgYWN0aW9uID09ICctJykge1xuICAgICAgbGV0IHZhbDAgPSB2YWw7XG4gICAgICAvLyBTcGxpdCBkZWx0YS1zdHJpbmcgbGlrZSAnK0FCQy1ERUYrWicgaW50byBhbiBhcnJheSBvZiBwYXJ0cyBpbmNsdWRpbmcgKyBhbmQgLS5cbiAgICAgIGNvbnN0IHBhcnRzID0gdXBkLnNwbGl0KC8oWy0rXSkvKTtcbiAgICAgIC8vIFN0YXJ0aW5nIGl0ZXJhdGlvbiBmcm9tIDEgYmVjYXVzZSBTdHJpbmcuc3BsaXQoKSBjcmVhdGVzIGFuIGFycmF5IHdpdGggdGhlIGZpcnN0IGVtcHR5IGVsZW1lbnQuXG4gICAgICAvLyBJdGVyYXRpbmcgYnkgMiBiZWNhdXNlIHdlIHBhcnNlIHBhaXJzICsvLSB0aGVuIGRhdGEuXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBhcnRzLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgICBhY3Rpb24gPSBwYXJ0c1tpXTtcbiAgICAgICAgY29uc3QgbTAgPSBBY2Nlc3NNb2RlLmRlY29kZShwYXJ0c1tpICsgMV0pO1xuICAgICAgICBpZiAobTAgPT0gQWNjZXNzTW9kZS5fSU5WQUxJRCkge1xuICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG0wID09IG51bGwpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWN0aW9uID09PSAnKycpIHtcbiAgICAgICAgICB2YWwwIHw9IG0wO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJy0nKSB7XG4gICAgICAgICAgdmFsMCAmPSB+bTA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhbCA9IHZhbDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBzdHJpbmcgaXMgYW4gZXhwbGljaXQgbmV3IHZhbHVlICdBQkMnIHJhdGhlciB0aGFuIGRlbHRhLlxuICAgICAgY29uc3QgdmFsMCA9IEFjY2Vzc01vZGUuZGVjb2RlKHVwZCk7XG4gICAgICBpZiAodmFsMCAhPSBBY2Nlc3NNb2RlLl9JTlZBTElEKSB7XG4gICAgICAgIHZhbCA9IHZhbDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuICAvKipcbiAgICogQml0cyBwcmVzZW50IGluIGExIGJ1dCBtaXNzaW5nIGluIGEyLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXIgfCBzdHJpbmd9IGExIC0gYWNjZXNzIG1vZGUgdG8gc3VidHJhY3QgZnJvbS5cbiAgICogQHBhcmFtIHtudW1iZXIgfCBzdHJpbmd9IGEyIC0gYWNjZXNzIG1vZGUgdG8gc3VidHJhY3QuXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IGFjY2VzcyBtb2RlIHdpdGggYml0cyBwcmVzZW50IGluIDxjb2RlPmExPC9jb2RlPiBidXQgbWlzc2luZyBpbiA8Y29kZT5hMjwvY29kZT4uXG4gICAqL1xuICBzdGF0aWMgZGlmZihhMSwgYTIpIHtcbiAgICBhMSA9IEFjY2Vzc01vZGUuZGVjb2RlKGExKTtcbiAgICBhMiA9IEFjY2Vzc01vZGUuZGVjb2RlKGEyKTtcblxuICAgIGlmIChhMSA9PSBBY2Nlc3NNb2RlLl9JTlZBTElEIHx8IGEyID09IEFjY2Vzc01vZGUuX0lOVkFMSUQpIHtcbiAgICAgIHJldHVybiBBY2Nlc3NNb2RlLl9JTlZBTElEO1xuICAgIH1cbiAgICByZXR1cm4gYTEgJiB+YTI7XG4gIH1cbiAgLyoqXG4gICAqIEFjY2Vzc01vZGUgaXMgYSBjbGFzcyByZXByZXNlbnRpbmcgdG9waWMgYWNjZXNzIG1vZGUuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQGNsYXNzIEFjY2Vzc01vZGVcbiAgICovXG4gIC8qKlxuICAgKiBDdXN0b20gZm9ybWF0dGVyXG4gICAqL1xuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gJ3tcIm1vZGVcIjogXCInICsgQWNjZXNzTW9kZS5lbmNvZGUodGhpcy5tb2RlKSArXG4gICAgICAnXCIsIFwiZ2l2ZW5cIjogXCInICsgQWNjZXNzTW9kZS5lbmNvZGUodGhpcy5naXZlbikgK1xuICAgICAgJ1wiLCBcIndhbnRcIjogXCInICsgQWNjZXNzTW9kZS5lbmNvZGUodGhpcy53YW50KSArICdcIn0nO1xuICB9XG4gIC8qKlxuICAgKiBBY2Nlc3NNb2RlIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIHRvcGljIGFjY2VzcyBtb2RlLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBjbGFzcyBBY2Nlc3NNb2RlXG4gICAqL1xuICAvKipcbiAgICogQ29udmVydHMgbnVtZXJpYyB2YWx1ZXMgdG8gc3RyaW5ncy5cbiAgICovXG4gIGpzb25IZWxwZXIoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1vZGU6IEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMubW9kZSksXG4gICAgICBnaXZlbjogQWNjZXNzTW9kZS5lbmNvZGUodGhpcy5naXZlbiksXG4gICAgICB3YW50OiBBY2Nlc3NNb2RlLmVuY29kZSh0aGlzLndhbnQpXG4gICAgfTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIEFzc2lnbiB2YWx1ZSB0byAnbW9kZScuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IE51bWJlcn0gbSAtIGVpdGhlciBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWNjZXNzIG1vZGUgb3IgYSBzZXQgb2YgYml0cy5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IC0gPGNvZGU+dGhpczwvY29kZT4gQWNjZXNzTW9kZS5cbiAgICovXG4gIHNldE1vZGUobSkge1xuICAgIHRoaXMubW9kZSA9IEFjY2Vzc01vZGUuZGVjb2RlKG0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qKlxuICAgKiBBY2Nlc3NNb2RlIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIHRvcGljIGFjY2VzcyBtb2RlLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBjbGFzcyBBY2Nlc3NNb2RlXG4gICAqL1xuICAvKipcbiAgICogVXBkYXRlIDxjb2RlPm1vZGU8L2NvZGU+IHZhbHVlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHUgLSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGNoYW5nZXMgdG8gYXBwbHkgdG8gYWNjZXNzIG1vZGUuXG4gICAqIEByZXR1cm5zIHtBY2Nlc3NNb2RlfSAtIDxjb2RlPnRoaXM8L2NvZGU+IEFjY2Vzc01vZGUuXG4gICAqL1xuICB1cGRhdGVNb2RlKHUpIHtcbiAgICB0aGlzLm1vZGUgPSBBY2Nlc3NNb2RlLnVwZGF0ZSh0aGlzLm1vZGUsIHUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qKlxuICAgKiBBY2Nlc3NNb2RlIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIHRvcGljIGFjY2VzcyBtb2RlLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBjbGFzcyBBY2Nlc3NNb2RlXG4gICAqL1xuICAvKipcbiAgICogR2V0IDxjb2RlPm1vZGU8L2NvZGU+IHZhbHVlIGFzIGEgc3RyaW5nLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHJldHVybnMge3N0cmluZ30gLSA8Y29kZT5tb2RlPC9jb2RlPiB2YWx1ZS5cbiAgICovXG4gIGdldE1vZGUoKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMubW9kZSk7XG4gIH1cbiAgLyoqXG4gICAqIEFjY2Vzc01vZGUgaXMgYSBjbGFzcyByZXByZXNlbnRpbmcgdG9waWMgYWNjZXNzIG1vZGUuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQGNsYXNzIEFjY2Vzc01vZGVcbiAgICovXG4gIC8qKlxuICAgKiBBc3NpZ24gPGNvZGU+Z2l2ZW48L2NvZGU+ICB2YWx1ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgTnVtYmVyfSBnIC0gZWl0aGVyIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhY2Nlc3MgbW9kZSBvciBhIHNldCBvZiBiaXRzLlxuICAgKiBAcmV0dXJucyB7QWNjZXNzTW9kZX0gLSA8Y29kZT50aGlzPC9jb2RlPiBBY2Nlc3NNb2RlLlxuICAgKi9cbiAgc2V0R2l2ZW4oZykge1xuICAgIHRoaXMuZ2l2ZW4gPSBBY2Nlc3NNb2RlLmRlY29kZShnKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIFVwZGF0ZSAnZ2l2ZW4nIHZhbHVlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHUgLSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGNoYW5nZXMgdG8gYXBwbHkgdG8gYWNjZXNzIG1vZGUuXG4gICAqIEByZXR1cm5zIHtBY2Nlc3NNb2RlfSAtIDxjb2RlPnRoaXM8L2NvZGU+IEFjY2Vzc01vZGUuXG4gICAqL1xuICB1cGRhdGVHaXZlbih1KSB7XG4gICAgdGhpcy5naXZlbiA9IEFjY2Vzc01vZGUudXBkYXRlKHRoaXMuZ2l2ZW4sIHUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qKlxuICAgKiBBY2Nlc3NNb2RlIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIHRvcGljIGFjY2VzcyBtb2RlLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBjbGFzcyBBY2Nlc3NNb2RlXG4gICAqL1xuICAvKipcbiAgICogR2V0ICdnaXZlbicgdmFsdWUgYXMgYSBzdHJpbmcuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIDxiPmdpdmVuPC9iPiB2YWx1ZS5cbiAgICovXG4gIGdldEdpdmVuKCkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLmVuY29kZSh0aGlzLmdpdmVuKTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIEFzc2lnbiAnd2FudCcgdmFsdWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IE51bWJlcn0gdyAtIGVpdGhlciBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWNjZXNzIG1vZGUgb3IgYSBzZXQgb2YgYml0cy5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IC0gPGNvZGU+dGhpczwvY29kZT4gQWNjZXNzTW9kZS5cbiAgICovXG4gIHNldFdhbnQodykge1xuICAgIHRoaXMud2FudCA9IEFjY2Vzc01vZGUuZGVjb2RlKHcpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qKlxuICAgKiBBY2Nlc3NNb2RlIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIHRvcGljIGFjY2VzcyBtb2RlLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBjbGFzcyBBY2Nlc3NNb2RlXG4gICAqL1xuICAvKipcbiAgICogVXBkYXRlICd3YW50JyB2YWx1ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1IC0gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjaGFuZ2VzIHRvIGFwcGx5IHRvIGFjY2VzcyBtb2RlLlxuICAgKiBAcmV0dXJucyB7QWNjZXNzTW9kZX0gLSA8Y29kZT50aGlzPC9jb2RlPiBBY2Nlc3NNb2RlLlxuICAgKi9cbiAgdXBkYXRlV2FudCh1KSB7XG4gICAgdGhpcy53YW50ID0gQWNjZXNzTW9kZS51cGRhdGUodGhpcy53YW50LCB1KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIEdldCAnd2FudCcgdmFsdWUgYXMgYSBzdHJpbmcuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIDxiPndhbnQ8L2I+IHZhbHVlLlxuICAgKi9cbiAgZ2V0V2FudCgpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS5lbmNvZGUodGhpcy53YW50KTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIEdldCBwZXJtaXNzaW9ucyBwcmVzZW50IGluICd3YW50JyBidXQgbWlzc2luZyBpbiAnZ2l2ZW4nLlxuICAgKiBJbnZlcnNlIG9mIHtAbGluayBUaW5vZGUuQWNjZXNzTW9kZSNnZXRFeGNlc3NpdmV9XG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBwZXJtaXNzaW9ucyBwcmVzZW50IGluIDxiPndhbnQ8L2I+IGJ1dCBtaXNzaW5nIGluIDxiPmdpdmVuPC9iPi5cbiAgICovXG4gIGdldE1pc3NpbmcoKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMud2FudCAmIH50aGlzLmdpdmVuKTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIEdldCBwZXJtaXNzaW9ucyBwcmVzZW50IGluICdnaXZlbicgYnV0IG1pc3NpbmcgaW4gJ3dhbnQnLlxuICAgKiBJbnZlcnNlIG9mIHtAbGluayBUaW5vZGUuQWNjZXNzTW9kZSNnZXRNaXNzaW5nfVxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICpcbiAgICogQHJldHVybnMge3N0cmluZ30gcGVybWlzc2lvbnMgcHJlc2VudCBpbiA8Yj5naXZlbjwvYj4gYnV0IG1pc3NpbmcgaW4gPGI+d2FudDwvYj4uXG4gICAqL1xuICBnZXRFeGNlc3NpdmUoKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuZW5jb2RlKHRoaXMuZ2l2ZW4gJiB+dGhpcy53YW50KTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIFVwZGF0ZSAnd2FudCcsICdnaXZlJywgYW5kICdtb2RlJyB2YWx1ZXMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKlxuICAgKiBAcGFyYW0ge0FjY2Vzc01vZGV9IHZhbCAtIG5ldyBhY2Nlc3MgbW9kZSB2YWx1ZS5cbiAgICogQHJldHVybnMge0FjY2Vzc01vZGV9IC0gPGNvZGU+dGhpczwvY29kZT4gQWNjZXNzTW9kZS5cbiAgICovXG4gIHVwZGF0ZUFsbCh2YWwpIHtcbiAgICBpZiAodmFsKSB7XG4gICAgICB0aGlzLnVwZGF0ZUdpdmVuKHZhbC5naXZlbik7XG4gICAgICB0aGlzLnVwZGF0ZVdhbnQodmFsLndhbnQpO1xuICAgICAgdGhpcy5tb2RlID0gdGhpcy5naXZlbiAmIHRoaXMud2FudDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgLyoqXG4gICAqIEFjY2Vzc01vZGUgaXMgYSBjbGFzcyByZXByZXNlbnRpbmcgdG9waWMgYWNjZXNzIG1vZGUuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQGNsYXNzIEFjY2Vzc01vZGVcbiAgICovXG4gIC8qKlxuICAgKiBDaGVjayBpZiBPd25lciAoTykgZmxhZyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc093bmVyKHNpZGUpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS4jY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX09XTkVSKTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIENoZWNrIGlmIFByZXNlbmNlIChQKSBmbGFnIGlzIHNldC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gc2lkZSAtIHdoaWNoIHBlcm1pc3Npb24gdG8gY2hlY2s6IGdpdmVuLCB3YW50LCBtb2RlOyBkZWZhdWx0OiBtb2RlLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiBmbGFnIGlzIHNldC5cbiAgICovXG4gIGlzUHJlc2VuY2VyKHNpZGUpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS4jY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX1BSRVMpO1xuICB9XG4gIC8qKlxuICAgKiBBY2Nlc3NNb2RlIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIHRvcGljIGFjY2VzcyBtb2RlLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBjbGFzcyBBY2Nlc3NNb2RlXG4gICAqL1xuICAvKipcbiAgICogQ2hlY2sgaWYgUHJlc2VuY2UgKFApIGZsYWcgaXMgTk9UIHNldC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5BY2Nlc3NNb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gc2lkZSAtIHdoaWNoIHBlcm1pc3Npb24gdG8gY2hlY2s6IGdpdmVuLCB3YW50LCBtb2RlOyBkZWZhdWx0OiBtb2RlLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiBmbGFnIGlzIHNldC5cbiAgICovXG4gIGlzTXV0ZWQoc2lkZSkge1xuICAgIHJldHVybiAhdGhpcy5pc1ByZXNlbmNlcihzaWRlKTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIENoZWNrIGlmIEpvaW4gKEopIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNKb2luZXIoc2lkZSkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLiNjaGVja0ZsYWcodGhpcywgc2lkZSwgQWNjZXNzTW9kZS5fSk9JTik7XG4gIH1cbiAgLyoqXG4gICAqIEFjY2Vzc01vZGUgaXMgYSBjbGFzcyByZXByZXNlbnRpbmcgdG9waWMgYWNjZXNzIG1vZGUuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQGNsYXNzIEFjY2Vzc01vZGVcbiAgICovXG4gIC8qKlxuICAgKiBDaGVjayBpZiBSZWFkZXIgKFIpIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNSZWFkZXIoc2lkZSkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLiNjaGVja0ZsYWcodGhpcywgc2lkZSwgQWNjZXNzTW9kZS5fUkVBRCk7XG4gIH1cbiAgLyoqXG4gICAqIEFjY2Vzc01vZGUgaXMgYSBjbGFzcyByZXByZXNlbnRpbmcgdG9waWMgYWNjZXNzIG1vZGUuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQGNsYXNzIEFjY2Vzc01vZGVcbiAgICovXG4gIC8qKlxuICAgKiBDaGVjayBpZiBXcml0ZXIgKFcpIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNXcml0ZXIoc2lkZSkge1xuICAgIHJldHVybiBBY2Nlc3NNb2RlLiNjaGVja0ZsYWcodGhpcywgc2lkZSwgQWNjZXNzTW9kZS5fV1JJVEUpO1xuICB9XG4gIC8qKlxuICAgKiBBY2Nlc3NNb2RlIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIHRvcGljIGFjY2VzcyBtb2RlLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBjbGFzcyBBY2Nlc3NNb2RlXG4gICAqL1xuICAvKipcbiAgICogQ2hlY2sgaWYgQXBwcm92ZXIgKEEpIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNBcHByb3ZlcihzaWRlKSB7XG4gICAgcmV0dXJuIEFjY2Vzc01vZGUuI2NoZWNrRmxhZyh0aGlzLCBzaWRlLCBBY2Nlc3NNb2RlLl9BUFBST1ZFKTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIENoZWNrIGlmIGVpdGhlciBvbmUgb2YgT3duZXIgKE8pIG9yIEFwcHJvdmVyIChBKSBmbGFncyBpcyBzZXQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQWNjZXNzTW9kZVxuICAgKiBAcGFyYW0ge3N0cmluZz19IHNpZGUgLSB3aGljaCBwZXJtaXNzaW9uIHRvIGNoZWNrOiBnaXZlbiwgd2FudCwgbW9kZTsgZGVmYXVsdDogbW9kZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgZmxhZyBpcyBzZXQuXG4gICAqL1xuICBpc0FkbWluKHNpZGUpIHtcbiAgICByZXR1cm4gdGhpcy5pc093bmVyKHNpZGUpIHx8IHRoaXMuaXNBcHByb3ZlcihzaWRlKTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIENoZWNrIGlmIGVpdGhlciBvbmUgb2YgT3duZXIgKE8pLCBBcHByb3ZlciAoQSksIG9yIFNoYXJlciAoUykgZmxhZ3MgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNTaGFyZXIoc2lkZSkge1xuICAgIHJldHVybiB0aGlzLmlzQWRtaW4oc2lkZSkgfHwgQWNjZXNzTW9kZS4jY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX1NIQVJFKTtcbiAgfVxuICAvKipcbiAgICogQWNjZXNzTW9kZSBpcyBhIGNsYXNzIHJlcHJlc2VudGluZyB0b3BpYyBhY2Nlc3MgbW9kZS5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAY2xhc3MgQWNjZXNzTW9kZVxuICAgKi9cbiAgLyoqXG4gICAqIENoZWNrIGlmIERlbGV0ZXIgKEQpIGZsYWcgaXMgc2V0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkFjY2Vzc01vZGVcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzaWRlIC0gd2hpY2ggcGVybWlzc2lvbiB0byBjaGVjazogZ2l2ZW4sIHdhbnQsIG1vZGU7IGRlZmF1bHQ6IG1vZGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIGZsYWcgaXMgc2V0LlxuICAgKi9cbiAgaXNEZWxldGVyKHNpZGUpIHtcbiAgICByZXR1cm4gQWNjZXNzTW9kZS4jY2hlY2tGbGFnKHRoaXMsIHNpZGUsIEFjY2Vzc01vZGUuX0RFTEVURSk7XG4gIH1cbn1cblxuQWNjZXNzTW9kZS5fTk9ORSA9IDB4MDA7XG5BY2Nlc3NNb2RlLl9KT0lOID0gMHgwMTtcbkFjY2Vzc01vZGUuX1JFQUQgPSAweDAyO1xuQWNjZXNzTW9kZS5fV1JJVEUgPSAweDA0O1xuQWNjZXNzTW9kZS5fUFJFUyA9IDB4MDg7XG5BY2Nlc3NNb2RlLl9BUFBST1ZFID0gMHgxMDtcbkFjY2Vzc01vZGUuX1NIQVJFID0gMHgyMDtcbkFjY2Vzc01vZGUuX0RFTEVURSA9IDB4NDA7XG5BY2Nlc3NNb2RlLl9PV05FUiA9IDB4ODA7XG5cbkFjY2Vzc01vZGUuX0JJVE1BU0sgPSBBY2Nlc3NNb2RlLl9KT0lOIHwgQWNjZXNzTW9kZS5fUkVBRCB8IEFjY2Vzc01vZGUuX1dSSVRFIHwgQWNjZXNzTW9kZS5fUFJFUyB8XG4gIEFjY2Vzc01vZGUuX0FQUFJPVkUgfCBBY2Nlc3NNb2RlLl9TSEFSRSB8IEFjY2Vzc01vZGUuX0RFTEVURSB8IEFjY2Vzc01vZGUuX09XTkVSO1xuQWNjZXNzTW9kZS5fSU5WQUxJRCA9IDB4MTAwMDAwO1xuIiwiLyoqXG4gKiBAZmlsZSBJbi1tZW1vcnkgc29ydGVkIGNhY2hlIG9mIG9iamVjdHMuXG4gKlxuICogQGNvcHlyaWdodCAyMDE1LTIwMjIgVGlub2RlIExMQy5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEluLW1lbW9yeSBzb3J0ZWQgY2FjaGUgb2Ygb2JqZWN0cy5cbiAqXG4gKiBAY2xhc3MgQ0J1ZmZlclxuICogQG1lbWJlcm9mIFRpbm9kZVxuICogQHByb3RlY3RlZFxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBhcmUgY3VzdG9tIGNvbXBhcmF0b3Igb2Ygb2JqZWN0cy4gVGFrZXMgdHdvIHBhcmFtZXRlcnMgPGNvZGU+YTwvY29kZT4gYW5kIDxjb2RlPmI8L2NvZGU+O1xuICogICAgcmV0dXJucyA8Y29kZT4tMTwvY29kZT4gaWYgPGNvZGU+YSA8IGI8L2NvZGU+LCA8Y29kZT4wPC9jb2RlPiBpZiA8Y29kZT5hID09IGI8L2NvZGU+LCA8Y29kZT4xPC9jb2RlPiBvdGhlcndpc2UuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHVuaXF1ZSBlbmZvcmNlIGVsZW1lbnQgdW5pcXVlbmVzczogd2hlbiA8Y29kZT50cnVlPC9jb2RlPiByZXBsYWNlIGV4aXN0aW5nIGVsZW1lbnQgd2l0aCBhIG5ld1xuICogICAgb25lIG9uIGNvbmZsaWN0OyB3aGVuIDxjb2RlPmZhbHNlPC9jb2RlPiBrZWVwIGJvdGggZWxlbWVudHMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENCdWZmZXIge1xuICAjY29tcGFyYXRvciA9IHVuZGVmaW5lZDtcbiAgI3VuaXF1ZSA9IGZhbHNlO1xuICBidWZmZXIgPSBbXTtcblxuICBjb25zdHJ1Y3Rvcihjb21wYXJlXywgdW5pcXVlXykge1xuICAgIHRoaXMuI2NvbXBhcmF0b3IgPSBjb21wYXJlXyB8fCAoKGEsIGIpID0+IHtcbiAgICAgIHJldHVybiBhID09PSBiID8gMCA6IGEgPCBiID8gLTEgOiAxO1xuICAgIH0pO1xuICAgIHRoaXMuI3VuaXF1ZSA9IHVuaXF1ZV87XG4gIH1cblxuICAjZmluZE5lYXJlc3QoZWxlbSwgYXJyLCBleGFjdCkge1xuICAgIGxldCBzdGFydCA9IDA7XG4gICAgbGV0IGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGxldCBwaXZvdCA9IDA7XG4gICAgbGV0IGRpZmYgPSAwO1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuXG4gICAgd2hpbGUgKHN0YXJ0IDw9IGVuZCkge1xuICAgICAgcGl2b3QgPSAoc3RhcnQgKyBlbmQpIC8gMiB8IDA7XG4gICAgICBkaWZmID0gdGhpcy4jY29tcGFyYXRvcihhcnJbcGl2b3RdLCBlbGVtKTtcbiAgICAgIGlmIChkaWZmIDwgMCkge1xuICAgICAgICBzdGFydCA9IHBpdm90ICsgMTtcbiAgICAgIH0gZWxzZSBpZiAoZGlmZiA+IDApIHtcbiAgICAgICAgZW5kID0gcGl2b3QgLSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGZvdW5kKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZHg6IHBpdm90LFxuICAgICAgICBleGFjdDogdHJ1ZVxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGV4YWN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZHg6IC0xXG4gICAgICB9O1xuICAgIH1cbiAgICAvLyBOb3QgZXhhY3QgLSBpbnNlcnRpb24gcG9pbnRcbiAgICByZXR1cm4ge1xuICAgICAgaWR4OiBkaWZmIDwgMCA/IHBpdm90ICsgMSA6IHBpdm90XG4gICAgfTtcbiAgfVxuXG4gIC8vIEluc2VydCBlbGVtZW50IGludG8gYSBzb3J0ZWQgYXJyYXkuXG4gICNpbnNlcnRTb3J0ZWQoZWxlbSwgYXJyKSB7XG4gICAgY29uc3QgZm91bmQgPSB0aGlzLiNmaW5kTmVhcmVzdChlbGVtLCBhcnIsIGZhbHNlKTtcbiAgICBjb25zdCBjb3VudCA9IChmb3VuZC5leGFjdCAmJiB0aGlzLiN1bmlxdWUpID8gMSA6IDA7XG4gICAgYXJyLnNwbGljZShmb3VuZC5pZHgsIGNvdW50LCBlbGVtKTtcbiAgICByZXR1cm4gYXJyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBlbGVtZW50IGF0IHRoZSBnaXZlbiBwb3NpdGlvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5DQnVmZmVyI1xuICAgKiBAcGFyYW0ge251bWJlcn0gYXQgLSBQb3NpdGlvbiB0byBmZXRjaCBmcm9tLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBFbGVtZW50IGF0IHRoZSBnaXZlbiBwb3NpdGlvbiBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+LlxuICAgKi9cbiAgZ2V0QXQoYXQpIHtcbiAgICByZXR1cm4gdGhpcy5idWZmZXJbYXRdO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlbmllbmNlIG1ldGhvZCBmb3IgZ2V0dGluZyB0aGUgZWxlbWVudCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5DQnVmZmVyI1xuICAgKiBAcGFyYW0ge251bWJlcn0gYXQgLSBwb3NpdGlvbiB0byBmZXRjaCBmcm9tLCBjb3VudGluZyBmcm9tIHRoZSBlbmQ7XG4gICAqICAgIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4gb3IgPGNvZGU+bnVsbDwvY29kZT4gIG1lYW4gXCJsYXN0XCIuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBsYXN0IGVsZW1lbnQgaW4gdGhlIGJ1ZmZlciBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+IGlmIGJ1ZmZlciBpcyBlbXB0eS5cbiAgICovXG4gIGdldExhc3QoYXQpIHtcbiAgICBhdCB8PSAwO1xuICAgIHJldHVybiB0aGlzLmJ1ZmZlci5sZW5ndGggPiBhdCA/IHRoaXMuYnVmZmVyW3RoaXMuYnVmZmVyLmxlbmd0aCAtIDEgLSBhdF0gOiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQWRkIG5ldyBlbGVtZW50KHMpIHRvIHRoZSBidWZmZXIuIFZhcmlhZGljOiB0YWtlcyBvbmUgb3IgbW9yZSBhcmd1bWVudHMuIElmIGFuIGFycmF5IGlzIHBhc3NlZCBhcyBhIHNpbmdsZVxuICAgKiBhcmd1bWVudCwgaXRzIGVsZW1lbnRzIGFyZSBpbnNlcnRlZCBpbmRpdmlkdWFsbHkuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICpcbiAgICogQHBhcmFtIHsuLi5PYmplY3R8QXJyYXl9IC0gT25lIG9yIG1vcmUgb2JqZWN0cyB0byBpbnNlcnQuXG4gICAqL1xuICBwdXQoKSB7XG4gICAgbGV0IGluc2VydDtcbiAgICAvLyBpbnNwZWN0IGFyZ3VtZW50czogaWYgYXJyYXksIGluc2VydCBpdHMgZWxlbWVudHMsIGlmIG9uZSBvciBtb3JlIG5vbi1hcnJheSBhcmd1bWVudHMsIGluc2VydCB0aGVtIG9uZSBieSBvbmVcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxICYmIEFycmF5LmlzQXJyYXkoYXJndW1lbnRzWzBdKSkge1xuICAgICAgaW5zZXJ0ID0gYXJndW1lbnRzWzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnNlcnQgPSBhcmd1bWVudHM7XG4gICAgfVxuICAgIGZvciAobGV0IGlkeCBpbiBpbnNlcnQpIHtcbiAgICAgIHRoaXMuI2luc2VydFNvcnRlZChpbnNlcnRbaWR4XSwgdGhpcy5idWZmZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgZWxlbWVudCBhdCB0aGUgZ2l2ZW4gcG9zaXRpb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICogQHBhcmFtIHtudW1iZXJ9IGF0IC0gUG9zaXRpb24gdG8gZGVsZXRlIGF0LlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBFbGVtZW50IGF0IHRoZSBnaXZlbiBwb3NpdGlvbiBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+LlxuICAgKi9cbiAgZGVsQXQoYXQpIHtcbiAgICBhdCB8PSAwO1xuICAgIGxldCByID0gdGhpcy5idWZmZXIuc3BsaWNlKGF0LCAxKTtcbiAgICBpZiAociAmJiByLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiByWzBdO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBlbGVtZW50cyBiZXR3ZWVuIHR3byBwb3NpdGlvbnMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNpbmNlIC0gUG9zaXRpb24gdG8gZGVsZXRlIGZyb20gKGluY2x1c2l2ZSkuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBiZWZvcmUgLSBQb3NpdGlvbiB0byBkZWxldGUgdG8gKGV4Y2x1c2l2ZSkuXG4gICAqXG4gICAqIEByZXR1cm5zIHtBcnJheX0gYXJyYXkgb2YgcmVtb3ZlZCBlbGVtZW50cyAoY291bGQgYmUgemVybyBsZW5ndGgpLlxuICAgKi9cbiAgZGVsUmFuZ2Uoc2luY2UsIGJlZm9yZSkge1xuICAgIHJldHVybiB0aGlzLmJ1ZmZlci5zcGxpY2Uoc2luY2UsIGJlZm9yZSAtIHNpbmNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyB0aGUgYnVmZmVyIGhvbGRzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNCdWZmZXIjXG4gICAqIEByZXR1cm4ge251bWJlcn0gTnVtYmVyIG9mIGVsZW1lbnRzIGluIHRoZSBidWZmZXIuXG4gICAqL1xuICBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgYnVmZmVyIGRpc2NhcmRpbmcgYWxsIGVsZW1lbnRzXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICovXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuYnVmZmVyID0gW107XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgZm9yIGl0ZXJhdGluZyBjb250ZW50cyBvZiBidWZmZXIuIFNlZSB7QGxpbmsgVGlub2RlLkNCdWZmZXIjZm9yRWFjaH0uXG4gICAqIEBjYWxsYmFjayBGb3JFYWNoQ2FsbGJhY2tUeXBlXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW0gLSBDdXJyZW50IGVsZW1lbnQgb2YgdGhlIGJ1ZmZlci5cbiAgICogQHBhcmFtIHtPYmplY3R9IHByZXYgLSBQcmV2aW91cyBlbGVtZW50IG9mIHRoZSBidWZmZXIuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBuZXh0IC0gTmV4dCBlbGVtZW50IG9mIHRoZSBidWZmZXIuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIEluZGV4IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBBcHBseSBnaXZlbiA8Y29kZT5jYWxsYmFjazwvY29kZT4gdG8gYWxsIGVsZW1lbnRzIG9mIHRoZSBidWZmZXIuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICpcbiAgICogQHBhcmFtIHtUaW5vZGUuRm9yRWFjaENhbGxiYWNrVHlwZX0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIGVsZW1lbnQuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydElkeCAtIE9wdGlvbmFsIGluZGV4IHRvIHN0YXJ0IGl0ZXJhdGluZyBmcm9tIChpbmNsdXNpdmUpLlxuICAgKiBAcGFyYW0ge251bWJlcn0gYmVmb3JlSWR4IC0gT3B0aW9uYWwgaW5kZXggdG8gc3RvcCBpdGVyYXRpbmcgYmVmb3JlIChleGNsdXNpdmUpLlxuICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIGNhbGxpbmcgY29udGV4dCAoaS5lLiB2YWx1ZSBvZiA8Y29kZT50aGlzPC9jb2RlPiBpbiBjYWxsYmFjaylcbiAgICovXG4gIGZvckVhY2goY2FsbGJhY2ssIHN0YXJ0SWR4LCBiZWZvcmVJZHgsIGNvbnRleHQpIHtcbiAgICBzdGFydElkeCA9IHN0YXJ0SWR4IHwgMDtcbiAgICBiZWZvcmVJZHggPSBiZWZvcmVJZHggfHwgdGhpcy5idWZmZXIubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSBzdGFydElkeDsgaSA8IGJlZm9yZUlkeDsgaSsrKSB7XG4gICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuYnVmZmVyW2ldLFxuICAgICAgICAoaSA+IHN0YXJ0SWR4ID8gdGhpcy5idWZmZXJbaSAtIDFdIDogdW5kZWZpbmVkKSxcbiAgICAgICAgKGkgPCBiZWZvcmVJZHggLSAxID8gdGhpcy5idWZmZXJbaSArIDFdIDogdW5kZWZpbmVkKSwgaSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgZWxlbWVudCBpbiBidWZmZXIgdXNpbmcgYnVmZmVyJ3MgY29tcGFyaXNvbiBmdW5jdGlvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5DQnVmZmVyI1xuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbSAtIGVsZW1lbnQgdG8gZmluZC5cbiAgICogQHBhcmFtIHtib29sZWFuPX0gbmVhcmVzdCAtIHdoZW4gdHJ1ZSBhbmQgZXhhY3QgbWF0Y2ggaXMgbm90IGZvdW5kLCByZXR1cm4gdGhlIG5lYXJlc3QgZWxlbWVudCAoaW5zZXJ0aW9uIHBvaW50KS5cbiAgICogQHJldHVybnMge251bWJlcn0gaW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGJ1ZmZlciBvciAtMS5cbiAgICovXG4gIGZpbmQoZWxlbSwgbmVhcmVzdCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGlkeFxuICAgIH0gPSB0aGlzLiNmaW5kTmVhcmVzdChlbGVtLCB0aGlzLmJ1ZmZlciwgIW5lYXJlc3QpO1xuICAgIHJldHVybiBpZHg7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgZm9yIGZpbHRlcmluZyB0aGUgYnVmZmVyLiBTZWUge0BsaW5rIFRpbm9kZS5DQnVmZmVyI2ZpbHRlcn0uXG4gICAqIEBjYWxsYmFjayBGb3JFYWNoQ2FsbGJhY2tUeXBlXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW0gLSBDdXJyZW50IGVsZW1lbnQgb2YgdGhlIGJ1ZmZlci5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gSW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudC5cbiAgICogQHJldHVybnMge2Jvb2xlbn0gPGNvZGU+dHJ1ZTwvY29kZT4gdG8ga2VlcCB0aGUgZWxlbWVudCwgPGNvZGU+ZmFsc2U8L2NvZGU+IHRvIHJlbW92ZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbGwgZWxlbWVudHMgdGhhdCBkbyBub3QgcGFzcyB0aGUgdGVzdCBpbXBsZW1lbnRlZCBieSB0aGUgcHJvdmlkZWQgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ0J1ZmZlciNcbiAgICpcbiAgICogQHBhcmFtIHtUaW5vZGUuRmlsdGVyQ2FsbGJhY2tUeXBlfSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggZWxlbWVudC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBjYWxsaW5nIGNvbnRleHQgKGkuZS4gdmFsdWUgb2YgPGNvZGU+dGhpczwvY29kZT4gaW4gdGhlIGNhbGxiYWNrKVxuICAgKi9cbiAgZmlsdGVyKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoY2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmJ1ZmZlcltpXSwgaSkpIHtcbiAgICAgICAgdGhpcy5idWZmZXJbY291bnRdID0gdGhpcy5idWZmZXJbaV07XG4gICAgICAgIGNvdW50Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5idWZmZXIuc3BsaWNlKGNvdW50KTtcbiAgfVxufVxuIiwiLyoqXG4gKiBAZmlsZSBHbG9iYWwgY29uc3RhbnRzIGFuZCBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMuXG4gKlxuICogQGNvcHlyaWdodCAyMDE1LTIwMjIgVGlub2RlIExMQ1xuICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7XG4gIHZlcnNpb24gYXMgcGFja2FnZV92ZXJzaW9uXG59IGZyb20gJy4uL3ZlcnNpb24uanNvbic7XG5cbi8vIEdsb2JhbCBjb25zdGFudHNcbmV4cG9ydCBjb25zdCBQUk9UT0NPTF9WRVJTSU9OID0gJzAnOyAvLyBNYWpvciBjb21wb25lbnQgb2YgdGhlIHZlcnNpb24sIGUuZy4gJzAnIGluICcwLjE3LjEnLlxuZXhwb3J0IGNvbnN0IFZFUlNJT04gPSBwYWNrYWdlX3ZlcnNpb24gfHwgJzAuMTgnO1xuZXhwb3J0IGNvbnN0IExJQlJBUlkgPSAndGlub2RlanMvJyArIFZFUlNJT047XG5cbi8vIFRvcGljIG5hbWUgcHJlZml4ZXMuXG5leHBvcnQgY29uc3QgVE9QSUNfTkVXID0gJ25ldyc7XG5leHBvcnQgY29uc3QgVE9QSUNfTkVXX0NIQU4gPSAnbmNoJztcbmV4cG9ydCBjb25zdCBUT1BJQ19NRSA9ICdtZSc7XG5leHBvcnQgY29uc3QgVE9QSUNfRk5EID0gJ2ZuZCc7XG5leHBvcnQgY29uc3QgVE9QSUNfU1lTID0gJ3N5cyc7XG5leHBvcnQgY29uc3QgVE9QSUNfQ0hBTiA9ICdjaG4nO1xuZXhwb3J0IGNvbnN0IFRPUElDX0dSUCA9ICdncnA7J1xuZXhwb3J0IGNvbnN0IFRPUElDX1AyUCA9ICdwMnAnO1xuZXhwb3J0IGNvbnN0IFVTRVJfTkVXID0gJ25ldyc7XG5cbi8vIFN0YXJ0aW5nIHZhbHVlIG9mIGEgbG9jYWxseS1nZW5lcmF0ZWQgc2VxSWQgdXNlZCBmb3IgcGVuZGluZyBtZXNzYWdlcy5cbmV4cG9ydCBjb25zdCBMT0NBTF9TRVFJRCA9IDB4RkZGRkZGRjtcblxuLy8gU3RhdHVzIGNvZGVzLlxuZXhwb3J0IGNvbnN0IE1FU1NBR0VfU1RBVFVTX05PTkUgPSAwOyAvLyBTdGF0dXMgbm90IGFzc2lnbmVkLlxuZXhwb3J0IGNvbnN0IE1FU1NBR0VfU1RBVFVTX1FVRVVFRCA9IDE7IC8vIExvY2FsIElEIGFzc2lnbmVkLCBpbiBwcm9ncmVzcyB0byBiZSBzZW50LlxuZXhwb3J0IGNvbnN0IE1FU1NBR0VfU1RBVFVTX1NFTkRJTkcgPSAyOyAvLyBUcmFuc21pc3Npb24gc3RhcnRlZC5cbmV4cG9ydCBjb25zdCBNRVNTQUdFX1NUQVRVU19GQUlMRUQgPSAzOyAvLyBBdCBsZWFzdCBvbmUgYXR0ZW1wdCB3YXMgbWFkZSB0byBzZW5kIHRoZSBtZXNzYWdlLlxuZXhwb3J0IGNvbnN0IE1FU1NBR0VfU1RBVFVTX1NFTlQgPSA0OyAvLyBEZWxpdmVyZWQgdG8gdGhlIHNlcnZlci5cbmV4cG9ydCBjb25zdCBNRVNTQUdFX1NUQVRVU19SRUNFSVZFRCA9IDU7IC8vIFJlY2VpdmVkIGJ5IHRoZSBjbGllbnQuXG5leHBvcnQgY29uc3QgTUVTU0FHRV9TVEFUVVNfUkVBRCA9IDY7IC8vIFJlYWQgYnkgdGhlIHVzZXIuXG5leHBvcnQgY29uc3QgTUVTU0FHRV9TVEFUVVNfVE9fTUUgPSA3OyAvLyBUaGUgbWVzc2FnZSBpcyByZWNlaXZlZCBmcm9tIGFub3RoZXIgdXNlci5cbmV4cG9ydCBjb25zdCBNRVNTQUdFX1NUQVRVU19ERUxfUkFOR0UgPSA4OyAvLyBUaGUgbWVzc2FnZSByZXByZXNlbnRzIGEgZGVsZXRlZCByYW5nZS5cblxuLy8gUmVqZWN0IHVucmVzb2x2ZWQgZnV0dXJlcyBhZnRlciB0aGlzIG1hbnkgbWlsbGlzZWNvbmRzLlxuZXhwb3J0IGNvbnN0IEVYUElSRV9QUk9NSVNFU19USU1FT1VUID0gNTAwMDtcbi8vIFBlcmlvZGljaXR5IG9mIGdhcmJhZ2UgY29sbGVjdGlvbiBvZiB1bnJlc29sdmVkIGZ1dHVyZXMuXG5leHBvcnQgY29uc3QgRVhQSVJFX1BST01JU0VTX1BFUklPRCA9IDEwMDA7XG5cbi8vIERlZmF1bHQgbnVtYmVyIG9mIG1lc3NhZ2VzIHRvIHB1bGwgaW50byBtZW1vcnkgZnJvbSBwZXJzaXN0ZW50IGNhY2hlLlxuZXhwb3J0IGNvbnN0IERFRkFVTFRfTUVTU0FHRVNfUEFHRSA9IDI0O1xuXG4vLyBVbmljb2RlIERFTCBjaGFyYWN0ZXIgaW5kaWNhdGluZyBkYXRhIHdhcyBkZWxldGVkLlxuZXhwb3J0IGNvbnN0IERFTF9DSEFSID0gJ1xcdTI0MjEnO1xuIiwiLyoqXG4gKiBAZmlsZSBBYnN0cmFjdGlvbiBsYXllciBmb3Igd2Vic29ja2V0IGFuZCBsb25nIHBvbGxpbmcgY29ubmVjdGlvbnMuXG4gKlxuICogQGNvcHlyaWdodCAyMDE1LTIwMjIgVGlub2RlIExMQy5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge1xuICBqc29uUGFyc2VIZWxwZXJcbn0gZnJvbSAnLi91dGlscy5qcyc7XG5cbmxldCBXZWJTb2NrZXRQcm92aWRlcjtcbmxldCBYSFJQcm92aWRlcjtcblxuLy8gRXJyb3IgY29kZSB0byByZXR1cm4gaW4gY2FzZSBvZiBhIG5ldHdvcmsgcHJvYmxlbS5cbmNvbnN0IE5FVFdPUktfRVJST1IgPSA1MDM7XG5jb25zdCBORVRXT1JLX0VSUk9SX1RFWFQgPSBcIkNvbm5lY3Rpb24gZmFpbGVkXCI7XG5cbi8vIEVycm9yIGNvZGUgdG8gcmV0dXJuIHdoZW4gdXNlciBkaXNjb25uZWN0ZWQgZnJvbSBzZXJ2ZXIuXG5jb25zdCBORVRXT1JLX1VTRVIgPSA0MTg7XG5jb25zdCBORVRXT1JLX1VTRVJfVEVYVCA9IFwiRGlzY29ubmVjdGVkIGJ5IGNsaWVudFwiO1xuXG4vLyBTZXR0aW5ncyBmb3IgZXhwb25lbnRpYWwgYmFja29mZlxuY29uc3QgX0JPRkZfQkFTRSA9IDIwMDA7IC8vIDIwMDAgbWlsbGlzZWNvbmRzLCBtaW5pbXVtIGRlbGF5IGJldHdlZW4gcmVjb25uZWN0c1xuY29uc3QgX0JPRkZfTUFYX0lURVIgPSAxMDsgLy8gTWF4aW11bSBkZWxheSBiZXR3ZWVuIHJlY29ubmVjdHMgMl4xMCAqIDIwMDAgfiAzNCBtaW51dGVzXG5jb25zdCBfQk9GRl9KSVRURVIgPSAwLjM7IC8vIEFkZCByYW5kb20gZGVsYXlcblxuLy8gSGVscGVyIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBhbiBlbmRwb2ludCBVUkwuXG5mdW5jdGlvbiBtYWtlQmFzZVVybChob3N0LCBwcm90b2NvbCwgdmVyc2lvbiwgYXBpS2V5KSB7XG4gIGxldCB1cmwgPSBudWxsO1xuXG4gIGlmIChbJ2h0dHAnLCAnaHR0cHMnLCAnd3MnLCAnd3NzJ10uaW5jbHVkZXMocHJvdG9jb2wpKSB7XG4gICAgdXJsID0gYCR7cHJvdG9jb2x9Oi8vJHtob3N0fWA7XG4gICAgaWYgKHVybC5jaGFyQXQodXJsLmxlbmd0aCAtIDEpICE9PSAnLycpIHtcbiAgICAgIHVybCArPSAnLyc7XG4gICAgfVxuICAgIHVybCArPSAndicgKyB2ZXJzaW9uICsgJy9jaGFubmVscyc7XG4gICAgaWYgKFsnaHR0cCcsICdodHRwcyddLmluY2x1ZGVzKHByb3RvY29sKSkge1xuICAgICAgLy8gTG9uZyBwb2xsaW5nIGVuZHBvaW50IGVuZHMgd2l0aCBcImxwXCIsIGkuZS5cbiAgICAgIC8vICcvdjAvY2hhbm5lbHMvbHAnIHZzIGp1c3QgJy92MC9jaGFubmVscycgZm9yIHdzXG4gICAgICB1cmwgKz0gJy9scCc7XG4gICAgfVxuICAgIHVybCArPSAnP2FwaWtleT0nICsgYXBpS2V5O1xuICB9XG5cbiAgcmV0dXJuIHVybDtcbn1cblxuLyoqXG4gKiBBbiBhYnN0cmFjdGlvbiBmb3IgYSB3ZWJzb2NrZXQgb3IgYSBsb25nIHBvbGxpbmcgY29ubmVjdGlvbi5cbiAqXG4gKiBAY2xhc3MgQ29ubmVjdGlvblxuICogQG1lbWJlcm9mIFRpbm9kZVxuXG4gKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIC0gY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzLlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5ob3N0IC0gSG9zdCBuYW1lIGFuZCBvcHRpb25hbCBwb3J0IG51bWJlciB0byBjb25uZWN0IHRvLlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hcGlLZXkgLSBBUEkga2V5IGdlbmVyYXRlZCBieSA8Y29kZT5rZXlnZW48L2NvZGU+LlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy50cmFuc3BvcnQgLSBOZXR3b3JrIHRyYW5zcG9ydCB0byB1c2UsIGVpdGhlciA8Y29kZT5cIndzXCI8Y29kZT4vPGNvZGU+XCJ3c3NcIjwvY29kZT4gZm9yIHdlYnNvY2tldCBvclxuICogICAgICA8Y29kZT5scDwvY29kZT4gZm9yIGxvbmcgcG9sbGluZy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY29uZmlnLnNlY3VyZSAtIFVzZSBTZWN1cmUgV2ViU29ja2V0IGlmIDxjb2RlPnRydWU8L2NvZGU+LlxuICogQHBhcmFtIHtzdHJpbmd9IHZlcnNpb25fIC0gTWFqb3IgdmFsdWUgb2YgdGhlIHByb3RvY29sIHZlcnNpb24sIGUuZy4gJzAnIGluICcwLjE3LjEnLlxuICogQHBhcmFtIHtib29sZWFufSBhdXRvcmVjb25uZWN0XyAtIElmIGNvbm5lY3Rpb24gaXMgbG9zdCwgdHJ5IHRvIHJlY29ubmVjdCBhdXRvbWF0aWNhbGx5LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25uZWN0aW9uIHtcbiAgI2JvZmZUaW1lciA9IG51bGw7XG4gICNib2ZmSXRlcmF0aW9uID0gMDtcbiAgI2JvZmZDbG9zZWQgPSBmYWxzZTsgLy8gSW5kaWNhdG9yIGlmIHRoZSBzb2NrZXQgd2FzIG1hbnVhbGx5IGNsb3NlZCAtIGRvbid0IGF1dG9yZWNvbm5lY3QgaWYgdHJ1ZS5cblxuICAvLyBXZWJzb2NrZXQuXG4gICNzb2NrZXQgPSBudWxsO1xuXG4gIGhvc3Q7XG4gIHNlY3VyZTtcbiAgYXBpS2V5O1xuXG4gIHZlcnNpb247XG4gIGF1dG9yZWNvbm5lY3Q7XG5cbiAgaW5pdGlhbGl6ZWQ7XG5cbiAgLy8gKGNvbmZpZy5ob3N0LCBjb25maWcuYXBpS2V5LCBjb25maWcudHJhbnNwb3J0LCBjb25maWcuc2VjdXJlKSwgUFJPVE9DT0xfVkVSU0lPTiwgdHJ1ZVxuICBjb25zdHJ1Y3Rvcihjb25maWcsIHZlcnNpb25fLCBhdXRvcmVjb25uZWN0Xykge1xuICAgIHRoaXMuaG9zdCA9IGNvbmZpZy5ob3N0O1xuICAgIHRoaXMuc2VjdXJlID0gY29uZmlnLnNlY3VyZTtcbiAgICB0aGlzLmFwaUtleSA9IGNvbmZpZy5hcGlLZXk7XG5cbiAgICB0aGlzLnZlcnNpb24gPSB2ZXJzaW9uXztcbiAgICB0aGlzLmF1dG9yZWNvbm5lY3QgPSBhdXRvcmVjb25uZWN0XztcblxuICAgIGlmIChjb25maWcudHJhbnNwb3J0ID09PSAnbHAnKSB7XG4gICAgICAvLyBleHBsaWNpdCByZXF1ZXN0IHRvIHVzZSBsb25nIHBvbGxpbmdcbiAgICAgIHRoaXMuI2luaXRfbHAoKTtcbiAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSAnbHAnO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnLnRyYW5zcG9ydCA9PT0gJ3dzJykge1xuICAgICAgLy8gZXhwbGljaXQgcmVxdWVzdCB0byB1c2Ugd2ViIHNvY2tldFxuICAgICAgLy8gaWYgd2Vic29ja2V0cyBhcmUgbm90IGF2YWlsYWJsZSwgaG9ycmlibGUgdGhpbmdzIHdpbGwgaGFwcGVuXG4gICAgICB0aGlzLiNpbml0X3dzKCk7XG4gICAgICB0aGlzLmluaXRpYWxpemVkID0gJ3dzJztcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIC8vIEludmFsaWQgb3IgdW5kZWZpbmVkIG5ldHdvcmsgdHJhbnNwb3J0LlxuICAgICAgdGhpcy4jbG9nKFwiVW5rbm93biBvciBpbnZhbGlkIG5ldHdvcmsgdHJhbnNwb3J0LiBSdW5uaW5nIHVuZGVyIE5vZGU/IENhbGwgJ1Rpbm9kZS5zZXROZXR3b3JrUHJvdmlkZXJzKCknLlwiKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gb3IgaW52YWxpZCBuZXR3b3JrIHRyYW5zcG9ydC4gUnVubmluZyB1bmRlciBOb2RlPyBDYWxsICdUaW5vZGUuc2V0TmV0d29ya1Byb3ZpZGVycygpJy5cIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvIHVzZSBDb25uZWN0aW9uIGluIGEgbm9uIGJyb3dzZXIgY29udGV4dCwgc3VwcGx5IFdlYlNvY2tldCBhbmQgWE1MSHR0cFJlcXVlc3QgcHJvdmlkZXJzLlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJvZiBDb25uZWN0aW9uXG4gICAqIEBwYXJhbSB3c1Byb3ZpZGVyIFdlYlNvY2tldCBwcm92aWRlciwgZS5nLiBmb3Igbm9kZUpTICwgPGNvZGU+cmVxdWlyZSgnd3MnKTwvY29kZT4uXG4gICAqIEBwYXJhbSB4aHJQcm92aWRlciBYTUxIdHRwUmVxdWVzdCBwcm92aWRlciwgZS5nLiBmb3Igbm9kZSA8Y29kZT5yZXF1aXJlKCd4aHInKTwvY29kZT4uXG4gICAqL1xuICBzdGF0aWMgc2V0TmV0d29ya1Byb3ZpZGVycyh3c1Byb3ZpZGVyLCB4aHJQcm92aWRlcikge1xuICAgIFdlYlNvY2tldFByb3ZpZGVyID0gd3NQcm92aWRlcjtcbiAgICBYSFJQcm92aWRlciA9IHhoclByb3ZpZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGEgbmV3IGNvbm5lY3Rpb25cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKiBAcGFyYW0ge3N0cmluZ30gaG9zdF8gSG9zdCBuYW1lIHRvIGNvbm5lY3QgdG87IGlmIDxjb2RlPm51bGw8L2NvZGU+IHRoZSBvbGQgaG9zdCBuYW1lIHdpbGwgYmUgdXNlZC5cbiAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZSBGb3JjZSBuZXcgY29ubmVjdGlvbiBldmVuIGlmIG9uZSBhbHJlYWR5IGV4aXN0cy5cbiAgICogQHJldHVybiB7UHJvbWlzZX0gUHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBjb25uZWN0aW9uIGNhbGwgY29tcGxldGVzLCByZXNvbHV0aW9uIGlzIGNhbGxlZCB3aXRob3V0XG4gICAqICBwYXJhbWV0ZXJzLCByZWplY3Rpb24gcGFzc2VzIHRoZSB7RXJyb3J9IGFzIHBhcmFtZXRlci5cbiAgICovXG4gIGNvbm5lY3QoaG9zdF8sIGZvcmNlKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG51bGwpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyeSB0byByZXN0b3JlIGEgbmV0d29yayBjb25uZWN0aW9uLCBhbHNvIHJlc2V0IGJhY2tvZmYuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZSAtIHJlY29ubmVjdCBldmVuIGlmIHRoZXJlIGlzIGEgbGl2ZSBjb25uZWN0aW9uIGFscmVhZHkuXG4gICAqL1xuICByZWNvbm5lY3QoZm9yY2UpIHt9XG5cbiAgLyoqXG4gICAqIFRlcm1pbmF0ZSB0aGUgbmV0d29yayBjb25uZWN0aW9uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICovXG4gIGRpc2Nvbm5lY3QoKSB7fVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgc3RyaW5nIHRvIHRoZSBzZXJ2ZXIuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1zZyAtIFN0cmluZyB0byBzZW5kLlxuICAgKiBAdGhyb3dzIFRocm93cyBhbiBleGNlcHRpb24gaWYgdGhlIHVuZGVybHlpbmcgY29ubmVjdGlvbiBpcyBub3QgbGl2ZS5cbiAgICovXG4gIHNlbmRUZXh0KG1zZykge31cblxuICAvKipcbiAgICogQ2hlY2sgaWYgY29ubmVjdGlvbiBpcyBhbGl2ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgY29ubmVjdGlvbiBpcyBsaXZlLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbmFtZSBvZiB0aGUgY3VycmVudCBuZXR3b3JrIHRyYW5zcG9ydC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBuYW1lIG9mIHRoZSB0cmFuc3BvcnQgc3VjaCBhcyA8Y29kZT5cIndzXCI8L2NvZGU+IG9yIDxjb2RlPlwibHBcIjwvY29kZT4uXG4gICAqL1xuICB0cmFuc3BvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZWQ7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBuZXR3b3JrIHByb2JlIHRvIGNoZWNrIGlmIGNvbm5lY3Rpb24gaXMgaW5kZWVkIGxpdmUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuQ29ubmVjdGlvbiNcbiAgICovXG4gIHByb2JlKCkge1xuICAgIHRoaXMuc2VuZFRleHQoJzEnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCBhdXRvcmVjb25uZWN0IGNvdW50ZXIgdG8gemVyby5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKi9cbiAgYmFja29mZlJlc2V0KCkge1xuICAgIHRoaXMuI2JvZmZSZXNldCgpO1xuICB9XG5cbiAgI2xvZyh0ZXh0LCAuLi5hcmdzKSB7XG4gICAgaWYgKENvbm5lY3Rpb24ubG9nZ2VyKSB7XG4gICAgICBDb25uZWN0aW9uLmxvZ2dlcih0ZXh0LCAuLi5hcmdzKTtcbiAgICB9XG4gIH1cblxuICAvLyBCYWNrb2ZmIGltcGxlbWVudGF0aW9uIC0gcmVjb25uZWN0IGFmdGVyIGEgdGltZW91dC5cbiAgI2JvZmZSZWNvbm5lY3QoKSB7XG4gICAgLy8gQ2xlYXIgdGltZXJcbiAgICBjbGVhclRpbWVvdXQodGhpcy4jYm9mZlRpbWVyKTtcbiAgICAvLyBDYWxjdWxhdGUgd2hlbiB0byBmaXJlIHRoZSByZWNvbm5lY3QgYXR0ZW1wdFxuICAgIGNvbnN0IHRpbWVvdXQgPSBfQk9GRl9CQVNFICogKE1hdGgucG93KDIsIHRoaXMuI2JvZmZJdGVyYXRpb24pICogKDEuMCArIF9CT0ZGX0pJVFRFUiAqIE1hdGgucmFuZG9tKCkpKTtcbiAgICAvLyBVcGRhdGUgaXRlcmF0aW9uIGNvdW50ZXIgZm9yIGZ1dHVyZSB1c2VcbiAgICB0aGlzLiNib2ZmSXRlcmF0aW9uID0gKHRoaXMuI2JvZmZJdGVyYXRpb24gPj0gX0JPRkZfTUFYX0lURVIgPyB0aGlzLiNib2ZmSXRlcmF0aW9uIDogdGhpcy4jYm9mZkl0ZXJhdGlvbiArIDEpO1xuICAgIGlmICh0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbikge1xuICAgICAgdGhpcy5vbkF1dG9yZWNvbm5lY3RJdGVyYXRpb24odGltZW91dCk7XG4gICAgfVxuXG4gICAgdGhpcy4jYm9mZlRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLiNsb2coYFJlY29ubmVjdGluZywgaXRlcj0ke3RoaXMuI2JvZmZJdGVyYXRpb259LCB0aW1lb3V0PSR7dGltZW91dH1gKTtcbiAgICAgIC8vIE1heWJlIHRoZSBzb2NrZXQgd2FzIGNsb3NlZCB3aGlsZSB3ZSB3YWl0ZWQgZm9yIHRoZSB0aW1lcj9cbiAgICAgIGlmICghdGhpcy4jYm9mZkNsb3NlZCkge1xuICAgICAgICBjb25zdCBwcm9tID0gdGhpcy5jb25uZWN0KCk7XG4gICAgICAgIGlmICh0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbikge1xuICAgICAgICAgIHRoaXMub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uKDAsIHByb20pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFN1cHByZXNzIGVycm9yIGlmIGl0J3Mgbm90IHVzZWQuXG4gICAgICAgICAgcHJvbS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICAvKiBkbyBub3RoaW5nICovXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vbkF1dG9yZWNvbm5lY3RJdGVyYXRpb24pIHtcbiAgICAgICAgdGhpcy5vbkF1dG9yZWNvbm5lY3RJdGVyYXRpb24oLTEpO1xuICAgICAgfVxuICAgIH0sIHRpbWVvdXQpO1xuICB9XG5cbiAgLy8gVGVybWluYXRlIGF1dG8tcmVjb25uZWN0IHByb2Nlc3MuXG4gICNib2ZmU3RvcCgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy4jYm9mZlRpbWVyKTtcbiAgICB0aGlzLiNib2ZmVGltZXIgPSBudWxsO1xuICB9XG5cbiAgLy8gUmVzZXQgYXV0by1yZWNvbm5lY3QgaXRlcmF0aW9uIGNvdW50ZXIuXG4gICNib2ZmUmVzZXQoKSB7XG4gICAgdGhpcy4jYm9mZkl0ZXJhdGlvbiA9IDA7XG4gIH1cblxuICAvLyBJbml0aWFsaXphdGlvbiBmb3IgbG9uZyBwb2xsaW5nLlxuICAjaW5pdF9scCgpIHtcbiAgICBjb25zdCBYRFJfVU5TRU5UID0gMDsgLy8gQ2xpZW50IGhhcyBiZWVuIGNyZWF0ZWQuIG9wZW4oKSBub3QgY2FsbGVkIHlldC5cbiAgICBjb25zdCBYRFJfT1BFTkVEID0gMTsgLy8gb3BlbigpIGhhcyBiZWVuIGNhbGxlZC5cbiAgICBjb25zdCBYRFJfSEVBREVSU19SRUNFSVZFRCA9IDI7IC8vIHNlbmQoKSBoYXMgYmVlbiBjYWxsZWQsIGFuZCBoZWFkZXJzIGFuZCBzdGF0dXMgYXJlIGF2YWlsYWJsZS5cbiAgICBjb25zdCBYRFJfTE9BRElORyA9IDM7IC8vIERvd25sb2FkaW5nOyByZXNwb25zZVRleHQgaG9sZHMgcGFydGlhbCBkYXRhLlxuICAgIGNvbnN0IFhEUl9ET05FID0gNDsgLy8gVGhlIG9wZXJhdGlvbiBpcyBjb21wbGV0ZS5cblxuICAgIC8vIEZ1bGx5IGNvbXBvc2VkIGVuZHBvaW50IFVSTCwgd2l0aCBBUEkga2V5ICYgU0lEXG4gICAgbGV0IF9scFVSTCA9IG51bGw7XG5cbiAgICBsZXQgX3BvbGxlciA9IG51bGw7XG4gICAgbGV0IF9zZW5kZXIgPSBudWxsO1xuXG4gICAgbGV0IGxwX3NlbmRlciA9ICh1cmxfKSA9PiB7XG4gICAgICBjb25zdCBzZW5kZXIgPSBuZXcgWEhSUHJvdmlkZXIoKTtcbiAgICAgIHNlbmRlci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoZXZ0KSA9PiB7XG4gICAgICAgIGlmIChzZW5kZXIucmVhZHlTdGF0ZSA9PSBYRFJfRE9ORSAmJiBzZW5kZXIuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgIC8vIFNvbWUgc29ydCBvZiBlcnJvciByZXNwb25zZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTFAgc2VuZGVyIGZhaWxlZCwgJHtzZW5kZXIuc3RhdHVzfWApO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBzZW5kZXIub3BlbignUE9TVCcsIHVybF8sIHRydWUpO1xuICAgICAgcmV0dXJuIHNlbmRlcjtcbiAgICB9XG5cbiAgICBsZXQgbHBfcG9sbGVyID0gKHVybF8sIHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IHBvbGxlciA9IG5ldyBYSFJQcm92aWRlcigpO1xuICAgICAgbGV0IHByb21pc2VDb21wbGV0ZWQgPSBmYWxzZTtcblxuICAgICAgcG9sbGVyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IChldnQpID0+IHtcbiAgICAgICAgaWYgKHBvbGxlci5yZWFkeVN0YXRlID09IFhEUl9ET05FKSB7XG4gICAgICAgICAgaWYgKHBvbGxlci5zdGF0dXMgPT0gMjAxKSB7IC8vIDIwMSA9PSBIVFRQLkNyZWF0ZWQsIGdldCBTSURcbiAgICAgICAgICAgIGxldCBwa3QgPSBKU09OLnBhcnNlKHBvbGxlci5yZXNwb25zZVRleHQsIGpzb25QYXJzZUhlbHBlcik7XG4gICAgICAgICAgICBfbHBVUkwgPSB1cmxfICsgJyZzaWQ9JyArIHBrdC5jdHJsLnBhcmFtcy5zaWQ7XG4gICAgICAgICAgICBwb2xsZXIgPSBscF9wb2xsZXIoX2xwVVJMKTtcbiAgICAgICAgICAgIHBvbGxlci5zZW5kKG51bGwpO1xuICAgICAgICAgICAgaWYgKHRoaXMub25PcGVuKSB7XG4gICAgICAgICAgICAgIHRoaXMub25PcGVuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgIHByb21pc2VDb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmF1dG9yZWNvbm5lY3QpIHtcbiAgICAgICAgICAgICAgdGhpcy4jYm9mZlN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBvbGxlci5zdGF0dXMgPCA0MDApIHsgLy8gNDAwID0gSFRUUC5CYWRSZXF1ZXN0XG4gICAgICAgICAgICBpZiAodGhpcy5vbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbk1lc3NhZ2UocG9sbGVyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb2xsZXIgPSBscF9wb2xsZXIoX2xwVVJMKTtcbiAgICAgICAgICAgIHBvbGxlci5zZW5kKG51bGwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBEb24ndCB0aHJvdyBhbiBlcnJvciBoZXJlLCBncmFjZWZ1bGx5IGhhbmRsZSBzZXJ2ZXIgZXJyb3JzXG4gICAgICAgICAgICBpZiAocmVqZWN0ICYmICFwcm9taXNlQ29tcGxldGVkKSB7XG4gICAgICAgICAgICAgIHByb21pc2VDb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZWplY3QocG9sbGVyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vbk1lc3NhZ2UgJiYgcG9sbGVyLnJlc3BvbnNlVGV4dCkge1xuICAgICAgICAgICAgICB0aGlzLm9uTWVzc2FnZShwb2xsZXIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9uRGlzY29ubmVjdCkge1xuICAgICAgICAgICAgICBjb25zdCBjb2RlID0gcG9sbGVyLnN0YXR1cyB8fCAodGhpcy4jYm9mZkNsb3NlZCA/IE5FVFdPUktfVVNFUiA6IE5FVFdPUktfRVJST1IpO1xuICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gcG9sbGVyLnJlc3BvbnNlVGV4dCB8fCAodGhpcy4jYm9mZkNsb3NlZCA/IE5FVFdPUktfVVNFUl9URVhUIDogTkVUV09SS19FUlJPUl9URVhUKTtcbiAgICAgICAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3QobmV3IEVycm9yKHRleHQgKyAnICgnICsgY29kZSArICcpJyksIGNvZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBQb2xsaW5nIGhhcyBzdG9wcGVkLiBJbmRpY2F0ZSBpdCBieSBzZXR0aW5nIHBvbGxlciB0byBudWxsLlxuICAgICAgICAgICAgcG9sbGVyID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghdGhpcy4jYm9mZkNsb3NlZCAmJiB0aGlzLmF1dG9yZWNvbm5lY3QpIHtcbiAgICAgICAgICAgICAgdGhpcy4jYm9mZlJlY29ubmVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHBvbGxlci5vcGVuKCdHRVQnLCB1cmxfLCB0cnVlKTtcbiAgICAgIHJldHVybiBwb2xsZXI7XG4gICAgfVxuXG4gICAgdGhpcy5jb25uZWN0ID0gKGhvc3RfLCBmb3JjZSkgPT4ge1xuICAgICAgdGhpcy4jYm9mZkNsb3NlZCA9IGZhbHNlO1xuXG4gICAgICBpZiAoX3BvbGxlcikge1xuICAgICAgICBpZiAoIWZvcmNlKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIF9wb2xsZXIub25yZWFkeXN0YXRlY2hhbmdlID0gdW5kZWZpbmVkO1xuICAgICAgICBfcG9sbGVyLmFib3J0KCk7XG4gICAgICAgIF9wb2xsZXIgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoaG9zdF8pIHtcbiAgICAgICAgdGhpcy5ob3N0ID0gaG9zdF87XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IG1ha2VCYXNlVXJsKHRoaXMuaG9zdCwgdGhpcy5zZWN1cmUgPyAnaHR0cHMnIDogJ2h0dHAnLCB0aGlzLnZlcnNpb24sIHRoaXMuYXBpS2V5KTtcbiAgICAgICAgdGhpcy4jbG9nKFwiQ29ubmVjdGluZyB0bzpcIiwgdXJsKTtcbiAgICAgICAgX3BvbGxlciA9IGxwX3BvbGxlcih1cmwsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIF9wb2xsZXIuc2VuZChudWxsKTtcbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgdGhpcy4jbG9nKFwiTFAgY29ubmVjdGlvbiBmYWlsZWQ6XCIsIGVycik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy5yZWNvbm5lY3QgPSAoZm9yY2UpID0+IHtcbiAgICAgIHRoaXMuI2JvZmZTdG9wKCk7XG4gICAgICB0aGlzLmNvbm5lY3QobnVsbCwgZm9yY2UpO1xuICAgIH07XG5cbiAgICB0aGlzLmRpc2Nvbm5lY3QgPSAoKSA9PiB7XG4gICAgICB0aGlzLiNib2ZmQ2xvc2VkID0gdHJ1ZTtcbiAgICAgIHRoaXMuI2JvZmZTdG9wKCk7XG5cbiAgICAgIGlmIChfc2VuZGVyKSB7XG4gICAgICAgIF9zZW5kZXIub25yZWFkeXN0YXRlY2hhbmdlID0gdW5kZWZpbmVkO1xuICAgICAgICBfc2VuZGVyLmFib3J0KCk7XG4gICAgICAgIF9zZW5kZXIgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKF9wb2xsZXIpIHtcbiAgICAgICAgX3BvbGxlci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIF9wb2xsZXIuYWJvcnQoKTtcbiAgICAgICAgX3BvbGxlciA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9uRGlzY29ubmVjdCkge1xuICAgICAgICB0aGlzLm9uRGlzY29ubmVjdChuZXcgRXJyb3IoTkVUV09SS19VU0VSX1RFWFQgKyAnICgnICsgTkVUV09SS19VU0VSICsgJyknKSwgTkVUV09SS19VU0VSKTtcbiAgICAgIH1cbiAgICAgIC8vIEVuc3VyZSBpdCdzIHJlY29uc3RydWN0ZWRcbiAgICAgIF9scFVSTCA9IG51bGw7XG4gICAgfTtcblxuICAgIHRoaXMuc2VuZFRleHQgPSAobXNnKSA9PiB7XG4gICAgICBfc2VuZGVyID0gbHBfc2VuZGVyKF9scFVSTCk7XG4gICAgICBpZiAoX3NlbmRlciAmJiAoX3NlbmRlci5yZWFkeVN0YXRlID09IFhEUl9PUEVORUQpKSB7IC8vIDEgPT0gT1BFTkVEXG4gICAgICAgIF9zZW5kZXIuc2VuZChtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTG9uZyBwb2xsZXIgZmFpbGVkIHRvIGNvbm5lY3RcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuaXNDb25uZWN0ZWQgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gKF9wb2xsZXIgJiYgdHJ1ZSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemF0aW9uIGZvciBXZWJzb2NrZXRcbiAgI2luaXRfd3MoKSB7XG4gICAgdGhpcy5jb25uZWN0ID0gKGhvc3RfLCBmb3JjZSkgPT4ge1xuICAgICAgdGhpcy4jYm9mZkNsb3NlZCA9IGZhbHNlO1xuXG4gICAgICBpZiAodGhpcy4jc29ja2V0KSB7XG4gICAgICAgIGlmICghZm9yY2UgJiYgdGhpcy4jc29ja2V0LnJlYWR5U3RhdGUgPT0gdGhpcy4jc29ja2V0Lk9QRU4pIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jc29ja2V0LmNsb3NlKCk7XG4gICAgICAgIHRoaXMuI3NvY2tldCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChob3N0Xykge1xuICAgICAgICB0aGlzLmhvc3QgPSBob3N0XztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gbWFrZUJhc2VVcmwodGhpcy5ob3N0LCB0aGlzLnNlY3VyZSA/ICd3c3MnIDogJ3dzJywgdGhpcy52ZXJzaW9uLCB0aGlzLmFwaUtleSk7XG5cbiAgICAgICAgdGhpcy4jbG9nKFwiQ29ubmVjdGluZyB0bzogXCIsIHVybCk7XG5cbiAgICAgICAgLy8gSXQgdGhyb3dzIHdoZW4gdGhlIHNlcnZlciBpcyBub3QgYWNjZXNzaWJsZSBidXQgdGhlIGV4Y2VwdGlvbiBjYW5ub3QgYmUgY2F1Z2h0OlxuICAgICAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zMTAwMjU5Mi9qYXZhc2NyaXB0LWRvZXNudC1jYXRjaC1lcnJvci1pbi13ZWJzb2NrZXQtaW5zdGFudGlhdGlvbi8zMTAwMzA1N1xuICAgICAgICBjb25zdCBjb25uID0gbmV3IFdlYlNvY2tldFByb3ZpZGVyKHVybCk7XG5cbiAgICAgICAgY29ubi5vbmVycm9yID0gKGVycikgPT4ge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbm4ub25vcGVuID0gKGV2dCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmF1dG9yZWNvbm5lY3QpIHtcbiAgICAgICAgICAgIHRoaXMuI2JvZmZTdG9wKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMub25PcGVuKSB7XG4gICAgICAgICAgICB0aGlzLm9uT3BlbigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25uLm9uY2xvc2UgPSAoZXZ0KSA9PiB7XG4gICAgICAgICAgdGhpcy4jc29ja2V0ID0gbnVsbDtcblxuICAgICAgICAgIGlmICh0aGlzLm9uRGlzY29ubmVjdCkge1xuICAgICAgICAgICAgY29uc3QgY29kZSA9IHRoaXMuI2JvZmZDbG9zZWQgPyBORVRXT1JLX1VTRVIgOiBORVRXT1JLX0VSUk9SO1xuICAgICAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3QobmV3IEVycm9yKHRoaXMuI2JvZmZDbG9zZWQgPyBORVRXT1JLX1VTRVJfVEVYVCA6IE5FVFdPUktfRVJST1JfVEVYVCArXG4gICAgICAgICAgICAgICcgKCcgKyBjb2RlICsgJyknKSwgY29kZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLiNib2ZmQ2xvc2VkICYmIHRoaXMuYXV0b3JlY29ubmVjdCkge1xuICAgICAgICAgICAgdGhpcy4jYm9mZlJlY29ubmVjdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25uLm9ubWVzc2FnZSA9IChldnQpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMub25NZXNzYWdlKGV2dC5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy4jc29ja2V0ID0gY29ubjtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMucmVjb25uZWN0ID0gKGZvcmNlKSA9PiB7XG4gICAgICB0aGlzLiNib2ZmU3RvcCgpO1xuICAgICAgdGhpcy5jb25uZWN0KG51bGwsIGZvcmNlKTtcbiAgICB9O1xuXG4gICAgdGhpcy5kaXNjb25uZWN0ID0gKCkgPT4ge1xuICAgICAgdGhpcy4jYm9mZkNsb3NlZCA9IHRydWU7XG4gICAgICB0aGlzLiNib2ZmU3RvcCgpO1xuXG4gICAgICBpZiAoIXRoaXMuI3NvY2tldCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLiNzb2NrZXQuY2xvc2UoKTtcbiAgICAgIHRoaXMuI3NvY2tldCA9IG51bGw7XG4gICAgfTtcblxuICAgIHRoaXMuc2VuZFRleHQgPSAobXNnKSA9PiB7XG4gICAgICBpZiAodGhpcy4jc29ja2V0ICYmICh0aGlzLiNzb2NrZXQucmVhZHlTdGF0ZSA9PSB0aGlzLiNzb2NrZXQuT1BFTikpIHtcbiAgICAgICAgdGhpcy4jc29ja2V0LnNlbmQobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIldlYnNvY2tldCBpcyBub3QgY29ubmVjdGVkXCIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmlzQ29ubmVjdGVkID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICh0aGlzLiNzb2NrZXQgJiYgKHRoaXMuI3NvY2tldC5yZWFkeVN0YXRlID09IHRoaXMuI3NvY2tldC5PUEVOKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIENhbGxiYWNrczpcblxuICAvKipcbiAgICogQSBjYWxsYmFjayB0byBwYXNzIGluY29taW5nIG1lc3NhZ2VzIHRvLiBTZWUge0BsaW5rIFRpbm9kZS5Db25uZWN0aW9uI29uTWVzc2FnZX0uXG4gICAqIEBjYWxsYmFjayBUaW5vZGUuQ29ubmVjdGlvbi5Pbk1lc3NhZ2VcbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gTWVzc2FnZSB0byBwcm9jZXNzLlxuICAgKi9cbiAgb25NZXNzYWdlID0gdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBBIGNhbGxiYWNrIGZvciByZXBvcnRpbmcgYSBkcm9wcGVkIGNvbm5lY3Rpb24uXG4gICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKi9cbiAgb25EaXNjb25uZWN0ID0gdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBBIGNhbGxiYWNrIGNhbGxlZCB3aGVuIHRoZSBjb25uZWN0aW9uIGlzIHJlYWR5IHRvIGJlIHVzZWQgZm9yIHNlbmRpbmcuIEZvciB3ZWJzb2NrZXRzIGl0J3Mgc29ja2V0IG9wZW4sXG4gICAqIGZvciBsb25nIHBvbGxpbmcgaXQncyA8Y29kZT5yZWFkeVN0YXRlPTE8L2NvZGU+IChPUEVORUQpXG4gICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKi9cbiAgb25PcGVuID0gdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBBIGNhbGxiYWNrIHRvIG5vdGlmeSBvZiByZWNvbm5lY3Rpb24gYXR0ZW1wdHMuIFNlZSB7QGxpbmsgVGlub2RlLkNvbm5lY3Rpb24jb25BdXRvcmVjb25uZWN0SXRlcmF0aW9ufS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uXG4gICAqIEBjYWxsYmFjayBBdXRvcmVjb25uZWN0SXRlcmF0aW9uVHlwZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGltZW91dCAtIHRpbWUgdGlsbCB0aGUgbmV4dCByZWNvbm5lY3QgYXR0ZW1wdCBpbiBtaWxsaXNlY29uZHMuIDxjb2RlPi0xPC9jb2RlPiBtZWFucyByZWNvbm5lY3Qgd2FzIHNraXBwZWQuXG4gICAqIEBwYXJhbSB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIHRoZSByZWNvbm5lY3QgYXR0ZW1wIGNvbXBsZXRlcy5cbiAgICpcbiAgICovXG4gIC8qKlxuICAgKiBBIGNhbGxiYWNrIHRvIGluZm9ybSB3aGVuIHRoZSBuZXh0IGF0dGFtcHQgdG8gcmVjb25uZWN0IHdpbGwgaGFwcGVuIGFuZCB0byByZWNlaXZlIGNvbm5lY3Rpb24gcHJvbWlzZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uI1xuICAgKiBAdHlwZSB7VGlub2RlLkNvbm5lY3Rpb24uQXV0b3JlY29ubmVjdEl0ZXJhdGlvblR5cGV9XG4gICAqL1xuICBvbkF1dG9yZWNvbm5lY3RJdGVyYXRpb24gPSB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgdG8gbG9nIGV2ZW50cyBmcm9tIENvbm5lY3Rpb24uIFNlZSB7QGxpbmsgVGlub2RlLkNvbm5lY3Rpb24jbG9nZ2VyfS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Db25uZWN0aW9uXG4gICAqIEBjYWxsYmFjayBMb2dnZXJDYWxsYmFja1R5cGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gRXZlbnQgdG8gbG9nLlxuICAgKi9cbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgdG8gcmVwb3J0IGxvZ2dpbmcgZXZlbnRzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkNvbm5lY3Rpb24jXG4gICAqIEB0eXBlIHtUaW5vZGUuQ29ubmVjdGlvbi5Mb2dnZXJDYWxsYmFja1R5cGV9XG4gICAqL1xuICBsb2dnZXIgPSB1bmRlZmluZWQ7XG59XG5cbkNvbm5lY3Rpb24uTkVUV09SS19FUlJPUiA9IE5FVFdPUktfRVJST1I7XG5Db25uZWN0aW9uLk5FVFdPUktfRVJST1JfVEVYVCA9IE5FVFdPUktfRVJST1JfVEVYVDtcbkNvbm5lY3Rpb24uTkVUV09SS19VU0VSID0gTkVUV09SS19VU0VSO1xuQ29ubmVjdGlvbi5ORVRXT1JLX1VTRVJfVEVYVCA9IE5FVFdPUktfVVNFUl9URVhUO1xuIiwiLyoqXG4gKiBAZmlsZSBIZWxwZXIgbWV0aG9kcyBmb3IgZGVhbGluZyB3aXRoIEluZGV4ZWREQiBjYWNoZSBvZiBtZXNzYWdlcywgdXNlcnMsIGFuZCB0b3BpY3MuXG4gKlxuICogQGNvcHlyaWdodCAyMDE1LTIwMjIgVGlub2RlIExMQy5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vLyBOT1RFIFRPIERFVkVMT1BFUlM6XG4vLyBMb2NhbGl6YWJsZSBzdHJpbmdzIHNob3VsZCBiZSBkb3VibGUgcXVvdGVkIFwi0YHRgtGA0L7QutCwINC90LAg0LTRgNGD0LPQvtC8INGP0LfRi9C60LVcIixcbi8vIG5vbi1sb2NhbGl6YWJsZSBzdHJpbmdzIHNob3VsZCBiZSBzaW5nbGUgcXVvdGVkICdub24tbG9jYWxpemVkJy5cblxuY29uc3QgREJfVkVSU0lPTiA9IDE7XG5jb25zdCBEQl9OQU1FID0gJ3Rpbm9kZS13ZWInO1xuXG5sZXQgSURCUHJvdmlkZXI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERCIHtcbiAgI29uRXJyb3IgPSBmdW5jdGlvbigpIHt9O1xuICAjbG9nZ2VyID0gZnVuY3Rpb24oKSB7fTtcblxuICAvLyBJbnN0YW5jZSBvZiBJbmRleERCLlxuICBkYiA9IG51bGw7XG4gIC8vIEluZGljYXRvciB0aGF0IHRoZSBjYWNoZSBpcyBkaXNhYmxlZC5cbiAgZGlzYWJsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihvbkVycm9yLCBsb2dnZXIpIHtcbiAgICB0aGlzLiNvbkVycm9yID0gb25FcnJvciB8fCB0aGlzLiNvbkVycm9yO1xuICAgIHRoaXMuI2xvZ2dlciA9IGxvZ2dlciB8fCB0aGlzLiNsb2dnZXI7XG4gIH1cblxuICAjbWFwT2JqZWN0cyhzb3VyY2UsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgaWYgKCF0aGlzLmRiKSB7XG4gICAgICByZXR1cm4gZGlzYWJsZWQgP1xuICAgICAgICBQcm9taXNlLnJlc29sdmUoW10pIDpcbiAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdHJ4ID0gdGhpcy5kYi50cmFuc2FjdGlvbihbc291cmNlXSk7XG4gICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICdtYXBPYmplY3RzJywgc291cmNlLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgIH07XG4gICAgICB0cngub2JqZWN0U3RvcmUoc291cmNlKS5nZXRBbGwoKS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgZXZlbnQudGFyZ2V0LnJlc3VsdC5mb3JFYWNoKCh0b3BpYykgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB0b3BpYyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBwZXJzaXN0ZW50IGNhY2hlOiBvcGVuIG9yIGNyZWF0ZS91cGdyYWRlIGlmIG5lZWRlZC5cbiAgICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgREIgaXMgaW5pdGlhbGl6ZWQuXG4gICAqL1xuICBpbml0RGF0YWJhc2UoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIC8vIE9wZW4gdGhlIGRhdGFiYXNlIGFuZCBpbml0aWFsaXplIGNhbGxiYWNrcy5cbiAgICAgIGNvbnN0IHJlcSA9IElEQlByb3ZpZGVyLm9wZW4oREJfTkFNRSwgREJfVkVSU0lPTik7XG4gICAgICByZXEub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuZGIgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICB0aGlzLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIHJlc29sdmUodGhpcy5kYik7XG4gICAgICB9O1xuICAgICAgcmVxLm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy4jbG9nZ2VyKCdQQ2FjaGUnLCBcImZhaWxlZCB0byBpbml0aWFsaXplXCIsIGV2ZW50KTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIHRoaXMuI29uRXJyb3IoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgIH07XG4gICAgICByZXEub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5kYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgICAgdGhpcy5kYi5vbmVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsIFwiZmFpbGVkIHRvIGNyZWF0ZSBzdG9yYWdlXCIsIGV2ZW50KTtcbiAgICAgICAgICB0aGlzLiNvbkVycm9yKGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW5kaXZpZHVhbCBvYmplY3Qgc3RvcmVzLlxuICAgICAgICAvLyBPYmplY3Qgc3RvcmUgKHRhYmxlKSBmb3IgdG9waWNzLiBUaGUgcHJpbWFyeSBrZXkgaXMgdG9waWMgbmFtZS5cbiAgICAgICAgdGhpcy5kYi5jcmVhdGVPYmplY3RTdG9yZSgndG9waWMnLCB7XG4gICAgICAgICAga2V5UGF0aDogJ25hbWUnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFVzZXJzIG9iamVjdCBzdG9yZS4gVUlEIGlzIHRoZSBwcmltYXJ5IGtleS5cbiAgICAgICAgdGhpcy5kYi5jcmVhdGVPYmplY3RTdG9yZSgndXNlcicsIHtcbiAgICAgICAgICBrZXlQYXRoOiAndWlkJ1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTdWJzY3JpcHRpb25zIG9iamVjdCBzdG9yZSB0b3BpYyA8LT4gdXNlci4gVG9waWMgbmFtZSArIFVJRCBpcyB0aGUgcHJpbWFyeSBrZXkuXG4gICAgICAgIHRoaXMuZGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3N1YnNjcmlwdGlvbicsIHtcbiAgICAgICAgICBrZXlQYXRoOiBbJ3RvcGljJywgJ3VpZCddXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIE1lc3NhZ2VzIG9iamVjdCBzdG9yZS4gVGhlIHByaW1hcnkga2V5IGlzIHRvcGljIG5hbWUgKyBzZXEuXG4gICAgICAgIHRoaXMuZGIuY3JlYXRlT2JqZWN0U3RvcmUoJ21lc3NhZ2UnLCB7XG4gICAgICAgICAga2V5UGF0aDogWyd0b3BpYycsICdzZXEnXVxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAqL1xuICBkZWxldGVEYXRhYmFzZSgpIHtcbiAgICAvLyBDbG9zZSBjb25uZWN0aW9uLCBvdGhlcndpc2Ugb3BlcmF0aW9ucyB3aWxsIGZhaWwgd2l0aCAnb25ibG9ja2VkJy5cbiAgICBpZiAodGhpcy5kYikge1xuICAgICAgdGhpcy5kYi5jbG9zZSgpO1xuICAgICAgdGhpcy5kYiA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByZXEgPSBJREJQcm92aWRlci5kZWxldGVEYXRhYmFzZShEQl9OQU1FKTtcbiAgICAgIHJlcS5vbmJsb2NrZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAodGhpcy5kYikge1xuICAgICAgICAgIHRoaXMuZGIuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoXCJibG9ja2VkXCIpO1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICdkZWxldGVEYXRhYmFzZScsIGVycik7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfTtcbiAgICAgIHJlcS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5kYiA9IG51bGw7XG4gICAgICAgIHRoaXMuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgfTtcbiAgICAgIHJlcS5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuI2xvZ2dlcignUENhY2hlJywgJ2RlbGV0ZURhdGFiYXNlJywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHBlcnNpc3RlbnQgY2FjaGUgaXMgcmVhZHkgZm9yIHVzZS5cbiAgICogQG1lbWJlck9mIERCXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiBjYWNoZSBpcyByZWFkeSwgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIGlzUmVhZHkoKSB7XG4gICAgcmV0dXJuICEhdGhpcy5kYjtcbiAgfVxuXG4gIC8vIFRvcGljcy5cblxuICAvKipcbiAgICogU2F2ZSB0byBjYWNoZSBvciB1cGRhdGUgdG9waWMgaW4gcGVyc2lzdGVudCBjYWNoZS5cbiAgICogQG1lbWJlck9mIERCXG4gICAqIEBwYXJhbSB7VG9waWN9IHRvcGljIC0gdG9waWMgdG8gYmUgYWRkZWQgb3IgdXBkYXRlZC5cbiAgICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAqL1xuICB1cGRUb3BpYyh0b3BpYykge1xuICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmRpc2FibGVkID9cbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgOlxuICAgICAgICBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJub3QgaW5pdGlhbGl6ZWRcIikpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdHJ4ID0gdGhpcy5kYi50cmFuc2FjdGlvbihbJ3RvcGljJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgIHRyeC5vbmNvbXBsZXRlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICB9O1xuICAgICAgdHJ4Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy4jbG9nZ2VyKCdQQ2FjaGUnLCAndXBkVG9waWMnLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgIH07XG4gICAgICBjb25zdCByZXEgPSB0cngub2JqZWN0U3RvcmUoJ3RvcGljJykuZ2V0KHRvcGljLm5hbWUpO1xuICAgICAgcmVxLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICB0cngub2JqZWN0U3RvcmUoJ3RvcGljJykucHV0KERCLiNzZXJpYWxpemVUb3BpYyhyZXEucmVzdWx0LCB0b3BpYykpO1xuICAgICAgICB0cnguY29tbWl0KCk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcmsgb3IgdW5tYXJrIHRvcGljIGFzIGRlbGV0ZWQuXG4gICAqIEBtZW1iZXJPZiBEQlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHRvIG1hcmsgb3IgdW5tYXJrLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGRlbGV0ZWQgLSBkZWxldGlvbiBtYXJrLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgKi9cbiAgbWFya1RvcGljQXNEZWxldGVkKG5hbWUsIGRlbGV0ZWQpIHtcbiAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaXNhYmxlZCA/XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRyeCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oWyd0b3BpYyddLCAncmVhZHdyaXRlJyk7XG4gICAgICB0cngub25jb21wbGV0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgfTtcbiAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuI2xvZ2dlcignUENhY2hlJywgJ21hcmtUb3BpY0FzRGVsZXRlZCcsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlcSA9IHRyeC5vYmplY3RTdG9yZSgndG9waWMnKS5nZXQobmFtZSk7XG4gICAgICByZXEub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHRvcGljID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgaWYgKHRvcGljLl9kZWxldGVkICE9IGRlbGV0ZWQpIHtcbiAgICAgICAgICB0b3BpYy5fZGVsZXRlZCA9IHRydWU7XG4gICAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd0b3BpYycpLnB1dCh0b3BpYyk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdG9waWMgZnJvbSBwZXJzaXN0ZW50IGNhY2hlLlxuICAgKiBAbWVtYmVyT2YgREJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBuYW1lIG9mIHRoZSB0b3BpYyB0byByZW1vdmUgZnJvbSBkYXRhYmFzZS5cbiAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICovXG4gIHJlbVRvcGljKG5hbWUpIHtcbiAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaXNhYmxlZCA/XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRyeCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oWyd0b3BpYycsICdzdWJzY3JpcHRpb24nLCAnbWVzc2FnZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICB0cngub25jb21wbGV0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgfTtcbiAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuI2xvZ2dlcignUENhY2hlJywgJ3JlbVRvcGljJywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICB9O1xuICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd0b3BpYycpLmRlbGV0ZShJREJLZXlSYW5nZS5vbmx5KG5hbWUpKTtcbiAgICAgIHRyeC5vYmplY3RTdG9yZSgnc3Vic2NyaXB0aW9uJykuZGVsZXRlKElEQktleVJhbmdlLmJvdW5kKFtuYW1lLCAnLSddLCBbbmFtZSwgJ34nXSkpO1xuICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdtZXNzYWdlJykuZGVsZXRlKElEQktleVJhbmdlLmJvdW5kKFtuYW1lLCAwXSwgW25hbWUsIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSXSkpO1xuICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgYSBjYWxsYmFjayBmb3IgZWFjaCBzdG9yZWQgdG9waWMuXG4gICAqIEBtZW1iZXJPZiBEQlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIGZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggdG9waWMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gdGhlIHZhbHVlIG9yIDxjb2RlPnRoaXM8L2NvZGU+IGluc2lkZSB0aGUgY2FsbGJhY2suXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAqL1xuICBtYXBUb3BpY3MoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICByZXR1cm4gdGhpcy4jbWFwT2JqZWN0cygndG9waWMnLCBjYWxsYmFjaywgY29udGV4dCk7XG4gIH1cblxuICAvKipcbiAgICogQ29weSBkYXRhIGZyb20gc2VyaWFsaXplZCBvYmplY3QgdG8gdG9waWMuXG4gICAqIEBtZW1iZXJPZiBEQlxuICAgKiBAcGFyYW0ge1RvcGljfSB0b3BpYyAtIHRhcmdldCB0byBkZXNlcmlhbGl6ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IHNyYyAtIHNlcmlhbGl6ZWQgZGF0YSB0byBjb3B5IGZyb20uXG4gICAqL1xuICBkZXNlcmlhbGl6ZVRvcGljKHRvcGljLCBzcmMpIHtcbiAgICBEQi4jZGVzZXJpYWxpemVUb3BpYyh0b3BpYywgc3JjKTtcbiAgfVxuXG4gIC8vIFVzZXJzLlxuICAvKipcbiAgICogQWRkIG9yIHVwZGF0ZSB1c2VyIG9iamVjdCBpbiB0aGUgcGVyc2lzdGVudCBjYWNoZS5cbiAgICogQG1lbWJlck9mIERCXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1aWQgLSBJRCBvZiB0aGUgdXNlciB0byBzYXZlIG9yIHVwZGF0ZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHB1YiAtIHVzZXIncyA8Y29kZT5wdWJsaWM8L2NvZGU+IGluZm9ybWF0aW9uLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICovXG4gIHVwZFVzZXIodWlkLCBwdWIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIgfHwgcHViID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE5vIHBvaW50IGludXBkYXRpbmcgdXNlciB3aXRoIGludmFsaWQgZGF0YS5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGlzYWJsZWQgP1xuICAgICAgICBQcm9taXNlLnJlc29sdmUoKSA6XG4gICAgICAgIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIm5vdCBpbml0aWFsaXplZFwiKSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB0cnggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKFsndXNlciddLCAncmVhZHdyaXRlJyk7XG4gICAgICB0cngub25jb21wbGV0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgfTtcbiAgICAgIHRyeC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuI2xvZ2dlcignUENhY2hlJywgJ3VwZFVzZXInLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgIH07XG4gICAgICB0cngub2JqZWN0U3RvcmUoJ3VzZXInKS5wdXQoe1xuICAgICAgICB1aWQ6IHVpZCxcbiAgICAgICAgcHVibGljOiBwdWJcbiAgICAgIH0pO1xuICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSB1c2VyIGZyb20gcGVyc2lzdGVudCBjYWNoZS5cbiAgICogQG1lbWJlck9mIERCXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1aWQgLSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUgZnJvbSB0aGUgY2FjaGUuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAqL1xuICByZW1Vc2VyKHVpZCkge1xuICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmRpc2FibGVkID9cbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgOlxuICAgICAgICBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJub3QgaW5pdGlhbGl6ZWRcIikpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdHJ4ID0gdGhpcy5kYi50cmFuc2FjdGlvbihbJ3VzZXInXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgdHJ4Lm9uY29tcGxldGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgIH07XG4gICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICdyZW1Vc2VyJywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICB9O1xuICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd1c2VyJykuZGVsZXRlKElEQktleVJhbmdlLm9ubHkodWlkKSk7XG4gICAgICB0cnguY29tbWl0KCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBhIGNhbGxiYWNrIGZvciBlYWNoIHN0b3JlZCB1c2VyLlxuICAgKiBAbWVtYmVyT2YgREJcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBmdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHRvcGljLlxuICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIHRoZSB2YWx1ZSBvciA8Y29kZT50aGlzPC9jb2RlPiBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgKi9cbiAgbWFwVXNlcnMoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICByZXR1cm4gdGhpcy4jbWFwT2JqZWN0cygndXNlcicsIGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkIGEgc2luZ2xlIHVzZXIgZnJvbSBwZXJzaXN0ZW50IGNhY2hlLlxuICAgKiBAbWVtYmVyT2YgREJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIElEIG9mIHRoZSB1c2VyIHRvIGZldGNoIGZyb20gY2FjaGUuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAqL1xuICBnZXRVc2VyKHVpZCkge1xuICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmRpc2FibGVkID9cbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgOlxuICAgICAgICBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJub3QgaW5pdGlhbGl6ZWRcIikpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdHJ4ID0gdGhpcy5kYi50cmFuc2FjdGlvbihbJ3VzZXInXSk7XG4gICAgICB0cngub25jb21wbGV0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCB1c2VyID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgdXNlcjogdXNlci51aWQsXG4gICAgICAgICAgcHVibGljOiB1c2VyLnB1YmxpY1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICdnZXRVc2VyJywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICB9O1xuICAgICAgdHJ4Lm9iamVjdFN0b3JlKCd1c2VyJykuZ2V0KHVpZCk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBTdWJzY3JpcHRpb25zLlxuICAvKipcbiAgICogQWRkIG9yIHVwZGF0ZSBzdWJzY3JpcHRpb24gaW4gcGVyc2lzdGVudCBjYWNoZS5cbiAgICogQG1lbWJlck9mIERCXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBuYW1lIG9mIHRoZSB0b3BpYyB3aGljaCBvd25zIHRoZSBtZXNzYWdlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gSUQgb2YgdGhlIHN1YnNjcmliZWQgdXNlci5cbiAgICogQHBhcmFtIHtPYmplY3R9IHN1YiAtIHN1YnNjcmlwdGlvbiB0byBzYXZlLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgKi9cbiAgdXBkU3Vic2NyaXB0aW9uKHRvcGljTmFtZSwgdWlkLCBzdWIpIHtcbiAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaXNhYmxlZCA/XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRyeCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oWydzdWJzY3JpcHRpb24nXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgdHJ4Lm9uY29tcGxldGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgIH07XG4gICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICd1cGRTdWJzY3JpcHRpb24nLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgIH07XG4gICAgICB0cngub2JqZWN0U3RvcmUoJ3N1YnNjcmlwdGlvbicpLmdldChbdG9waWNOYW1lLCB1aWRdKS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdzdWJzY3JpcHRpb24nKS5wdXQoREIuI3NlcmlhbGl6ZVN1YnNjcmlwdGlvbihldmVudC50YXJnZXQucmVzdWx0LCB0b3BpY05hbWUsIHVpZCwgc3ViKSk7XG4gICAgICAgIHRyeC5jb21taXQoKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBhIGNhbGxiYWNrIGZvciBlYWNoIGNhY2hlZCBzdWJzY3JpcHRpb24gaW4gYSBnaXZlbiB0b3BpYy5cbiAgICogQG1lbWJlck9mIERCXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBuYW1lIG9mIHRoZSB0b3BpYyB3aGljaCBvd25zIHRoZSBzdWJzY3JpcHRpb25zLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIGZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggc3Vic2NyaXB0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIHRoZSB2YWx1ZSBvciA8Y29kZT50aGlzPC9jb2RlPiBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgKi9cbiAgbWFwU3Vic2NyaXB0aW9ucyh0b3BpY05hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGlzYWJsZWQgP1xuICAgICAgICBQcm9taXNlLnJlc29sdmUoW10pIDpcbiAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRyeCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oWydzdWJzY3JpcHRpb24nXSk7XG4gICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICdtYXBTdWJzY3JpcHRpb25zJywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICB9O1xuICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdzdWJzY3JpcHRpb24nKS5nZXRBbGwoSURCS2V5UmFuZ2UuYm91bmQoW3RvcGljTmFtZSwgJy0nXSwgW3RvcGljTmFtZSwgJ34nXSkpLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBldmVudC50YXJnZXQucmVzdWx0LmZvckVhY2goKHRvcGljKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRvcGljKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE1lc3NhZ2VzLlxuXG4gIC8qKlxuICAgKiBTYXZlIG1lc3NhZ2UgdG8gcGVyc2lzdGVudCBjYWNoZS5cbiAgICogQG1lbWJlck9mIERCXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBuYW1lIG9mIHRoZSB0b3BpYyB3aGljaCBvd25zIHRoZSBtZXNzYWdlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gbXNnIC0gbWVzc2FnZSB0byBzYXZlLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIG9uIG9wZXJhdGlvbiBjb21wbGV0aW9uLlxuICAgKi9cbiAgYWRkTWVzc2FnZShtc2cpIHtcbiAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaXNhYmxlZCA/XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRyeCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oWydtZXNzYWdlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgIHRyeC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgIH07XG4gICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICdhZGRNZXNzYWdlJywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICB9O1xuICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdtZXNzYWdlJykuYWRkKERCLiNzZXJpYWxpemVNZXNzYWdlKG51bGwsIG1zZykpO1xuICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBkZWxpdmVyeSBzdGF0dXMgb2YgYSBtZXNzYWdlIHN0b3JlZCBpbiBwZXJzaXN0ZW50IGNhY2hlLlxuICAgKiBAbWVtYmVyT2YgREJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHdoaWNoIG93bnMgdGhlIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBJRCBvZiB0aGUgbWVzc2FnZSB0byB1cGRhdGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1cyAtIG5ldyBkZWxpdmVyeSBzdGF0dXMgb2YgdGhlIG1lc3NhZ2UuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAqL1xuICB1cGRNZXNzYWdlU3RhdHVzKHRvcGljTmFtZSwgc2VxLCBzdGF0dXMpIHtcbiAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaXNhYmxlZCA/XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwibm90IGluaXRpYWxpemVkXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRyeCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oWydtZXNzYWdlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgIHRyeC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgIH07XG4gICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICd1cGRNZXNzYWdlU3RhdHVzJywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICB9O1xuICAgICAgY29uc3QgcmVxID0gdHJ4Lm9iamVjdFN0b3JlKCdtZXNzYWdlJykuZ2V0KElEQktleVJhbmdlLm9ubHkoW3RvcGljTmFtZSwgc2VxXSkpO1xuICAgICAgcmVxLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBzcmMgPSByZXEucmVzdWx0IHx8IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgIGlmICghc3JjIHx8IHNyYy5fc3RhdHVzID09IHN0YXR1cykge1xuICAgICAgICAgIHRyeC5jb21taXQoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ4Lm9iamVjdFN0b3JlKCdtZXNzYWdlJykucHV0KERCLiNzZXJpYWxpemVNZXNzYWdlKHNyYywge1xuICAgICAgICAgIHRvcGljOiB0b3BpY05hbWUsXG4gICAgICAgICAgc2VxOiBzZXEsXG4gICAgICAgICAgX3N0YXR1czogc3RhdHVzXG4gICAgICAgIH0pKTtcbiAgICAgICAgdHJ4LmNvbW1pdCgpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgb25lIG9yIG1vcmUgbWVzc2FnZXMgZnJvbSBwZXJzaXN0ZW50IGNhY2hlLlxuICAgKiBAbWVtYmVyT2YgREJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHdoaWNoIG93bnMgdGhlIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tIC0gaWQgb2YgdGhlIG1lc3NhZ2UgdG8gcmVtb3ZlIG9yIGxvd2VyIGJvdW5kYXJ5IHdoZW4gcmVtb3ZpbmcgcmFuZ2UgKGluY2x1c2l2ZSkuXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gdG8gLSB1cHBlciBib3VuZGFyeSAoZXhjbHVzaXZlKSB3aGVuIHJlbW92aW5nIGEgcmFuZ2Ugb2YgbWVzc2FnZXMuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gb3BlcmF0aW9uIGNvbXBsZXRpb24uXG4gICAqL1xuICByZW1NZXNzYWdlcyh0b3BpY05hbWUsIGZyb20sIHRvKSB7XG4gICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGlzYWJsZWQgP1xuICAgICAgICBQcm9taXNlLnJlc29sdmUoKSA6XG4gICAgICAgIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIm5vdCBpbml0aWFsaXplZFwiKSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAoIWZyb20gJiYgIXRvKSB7XG4gICAgICAgIGZyb20gPSAwO1xuICAgICAgICB0byA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuICAgICAgfVxuICAgICAgY29uc3QgcmFuZ2UgPSB0byA+IDAgPyBJREJLZXlSYW5nZS5ib3VuZChbdG9waWNOYW1lLCBmcm9tXSwgW3RvcGljTmFtZSwgdG9dLCBmYWxzZSwgdHJ1ZSkgOlxuICAgICAgICBJREJLZXlSYW5nZS5vbmx5KFt0b3BpY05hbWUsIGZyb21dKTtcbiAgICAgIGNvbnN0IHRyeCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oWydtZXNzYWdlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgIHRyeC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgIH07XG4gICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICdyZW1NZXNzYWdlcycsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgfTtcbiAgICAgIHRyeC5vYmplY3RTdG9yZSgnbWVzc2FnZScpLmRlbGV0ZShyYW5nZSk7XG4gICAgICB0cnguY29tbWl0KCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgbWVzc2FnZXMgZnJvbSBwZXJzaXN0ZW50IHN0b3JlLlxuICAgKiBAbWVtYmVyT2YgREJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHRvcGljIHRvIHJldHJpZXZlIG1lc3NhZ2VzIGZyb20uXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIHRvIGNhbGwgZm9yIGVhY2ggcmV0cmlldmVkIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBxdWVyeSAtIHBhcmFtZXRlcnMgb2YgdGhlIG1lc3NhZ2UgcmFuZ2UgdG8gcmV0cmlldmUuXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gcXVlcnkuc2luY2UgLSB0aGUgbGVhc3QgbWVzc2FnZSBJRCB0byByZXRyaWV2ZSAoaW5jbHVzaXZlKS5cbiAgICogQHBhcmFtIHtudW1iZXI9fSBxdWVyeS5iZWZvcmUgLSB0aGUgZ3JlYXRlc3QgbWVzc2FnZSBJRCB0byByZXRyaWV2ZSAoZXhjbHVzaXZlKS5cbiAgICogQHBhcmFtIHtudW1iZXI9fSBxdWVyeS5saW1pdCAtIHRoZSBtYXhpbXVtIG51bWJlciBvZiBtZXNzYWdlcyB0byByZXRyaWV2ZS5cbiAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCBvbiBvcGVyYXRpb24gY29tcGxldGlvbi5cbiAgICovXG4gIHJlYWRNZXNzYWdlcyh0b3BpY05hbWUsIHF1ZXJ5LCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmRpc2FibGVkID9cbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKFtdKSA6XG4gICAgICAgIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIm5vdCBpbml0aWFsaXplZFwiKSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBxdWVyeSA9IHF1ZXJ5IHx8IHt9O1xuICAgICAgY29uc3Qgc2luY2UgPSBxdWVyeS5zaW5jZSA+IDAgPyBxdWVyeS5zaW5jZSA6IDA7XG4gICAgICBjb25zdCBiZWZvcmUgPSBxdWVyeS5iZWZvcmUgPiAwID8gcXVlcnkuYmVmb3JlIDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XG4gICAgICBjb25zdCBsaW1pdCA9IHF1ZXJ5LmxpbWl0IHwgMDtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgICBjb25zdCByYW5nZSA9IElEQktleVJhbmdlLmJvdW5kKFt0b3BpY05hbWUsIHNpbmNlXSwgW3RvcGljTmFtZSwgYmVmb3JlXSwgZmFsc2UsIHRydWUpO1xuICAgICAgY29uc3QgdHJ4ID0gdGhpcy5kYi50cmFuc2FjdGlvbihbJ21lc3NhZ2UnXSk7XG4gICAgICB0cngub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLiNsb2dnZXIoJ1BDYWNoZScsICdyZWFkTWVzc2FnZXMnLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgIH07XG4gICAgICAvLyBJdGVyYXRlIGluIGRlc2NlbmRpbmcgb3JkZXIuXG4gICAgICB0cngub2JqZWN0U3RvcmUoJ21lc3NhZ2UnKS5vcGVuQ3Vyc29yKHJhbmdlLCAncHJldicpLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgaWYgKGxpbWl0IDw9IDAgfHwgcmVzdWx0Lmxlbmd0aCA8IGxpbWl0KSB7XG4gICAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvLyBQcml2YXRlIG1ldGhvZHMuXG5cbiAgLy8gU2VyaWFsaXphYmxlIHRvcGljIGZpZWxkcy5cbiAgc3RhdGljICN0b3BpY19maWVsZHMgPSBbJ2NyZWF0ZWQnLCAndXBkYXRlZCcsICdkZWxldGVkJywgJ3JlYWQnLCAncmVjdicsICdzZXEnLCAnY2xlYXInLCAnZGVmYWNzJyxcbiAgICAnY3JlZHMnLCAncHVibGljJywgJ3RydXN0ZWQnLCAncHJpdmF0ZScsICd0b3VjaGVkJywgJ19kZWxldGVkJ1xuICBdO1xuXG4gIC8vIENvcHkgZGF0YSBmcm9tIHNyYyB0byBUb3BpYyBvYmplY3QuXG4gIHN0YXRpYyAjZGVzZXJpYWxpemVUb3BpYyh0b3BpYywgc3JjKSB7XG4gICAgREIuI3RvcGljX2ZpZWxkcy5mb3JFYWNoKChmKSA9PiB7XG4gICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGYpKSB7XG4gICAgICAgIHRvcGljW2ZdID0gc3JjW2ZdO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHNyYy50YWdzKSkge1xuICAgICAgdG9waWMuX3RhZ3MgPSBzcmMudGFncztcbiAgICB9XG4gICAgaWYgKHNyYy5hY3MpIHtcbiAgICAgIHRvcGljLnNldEFjY2Vzc01vZGUoc3JjLmFjcyk7XG4gICAgfVxuICAgIHRvcGljLnNlcSB8PSAwO1xuICAgIHRvcGljLnJlYWQgfD0gMDtcbiAgICB0b3BpYy51bnJlYWQgPSBNYXRoLm1heCgwLCB0b3BpYy5zZXEgLSB0b3BpYy5yZWFkKTtcbiAgfVxuXG4gIC8vIENvcHkgdmFsdWVzIGZyb20gJ3NyYycgdG8gJ2RzdCcuIEFsbG9jYXRlIGRzdCBpZiBpdCdzIG51bGwgb3IgdW5kZWZpbmVkLlxuICBzdGF0aWMgI3NlcmlhbGl6ZVRvcGljKGRzdCwgc3JjKSB7XG4gICAgY29uc3QgcmVzID0gZHN0IHx8IHtcbiAgICAgIG5hbWU6IHNyYy5uYW1lXG4gICAgfTtcbiAgICBEQi4jdG9waWNfZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgcmVzW2ZdID0gc3JjW2ZdO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHNyYy5fdGFncykpIHtcbiAgICAgIHJlcy50YWdzID0gc3JjLl90YWdzO1xuICAgIH1cbiAgICBpZiAoc3JjLmFjcykge1xuICAgICAgcmVzLmFjcyA9IHNyYy5nZXRBY2Nlc3NNb2RlKCkuanNvbkhlbHBlcigpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgc3RhdGljICNzZXJpYWxpemVTdWJzY3JpcHRpb24oZHN0LCB0b3BpY05hbWUsIHVpZCwgc3ViKSB7XG4gICAgY29uc3QgZmllbGRzID0gWyd1cGRhdGVkJywgJ21vZGUnLCAncmVhZCcsICdyZWN2JywgJ2NsZWFyJywgJ2xhc3RTZWVuJywgJ3VzZXJBZ2VudCddO1xuICAgIGNvbnN0IHJlcyA9IGRzdCB8fCB7XG4gICAgICB0b3BpYzogdG9waWNOYW1lLFxuICAgICAgdWlkOiB1aWRcbiAgICB9O1xuXG4gICAgZmllbGRzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIGlmIChzdWIuaGFzT3duUHJvcGVydHkoZikpIHtcbiAgICAgICAgcmVzW2ZdID0gc3ViW2ZdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIHN0YXRpYyAjc2VyaWFsaXplTWVzc2FnZShkc3QsIG1zZykge1xuICAgIC8vIFNlcmlhbGl6YWJsZSBmaWVsZHMuXG4gICAgY29uc3QgZmllbGRzID0gWyd0b3BpYycsICdzZXEnLCAndHMnLCAnX3N0YXR1cycsICdmcm9tJywgJ2hlYWQnLCAnY29udGVudCddO1xuICAgIGNvbnN0IHJlcyA9IGRzdCB8fCB7fTtcbiAgICBmaWVsZHMuZm9yRWFjaCgoZikgPT4ge1xuICAgICAgaWYgKG1zZy5oYXNPd25Qcm9wZXJ0eShmKSkge1xuICAgICAgICByZXNbZl0gPSBtc2dbZl07XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUbyB1c2UgREIgaW4gYSBub24gYnJvd3NlciBjb250ZXh0LCBzdXBwbHkgaW5kZXhlZERCIHByb3ZpZGVyLlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJvZiBEQlxuICAgKiBAcGFyYW0gaWRiUHJvdmlkZXIgaW5kZXhlZERCIHByb3ZpZGVyLCBlLmcuIGZvciBub2RlIDxjb2RlPnJlcXVpcmUoJ2Zha2UtaW5kZXhlZGRiJyk8L2NvZGU+LlxuICAgKi9cbiAgc3RhdGljIHNldERhdGFiYXNlUHJvdmlkZXIoaWRiUHJvdmlkZXIpIHtcbiAgICBJREJQcm92aWRlciA9IGlkYlByb3ZpZGVyO1xuICB9XG59XG4iLCIvKipcbiAqIEBjb3B5cmlnaHQgMjAxNS0yMDIyIFRpbm9kZSBMTEMuXG4gKiBAc3VtbWFyeSBNaW5pbWFsbHkgcmljaCB0ZXh0IHJlcHJlc2VudGF0aW9uIGFuZCBmb3JtYXR0aW5nIGZvciBUaW5vZGUuXG4gKiBAbGljZW5zZSBBcGFjaGUgMi4wXG4gKlxuICogQGZpbGUgQmFzaWMgcGFyc2VyIGFuZCBmb3JtYXR0ZXIgZm9yIHZlcnkgc2ltcGxlIHRleHQgbWFya3VwLiBNb3N0bHkgdGFyZ2V0ZWQgYXRcbiAqIG1vYmlsZSB1c2UgY2FzZXMgc2ltaWxhciB0byBUZWxlZ3JhbSwgV2hhdHNBcHAsIGFuZCBGQiBNZXNzZW5nZXIuXG4gKlxuICogPHA+U3VwcG9ydHMgY29udmVyc2lvbiBvZiB1c2VyIGtleWJvYXJkIGlucHV0IHRvIGZvcm1hdHRlZCB0ZXh0OjwvcD5cbiAqIDx1bD5cbiAqICAgPGxpPiphYmMqICZyYXJyOyA8Yj5hYmM8L2I+PC9saT5cbiAqICAgPGxpPl9hYmNfICZyYXJyOyA8aT5hYmM8L2k+PC9saT5cbiAqICAgPGxpPn5hYmN+ICZyYXJyOyA8ZGVsPmFiYzwvZGVsPjwvbGk+XG4gKiAgIDxsaT5gYWJjYCAmcmFycjsgPHR0PmFiYzwvdHQ+PC9saT5cbiAqIDwvdWw+XG4gKiBBbHNvIHN1cHBvcnRzIGZvcm1zIGFuZCBidXR0b25zLlxuICpcbiAqIE5lc3RlZCBmb3JtYXR0aW5nIGlzIHN1cHBvcnRlZCwgZS5nLiAqYWJjIF9kZWZfKiAtPiA8Yj5hYmMgPGk+ZGVmPC9pPjwvYj5cbiAqIFVSTHMsIEBtZW50aW9ucywgYW5kICNoYXNodGFncyBhcmUgZXh0cmFjdGVkIGFuZCBjb252ZXJ0ZWQgaW50byBsaW5rcy5cbiAqIEZvcm1zIGFuZCBidXR0b25zIGNhbiBiZSBhZGRlZCBwcm9jZWR1cmFsbHkuXG4gKiBKU09OIGRhdGEgcmVwcmVzZW50YXRpb24gaXMgaW5zcGlyZWQgYnkgRHJhZnQuanMgcmF3IGZvcm1hdHRpbmcuXG4gKlxuICpcbiAqIEBleGFtcGxlXG4gKiBUZXh0OlxuICogPHByZT5cbiAqICAgICB0aGlzIGlzICpib2xkKiwgYGNvZGVgIGFuZCBfaXRhbGljXywgfnN0cmlrZX5cbiAqICAgICBjb21iaW5lZCAqYm9sZCBhbmQgX2l0YWxpY18qXG4gKiAgICAgYW4gdXJsOiBodHRwczovL3d3dy5leGFtcGxlLmNvbS9hYmMjZnJhZ21lbnQgYW5kIGFub3RoZXIgX3d3dy50aW5vZGUuY29fXG4gKiAgICAgdGhpcyBpcyBhIEBtZW50aW9uIGFuZCBhICNoYXNodGFnIGluIGEgc3RyaW5nXG4gKiAgICAgc2Vjb25kICNoYXNodGFnXG4gKiA8L3ByZT5cbiAqXG4gKiAgU2FtcGxlIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIHRleHQgYWJvdmU6XG4gKiAge1xuICogICAgIFwidHh0XCI6IFwidGhpcyBpcyBib2xkLCBjb2RlIGFuZCBpdGFsaWMsIHN0cmlrZSBjb21iaW5lZCBib2xkIGFuZCBpdGFsaWMgYW4gdXJsOiBodHRwczovL3d3dy5leGFtcGxlLmNvbS9hYmMjZnJhZ21lbnQgXCIgK1xuICogICAgICAgICAgICAgXCJhbmQgYW5vdGhlciB3d3cudGlub2RlLmNvIHRoaXMgaXMgYSBAbWVudGlvbiBhbmQgYSAjaGFzaHRhZyBpbiBhIHN0cmluZyBzZWNvbmQgI2hhc2h0YWdcIixcbiAqICAgICBcImZtdFwiOiBbXG4gKiAgICAgICAgIHsgXCJhdFwiOjgsIFwibGVuXCI6NCxcInRwXCI6XCJTVFwiIH0seyBcImF0XCI6MTQsIFwibGVuXCI6NCwgXCJ0cFwiOlwiQ09cIiB9LHsgXCJhdFwiOjIzLCBcImxlblwiOjYsIFwidHBcIjpcIkVNXCJ9LFxuICogICAgICAgICB7IFwiYXRcIjozMSwgXCJsZW5cIjo2LCBcInRwXCI6XCJETFwiIH0seyBcInRwXCI6XCJCUlwiLCBcImxlblwiOjEsIFwiYXRcIjozNyB9LHsgXCJhdFwiOjU2LCBcImxlblwiOjYsIFwidHBcIjpcIkVNXCIgfSxcbiAqICAgICAgICAgeyBcImF0XCI6NDcsIFwibGVuXCI6MTUsIFwidHBcIjpcIlNUXCIgfSx7IFwidHBcIjpcIkJSXCIsIFwibGVuXCI6MSwgXCJhdFwiOjYyIH0seyBcImF0XCI6MTIwLCBcImxlblwiOjEzLCBcInRwXCI6XCJFTVwiIH0sXG4gKiAgICAgICAgIHsgXCJhdFwiOjcxLCBcImxlblwiOjM2LCBcImtleVwiOjAgfSx7IFwiYXRcIjoxMjAsIFwibGVuXCI6MTMsIFwia2V5XCI6MSB9LHsgXCJ0cFwiOlwiQlJcIiwgXCJsZW5cIjoxLCBcImF0XCI6MTMzIH0sXG4gKiAgICAgICAgIHsgXCJhdFwiOjE0NCwgXCJsZW5cIjo4LCBcImtleVwiOjIgfSx7IFwiYXRcIjoxNTksIFwibGVuXCI6OCwgXCJrZXlcIjozIH0seyBcInRwXCI6XCJCUlwiLCBcImxlblwiOjEsIFwiYXRcIjoxNzkgfSxcbiAqICAgICAgICAgeyBcImF0XCI6MTg3LCBcImxlblwiOjgsIFwia2V5XCI6MyB9LHsgXCJ0cFwiOlwiQlJcIiwgXCJsZW5cIjoxLCBcImF0XCI6MTk1IH1cbiAqICAgICBdLFxuICogICAgIFwiZW50XCI6IFtcbiAqICAgICAgICAgeyBcInRwXCI6XCJMTlwiLCBcImRhdGFcIjp7IFwidXJsXCI6XCJodHRwczovL3d3dy5leGFtcGxlLmNvbS9hYmMjZnJhZ21lbnRcIiB9IH0sXG4gKiAgICAgICAgIHsgXCJ0cFwiOlwiTE5cIiwgXCJkYXRhXCI6eyBcInVybFwiOlwiaHR0cDovL3d3dy50aW5vZGUuY29cIiB9IH0sXG4gKiAgICAgICAgIHsgXCJ0cFwiOlwiTU5cIiwgXCJkYXRhXCI6eyBcInZhbFwiOlwibWVudGlvblwiIH0gfSxcbiAqICAgICAgICAgeyBcInRwXCI6XCJIVFwiLCBcImRhdGFcIjp7IFwidmFsXCI6XCJoYXNodGFnXCIgfSB9XG4gKiAgICAgXVxuICogIH1cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIE5PVEUgVE8gREVWRUxPUEVSUzpcbi8vIExvY2FsaXphYmxlIHN0cmluZ3Mgc2hvdWxkIGJlIGRvdWJsZSBxdW90ZWQgXCLRgdGC0YDQvtC60LAg0L3QsCDQtNGA0YPQs9C+0Lwg0Y/Qt9GL0LrQtVwiLFxuLy8gbm9uLWxvY2FsaXphYmxlIHN0cmluZ3Mgc2hvdWxkIGJlIHNpbmdsZSBxdW90ZWQgJ25vbi1sb2NhbGl6ZWQnLlxuXG5jb25zdCBNQVhfRk9STV9FTEVNRU5UUyA9IDg7XG5jb25zdCBNQVhfUFJFVklFV19BVFRBQ0hNRU5UUyA9IDM7XG5jb25zdCBNQVhfUFJFVklFV19EQVRBX1NJWkUgPSA2NDtcbmNvbnN0IEpTT05fTUlNRV9UWVBFID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuY29uc3QgRFJBRlRZX01JTUVfVFlQRSA9ICd0ZXh0L3gtZHJhZnR5JztcbmNvbnN0IEFMTE9XRURfRU5UX0ZJRUxEUyA9IFsnYWN0JywgJ2hlaWdodCcsICdtaW1lJywgJ25hbWUnLCAncmVmJywgJ3NpemUnLCAndXJsJywgJ3ZhbCcsICd3aWR0aCddO1xuXG4vLyBSZWd1bGFyIGV4cHJlc3Npb25zIGZvciBwYXJzaW5nIGlubGluZSBmb3JtYXRzLiBKYXZhc2NyaXB0IGRvZXMgbm90IHN1cHBvcnQgbG9va2JlaGluZCxcbi8vIHNvIGl0J3MgYSBiaXQgbWVzc3kuXG5jb25zdCBJTkxJTkVfU1RZTEVTID0gW1xuICAvLyBTdHJvbmcgPSBib2xkLCAqYm9sZCB0ZXh0KlxuICB7XG4gICAgbmFtZTogJ1NUJyxcbiAgICBzdGFydDogLyg/Ol58W1xcV19dKShcXCopW15cXHMqXS8sXG4gICAgZW5kOiAvW15cXHMqXShcXCopKD89JHxbXFxXX10pL1xuICB9LFxuICAvLyBFbXBoZXNpemVkID0gaXRhbGljLCBfaXRhbGljIHRleHRfXG4gIHtcbiAgICBuYW1lOiAnRU0nLFxuICAgIHN0YXJ0OiAvKD86XnxcXFcpKF8pW15cXHNfXS8sXG4gICAgZW5kOiAvW15cXHNfXShfKSg/PSR8XFxXKS9cbiAgfSxcbiAgLy8gRGVsZXRlZCwgfnN0cmlrZSB0aGlzIHRob3VnaH5cbiAge1xuICAgIG5hbWU6ICdETCcsXG4gICAgc3RhcnQ6IC8oPzpefFtcXFdfXSkofilbXlxcc35dLyxcbiAgICBlbmQ6IC9bXlxcc35dKH4pKD89JHxbXFxXX10pL1xuICB9LFxuICAvLyBDb2RlIGJsb2NrIGB0aGlzIGlzIG1vbm9zcGFjZWBcbiAge1xuICAgIG5hbWU6ICdDTycsXG4gICAgc3RhcnQ6IC8oPzpefFxcVykoYClbXmBdLyxcbiAgICBlbmQ6IC9bXmBdKGApKD89JHxcXFcpL1xuICB9XG5dO1xuXG4vLyBSZWxhdGl2ZSB3ZWlnaHRzIG9mIGZvcm1hdHRpbmcgc3BhbnMuIEdyZWF0ZXIgaW5kZXggaW4gYXJyYXkgbWVhbnMgZ3JlYXRlciB3ZWlnaHQuXG5jb25zdCBGTVRfV0VJR0hUID0gWydRUSddO1xuXG4vLyBSZWdFeHBzIGZvciBlbnRpdHkgZXh0cmFjdGlvbiAoUkYgPSByZWZlcmVuY2UpXG5jb25zdCBFTlRJVFlfVFlQRVMgPSBbXG4gIC8vIFVSTHNcbiAge1xuICAgIG5hbWU6ICdMTicsXG4gICAgZGF0YU5hbWU6ICd1cmwnLFxuICAgIHBhY2s6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgLy8gQ2hlY2sgaWYgdGhlIHByb3RvY29sIGlzIHNwZWNpZmllZCwgaWYgbm90IHVzZSBodHRwXG4gICAgICBpZiAoIS9eW2Etel0rOlxcL1xcLy9pLnRlc3QodmFsKSkge1xuICAgICAgICB2YWwgPSAnaHR0cDovLycgKyB2YWw7XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IHZhbFxuICAgICAgfTtcbiAgICB9LFxuICAgIHJlOiAvKD86KD86aHR0cHM/fGZ0cCk6XFwvXFwvfHd3d1xcLnxmdHBcXC4pWy1BLVowLTkrJkAjXFwvJT1+X3wkPyE6LC5dKltBLVowLTkrJkAjXFwvJT1+X3wkXS9pZ1xuICB9LFxuICAvLyBNZW50aW9ucyBAdXNlciAobXVzdCBiZSAyIG9yIG1vcmUgY2hhcmFjdGVycylcbiAge1xuICAgIG5hbWU6ICdNTicsXG4gICAgZGF0YU5hbWU6ICd2YWwnLFxuICAgIHBhY2s6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsOiB2YWwuc2xpY2UoMSlcbiAgICAgIH07XG4gICAgfSxcbiAgICByZTogL1xcQkAoW1xccHtMfVxccHtOfV1bLl9cXHB7TH1cXHB7Tn1dKltcXHB7TH1cXHB7Tn1dKS91Z1xuICB9LFxuICAvLyBIYXNodGFncyAjaGFzaHRhZywgbGlrZSBtZXRpb24gMiBvciBtb3JlIGNoYXJhY3RlcnMuXG4gIHtcbiAgICBuYW1lOiAnSFQnLFxuICAgIGRhdGFOYW1lOiAndmFsJyxcbiAgICBwYWNrOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbDogdmFsLnNsaWNlKDEpXG4gICAgICB9O1xuICAgIH0sXG4gICAgcmU6IC9cXEIjKFtcXHB7TH1cXHB7Tn1dWy5fXFxwe0x9XFxwe059XSpbXFxwe0x9XFxwe059XSkvdWdcbiAgfVxuXTtcblxuLy8gSFRNTCB0YWcgbmFtZSBzdWdnZXN0aW9uc1xuY29uc3QgSFRNTF9UQUdTID0ge1xuICBCTjoge1xuICAgIG5hbWU6ICdidXR0b24nLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgQlI6IHtcbiAgICBuYW1lOiAnYnInLFxuICAgIGlzVm9pZDogdHJ1ZVxuICB9LFxuICBDTzoge1xuICAgIG5hbWU6ICd0dCcsXG4gICAgaXNWb2lkOiBmYWxzZVxuICB9LFxuICBETDoge1xuICAgIG5hbWU6ICdkZWwnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgRU06IHtcbiAgICBuYW1lOiAnaScsXG4gICAgaXNWb2lkOiBmYWxzZVxuICB9LFxuICBFWDoge1xuICAgIG5hbWU6ICcnLFxuICAgIGlzVm9pZDogdHJ1ZVxuICB9LFxuICBGTToge1xuICAgIG5hbWU6ICdkaXYnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgSEQ6IHtcbiAgICBuYW1lOiAnJyxcbiAgICBpc1ZvaWQ6IGZhbHNlXG4gIH0sXG4gIEhMOiB7XG4gICAgbmFtZTogJ3NwYW4nLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgSFQ6IHtcbiAgICBuYW1lOiAnYScsXG4gICAgaXNWb2lkOiBmYWxzZVxuICB9LFxuICBJTToge1xuICAgIG5hbWU6ICdpbWcnLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbiAgTE46IHtcbiAgICBuYW1lOiAnYScsXG4gICAgaXNWb2lkOiBmYWxzZVxuICB9LFxuICBNTjoge1xuICAgIG5hbWU6ICdhJyxcbiAgICBpc1ZvaWQ6IGZhbHNlXG4gIH0sXG4gIFJXOiB7XG4gICAgbmFtZTogJ2RpdicsXG4gICAgaXNWb2lkOiBmYWxzZSxcbiAgfSxcbiAgUVE6IHtcbiAgICBuYW1lOiAnZGl2JyxcbiAgICBpc1ZvaWQ6IGZhbHNlXG4gIH0sXG4gIFNUOiB7XG4gICAgbmFtZTogJ2InLFxuICAgIGlzVm9pZDogZmFsc2VcbiAgfSxcbn07XG5cbi8vIENvbnZlcnQgYmFzZTY0LWVuY29kZWQgc3RyaW5nIGludG8gQmxvYi5cbmZ1bmN0aW9uIGJhc2U2NHRvT2JqZWN0VXJsKGI2NCwgY29udGVudFR5cGUsIGxvZ2dlcikge1xuICBpZiAoIWI2NCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBiaW4gPSBhdG9iKGI2NCk7XG4gICAgY29uc3QgbGVuZ3RoID0gYmluLmxlbmd0aDtcbiAgICBjb25zdCBidWYgPSBuZXcgQXJyYXlCdWZmZXIobGVuZ3RoKTtcbiAgICBjb25zdCBhcnIgPSBuZXcgVWludDhBcnJheShidWYpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGFycltpXSA9IGJpbi5jaGFyQ29kZUF0KGkpO1xuICAgIH1cblxuICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtidWZdLCB7XG4gICAgICB0eXBlOiBjb250ZW50VHlwZVxuICAgIH0pKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGxvZ2dlcikge1xuICAgICAgbG9nZ2VyKFwiRHJhZnR5OiBmYWlsZWQgdG8gY29udmVydCBvYmplY3QuXCIsIGVyci5tZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gYmFzZTY0dG9EYXRhVXJsKGI2NCwgY29udGVudFR5cGUpIHtcbiAgaWYgKCFiNjQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb250ZW50VHlwZSA9IGNvbnRlbnRUeXBlIHx8ICdpbWFnZS9qcGVnJztcbiAgcmV0dXJuICdkYXRhOicgKyBjb250ZW50VHlwZSArICc7YmFzZTY0LCcgKyBiNjQ7XG59XG5cbi8vIEhlbHBlcnMgZm9yIGNvbnZlcnRpbmcgRHJhZnR5IHRvIEhUTUwuXG5jb25zdCBERUNPUkFUT1JTID0ge1xuICAvLyBWaXNpYWwgc3R5bGVzXG4gIFNUOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzxiPic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzwvYj4nO1xuICAgIH1cbiAgfSxcbiAgRU06IHtcbiAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPGk+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPC9pPidcbiAgICB9XG4gIH0sXG4gIERMOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzxkZWw+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPC9kZWw+J1xuICAgIH1cbiAgfSxcbiAgQ086IHtcbiAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnPHR0Pic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJzwvdHQ+J1xuICAgIH1cbiAgfSxcbiAgLy8gTGluZSBicmVha1xuICBCUjoge1xuICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8YnIvPic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gIH0sXG4gIC8vIEhpZGRlbiBlbGVtZW50XG4gIEhEOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9LFxuICAvLyBIaWdobGlnaHRlZCBlbGVtZW50LlxuICBITDoge1xuICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8c3BhbiBzdHlsZT1cImNvbG9yOnRlYWxcIj4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICc8L3NwYW4+JztcbiAgICB9XG4gIH0sXG4gIC8vIExpbmsgKFVSTClcbiAgTE46IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzxhIGhyZWY9XCInICsgZGF0YS51cmwgKyAnXCI+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzwvYT4nO1xuICAgIH0sXG4gICAgcHJvcHM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiBkYXRhID8ge1xuICAgICAgICBocmVmOiBkYXRhLnVybCxcbiAgICAgICAgdGFyZ2V0OiAnX2JsYW5rJ1xuICAgICAgfSA6IG51bGw7XG4gICAgfSxcbiAgfSxcbiAgLy8gTWVudGlvblxuICBNTjoge1xuICAgIG9wZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPGEgaHJlZj1cIiMnICsgZGF0YS52YWwgKyAnXCI+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzwvYT4nO1xuICAgIH0sXG4gICAgcHJvcHM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiBkYXRhID8ge1xuICAgICAgICBpZDogZGF0YS52YWxcbiAgICAgIH0gOiBudWxsO1xuICAgIH0sXG4gIH0sXG4gIC8vIEhhc2h0YWdcbiAgSFQ6IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzxhIGhyZWY9XCIjJyArIGRhdGEudmFsICsgJ1wiPic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8L2E+JztcbiAgICB9LFxuICAgIHByb3BzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSA/IHtcbiAgICAgICAgaWQ6IGRhdGEudmFsXG4gICAgICB9IDogbnVsbDtcbiAgICB9LFxuICB9LFxuICAvLyBCdXR0b25cbiAgQk46IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzxidXR0b24+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzwvYnV0dG9uPic7XG4gICAgfSxcbiAgICBwcm9wczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIGRhdGEgPyB7XG4gICAgICAgICdkYXRhLWFjdCc6IGRhdGEuYWN0LFxuICAgICAgICAnZGF0YS12YWwnOiBkYXRhLnZhbCxcbiAgICAgICAgJ2RhdGEtbmFtZSc6IGRhdGEubmFtZSxcbiAgICAgICAgJ2RhdGEtcmVmJzogZGF0YS5yZWZcbiAgICAgIH0gOiBudWxsO1xuICAgIH0sXG4gIH0sXG4gIC8vIEltYWdlXG4gIElNOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gRG9uJ3QgdXNlIGRhdGEucmVmIGZvciBwcmV2aWV3OiBpdCdzIGEgc2VjdXJpdHkgcmlzay5cbiAgICAgIGNvbnN0IHRtcFByZXZpZXdVcmwgPSBiYXNlNjR0b0RhdGFVcmwoZGF0YS5fdGVtcFByZXZpZXcsIGRhdGEubWltZSk7XG4gICAgICBjb25zdCBwcmV2aWV3VXJsID0gYmFzZTY0dG9PYmplY3RVcmwoZGF0YS52YWwsIGRhdGEubWltZSwgRHJhZnR5LmxvZ2dlcik7XG4gICAgICBjb25zdCBkb3dubG9hZFVybCA9IGRhdGEucmVmIHx8IHByZXZpZXdVcmw7XG4gICAgICByZXR1cm4gKGRhdGEubmFtZSA/ICc8YSBocmVmPVwiJyArIGRvd25sb2FkVXJsICsgJ1wiIGRvd25sb2FkPVwiJyArIGRhdGEubmFtZSArICdcIj4nIDogJycpICtcbiAgICAgICAgJzxpbWcgc3JjPVwiJyArICh0bXBQcmV2aWV3VXJsIHx8IHByZXZpZXdVcmwpICsgJ1wiJyArXG4gICAgICAgIChkYXRhLndpZHRoID8gJyB3aWR0aD1cIicgKyBkYXRhLndpZHRoICsgJ1wiJyA6ICcnKSArXG4gICAgICAgIChkYXRhLmhlaWdodCA/ICcgaGVpZ2h0PVwiJyArIGRhdGEuaGVpZ2h0ICsgJ1wiJyA6ICcnKSArICcgYm9yZGVyPVwiMFwiIC8+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gKGRhdGEubmFtZSA/ICc8L2E+JyA6ICcnKTtcbiAgICB9LFxuICAgIHByb3BzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBpZiAoIWRhdGEpIHJldHVybiBudWxsO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gVGVtcG9yYXJ5IHByZXZpZXcsIG9yIHBlcm1hbmVudCBwcmV2aWV3LCBvciBleHRlcm5hbCBsaW5rLlxuICAgICAgICBzcmM6IGJhc2U2NHRvRGF0YVVybChkYXRhLl90ZW1wUHJldmlldywgZGF0YS5taW1lKSB8fFxuICAgICAgICAgIGRhdGEucmVmIHx8IGJhc2U2NHRvT2JqZWN0VXJsKGRhdGEudmFsLCBkYXRhLm1pbWUsIERyYWZ0eS5sb2dnZXIpLFxuICAgICAgICB0aXRsZTogZGF0YS5uYW1lLFxuICAgICAgICBhbHQ6IGRhdGEubmFtZSxcbiAgICAgICAgJ2RhdGEtd2lkdGgnOiBkYXRhLndpZHRoLFxuICAgICAgICAnZGF0YS1oZWlnaHQnOiBkYXRhLmhlaWdodCxcbiAgICAgICAgJ2RhdGEtbmFtZSc6IGRhdGEubmFtZSxcbiAgICAgICAgJ2RhdGEtc2l6ZSc6IGRhdGEudmFsID8gKChkYXRhLnZhbC5sZW5ndGggKiAwLjc1KSB8IDApIDogKGRhdGEuc2l6ZSB8IDApLFxuICAgICAgICAnZGF0YS1taW1lJzogZGF0YS5taW1lLFxuICAgICAgfTtcbiAgICB9LFxuICB9LFxuICAvLyBGb3JtIC0gc3RydWN0dXJlZCBsYXlvdXQgb2YgZWxlbWVudHMuXG4gIEZNOiB7XG4gICAgb3BlbjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8ZGl2Pic7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICc8L2Rpdj4nO1xuICAgIH1cbiAgfSxcbiAgLy8gUm93OiBsb2dpYyBncm91cGluZyBvZiBlbGVtZW50c1xuICBSVzoge1xuICAgIG9wZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPGRpdj4nO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAnPC9kaXY+JztcbiAgICB9XG4gIH0sXG4gIC8vIFF1b3RlZCBibG9jay5cbiAgUVE6IHtcbiAgICBvcGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzxkaXY+JztcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gJzwvZGl2Pic7XG4gICAgfSxcbiAgICBwcm9wczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgaWYgKCFkYXRhKSByZXR1cm4gbnVsbDtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9LFxuICB9XG59O1xuXG4vKipcbiAqIFRoZSBtYWluIG9iamVjdCB3aGljaCBwZXJmb3JtcyBhbGwgdGhlIGZvcm1hdHRpbmcgYWN0aW9ucy5cbiAqIEBjbGFzcyBEcmFmdHlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5jb25zdCBEcmFmdHkgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy50eHQgPSAnJztcbiAgdGhpcy5mbXQgPSBbXTtcbiAgdGhpcy5lbnQgPSBbXTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIERyYWZ0eSBkb2N1bWVudCB0byBhIHBsYWluIHRleHQgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwbGFpblRleHQgLSBzdHJpbmcgdG8gdXNlIGFzIERyYWZ0eSBjb250ZW50LlxuICpcbiAqIEByZXR1cm5zIG5ldyBEcmFmdHkgZG9jdW1lbnQgb3IgbnVsbCBpcyBwbGFpblRleHQgaXMgbm90IGEgc3RyaW5nIG9yIHVuZGVmaW5lZC5cbiAqL1xuRHJhZnR5LmluaXQgPSBmdW5jdGlvbihwbGFpblRleHQpIHtcbiAgaWYgKHR5cGVvZiBwbGFpblRleHQgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBwbGFpblRleHQgPSAnJztcbiAgfSBlbHNlIGlmICh0eXBlb2YgcGxhaW5UZXh0ICE9ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR4dDogcGxhaW5UZXh0XG4gIH07XG59XG5cbi8qKlxuICogUGFyc2UgcGxhaW4gdGV4dCBpbnRvIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gY29udGVudCAtIHBsYWluLXRleHQgY29udGVudCB0byBwYXJzZS5cbiAqIEByZXR1cm4ge0RyYWZ0eX0gcGFyc2VkIGRvY3VtZW50IG9yIG51bGwgaWYgdGhlIHNvdXJjZSBpcyBub3QgcGxhaW4gdGV4dC5cbiAqL1xuRHJhZnR5LnBhcnNlID0gZnVuY3Rpb24oY29udGVudCkge1xuICAvLyBNYWtlIHN1cmUgd2UgYXJlIHBhcnNpbmcgc3RyaW5ncyBvbmx5LlxuICBpZiAodHlwZW9mIGNvbnRlbnQgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFNwbGl0IHRleHQgaW50byBsaW5lcy4gSXQgbWFrZXMgZnVydGhlciBwcm9jZXNzaW5nIGVhc2llci5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgLy8gSG9sZHMgZW50aXRpZXMgcmVmZXJlbmNlZCBmcm9tIHRleHRcbiAgY29uc3QgZW50aXR5TWFwID0gW107XG4gIGNvbnN0IGVudGl0eUluZGV4ID0ge307XG5cbiAgLy8gUHJvY2Vzc2luZyBsaW5lcyBvbmUgYnkgb25lLCBob2xkIGludGVybWVkaWF0ZSByZXN1bHQgaW4gYmx4LlxuICBjb25zdCBibHggPSBbXTtcbiAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgIGxldCBzcGFucyA9IFtdO1xuICAgIGxldCBlbnRpdGllcztcblxuICAgIC8vIEZpbmQgZm9ybWF0dGVkIHNwYW5zIGluIHRoZSBzdHJpbmcuXG4gICAgLy8gVHJ5IHRvIG1hdGNoIGVhY2ggc3R5bGUuXG4gICAgSU5MSU5FX1NUWUxFUy5mb3JFYWNoKCh0YWcpID0+IHtcbiAgICAgIC8vIEVhY2ggc3R5bGUgY291bGQgYmUgbWF0Y2hlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICAgIHNwYW5zID0gc3BhbnMuY29uY2F0KHNwYW5uaWZ5KGxpbmUsIHRhZy5zdGFydCwgdGFnLmVuZCwgdGFnLm5hbWUpKTtcbiAgICB9KTtcblxuICAgIGxldCBibG9jaztcbiAgICBpZiAoc3BhbnMubGVuZ3RoID09IDApIHtcbiAgICAgIGJsb2NrID0ge1xuICAgICAgICB0eHQ6IGxpbmVcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNvcnQgc3BhbnMgYnkgc3R5bGUgb2NjdXJlbmNlIGVhcmx5IC0+IGxhdGUsIHRoZW4gYnkgbGVuZ3RoOiBmaXJzdCBsb25nIHRoZW4gc2hvcnQuXG4gICAgICBzcGFucy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIGNvbnN0IGRpZmYgPSBhLmF0IC0gYi5hdDtcbiAgICAgICAgcmV0dXJuIGRpZmYgIT0gMCA/IGRpZmYgOiBiLmVuZCAtIGEuZW5kO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIENvbnZlcnQgYW4gYXJyYXkgb2YgcG9zc2libHkgb3ZlcmxhcHBpbmcgc3BhbnMgaW50byBhIHRyZWUuXG4gICAgICBzcGFucyA9IHRvU3BhblRyZWUoc3BhbnMpO1xuXG4gICAgICAvLyBCdWlsZCBhIHRyZWUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGVudGlyZSBzdHJpbmcsIG5vdFxuICAgICAgLy8ganVzdCB0aGUgZm9ybWF0dGVkIHBhcnRzLlxuICAgICAgY29uc3QgY2h1bmtzID0gY2h1bmtpZnkobGluZSwgMCwgbGluZS5sZW5ndGgsIHNwYW5zKTtcblxuICAgICAgY29uc3QgZHJhZnR5ID0gZHJhZnRpZnkoY2h1bmtzLCAwKTtcblxuICAgICAgYmxvY2sgPSB7XG4gICAgICAgIHR4dDogZHJhZnR5LnR4dCxcbiAgICAgICAgZm10OiBkcmFmdHkuZm10XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEV4dHJhY3QgZW50aXRpZXMgZnJvbSB0aGUgY2xlYW5lZCB1cCBzdHJpbmcuXG4gICAgZW50aXRpZXMgPSBleHRyYWN0RW50aXRpZXMoYmxvY2sudHh0KTtcbiAgICBpZiAoZW50aXRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcmFuZ2VzID0gW107XG4gICAgICBmb3IgKGxldCBpIGluIGVudGl0aWVzKSB7XG4gICAgICAgIC8vIHtvZmZzZXQ6IG1hdGNoWydpbmRleCddLCB1bmlxdWU6IG1hdGNoWzBdLCBsZW46IG1hdGNoWzBdLmxlbmd0aCwgZGF0YTogZW50LnBhY2tlcigpLCB0eXBlOiBlbnQubmFtZX1cbiAgICAgICAgY29uc3QgZW50aXR5ID0gZW50aXRpZXNbaV07XG4gICAgICAgIGxldCBpbmRleCA9IGVudGl0eUluZGV4W2VudGl0eS51bmlxdWVdO1xuICAgICAgICBpZiAoIWluZGV4KSB7XG4gICAgICAgICAgaW5kZXggPSBlbnRpdHlNYXAubGVuZ3RoO1xuICAgICAgICAgIGVudGl0eUluZGV4W2VudGl0eS51bmlxdWVdID0gaW5kZXg7XG4gICAgICAgICAgZW50aXR5TWFwLnB1c2goe1xuICAgICAgICAgICAgdHA6IGVudGl0eS50eXBlLFxuICAgICAgICAgICAgZGF0YTogZW50aXR5LmRhdGFcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByYW5nZXMucHVzaCh7XG4gICAgICAgICAgYXQ6IGVudGl0eS5vZmZzZXQsXG4gICAgICAgICAgbGVuOiBlbnRpdHkubGVuLFxuICAgICAgICAgIGtleTogaW5kZXhcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBibG9jay5lbnQgPSByYW5nZXM7XG4gICAgfVxuXG4gICAgYmx4LnB1c2goYmxvY2spO1xuICB9KTtcblxuICBjb25zdCByZXN1bHQgPSB7XG4gICAgdHh0OiAnJ1xuICB9O1xuXG4gIC8vIE1lcmdlIGxpbmVzIGFuZCBzYXZlIGxpbmUgYnJlYWtzIGFzIEJSIGlubGluZSBmb3JtYXR0aW5nLlxuICBpZiAoYmx4Lmxlbmd0aCA+IDApIHtcbiAgICByZXN1bHQudHh0ID0gYmx4WzBdLnR4dDtcbiAgICByZXN1bHQuZm10ID0gKGJseFswXS5mbXQgfHwgW10pLmNvbmNhdChibHhbMF0uZW50IHx8IFtdKTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYmx4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBibG9jayA9IGJseFtpXTtcbiAgICAgIGNvbnN0IG9mZnNldCA9IHJlc3VsdC50eHQubGVuZ3RoICsgMTtcblxuICAgICAgcmVzdWx0LmZtdC5wdXNoKHtcbiAgICAgICAgdHA6ICdCUicsXG4gICAgICAgIGxlbjogMSxcbiAgICAgICAgYXQ6IG9mZnNldCAtIDFcbiAgICAgIH0pO1xuXG4gICAgICByZXN1bHQudHh0ICs9ICcgJyArIGJsb2NrLnR4dDtcbiAgICAgIGlmIChibG9jay5mbXQpIHtcbiAgICAgICAgcmVzdWx0LmZtdCA9IHJlc3VsdC5mbXQuY29uY2F0KGJsb2NrLmZtdC5tYXAoKHMpID0+IHtcbiAgICAgICAgICBzLmF0ICs9IG9mZnNldDtcbiAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgaWYgKGJsb2NrLmVudCkge1xuICAgICAgICByZXN1bHQuZm10ID0gcmVzdWx0LmZtdC5jb25jYXQoYmxvY2suZW50Lm1hcCgocykgPT4ge1xuICAgICAgICAgIHMuYXQgKz0gb2Zmc2V0O1xuICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC5mbXQubGVuZ3RoID09IDApIHtcbiAgICAgIGRlbGV0ZSByZXN1bHQuZm10O1xuICAgIH1cblxuICAgIGlmIChlbnRpdHlNYXAubGVuZ3RoID4gMCkge1xuICAgICAgcmVzdWx0LmVudCA9IGVudGl0eU1hcDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBBcHBlbmQgb25lIERyYWZ0eSBkb2N1bWVudCB0byBhbm90aGVyLlxuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBmaXJzdCAtIERyYWZ0eSBkb2N1bWVudCB0byBhcHBlbmQgdG8uXG4gKiBAcGFyYW0ge0RyYWZ0eXxzdHJpbmd9IHNlY29uZCAtIERyYWZ0eSBkb2N1bWVudCBvciBzdHJpbmcgYmVpbmcgYXBwZW5kZWQuXG4gKlxuICogQHJldHVybiB7RHJhZnR5fSBmaXJzdCBkb2N1bWVudCB3aXRoIHRoZSBzZWNvbmQgYXBwZW5kZWQgdG8gaXQuXG4gKi9cbkRyYWZ0eS5hcHBlbmQgPSBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XG4gIGlmICghZmlyc3QpIHtcbiAgICByZXR1cm4gc2Vjb25kO1xuICB9XG4gIGlmICghc2Vjb25kKSB7XG4gICAgcmV0dXJuIGZpcnN0O1xuICB9XG5cbiAgZmlyc3QudHh0ID0gZmlyc3QudHh0IHx8ICcnO1xuICBjb25zdCBsZW4gPSBmaXJzdC50eHQubGVuZ3RoO1xuXG4gIGlmICh0eXBlb2Ygc2Vjb25kID09ICdzdHJpbmcnKSB7XG4gICAgZmlyc3QudHh0ICs9IHNlY29uZDtcbiAgfSBlbHNlIGlmIChzZWNvbmQudHh0KSB7XG4gICAgZmlyc3QudHh0ICs9IHNlY29uZC50eHQ7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzZWNvbmQuZm10KSkge1xuICAgIGZpcnN0LmZtdCA9IGZpcnN0LmZtdCB8fCBbXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShzZWNvbmQuZW50KSkge1xuICAgICAgZmlyc3QuZW50ID0gZmlyc3QuZW50IHx8IFtdO1xuICAgIH1cbiAgICBzZWNvbmQuZm10LmZvckVhY2goc3JjID0+IHtcbiAgICAgIGNvbnN0IGZtdCA9IHtcbiAgICAgICAgYXQ6IChzcmMuYXQgfCAwKSArIGxlbixcbiAgICAgICAgbGVuOiBzcmMubGVuIHwgMFxuICAgICAgfTtcbiAgICAgIC8vIFNwZWNpYWwgY2FzZSBmb3IgdGhlIG91dHNpZGUgb2YgdGhlIG5vcm1hbCByZW5kZXJpbmcgZmxvdyBzdHlsZXMuXG4gICAgICBpZiAoc3JjLmF0ID09IC0xKSB7XG4gICAgICAgIGZtdC5hdCA9IC0xO1xuICAgICAgICBmbXQubGVuID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChzcmMudHApIHtcbiAgICAgICAgZm10LnRwID0gc3JjLnRwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm10LmtleSA9IGZpcnN0LmVudC5sZW5ndGg7XG4gICAgICAgIGZpcnN0LmVudC5wdXNoKHNlY29uZC5lbnRbc3JjLmtleSB8fCAwXSk7XG4gICAgICB9XG4gICAgICBmaXJzdC5mbXQucHVzaChmbXQpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGZpcnN0O1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIERyYWZ0eS5JbWFnZURlc2NcbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEB0eXBlIE9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IG1pbWUgLSBtaW1lLXR5cGUgb2YgdGhlIGltYWdlLCBlLmcuIFwiaW1hZ2UvcG5nXCJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmV2aWV3IC0gYmFzZTY0LWVuY29kZWQgaW1hZ2UgY29udGVudCAob3IgcHJldmlldywgaWYgbGFyZ2UgaW1hZ2UgaXMgYXR0YWNoZWQpLiBDb3VsZCBiZSBudWxsL3VuZGVmaW5lZC5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gd2lkdGggLSB3aWR0aCBvZiB0aGUgaW1hZ2VcbiAqIEBwYXJhbSB7aW50ZWdlcn0gaGVpZ2h0IC0gaGVpZ2h0IG9mIHRoZSBpbWFnZVxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gZmlsZSBuYW1lIHN1Z2dlc3Rpb24gZm9yIGRvd25sb2FkaW5nIHRoZSBpbWFnZS5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gc2l6ZSAtIHNpemUgb2YgdGhlIGltYWdlIGluIGJ5dGVzLiBUcmVhdCBpcyBhcyBhbiB1bnRydXN0ZWQgaGludC5cbiAqIEBwYXJhbSB7c3RyaW5nfSByZWZ1cmwgLSByZWZlcmVuY2UgdG8gdGhlIGNvbnRlbnQuIENvdWxkIGJlIG51bGwvdW5kZWZpbmVkLlxuICogQHBhcmFtIHtzdHJpbmd9IF90ZW1wUHJldmlldyAtIGJhc2U2NC1lbmNvZGVkIGltYWdlIHByZXZpZXcgdXNlZCBkdXJpbmcgdXBsb2FkIHByb2Nlc3M7IG5vdCBzZXJpYWxpemFibGUuXG4gKiBAcGFyYW0ge1Byb21pc2V9IHVybFByb21pc2UgLSBQcm9taXNlIHdoaWNoIHJldHVybnMgY29udGVudCBVUkwgd2hlbiByZXNvbHZlZC5cbiAqL1xuXG4vKipcbiAqIEluc2VydCBpbmxpbmUgaW1hZ2UgaW50byBEcmFmdHkgZG9jdW1lbnQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBkb2N1bWVudCB0byBhZGQgaW1hZ2UgdG8uXG4gKiBAcGFyYW0ge2ludGVnZXJ9IGF0IC0gaW5kZXggd2hlcmUgdGhlIG9iamVjdCBpcyBpbnNlcnRlZC4gVGhlIGxlbmd0aCBvZiB0aGUgaW1hZ2UgaXMgYWx3YXlzIDEuXG4gKiBAcGFyYW0ge0ltYWdlRGVzY30gaW1hZ2VEZXNjIC0gb2JqZWN0IHdpdGggaW1hZ2UgcGFyYW1lbmV0cyBhbmQgZGF0YS5cbiAqXG4gKiBAcmV0dXJuIHtEcmFmdHl9IHVwZGF0ZWQgZG9jdW1lbnQuXG4gKi9cbkRyYWZ0eS5pbnNlcnRJbWFnZSA9IGZ1bmN0aW9uKGNvbnRlbnQsIGF0LCBpbWFnZURlc2MpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogJyAnXG4gIH07XG4gIGNvbnRlbnQuZW50ID0gY29udGVudC5lbnQgfHwgW107XG4gIGNvbnRlbnQuZm10ID0gY29udGVudC5mbXQgfHwgW107XG5cbiAgY29udGVudC5mbXQucHVzaCh7XG4gICAgYXQ6IGF0IHwgMCxcbiAgICBsZW46IDEsXG4gICAga2V5OiBjb250ZW50LmVudC5sZW5ndGhcbiAgfSk7XG5cbiAgY29uc3QgZXggPSB7XG4gICAgdHA6ICdJTScsXG4gICAgZGF0YToge1xuICAgICAgbWltZTogaW1hZ2VEZXNjLm1pbWUsXG4gICAgICB2YWw6IGltYWdlRGVzYy5wcmV2aWV3LFxuICAgICAgd2lkdGg6IGltYWdlRGVzYy53aWR0aCxcbiAgICAgIGhlaWdodDogaW1hZ2VEZXNjLmhlaWdodCxcbiAgICAgIG5hbWU6IGltYWdlRGVzYy5maWxlbmFtZSxcbiAgICAgIHNpemU6IGltYWdlRGVzYy5zaXplIHwgMCxcbiAgICAgIHJlZjogaW1hZ2VEZXNjLnJlZnVybFxuICAgIH1cbiAgfTtcblxuICBpZiAoaW1hZ2VEZXNjLnVybFByb21pc2UpIHtcbiAgICBleC5kYXRhLl90ZW1wUHJldmlldyA9IGltYWdlRGVzYy5fdGVtcFByZXZpZXc7XG4gICAgZXguZGF0YS5fcHJvY2Vzc2luZyA9IHRydWU7XG4gICAgaW1hZ2VEZXNjLnVybFByb21pc2UudGhlbihcbiAgICAgICh1cmwpID0+IHtcbiAgICAgICAgZXguZGF0YS5yZWYgPSB1cmw7XG4gICAgICAgIGV4LmRhdGEuX3RlbXBQcmV2aWV3ID0gdW5kZWZpbmVkO1xuICAgICAgICBleC5kYXRhLl9wcm9jZXNzaW5nID0gdW5kZWZpbmVkO1xuICAgICAgfSxcbiAgICAgIChlcnIpID0+IHtcbiAgICAgICAgLyogY2F0Y2ggdGhlIGVycm9yLCBvdGhlcndpc2UgaXQgd2lsbCBhcHBlYXIgaW4gdGhlIGNvbnNvbGUuICovXG4gICAgICAgIGV4LmRhdGEuX3Byb2Nlc3NpbmcgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGNvbnRlbnQuZW50LnB1c2goZXgpO1xuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIHF1b3RlIHRvIERyYWZ0eSBkb2N1bWVudC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaGVhZGVyIC0gUXVvdGUgaGVhZGVyICh0aXRsZSwgZXRjLikuXG4gKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gVUlEIG9mIHRoZSBhdXRob3IgdG8gbWVudGlvbi5cbiAqIEBwYXJhbSB7RHJhZnR5fSBib2R5IC0gQm9keSBvZiB0aGUgcXVvdGVkIG1lc3NhZ2UuXG4gKlxuICogQHJldHVybnMgUmVwbHkgcXVvdGUgRHJhZnR5IGRvYyB3aXRoIHRoZSBxdW90ZSBmb3JtYXR0aW5nLlxuICovXG5EcmFmdHkucXVvdGUgPSBmdW5jdGlvbihoZWFkZXIsIHVpZCwgYm9keSkge1xuICBjb25zdCBxdW90ZSA9IERyYWZ0eS5hcHBlbmQoRHJhZnR5LmFwcGVuZExpbmVCcmVhayhEcmFmdHkubWVudGlvbihoZWFkZXIsIHVpZCkpLCBib2R5KTtcblxuICAvLyBXcmFwIGludG8gYSBxdW90ZS5cbiAgcXVvdGUuZm10LnB1c2goe1xuICAgIGF0OiAwLFxuICAgIGxlbjogcXVvdGUudHh0Lmxlbmd0aCxcbiAgICB0cDogJ1FRJ1xuICB9KTtcblxuICByZXR1cm4gcXVvdGU7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgRHJhZnR5IGRvY3VtZW50IHdpdGggYSBtZW50aW9uLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbWVudGlvbmVkIG5hbWUuXG4gKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gbWVudGlvbmVkIHVzZXIgSUQuXG4gKlxuICogQHJldHVybnMge0RyYWZ0eX0gZG9jdW1lbnQgd2l0aCB0aGUgbWVudGlvbi5cbiAqL1xuRHJhZnR5Lm1lbnRpb24gPSBmdW5jdGlvbihuYW1lLCB1aWQpIHtcbiAgcmV0dXJuIHtcbiAgICB0eHQ6IG5hbWUgfHwgJycsXG4gICAgZm10OiBbe1xuICAgICAgYXQ6IDAsXG4gICAgICBsZW46IChuYW1lIHx8ICcnKS5sZW5ndGgsXG4gICAgICBrZXk6IDBcbiAgICB9XSxcbiAgICBlbnQ6IFt7XG4gICAgICB0cDogJ01OJyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgdmFsOiB1aWRcbiAgICAgIH1cbiAgICB9XVxuICB9O1xufVxuXG4vKipcbiAqIEFwcGVuZCBhIGxpbmsgdG8gYSBEcmFmdHkgZG9jdW1lbnQuXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBEcmFmdHkgZG9jdW1lbnQgdG8gYXBwZW5kIGxpbmsgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gbGlua0RhdGEgLSBMaW5rIGluZm8gaW4gZm9ybWF0IDxjb2RlPnt0eHQ6ICdhbmtvciB0ZXh0JywgdXJsOiAnaHR0cDovLy4uLid9PC9jb2RlPi5cbiAqXG4gKiBAcmV0dXJucyB7RHJhZnR5fSB0aGUgc2FtZSBkb2N1bWVudCBhcyA8Y29kZT5jb250ZW50PC9jb2RlPi5cbiAqL1xuRHJhZnR5LmFwcGVuZExpbmsgPSBmdW5jdGlvbihjb250ZW50LCBsaW5rRGF0YSkge1xuICBjb250ZW50ID0gY29udGVudCB8fCB7XG4gICAgdHh0OiAnJ1xuICB9O1xuXG4gIGNvbnRlbnQuZW50ID0gY29udGVudC5lbnQgfHwgW107XG4gIGNvbnRlbnQuZm10ID0gY29udGVudC5mbXQgfHwgW107XG5cbiAgY29udGVudC5mbXQucHVzaCh7XG4gICAgYXQ6IGNvbnRlbnQudHh0Lmxlbmd0aCxcbiAgICBsZW46IGxpbmtEYXRhLnR4dC5sZW5ndGgsXG4gICAga2V5OiBjb250ZW50LmVudC5sZW5ndGhcbiAgfSk7XG4gIGNvbnRlbnQudHh0ICs9IGxpbmtEYXRhLnR4dDtcblxuICBjb25zdCBleCA9IHtcbiAgICB0cDogJ0xOJyxcbiAgICBkYXRhOiB7XG4gICAgICB1cmw6IGxpbmtEYXRhLnVybFxuICAgIH1cbiAgfVxuICBjb250ZW50LmVudC5wdXNoKGV4KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBBcHBlbmQgaW5saW5lIGltYWdlIHRvIERyYWZ0eSBkb2N1bWVudC5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGRvY3VtZW50IHRvIGFkZCBpbWFnZSB0by5cbiAqIEBwYXJhbSB7SW1hZ2VEZXNjfSBpbWFnZURlc2MgLSBvYmplY3Qgd2l0aCBpbWFnZSBwYXJhbWVuZXRzLlxuICpcbiAqIEByZXR1cm4ge0RyYWZ0eX0gdXBkYXRlZCBkb2N1bWVudC5cbiAqL1xuRHJhZnR5LmFwcGVuZEltYWdlID0gZnVuY3Rpb24oY29udGVudCwgaW1hZ2VEZXNjKSB7XG4gIGNvbnRlbnQgPSBjb250ZW50IHx8IHtcbiAgICB0eHQ6ICcnXG4gIH07XG4gIGNvbnRlbnQudHh0ICs9ICcgJztcbiAgcmV0dXJuIERyYWZ0eS5pbnNlcnRJbWFnZShjb250ZW50LCBjb250ZW50LnR4dC5sZW5ndGggLSAxLCBpbWFnZURlc2MpO1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIERyYWZ0eS5BdHRhY2htZW50RGVzY1xuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHR5cGUgT2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gbWltZSAtIG1pbWUtdHlwZSBvZiB0aGUgaW1hZ2UsIGUuZy4gXCJpbWFnZS9wbmdcIlxuICogQHBhcmFtIHtzdHJpbmd9IGRhdGEgLSBiYXNlNjQtZW5jb2RlZCBpbi1iYW5kIGNvbnRlbnQgb2Ygc21hbGwgYXR0YWNobWVudHMuIENvdWxkIGJlIG51bGwvdW5kZWZpbmVkLlxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gZmlsZSBuYW1lIHN1Z2dlc3Rpb24gZm9yIGRvd25sb2FkaW5nIHRoZSBhdHRhY2htZW50LlxuICogQHBhcmFtIHtpbnRlZ2VyfSBzaXplIC0gc2l6ZSBvZiB0aGUgZmlsZSBpbiBieXRlcy4gVHJlYXQgaXMgYXMgYW4gdW50cnVzdGVkIGhpbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVmdXJsIC0gcmVmZXJlbmNlIHRvIHRoZSBvdXQtb2YtYmFuZCBjb250ZW50LiBDb3VsZCBiZSBudWxsL3VuZGVmaW5lZC5cbiAqIEBwYXJhbSB7UHJvbWlzZX0gdXJsUHJvbWlzZSAtIFByb21pc2Ugd2hpY2ggcmV0dXJucyBjb250ZW50IFVSTCB3aGVuIHJlc29sdmVkLlxuICovXG5cbi8qKlxuICogQXR0YWNoIGZpbGUgdG8gRHJhZnR5IGNvbnRlbnQuIEVpdGhlciBhcyBhIGJsb2Igb3IgYXMgYSByZWZlcmVuY2UuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBkb2N1bWVudCB0byBhdHRhY2ggZmlsZSB0by5cbiAqIEBwYXJhbSB7QXR0YWNobWVudERlc2N9IG9iamVjdCAtIGNvbnRhaW5pbmcgYXR0YWNobWVudCBkZXNjcmlwdGlvbiBhbmQgZGF0YS5cbiAqXG4gKiBAcmV0dXJuIHtEcmFmdHl9IHVwZGF0ZWQgZG9jdW1lbnQuXG4gKi9cbkRyYWZ0eS5hdHRhY2hGaWxlID0gZnVuY3Rpb24oY29udGVudCwgYXR0YWNobWVudERlc2MpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogJydcbiAgfTtcblxuICBjb250ZW50LmVudCA9IGNvbnRlbnQuZW50IHx8IFtdO1xuICBjb250ZW50LmZtdCA9IGNvbnRlbnQuZm10IHx8IFtdO1xuXG4gIGNvbnRlbnQuZm10LnB1c2goe1xuICAgIGF0OiAtMSxcbiAgICBsZW46IDAsXG4gICAga2V5OiBjb250ZW50LmVudC5sZW5ndGhcbiAgfSk7XG5cbiAgY29uc3QgZXggPSB7XG4gICAgdHA6ICdFWCcsXG4gICAgZGF0YToge1xuICAgICAgbWltZTogYXR0YWNobWVudERlc2MubWltZSxcbiAgICAgIHZhbDogYXR0YWNobWVudERlc2MuZGF0YSxcbiAgICAgIG5hbWU6IGF0dGFjaG1lbnREZXNjLmZpbGVuYW1lLFxuICAgICAgcmVmOiBhdHRhY2htZW50RGVzYy5yZWZ1cmwsXG4gICAgICBzaXplOiBhdHRhY2htZW50RGVzYy5zaXplIHwgMFxuICAgIH1cbiAgfVxuICBpZiAoYXR0YWNobWVudERlc2MudXJsUHJvbWlzZSkge1xuICAgIGV4LmRhdGEuX3Byb2Nlc3NpbmcgPSB0cnVlO1xuICAgIGF0dGFjaG1lbnREZXNjLnVybFByb21pc2UudGhlbihcbiAgICAgICh1cmwpID0+IHtcbiAgICAgICAgZXguZGF0YS5yZWYgPSB1cmw7XG4gICAgICAgIGV4LmRhdGEuX3Byb2Nlc3NpbmcgPSB1bmRlZmluZWQ7XG4gICAgICB9LFxuICAgICAgKGVycikgPT4ge1xuICAgICAgICAvKiBjYXRjaCB0aGUgZXJyb3IsIG90aGVyd2lzZSBpdCB3aWxsIGFwcGVhciBpbiB0aGUgY29uc29sZS4gKi9cbiAgICAgICAgZXguZGF0YS5fcHJvY2Vzc2luZyA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICApO1xuICB9XG4gIGNvbnRlbnQuZW50LnB1c2goZXgpO1xuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIFdyYXBzIGRyYWZ0eSBkb2N1bWVudCBpbnRvIGEgc2ltcGxlIGZvcm1hdHRpbmcgc3R5bGUuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl8c3RyaW5nfSBjb250ZW50IC0gZG9jdW1lbnQgb3Igc3RyaW5nIHRvIHdyYXAgaW50byBhIHN0eWxlLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0eWxlIC0gdHdvLWxldHRlciBzdHlsZSB0byB3cmFwIGludG8uXG4gKiBAcGFyYW0ge251bWJlcn0gYXQgLSBpbmRleCB3aGVyZSB0aGUgc3R5bGUgc3RhcnRzLCBkZWZhdWx0IDAuXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuIC0gbGVuZ3RoIG9mIHRoZSBmb3JtIGNvbnRlbnQsIGRlZmF1bHQgYWxsIG9mIGl0LlxuICpcbiAqIEByZXR1cm4ge0RyYWZ0eX0gdXBkYXRlZCBkb2N1bWVudC5cbiAqL1xuRHJhZnR5LndyYXBJbnRvID0gZnVuY3Rpb24oY29udGVudCwgc3R5bGUsIGF0LCBsZW4pIHtcbiAgaWYgKHR5cGVvZiBjb250ZW50ID09ICdzdHJpbmcnKSB7XG4gICAgY29udGVudCA9IHtcbiAgICAgIHR4dDogY29udGVudFxuICAgIH07XG4gIH1cbiAgY29udGVudC5mbXQgPSBjb250ZW50LmZtdCB8fCBbXTtcblxuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogYXQgfHwgMCxcbiAgICBsZW46IGxlbiB8fCBjb250ZW50LnR4dC5sZW5ndGgsXG4gICAgdHA6IHN0eWxlLFxuICB9KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBXcmFwcyBjb250ZW50IGludG8gYW4gaW50ZXJhY3RpdmUgZm9ybS5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eXxzdHJpbmd9IGNvbnRlbnQgLSB0byB3cmFwIGludG8gYSBmb3JtLlxuICogQHBhcmFtIHtudW1iZXJ9IGF0IC0gaW5kZXggd2hlcmUgdGhlIGZvcm1zIHN0YXJ0cy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gLSBsZW5ndGggb2YgdGhlIGZvcm0gY29udGVudC5cbiAqXG4gKiBAcmV0dXJuIHtEcmFmdHl9IHVwZGF0ZWQgZG9jdW1lbnQuXG4gKi9cbkRyYWZ0eS53cmFwQXNGb3JtID0gZnVuY3Rpb24oY29udGVudCwgYXQsIGxlbikge1xuICByZXR1cm4gRHJhZnR5LndyYXBJbnRvKGNvbnRlbnQsICdGTScsIGF0LCBsZW4pO1xufVxuXG4vKipcbiAqIEluc2VydCBjbGlja2FibGUgYnV0dG9uIGludG8gRHJhZnR5IGRvY3VtZW50LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fHN0cmluZ30gY29udGVudCAtIERyYWZ0eSBkb2N1bWVudCB0byBpbnNlcnQgYnV0dG9uIHRvIG9yIGEgc3RyaW5nIHRvIGJlIHVzZWQgYXMgYnV0dG9uIHRleHQuXG4gKiBAcGFyYW0ge251bWJlcn0gYXQgLSBsb2NhdGlvbiB3aGVyZSB0aGUgYnV0dG9uIGlzIGluc2VydGVkLlxuICogQHBhcmFtIHtudW1iZXJ9IGxlbiAtIHRoZSBsZW5ndGggb2YgdGhlIHRleHQgdG8gYmUgdXNlZCBhcyBidXR0b24gdGl0bGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIHRoZSBidXR0b24uIENsaWVudCBzaG91bGQgcmV0dXJuIGl0IHRvIHRoZSBzZXJ2ZXIgd2hlbiB0aGUgYnV0dG9uIGlzIGNsaWNrZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gYWN0aW9uVHlwZSAtIHRoZSB0eXBlIG9mIHRoZSBidXR0b24sIG9uZSBvZiAndXJsJyBvciAncHViJy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb25WYWx1ZSAtIHRoZSB2YWx1ZSB0byByZXR1cm4gb24gY2xpY2s6XG4gKiBAcGFyYW0ge3N0cmluZ30gcmVmVXJsIC0gdGhlIFVSTCB0byBnbyB0byB3aGVuIHRoZSAndXJsJyBidXR0b24gaXMgY2xpY2tlZC5cbiAqXG4gKiBAcmV0dXJuIHtEcmFmdHl9IHVwZGF0ZWQgZG9jdW1lbnQuXG4gKi9cbkRyYWZ0eS5pbnNlcnRCdXR0b24gPSBmdW5jdGlvbihjb250ZW50LCBhdCwgbGVuLCBuYW1lLCBhY3Rpb25UeXBlLCBhY3Rpb25WYWx1ZSwgcmVmVXJsKSB7XG4gIGlmICh0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJykge1xuICAgIGNvbnRlbnQgPSB7XG4gICAgICB0eHQ6IGNvbnRlbnRcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFjb250ZW50IHx8ICFjb250ZW50LnR4dCB8fCBjb250ZW50LnR4dC5sZW5ndGggPCBhdCArIGxlbikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGxlbiA8PSAwIHx8IFsndXJsJywgJ3B1YiddLmluZGV4T2YoYWN0aW9uVHlwZSkgPT0gLTEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvLyBFbnN1cmUgcmVmVXJsIGlzIGEgc3RyaW5nLlxuICBpZiAoYWN0aW9uVHlwZSA9PSAndXJsJyAmJiAhcmVmVXJsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmVmVXJsID0gJycgKyByZWZVcmw7XG5cbiAgY29udGVudC5lbnQgPSBjb250ZW50LmVudCB8fCBbXTtcbiAgY29udGVudC5mbXQgPSBjb250ZW50LmZtdCB8fCBbXTtcblxuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogYXQgfCAwLFxuICAgIGxlbjogbGVuLFxuICAgIGtleTogY29udGVudC5lbnQubGVuZ3RoXG4gIH0pO1xuICBjb250ZW50LmVudC5wdXNoKHtcbiAgICB0cDogJ0JOJyxcbiAgICBkYXRhOiB7XG4gICAgICBhY3Q6IGFjdGlvblR5cGUsXG4gICAgICB2YWw6IGFjdGlvblZhbHVlLFxuICAgICAgcmVmOiByZWZVcmwsXG4gICAgICBuYW1lOiBuYW1lXG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBBcHBlbmQgY2xpY2thYmxlIGJ1dHRvbiB0byBEcmFmdHkgZG9jdW1lbnQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl8c3RyaW5nfSBjb250ZW50IC0gRHJhZnR5IGRvY3VtZW50IHRvIGluc2VydCBidXR0b24gdG8gb3IgYSBzdHJpbmcgdG8gYmUgdXNlZCBhcyBidXR0b24gdGV4dC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0aXRsZSAtIHRoZSB0ZXh0IHRvIGJlIHVzZWQgYXMgYnV0dG9uIHRpdGxlLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSB0aGUgYnV0dG9uLiBDbGllbnQgc2hvdWxkIHJldHVybiBpdCB0byB0aGUgc2VydmVyIHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkLlxuICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvblR5cGUgLSB0aGUgdHlwZSBvZiB0aGUgYnV0dG9uLCBvbmUgb2YgJ3VybCcgb3IgJ3B1YicuXG4gKiBAcGFyYW0ge3N0cmluZ30gYWN0aW9uVmFsdWUgLSB0aGUgdmFsdWUgdG8gcmV0dXJuIG9uIGNsaWNrOlxuICogQHBhcmFtIHtzdHJpbmd9IHJlZlVybCAtIHRoZSBVUkwgdG8gZ28gdG8gd2hlbiB0aGUgJ3VybCcgYnV0dG9uIGlzIGNsaWNrZWQuXG4gKlxuICogQHJldHVybiB7RHJhZnR5fSB1cGRhdGVkIGRvY3VtZW50LlxuICovXG5EcmFmdHkuYXBwZW5kQnV0dG9uID0gZnVuY3Rpb24oY29udGVudCwgdGl0bGUsIG5hbWUsIGFjdGlvblR5cGUsIGFjdGlvblZhbHVlLCByZWZVcmwpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogJydcbiAgfTtcbiAgY29uc3QgYXQgPSBjb250ZW50LnR4dC5sZW5ndGg7XG4gIGNvbnRlbnQudHh0ICs9IHRpdGxlO1xuICByZXR1cm4gRHJhZnR5Lmluc2VydEJ1dHRvbihjb250ZW50LCBhdCwgdGl0bGUubGVuZ3RoLCBuYW1lLCBhY3Rpb25UeXBlLCBhY3Rpb25WYWx1ZSwgcmVmVXJsKTtcbn1cblxuLyoqXG4gKiBBdHRhY2ggYSBnZW5lcmljIEpTIG9iamVjdC4gVGhlIG9iamVjdCBpcyBhdHRhY2hlZCBhcyBhIGpzb24gc3RyaW5nLlxuICogSW50ZW5kZWQgZm9yIHJlcHJlc2VudGluZyBhIGZvcm0gcmVzcG9uc2UuXG4gKlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBjb250ZW50IC0gRHJhZnR5IGRvY3VtZW50IHRvIGF0dGFjaCBmaWxlIHRvLlxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBkYXRhIHRvIGNvbnZlcnQgdG8ganNvbiBzdHJpbmcgYW5kIGF0dGFjaC5cbiAqIEByZXR1cm5zIHtEcmFmdHl9IHRoZSBzYW1lIGRvY3VtZW50IGFzIDxjb2RlPmNvbnRlbnQ8L2NvZGU+LlxuICovXG5EcmFmdHkuYXR0YWNoSlNPTiA9IGZ1bmN0aW9uKGNvbnRlbnQsIGRhdGEpIHtcbiAgY29udGVudCA9IGNvbnRlbnQgfHwge1xuICAgIHR4dDogJydcbiAgfTtcbiAgY29udGVudC5lbnQgPSBjb250ZW50LmVudCB8fCBbXTtcbiAgY29udGVudC5mbXQgPSBjb250ZW50LmZtdCB8fCBbXTtcblxuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogLTEsXG4gICAgbGVuOiAwLFxuICAgIGtleTogY29udGVudC5lbnQubGVuZ3RoXG4gIH0pO1xuXG4gIGNvbnRlbnQuZW50LnB1c2goe1xuICAgIHRwOiAnRVgnLFxuICAgIGRhdGE6IHtcbiAgICAgIG1pbWU6IEpTT05fTUlNRV9UWVBFLFxuICAgICAgdmFsOiBkYXRhXG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gY29udGVudDtcbn1cbi8qKlxuICogQXBwZW5kIGxpbmUgYnJlYWsgdG8gYSBEcmFmdHkgZG9jdW1lbnQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBEcmFmdHkgZG9jdW1lbnQgdG8gYXBwZW5kIGxpbmVicmVhayB0by5cbiAqIEByZXR1cm5zIHtEcmFmdHl9IHRoZSBzYW1lIGRvY3VtZW50IGFzIDxjb2RlPmNvbnRlbnQ8L2NvZGU+LlxuICovXG5EcmFmdHkuYXBwZW5kTGluZUJyZWFrID0gZnVuY3Rpb24oY29udGVudCkge1xuICBjb250ZW50ID0gY29udGVudCB8fCB7XG4gICAgdHh0OiAnJ1xuICB9O1xuICBjb250ZW50LmZtdCA9IGNvbnRlbnQuZm10IHx8IFtdO1xuICBjb250ZW50LmZtdC5wdXNoKHtcbiAgICBhdDogY29udGVudC50eHQubGVuZ3RoLFxuICAgIGxlbjogMSxcbiAgICB0cDogJ0JSJ1xuICB9KTtcbiAgY29udGVudC50eHQgKz0gJyAnO1xuXG4gIHJldHVybiBjb250ZW50O1xufVxuLyoqXG4gKiBHaXZlbiBEcmFmdHkgZG9jdW1lbnQsIGNvbnZlcnQgaXQgdG8gSFRNTC5cbiAqIE5vIGF0dGVtcHQgaXMgbWFkZSB0byBzdHJpcCBwcmUtZXhpc3RpbmcgaHRtbCBtYXJrdXAuXG4gKiBUaGlzIGlzIHBvdGVudGlhbGx5IHVuc2FmZSBiZWNhdXNlIDxjb2RlPmNvbnRlbnQudHh0PC9jb2RlPiBtYXkgY29udGFpbiBtYWxpY2lvdXMgSFRNTFxuICogbWFya3VwLlxuICogQG1lbWJlcm9mIFRpbm9kZS5EcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gZG9jIC0gZG9jdW1lbnQgdG8gY29udmVydC5cbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MLXJlcHJlc2VudGF0aW9uIG9mIGNvbnRlbnQuXG4gKi9cbkRyYWZ0eS5VTlNBRkVfdG9IVE1MID0gZnVuY3Rpb24oZG9jKSB7XG4gIGxldCB0cmVlID0gZHJhZnR5VG9UcmVlKGRvYyk7XG4gIGNvbnN0IGh0bWxGb3JtYXR0ZXIgPSBmdW5jdGlvbih0eXBlLCBkYXRhLCB2YWx1ZXMpIHtcbiAgICBjb25zdCB0YWcgPSBERUNPUkFUT1JTW3R5cGVdO1xuICAgIGxldCByZXN1bHQgPSB2YWx1ZXMgPyB2YWx1ZXMuam9pbignJykgOiAnJztcbiAgICBpZiAodGFnKSB7XG4gICAgICByZXN1bHQgPSB0YWcub3BlbihkYXRhKSArIHJlc3VsdCArIHRhZy5jbG9zZShkYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgcmV0dXJuIHRyZWVCb3R0b21VcCh0cmVlLCBodG1sRm9ybWF0dGVyLCAwKTtcbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgYXBwbHlpbmcgY3VzdG9tIGZvcm1hdHRpbmcgdG8gYSBEcmFmdHkgZG9jdW1lbnQuXG4gKiBDYWxsZWQgb25jZSBmb3IgZWFjaCBzdHlsZSBzcGFuLlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBjYWxsYmFjayBGb3JtYXR0ZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHlsZSAtIHN0eWxlIGNvZGUgc3VjaCBhcyBcIlNUXCIgb3IgXCJJTVwiLlxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBlbnRpdHkncyBkYXRhLlxuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlcyAtIHBvc3NpYmx5IHN0eWxlZCBzdWJzcGFucyBjb250YWluZWQgaW4gdGhpcyBzdHlsZSBzcGFuLlxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gaW5kZXggb2YgdGhlIGVsZW1lbnQgZ3VhcmFudGVlZCB0byBiZSB1bmlxdWUuXG4gKi9cblxuLyoqXG4gKiBDb252ZXJ0IERyYWZ0eSBkb2N1bWVudCB0byBhIHJlcHJlc2VudGF0aW9uIHN1aXRhYmxlIGZvciBkaXNwbGF5LlxuICogVGhlIDxjb2RlPmNvbnRleHQ8L2NvZGU+IG1heSBleHBvc2UgYSBmdW5jdGlvbiA8Y29kZT5nZXRGb3JtYXR0ZXIoc3R5bGUpPC9jb2RlPi4gSWYgaXQncyBhdmFpbGFibGVcbiAqIGl0IHdpbGwgY2FsbCBpdCB0byBvYnRhaW4gYSA8Y29kZT5mb3JtYXR0ZXI8L2NvZGU+IGZvciBhIHN1YnRyZWUgb2Ygc3R5bGVzIHVuZGVyIHRoZSA8Y29kZT5zdHlsZTwvY29kZT4uXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl8T2JqZWN0fSBjb250ZW50IC0gRHJhZnR5IGRvY3VtZW50IHRvIHRyYW5zZm9ybS5cbiAqIEBwYXJhbSB7Rm9ybWF0dGVyfSBmb3JtYXR0ZXIgLSBjYWxsYmFjayB3aGljaCBmb3JtYXRzIGluZGl2aWR1YWwgZWxlbWVudHMuXG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIGNvbnRleHQgcHJvdmlkZWQgdG8gZm9ybWF0dGVyIGFzIDxjb2RlPnRoaXM8L2NvZGU+LlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gdHJhbnNmb3JtZWQgb2JqZWN0XG4gKi9cbkRyYWZ0eS5mb3JtYXQgPSBmdW5jdGlvbihvcmlnaW5hbCwgZm9ybWF0dGVyLCBjb250ZXh0KSB7XG4gIHJldHVybiB0cmVlQm90dG9tVXAoZHJhZnR5VG9UcmVlKG9yaWdpbmFsKSwgZm9ybWF0dGVyLCAwLCBbXSwgY29udGV4dCk7XG59XG5cbi8qKlxuICogU2hvcnRlbiBEcmFmdHkgZG9jdW1lbnQgbWFraW5nIHRoZSBkcmFmdHkgdGV4dCBubyBsb25nZXIgdGhhbiB0aGUgbGltaXQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl8c3RyaW5nfSBvcmlnaW5hbCAtIERyYWZ0eSBvYmplY3QgdG8gc2hvcnRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsaW1pdCAtIGxlbmd0aCBpbiBjaGFyYWNyZXRzIHRvIHNob3J0ZW4gdG8uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGxpZ2h0IC0gcmVtb3ZlIGhlYXZ5IGRhdGEgZnJvbSBlbnRpdGllcy5cbiAqIEByZXR1cm5zIG5ldyBzaG9ydGVuZWQgRHJhZnR5IG9iamVjdCBsZWF2aW5nIHRoZSBvcmlnaW5hbCBpbnRhY3QuXG4gKi9cbkRyYWZ0eS5zaG9ydGVuID0gZnVuY3Rpb24ob3JpZ2luYWwsIGxpbWl0LCBsaWdodCkge1xuICBsZXQgdHJlZSA9IGRyYWZ0eVRvVHJlZShvcmlnaW5hbCk7XG4gIHRyZWUgPSBzaG9ydGVuVHJlZSh0cmVlLCBsaW1pdCwgJ+KApicpO1xuICBpZiAodHJlZSAmJiBsaWdodCkge1xuICAgIHRyZWUgPSBsaWdodEVudGl0eSh0cmVlKTtcbiAgfVxuICByZXR1cm4gdHJlZVRvRHJhZnR5KHt9LCB0cmVlLCBbXSk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtIERyYWZ0eSBkb2MgZm9yIGZvcndhcmRpbmc6IHN0cmlwIGxlYWRpbmcgQG1lbnRpb24gYW5kIGFueSBsZWFkaW5nIGxpbmUgYnJlYWtzIG9yIHdoaXRlc3BhY2UuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl8c3RyaW5nfSBvcmlnaW5hbCAtIERyYWZ0eSBvYmplY3QgdG8gc2hvcnRlbi5cbiAqIEByZXR1cm5zIGNvbnZlcnRlZCBEcmFmdHkgb2JqZWN0IGxlYXZpbmcgdGhlIG9yaWdpbmFsIGludGFjdC5cbiAqL1xuRHJhZnR5LmZvcndhcmRlZENvbnRlbnQgPSBmdW5jdGlvbihvcmlnaW5hbCkge1xuICBsZXQgdHJlZSA9IGRyYWZ0eVRvVHJlZShvcmlnaW5hbCk7XG4gIGNvbnN0IHJtTWVudGlvbiA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09ICdNTicpIHtcbiAgICAgIGlmICghbm9kZS5wYXJlbnQgfHwgIW5vZGUucGFyZW50LnR5cGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xuICB9XG4gIC8vIFN0cmlwIGxlYWRpbmcgbWVudGlvbi5cbiAgdHJlZSA9IHRyZWVUb3BEb3duKHRyZWUsIHJtTWVudGlvbik7XG4gIC8vIFJlbW92ZSBsZWFkaW5nIHdoaXRlc3BhY2UuXG4gIHRyZWUgPSBsVHJpbSh0cmVlKTtcbiAgLy8gQ29udmVydCBiYWNrIHRvIERyYWZ0eS5cbiAgcmV0dXJuIHRyZWVUb0RyYWZ0eSh7fSwgdHJlZSwgW10pO1xufVxuXG4vKipcbiAqIFByZXBhcmUgRHJhZnR5IGRvYyBmb3Igd3JhcHBpbmcgaW50byBRUSBhcyBhIHJlcGx5OlxuICogIC0gUmVwbGFjZSBmb3J3YXJkaW5nIG1lbnRpb24gd2l0aCBzeW1ib2wgJ+KepicgYW5kIHJlbW92ZSBkYXRhIChVSUQpLlxuICogIC0gUmVtb3ZlIHF1b3RlZCB0ZXh0IGNvbXBsZXRlbHkuXG4gKiAgLSBSZXBsYWNlIGxpbmUgYnJlYWtzIHdpdGggc3BhY2VzLlxuICogIC0gU3RyaXAgZW50aXRpZXMgb2YgaGVhdnkgY29udGVudC5cbiAqICAtIE1vdmUgYXR0YWNobWVudHMgdG8gdGhlIGVuZCBvZiB0aGUgZG9jdW1lbnQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl8c3RyaW5nfSBvcmlnaW5hbCAtIERyYWZ0eSBvYmplY3QgdG8gc2hvcnRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsaW1pdCAtIGxlbmd0aCBpbiBjaGFyYWN0ZXJzIHRvIHNob3J0ZW4gdG8uXG4gKiBAcmV0dXJucyBjb252ZXJ0ZWQgRHJhZnR5IG9iamVjdCBsZWF2aW5nIHRoZSBvcmlnaW5hbCBpbnRhY3QuXG4gKi9cbkRyYWZ0eS5yZXBseUNvbnRlbnQgPSBmdW5jdGlvbihvcmlnaW5hbCwgbGltaXQpIHtcbiAgY29uc3QgY29udk1OblFRbkJSID0gZnVuY3Rpb24obm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT0gJ1FRJykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT0gJ01OJykge1xuICAgICAgaWYgKCghbm9kZS5wYXJlbnQgfHwgIW5vZGUucGFyZW50LnR5cGUpICYmIChub2RlLnRleHQgfHwgJycpLnN0YXJ0c1dpdGgoJ+KepicpKSB7XG4gICAgICAgIG5vZGUudGV4dCA9ICfinqYnO1xuICAgICAgICBkZWxldGUgbm9kZS5jaGlsZHJlbjtcbiAgICAgICAgZGVsZXRlIG5vZGUuZGF0YTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PSAnQlInKSB7XG4gICAgICBub2RlLnRleHQgPSAnICc7XG4gICAgICBkZWxldGUgbm9kZS50eXBlO1xuICAgICAgZGVsZXRlIG5vZGUuY2hpbGRyZW47XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgbGV0IHRyZWUgPSBkcmFmdHlUb1RyZWUob3JpZ2luYWwpO1xuICBpZiAoIXRyZWUpIHtcbiAgICByZXR1cm4gb3JpZ2luYWw7XG4gIH1cblxuICAvLyBTdHJpcCBsZWFkaW5nIG1lbnRpb24uXG4gIHRyZWUgPSB0cmVlVG9wRG93bih0cmVlLCBjb252TU5uUVFuQlIpO1xuICAvLyBNb3ZlIGF0dGFjaG1lbnRzIHRvIHRoZSBlbmQgb2YgdGhlIGRvYy5cbiAgdHJlZSA9IGF0dGFjaG1lbnRzVG9FbmQodHJlZSwgTUFYX1BSRVZJRVdfQVRUQUNITUVOVFMpO1xuICAvLyBTaG9ydGVuIHRoZSBkb2MuXG4gIHRyZWUgPSBzaG9ydGVuVHJlZSh0cmVlLCBsaW1pdCwgJ+KApicpO1xuICAvLyBTdHJpcCBoZWF2eSBlbGVtZW50cyBleGNlcHQgSU0uZGF0YVsndmFsJ10gKGhhdmUgdG8ga2VlcCB0aGVtIHRvIGdlbmVyYXRlIHByZXZpZXdzIGxhdGVyKS5cbiAgdHJlZSA9IHRyZWVUb3BEb3duKHRyZWUsIChub2RlKSA9PiB7XG4gICAgY29uc3QgZGF0YSA9IGNvcHlFbnREYXRhKG5vZGUuZGF0YSwgdHJ1ZSwgKG5vZGUudHlwZSA9PSAnSU0nID8gWyd2YWwnXSA6IG51bGwpKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgbm9kZS5kYXRhID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIG5vZGUuZGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH0pO1xuICAvLyBDb252ZXJ0IGJhY2sgdG8gRHJhZnR5LlxuICByZXR1cm4gdHJlZVRvRHJhZnR5KHt9LCB0cmVlLCBbXSk7XG59XG5cblxuLyoqXG4gKiBHZW5lcmF0ZSBkcmFmdHkgcHJldmllOlxuICogIC0gU2hvcnRlbiB0aGUgZG9jdW1lbnQuXG4gKiAgLSBTdHJpcCBhbGwgaGVhdnkgZW50aXR5IGRhdGEgbGVhdmluZyBqdXN0IGlubGluZSBzdHlsZXMgYW5kIGVudGl0eSByZWZlcmVuY2VzLlxuICogIC0gUmVwbGFjZSBsaW5lIGJyZWFrcyB3aXRoIHNwYWNlcy5cbiAqICAtIFJlcGxhY2UgY29udGVudCBvZiBRUSB3aXRoIGEgc3BhY2UuXG4gKiAgLSBSZXBsYWNlIGZvcndhcmRpbmcgbWVudGlvbiB3aXRoIHN5bWJvbCAn4p6mJy5cbiAqIG1vdmUgYWxsIGF0dGFjaG1lbnRzIHRvIHRoZSBlbmQgb2YgdGhlIGRvY3VtZW50IGFuZCBtYWtlIHRoZW0gdmlzaWJsZS5cbiAqIFRoZSA8Y29kZT5jb250ZXh0PC9jb2RlPiBtYXkgZXhwb3NlIGEgZnVuY3Rpb24gPGNvZGU+Z2V0Rm9ybWF0dGVyKHN0eWxlKTwvY29kZT4uIElmIGl0J3MgYXZhaWxhYmxlXG4gKiBpdCB3aWxsIGNhbGwgaXQgdG8gb2J0YWluIGEgPGNvZGU+Zm9ybWF0dGVyPC9jb2RlPiBmb3IgYSBzdWJ0cmVlIG9mIHN0eWxlcyB1bmRlciB0aGUgPGNvZGU+c3R5bGU8L2NvZGU+LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fHN0cmluZ30gb3JpZ2luYWwgLSBEcmFmdHkgb2JqZWN0IHRvIHNob3J0ZW4uXG4gKiBAcGFyYW0ge251bWJlcn0gbGltaXQgLSBsZW5ndGggaW4gY2hhcmFjdGVycyB0byBzaG9ydGVuIHRvLlxuICogQHJldHVybnMgbmV3IHNob3J0ZW5lZCBEcmFmdHkgb2JqZWN0IGxlYXZpbmcgdGhlIG9yaWdpbmFsIGludGFjdC5cbiAqL1xuRHJhZnR5LnByZXZpZXcgPSBmdW5jdGlvbihvcmlnaW5hbCwgbGltaXQpIHtcbiAgbGV0IHRyZWUgPSBkcmFmdHlUb1RyZWUob3JpZ2luYWwpO1xuXG4gIC8vIE1vdmUgYXR0YWNobWVudHMgdG8gdGhlIGVuZC5cbiAgdHJlZSA9IGF0dGFjaG1lbnRzVG9FbmQodHJlZSwgTUFYX1BSRVZJRVdfQVRUQUNITUVOVFMpO1xuXG4gIC8vIENvbnZlcnQgbGVhZGluZyBtZW50aW9uIHRvICfinqYnIGFuZCByZXBsYWNlIFFRIGFuZCBCUiB3aXRoIGEgc3BhY2UgJyAnLlxuICBjb25zdCBjb252TU5uUVFuQlIgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PSAnTU4nKSB7XG4gICAgICBpZiAoKCFub2RlLnBhcmVudCB8fCAhbm9kZS5wYXJlbnQudHlwZSkgJiYgKG5vZGUudGV4dCB8fCAnJykuc3RhcnRzV2l0aCgn4p6mJykpIHtcbiAgICAgICAgbm9kZS50ZXh0ID0gJ+Kepic7XG4gICAgICAgIGRlbGV0ZSBub2RlLmNoaWxkcmVuO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09ICdRUScpIHtcbiAgICAgIG5vZGUudGV4dCA9ICcgJztcbiAgICAgIGRlbGV0ZSBub2RlLmNoaWxkcmVuO1xuICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09ICdCUicpIHtcbiAgICAgIG5vZGUudGV4dCA9ICcgJztcbiAgICAgIGRlbGV0ZSBub2RlLmNoaWxkcmVuO1xuICAgICAgZGVsZXRlIG5vZGUudHlwZTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbiAgdHJlZSA9IHRyZWVUb3BEb3duKHRyZWUsIGNvbnZNTm5RUW5CUik7XG5cbiAgdHJlZSA9IHNob3J0ZW5UcmVlKHRyZWUsIGxpbWl0LCAn4oCmJyk7XG4gIHRyZWUgPSBsaWdodEVudGl0eSh0cmVlKTtcblxuICAvLyBDb252ZXJ0IGJhY2sgdG8gRHJhZnR5LlxuICByZXR1cm4gdHJlZVRvRHJhZnR5KHt9LCB0cmVlLCBbXSk7XG59XG5cbi8qKlxuICogR2l2ZW4gRHJhZnR5IGRvY3VtZW50LCBjb252ZXJ0IGl0IHRvIHBsYWluIHRleHQuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBkb2N1bWVudCB0byBjb252ZXJ0IHRvIHBsYWluIHRleHQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBwbGFpbi10ZXh0IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBkcmFmdHkgZG9jdW1lbnQuXG4gKi9cbkRyYWZ0eS50b1BsYWluVGV4dCA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09ICdzdHJpbmcnID8gY29udGVudCA6IGNvbnRlbnQudHh0O1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBkb2N1bWVudCBoYXMgbm8gbWFya3VwIGFuZCBubyBlbnRpdGllcy5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGNvbnRlbnQgdG8gY2hlY2sgZm9yIHByZXNlbmNlIG9mIG1hcmt1cC5cbiAqIEByZXR1cm5zIDxjb2RlPnRydWU8L2NvZGU+IGlzIGNvbnRlbnQgaXMgcGxhaW4gdGV4dCwgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAqL1xuRHJhZnR5LmlzUGxhaW5UZXh0ID0gZnVuY3Rpb24oY29udGVudCkge1xuICByZXR1cm4gdHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycgfHwgIShjb250ZW50LmZtdCB8fCBjb250ZW50LmVudCk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBvYmplY3QgcmVwcmVzZXRzIGlzIGEgdmFsaWQgRHJhZnR5IGRvY3VtZW50LlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBjb250ZW50IC0gY29udGVudCB0byBjaGVjayBmb3IgdmFsaWRpdHkuXG4gKiBAcmV0dXJucyA8Y29kZT50cnVlPC9jb2RlPiBpcyBjb250ZW50IGlzIHZhbGlkLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICovXG5EcmFmdHkuaXNWYWxpZCA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgaWYgKCFjb250ZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3Qge1xuICAgIHR4dCxcbiAgICBmbXQsXG4gICAgZW50XG4gIH0gPSBjb250ZW50O1xuXG4gIGlmICghdHh0ICYmIHR4dCAhPT0gJycgJiYgIWZtdCAmJiAhZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgdHh0X3R5cGUgPSB0eXBlb2YgdHh0O1xuICBpZiAodHh0X3R5cGUgIT0gJ3N0cmluZycgJiYgdHh0X3R5cGUgIT0gJ3VuZGVmaW5lZCcgJiYgdHh0ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBmbXQgIT0gJ3VuZGVmaW5lZCcgJiYgIUFycmF5LmlzQXJyYXkoZm10KSAmJiBmbXQgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAodHlwZW9mIGVudCAhPSAndW5kZWZpbmVkJyAmJiAhQXJyYXkuaXNBcnJheShlbnQpICYmIGVudCAhPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZHJhZnR5IGRvY3VtZW50IGhhcyBhdHRhY2htZW50czogc3R5bGUgRVggYW5kIG91dHNpZGUgb2Ygbm9ybWFsIHJlbmRlcmluZyBmbG93LFxuICogaS5lLiA8Y29kZT5hdCA9IC0xPC9jb2RlPi5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGRvY3VtZW50IHRvIGNoZWNrIGZvciBhdHRhY2htZW50cy5cbiAqIEByZXR1cm5zIDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZXJlIGFyZSBhdHRhY2htZW50cy5cbiAqL1xuRHJhZnR5Lmhhc0F0dGFjaG1lbnRzID0gZnVuY3Rpb24oY29udGVudCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY29udGVudC5mbXQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZvciAobGV0IGkgaW4gY29udGVudC5mbXQpIHtcbiAgICBjb25zdCBmbXQgPSBjb250ZW50LmZtdFtpXTtcbiAgICBpZiAoZm10ICYmIGZtdC5hdCA8IDApIHtcbiAgICAgIGNvbnN0IGVudCA9IGNvbnRlbnQuZW50W2ZtdC5rZXkgfCAwXTtcbiAgICAgIHJldHVybiBlbnQgJiYgZW50LnRwID09ICdFWCcgJiYgZW50LmRhdGE7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgYXBwbHlpbmcgY3VzdG9tIGZvcm1hdHRpbmcvdHJhbnNmb3JtYXRpb24gdG8gYSBEcmFmdHkgZG9jdW1lbnQuXG4gKiBDYWxsZWQgb25jZSBmb3IgZWFjaCBlbnRpdHkuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQGNhbGxiYWNrIEVudGl0eUNhbGxiYWNrXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBlbnRpdHkgZGF0YS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBlbnRpdHkgdHlwZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBlbnRpdHkncyBpbmRleCBpbiBgY29udGVudC5lbnRgLlxuICovXG5cbi8qKlxuICogRW51bWVyYXRlIGF0dGFjaG1lbnRzOiBzdHlsZSBFWCBhbmQgb3V0c2lkZSBvZiBub3JtYWwgcmVuZGVyaW5nIGZsb3csIGkuZS4gPGNvZGU+YXQgPSAtMTwvY29kZT4uXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBkb2N1bWVudCB0byBwcm9jZXNzIGZvciBhdHRhY2htZW50cy5cbiAqIEBwYXJhbSB7RW50aXR5Q2FsbGJhY2t9IGNhbGxiYWNrIC0gY2FsbGJhY2sgdG8gY2FsbCBmb3IgZWFjaCBhdHRhY2htZW50LlxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSB2YWx1ZSBvZiBcInRoaXNcIiBmb3IgY2FsbGJhY2suXG4gKi9cbkRyYWZ0eS5hdHRhY2htZW50cyA9IGZ1bmN0aW9uKGNvbnRlbnQsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShjb250ZW50LmZtdCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IGkgPSAwO1xuICBjb250ZW50LmZtdC5mb3JFYWNoKGZtdCA9PiB7XG4gICAgaWYgKGZtdCAmJiBmbXQuYXQgPCAwKSB7XG4gICAgICBjb25zdCBlbnQgPSBjb250ZW50LmVudFtmbXQua2V5IHwgMF07XG4gICAgICBpZiAoZW50ICYmIGVudC50cCA9PSAnRVgnICYmIGVudC5kYXRhKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZW50LmRhdGEsIGkrKywgJ0VYJyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZHJhZnR5IGRvY3VtZW50IGhhcyBlbnRpdGllcy5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge0RyYWZ0eX0gY29udGVudCAtIGRvY3VtZW50IHRvIGNoZWNrIGZvciBlbnRpdGllcy5cbiAqIEByZXR1cm5zIDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZXJlIGFyZSBlbnRpdGllcy5cbiAqL1xuRHJhZnR5Lmhhc0VudGl0aWVzID0gZnVuY3Rpb24oY29udGVudCkge1xuICByZXR1cm4gY29udGVudC5lbnQgJiYgY29udGVudC5lbnQubGVuZ3RoID4gMDtcbn1cblxuLyoqXG4gKiBFbnVtZXJhdGUgZW50aXRpZXMuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtEcmFmdHl9IGNvbnRlbnQgLSBkb2N1bWVudCB3aXRoIGVudGl0aWVzIHRvIGVudW1lcmF0ZS5cbiAqIEBwYXJhbSB7RW50aXR5Q2FsbGJhY2t9IGNhbGxiYWNrIC0gY2FsbGJhY2sgdG8gY2FsbCBmb3IgZWFjaCBlbnRpdHkuXG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIHZhbHVlIG9mIFwidGhpc1wiIGZvciBjYWxsYmFjay5cbiAqL1xuRHJhZnR5LmVudGl0aWVzID0gZnVuY3Rpb24oY29udGVudCwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgaWYgKGNvbnRlbnQuZW50ICYmIGNvbnRlbnQuZW50Lmxlbmd0aCA+IDApIHtcbiAgICBmb3IgKGxldCBpIGluIGNvbnRlbnQuZW50KSB7XG4gICAgICBpZiAoY29udGVudC5lbnRbaV0pIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBjb250ZW50LmVudFtpXS5kYXRhLCBpLCBjb250ZW50LmVudFtpXS50cCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIHVucmVjb2duaXplZCBmaWVsZHMgZnJvbSBlbnRpdHkgZGF0YVxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7RHJhZnR5fSBjb250ZW50IC0gZG9jdW1lbnQgd2l0aCBlbnRpdGllcyB0byBlbnVtZXJhdGUuXG4gKiBAcmV0dXJucyBjb250ZW50LlxuICovXG5EcmFmdHkuc2FuaXRpemVFbnRpdGllcyA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgaWYgKGNvbnRlbnQgJiYgY29udGVudC5lbnQgJiYgY29udGVudC5lbnQubGVuZ3RoID4gMCkge1xuICAgIGZvciAobGV0IGkgaW4gY29udGVudC5lbnQpIHtcbiAgICAgIGNvbnN0IGVudCA9IGNvbnRlbnQuZW50W2ldO1xuICAgICAgaWYgKGVudCAmJiBlbnQuZGF0YSkge1xuICAgICAgICBjb25zdCBkYXRhID0gY29weUVudERhdGEoZW50LmRhdGEpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgIGNvbnRlbnQuZW50W2ldLmRhdGEgPSBkYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSBjb250ZW50LmVudFtpXS5kYXRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIEdpdmVuIHRoZSBlbnRpdHksIGdldCBVUkwgd2hpY2ggY2FuIGJlIHVzZWQgZm9yIGRvd25sb2FkaW5nXG4gKiBlbnRpdHkgZGF0YS5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZW50RGF0YSAtIGVudGl0eS5kYXRhIHRvIGdldCB0aGUgVVJsIGZyb20uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBVUkwgdG8gZG93bmxvYWQgZW50aXR5IGRhdGEgb3IgPGNvZGU+bnVsbDwvY29kZT4uXG4gKi9cbkRyYWZ0eS5nZXREb3dubG9hZFVybCA9IGZ1bmN0aW9uKGVudERhdGEpIHtcbiAgbGV0IHVybCA9IG51bGw7XG4gIGlmIChlbnREYXRhLm1pbWUgIT0gSlNPTl9NSU1FX1RZUEUgJiYgZW50RGF0YS52YWwpIHtcbiAgICB1cmwgPSBiYXNlNjR0b09iamVjdFVybChlbnREYXRhLnZhbCwgZW50RGF0YS5taW1lLCBEcmFmdHkubG9nZ2VyKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZW50RGF0YS5yZWYgPT0gJ3N0cmluZycpIHtcbiAgICB1cmwgPSBlbnREYXRhLnJlZjtcbiAgfVxuICByZXR1cm4gdXJsO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBlbnRpdHkgZGF0YSBpcyBub3QgcmVhZHkgZm9yIHNlbmRpbmcsIHN1Y2ggYXMgYmVpbmcgdXBsb2FkZWQgdG8gdGhlIHNlcnZlci5cbiAqIEBtZW1iZXJvZiBEcmFmdHlcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZW50aXR5LmRhdGEgdG8gZ2V0IHRoZSBVUmwgZnJvbS5cbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHVwbG9hZCBpcyBpbiBwcm9ncmVzcywgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5EcmFmdHkuaXNQcm9jZXNzaW5nID0gZnVuY3Rpb24oZW50RGF0YSkge1xuICByZXR1cm4gISFlbnREYXRhLl9wcm9jZXNzaW5nO1xufVxuXG4vKipcbiAqIEdpdmVuIHRoZSBlbnRpdHksIGdldCBVUkwgd2hpY2ggY2FuIGJlIHVzZWQgZm9yIHByZXZpZXdpbmdcbiAqIHRoZSBlbnRpdHkuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGVudGl0eS5kYXRhIHRvIGdldCB0aGUgVVJsIGZyb20uXG4gKlxuICogQHJldHVybnMge3N0cmluZ30gdXJsIGZvciBwcmV2aWV3aW5nIG9yIG51bGwgaWYgbm8gc3VjaCB1cmwgaXMgYXZhaWxhYmxlLlxuICovXG5EcmFmdHkuZ2V0UHJldmlld1VybCA9IGZ1bmN0aW9uKGVudERhdGEpIHtcbiAgcmV0dXJuIGVudERhdGEudmFsID8gYmFzZTY0dG9PYmplY3RVcmwoZW50RGF0YS52YWwsIGVudERhdGEubWltZSwgRHJhZnR5LmxvZ2dlcikgOiBudWxsO1xufVxuXG4vKipcbiAqIEdldCBhcHByb3hpbWF0ZSBzaXplIG9mIHRoZSBlbnRpdHkuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGVudERhdGEgLSBlbnRpdHkuZGF0YSB0byBnZXQgdGhlIHNpemUgZm9yLlxuICogQHJldHVybnMge251bWJlcn0gc2l6ZSBvZiBlbnRpdHkgZGF0YSBpbiBieXRlcy5cbiAqL1xuRHJhZnR5LmdldEVudGl0eVNpemUgPSBmdW5jdGlvbihlbnREYXRhKSB7XG4gIC8vIEVpdGhlciBzaXplIGhpbnQgb3IgbGVuZ3RoIG9mIHZhbHVlLiBUaGUgdmFsdWUgaXMgYmFzZTY0IGVuY29kZWQsXG4gIC8vIHRoZSBhY3R1YWwgb2JqZWN0IHNpemUgaXMgc21hbGxlciB0aGFuIHRoZSBlbmNvZGVkIGxlbmd0aC5cbiAgcmV0dXJuIGVudERhdGEuc2l6ZSA/IGVudERhdGEuc2l6ZSA6IGVudERhdGEudmFsID8gKGVudERhdGEudmFsLmxlbmd0aCAqIDAuNzUpIHwgMCA6IDA7XG59XG5cbi8qKlxuICogR2V0IGVudGl0eSBtaW1lIHR5cGUuXG4gKiBAbWVtYmVyb2YgRHJhZnR5XG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGVudERhdGEgLSBlbnRpdHkuZGF0YSB0byBnZXQgdGhlIHR5cGUgZm9yLlxuICogQHJldHVybnMge3N0cmluZ30gbWltZSB0eXBlIG9mIGVudGl0eS5cbiAqL1xuRHJhZnR5LmdldEVudGl0eU1pbWVUeXBlID0gZnVuY3Rpb24oZW50RGF0YSkge1xuICByZXR1cm4gZW50RGF0YS5taW1lIHx8ICd0ZXh0L3BsYWluJztcbn1cblxuLyoqXG4gKiBHZXQgSFRNTCB0YWcgZm9yIGEgZ2l2ZW4gdHdvLWxldHRlciBzdHlsZSBuYW1lLlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHlsZSAtIHR3by1sZXR0ZXIgc3R5bGUsIGxpa2UgU1Qgb3IgTE4uXG4gKlxuICogQHJldHVybnMge3N0cmluZ30gSFRNTCB0YWcgbmFtZSBpZiBzdHlsZSBpcyBmb3VuZCwgJ19VTktOJyBpZiBub3QgZm91bmQsIHtjb2RlOiB1bmRlZmluZWR9IGlmIHN0eWxlIGlzIGZhbHNpc2guXG4gKi9cbkRyYWZ0eS50YWdOYW1lID0gZnVuY3Rpb24oc3R5bGUpIHtcbiAgcmV0dXJuIHN0eWxlID8gKEhUTUxfVEFHU1tzdHlsZV0gPyBIVE1MX1RBR1Nbc3R5bGVdLm5hbWUgOiAnX1VOS04nKSA6IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBGb3IgYSBnaXZlbiBkYXRhIGJ1bmRsZSBnZW5lcmF0ZSBhbiBvYmplY3Qgd2l0aCBIVE1MIGF0dHJpYnV0ZXMsXG4gKiBmb3IgaW5zdGFuY2UsIGdpdmVuIHt1cmw6IFwiaHR0cDovL3d3dy5leGFtcGxlLmNvbS9cIn0gcmV0dXJuXG4gKiB7aHJlZjogXCJodHRwOi8vd3d3LmV4YW1wbGUuY29tL1wifVxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHlsZSAtIHR3by1sZXR0ZXIgc3R5bGUgdG8gZ2VuZXJhdGUgYXR0cmlidXRlcyBmb3IuXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIGRhdGEgYnVuZGxlIHRvIGNvbnZlcnQgdG8gYXR0cmlidXRlc1xuICpcbiAqIEByZXR1cm5zIHtPYmplY3R9IG9iamVjdCB3aXRoIEhUTUwgYXR0cmlidXRlcy5cbiAqL1xuRHJhZnR5LmF0dHJWYWx1ZSA9IGZ1bmN0aW9uKHN0eWxlLCBkYXRhKSB7XG4gIGlmIChkYXRhICYmIERFQ09SQVRPUlNbc3R5bGVdKSB7XG4gICAgcmV0dXJuIERFQ09SQVRPUlNbc3R5bGVdLnByb3BzKGRhdGEpO1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBEcmFmdHkgTUlNRSB0eXBlLlxuICogQG1lbWJlcm9mIERyYWZ0eVxuICogQHN0YXRpY1xuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGNvbnRlbnQtVHlwZSBcInRleHQveC1kcmFmdHlcIi5cbiAqL1xuRHJhZnR5LmdldENvbnRlbnRUeXBlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBEUkFGVFlfTUlNRV9UWVBFO1xufVxuXG4vLyA9PT09PT09PT09PT09PT09PVxuLy8gVXRpbGl0eSBtZXRob2RzLlxuLy8gPT09PT09PT09PT09PT09PT1cblxuLy8gVGFrZSBhIHN0cmluZyBhbmQgZGVmaW5lZCBlYXJsaWVyIHN0eWxlIHNwYW5zLCByZS1jb21wb3NlIHRoZW0gaW50byBhIHRyZWUgd2hlcmUgZWFjaCBsZWFmIGlzXG4vLyBhIHNhbWUtc3R5bGUgKGluY2x1ZGluZyB1bnN0eWxlZCkgc3RyaW5nLiBJLmUuICdoZWxsbyAqYm9sZCBfaXRhbGljXyogYW5kIH5tb3JlfiB3b3JsZCcgLT5cbi8vICgnaGVsbG8gJywgKGI6ICdib2xkICcsIChpOiAnaXRhbGljJykpLCAnIGFuZCAnLCAoczogJ21vcmUnKSwgJyB3b3JsZCcpO1xuLy9cbi8vIFRoaXMgaXMgbmVlZGVkIGluIG9yZGVyIHRvIGNsZWFyIG1hcmt1cCwgaS5lLiAnaGVsbG8gKndvcmxkKicgLT4gJ2hlbGxvIHdvcmxkJyBhbmQgY29udmVydFxuLy8gcmFuZ2VzIGZyb20gbWFya3VwLWVkIG9mZnNldHMgdG8gcGxhaW4gdGV4dCBvZmZzZXRzLlxuZnVuY3Rpb24gY2h1bmtpZnkobGluZSwgc3RhcnQsIGVuZCwgc3BhbnMpIHtcbiAgY29uc3QgY2h1bmtzID0gW107XG5cbiAgaWYgKHNwYW5zLmxlbmd0aCA9PSAwKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZm9yIChsZXQgaSBpbiBzcGFucykge1xuICAgIC8vIEdldCB0aGUgbmV4dCBjaHVuayBmcm9tIHRoZSBxdWV1ZVxuICAgIGNvbnN0IHNwYW4gPSBzcGFuc1tpXTtcblxuICAgIC8vIEdyYWIgdGhlIGluaXRpYWwgdW5zdHlsZWQgY2h1bmtcbiAgICBpZiAoc3Bhbi5hdCA+IHN0YXJ0KSB7XG4gICAgICBjaHVua3MucHVzaCh7XG4gICAgICAgIHR4dDogbGluZS5zbGljZShzdGFydCwgc3Bhbi5hdClcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEdyYWIgdGhlIHN0eWxlZCBjaHVuay4gSXQgbWF5IGluY2x1ZGUgc3ViY2h1bmtzLlxuICAgIGNvbnN0IGNodW5rID0ge1xuICAgICAgdHA6IHNwYW4udHBcbiAgICB9O1xuICAgIGNvbnN0IGNobGQgPSBjaHVua2lmeShsaW5lLCBzcGFuLmF0ICsgMSwgc3Bhbi5lbmQsIHNwYW4uY2hpbGRyZW4pO1xuICAgIGlmIChjaGxkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNodW5rLmNoaWxkcmVuID0gY2hsZDtcbiAgICB9IGVsc2Uge1xuICAgICAgY2h1bmsudHh0ID0gc3Bhbi50eHQ7XG4gICAgfVxuICAgIGNodW5rcy5wdXNoKGNodW5rKTtcbiAgICBzdGFydCA9IHNwYW4uZW5kICsgMTsgLy8gJysxJyBpcyB0byBza2lwIHRoZSBmb3JtYXR0aW5nIGNoYXJhY3RlclxuICB9XG5cbiAgLy8gR3JhYiB0aGUgcmVtYWluaW5nIHVuc3R5bGVkIGNodW5rLCBhZnRlciB0aGUgbGFzdCBzcGFuXG4gIGlmIChzdGFydCA8IGVuZCkge1xuICAgIGNodW5rcy5wdXNoKHtcbiAgICAgIHR4dDogbGluZS5zbGljZShzdGFydCwgZW5kKVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGNodW5rcztcbn1cblxuLy8gRGV0ZWN0IHN0YXJ0cyBhbmQgZW5kcyBvZiBmb3JtYXR0aW5nIHNwYW5zLiBVbmZvcm1hdHRlZCBzcGFucyBhcmVcbi8vIGlnbm9yZWQgYXQgdGhpcyBzdGFnZS5cbmZ1bmN0aW9uIHNwYW5uaWZ5KG9yaWdpbmFsLCByZV9zdGFydCwgcmVfZW5kLCB0eXBlKSB7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgbGluZSA9IG9yaWdpbmFsLnNsaWNlKDApOyAvLyBtYWtlIGEgY29weTtcblxuICB3aGlsZSAobGluZS5sZW5ndGggPiAwKSB7XG4gICAgLy8gbWF0Y2hbMF07IC8vIG1hdGNoLCBsaWtlICcqYWJjKidcbiAgICAvLyBtYXRjaFsxXTsgLy8gbWF0Y2ggY2FwdHVyZWQgaW4gcGFyZW50aGVzaXMsIGxpa2UgJ2FiYydcbiAgICAvLyBtYXRjaFsnaW5kZXgnXTsgLy8gb2Zmc2V0IHdoZXJlIHRoZSBtYXRjaCBzdGFydGVkLlxuXG4gICAgLy8gRmluZCB0aGUgb3BlbmluZyB0b2tlbi5cbiAgICBjb25zdCBzdGFydCA9IHJlX3N0YXJ0LmV4ZWMobGluZSk7XG4gICAgaWYgKHN0YXJ0ID09IG51bGwpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIEJlY2F1c2UgamF2YXNjcmlwdCBSZWdFeHAgZG9lcyBub3Qgc3VwcG9ydCBsb29rYmVoaW5kLCB0aGUgYWN0dWFsIG9mZnNldCBtYXkgbm90IHBvaW50XG4gICAgLy8gYXQgdGhlIG1hcmt1cCBjaGFyYWN0ZXIuIEZpbmQgaXQgaW4gdGhlIG1hdGNoZWQgc3RyaW5nLlxuICAgIGxldCBzdGFydF9vZmZzZXQgPSBzdGFydFsnaW5kZXgnXSArIHN0YXJ0WzBdLmxhc3RJbmRleE9mKHN0YXJ0WzFdKTtcbiAgICAvLyBDbGlwIHRoZSBwcm9jZXNzZWQgcGFydCBvZiB0aGUgc3RyaW5nLlxuICAgIGxpbmUgPSBsaW5lLnNsaWNlKHN0YXJ0X29mZnNldCArIDEpO1xuICAgIC8vIHN0YXJ0X29mZnNldCBpcyBhbiBvZmZzZXQgd2l0aGluIHRoZSBjbGlwcGVkIHN0cmluZy4gQ29udmVydCB0byBvcmlnaW5hbCBpbmRleC5cbiAgICBzdGFydF9vZmZzZXQgKz0gaW5kZXg7XG4gICAgLy8gSW5kZXggbm93IHBvaW50IHRvIHRoZSBiZWdpbm5pbmcgb2YgJ2xpbmUnIHdpdGhpbiB0aGUgJ29yaWdpbmFsJyBzdHJpbmcuXG4gICAgaW5kZXggPSBzdGFydF9vZmZzZXQgKyAxO1xuXG4gICAgLy8gRmluZCB0aGUgbWF0Y2hpbmcgY2xvc2luZyB0b2tlbi5cbiAgICBjb25zdCBlbmQgPSByZV9lbmQgPyByZV9lbmQuZXhlYyhsaW5lKSA6IG51bGw7XG4gICAgaWYgKGVuZCA9PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgbGV0IGVuZF9vZmZzZXQgPSBlbmRbJ2luZGV4J10gKyBlbmRbMF0uaW5kZXhPZihlbmRbMV0pO1xuICAgIC8vIENsaXAgdGhlIHByb2Nlc3NlZCBwYXJ0IG9mIHRoZSBzdHJpbmcuXG4gICAgbGluZSA9IGxpbmUuc2xpY2UoZW5kX29mZnNldCArIDEpO1xuICAgIC8vIFVwZGF0ZSBvZmZzZXRzXG4gICAgZW5kX29mZnNldCArPSBpbmRleDtcbiAgICAvLyBJbmRleCBub3cgcG9pbnRzIHRvIHRoZSBiZWdpbm5pbmcgb2YgJ2xpbmUnIHdpdGhpbiB0aGUgJ29yaWdpbmFsJyBzdHJpbmcuXG4gICAgaW5kZXggPSBlbmRfb2Zmc2V0ICsgMTtcblxuICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgIHR4dDogb3JpZ2luYWwuc2xpY2Uoc3RhcnRfb2Zmc2V0ICsgMSwgZW5kX29mZnNldCksXG4gICAgICBjaGlsZHJlbjogW10sXG4gICAgICBhdDogc3RhcnRfb2Zmc2V0LFxuICAgICAgZW5kOiBlbmRfb2Zmc2V0LFxuICAgICAgdHA6IHR5cGVcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIENvbnZlcnQgbGluZWFyIGFycmF5IG9yIHNwYW5zIGludG8gYSB0cmVlIHJlcHJlc2VudGF0aW9uLlxuLy8gS2VlcCBzdGFuZGFsb25lIGFuZCBuZXN0ZWQgc3BhbnMsIHRocm93IGF3YXkgcGFydGlhbGx5IG92ZXJsYXBwaW5nIHNwYW5zLlxuZnVuY3Rpb24gdG9TcGFuVHJlZShzcGFucykge1xuICBpZiAoc3BhbnMubGVuZ3RoID09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCB0cmVlID0gW3NwYW5zWzBdXTtcbiAgbGV0IGxhc3QgPSBzcGFuc1swXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBzcGFucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIEtlZXAgc3BhbnMgd2hpY2ggc3RhcnQgYWZ0ZXIgdGhlIGVuZCBvZiB0aGUgcHJldmlvdXMgc3BhbiBvciB0aG9zZSB3aGljaFxuICAgIC8vIGFyZSBjb21wbGV0ZSB3aXRoaW4gdGhlIHByZXZpb3VzIHNwYW4uXG4gICAgaWYgKHNwYW5zW2ldLmF0ID4gbGFzdC5lbmQpIHtcbiAgICAgIC8vIFNwYW4gaXMgY29tcGxldGVseSBvdXRzaWRlIG9mIHRoZSBwcmV2aW91cyBzcGFuLlxuICAgICAgdHJlZS5wdXNoKHNwYW5zW2ldKTtcbiAgICAgIGxhc3QgPSBzcGFuc1tpXTtcbiAgICB9IGVsc2UgaWYgKHNwYW5zW2ldLmVuZCA8PSBsYXN0LmVuZCkge1xuICAgICAgLy8gU3BhbiBpcyBmdWxseSBpbnNpZGUgb2YgdGhlIHByZXZpb3VzIHNwYW4uIFB1c2ggdG8gc3Vibm9kZS5cbiAgICAgIGxhc3QuY2hpbGRyZW4ucHVzaChzcGFuc1tpXSk7XG4gICAgfVxuICAgIC8vIFNwYW4gY291bGQgcGFydGlhbGx5IG92ZXJsYXAsIGlnbm9yaW5nIGl0IGFzIGludmFsaWQuXG4gIH1cblxuICAvLyBSZWN1cnNpdmVseSByZWFycmFuZ2UgdGhlIHN1Ym5vZGVzLlxuICBmb3IgKGxldCBpIGluIHRyZWUpIHtcbiAgICB0cmVlW2ldLmNoaWxkcmVuID0gdG9TcGFuVHJlZSh0cmVlW2ldLmNoaWxkcmVuKTtcbiAgfVxuXG4gIHJldHVybiB0cmVlO1xufVxuXG4vLyBDb252ZXJ0IGRyYWZ0eSBkb2N1bWVudCB0byBhIHRyZWUuXG5mdW5jdGlvbiBkcmFmdHlUb1RyZWUoZG9jKSB7XG4gIGlmICghZG9jKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBkb2MgPSAodHlwZW9mIGRvYyA9PSAnc3RyaW5nJykgPyB7XG4gICAgdHh0OiBkb2NcbiAgfSA6IGRvYztcbiAgbGV0IHtcbiAgICB0eHQsXG4gICAgZm10LFxuICAgIGVudFxuICB9ID0gZG9jO1xuXG4gIHR4dCA9IHR4dCB8fCAnJztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGVudCkpIHtcbiAgICBlbnQgPSBbXTtcbiAgfVxuXG4gIGlmICghQXJyYXkuaXNBcnJheShmbXQpIHx8IGZtdC5sZW5ndGggPT0gMCkge1xuICAgIGlmIChlbnQubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHQ6IHR4dFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgc3BlY2lhbCBjYXNlIHdoZW4gYWxsIHZhbHVlcyBpbiBmbXQgYXJlIDAgYW5kIGZtdCB0aGVyZWZvcmUgaXMgc2tpcHBlZC5cbiAgICBmbXQgPSBbe1xuICAgICAgYXQ6IDAsXG4gICAgICBsZW46IDAsXG4gICAgICBrZXk6IDBcbiAgICB9XTtcbiAgfVxuXG4gIC8vIFNhbml0aXplIHNwYW5zLlxuICBjb25zdCBzcGFucyA9IFtdO1xuICBjb25zdCBhdHRhY2htZW50cyA9IFtdO1xuICBmbXQuZm9yRWFjaCgoc3BhbikgPT4ge1xuICAgIGlmICghc3BhbiB8fCB0eXBlb2Ygc3BhbiAhPSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghWyd1bmRlZmluZWQnLCAnbnVtYmVyJ10uaW5jbHVkZXModHlwZW9mIHNwYW4uYXQpKSB7XG4gICAgICAvLyBQcmVzZW50LCBidXQgbm9uLW51bWVyaWMgJ2F0Jy5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFbJ3VuZGVmaW5lZCcsICdudW1iZXInXS5pbmNsdWRlcyh0eXBlb2Ygc3Bhbi5sZW4pKSB7XG4gICAgICAvLyBQcmVzZW50LCBidXQgbm9uLW51bWVyaWMgJ2xlbicuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBhdCA9IHNwYW4uYXQgfCAwO1xuICAgIGxldCBsZW4gPSBzcGFuLmxlbiB8IDA7XG4gICAgaWYgKGxlbiA8IDApIHtcbiAgICAgIC8vIEludmFsaWQgc3BhbiBsZW5ndGguXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGtleSA9IHNwYW4ua2V5IHx8IDA7XG4gICAgaWYgKGVudC5sZW5ndGggPiAwICYmICh0eXBlb2Yga2V5ICE9ICdudW1iZXInIHx8IGtleSA8IDAgfHwga2V5ID49IGVudC5sZW5ndGgpKSB7XG4gICAgICAvLyBJbnZhbGlkIGtleSB2YWx1ZS5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoYXQgPD0gLTEpIHtcbiAgICAgIC8vIEF0dGFjaG1lbnQuIFN0b3JlIGF0dGFjaG1lbnRzIHNlcGFyYXRlbHkuXG4gICAgICBhdHRhY2htZW50cy5wdXNoKHtcbiAgICAgICAgc3RhcnQ6IC0xLFxuICAgICAgICBlbmQ6IDAsXG4gICAgICAgIGtleToga2V5XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKGF0ICsgbGVuID4gdHh0Lmxlbmd0aCkge1xuICAgICAgLy8gU3BhbiBpcyBvdXQgb2YgYm91bmRzLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghc3Bhbi50cCkge1xuICAgICAgaWYgKGVudC5sZW5ndGggPiAwICYmICh0eXBlb2YgZW50W2tleV0gPT0gJ29iamVjdCcpKSB7XG4gICAgICAgIHNwYW5zLnB1c2goe1xuICAgICAgICAgIHN0YXJ0OiBhdCxcbiAgICAgICAgICBlbmQ6IGF0ICsgbGVuLFxuICAgICAgICAgIGtleToga2V5XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzcGFucy5wdXNoKHtcbiAgICAgICAgdHlwZTogc3Bhbi50cCxcbiAgICAgICAgc3RhcnQ6IGF0LFxuICAgICAgICBlbmQ6IGF0ICsgbGVuXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFNvcnQgc3BhbnMgZmlyc3QgYnkgc3RhcnQgaW5kZXggKGFzYykgdGhlbiBieSBsZW5ndGggKGRlc2MpLCB0aGVuIGJ5IHdlaWdodC5cbiAgc3BhbnMuc29ydCgoYSwgYikgPT4ge1xuICAgIGxldCBkaWZmID0gYS5zdGFydCAtIGIuc3RhcnQ7XG4gICAgaWYgKGRpZmYgIT0gMCkge1xuICAgICAgcmV0dXJuIGRpZmY7XG4gICAgfVxuICAgIGRpZmYgPSBiLmVuZCAtIGEuZW5kO1xuICAgIGlmIChkaWZmICE9IDApIHtcbiAgICAgIHJldHVybiBkaWZmO1xuICAgIH1cbiAgICByZXR1cm4gRk1UX1dFSUdIVC5pbmRleE9mKGIudHlwZSkgLSBGTVRfV0VJR0hULmluZGV4T2YoYS50eXBlKTtcbiAgfSk7XG5cbiAgLy8gTW92ZSBhdHRhY2htZW50cyB0byB0aGUgZW5kIG9mIHRoZSBsaXN0LlxuICBpZiAoYXR0YWNobWVudHMubGVuZ3RoID4gMCkge1xuICAgIHNwYW5zLnB1c2goLi4uYXR0YWNobWVudHMpO1xuICB9XG5cbiAgc3BhbnMuZm9yRWFjaCgoc3BhbikgPT4ge1xuICAgIGlmIChlbnQubGVuZ3RoID4gMCAmJiAhc3Bhbi50eXBlICYmIGVudFtzcGFuLmtleV0gJiYgdHlwZW9mIGVudFtzcGFuLmtleV0gPT0gJ29iamVjdCcpIHtcbiAgICAgIHNwYW4udHlwZSA9IGVudFtzcGFuLmtleV0udHA7XG4gICAgICBzcGFuLmRhdGEgPSBlbnRbc3Bhbi5rZXldLmRhdGE7XG4gICAgfVxuXG4gICAgLy8gSXMgdHlwZSBzdGlsbCB1bmRlZmluZWQ/IEhpZGUgdGhlIGludmFsaWQgZWxlbWVudCFcbiAgICBpZiAoIXNwYW4udHlwZSkge1xuICAgICAgc3Bhbi50eXBlID0gJ0hEJztcbiAgICB9XG4gIH0pO1xuXG4gIGxldCB0cmVlID0gc3BhbnNUb1RyZWUoe30sIHR4dCwgMCwgdHh0Lmxlbmd0aCwgc3BhbnMpO1xuXG4gIC8vIEZsYXR0ZW4gdHJlZSBub2Rlcy5cbiAgY29uc3QgZmxhdHRlbiA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlLmNoaWxkcmVuKSAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAxKSB7XG4gICAgICAvLyBVbndyYXAuXG4gICAgICBjb25zdCBjaGlsZCA9IG5vZGUuY2hpbGRyZW5bMF07XG4gICAgICBpZiAoIW5vZGUudHlwZSkge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudDtcbiAgICAgICAgbm9kZSA9IGNoaWxkO1xuICAgICAgICBub2RlLnBhcmVudCA9IHBhcmVudDtcbiAgICAgIH0gZWxzZSBpZiAoIWNoaWxkLnR5cGUgJiYgIWNoaWxkLmNoaWxkcmVuKSB7XG4gICAgICAgIG5vZGUudGV4dCA9IGNoaWxkLnRleHQ7XG4gICAgICAgIGRlbGV0ZSBub2RlLmNoaWxkcmVuO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICB0cmVlID0gdHJlZVRvcERvd24odHJlZSwgZmxhdHRlbik7XG5cbiAgcmV0dXJuIHRyZWU7XG59XG5cbi8vIEFkZCB0cmVlIG5vZGUgdG8gYSBwYXJlbnQgdHJlZS5cbmZ1bmN0aW9uIGFkZE5vZGUocGFyZW50LCBuKSB7XG4gIGlmICghbikge1xuICAgIHJldHVybiBwYXJlbnQ7XG4gIH1cblxuICBpZiAoIXBhcmVudC5jaGlsZHJlbikge1xuICAgIHBhcmVudC5jaGlsZHJlbiA9IFtdO1xuICB9XG5cbiAgLy8gSWYgdGV4dCBpcyBwcmVzZW50LCBtb3ZlIGl0IHRvIGEgc3Vibm9kZS5cbiAgaWYgKHBhcmVudC50ZXh0KSB7XG4gICAgcGFyZW50LmNoaWxkcmVuLnB1c2goe1xuICAgICAgdGV4dDogcGFyZW50LnRleHQsXG4gICAgICBwYXJlbnQ6IHBhcmVudFxuICAgIH0pO1xuICAgIGRlbGV0ZSBwYXJlbnQudGV4dDtcbiAgfVxuXG4gIG4ucGFyZW50ID0gcGFyZW50O1xuICBwYXJlbnQuY2hpbGRyZW4ucHVzaChuKTtcblxuICByZXR1cm4gcGFyZW50O1xufVxuXG4vLyBSZXR1cm5zIGEgdHJlZSBvZiBub2Rlcy5cbmZ1bmN0aW9uIHNwYW5zVG9UcmVlKHBhcmVudCwgdGV4dCwgc3RhcnQsIGVuZCwgc3BhbnMpIHtcbiAgaWYgKCFzcGFucyB8fCBzcGFucy5sZW5ndGggPT0gMCkge1xuICAgIGlmIChzdGFydCA8IGVuZCkge1xuICAgICAgYWRkTm9kZShwYXJlbnQsIHtcbiAgICAgICAgdGV4dDogdGV4dC5zdWJzdHJpbmcoc3RhcnQsIGVuZClcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcGFyZW50O1xuICB9XG5cbiAgLy8gUHJvY2VzcyBzdWJzcGFucy5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGFucy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHNwYW4gPSBzcGFuc1tpXTtcbiAgICBpZiAoc3Bhbi5zdGFydCA8IDAgJiYgc3Bhbi50eXBlID09ICdFWCcpIHtcbiAgICAgIGFkZE5vZGUocGFyZW50LCB7XG4gICAgICAgIHR5cGU6IHNwYW4udHlwZSxcbiAgICAgICAgZGF0YTogc3Bhbi5kYXRhLFxuICAgICAgICBrZXk6IHNwYW4ua2V5LFxuICAgICAgICBhdHQ6IHRydWVcbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQWRkIHVuLXN0eWxlZCByYW5nZSBiZWZvcmUgdGhlIHN0eWxlZCBzcGFuIHN0YXJ0cy5cbiAgICBpZiAoc3RhcnQgPCBzcGFuLnN0YXJ0KSB7XG4gICAgICBhZGROb2RlKHBhcmVudCwge1xuICAgICAgICB0ZXh0OiB0ZXh0LnN1YnN0cmluZyhzdGFydCwgc3Bhbi5zdGFydClcbiAgICAgIH0pO1xuICAgICAgc3RhcnQgPSBzcGFuLnN0YXJ0O1xuICAgIH1cblxuICAgIC8vIEdldCBhbGwgc3BhbnMgd2hpY2ggYXJlIHdpdGhpbiB0aGUgY3VycmVudCBzcGFuLlxuICAgIGNvbnN0IHN1YnNwYW5zID0gW107XG4gICAgd2hpbGUgKGkgPCBzcGFucy5sZW5ndGggLSAxKSB7XG4gICAgICBjb25zdCBpbm5lciA9IHNwYW5zW2kgKyAxXTtcbiAgICAgIGlmIChpbm5lci5zdGFydCA8IDApIHtcbiAgICAgICAgLy8gQXR0YWNobWVudHMgYXJlIGluIHRoZSBlbmQuIFN0b3AuXG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIGlmIChpbm5lci5zdGFydCA8IHNwYW4uZW5kKSB7XG4gICAgICAgIGlmIChpbm5lci5lbmQgPD0gc3Bhbi5lbmQpIHtcbiAgICAgICAgICBjb25zdCB0YWcgPSBIVE1MX1RBR1NbaW5uZXIudHBdIHx8IHt9O1xuICAgICAgICAgIGlmIChpbm5lci5zdGFydCA8IGlubmVyLmVuZCB8fCB0YWcuaXNWb2lkKSB7XG4gICAgICAgICAgICAvLyBWYWxpZCBzdWJzcGFuOiBjb21wbGV0ZWx5IHdpdGhpbiB0aGUgY3VycmVudCBzcGFuIGFuZFxuICAgICAgICAgICAgLy8gZWl0aGVyIG5vbi16ZXJvIGxlbmd0aCBvciB6ZXJvIGxlbmd0aCBpcyBhY2NlcHRhYmxlLlxuICAgICAgICAgICAgc3Vic3BhbnMucHVzaChpbm5lcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgICAgLy8gT3ZlcmxhcHBpbmcgc3Vic3BhbnMgYXJlIGlnbm9yZWQuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBQYXN0IHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgc3Bhbi4gU3RvcC5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgYWRkTm9kZShwYXJlbnQsIHNwYW5zVG9UcmVlKHtcbiAgICAgIHR5cGU6IHNwYW4udHlwZSxcbiAgICAgIGRhdGE6IHNwYW4uZGF0YSxcbiAgICAgIGtleTogc3Bhbi5rZXlcbiAgICB9LCB0ZXh0LCBzdGFydCwgc3Bhbi5lbmQsIHN1YnNwYW5zKSk7XG4gICAgc3RhcnQgPSBzcGFuLmVuZDtcbiAgfVxuXG4gIC8vIEFkZCB0aGUgbGFzdCB1bmZvcm1hdHRlZCByYW5nZS5cbiAgaWYgKHN0YXJ0IDwgZW5kKSB7XG4gICAgYWRkTm9kZShwYXJlbnQsIHtcbiAgICAgIHRleHQ6IHRleHQuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcGFyZW50O1xufVxuXG4vLyBBcHBlbmQgYSB0cmVlIHRvIGEgRHJhZnR5IGRvYy5cbmZ1bmN0aW9uIHRyZWVUb0RyYWZ0eShkb2MsIHRyZWUsIGtleW1hcCkge1xuICBpZiAoIXRyZWUpIHtcbiAgICByZXR1cm4gZG9jO1xuICB9XG5cbiAgZG9jLnR4dCA9IGRvYy50eHQgfHwgJyc7XG5cbiAgLy8gQ2hlY2twb2ludCB0byBtZWFzdXJlIGxlbmd0aCBvZiB0aGUgY3VycmVudCB0cmVlIG5vZGUuXG4gIGNvbnN0IHN0YXJ0ID0gZG9jLnR4dC5sZW5ndGg7XG5cbiAgaWYgKHRyZWUudGV4dCkge1xuICAgIGRvYy50eHQgKz0gdHJlZS50ZXh0O1xuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodHJlZS5jaGlsZHJlbikpIHtcbiAgICB0cmVlLmNoaWxkcmVuLmZvckVhY2goKGMpID0+IHtcbiAgICAgIHRyZWVUb0RyYWZ0eShkb2MsIGMsIGtleW1hcCk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodHJlZS50eXBlKSB7XG4gICAgY29uc3QgbGVuID0gZG9jLnR4dC5sZW5ndGggLSBzdGFydDtcbiAgICBkb2MuZm10ID0gZG9jLmZtdCB8fCBbXTtcbiAgICBpZiAoT2JqZWN0LmtleXModHJlZS5kYXRhIHx8IHt9KS5sZW5ndGggPiAwKSB7XG4gICAgICBkb2MuZW50ID0gZG9jLmVudCB8fCBbXTtcbiAgICAgIGNvbnN0IG5ld0tleSA9ICh0eXBlb2Yga2V5bWFwW3RyZWUua2V5XSA9PSAndW5kZWZpbmVkJykgPyBkb2MuZW50Lmxlbmd0aCA6IGtleW1hcFt0cmVlLmtleV07XG4gICAgICBrZXltYXBbdHJlZS5rZXldID0gbmV3S2V5O1xuICAgICAgZG9jLmVudFtuZXdLZXldID0ge1xuICAgICAgICB0cDogdHJlZS50eXBlLFxuICAgICAgICBkYXRhOiB0cmVlLmRhdGFcbiAgICAgIH07XG4gICAgICBpZiAodHJlZS5hdHQpIHtcbiAgICAgICAgLy8gQXR0YWNobWVudC5cbiAgICAgICAgZG9jLmZtdC5wdXNoKHtcbiAgICAgICAgICBhdDogLTEsXG4gICAgICAgICAgbGVuOiAwLFxuICAgICAgICAgIGtleTogbmV3S2V5XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9jLmZtdC5wdXNoKHtcbiAgICAgICAgICBhdDogc3RhcnQsXG4gICAgICAgICAgbGVuOiBsZW4sXG4gICAgICAgICAga2V5OiBuZXdLZXlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvYy5mbXQucHVzaCh7XG4gICAgICAgIHRwOiB0cmVlLnR5cGUsXG4gICAgICAgIGF0OiBzdGFydCxcbiAgICAgICAgbGVuOiBsZW5cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZG9jO1xufVxuXG4vLyBUcmF2ZXJzZSB0aGUgdHJlZSB0b3AgZG93biB0cmFuc2Zvcm1pbmcgdGhlIG5vZGVzOiBhcHBseSB0cmFuc2Zvcm1lciB0byBldmVyeSB0cmVlIG5vZGUuXG5mdW5jdGlvbiB0cmVlVG9wRG93bihzcmMsIHRyYW5zZm9ybWVyLCBjb250ZXh0KSB7XG4gIGlmICghc3JjKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBsZXQgZHN0ID0gdHJhbnNmb3JtZXIuY2FsbChjb250ZXh0LCBzcmMpO1xuICBpZiAoIWRzdCB8fCAhZHN0LmNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIGRzdDtcbiAgfVxuXG4gIGNvbnN0IGNoaWxkcmVuID0gW107XG4gIGZvciAobGV0IGkgaW4gZHN0LmNoaWxkcmVuKSB7XG4gICAgbGV0IG4gPSBkc3QuY2hpbGRyZW5baV07XG4gICAgaWYgKG4pIHtcbiAgICAgIG4gPSB0cmVlVG9wRG93bihuLCB0cmFuc2Zvcm1lciwgY29udGV4dCk7XG4gICAgICBpZiAobikge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKG4pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChjaGlsZHJlbi5sZW5ndGggPT0gMCkge1xuICAgIGRzdC5jaGlsZHJlbiA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgZHN0LmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICByZXR1cm4gZHN0O1xufVxuXG4vLyBUcmF2ZXJzZSB0aGUgdHJlZSBib3R0b20tdXA6IGFwcGx5IGZvcm1hdHRlciB0byBldmVyeSBub2RlLlxuLy8gVGhlIGZvcm1hdHRlciBtdXN0IG1haW50YWluIGl0cyBzdGF0ZSB0aHJvdWdoIGNvbnRleHQuXG5mdW5jdGlvbiB0cmVlQm90dG9tVXAoc3JjLCBmb3JtYXR0ZXIsIGluZGV4LCBzdGFjaywgY29udGV4dCkge1xuICBpZiAoIXNyYykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKHN0YWNrICYmIHNyYy50eXBlKSB7XG4gICAgc3RhY2sucHVzaChzcmMudHlwZSk7XG4gIH1cblxuICBsZXQgdmFsdWVzID0gW107XG4gIGZvciAobGV0IGkgaW4gc3JjLmNoaWxkcmVuKSB7XG4gICAgY29uc3QgbiA9IHRyZWVCb3R0b21VcChzcmMuY2hpbGRyZW5baV0sIGZvcm1hdHRlciwgaSwgc3RhY2ssIGNvbnRleHQpO1xuICAgIGlmIChuKSB7XG4gICAgICB2YWx1ZXMucHVzaChuKTtcbiAgICB9XG4gIH1cbiAgaWYgKHZhbHVlcy5sZW5ndGggPT0gMCkge1xuICAgIGlmIChzcmMudGV4dCkge1xuICAgICAgdmFsdWVzID0gW3NyYy50ZXh0XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWVzID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBpZiAoc3RhY2sgJiYgc3JjLnR5cGUpIHtcbiAgICBzdGFjay5wb3AoKTtcbiAgfVxuXG4gIHJldHVybiBmb3JtYXR0ZXIuY2FsbChjb250ZXh0LCBzcmMudHlwZSwgc3JjLmRhdGEsIHZhbHVlcywgaW5kZXgsIHN0YWNrKTtcbn1cblxuLy8gQ2xpcCB0cmVlIHRvIHRoZSBwcm92aWRlZCBsaW1pdC5cbmZ1bmN0aW9uIHNob3J0ZW5UcmVlKHRyZWUsIGxpbWl0LCB0YWlsKSB7XG4gIGlmICghdHJlZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKHRhaWwpIHtcbiAgICBsaW1pdCAtPSB0YWlsLmxlbmd0aDtcbiAgfVxuXG4gIGNvbnN0IHNob3J0ZW5lciA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBpZiAobGltaXQgPD0gLTEpIHtcbiAgICAgIC8vIExpbWl0IC0xIG1lYW5zIHRoZSBkb2Mgd2FzIGFscmVhZHkgY2xpcHBlZC5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChub2RlLmF0dCkge1xuICAgICAgLy8gQXR0YWNobWVudHMgYXJlIHVuY2hhbmdlZC5cbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICBpZiAobGltaXQgPT0gMCkge1xuICAgICAgbm9kZS50ZXh0ID0gdGFpbDtcbiAgICAgIGxpbWl0ID0gLTE7XG4gICAgfSBlbHNlIGlmIChub2RlLnRleHQpIHtcbiAgICAgIGNvbnN0IGxlbiA9IG5vZGUudGV4dC5sZW5ndGg7XG4gICAgICBpZiAobGVuID4gbGltaXQpIHtcbiAgICAgICAgbm9kZS50ZXh0ID0gbm9kZS50ZXh0LnN1YnN0cmluZygwLCBsaW1pdCkgKyB0YWlsO1xuICAgICAgICBsaW1pdCA9IC0xO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGltaXQgLT0gbGVuO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHJldHVybiB0cmVlVG9wRG93bih0cmVlLCBzaG9ydGVuZXIpO1xufVxuXG4vLyBTdHJpcCBoZWF2eSBlbnRpdGllcyBmcm9tIGEgdHJlZS5cbmZ1bmN0aW9uIGxpZ2h0RW50aXR5KHRyZWUpIHtcbiAgY29uc3QgbGlnaHRDb3B5ID0gZnVuY3Rpb24obm9kZSkge1xuICAgIGNvbnN0IGRhdGEgPSBjb3B5RW50RGF0YShub2RlLmRhdGEsIHRydWUpO1xuICAgIGlmIChkYXRhKSB7XG4gICAgICBub2RlLmRhdGEgPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgbm9kZS5kYXRhO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICByZXR1cm4gdHJlZVRvcERvd24odHJlZSwgbGlnaHRDb3B5KTtcbn1cblxuLy8gUmVtb3ZlIHNwYWNlcyBhbmQgYnJlYWtzIG9uIHRoZSBsZWZ0LlxuZnVuY3Rpb24gbFRyaW0odHJlZSkge1xuICBpZiAodHJlZS50eXBlID09ICdCUicpIHtcbiAgICB0cmVlID0gbnVsbDtcbiAgfSBlbHNlIGlmICh0cmVlLnRleHQpIHtcbiAgICBpZiAoIXRyZWUudHlwZSkge1xuICAgICAgdHJlZS50ZXh0ID0gdHJlZS50ZXh0LnRyaW1TdGFydCgpO1xuICAgICAgaWYgKCF0cmVlLnRleHQpIHtcbiAgICAgICAgdHJlZSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHRyZWUuY2hpbGRyZW4gJiYgdHJlZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgYyA9IGxUcmltKHRyZWUuY2hpbGRyZW5bMF0pO1xuICAgIGlmIChjKSB7XG4gICAgICB0cmVlLmNoaWxkcmVuWzBdID0gYztcbiAgICB9IGVsc2Uge1xuICAgICAgdHJlZS5jaGlsZHJlbi5zaGlmdCgpO1xuICAgICAgaWYgKCF0cmVlLnR5cGUgJiYgdHJlZS5jaGlsZHJlbi5sZW5ndGggPT0gMCkge1xuICAgICAgICB0cmVlID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRyZWU7XG59XG5cbi8vIE1vdmUgYXR0YWNobWVudHMgdG8gdGhlIGVuZC4gQXR0YWNobWVudHMgbXVzdCBiZSBhdCB0aGUgdG9wIGxldmVsLCBubyBuZWVkIHRvIHRyYXZlcnNlIHRoZSB0cmVlLlxuZnVuY3Rpb24gYXR0YWNobWVudHNUb0VuZCh0cmVlLCBsaW1pdCkge1xuICBpZiAoIXRyZWUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmICh0cmVlLmF0dCkge1xuICAgIHRyZWUudGV4dCA9ICcgJztcbiAgICBkZWxldGUgdHJlZS5hdHQ7XG4gICAgZGVsZXRlIHRyZWUuY2hpbGRyZW47XG4gIH0gZWxzZSBpZiAodHJlZS5jaGlsZHJlbikge1xuICAgIGNvbnN0IGF0dGFjaG1lbnRzID0gW107XG4gICAgY29uc3QgY2hpbGRyZW4gPSBbXTtcbiAgICBmb3IgKGxldCBpIGluIHRyZWUuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGMgPSB0cmVlLmNoaWxkcmVuW2ldO1xuICAgICAgaWYgKGMuYXR0KSB7XG4gICAgICAgIGlmIChhdHRhY2htZW50cy5sZW5ndGggPT0gbGltaXQpIHtcbiAgICAgICAgICAvLyBUb28gbWFueSBhdHRhY2htZW50cyB0byBwcmV2aWV3O1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjLmRhdGFbJ21pbWUnXSA9PSBKU09OX01JTUVfVFlQRSkge1xuICAgICAgICAgIC8vIEpTT04gYXR0YWNobWVudHMgYXJlIG5vdCBzaG93biBpbiBwcmV2aWV3LlxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIGMuYXR0O1xuICAgICAgICBkZWxldGUgYy5jaGlsZHJlbjtcbiAgICAgICAgYy50ZXh0ID0gJyAnO1xuICAgICAgICBhdHRhY2htZW50cy5wdXNoKGMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hpbGRyZW4ucHVzaChjKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdHJlZS5jaGlsZHJlbiA9IGNoaWxkcmVuLmNvbmNhdChhdHRhY2htZW50cyk7XG4gIH1cbiAgcmV0dXJuIHRyZWU7XG59XG5cbi8vIEdldCBhIGxpc3Qgb2YgZW50aXRpZXMgZnJvbSBhIHRleHQuXG5mdW5jdGlvbiBleHRyYWN0RW50aXRpZXMobGluZSkge1xuICBsZXQgbWF0Y2g7XG4gIGxldCBleHRyYWN0ZWQgPSBbXTtcbiAgRU5USVRZX1RZUEVTLmZvckVhY2goKGVudGl0eSkgPT4ge1xuICAgIHdoaWxlICgobWF0Y2ggPSBlbnRpdHkucmUuZXhlYyhsaW5lKSkgIT09IG51bGwpIHtcbiAgICAgIGV4dHJhY3RlZC5wdXNoKHtcbiAgICAgICAgb2Zmc2V0OiBtYXRjaFsnaW5kZXgnXSxcbiAgICAgICAgbGVuOiBtYXRjaFswXS5sZW5ndGgsXG4gICAgICAgIHVuaXF1ZTogbWF0Y2hbMF0sXG4gICAgICAgIGRhdGE6IGVudGl0eS5wYWNrKG1hdGNoWzBdKSxcbiAgICAgICAgdHlwZTogZW50aXR5Lm5hbWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKGV4dHJhY3RlZC5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBleHRyYWN0ZWQ7XG4gIH1cblxuICAvLyBSZW1vdmUgZW50aXRpZXMgZGV0ZWN0ZWQgaW5zaWRlIG90aGVyIGVudGl0aWVzLCBsaWtlICNoYXNodGFnIGluIGEgVVJMLlxuICBleHRyYWN0ZWQuc29ydCgoYSwgYikgPT4ge1xuICAgIHJldHVybiBhLm9mZnNldCAtIGIub2Zmc2V0O1xuICB9KTtcblxuICBsZXQgaWR4ID0gLTE7XG4gIGV4dHJhY3RlZCA9IGV4dHJhY3RlZC5maWx0ZXIoKGVsKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gKGVsLm9mZnNldCA+IGlkeCk7XG4gICAgaWR4ID0gZWwub2Zmc2V0ICsgZWwubGVuO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0pO1xuXG4gIHJldHVybiBleHRyYWN0ZWQ7XG59XG5cbi8vIENvbnZlcnQgdGhlIGNodW5rcyBpbnRvIGZvcm1hdCBzdWl0YWJsZSBmb3Igc2VyaWFsaXphdGlvbi5cbmZ1bmN0aW9uIGRyYWZ0aWZ5KGNodW5rcywgc3RhcnRBdCkge1xuICBsZXQgcGxhaW4gPSAnJztcbiAgbGV0IHJhbmdlcyA9IFtdO1xuICBmb3IgKGxldCBpIGluIGNodW5rcykge1xuICAgIGNvbnN0IGNodW5rID0gY2h1bmtzW2ldO1xuICAgIGlmICghY2h1bmsudHh0KSB7XG4gICAgICBjb25zdCBkcmFmdHkgPSBkcmFmdGlmeShjaHVuay5jaGlsZHJlbiwgcGxhaW4ubGVuZ3RoICsgc3RhcnRBdCk7XG4gICAgICBjaHVuay50eHQgPSBkcmFmdHkudHh0O1xuICAgICAgcmFuZ2VzID0gcmFuZ2VzLmNvbmNhdChkcmFmdHkuZm10KTtcbiAgICB9XG5cbiAgICBpZiAoY2h1bmsudHApIHtcbiAgICAgIHJhbmdlcy5wdXNoKHtcbiAgICAgICAgYXQ6IHBsYWluLmxlbmd0aCArIHN0YXJ0QXQsXG4gICAgICAgIGxlbjogY2h1bmsudHh0Lmxlbmd0aCxcbiAgICAgICAgdHA6IGNodW5rLnRwXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwbGFpbiArPSBjaHVuay50eHQ7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0eHQ6IHBsYWluLFxuICAgIGZtdDogcmFuZ2VzXG4gIH07XG59XG5cbi8vIENyZWF0ZSBhIGNvcHkgb2YgZW50aXR5IGRhdGEgd2l0aCAobGlnaHQ9ZmFsc2UpIG9yIHdpdGhvdXQgKGxpZ2h0PXRydWUpIHRoZSBsYXJnZSBwYXlsb2FkLlxuLy8gVGhlIGFycmF5ICdhbGxvdycgY29udGFpbnMgYSBsaXN0IG9mIGZpZWxkcyBleGVtcHQgZnJvbSBzdHJpcHBpbmcuXG5mdW5jdGlvbiBjb3B5RW50RGF0YShkYXRhLCBsaWdodCwgYWxsb3cpIHtcbiAgaWYgKGRhdGEgJiYgT2JqZWN0LmVudHJpZXMoZGF0YSkubGVuZ3RoID4gMCkge1xuICAgIGFsbG93ID0gYWxsb3cgfHwgW107XG4gICAgY29uc3QgZGMgPSB7fTtcbiAgICBBTExPV0VEX0VOVF9GSUVMRFMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAoZGF0YVtrZXldKSB7XG4gICAgICAgIGlmIChsaWdodCAmJiAhYWxsb3cuaW5jbHVkZXMoa2V5KSAmJlxuICAgICAgICAgICh0eXBlb2YgZGF0YVtrZXldID09ICdzdHJpbmcnIHx8IEFycmF5LmlzQXJyYXkoZGF0YVtrZXldKSkgJiZcbiAgICAgICAgICBkYXRhW2tleV0ubGVuZ3RoID4gTUFYX1BSRVZJRVdfREFUQV9TSVpFKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YVtrZXldID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRjW2tleV0gPSBkYXRhW2tleV07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoT2JqZWN0LmVudHJpZXMoZGMpLmxlbmd0aCAhPSAwKSB7XG4gICAgICByZXR1cm4gZGM7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IERyYWZ0eTtcbn1cbiIsIi8qKlxuICogQGZpbGUgVXRpbGl0aWVzIGZvciB1cGxvYWRpbmcgYW5kIGRvd25sb2FkaW5nIGZpbGVzLlxuICpcbiAqIEBjb3B5cmlnaHQgMjAxNS0yMDIyIFRpbm9kZSBMTEMuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtcbiAganNvblBhcnNlSGVscGVyXG59IGZyb20gJy4vdXRpbHMuanMnO1xuXG5sZXQgWEhSUHJvdmlkZXI7XG5cbi8qKlxuICogQGNsYXNzIExhcmdlRmlsZUhlbHBlciAtIHV0aWxpdGllcyBmb3IgdXBsb2FkaW5nIGFuZCBkb3dubG9hZGluZyBmaWxlcyBvdXQgb2YgYmFuZC5cbiAqIERvbid0IGluc3RhbnRpYXRlIHRoaXMgY2xhc3MgZGlyZWN0bHkuIFVzZSB7VGlub2RlLmdldExhcmdlRmlsZUhlbHBlcn0gaW5zdGVhZC5cbiAqIEBtZW1iZXJvZiBUaW5vZGVcbiAqXG4gKiBAcGFyYW0ge1Rpbm9kZX0gdGlub2RlIC0gdGhlIG1haW4gVGlub2RlIG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB2ZXJzaW9uIC0gcHJvdG9jb2wgdmVyc2lvbiwgaS5lLiAnMCcuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExhcmdlRmlsZUhlbHBlciB7XG4gIGNvbnN0cnVjdG9yKHRpbm9kZSwgdmVyc2lvbikge1xuICAgIHRoaXMuX3Rpbm9kZSA9IHRpbm9kZTtcbiAgICB0aGlzLl92ZXJzaW9uID0gdmVyc2lvbjtcblxuICAgIHRoaXMuX2FwaUtleSA9IHRpbm9kZS5fYXBpS2V5O1xuICAgIHRoaXMuX2F1dGhUb2tlbiA9IHRpbm9kZS5nZXRBdXRoVG9rZW4oKTtcbiAgICB0aGlzLl9yZXFJZCA9IHRpbm9kZS5nZXROZXh0VW5pcXVlSWQoKTtcbiAgICB0aGlzLnhociA9IG5ldyBYSFJQcm92aWRlcigpO1xuXG4gICAgLy8gUHJvbWlzZVxuICAgIHRoaXMudG9SZXNvbHZlID0gbnVsbDtcbiAgICB0aGlzLnRvUmVqZWN0ID0gbnVsbDtcblxuICAgIC8vIENhbGxiYWNrc1xuICAgIHRoaXMub25Qcm9ncmVzcyA9IG51bGw7XG4gICAgdGhpcy5vblN1Y2Nlc3MgPSBudWxsO1xuICAgIHRoaXMub25GYWlsdXJlID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCB1cGxvYWRpbmcgdGhlIGZpbGUgdG8gYSBub24tZGVmYXVsdCBlbmRwb2ludC5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZS5MYXJnZUZpbGVIZWxwZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBiYXNlVXJsIGFsdGVybmF0aXZlIGJhc2UgVVJMIG9mIHVwbG9hZCBzZXJ2ZXIuXG4gICAqIEBwYXJhbSB7RmlsZXxCbG9ifSBkYXRhIHRvIHVwbG9hZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGF2YXRhckZvciB0b3BpYyBuYW1lIGlmIHRoZSB1cGxvYWQgcmVwcmVzZW50cyBhbiBhdmF0YXIuXG4gICAqIEBwYXJhbSB7Q2FsbGJhY2t9IG9uUHJvZ3Jlc3MgY2FsbGJhY2suIFRha2VzIG9uZSB7ZmxvYXR9IHBhcmFtZXRlciAwLi4xXG4gICAqIEBwYXJhbSB7Q2FsbGJhY2t9IG9uU3VjY2VzcyBjYWxsYmFjay4gQ2FsbGVkIHdoZW4gdGhlIGZpbGUgaXMgc3VjY2Vzc2Z1bGx5IHVwbG9hZGVkLlxuICAgKiBAcGFyYW0ge0NhbGxiYWNrfSBvbkZhaWx1cmUgY2FsbGJhY2suIENhbGxlZCBpbiBjYXNlIG9mIGEgZmFpbHVyZS5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHVwbG9hZCBpcyBjb21wbGV0ZWQvZmFpbGVkLlxuICAgKi9cbiAgdXBsb2FkV2l0aEJhc2VVcmwoYmFzZVVybCwgZGF0YSwgYXZhdGFyRm9yLCBvblByb2dyZXNzLCBvblN1Y2Nlc3MsIG9uRmFpbHVyZSkge1xuICAgIGlmICghdGhpcy5fYXV0aFRva2VuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGF1dGhlbnRpY2F0ZSBmaXJzdFwiKTtcbiAgICB9XG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzO1xuXG4gICAgbGV0IHVybCA9IGAvdiR7dGhpcy5fdmVyc2lvbn0vZmlsZS91L2A7XG4gICAgaWYgKGJhc2VVcmwpIHtcbiAgICAgIGxldCBiYXNlID0gYmFzZVVybDtcbiAgICAgIGlmIChiYXNlLmVuZHNXaXRoKCcvJykpIHtcbiAgICAgICAgLy8gUmVtb3ZpbmcgdHJhaWxpbmcgc2xhc2guXG4gICAgICAgIGJhc2UgPSBiYXNlLnNsaWNlKDAsIC0xKTtcbiAgICAgIH1cbiAgICAgIGlmIChiYXNlLnN0YXJ0c1dpdGgoJ2h0dHA6Ly8nKSB8fCBiYXNlLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykpIHtcbiAgICAgICAgdXJsID0gYmFzZSArIHVybDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBiYXNlIFVSTCAnJHtiYXNlVXJsfSdgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy54aHIub3BlbignUE9TVCcsIHVybCwgdHJ1ZSk7XG4gICAgdGhpcy54aHIuc2V0UmVxdWVzdEhlYWRlcignWC1UaW5vZGUtQVBJS2V5JywgdGhpcy5fYXBpS2V5KTtcbiAgICB0aGlzLnhoci5zZXRSZXF1ZXN0SGVhZGVyKCdYLVRpbm9kZS1BdXRoJywgYFRva2VuICR7dGhpcy5fYXV0aFRva2VuLnRva2VufWApO1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMudG9SZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMudG9SZWplY3QgPSByZWplY3Q7XG4gICAgfSk7XG5cbiAgICB0aGlzLm9uUHJvZ3Jlc3MgPSBvblByb2dyZXNzO1xuICAgIHRoaXMub25TdWNjZXNzID0gb25TdWNjZXNzO1xuICAgIHRoaXMub25GYWlsdXJlID0gb25GYWlsdXJlO1xuXG4gICAgdGhpcy54aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSAmJiBpbnN0YW5jZS5vblByb2dyZXNzKSB7XG4gICAgICAgIGluc3RhbmNlLm9uUHJvZ3Jlc3MoZS5sb2FkZWQgLyBlLnRvdGFsKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy54aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgcGt0O1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGt0ID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlLCBqc29uUGFyc2VIZWxwZXIpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGluc3RhbmNlLl90aW5vZGUubG9nZ2VyKFwiRVJST1I6IEludmFsaWQgc2VydmVyIHJlc3BvbnNlIGluIExhcmdlRmlsZUhlbHBlclwiLCB0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgcGt0ID0ge1xuICAgICAgICAgIGN0cmw6IHtcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuc3RhdHVzLFxuICAgICAgICAgICAgdGV4dDogdGhpcy5zdGF0dXNUZXh0XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS50b1Jlc29sdmUpIHtcbiAgICAgICAgICBpbnN0YW5jZS50b1Jlc29sdmUocGt0LmN0cmwucGFyYW1zLnVybCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluc3RhbmNlLm9uU3VjY2Vzcykge1xuICAgICAgICAgIGluc3RhbmNlLm9uU3VjY2Vzcyhwa3QuY3RybCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS50b1JlamVjdCkge1xuICAgICAgICAgIGluc3RhbmNlLnRvUmVqZWN0KG5ldyBFcnJvcihgJHtwa3QuY3RybC50ZXh0fSAoJHtwa3QuY3RybC5jb2RlfSlgKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluc3RhbmNlLm9uRmFpbHVyZSkge1xuICAgICAgICAgIGluc3RhbmNlLm9uRmFpbHVyZShwa3QuY3RybCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluc3RhbmNlLl90aW5vZGUubG9nZ2VyKFwiRVJST1I6IFVuZXhwZWN0ZWQgc2VydmVyIHJlc3BvbnNlIHN0YXR1c1wiLCB0aGlzLnN0YXR1cywgdGhpcy5yZXNwb25zZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMueGhyLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoaW5zdGFuY2UudG9SZWplY3QpIHtcbiAgICAgICAgaW5zdGFuY2UudG9SZWplY3QobmV3IEVycm9yKFwiZmFpbGVkXCIpKTtcbiAgICAgIH1cbiAgICAgIGlmIChpbnN0YW5jZS5vbkZhaWx1cmUpIHtcbiAgICAgICAgaW5zdGFuY2Uub25GYWlsdXJlKG51bGwpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnhoci5vbmFib3J0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGluc3RhbmNlLnRvUmVqZWN0KSB7XG4gICAgICAgIGluc3RhbmNlLnRvUmVqZWN0KG5ldyBFcnJvcihcInVwbG9hZCBjYW5jZWxsZWQgYnkgdXNlclwiKSk7XG4gICAgICB9XG4gICAgICBpZiAoaW5zdGFuY2Uub25GYWlsdXJlKSB7XG4gICAgICAgIGluc3RhbmNlLm9uRmFpbHVyZShudWxsKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgIGZvcm0uYXBwZW5kKCdmaWxlJywgZGF0YSk7XG4gICAgICBmb3JtLnNldCgnaWQnLCB0aGlzLl9yZXFJZCk7XG4gICAgICBpZiAoYXZhdGFyRm9yKSB7XG4gICAgICAgIGZvcm0uc2V0KCd0b3BpYycsIGF2YXRhckZvcik7XG4gICAgICB9XG4gICAgICB0aGlzLnhoci5zZW5kKGZvcm0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKHRoaXMudG9SZWplY3QpIHtcbiAgICAgICAgdGhpcy50b1JlamVjdChlcnIpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub25GYWlsdXJlKSB7XG4gICAgICAgIHRoaXMub25GYWlsdXJlKG51bGwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgLyoqXG4gICAqIFN0YXJ0IHVwbG9hZGluZyB0aGUgZmlsZSB0byBkZWZhdWx0IGVuZHBvaW50LlxuICAgKlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLkxhcmdlRmlsZUhlbHBlciNcbiAgICpcbiAgICogQHBhcmFtIHtGaWxlfEJsb2J9IGRhdGEgdG8gdXBsb2FkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdmF0YXJGb3IgdG9waWMgbmFtZSBpZiB0aGUgdXBsb2FkIHJlcHJlc2VudHMgYW4gYXZhdGFyLlxuICAgKiBAcGFyYW0ge0NhbGxiYWNrfSBvblByb2dyZXNzIGNhbGxiYWNrLiBUYWtlcyBvbmUge2Zsb2F0fSBwYXJhbWV0ZXIgMC4uMVxuICAgKiBAcGFyYW0ge0NhbGxiYWNrfSBvblN1Y2Nlc3MgY2FsbGJhY2suIENhbGxlZCB3aGVuIHRoZSBmaWxlIGlzIHN1Y2Nlc3NmdWxseSB1cGxvYWRlZC5cbiAgICogQHBhcmFtIHtDYWxsYmFja30gb25GYWlsdXJlIGNhbGxiYWNrLiBDYWxsZWQgaW4gY2FzZSBvZiBhIGZhaWx1cmUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSB1cGxvYWQgaXMgY29tcGxldGVkL2ZhaWxlZC5cbiAgICovXG4gIHVwbG9hZChkYXRhLCBhdmF0YXJGb3IsIG9uUHJvZ3Jlc3MsIG9uU3VjY2Vzcywgb25GYWlsdXJlKSB7XG4gICAgY29uc3QgYmFzZVVybCA9ICh0aGlzLl90aW5vZGUuX3NlY3VyZSA/ICdodHRwczovLycgOiAnaHR0cDovLycpICsgdGhpcy5fdGlub2RlLl9ob3N0O1xuICAgIHJldHVybiB0aGlzLnVwbG9hZFdpdGhCYXNlVXJsKGJhc2VVcmwsIGRhdGEsIGF2YXRhckZvciwgb25Qcm9ncmVzcywgb25TdWNjZXNzLCBvbkZhaWx1cmUpO1xuICB9XG4gIC8qKlxuICAgKiBEb3dubG9hZCB0aGUgZmlsZSBmcm9tIGEgZ2l2ZW4gVVJMIHVzaW5nIEdFVCByZXF1ZXN0LiBUaGlzIG1ldGhvZCB3b3JrcyB3aXRoIHRoZSBUaW5vZGUgc2VydmVyIG9ubHkuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTGFyZ2VGaWxlSGVscGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVsYXRpdmVVcmwgLSBVUkwgdG8gZG93bmxvYWQgdGhlIGZpbGUgZnJvbS4gTXVzdCBiZSByZWxhdGl2ZSB1cmwsIGkuZS4gbXVzdCBub3QgY29udGFpbiB0aGUgaG9zdC5cbiAgICogQHBhcmFtIHtzdHJpbmc9fSBmaWxlbmFtZSAtIGZpbGUgbmFtZSB0byB1c2UgZm9yIHRoZSBkb3dubG9hZGVkIGZpbGUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBkb3dubG9hZCBpcyBjb21wbGV0ZWQvZmFpbGVkLlxuICAgKi9cbiAgZG93bmxvYWQocmVsYXRpdmVVcmwsIGZpbGVuYW1lLCBtaW1ldHlwZSwgb25Qcm9ncmVzcywgb25FcnJvcikge1xuICAgIGlmICghVGlub2RlLmlzUmVsYXRpdmVVUkwocmVsYXRpdmVVcmwpKSB7XG4gICAgICAvLyBBcyBhIHNlY3VyaXR5IG1lYXN1cmUgcmVmdXNlIHRvIGRvd25sb2FkIGZyb20gYW4gYWJzb2x1dGUgVVJMLlxuICAgICAgaWYgKG9uRXJyb3IpIHtcbiAgICAgICAgb25FcnJvcihgVGhlIFVSTCAnJHtyZWxhdGl2ZVVybH0nIG11c3QgYmUgcmVsYXRpdmUsIG5vdCBhYnNvbHV0ZWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2F1dGhUb2tlbikge1xuICAgICAgaWYgKG9uRXJyb3IpIHtcbiAgICAgICAgb25FcnJvcihcIk11c3QgYXV0aGVudGljYXRlIGZpcnN0XCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXM7XG4gICAgLy8gR2V0IGRhdGEgYXMgYmxvYiAoc3RvcmVkIGJ5IHRoZSBicm93c2VyIGFzIGEgdGVtcG9yYXJ5IGZpbGUpLlxuICAgIHRoaXMueGhyLm9wZW4oJ0dFVCcsIHJlbGF0aXZlVXJsLCB0cnVlKTtcbiAgICB0aGlzLnhoci5zZXRSZXF1ZXN0SGVhZGVyKCdYLVRpbm9kZS1BUElLZXknLCB0aGlzLl9hcGlLZXkpO1xuICAgIHRoaXMueGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtVGlub2RlLUF1dGgnLCAnVG9rZW4gJyArIHRoaXMuX2F1dGhUb2tlbi50b2tlbik7XG4gICAgdGhpcy54aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InO1xuXG4gICAgdGhpcy5vblByb2dyZXNzID0gb25Qcm9ncmVzcztcbiAgICB0aGlzLnhoci5vbnByb2dyZXNzID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGluc3RhbmNlLm9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgLy8gUGFzc2luZyBlLmxvYWRlZCBpbnN0ZWFkIG9mIGUubG9hZGVkL2UudG90YWwgYmVjYXVzZSBlLnRvdGFsXG4gICAgICAgIC8vIGlzIGFsd2F5cyAwIHdpdGggZ3ppcCBjb21wcmVzc2lvbiBlbmFibGVkIGJ5IHRoZSBzZXJ2ZXIuXG4gICAgICAgIGluc3RhbmNlLm9uUHJvZ3Jlc3MoZS5sb2FkZWQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCByZXN1bHQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLnRvUmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLnRvUmVqZWN0ID0gcmVqZWN0O1xuICAgIH0pO1xuXG4gICAgLy8gVGhlIGJsb2IgbmVlZHMgdG8gYmUgc2F2ZWQgYXMgZmlsZS4gVGhlcmUgaXMgbm8ga25vd24gd2F5IHRvXG4gICAgLy8gc2F2ZSB0aGUgYmxvYiBhcyBmaWxlIG90aGVyIHRoYW4gdG8gZmFrZSBhIGNsaWNrIG9uIGFuIDxhIGhyZWYuLi4gZG93bmxvYWQ9Li4uPi5cbiAgICB0aGlzLnhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgLy8gVVJMLmNyZWF0ZU9iamVjdFVSTCBpcyBub3QgYXZhaWxhYmxlIGluIG5vbi1icm93c2VyIGVudmlyb25tZW50LiBUaGlzIGNhbGwgd2lsbCBmYWlsLlxuICAgICAgICBsaW5rLmhyZWYgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbdGhpcy5yZXNwb25zZV0sIHtcbiAgICAgICAgICB0eXBlOiBtaW1ldHlwZVxuICAgICAgICB9KSk7XG4gICAgICAgIGxpbmsuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgbGluay5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgZmlsZW5hbWUpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpbmspO1xuICAgICAgICBsaW5rLmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobGluayk7XG4gICAgICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKGxpbmsuaHJlZik7XG4gICAgICAgIGlmIChpbnN0YW5jZS50b1Jlc29sdmUpIHtcbiAgICAgICAgICBpbnN0YW5jZS50b1Jlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXR1cyA+PSA0MDAgJiYgaW5zdGFuY2UudG9SZWplY3QpIHtcbiAgICAgICAgLy8gVGhlIHRoaXMucmVzcG9uc2VUZXh0IGlzIHVuZGVmaW5lZCwgbXVzdCB1c2UgdGhpcy5yZXNwb25zZSB3aGljaCBpcyBhIGJsb2IuXG4gICAgICAgIC8vIE5lZWQgdG8gY29udmVydCB0aGlzLnJlc3BvbnNlIHRvIEpTT04uIFRoZSBibG9iIGNhbiBvbmx5IGJlIGFjY2Vzc2VkIGJ5IHRoZVxuICAgICAgICAvLyBGaWxlUmVhZGVyLlxuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBrdCA9IEpTT04ucGFyc2UodGhpcy5yZXN1bHQsIGpzb25QYXJzZUhlbHBlcik7XG4gICAgICAgICAgICBpbnN0YW5jZS50b1JlamVjdChuZXcgRXJyb3IoYCR7cGt0LmN0cmwudGV4dH0gKCR7cGt0LmN0cmwuY29kZX0pYCkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgaW5zdGFuY2UuX3Rpbm9kZS5sb2dnZXIoXCJFUlJPUjogSW52YWxpZCBzZXJ2ZXIgcmVzcG9uc2UgaW4gTGFyZ2VGaWxlSGVscGVyXCIsIHRoaXMucmVzdWx0KTtcbiAgICAgICAgICAgIGluc3RhbmNlLnRvUmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dCh0aGlzLnJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy54aHIub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChpbnN0YW5jZS50b1JlamVjdCkge1xuICAgICAgICBpbnN0YW5jZS50b1JlamVjdChuZXcgRXJyb3IoXCJmYWlsZWRcIikpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnhoci5vbmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoaW5zdGFuY2UudG9SZWplY3QpIHtcbiAgICAgICAgaW5zdGFuY2UudG9SZWplY3QobnVsbCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICB0aGlzLnhoci5zZW5kKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAodGhpcy50b1JlamVjdCkge1xuICAgICAgICB0aGlzLnRvUmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICAvKipcbiAgICogVHJ5IHRvIGNhbmNlbCBhbiBvbmdvaW5nIHVwbG9hZCBvciBkb3dubG9hZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5MYXJnZUZpbGVIZWxwZXIjXG4gICAqL1xuICBjYW5jZWwoKSB7XG4gICAgaWYgKHRoaXMueGhyICYmIHRoaXMueGhyLnJlYWR5U3RhdGUgPCA0KSB7XG4gICAgICB0aGlzLnhoci5hYm9ydCgpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogR2V0IHVuaXF1ZSBpZCBvZiB0aGlzIHJlcXVlc3QuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTGFyZ2VGaWxlSGVscGVyI1xuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSB1bmlxdWUgaWRcbiAgICovXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLl9yZXFJZDtcbiAgfVxuICAvKipcbiAgICogVG8gdXNlIExhcmdlRmlsZUhlbHBlciBpbiBhIG5vbiBicm93c2VyIGNvbnRleHQsIHN1cHBseSBYTUxIdHRwUmVxdWVzdCBwcm92aWRlci5cbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyb2YgTGFyZ2VGaWxlSGVscGVyXG4gICAqIEBwYXJhbSB4aHJQcm92aWRlciBYTUxIdHRwUmVxdWVzdCBwcm92aWRlciwgZS5nLiBmb3Igbm9kZSA8Y29kZT5yZXF1aXJlKCd4aHInKTwvY29kZT4uXG4gICAqL1xuICBzdGF0aWMgc2V0TmV0d29ya1Byb3ZpZGVyKHhoclByb3ZpZGVyKSB7XG4gICAgWEhSUHJvdmlkZXIgPSB4aHJQcm92aWRlcjtcbiAgfVxufVxuIiwiLyoqXG4gKiBAZmlsZSBIZWxwZXIgY2xhc3MgZm9yIGNvbnN0cnVjdGluZyB7QGxpbmsgVGlub2RlLkdldFF1ZXJ5fS5cbiAqXG4gKiBAY29weXJpZ2h0IDIwMTUtMjAyMiBUaW5vZGUgTExDLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogSGVscGVyIGNsYXNzIGZvciBjb25zdHJ1Y3Rpbmcge0BsaW5rIFRpbm9kZS5HZXRRdWVyeX0uXG4gKlxuICogQGNsYXNzIE1ldGFHZXRCdWlsZGVyXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtUaW5vZGUuVG9waWN9IHBhcmVudCB0b3BpYyB3aGljaCBpbnN0YW50aWF0ZWQgdGhpcyBidWlsZGVyLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNZXRhR2V0QnVpbGRlciB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudCkge1xuICAgIHRoaXMudG9waWMgPSBwYXJlbnQ7XG4gICAgdGhpcy53aGF0ID0ge307XG4gIH1cblxuICAvLyBHZXQgdGltZXN0YW1wIG9mIHRoZSBtb3N0IHJlY2VudCBkZXNjIHVwZGF0ZS5cbiAgI19nZXRfZGVzY19pbXMoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9waWMudXBkYXRlZDtcbiAgfVxuXG4gIC8vIEdldCB0aW1lc3RhbXAgb2YgdGhlIG1vc3QgcmVjZW50IHN1YnMgdXBkYXRlLlxuICAjX2dldF9zdWJzX2ltcygpIHtcbiAgICBpZiAodGhpcy50b3BpYy5pc1AyUFR5cGUoKSkge1xuICAgICAgcmV0dXJuIHRoaXMuI19nZXRfZGVzY19pbXMoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudG9waWMuX2xhc3RTdWJzVXBkYXRlO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBtZXNzYWdlcyB3aXRoaW4gZXhwbGljaXQgbGltaXRzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IHNpbmNlIC0gbWVzc2FnZXMgbmV3ZXIgdGhhbiB0aGlzIChpbmNsdXNpdmUpO1xuICAgKiBAcGFyYW0ge251bWJlcj19IGJlZm9yZSAtIG9sZGVyIHRoYW4gdGhpcyAoZXhjbHVzaXZlKVxuICAgKiBAcGFyYW0ge251bWJlcj19IGxpbWl0IC0gbnVtYmVyIG9mIG1lc3NhZ2VzIHRvIGZldGNoXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhEYXRhKHNpbmNlLCBiZWZvcmUsIGxpbWl0KSB7XG4gICAgdGhpcy53aGF0WydkYXRhJ10gPSB7XG4gICAgICBzaW5jZTogc2luY2UsXG4gICAgICBiZWZvcmU6IGJlZm9yZSxcbiAgICAgIGxpbWl0OiBsaW1pdFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIG1lc3NhZ2VzIG5ld2VyIHRoYW4gdGhlIGxhdGVzdCBzYXZlZCBtZXNzYWdlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IGxpbWl0IC0gbnVtYmVyIG9mIG1lc3NhZ2VzIHRvIGZldGNoXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhMYXRlckRhdGEobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoRGF0YSh0aGlzLnRvcGljLl9tYXhTZXEgPiAwID8gdGhpcy50b3BpYy5fbWF4U2VxICsgMSA6IHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBsaW1pdCk7XG4gIH1cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIG1lc3NhZ2VzIG9sZGVyIHRoYW4gdGhlIGVhcmxpZXN0IHNhdmVkIG1lc3NhZ2UuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbGltaXQgLSBtYXhpbXVtIG51bWJlciBvZiBtZXNzYWdlcyB0byBmZXRjaC5cbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aEVhcmxpZXJEYXRhKGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aERhdGEodW5kZWZpbmVkLCB0aGlzLnRvcGljLl9taW5TZXEgPiAwID8gdGhpcy50b3BpYy5fbWluU2VxIDogdW5kZWZpbmVkLCBsaW1pdCk7XG4gIH1cbiAgLyoqXG4gICAqIEFkZCBxdWVyeSBwYXJhbWV0ZXJzIHRvIGZldGNoIHRvcGljIGRlc2NyaXB0aW9uIGlmIGl0J3MgbmV3ZXIgdGhhbiB0aGUgZ2l2ZW4gdGltZXN0YW1wLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge0RhdGU9fSBpbXMgLSBmZXRjaCBtZXNzYWdlcyBuZXdlciB0aGFuIHRoaXMgdGltZXN0YW1wLlxuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoRGVzYyhpbXMpIHtcbiAgICB0aGlzLndoYXRbJ2Rlc2MnXSA9IHtcbiAgICAgIGltczogaW1zXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggdG9waWMgZGVzY3JpcHRpb24gaWYgaXQncyBuZXdlciB0aGFuIHRoZSBsYXN0IHVwZGF0ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5NZXRhR2V0QnVpbGRlciNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aExhdGVyRGVzYygpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoRGVzYyh0aGlzLiNfZ2V0X2Rlc2NfaW1zKCkpO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBzdWJzY3JpcHRpb25zLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge0RhdGU9fSBpbXMgLSBmZXRjaCBzdWJzY3JpcHRpb25zIG1vZGlmaWVkIG1vcmUgcmVjZW50bHkgdGhhbiB0aGlzIHRpbWVzdGFtcFxuICAgKiBAcGFyYW0ge251bWJlcj19IGxpbWl0IC0gbWF4aW11bSBudW1iZXIgb2Ygc3Vic2NyaXB0aW9ucyB0byBmZXRjaC5cbiAgICogQHBhcmFtIHtzdHJpbmc9fSB1c2VyT3JUb3BpYyAtIHVzZXIgSUQgb3IgdG9waWMgbmFtZSB0byBmZXRjaCBmb3IgZmV0Y2hpbmcgb25lIHN1YnNjcmlwdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aFN1YihpbXMsIGxpbWl0LCB1c2VyT3JUb3BpYykge1xuICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICBpbXM6IGltcyxcbiAgICAgIGxpbWl0OiBsaW1pdFxuICAgIH07XG4gICAgaWYgKHRoaXMudG9waWMuZ2V0VHlwZSgpID09ICdtZScpIHtcbiAgICAgIG9wdHMudG9waWMgPSB1c2VyT3JUb3BpYztcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0cy51c2VyID0gdXNlck9yVG9waWM7XG4gICAgfVxuICAgIHRoaXMud2hhdFsnc3ViJ10gPSBvcHRzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBhIHNpbmdsZSBzdWJzY3JpcHRpb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7RGF0ZT19IGltcyAtIGZldGNoIHN1YnNjcmlwdGlvbnMgbW9kaWZpZWQgbW9yZSByZWNlbnRseSB0aGFuIHRoaXMgdGltZXN0YW1wXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gdXNlck9yVG9waWMgLSB1c2VyIElEIG9yIHRvcGljIG5hbWUgdG8gZmV0Y2ggZm9yIGZldGNoaW5nIG9uZSBzdWJzY3JpcHRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhPbmVTdWIoaW1zLCB1c2VyT3JUb3BpYykge1xuICAgIHJldHVybiB0aGlzLndpdGhTdWIoaW1zLCB1bmRlZmluZWQsIHVzZXJPclRvcGljKTtcbiAgfVxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggYSBzaW5nbGUgc3Vic2NyaXB0aW9uIGlmIGl0J3MgYmVlbiB1cGRhdGVkIHNpbmNlIHRoZSBsYXN0IHVwZGF0ZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5NZXRhR2V0QnVpbGRlciNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmc9fSB1c2VyT3JUb3BpYyAtIHVzZXIgSUQgb3IgdG9waWMgbmFtZSB0byBmZXRjaCBmb3IgZmV0Y2hpbmcgb25lIHN1YnNjcmlwdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aExhdGVyT25lU3ViKHVzZXJPclRvcGljKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aE9uZVN1Yih0aGlzLnRvcGljLl9sYXN0U3Vic1VwZGF0ZSwgdXNlck9yVG9waWMpO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBzdWJzY3JpcHRpb25zIHVwZGF0ZWQgc2luY2UgdGhlIGxhc3QgdXBkYXRlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IGxpbWl0IC0gbWF4aW11bSBudW1iZXIgb2Ygc3Vic2NyaXB0aW9ucyB0byBmZXRjaC5cbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aExhdGVyU3ViKGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aFN1Yih0aGlzLiNfZ2V0X3N1YnNfaW1zKCksIGxpbWl0KTtcbiAgfVxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggdG9waWMgdGFncy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5NZXRhR2V0QnVpbGRlciNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5NZXRhR2V0QnVpbGRlcn0gPGNvZGU+dGhpczwvY29kZT4gb2JqZWN0LlxuICAgKi9cbiAgd2l0aFRhZ3MoKSB7XG4gICAgdGhpcy53aGF0Wyd0YWdzJ10gPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCB1c2VyJ3MgY3JlZGVudGlhbHMuIDxjb2RlPidtZSc8L2NvZGU+IHRvcGljIG9ubHkuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IDxjb2RlPnRoaXM8L2NvZGU+IG9iamVjdC5cbiAgICovXG4gIHdpdGhDcmVkKCkge1xuICAgIGlmICh0aGlzLnRvcGljLmdldFR5cGUoKSA9PSAnbWUnKSB7XG4gICAgICB0aGlzLndoYXRbJ2NyZWQnXSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudG9waWMuX3Rpbm9kZS5sb2dnZXIoXCJFUlJPUjogSW52YWxpZCB0b3BpYyB0eXBlIGZvciBNZXRhR2V0QnVpbGRlcjp3aXRoQ3JlZHNcIiwgdGhpcy50b3BpYy5nZXRUeXBlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICAvKipcbiAgICogQWRkIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gZmV0Y2ggZGVsZXRlZCBtZXNzYWdlcyB3aXRoaW4gZXhwbGljaXQgbGltaXRzLiBBbnkvYWxsIHBhcmFtZXRlcnMgY2FuIGJlIG51bGwuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gc2luY2UgLSBpZHMgb2YgbWVzc2FnZXMgZGVsZXRlZCBzaW5jZSB0aGlzICdkZWwnIGlkIChpbmNsdXNpdmUpXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbGltaXQgLSBudW1iZXIgb2YgZGVsZXRlZCBtZXNzYWdlIGlkcyB0byBmZXRjaFxuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoRGVsKHNpbmNlLCBsaW1pdCkge1xuICAgIGlmIChzaW5jZSB8fCBsaW1pdCkge1xuICAgICAgdGhpcy53aGF0WydkZWwnXSA9IHtcbiAgICAgICAgc2luY2U6IHNpbmNlLFxuICAgICAgICBsaW1pdDogbGltaXRcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgcXVlcnkgcGFyYW1ldGVycyB0byBmZXRjaCBtZXNzYWdlcyBkZWxldGVkIGFmdGVyIHRoZSBzYXZlZCA8Y29kZT4nZGVsJzwvY29kZT4gaWQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbGltaXQgLSBudW1iZXIgb2YgZGVsZXRlZCBtZXNzYWdlIGlkcyB0byBmZXRjaFxuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLk1ldGFHZXRCdWlsZGVyfSA8Y29kZT50aGlzPC9jb2RlPiBvYmplY3QuXG4gICAqL1xuICB3aXRoTGF0ZXJEZWwobGltaXQpIHtcbiAgICAvLyBTcGVjaWZ5ICdzaW5jZScgb25seSBpZiB3ZSBoYXZlIGFscmVhZHkgcmVjZWl2ZWQgc29tZSBtZXNzYWdlcy4gSWZcbiAgICAvLyB3ZSBoYXZlIG5vIGxvY2FsbHkgY2FjaGVkIG1lc3NhZ2VzIHRoZW4gd2UgZG9uJ3QgY2FyZSBpZiBhbnkgbWVzc2FnZXMgd2VyZSBkZWxldGVkLlxuICAgIHJldHVybiB0aGlzLndpdGhEZWwodGhpcy50b3BpYy5fbWF4U2VxID4gMCA/IHRoaXMudG9waWMuX21heERlbCArIDEgOiB1bmRlZmluZWQsIGxpbWl0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0IHN1YnF1ZXJ5OiBnZXQgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgc3BlY2lmaWVkIHN1YnF1ZXJ5LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLk1ldGFHZXRCdWlsZGVyI1xuICAgKiBAcGFyYW0ge3N0cmluZ30gd2hhdCAtIHN1YnF1ZXJ5IHRvIHJldHVybjogb25lIG9mICdkYXRhJywgJ3N1YicsICdkZXNjJywgJ3RhZ3MnLCAnY3JlZCcsICdkZWwnLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSByZXF1ZXN0ZWQgc3VicXVlcnkgb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPi5cbiAgICovXG4gIGV4dHJhY3Qod2hhdCkge1xuICAgIHJldHVybiB0aGlzLndoYXRbd2hhdF07XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IHBhcmFtZXRlcnMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuTWV0YUdldEJ1aWxkZXIjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuR2V0UXVlcnl9IEdldCBxdWVyeVxuICAgKi9cbiAgYnVpbGQoKSB7XG4gICAgY29uc3Qgd2hhdCA9IFtdO1xuICAgIGxldCBwYXJhbXMgPSB7fTtcbiAgICBbJ2RhdGEnLCAnc3ViJywgJ2Rlc2MnLCAndGFncycsICdjcmVkJywgJ2RlbCddLm1hcCgoa2V5KSA9PiB7XG4gICAgICBpZiAodGhpcy53aGF0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgd2hhdC5wdXNoKGtleSk7XG4gICAgICAgIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0aGlzLndoYXRba2V5XSkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHBhcmFtc1trZXldID0gdGhpcy53aGF0W2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAod2hhdC5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhbXMud2hhdCA9IHdoYXQuam9pbignICcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbXMgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBwYXJhbXM7XG4gIH1cbn1cbiIsIi8qKlxuICogQGZpbGUgU0RLIHRvIGNvbm5lY3QgdG8gVGlub2RlIGNoYXQgc2VydmVyLlxuICogU2VlIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vdGlub2RlL3dlYmFwcFwiPmh0dHBzOi8vZ2l0aHViLmNvbS90aW5vZGUvd2ViYXBwPC9hPiBmb3IgcmVhbC1saWZlIHVzYWdlLlxuICpcbiAqIEBjb3B5cmlnaHQgMjAxNS0yMDIyIFRpbm9kZSBMTEMuXG4gKiBAc3VtbWFyeSBKYXZhc2NyaXB0IGJpbmRpbmdzIGZvciBUaW5vZGUuXG4gKiBAbGljZW5zZSBBcGFjaGUgMi4wXG4gKiBAdmVyc2lvbiAwLjE4XG4gKlxuICogQGV4YW1wbGVcbiAqIDxoZWFkPlxuICogPHNjcmlwdCBzcmM9XCIuLi4vdGlub2RlLmpzXCI+PC9zY3JpcHQ+XG4gKiA8L2hlYWQ+XG4gKlxuICogPGJvZHk+XG4gKiAgLi4uXG4gKiA8c2NyaXB0PlxuICogIC8vIEluc3RhbnRpYXRlIHRpbm9kZS5cbiAqICBjb25zdCB0aW5vZGUgPSBuZXcgVGlub2RlKGNvbmZpZywgKCkgPT4ge1xuICogICAgLy8gQ2FsbGVkIG9uIGluaXQgY29tcGxldGlvbi5cbiAqICB9KTtcbiAqICB0aW5vZGUuZW5hYmxlTG9nZ2luZyh0cnVlKTtcbiAqICB0aW5vZGUub25EaXNjb25uZWN0ID0gKGVycikgPT4ge1xuICogICAgLy8gSGFuZGxlIGRpc2Nvbm5lY3QuXG4gKiAgfTtcbiAqICAvLyBDb25uZWN0IHRvIHRoZSBzZXJ2ZXIuXG4gKiAgdGlub2RlLmNvbm5lY3QoJ2h0dHBzOi8vZXhhbXBsZS5jb20vJykudGhlbigoKSA9PiB7XG4gKiAgICAvLyBDb25uZWN0ZWQuIExvZ2luIG5vdy5cbiAqICAgIHJldHVybiB0aW5vZGUubG9naW5CYXNpYyhsb2dpbiwgcGFzc3dvcmQpO1xuICogIH0pLnRoZW4oKGN0cmwpID0+IHtcbiAqICAgIC8vIExvZ2dlZCBpbiBmaW5lLCBhdHRhY2ggY2FsbGJhY2tzLCBzdWJzY3JpYmUgdG8gJ21lJy5cbiAqICAgIGNvbnN0IG1lID0gdGlub2RlLmdldE1lVG9waWMoKTtcbiAqICAgIG1lLm9uTWV0YURlc2MgPSBmdW5jdGlvbihtZXRhKSB7IC4uLiB9O1xuICogICAgLy8gU3Vic2NyaWJlLCBmZXRjaCB0b3BpYyBkZXNjcmlwdGlvbiBhbmQgdGhlIGxpc3Qgb2YgY29udGFjdHMuXG4gKiAgICBtZS5zdWJzY3JpYmUoe2dldDoge2Rlc2M6IHt9LCBzdWI6IHt9fX0pO1xuICogIH0pLmNhdGNoKChlcnIpID0+IHtcbiAqICAgIC8vIExvZ2luIG9yIHN1YnNjcmlwdGlvbiBmYWlsZWQsIGRvIHNvbWV0aGluZy5cbiAqICAgIC4uLlxuICogIH0pO1xuICogIC4uLlxuICogPC9zY3JpcHQ+XG4gKiA8L2JvZHk+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLy8gTk9URSBUTyBERVZFTE9QRVJTOlxuLy8gTG9jYWxpemFibGUgc3RyaW5ncyBzaG91bGQgYmUgZG91YmxlIHF1b3RlZCBcItGB0YLRgNC+0LrQsCDQvdCwINC00YDRg9Cz0L7QvCDRj9C30YvQutC1XCIsXG4vLyBub24tbG9jYWxpemFibGUgc3RyaW5ncyBzaG91bGQgYmUgc2luZ2xlIHF1b3RlZCAnbm9uLWxvY2FsaXplZCcuXG5cbmltcG9ydCBBY2Nlc3NNb2RlIGZyb20gJy4vYWNjZXNzLW1vZGUuanMnO1xuaW1wb3J0ICogYXMgQ29uc3QgZnJvbSAnLi9jb25maWcuanMnO1xuaW1wb3J0IENvbm5lY3Rpb24gZnJvbSAnLi9jb25uZWN0aW9uLmpzJztcbmltcG9ydCBEQkNhY2hlIGZyb20gJy4vZGIuanMnO1xuaW1wb3J0IERyYWZ0eSBmcm9tICcuL2RyYWZ0eS5qcyc7XG5pbXBvcnQgTGFyZ2VGaWxlSGVscGVyIGZyb20gJy4vbGFyZ2UtZmlsZS5qcyc7XG5pbXBvcnQge1xuICBUb3BpYyxcbiAgVG9waWNNZSxcbiAgVG9waWNGbmRcbn0gZnJvbSAnLi90b3BpYy5qcyc7XG5cbmltcG9ydCB7XG4gIGpzb25QYXJzZUhlbHBlcixcbiAgbWVyZ2VPYmosXG4gIHJmYzMzMzlEYXRlU3RyaW5nLFxuICBzaW1wbGlmeVxufSBmcm9tICcuL3V0aWxzLmpzJztcblxubGV0IFdlYlNvY2tldFByb3ZpZGVyO1xuaWYgKHR5cGVvZiBXZWJTb2NrZXQgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgV2ViU29ja2V0UHJvdmlkZXIgPSBXZWJTb2NrZXQ7XG59XG5cbmxldCBYSFJQcm92aWRlcjtcbmlmICh0eXBlb2YgWE1MSHR0cFJlcXVlc3QgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgWEhSUHJvdmlkZXIgPSBYTUxIdHRwUmVxdWVzdDtcbn1cblxubGV0IEluZGV4ZWREQlByb3ZpZGVyO1xuaWYgKHR5cGVvZiBpbmRleGVkREIgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgSW5kZXhlZERCUHJvdmlkZXIgPSBpbmRleGVkREI7XG59XG5cbi8vIFJlLWV4cG9ydCBEcmFmdHkuXG5leHBvcnQge1xuICBEcmFmdHlcbn1cblxuaW5pdEZvck5vbkJyb3dzZXJBcHAoKTtcblxuLy8gVXRpbGl0eSBmdW5jdGlvbnNcblxuLy8gUG9seWZpbGwgZm9yIG5vbi1icm93c2VyIGNvbnRleHQsIGUuZy4gTm9kZUpzLlxuZnVuY3Rpb24gaW5pdEZvck5vbkJyb3dzZXJBcHAoKSB7XG4gIC8vIFRpbm9kZSByZXF1aXJlbWVudCBpbiBuYXRpdmUgbW9kZSBiZWNhdXNlIHJlYWN0IG5hdGl2ZSBkb2Vzbid0IHByb3ZpZGUgQmFzZTY0IG1ldGhvZFxuICBjb25zdCBjaGFycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPSc7XG5cbiAgaWYgKHR5cGVvZiBidG9hID09ICd1bmRlZmluZWQnKSB7XG4gICAgZ2xvYmFsLmJ0b2EgPSBmdW5jdGlvbihpbnB1dCA9ICcnKSB7XG4gICAgICBsZXQgc3RyID0gaW5wdXQ7XG4gICAgICBsZXQgb3V0cHV0ID0gJyc7XG5cbiAgICAgIGZvciAobGV0IGJsb2NrID0gMCwgY2hhckNvZGUsIGkgPSAwLCBtYXAgPSBjaGFyczsgc3RyLmNoYXJBdChpIHwgMCkgfHwgKG1hcCA9ICc9JywgaSAlIDEpOyBvdXRwdXQgKz0gbWFwLmNoYXJBdCg2MyAmIGJsb2NrID4+IDggLSBpICUgMSAqIDgpKSB7XG5cbiAgICAgICAgY2hhckNvZGUgPSBzdHIuY2hhckNvZGVBdChpICs9IDMgLyA0KTtcblxuICAgICAgICBpZiAoY2hhckNvZGUgPiAweEZGKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ2J0b2EnIGZhaWxlZDogVGhlIHN0cmluZyB0byBiZSBlbmNvZGVkIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3V0c2lkZSBvZiB0aGUgTGF0aW4xIHJhbmdlLlwiKTtcbiAgICAgICAgfVxuICAgICAgICBibG9jayA9IGJsb2NrIDw8IDggfCBjaGFyQ29kZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHR5cGVvZiBhdG9iID09ICd1bmRlZmluZWQnKSB7XG4gICAgZ2xvYmFsLmF0b2IgPSBmdW5jdGlvbihpbnB1dCA9ICcnKSB7XG4gICAgICBsZXQgc3RyID0gaW5wdXQucmVwbGFjZSgvPSskLywgJycpO1xuICAgICAgbGV0IG91dHB1dCA9ICcnO1xuXG4gICAgICBpZiAoc3RyLmxlbmd0aCAlIDQgPT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInYXRvYicgZmFpbGVkOiBUaGUgc3RyaW5nIHRvIGJlIGRlY29kZWQgaXMgbm90IGNvcnJlY3RseSBlbmNvZGVkLlwiKTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGJjID0gMCwgYnMgPSAwLCBidWZmZXIsIGkgPSAwOyBidWZmZXIgPSBzdHIuY2hhckF0KGkrKyk7XG5cbiAgICAgICAgfmJ1ZmZlciAmJiAoYnMgPSBiYyAlIDQgPyBicyAqIDY0ICsgYnVmZmVyIDogYnVmZmVyLFxuICAgICAgICAgIGJjKysgJSA0KSA/IG91dHB1dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDI1NSAmIGJzID4+ICgtMiAqIGJjICYgNikpIDogMFxuICAgICAgKSB7XG4gICAgICAgIGJ1ZmZlciA9IGNoYXJzLmluZGV4T2YoYnVmZmVyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBnbG9iYWwud2luZG93ID0ge1xuICAgICAgV2ViU29ja2V0OiBXZWJTb2NrZXRQcm92aWRlcixcbiAgICAgIFhNTEh0dHBSZXF1ZXN0OiBYSFJQcm92aWRlcixcbiAgICAgIGluZGV4ZWREQjogSW5kZXhlZERCUHJvdmlkZXIsXG4gICAgICBVUkw6IHtcbiAgICAgICAgY3JlYXRlT2JqZWN0VVJMOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gdXNlIFVSTC5jcmVhdGVPYmplY3RVUkwgaW4gYSBub24tYnJvd3NlciBhcHBsaWNhdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIENvbm5lY3Rpb24uc2V0TmV0d29ya1Byb3ZpZGVycyhXZWJTb2NrZXRQcm92aWRlciwgWEhSUHJvdmlkZXIpO1xuICBMYXJnZUZpbGVIZWxwZXIuc2V0TmV0d29ya1Byb3ZpZGVyKFhIUlByb3ZpZGVyKTtcbiAgREJDYWNoZS5zZXREYXRhYmFzZVByb3ZpZGVyKEluZGV4ZWREQlByb3ZpZGVyKTtcbn1cblxuLy8gRGV0ZWN0IGZpbmQgbW9zdCB1c2VmdWwgbmV0d29yayB0cmFuc3BvcnQuXG5mdW5jdGlvbiBkZXRlY3RUcmFuc3BvcnQoKSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ID09ICdvYmplY3QnKSB7XG4gICAgaWYgKHdpbmRvd1snV2ViU29ja2V0J10pIHtcbiAgICAgIHJldHVybiAnd3MnO1xuICAgIH0gZWxzZSBpZiAod2luZG93WydYTUxIdHRwUmVxdWVzdCddKSB7XG4gICAgICAvLyBUaGUgYnJvd3NlciBvciBub2RlIGhhcyBubyB3ZWJzb2NrZXRzLCB1c2luZyBsb25nIHBvbGxpbmcuXG4gICAgICByZXR1cm4gJ2xwJztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8vIGJ0b2EgcmVwbGFjZW1lbnQuIFN0b2NrIGJ0b2EgZmFpbHMgb24gb24gbm9uLUxhdGluMSBzdHJpbmdzLlxuZnVuY3Rpb24gYjY0RW5jb2RlVW5pY29kZShzdHIpIHtcbiAgLy8gVGhlIGVuY29kZVVSSUNvbXBvbmVudCBwZXJjZW50LWVuY29kZXMgVVRGLTggc3RyaW5nLFxuICAvLyB0aGVuIHRoZSBwZXJjZW50IGVuY29kaW5nIGlzIGNvbnZlcnRlZCBpbnRvIHJhdyBieXRlcyB3aGljaFxuICAvLyBjYW4gYmUgZmVkIGludG8gYnRvYS5cbiAgcmV0dXJuIGJ0b2EoZW5jb2RlVVJJQ29tcG9uZW50KHN0cikucmVwbGFjZSgvJShbMC05QS1GXXsyfSkvZyxcbiAgICBmdW5jdGlvbiB0b1NvbGlkQnl0ZXMobWF0Y2gsIHAxKSB7XG4gICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgnMHgnICsgcDEpO1xuICAgIH0pKTtcbn1cblxuLy8gSlNPTiBzdHJpbmdpZnkgaGVscGVyIC0gcHJlLXByb2Nlc3NvciBmb3IgSlNPTi5zdHJpbmdpZnlcbmZ1bmN0aW9uIGpzb25CdWlsZEhlbHBlcihrZXksIHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIC8vIENvbnZlcnQgamF2YXNjcmlwdCBEYXRlIG9iamVjdHMgdG8gcmZjMzMzOSBzdHJpbmdzXG4gICAgdmFsID0gcmZjMzMzOURhdGVTdHJpbmcodmFsKTtcbiAgfSBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBBY2Nlc3NNb2RlKSB7XG4gICAgdmFsID0gdmFsLmpzb25IZWxwZXIoKTtcbiAgfSBlbHNlIGlmICh2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09IG51bGwgfHwgdmFsID09PSBmYWxzZSB8fFxuICAgIChBcnJheS5pc0FycmF5KHZhbCkgJiYgdmFsLmxlbmd0aCA9PSAwKSB8fFxuICAgICgodHlwZW9mIHZhbCA9PSAnb2JqZWN0JykgJiYgKE9iamVjdC5rZXlzKHZhbCkubGVuZ3RoID09IDApKSkge1xuICAgIC8vIHN0cmlwIG91dCBlbXB0eSBlbGVtZW50cyB3aGlsZSBzZXJpYWxpemluZyBvYmplY3RzIHRvIEpTT05cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIHZhbDtcbn07XG5cbi8vIFRyaW1zIHZlcnkgbG9uZyBzdHJpbmdzIChlbmNvZGVkIGltYWdlcykgdG8gbWFrZSBsb2dnZWQgcGFja2V0cyBtb3JlIHJlYWRhYmxlLlxuZnVuY3Rpb24ganNvbkxvZ2dlckhlbHBlcihrZXksIHZhbCkge1xuICBpZiAodHlwZW9mIHZhbCA9PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMTI4KSB7XG4gICAgcmV0dXJuICc8JyArIHZhbC5sZW5ndGggKyAnLCBieXRlczogJyArIHZhbC5zdWJzdHJpbmcoMCwgMTIpICsgJy4uLicgKyB2YWwuc3Vic3RyaW5nKHZhbC5sZW5ndGggLSAxMikgKyAnPic7XG4gIH1cbiAgcmV0dXJuIGpzb25CdWlsZEhlbHBlcihrZXksIHZhbCk7XG59O1xuXG4vLyBQYXJzZSBicm93c2VyIHVzZXIgYWdlbnQgdG8gZXh0cmFjdCBicm93c2VyIG5hbWUgYW5kIHZlcnNpb24uXG5mdW5jdGlvbiBnZXRCcm93c2VySW5mbyh1YSwgcHJvZHVjdCkge1xuICB1YSA9IHVhIHx8ICcnO1xuICBsZXQgcmVhY3RuYXRpdmUgPSAnJztcbiAgLy8gQ2hlY2sgaWYgdGhpcyBpcyBhIFJlYWN0TmF0aXZlIGFwcC5cbiAgaWYgKC9yZWFjdG5hdGl2ZS9pLnRlc3QocHJvZHVjdCkpIHtcbiAgICByZWFjdG5hdGl2ZSA9ICdSZWFjdE5hdGl2ZTsgJztcbiAgfVxuICBsZXQgcmVzdWx0O1xuICAvLyBSZW1vdmUgdXNlbGVzcyBzdHJpbmcuXG4gIHVhID0gdWEucmVwbGFjZSgnIChLSFRNTCwgbGlrZSBHZWNrbyknLCAnJyk7XG4gIC8vIFRlc3QgZm9yIFdlYktpdC1iYXNlZCBicm93c2VyLlxuICBsZXQgbSA9IHVhLm1hdGNoKC8oQXBwbGVXZWJLaXRcXC9bLlxcZF0rKS9pKTtcbiAgaWYgKG0pIHtcbiAgICAvLyBMaXN0IG9mIGNvbW1vbiBzdHJpbmdzLCBmcm9tIG1vcmUgdXNlZnVsIHRvIGxlc3MgdXNlZnVsLlxuICAgIC8vIEFsbCB1bmtub3duIHN0cmluZ3MgZ2V0IHRoZSBoaWdoZXN0ICgtMSkgcHJpb3JpdHkuXG4gICAgY29uc3QgcHJpb3JpdHkgPSBbJ2VkZycsICdjaHJvbWUnLCAnc2FmYXJpJywgJ21vYmlsZScsICd2ZXJzaW9uJ107XG4gICAgbGV0IHRtcCA9IHVhLnN1YnN0cihtLmluZGV4ICsgbVswXS5sZW5ndGgpLnNwbGl0KCcgJyk7XG4gICAgbGV0IHRva2VucyA9IFtdO1xuICAgIGxldCB2ZXJzaW9uOyAvLyAxLjAgaW4gVmVyc2lvbi8xLjAgb3IgdW5kZWZpbmVkO1xuICAgIC8vIFNwbGl0IHN0cmluZyBsaWtlICdOYW1lLzAuMC4wJyBpbnRvIFsnTmFtZScsICcwLjAuMCcsIDNdIHdoZXJlIHRoZSBsYXN0IGVsZW1lbnQgaXMgdGhlIHByaW9yaXR5LlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG1wLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgbTIgPSAvKFtcXHcuXSspW1xcL10oW1xcLlxcZF0rKS8uZXhlYyh0bXBbaV0pO1xuICAgICAgaWYgKG0yKSB7XG4gICAgICAgIC8vIFVua25vd24gdmFsdWVzIGFyZSBoaWdoZXN0IHByaW9yaXR5ICgtMSkuXG4gICAgICAgIHRva2Vucy5wdXNoKFttMlsxXSwgbTJbMl0sIHByaW9yaXR5LmZpbmRJbmRleCgoZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtMlsxXS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoZSk7XG4gICAgICAgIH0pXSk7XG4gICAgICAgIGlmIChtMlsxXSA9PSAnVmVyc2lvbicpIHtcbiAgICAgICAgICB2ZXJzaW9uID0gbTJbMl07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU29ydCBieSBwcmlvcml0eTogbW9yZSBpbnRlcmVzdGluZyBpcyBlYXJsaWVyIHRoYW4gbGVzcyBpbnRlcmVzdGluZy5cbiAgICB0b2tlbnMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgcmV0dXJuIGFbMl0gLSBiWzJdO1xuICAgIH0pO1xuICAgIGlmICh0b2tlbnMubGVuZ3RoID4gMCkge1xuICAgICAgLy8gUmV0dXJuIHRoZSBsZWFzdCBjb21tb24gYnJvd3NlciBzdHJpbmcgYW5kIHZlcnNpb24uXG4gICAgICBpZiAodG9rZW5zWzBdWzBdLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZWRnJykpIHtcbiAgICAgICAgdG9rZW5zWzBdWzBdID0gJ0VkZ2UnO1xuICAgICAgfSBlbHNlIGlmICh0b2tlbnNbMF1bMF0gPT0gJ09QUicpIHtcbiAgICAgICAgdG9rZW5zWzBdWzBdID0gJ09wZXJhJztcbiAgICAgIH0gZWxzZSBpZiAodG9rZW5zWzBdWzBdID09ICdTYWZhcmknICYmIHZlcnNpb24pIHtcbiAgICAgICAgdG9rZW5zWzBdWzFdID0gdmVyc2lvbjtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IHRva2Vuc1swXVswXSArICcvJyArIHRva2Vuc1swXVsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRmFpbGVkIHRvIElEIHRoZSBicm93c2VyLiBSZXR1cm4gdGhlIHdlYmtpdCB2ZXJzaW9uLlxuICAgICAgcmVzdWx0ID0gbVsxXTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoL2ZpcmVmb3gvaS50ZXN0KHVhKSkge1xuICAgIG0gPSAvRmlyZWZveFxcLyhbLlxcZF0rKS9nLmV4ZWModWEpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXN1bHQgPSAnRmlyZWZveC8nICsgbVsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gJ0ZpcmVmb3gvPyc7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIE5laXRoZXIgQXBwbGVXZWJLaXQgbm9yIEZpcmVmb3guIFRyeSB0aGUgbGFzdCByZXNvcnQuXG4gICAgbSA9IC8oW1xcdy5dKylcXC8oWy5cXGRdKykvLmV4ZWModWEpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXN1bHQgPSBtWzFdICsgJy8nICsgbVsyXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHVhLnNwbGl0KCcgJyk7XG4gICAgICByZXN1bHQgPSBtWzBdO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNob3J0ZW4gdGhlIHZlcnNpb24gdG8gb25lIGRvdCAnYS5iYi5jY2MuZCAtPiBhLmJiJyBhdCBtb3N0LlxuICBtID0gcmVzdWx0LnNwbGl0KCcvJyk7XG4gIGlmIChtLmxlbmd0aCA+IDEpIHtcbiAgICBjb25zdCB2ID0gbVsxXS5zcGxpdCgnLicpO1xuICAgIGNvbnN0IG1pbm9yID0gdlsxXSA/ICcuJyArIHZbMV0uc3Vic3RyKDAsIDIpIDogJyc7XG4gICAgcmVzdWx0ID0gYCR7bVswXX0vJHt2WzBdfSR7bWlub3J9YDtcbiAgfVxuICByZXR1cm4gcmVhY3RuYXRpdmUgKyByZXN1bHQ7XG59XG5cbi8qKlxuICogQGNsYXNzIFRpbm9kZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgLSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFwcE5hbWUgLSBOYW1lIG9mIHRoZSBjYWxsaW5nIGFwcGxpY2F0aW9uIHRvIGJlIHJlcG9ydGVkIGluIHRoZSBVc2VyIEFnZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5ob3N0IC0gSG9zdCBuYW1lIGFuZCBvcHRpb25hbCBwb3J0IG51bWJlciB0byBjb25uZWN0IHRvLlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hcGlLZXkgLSBBUEkga2V5IGdlbmVyYXRlZCBieSA8Y29kZT5rZXlnZW48L2NvZGU+LlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy50cmFuc3BvcnQgLSBTZWUge0BsaW5rIFRpbm9kZS5Db25uZWN0aW9uI3RyYW5zcG9ydH0uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNvbmZpZy5zZWN1cmUgLSBVc2UgU2VjdXJlIFdlYlNvY2tldCBpZiA8Y29kZT50cnVlPC9jb2RlPi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcucGxhdGZvcm0gLSBPcHRpb25hbCBwbGF0Zm9ybSBpZGVudGlmaWVyLCBvbmUgb2YgPGNvZGU+XCJpb3NcIjwvY29kZT4sIDxjb2RlPlwid2ViXCI8L2NvZGU+LCA8Y29kZT5cImFuZHJvaWRcIjwvY29kZT4uXG4gKiBAcGFyYW0ge2Jvb2xlbn0gY29uZmlnLnBlcnNpc3QgLSBVc2UgSW5kZXhlZERCIHBlcnNpc3RlbnQgc3RvcmFnZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uQ29tcGxldGUgLSBjYWxsYmFjayB0byBjYWxsIHdoZW4gaW5pdGlhbGl6YXRpb24gaXMgY29tcGxldGVkLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUaW5vZGUge1xuICBfaG9zdDtcbiAgX3NlY3VyZTtcblxuICBfYXBwTmFtZTtcblxuICAvLyBBUEkgS2V5LlxuICBfYXBpS2V5O1xuXG4gIC8vIE5hbWUgYW5kIHZlcnNpb24gb2YgdGhlIGJyb3dzZXIuXG4gIF9icm93c2VyID0gJyc7XG4gIF9wbGF0Zm9ybTtcbiAgLy8gSGFyZHdhcmVcbiAgX2h3b3MgPSAndW5kZWZpbmVkJztcbiAgX2h1bWFuTGFuZ3VhZ2UgPSAneHgnO1xuXG4gIC8vIExvZ2dpbmcgdG8gY29uc29sZSBlbmFibGVkXG4gIF9sb2dnaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAvLyBXaGVuIGxvZ2dpbmcsIHRyaXAgbG9uZyBzdHJpbmdzIChiYXNlNjQtZW5jb2RlZCBpbWFnZXMpIGZvciByZWFkYWJpbGl0eVxuICBfdHJpbUxvbmdTdHJpbmdzID0gZmFsc2U7XG4gIC8vIFVJRCBvZiB0aGUgY3VycmVudGx5IGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgX215VUlEID0gbnVsbDtcbiAgLy8gU3RhdHVzIG9mIGNvbm5lY3Rpb246IGF1dGhlbnRpY2F0ZWQgb3Igbm90LlxuICBfYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAvLyBMb2dpbiB1c2VkIGluIHRoZSBsYXN0IHN1Y2Nlc3NmdWwgYmFzaWMgYXV0aGVudGljYXRpb25cbiAgX2xvZ2luID0gbnVsbDtcbiAgLy8gVG9rZW4gd2hpY2ggY2FuIGJlIHVzZWQgZm9yIGxvZ2luIGluc3RlYWQgb2YgbG9naW4vcGFzc3dvcmQuXG4gIF9hdXRoVG9rZW4gPSBudWxsO1xuICAvLyBDb3VudGVyIG9mIHJlY2VpdmVkIHBhY2tldHNcbiAgX2luUGFja2V0Q291bnQgPSAwO1xuICAvLyBDb3VudGVyIGZvciBnZW5lcmF0aW5nIHVuaXF1ZSBtZXNzYWdlIElEc1xuICBfbWVzc2FnZUlkID0gTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIDB4RkZGRikgKyAweEZGRkYpO1xuICAvLyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc2VydmVyLCBpZiBjb25uZWN0ZWRcbiAgX3NlcnZlckluZm8gPSBudWxsO1xuICAvLyBQdXNoIG5vdGlmaWNhdGlvbiB0b2tlbi4gQ2FsbGVkIGRldmljZVRva2VuIGZvciBjb25zaXN0ZW5jeSB3aXRoIHRoZSBBbmRyb2lkIFNESy5cbiAgX2RldmljZVRva2VuID0gbnVsbDtcblxuICAvLyBDYWNoZSBvZiBwZW5kaW5nIHByb21pc2VzIGJ5IG1lc3NhZ2UgaWQuXG4gIF9wZW5kaW5nUHJvbWlzZXMgPSB7fTtcbiAgLy8gVGhlIFRpbWVvdXQgb2JqZWN0IHJldHVybmVkIGJ5IHRoZSByZWplY3QgZXhwaXJlZCBwcm9taXNlcyBzZXRJbnRlcnZhbC5cbiAgX2V4cGlyZVByb21pc2VzID0gbnVsbDtcblxuICAvLyBXZWJzb2NrZXQgb3IgbG9uZyBwb2xsaW5nIGNvbm5lY3Rpb24uXG4gIF9jb25uZWN0aW9uID0gbnVsbDtcblxuICAvLyBVc2UgaW5kZXhEQiBmb3IgY2FjaGluZyB0b3BpY3MgYW5kIG1lc3NhZ2VzLlxuICBfcGVyc2lzdCA9IGZhbHNlO1xuICAvLyBJbmRleGVkREIgd3JhcHBlciBvYmplY3QuXG4gIF9kYiA9IG51bGw7XG5cbiAgLy8gVGlub2RlJ3MgY2FjaGUgb2Ygb2JqZWN0c1xuICBfY2FjaGUgPSB7fTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWcsIG9uQ29tcGxldGUpIHtcbiAgICB0aGlzLl9ob3N0ID0gY29uZmlnLmhvc3Q7XG4gICAgdGhpcy5fc2VjdXJlID0gY29uZmlnLnNlY3VyZTtcblxuICAgIC8vIENsaWVudC1wcm92aWRlZCBhcHBsaWNhdGlvbiBuYW1lLCBmb3JtYXQgPE5hbWU+Lzx2ZXJzaW9uIG51bWJlcj5cbiAgICB0aGlzLl9hcHBOYW1lID0gY29uZmlnLmFwcE5hbWUgfHwgXCJVbmRlZmluZWRcIjtcblxuICAgIC8vIEFQSSBLZXkuXG4gICAgdGhpcy5fYXBpS2V5ID0gY29uZmlnLmFwaUtleTtcblxuICAgIC8vIE5hbWUgYW5kIHZlcnNpb24gb2YgdGhlIGJyb3dzZXIuXG4gICAgdGhpcy5fcGxhdGZvcm0gPSBjb25maWcucGxhdGZvcm0gfHwgJ3dlYic7XG4gICAgLy8gVW5kZXJseWluZyBPUy5cbiAgICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5fYnJvd3NlciA9IGdldEJyb3dzZXJJbmZvKG5hdmlnYXRvci51c2VyQWdlbnQsIG5hdmlnYXRvci5wcm9kdWN0KTtcbiAgICAgIHRoaXMuX2h3b3MgPSBuYXZpZ2F0b3IucGxhdGZvcm07XG4gICAgICAvLyBUaGlzIGlzIHRoZSBkZWZhdWx0IGxhbmd1YWdlLiBJdCBjb3VsZCBiZSBjaGFuZ2VkIGJ5IGNsaWVudC5cbiAgICAgIHRoaXMuX2h1bWFuTGFuZ3VhZ2UgPSBuYXZpZ2F0b3IubGFuZ3VhZ2UgfHwgJ2VuLVVTJztcbiAgICB9XG5cbiAgICBDb25uZWN0aW9uLmxvZ2dlciA9IChzdHIsIC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMuI2xvZ2dlcihzdHIsIGFyZ3MpO1xuICAgIH07XG4gICAgRHJhZnR5LmxvZ2dlciA9IChzdHIsIC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMuI2xvZ2dlcihzdHIsIGFyZ3MpO1xuICAgIH07XG5cbiAgICAvLyBXZWJTb2NrZXQgb3IgbG9uZyBwb2xsaW5nIG5ldHdvcmsgY29ubmVjdGlvbi5cbiAgICBpZiAoY29uZmlnLnRyYW5zcG9ydCAhPSAnbHAnICYmIGNvbmZpZy50cmFuc3BvcnQgIT0gJ3dzJykge1xuICAgICAgY29uZmlnLnRyYW5zcG9ydCA9IGRldGVjdFRyYW5zcG9ydCgpO1xuICAgIH1cbiAgICB0aGlzLl9jb25uZWN0aW9uID0gbmV3IENvbm5lY3Rpb24oY29uZmlnLCBDb25zdC5QUk9UT0NPTF9WRVJTSU9OLCAvKiBhdXRvcmVjb25uZWN0ICovIHRydWUpO1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24ub25NZXNzYWdlID0gKGRhdGEpID0+IHtcbiAgICAgIC8vIENhbGwgdGhlIG1haW4gbWVzc2FnZSBkaXNwYXRjaGVyLlxuICAgICAgdGhpcy4jZGlzcGF0Y2hNZXNzYWdlKGRhdGEpO1xuICAgIH1cbiAgICB0aGlzLl9jb25uZWN0aW9uLm9uT3BlbiA9ICgpID0+IHtcbiAgICAgIC8vIFJlYWR5IHRvIHN0YXJ0IHNlbmRpbmcuXG4gICAgICB0aGlzLiNjb25uZWN0aW9uT3BlbigpO1xuICAgIH1cbiAgICB0aGlzLl9jb25uZWN0aW9uLm9uRGlzY29ubmVjdCA9IChlcnIsIGNvZGUpID0+IHtcbiAgICAgIHRoaXMuI2Rpc2Nvbm5lY3RlZChlcnIsIGNvZGUpO1xuICAgIH1cbiAgICAvLyBXcmFwcGVyIGZvciB0aGUgcmVjb25uZWN0IGl0ZXJhdG9yIGNhbGxiYWNrLlxuICAgIHRoaXMuX2Nvbm5lY3Rpb24ub25BdXRvcmVjb25uZWN0SXRlcmF0aW9uID0gKHRpbWVvdXQsIHByb21pc2UpID0+IHtcbiAgICAgIGlmICh0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbikge1xuICAgICAgICB0aGlzLm9uQXV0b3JlY29ubmVjdEl0ZXJhdGlvbih0aW1lb3V0LCBwcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9wZXJzaXN0ID0gY29uZmlnLnBlcnNpc3Q7XG4gICAgLy8gSW5pdGlhbGl6ZSBvYmplY3QgcmVnYXJkbGVzcy4gSXQgc2ltcGxpZmllcyB0aGUgY29kZS5cbiAgICB0aGlzLl9kYiA9IG5ldyBEQkNhY2hlKChlcnIpID0+IHtcbiAgICAgIHRoaXMuI2xvZ2dlcignREInLCBlcnIpO1xuICAgIH0sIHRoaXMubG9nZ2VyKTtcblxuICAgIGlmICh0aGlzLl9wZXJzaXN0KSB7XG4gICAgICAvLyBDcmVhdGUgdGhlIHBlcnNpc3RlbnQgY2FjaGUuXG4gICAgICAvLyBTdG9yZSBwcm9taXNlcyB0byBiZSByZXNvbHZlZCB3aGVuIG1lc3NhZ2VzIGxvYWQgaW50byBtZW1vcnkuXG4gICAgICBjb25zdCBwcm9tID0gW107XG4gICAgICB0aGlzLl9kYi5pbml0RGF0YWJhc2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgLy8gRmlyc3QgbG9hZCB0b3BpY3MgaW50byBtZW1vcnkuXG4gICAgICAgIHJldHVybiB0aGlzLl9kYi5tYXBUb3BpY3MoKGRhdGEpID0+IHtcbiAgICAgICAgICBsZXQgdG9waWMgPSB0aGlzLiNjYWNoZUdldCgndG9waWMnLCBkYXRhLm5hbWUpO1xuICAgICAgICAgIGlmICh0b3BpYykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZGF0YS5uYW1lID09IENvbnN0LlRPUElDX01FKSB7XG4gICAgICAgICAgICB0b3BpYyA9IG5ldyBUb3BpY01lKCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChkYXRhLm5hbWUgPT0gQ29uc3QuVE9QSUNfRk5EKSB7XG4gICAgICAgICAgICB0b3BpYyA9IG5ldyBUb3BpY0ZuZCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b3BpYyA9IG5ldyBUb3BpYyhkYXRhLm5hbWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX2RiLmRlc2VyaWFsaXplVG9waWModG9waWMsIGRhdGEpO1xuICAgICAgICAgIHRoaXMuI2F0dGFjaENhY2hlVG9Ub3BpYyh0b3BpYyk7XG4gICAgICAgICAgdG9waWMuX2NhY2hlUHV0U2VsZigpO1xuICAgICAgICAgIC8vIFJlcXVlc3QgdG8gbG9hZCBtZXNzYWdlcyBhbmQgc2F2ZSB0aGUgcHJvbWlzZS5cbiAgICAgICAgICBwcm9tLnB1c2godG9waWMuX2xvYWRNZXNzYWdlcyh0aGlzLl9kYikpO1xuICAgICAgICB9KTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAvLyBUaGVuIGxvYWQgdXNlcnMuXG4gICAgICAgIHJldHVybiB0aGlzLl9kYi5tYXBVc2VycygoZGF0YSkgPT4ge1xuICAgICAgICAgIHRoaXMuI2NhY2hlUHV0KCd1c2VyJywgZGF0YS51aWQsIG1lcmdlT2JqKHt9LCBkYXRhLnB1YmxpYykpO1xuICAgICAgICB9KTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAvLyBOb3cgd2FpdCBmb3IgYWxsIG1lc3NhZ2VzIHRvIGZpbmlzaCBsb2FkaW5nLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbSk7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKG9uQ29tcGxldGUpIHtcbiAgICAgICAgICBvbkNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jbG9nZ2VyKFwiUGVyc2lzdGVudCBjYWNoZSBpbml0aWFsaXplZC5cIik7XG4gICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGlmIChvbkNvbXBsZXRlKSB7XG4gICAgICAgICAgb25Db21wbGV0ZShlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2xvZ2dlcihcIkZhaWxlZCB0byBpbml0aWFsaXplIHBlcnNpc3RlbnQgY2FjaGU6XCIsIGVycik7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZGIuZGVsZXRlRGF0YWJhc2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKG9uQ29tcGxldGUpIHtcbiAgICAgICAgICBvbkNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGUgbWV0aG9kcy5cblxuICAvLyBDb25zb2xlIGxvZ2dlci4gQmFiZWwgc29tZWhvdyBmYWlscyB0byBwYXJzZSAnLi4ucmVzdCcgcGFyYW1ldGVyLlxuICAjbG9nZ2VyKHN0ciwgLi4uYXJncykge1xuICAgIGlmICh0aGlzLl9sb2dnaW5nRW5hYmxlZCkge1xuICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKCk7XG4gICAgICBjb25zdCBkYXRlU3RyaW5nID0gKCcwJyArIGQuZ2V0VVRDSG91cnMoKSkuc2xpY2UoLTIpICsgJzonICtcbiAgICAgICAgKCcwJyArIGQuZ2V0VVRDTWludXRlcygpKS5zbGljZSgtMikgKyAnOicgK1xuICAgICAgICAoJzAnICsgZC5nZXRVVENTZWNvbmRzKCkpLnNsaWNlKC0yKSArICcuJyArXG4gICAgICAgICgnMDAnICsgZC5nZXRVVENNaWxsaXNlY29uZHMoKSkuc2xpY2UoLTMpO1xuXG4gICAgICBjb25zb2xlLmxvZygnWycgKyBkYXRlU3RyaW5nICsgJ10nLCBzdHIsIGFyZ3Muam9pbignICcpKTtcbiAgICB9XG4gIH1cblxuICAvLyBHZW5lcmF0b3Igb2YgZGVmYXVsdCBwcm9taXNlcyBmb3Igc2VudCBwYWNrZXRzLlxuICAjbWFrZVByb21pc2UoaWQpIHtcbiAgICBsZXQgcHJvbWlzZSA9IG51bGw7XG4gICAgaWYgKGlkKSB7XG4gICAgICBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAvLyBTdG9yZWQgY2FsbGJhY2tzIHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIHJlc3BvbnNlIHBhY2tldCB3aXRoIHRoaXMgSWQgYXJyaXZlc1xuICAgICAgICB0aGlzLl9wZW5kaW5nUHJvbWlzZXNbaWRdID0ge1xuICAgICAgICAgICdyZXNvbHZlJzogcmVzb2x2ZSxcbiAgICAgICAgICAncmVqZWN0JzogcmVqZWN0LFxuICAgICAgICAgICd0cyc6IG5ldyBEYXRlKClcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfTtcblxuICAvLyBSZXNvbHZlIG9yIHJlamVjdCBhIHBlbmRpbmcgcHJvbWlzZS5cbiAgLy8gVW5yZXNvbHZlZCBwcm9taXNlcyBhcmUgc3RvcmVkIGluIF9wZW5kaW5nUHJvbWlzZXMuXG4gICNleGVjUHJvbWlzZShpZCwgY29kZSwgb25PSywgZXJyb3JUZXh0KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5fcGVuZGluZ1Byb21pc2VzW2lkXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICBkZWxldGUgdGhpcy5fcGVuZGluZ1Byb21pc2VzW2lkXTtcbiAgICAgIGlmIChjb2RlID49IDIwMCAmJiBjb2RlIDwgNDAwKSB7XG4gICAgICAgIGlmIChjYWxsYmFja3MucmVzb2x2ZSkge1xuICAgICAgICAgIGNhbGxiYWNrcy5yZXNvbHZlKG9uT0spO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNhbGxiYWNrcy5yZWplY3QpIHtcbiAgICAgICAgY2FsbGJhY2tzLnJlamVjdChuZXcgRXJyb3IoYCR7ZXJyb3JUZXh0fSAoJHtjb2RlfSlgKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU2VuZCBhIHBhY2tldC4gSWYgcGFja2V0IGlkIGlzIHByb3ZpZGVkIHJldHVybiBhIHByb21pc2UuXG4gICNzZW5kKHBrdCwgaWQpIHtcbiAgICBsZXQgcHJvbWlzZTtcbiAgICBpZiAoaWQpIHtcbiAgICAgIHByb21pc2UgPSB0aGlzLiNtYWtlUHJvbWlzZShpZCk7XG4gICAgfVxuICAgIHBrdCA9IHNpbXBsaWZ5KHBrdCk7XG4gICAgbGV0IG1zZyA9IEpTT04uc3RyaW5naWZ5KHBrdCk7XG4gICAgdGhpcy4jbG9nZ2VyKFwib3V0OiBcIiArICh0aGlzLl90cmltTG9uZ1N0cmluZ3MgPyBKU09OLnN0cmluZ2lmeShwa3QsIGpzb25Mb2dnZXJIZWxwZXIpIDogbXNnKSk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uc2VuZFRleHQobXNnKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIElmIHNlbmRUZXh0IHRocm93cywgd3JhcCB0aGUgZXJyb3IgaW4gYSBwcm9taXNlIG9yIHJldGhyb3cuXG4gICAgICBpZiAoaWQpIHtcbiAgICAgICAgdGhpcy4jZXhlY1Byb21pc2UoaWQsIENvbm5lY3Rpb24uTkVUV09SS19FUlJPUiwgbnVsbCwgZXJyLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIC8vIFRoZSBtYWluIG1lc3NhZ2UgZGlzcGF0Y2hlci5cbiAgI2Rpc3BhdGNoTWVzc2FnZShkYXRhKSB7XG4gICAgLy8gU2tpcCBlbXB0eSByZXNwb25zZS4gVGhpcyBoYXBwZW5zIHdoZW4gTFAgdGltZXMgb3V0LlxuICAgIGlmICghZGF0YSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuX2luUGFja2V0Q291bnQrKztcblxuICAgIC8vIFNlbmQgcmF3IG1lc3NhZ2UgdG8gbGlzdGVuZXJcbiAgICBpZiAodGhpcy5vblJhd01lc3NhZ2UpIHtcbiAgICAgIHRoaXMub25SYXdNZXNzYWdlKGRhdGEpO1xuICAgIH1cblxuICAgIGlmIChkYXRhID09PSAnMCcpIHtcbiAgICAgIC8vIFNlcnZlciByZXNwb25zZSB0byBhIG5ldHdvcmsgcHJvYmUuXG4gICAgICBpZiAodGhpcy5vbk5ldHdvcmtQcm9iZSkge1xuICAgICAgICB0aGlzLm9uTmV0d29ya1Byb2JlKCk7XG4gICAgICB9XG4gICAgICAvLyBObyBwcm9jZXNzaW5nIGlzIG5lY2Vzc2FyeS5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgcGt0ID0gSlNPTi5wYXJzZShkYXRhLCBqc29uUGFyc2VIZWxwZXIpO1xuICAgIGlmICghcGt0KSB7XG4gICAgICB0aGlzLiNsb2dnZXIoXCJpbjogXCIgKyBkYXRhKTtcbiAgICAgIHRoaXMuI2xvZ2dlcihcIkVSUk9SOiBmYWlsZWQgdG8gcGFyc2UgZGF0YVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jbG9nZ2VyKFwiaW46IFwiICsgKHRoaXMuX3RyaW1Mb25nU3RyaW5ncyA/IEpTT04uc3RyaW5naWZ5KHBrdCwganNvbkxvZ2dlckhlbHBlcikgOiBkYXRhKSk7XG5cbiAgICAgIC8vIFNlbmQgY29tcGxldGUgcGFja2V0IHRvIGxpc3RlbmVyXG4gICAgICBpZiAodGhpcy5vbk1lc3NhZ2UpIHtcbiAgICAgICAgdGhpcy5vbk1lc3NhZ2UocGt0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBrdC5jdHJsKSB7XG4gICAgICAgIC8vIEhhbmRsaW5nIHtjdHJsfSBtZXNzYWdlXG4gICAgICAgIGlmICh0aGlzLm9uQ3RybE1lc3NhZ2UpIHtcbiAgICAgICAgICB0aGlzLm9uQ3RybE1lc3NhZ2UocGt0LmN0cmwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzb2x2ZSBvciByZWplY3QgYSBwZW5kaW5nIHByb21pc2UsIGlmIGFueVxuICAgICAgICBpZiAocGt0LmN0cmwuaWQpIHtcbiAgICAgICAgICB0aGlzLiNleGVjUHJvbWlzZShwa3QuY3RybC5pZCwgcGt0LmN0cmwuY29kZSwgcGt0LmN0cmwsIHBrdC5jdHJsLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmIChwa3QuY3RybC5jb2RlID09IDIwNSAmJiBwa3QuY3RybC50ZXh0ID09ICdldmljdGVkJykge1xuICAgICAgICAgICAgLy8gVXNlciBldmljdGVkIGZyb20gdG9waWMuXG4gICAgICAgICAgICBjb25zdCB0b3BpYyA9IHRoaXMuI2NhY2hlR2V0KCd0b3BpYycsIHBrdC5jdHJsLnRvcGljKTtcbiAgICAgICAgICAgIGlmICh0b3BpYykge1xuICAgICAgICAgICAgICB0b3BpYy5fcmVzZXRTdWIoKTtcbiAgICAgICAgICAgICAgaWYgKHBrdC5jdHJsLnBhcmFtcyAmJiBwa3QuY3RybC5wYXJhbXMudW5zdWIpIHtcbiAgICAgICAgICAgICAgICB0b3BpYy5fZ29uZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChwa3QuY3RybC5jb2RlIDwgMzAwICYmIHBrdC5jdHJsLnBhcmFtcykge1xuICAgICAgICAgICAgaWYgKHBrdC5jdHJsLnBhcmFtcy53aGF0ID09ICdkYXRhJykge1xuICAgICAgICAgICAgICAvLyBjb2RlPTIwOCwgYWxsIG1lc3NhZ2VzIHJlY2VpdmVkOiBcInBhcmFtc1wiOntcImNvdW50XCI6MTEsXCJ3aGF0XCI6XCJkYXRhXCJ9LFxuICAgICAgICAgICAgICBjb25zdCB0b3BpYyA9IHRoaXMuI2NhY2hlR2V0KCd0b3BpYycsIHBrdC5jdHJsLnRvcGljKTtcbiAgICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgICAgdG9waWMuX2FsbE1lc3NhZ2VzUmVjZWl2ZWQocGt0LmN0cmwucGFyYW1zLmNvdW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChwa3QuY3RybC5wYXJhbXMud2hhdCA9PSAnc3ViJykge1xuICAgICAgICAgICAgICAvLyBjb2RlPTIwNCwgdGhlIHRvcGljIGhhcyBubyAocmVmcmVzaGVkKSBzdWJzY3JpcHRpb25zLlxuICAgICAgICAgICAgICBjb25zdCB0b3BpYyA9IHRoaXMuI2NhY2hlR2V0KCd0b3BpYycsIHBrdC5jdHJsLnRvcGljKTtcbiAgICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciB0b3BpYy5vblN1YnNVcGRhdGVkLlxuICAgICAgICAgICAgICAgIHRvcGljLl9wcm9jZXNzTWV0YVN1YihbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKHBrdC5tZXRhKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGluZyBhIHttZXRhfSBtZXNzYWdlLlxuICAgICAgICAgICAgLy8gUHJlZmVycmVkIEFQSTogUm91dGUgbWV0YSB0byB0b3BpYywgaWYgb25lIGlzIHJlZ2lzdGVyZWRcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gdGhpcy4jY2FjaGVHZXQoJ3RvcGljJywgcGt0Lm1ldGEudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9yb3V0ZU1ldGEocGt0Lm1ldGEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocGt0Lm1ldGEuaWQpIHtcbiAgICAgICAgICAgICAgdGhpcy4jZXhlY1Byb21pc2UocGt0Lm1ldGEuaWQsIDIwMCwgcGt0Lm1ldGEsICdNRVRBJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNlY29uZGFyeSBBUEk6IGNhbGxiYWNrXG4gICAgICAgICAgICBpZiAodGhpcy5vbk1ldGFNZXNzYWdlKSB7XG4gICAgICAgICAgICAgIHRoaXMub25NZXRhTWVzc2FnZShwa3QubWV0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChwa3QuZGF0YSkge1xuICAgICAgICAgICAgLy8gSGFuZGxpbmcge2RhdGF9IG1lc3NhZ2VcbiAgICAgICAgICAgIC8vIFByZWZlcnJlZCBBUEk6IFJvdXRlIGRhdGEgdG8gdG9waWMsIGlmIG9uZSBpcyByZWdpc3RlcmVkXG4gICAgICAgICAgICBjb25zdCB0b3BpYyA9IHRoaXMuI2NhY2hlR2V0KCd0b3BpYycsIHBrdC5kYXRhLnRvcGljKTtcbiAgICAgICAgICAgIGlmICh0b3BpYykge1xuICAgICAgICAgICAgICB0b3BpYy5fcm91dGVEYXRhKHBrdC5kYXRhKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2Vjb25kYXJ5IEFQSTogQ2FsbCBjYWxsYmFja1xuICAgICAgICAgICAgaWYgKHRoaXMub25EYXRhTWVzc2FnZSkge1xuICAgICAgICAgICAgICB0aGlzLm9uRGF0YU1lc3NhZ2UocGt0LmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAocGt0LnByZXMpIHtcbiAgICAgICAgICAgIC8vIEhhbmRsaW5nIHtwcmVzfSBtZXNzYWdlXG4gICAgICAgICAgICAvLyBQcmVmZXJyZWQgQVBJOiBSb3V0ZSBwcmVzZW5jZSB0byB0b3BpYywgaWYgb25lIGlzIHJlZ2lzdGVyZWRcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gdGhpcy4jY2FjaGVHZXQoJ3RvcGljJywgcGt0LnByZXMudG9waWMpO1xuICAgICAgICAgICAgaWYgKHRvcGljKSB7XG4gICAgICAgICAgICAgIHRvcGljLl9yb3V0ZVByZXMocGt0LnByZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZWNvbmRhcnkgQVBJIC0gY2FsbGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLm9uUHJlc01lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5vblByZXNNZXNzYWdlKHBrdC5wcmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHBrdC5pbmZvKSB7XG4gICAgICAgICAgICAvLyB7aW5mb30gbWVzc2FnZSAtIHJlYWQvcmVjZWl2ZWQgbm90aWZpY2F0aW9ucyBhbmQga2V5IHByZXNzZXNcbiAgICAgICAgICAgIC8vIFByZWZlcnJlZCBBUEk6IFJvdXRlIHtpbmZvfX0gdG8gdG9waWMsIGlmIG9uZSBpcyByZWdpc3RlcmVkXG4gICAgICAgICAgICBjb25zdCB0b3BpYyA9IHRoaXMuI2NhY2hlR2V0KCd0b3BpYycsIHBrdC5pbmZvLnRvcGljKTtcbiAgICAgICAgICAgIGlmICh0b3BpYykge1xuICAgICAgICAgICAgICB0b3BpYy5fcm91dGVJbmZvKHBrdC5pbmZvKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2Vjb25kYXJ5IEFQSSAtIGNhbGxiYWNrXG4gICAgICAgICAgICBpZiAodGhpcy5vbkluZm9NZXNzYWdlKSB7XG4gICAgICAgICAgICAgIHRoaXMub25JbmZvTWVzc2FnZShwa3QuaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuI2xvZ2dlcihcIkVSUk9SOiBVbmtub3duIHBhY2tldCByZWNlaXZlZC5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDb25uZWN0aW9uIG9wZW4sIHJlYWR5IHRvIHN0YXJ0IHNlbmRpbmcuXG4gICNjb25uZWN0aW9uT3BlbigpIHtcbiAgICBpZiAoIXRoaXMuX2V4cGlyZVByb21pc2VzKSB7XG4gICAgICAvLyBSZWplY3QgcHJvbWlzZXMgd2hpY2ggaGF2ZSBub3QgYmVlbiByZXNvbHZlZCBmb3IgdG9vIGxvbmcuXG4gICAgICB0aGlzLl9leHBpcmVQcm9taXNlcyA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKFwiVGltZW91dCAoNTA0KVwiKTtcbiAgICAgICAgY29uc3QgZXhwaXJlcyA9IG5ldyBEYXRlKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gQ29uc3QuRVhQSVJFX1BST01JU0VTX1RJTUVPVVQpO1xuICAgICAgICBmb3IgKGxldCBpZCBpbiB0aGlzLl9wZW5kaW5nUHJvbWlzZXMpIHtcbiAgICAgICAgICBsZXQgY2FsbGJhY2tzID0gdGhpcy5fcGVuZGluZ1Byb21pc2VzW2lkXTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2tzICYmIGNhbGxiYWNrcy50cyA8IGV4cGlyZXMpIHtcbiAgICAgICAgICAgIHRoaXMuI2xvZ2dlcihcIlByb21pc2UgZXhwaXJlZFwiLCBpZCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcGVuZGluZ1Byb21pc2VzW2lkXTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFja3MucmVqZWN0KSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrcy5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIENvbnN0LkVYUElSRV9QUk9NSVNFU19QRVJJT0QpO1xuICAgIH1cbiAgICB0aGlzLmhlbGxvKCk7XG4gIH1cblxuICAjZGlzY29ubmVjdGVkKGVyciwgY29kZSkge1xuICAgIHRoaXMuX2luUGFja2V0Q291bnQgPSAwO1xuICAgIHRoaXMuX3NlcnZlckluZm8gPSBudWxsO1xuICAgIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcblxuICAgIGlmICh0aGlzLl9leHBpcmVQcm9taXNlcykge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9leHBpcmVQcm9taXNlcyk7XG4gICAgICB0aGlzLl9leHBpcmVQcm9taXNlcyA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gTWFyayBhbGwgdG9waWNzIGFzIHVuc3Vic2NyaWJlZFxuICAgIHRoaXMuI2NhY2hlTWFwKCd0b3BpYycsICh0b3BpYywga2V5KSA9PiB7XG4gICAgICB0b3BpYy5fcmVzZXRTdWIoKTtcbiAgICB9KTtcblxuICAgIC8vIFJlamVjdCBhbGwgcGVuZGluZyBwcm9taXNlc1xuICAgIGZvciAobGV0IGtleSBpbiB0aGlzLl9wZW5kaW5nUHJvbWlzZXMpIHtcbiAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuX3BlbmRpbmdQcm9taXNlc1trZXldO1xuICAgICAgaWYgKGNhbGxiYWNrcyAmJiBjYWxsYmFja3MucmVqZWN0KSB7XG4gICAgICAgIGNhbGxiYWNrcy5yZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fcGVuZGluZ1Byb21pc2VzID0ge307XG5cbiAgICBpZiAodGhpcy5vbkRpc2Nvbm5lY3QpIHtcbiAgICAgIHRoaXMub25EaXNjb25uZWN0KGVycik7XG4gICAgfVxuICB9XG5cbiAgLy8gR2V0IFVzZXIgQWdlbnQgc3RyaW5nXG4gICNnZXRVc2VyQWdlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FwcE5hbWUgKyAnICgnICsgKHRoaXMuX2Jyb3dzZXIgPyB0aGlzLl9icm93c2VyICsgJzsgJyA6ICcnKSArIHRoaXMuX2h3b3MgKyAnKTsgJyArIENvbnN0LkxJQlJBUlk7XG4gIH1cblxuICAvLyBHZW5lcmF0b3Igb2YgcGFja2V0cyBzdHVic1xuICAjaW5pdFBhY2tldCh0eXBlLCB0b3BpYykge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnaGknOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdoaSc6IHtcbiAgICAgICAgICAgICdpZCc6IHRoaXMuZ2V0TmV4dFVuaXF1ZUlkKCksXG4gICAgICAgICAgICAndmVyJzogQ29uc3QuVkVSU0lPTixcbiAgICAgICAgICAgICd1YSc6IHRoaXMuI2dldFVzZXJBZ2VudCgpLFxuICAgICAgICAgICAgJ2Rldic6IHRoaXMuX2RldmljZVRva2VuLFxuICAgICAgICAgICAgJ2xhbmcnOiB0aGlzLl9odW1hbkxhbmd1YWdlLFxuICAgICAgICAgICAgJ3BsYXRmJzogdGhpcy5fcGxhdGZvcm1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ2FjYyc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ2FjYyc6IHtcbiAgICAgICAgICAgICdpZCc6IHRoaXMuZ2V0TmV4dFVuaXF1ZUlkKCksXG4gICAgICAgICAgICAndXNlcic6IG51bGwsXG4gICAgICAgICAgICAnc2NoZW1lJzogbnVsbCxcbiAgICAgICAgICAgICdzZWNyZXQnOiBudWxsLFxuICAgICAgICAgICAgJ2xvZ2luJzogZmFsc2UsXG4gICAgICAgICAgICAndGFncyc6IG51bGwsXG4gICAgICAgICAgICAnZGVzYyc6IHt9LFxuICAgICAgICAgICAgJ2NyZWQnOiB7fVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgY2FzZSAnbG9naW4nOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdsb2dpbic6IHtcbiAgICAgICAgICAgICdpZCc6IHRoaXMuZ2V0TmV4dFVuaXF1ZUlkKCksXG4gICAgICAgICAgICAnc2NoZW1lJzogbnVsbCxcbiAgICAgICAgICAgICdzZWNyZXQnOiBudWxsXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdzdWInOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdzdWInOiB7XG4gICAgICAgICAgICAnaWQnOiB0aGlzLmdldE5leHRVbmlxdWVJZCgpLFxuICAgICAgICAgICAgJ3RvcGljJzogdG9waWMsXG4gICAgICAgICAgICAnc2V0Jzoge30sXG4gICAgICAgICAgICAnZ2V0Jzoge31cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ2xlYXZlJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAnbGVhdmUnOiB7XG4gICAgICAgICAgICAnaWQnOiB0aGlzLmdldE5leHRVbmlxdWVJZCgpLFxuICAgICAgICAgICAgJ3RvcGljJzogdG9waWMsXG4gICAgICAgICAgICAndW5zdWInOiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgY2FzZSAncHViJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAncHViJzoge1xuICAgICAgICAgICAgJ2lkJzogdGhpcy5nZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICd0b3BpYyc6IHRvcGljLFxuICAgICAgICAgICAgJ25vZWNobyc6IGZhbHNlLFxuICAgICAgICAgICAgJ2hlYWQnOiBudWxsLFxuICAgICAgICAgICAgJ2NvbnRlbnQnOiB7fVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgY2FzZSAnZ2V0JzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAnZ2V0Jzoge1xuICAgICAgICAgICAgJ2lkJzogdGhpcy5nZXROZXh0VW5pcXVlSWQoKSxcbiAgICAgICAgICAgICd0b3BpYyc6IHRvcGljLFxuICAgICAgICAgICAgJ3doYXQnOiBudWxsLFxuICAgICAgICAgICAgJ2Rlc2MnOiB7fSxcbiAgICAgICAgICAgICdzdWInOiB7fSxcbiAgICAgICAgICAgICdkYXRhJzoge31cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ3NldCc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ3NldCc6IHtcbiAgICAgICAgICAgICdpZCc6IHRoaXMuZ2V0TmV4dFVuaXF1ZUlkKCksXG4gICAgICAgICAgICAndG9waWMnOiB0b3BpYyxcbiAgICAgICAgICAgICdkZXNjJzoge30sXG4gICAgICAgICAgICAnc3ViJzoge30sXG4gICAgICAgICAgICAndGFncyc6IFtdXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBjYXNlICdkZWwnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdkZWwnOiB7XG4gICAgICAgICAgICAnaWQnOiB0aGlzLmdldE5leHRVbmlxdWVJZCgpLFxuICAgICAgICAgICAgJ3RvcGljJzogdG9waWMsXG4gICAgICAgICAgICAnd2hhdCc6IG51bGwsXG4gICAgICAgICAgICAnZGVsc2VxJzogbnVsbCxcbiAgICAgICAgICAgICd1c2VyJzogbnVsbCxcbiAgICAgICAgICAgICdoYXJkJzogZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ25vdGUnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdub3RlJzoge1xuICAgICAgICAgICAgLy8gbm8gaWQgYnkgZGVzaWduXG4gICAgICAgICAgICAndG9waWMnOiB0b3BpYyxcbiAgICAgICAgICAgICd3aGF0JzogbnVsbCxcbiAgICAgICAgICAgICdzZXEnOiB1bmRlZmluZWQgLy8gdGhlIHNlcnZlci1zaWRlIG1lc3NhZ2UgaWQgYWtub3dsZWRnZWQgYXMgcmVjZWl2ZWQgb3IgcmVhZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHBhY2tldCB0eXBlIHJlcXVlc3RlZDogJHt0eXBlfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIENhY2hlIG1hbmFnZW1lbnRcbiAgI2NhY2hlUHV0KHR5cGUsIG5hbWUsIG9iaikge1xuICAgIHRoaXMuX2NhY2hlW3R5cGUgKyAnOicgKyBuYW1lXSA9IG9iajtcbiAgfVxuICAjY2FjaGVHZXQodHlwZSwgbmFtZSkge1xuICAgIHJldHVybiB0aGlzLl9jYWNoZVt0eXBlICsgJzonICsgbmFtZV07XG4gIH1cbiAgI2NhY2hlRGVsKHR5cGUsIG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5fY2FjaGVbdHlwZSArICc6JyArIG5hbWVdO1xuICB9XG5cbiAgLy8gRW51bWVyYXRlIGFsbCBpdGVtcyBpbiBjYWNoZSwgY2FsbCBmdW5jIGZvciBlYWNoIGl0ZW0uXG4gIC8vIEVudW1lcmF0aW9uIHN0b3BzIGlmIGZ1bmMgcmV0dXJucyB0cnVlLlxuICAjY2FjaGVNYXAodHlwZSwgZnVuYywgY29udGV4dCkge1xuICAgIGNvbnN0IGtleSA9IHR5cGUgPyB0eXBlICsgJzonIDogdW5kZWZpbmVkO1xuICAgIGZvciAobGV0IGlkeCBpbiB0aGlzLl9jYWNoZSkge1xuICAgICAgaWYgKCFrZXkgfHwgaWR4LmluZGV4T2Yoa2V5KSA9PSAwKSB7XG4gICAgICAgIGlmIChmdW5jLmNhbGwoY29udGV4dCwgdGhpcy5fY2FjaGVbaWR4XSwgaWR4KSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTWFrZSBsaW1pdGVkIGNhY2hlIG1hbmFnZW1lbnQgYXZhaWxhYmxlIHRvIHRvcGljLlxuICAvLyBDYWNoaW5nIHVzZXIucHVibGljIG9ubHkuIEV2ZXJ5dGhpbmcgZWxzZSBpcyBwZXItdG9waWMuXG4gICNhdHRhY2hDYWNoZVRvVG9waWModG9waWMpIHtcbiAgICB0b3BpYy5fdGlub2RlID0gdGhpcztcblxuICAgIHRvcGljLl9jYWNoZUdldFVzZXIgPSAodWlkKSA9PiB7XG4gICAgICBjb25zdCBwdWIgPSB0aGlzLiNjYWNoZUdldCgndXNlcicsIHVpZCk7XG4gICAgICBpZiAocHViKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdXNlcjogdWlkLFxuICAgICAgICAgIHB1YmxpYzogbWVyZ2VPYmooe30sIHB1YilcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfTtcbiAgICB0b3BpYy5fY2FjaGVQdXRVc2VyID0gKHVpZCwgdXNlcikgPT4ge1xuICAgICAgdGhpcy4jY2FjaGVQdXQoJ3VzZXInLCB1aWQsIG1lcmdlT2JqKHt9LCB1c2VyLnB1YmxpYykpO1xuICAgIH07XG4gICAgdG9waWMuX2NhY2hlRGVsVXNlciA9ICh1aWQpID0+IHtcbiAgICAgIHRoaXMuI2NhY2hlRGVsKCd1c2VyJywgdWlkKTtcbiAgICB9O1xuICAgIHRvcGljLl9jYWNoZVB1dFNlbGYgPSAoKSA9PiB7XG4gICAgICB0aGlzLiNjYWNoZVB1dCgndG9waWMnLCB0b3BpYy5uYW1lLCB0b3BpYyk7XG4gICAgfTtcbiAgICB0b3BpYy5fY2FjaGVEZWxTZWxmID0gKCkgPT4ge1xuICAgICAgdGhpcy4jY2FjaGVEZWwoJ3RvcGljJywgdG9waWMubmFtZSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9uIHN1Y2Nlc3NmdWwgbG9naW4gc2F2ZSBzZXJ2ZXItcHJvdmlkZWQgZGF0YS5cbiAgI2xvZ2luU3VjY2Vzc2Z1bChjdHJsKSB7XG4gICAgaWYgKCFjdHJsLnBhcmFtcyB8fCAhY3RybC5wYXJhbXMudXNlcikge1xuICAgICAgcmV0dXJuIGN0cmw7XG4gICAgfVxuICAgIC8vIFRoaXMgaXMgYSByZXNwb25zZSB0byBhIHN1Y2Nlc3NmdWwgbG9naW4sXG4gICAgLy8gZXh0cmFjdCBVSUQgYW5kIHNlY3VyaXR5IHRva2VuLCBzYXZlIGl0IGluIFRpbm9kZSBtb2R1bGVcbiAgICB0aGlzLl9teVVJRCA9IGN0cmwucGFyYW1zLnVzZXI7XG4gICAgdGhpcy5fYXV0aGVudGljYXRlZCA9IChjdHJsICYmIGN0cmwuY29kZSA+PSAyMDAgJiYgY3RybC5jb2RlIDwgMzAwKTtcbiAgICBpZiAoY3RybC5wYXJhbXMgJiYgY3RybC5wYXJhbXMudG9rZW4gJiYgY3RybC5wYXJhbXMuZXhwaXJlcykge1xuICAgICAgdGhpcy5fYXV0aFRva2VuID0ge1xuICAgICAgICB0b2tlbjogY3RybC5wYXJhbXMudG9rZW4sXG4gICAgICAgIGV4cGlyZXM6IGN0cmwucGFyYW1zLmV4cGlyZXNcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2F1dGhUb2tlbiA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub25Mb2dpbikge1xuICAgICAgdGhpcy5vbkxvZ2luKGN0cmwuY29kZSwgY3RybC50ZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3RybDtcbiAgfVxuXG4gIC8vIFN0YXRpYyBtZXRob2RzLlxuICAvKipcbiAgICogSGVscGVyIG1ldGhvZCB0byBwYWNrYWdlIGFjY291bnQgY3JlZGVudGlhbC5cbiAgICpcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAc3RhdGljXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgQ3JlZGVudGlhbH0gbWV0aCAtIHZhbGlkYXRpb24gbWV0aG9kIG9yIG9iamVjdCB3aXRoIHZhbGlkYXRpb24gZGF0YS5cbiAgICogQHBhcmFtIHtzdHJpbmc9fSB2YWwgLSB2YWxpZGF0aW9uIHZhbHVlIChlLmcuIGVtYWlsIG9yIHBob25lIG51bWJlcikuXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1zIC0gdmFsaWRhdGlvbiBwYXJhbWV0ZXJzLlxuICAgKiBAcGFyYW0ge3N0cmluZz19IHJlc3AgLSB2YWxpZGF0aW9uIHJlc3BvbnNlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7QXJyYXkuPENyZWRlbnRpYWw+fSBhcnJheSB3aXRoIGEgc2luZ2xlIGNyZWRlbnRpYWwgb3IgPGNvZGU+bnVsbDwvY29kZT4gaWYgbm8gdmFsaWQgY3JlZGVudGlhbHMgd2VyZSBnaXZlbi5cbiAgICovXG4gIHN0YXRpYyBjcmVkZW50aWFsKG1ldGgsIHZhbCwgcGFyYW1zLCByZXNwKSB7XG4gICAgaWYgKHR5cGVvZiBtZXRoID09ICdvYmplY3QnKSB7XG4gICAgICAoe1xuICAgICAgICB2YWwsXG4gICAgICAgIHBhcmFtcyxcbiAgICAgICAgcmVzcCxcbiAgICAgICAgbWV0aFxuICAgICAgfSA9IG1ldGgpO1xuICAgIH1cbiAgICBpZiAobWV0aCAmJiAodmFsIHx8IHJlc3ApKSB7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgJ21ldGgnOiBtZXRoLFxuICAgICAgICAndmFsJzogdmFsLFxuICAgICAgICAncmVzcCc6IHJlc3AsXG4gICAgICAgICdwYXJhbXMnOiBwYXJhbXNcbiAgICAgIH1dO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgdG9waWMgdHlwZSBmcm9tIHRvcGljJ3MgbmFtZTogZ3JwLCBwMnAsIG1lLCBmbmQsIHN5cy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAc3RhdGljXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gdGVzdC5cbiAgICogQHJldHVybnMge3N0cmluZ30gT25lIG9mIDxjb2RlPlwibWVcIjwvY29kZT4sIDxjb2RlPlwiZm5kXCI8L2NvZGU+LCA8Y29kZT5cInN5c1wiPC9jb2RlPiwgPGNvZGU+XCJncnBcIjwvY29kZT4sXG4gICAqICAgIDxjb2RlPlwicDJwXCI8L2NvZGU+IG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4uXG4gICAqL1xuICBzdGF0aWMgdG9waWNUeXBlKG5hbWUpIHtcbiAgICByZXR1cm4gVG9waWMudG9waWNUeXBlKG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSBnaXZlbiB0b3BpYyBuYW1lIGlzIGEgbmFtZSBvZiBhICdtZScgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHRlc3QuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSAnbWUnIHRvcGljLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgc3RhdGljIGlzTWVUb3BpY05hbWUobmFtZSkge1xuICAgIHJldHVybiBUb3BpYy5pc01lVG9waWNOYW1lKG5hbWUpO1xuICB9XG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdG9waWMgbmFtZSBpcyBhIG5hbWUgb2YgYSBncm91cCB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAc3RhdGljXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gdGVzdC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZSBuYW1lIGlzIGEgbmFtZSBvZiBhIGdyb3VwIHRvcGljLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgc3RhdGljIGlzR3JvdXBUb3BpY05hbWUobmFtZSkge1xuICAgIHJldHVybiBUb3BpYy5pc0dyb3VwVG9waWNOYW1lKG5hbWUpO1xuICB9XG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdG9waWMgbmFtZSBpcyBhIG5hbWUgb2YgYSBwMnAgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHRlc3QuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBwMnAgdG9waWMsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBzdGF0aWMgaXNQMlBUb3BpY05hbWUobmFtZSkge1xuICAgIHJldHVybiBUb3BpYy5pc1AyUFRvcGljTmFtZShuYW1lKTtcbiAgfVxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIGdpdmVuIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgY29tbXVuaWNhdGlvbiB0b3BpYywgaS5lLiBQMlAgb3IgZ3JvdXAuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHRlc3QuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBwMnAgb3IgZ3JvdXAgdG9waWMsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBzdGF0aWMgaXNDb21tVG9waWNOYW1lKG5hbWUpIHtcbiAgICByZXR1cm4gVG9waWMuaXNDb21tVG9waWNOYW1lKG5hbWUpO1xuICB9XG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgdG9waWMgbmFtZSBpcyBhIG5hbWUgb2YgYSBuZXcgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIHRvcGljIG5hbWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBuZXcgdG9waWMsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBzdGF0aWMgaXNOZXdHcm91cFRvcGljTmFtZShuYW1lKSB7XG4gICAgcmV0dXJuIFRvcGljLmlzTmV3R3JvdXBUb3BpY05hbWUobmFtZSk7XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSB0b3BpYyBuYW1lIGlzIGEgbmFtZSBvZiBhIGNoYW5uZWwuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIHRvcGljIG5hbWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBjaGFubmVsLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgc3RhdGljIGlzQ2hhbm5lbFRvcGljTmFtZShuYW1lKSB7XG4gICAgcmV0dXJuIFRvcGljLmlzQ2hhbm5lbFRvcGljTmFtZShuYW1lKTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJuIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHZlcnNpb24gb2YgdGhpcyBUaW5vZGUgY2xpZW50IGxpYnJhcnkuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzZW1hbnRpYyB2ZXJzaW9uIG9mIHRoZSBsaWJyYXJ5LCBlLmcuIDxjb2RlPlwiMC4xNS41LXJjMVwiPC9jb2RlPi5cbiAgICovXG4gIHN0YXRpYyBnZXRWZXJzaW9uKCkge1xuICAgIHJldHVybiBDb25zdC5WRVJTSU9OO1xuICB9XG4gIC8qKlxuICAgKiBUbyB1c2UgVGlub2RlIGluIGEgbm9uIGJyb3dzZXIgY29udGV4dCwgc3VwcGx5IFdlYlNvY2tldCBhbmQgWE1MSHR0cFJlcXVlc3QgcHJvdmlkZXJzLlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHBhcmFtIHdzUHJvdmlkZXIgPGNvZGU+V2ViU29ja2V0PC9jb2RlPiBwcm92aWRlciwgZS5nLiBmb3Igbm9kZUpTICwgPGNvZGU+cmVxdWlyZSgnd3MnKTwvY29kZT4uXG4gICAqIEBwYXJhbSB4aHJQcm92aWRlciA8Y29kZT5YTUxIdHRwUmVxdWVzdDwvY29kZT4gcHJvdmlkZXIsIGUuZy4gZm9yIG5vZGUgPGNvZGU+cmVxdWlyZSgneGhyJyk8L2NvZGU+LlxuICAgKi9cbiAgc3RhdGljIHNldE5ldHdvcmtQcm92aWRlcnMod3NQcm92aWRlciwgeGhyUHJvdmlkZXIpIHtcbiAgICBXZWJTb2NrZXRQcm92aWRlciA9IHdzUHJvdmlkZXI7XG4gICAgWEhSUHJvdmlkZXIgPSB4aHJQcm92aWRlcjtcblxuICAgIENvbm5lY3Rpb24uc2V0TmV0d29ya1Byb3ZpZGVycyhXZWJTb2NrZXRQcm92aWRlciwgWEhSUHJvdmlkZXIpO1xuICAgIExhcmdlRmlsZUhlbHBlci5zZXROZXR3b3JrUHJvdmlkZXIoWEhSUHJvdmlkZXIpO1xuICB9XG4gIC8qKlxuICAgKiBUbyB1c2UgVGlub2RlIGluIGEgbm9uIGJyb3dzZXIgY29udGV4dCwgc3VwcGx5IDxjb2RlPmluZGV4ZWREQjwvY29kZT4gcHJvdmlkZXIuXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcGFyYW0gaWRiUHJvdmlkZXIgPGNvZGU+aW5kZXhlZERCPC9jb2RlPiBwcm92aWRlciwgZS5nLiBmb3Igbm9kZUpTICwgPGNvZGU+cmVxdWlyZSgnZmFrZS1pbmRleGVkZGInKTwvY29kZT4uXG4gICAqL1xuICBzdGF0aWMgc2V0RGF0YWJhc2VQcm92aWRlcihpZGJQcm92aWRlcikge1xuICAgIEluZGV4ZWREQlByb3ZpZGVyID0gaWRiUHJvdmlkZXI7XG5cbiAgICBEQkNhY2hlLnNldERhdGFiYXNlUHJvdmlkZXIoSW5kZXhlZERCUHJvdmlkZXIpO1xuICB9XG4gIC8qKlxuICAgKiBSZXR1cm4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgbmFtZSBhbmQgdmVyc2lvbiBvZiB0aGlzIFRpbm9kZSBsaWJyYXJ5LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBzdGF0aWNcbiAgICpcbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIG5hbWUgb2YgdGhlIGxpYnJhcnkgYW5kIGl0J3MgdmVyc2lvbi5cbiAgICovXG4gIHN0YXRpYyBnZXRMaWJyYXJ5KCkge1xuICAgIHJldHVybiBDb25zdC5MSUJSQVJZO1xuICB9XG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gc3RyaW5nIHJlcHJlc2VudHMgPGNvZGU+TlVMTDwvY29kZT4gdmFsdWUgYXMgZGVmaW5lZCBieSBUaW5vZGUgKDxjb2RlPidcXHUyNDIxJzwvY29kZT4pLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBzdGF0aWNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0ciAtIHN0cmluZyB0byBjaGVjayBmb3IgPGNvZGU+TlVMTDwvY29kZT4gdmFsdWUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiBzdHJpbmcgcmVwcmVzZW50cyA8Y29kZT5OVUxMPC9jb2RlPiB2YWx1ZSwgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIHN0YXRpYyBpc051bGxWYWx1ZShzdHIpIHtcbiAgICByZXR1cm4gc3RyID09PSBDb25zdC5ERUxfQ0hBUjtcbiAgfVxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIGdpdmVuIFVSTCBzdHJpbmcgaXMgYSByZWxhdGl2ZSBVUkwuXG4gICAqIENoZWNrIGZvciBjYXNlcyBsaWtlOlxuICAgKiAgPGNvZGU+J2h0dHA6Ly9leGFtcGxlLmNvbSc8L2NvZGU+XG4gICAqICA8Y29kZT4nIGh0dHA6Ly9leGFtcGxlLmNvbSc8L2NvZGU+XG4gICAqICA8Y29kZT4nLy9leGFtcGxlLmNvbS8nPC9jb2RlPlxuICAgKiAgPGNvZGU+J2h0dHA6ZXhhbXBsZS5jb20nPC9jb2RlPlxuICAgKiAgPGNvZGU+J2h0dHA6L2V4YW1wbGUuY29tJzwvY29kZT5cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAc3RhdGljXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBVUkwgc3RyaW5nIHRvIGNoZWNrLlxuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdGhlIFVSTCBpcyByZWxhdGl2ZSwgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIHN0YXRpYyBpc1JlbGF0aXZlVVJMKHVybCkge1xuICAgIHJldHVybiAhL15cXHMqKFthLXpdW2EtejAtOSsuLV0qOnxcXC9cXC8pL2ltLnRlc3QodXJsKTtcbiAgfVxuXG4gIC8vIEluc3RhbmNlIG1ldGhvZHMuXG5cbiAgLy8gR2VuZXJhdGVzIHVuaXF1ZSBtZXNzYWdlIElEc1xuICBnZXROZXh0VW5pcXVlSWQoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9tZXNzYWdlSWQgIT0gMCkgPyAnJyArIHRoaXMuX21lc3NhZ2VJZCsrIDogdW5kZWZpbmVkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb25uZWN0IHRvIHRoZSBzZXJ2ZXIuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBob3N0XyAtIG5hbWUgb2YgdGhlIGhvc3QgdG8gY29ubmVjdCB0by5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZX0gUHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBjb25uZWN0aW9uIGNhbGwgY29tcGxldGVzOlxuICAgKiAgICA8Y29kZT5yZXNvbHZlKCk8L2NvZGU+IGlzIGNhbGxlZCB3aXRob3V0IHBhcmFtZXRlcnMsIDxjb2RlPnJlamVjdCgpPC9jb2RlPiByZWNlaXZlcyB0aGVcbiAgICogICAgPGNvZGU+RXJyb3I8L2NvZGU+IGFzIGEgc2luZ2xlIHBhcmFtZXRlci5cbiAgICovXG4gIGNvbm5lY3QoaG9zdF8pIHtcbiAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbi5jb25uZWN0KGhvc3RfKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0IHRvIHJlY29ubmVjdCB0byB0aGUgc2VydmVyIGltbWVkaWF0ZWx5LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZm9yY2UgLSByZWNvbm5lY3QgZXZlbiBpZiB0aGVyZSBpcyBhIGNvbm5lY3Rpb24gYWxyZWFkeS5cbiAgICovXG4gIHJlY29ubmVjdChmb3JjZSkge1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24ucmVjb25uZWN0KGZvcmNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNjb25uZWN0IGZyb20gdGhlIHNlcnZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICovXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgdGhpcy5fY29ubmVjdGlvbi5kaXNjb25uZWN0KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgcGVyc2lzdGVudCBjYWNoZTogcmVtb3ZlIEluZGV4ZWREQi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHJldHVybiB7UHJvbWlzZX0gUHJvbWlzZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBvcGVyYXRpb24gaXMgY29tcGxldGVkLlxuICAgKi9cbiAgY2xlYXJTdG9yYWdlKCkge1xuICAgIGlmICh0aGlzLl9kYi5pc1JlYWR5KCkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kYi5kZWxldGVEYXRhYmFzZSgpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBwZXJzaXN0ZW50IGNhY2hlOiBjcmVhdGUgSW5kZXhlZERCIGNhY2hlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAcmV0dXJuIHtQcm9taXNlfSBQcm9taXNlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIG9wZXJhdGlvbiBpcyBjb21wbGV0ZWQuXG4gICAqL1xuICBpbml0U3RvcmFnZSgpIHtcbiAgICBpZiAoIXRoaXMuX2RiLmlzUmVhZHkoKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2RiLmluaXREYXRhYmFzZSgpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIG5ldHdvcmsgcHJvYmUgbWVzc2FnZSB0byBtYWtlIHN1cmUgdGhlIGNvbm5lY3Rpb24gaXMgYWxpdmUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqL1xuICBuZXR3b3JrUHJvYmUoKSB7XG4gICAgdGhpcy5fY29ubmVjdGlvbi5wcm9iZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGZvciBsaXZlIGNvbm5lY3Rpb24gdG8gc2VydmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdGhlcmUgaXMgYSBsaXZlIGNvbm5lY3Rpb24sIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbi5pc0Nvbm5lY3RlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNvbm5lY3Rpb24gaXMgYXV0aGVudGljYXRlZCAobGFzdCBsb2dpbiB3YXMgc3VjY2Vzc2Z1bCkuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiBhdXRoZW50aWNhdGVkLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNBdXRoZW50aWNhdGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9hdXRoZW50aWNhdGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBBUEkga2V5IGFuZCBhdXRoIHRva2VuIHRvIHRoZSByZWxhdGl2ZSBVUkwgbWFraW5nIGl0IHVzYWJsZSBmb3IgZ2V0dGluZyBkYXRhXG4gICAqIGZyb20gdGhlIHNlcnZlciBpbiBhIHNpbXBsZSA8Y29kZT5IVFRQIEdFVDwvY29kZT4gcmVxdWVzdC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IFVSTCAtIFVSTCB0byB3cmFwLlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBVUkwgd2l0aCBhcHBlbmRlZCBBUEkga2V5IGFuZCB0b2tlbiwgaWYgdmFsaWQgdG9rZW4gaXMgcHJlc2VudC5cbiAgICovXG4gIGF1dGhvcml6ZVVSTCh1cmwpIHtcbiAgICBpZiAodHlwZW9mIHVybCAhPSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBpZiAoVGlub2RlLmlzUmVsYXRpdmVVUkwodXJsKSkge1xuICAgICAgLy8gRmFrZSBiYXNlIHRvIG1ha2UgdGhlIHJlbGF0aXZlIFVSTCBwYXJzZWFibGUuXG4gICAgICBjb25zdCBiYXNlID0gJ3NjaGVtZTovL2hvc3QvJztcbiAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsLCBiYXNlKTtcbiAgICAgIGlmICh0aGlzLl9hcGlLZXkpIHtcbiAgICAgICAgcGFyc2VkLnNlYXJjaFBhcmFtcy5hcHBlbmQoJ2FwaWtleScsIHRoaXMuX2FwaUtleSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fYXV0aFRva2VuICYmIHRoaXMuX2F1dGhUb2tlbi50b2tlbikge1xuICAgICAgICBwYXJzZWQuc2VhcmNoUGFyYW1zLmFwcGVuZCgnYXV0aCcsICd0b2tlbicpO1xuICAgICAgICBwYXJzZWQuc2VhcmNoUGFyYW1zLmFwcGVuZCgnc2VjcmV0JywgdGhpcy5fYXV0aFRva2VuLnRva2VuKTtcbiAgICAgIH1cbiAgICAgIC8vIENvbnZlcnQgYmFjayB0byBzdHJpbmcgYW5kIHN0cmlwIGZha2UgYmFzZSBVUkwgZXhjZXB0IGZvciB0aGUgcm9vdCBzbGFzaC5cbiAgICAgIHVybCA9IHBhcnNlZC50b1N0cmluZygpLnN1YnN0cmluZyhiYXNlLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIEFjY291bnRQYXJhbXNcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5EZWZBY3M9fSBkZWZhY3MgLSBEZWZhdWx0IGFjY2VzcyBwYXJhbWV0ZXJzIGZvciB1c2VyJ3MgPGNvZGU+bWU8L2NvZGU+IHRvcGljLlxuICAgKiBAcHJvcGVydHkge09iamVjdD19IHB1YmxpYyAtIFB1YmxpYyBhcHBsaWNhdGlvbi1kZWZpbmVkIGRhdGEgZXhwb3NlZCBvbiA8Y29kZT5tZTwvY29kZT4gdG9waWMuXG4gICAqIEBwcm9wZXJ0eSB7T2JqZWN0PX0gcHJpdmF0ZSAtIFByaXZhdGUgYXBwbGljYXRpb24tZGVmaW5lZCBkYXRhIGFjY2Vzc2libGUgb24gPGNvZGU+bWU8L2NvZGU+IHRvcGljLlxuICAgKiBAcHJvcGVydHkge09iamVjdD19IHRydXN0ZWQgLSBUcnVzdGVkIHVzZXIgZGF0YSB3aGljaCBjYW4gYmUgc2V0IGJ5IGEgcm9vdCB1c2VyIG9ubHkuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuPHN0cmluZz59IHRhZ3MgLSBhcnJheSBvZiBzdHJpbmcgdGFncyBmb3IgdXNlciBkaXNjb3ZlcnkuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gdG9rZW4gLSBhdXRoZW50aWNhdGlvbiB0b2tlbiB0byB1c2UuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuPHN0cmluZz49fSBhdHRhY2htZW50cyAtIEFycmF5IG9mIHJlZmVyZW5jZXMgdG8gb3V0IG9mIGJhbmQgYXR0YWNobWVudHMgdXNlZCBpbiBhY2NvdW50IGRlc2NyaXB0aW9uLlxuICAgKi9cbiAgLyoqXG4gICAqIEB0eXBlZGVmIERlZkFjc1xuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gYXV0aCAtIEFjY2VzcyBtb2RlIGZvciA8Y29kZT5tZTwvY29kZT4gZm9yIGF1dGhlbnRpY2F0ZWQgdXNlcnMuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gYW5vbiAtIEFjY2VzcyBtb2RlIGZvciA8Y29kZT5tZTwvY29kZT4gZm9yIGFub255bW91cyB1c2Vycy5cbiAgICovXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBvciB1cGRhdGUgYW4gYWNjb3VudC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIFVzZXIgaWQgdG8gdXBkYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWUgLSBBdXRoZW50aWNhdGlvbiBzY2hlbWU7IDxjb2RlPlwiYmFzaWNcIjwvY29kZT4gYW5kIDxjb2RlPlwiYW5vbnltb3VzXCI8L2NvZGU+IGFyZSB0aGUgY3VycmVudGx5IHN1cHBvcnRlZCBzY2hlbWVzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2VjcmV0IC0gQXV0aGVudGljYXRpb24gc2VjcmV0LCBhc3N1bWVkIHRvIGJlIGFscmVhZHkgYmFzZTY0IGVuY29kZWQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGxvZ2luIC0gVXNlIG5ldyBhY2NvdW50IHRvIGF1dGhlbnRpY2F0ZSBjdXJyZW50IHNlc3Npb25cbiAgICogQHBhcmFtIHtUaW5vZGUuQWNjb3VudFBhcmFtcz19IHBhcmFtcyAtIFVzZXIgZGF0YSB0byBwYXNzIHRvIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiBzZXJ2ZXIgcmVwbHkgaXMgcmVjZWl2ZWQuXG4gICAqL1xuICBhY2NvdW50KHVpZCwgc2NoZW1lLCBzZWNyZXQsIGxvZ2luLCBwYXJhbXMpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLiNpbml0UGFja2V0KCdhY2MnKTtcbiAgICBwa3QuYWNjLnVzZXIgPSB1aWQ7XG4gICAgcGt0LmFjYy5zY2hlbWUgPSBzY2hlbWU7XG4gICAgcGt0LmFjYy5zZWNyZXQgPSBzZWNyZXQ7XG4gICAgLy8gTG9nIGluIHRvIHRoZSBuZXcgYWNjb3VudCB1c2luZyBzZWxlY3RlZCBzY2hlbWVcbiAgICBwa3QuYWNjLmxvZ2luID0gbG9naW47XG5cbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBwa3QuYWNjLmRlc2MuZGVmYWNzID0gcGFyYW1zLmRlZmFjcztcbiAgICAgIHBrdC5hY2MuZGVzYy5wdWJsaWMgPSBwYXJhbXMucHVibGljO1xuICAgICAgcGt0LmFjYy5kZXNjLnByaXZhdGUgPSBwYXJhbXMucHJpdmF0ZTtcbiAgICAgIHBrdC5hY2MuZGVzYy50cnVzdGVkID0gcGFyYW1zLnRydXN0ZWQ7XG5cbiAgICAgIHBrdC5hY2MudGFncyA9IHBhcmFtcy50YWdzO1xuICAgICAgcGt0LmFjYy5jcmVkID0gcGFyYW1zLmNyZWQ7XG5cbiAgICAgIHBrdC5hY2MudG9rZW4gPSBwYXJhbXMudG9rZW47XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmFtcy5hdHRhY2htZW50cykgJiYgcGFyYW1zLmF0dGFjaG1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcGt0LmV4dHJhID0ge1xuICAgICAgICAgIGF0dGFjaG1lbnRzOiBwYXJhbXMuYXR0YWNobWVudHMuZmlsdGVyKHJlZiA9PiBUaW5vZGUuaXNSZWxhdGl2ZVVSTChyZWYpKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLiNzZW5kKHBrdCwgcGt0LmFjYy5pZCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHVzZXIuIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjYWNjb3VudH0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWUgLSBBdXRoZW50aWNhdGlvbiBzY2hlbWU7IDxjb2RlPlwiYmFzaWNcIjwvY29kZT4gaXMgdGhlIG9ubHkgY3VycmVudGx5IHN1cHBvcnRlZCBzY2hlbWUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZWNyZXQgLSBBdXRoZW50aWNhdGlvbi5cbiAgICogQHBhcmFtIHtib29sZWFuPX0gbG9naW4gLSBVc2UgbmV3IGFjY291bnQgdG8gYXV0aGVudGljYXRlIGN1cnJlbnQgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1Rpbm9kZS5BY2NvdW50UGFyYW1zPX0gcGFyYW1zIC0gVXNlciBkYXRhIHRvIHBhc3MgdG8gdGhlIHNlcnZlci5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHNlcnZlciByZXBseSBpcyByZWNlaXZlZC5cbiAgICovXG4gIGNyZWF0ZUFjY291bnQoc2NoZW1lLCBzZWNyZXQsIGxvZ2luLCBwYXJhbXMpIHtcbiAgICBsZXQgcHJvbWlzZSA9IHRoaXMuYWNjb3VudChVU0VSX05FVywgc2NoZW1lLCBzZWNyZXQsIGxvZ2luLCBwYXJhbXMpO1xuICAgIGlmIChsb2dpbikge1xuICAgICAgcHJvbWlzZSA9IHByb21pc2UudGhlbigoY3RybCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy4jbG9naW5TdWNjZXNzZnVsKGN0cmwpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSB1c2VyIHdpdGggPGNvZGU+J2Jhc2ljJzwvY29kZT4gYXV0aGVudGljYXRpb24gc2NoZW1lIGFuZCBpbW1lZGlhdGVseVxuICAgKiB1c2UgaXQgZm9yIGF1dGhlbnRpY2F0aW9uLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2FjY291bnR9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcm5hbWUgLSBMb2dpbiB0byB1c2UgZm9yIHRoZSBuZXcgYWNjb3VudC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gVXNlcidzIHBhc3N3b3JkLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5BY2NvdW50UGFyYW1zPX0gcGFyYW1zIC0gVXNlciBkYXRhIHRvIHBhc3MgdG8gdGhlIHNlcnZlci5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHNlcnZlciByZXBseSBpcyByZWNlaXZlZC5cbiAgICovXG4gIGNyZWF0ZUFjY291bnRCYXNpYyh1c2VybmFtZSwgcGFzc3dvcmQsIHBhcmFtcykge1xuICAgIC8vIE1ha2Ugc3VyZSB3ZSBhcmUgbm90IHVzaW5nICdudWxsJyBvciAndW5kZWZpbmVkJztcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lIHx8ICcnO1xuICAgIHBhc3N3b3JkID0gcGFzc3dvcmQgfHwgJyc7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlQWNjb3VudCgnYmFzaWMnLFxuICAgICAgYjY0RW5jb2RlVW5pY29kZSh1c2VybmFtZSArICc6JyArIHBhc3N3b3JkKSwgdHJ1ZSwgcGFyYW1zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdXNlcidzIGNyZWRlbnRpYWxzIGZvciA8Y29kZT4nYmFzaWMnPC9jb2RlPiBhdXRoZW50aWNhdGlvbiBzY2hlbWUuIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjYWNjb3VudH0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1aWQgLSBVc2VyIElEIHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJuYW1lIC0gTG9naW4gdG8gdXNlIGZvciB0aGUgbmV3IGFjY291bnQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIFVzZXIncyBwYXNzd29yZC5cbiAgICogQHBhcmFtIHtUaW5vZGUuQWNjb3VudFBhcmFtcz19IHBhcmFtcyAtIGRhdGEgdG8gcGFzcyB0byB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gc2VydmVyIHJlcGx5IGlzIHJlY2VpdmVkLlxuICAgKi9cbiAgdXBkYXRlQWNjb3VudEJhc2ljKHVpZCwgdXNlcm5hbWUsIHBhc3N3b3JkLCBwYXJhbXMpIHtcbiAgICAvLyBNYWtlIHN1cmUgd2UgYXJlIG5vdCB1c2luZyAnbnVsbCcgb3IgJ3VuZGVmaW5lZCc7XG4gICAgdXNlcm5hbWUgPSB1c2VybmFtZSB8fCAnJztcbiAgICBwYXNzd29yZCA9IHBhc3N3b3JkIHx8ICcnO1xuICAgIHJldHVybiB0aGlzLmFjY291bnQodWlkLCAnYmFzaWMnLFxuICAgICAgYjY0RW5jb2RlVW5pY29kZSh1c2VybmFtZSArICc6JyArIHBhc3N3b3JkKSwgZmFsc2UsIHBhcmFtcyk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBoYW5kc2hha2UgdG8gdGhlIHNlcnZlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHNlcnZlciByZXBseSBpcyByZWNlaXZlZC5cbiAgICovXG4gIGhlbGxvKCkge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuI2luaXRQYWNrZXQoJ2hpJyk7XG5cbiAgICByZXR1cm4gdGhpcy4jc2VuZChwa3QsIHBrdC5oaS5pZClcbiAgICAgIC50aGVuKChjdHJsKSA9PiB7XG4gICAgICAgIC8vIFJlc2V0IGJhY2tvZmYgY291bnRlciBvbiBzdWNjZXNzZnVsIGNvbm5lY3Rpb24uXG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uYmFja29mZlJlc2V0KCk7XG5cbiAgICAgICAgLy8gU2VydmVyIHJlc3BvbnNlIGNvbnRhaW5zIHNlcnZlciBwcm90b2NvbCB2ZXJzaW9uLCBidWlsZCwgY29uc3RyYWludHMsXG4gICAgICAgIC8vIHNlc3Npb24gSUQgZm9yIGxvbmcgcG9sbGluZy4gU2F2ZSB0aGVtLlxuICAgICAgICBpZiAoY3RybC5wYXJhbXMpIHtcbiAgICAgICAgICB0aGlzLl9zZXJ2ZXJJbmZvID0gY3RybC5wYXJhbXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vbkNvbm5lY3QpIHtcbiAgICAgICAgICB0aGlzLm9uQ29ubmVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN0cmw7XG4gICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24ucmVjb25uZWN0KHRydWUpO1xuXG4gICAgICAgIGlmICh0aGlzLm9uRGlzY29ubmVjdCkge1xuICAgICAgICAgIHRoaXMub25EaXNjb25uZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBvciByZWZyZXNoIHRoZSBwdXNoIG5vdGlmaWNhdGlvbnMvZGV2aWNlIHRva2VuLiBJZiB0aGUgY2xpZW50IGlzIGNvbm5lY3RlZCxcbiAgICogdGhlIGRldmljZVRva2VuIGNhbiBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkdCAtIHRva2VuIG9idGFpbmVkIGZyb20gdGhlIHByb3ZpZGVyIG9yIDxjb2RlPmZhbHNlPC9jb2RlPixcbiAgICogICAgPGNvZGU+bnVsbDwvY29kZT4gb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPiB0byBjbGVhciB0aGUgdG9rZW4uXG4gICAqXG4gICAqIEByZXR1cm5zIDxjb2RlPnRydWU8L2NvZGU+IGlmIGF0dGVtcHQgd2FzIG1hZGUgdG8gc2VuZCB0aGUgdXBkYXRlIHRvIHRoZSBzZXJ2ZXIuXG4gICAqL1xuICBzZXREZXZpY2VUb2tlbihkdCkge1xuICAgIGxldCBzZW50ID0gZmFsc2U7XG4gICAgLy8gQ29udmVydCBhbnkgZmFsc2lzaCB2YWx1ZSB0byBudWxsLlxuICAgIGR0ID0gZHQgfHwgbnVsbDtcbiAgICBpZiAoZHQgIT0gdGhpcy5fZGV2aWNlVG9rZW4pIHtcbiAgICAgIHRoaXMuX2RldmljZVRva2VuID0gZHQ7XG4gICAgICBpZiAodGhpcy5pc0Nvbm5lY3RlZCgpICYmIHRoaXMuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgdGhpcy4jc2VuZCh7XG4gICAgICAgICAgJ2hpJzoge1xuICAgICAgICAgICAgJ2Rldic6IGR0IHx8IFRpbm9kZS5ERUxfQ0hBUlxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHNlbnQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBDcmVkZW50aWFsXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXRoIC0gdmFsaWRhdGlvbiBtZXRob2QuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2YWwgLSB2YWx1ZSB0byB2YWxpZGF0ZSAoZS5nLiBlbWFpbCBvciBwaG9uZSBudW1iZXIpLlxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gcmVzcCAtIHZhbGlkYXRpb24gcmVzcG9uc2UuXG4gICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBwYXJhbXMgLSB2YWxpZGF0aW9uIHBhcmFtZXRlcnMuXG4gICAqL1xuICAvKipcbiAgICogQXV0aGVudGljYXRlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNjaGVtZSAtIEF1dGhlbnRpY2F0aW9uIHNjaGVtZTsgPGNvZGU+XCJiYXNpY1wiPC9jb2RlPiBpcyB0aGUgb25seSBjdXJyZW50bHkgc3VwcG9ydGVkIHNjaGVtZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlY3JldCAtIEF1dGhlbnRpY2F0aW9uIHNlY3JldCwgYXNzdW1lZCB0byBiZSBhbHJlYWR5IGJhc2U2NCBlbmNvZGVkLlxuICAgKiBAcGFyYW0ge0NyZWRlbnRpYWw9fSBjcmVkIC0gY3JlZGVudGlhbCBjb25maXJtYXRpb24sIGlmIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gc2VydmVyIHJlcGx5IGlzIHJlY2VpdmVkLlxuICAgKi9cbiAgbG9naW4oc2NoZW1lLCBzZWNyZXQsIGNyZWQpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLiNpbml0UGFja2V0KCdsb2dpbicpO1xuICAgIHBrdC5sb2dpbi5zY2hlbWUgPSBzY2hlbWU7XG4gICAgcGt0LmxvZ2luLnNlY3JldCA9IHNlY3JldDtcbiAgICBwa3QubG9naW4uY3JlZCA9IGNyZWQ7XG5cbiAgICByZXR1cm4gdGhpcy4jc2VuZChwa3QsIHBrdC5sb2dpbi5pZClcbiAgICAgIC50aGVuKChjdHJsKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLiNsb2dpblN1Y2Nlc3NmdWwoY3RybCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI2xvZ2lufSB3aXRoIGJhc2ljIGF1dGhlbnRpY2F0aW9uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1bmFtZSAtIFVzZXIgbmFtZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkICAtIFBhc3N3b3JkLlxuICAgKiBAcGFyYW0ge0NyZWRlbnRpYWw9fSBjcmVkIC0gY3JlZGVudGlhbCBjb25maXJtYXRpb24sIGlmIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBsb2dpbkJhc2ljKHVuYW1lLCBwYXNzd29yZCwgY3JlZCkge1xuICAgIHJldHVybiB0aGlzLmxvZ2luKCdiYXNpYycsIGI2NEVuY29kZVVuaWNvZGUodW5hbWUgKyAnOicgKyBwYXNzd29yZCksIGNyZWQpXG4gICAgICAudGhlbigoY3RybCkgPT4ge1xuICAgICAgICB0aGlzLl9sb2dpbiA9IHVuYW1lO1xuICAgICAgICByZXR1cm4gY3RybDtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjbG9naW59IHdpdGggdG9rZW4gYXV0aGVudGljYXRpb25cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIC0gVG9rZW4gcmVjZWl2ZWQgaW4gcmVzcG9uc2UgdG8gZWFybGllciBsb2dpbi5cbiAgICogQHBhcmFtIHtDcmVkZW50aWFsPX0gY3JlZCAtIGNyZWRlbnRpYWwgY29uZmlybWF0aW9uLCBpZiByZXF1aXJlZC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgbG9naW5Ub2tlbih0b2tlbiwgY3JlZCkge1xuICAgIHJldHVybiB0aGlzLmxvZ2luKCd0b2tlbicsIHRva2VuLCBjcmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgcmVxdWVzdCBmb3IgcmVzZXR0aW5nIGFuIGF1dGhlbnRpY2F0aW9uIHNlY3JldC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNjaGVtZSAtIGF1dGhlbnRpY2F0aW9uIHNjaGVtZSB0byByZXNldC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIG1ldGhvZCB0byB1c2UgZm9yIHJlc2V0dGluZyB0aGUgc2VjcmV0LCBzdWNoIGFzIFwiZW1haWxcIiBvciBcInRlbFwiLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgLSB2YWx1ZSBvZiB0aGUgY3JlZGVudGlhbCB0byB1c2UsIGEgc3BlY2lmaWMgZW1haWwgYWRkcmVzcyBvciBhIHBob25lIG51bWJlci5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgdGhlIHNlcnZlciByZXBseS5cbiAgICovXG4gIHJlcXVlc3RSZXNldEF1dGhTZWNyZXQoc2NoZW1lLCBtZXRob2QsIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMubG9naW4oJ3Jlc2V0JywgYjY0RW5jb2RlVW5pY29kZShzY2hlbWUgKyAnOicgKyBtZXRob2QgKyAnOicgKyB2YWx1ZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIEF1dGhUb2tlblxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0b2tlbiAtIFRva2VuIHZhbHVlLlxuICAgKiBAcHJvcGVydHkge0RhdGV9IGV4cGlyZXMgLSBUb2tlbiBleHBpcmF0aW9uIHRpbWUuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHN0b3JlZCBhdXRoZW50aWNhdGlvbiB0b2tlbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHJldHVybnMge1Rpbm9kZS5BdXRoVG9rZW59IGF1dGhlbnRpY2F0aW9uIHRva2VuLlxuICAgKi9cbiAgZ2V0QXV0aFRva2VuKCkge1xuICAgIGlmICh0aGlzLl9hdXRoVG9rZW4gJiYgKHRoaXMuX2F1dGhUb2tlbi5leHBpcmVzLmdldFRpbWUoKSA+IERhdGUubm93KCkpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYXV0aFRva2VuO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9hdXRoVG9rZW4gPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWNhdGlvbiBtYXkgcHJvdmlkZSBhIHNhdmVkIGF1dGhlbnRpY2F0aW9uIHRva2VuLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5BdXRoVG9rZW59IHRva2VuIC0gYXV0aGVudGljYXRpb24gdG9rZW4uXG4gICAqL1xuICBzZXRBdXRoVG9rZW4odG9rZW4pIHtcbiAgICB0aGlzLl9hdXRoVG9rZW4gPSB0b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBTZXRQYXJhbXNcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5TZXREZXNjPX0gZGVzYyAtIFRvcGljIGluaXRpYWxpemF0aW9uIHBhcmFtZXRlcnMgd2hlbiBjcmVhdGluZyBhIG5ldyB0b3BpYyBvciBhIG5ldyBzdWJzY3JpcHRpb24uXG4gICAqIEBwcm9wZXJ0eSB7VGlub2RlLlNldFN1Yj19IHN1YiAtIFN1YnNjcmlwdGlvbiBpbml0aWFsaXphdGlvbiBwYXJhbWV0ZXJzLlxuICAgKiBAcHJvcGVydHkge0FycmF5LjxzdHJpbmc+PX0gYXR0YWNobWVudHMgLSBVUkxzIG9mIG91dCBvZiBiYW5kIGF0dGFjaG1lbnRzIHVzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBTZXREZXNjXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBtZW1iZXJvZiBUaW5vZGVcbiAgICogQHByb3BlcnR5IHtUaW5vZGUuRGVmQWNzPX0gZGVmYWNzIC0gRGVmYXVsdCBhY2Nlc3MgbW9kZS5cbiAgICogQHByb3BlcnR5IHtPYmplY3Q9fSBwdWJsaWMgLSBGcmVlLWZvcm0gdG9waWMgZGVzY3JpcHRpb24sIHB1YmxpY2FsbHkgYWNjZXNzaWJsZS5cbiAgICogQHByb3BlcnR5IHtPYmplY3Q9fSBwcml2YXRlIC0gRnJlZS1mb3JtIHRvcGljIGRlc2NyaXB0aW9uIGFjY2Vzc2libGUgb25seSB0byB0aGUgb3duZXIuXG4gICAqIEBwcm9wZXJ0eSB7T2JqZWN0PX0gdHJ1c3RlZCAtIFRydXN0ZWQgdXNlciBkYXRhIHdoaWNoIGNhbiBiZSBzZXQgYnkgYSByb290IHVzZXIgb25seS5cbiAgICovXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBTZXRTdWJcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge3N0cmluZz19IHVzZXIgLSBVSUQgb2YgdGhlIHVzZXIgYWZmZWN0ZWQgYnkgdGhlIHJlcXVlc3QuIERlZmF1bHQgKGVtcHR5KSAtIGN1cnJlbnQgdXNlci5cbiAgICogQHByb3BlcnR5IHtzdHJpbmc9fSBtb2RlIC0gVXNlciBhY2Nlc3MgbW9kZSwgZWl0aGVyIHJlcXVlc3RlZCBvciBhc3NpZ25lZCBkZXBlbmRlbnQgb24gY29udGV4dC5cbiAgICovXG4gIC8qKlxuICAgKiBQYXJhbWV0ZXJzIHBhc3NlZCB0byB7QGxpbmsgVGlub2RlI3N1YnNjcmliZX0uXG4gICAqXG4gICAqIEB0eXBlZGVmIFN1YnNjcmlwdGlvblBhcmFtc1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBwcm9wZXJ0eSB7VGlub2RlLlNldFBhcmFtcz19IHNldCAtIFBhcmFtZXRlcnMgdXNlZCB0byBpbml0aWFsaXplIHRvcGljXG4gICAqIEBwcm9wZXJ0eSB7VGlub2RlLkdldFF1ZXJ5PX0gZ2V0IC0gUXVlcnkgZm9yIGZldGNoaW5nIGRhdGEgZnJvbSB0b3BpYy5cbiAgICovXG5cbiAgLyoqXG4gICAqIFNlbmQgYSB0b3BpYyBzdWJzY3JpcHRpb24gcmVxdWVzdC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gc3Vic2NyaWJlIHRvLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5HZXRRdWVyeT19IGdldFBhcmFtcyAtIE9wdGlvbmFsIHN1YnNjcmlwdGlvbiBtZXRhZGF0YSBxdWVyeVxuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXRQYXJhbXM9fSBzZXRQYXJhbXMgLSBPcHRpb25hbCBpbml0aWFsaXphdGlvbiBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIHN1YnNjcmliZSh0b3BpY05hbWUsIGdldFBhcmFtcywgc2V0UGFyYW1zKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy4jaW5pdFBhY2tldCgnc3ViJywgdG9waWNOYW1lKVxuICAgIGlmICghdG9waWNOYW1lKSB7XG4gICAgICB0b3BpY05hbWUgPSBDb25zdC5UT1BJQ19ORVc7XG4gICAgfVxuXG4gICAgcGt0LnN1Yi5nZXQgPSBnZXRQYXJhbXM7XG5cbiAgICBpZiAoc2V0UGFyYW1zKSB7XG4gICAgICBpZiAoc2V0UGFyYW1zLnN1Yikge1xuICAgICAgICBwa3Quc3ViLnNldC5zdWIgPSBzZXRQYXJhbXMuc3ViO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2V0UGFyYW1zLmRlc2MpIHtcbiAgICAgICAgY29uc3QgZGVzYyA9IHNldFBhcmFtcy5kZXNjO1xuICAgICAgICBpZiAoVGlub2RlLmlzTmV3R3JvdXBUb3BpY05hbWUodG9waWNOYW1lKSkge1xuICAgICAgICAgIC8vIEZ1bGwgc2V0LmRlc2MgcGFyYW1zIGFyZSB1c2VkIGZvciBuZXcgdG9waWNzIG9ubHlcbiAgICAgICAgICBwa3Quc3ViLnNldC5kZXNjID0gZGVzYztcbiAgICAgICAgfSBlbHNlIGlmIChUaW5vZGUuaXNQMlBUb3BpY05hbWUodG9waWNOYW1lKSAmJiBkZXNjLmRlZmFjcykge1xuICAgICAgICAgIC8vIFVzZSBvcHRpb25hbCBkZWZhdWx0IHBlcm1pc3Npb25zIG9ubHkuXG4gICAgICAgICAgcGt0LnN1Yi5zZXQuZGVzYyA9IHtcbiAgICAgICAgICAgIGRlZmFjczogZGVzYy5kZWZhY3NcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFNlZSBpZiBleHRlcm5hbCBvYmplY3RzIHdlcmUgdXNlZCBpbiB0b3BpYyBkZXNjcmlwdGlvbi5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHNldFBhcmFtcy5hdHRhY2htZW50cykgJiYgc2V0UGFyYW1zLmF0dGFjaG1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcGt0LmV4dHJhID0ge1xuICAgICAgICAgIGF0dGFjaG1lbnRzOiBzZXRQYXJhbXMuYXR0YWNobWVudHMuZmlsdGVyKHJlZiA9PiBUaW5vZGUuaXNSZWxhdGl2ZVVSTChyZWYpKVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoc2V0UGFyYW1zLnRhZ3MpIHtcbiAgICAgICAgcGt0LnN1Yi5zZXQudGFncyA9IHNldFBhcmFtcy50YWdzO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jc2VuZChwa3QsIHBrdC5zdWIuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGFjaCBhbmQgb3B0aW9uYWxseSB1bnN1YnNjcmliZSBmcm9tIHRoZSB0b3BpY1xuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWMgLSBUb3BpYyB0byBkZXRhY2ggZnJvbS5cbiAgICogQHBhcmFtIHtib29sZWFufSB1bnN1YiAtIElmIDxjb2RlPnRydWU8L2NvZGU+LCBkZXRhY2ggYW5kIHVuc3Vic2NyaWJlLCBvdGhlcndpc2UganVzdCBkZXRhY2guXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGxlYXZlKHRvcGljLCB1bnN1Yikge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuI2luaXRQYWNrZXQoJ2xlYXZlJywgdG9waWMpO1xuICAgIHBrdC5sZWF2ZS51bnN1YiA9IHVuc3ViO1xuXG4gICAgcmV0dXJuIHRoaXMuI3NlbmQocGt0LCBwa3QubGVhdmUuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBtZXNzYWdlIGRyYWZ0IHdpdGhvdXQgc2VuZGluZyBpdCB0byB0aGUgc2VydmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWMgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byBwdWJsaXNoIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gY29udGVudCAtIFBheWxvYWQgdG8gcHVibGlzaC5cbiAgICogQHBhcmFtIHtib29sZWFuPX0gbm9FY2hvIC0gSWYgPGNvZGU+dHJ1ZTwvY29kZT4sIHRlbGwgdGhlIHNlcnZlciBub3QgdG8gZWNobyB0aGUgbWVzc2FnZSB0byB0aGUgb3JpZ2luYWwgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH0gbmV3IG1lc3NhZ2Ugd2hpY2ggY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBvciBvdGhlcndpc2UgdXNlZC5cbiAgICovXG4gIGNyZWF0ZU1lc3NhZ2UodG9waWMsIGNvbnRlbnQsIG5vRWNobykge1xuICAgIGNvbnN0IHBrdCA9IHRoaXMuI2luaXRQYWNrZXQoJ3B1YicsIHRvcGljKTtcblxuICAgIGxldCBkZnQgPSB0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJyA/IERyYWZ0eS5wYXJzZShjb250ZW50KSA6IGNvbnRlbnQ7XG4gICAgaWYgKGRmdCAmJiAhRHJhZnR5LmlzUGxhaW5UZXh0KGRmdCkpIHtcbiAgICAgIHBrdC5wdWIuaGVhZCA9IHtcbiAgICAgICAgbWltZTogRHJhZnR5LmdldENvbnRlbnRUeXBlKClcbiAgICAgIH07XG4gICAgICBjb250ZW50ID0gZGZ0O1xuICAgIH1cbiAgICBwa3QucHViLm5vZWNobyA9IG5vRWNobztcbiAgICBwa3QucHViLmNvbnRlbnQgPSBjb250ZW50O1xuXG4gICAgcmV0dXJuIHBrdC5wdWI7XG4gIH1cblxuICAvKipcbiAgICogUHVibGlzaCB7ZGF0YX0gbWVzc2FnZSB0byB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gcHVibGlzaCB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRlbnQgLSBQYXlsb2FkIHRvIHB1Ymxpc2guXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IG5vRWNobyAtIElmIDxjb2RlPnRydWU8L2NvZGU+LCB0ZWxsIHRoZSBzZXJ2ZXIgbm90IHRvIGVjaG8gdGhlIG1lc3NhZ2UgdG8gdGhlIG9yaWdpbmFsIHNlc3Npb24uXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIHB1Ymxpc2godG9waWMsIGNvbnRlbnQsIG5vRWNobykge1xuICAgIHJldHVybiB0aGlzLnB1Ymxpc2hNZXNzYWdlKFxuICAgICAgdGhpcy5jcmVhdGVNZXNzYWdlKHRvcGljLCBjb250ZW50LCBub0VjaG8pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQdWJsaXNoIG1lc3NhZ2UgdG8gdG9waWMuIFRoZSBtZXNzYWdlIHNob3VsZCBiZSBjcmVhdGVkIGJ5IHtAbGluayBUaW5vZGUjY3JlYXRlTWVzc2FnZX0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwdWIgLSBNZXNzYWdlIHRvIHB1Ymxpc2guXG4gICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz49fSBhdHRhY2htZW50cyAtIGFycmF5IG9mIFVSTHMgd2l0aCBhdHRhY2htZW50cy5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgcHVibGlzaE1lc3NhZ2UocHViLCBhdHRhY2htZW50cykge1xuICAgIC8vIE1ha2UgYSBzaGFsbG93IGNvcHkuIE5lZWRlZCBpbiBvcmRlciB0byBjbGVhciBsb2NhbGx5LWFzc2lnbmVkIHRlbXAgdmFsdWVzO1xuICAgIHB1YiA9IE9iamVjdC5hc3NpZ24oe30sIHB1Yik7XG4gICAgcHViLnNlcSA9IHVuZGVmaW5lZDtcbiAgICBwdWIuZnJvbSA9IHVuZGVmaW5lZDtcbiAgICBwdWIudHMgPSB1bmRlZmluZWQ7XG4gICAgY29uc3QgbXNnID0ge1xuICAgICAgcHViOiBwdWIsXG4gICAgfTtcbiAgICBpZiAoYXR0YWNobWVudHMpIHtcbiAgICAgIG1zZy5leHRyYSA9IHtcbiAgICAgICAgYXR0YWNobWVudHM6IGF0dGFjaG1lbnRzLmZpbHRlcihyZWYgPT4gVGlub2RlLmlzUmVsYXRpdmVVUkwocmVmKSlcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNzZW5kKG1zZywgcHViLmlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdXQgb2YgYmFuZCBub3RpZmljYXRpb246IG5vdGlmeSB0b3BpYyB0aGF0IGFuIGV4dGVybmFsIChwdXNoKSBub3RpZmljYXRpb24gd2FzIHJlY2l2ZWQgYnkgdGhlIGNsaWVudC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIG5hbWUgb2YgdGhlIHVwZGF0ZWQgdG9waWMuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBzZXEgSUQgb2YgdGhlIG5ldyBtZXNzYWdlLlxuICAgKiBAcGFyYW0ge3N0cmluZz19IGFjdCAtIFVJRCBvZiB0aGUgc2VuZGVyOyBkZWZhdWx0IGlzIGN1cnJlbnQuXG4gICAqL1xuICBvb2JOb3RpZmljYXRpb24odG9waWNOYW1lLCBzZXEsIGFjdCkge1xuICAgIGNvbnN0IHRvcGljID0gdGhpcy4jY2FjaGVHZXQoJ3RvcGljJywgdG9waWNOYW1lKTtcbiAgICBpZiAodG9waWMpIHtcbiAgICAgIHRvcGljLl91cGRhdGVSZWNlaXZlZChzZXEsIGFjdCk7XG4gICAgICB0aGlzLmdldE1lVG9waWMoKS5fcmVmcmVzaENvbnRhY3QoJ21zZycsIHRvcGljKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHR5cGVkZWYgR2V0UXVlcnlcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5HZXRPcHRzVHlwZT19IGRlc2MgLSBJZiBwcm92aWRlZCAoZXZlbiBpZiBlbXB0eSksIGZldGNoIHRvcGljIGRlc2NyaXB0aW9uLlxuICAgKiBAcHJvcGVydHkge1Rpbm9kZS5HZXRPcHRzVHlwZT19IHN1YiAtIElmIHByb3ZpZGVkIChldmVuIGlmIGVtcHR5KSwgZmV0Y2ggdG9waWMgc3Vic2NyaXB0aW9ucy5cbiAgICogQHByb3BlcnR5IHtUaW5vZGUuR2V0RGF0YVR5cGU9fSBkYXRhIC0gSWYgcHJvdmlkZWQgKGV2ZW4gaWYgZW1wdHkpLCBnZXQgbWVzc2FnZXMuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBHZXRPcHRzVHlwZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEBwcm9wZXJ0eSB7RGF0ZT19IGltcyAtIFwiSWYgbW9kaWZpZWQgc2luY2VcIiwgZmV0Y2ggZGF0YSBvbmx5IGl0IHdhcyB3YXMgbW9kaWZpZWQgc2luY2Ugc3RhdGVkIGRhdGUuXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyPX0gbGltaXQgLSBNYXhpbXVtIG51bWJlciBvZiByZXN1bHRzIHRvIHJldHVybi4gSWdub3JlZCB3aGVuIHF1ZXJ5aW5nIHRvcGljIGRlc2NyaXB0aW9uLlxuICAgKi9cblxuICAvKipcbiAgICogQHR5cGVkZWYgR2V0RGF0YVR5cGVcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge251bWJlcj19IHNpbmNlIC0gTG9hZCBtZXNzYWdlcyB3aXRoIHNlcSBpZCBlcXVhbCBvciBncmVhdGVyIHRoYW4gdGhpcyB2YWx1ZS5cbiAgICogQHByb3BlcnR5IHtudW1iZXI9fSBiZWZvcmUgLSBMb2FkIG1lc3NhZ2VzIHdpdGggc2VxIGlkIGxvd2VyIHRoYW4gdGhpcyBudW1iZXIuXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyPX0gbGltaXQgLSBNYXhpbXVtIG51bWJlciBvZiByZXN1bHRzIHRvIHJldHVybi5cbiAgICovXG5cbiAgLyoqXG4gICAqIFJlcXVlc3QgdG9waWMgbWV0YWRhdGFcbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gcXVlcnkuXG4gICAqIEBwYXJhbSB7VGlub2RlLkdldFF1ZXJ5fSBwYXJhbXMgLSBQYXJhbWV0ZXJzIG9mIHRoZSBxdWVyeS4gVXNlIHtAbGluayBUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IHRvIGdlbmVyYXRlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBnZXRNZXRhKHRvcGljLCBwYXJhbXMpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLiNpbml0UGFja2V0KCdnZXQnLCB0b3BpYyk7XG5cbiAgICBwa3QuZ2V0ID0gbWVyZ2VPYmoocGt0LmdldCwgcGFyYW1zKTtcblxuICAgIHJldHVybiB0aGlzLiNzZW5kKHBrdCwgcGt0LmdldC5pZCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRvcGljJ3MgbWV0YWRhdGE6IGRlc2NyaXB0aW9uLCBzdWJzY3JpYnRpb25zLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWMgLSBUb3BpYyB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSB7VGlub2RlLlNldFBhcmFtc30gcGFyYW1zIC0gdG9waWMgbWV0YWRhdGEgdG8gdXBkYXRlLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBzZXRNZXRhKHRvcGljLCBwYXJhbXMpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLiNpbml0UGFja2V0KCdzZXQnLCB0b3BpYyk7XG4gICAgY29uc3Qgd2hhdCA9IFtdO1xuXG4gICAgaWYgKHBhcmFtcykge1xuICAgICAgWydkZXNjJywgJ3N1YicsICd0YWdzJywgJ2NyZWQnXS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBpZiAocGFyYW1zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICB3aGF0LnB1c2goa2V5KTtcbiAgICAgICAgICBwa3Quc2V0W2tleV0gPSBwYXJhbXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmFtcy5hdHRhY2htZW50cykgJiYgcGFyYW1zLmF0dGFjaG1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcGt0LmV4dHJhID0ge1xuICAgICAgICAgIGF0dGFjaG1lbnRzOiBwYXJhbXMuYXR0YWNobWVudHMuZmlsdGVyKHJlZiA9PiBUaW5vZGUuaXNSZWxhdGl2ZVVSTChyZWYpKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh3aGF0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiSW52YWxpZCB7c2V0fSBwYXJhbWV0ZXJzXCIpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy4jc2VuZChwa3QsIHBrdC5zZXQuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJhbmdlIG9mIG1lc3NhZ2UgSURzIHRvIGRlbGV0ZS5cbiAgICpcbiAgICogQHR5cGVkZWYgRGVsUmFuZ2VcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAcHJvcGVydHkge251bWJlcn0gbG93IC0gbG93IGVuZCBvZiB0aGUgcmFuZ2UsIGluY2x1c2l2ZSAoY2xvc2VkKS5cbiAgICogQHByb3BlcnR5IHtudW1iZXI9fSBoaSAtIGhpZ2ggZW5kIG9mIHRoZSByYW5nZSwgZXhjbHVzaXZlIChvcGVuKS5cbiAgICovXG4gIC8qKlxuICAgKiBEZWxldGUgc29tZSBvciBhbGwgbWVzc2FnZXMgaW4gYSB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljIC0gVG9waWMgbmFtZSB0byBkZWxldGUgbWVzc2FnZXMgZnJvbS5cbiAgICogQHBhcmFtIHtUaW5vZGUuRGVsUmFuZ2VbXX0gbGlzdCAtIFJhbmdlcyBvZiBtZXNzYWdlIElEcyB0byBkZWxldGUuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGhhcmQgLSBIYXJkIG9yIHNvZnQgZGVsZXRlXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgb24gcmVjZWl2aW5nIHNlcnZlciByZXBseS5cbiAgICovXG4gIGRlbE1lc3NhZ2VzKHRvcGljLCByYW5nZXMsIGhhcmQpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLiNpbml0UGFja2V0KCdkZWwnLCB0b3BpYyk7XG5cbiAgICBwa3QuZGVsLndoYXQgPSAnbXNnJztcbiAgICBwa3QuZGVsLmRlbHNlcSA9IHJhbmdlcztcbiAgICBwa3QuZGVsLmhhcmQgPSBoYXJkO1xuXG4gICAgcmV0dXJuIHRoaXMuI3NlbmQocGt0LCBwa3QuZGVsLmlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhlIHRvcGljIGFsbHRvZ2V0aGVyLiBSZXF1aXJlcyBPd25lciBwZXJtaXNzaW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWNOYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gZGVsZXRlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaGFyZCAtIGhhcmQtZGVsZXRlIHRvcGljLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBkZWxUb3BpYyh0b3BpY05hbWUsIGhhcmQpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLiNpbml0UGFja2V0KCdkZWwnLCB0b3BpY05hbWUpO1xuICAgIHBrdC5kZWwud2hhdCA9ICd0b3BpYyc7XG4gICAgcGt0LmRlbC5oYXJkID0gaGFyZDtcblxuICAgIHJldHVybiB0aGlzLiNzZW5kKHBrdCwgcGt0LmRlbC5pZCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHN1YnNjcmlwdGlvbi4gUmVxdWlyZXMgU2hhcmUgcGVybWlzc2lvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIGRlbGV0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlciAtIFVzZXIgSUQgdG8gcmVtb3ZlLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBkZWxTdWJzY3JpcHRpb24odG9waWNOYW1lLCB1c2VyKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy4jaW5pdFBhY2tldCgnZGVsJywgdG9waWNOYW1lKTtcbiAgICBwa3QuZGVsLndoYXQgPSAnc3ViJztcbiAgICBwa3QuZGVsLnVzZXIgPSB1c2VyO1xuXG4gICAgcmV0dXJuIHRoaXMuI3NlbmQocGt0LCBwa3QuZGVsLmlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgY3JlZGVudGlhbC4gQWx3YXlzIHNlbnQgb24gPGNvZGU+J21lJzwvY29kZT4gdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSB2YWxpZGF0aW9uIG1ldGhvZCBzdWNoIGFzIDxjb2RlPidlbWFpbCc8L2NvZGU+IG9yIDxjb2RlPid0ZWwnPC9jb2RlPi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gdmFsaWRhdGlvbiB2YWx1ZSwgaS5lLiA8Y29kZT4nYWxpY2VAZXhhbXBsZS5jb20nPC9jb2RlPi5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgZGVsQ3JlZGVudGlhbChtZXRob2QsIHZhbHVlKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy4jaW5pdFBhY2tldCgnZGVsJywgQ29uc3QuVE9QSUNfTUUpO1xuICAgIHBrdC5kZWwud2hhdCA9ICdjcmVkJztcbiAgICBwa3QuZGVsLmNyZWQgPSB7XG4gICAgICBtZXRoOiBtZXRob2QsXG4gICAgICB2YWw6IHZhbHVlXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLiNzZW5kKHBrdCwgcGt0LmRlbC5pZCk7XG4gIH1cblxuICAvKipcbiAgICogUmVxdWVzdCB0byBkZWxldGUgYWNjb3VudCBvZiB0aGUgY3VycmVudCB1c2VyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhhcmQgLSBoYXJkLWRlbGV0ZSB1c2VyLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIG9uIHJlY2VpdmluZyBzZXJ2ZXIgcmVwbHkuXG4gICAqL1xuICBkZWxDdXJyZW50VXNlcihoYXJkKSB7XG4gICAgY29uc3QgcGt0ID0gdGhpcy4jaW5pdFBhY2tldCgnZGVsJywgbnVsbCk7XG4gICAgcGt0LmRlbC53aGF0ID0gJ3VzZXInO1xuICAgIHBrdC5kZWwuaGFyZCA9IGhhcmQ7XG5cbiAgICByZXR1cm4gdGhpcy4jc2VuZChwa3QsIHBrdC5kZWwuaWQpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIHRoaXMuX215VUlEID0gbnVsbDtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3RpZnkgc2VydmVyIHRoYXQgYSBtZXNzYWdlIG9yIG1lc3NhZ2VzIHdlcmUgcmVhZCBvciByZWNlaXZlZC4gRG9lcyBOT1QgcmV0dXJuIHByb21pc2UuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB3aGVyZSB0aGUgbWVzYWdlIGlzIGJlaW5nIGFrbm93bGVkZ2VkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gd2hhdCAtIEFjdGlvbiBiZWluZyBha25vd2xlZGdlZCwgZWl0aGVyIDxjb2RlPlwicmVhZFwiPC9jb2RlPiBvciA8Y29kZT5cInJlY3ZcIjwvY29kZT4uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBNYXhpbXVtIGlkIG9mIHRoZSBtZXNzYWdlIGJlaW5nIGFja25vd2xlZGdlZC5cbiAgICovXG4gIG5vdGUodG9waWNOYW1lLCB3aGF0LCBzZXEpIHtcbiAgICBpZiAoc2VxIDw9IDAgfHwgc2VxID49IENvbnN0LkxPQ0FMX1NFUUlEKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbWVzc2FnZSBpZCAke3NlcX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBwa3QgPSB0aGlzLiNpbml0UGFja2V0KCdub3RlJywgdG9waWNOYW1lKTtcbiAgICBwa3Qubm90ZS53aGF0ID0gd2hhdDtcbiAgICBwa3Qubm90ZS5zZXEgPSBzZXE7XG4gICAgdGhpcy4jc2VuZChwa3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJyb2FkY2FzdCBhIGtleS1wcmVzcyBub3RpZmljYXRpb24gdG8gdG9waWMgc3Vic2NyaWJlcnMuIFVzZWQgdG8gc2hvd1xuICAgKiB0eXBpbmcgbm90aWZpY2F0aW9ucyBcInVzZXIgWCBpcyB0eXBpbmcuLi5cIi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvcGljTmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIGJyb2FkY2FzdCB0by5cbiAgICovXG4gIG5vdGVLZXlQcmVzcyh0b3BpY05hbWUpIHtcbiAgICBjb25zdCBwa3QgPSB0aGlzLiNpbml0UGFja2V0KCdub3RlJywgdG9waWNOYW1lKTtcbiAgICBwa3Qubm90ZS53aGF0ID0gJ2twJztcbiAgICB0aGlzLiNzZW5kKHBrdCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbmFtZWQgdG9waWMsIGVpdGhlciBwdWxsIGl0IGZyb20gY2FjaGUgb3IgY3JlYXRlIGEgbmV3IGluc3RhbmNlLlxuICAgKiBUaGVyZSBpcyBhIHNpbmdsZSBpbnN0YW5jZSBvZiB0b3BpYyBmb3IgZWFjaCBuYW1lLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWNOYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyB7VGlub2RlLlRvcGljfSBSZXF1ZXN0ZWQgb3IgbmV3bHkgY3JlYXRlZCB0b3BpYyBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+IGlmIHRvcGljIG5hbWUgaXMgaW52YWxpZC5cbiAgICovXG4gIGdldFRvcGljKHRvcGljTmFtZSkge1xuICAgIGxldCB0b3BpYyA9IHRoaXMuI2NhY2hlR2V0KCd0b3BpYycsIHRvcGljTmFtZSk7XG4gICAgaWYgKCF0b3BpYyAmJiB0b3BpY05hbWUpIHtcbiAgICAgIGlmICh0b3BpY05hbWUgPT0gQ29uc3QuVE9QSUNfTUUpIHtcbiAgICAgICAgdG9waWMgPSBuZXcgVG9waWNNZSgpO1xuICAgICAgfSBlbHNlIGlmICh0b3BpY05hbWUgPT0gQ29uc3QuVE9QSUNfRk5EKSB7XG4gICAgICAgIHRvcGljID0gbmV3IFRvcGljRm5kKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b3BpYyA9IG5ldyBUb3BpYyh0b3BpY05hbWUpO1xuICAgICAgfVxuICAgICAgLy8gQ2FjaGUgbWFuYWdlbWVudC5cbiAgICAgIHRoaXMuI2F0dGFjaENhY2hlVG9Ub3BpYyh0b3BpYyk7XG4gICAgICB0b3BpYy5fY2FjaGVQdXRTZWxmKCk7XG4gICAgICAvLyBEb24ndCBzYXZlIHRvIERCIGhlcmU6IGEgcmVjb3JkIHdpbGwgYmUgYWRkZWQgd2hlbiB0aGUgdG9waWMgaXMgc3Vic2NyaWJlZC5cbiAgICB9XG4gICAgcmV0dXJuIHRvcGljO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIG5hbWVkIHRvcGljIGZyb20gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byBnZXQuXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuVG9waWN9IFJlcXVlc3RlZCB0b3BpYyBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+IGlmIHRvcGljIGlzIG5vdCBmb3VuZCBpbiBjYWNoZS5cbiAgICovXG4gIGNhY2hlR2V0VG9waWModG9waWNOYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NhY2hlR2V0KCd0b3BpYycsIHRvcGljTmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIG5hbWVkIHRvcGljIGZyb20gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byByZW1vdmUgZnJvbSBjYWNoZS5cbiAgICovXG4gIGNhY2hlUmVtVG9waWModG9waWNOYW1lKSB7XG4gICAgdGhpcy4jY2FjaGVEZWwoJ3RvcGljJywgdG9waWNOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2FjaGVkIHRvcGljcy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIGNhbGxiYWNrIHRvIGNhbGwgZm9yIGVhY2ggdG9waWMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gJ3RoaXMnIGluc2lkZSB0aGUgJ2Z1bmMnLlxuICAgKi9cbiAgbWFwVG9waWNzKGZ1bmMsIGNvbnRleHQpIHtcbiAgICB0aGlzLiNjYWNoZU1hcCgndG9waWMnLCBmdW5jLCBjb250ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBuYW1lZCB0b3BpYyBpcyBhbHJlYWR5IHByZXNlbnQgaW4gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3BpY05hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgdG9waWMgaXMgZm91bmQgaW4gY2FjaGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGlzVG9waWNDYWNoZWQodG9waWNOYW1lKSB7XG4gICAgcmV0dXJuICEhdGhpcy4jY2FjaGVHZXQoJ3RvcGljJywgdG9waWNOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSB1bmlxdWUgbmFtZSBsaWtlIDxjb2RlPiduZXcxMjM0NTYnPC9jb2RlPiBzdWl0YWJsZSBmb3IgY3JlYXRpbmcgYSBuZXcgZ3JvdXAgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNDaGFuIC0gaWYgdGhlIHRvcGljIGlzIGNoYW5uZWwtZW5hYmxlZC5cbiAgICogQHJldHVybnMge3N0cmluZ30gbmFtZSB3aGljaCBjYW4gYmUgdXNlZCBmb3IgY3JlYXRpbmcgYSBuZXcgZ3JvdXAgdG9waWMuXG4gICAqL1xuICBuZXdHcm91cFRvcGljTmFtZShpc0NoYW4pIHtcbiAgICByZXR1cm4gKGlzQ2hhbiA/IENvbnN0LlRPUElDX05FV19DSEFOIDogQ29uc3QuVE9QSUNfTkVXKSArIHRoaXMuZ2V0TmV4dFVuaXF1ZUlkKCk7XG4gIH1cblxuICAvKipcbiAgICogSW5zdGFudGlhdGUgPGNvZGU+J21lJzwvY29kZT4gdG9waWMgb3IgZ2V0IGl0IGZyb20gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuVG9waWNNZX0gSW5zdGFuY2Ugb2YgPGNvZGU+J21lJzwvY29kZT4gdG9waWMuXG4gICAqL1xuICBnZXRNZVRvcGljKCkge1xuICAgIHJldHVybiB0aGlzLmdldFRvcGljKENvbnN0LlRPUElDX01FKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZSA8Y29kZT4nZm5kJzwvY29kZT4gKGZpbmQpIHRvcGljIG9yIGdldCBpdCBmcm9tIGNhY2hlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLlRvcGljfSBJbnN0YW5jZSBvZiA8Y29kZT4nZm5kJzwvY29kZT4gdG9waWMuXG4gICAqL1xuICBnZXRGbmRUb3BpYygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRUb3BpYyhDb25zdC5UT1BJQ19GTkQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB7QGxpbmsgTGFyZ2VGaWxlSGVscGVyfSBpbnN0YW5jZVxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLkxhcmdlRmlsZUhlbHBlcn0gaW5zdGFuY2Ugb2YgYSB7QGxpbmsgVGlub2RlLkxhcmdlRmlsZUhlbHBlcn0uXG4gICAqL1xuICBnZXRMYXJnZUZpbGVIZWxwZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBMYXJnZUZpbGVIZWxwZXIodGhpcywgQ29uc3QuUFJPVE9DT0xfVkVSU0lPTik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBVSUQgb2YgdGhlIHRoZSBjdXJyZW50IGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHJldHVybnMge3N0cmluZ30gVUlEIG9mIHRoZSBjdXJyZW50IHVzZXIgb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPiBpZiB0aGUgc2Vzc2lvbiBpcyBub3QgeWV0IGF1dGhlbnRpY2F0ZWQgb3IgaWYgdGhlcmUgaXMgbm8gc2Vzc2lvbi5cbiAgICovXG4gIGdldEN1cnJlbnRVc2VySUQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX215VUlEO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSBnaXZlbiB1c2VyIElEIGlzIGVxdWFsIHRvIHRoZSBjdXJyZW50IHVzZXIncyBVSUQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1aWQgLSBVSUQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBVSUQgYmVsb25ncyB0byB0aGUgY3VycmVudCBsb2dnZWQgaW4gdXNlci5cbiAgICovXG4gIGlzTWUodWlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX215VUlEID09PSB1aWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGxvZ2luIHVzZWQgZm9yIGxhc3Qgc3VjY2Vzc2Z1bCBhdXRoZW50aWNhdGlvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHJldHVybnMge3N0cmluZ30gbG9naW4gbGFzdCB1c2VkIHN1Y2Nlc3NmdWxseSBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+LlxuICAgKi9cbiAgZ2V0Q3VycmVudExvZ2luKCkge1xuICAgIHJldHVybiB0aGlzLl9sb2dpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlcnZlcjogcHJvdG9jb2wgdmVyc2lvbiBhbmQgYnVpbGQgdGltZXN0YW1wLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBidWlsZCBhbmQgdmVyc2lvbiBvZiB0aGUgc2VydmVyIG9yIDxjb2RlPm51bGw8L2NvZGU+IGlmIHRoZXJlIGlzIG5vIGNvbm5lY3Rpb24gb3IgaWYgdGhlIGZpcnN0IHNlcnZlciByZXNwb25zZSBoYXMgbm90IGJlZW4gcmVjZWl2ZWQgeWV0LlxuICAgKi9cbiAgZ2V0U2VydmVySW5mbygpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VydmVySW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gc2VydmVyLXByb3ZpZGVkIGNvbmZpZ3VyYXRpb24gdmFsdWUgKGxvbmcgaW50ZWdlcikuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRoZSB2YWx1ZSB0byByZXR1cm5cbiAgICogQHBhcmFtIHtPYmplY3R9IGRlZmF1bHRWYWx1ZSB0byByZXR1cm4gaW4gY2FzZSBzZXJ2ZXIgbGltaXQgaXMgbm90IHNldCBvciBub3QgZm91bmQuXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IG5hbWVkIHZhbHVlLlxuICAgKi9cbiAgZ2V0U2VydmVyTGltaXQobmFtZSwgZGVmYXVsdFZhbHVlKSB7XG4gICAgcmV0dXJuICh0aGlzLl9zZXJ2ZXJJbmZvID8gdGhpcy5fc2VydmVySW5mb1tuYW1lXSA6IG51bGwpIHx8IGRlZmF1bHRWYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgY29uc29sZSBsb2dnaW5nLiBMb2dnaW5nIGlzIG9mZiBieSBkZWZhdWx0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGVuYWJsZWQgLSBTZXQgdG8gPGNvZGU+dHJ1ZTwvY29kZT4gdG8gZW5hYmxlIGxvZ2dpbmcgdG8gY29uc29sZS5cbiAgICogQHBhcmFtIHtib29sZWFufSB0cmltTG9uZ1N0cmluZ3MgLSBTZXQgdG8gPGNvZGU+dHJ1ZTwvY29kZT4gdG8gdHJpbSBsb25nIHN0cmluZ3MuXG4gICAqL1xuICBlbmFibGVMb2dnaW5nKGVuYWJsZWQsIHRyaW1Mb25nU3RyaW5ncykge1xuICAgIHRoaXMuX2xvZ2dpbmdFbmFibGVkID0gZW5hYmxlZDtcbiAgICB0aGlzLl90cmltTG9uZ1N0cmluZ3MgPSBlbmFibGVkICYmIHRyaW1Mb25nU3RyaW5ncztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgVUkgbGFuZ3VhZ2UgdG8gcmVwb3J0IHRvIHRoZSBzZXJ2ZXIuIE11c3QgYmUgY2FsbGVkIGJlZm9yZSA8Y29kZT4naGknPC9jb2RlPiBpcyBzZW50LCBvdGhlcndpc2UgaXQgd2lsbCBub3QgYmUgdXNlZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhsIC0gaHVtYW4gKFVJKSBsYW5ndWFnZSwgbGlrZSA8Y29kZT5cImVuX1VTXCI8L2NvZGU+IG9yIDxjb2RlPlwiemgtSGFuc1wiPC9jb2RlPi5cbiAgICovXG4gIHNldEh1bWFuTGFuZ3VhZ2UoaGwpIHtcbiAgICBpZiAoaGwpIHtcbiAgICAgIHRoaXMuX2h1bWFuTGFuZ3VhZ2UgPSBobDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgZ2l2ZW4gdG9waWMgaXMgb25saW5lLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0aGUgdG9waWMgdG8gdGVzdC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgdG9waWMgaXMgb25saW5lLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBpc1RvcGljT25saW5lKG5hbWUpIHtcbiAgICBjb25zdCB0b3BpYyA9IHRoaXMuI2NhY2hlR2V0KCd0b3BpYycsIG5hbWUpO1xuICAgIHJldHVybiB0b3BpYyAmJiB0b3BpYy5vbmxpbmU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFjY2VzcyBtb2RlIGZvciB0aGUgZ2l2ZW4gY29udGFjdC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGhlIHRvcGljIHRvIHF1ZXJ5LlxuICAgKiBAcmV0dXJucyB7QWNjZXNzTW9kZX0gYWNjZXNzIG1vZGUgaWYgdG9waWMgaXMgZm91bmQsIG51bGwgb3RoZXJ3aXNlLlxuICAgKi9cbiAgZ2V0VG9waWNBY2Nlc3NNb2RlKG5hbWUpIHtcbiAgICBjb25zdCB0b3BpYyA9IHRoaXMuI2NhY2hlR2V0KCd0b3BpYycsIG5hbWUpO1xuICAgIHJldHVybiB0b3BpYyA/IHRvcGljLmFjcyA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogSW5jbHVkZSBtZXNzYWdlIElEIGludG8gYWxsIHN1YnNlcXVlc3QgbWVzc2FnZXMgdG8gc2VydmVyIGluc3RydWN0aW4gaXQgdG8gc2VuZCBha25vd2xlZGdlbWVucy5cbiAgICogUmVxdWlyZWQgZm9yIHByb21pc2VzIHRvIGZ1bmN0aW9uLiBEZWZhdWx0IGlzIDxjb2RlPlwib25cIjwvY29kZT4uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc3RhdHVzIC0gVHVybiBha25vd2xlZGdlbWVucyBvbiBvciBvZmYuXG4gICAqIEBkZXByZWNhdGVkXG4gICAqL1xuICB3YW50QWtuKHN0YXR1cykge1xuICAgIGlmIChzdGF0dXMpIHtcbiAgICAgIHRoaXMuX21lc3NhZ2VJZCA9IE1hdGguZmxvb3IoKE1hdGgucmFuZG9tKCkgKiAweEZGRkZGRikgKyAweEZGRkZGRik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX21lc3NhZ2VJZCA9IDA7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsbGJhY2tzOlxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVwb3J0IHdoZW4gdGhlIHdlYnNvY2tldCBpcyBvcGVuZWQuIFRoZSBjYWxsYmFjayBoYXMgbm8gcGFyYW1ldGVycy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbldlYnNvY2tldE9wZW59XG4gICAqL1xuICBvbldlYnNvY2tldE9wZW4gPSB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIFRpbm9kZS5TZXJ2ZXJQYXJhbXNcbiAgICogQG1lbWJlcm9mIFRpbm9kZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gdmVyIC0gU2VydmVyIHZlcnNpb25cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGJ1aWxkIC0gU2VydmVyIGJ1aWxkXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nPX0gc2lkIC0gU2Vzc2lvbiBJRCwgbG9uZyBwb2xsaW5nIGNvbm5lY3Rpb25zIG9ubHkuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAY2FsbGJhY2sgVGlub2RlLm9uQ29ubmVjdFxuICAgKiBAcGFyYW0ge251bWJlcn0gY29kZSAtIFJlc3VsdCBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGV4dCBlcHhwbGFpbmluZyB0aGUgY29tcGxldGlvbiwgaS5lIFwiT0tcIiBvciBhbiBlcnJvciBtZXNzYWdlLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXJ2ZXJQYXJhbXN9IHBhcmFtcyAtIFBhcmFtZXRlcnMgcmV0dXJuZWQgYnkgdGhlIHNlcnZlci5cbiAgICovXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZXBvcnQgd2hlbiBjb25uZWN0aW9uIHdpdGggVGlub2RlIHNlcnZlciBpcyBlc3RhYmxpc2hlZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbkNvbm5lY3R9XG4gICAqL1xuICBvbkNvbm5lY3QgPSB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlcG9ydCB3aGVuIGNvbm5lY3Rpb24gaXMgbG9zdC4gVGhlIGNhbGxiYWNrIGhhcyBubyBwYXJhbWV0ZXJzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uRGlzY29ubmVjdH1cbiAgICovXG4gIG9uRGlzY29ubmVjdCA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQGNhbGxiYWNrIFRpbm9kZS5vbkxvZ2luXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjb2RlIC0gTlVtZXJpYyBjb21wbGV0aW9uIGNvZGUsIHNhbWUgYXMgSFRUUCBzdGF0dXMgY29kZXMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gRXhwbGFuYXRpb24gb2YgdGhlIGNvbXBsZXRpb24gY29kZS5cbiAgICovXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZXBvcnQgbG9naW4gY29tcGxldGlvbi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbkxvZ2lufVxuICAgKi9cbiAgb25Mb2dpbiA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVjZWl2ZSA8Y29kZT57Y3RybH08L2NvZGU+IChjb250cm9sKSBtZXNzYWdlcy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbkN0cmxNZXNzYWdlfVxuICAgKi9cbiAgb25DdHJsTWVzc2FnZSA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVjaWV2ZSA8Y29kZT57ZGF0YX08L2NvZGU+IChjb250ZW50KSBtZXNzYWdlcy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbkRhdGFNZXNzYWdlfVxuICAgKi9cbiAgb25EYXRhTWVzc2FnZSA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVjZWl2ZSA8Y29kZT57cHJlc308L2NvZGU+IChwcmVzZW5jZSkgbWVzc2FnZXMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25QcmVzTWVzc2FnZX1cbiAgICovXG4gIG9uUHJlc01lc3NhZ2UgPSB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlY2VpdmUgYWxsIG1lc3NhZ2VzIGFzIG9iamVjdHMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25NZXNzYWdlfVxuICAgKi9cbiAgb25NZXNzYWdlID0gdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byByZWNlaXZlIGFsbCBtZXNzYWdlcyBhcyB1bnBhcnNlZCB0ZXh0LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlI1xuICAgKiBAdHlwZSB7VGlub2RlLm9uUmF3TWVzc2FnZX1cbiAgICovXG4gIG9uUmF3TWVzc2FnZSA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVjZWl2ZSBzZXJ2ZXIgcmVzcG9uc2VzIHRvIG5ldHdvcmsgcHJvYmVzLiBTZWUge0BsaW5rIFRpbm9kZSNuZXR3b3JrUHJvYmV9XG4gICAqIEBtZW1iZXJvZiBUaW5vZGUjXG4gICAqIEB0eXBlIHtUaW5vZGUub25OZXR3b3JrUHJvYmV9XG4gICAqL1xuICBvbk5ldHdvcmtQcm9iZSA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBleHBvbmVudGlhbCBiYWNrb2ZmIGlzIGl0ZXJhdGluZy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZSNcbiAgICogQHR5cGUge1Rpbm9kZS5vbkF1dG9yZWNvbm5lY3RJdGVyYXRpb259XG4gICAqL1xuICBvbkF1dG9yZWNvbm5lY3RJdGVyYXRpb24gPSB1bmRlZmluZWQ7XG59O1xuXG4vLyBFeHBvcnRlZCBjb25zdGFudHNcblRpbm9kZS5NRVNTQUdFX1NUQVRVU19OT05FID0gQ29uc3QuTUVTU0FHRV9TVEFUVVNfTk9ORTtcblRpbm9kZS5NRVNTQUdFX1NUQVRVU19RVUVVRUQgPSBDb25zdC5NRVNTQUdFX1NUQVRVU19RVUVVRUQ7XG5UaW5vZGUuTUVTU0FHRV9TVEFUVVNfU0VORElORyA9IENvbnN0Lk1FU1NBR0VfU1RBVFVTX1NFTkRJTkc7XG5UaW5vZGUuTUVTU0FHRV9TVEFUVVNfRkFJTEVEID0gQ29uc3QuTUVTU0FHRV9TVEFUVVNfRkFJTEVEO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX1NFTlQgPSBDb25zdC5NRVNTQUdFX1NUQVRVU19TRU5UO1xuVGlub2RlLk1FU1NBR0VfU1RBVFVTX1JFQ0VJVkVEID0gQ29uc3QuTUVTU0FHRV9TVEFUVVNfUkVDRUlWRUQ7XG5UaW5vZGUuTUVTU0FHRV9TVEFUVVNfUkVBRCA9IENvbnN0Lk1FU1NBR0VfU1RBVFVTX1JFQUQ7XG5UaW5vZGUuTUVTU0FHRV9TVEFUVVNfVE9fTUUgPSBDb25zdC5NRVNTQUdFX1NUQVRVU19UT19NRTtcblRpbm9kZS5NRVNTQUdFX1NUQVRVU19ERUxfUkFOR0UgPSBDb25zdC5NRVNTQUdFX1NUQVRVU19ERUxfUkFOR0U7XG5cbi8vIFVuaWNvZGUgW2RlbF0gc3ltYm9sLlxuVGlub2RlLkRFTF9DSEFSID0gQ29uc3QuREVMX0NIQVI7XG5cbi8vIE5hbWVzIG9mIGtleXMgdG8gc2VydmVyLXByb3ZpZGVkIGNvbmZpZ3VyYXRpb24gbGltaXRzLlxuVGlub2RlLk1BWF9NRVNTQUdFX1NJWkUgPSAnbWF4TWVzc2FnZVNpemUnO1xuVGlub2RlLk1BWF9TVUJTQ1JJQkVSX0NPVU5UID0gJ21heFN1YnNjcmliZXJDb3VudCc7XG5UaW5vZGUuTUFYX1RBR19DT1VOVCA9ICdtYXhUYWdDb3VudCc7XG5UaW5vZGUuTUFYX0ZJTEVfVVBMT0FEX1NJWkUgPSAnbWF4RmlsZVVwbG9hZFNpemUnO1xuIiwiLyoqXG4gKiBAZmlsZSBUb3BpYyBtYW5hZ2VtZW50LlxuICpcbiAqIEBjb3B5cmlnaHQgMjAxNS0yMDIyIFRpbm9kZSBMTEMuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IEFjY2Vzc01vZGUgZnJvbSAnLi9hY2Nlc3MtbW9kZS5qcyc7XG5pbXBvcnQgQ0J1ZmZlciBmcm9tICcuL2NidWZmZXIuanMnO1xuaW1wb3J0ICogYXMgQ29uc3QgZnJvbSAnLi9jb25maWcuanMnO1xuaW1wb3J0IERyYWZ0eSBmcm9tICcuL2RyYWZ0eS5qcyc7XG5pbXBvcnQgTWV0YUdldEJ1aWxkZXIgZnJvbSAnLi9tZXRhLWJ1aWxkZXIuanMnO1xuaW1wb3J0IHtcbiAgbWVyZ2VPYmosXG4gIG1lcmdlVG9DYWNoZSxcbiAgbm9ybWFsaXplQXJyYXlcbn0gZnJvbSAnLi91dGlscy5qcyc7XG5cbmV4cG9ydCBjbGFzcyBUb3BpYyB7XG4gIC8qKlxuICAgKiBAY2FsbGJhY2sgVGlub2RlLlRvcGljLm9uRGF0YVxuICAgKiBAcGFyYW0ge0RhdGF9IGRhdGEgLSBEYXRhIHBhY2tldFxuICAgKi9cbiAgLyoqXG4gICAqIFRvcGljIGlzIGEgY2xhc3MgcmVwcmVzZW50aW5nIGEgbG9naWNhbCBjb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gICAqIEBjbGFzcyBUb3BpY1xuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge09iamVjdD19IGNhbGxiYWNrcyAtIE9iamVjdCB3aXRoIHZhcmlvdXMgZXZlbnQgY2FsbGJhY2tzLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5Ub3BpYy5vbkRhdGF9IGNhbGxiYWNrcy5vbkRhdGEgLSBDYWxsYmFjayB3aGljaCByZWNlaXZlcyBhIDxjb2RlPntkYXRhfTwvY29kZT4gbWVzc2FnZS5cbiAgICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2tzLm9uTWV0YSAtIENhbGxiYWNrIHdoaWNoIHJlY2VpdmVzIGEgPGNvZGU+e21ldGF9PC9jb2RlPiBtZXNzYWdlLlxuICAgKiBAcGFyYW0ge2NhbGxiYWNrfSBjYWxsYmFja3Mub25QcmVzIC0gQ2FsbGJhY2sgd2hpY2ggcmVjZWl2ZXMgYSA8Y29kZT57cHJlc308L2NvZGU+IG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNhbGxiYWNrcy5vbkluZm8gLSBDYWxsYmFjayB3aGljaCByZWNlaXZlcyBhbiA8Y29kZT57aW5mb308L2NvZGU+IG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNhbGxiYWNrcy5vbk1ldGFEZXNjIC0gQ2FsbGJhY2sgd2hpY2ggcmVjZWl2ZXMgY2hhbmdlcyB0byB0b3BpYyBkZXNjdGlvcHRpb24ge0BsaW5rIGRlc2N9LlxuICAgKiBAcGFyYW0ge2NhbGxiYWNrfSBjYWxsYmFja3Mub25NZXRhU3ViIC0gQ2FsbGVkIGZvciBhIHNpbmdsZSBzdWJzY3JpcHRpb24gcmVjb3JkIGNoYW5nZS5cbiAgICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2tzLm9uU3Vic1VwZGF0ZWQgLSBDYWxsZWQgYWZ0ZXIgYSBiYXRjaCBvZiBzdWJzY3JpcHRpb24gY2hhbmdlcyBoYXZlIGJlZW4gcmVjaWV2ZWQgYW5kIGNhY2hlZC5cbiAgICogQHBhcmFtIHtjYWxsYmFja30gY2FsbGJhY2tzLm9uRGVsZXRlVG9waWMgLSBDYWxsZWQgYWZ0ZXIgdGhlIHRvcGljIGlzIGRlbGV0ZWQuXG4gICAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNhbGxiYWNscy5vbkFsbE1lc3NhZ2VzUmVjZWl2ZWQgLSBDYWxsZWQgd2hlbiBhbGwgcmVxdWVzdGVkIDxjb2RlPntkYXRhfTwvY29kZT4gbWVzc2FnZXMgaGF2ZSBiZWVuIHJlY2l2ZWQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihuYW1lLCBjYWxsYmFja3MpIHtcbiAgICAvLyBQYXJlbnQgVGlub2RlIG9iamVjdC5cbiAgICB0aGlzLl90aW5vZGUgPSBudWxsO1xuXG4gICAgLy8gU2VydmVyLXByb3ZpZGVkIGRhdGEsIGxvY2FsbHkgaW1tdXRhYmxlLlxuICAgIC8vIHRvcGljIG5hbWVcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIC8vIFRpbWVzdGFtcCB3aGVuIHRoZSB0b3BpYyB3YXMgY3JlYXRlZC5cbiAgICB0aGlzLmNyZWF0ZWQgPSBudWxsO1xuICAgIC8vIFRpbWVzdGFtcCB3aGVuIHRoZSB0b3BpYyB3YXMgbGFzdCB1cGRhdGVkLlxuICAgIHRoaXMudXBkYXRlZCA9IG51bGw7XG4gICAgLy8gVGltZXN0YW1wIG9mIHRoZSBsYXN0IG1lc3NhZ2VzXG4gICAgdGhpcy50b3VjaGVkID0gbmV3IERhdGUoMCk7XG4gICAgLy8gQWNjZXNzIG1vZGUsIHNlZSBBY2Nlc3NNb2RlXG4gICAgdGhpcy5hY3MgPSBuZXcgQWNjZXNzTW9kZShudWxsKTtcbiAgICAvLyBQZXItdG9waWMgcHJpdmF0ZSBkYXRhIChhY2Nlc3NpYmxlIGJ5IGN1cnJlbnQgdXNlciBvbmx5KS5cbiAgICB0aGlzLnByaXZhdGUgPSBudWxsO1xuICAgIC8vIFBlci10b3BpYyBwdWJsaWMgZGF0YSAoYWNjZXNzaWJsZSBieSBhbGwgdXNlcnMpLlxuICAgIHRoaXMucHVibGljID0gbnVsbDtcbiAgICAvLyBQZXItdG9waWMgc3lzdGVtLXByb3ZpZGVkIGRhdGEgKGFjY2Vzc2libGUgYnkgYWxsIHVzZXJzKS5cbiAgICB0aGlzLnRydXN0ZWQgPSBudWxsO1xuXG4gICAgLy8gTG9jYWxseSBjYWNoZWQgZGF0YVxuICAgIC8vIFN1YnNjcmliZWQgdXNlcnMsIGZvciB0cmFja2luZyByZWFkL3JlY3YvbXNnIG5vdGlmaWNhdGlvbnMuXG4gICAgdGhpcy5fdXNlcnMgPSB7fTtcblxuICAgIC8vIEN1cnJlbnQgdmFsdWUgb2YgbG9jYWxseSBpc3N1ZWQgc2VxSWQsIHVzZWQgZm9yIHBlbmRpbmcgbWVzc2FnZXMuXG4gICAgdGhpcy5fcXVldWVkU2VxSWQgPSBDb25zdC5MT0NBTF9TRVFJRDtcblxuICAgIC8vIFRoZSBtYXhpbXVtIGtub3duIHtkYXRhLnNlcX0gdmFsdWUuXG4gICAgdGhpcy5fbWF4U2VxID0gMDtcbiAgICAvLyBUaGUgbWluaW11bSBrbm93biB7ZGF0YS5zZXF9IHZhbHVlLlxuICAgIHRoaXMuX21pblNlcSA9IDA7XG4gICAgLy8gSW5kaWNhdG9yIHRoYXQgdGhlIGxhc3QgcmVxdWVzdCBmb3IgZWFybGllciBtZXNzYWdlcyByZXR1cm5lZCAwLlxuICAgIHRoaXMuX25vRWFybGllck1zZ3MgPSBmYWxzZTtcbiAgICAvLyBUaGUgbWF4aW11bSBrbm93biBkZWxldGlvbiBJRC5cbiAgICB0aGlzLl9tYXhEZWwgPSAwO1xuICAgIC8vIFVzZXIgZGlzY292ZXJ5IHRhZ3NcbiAgICB0aGlzLl90YWdzID0gW107XG4gICAgLy8gQ3JlZGVudGlhbHMgc3VjaCBhcyBlbWFpbCBvciBwaG9uZSBudW1iZXIuXG4gICAgdGhpcy5fY3JlZGVudGlhbHMgPSBbXTtcbiAgICAvLyBNZXNzYWdlIGNhY2hlLCBzb3J0ZWQgYnkgbWVzc2FnZSBzZXEgdmFsdWVzLCBmcm9tIG9sZCB0byBuZXcuXG4gICAgdGhpcy5fbWVzc2FnZXMgPSBuZXcgQ0J1ZmZlcigoYSwgYikgPT4ge1xuICAgICAgcmV0dXJuIGEuc2VxIC0gYi5zZXE7XG4gICAgfSwgdHJ1ZSk7XG4gICAgLy8gQm9vbGVhbiwgdHJ1ZSBpZiB0aGUgdG9waWMgaXMgY3VycmVudGx5IGxpdmVcbiAgICB0aGlzLl9hdHRhY2hlZCA9IGZhbHNlO1xuICAgIC8vIFRpbWVzdGFwIG9mIHRoZSBtb3N0IHJlY2VudGx5IHVwZGF0ZWQgc3Vic2NyaXB0aW9uLlxuICAgIHRoaXMuX2xhc3RTdWJzVXBkYXRlID0gbmV3IERhdGUoMCk7XG4gICAgLy8gVG9waWMgY3JlYXRlZCBidXQgbm90IHlldCBzeW5jZWQgd2l0aCB0aGUgc2VydmVyLiBVc2VkIG9ubHkgZHVyaW5nIGluaXRpYWxpemF0aW9uLlxuICAgIHRoaXMuX25ldyA9IHRydWU7XG4gICAgLy8gVGhlIHRvcGljIGlzIGRlbGV0ZWQgYXQgdGhlIHNlcnZlciwgdGhpcyBpcyBhIGxvY2FsIGNvcHkuXG4gICAgdGhpcy5fZGVsZXRlZCA9IGZhbHNlO1xuXG4gICAgLy8gQ2FsbGJhY2tzXG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgdGhpcy5vbkRhdGEgPSBjYWxsYmFja3Mub25EYXRhO1xuICAgICAgdGhpcy5vbk1ldGEgPSBjYWxsYmFja3Mub25NZXRhO1xuICAgICAgdGhpcy5vblByZXMgPSBjYWxsYmFja3Mub25QcmVzO1xuICAgICAgdGhpcy5vbkluZm8gPSBjYWxsYmFja3Mub25JbmZvO1xuICAgICAgLy8gQSBzaW5nbGUgZGVzYyB1cGRhdGU7XG4gICAgICB0aGlzLm9uTWV0YURlc2MgPSBjYWxsYmFja3Mub25NZXRhRGVzYztcbiAgICAgIC8vIEEgc2luZ2xlIHN1YnNjcmlwdGlvbiByZWNvcmQ7XG4gICAgICB0aGlzLm9uTWV0YVN1YiA9IGNhbGxiYWNrcy5vbk1ldGFTdWI7XG4gICAgICAvLyBBbGwgc3Vic2NyaXB0aW9uIHJlY29yZHMgcmVjZWl2ZWQ7XG4gICAgICB0aGlzLm9uU3Vic1VwZGF0ZWQgPSBjYWxsYmFja3Mub25TdWJzVXBkYXRlZDtcbiAgICAgIHRoaXMub25UYWdzVXBkYXRlZCA9IGNhbGxiYWNrcy5vblRhZ3NVcGRhdGVkO1xuICAgICAgdGhpcy5vbkNyZWRzVXBkYXRlZCA9IGNhbGxiYWNrcy5vbkNyZWRzVXBkYXRlZDtcbiAgICAgIHRoaXMub25EZWxldGVUb3BpYyA9IGNhbGxiYWNrcy5vbkRlbGV0ZVRvcGljO1xuICAgICAgdGhpcy5vbkFsbE1lc3NhZ2VzUmVjZWl2ZWQgPSBjYWxsYmFja3Mub25BbGxNZXNzYWdlc1JlY2VpdmVkO1xuICAgIH1cbiAgfVxuXG4gIC8vIFN0YXRpYyBtZXRob2RzLlxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgdG9waWMgdHlwZSBmcm9tIHRvcGljJ3MgbmFtZTogZ3JwLCBwMnAsIG1lLCBmbmQsIHN5cy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHRlc3QuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IE9uZSBvZiA8Y29kZT5cIm1lXCI8L2NvZGU+LCA8Y29kZT5cImZuZFwiPC9jb2RlPiwgPGNvZGU+XCJzeXNcIjwvY29kZT4sIDxjb2RlPlwiZ3JwXCI8L2NvZGU+LFxuICAgKiAgICA8Y29kZT5cInAycFwiPC9jb2RlPiBvciA8Y29kZT51bmRlZmluZWQ8L2NvZGU+LlxuICAgKi9cbiAgc3RhdGljIHRvcGljVHlwZShuYW1lKSB7XG4gICAgY29uc3QgdHlwZXMgPSB7XG4gICAgICAnbWUnOiBDb25zdC5UT1BJQ19NRSxcbiAgICAgICdmbmQnOiBDb25zdC5UT1BJQ19GTkQsXG4gICAgICAnZ3JwJzogQ29uc3QuVE9QSUNfR1JQLFxuICAgICAgJ25ldyc6IENvbnN0LlRPUElDX0dSUCxcbiAgICAgICduY2gnOiBDb25zdC5UT1BJQ19HUlAsXG4gICAgICAnY2huJzogQ29uc3QuVE9QSUNfR1JQLFxuICAgICAgJ3Vzcic6IENvbnN0LlRPUElDX1AyUCxcbiAgICAgICdzeXMnOiBDb25zdC5UT1BJQ19TWVNcbiAgICB9O1xuICAgIHJldHVybiB0eXBlc1sodHlwZW9mIG5hbWUgPT0gJ3N0cmluZycpID8gbmFtZS5zdWJzdHJpbmcoMCwgMykgOiAneHh4J107XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIGdpdmVuIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgJ21lJyB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIHRvcGljIHRvIHRlc3QuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSAnbWUnIHRvcGljLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgc3RhdGljIGlzTWVUb3BpY05hbWUobmFtZSkge1xuICAgIHJldHVybiBUb3BpYy50b3BpY1R5cGUobmFtZSkgPT0gQ29uc3QuVE9QSUNfTUU7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIGdpdmVuIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgZ3JvdXAgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqIEBzdGF0aWNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byB0ZXN0LlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdGhlIG5hbWUgaXMgYSBuYW1lIG9mIGEgZ3JvdXAgdG9waWMsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBzdGF0aWMgaXNHcm91cFRvcGljTmFtZShuYW1lKSB7XG4gICAgcmV0dXJuIFRvcGljLnRvcGljVHlwZShuYW1lKSA9PSBDb25zdC5UT1BJQ19HUlA7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIGdpdmVuIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgcDJwIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKiBAc3RhdGljXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgdG9waWMgdG8gdGVzdC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZSBuYW1lIGlzIGEgbmFtZSBvZiBhIHAycCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIHN0YXRpYyBpc1AyUFRvcGljTmFtZShuYW1lKSB7XG4gICAgcmV0dXJuIFRvcGljLnRvcGljVHlwZShuYW1lKSA9PSBDb25zdC5UT1BJQ19QMlA7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIGdpdmVuIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgY29tbXVuaWNhdGlvbiB0b3BpYywgaS5lLiBQMlAgb3IgZ3JvdXAuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqIEBzdGF0aWNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byB0ZXN0LlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdGhlIG5hbWUgaXMgYSBuYW1lIG9mIGEgcDJwIG9yIGdyb3VwIHRvcGljLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgc3RhdGljIGlzQ29tbVRvcGljTmFtZShuYW1lKSB7XG4gICAgcmV0dXJuIFRvcGljLmlzUDJQVG9waWNOYW1lKG5hbWUpIHx8IFRvcGljLmlzR3JvdXBUb3BpY05hbWUobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgbmV3IHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKiBAc3RhdGljXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gdG9waWMgbmFtZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIHRoZSBuYW1lIGlzIGEgbmFtZSBvZiBhIG5ldyB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIHN0YXRpYyBpc05ld0dyb3VwVG9waWNOYW1lKG5hbWUpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBuYW1lID09ICdzdHJpbmcnKSAmJlxuICAgICAgKG5hbWUuc3Vic3RyaW5nKDAsIDMpID09IENvbnN0LlRPUElDX05FVyB8fCBuYW1lLnN1YnN0cmluZygwLCAzKSA9PSBDb25zdC5UT1BJQ19ORVdfQ0hBTik7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIHRvcGljIG5hbWUgaXMgYSBuYW1lIG9mIGEgY2hhbm5lbC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICogQHN0YXRpY1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIHRvcGljIG5hbWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0aGUgbmFtZSBpcyBhIG5hbWUgb2YgYSBjaGFubmVsLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgc3RhdGljIGlzQ2hhbm5lbFRvcGljTmFtZShuYW1lKSB7XG4gICAgcmV0dXJuICh0eXBlb2YgbmFtZSA9PSAnc3RyaW5nJykgJiZcbiAgICAgIChuYW1lLnN1YnN0cmluZygwLCAzKSA9PSBDb25zdC5UT1BJQ19DSEFOIHx8IG5hbWUuc3Vic3RyaW5nKDAsIDMpID09IENvbnN0LlRPUElDX05FV19DSEFOKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgdG9waWMgaXMgc3Vic2NyaWJlZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaXMgdG9waWMgaXMgYXR0YWNoZWQvc3Vic2NyaWJlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNTdWJzY3JpYmVkKCkge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2hlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRvcGljIHRvIHN1YnNjcmliZS4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNzdWJzY3JpYmV9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5HZXRRdWVyeT19IGdldFBhcmFtcyAtIGdldCBxdWVyeSBwYXJhbWV0ZXJzLlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXRQYXJhbXM9fSBzZXRQYXJhbXMgLSBzZXQgcGFyYW1ldGVycy5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgc3Vic2NyaWJlKGdldFBhcmFtcywgc2V0UGFyYW1zKSB7XG4gICAgLy8gSWYgdGhlIHRvcGljIGlzIGFscmVhZHkgc3Vic2NyaWJlZCwgcmV0dXJuIHJlc29sdmVkIHByb21pc2VcbiAgICBpZiAodGhpcy5fYXR0YWNoZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHRvcGljIGlzIGRlbGV0ZWQsIHJlamVjdCBzdWJzY3JpcHRpb24gcmVxdWVzdHMuXG4gICAgaWYgKHRoaXMuX2RlbGV0ZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJDb252ZXJzYXRpb24gZGVsZXRlZFwiKSk7XG4gICAgfVxuXG4gICAgLy8gU2VuZCBzdWJzY3JpYmUgbWVzc2FnZSwgaGFuZGxlIGFzeW5jIHJlc3BvbnNlLlxuICAgIC8vIElmIHRvcGljIG5hbWUgaXMgZXhwbGljaXRseSBwcm92aWRlZCwgdXNlIGl0LiBJZiBubyBuYW1lLCB0aGVuIGl0J3MgYSBuZXcgZ3JvdXAgdG9waWMsXG4gICAgLy8gdXNlIFwibmV3XCIuXG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5zdWJzY3JpYmUodGhpcy5uYW1lIHx8IENvbnN0LlRPUElDX05FVywgZ2V0UGFyYW1zLCBzZXRQYXJhbXMpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIGlmIChjdHJsLmNvZGUgPj0gMzAwKSB7XG4gICAgICAgIC8vIERvIG5vdGhpbmcgaWYgc3Vic2NyaXB0aW9uIHN0YXR1cyBoYXMgbm90IGNoYW5nZWQuXG4gICAgICAgIHJldHVybiBjdHJsO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG4gICAgICB0aGlzLl9kZWxldGVkID0gZmFsc2U7XG4gICAgICB0aGlzLmFjcyA9IChjdHJsLnBhcmFtcyAmJiBjdHJsLnBhcmFtcy5hY3MpID8gY3RybC5wYXJhbXMuYWNzIDogdGhpcy5hY3M7XG5cbiAgICAgIC8vIFNldCB0b3BpYyBuYW1lIGZvciBuZXcgdG9waWNzIGFuZCBhZGQgaXQgdG8gY2FjaGUuXG4gICAgICBpZiAodGhpcy5fbmV3KSB7XG4gICAgICAgIHRoaXMuX25ldyA9IGZhbHNlO1xuXG4gICAgICAgIGlmICh0aGlzLm5hbWUgIT0gY3RybC50b3BpYykge1xuICAgICAgICAgIC8vIE5hbWUgbWF5IGNoYW5nZSBuZXcxMjM0NTYgLT4gZ3JwQWJDZEVmLiBSZW1vdmUgZnJvbSBjYWNoZSB1bmRlciB0aGUgb2xkIG5hbWUuXG4gICAgICAgICAgdGhpcy5fY2FjaGVEZWxTZWxmKCk7XG4gICAgICAgICAgdGhpcy5uYW1lID0gY3RybC50b3BpYztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jYWNoZVB1dFNlbGYoKTtcblxuICAgICAgICB0aGlzLmNyZWF0ZWQgPSBjdHJsLnRzO1xuICAgICAgICB0aGlzLnVwZGF0ZWQgPSBjdHJsLnRzO1xuXG4gICAgICAgIGlmICh0aGlzLm5hbWUgIT0gQ29uc3QuVE9QSUNfTUUgJiYgdGhpcy5uYW1lICE9IENvbnN0LlRPUElDX0ZORCkge1xuICAgICAgICAgIC8vIEFkZCB0aGUgbmV3IHRvcGljIHRvIHRoZSBsaXN0IG9mIGNvbnRhY3RzIG1haW50YWluZWQgYnkgdGhlICdtZScgdG9waWMuXG4gICAgICAgICAgY29uc3QgbWUgPSB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpO1xuICAgICAgICAgIGlmIChtZS5vbk1ldGFTdWIpIHtcbiAgICAgICAgICAgIG1lLm9uTWV0YVN1Yih0aGlzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1lLm9uU3Vic1VwZGF0ZWQpIHtcbiAgICAgICAgICAgIG1lLm9uU3Vic1VwZGF0ZWQoW3RoaXMubmFtZV0sIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZXRQYXJhbXMgJiYgc2V0UGFyYW1zLmRlc2MpIHtcbiAgICAgICAgICBzZXRQYXJhbXMuZGVzYy5fbm9Gb3J3YXJkaW5nID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLl9wcm9jZXNzTWV0YURlc2Moc2V0UGFyYW1zLmRlc2MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY3RybDtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBkcmFmdCBvZiBhIG1lc3NhZ2Ugd2l0aG91dCBzZW5kaW5nIGl0IHRvIHRoZSBzZXJ2ZXIuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgT2JqZWN0fSBkYXRhIC0gQ29udGVudCB0byB3cmFwIGluIGEgZHJhZnQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IG5vRWNobyAtIElmIDxjb2RlPnRydWU8L2NvZGU+IHNlcnZlciB3aWxsIG5vdCBlY2hvIG1lc3NhZ2UgYmFjayB0byBvcmlnaW5hdGluZ1xuICAgKiBzZXNzaW9uLiBPdGhlcndpc2UgdGhlIHNlcnZlciB3aWxsIHNlbmQgYSBjb3B5IG9mIHRoZSBtZXNzYWdlIHRvIHNlbmRlci5cbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH0gbWVzc2FnZSBkcmFmdC5cbiAgICovXG4gIGNyZWF0ZU1lc3NhZ2UoZGF0YSwgbm9FY2hvKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Rpbm9kZS5jcmVhdGVNZXNzYWdlKHRoaXMubmFtZSwgZGF0YSwgbm9FY2hvKTtcbiAgfVxuICAvKipcbiAgICogSW1tZWRpYXRlbHkgcHVibGlzaCBkYXRhIHRvIHRvcGljLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI3B1Ymxpc2h9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IE9iamVjdH0gZGF0YSAtIERhdGEgdG8gcHVibGlzaCwgZWl0aGVyIHBsYWluIHN0cmluZyBvciBhIERyYWZ0eSBvYmplY3QuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IG5vRWNobyAtIElmIDxjb2RlPnRydWU8L2NvZGU+IHNlcnZlciB3aWxsIG5vdCBlY2hvIG1lc3NhZ2UgYmFjayB0byBvcmlnaW5hdGluZ1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gdGhlIHJlcXVlc3QuXG4gICAqL1xuICBwdWJsaXNoKGRhdGEsIG5vRWNobykge1xuICAgIHJldHVybiB0aGlzLnB1Ymxpc2hNZXNzYWdlKHRoaXMuY3JlYXRlTWVzc2FnZShkYXRhLCBub0VjaG8pKTtcbiAgfVxuICAvKipcbiAgICogUHVibGlzaCBtZXNzYWdlIGNyZWF0ZWQgYnkge0BsaW5rIFRpbm9kZS5Ub3BpYyNjcmVhdGVNZXNzYWdlfS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHB1YiAtIHtkYXRhfSBvYmplY3QgdG8gcHVibGlzaC4gTXVzdCBiZSBjcmVhdGVkIGJ5IHtAbGluayBUaW5vZGUuVG9waWMjY3JlYXRlTWVzc2FnZX1cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgcHVibGlzaE1lc3NhZ2UocHViKSB7XG4gICAgaWYgKCF0aGlzLl9hdHRhY2hlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbm5vdCBwdWJsaXNoIG9uIGluYWN0aXZlIHRvcGljXCIpKTtcbiAgICB9XG5cbiAgICAvLyBFeHRyYWN0IHJlZmVyZWNlcyB0byBhdHRhY2htZW50cyBhbmQgb3V0IG9mIGJhbmQgaW1hZ2UgcmVjb3Jkcy5cbiAgICBsZXQgYXR0YWNobWVudHMgPSBudWxsO1xuICAgIGlmIChEcmFmdHkuaGFzRW50aXRpZXMocHViLmNvbnRlbnQpKSB7XG4gICAgICBhdHRhY2htZW50cyA9IFtdO1xuICAgICAgRHJhZnR5LmVudGl0aWVzKHB1Yi5jb250ZW50LCAoZGF0YSkgPT4ge1xuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLnJlZikge1xuICAgICAgICAgIGF0dGFjaG1lbnRzLnB1c2goZGF0YS5yZWYpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmIChhdHRhY2htZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICBhdHRhY2htZW50cyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2VuZCBkYXRhLlxuICAgIHB1Yi5fc2VuZGluZyA9IHRydWU7XG4gICAgcHViLl9mYWlsZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gdGhpcy5fdGlub2RlLnB1Ymxpc2hNZXNzYWdlKHB1YiwgYXR0YWNobWVudHMpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIHB1Yi5fc2VuZGluZyA9IGZhbHNlO1xuICAgICAgcHViLnRzID0gY3RybC50cztcbiAgICAgIHRoaXMuc3dhcE1lc3NhZ2VJZChwdWIsIGN0cmwucGFyYW1zLnNlcSk7XG4gICAgICB0aGlzLl9yb3V0ZURhdGEocHViKTtcbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIHRoaXMuX3Rpbm9kZS5sb2dnZXIoXCJXQVJOSU5HOiBNZXNzYWdlIHJlamVjdGVkIGJ5IHRoZSBzZXJ2ZXJcIiwgZXJyKTtcbiAgICAgIHB1Yi5fc2VuZGluZyA9IGZhbHNlO1xuICAgICAgcHViLl9mYWlsZWQgPSB0cnVlO1xuICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgIHRoaXMub25EYXRhKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIEFkZCBtZXNzYWdlIHRvIGxvY2FsIG1lc3NhZ2UgY2FjaGUsIHNlbmQgdG8gdGhlIHNlcnZlciB3aGVuIHRoZSBwcm9taXNlIGlzIHJlc29sdmVkLlxuICAgKiBJZiBwcm9taXNlIGlzIG51bGwgb3IgdW5kZWZpbmVkLCB0aGUgbWVzc2FnZSB3aWxsIGJlIHNlbnQgaW1tZWRpYXRlbHkuXG4gICAqIFRoZSBtZXNzYWdlIGlzIHNlbnQgd2hlbiB0aGVcbiAgICogVGhlIG1lc3NhZ2Ugc2hvdWxkIGJlIGNyZWF0ZWQgYnkge0BsaW5rIFRpbm9kZS5Ub3BpYyNjcmVhdGVNZXNzYWdlfS5cbiAgICogVGhpcyBpcyBwcm9iYWJseSBub3QgdGhlIGZpbmFsIEFQSS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHB1YiAtIE1lc3NhZ2UgdG8gdXNlIGFzIGEgZHJhZnQuXG4gICAqIEBwYXJhbSB7UHJvbWlzZX0gcHJvbSAtIE1lc3NhZ2Ugd2lsbCBiZSBzZW50IHdoZW4gdGhpcyBwcm9taXNlIGlzIHJlc29sdmVkLCBkaXNjYXJkZWQgaWYgcmVqZWN0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBkZXJpdmVkIHByb21pc2UuXG4gICAqL1xuICBwdWJsaXNoRHJhZnQocHViLCBwcm9tKSB7XG4gICAgaWYgKCFwcm9tICYmICF0aGlzLl9hdHRhY2hlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbm5vdCBwdWJsaXNoIG9uIGluYWN0aXZlIHRvcGljXCIpKTtcbiAgICB9XG5cbiAgICBjb25zdCBzZXEgPSBwdWIuc2VxIHx8IHRoaXMuX2dldFF1ZXVlZFNlcUlkKCk7XG4gICAgaWYgKCFwdWIuX25vRm9yd2FyZGluZykge1xuICAgICAgLy8gVGhlICdzZXEnLCAndHMnLCBhbmQgJ2Zyb20nIGFyZSBhZGRlZCB0byBtaW1pYyB7ZGF0YX0uIFRoZXkgYXJlIHJlbW92ZWQgbGF0ZXJcbiAgICAgIC8vIGJlZm9yZSB0aGUgbWVzc2FnZSBpcyBzZW50LlxuICAgICAgcHViLl9ub0ZvcndhcmRpbmcgPSB0cnVlO1xuICAgICAgcHViLnNlcSA9IHNlcTtcbiAgICAgIHB1Yi50cyA9IG5ldyBEYXRlKCk7XG4gICAgICBwdWIuZnJvbSA9IHRoaXMuX3Rpbm9kZS5nZXRDdXJyZW50VXNlcklEKCk7XG5cbiAgICAgIC8vIERvbid0IG5lZWQgYW4gZWNobyBtZXNzYWdlIGJlY2F1c2UgdGhlIG1lc3NhZ2UgaXMgYWRkZWQgdG8gbG9jYWwgY2FjaGUgcmlnaHQgYXdheS5cbiAgICAgIHB1Yi5ub2VjaG8gPSB0cnVlO1xuICAgICAgLy8gQWRkIHRvIGNhY2hlLlxuICAgICAgdGhpcy5fbWVzc2FnZXMucHV0KHB1Yik7XG4gICAgICB0aGlzLl90aW5vZGUuX2RiLmFkZE1lc3NhZ2UocHViKTtcblxuICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgIHRoaXMub25EYXRhKHB1Yik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIElmIHByb21pc2UgaXMgcHJvdmlkZWQsIHNlbmQgdGhlIHF1ZXVlZCBtZXNzYWdlIHdoZW4gaXQncyByZXNvbHZlZC5cbiAgICAvLyBJZiBubyBwcm9taXNlIGlzIHByb3ZpZGVkLCBjcmVhdGUgYSByZXNvbHZlZCBvbmUgYW5kIHNlbmQgaW1tZWRpYXRlbHkuXG4gICAgcHJvbSA9IChwcm9tIHx8IFByb21pc2UucmVzb2x2ZSgpKS50aGVuKFxuICAgICAgKCAvKiBhcmd1bWVudCBpZ25vcmVkICovICkgPT4ge1xuICAgICAgICBpZiAocHViLl9jYW5jZWxsZWQpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29kZTogMzAwLFxuICAgICAgICAgICAgdGV4dDogXCJjYW5jZWxsZWRcIlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHVibGlzaE1lc3NhZ2UocHViKTtcbiAgICAgIH0sXG4gICAgICAoZXJyKSA9PiB7XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5sb2dnZXIoXCJXQVJOSU5HOiBNZXNzYWdlIGRyYWZ0IHJlamVjdGVkXCIsIGVycik7XG4gICAgICAgIHB1Yi5fc2VuZGluZyA9IGZhbHNlO1xuICAgICAgICBwdWIuX2ZhaWxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX21lc3NhZ2VzLmRlbEF0KHRoaXMuX21lc3NhZ2VzLmZpbmQocHViKSk7XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtTWVzc2FnZXModGhpcy5uYW1lLCBwdWIuc2VxKTtcbiAgICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgICAgdGhpcy5vbkRhdGEoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgcmV0dXJuIHByb207XG4gIH1cbiAgLyoqXG4gICAqIExlYXZlIHRoZSB0b3BpYywgb3B0aW9uYWxseSB1bnNpYnNjcmliZS4gTGVhdmluZyB0aGUgdG9waWMgbWVhbnMgdGhlIHRvcGljIHdpbGwgc3RvcFxuICAgKiByZWNlaXZpbmcgdXBkYXRlcyBmcm9tIHRoZSBzZXJ2ZXIuIFVuc3Vic2NyaWJpbmcgd2lsbCB0ZXJtaW5hdGUgdXNlcidzIHJlbGF0aW9uc2hpcCB3aXRoIHRoZSB0b3BpYy5cbiAgICogV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNsZWF2ZX0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IHVuc3ViIC0gSWYgdHJ1ZSwgdW5zdWJzY3JpYmUsIG90aGVyd2lzZSBqdXN0IGxlYXZlLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gdGhlIHJlcXVlc3QuXG4gICAqL1xuICBsZWF2ZSh1bnN1Yikge1xuICAgIC8vIEl0J3MgcG9zc2libGUgdG8gdW5zdWJzY3JpYmUgKHVuc3ViPT10cnVlKSBmcm9tIGluYWN0aXZlIHRvcGljLlxuICAgIGlmICghdGhpcy5fYXR0YWNoZWQgJiYgIXVuc3ViKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2Fubm90IGxlYXZlIGluYWN0aXZlIHRvcGljXCIpKTtcbiAgICB9XG5cbiAgICAvLyBTZW5kIGEgJ2xlYXZlJyBtZXNzYWdlLCBoYW5kbGUgYXN5bmMgcmVzcG9uc2VcbiAgICByZXR1cm4gdGhpcy5fdGlub2RlLmxlYXZlKHRoaXMubmFtZSwgdW5zdWIpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIHRoaXMuX3Jlc2V0U3ViKCk7XG4gICAgICBpZiAodW5zdWIpIHtcbiAgICAgICAgdGhpcy5fZ29uZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGN0cmw7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFJlcXVlc3QgdG9waWMgbWV0YWRhdGEgZnJvbSB0aGUgc2VydmVyLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5HZXRRdWVyeX0gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byByZXF1ZXN0LlxuICAgKi9cbiAgZ2V0TWV0YShwYXJhbXMpIHtcbiAgICAvLyBTZW5kIHtnZXR9IG1lc3NhZ2UsIHJldHVybiBwcm9taXNlLlxuICAgIHJldHVybiB0aGlzLl90aW5vZGUuZ2V0TWV0YSh0aGlzLm5hbWUsIHBhcmFtcyk7XG4gIH1cbiAgLyoqXG4gICAqIFJlcXVlc3QgbW9yZSBtZXNzYWdlcyBmcm9tIHRoZSBzZXJ2ZXJcbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0IG51bWJlciBvZiBtZXNzYWdlcyB0byBnZXQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yd2FyZCBpZiB0cnVlLCByZXF1ZXN0IG5ld2VyIG1lc3NhZ2VzLlxuICAgKi9cbiAgZ2V0TWVzc2FnZXNQYWdlKGxpbWl0LCBmb3J3YXJkKSB7XG4gICAgbGV0IHF1ZXJ5ID0gZm9yd2FyZCA/XG4gICAgICB0aGlzLnN0YXJ0TWV0YVF1ZXJ5KCkud2l0aExhdGVyRGF0YShsaW1pdCkgOlxuICAgICAgdGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhFYXJsaWVyRGF0YShsaW1pdCk7XG5cbiAgICAvLyBGaXJzdCB0cnkgZmV0Y2hpbmcgZnJvbSBEQiwgdGhlbiBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgcmV0dXJuIHRoaXMuX2xvYWRNZXNzYWdlcyh0aGlzLl90aW5vZGUuX2RiLCBxdWVyeS5leHRyYWN0KCdkYXRhJykpXG4gICAgICAudGhlbigoY291bnQpID0+IHtcbiAgICAgICAgaWYgKGNvdW50ID09IGxpbWl0KSB7XG4gICAgICAgICAgLy8gR290IGVub3VnaCBtZXNzYWdlcyBmcm9tIGxvY2FsIGNhY2hlLlxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgICAgdG9waWM6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGNvZGU6IDIwMCxcbiAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICBjb3VudDogY291bnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlZHVjZSB0aGUgY291bnQgb2YgcmVxdWVzdGVkIG1lc3NhZ2VzLlxuICAgICAgICBsaW1pdCAtPSBjb3VudDtcbiAgICAgICAgLy8gVXBkYXRlIHF1ZXJ5IHdpdGggbmV3IHZhbHVlcyBsb2FkZWQgZnJvbSBEQi5cbiAgICAgICAgcXVlcnkgPSBmb3J3YXJkID8gdGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhMYXRlckRhdGEobGltaXQpIDpcbiAgICAgICAgICB0aGlzLnN0YXJ0TWV0YVF1ZXJ5KCkud2l0aEVhcmxpZXJEYXRhKGxpbWl0KTtcbiAgICAgICAgbGV0IHByb21pc2UgPSB0aGlzLmdldE1ldGEocXVlcnkuYnVpbGQoKSk7XG4gICAgICAgIGlmICghZm9yd2FyZCkge1xuICAgICAgICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgICAgICAgIGlmIChjdHJsICYmIGN0cmwucGFyYW1zICYmICFjdHJsLnBhcmFtcy5jb3VudCkge1xuICAgICAgICAgICAgICB0aGlzLl9ub0VhcmxpZXJNc2dzID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBVcGRhdGUgdG9waWMgbWV0YWRhdGEuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7VGlub2RlLlNldFBhcmFtc30gcGFyYW1zIHBhcmFtZXRlcnMgdG8gdXBkYXRlLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gcmVxdWVzdC5cbiAgICovXG4gIHNldE1ldGEocGFyYW1zKSB7XG4gICAgaWYgKHBhcmFtcy50YWdzKSB7XG4gICAgICBwYXJhbXMudGFncyA9IG5vcm1hbGl6ZUFycmF5KHBhcmFtcy50YWdzKTtcbiAgICB9XG4gICAgLy8gU2VuZCBTZXQgbWVzc2FnZSwgaGFuZGxlIGFzeW5jIHJlc3BvbnNlLlxuICAgIHJldHVybiB0aGlzLl90aW5vZGUuc2V0TWV0YSh0aGlzLm5hbWUsIHBhcmFtcylcbiAgICAgIC50aGVuKChjdHJsKSA9PiB7XG4gICAgICAgIGlmIChjdHJsICYmIGN0cmwuY29kZSA+PSAzMDApIHtcbiAgICAgICAgICAvLyBOb3QgbW9kaWZpZWRcbiAgICAgICAgICByZXR1cm4gY3RybDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXJhbXMuc3ViKSB7XG4gICAgICAgICAgcGFyYW1zLnN1Yi50b3BpYyA9IHRoaXMubmFtZTtcbiAgICAgICAgICBpZiAoY3RybC5wYXJhbXMgJiYgY3RybC5wYXJhbXMuYWNzKSB7XG4gICAgICAgICAgICBwYXJhbXMuc3ViLmFjcyA9IGN0cmwucGFyYW1zLmFjcztcbiAgICAgICAgICAgIHBhcmFtcy5zdWIudXBkYXRlZCA9IGN0cmwudHM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcGFyYW1zLnN1Yi51c2VyKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3Vic2NyaXB0aW9uIHVwZGF0ZSBvZiB0aGUgY3VycmVudCB1c2VyLlxuICAgICAgICAgICAgLy8gQXNzaWduIHVzZXIgSUQgb3RoZXJ3aXNlIHRoZSB1cGRhdGUgd2lsbCBiZSBpZ25vcmVkIGJ5IF9wcm9jZXNzTWV0YVN1Yi5cbiAgICAgICAgICAgIHBhcmFtcy5zdWIudXNlciA9IHRoaXMuX3Rpbm9kZS5nZXRDdXJyZW50VXNlcklEKCk7XG4gICAgICAgICAgICBpZiAoIXBhcmFtcy5kZXNjKSB7XG4gICAgICAgICAgICAgIC8vIEZvcmNlIHVwZGF0ZSB0byB0b3BpYydzIGFzYy5cbiAgICAgICAgICAgICAgcGFyYW1zLmRlc2MgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyYW1zLnN1Yi5fbm9Gb3J3YXJkaW5nID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLl9wcm9jZXNzTWV0YVN1YihbcGFyYW1zLnN1Yl0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcmFtcy5kZXNjKSB7XG4gICAgICAgICAgaWYgKGN0cmwucGFyYW1zICYmIGN0cmwucGFyYW1zLmFjcykge1xuICAgICAgICAgICAgcGFyYW1zLmRlc2MuYWNzID0gY3RybC5wYXJhbXMuYWNzO1xuICAgICAgICAgICAgcGFyYW1zLmRlc2MudXBkYXRlZCA9IGN0cmwudHM7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhRGVzYyhwYXJhbXMuZGVzYyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFyYW1zLnRhZ3MpIHtcbiAgICAgICAgICB0aGlzLl9wcm9jZXNzTWV0YVRhZ3MocGFyYW1zLnRhZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJhbXMuY3JlZCkge1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhQ3JlZHMoW3BhcmFtcy5jcmVkXSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3RybDtcbiAgICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBVcGRhdGUgYWNjZXNzIG1vZGUgb2YgdGhlIGN1cnJlbnQgdXNlciBvciBvZiBhbm90aGVyIHRvcGljIHN1YnNyaWJlci5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVpZCAtIFVJRCBvZiB0aGUgdXNlciB0byB1cGRhdGUgb3IgbnVsbCB0byB1cGRhdGUgY3VycmVudCB1c2VyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXBkYXRlIC0gdGhlIHVwZGF0ZSB2YWx1ZSwgZnVsbCBvciBkZWx0YS5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICB1cGRhdGVNb2RlKHVpZCwgdXBkYXRlKSB7XG4gICAgY29uc3QgdXNlciA9IHVpZCA/IHRoaXMuc3Vic2NyaWJlcih1aWQpIDogbnVsbDtcbiAgICBjb25zdCBhbSA9IHVzZXIgP1xuICAgICAgdXNlci5hY3MudXBkYXRlR2l2ZW4odXBkYXRlKS5nZXRHaXZlbigpIDpcbiAgICAgIHRoaXMuZ2V0QWNjZXNzTW9kZSgpLnVwZGF0ZVdhbnQodXBkYXRlKS5nZXRXYW50KCk7XG5cbiAgICByZXR1cm4gdGhpcy5zZXRNZXRhKHtcbiAgICAgIHN1Yjoge1xuICAgICAgICB1c2VyOiB1aWQsXG4gICAgICAgIG1vZGU6IGFtXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdG9waWMgc3Vic2NyaXB0aW9uLiBXcmFwcGVyIGZvciB7QGxpbmsgVGlub2RlI3NldE1ldGF9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gSUQgb2YgdGhlIHVzZXIgdG8gaW52aXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gbW9kZSAtIEFjY2VzcyBtb2RlLiA8Y29kZT5udWxsPC9jb2RlPiBtZWFucyB0byB1c2UgZGVmYXVsdC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBpbnZpdGUodWlkLCBtb2RlKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0TWV0YSh7XG4gICAgICBzdWI6IHtcbiAgICAgICAgdXNlcjogdWlkLFxuICAgICAgICBtb2RlOiBtb2RlXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIEFyY2hpdmUgb3IgdW4tYXJjaGl2ZSB0aGUgdG9waWMuIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjc2V0TWV0YX0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gYXJjaCAtIHRydWUgdG8gYXJjaGl2ZSB0aGUgdG9waWMsIGZhbHNlIG90aGVyd2lzZS5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBhcmNoaXZlKGFyY2gpIHtcbiAgICBpZiAodGhpcy5wcml2YXRlICYmICghdGhpcy5wcml2YXRlLmFyY2ggPT0gIWFyY2gpKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFyY2gpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zZXRNZXRhKHtcbiAgICAgIGRlc2M6IHtcbiAgICAgICAgcHJpdmF0ZToge1xuICAgICAgICAgIGFyY2g6IGFyY2ggPyB0cnVlIDogQ29uc3QuREVMX0NIQVJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBEZWxldGUgbWVzc2FnZXMuIEhhcmQtZGVsZXRpbmcgbWVzc2FnZXMgcmVxdWlyZXMgT3duZXIgcGVybWlzc2lvbi5cbiAgICogV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNkZWxNZXNzYWdlc30uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7VGlub2RlLkRlbFJhbmdlW119IHJhbmdlcyAtIFJhbmdlcyBvZiBtZXNzYWdlIElEcyB0byBkZWxldGUuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGhhcmQgLSBIYXJkIG9yIHNvZnQgZGVsZXRlXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRvIGJlIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gdGhlIHNlcnZlciByZXNwb25kcyB0byByZXF1ZXN0LlxuICAgKi9cbiAgZGVsTWVzc2FnZXMocmFuZ2VzLCBoYXJkKSB7XG4gICAgaWYgKCF0aGlzLl9hdHRhY2hlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbm5vdCBkZWxldGUgbWVzc2FnZXMgaW4gaW5hY3RpdmUgdG9waWNcIikpO1xuICAgIH1cblxuICAgIC8vIFNvcnQgcmFuZ2VzIGluIGFjY2VuZGluZyBvcmRlciBieSBsb3csIHRoZSBkZXNjZW5kaW5nIGJ5IGhpLlxuICAgIHJhbmdlcy5zb3J0KChyMSwgcjIpID0+IHtcbiAgICAgIGlmIChyMS5sb3cgPCByMi5sb3cpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZiAocjEubG93ID09IHIyLmxvdykge1xuICAgICAgICByZXR1cm4gIXIyLmhpIHx8IChyMS5oaSA+PSByMi5oaSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG5cbiAgICAvLyBSZW1vdmUgcGVuZGluZyBtZXNzYWdlcyBmcm9tIHJhbmdlcyBwb3NzaWJseSBjbGlwcGluZyBzb21lIHJhbmdlcy5cbiAgICBsZXQgdG9zZW5kID0gcmFuZ2VzLnJlZHVjZSgob3V0LCByKSA9PiB7XG4gICAgICBpZiAoci5sb3cgPCBDb25zdC5MT0NBTF9TRVFJRCkge1xuICAgICAgICBpZiAoIXIuaGkgfHwgci5oaSA8IENvbnN0LkxPQ0FMX1NFUUlEKSB7XG4gICAgICAgICAgb3V0LnB1c2gocik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ2xpcCBoaSB0byBtYXggYWxsb3dlZCB2YWx1ZS5cbiAgICAgICAgICBvdXQucHVzaCh7XG4gICAgICAgICAgICBsb3c6IHIubG93LFxuICAgICAgICAgICAgaGk6IHRoaXMuX21heFNlcSArIDFcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG91dDtcbiAgICB9LCBbXSk7XG5cbiAgICAvLyBTZW5kIHtkZWx9IG1lc3NhZ2UsIHJldHVybiBwcm9taXNlXG4gICAgbGV0IHJlc3VsdDtcbiAgICBpZiAodG9zZW5kLmxlbmd0aCA+IDApIHtcbiAgICAgIHJlc3VsdCA9IHRoaXMuX3Rpbm9kZS5kZWxNZXNzYWdlcyh0aGlzLm5hbWUsIHRvc2VuZCwgaGFyZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIGRlbDogMFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gVXBkYXRlIGxvY2FsIGNhY2hlLlxuICAgIHJldHVybiByZXN1bHQudGhlbigoY3RybCkgPT4ge1xuICAgICAgaWYgKGN0cmwucGFyYW1zLmRlbCA+IHRoaXMuX21heERlbCkge1xuICAgICAgICB0aGlzLl9tYXhEZWwgPSBjdHJsLnBhcmFtcy5kZWw7XG4gICAgICB9XG5cbiAgICAgIHJhbmdlcy5mb3JFYWNoKChyKSA9PiB7XG4gICAgICAgIGlmIChyLmhpKSB7XG4gICAgICAgICAgdGhpcy5mbHVzaE1lc3NhZ2VSYW5nZShyLmxvdywgci5oaSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5mbHVzaE1lc3NhZ2Uoci5sb3cpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fdXBkYXRlRGVsZXRlZFJhbmdlcygpO1xuXG4gICAgICBpZiAodGhpcy5vbkRhdGEpIHtcbiAgICAgICAgLy8gQ2FsbGluZyB3aXRoIG5vIHBhcmFtZXRlcnMgdG8gaW5kaWNhdGUgdGhlIG1lc3NhZ2VzIHdlcmUgZGVsZXRlZC5cbiAgICAgICAgdGhpcy5vbkRhdGEoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBEZWxldGUgYWxsIG1lc3NhZ2VzLiBIYXJkLWRlbGV0aW5nIG1lc3NhZ2VzIHJlcXVpcmVzIE93bmVyIHBlcm1pc3Npb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaGFyZERlbCAtIHRydWUgaWYgbWVzc2FnZXMgc2hvdWxkIGJlIGhhcmQtZGVsZXRlZC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBkZWxNZXNzYWdlc0FsbChoYXJkRGVsKSB7XG4gICAgaWYgKCF0aGlzLl9tYXhTZXEgfHwgdGhpcy5fbWF4U2VxIDw9IDApIHtcbiAgICAgIC8vIFRoZXJlIGFyZSBubyBtZXNzYWdlcyB0byBkZWxldGUuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmRlbE1lc3NhZ2VzKFt7XG4gICAgICBsb3c6IDEsXG4gICAgICBoaTogdGhpcy5fbWF4U2VxICsgMSxcbiAgICAgIF9hbGw6IHRydWVcbiAgICB9XSwgaGFyZERlbCk7XG4gIH1cbiAgLyoqXG4gICAqIERlbGV0ZSBtdWx0aXBsZSBtZXNzYWdlcyBkZWZpbmVkIGJ5IHRoZWlyIElEcy4gSGFyZC1kZWxldGluZyBtZXNzYWdlcyByZXF1aXJlcyBPd25lciBwZXJtaXNzaW9uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge1Rpbm9kZS5EZWxSYW5nZVtdfSBsaXN0IC0gbGlzdCBvZiBzZXEgSURzIHRvIGRlbGV0ZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBoYXJkRGVsIC0gdHJ1ZSBpZiBtZXNzYWdlcyBzaG91bGQgYmUgaGFyZC1kZWxldGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gcmVxdWVzdC5cbiAgICovXG4gIGRlbE1lc3NhZ2VzTGlzdChsaXN0LCBoYXJkRGVsKSB7XG4gICAgLy8gU29ydCB0aGUgbGlzdCBpbiBhc2NlbmRpbmcgb3JkZXJcbiAgICBsaXN0LnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgICAvLyBDb252ZXJ0IHRoZSBhcnJheSBvZiBJRHMgdG8gcmFuZ2VzLlxuICAgIGxldCByYW5nZXMgPSBsaXN0LnJlZHVjZSgob3V0LCBpZCkgPT4ge1xuICAgICAgaWYgKG91dC5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBGaXJzdCBlbGVtZW50LlxuICAgICAgICBvdXQucHVzaCh7XG4gICAgICAgICAgbG93OiBpZFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcmV2ID0gb3V0W291dC5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKCghcHJldi5oaSAmJiAoaWQgIT0gcHJldi5sb3cgKyAxKSkgfHwgKGlkID4gcHJldi5oaSkpIHtcbiAgICAgICAgICAvLyBOZXcgcmFuZ2UuXG4gICAgICAgICAgb3V0LnB1c2goe1xuICAgICAgICAgICAgbG93OiBpZFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEV4cGFuZCBleGlzdGluZyByYW5nZS5cbiAgICAgICAgICBwcmV2LmhpID0gcHJldi5oaSA/IE1hdGgubWF4KHByZXYuaGksIGlkICsgMSkgOiBpZCArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfSwgW10pO1xuICAgIC8vIFNlbmQge2RlbH0gbWVzc2FnZSwgcmV0dXJuIHByb21pc2VcbiAgICByZXR1cm4gdGhpcy5kZWxNZXNzYWdlcyhyYW5nZXMsIGhhcmREZWwpO1xuICB9XG4gIC8qKlxuICAgKiBEZWxldGUgdG9waWMuIFJlcXVpcmVzIE93bmVyIHBlcm1pc3Npb24uIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjZGVsVG9waWN9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhhcmQgLSBoYWQtZGVsZXRlIHRvcGljLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0byBiZSByZXNvbHZlZC9yZWplY3RlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgdG8gdGhlIHJlcXVlc3QuXG4gICAqL1xuICBkZWxUb3BpYyhoYXJkKSB7XG4gICAgaWYgKHRoaXMuX2RlbGV0ZWQpIHtcbiAgICAgIC8vIFRoZSB0b3BpYyBpcyBhbHJlYWR5IGRlbGV0ZWQgYXQgdGhlIHNlcnZlciwganVzdCByZW1vdmUgZnJvbSBEQi5cbiAgICAgIHRoaXMuX2dvbmUoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl90aW5vZGUuZGVsVG9waWModGhpcy5uYW1lLCBoYXJkKS50aGVuKChjdHJsKSA9PiB7XG4gICAgICB0aGlzLl9yZXNldFN1YigpO1xuICAgICAgdGhpcy5fZ29uZSgpO1xuICAgICAgcmV0dXJuIGN0cmw7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIERlbGV0ZSBzdWJzY3JpcHRpb24uIFJlcXVpcmVzIFNoYXJlIHBlcm1pc3Npb24uIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjZGVsU3Vic2NyaXB0aW9ufS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXIgLSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUgc3Vic2NyaXB0aW9uIGZvci5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBkZWxTdWJzY3JpcHRpb24odXNlcikge1xuICAgIGlmICghdGhpcy5fYXR0YWNoZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJDYW5ub3QgZGVsZXRlIHN1YnNjcmlwdGlvbiBpbiBpbmFjdGl2ZSB0b3BpY1wiKSk7XG4gICAgfVxuICAgIC8vIFNlbmQge2RlbH0gbWVzc2FnZSwgcmV0dXJuIHByb21pc2VcbiAgICByZXR1cm4gdGhpcy5fdGlub2RlLmRlbFN1YnNjcmlwdGlvbih0aGlzLm5hbWUsIHVzZXIpLnRoZW4oKGN0cmwpID0+IHtcbiAgICAgIC8vIFJlbW92ZSB0aGUgb2JqZWN0IGZyb20gdGhlIHN1YnNjcmlwdGlvbiBjYWNoZTtcbiAgICAgIGRlbGV0ZSB0aGlzLl91c2Vyc1t1c2VyXTtcbiAgICAgIC8vIE5vdGlmeSBsaXN0ZW5lcnNcbiAgICAgIGlmICh0aGlzLm9uU3Vic1VwZGF0ZWQpIHtcbiAgICAgICAgdGhpcy5vblN1YnNVcGRhdGVkKE9iamVjdC5rZXlzKHRoaXMuX3VzZXJzKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3RybDtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogU2VuZCBhIHJlYWQvcmVjdiBub3RpZmljYXRpb24uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3aGF0IC0gd2hhdCBub3RpZmljYXRpb24gdG8gc2VuZDogPGNvZGU+cmVjdjwvY29kZT4sIDxjb2RlPnJlYWQ8L2NvZGU+LlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxIC0gSUQgb3IgdGhlIG1lc3NhZ2UgcmVhZCBvciByZWNlaXZlZC5cbiAgICovXG4gIG5vdGUod2hhdCwgc2VxKSB7XG4gICAgaWYgKCF0aGlzLl9hdHRhY2hlZCkge1xuICAgICAgLy8gQ2Fubm90IHNlbmRpbmcge25vdGV9IG9uIGFuIGluYWN0aXZlIHRvcGljXCIuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIGxvY2FsIGNhY2hlIHdpdGggdGhlIG5ldyBjb3VudC5cbiAgICBjb25zdCB1c2VyID0gdGhpcy5fdXNlcnNbdGhpcy5fdGlub2RlLmdldEN1cnJlbnRVc2VySUQoKV07XG4gICAgbGV0IHVwZGF0ZSA9IGZhbHNlO1xuICAgIGlmICh1c2VyKSB7XG4gICAgICAvLyBTZWxmLXN1YnNjcmlwdGlvbiBpcyBmb3VuZC5cbiAgICAgIGlmICghdXNlclt3aGF0XSB8fCB1c2VyW3doYXRdIDwgc2VxKSB7XG4gICAgICAgIHVzZXJbd2hhdF0gPSBzZXE7XG4gICAgICAgIHVwZGF0ZSA9IHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNlbGYtc3Vic2NyaXB0aW9uIGlzIG5vdCBmb3VuZC5cbiAgICAgIHVwZGF0ZSA9ICh0aGlzW3doYXRdIHwgMCkgPCBzZXE7XG4gICAgfVxuXG4gICAgaWYgKHVwZGF0ZSkge1xuICAgICAgLy8gU2VuZCBub3RpZmljYXRpb24gdG8gdGhlIHNlcnZlci5cbiAgICAgIHRoaXMuX3Rpbm9kZS5ub3RlKHRoaXMubmFtZSwgd2hhdCwgc2VxKTtcbiAgICAgIC8vIFVwZGF0ZSBsb2NhbGx5IGNhY2hlZCBjb250YWN0IHdpdGggdGhlIG5ldyBjb3VudC5cbiAgICAgIHRoaXMuX3VwZGF0ZVJlYWRSZWN2KHdoYXQsIHNlcSk7XG5cbiAgICAgIGlmICh0aGlzLmFjcyAhPSBudWxsICYmICF0aGlzLmFjcy5pc011dGVkKCkpIHtcbiAgICAgICAgY29uc3QgbWUgPSB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpO1xuICAgICAgICAvLyBTZW50IGEgbm90aWZpY2F0aW9uIHRvICdtZScgbGlzdGVuZXJzLlxuICAgICAgICBtZS5fcmVmcmVzaENvbnRhY3Qod2hhdCwgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBTZW5kIGEgJ3JlY3YnIHJlY2VpcHQuIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjbm90ZVJlY3Z9LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxIC0gSUQgb2YgdGhlIG1lc3NhZ2UgdG8gYWtub3dsZWRnZS5cbiAgICovXG4gIG5vdGVSZWN2KHNlcSkge1xuICAgIHRoaXMubm90ZSgncmVjdicsIHNlcSk7XG4gIH1cbiAgLyoqXG4gICAqIFNlbmQgYSAncmVhZCcgcmVjZWlwdC4gV3JhcHBlciBmb3Ige0BsaW5rIFRpbm9kZSNub3RlUmVhZH0uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBJRCBvZiB0aGUgbWVzc2FnZSB0byBha25vd2xlZGdlIG9yIDAvdW5kZWZpbmVkIHRvIGFja25vd2xlZGdlIHRoZSBsYXRlc3QgbWVzc2FnZXMuXG4gICAqL1xuICBub3RlUmVhZChzZXEpIHtcbiAgICBzZXEgPSBzZXEgfHwgdGhpcy5fbWF4U2VxO1xuICAgIGlmIChzZXEgPiAwKSB7XG4gICAgICB0aGlzLm5vdGUoJ3JlYWQnLCBzZXEpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogU2VuZCBhIGtleS1wcmVzcyBub3RpZmljYXRpb24uIFdyYXBwZXIgZm9yIHtAbGluayBUaW5vZGUjbm90ZUtleVByZXNzfS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICovXG4gIG5vdGVLZXlQcmVzcygpIHtcbiAgICBpZiAodGhpcy5fYXR0YWNoZWQpIHtcbiAgICAgIHRoaXMuX3Rpbm9kZS5ub3RlS2V5UHJlc3ModGhpcy5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGlub2RlLmxvZ2dlcihcIklORk86IENhbm5vdCBzZW5kIG5vdGlmaWNhdGlvbiBpbiBpbmFjdGl2ZSB0b3BpY1wiKTtcbiAgICB9XG4gIH1cbiAgLy8gVXBkYXRlIGNhY2hlZCByZWFkL3JlY3YvdW5yZWFkIGNvdW50cy5cbiAgX3VwZGF0ZVJlYWRSZWN2KHdoYXQsIHNlcSwgdHMpIHtcbiAgICBsZXQgb2xkVmFsLCBkb1VwZGF0ZSA9IGZhbHNlO1xuXG4gICAgc2VxID0gc2VxIHwgMDtcbiAgICB0aGlzLnNlcSA9IHRoaXMuc2VxIHwgMDtcbiAgICB0aGlzLnJlYWQgPSB0aGlzLnJlYWQgfCAwO1xuICAgIHRoaXMucmVjdiA9IHRoaXMucmVjdiB8IDA7XG4gICAgc3dpdGNoICh3aGF0KSB7XG4gICAgICBjYXNlICdyZWN2JzpcbiAgICAgICAgb2xkVmFsID0gdGhpcy5yZWN2O1xuICAgICAgICB0aGlzLnJlY3YgPSBNYXRoLm1heCh0aGlzLnJlY3YsIHNlcSk7XG4gICAgICAgIGRvVXBkYXRlID0gKG9sZFZhbCAhPSB0aGlzLnJlY3YpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3JlYWQnOlxuICAgICAgICBvbGRWYWwgPSB0aGlzLnJlYWQ7XG4gICAgICAgIHRoaXMucmVhZCA9IE1hdGgubWF4KHRoaXMucmVhZCwgc2VxKTtcbiAgICAgICAgZG9VcGRhdGUgPSAob2xkVmFsICE9IHRoaXMucmVhZCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbXNnJzpcbiAgICAgICAgb2xkVmFsID0gdGhpcy5zZXE7XG4gICAgICAgIHRoaXMuc2VxID0gTWF0aC5tYXgodGhpcy5zZXEsIHNlcSk7XG4gICAgICAgIGlmICghdGhpcy50b3VjaGVkIHx8IHRoaXMudG91Y2hlZCA8IHRzKSB7XG4gICAgICAgICAgdGhpcy50b3VjaGVkID0gdHM7XG4gICAgICAgIH1cbiAgICAgICAgZG9VcGRhdGUgPSAob2xkVmFsICE9IHRoaXMuc2VxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gU2FuaXR5IGNoZWNrcy5cbiAgICBpZiAodGhpcy5yZWN2IDwgdGhpcy5yZWFkKSB7XG4gICAgICB0aGlzLnJlY3YgPSB0aGlzLnJlYWQ7XG4gICAgICBkb1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLnNlcSA8IHRoaXMucmVjdikge1xuICAgICAgdGhpcy5zZXEgPSB0aGlzLnJlY3Y7XG4gICAgICBpZiAoIXRoaXMudG91Y2hlZCB8fCB0aGlzLnRvdWNoZWQgPCB0cykge1xuICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cztcbiAgICAgIH1cbiAgICAgIGRvVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy51bnJlYWQgPSB0aGlzLnNlcSAtIHRoaXMucmVhZDtcbiAgICByZXR1cm4gZG9VcGRhdGU7XG4gIH1cbiAgLyoqXG4gICAqIEdldCB1c2VyIGRlc2NyaXB0aW9uIGZyb20gZ2xvYmFsIGNhY2hlLiBUaGUgdXNlciBkb2VzIG5vdCBuZWVkIHRvIGJlIGFcbiAgICogc3Vic2NyaWJlciBvZiB0aGlzIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gSUQgb2YgdGhlIHVzZXIgdG8gZmV0Y2guXG4gICAqIEByZXR1cm4ge09iamVjdH0gdXNlciBkZXNjcmlwdGlvbiBvciB1bmRlZmluZWQuXG4gICAqL1xuICB1c2VyRGVzYyh1aWQpIHtcbiAgICAvLyBUT0RPOiBoYW5kbGUgYXN5bmNocm9ub3VzIHJlcXVlc3RzXG4gICAgY29uc3QgdXNlciA9IHRoaXMuX2NhY2hlR2V0VXNlcih1aWQpO1xuICAgIGlmICh1c2VyKSB7XG4gICAgICByZXR1cm4gdXNlcjsgLy8gUHJvbWlzZS5yZXNvbHZlKHVzZXIpXG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBHZXQgZGVzY3JpcHRpb24gb2YgdGhlIHAycCBwZWVyIGZyb20gc3Vic2NyaXB0aW9uIGNhY2hlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IHBlZXIncyBkZXNjcmlwdGlvbiBvciB1bmRlZmluZWQuXG4gICAqL1xuICBwMnBQZWVyRGVzYygpIHtcbiAgICBpZiAoIXRoaXMuaXNQMlBUeXBlKCkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl91c2Vyc1t0aGlzLm5hbWVdO1xuICB9XG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2FjaGVkIHN1YnNjcmliZXJzLiBJZiBjYWxsYmFjayBpcyB1bmRlZmluZWQsIHVzZSB0aGlzLm9uTWV0YVN1Yi5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayB3aGljaCB3aWxsIHJlY2VpdmUgc3Vic2NyaWJlcnMgb25lIGJ5IG9uZS5cbiAgICogQHBhcmFtIHtPYmplY3Q9fSBjb250ZXh0IC0gVmFsdWUgb2YgYHRoaXNgIGluc2lkZSB0aGUgYGNhbGxiYWNrYC5cbiAgICovXG4gIHN1YnNjcmliZXJzKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgY29uc3QgY2IgPSAoY2FsbGJhY2sgfHwgdGhpcy5vbk1ldGFTdWIpO1xuICAgIGlmIChjYikge1xuICAgICAgZm9yIChsZXQgaWR4IGluIHRoaXMuX3VzZXJzKSB7XG4gICAgICAgIGNiLmNhbGwoY29udGV4dCwgdGhpcy5fdXNlcnNbaWR4XSwgaWR4LCB0aGlzLl91c2Vycyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBHZXQgYSBjb3B5IG9mIGNhY2hlZCB0YWdzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJuIHtBcnJheS48c3RyaW5nPn0gYSBjb3B5IG9mIHRhZ3NcbiAgICovXG4gIHRhZ3MoKSB7XG4gICAgLy8gUmV0dXJuIGEgY29weS5cbiAgICByZXR1cm4gdGhpcy5fdGFncy5zbGljZSgwKTtcbiAgfVxuICAvKipcbiAgICogR2V0IGNhY2hlZCBzdWJzY3JpcHRpb24gZm9yIHRoZSBnaXZlbiB1c2VyIElELlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdWlkIC0gaWQgb2YgdGhlIHVzZXIgdG8gcXVlcnkgZm9yXG4gICAqIEByZXR1cm4gdXNlciBkZXNjcmlwdGlvbiBvciB1bmRlZmluZWQuXG4gICAqL1xuICBzdWJzY3JpYmVyKHVpZCkge1xuICAgIHJldHVybiB0aGlzLl91c2Vyc1t1aWRdO1xuICB9XG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2FjaGVkIG1lc3NhZ2VzOiBjYWxsIDxjb2RlPmNhbGxiYWNrPC9jb2RlPiBmb3IgZWFjaCBtZXNzYWdlIGluIHRoZSByYW5nZSBbc2luZGVJZHgsIGJlZm9yZUlkeCkuXG4gICAqIElmIDxjb2RlPmNhbGxiYWNrPC9jb2RlPiBpcyB1bmRlZmluZWQsIHVzZSA8Y29kZT50aGlzLm9uRGF0YTwvY29kZT4uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7VGlub2RlLkZvckVhY2hDYWxsYmFja1R5cGV9IGNhbGxiYWNrIC0gQ2FsbGJhY2sgd2hpY2ggd2lsbCByZWNlaXZlIG1lc3NhZ2VzIG9uZSBieSBvbmUuIFNlZSB7QGxpbmsgVGlub2RlLkNCdWZmZXIjZm9yRWFjaH1cbiAgICogQHBhcmFtIHtudW1iZXJ9IHNpbmNlSWQgLSBPcHRpb25hbCBzZXFJZCB0byBzdGFydCBpdGVyYXRpbmcgZnJvbSAoaW5jbHVzaXZlKS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGJlZm9yZUlkIC0gT3B0aW9uYWwgc2VxSWQgdG8gc3RvcCBpdGVyYXRpbmcgYmVmb3JlIGl0IGlzIHJlYWNoZWQgKGV4Y2x1c2l2ZSkuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gVmFsdWUgb2YgYHRoaXNgIGluc2lkZSB0aGUgYGNhbGxiYWNrYC5cbiAgICovXG4gIG1lc3NhZ2VzKGNhbGxiYWNrLCBzaW5jZUlkLCBiZWZvcmVJZCwgY29udGV4dCkge1xuICAgIGNvbnN0IGNiID0gKGNhbGxiYWNrIHx8IHRoaXMub25EYXRhKTtcbiAgICBpZiAoY2IpIHtcbiAgICAgIGNvbnN0IHN0YXJ0SWR4ID0gdHlwZW9mIHNpbmNlSWQgPT0gJ251bWJlcicgPyB0aGlzLl9tZXNzYWdlcy5maW5kKHtcbiAgICAgICAgc2VxOiBzaW5jZUlkXG4gICAgICB9LCB0cnVlKSA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IGJlZm9yZUlkeCA9IHR5cGVvZiBiZWZvcmVJZCA9PSAnbnVtYmVyJyA/IHRoaXMuX21lc3NhZ2VzLmZpbmQoe1xuICAgICAgICBzZXE6IGJlZm9yZUlkXG4gICAgICB9LCB0cnVlKSA6IHVuZGVmaW5lZDtcbiAgICAgIGlmIChzdGFydElkeCAhPSAtMSAmJiBiZWZvcmVJZHggIT0gLTEpIHtcbiAgICAgICAgdGhpcy5fbWVzc2FnZXMuZm9yRWFjaChjYiwgc3RhcnRJZHgsIGJlZm9yZUlkeCwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBHZXQgdGhlIG1lc3NhZ2UgZnJvbSBjYWNoZSBieSA8Y29kZT5zZXE8L2NvZGU+LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxIC0gbWVzc2FnZSBzZXFJZCB0byBzZWFyY2ggZm9yLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSB0aGUgbWVzc2FnZSB3aXRoIHRoZSBnaXZlbiA8Y29kZT5zZXE8L2NvZGU+IG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4sIGlmIG5vIHN1Y2ggbWVzc2FnZSBpcyBmb3VuZC5cbiAgICovXG4gIGZpbmRNZXNzYWdlKHNlcSkge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuX21lc3NhZ2VzLmZpbmQoe1xuICAgICAgc2VxOiBzZXFcbiAgICB9KTtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9tZXNzYWdlcy5nZXRBdChpZHgpO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIC8qKlxuICAgKiBHZXQgdGhlIG1vc3QgcmVjZW50IG1lc3NhZ2UgZnJvbSBjYWNoZS4gVGhpcyBtZXRob2QgY291bnRzIGFsbCBtZXNzYWdlcywgaW5jbHVkaW5nIGRlbGV0ZWQgcmFuZ2VzLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlbn0gc2tpcERlbGV0ZWQgLSBpZiB0aGUgbGFzdCBtZXNzYWdlIGlzIGEgZGVsZXRlZCByYW5nZSwgZ2V0IHRoZSBvbmUgYmVmb3JlIGl0LlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSB0aGUgbW9zdCByZWNlbnQgY2FjaGVkIG1lc3NhZ2Ugb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPiwgaWYgbm8gbWVzc2FnZXMgYXJlIGNhY2hlZC5cbiAgICovXG4gIGxhdGVzdE1lc3NhZ2Uoc2tpcERlbGV0ZWQpIHtcbiAgICBjb25zdCBtc2cgPSB0aGlzLl9tZXNzYWdlcy5nZXRMYXN0KCk7XG4gICAgaWYgKCFza2lwRGVsZXRlZCB8fCAhbXNnIHx8IG1zZy5fc3RhdHVzICE9IENvbnN0Lk1FU1NBR0VfU1RBVFVTX0RFTF9SQU5HRSkge1xuICAgICAgcmV0dXJuIG1zZztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX21lc3NhZ2VzLmdldExhc3QoMSk7XG4gIH1cbiAgLyoqXG4gICAqIEdldCB0aGUgbWF4aW11bSBjYWNoZWQgc2VxIElELlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSB0aGUgZ3JlYXRlc3Qgc2VxIElEIGluIGNhY2hlLlxuICAgKi9cbiAgbWF4TXNnU2VxKCkge1xuICAgIHJldHVybiB0aGlzLl9tYXhTZXE7XG4gIH1cbiAgLyoqXG4gICAqIEdldCB0aGUgbWF4aW11bSBkZWxldGlvbiBJRC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge251bWJlcn0gdGhlIGdyZWF0ZXN0IGRlbGV0aW9uIElELlxuICAgKi9cbiAgbWF4Q2xlYXJJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbWF4RGVsO1xuICB9XG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiBtZXNzYWdlcyBpbiB0aGUgY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IGNvdW50IG9mIGNhY2hlZCBtZXNzYWdlcy5cbiAgICovXG4gIG1lc3NhZ2VDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbWVzc2FnZXMubGVuZ3RoKCk7XG4gIH1cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBjYWNoZWQgdW5zZW50IG1lc3NhZ2VzLiBXcmFwcyB7QGxpbmsgVGlub2RlLlRvcGljI21lc3NhZ2VzfS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayB3aGljaCB3aWxsIHJlY2VpdmUgbWVzc2FnZXMgb25lIGJ5IG9uZS4gU2VlIHtAbGluayBUaW5vZGUuQ0J1ZmZlciNmb3JFYWNofVxuICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIFZhbHVlIG9mIDxjb2RlPnRoaXM8L2NvZGU+IGluc2lkZSB0aGUgPGNvZGU+Y2FsbGJhY2s8L2NvZGU+LlxuICAgKi9cbiAgcXVldWVkTWVzc2FnZXMoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayBtdXN0IGJlIHByb3ZpZGVkXCIpO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VzKGNhbGxiYWNrLCBDb25zdC5MT0NBTF9TRVFJRCwgdW5kZWZpbmVkLCBjb250ZXh0KTtcbiAgfVxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgdG9waWMgc3Vic2NyaWJlcnMgd2hvIG1hcmtlZCB0aGlzIG1lc3NhZ2UgYXMgZWl0aGVyIHJlY3Ygb3IgcmVhZFxuICAgKiBDdXJyZW50IHVzZXIgaXMgZXhjbHVkZWQgZnJvbSB0aGUgY291bnQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3aGF0IC0gd2hhdCBhY3Rpb24gdG8gY29uc2lkZXI6IHJlY2VpdmVkIDxjb2RlPlwicmVjdlwiPC9jb2RlPiBvciByZWFkIDxjb2RlPlwicmVhZFwiPC9jb2RlPi5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlcSAtIElEIG9yIHRoZSBtZXNzYWdlIHJlYWQgb3IgcmVjZWl2ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBudW1iZXIgb2Ygc3Vic2NyaWJlcnMgd2hvIG1hcmtlZCB0aGUgbWVzc2FnZSB3aXRoIHRoZSBnaXZlbiBJRCBhcyByZWFkIG9yIHJlY2VpdmVkLlxuICAgKi9cbiAgbXNnUmVjZWlwdENvdW50KHdoYXQsIHNlcSkge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgaWYgKHNlcSA+IDApIHtcbiAgICAgIGNvbnN0IG1lID0gdGhpcy5fdGlub2RlLmdldEN1cnJlbnRVc2VySUQoKTtcbiAgICAgIGZvciAobGV0IGlkeCBpbiB0aGlzLl91c2Vycykge1xuICAgICAgICBjb25zdCB1c2VyID0gdGhpcy5fdXNlcnNbaWR4XTtcbiAgICAgICAgaWYgKHVzZXIudXNlciAhPT0gbWUgJiYgdXNlclt3aGF0XSA+PSBzZXEpIHtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb3VudDtcbiAgfVxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgdG9waWMgc3Vic2NyaWJlcnMgd2hvIG1hcmtlZCB0aGlzIG1lc3NhZ2UgKGFuZCBhbGwgb2xkZXIgbWVzc2FnZXMpIGFzIHJlYWQuXG4gICAqIFRoZSBjdXJyZW50IHVzZXIgaXMgZXhjbHVkZWQgZnJvbSB0aGUgY291bnQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXEgLSBtZXNzYWdlIGlkIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBudW1iZXIgb2Ygc3Vic2NyaWJlcnMgd2hvIGNsYWltIHRvIGhhdmUgcmVjZWl2ZWQgdGhlIG1lc3NhZ2UuXG4gICAqL1xuICBtc2dSZWFkQ291bnQoc2VxKSB7XG4gICAgcmV0dXJuIHRoaXMubXNnUmVjZWlwdENvdW50KCdyZWFkJywgc2VxKTtcbiAgfVxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgdG9waWMgc3Vic2NyaWJlcnMgd2hvIG1hcmtlZCB0aGlzIG1lc3NhZ2UgKGFuZCBhbGwgb2xkZXIgbWVzc2FnZXMpIGFzIHJlY2VpdmVkLlxuICAgKiBUaGUgY3VycmVudCB1c2VyIGlzIGV4Y2x1ZGVkIGZyb20gdGhlIGNvdW50LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxIC0gTWVzc2FnZSBpZCB0byBjaGVjay5cbiAgICogQHJldHVybnMge251bWJlcn0gTnVtYmVyIG9mIHN1YnNjcmliZXJzIHdobyBjbGFpbSB0byBoYXZlIHJlY2VpdmVkIHRoZSBtZXNzYWdlLlxuICAgKi9cbiAgbXNnUmVjdkNvdW50KHNlcSkge1xuICAgIHJldHVybiB0aGlzLm1zZ1JlY2VpcHRDb3VudCgncmVjdicsIHNlcSk7XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNhY2hlZCBtZXNzYWdlIElEcyBpbmRpY2F0ZSB0aGF0IHRoZSBzZXJ2ZXIgbWF5IGhhdmUgbW9yZSBtZXNzYWdlcy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBuZXdlciAtIGlmIDxjb2RlPnRydWU8L2NvZGU+LCBjaGVjayBmb3IgbmV3ZXIgbWVzc2FnZXMgb25seS5cbiAgICovXG4gIG1zZ0hhc01vcmVNZXNzYWdlcyhuZXdlcikge1xuICAgIHJldHVybiBuZXdlciA/IHRoaXMuc2VxID4gdGhpcy5fbWF4U2VxIDpcbiAgICAgIC8vIF9taW5TZXEgY291bGQgYmUgbW9yZSB0aGFuIDEsIGJ1dCBlYXJsaWVyIG1lc3NhZ2VzIGNvdWxkIGhhdmUgYmVlbiBkZWxldGVkLlxuICAgICAgKHRoaXMuX21pblNlcSA+IDEgJiYgIXRoaXMuX25vRWFybGllck1zZ3MpO1xuICB9XG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gc2VxIElkIGlzIGlkIG9mIHRoZSBtb3N0IHJlY2VudCBtZXNzYWdlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxSWQgaWQgb2YgdGhlIG1lc3NhZ2UgdG8gY2hlY2tcbiAgICovXG4gIGlzTmV3TWVzc2FnZShzZXFJZCkge1xuICAgIHJldHVybiB0aGlzLl9tYXhTZXEgPD0gc2VxSWQ7XG4gIH1cbiAgLyoqXG4gICAqIFJlbW92ZSBvbmUgbWVzc2FnZSBmcm9tIGxvY2FsIGNhY2hlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxSWQgaWQgb2YgdGhlIG1lc3NhZ2UgdG8gcmVtb3ZlIGZyb20gY2FjaGUuXG4gICAqIEByZXR1cm5zIHtNZXNzYWdlfSByZW1vdmVkIG1lc3NhZ2Ugb3IgdW5kZWZpbmVkIGlmIHN1Y2ggbWVzc2FnZSB3YXMgbm90IGZvdW5kLlxuICAgKi9cbiAgZmx1c2hNZXNzYWdlKHNlcUlkKSB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5fbWVzc2FnZXMuZmluZCh7XG4gICAgICBzZXE6IHNlcUlkXG4gICAgfSk7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICB0aGlzLl90aW5vZGUuX2RiLnJlbU1lc3NhZ2VzKHRoaXMubmFtZSwgc2VxSWQpO1xuICAgICAgcmV0dXJuIHRoaXMuX21lc3NhZ2VzLmRlbEF0KGlkeCk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZSBtZXNzYWdlJ3Mgc2VxSWQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwdWIgbWVzc2FnZSBvYmplY3QuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBuZXdTZXFJZCBuZXcgc2VxIGlkIGZvciBwdWIuXG4gICAqL1xuICBzd2FwTWVzc2FnZUlkKHB1YiwgbmV3U2VxSWQpIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLl9tZXNzYWdlcy5maW5kKHB1Yik7XG4gICAgY29uc3QgbnVtTWVzc2FnZXMgPSB0aGlzLl9tZXNzYWdlcy5sZW5ndGgoKTtcbiAgICBpZiAoMCA8PSBpZHggJiYgaWR4IDwgbnVtTWVzc2FnZXMpIHtcbiAgICAgIC8vIFJlbW92ZSBtZXNzYWdlIHdpdGggdGhlIG9sZCBzZXEgSUQuXG4gICAgICB0aGlzLl9tZXNzYWdlcy5kZWxBdChpZHgpO1xuICAgICAgdGhpcy5fdGlub2RlLl9kYi5yZW1NZXNzYWdlcyh0aGlzLm5hbWUsIHB1Yi5zZXEpO1xuICAgICAgLy8gQWRkIG1lc3NhZ2Ugd2l0aCB0aGUgbmV3IHNlcSBJRC5cbiAgICAgIHB1Yi5zZXEgPSBuZXdTZXFJZDtcbiAgICAgIHRoaXMuX21lc3NhZ2VzLnB1dChwdWIpO1xuICAgICAgdGhpcy5fdGlub2RlLl9kYi5hZGRNZXNzYWdlKHB1Yik7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBSZW1vdmUgYSByYW5nZSBvZiBtZXNzYWdlcyBmcm9tIHRoZSBsb2NhbCBjYWNoZS5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGZyb21JZCBzZXEgSUQgb2YgdGhlIGZpcnN0IG1lc3NhZ2UgdG8gcmVtb3ZlIChpbmNsdXNpdmUpLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdW50aWxJZCBzZXFJRCBvZiB0aGUgbGFzdCBtZXNzYWdlIHRvIHJlbW92ZSAoZXhjbHVzaXZlKS5cbiAgICpcbiAgICogQHJldHVybnMge01lc3NhZ2VbXX0gYXJyYXkgb2YgcmVtb3ZlZCBtZXNzYWdlcyAoY291bGQgYmUgZW1wdHkpLlxuICAgKi9cbiAgZmx1c2hNZXNzYWdlUmFuZ2UoZnJvbUlkLCB1bnRpbElkKSB7XG4gICAgLy8gUmVtb3ZlIHJhbmdlIGZyb20gcGVyc2lzdGVudCBjYWNoZS5cbiAgICB0aGlzLl90aW5vZGUuX2RiLnJlbU1lc3NhZ2VzKHRoaXMubmFtZSwgZnJvbUlkLCB1bnRpbElkKTtcbiAgICAvLyBzdGFydCwgZW5kOiBmaW5kIGluc2VydGlvbiBwb2ludHMgKG5lYXJlc3QgPT0gdHJ1ZSkuXG4gICAgY29uc3Qgc2luY2UgPSB0aGlzLl9tZXNzYWdlcy5maW5kKHtcbiAgICAgIHNlcTogZnJvbUlkXG4gICAgfSwgdHJ1ZSk7XG4gICAgcmV0dXJuIHNpbmNlID49IDAgPyB0aGlzLl9tZXNzYWdlcy5kZWxSYW5nZShzaW5jZSwgdGhpcy5fbWVzc2FnZXMuZmluZCh7XG4gICAgICBzZXE6IHVudGlsSWRcbiAgICB9LCB0cnVlKSkgOiBbXTtcbiAgfVxuICAvKipcbiAgICogQXR0ZW1wdCB0byBzdG9wIG1lc3NhZ2UgZnJvbSBiZWluZyBzZW50LlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2VxSWQgaWQgb2YgdGhlIG1lc3NhZ2UgdG8gc3RvcCBzZW5kaW5nIGFuZCByZW1vdmUgZnJvbSBjYWNoZS5cbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IDxjb2RlPnRydWU8L2NvZGU+IGlmIG1lc3NhZ2Ugd2FzIGNhbmNlbGxlZCwgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIGNhbmNlbFNlbmQoc2VxSWQpIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLl9tZXNzYWdlcy5maW5kKHtcbiAgICAgIHNlcTogc2VxSWRcbiAgICB9KTtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGNvbnN0IG1zZyA9IHRoaXMuX21lc3NhZ2VzLmdldEF0KGlkeCk7XG4gICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLm1zZ1N0YXR1cyhtc2cpO1xuICAgICAgaWYgKHN0YXR1cyA9PSBDb25zdC5NRVNTQUdFX1NUQVRVU19RVUVVRUQgfHwgc3RhdHVzID09IENvbnN0Lk1FU1NBR0VfU1RBVFVTX0ZBSUxFRCkge1xuICAgICAgICB0aGlzLl90aW5vZGUuX2RiLnJlbU1lc3NhZ2VzKHRoaXMubmFtZSwgc2VxSWQpO1xuICAgICAgICBtc2cuX2NhbmNlbGxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX21lc3NhZ2VzLmRlbEF0KGlkeCk7XG4gICAgICAgIGlmICh0aGlzLm9uRGF0YSkge1xuICAgICAgICAgIC8vIENhbGxpbmcgd2l0aCBubyBwYXJhbWV0ZXJzIHRvIGluZGljYXRlIHRoZSBtZXNzYWdlIHdhcyBkZWxldGVkLlxuICAgICAgICAgIHRoaXMub25EYXRhKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvKipcbiAgICogR2V0IHR5cGUgb2YgdGhlIHRvcGljOiBtZSwgcDJwLCBncnAsIGZuZC4uLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBPbmUgb2YgJ21lJywgJ3AycCcsICdncnAnLCAnZm5kJywgJ3N5cycgb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPi5cbiAgICovXG4gIGdldFR5cGUoKSB7XG4gICAgcmV0dXJuIFRvcGljLnRvcGljVHlwZSh0aGlzLm5hbWUpO1xuICB9XG4gIC8qKlxuICAgKiBHZXQgY3VycmVudCB1c2VyJ3MgYWNjZXNzIG1vZGUgb2YgdGhlIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7VGlub2RlLkFjY2Vzc01vZGV9IC0gdXNlcidzIGFjY2VzcyBtb2RlXG4gICAqL1xuICBnZXRBY2Nlc3NNb2RlKCkge1xuICAgIHJldHVybiB0aGlzLmFjcztcbiAgfVxuICAvKipcbiAgICogU2V0IGN1cnJlbnQgdXNlcidzIGFjY2VzcyBtb2RlIG9mIHRoZSB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHBhcmFtIHtBY2Nlc3NNb2RlIHwgT2JqZWN0fSBhY3MgLSBhY2Nlc3MgbW9kZSB0byBzZXQuXG4gICAqL1xuICBzZXRBY2Nlc3NNb2RlKGFjcykge1xuICAgIHJldHVybiB0aGlzLmFjcyA9IG5ldyBBY2Nlc3NNb2RlKGFjcyk7XG4gIH1cbiAgLyoqXG4gICAqIEdldCB0b3BpYydzIGRlZmF1bHQgYWNjZXNzIG1vZGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuRGVmQWNzfSAtIGFjY2VzcyBtb2RlLCBzdWNoIGFzIHthdXRoOiBgUldQYCwgYW5vbjogYE5gfS5cbiAgICovXG4gIGdldERlZmF1bHRBY2Nlc3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGVmYWNzO1xuICB9XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIG5ldyBtZXRhIHtAbGluayBUaW5vZGUuR2V0UXVlcnl9IGJ1aWxkZXIuIFRoZSBxdWVyeSBpcyBhdHRjaGVkIHRvIHRoZSBjdXJyZW50IHRvcGljLlxuICAgKiBJdCB3aWxsIG5vdCB3b3JrIGNvcnJlY3RseSBpZiB1c2VkIHdpdGggYSBkaWZmZXJlbnQgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuTWV0YUdldEJ1aWxkZXJ9IHF1ZXJ5IGF0dGFjaGVkIHRvIHRoZSBjdXJyZW50IHRvcGljLlxuICAgKi9cbiAgc3RhcnRNZXRhUXVlcnkoKSB7XG4gICAgcmV0dXJuIG5ldyBNZXRhR2V0QnVpbGRlcih0aGlzKTtcbiAgfVxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYXJjaGl2ZWQsIGkuZS4gcHJpdmF0ZS5hcmNoID09IHRydWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIDxjb2RlPnRydWU8L2NvZGU+IGlmIHRvcGljIGlzIGFyY2hpdmVkLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNBcmNoaXZlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5wcml2YXRlICYmICEhdGhpcy5wcml2YXRlLmFyY2g7XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRvcGljIGlzIGEgJ21lJyB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdG9waWMgaXMgYSAnbWUnIHRvcGljLCA8Y29kZT5mYWxzZTwvY29kZT4gb3RoZXJ3aXNlLlxuICAgKi9cbiAgaXNNZVR5cGUoKSB7XG4gICAgcmV0dXJuIFRvcGljLmlzTWVUb3BpY05hbWUodGhpcy5uYW1lKTtcbiAgfVxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYSBjaGFubmVsLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0b3BpYyBpcyBhIGNoYW5uZWwsIDxjb2RlPmZhbHNlPC9jb2RlPiBvdGhlcndpc2UuXG4gICAqL1xuICBpc0NoYW5uZWxUeXBlKCkge1xuICAgIHJldHVybiBUb3BpYy5pc0NoYW5uZWxUb3BpY05hbWUodGhpcy5uYW1lKTtcbiAgfVxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYSBncm91cCB0b3BpYy5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpYyNcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gPGNvZGU+dHJ1ZTwvY29kZT4gaWYgdG9waWMgaXMgYSBncm91cCwgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIGlzR3JvdXBUeXBlKCkge1xuICAgIHJldHVybiBUb3BpYy5pc0dyb3VwVG9waWNOYW1lKHRoaXMubmFtZSk7XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRvcGljIGlzIGEgcDJwIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0b3BpYyBpcyBhIHAycCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIGlzUDJQVHlwZSgpIHtcbiAgICByZXR1cm4gVG9waWMuaXNQMlBUb3BpY05hbWUodGhpcy5uYW1lKTtcbiAgfVxuICAvKipcbiAgICogQ2hlY2sgaWYgdG9waWMgaXMgYSBjb21tdW5pY2F0aW9uIHRvcGljLCBpLmUuIGEgZ3JvdXAgb3IgcDJwIHRvcGljLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljI1xuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSA8Y29kZT50cnVlPC9jb2RlPiBpZiB0b3BpYyBpcyBhIHAycCBvciBncm91cCB0b3BpYywgPGNvZGU+ZmFsc2U8L2NvZGU+IG90aGVyd2lzZS5cbiAgICovXG4gIGlzQ29tbVR5cGUoKSB7XG4gICAgcmV0dXJuIFRvcGljLmlzQ29tbVRvcGljTmFtZSh0aGlzLm5hbWUpO1xuICB9XG4gIC8qKlxuICAgKiBHZXQgc3RhdHVzIChxdWV1ZWQsIHNlbnQsIHJlY2VpdmVkIGV0Yykgb2YgYSBnaXZlbiBtZXNzYWdlIGluIHRoZSBjb250ZXh0XG4gICAqIG9mIHRoaXMgdG9waWMuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWMjXG4gICAqXG4gICAqIEBwYXJhbSB7TWVzc2FnZX0gbXNnIC0gbWVzc2FnZSB0byBjaGVjayBmb3Igc3RhdHVzLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHVwZCAtIHVwZGF0ZSBjaGFjaGVkIG1lc3NhZ2Ugc3RhdHVzLlxuICAgKlxuICAgKiBAcmV0dXJucyBtZXNzYWdlIHN0YXR1cyBjb25zdGFudC5cbiAgICovXG4gIG1zZ1N0YXR1cyhtc2csIHVwZCkge1xuICAgIGxldCBzdGF0dXMgPSBDb25zdC5NRVNTQUdFX1NUQVRVU19OT05FO1xuICAgIGlmICh0aGlzLl90aW5vZGUuaXNNZShtc2cuZnJvbSkpIHtcbiAgICAgIGlmIChtc2cuX3NlbmRpbmcpIHtcbiAgICAgICAgc3RhdHVzID0gQ29uc3QuTUVTU0FHRV9TVEFUVVNfU0VORElORztcbiAgICAgIH0gZWxzZSBpZiAobXNnLl9mYWlsZWQgfHwgbXNnLl9jYW5jZWxsZWQpIHtcbiAgICAgICAgc3RhdHVzID0gQ29uc3QuTUVTU0FHRV9TVEFUVVNfRkFJTEVEO1xuICAgICAgfSBlbHNlIGlmIChtc2cuc2VxID49IENvbnN0LkxPQ0FMX1NFUUlEKSB7XG4gICAgICAgIHN0YXR1cyA9IENvbnN0Lk1FU1NBR0VfU1RBVFVTX1FVRVVFRDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tc2dSZWFkQ291bnQobXNnLnNlcSkgPiAwKSB7XG4gICAgICAgIHN0YXR1cyA9IENvbnN0Lk1FU1NBR0VfU1RBVFVTX1JFQUQ7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubXNnUmVjdkNvdW50KG1zZy5zZXEpID4gMCkge1xuICAgICAgICBzdGF0dXMgPSBDb25zdC5NRVNTQUdFX1NUQVRVU19SRUNFSVZFRDtcbiAgICAgIH0gZWxzZSBpZiAobXNnLnNlcSA+IDApIHtcbiAgICAgICAgc3RhdHVzID0gQ29uc3QuTUVTU0FHRV9TVEFUVVNfU0VOVDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG1zZy5fc3RhdHVzID09IENvbnN0Lk1FU1NBR0VfU1RBVFVTX0RFTF9SQU5HRSkge1xuICAgICAgc3RhdHVzID09IENvbnN0Lk1FU1NBR0VfU1RBVFVTX0RFTF9SQU5HRTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdHVzID0gQ29uc3QuTUVTU0FHRV9TVEFUVVNfVE9fTUU7XG4gICAgfVxuXG4gICAgaWYgKHVwZCAmJiBtc2cuX3N0YXR1cyAhPSBzdGF0dXMpIHtcbiAgICAgIG1zZy5fc3RhdHVzID0gc3RhdHVzO1xuICAgICAgdGhpcy5fdGlub2RlLl9kYi51cGRNZXNzYWdlU3RhdHVzKHRoaXMubmFtZSwgbXNnLnNlcSwgc3RhdHVzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdHVzO1xuICB9XG4gIC8vIFByb2Nlc3MgZGF0YSBtZXNzYWdlXG4gIF9yb3V0ZURhdGEoZGF0YSkge1xuICAgIGlmIChkYXRhLmNvbnRlbnQpIHtcbiAgICAgIGlmICghdGhpcy50b3VjaGVkIHx8IHRoaXMudG91Y2hlZCA8IGRhdGEudHMpIHtcbiAgICAgICAgdGhpcy50b3VjaGVkID0gZGF0YS50cztcbiAgICAgICAgdGhpcy5fdGlub2RlLl9kYi51cGRUb3BpYyh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZGF0YS5zZXEgPiB0aGlzLl9tYXhTZXEpIHtcbiAgICAgIHRoaXMuX21heFNlcSA9IGRhdGEuc2VxO1xuICAgIH1cbiAgICBpZiAoZGF0YS5zZXEgPCB0aGlzLl9taW5TZXEgfHwgdGhpcy5fbWluU2VxID09IDApIHtcbiAgICAgIHRoaXMuX21pblNlcSA9IGRhdGEuc2VxO1xuICAgIH1cblxuICAgIGlmICghZGF0YS5fbm9Gb3J3YXJkaW5nKSB7XG4gICAgICB0aGlzLl9tZXNzYWdlcy5wdXQoZGF0YSk7XG4gICAgICB0aGlzLl90aW5vZGUuX2RiLmFkZE1lc3NhZ2UoZGF0YSk7XG4gICAgICB0aGlzLl91cGRhdGVEZWxldGVkUmFuZ2VzKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICB0aGlzLm9uRGF0YShkYXRhKTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgbG9jYWxseSBjYWNoZWQgY29udGFjdCB3aXRoIHRoZSBuZXcgbWVzc2FnZSBjb3VudC5cbiAgICBjb25zdCB3aGF0ID0gKCghdGhpcy5pc0NoYW5uZWxUeXBlKCkgJiYgIWRhdGEuZnJvbSkgfHwgdGhpcy5fdGlub2RlLmlzTWUoZGF0YS5mcm9tKSkgPyAncmVhZCcgOiAnbXNnJztcbiAgICB0aGlzLl91cGRhdGVSZWFkUmVjdih3aGF0LCBkYXRhLnNlcSwgZGF0YS50cyk7XG4gICAgLy8gTm90aWZ5ICdtZScgbGlzdGVuZXJzIG9mIHRoZSBjaGFuZ2UuXG4gICAgdGhpcy5fdGlub2RlLmdldE1lVG9waWMoKS5fcmVmcmVzaENvbnRhY3Qod2hhdCwgdGhpcyk7XG4gIH1cbiAgLy8gUHJvY2VzcyBtZXRhZGF0YSBtZXNzYWdlXG4gIF9yb3V0ZU1ldGEobWV0YSkge1xuICAgIGlmIChtZXRhLmRlc2MpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhRGVzYyhtZXRhLmRlc2MpO1xuICAgIH1cbiAgICBpZiAobWV0YS5zdWIgJiYgbWV0YS5zdWIubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5fcHJvY2Vzc01ldGFTdWIobWV0YS5zdWIpO1xuICAgIH1cbiAgICBpZiAobWV0YS5kZWwpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NEZWxNZXNzYWdlcyhtZXRhLmRlbC5jbGVhciwgbWV0YS5kZWwuZGVsc2VxKTtcbiAgICB9XG4gICAgaWYgKG1ldGEudGFncykge1xuICAgICAgdGhpcy5fcHJvY2Vzc01ldGFUYWdzKG1ldGEudGFncyk7XG4gICAgfVxuICAgIGlmIChtZXRhLmNyZWQpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhQ3JlZHMobWV0YS5jcmVkKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub25NZXRhKSB7XG4gICAgICB0aGlzLm9uTWV0YShtZXRhKTtcbiAgICB9XG4gIH1cbiAgLy8gUHJvY2VzcyBwcmVzZW5jZSBjaGFuZ2UgbWVzc2FnZVxuICBfcm91dGVQcmVzKHByZXMpIHtcbiAgICBsZXQgdXNlciwgdWlkO1xuICAgIHN3aXRjaCAocHJlcy53aGF0KSB7XG4gICAgICBjYXNlICdkZWwnOlxuICAgICAgICAvLyBEZWxldGUgY2FjaGVkIG1lc3NhZ2VzLlxuICAgICAgICB0aGlzLl9wcm9jZXNzRGVsTWVzc2FnZXMocHJlcy5jbGVhciwgcHJlcy5kZWxzZXEpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ29uJzpcbiAgICAgIGNhc2UgJ29mZic6XG4gICAgICAgIC8vIFVwZGF0ZSBvbmxpbmUgc3RhdHVzIG9mIGEgc3Vic2NyaXB0aW9uLlxuICAgICAgICB1c2VyID0gdGhpcy5fdXNlcnNbcHJlcy5zcmNdO1xuICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgIHVzZXIub25saW5lID0gcHJlcy53aGF0ID09ICdvbic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fdGlub2RlLmxvZ2dlcihcIldBUk5JTkc6IFByZXNlbmNlIHVwZGF0ZSBmb3IgYW4gdW5rbm93biB1c2VyXCIsIHRoaXMubmFtZSwgcHJlcy5zcmMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndGVybSc6XG4gICAgICAgIC8vIEF0dGFjaG1lbnQgdG8gdG9waWMgaXMgdGVybWluYXRlZCBwcm9iYWJseSBkdWUgdG8gY2x1c3RlciByZWhhc2hpbmcuXG4gICAgICAgIHRoaXMuX3Jlc2V0U3ViKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndXBkJzpcbiAgICAgICAgLy8gQSB0b3BpYyBzdWJzY3JpYmVyIGhhcyB1cGRhdGVkIGhpcyBkZXNjcmlwdGlvbi5cbiAgICAgICAgLy8gSXNzdWUge2dldCBzdWJ9IG9ubHkgaWYgdGhlIGN1cnJlbnQgdXNlciBoYXMgbm8gcDJwIHRvcGljcyB3aXRoIHRoZSB1cGRhdGVkIHVzZXIgKHAycCBuYW1lIGlzIG5vdCBpbiBjYWNoZSkuXG4gICAgICAgIC8vIE90aGVyd2lzZSAnbWUnIHdpbGwgaXNzdWUgYSB7Z2V0IGRlc2N9IHJlcXVlc3QuXG4gICAgICAgIGlmIChwcmVzLnNyYyAmJiAhdGhpcy5fdGlub2RlLmlzVG9waWNDYWNoZWQocHJlcy5zcmMpKSB7XG4gICAgICAgICAgdGhpcy5nZXRNZXRhKHRoaXMuc3RhcnRNZXRhUXVlcnkoKS53aXRoTGF0ZXJPbmVTdWIocHJlcy5zcmMpLmJ1aWxkKCkpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYWNzJzpcbiAgICAgICAgdWlkID0gcHJlcy5zcmMgfHwgdGhpcy5fdGlub2RlLmdldEN1cnJlbnRVc2VySUQoKTtcbiAgICAgICAgdXNlciA9IHRoaXMuX3VzZXJzW3VpZF07XG4gICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgIC8vIFVwZGF0ZSBmb3IgYW4gdW5rbm93biB1c2VyOiBub3RpZmljYXRpb24gb2YgYSBuZXcgc3Vic2NyaXB0aW9uLlxuICAgICAgICAgIGNvbnN0IGFjcyA9IG5ldyBBY2Nlc3NNb2RlKCkudXBkYXRlQWxsKHByZXMuZGFjcyk7XG4gICAgICAgICAgaWYgKGFjcyAmJiBhY3MubW9kZSAhPSBBY2Nlc3NNb2RlLl9OT05FKSB7XG4gICAgICAgICAgICB1c2VyID0gdGhpcy5fY2FjaGVHZXRVc2VyKHVpZCk7XG4gICAgICAgICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgICAgICAgdXNlciA9IHtcbiAgICAgICAgICAgICAgICB1c2VyOiB1aWQsXG4gICAgICAgICAgICAgICAgYWNzOiBhY3NcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgdGhpcy5nZXRNZXRhKHRoaXMuc3RhcnRNZXRhUXVlcnkoKS53aXRoT25lU3ViKHVuZGVmaW5lZCwgdWlkKS5idWlsZCgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHVzZXIuYWNzID0gYWNzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXNlci51cGRhdGVkID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhU3ViKFt1c2VyXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEtub3duIHVzZXJcbiAgICAgICAgICB1c2VyLmFjcy51cGRhdGVBbGwocHJlcy5kYWNzKTtcbiAgICAgICAgICAvLyBVcGRhdGUgdXNlcidzIGFjY2VzcyBtb2RlLlxuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNZXRhU3ViKFt7XG4gICAgICAgICAgICB1c2VyOiB1aWQsXG4gICAgICAgICAgICB1cGRhdGVkOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgYWNzOiB1c2VyLmFjc1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5sb2dnZXIoXCJJTkZPOiBJZ25vcmVkIHByZXNlbmNlIHVwZGF0ZVwiLCBwcmVzLndoYXQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9uUHJlcykge1xuICAgICAgdGhpcy5vblByZXMocHJlcyk7XG4gICAgfVxuICB9XG4gIC8vIFByb2Nlc3Mge2luZm99IG1lc3NhZ2VcbiAgX3JvdXRlSW5mbyhpbmZvKSB7XG4gICAgaWYgKGluZm8ud2hhdCAhPT0gJ2twJykge1xuICAgICAgY29uc3QgdXNlciA9IHRoaXMuX3VzZXJzW2luZm8uZnJvbV07XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICB1c2VyW2luZm8ud2hhdF0gPSBpbmZvLnNlcTtcbiAgICAgICAgaWYgKHVzZXIucmVjdiA8IHVzZXIucmVhZCkge1xuICAgICAgICAgIHVzZXIucmVjdiA9IHVzZXIucmVhZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgbXNnID0gdGhpcy5sYXRlc3RNZXNzYWdlKCk7XG4gICAgICBpZiAobXNnKSB7XG4gICAgICAgIHRoaXMubXNnU3RhdHVzKG1zZywgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoaXMgaXMgYW4gdXBkYXRlIGZyb20gdGhlIGN1cnJlbnQgdXNlciwgdXBkYXRlIHRoZSBjYWNoZSB3aXRoIHRoZSBuZXcgY291bnQuXG4gICAgICBpZiAodGhpcy5fdGlub2RlLmlzTWUoaW5mby5mcm9tKSkge1xuICAgICAgICB0aGlzLl91cGRhdGVSZWFkUmVjdihpbmZvLndoYXQsIGluZm8uc2VxKTtcbiAgICAgIH1cblxuICAgICAgLy8gTm90aWZ5ICdtZScgbGlzdGVuZXIgb2YgdGhlIHN0YXR1cyBjaGFuZ2UuXG4gICAgICB0aGlzLl90aW5vZGUuZ2V0TWVUb3BpYygpLl9yZWZyZXNoQ29udGFjdChpbmZvLndoYXQsIHRoaXMpO1xuICAgIH1cbiAgICBpZiAodGhpcy5vbkluZm8pIHtcbiAgICAgIHRoaXMub25JbmZvKGluZm8pO1xuICAgIH1cbiAgfVxuICAvLyBDYWxsZWQgYnkgVGlub2RlIHdoZW4gbWV0YS5kZXNjIHBhY2tldCBpcyByZWNlaXZlZC5cbiAgLy8gQ2FsbGVkIGJ5ICdtZScgdG9waWMgb24gY29udGFjdCB1cGRhdGUgKGRlc2MuX25vRm9yd2FyZGluZyBpcyB0cnVlKS5cbiAgX3Byb2Nlc3NNZXRhRGVzYyhkZXNjKSB7XG4gICAgaWYgKHRoaXMuaXNQMlBUeXBlKCkpIHtcbiAgICAgIC8vIFN5bnRoZXRpYyBkZXNjIG1heSBpbmNsdWRlIGRlZmFjcyBmb3IgcDJwIHRvcGljcyB3aGljaCBpcyB1c2VsZXNzLlxuICAgICAgLy8gUmVtb3ZlIGl0LlxuICAgICAgZGVsZXRlIGRlc2MuZGVmYWNzO1xuXG4gICAgICAvLyBVcGRhdGUgdG8gcDJwIGRlc2MgaXMgdGhlIHNhbWUgYXMgdXNlciB1cGRhdGUuIFVwZGF0ZSBjYWNoZWQgdXNlci5cbiAgICAgIHRoaXMuX3Rpbm9kZS5fZGIudXBkVXNlcih0aGlzLm5hbWUsIGRlc2MucHVibGljKTtcbiAgICB9XG5cbiAgICAvLyBDb3B5IHBhcmFtZXRlcnMgZnJvbSBkZXNjIG9iamVjdCB0byB0aGlzIHRvcGljLlxuICAgIG1lcmdlT2JqKHRoaXMsIGRlc2MpO1xuICAgIC8vIFVwZGF0ZSBwZXJzaXN0ZW50IGNhY2hlLlxuICAgIHRoaXMuX3Rpbm9kZS5fZGIudXBkVG9waWModGhpcyk7XG5cbiAgICAvLyBOb3RpZnkgJ21lJyBsaXN0ZW5lciwgaWYgYXZhaWxhYmxlOlxuICAgIGlmICh0aGlzLm5hbWUgIT09IENvbnN0LlRPUElDX01FICYmICFkZXNjLl9ub0ZvcndhcmRpbmcpIHtcbiAgICAgIGNvbnN0IG1lID0gdGhpcy5fdGlub2RlLmdldE1lVG9waWMoKTtcbiAgICAgIGlmIChtZS5vbk1ldGFTdWIpIHtcbiAgICAgICAgbWUub25NZXRhU3ViKHRoaXMpO1xuICAgICAgfVxuICAgICAgaWYgKG1lLm9uU3Vic1VwZGF0ZWQpIHtcbiAgICAgICAgbWUub25TdWJzVXBkYXRlZChbdGhpcy5uYW1lXSwgMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub25NZXRhRGVzYykge1xuICAgICAgdGhpcy5vbk1ldGFEZXNjKHRoaXMpO1xuICAgIH1cbiAgfVxuICAvLyBDYWxsZWQgYnkgVGlub2RlIHdoZW4gbWV0YS5zdWIgaXMgcmVjaXZlZCBvciBpbiByZXNwb25zZSB0byByZWNlaXZlZFxuICAvLyB7Y3RybH0gYWZ0ZXIgc2V0TWV0YS1zdWIuXG4gIF9wcm9jZXNzTWV0YVN1YihzdWJzKSB7XG4gICAgZm9yIChsZXQgaWR4IGluIHN1YnMpIHtcbiAgICAgIGNvbnN0IHN1YiA9IHN1YnNbaWR4XTtcblxuICAgICAgLy8gRmlsbCBkZWZhdWx0cy5cbiAgICAgIHN1Yi5vbmxpbmUgPSAhIXN1Yi5vbmxpbmU7XG4gICAgICAvLyBVcGRhdGUgdGltZXN0YW1wIG9mIHRoZSBtb3N0IHJlY2VudCBzdWJzY3JpcHRpb24gdXBkYXRlLlxuICAgICAgdGhpcy5fbGFzdFN1YnNVcGRhdGUgPSBuZXcgRGF0ZShNYXRoLm1heCh0aGlzLl9sYXN0U3Vic1VwZGF0ZSwgc3ViLnVwZGF0ZWQpKTtcblxuICAgICAgbGV0IHVzZXIgPSBudWxsO1xuICAgICAgaWYgKCFzdWIuZGVsZXRlZCkge1xuICAgICAgICAvLyBJZiB0aGlzIGlzIGEgY2hhbmdlIHRvIHVzZXIncyBvd24gcGVybWlzc2lvbnMsIHVwZGF0ZSB0aGVtIGluIHRvcGljIHRvby5cbiAgICAgICAgLy8gRGVzYyB3aWxsIHVwZGF0ZSAnbWUnIHRvcGljLlxuICAgICAgICBpZiAodGhpcy5fdGlub2RlLmlzTWUoc3ViLnVzZXIpICYmIHN1Yi5hY3MpIHtcbiAgICAgICAgICB0aGlzLl9wcm9jZXNzTWV0YURlc2Moe1xuICAgICAgICAgICAgdXBkYXRlZDogc3ViLnVwZGF0ZWQsXG4gICAgICAgICAgICB0b3VjaGVkOiBzdWIudG91Y2hlZCxcbiAgICAgICAgICAgIGFjczogc3ViLmFjc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHVzZXIgPSB0aGlzLl91cGRhdGVDYWNoZWRVc2VyKHN1Yi51c2VyLCBzdWIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3Vic2NyaXB0aW9uIGlzIGRlbGV0ZWQsIHJlbW92ZSBpdCBmcm9tIHRvcGljIChidXQgbGVhdmUgaW4gVXNlcnMgY2FjaGUpXG4gICAgICAgIGRlbGV0ZSB0aGlzLl91c2Vyc1tzdWIudXNlcl07XG4gICAgICAgIHVzZXIgPSBzdWI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9uTWV0YVN1Yikge1xuICAgICAgICB0aGlzLm9uTWV0YVN1Yih1c2VyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5vblN1YnNVcGRhdGVkKSB7XG4gICAgICB0aGlzLm9uU3Vic1VwZGF0ZWQoT2JqZWN0LmtleXModGhpcy5fdXNlcnMpKTtcbiAgICB9XG4gIH1cbiAgLy8gQ2FsbGVkIGJ5IFRpbm9kZSB3aGVuIG1ldGEudGFncyBpcyByZWNpdmVkLlxuICBfcHJvY2Vzc01ldGFUYWdzKHRhZ3MpIHtcbiAgICBpZiAodGFncy5sZW5ndGggPT0gMSAmJiB0YWdzWzBdID09IENvbnN0LkRFTF9DSEFSKSB7XG4gICAgICB0YWdzID0gW107XG4gICAgfVxuICAgIHRoaXMuX3RhZ3MgPSB0YWdzO1xuICAgIGlmICh0aGlzLm9uVGFnc1VwZGF0ZWQpIHtcbiAgICAgIHRoaXMub25UYWdzVXBkYXRlZCh0YWdzKTtcbiAgICB9XG4gIH1cbiAgLy8gRG8gbm90aGluZyBmb3IgdG9waWNzIG90aGVyIHRoYW4gJ21lJ1xuICBfcHJvY2Vzc01ldGFDcmVkcyhjcmVkcykge31cbiAgLy8gRGVsZXRlIGNhY2hlZCBtZXNzYWdlcyBhbmQgdXBkYXRlIGNhY2hlZCB0cmFuc2FjdGlvbiBJRHNcbiAgX3Byb2Nlc3NEZWxNZXNzYWdlcyhjbGVhciwgZGVsc2VxKSB7XG4gICAgdGhpcy5fbWF4RGVsID0gTWF0aC5tYXgoY2xlYXIsIHRoaXMuX21heERlbCk7XG4gICAgdGhpcy5jbGVhciA9IE1hdGgubWF4KGNsZWFyLCB0aGlzLmNsZWFyKTtcbiAgICBjb25zdCB0b3BpYyA9IHRoaXM7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShkZWxzZXEpKSB7XG4gICAgICBkZWxzZXEuZm9yRWFjaChmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICBpZiAoIXJhbmdlLmhpKSB7XG4gICAgICAgICAgY291bnQrKztcbiAgICAgICAgICB0b3BpYy5mbHVzaE1lc3NhZ2UocmFuZ2UubG93KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gcmFuZ2UubG93OyBpIDwgcmFuZ2UuaGk7IGkrKykge1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIHRvcGljLmZsdXNoTWVzc2FnZShpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgIHRoaXMuX3VwZGF0ZURlbGV0ZWRSYW5nZXMoKTtcblxuICAgICAgaWYgKHRoaXMub25EYXRhKSB7XG4gICAgICAgIHRoaXMub25EYXRhKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIFRvcGljIGlzIGluZm9ybWVkIHRoYXQgdGhlIGVudGlyZSByZXNwb25zZSB0byB7Z2V0IHdoYXQ9ZGF0YX0gaGFzIGJlZW4gcmVjZWl2ZWQuXG4gIF9hbGxNZXNzYWdlc1JlY2VpdmVkKGNvdW50KSB7XG4gICAgdGhpcy5fdXBkYXRlRGVsZXRlZFJhbmdlcygpO1xuXG4gICAgaWYgKHRoaXMub25BbGxNZXNzYWdlc1JlY2VpdmVkKSB7XG4gICAgICB0aGlzLm9uQWxsTWVzc2FnZXNSZWNlaXZlZChjb3VudCk7XG4gICAgfVxuICB9XG4gIC8vIFJlc2V0IHN1YnNjcmliZWQgc3RhdGVcbiAgX3Jlc2V0U3ViKCkge1xuICAgIHRoaXMuX2F0dGFjaGVkID0gZmFsc2U7XG4gIH1cbiAgLy8gVGhpcyB0b3BpYyBpcyBlaXRoZXIgZGVsZXRlZCBvciB1bnN1YnNjcmliZWQgZnJvbS5cbiAgX2dvbmUoKSB7XG4gICAgdGhpcy5fbWVzc2FnZXMucmVzZXQoKTtcbiAgICB0aGlzLl90aW5vZGUuX2RiLnJlbU1lc3NhZ2VzKHRoaXMubmFtZSk7XG4gICAgdGhpcy5fdXNlcnMgPSB7fTtcbiAgICB0aGlzLmFjcyA9IG5ldyBBY2Nlc3NNb2RlKG51bGwpO1xuICAgIHRoaXMucHJpdmF0ZSA9IG51bGw7XG4gICAgdGhpcy5wdWJsaWMgPSBudWxsO1xuICAgIHRoaXMudHJ1c3RlZCA9IG51bGw7XG4gICAgdGhpcy5fbWF4U2VxID0gMDtcbiAgICB0aGlzLl9taW5TZXEgPSAwO1xuICAgIHRoaXMuX2F0dGFjaGVkID0gZmFsc2U7XG5cbiAgICBjb25zdCBtZSA9IHRoaXMuX3Rpbm9kZS5nZXRNZVRvcGljKCk7XG4gICAgaWYgKG1lKSB7XG4gICAgICBtZS5fcm91dGVQcmVzKHtcbiAgICAgICAgX25vRm9yd2FyZGluZzogdHJ1ZSxcbiAgICAgICAgd2hhdDogJ2dvbmUnLFxuICAgICAgICB0b3BpYzogQ29uc3QuVE9QSUNfTUUsXG4gICAgICAgIHNyYzogdGhpcy5uYW1lXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHRoaXMub25EZWxldGVUb3BpYykge1xuICAgICAgdGhpcy5vbkRlbGV0ZVRvcGljKCk7XG4gICAgfVxuICB9XG4gIC8vIFVwZGF0ZSBnbG9iYWwgdXNlciBjYWNoZSBhbmQgbG9jYWwgc3Vic2NyaWJlcnMgY2FjaGUuXG4gIC8vIERvbid0IGNhbGwgdGhpcyBtZXRob2QgZm9yIG5vbi1zdWJzY3JpYmVycy5cbiAgX3VwZGF0ZUNhY2hlZFVzZXIodWlkLCBvYmopIHtcbiAgICAvLyBGZXRjaCB1c2VyIG9iamVjdCBmcm9tIHRoZSBnbG9iYWwgY2FjaGUuXG4gICAgLy8gVGhpcyBpcyBhIGNsb25lIG9mIHRoZSBzdG9yZWQgb2JqZWN0XG4gICAgbGV0IGNhY2hlZCA9IHRoaXMuX2NhY2hlR2V0VXNlcih1aWQpO1xuICAgIGNhY2hlZCA9IG1lcmdlT2JqKGNhY2hlZCB8fCB7fSwgb2JqKTtcbiAgICAvLyBTYXZlIHRvIGdsb2JhbCBjYWNoZVxuICAgIHRoaXMuX2NhY2hlUHV0VXNlcih1aWQsIGNhY2hlZCk7XG4gICAgLy8gU2F2ZSB0byB0aGUgbGlzdCBvZiB0b3BpYyBzdWJzcmliZXJzLlxuICAgIHJldHVybiBtZXJnZVRvQ2FjaGUodGhpcy5fdXNlcnMsIHVpZCwgY2FjaGVkKTtcbiAgfVxuICAvLyBHZXQgbG9jYWwgc2VxSWQgZm9yIGEgcXVldWVkIG1lc3NhZ2UuXG4gIF9nZXRRdWV1ZWRTZXFJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcXVldWVkU2VxSWQrKztcbiAgfVxuICAvLyBDYWxjdWxhdGUgcmFuZ2VzIG9mIG1pc3NpbmcgbWVzc2FnZXMuXG4gIF91cGRhdGVEZWxldGVkUmFuZ2VzKCkge1xuICAgIGNvbnN0IHJhbmdlcyA9IFtdO1xuXG4gICAgLy8gR2FwIG1hcmtlciwgcG9zc2libHkgZW1wdHkuXG4gICAgbGV0IHByZXYgPSBudWxsO1xuXG4gICAgLy8gQ2hlY2sgZm9yIGdhcCBpbiB0aGUgYmVnaW5uaW5nLCBiZWZvcmUgdGhlIGZpcnN0IG1lc3NhZ2UuXG4gICAgY29uc3QgZmlyc3QgPSB0aGlzLl9tZXNzYWdlcy5nZXRBdCgwKTtcbiAgICBpZiAoZmlyc3QgJiYgdGhpcy5fbWluU2VxID4gMSAmJiAhdGhpcy5fbm9FYXJsaWVyTXNncykge1xuICAgICAgLy8gU29tZSBtZXNzYWdlcyBhcmUgbWlzc2luZyBpbiB0aGUgYmVnaW5uaW5nLlxuICAgICAgaWYgKGZpcnN0LmhpKSB7XG4gICAgICAgIC8vIFRoZSBmaXJzdCBtZXNzYWdlIGFscmVhZHkgcmVwcmVzZW50cyBhIGdhcC5cbiAgICAgICAgaWYgKGZpcnN0LnNlcSA+IDEpIHtcbiAgICAgICAgICBmaXJzdC5zZXEgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaXJzdC5oaSA8IHRoaXMuX21pblNlcSAtIDEpIHtcbiAgICAgICAgICBmaXJzdC5oaSA9IHRoaXMuX21pblNlcSAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgcHJldiA9IGZpcnN0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ3JlYXRlIG5ldyBnYXAuXG4gICAgICAgIHByZXYgPSB7XG4gICAgICAgICAgc2VxOiAxLFxuICAgICAgICAgIGhpOiB0aGlzLl9taW5TZXEgLSAxXG4gICAgICAgIH07XG4gICAgICAgIHJhbmdlcy5wdXNoKHByZXYpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBObyBnYXAgaW4gdGhlIGJlZ2lubmluZy5cbiAgICAgIHByZXYgPSB7XG4gICAgICAgIHNlcTogMCxcbiAgICAgICAgaGk6IDBcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRmluZCBuZXcgZ2FwcyBpbiB0aGUgbGlzdCBvZiByZWNlaXZlZCBtZXNzYWdlcy4gVGhlIGxpc3QgY29udGFpbnMgbWVzc2FnZXMtcHJvcGVyIGFzIHdlbGxcbiAgICAvLyBhcyBwbGFjZWhvbGRlcnMgZm9yIGRlbGV0ZWQgcmFuZ2VzLlxuICAgIC8vIFRoZSBtZXNzYWdlcyBhcmUgaXRlcmF0ZWQgYnkgc2VxIElEIGluIGFzY2VuZGluZyBvcmRlci5cbiAgICB0aGlzLl9tZXNzYWdlcy5maWx0ZXIoKGRhdGEpID0+IHtcbiAgICAgIC8vIERvIG5vdCBjcmVhdGUgYSBnYXAgYmV0d2VlbiB0aGUgbGFzdCBzZW50IG1lc3NhZ2UgYW5kIHRoZSBmaXJzdCB1bnNlbnQgYXMgd2VsbCBhcyBiZXR3ZWVuIHVuc2VudCBtZXNzYWdlcy5cbiAgICAgIGlmIChkYXRhLnNlcSA+PSBDb25zdC5MT0NBTF9TRVFJRCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgZm9yIGEgZ2FwIGJldHdlZW4gdGhlIHByZXZpb3VzIG1lc3NhZ2UvbWFya2VyIGFuZCB0aGlzIG1lc3NhZ2UvbWFya2VyLlxuICAgICAgaWYgKGRhdGEuc2VxID09IChwcmV2LmhpIHx8IHByZXYuc2VxKSArIDEpIHtcbiAgICAgICAgLy8gTm8gZ2FwIGJldHdlZW4gdGhpcyBtZXNzYWdlIGFuZCB0aGUgcHJldmlvdXMuXG4gICAgICAgIGlmIChkYXRhLmhpICYmIHByZXYuaGkpIHtcbiAgICAgICAgICAvLyBUd28gZ2FwIG1hcmtlcnMgaW4gYSByb3cuIEV4dGVuZCB0aGUgcHJldmlvdXMgb25lLCBkaXNjYXJkIHRoZSBjdXJyZW50LlxuICAgICAgICAgIHByZXYuaGkgPSBkYXRhLmhpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBwcmV2ID0gZGF0YTtcblxuICAgICAgICAvLyBLZWVwIGN1cnJlbnQuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3VuZCBhIG5ldyBnYXAuXG4gICAgICAvLyBDaGVjayBpZiB0aGUgcHJldmlvdXMgaXMgYWxzbyBhIGdhcCBtYXJrZXIuXG4gICAgICBpZiAocHJldi5oaSkge1xuICAgICAgICAvLyBBbHRlciBpdCBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IG9uZS5cbiAgICAgICAgcHJldi5oaSA9IGRhdGEuaGkgfHwgZGF0YS5zZXE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBQcmV2aW91cyBpcyBub3QgYSBnYXAgbWFya2VyLiBDcmVhdGUgYSBuZXcgb25lLlxuICAgICAgICBwcmV2ID0ge1xuICAgICAgICAgIHNlcTogcHJldi5zZXEgKyAxLFxuICAgICAgICAgIGhpOiBkYXRhLmhpIHx8IGRhdGEuc2VxXG4gICAgICAgIH07XG4gICAgICAgIHJhbmdlcy5wdXNoKHByZXYpO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBtYXJrZXIsIHJlbW92ZTsga2VlcCBpZiByZWd1bGFyIG1lc3NhZ2UuXG4gICAgICBpZiAoIWRhdGEuaGkpIHtcbiAgICAgICAgLy8gS2VlcGluZyB0aGUgY3VycmVudCByZWd1bGFyIG1lc3NhZ2UsIHNhdmUgaXQgYXMgcHJldmlvdXMuXG4gICAgICAgIHByZXYgPSBkYXRhO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRGlzY2FyZCB0aGUgY3VycmVudCBnYXAgbWFya2VyOiB3ZSBlaXRoZXIgY3JlYXRlZCBhbiBlYXJsaWVyIGdhcCwgb3IgZXh0ZW5kZWQgdGhlIHByZXZvdXMgb25lLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgLy8gQ2hlY2sgZm9yIG1pc3NpbmcgbWVzc2FnZXMgYXQgdGhlIGVuZC5cbiAgICAvLyBBbGwgbWVzc2FnZXMgY291bGQgYmUgbWlzc2luZyBvciBpdCBjb3VsZCBiZSBhIG5ldyB0b3BpYyB3aXRoIG5vIG1lc3NhZ2VzLlxuICAgIGNvbnN0IGxhc3QgPSB0aGlzLl9tZXNzYWdlcy5nZXRMYXN0KCk7XG4gICAgY29uc3QgbWF4U2VxID0gTWF0aC5tYXgodGhpcy5zZXEsIHRoaXMuX21heFNlcSkgfHwgMDtcbiAgICBpZiAoKG1heFNlcSA+IDAgJiYgIWxhc3QpIHx8IChsYXN0ICYmICgobGFzdC5oaSB8fCBsYXN0LnNlcSkgPCBtYXhTZXEpKSkge1xuICAgICAgaWYgKGxhc3QgJiYgbGFzdC5oaSkge1xuICAgICAgICAvLyBFeHRlbmQgZXhpc3RpbmcgZ2FwXG4gICAgICAgIGxhc3QuaGkgPSBtYXhTZXE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDcmVhdGUgbmV3IGdhcC5cbiAgICAgICAgcmFuZ2VzLnB1c2goe1xuICAgICAgICAgIHNlcTogbGFzdCA/IGxhc3Quc2VxICsgMSA6IDEsXG4gICAgICAgICAgaGk6IG1heFNlcVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbnNlcnQgbmV3IGdhcHMgaW50byBjYWNoZS5cbiAgICByYW5nZXMuZm9yRWFjaCgoZ2FwKSA9PiB7XG4gICAgICBnYXAuX3N0YXR1cyA9IENvbnN0Lk1FU1NBR0VfU1RBVFVTX0RFTF9SQU5HRTtcbiAgICAgIHRoaXMuX21lc3NhZ2VzLnB1dChnYXApO1xuICAgIH0pO1xuICB9XG4gIC8vIExvYWQgbW9zdCByZWNlbnQgbWVzc2FnZXMgZnJvbSBwZXJzaXN0ZW50IGNhY2hlLlxuICBfbG9hZE1lc3NhZ2VzKGRiLCBwYXJhbXMpIHtcbiAgICBjb25zdCB7XG4gICAgICBzaW5jZSxcbiAgICAgIGJlZm9yZSxcbiAgICAgIGxpbWl0XG4gICAgfSA9IHBhcmFtcyB8fCB7fTtcbiAgICByZXR1cm4gZGIucmVhZE1lc3NhZ2VzKHRoaXMubmFtZSwge1xuICAgICAgICBzaW5jZTogc2luY2UsXG4gICAgICAgIGJlZm9yZTogYmVmb3JlLFxuICAgICAgICBsaW1pdDogbGltaXQgfHwgQ29uc3QuREVGQVVMVF9NRVNTQUdFU19QQUdFXG4gICAgICB9KVxuICAgICAgLnRoZW4oKG1zZ3MpID0+IHtcbiAgICAgICAgbXNncy5mb3JFYWNoKChkYXRhKSA9PiB7XG4gICAgICAgICAgaWYgKGRhdGEuc2VxID4gdGhpcy5fbWF4U2VxKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXhTZXEgPSBkYXRhLnNlcTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGRhdGEuc2VxIDwgdGhpcy5fbWluU2VxIHx8IHRoaXMuX21pblNlcSA9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9taW5TZXEgPSBkYXRhLnNlcTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fbWVzc2FnZXMucHV0KGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKG1zZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMuX3VwZGF0ZURlbGV0ZWRSYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbXNncy5sZW5ndGg7XG4gICAgICB9KTtcbiAgfVxuICAvLyBQdXNoIG9yIHtwcmVzfTogbWVzc2FnZSByZWNlaXZlZC5cbiAgX3VwZGF0ZVJlY2VpdmVkKHNlcSwgYWN0KSB7XG4gICAgdGhpcy50b3VjaGVkID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLnNlcSA9IHNlcSB8IDA7XG4gICAgLy8gQ2hlY2sgaWYgbWVzc2FnZSBpcyBzZW50IGJ5IHRoZSBjdXJyZW50IHVzZXIuIElmIHNvIGl0J3MgYmVlbiByZWFkIGFscmVhZHkuXG4gICAgaWYgKCFhY3QgfHwgdGhpcy5fdGlub2RlLmlzTWUoYWN0KSkge1xuICAgICAgdGhpcy5yZWFkID0gdGhpcy5yZWFkID8gTWF0aC5tYXgodGhpcy5yZWFkLCB0aGlzLnNlcSkgOiB0aGlzLnNlcTtcbiAgICAgIHRoaXMucmVjdiA9IHRoaXMucmVjdiA/IE1hdGgubWF4KHRoaXMucmVhZCwgdGhpcy5yZWN2KSA6IHRoaXMucmVhZDtcbiAgICB9XG4gICAgdGhpcy51bnJlYWQgPSB0aGlzLnNlcSAtICh0aGlzLnJlYWQgfCAwKTtcbiAgICB0aGlzLl90aW5vZGUuX2RiLnVwZFRvcGljKHRoaXMpO1xuICB9XG59XG5cblxuLyoqXG4gKiBAY2xhc3MgVG9waWNNZSAtIHNwZWNpYWwgY2FzZSBvZiB7QGxpbmsgVGlub2RlLlRvcGljfSBmb3JcbiAqIG1hbmFnaW5nIGRhdGEgb2YgdGhlIGN1cnJlbnQgdXNlciwgaW5jbHVkaW5nIGNvbnRhY3QgbGlzdC5cbiAqIEBleHRlbmRzIFRpbm9kZS5Ub3BpY1xuICogQG1lbWJlcm9mIFRpbm9kZVxuICpcbiAqIEBwYXJhbSB7VG9waWNNZS5DYWxsYmFja3N9IGNhbGxiYWNrcyAtIENhbGxiYWNrcyB0byByZWNlaXZlIHZhcmlvdXMgZXZlbnRzLlxuICovXG4vKipcbiAqIEBjbGFzcyBUb3BpY01lIC0gc3BlY2lhbCBjYXNlIG9mIHtAbGluayBUaW5vZGUuVG9waWN9IGZvclxuICogbWFuYWdpbmcgZGF0YSBvZiB0aGUgY3VycmVudCB1c2VyLCBpbmNsdWRpbmcgY29udGFjdCBsaXN0LlxuICogQGV4dGVuZHMgVGlub2RlLlRvcGljXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtUb3BpY01lLkNhbGxiYWNrc30gY2FsbGJhY2tzIC0gQ2FsbGJhY2tzIHRvIHJlY2VpdmUgdmFyaW91cyBldmVudHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBUb3BpY01lIGV4dGVuZHMgVG9waWMge1xuICBvbkNvbnRhY3RVcGRhdGU7XG5cbiAgY29uc3RydWN0b3IoY2FsbGJhY2tzKSB7XG4gICAgc3VwZXIoQ29uc3QuVE9QSUNfTUUsIGNhbGxiYWNrcyk7XG5cbiAgICAvLyBtZS1zcGVjaWZpYyBjYWxsYmFja3NcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICB0aGlzLm9uQ29udGFjdFVwZGF0ZSA9IGNhbGxiYWNrcy5vbkNvbnRhY3RVcGRhdGU7XG4gICAgfVxuICB9XG5cbiAgLy8gT3ZlcnJpZGUgdGhlIG9yaWdpbmFsIFRvcGljLl9wcm9jZXNzTWV0YURlc2MuXG4gIF9wcm9jZXNzTWV0YURlc2MoZGVzYykge1xuICAgIC8vIENoZWNrIGlmIG9ubGluZSBjb250YWN0cyBuZWVkIHRvIGJlIHR1cm5lZCBvZmYgYmVjYXVzZSBQIHBlcm1pc3Npb24gd2FzIHJlbW92ZWQuXG4gICAgY29uc3QgdHVybk9mZiA9IChkZXNjLmFjcyAmJiAhZGVzYy5hY3MuaXNQcmVzZW5jZXIoKSkgJiYgKHRoaXMuYWNzICYmIHRoaXMuYWNzLmlzUHJlc2VuY2VyKCkpO1xuXG4gICAgLy8gQ29weSBwYXJhbWV0ZXJzIGZyb20gZGVzYyBvYmplY3QgdG8gdGhpcyB0b3BpYy5cbiAgICBtZXJnZU9iaih0aGlzLCBkZXNjKTtcbiAgICB0aGlzLl90aW5vZGUuX2RiLnVwZFRvcGljKHRoaXMpO1xuICAgIC8vIFVwZGF0ZSBjdXJyZW50IHVzZXIncyByZWNvcmQgaW4gdGhlIGdsb2JhbCBjYWNoZS5cbiAgICB0aGlzLl91cGRhdGVDYWNoZWRVc2VyKHRoaXMuX3Rpbm9kZS5fbXlVSUQsIGRlc2MpO1xuXG4gICAgLy8gJ1AnIHBlcm1pc3Npb24gd2FzIHJlbW92ZWQuIEFsbCB0b3BpY3MgYXJlIG9mZmxpbmUgbm93LlxuICAgIGlmICh0dXJuT2ZmKSB7XG4gICAgICB0aGlzLl90aW5vZGUubWFwVG9waWNzKChjb250KSA9PiB7XG4gICAgICAgIGlmIChjb250Lm9ubGluZSkge1xuICAgICAgICAgIGNvbnQub25saW5lID0gZmFsc2U7XG4gICAgICAgICAgY29udC5zZWVuID0gT2JqZWN0LmFzc2lnbihjb250LnNlZW4gfHwge30sIHtcbiAgICAgICAgICAgIHdoZW46IG5ldyBEYXRlKClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLl9yZWZyZXNoQ29udGFjdCgnb2ZmJywgY29udCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9uTWV0YURlc2MpIHtcbiAgICAgIHRoaXMub25NZXRhRGVzYyh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvLyBPdmVycmlkZSB0aGUgb3JpZ2luYWwgVG9waWMuX3Byb2Nlc3NNZXRhU3ViXG4gIF9wcm9jZXNzTWV0YVN1YihzdWJzKSB7XG4gICAgbGV0IHVwZGF0ZUNvdW50ID0gMDtcbiAgICBzdWJzLmZvckVhY2goKHN1YikgPT4ge1xuICAgICAgY29uc3QgdG9waWNOYW1lID0gc3ViLnRvcGljO1xuICAgICAgLy8gRG9uJ3Qgc2hvdyAnbWUnIGFuZCAnZm5kJyB0b3BpY3MgaW4gdGhlIGxpc3Qgb2YgY29udGFjdHMuXG4gICAgICBpZiAodG9waWNOYW1lID09IENvbnN0LlRPUElDX0ZORCB8fCB0b3BpY05hbWUgPT0gQ29uc3QuVE9QSUNfTUUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc3ViLm9ubGluZSA9ICEhc3ViLm9ubGluZTtcblxuICAgICAgbGV0IGNvbnQgPSBudWxsO1xuICAgICAgaWYgKHN1Yi5kZWxldGVkKSB7XG4gICAgICAgIGNvbnQgPSBzdWI7XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5jYWNoZVJlbVRvcGljKHRvcGljTmFtZSk7XG4gICAgICAgIHRoaXMuX3Rpbm9kZS5fZGIucmVtVG9waWModG9waWNOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEVuc3VyZSB0aGUgdmFsdWVzIGFyZSBkZWZpbmVkIGFuZCBhcmUgaW50ZWdlcnMuXG4gICAgICAgIGlmICh0eXBlb2Ygc3ViLnNlcSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHN1Yi5zZXEgPSBzdWIuc2VxIHwgMDtcbiAgICAgICAgICBzdWIucmVjdiA9IHN1Yi5yZWN2IHwgMDtcbiAgICAgICAgICBzdWIucmVhZCA9IHN1Yi5yZWFkIHwgMDtcbiAgICAgICAgICBzdWIudW5yZWFkID0gc3ViLnNlcSAtIHN1Yi5yZWFkO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udCA9IG1lcmdlT2JqKHRoaXMuX3Rpbm9kZS5nZXRUb3BpYyh0b3BpY05hbWUpLCBzdWIpO1xuICAgICAgICB0aGlzLl90aW5vZGUuX2RiLnVwZFRvcGljKGNvbnQpO1xuXG4gICAgICAgIGlmIChUb3BpYy5pc1AyUFRvcGljTmFtZSh0b3BpY05hbWUpKSB7XG4gICAgICAgICAgdGhpcy5fY2FjaGVQdXRVc2VyKHRvcGljTmFtZSwgY29udCk7XG4gICAgICAgICAgdGhpcy5fdGlub2RlLl9kYi51cGRVc2VyKHRvcGljTmFtZSwgY29udC5wdWJsaWMpO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdGlmeSB0b3BpYyBvZiB0aGUgdXBkYXRlIGlmIGl0J3MgYW4gZXh0ZXJuYWwgdXBkYXRlLlxuICAgICAgICBpZiAoIXN1Yi5fbm9Gb3J3YXJkaW5nKSB7XG4gICAgICAgICAgY29uc3QgdG9waWMgPSB0aGlzLl90aW5vZGUuZ2V0VG9waWModG9waWNOYW1lKTtcbiAgICAgICAgICBpZiAodG9waWMpIHtcbiAgICAgICAgICAgIHN1Yi5fbm9Gb3J3YXJkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRvcGljLl9wcm9jZXNzTWV0YURlc2Moc3ViKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdXBkYXRlQ291bnQrKztcblxuICAgICAgaWYgKHRoaXMub25NZXRhU3ViKSB7XG4gICAgICAgIHRoaXMub25NZXRhU3ViKGNvbnQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub25TdWJzVXBkYXRlZCAmJiB1cGRhdGVDb3VudCA+IDApIHtcbiAgICAgIGNvbnN0IGtleXMgPSBbXTtcbiAgICAgIHN1YnMuZm9yRWFjaCgocykgPT4ge1xuICAgICAgICBrZXlzLnB1c2gocy50b3BpYyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMub25TdWJzVXBkYXRlZChrZXlzLCB1cGRhdGVDb3VudCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsbGVkIGJ5IFRpbm9kZSB3aGVuIG1ldGEuc3ViIGlzIHJlY2l2ZWQuXG4gIF9wcm9jZXNzTWV0YUNyZWRzKGNyZWRzLCB1cGQpIHtcbiAgICBpZiAoY3JlZHMubGVuZ3RoID09IDEgJiYgY3JlZHNbMF0gPT0gQ29uc3QuREVMX0NIQVIpIHtcbiAgICAgIGNyZWRzID0gW107XG4gICAgfVxuICAgIGlmICh1cGQpIHtcbiAgICAgIGNyZWRzLmZvckVhY2goKGNyKSA9PiB7XG4gICAgICAgIGlmIChjci52YWwpIHtcbiAgICAgICAgICAvLyBBZGRpbmcgYSBjcmVkZW50aWFsLlxuICAgICAgICAgIGxldCBpZHggPSB0aGlzLl9jcmVkZW50aWFscy5maW5kSW5kZXgoKGVsKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZWwubWV0aCA9PSBjci5tZXRoICYmIGVsLnZhbCA9PSBjci52YWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKGlkeCA8IDApIHtcbiAgICAgICAgICAgIC8vIE5vdCBmb3VuZC5cbiAgICAgICAgICAgIGlmICghY3IuZG9uZSkge1xuICAgICAgICAgICAgICAvLyBVbmNvbmZpcm1lZCBjcmVkZW50aWFsIHJlcGxhY2VzIHByZXZpb3VzIHVuY29uZmlybWVkIGNyZWRlbnRpYWwgb2YgdGhlIHNhbWUgbWV0aG9kLlxuICAgICAgICAgICAgICBpZHggPSB0aGlzLl9jcmVkZW50aWFscy5maW5kSW5kZXgoKGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm1ldGggPT0gY3IubWV0aCAmJiAhZWwuZG9uZTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBwcmV2aW91cyB1bmNvbmZpcm1lZCBjcmVkZW50aWFsLlxuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWRlbnRpYWxzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9jcmVkZW50aWFscy5wdXNoKGNyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRm91bmQuIE1heWJlIGNoYW5nZSAnZG9uZScgc3RhdHVzLlxuICAgICAgICAgICAgdGhpcy5fY3JlZGVudGlhbHNbaWR4XS5kb25lID0gY3IuZG9uZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY3IucmVzcCkge1xuICAgICAgICAgIC8vIEhhbmRsZSBjcmVkZW50aWFsIGNvbmZpcm1hdGlvbi5cbiAgICAgICAgICBjb25zdCBpZHggPSB0aGlzLl9jcmVkZW50aWFscy5maW5kSW5kZXgoKGVsKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZWwubWV0aCA9PSBjci5tZXRoICYmICFlbC5kb25lO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgICAgdGhpcy5fY3JlZGVudGlhbHNbaWR4XS5kb25lID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9jcmVkZW50aWFscyA9IGNyZWRzO1xuICAgIH1cbiAgICBpZiAodGhpcy5vbkNyZWRzVXBkYXRlZCkge1xuICAgICAgdGhpcy5vbkNyZWRzVXBkYXRlZCh0aGlzLl9jcmVkZW50aWFscyk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHJvY2VzcyBwcmVzZW5jZSBjaGFuZ2UgbWVzc2FnZVxuICBfcm91dGVQcmVzKHByZXMpIHtcbiAgICBpZiAocHJlcy53aGF0ID09ICd0ZXJtJykge1xuICAgICAgLy8gVGhlICdtZScgdG9waWMgaXRzZWxmIGlzIGRldGFjaGVkLiBNYXJrIGFzIHVuc3Vic2NyaWJlZC5cbiAgICAgIHRoaXMuX3Jlc2V0U3ViKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHByZXMud2hhdCA9PSAndXBkJyAmJiBwcmVzLnNyYyA9PSBDb25zdC5UT1BJQ19NRSkge1xuICAgICAgLy8gVXBkYXRlIHRvIG1lJ3MgZGVzY3JpcHRpb24uIFJlcXVlc3QgdXBkYXRlZCB2YWx1ZS5cbiAgICAgIHRoaXMuZ2V0TWV0YSh0aGlzLnN0YXJ0TWV0YVF1ZXJ5KCkud2l0aERlc2MoKS5idWlsZCgpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ID0gdGhpcy5fdGlub2RlLmNhY2hlR2V0VG9waWMocHJlcy5zcmMpO1xuICAgIGlmIChjb250KSB7XG4gICAgICBzd2l0Y2ggKHByZXMud2hhdCkge1xuICAgICAgICBjYXNlICdvbic6IC8vIHRvcGljIGNhbWUgb25saW5lXG4gICAgICAgICAgY29udC5vbmxpbmUgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdvZmYnOiAvLyB0b3BpYyB3ZW50IG9mZmxpbmVcbiAgICAgICAgICBpZiAoY29udC5vbmxpbmUpIHtcbiAgICAgICAgICAgIGNvbnQub25saW5lID0gZmFsc2U7XG4gICAgICAgICAgICBjb250LnNlZW4gPSBPYmplY3QuYXNzaWduKGNvbnQuc2VlbiB8fCB7fSwge1xuICAgICAgICAgICAgICB3aGVuOiBuZXcgRGF0ZSgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21zZyc6IC8vIG5ldyBtZXNzYWdlIHJlY2VpdmVkXG4gICAgICAgICAgY29udC5fdXBkYXRlUmVjZWl2ZWQocHJlcy5zZXEsIHByZXMuYWN0KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndXBkJzogLy8gZGVzYyB1cGRhdGVkXG4gICAgICAgICAgLy8gUmVxdWVzdCB1cGRhdGVkIHN1YnNjcmlwdGlvbi5cbiAgICAgICAgICB0aGlzLmdldE1ldGEodGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhMYXRlck9uZVN1YihwcmVzLnNyYykuYnVpbGQoKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Fjcyc6IC8vIGFjY2VzcyBtb2RlIGNoYW5nZWRcbiAgICAgICAgICBpZiAoY29udC5hY3MpIHtcbiAgICAgICAgICAgIGNvbnQuYWNzLnVwZGF0ZUFsbChwcmVzLmRhY3MpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250LmFjcyA9IG5ldyBBY2Nlc3NNb2RlKCkudXBkYXRlQWxsKHByZXMuZGFjcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnQudG91Y2hlZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3VhJzpcbiAgICAgICAgICAvLyB1c2VyIGFnZW50IGNoYW5nZWQuXG4gICAgICAgICAgY29udC5zZWVuID0ge1xuICAgICAgICAgICAgd2hlbjogbmV3IERhdGUoKSxcbiAgICAgICAgICAgIHVhOiBwcmVzLnVhXG4gICAgICAgICAgfTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmVjdic6XG4gICAgICAgICAgLy8gdXNlcidzIG90aGVyIHNlc3Npb24gbWFya2VkIHNvbWUgbWVzc2dlcyBhcyByZWNlaXZlZC5cbiAgICAgICAgICBwcmVzLnNlcSA9IHByZXMuc2VxIHwgMDtcbiAgICAgICAgICBjb250LnJlY3YgPSBjb250LnJlY3YgPyBNYXRoLm1heChjb250LnJlY3YsIHByZXMuc2VxKSA6IHByZXMuc2VxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyZWFkJzpcbiAgICAgICAgICAvLyB1c2VyJ3Mgb3RoZXIgc2Vzc2lvbiBtYXJrZWQgc29tZSBtZXNzYWdlcyBhcyByZWFkLlxuICAgICAgICAgIHByZXMuc2VxID0gcHJlcy5zZXEgfCAwO1xuICAgICAgICAgIGNvbnQucmVhZCA9IGNvbnQucmVhZCA/IE1hdGgubWF4KGNvbnQucmVhZCwgcHJlcy5zZXEpIDogcHJlcy5zZXE7XG4gICAgICAgICAgY29udC5yZWN2ID0gY29udC5yZWN2ID8gTWF0aC5tYXgoY29udC5yZWFkLCBjb250LnJlY3YpIDogY29udC5yZWN2O1xuICAgICAgICAgIGNvbnQudW5yZWFkID0gY29udC5zZXEgLSBjb250LnJlYWQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2dvbmUnOlxuICAgICAgICAgIC8vIHRvcGljIGRlbGV0ZWQgb3IgdW5zdWJzY3JpYmVkIGZyb20uXG4gICAgICAgICAgaWYgKCFjb250Ll9kZWxldGVkKSB7XG4gICAgICAgICAgICBjb250Ll9kZWxldGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnQuX2F0dGFjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl90aW5vZGUuX2RiLm1hcmtUb3BpY0FzRGVsZXRlZChwcmVzLnNyYywgdHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkZWwnOlxuICAgICAgICAgIC8vIFVwZGF0ZSB0b3BpYy5kZWwgdmFsdWUuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhpcy5fdGlub2RlLmxvZ2dlcihcIklORk86IFVuc3VwcG9ydGVkIHByZXNlbmNlIHVwZGF0ZSBpbiAnbWUnXCIsIHByZXMud2hhdCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3JlZnJlc2hDb250YWN0KHByZXMud2hhdCwgY29udCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChwcmVzLndoYXQgPT0gJ2FjcycpIHtcbiAgICAgICAgLy8gTmV3IHN1YnNjcmlwdGlvbnMgYW5kIGRlbGV0ZWQvYmFubmVkIHN1YnNjcmlwdGlvbnMgaGF2ZSBmdWxsXG4gICAgICAgIC8vIGFjY2VzcyBtb2RlIChubyArIG9yIC0gaW4gdGhlIGRhY3Mgc3RyaW5nKS4gQ2hhbmdlcyB0byBrbm93biBzdWJzY3JpcHRpb25zIGFyZSBzZW50IGFzXG4gICAgICAgIC8vIGRlbHRhcywgYnV0IHRoZXkgc2hvdWxkIG5vdCBoYXBwZW4gaGVyZS5cbiAgICAgICAgY29uc3QgYWNzID0gbmV3IEFjY2Vzc01vZGUocHJlcy5kYWNzKTtcbiAgICAgICAgaWYgKCFhY3MgfHwgYWNzLm1vZGUgPT0gQWNjZXNzTW9kZS5fSU5WQUxJRCkge1xuICAgICAgICAgIHRoaXMuX3Rpbm9kZS5sb2dnZXIoXCJFUlJPUjogSW52YWxpZCBhY2Nlc3MgbW9kZSB1cGRhdGVcIiwgcHJlcy5zcmMsIHByZXMuZGFjcyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKGFjcy5tb2RlID09IEFjY2Vzc01vZGUuX05PTkUpIHtcbiAgICAgICAgICB0aGlzLl90aW5vZGUubG9nZ2VyKFwiV0FSTklORzogUmVtb3Zpbmcgbm9uLWV4aXN0ZW50IHN1YnNjcmlwdGlvblwiLCBwcmVzLnNyYywgcHJlcy5kYWNzKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTmV3IHN1YnNjcmlwdGlvbi4gU2VuZCByZXF1ZXN0IGZvciB0aGUgZnVsbCBkZXNjcmlwdGlvbi5cbiAgICAgICAgICAvLyBVc2luZyAud2l0aE9uZVN1YiAobm90IC53aXRoTGF0ZXJPbmVTdWIpIHRvIG1ha2Ugc3VyZSBJZk1vZGlmaWVkU2luY2UgaXMgbm90IHNldC5cbiAgICAgICAgICB0aGlzLmdldE1ldGEodGhpcy5zdGFydE1ldGFRdWVyeSgpLndpdGhPbmVTdWIodW5kZWZpbmVkLCBwcmVzLnNyYykuYnVpbGQoKSk7XG4gICAgICAgICAgLy8gQ3JlYXRlIGEgZHVtbXkgZW50cnkgdG8gY2F0Y2ggb25saW5lIHN0YXR1cyB1cGRhdGUuXG4gICAgICAgICAgY29uc3QgZHVtbXkgPSB0aGlzLl90aW5vZGUuZ2V0VG9waWMocHJlcy5zcmMpO1xuICAgICAgICAgIGR1bW15LnRvcGljID0gcHJlcy5zcmM7XG4gICAgICAgICAgZHVtbXkub25saW5lID0gZmFsc2U7XG4gICAgICAgICAgZHVtbXkuYWNzID0gYWNzO1xuICAgICAgICAgIHRoaXMuX3Rpbm9kZS5fZGIudXBkVG9waWMoZHVtbXkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHByZXMud2hhdCA9PSAndGFncycpIHtcbiAgICAgICAgdGhpcy5nZXRNZXRhKHRoaXMuc3RhcnRNZXRhUXVlcnkoKS53aXRoVGFncygpLmJ1aWxkKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLm9uUHJlcykge1xuICAgICAgdGhpcy5vblByZXMocHJlcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29udGFjdCBpcyB1cGRhdGVkLCBleGVjdXRlIGNhbGxiYWNrcy5cbiAgX3JlZnJlc2hDb250YWN0KHdoYXQsIGNvbnQpIHtcbiAgICBpZiAodGhpcy5vbkNvbnRhY3RVcGRhdGUpIHtcbiAgICAgIHRoaXMub25Db250YWN0VXBkYXRlKHdoYXQsIGNvbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQdWJsaXNoaW5nIHRvIFRvcGljTWUgaXMgbm90IHN1cHBvcnRlZC4ge0BsaW5rIFRvcGljI3B1Ymxpc2h9IGlzIG92ZXJyaWRlbiBhbmQgdGhvd3MgYW4ge0Vycm9yfSBpZiBjYWxsZWQuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICogQHRocm93cyB7RXJyb3J9IEFsd2F5cyB0aHJvd3MgYW4gZXJyb3IuXG4gICAqL1xuICBwdWJsaXNoKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJQdWJsaXNoaW5nIHRvICdtZScgaXMgbm90IHN1cHBvcnRlZFwiKSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHZhbGlkYXRpb24gY3JlZGVudGlhbC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpY01lI1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9waWMgLSBOYW1lIG9mIHRoZSB0b3BpYyB0byBkZWxldGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXIgLSBVc2VyIElEIHRvIHJlbW92ZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hpY2ggd2lsbCBiZSByZXNvbHZlZC9yZWplY3RlZCBvbiByZWNlaXZpbmcgc2VydmVyIHJlcGx5LlxuICAgKi9cbiAgZGVsQ3JlZGVudGlhbChtZXRob2QsIHZhbHVlKSB7XG4gICAgaWYgKCF0aGlzLl9hdHRhY2hlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbm5vdCBkZWxldGUgY3JlZGVudGlhbCBpbiBpbmFjdGl2ZSAnbWUnIHRvcGljXCIpKTtcbiAgICB9XG4gICAgLy8gU2VuZCB7ZGVsfSBtZXNzYWdlLCByZXR1cm4gcHJvbWlzZVxuICAgIHJldHVybiB0aGlzLl90aW5vZGUuZGVsQ3JlZGVudGlhbChtZXRob2QsIHZhbHVlKS50aGVuKChjdHJsKSA9PiB7XG4gICAgICAvLyBSZW1vdmUgZGVsZXRlZCBjcmVkZW50aWFsIGZyb20gdGhlIGNhY2hlLlxuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9jcmVkZW50aWFscy5maW5kSW5kZXgoKGVsKSA9PiB7XG4gICAgICAgIHJldHVybiBlbC5tZXRoID09IG1ldGhvZCAmJiBlbC52YWwgPT0gdmFsdWU7XG4gICAgICB9KTtcbiAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgIHRoaXMuX2NyZWRlbnRpYWxzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG4gICAgICAvLyBOb3RpZnkgbGlzdGVuZXJzXG4gICAgICBpZiAodGhpcy5vbkNyZWRzVXBkYXRlZCkge1xuICAgICAgICB0aGlzLm9uQ3JlZHNVcGRhdGVkKHRoaXMuX2NyZWRlbnRpYWxzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjdHJsO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBjYWxsYmFjayBjb250YWN0RmlsdGVyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250YWN0IHRvIGNoZWNrIGZvciBpbmNsdXNpb24uXG4gICAqIEByZXR1cm5zIHtib29sZWFufSA8Y29kZT50cnVlPC9jb2RlPiBpZiBjb250YWN0IHNob3VsZCBiZSBwcm9jZXNzZWQsIDxjb2RlPmZhbHNlPC9jb2RlPiB0byBleGNsdWRlIGl0LlxuICAgKi9cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBjYWNoZWQgY29udGFjdHMuXG4gICAqXG4gICAqIEBmdW5jdGlvblxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljTWUjXG4gICAqIEBwYXJhbSB7VG9waWNNZS5Db250YWN0Q2FsbGJhY2t9IGNhbGxiYWNrIC0gQ2FsbGJhY2sgdG8gY2FsbCBmb3IgZWFjaCBjb250YWN0LlxuICAgKiBAcGFyYW0ge2NvbnRhY3RGaWx0ZXI9fSBmaWx0ZXIgLSBPcHRpb25hbGx5IGZpbHRlciBjb250YWN0czsgaW5jbHVkZSBhbGwgaWYgZmlsdGVyIGlzIGZhbHNlLWlzaCwgb3RoZXJ3aXNlXG4gICAqICAgICAgaW5jbHVkZSB0aG9zZSBmb3Igd2hpY2ggZmlsdGVyIHJldHVybnMgdHJ1ZS1pc2guXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gY29udGV4dCAtIENvbnRleHQgdG8gdXNlIGZvciBjYWxsaW5nIHRoZSBgY2FsbGJhY2tgLCBpLmUuIHRoZSB2YWx1ZSBvZiBgdGhpc2AgaW5zaWRlIHRoZSBjYWxsYmFjay5cbiAgICovXG4gIGNvbnRhY3RzKGNhbGxiYWNrLCBmaWx0ZXIsIGNvbnRleHQpIHtcbiAgICB0aGlzLl90aW5vZGUubWFwVG9waWNzKChjLCBpZHgpID0+IHtcbiAgICAgIGlmIChjLmlzQ29tbVR5cGUoKSAmJiAoIWZpbHRlciB8fCBmaWx0ZXIoYykpKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgYywgaWR4KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBjb250YWN0IGZyb20gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSBjb250YWN0IHRvIGdldCwgZWl0aGVyIGEgVUlEIChmb3IgcDJwIHRvcGljcykgb3IgYSB0b3BpYyBuYW1lLlxuICAgKiBAcmV0dXJucyB7VGlub2RlLkNvbnRhY3R9IC0gQ29udGFjdCBvciBgdW5kZWZpbmVkYC5cbiAgICovXG4gIGdldENvbnRhY3QobmFtZSkge1xuICAgIHJldHVybiB0aGlzLl90aW5vZGUuY2FjaGVHZXRUb3BpYyhuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWNjZXNzIG1vZGUgb2YgYSBnaXZlbiBjb250YWN0IGZyb20gY2FjaGUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSBjb250YWN0IHRvIGdldCBhY2Nlc3MgbW9kZSBmb3IsIGVpdGhlciBhIFVJRCAoZm9yIHAycCB0b3BpY3MpXG4gICAqICAgICAgICBvciBhIHRvcGljIG5hbWU7IGlmIG1pc3NpbmcsIGFjY2VzcyBtb2RlIGZvciB0aGUgJ21lJyB0b3BpYyBpdHNlbGYuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gYWNjZXNzIG1vZGUsIHN1Y2ggYXMgYFJXUGAuXG4gICAqL1xuICBnZXRBY2Nlc3NNb2RlKG5hbWUpIHtcbiAgICBpZiAobmFtZSkge1xuICAgICAgY29uc3QgY29udCA9IHRoaXMuX3Rpbm9kZS5jYWNoZUdldFRvcGljKG5hbWUpO1xuICAgICAgcmV0dXJuIGNvbnQgPyBjb250LmFjcyA6IG51bGw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFjcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBjb250YWN0IGlzIGFyY2hpdmVkLCBpLmUuIGNvbnRhY3QucHJpdmF0ZS5hcmNoID09IHRydWUuXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNNZSNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIHRoZSBjb250YWN0IHRvIGNoZWNrIGFyY2hpdmVkIHN0YXR1cywgZWl0aGVyIGEgVUlEIChmb3IgcDJwIHRvcGljcykgb3IgYSB0b3BpYyBuYW1lLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSB0cnVlIGlmIGNvbnRhY3QgaXMgYXJjaGl2ZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGlzQXJjaGl2ZWQobmFtZSkge1xuICAgIGNvbnN0IGNvbnQgPSB0aGlzLl90aW5vZGUuY2FjaGVHZXRUb3BpYyhuYW1lKTtcbiAgICByZXR1cm4gY29udCAmJiBjb250LnByaXZhdGUgJiYgISFjb250LnByaXZhdGUuYXJjaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiBUaW5vZGUuQ3JlZGVudGlhbFxuICAgKiBAbWVtYmVyb2YgVGlub2RlXG4gICAqIEB0eXBlIE9iamVjdFxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbWV0aCAtIHZhbGlkYXRpb24gbWV0aG9kIHN1Y2ggYXMgJ2VtYWlsJyBvciAndGVsJy5cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IHZhbCAtIGNyZWRlbnRpYWwgdmFsdWUsIGkuZS4gJ2pkb2VAZXhhbXBsZS5jb20nIG9yICcrMTcwMjU1NTEyMzQnXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZG9uZSAtIHRydWUgaWYgY3JlZGVudGlhbCBpcyB2YWxpZGF0ZWQuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSB1c2VyJ3MgY3JlZGVudGlhbHM6IGVtYWlsLCBwaG9uZSwgZXRjLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljTWUjXG4gICAqXG4gICAqIEByZXR1cm5zIHtUaW5vZGUuQ3JlZGVudGlhbFtdfSAtIGFycmF5IG9mIGNyZWRlbnRpYWxzLlxuICAgKi9cbiAgZ2V0Q3JlZGVudGlhbHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NyZWRlbnRpYWxzO1xuICB9XG59XG5cbi8qKlxuICogQGNsYXNzIFRvcGljRm5kIC0gc3BlY2lhbCBjYXNlIG9mIHtAbGluayBUaW5vZGUuVG9waWN9IGZvciBzZWFyY2hpbmcgZm9yXG4gKiBjb250YWN0cyBhbmQgZ3JvdXAgdG9waWNzLlxuICogQGV4dGVuZHMgVGlub2RlLlRvcGljXG4gKiBAbWVtYmVyb2YgVGlub2RlXG4gKlxuICogQHBhcmFtIHtUb3BpY0ZuZC5DYWxsYmFja3N9IGNhbGxiYWNrcyAtIENhbGxiYWNrcyB0byByZWNlaXZlIHZhcmlvdXMgZXZlbnRzLlxuICovXG5leHBvcnQgY2xhc3MgVG9waWNGbmQgZXh0ZW5kcyBUb3BpYyB7XG4gIC8vIExpc3Qgb2YgdXNlcnMgYW5kIHRvcGljcyB1aWQgb3IgdG9waWNfbmFtZSAtPiBDb250YWN0IG9iamVjdClcbiAgX2NvbnRhY3RzID0ge307XG5cbiAgY29uc3RydWN0b3IoY2FsbGJhY2tzKSB7XG4gICAgc3VwZXIoQ29uc3QuVE9QSUNfRk5ELCBjYWxsYmFja3MpO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgdGhlIG9yaWdpbmFsIFRvcGljLl9wcm9jZXNzTWV0YVN1YlxuICBfcHJvY2Vzc01ldGFTdWIoc3Vicykge1xuICAgIGxldCB1cGRhdGVDb3VudCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMuX2NvbnRhY3RzKS5sZW5ndGg7XG4gICAgLy8gUmVzZXQgY29udGFjdCBsaXN0LlxuICAgIHRoaXMuX2NvbnRhY3RzID0ge307XG4gICAgZm9yIChsZXQgaWR4IGluIHN1YnMpIHtcbiAgICAgIGxldCBzdWIgPSBzdWJzW2lkeF07XG4gICAgICBjb25zdCBpbmRleEJ5ID0gc3ViLnRvcGljID8gc3ViLnRvcGljIDogc3ViLnVzZXI7XG5cbiAgICAgIHN1YiA9IG1lcmdlVG9DYWNoZSh0aGlzLl9jb250YWN0cywgaW5kZXhCeSwgc3ViKTtcbiAgICAgIHVwZGF0ZUNvdW50Kys7XG5cbiAgICAgIGlmICh0aGlzLm9uTWV0YVN1Yikge1xuICAgICAgICB0aGlzLm9uTWV0YVN1YihzdWIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh1cGRhdGVDb3VudCA+IDAgJiYgdGhpcy5vblN1YnNVcGRhdGVkKSB7XG4gICAgICB0aGlzLm9uU3Vic1VwZGF0ZWQoT2JqZWN0LmtleXModGhpcy5fY29udGFjdHMpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUHVibGlzaGluZyB0byBUb3BpY0ZuZCBpcyBub3Qgc3VwcG9ydGVkLiB7QGxpbmsgVG9waWMjcHVibGlzaH0gaXMgb3ZlcnJpZGVuIGFuZCB0aG93cyBhbiB7RXJyb3J9IGlmIGNhbGxlZC5cbiAgICogQG1lbWJlcm9mIFRpbm9kZS5Ub3BpY0ZuZCNcbiAgICogQHRocm93cyB7RXJyb3J9IEFsd2F5cyB0aHJvd3MgYW4gZXJyb3IuXG4gICAqL1xuICBwdWJsaXNoKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJQdWJsaXNoaW5nIHRvICdmbmQnIGlzIG5vdCBzdXBwb3J0ZWRcIikpO1xuICB9XG5cbiAgLyoqXG4gICAqIHNldE1ldGEgdG8gVG9waWNGbmQgcmVzZXRzIGNvbnRhY3QgbGlzdCBpbiBhZGRpdGlvbiB0byBzZW5kaW5nIHRoZSBtZXNzYWdlLlxuICAgKiBAbWVtYmVyb2YgVGlub2RlLlRvcGljRm5kI1xuICAgKiBAcGFyYW0ge1Rpbm9kZS5TZXRQYXJhbXN9IHBhcmFtcyBwYXJhbWV0ZXJzIHRvIHVwZGF0ZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgdG8gYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgc2VydmVyIHJlc3BvbmRzIHRvIHJlcXVlc3QuXG4gICAqL1xuICBzZXRNZXRhKHBhcmFtcykge1xuICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoVG9waWNGbmQucHJvdG90eXBlKS5zZXRNZXRhLmNhbGwodGhpcywgcGFyYW1zKS50aGVuKCgpID0+IHtcbiAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLl9jb250YWN0cykubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl9jb250YWN0cyA9IHt9O1xuICAgICAgICBpZiAodGhpcy5vblN1YnNVcGRhdGVkKSB7XG4gICAgICAgICAgdGhpcy5vblN1YnNVcGRhdGVkKFtdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBmb3VuZCBjb250YWN0cy4gSWYgY2FsbGJhY2sgaXMgdW5kZWZpbmVkLCB1c2Uge0BsaW5rIHRoaXMub25NZXRhU3VifS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBtZW1iZXJvZiBUaW5vZGUuVG9waWNGbmQjXG4gICAqIEBwYXJhbSB7VG9waWNGbmQuQ29udGFjdENhbGxiYWNrfSBjYWxsYmFjayAtIENhbGxiYWNrIHRvIGNhbGwgZm9yIGVhY2ggY29udGFjdC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBDb250ZXh0IHRvIHVzZSBmb3IgY2FsbGluZyB0aGUgYGNhbGxiYWNrYCwgaS5lLiB0aGUgdmFsdWUgb2YgYHRoaXNgIGluc2lkZSB0aGUgY2FsbGJhY2suXG4gICAqL1xuICBjb250YWN0cyhjYWxsYmFjaywgY29udGV4dCkge1xuICAgIGNvbnN0IGNiID0gKGNhbGxiYWNrIHx8IHRoaXMub25NZXRhU3ViKTtcbiAgICBpZiAoY2IpIHtcbiAgICAgIGZvciAobGV0IGlkeCBpbiB0aGlzLl9jb250YWN0cykge1xuICAgICAgICBjYi5jYWxsKGNvbnRleHQsIHRoaXMuX2NvbnRhY3RzW2lkeF0sIGlkeCwgdGhpcy5fY29udGFjdHMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gKiBAZmlsZSBVdGlsaXRpZXMgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMuXG4gKlxuICogQGNvcHlyaWdodCAyMDE1LTIwMjIgVGlub2RlIExMQy5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgQWNjZXNzTW9kZSBmcm9tICcuL2FjY2Vzcy1tb2RlLmpzJztcbmltcG9ydCBERUxfQ0hBUiBmcm9tICcuL2NvbmZpZy5qcyc7XG5cbi8vIEF0dGVtcHQgdG8gY29udmVydCBkYXRlIGFuZCBBY2Nlc3NNb2RlIHN0cmluZ3MgdG8gb2JqZWN0cy5cbmV4cG9ydCBmdW5jdGlvbiBqc29uUGFyc2VIZWxwZXIoa2V5LCB2YWwpIHtcbiAgLy8gVHJ5IHRvIGNvbnZlcnQgc3RyaW5nIHRpbWVzdGFtcHMgd2l0aCBvcHRpb25hbCBtaWxsaXNlY29uZHMgdG8gRGF0ZSxcbiAgLy8gZS5nLiAyMDE1LTA5LTAyVDAxOjQ1OjQzWy4xMjNdWlxuICBpZiAodHlwZW9mIHZhbCA9PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID49IDIwICYmIHZhbC5sZW5ndGggPD0gMjQgJiYgWyd0cycsICd0b3VjaGVkJywgJ3VwZGF0ZWQnLCAnY3JlYXRlZCcsICd3aGVuJywgJ2RlbGV0ZWQnLCAnZXhwaXJlcyddLmluY2x1ZGVzKGtleSkpIHtcblxuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSh2YWwpO1xuICAgIGlmICghaXNOYU4oZGF0ZSkpIHtcbiAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChrZXkgPT09ICdhY3MnICYmIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG5ldyBBY2Nlc3NNb2RlKHZhbCk7XG4gIH1cbiAgcmV0dXJuIHZhbDtcbn1cblxuLy8gQ2hlY2tzIGlmIFVSTCBpcyBhIHJlbGF0aXZlIHVybCwgaS5lLiBoYXMgbm8gJ3NjaGVtZTovLycsIGluY2x1ZGluZyB0aGUgY2FzZSBvZiBtaXNzaW5nIHNjaGVtZSAnLy8nLlxuLy8gVGhlIHNjaGVtZSBpcyBleHBlY3RlZCB0byBiZSBSRkMtY29tcGxpYW50LCBlLmcuIFthLXpdW2EtejAtOSsuLV0qXG4vLyBleGFtcGxlLmh0bWwgLSBva1xuLy8gaHR0cHM6ZXhhbXBsZS5jb20gLSBub3Qgb2suXG4vLyBodHRwOi9leGFtcGxlLmNvbSAtIG5vdCBvay5cbi8vICcg4oayIGh0dHBzOi8vZXhhbXBsZS5jb20nIC0gbm90IG9rLiAo4oayIG1lYW5zIGNhcnJpYWdlIHJldHVybilcbmV4cG9ydCBmdW5jdGlvbiBpc1VybFJlbGF0aXZlKHVybCkge1xuICByZXR1cm4gdXJsICYmICEvXlxccyooW2Etel1bYS16MC05Ky4tXSo6fFxcL1xcLykvaW0udGVzdCh1cmwpO1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkRGF0ZShkKSB7XG4gIHJldHVybiAoZCBpbnN0YW5jZW9mIERhdGUpICYmICFpc05hTihkKSAmJiAoZC5nZXRUaW1lKCkgIT0gMCk7XG59XG5cbi8vIFJGQzMzMzkgZm9ybWF0ZXIgb2YgRGF0ZVxuZXhwb3J0IGZ1bmN0aW9uIHJmYzMzMzlEYXRlU3RyaW5nKGQpIHtcbiAgaWYgKCFpc1ZhbGlkRGF0ZShkKSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBwYWQgPSBmdW5jdGlvbih2YWwsIHNwKSB7XG4gICAgc3AgPSBzcCB8fCAyO1xuICAgIHJldHVybiAnMCcucmVwZWF0KHNwIC0gKCcnICsgdmFsKS5sZW5ndGgpICsgdmFsO1xuICB9O1xuXG4gIGNvbnN0IG1pbGxpcyA9IGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gIHJldHVybiBkLmdldFVUQ0Z1bGxZZWFyKCkgKyAnLScgKyBwYWQoZC5nZXRVVENNb250aCgpICsgMSkgKyAnLScgKyBwYWQoZC5nZXRVVENEYXRlKCkpICtcbiAgICAnVCcgKyBwYWQoZC5nZXRVVENIb3VycygpKSArICc6JyArIHBhZChkLmdldFVUQ01pbnV0ZXMoKSkgKyAnOicgKyBwYWQoZC5nZXRVVENTZWNvbmRzKCkpICtcbiAgICAobWlsbGlzID8gJy4nICsgcGFkKG1pbGxpcywgMykgOiAnJykgKyAnWic7XG59XG5cbi8vIFJlY3Vyc2l2ZWx5IG1lcmdlIHNyYydzIG93biBwcm9wZXJ0aWVzIHRvIGRzdC5cbi8vIElnbm9yZSBwcm9wZXJ0aWVzIHdoZXJlIGlnbm9yZVtwcm9wZXJ0eV0gaXMgdHJ1ZS5cbi8vIEFycmF5IGFuZCBEYXRlIG9iamVjdHMgYXJlIHNoYWxsb3ctY29waWVkLlxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlT2JqKGRzdCwgc3JjLCBpZ25vcmUpIHtcbiAgaWYgKHR5cGVvZiBzcmMgIT0gJ29iamVjdCcpIHtcbiAgICBpZiAoc3JjID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBkc3Q7XG4gICAgfVxuICAgIGlmIChzcmMgPT09IERFTF9DSEFSKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gc3JjO1xuICB9XG4gIC8vIEpTIGlzIGNyYXp5OiB0eXBlb2YgbnVsbCBpcyAnb2JqZWN0Jy5cbiAgaWYgKHNyYyA9PT0gbnVsbCkge1xuICAgIHJldHVybiBzcmM7XG4gIH1cblxuICAvLyBIYW5kbGUgRGF0ZVxuICBpZiAoc3JjIGluc3RhbmNlb2YgRGF0ZSAmJiAhaXNOYU4oc3JjKSkge1xuICAgIHJldHVybiAoIWRzdCB8fCAhKGRzdCBpbnN0YW5jZW9mIERhdGUpIHx8IGlzTmFOKGRzdCkgfHwgZHN0IDwgc3JjKSA/IHNyYyA6IGRzdDtcbiAgfVxuXG4gIC8vIEFjY2VzcyBtb2RlXG4gIGlmIChzcmMgaW5zdGFuY2VvZiBBY2Nlc3NNb2RlKSB7XG4gICAgcmV0dXJuIG5ldyBBY2Nlc3NNb2RlKHNyYyk7XG4gIH1cblxuICAvLyBIYW5kbGUgQXJyYXlcbiAgaWYgKHNyYyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgcmV0dXJuIHNyYztcbiAgfVxuXG4gIGlmICghZHN0IHx8IGRzdCA9PT0gREVMX0NIQVIpIHtcbiAgICBkc3QgPSBzcmMuY29uc3RydWN0b3IoKTtcbiAgfVxuXG4gIGZvciAobGV0IHByb3AgaW4gc3JjKSB7XG4gICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShwcm9wKSAmJiAoIWlnbm9yZSB8fCAhaWdub3JlW3Byb3BdKSAmJiAocHJvcCAhPSAnX25vRm9yd2FyZGluZycpKSB7XG4gICAgICBkc3RbcHJvcF0gPSBtZXJnZU9iaihkc3RbcHJvcF0sIHNyY1twcm9wXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBkc3Q7XG59XG5cbi8vIFVwZGF0ZSBvYmplY3Qgc3RvcmVkIGluIGEgY2FjaGUuIFJldHVybnMgdXBkYXRlZCB2YWx1ZS5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVRvQ2FjaGUoY2FjaGUsIGtleSwgbmV3dmFsLCBpZ25vcmUpIHtcbiAgY2FjaGVba2V5XSA9IG1lcmdlT2JqKGNhY2hlW2tleV0sIG5ld3ZhbCwgaWdub3JlKTtcbiAgcmV0dXJuIGNhY2hlW2tleV07XG59XG5cbi8vIFN0cmlwcyBhbGwgdmFsdWVzIGZyb20gYW4gb2JqZWN0IG9mIHRoZXkgZXZhbHVhdGUgdG8gZmFsc2Ugb3IgaWYgdGhlaXIgbmFtZSBzdGFydHMgd2l0aCAnXycuXG4vLyBVc2VkIG9uIGFsbCBvdXRnb2luZyBvYmplY3QgYmVmb3JlIHNlcmlhbGl6YXRpb24gdG8gc3RyaW5nLlxuZXhwb3J0IGZ1bmN0aW9uIHNpbXBsaWZ5KG9iaikge1xuICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmIChrZXlbMF0gPT0gJ18nKSB7XG4gICAgICAvLyBTdHJpcCBmaWVsZHMgbGlrZSBcIm9iai5fa2V5XCIuXG4gICAgICBkZWxldGUgb2JqW2tleV07XG4gICAgfSBlbHNlIGlmICghb2JqW2tleV0pIHtcbiAgICAgIC8vIFN0cmlwIGZpZWxkcyB3aGljaCBldmFsdWF0ZSB0byBmYWxzZS5cbiAgICAgIGRlbGV0ZSBvYmpba2V5XTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqW2tleV0pICYmIG9ialtrZXldLmxlbmd0aCA9PSAwKSB7XG4gICAgICAvLyBTdHJpcCBlbXB0eSBhcnJheXMuXG4gICAgICBkZWxldGUgb2JqW2tleV07XG4gICAgfSBlbHNlIGlmICghb2JqW2tleV0pIHtcbiAgICAgIC8vIFN0cmlwIGZpZWxkcyB3aGljaCBldmFsdWF0ZSB0byBmYWxzZS5cbiAgICAgIGRlbGV0ZSBvYmpba2V5XTtcbiAgICB9IGVsc2UgaWYgKG9ialtrZXldIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgLy8gU3RyaXAgaW52YWxpZCBvciB6ZXJvIGRhdGUuXG4gICAgICBpZiAoIWlzVmFsaWREYXRlKG9ialtrZXldKSkge1xuICAgICAgICBkZWxldGUgb2JqW2tleV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqW2tleV0gPT0gJ29iamVjdCcpIHtcbiAgICAgIHNpbXBsaWZ5KG9ialtrZXldKTtcbiAgICAgIC8vIFN0cmlwIGVtcHR5IG9iamVjdHMuXG4gICAgICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqW2tleV0pLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGRlbGV0ZSBvYmpba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuXG4vLyBUcmltIHdoaXRlc3BhY2UsIHN0cmlwIGVtcHR5IGFuZCBkdXBsaWNhdGUgZWxlbWVudHMgZWxlbWVudHMuXG4vLyBJZiB0aGUgcmVzdWx0IGlzIGFuIGVtcHR5IGFycmF5LCBhZGQgYSBzaW5nbGUgZWxlbWVudCBcIlxcdTI0MjFcIiAoVW5pY29kZSBEZWwgY2hhcmFjdGVyKS5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVBcnJheShhcnIpIHtcbiAgbGV0IG91dCA9IFtdO1xuICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgLy8gVHJpbSwgdGhyb3cgYXdheSB2ZXJ5IHNob3J0IGFuZCBlbXB0eSB0YWdzLlxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gYXJyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGV0IHQgPSBhcnJbaV07XG4gICAgICBpZiAodCkge1xuICAgICAgICB0ID0gdC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKHQubGVuZ3RoID4gMSkge1xuICAgICAgICAgIG91dC5wdXNoKHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIG91dC5zb3J0KCkuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0sIHBvcywgYXJ5KSB7XG4gICAgICByZXR1cm4gIXBvcyB8fCBpdGVtICE9IGFyeVtwb3MgLSAxXTtcbiAgICB9KTtcbiAgfVxuICBpZiAob3V0Lmxlbmd0aCA9PSAwKSB7XG4gICAgLy8gQWRkIHNpbmdsZSB0YWcgd2l0aCBhIFVuaWNvZGUgRGVsIGNoYXJhY3Rlciwgb3RoZXJ3aXNlIGFuIGFtcHR5IGFycmF5XG4gICAgLy8gaXMgYW1iaWd1b3MuIFRoZSBEZWwgdGFnIHdpbGwgYmUgc3RyaXBwZWQgYnkgdGhlIHNlcnZlci5cbiAgICBvdXQucHVzaChERUxfQ0hBUik7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cbiIsIm1vZHVsZS5leHBvcnRzPXtcInZlcnNpb25cIjogXCIwLjE4LjMtYmV0YTFcIn1cbiJdfQ==
