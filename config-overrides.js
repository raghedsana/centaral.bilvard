const webpack = require('webpack'); // Lägg till denna rad

module.exports = {
  webpack: (config, env) => {
    // Lägg till polyfill för de saknade modulerna
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, // Ignorera fs
      path: require.resolve('path-browserify'),
      buffer: require.resolve('buffer/'),
      http: require.resolve('stream-http'),
      zlib: require.resolve('browserify-zlib'),
      net: require.resolve('net-browserify'),
      crypto: require.resolve('crypto-browserify'),
      querystring: require.resolve('querystring-es3'),
      util: require.resolve('util/'),
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert/'), // Lägg till denna rad
    };

    // Lägg till global polyfill för Buffer och andra moduler
    config.plugins = [
      ...config.plugins,
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ];

    return config;
  },
};
