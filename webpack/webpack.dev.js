const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    devtool: "source-map",
    devServer: {
        static: {
            directory: path.join(__dirname, './../target/www'),
        },
        compress: true,
        port:9060,
    },
    output: {
          path: path.resolve('target/www'),
          filename: '[name].bundle.js',
          chunkFilename: '[id].chunk.js'
    },
    plugins: [
          new StyleLintPlugin(),
          new HtmlWebpackPlugin({
                title: 'SIMDE (Development mode)',
                template: 'src/index.html'
          }),
          new CopyWebpackPlugin([
                { from: 'src/i18n' }
          ])
    ]
});
