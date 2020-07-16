const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    app: './example/index.tsx',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    host: '0.0.0.0',
    historyApiFallback: true,
    contentBase: './dist',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'test',
      template: './example/index.html',
    }),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.less', '.css'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json',
              onlyCompileBundledFiles: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                modifyVars: {
                  'primary-color': '#063985',
                  'dropdown-vertical-padding': '0',
                  'dropdown-line-height': '24px',
                  'select-dropdown-height': '24px',
                  'input-border-color': '#e6e6e6',
                  'select-border-color': '#e6e6e6',
                  'select-item-selected-bg': '#e6e6e6',
                  'picker-border-color': '#e6e6e6',
                },
                noIeCompat: true,
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
    ],
  },
};
