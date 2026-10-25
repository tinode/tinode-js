/**
 * @file In-memory storage adapter for the persistent cache.
 *
 * @copyright 2015-2026 Tinode LLC.
 */
'use strict';

function rangeContains(range, seq) {
  return range.hi ? seq >= range.low && seq < range.hi : seq == range.low;
}

function isNonEmptyRange(range) {
  return !range.hi || range.hi > range.low;
}

function delLogOverlaps(record, since, before) {
  return record.low < before && record.hi > since;
}

function delLogRange(record) {
  return {
    low: record.low,
    hi: record.hi
  };
}

function descendingDelLog(a, b) {
  return b.low - a.low || b.hi - a.hi;
}

function topicMap(map, topic) {
  let records = map.get(topic);
  if (!records) {
    records = new Map();
    map.set(topic, records);
  }
  return records;
}

/**
 * Storage adapter which keeps all data in memory. The data is lost when the page is closed.
 *
 * @class MemoryAdapter
 * @memberof Tinode
 * @implements {Tinode.StorageAdapter}
 */
export default class MemoryAdapter {
  #open = false;
  #topics = new Map();
  #users = new Map();
  #subscriptions = new Map();
  #messages = new Map();
  #delLog = new Map();

  async open() {
    this.#open = true;
  }

  async close() {
    this.#open = false;
  }

  async destroy() {
    this.#open = false;
    this.#topics.clear();
    this.#users.clear();
    this.#subscriptions.clear();
    this.#messages.clear();
    this.#delLog.clear();
  }

  isOpen() {
    return this.#open;
  }

  async getTopics() {
    return [...this.#topics.values()].map(record => ({
      ...record
    }));
  }

  async getTopic(name) {
    const record = this.#topics.get(name);
    return record && {
      ...record
    };
  }

  async putTopic(record) {
    this.#topics.set(record.name, {
      ...record
    });
  }

  async removeTopic(name) {
    this.#topics.delete(name);
    this.#subscriptions.delete(name);
    this.#messages.delete(name);
    this.#delLog.delete(name);
  }

  async getUsers() {
    return [...this.#users.values()].map(record => ({
      ...record
    }));
  }

  async getUser(uid) {
    const record = this.#users.get(uid);
    return record && {
      ...record
    };
  }

  async putUser(record) {
    this.#users.set(record.uid, {
      ...record
    });
  }

  async removeUser(uid) {
    this.#users.delete(uid);
  }

  async getSubscriptions(topic) {
    const records = this.#subscriptions.get(topic);
    if (!records) {
      return [];
    }
    return [...records.values()].map(record => ({
      ...record
    }));
  }

  async getSubscription(topic, uid) {
    const record = this.#subscriptions.get(topic)?.get(uid);
    return record && {
      ...record
    };
  }

  async putSubscription(record) {
    topicMap(this.#subscriptions, record.topic).set(record.uid, {
      ...record
    });
  }

  async removeSubscription(topic, uid) {
    this.#subscriptions.get(topic)?.delete(uid);
  }

  async putMessage(record) {
    topicMap(this.#messages, record.topic).set(record.seq, {
      ...record
    });
  }

  async updateMessageStatus(topic, seq, status) {
    const record = this.#messages.get(topic)?.get(seq);
    if (record) {
      record._status = status;
    }
  }

  async removeMessages(topic, low, hi) {
    const records = this.#messages.get(topic);
    if (!records) {
      return;
    }
    for (const seq of [...records.keys()]) {
      if (seq >= low && seq < hi) {
        records.delete(seq);
      }
    }
  }

  async readMessages(topic, window) {
    if (window.since >= window.before) {
      return [];
    }
    const found = this.#messageRecords(topic)
      .filter(record => record.seq >= window.since && record.seq < window.before)
      .sort((a, b) => b.seq - a.seq);
    const limited = window.limit > 0 ? found.slice(0, window.limit) : found;
    return limited.map(record => ({
      ...record
    }));
  }

  async readMessageRanges(topic, ranges) {
    const sorted = this.#messageRecords(topic).sort((a, b) => a.seq - b.seq);
    return ranges
      .filter(isNonEmptyRange)
      .flatMap(range => sorted.filter(record => rangeContains(range, record.seq)))
      .map(record => ({
        ...record
      }));
  }

  async addDelLog(records) {
    records.forEach(record => {
      topicMap(this.#delLog, record.topic).set(`${record.low}:${record.hi}`, {
        ...record
      });
    });
  }

  async readDelLog(topic, window) {
    if (window.since >= window.before) {
      return [];
    }
    const found = this.#delLogRecords(topic)
      .filter(record => delLogOverlaps(record, window.since, window.before))
      .sort(descendingDelLog);
    const result = [];
    let count = 0;
    for (const record of found) {
      result.push(delLogRange(record));
      count += record.hi - record.low;
      if (window.limit > 0 && count >= window.limit) {
        break;
      }
    }
    return result;
  }

  async readDelLogRanges(topic, ranges) {
    const records = this.#delLogRecords(topic).sort((a, b) => descendingDelLog(b, a));
    return ranges.flatMap(range => {
      const hi = range.hi || range.low + 1;
      return records
        .filter(record => delLogOverlaps(record, range.low, hi))
        .map(delLogRange);
    });
  }

  async maxDelId(topic) {
    return this.#delLogRecords(topic).reduce((max, record) => Math.max(max, record.clear), 0);
  }

  #messageRecords(topic) {
    const records = this.#messages.get(topic);
    return records ? [...records.values()] : [];
  }

  #delLogRecords(topic) {
    const records = this.#delLog.get(topic);
    return records ? [...records.values()] : [];
  }
}
