const { build } = require('vite');
const path = require('path');
const { builtinModules } = require('module');

async function main() {
    await build({
        build: {
            outDir: 'test.build',
            target: 'chrome91',
            lib: {
                formats: ['cjs'],
                entry: path.resolve(__dirname, '..', 'test/index.js'),
                fileName: () => 'index.js',
            },
            rollupOptions: {
                external: null,
            },
            commonjsOptions: {
                include: /node_modules|test|scripts/,
                ignore: ['electron', ...builtinModules],
            },
        },
    });
}

main();
