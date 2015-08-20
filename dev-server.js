/**
 * Created by keith on 13/02/15.
 */
var util = require('util');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');
var opn = require('opn');

var pkg = require('./package.json');
var port = pkg.config.devPort,
    host = pkg.config.devHost,
    https = pkg.config.devHttps;


console.log (JSON.stringify(config));

new WebpackDevServer(webpack(config), {
    publicPath: config.output.publicPath,
    hot: true,
    https: https
}).listen(port, host, function (err, result) {
        if (err) {
            console.log(err);
        }
        var url = util.format('http%s://%s:%d', https ? 's' : '', host, port);
        console.log('Weboack dev-server Listening at %s', url);
        opn(url);
    });
