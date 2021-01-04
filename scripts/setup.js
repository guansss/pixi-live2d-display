const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const overwriteExisting = false;

const downloadFiles = [{
    file: '../core/live2d.min.js',
    url: 'http://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js',
}, {
    file: '../core/live2dcubismcore.js',
    // the official site only serves the minified version
    url: 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
}];

async function main() {
    await Promise.all(downloadFiles.map(async downloadFile => {
        const file = path.resolve(__dirname, downloadFile.file);

        await download(downloadFile.url, file);
    }));
}

async function download(url, file) {
    console.log('Downloading', file);

    if (!overwriteExisting && fs.existsSync(file)) {
        console.log('Skipped    ', file);

        return;
    }

    const dir = path.dirname(file);

    if (!fs.existsSync(dir)) {
        console.log('Create dir ', dir);

        fs.mkdirSync(dir);
    }

    const content = await fetch(url).then(res => res.text());

    if (!content) {
        throw new Error('Empty response');
    }

    fs.writeFileSync(file, content, 'utf8');

    console.log('Downloaded ', file);
}

main().then();
