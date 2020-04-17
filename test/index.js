import { BASE_PATH, readText } from './utils';

// prefer devtools at right!

const webContents = require('electron').remote.getCurrentWindow().webContents;
webContents.closeDevTools();
webContents.openDevTools({ mode: 'right' });

const base = document.createElement('base');
base.href = BASE_PATH;
document.head.appendChild(base);

// using require() will let this file be bundled by Webpack, then the process will be slowed down,
// so here's an alternative to load the script
eval(readText('../core/live2d.min.js'));

require('./module/Live2DModel.test');
require('./browser');
