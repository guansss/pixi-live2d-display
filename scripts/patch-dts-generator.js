const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const insertionLineNumber = 102;
const insertionLineIndex = insertionLineNumber - 1;

const dtsGenValidatedVersion = '6.11.0';
const dtsGenVersion = require('dts-bundle-generator/package.json').version;

if (dtsGenVersion !== dtsGenValidatedVersion) {
    throw new Error(
        `The version of installed dts-bundle-generator has not been validated: ${dtsGenVersion}, cannot patch types.`
    );
}

const refFile = path.resolve(__dirname, '../src/common.ts');
const patchFile = path.resolve(__dirname, '../node_modules/dts-bundle-generator/dist/compile-dts.js');

const typeRefs = fs
    .readFileSync(refFile, 'utf8')
    .split('\n')
    .filter((line) => line.startsWith('/// <reference'))
    .join('\n');

const insertion = `
    declarations.forEach((data, fileName) => {
        if (data.startsWith('/// <reference')) {
            data = data.replace(/\\/\\/\\/ <[\\s\\S]+\\/>/m, ${JSON.stringify(typeRefs)});
            declarations.set(fileName, data);
        }
    });
`;

const patchContent = fs.readFileSync(patchFile, 'utf8');

if (patchContent.includes(insertion)) {
    // already patched
    return;
}

const patchContentLines = patchContent.split('\n');

const lineIndex = patchContentLines.findIndex(
    (line, i) => i >= insertionLineIndex && line.includes('return declarations;')
);

if (lineIndex < insertionLineIndex) {
    throw new Error('Cannot find insertion point');
}

patchContentLines.splice(lineIndex, 0, insertion);

fs.writeFileSync(patchFile, patchContentLines.join('\n'));
