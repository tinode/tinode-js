# Javascript bindings for Tinode

See demo at http://web.tinode.co/ ([source](https://github.com/tinode/example-react-js))

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

To use tinode-sdk as a Node JS dependency, you have to polyfill network providers, for example with https://www.npmjs.com/package/ws and https://www.npmjs.com/package/xmlhttprequest (or https://www.npmjs.com/package/xhr).
```js
  Tinode.setNetworkProviders(require('ws'), require('xmlhttprequest'));
  this.tinode  = new Tinode(...);
```
or (before instantiating Tinode):
```js
  window.WebSocket = require('ws');
  window.XMLHttpRequest = require('xmlhttprequest');
```

Keep in mind that the SDK also references `URL.createObjectURL()` which is not currently polyfilled. It will throw an exception when the user attempts to download a file attachment.
