import Connection from './connection';
import {
  BACKOFF_BASE
} from './config';

class FakeWebSocket {
  static instances = [];

  OPEN = 1;
  readyState = 0;

  constructor(url) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(_) {}

  close() {
    this.readyState = 3;
  }

  open() {
    this.readyState = this.OPEN;
    this.onopen();
  }

  drop() {
    this.readyState = 3;
    this.onclose();
  }

  static latest() {
    return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
  }
}

describe('Connection.retryNow', () => {
  let conn;
  let iterations;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    FakeWebSocket.instances = [];
    conn = new Connection({
      host: 'localhost:6060',
      apiKey: 'key',
      transport: 'ws',
      network: {
        WebSocket: FakeWebSocket
      }
    }, '0', true);
    iterations = [];
    conn.onAutoreconnectIteration = (timeout, prom) => {
      iterations.push(timeout);
      if (prom) {
        prom.catch(_ => {});
      }
    };
    conn.connect();
    FakeWebSocket.latest().open();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('skips the backoff wait and restarts the delay sequence', () => {
    FakeWebSocket.latest().drop();
    conn.retryNow();
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(iterations).toEqual([BACKOFF_BASE, 0]);

    FakeWebSocket.latest().drop();
    expect(iterations).toEqual([BACKOFF_BASE, 0, BACKOFF_BASE]);

    jest.advanceTimersByTime(BACKOFF_BASE);
    expect(FakeWebSocket.instances).toHaveLength(3);
  });

  test('does nothing while connected, connecting or disconnected by the user', () => {
    conn.retryNow();
    expect(FakeWebSocket.instances).toHaveLength(1);

    FakeWebSocket.latest().drop();
    jest.advanceTimersByTime(BACKOFF_BASE);
    expect(FakeWebSocket.instances).toHaveLength(2);
    conn.retryNow();
    expect(FakeWebSocket.instances).toHaveLength(2);

    FakeWebSocket.latest().drop();
    conn.disconnect();
    conn.retryNow();
    expect(FakeWebSocket.instances).toHaveLength(2);
  });
});

class FakeXHR {
  static instances = [];

  constructor() {
    this.opened = null;
    FakeXHR.instances.push(this);
  }

  open(method, url) {
    this.opened = [method, url];
  }

  setRequestHeader(_, __) {}

  send(_) {}

  abort() {}
}

describe('Connection network providers', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    FakeXHR.instances = [];
  });

  afterEach(() => {
    Connection.setNetworkProviders(undefined, undefined);
  });

  test('uses Connection.setNetworkProviders when config.network is missing', () => {
    Connection.setNetworkProviders(FakeWebSocket, null);
    const conn = new Connection({
      host: 'localhost:6060',
      apiKey: 'key',
      transport: 'ws'
    }, '0', true);
    conn.connect().catch(_ => {});
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  test('prefers config.network over Connection.setNetworkProviders', () => {
    class OtherWebSocket extends FakeWebSocket {}
    Connection.setNetworkProviders(OtherWebSocket, null);
    const conn = new Connection({
      host: 'localhost:6060',
      apiKey: 'key',
      transport: 'ws',
      network: {
        WebSocket: FakeWebSocket
      }
    }, '0', true);
    conn.connect().catch(_ => {});
    expect(FakeWebSocket.latest()).not.toBeInstanceOf(OtherWebSocket);
  });

  test('long polling creates XMLHttpRequest from config.network', () => {
    const conn = new Connection({
      host: 'localhost:6060',
      apiKey: 'key',
      transport: 'lp',
      network: {
        XMLHttpRequest: FakeXHR
      }
    }, '0', false);
    conn.connect().catch(_ => {});
    expect(FakeXHR.instances).toHaveLength(1);
    expect(FakeXHR.instances[0].opened[0]).toBe('POST');
    expect(FakeXHR.instances[0].opened[1]).toContain('/lp');
  });
});
