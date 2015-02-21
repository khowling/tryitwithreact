var webpack = require('webpack');

module.exports = {
    inline: true,
    contentBase: "./static",
    entry:  [
        'webpack-dev-server/client?http://0.0.0.0:9090', // WebpackDevServer host and port
        'webpack/hot/only-dev-server',
        './static/js/main.js'
    ],
    output: {
        path: __dirname + '/output',
        filename: 'bundle.js',
        publicPath: "http://localhost:9090/output/"

    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],
    module: {
        loaders: [
            {test: /\.js$/,
                exclude: [/static[\\\/]js[\\\/]lib[\\\/].*\.js$/, /src[\\\/]lib[\\\/]csp[\\\/].*/, /node_modules[\\\/].*/],
                loaders:  ['react-hot', 'babel-loader']}
        //        ,
        //    {test: /\.js$/,
        //        exclude: [/static\/js\/lib\/.*\.js$/, /src\/lib\/.*/, /node_modules\/.*/],
        //        loaders: ['react-hot', 'jsx?harmony']},
        ]
    }
};
