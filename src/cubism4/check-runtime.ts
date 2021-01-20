if (!(window as any).Live2DCubismCore) {
    throw new Error('Cannot find Cubism 4 runtime. Did you forget to include the live2dcubismcore.min.js?');
}
