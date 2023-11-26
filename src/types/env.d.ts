/// <reference types="vite/client" />

declare const __DEV__: boolean;

declare const __VERSION__: string;

declare const __HEADLESS__: string;

declare let PIXI:
    | undefined
    | (typeof import("pixi.js") & {
          live2d: typeof import("../index") & typeof import("../extra");
      });
