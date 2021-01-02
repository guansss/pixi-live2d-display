const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const tsdFile = path.resolve('types/index.d.ts');

console.log(chalk.blue('Patching types for'), chalk.yellow(tsdFile));

let tsdContent = fs.readFileSync(tsdFile, 'utf8');

const secondLineIndex = tsdContent.indexOf('\n', tsdContent.indexOf('\n') + 1);

tsdContent = tsdContent.slice(0, secondLineIndex) +
    // import types from main package
    '\n///<reference types="pixi.js"/>\n' +

    // dts-bundle-generator currently doesn't support `import x = y` statements
    '\nimport { EventEmitter, url } from \'@pixi/utils\';' +

    tsdContent.slice(secondLineIndex);

// convert scoped-package imports to a single main-package import
tsdContent = tsdContent.replace(
    /import { (.+) } from '@pixi\/(.+)';/g,
    (match, members, pkg) => {
        // read namespace setting from respective package.json
        const namespace = require('@pixi/' + pkg + '/package.json').namespace || 'PIXI';

        return members.split(', ')
            .map(member => `import ${member} = ${namespace}.${member};`)
            .join('\n');
    },
);

// correct the declaration merging
tsdContent = tsdContent.replace('export declare interface Live2DMotion', 'declare interface Live2DMotion');

fs.writeFileSync(tsdFile, tsdContent);

// put these code to the end of `getDeclarationFiles()`
// in "node_modules/dts-bundle-generator/dist/compile-dts.js"
// before generating types to prevent type errors
function fixPathAlias() {
    declarations.forEach((data, fileName) => {
        if (data.startsWith('/// <reference')) {
            data = data.replace(/\/\/\/ <[\s\S]+\/>/m,
                `/// <reference path="../core/live2d.d.ts"/>
/// <reference path="../core/live2dcubismcore.d.ts"/>
/// <reference path="../cubism/src/CubismSpec.d.ts"/>
/// <reference path="types/Cubism2Spec.d.ts"/>
/// <reference path="types/helpers.d.ts"/>
/// <reference path="types/shim.d.ts"/>`);
            declarations.set(fileName, data);
        }
    });
}
