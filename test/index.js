// prefer devtools at right!
const webContents = require('electron').remote.getCurrentWindow().webContents;
webContents.closeDevTools();
webContents.openDevTools({ mode: 'right' });

const base = document.createElement('base');
base.href = '../../../test/';
document.head.appendChild(base);

require('./assets/live2d.min');
require('./module/Live2DModel.test');
require('./browser');
