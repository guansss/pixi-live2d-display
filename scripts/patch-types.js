const fs = require('fs');
const path = require('path');

const tsdFile = path.resolve('types/index.d.ts');

let tsdContent = fs.readFileSync(tsdFile, 'utf8');

const secondLineIndex = tsdContent.indexOf('\n', tsdContent.indexOf('\n') + 1);

// dts-bundle-generator will somehow miss this import statement
tsdContent = tsdContent.slice(0, secondLineIndex)
    + '\nimport { InteractionEvent, InteractionManager } from \'@pixi/interaction\';'
    + tsdContent.slice(secondLineIndex);

fs.writeFileSync(tsdFile, tsdContent);
