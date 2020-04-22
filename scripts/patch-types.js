const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const tsdFile = path.resolve('types/index.d.ts');

console.log(chalk.blue('Patching types for'), chalk.yellow(tsdFile));

let tsdContent = fs.readFileSync(tsdFile, 'utf8');

const secondLineIndex = tsdContent.indexOf('\n', tsdContent.indexOf('\n') + 1);

// dts-bundle-generator will somehow miss this import statement
tsdContent = tsdContent.slice(0, secondLineIndex)
    + '\nimport { InteractionEvent, InteractionManager } from \'@pixi/interaction\';'
    + tsdContent.slice(secondLineIndex);

const pixiMembers = new Set();
let firstImportStatementIndex = 0;

// convert scoped-package imports to a single main-package import
tsdContent = tsdContent.replace(
    /import { (.+) } from '@pixi\/(.+)';\n/g,
    (match, members, pkg, offset) => {
        firstImportStatementIndex = firstImportStatementIndex || offset;

        // read namespace setting from respective package.json
        let namespace = require('@pixi/' + pkg + '/package.json').namespace;

        if (namespace) {
            return members.split(', ')
                .map(member => `import ${member} = ${namespace}.${member};`)
                .join('\n')
                + '\n';
        } else {
            pixiMembers.add(members);

            return '';
        }
    },
);

tsdContent = `${tsdContent.slice(0, firstImportStatementIndex)}
import {
${[...pixiMembers].map(member => '    ' + member).join(',\n')}
} from 'pixi.js';

${tsdContent.slice(firstImportStatementIndex)}`;

fs.writeFileSync(tsdFile, tsdContent);
