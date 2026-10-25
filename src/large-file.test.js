import LargeFileHelper from './large-file.js';

class FakeXHR {
  static instances = [];

  upload = {};

  constructor() {
    this.opened = null;
    FakeXHR.instances.push(this);
  }

  open(method, url) {
    this.opened = [method, url];
  }

  setRequestHeader(_, __) {}

  send(_) {}
}

function fakeTinode(network) {
  return {
    _apiKey: 'key',
    _network: network,
    getAuthToken: _ => null,
    getNextUniqueId: _ => '1',
    logger: _ => {}
  };
}

describe('LargeFileHelper network provider', () => {
  beforeEach(() => {
    FakeXHR.instances = [];
  });

  afterEach(() => {
    LargeFileHelper.setNetworkProvider(undefined);
  });

  test('uploads with network.XMLHttpRequest of the Tinode instance', () => {
    const helper = new LargeFileHelper(fakeTinode({
      XMLHttpRequest: FakeXHR
    }), '0');
    helper.uploadWithBaseUrl('http://localhost:6060', new Blob(['hello'])).catch(_ => {});
    expect(FakeXHR.instances).toHaveLength(1);
    expect(FakeXHR.instances[0].opened).toEqual(['POST', 'http://localhost:6060/v0/file/u/']);
  });

  test('falls back to LargeFileHelper.setNetworkProvider', () => {
    LargeFileHelper.setNetworkProvider(FakeXHR);
    const helper = new LargeFileHelper(fakeTinode(null), '0');
    helper.uploadWithBaseUrl('http://localhost:6060', new Blob(['hello'])).catch(_ => {});
    expect(FakeXHR.instances).toHaveLength(1);
  });
});
