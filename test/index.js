// prefer devtools at right!
const webContents = require('electron').remote.getCurrentWindow().webContents;
webContents.closeDevTools();
webContents.openDevTools({ mode: 'right' });

const chai = require('chai');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

global.expect = chai.expect;
global.sinon = require('sinon');

const { BASE_PATH, readText } = require('./utils');

const base = document.createElement('base');
base.href = BASE_PATH;
document.head.appendChild(base);

// using require() will let this file be bundled by Webpack, then the process will be slowed down,
// so here's an alternative to load the script
eval(readText('../core/live2d.min.js'));

const { config } = require('../src/config');

config.logLevel = config.LOG_LEVEL_WARNING;

// wait for re-opened devtools to prepare network recording
before(done => setTimeout(done, 500));

after(() => config.logLevel = config.LOG_LEVEL_VERBOSE);

require('./module');
require('./browser');
