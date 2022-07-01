const { build } = require('vite');
const path = require('path');

const entries = [
    { entry: 'src/csm2.ts', name: 'cubism2' },
    { entry: 'src/csm4.ts', name: 'cubism4' },
    { entry: 'src/index.ts', name: 'index' },
    { entry: 'src/extra.ts', name: 'extra' },
];

const profiles = entries.flatMap(({ entry, name }) =>
    [false, true].map((minify) => ({
        build: {
            emptyOutDir: false,
            minify: minify && 'terser',
            lib: {
                formats: minify ? ['umd'] : ['es', 'umd'],
                entry: path.resolve(__dirname, '..', entry),
                fileName: (format) => `${name}${format === 'umd' ? (minify ? '.min' : '') : '.' + format}.js`,
            },
        },
    }))
);

async function main() {
    for (const profile of profiles) {
        console.log('\n' + `Building profile: ${profile.build.lib.fileName('umd')}`);

        await build(profile);
    }
}

main();
