/**
 * PIXI shims
 */
declare module '@pixi/constants' {
    export { BLEND_MODES, DRAW_MODES } from 'pixi.js';
}

declare module '@pixi/core' {
    import { State } from 'pixi.js';

    class ExposedState extends State {
        static for2d(): State; // this is not defined in pixi's types
    }

    export { ExposedState as State };
    export {
        Buffer,
        Geometry,
        Renderer,
        AbstractBatchRenderer as BatchRenderer, // use a name trick because BatchRenderer is not defined in pixi's types
        Shader,
        Texture,
        BaseTexture,
    } from 'pixi.js';
}

declare module '@pixi/loaders' {
    export { Loader,LoaderResource } from 'pixi.js';
}

declare module '@pixi/utils' {
    import { utils } from 'pixi.js';
    export import EventEmitter = utils.EventEmitter;
    export import sayHello = utils.sayHello;
}

declare module '@pixi/app' {
    export { Application } from 'pixi.js';
}

declare module '@pixi/display' {
    export { DisplayObject, Container } from 'pixi.js';
}

declare module '@pixi/particles' {
    export { ParticleContainer, ParticleRenderer } from 'pixi.js';
}

declare module '@pixi/spritesheet' {
    export { SpritesheetLoader } from 'pixi.js';
}

declare module '@pixi/sprite' {
    export { Sprite } from 'pixi.js';
}

declare module '@pixi/mesh' {
    export { Mesh } from 'pixi.js';
}

declare module '@pixi/math' {
    export { Matrix, Point, Rectangle, Bounds, Transform } from 'pixi.js';
}
