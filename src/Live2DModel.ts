import { Renderer, Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { InteractionEvent, InteractionManager } from '@pixi/interaction';
import { ObservablePoint, Point } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { Ticker } from '@pixi/ticker';
import { fromModelSettings, fromModelSettingsFile, fromModelSettingsJSON, fromResources } from './factory';
import { interaction } from './interaction';
import { Live2DInternalModel, Priority } from './live2d';
import Live2DTransform from './Live2DTransform';
import { logger } from './utils/log';
import { clamp } from './utils/math';

export interface Live2DModelOptions {
    /**
     * Automatically update internal model by Ticker.
     */
    autoUpdate?: boolean;

    /**
     * Automatically listen for pointer events from InteractionManager to achieve interaction.
     */
    autoInteract?: boolean;
}

const DEFAULT_OPTIONS: Required<Live2DModelOptions> = {
    autoUpdate: true,
    autoInteract: true,
};

const tempPoint = new Point();

// a reference to Ticker class, defaults to the one in window.PIXI (when loaded by script tag)
let TickerClass: typeof Ticker | undefined = (window as any).PIXI?.Ticker;

export class Live2DModel extends Container {
    tag: string;

    highlightCover?: Sprite;

    transform: Live2DTransform; // override the type

    /** Works like sprite.anchor */
    anchor = new ObservablePoint(this.onAnchorChange, this, 0, 0);

    autoInteract: boolean;
    interactionManager?: InteractionManager;

    protected _autoUpdate = false;

    get autoUpdate() {
        return this._autoUpdate;
    }

    set autoUpdate(autoUpdate: boolean) {
        if (autoUpdate) {
            if (TickerClass) {
                TickerClass?.shared.add(this.onTickerUpdate, this);

                this._autoUpdate = true;
            } else {
                logger.warn(this.tag, 'No Ticker registered, please call Live2DModel.registerTicker(Ticker).');
            }
        } else {
            TickerClass?.shared.remove(this.onTickerUpdate, this);

            this._autoUpdate = false;
        }
    }

    glContextID = -1;

    elapsedTime = performance.now();
    deltaTime = 0;

    static fromModelSettingsFile = fromModelSettingsFile;
    static fromModelSettingsJSON = fromModelSettingsJSON;
    static fromModelSettings = fromModelSettings;
    static fromResources = fromResources;

    static registerTicker(tickerClass: typeof Ticker) {
        TickerClass = tickerClass;
    }

    constructor(readonly internal: Live2DInternalModel, readonly textures: Texture[], options?: Live2DModelOptions) {
        super();

        const _options = Object.assign({}, DEFAULT_OPTIONS, options);

        this.tag = `Live2DModel(${internal.modelSettings.name})`;

        this.transform = new Live2DTransform(internal);

        this.autoInteract = _options.autoInteract;

        if (this.autoInteract) {
            this.interactive = true;
            this.on('pointertap', this.onTap);
        }

        this.autoUpdate = _options.autoUpdate;

        // hook motion
        const startMotionByPriority = internal.motionManager.startMotionByPriority.bind(internal.motionManager);
        internal.motionManager.startMotionByPriority = async (group, index, priority) => {
            const started = await startMotionByPriority(group, index, priority);
            if (started) {
                this.emit('motion', group, index);
            }
            return started;
        };

        // hook sound
        const playSound = internal.motionManager.soundManager.playSound.bind(internal.motionManager.soundManager);
        internal.motionManager.soundManager.playSound = (file: string) => {
            const audio = playSound(file);
            this.emit('sound', file, audio);
            return audio;
        };
    }

    private onAnchorChange() {
        this.pivot.set(this.anchor.x * this.internal.width, this.anchor.y * this.internal.height);
    }

    highlight(enabled: boolean) {
        if (enabled) {
            if (!this.highlightCover) {
                this.highlightCover = new Sprite(Texture.WHITE);
                this.highlightCover.width = this.internal.width;
                this.highlightCover.height = this.internal.height;
                this.highlightCover.alpha = 0.3;

                this.addChild(this.highlightCover);
            }
            this.highlightCover.visible = true;
        } else if (this.highlightCover) {
            this.highlightCover.visible = false;
        }
    }

    /**
     * Shorthand method.
     */
    motion(group: string, priority?: Priority) {
        this.internal.motionManager.startRandomMotion(group, priority);
    }

    onTap(event: InteractionEvent) {
        this.tap(event.data.global.x, event.data.global.y);
    }

    /**
     * Makes the model focus on a point.
     *
     * @param x - The x position in world space.
     * @param y - The y position in world space.
     */
    focus(x: number, y: number) {
        tempPoint.x = x;
        tempPoint.y = y;

        // the update transform can be skipped because the focus won't take effect until model is rendered,
        //  and a model being rendered will always get transform updated
        this.toModelPosition(tempPoint, tempPoint, true);

        this.internal.focusController.focus(
            clamp((tempPoint.x / this.internal.originalWidth) * 2 - 1, -1, 1),
            -clamp((tempPoint.y / this.internal.originalHeight) * 2 - 1, -1, 1),
        );
    }

    /**
     * Performs tap action on sprite.
     *
     * @param x - The x position in world space.
     * @param y - The y position in world space.
     *
     * @emits Live2DModel#hit
     */
    tap(x: number, y: number) {
        tempPoint.x = x;
        tempPoint.y = y;
        this.toModelPosition(tempPoint, tempPoint);

        const hitAreaNames = this.internal.hitTest(tempPoint.x, tempPoint.y);

        if (hitAreaNames.length) {
            logger.log(this.tag, `Hit`, hitAreaNames);

            this.emit('hit', hitAreaNames);
        }
    }

    /**
     * Gets the position in original (unscaled) Live2D model.
     * @param position - The point in world space.
     * @param point - The point to store new value.
     * @param skipUpdate - True to skip the update transform.
     */
    toModelPosition(position: Point, point?: Point, skipUpdate?: boolean) {
        if (!skipUpdate) {
            this._recursivePostUpdateTransform();

            if (!this.parent) {
                (this.parent as any) = this._tempDisplayObjectParent;
                this.displayObjectUpdateTransform();
                (this.parent as any) = null;
            } else {
                this.displayObjectUpdateTransform();
            }
        }

        point = point || new Point();

        const transform = this.transform.worldTransform;
        const internal = this.internal;

        point.x = ((position.x - transform.tx) / transform.a - internal.matrix.tx) / internal.matrix.a;
        point.y = ((position.y - transform.ty) / transform.d - internal.matrix.ty) / internal.matrix.d;

        return point;
    }

    /**
     * Offered to InteractionManager to perform hit testing.
     */
    containsPoint(point: Point) {
        return this.getBounds(true).contains(point.x, point.y);
    }

    protected _calculateBounds() {
        this._bounds.addFrame(this.transform, 0, 0, this.internal.width, this.internal.height);
    }

    onTickerUpdate() {
        this.update(TickerClass!.shared.deltaMS);
    }

    update(dt: DOMHighResTimeStamp) {
        this.deltaTime += dt;
        this.elapsedTime += dt;

        // don't call update() on internal model here, because it requires WebGL context
    }

    protected _render(renderer: Renderer) {
        if (this.autoInteract && renderer.plugins.interaction !== this.interactionManager) {
            interaction.registerInteraction(this, renderer.plugins.interaction);
        }

        // reset certain systems in renderer to make Live2D's drawing system compatible with Pixi
        renderer.batch.reset();
        renderer.geometry.reset();
        renderer.shader.reset();
        renderer.state.reset();

        // when the WebGL context has changed
        if (this.glContextID !== (renderer as any).CONTEXT_UID) {
            this.glContextID = (renderer as any).CONTEXT_UID;

            this.internal.updateWebGLContext(renderer.gl, this.glContextID);

            const flipY = renderer.gl.getParameter(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL);
            renderer.gl.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, true);

            for (let i = 0; i < this.textures.length; i++) {
                const baseTexture = this.textures[i].baseTexture;

                // let TextureSystem generate corresponding WebGLTexture. The binding location is not important
                renderer.texture.bind(baseTexture, 0);

                // bind the WebGLTexture generated by TextureSystem
                // kind of ugly but it does the trick :/
                this.internal.bindTexture(i, (baseTexture as any)._glTextures[this.glContextID].texture);
            }

            renderer.gl.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, flipY);
        }

        for (const texture of this.textures) {
            // manually update the GC counter so they won't be GCed
            (texture.baseTexture as any).touched = renderer.textureGC.count;
        }

        this.internal.update(this.deltaTime, this.elapsedTime);
        this.deltaTime = 0;

        this.internal.draw(this.transform.getDrawingMatrix(renderer.gl));

        // reset the active texture that has been changed by Live2D's drawing system
        renderer.gl.activeTexture(WebGLRenderingContext.TEXTURE0 + renderer.texture.currentLocation);
    }

    destroy(options?: { children?: boolean, texture?: boolean, baseTexture?: boolean }) {
        // the setter will remove listener from ticker
        this.autoUpdate = false;

        this.autoInteract = false;
        interaction.unregisterInteraction(this);

        super.destroy(options);
    }
}

/**
 * @event Live2DModel#hit
 * @param {string[]} hitAreaNames - The names of hit Live2D hit areas.
 */

/**
 * @event Live2DModel#motion
 * @param {string} group - The group of started motion.
 * @param {string} index - The index in group of started motion.
 */

/**
 * @event Live2DModel#sound
 * @param {string} file - Sound source.
 * @param {HTMLAudioElement} audio
 */
