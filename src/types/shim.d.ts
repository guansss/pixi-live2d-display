/**
 * PIXI shims
 */

declare module '@pixi/core' {
    export { Renderer, Texture, BaseTexture } from 'pixi.js';
}

declare module '@pixi/utils' {
    import { utils } from 'pixi.js';
    export import EventEmitter = utils.EventEmitter;
    export import url = utils.url;
}

declare module '@pixi/app' {
    export { Application } from 'pixi.js';
}

declare module '@pixi/ticker' {
    export { Ticker } from 'pixi.js';
}

declare module '@pixi/display' {
    export { DisplayObject, Container } from 'pixi.js';
}

declare module '@pixi/graphics' {
    export { Graphics } from 'pixi.js';
}

declare module '@pixi/interaction' {
    import { interaction } from 'pixi.js';
    export import InteractionEvent = interaction.InteractionEvent;
    export import InteractionManager = interaction.InteractionManager;
}

declare module '@pixi/math' {
    export { Matrix, Point, ObservablePoint, Rectangle, Bounds, Transform } from 'pixi.js';
}
