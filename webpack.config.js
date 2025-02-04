const path = require('path');

module.exports = {
  mode: 'production',
  output: {
    path: path.join(__dirname, 'functions-build'),
    filename: '[name].js',
    libraryTarget: 'commonjs'
  },
  optimization: {
    minimize: false
  },
  target: 'node',
  externals: ['aws-sdk'],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: { node: '14' } }]]
          }
        }
      }
    ]
  }
}; 