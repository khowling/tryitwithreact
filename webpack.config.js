var webpack = require('webpack');
var path = require('path');
var util = require('util');

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
    entry:  [
         util.format('webpack-dev-server/client?http%s://%s:%d', https && 's' || '', host, port),
        'webpack/hot/only-dev-server',
        './app.jsx'
    ],
    target: "web",
    output: {
        path: path.resolve(target),
        filename: jsBundle,
        publicPath: "/"

    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],
    module: {
        loaders: [
            {
              test: /\.jsx$|\.es6$/,
              exclude: /node_modules/,
              loaders:  ['babel-loader?optional=runtime']
            },
            {
              test: /\.html$/,
              loader: htmlLoader
            }
        ]
    }
};
