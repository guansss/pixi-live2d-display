const path = require('path');

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
    externals: [/@pixi.*/, /lodash/],
};
