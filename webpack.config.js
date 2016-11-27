var webpack = require('webpack');
var path = require('path');
var util = require('util');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var pkg = require('./package.json');
var port = pkg.config.devPort,
    host = pkg.config.devHost,
    https = pkg.config.devHttps,
    target = pkg.config.buildDir;

var jsBundle = path.join('js', util.format('[name].%s.js', pkg.version));
var fileLoader = 'file-loader?name=[path][name].[ext]';
var htmlLoader = fileLoader + '!' +
   'template-html-loader?' + [
     'raw=true',
     'engine=lodash',
     'VERSION=' + pkg.version,
     'TITLE=' + pkg.name,
     util.format('SERVER_URL=%s:%d',  'http://localhost', 3000)
   ].join('&')

console.log ('htmlLoader' + htmlLoader);

module.exports = {
    context: path.join(__dirname, 'app'),
    entry:  {app: ['babel-polyfill', './app_index.jsx']},
    target: "web",
    output: {
        path: path.resolve(target),
        filename: jsBundle,
        publicPath: "/"
    },
    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.OccurenceOrderPlugin()
    ],
    module: {
        loaders: [
            {
              test: /\.jsx$|\.js$/,
              exclude: /node_modules/,
              loaders:  ['babel-loader?presets[]=react,presets[]=es2015']
            },
            {
              test: /\.html$/,
              loader: htmlLoader
            },
            {
              test: /\.scss$/,
              loader: 'style!css!sass!resolve-url!sass?sourceMap'
            },
            { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" }
        ]
    }
};
