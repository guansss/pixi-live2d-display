import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
    const isDev = command === 'serve';

    return {
        define: {
            __DEV__: isDev,
            __VERSION__: JSON.stringify(require('./package.json').version),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@cubism': path.resolve(__dirname, 'cubism/src'),
            },
        },
        build: {
            target: 'es6',
            lib: {
                entry: '',
                name: 'PIXI.live2d',
            },
            rollupOptions: {
                external(id, parentId, isResolved) {
                    return id.startsWith('@pixi/');
                },
                output: {
                    globals(id: string) {
                        if (id.startsWith('@pixi/')) {
                            return require(`./node_modules/${id}/package.json`).namespace || 'PIXI';
                        }
                    },
                },
            },
            minify: false,
        },
    };
});
