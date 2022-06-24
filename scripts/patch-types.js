const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const tsdFile = path.resolve('types/index.d.ts');

console.log(chalk.blue('Patching types for'), chalk.yellow(tsdFile));

let tsdContent = fs.readFileSync(tsdFile, 'utf8');

// correct the declaration merging
tsdContent = tsdContent.replace('export declare interface Live2DMotion', 'declare interface Live2DMotion');

fs.writeFileSync(tsdFile, tsdContent);
