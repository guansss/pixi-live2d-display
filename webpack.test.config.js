const path = require('path');
const webpack = require('webpack');
const packageJSON = require('./package.json');

const definePlugin = new webpack.DefinePlugin({
    __PRODUCTION__: false,
    __VERSION__: JSON.stringify(packageJSON.version),
});

module.exports = {
    entry: './test/index.js',
    mode: 'development',
    target: 'electron-renderer',
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'build.test'),
        filename: 'index.js',
        library: JSON.stringify(process.env.npm_package_name),
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
                            compilerOptions: {
                                target: 'es2019',
                            },
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
    plugins: [definePlugin],
    optimization: {
        minimize: false,
    },
    externals: [/@pixi.*/, /lodash/],
};
