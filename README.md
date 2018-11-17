# Javascript bindings for Tinode

See demo at http://api.tinode.co/ ([source](https://github.com/tinode/example-react-js))

Regularly released NPM packages are at https://www.npmjs.com/package/tinode-sdk

You may include the latest standalone minified SDK into your html file as
```html
<script crossorigin="anonymous"
  src="https://unpkg.com/tinode-sdk/umd/tinode.prod.js">
</script>
```
or while developing as
```html
<script crossorigin="anonymous"
  src="https://unpkg.com/tinode-sdk/umd/tinode.dev.js">
</script>
```

## Getting support

* Read [client-side](http://tinode.github.io/js-api/) and [server-side](https://github.com/tinode/chat/blob/master/docs/API.md) API documentation.
* For support, general questions, discussions post to [https://groups.google.com/d/forum/tinode](https://groups.google.com/d/forum/tinode).
* For bugs and feature requests [open an issue](https://github.com/tinode/tinode-js/issues/new).

## Node JS compatibility

To use tinode-sdk as a Node JS dependency, you have to provide a WebSocket provider:
```js
  Tinode.setWebSocketProvider(require('ws'));
  this.tinode  = new Tinode(...);
```
