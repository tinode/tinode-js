# Javascript bindings for Tinode

This SDK implements [Tinode](https://github.com/tinode/chat) client-side protocol for the browser based applications. See it in action
at https://web.tinode.co/ and https://sandbox.tinode.co/ ([full source](https://github.com/tinode/webapp)).

This is **not** a standalone project. It can only be used in conjunction with the [Tinode server](https://github.com/tinode/chat).

Regularly released NPM packages are at https://www.npmjs.com/package/tinode-sdk

You may include the latest standalone minified SDK into your html file as
```html
<script crossorigin="anonymous"
  src="https://cdn.jsdelivr.net/npm/tinode-sdk/umd/tinode.prod.js">
</script>
```
or while developing as
```html
<script crossorigin="anonymous"
  src="https://cdn.jsdelivr.net/npm/tinode-sdk/umd/tinode.dev.js">
</script>
```

## Getting support

* Read [client-side](http://tinode.github.io/js-api/) and [server-side](https://github.com/tinode/chat/blob/master/docs/API.md) API documentation.
* For support, general questions, discussions post to [https://groups.google.com/d/forum/tinode](https://groups.google.com/d/forum/tinode).
* For bugs and feature requests [open an issue](https://github.com/tinode/tinode-js/issues/new).
* Use https://tinode.co/contact for commercial inquiries.

## Helping out

* If you appreciate our work, please help spread the word! Sharing on Reddit, HN, and other communities helps more than you think.
* Consider buying paid support: https://tinode.co/support.html
* If you are a software developer, send us your pull requests with bug fixes and new features.
* If you use the SDK and discover bugs or missing features, let us know by filing bug reports and feature requests. Vote for existing [feature requests](https://github.com/tinode/chat/issues?q=is%3Aissue+is%3Aopen+sort%3Areactions-%2B1-desc+label%3A%22feature+request%22) you find most valuable.

## Node JS compatibility

This SDK is intended to be used in a browser. To use `tinode-sdk` in Node JS environment (such as on a server), you have to polyfill network providers, for example with [ws](https://www.npmjs.com/package/ws) and [xmlhttprequest](https://www.npmjs.com/package/xmlhttprequest) or [xhr](https://www.npmjs.com/package/xhr), as well as `indexedDB` with something like [fake-indexeddb](https://www.npmjs.com/package/fake-indexeddb):

```js
  Tinode.setNetworkProviders(require('ws'), require('xmlhttprequest'));
  this.tinode = new Tinode({
    ...
    storage: new IndexedDBAdapter(require('fake-indexeddb'))
  });
```

`Tinode.setDatabaseProvider(require('fake-indexeddb'))` followed by `persist: true` works too.

`URL.createObjectURL()` and related methods were added in Node v16.7.0. The SDK is unlikely to work correctly with earlier versions of Node.

## React Native

React Native has no IndexedDB, so the app passes a storage adapter. `KeyValueAdapter` works with any store that has `getItem`, `setItem`, `removeItem` and `getAllKeys`, sync or async, such as [expo-sqlite/kv-store](https://docs.expo.dev/versions/latest/sdk/sqlite/#key-value-storage) or [AsyncStorage](https://www.npmjs.com/package/@react-native-async-storage/async-storage). For [MMKV](https://www.npmjs.com/package/react-native-mmkv) wrap it with `fromMMKV`. The app also passes its network status, so the client reconnects as soon as the device is back online instead of waiting for the next backoff step:

```js
  import { Platform } from 'react-native';
  import NetInfo from '@react-native-community/netinfo';
  import Storage from 'expo-sqlite/kv-store';
  import { Tinode, KeyValueAdapter } from 'tinode-sdk';

  const tinode = new Tinode({
    appName: 'MyApp/1.0',
    host: 'api.example.com',
    apiKey: '...',
    secure: true,
    platform: Platform.OS,
    persist: true,
    storage: new KeyValueAdapter(Storage),
    netInfo: NetInfo
  });
```

With MMKV: `storage: new KeyValueAdapter(fromMMKV(new MMKV()))`.

| Option | Description |
| --- | --- |
| `persist` | Keep topics, users and messages in a local cache. Without `storage` the cache is IndexedDB. When off, the IndexedDB cache is deleted. |
| `storage` | Storage adapter for the cache: `IndexedDBAdapter`, `KeyValueAdapter`, `MemoryAdapter` or your own `Tinode.StorageAdapter`. Turns `persist` on. |
| `netInfo` | Network status source: anything with `addEventListener(listener)` that returns an unsubscribe function and calls the listener with `{ isConnected }`, such as `NetInfo` from `@react-native-community/netinfo`. |
| `platform` | `'ios'`, `'android'` or `'web'` (the default). |

In a browser the `online` and `offline` events do the same job as `NetInfo`:

```js
  const netInfo = {
    addEventListener(listener) {
      const update = _ => listener({ isConnected: navigator.onLine });
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      update();
      return _ => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
      };
    }
  };
```
