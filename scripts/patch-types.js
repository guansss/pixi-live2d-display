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

    // dts-bundle-generator will somehow miss this import statement
    '\nimport { InteractionEvent, InteractionManager } from \'@pixi/interaction\';' +

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

fs.writeFileSync(tsdFile, tsdContent);
