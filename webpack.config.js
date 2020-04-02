const path = require('path');
const merge = require('lodash/merge');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = [
    // profile for module systems
    {
        output: {
            filename: 'index.js',
            library: {
                commonjs: 'pixi-live2d-display',
                amd: 'pixi-live2d-display',
                root: ['PIXI', 'live2d'],
            },
        },
        plugins: [
            new ForkTsCheckerWebpackPlugin(), // just check it once!
        ],
        externals: [/* place holder for merging */ undefined, /lodash/],
    },

    // profile for browser, Lodash is bundled
    {
        output: {
            filename: 'browser.js',
            library: ['PIXI', 'Live2D'],
        },
    },
].map(override => merge({
    entry: './src/index.ts',
    devtool: 'source-map', // issue related: https://bugs.chromium.org/p/chromium/issues/detail?id=1052872
    output: {
        path: path.resolve(__dirname, 'lib'),
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.[jt]s$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    externals: [
        function(context, request, callback) {
            if (request.startsWith('@pixi/')) {
                const packageJSON = require('./node_modules/' + request + '/package.json');

                return callback(null, {
                    commonjs: request,
                    commonjs2: request,
                    amd: request,

                    // read namespace setting from respective package.json
                    // e.g. the namespace of "@pixi/utils" is "PIXI.utils", then the root will be ['PIXI', 'utils']
                    root: packageJSON.namespace ? packageJSON.namespace.split('.') : 'PIXI',
                });
            }
            callback();
        },
    ],
}, override));
