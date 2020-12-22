import { InternalModel, MotionManager, MotionPriority } from '@/cubism-common';
import { MotionManagerOptions } from '@/cubism-common/MotionManager';
import type { Live2DFactoryOptions } from '@/factory/Live2DFactory';
import { Live2DFactory } from '@/factory/Live2DFactory';
import { Renderer, Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { ObservablePoint, Point } from '@pixi/math';
import { Ticker } from '@pixi/ticker';
import { InteractionMixin } from './InteractionMixin';
import { Live2DTransform } from './Live2DTransform';
import { applyMixins, logger } from './utils';

export interface Live2DModelOptions extends MotionManagerOptions {
    /**
     * Automatically update internal model by `Ticker.shared`.
     */
    autoUpdate?: boolean;

    /**
     * Automatically listen for pointer events from `InteractionManager` to achieve interaction.
     */
    autoInteract?: boolean;
}

const DEFAULT_OPTIONS: Pick<Required<Live2DModelOptions>, 'autoUpdate' | 'autoInteract'> = {
    autoUpdate: true,
    autoInteract: true,
};

const tempPoint = new Point();

// a reference to Ticker class, defaults to the one in window.PIXI (when loaded by a <script> tag)
let TickerClass: typeof Ticker | undefined = (window as any).PIXI?.Ticker;

export interface Live2DModel<IM extends InternalModel = InternalModel> extends InteractionMixin {}

/**
 * A wrapper that makes Live2D model possible to be used as a `DisplayObject` in PixiJS.
 *
 * ```ts
 * let model = Live2DModel.fromModelSettingsFile('path/to/my-model.model.json');
 * container.add(model);
 * ```
 *
 * @emits {@link Live2DModelEvents}
 */
export class Live2DModel<IM extends InternalModel = InternalModel> extends Container {
    static from<IM extends InternalModel = InternalModel>(source: string | object | IM['settings'], options?: Live2DFactoryOptions): Promise<Live2DModel<IM>> {
        const model = new this<IM>(options);

        return Live2DFactory.setupLive2DModel(model, source, options).then(() => model);
    }

    static fromSync<IM extends InternalModel = InternalModel>(source: string | object | IM['settings'], options?: Live2DFactoryOptions) {
        const model = new this<IM>(options);

        Live2DFactory.setupLive2DModel(model, source, options).then(options?.onLoad).catch(options?.onError);

        return model;
    }

    /**
     * Registers the class of `Ticker` for auto updating.
     * @param tickerClass
     */
    static registerTicker(tickerClass: typeof Ticker): void {
        TickerClass = tickerClass;
    }

    /**
     * Tag for logging.
     */
    tag = 'Live2DModel(uninitialized)';

    internalModel?: IM;

    textures: Texture[] = [];

    /**
     * Custom transform.
     */
    transform = new Live2DTransform();

    /**
     * Works like the one in `PIXI.Sprite`.
     */
    anchor = new ObservablePoint(this.onAnchorChange, this, 0, 0);

    /**
     * An ID of Gl context that syncs with `renderer.CONTEXT_UID`.
     */
    glContextID = -1;

    /**
     * Elapsed time since created. Milliseconds.
     */
    elapsedTime: DOMHighResTimeStamp = performance.now();

    /**
     * The time elapsed from last frame to current frame. Milliseconds.
     */
    deltaTime: DOMHighResTimeStamp = 0;

    protected _autoUpdate = false;

    /**
     * Enables automatic updating. Requires {@link Live2DModel.registerTicker} or global `window.PIXI.Ticker`.
     */
    get autoUpdate() {
        return this._autoUpdate;
    }

    set autoUpdate(autoUpdate: boolean) {
        if (autoUpdate) {
            if (!this._destroyed) {
                if (TickerClass) {
                    TickerClass?.shared.add(this.onTickerUpdate, this);

                    this._autoUpdate = true;
                } else {
                    logger.warn(this.tag, 'No Ticker registered, please call Live2DModel.registerTicker(Ticker).');
                }
            }
        } else {
            TickerClass?.shared.remove(this.onTickerUpdate, this);

            this._autoUpdate = false;
        }
    }

    constructor(options?: Live2DModelOptions) {
        super();

        const _options = Object.assign({}, DEFAULT_OPTIONS, options);

        this.autoInteract = _options.autoInteract;
        this.autoUpdate = _options.autoUpdate;

        if (_options.autoInteract) {
            this.interactive = true;
        }

        this.init();
    }

    protected init() {
        this.on('modelLoaded', () => {
            this.tag = `Live2DModel(${this.internalModel!.settings.name})`;
        });
    }

    /**
     * Called when the values of {@link Live2DModel#anchor} are changed.
     */
    protected onAnchorChange(): void {
        if (this.internalModel) {
            this.pivot.set(this.anchor.x * this.internalModel.width, this.anchor.y * this.internalModel.height);
        }
    }

    /**
     * Shorthand of {@link MotionManager#startRandomMotion}.
     */
    motion(group: string, priority?: MotionPriority): Promise<boolean> {
        // because `startRandomMotion` is a union function, the types of its first parameter are
        // intersected and therefore collapsed to `never`, that's why we need to cast the type for it.
        // see https://github.com/Microsoft/TypeScript/issues/30581
        return this.internalModel?.motionManager.startRandomMotion(group, priority) ?? Promise.resolve(false);
    }

    /**
     * Makes the model focus on a point.
     * @param x - Position in world space.
     * @param y - Position in world space.
     */
    focus(x: number, y: number): void {
        tempPoint.x = x;
        tempPoint.y = y;

        // we can pass `true` as the third argument to skip the update transform
        // because focus won't take effect until the model is rendered,
        // and a model being rendered will always get transform updated
        this.toModelPosition(tempPoint, tempPoint, true);

        this.internalModel?.focusController.focus(
            (tempPoint.x / this.internalModel.originalWidth) * 2 - 1,
            -((tempPoint.y / this.internalModel.originalHeight) * 2 - 1),
        );
    }

    /**
     * Performs tap on the model.
     * @param x - The x position in world space.
     * @param y - The y position in world space.
     * @emits {@link Live2DModelEvents.hit}
     */
    tap(x: number, y: number): void {
        if (this.internalModel) {
            tempPoint.x = x;
            tempPoint.y = y;
            this.toModelPosition(tempPoint, tempPoint);

            const hitAreaNames = this.internalModel.hitTest(tempPoint.x, tempPoint.y);

            if (hitAreaNames.length) {
                logger.log(this.tag, `Hit`, hitAreaNames);

                this.emit('hit', hitAreaNames);
            }
        }
    }

    /**
     * Gets the position in original (unscaled) Live2D model.
     * @param position - The point in world space.
     * @param result - The point to store new value.
     * @param skipUpdate - True to skip the update transform.
     * @return The point in Live2D model.
     */
    toModelPosition(position: Point, result: Point = position.clone(), skipUpdate?: boolean): Point {
        if (this.internalModel) {
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

            this.transform.worldTransform.applyInverse(position, result);
            this.internalModel.localTransform.applyInverse(result, result);
        }

        return result;
    }

    /**
     * Required by `InteractionManager` to perform hit testing.
     * @param point - The point in world space.
     * @return True if given point is inside this model.
     */
    containsPoint(point: Point): boolean {
        return this.getBounds(true).contains(point.x, point.y);
    }

    /** @override */
    protected _calculateBounds(): void {
        if (this.internalModel) {
            this._bounds.addFrame(this.transform, 0, 0, this.internalModel.width, this.internalModel.height);
        }
    }

    /**
     * A listener to be added to `Ticker`.
     */
    onTickerUpdate(): void {
        this.update(TickerClass!.shared.deltaMS);
    }

    /**
     * Updates parameters of the model.
     * @param dt - The time elapsed since last frame.
     */
    update(dt: DOMHighResTimeStamp): void {
        this.deltaTime += dt;
        this.elapsedTime += dt;

        // don't call `this.model.update()` here, because it requires WebGL context
    }

    /** @override */
    protected _render(renderer: Renderer): void {
        if (!this.internalModel) {
            return;
        }

        this.registerInteraction(renderer.plugins.interaction);

        // reset certain systems in renderer to make Live2D's drawing system compatible with Pixi
        renderer.batch.reset();
        renderer.geometry.reset();
        renderer.shader.reset();
        renderer.state.reset();

        let shouldUpdateTexture = false;

        // when the WebGL context has changed
        if (this.glContextID !== (renderer as any).CONTEXT_UID) {
            this.glContextID = (renderer as any).CONTEXT_UID;

            this.internalModel.updateWebGLContext(renderer.gl, this.glContextID);

            shouldUpdateTexture = true;
        }

        for (let i = 0; i < this.textures.length; i++) {
            const texture = this.textures[i]!;

            if (!texture.valid) {
                continue;
            }

            if (shouldUpdateTexture || !(texture.baseTexture as any)._glTextures[this.glContextID]) {
                renderer.gl.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, this.internalModel.textureFlipY);

                // let the TextureSystem generate corresponding WebGLTexture, and bind to an arbitrary location
                renderer.texture.bind(texture.baseTexture, 0);
            }

            // bind the WebGLTexture into Live2D core.
            // because the Texture in Pixi can be shared between multiple DisplayObjects,
            // it's unable to know if the WebGLTexture in this Texture has been destroyed (GCed) and regenerated,
            // and therefore we always bind the texture here no matter what
            this.internalModel.bindTexture(i, (texture.baseTexture as any)._glTextures[this.glContextID].texture);

            // manually update the GC counter so they won't be GCed while using this model
            (texture.baseTexture as any).touched = renderer.textureGC.count;
        }

        this.internalModel.update(this.deltaTime, this.elapsedTime);
        this.deltaTime = 0;

        this.transform.applyTransform(this.internalModel, renderer.gl);
        this.internalModel.draw(renderer.gl);

        // reset WebGL state and texture bindings
        renderer.state.reset();
        renderer.texture.reset();
    }

    /** @override */
    destroy(options?: { children?: boolean, texture?: boolean, baseTexture?: boolean }): void {
        this.emit('destroy');

        // the setters will do the cleanup
        this.autoUpdate = false;

        this.unregisterInteraction();

        if (options?.texture) {
            this.textures.forEach(texture => texture.destroy(options.baseTexture));
        }

        super.destroy(options);
    }
}

applyMixins(Live2DModel, [InteractionMixin]);
