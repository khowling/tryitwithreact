var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var config = {
    cache: true,
    entry: './static/js/main.js'
     /* [
        'webpack-dev-server/client?http://0.0.0.0:8080', // WebpackDevServer host and port
        'webpack/hot/only-dev-server',
        './static/js/main.js' // Your appʼs entry point
    ]
    */
    ,
    output: {
        path: path.join(__dirname, 'static/output'),
        publicPath: '/output/',
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['', '.js'],
        fallback: __dirname,
        alias: {
            'impl': 'static/js/impl',
            'static': 'static',
            'config.json': 'config/browser.json'
        }
    },
    module: {
        loaders: [
            {test: /\.js$/,
                exclude: [/static\/js\/lib\/.*\.js$/, /src\/lib\/csp\/.*/, /node_modules\/.*/],
                loader: '6to5'},
            {test: /\.js$/,
                exclude: [/static\/js\/lib\/.*\.js$/, /src\/lib\/.*/, /node_modules\/.*/],
                loader: 'jsx-loader'},
            // {test: /\.less$/, loader: "style!css!less" },
            // {test: /\.css$/, loader: "style!css" },
            {test: /\.less$/, loader: ExtractTextPlugin.extract("style-loader", "css!less") },
            {test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css") },
            {test: /\.json$/, loader: "json"}
        ]
    }
    /*
    ,
    plugins: [
        new webpack.ProvidePlugin({
            regeneratorRuntime: 'static/js/regenerator-runtime.js'
        }),
        new ExtractTextPlugin('styles.css')
    ]
    */
};

if(process.env.NODE_ENV === 'production') {
    config.plugins = config.plugins.concat([
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle: {
                except: ['GeneratorFunction', 'GeneratorFunctionPrototype']
            }
        }),
        new webpack.optimize.OccurenceOrderPlugin()
    ]);
}
else {
    config.devtool = 'sourcemap';
    config.debug = true;
}

module.exports = config;