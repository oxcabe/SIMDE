const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        app: './src/main.tsx',
    },
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx'],
    },
    module: {
       rules: [
          {
                test: /\.ts$/,
                enforce: 'pre',
                loader: 'tslint-loader',
                // options: { 
                //       typeCheck: true
                // }
          },
          { test: /\.css$/i, loader: "css-loader" },
          { test: /\.tsx?$/, loader: "ts-loader" },
          { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
          {
            test: /\.(eot|svg|ttf|woff|woff2)$/,
            loader: 'file-loader',

            options: {
                name: "public/fonts/[name].[ext]",
            },
          },
       ],
    },
    plugins: [
       new MiniCssExtractPlugin({
          filename: '[name].[hash:8].css',
       })
    ]
};
