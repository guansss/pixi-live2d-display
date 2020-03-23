const base = document.createElement('base');
base.href = '../../../test/';
document.head.appendChild(base);

require('./live2d.min');

require('./Live2DModel.test');
