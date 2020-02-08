# Javascript bindings for Tinode

See it used at https://web.tinode.co/ and https://sandbox.tinode.co/ ([full source](https://github.com/tinode/webapp)).

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

## Node JS compatibility

This SDK is intended to be used in a browser. To use tinode-sdk in Node JS environment (such as on a server), you have to polyfill network providers, for example with [ws](https://www.npmjs.com/package/ws) and [xmlhttprequest](https://www.npmjs.com/package/xmlhttprequest) or [xhr](https://www.npmjs.com/package/xhr).
```js
  Tinode.setNetworkProviders(require('ws'), require('xmlhttprequest'));
  this.tinode  = new Tinode(...);
```
or (before instantiating Tinode):
```js
  window.WebSocket = require('ws');
  window.XMLHttpRequest = require('xmlhttprequest');
```

Keep in mind that the SDK also references `URL.createObjectURL()` which is [not currently polyfilled](https://github.com/nodejs/node/issues/16167). It will throw an exception when the user attempts to download a file attachment. See discussion: https://github.com/tinode/tinode-js/issues/28
