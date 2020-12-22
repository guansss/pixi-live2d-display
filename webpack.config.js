const path = require('path');
const merge = require('lodash/merge');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');

// add browser-specific tools
const addBrowserTools = new webpack.NormalModuleReplacementPlugin(/\/common/, function(resource) {
    if (!resource.contextInfo.issuer.includes('common-browser')) {
        resource.request = resource.request.replace('common', `common-browser`);
        console.log(resource.contextInfo.issuer, resource.request);
    }
});

module.exports = [
    // profile for module systems
    {
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'lib'),
            library: {
                commonjs: 'pixi-live2d-display',
                amd: 'pixi-live2d-display',
                root: ['PIXI', 'live2d'],
            },
        },
        plugins: [
            // just check it once!
            new ForkTsCheckerWebpackPlugin({
                typescript: {
                    configFile: 'tsconfig.build.json',
                },
            }),
            // new BundleAnalyzerPlugin(),
        ],
        externals: [/* place holder for merging */ undefined, /lodash/],
        optimization: {
            minimize: false,
        },
    },

    // profiles for browser, Lodash and browser-specific tools are bundled
    {
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
            library: ['PIXI', 'live2d'],
        },
        plugins: [addBrowserTools],
        optimization: {
            minimize: false,
        },
    },
    {
        output: {
            filename: '[name].min.js',
            path: path.resolve(__dirname, 'dist'),
            library: ['PIXI', 'live2d'],
        },
        plugins: [addBrowserTools],
    },
].map(override => merge({
    entry: {
        index: './src/index.ts',
        cubism2: './src/csm2.ts',
        cubism4: './src/csm4.ts',
    },
    devtool: 'source-map', // issue related: https://bugs.chromium.org/p/chromium/issues/detail?id=1052872
    output: {
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
                            configFile: 'tsconfig.build.json',
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@cubism': path.resolve(__dirname, 'cubism/src'),
        },
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
