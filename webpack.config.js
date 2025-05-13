const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/public/client/appManager.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public/js'),
    clean: true,
  },
  devtool: 'source-map',
};