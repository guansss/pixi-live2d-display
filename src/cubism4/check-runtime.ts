if (!(window as any).Live2DCubismCore) {
    throw new Error('Could not find Cubism 4 runtime. This plugin requires live2dcubismcore.js to be loaded.');
}
