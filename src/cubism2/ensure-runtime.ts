export function ensureRuntime() {
    if (!(window as any).Live2D) {
        throw new Error('Missing Cubism 2 runtime. Did you forget to load live2d.min.js?');
    }
}
