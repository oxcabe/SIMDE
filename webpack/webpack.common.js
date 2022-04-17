const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = function (options) {
   return {
      name: 'app',
      target: 'web',
      entry: './src/main.tsx',
      resolve: {
         extensions: ['.js', '.ts', '.jsx', '.tsx'],
      },
      module: {
         // loaders: [
         //    {
         //          test: /\.ts$/,
         //          enforce: 'pre',
         //          loader: 'tslint-loader',
         //          // options: { 
         //          //       typeCheck: true
         //          // }
         //    },
         //    { test: /\.tsx?$/, loader: "ts-loader" },
         //    { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
         //    {
         //       test: /\.(eot|svg|ttf|woff|woff2)$/,
         //       loader: 'file-loader?name=public/fonts/[name].[ext]'
         //    }
         // ],
         rules: [
              {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
              },
        ]
      },
      plugins: [
         new MiniCssExtractPlugin({
            filename: '[name].[hash:8].css',
         })
      ]
   }
};
