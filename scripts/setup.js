const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const overwriteExisting = false;
const coreDir = path.resolve(__dirname, '../core') + '/';

const downloadFiles = [{
    file: coreDir + 'live2d.min.js',
    url: 'http://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js',
}, {
    file: coreDir + 'sdk4.zip',
    url: 'https://cubism.live2d.com/sdk-web/bin/CubismSdkForWeb-4-r.1.zip',
    unzip: [{
        entryFile: 'CubismSdkForWeb-4-r.1/Core/live2dcubismcore.js',
        outputFile: coreDir + 'live2dcubismcore.js',
    }, {
        entryFile: 'CubismSdkForWeb-4-r.1/Core/live2dcubismcore.d.ts',
        outputFile: coreDir + 'live2dcubismcore.d.ts',
    }],
}];

async function main() {
    await Promise.all(downloadFiles.map(async downloadFile => {
        await download(downloadFile.url, downloadFile.file);

        if (downloadFile.unzip) {
            unzip(downloadFile.file, downloadFile.unzip);

            fs.unlinkSync(downloadFile.file);
        }
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

    const buffer = await fetch(url).then(res => res.buffer());

    if (!buffer.length) {
        throw new Error('Empty response');
    }

    fs.writeFileSync(file, buffer);

    console.log('Downloaded ', file);
}

function unzip(zipPath, entries) {
    const zip = new AdmZip(zipPath);

    for (const { entryFile, outputFile } of entries) {
        console.log('Extracting ', outputFile);

        try {
            const keepEntryPath = false;

            zip.extractEntryTo(entryFile, path.dirname(outputFile), keepEntryPath, overwriteExisting, path.basename(outputFile));
        } catch (e) {
            if (!(!overwriteExisting && e && e.message.includes('already exists'))) {
                throw e;
            }
        }
    }
}

main().then();
