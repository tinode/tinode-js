const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

module.exports = (env, argv) => {
  const mode = argv.mode === 'production' ? 'prod' : 'dev';
  return {
    entry: {
      index: path.resolve(__dirname, 'src/tinode.js'),
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            'babel-loader',
          ],
          exclude: /node_modules/,
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, 'umd'),
      filename: `tinode.${mode}.js`,
      globalObject: 'this',
      library: {
        name: 'tinode',
        type: 'umd',
      },
    },
    optimization: {
      minimize: (mode === 'prod'),
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: undefined,
            warnings: false,
            parse: {},
            compress: {},
            format: {
              comments: false,
            },
            mangle: true, // Note `mangle.properties` is `false` by default.
            module: false,
            output: null,
            toplevel: false,
            nameCache: null,
            ie8: false,
            keep_classnames: undefined,
            keep_fnames: false,
            safari10: false,
          },
          extractComments: false,
        })
      ]
    },
    performance: {
      maxEntrypointSize: 360000,
      maxAssetSize: 360000
    },
  };
}
