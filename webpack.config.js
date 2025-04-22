import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import {BundleAnalyzerPlugin} from "webpack-bundle-analyzer";

export default {
  mode: 'development',
  entry: './client/index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['', '.jsx', '.js'],
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-react', {runtime: 'automatic', importSource: 'preact'}],
            ],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              additionalData: '@import "~bootstrap/scss/bootstrap";'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './client/index.html',
      inject: 'body',
    }),
    //new BundleAnalyzerPlugin()
  ],
  devtool: 'source-map',
  devServer: {
    static: path.resolve('dist'),
    port: 8080,
    historyApiFallback: true,
  },
  stats: {
    warnings: false
  }
};
