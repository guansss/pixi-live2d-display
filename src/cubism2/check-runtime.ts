if (!(window as any).Live2D) {
    throw new Error('Cannot find Cubism 2 runtime. Did you forget to include the live2d.min.js?');
}
