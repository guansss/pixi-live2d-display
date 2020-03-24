const base = document.createElement('base');
base.href = '../../../test/';
document.head.appendChild(base);

// prefer devtools at right!
const webContents = require('electron').remote.getCurrentWindow().webContents;
webContents.closeDevTools();
webContents.openDevTools({ mode: 'right' });

require('./live2d.min');

require('./Live2DModel.test');
