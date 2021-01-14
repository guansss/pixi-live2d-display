const path = require('path');
const webpack = require('webpack');
const packageJSON = require('../../package.json');

const definePlugin = new webpack.DefinePlugin({
    __PRODUCTION__: false,
    __VERSION__: JSON.stringify(packageJSON.version),
});

module.exports = {
    entry: './test/playground/index.ts',
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        path: __dirname,
        filename: 'index.js',
    },
    devServer: {
        hot: true,
        open: true,
        openPage: 'test/playground/index.html',
        contentBase: path.resolve(__dirname, '../../'),
        historyApiFallback: false,
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
            '@': path.resolve(__dirname, '../../src'),
            '@cubism': path.resolve(__dirname, '../../cubism/src'),
        },
        extensions: ['.ts', '.js'],
    },
    plugins: [definePlugin],
    optimization: {
        minimize: false,
    },
};
