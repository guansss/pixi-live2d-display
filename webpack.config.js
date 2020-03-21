const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const config = {
    entry: './src/index.ts',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'lib'),
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
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin(),
    ],
};

module.exports = (env, argv) => {
    config.mode = argv.mode;

    config.devtool = argv.mode === 'production' ? 'source-map' : 'inline-source-map';

    return config;
};
