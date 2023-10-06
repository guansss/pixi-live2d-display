import { InternalModel, ModelSettings, MotionPriority } from '@/cubism-common';
import { MotionManagerOptions } from '@/cubism-common/MotionManager';
import type { Live2DFactoryOptions } from '@/factory/Live2DFactory';
import { Live2DFactory } from '@/factory/Live2DFactory';
import { Renderer, Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { Matrix, ObservablePoint, Point, Rectangle } from '@pixi/math';
import type { Ticker } from '@pixi/ticker';
import { InteractionMixin } from './InteractionMixin';
import { Live2DTransform } from './Live2DTransform';
import { JSONObject } from './types/helpers';
import { applyMixins, logger } from './utils';

export interface Live2DModelOptions extends MotionManagerOptions {
    /**
     * Should the internal model be automatically updated by `PIXI.Ticker.shared`.
     * @default ture
     */
    autoUpdate?: boolean;

    /**
     * Should the internal model automatically reacts to interactions by listening for pointer events.
     * @see {@link InteractionMixin}
     * @default true
     */
    autoInteract?: boolean;
}

const tempPoint = new Point();
const tempMatrix = new Matrix();

// a reference to Ticker class, defaults to window.PIXI.Ticker
type TickerClass = typeof Ticker;
let tickerRef: TickerClass | undefined;

export interface Live2DModel<IM extends InternalModel = InternalModel> extends InteractionMixin {}

export type Live2DConstructor = { new(options?: Live2DModelOptions): Live2DModel }

/**
 * A wrapper that allows the Live2D model to be used as a DisplayObject in PixiJS.
 *
 * ```js
 * const model = await Live2DModel.from('shizuku.model.json');
 * container.add(model);
 * ```
 * @emits {@link Live2DModelEvents}
 */
export class Live2DModel<IM extends InternalModel = InternalModel> extends Container {
    /**
     * Creates a Live2DModel from given source.
     * @param source - Can be one of: settings file URL, settings JSON object, ModelSettings instance.
     * @param options - Options for the creation.
     * @return Promise that resolves with the Live2DModel.
     */
    static from<M extends Live2DConstructor = typeof Live2DModel>(this: M, source: string | JSONObject | ModelSettings, options?: Live2DFactoryOptions): Promise<InstanceType<M>> {
        const model = new this(options) as InstanceType<M>;

        return Live2DFactory.setupLive2DModel(model, source, options).then(() => model);
    }

    /**
     * Synchronous version of `Live2DModel.from()`. This method immediately returns a Live2DModel instance,
     * whose resources have not been loaded. Therefore this model can't be manipulated or rendered
     * until the "load" event has been emitted.
     *
     * ```js
     * // no `await` here as it's not a Promise
     * const model = Live2DModel.fromSync('shizuku.model.json');
     *
     * // these will cause errors!
     * // app.stage.addChild(model);
     * // model.motion('tap_body');
     *
     * model.once('load', () => {
     *     // now it's safe
     *     app.stage.addChild(model);
     *     model.motion('tap_body');
     * });
     * ```
     */
    static fromSync<M extends Live2DConstructor = typeof Live2DModel>(this: M, source: string | JSONObject | ModelSettings, options?: Live2DFactoryOptions): InstanceType<M> {
        const model = new this(options) as InstanceType<M>;

        Live2DFactory.setupLive2DModel(model, source, options).then(options?.onLoad).catch(options?.onError);

        return model;
    }

    /**
     * Registers the class of `PIXI.Ticker` for auto updating.
     */
    static registerTicker(tickerClass: TickerClass): void {
        tickerRef = tickerClass;
    }

    /**
     * Tag for logging.
     */
    tag = 'Live2DModel(uninitialized)';

    /**
     * The internal model. Though typed as non-nullable, it'll be undefined until the "ready" event is emitted.
     */
    internalModel!: IM;

    /**
     * Pixi textures.
     */
    textures: Texture[] = [];

    /** @override */
    transform = new Live2DTransform();

    /**
     * The anchor behaves like the one in `PIXI.Sprite`, where `(0, 0)` means the top left
     * and `(1, 1)` means the bottom right.
     */
    anchor = new ObservablePoint(this.onAnchorChange, this, 0, 0) as ObservablePoint<any>; // cast the type because it breaks the casting of Live2DModel

    /**
     * An ID of Gl context that syncs with `renderer.CONTEXT_UID`. Used to check if the GL context has changed.
     */
    protected glContextID = -1;

    /**
     * Elapsed time in milliseconds since created.
     */
    elapsedTime: DOMHighResTimeStamp = performance.now();

    /**
     * Elapsed time in milliseconds from last frame to this frame.
     */
    deltaTime: DOMHighResTimeStamp = 0;

    protected _autoUpdate = false;

    /**
     * Enables automatic updating. Requires {@link Live2DModel.registerTicker} or the global `window.PIXI.Ticker`.
     */
    get autoUpdate() {
        return this._autoUpdate;
    }

    set autoUpdate(autoUpdate: boolean) {
        tickerRef ||= (window as any).PIXI?.Ticker;

        if (autoUpdate) {
            if (!this._destroyed) {
                if (tickerRef) {
                    tickerRef.shared.add(this.onTickerUpdate, this);

                    this._autoUpdate = true;
                } else {
                    logger.warn(this.tag, 'No Ticker registered, please call Live2DModel.registerTicker(Ticker).');
                }
            }
        } else {
            tickerRef?.shared.remove(this.onTickerUpdate, this);

            this._autoUpdate = false;
        }
    }

    constructor(options?: Live2DModelOptions) {
        super();

        this.once('modelLoaded', () => this.init(options));
    }

    // TODO: rename
    /**
     * A handler of the "modelLoaded" event, invoked when the internal model has been loaded.
     */
    protected init(options?: Live2DModelOptions) {
        this.tag = `Live2DModel(${this.internalModel.settings.name})`;

        const _options = Object.assign({
            autoUpdate: true,
            autoInteract: true,
        }, options);

        if (_options.autoInteract) {
            this.interactive = true;
        }

        this.autoInteract = _options.autoInteract;
        this.autoUpdate = _options.autoUpdate;
    }

    /**
     * A callback that observes {@link anchor}, invoked when the anchor's values have been changed.
     */
    protected onAnchorChange(): void {
        this.pivot.set(this.anchor.x * this.internalModel.width, this.anchor.y * this.internalModel.height);
    }

    /**
     * Shorthand to start a motion.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied.
     * @param sound - The audio url to file or base64 content 
     * @param volume - Volume of the sound (0-1) /*new in 1.0.4*
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    motion(group: string, index?: number, priority?: MotionPriority, sound?: string, volume?:number, expression?: number | string): Promise<boolean> {
        return index === undefined
            ? this.internalModel.motionManager.startRandomMotion(group, priority)
            : this.internalModel.motionManager.startMotion(group, index, priority, sound, volume, expression);
    }

    
    /**
     * Stops all playing motions as well as the sound.
     */
    resetMotions(): void {
        return this.internalModel.motionManager.stopAllMotions();
    }


    /**
     * Shorthand to start speaking a sound with an expression. /*new in 1.0.3*
     * @param sound - The audio url to file or base64 content 
     * @param volume - Volume of the sound (0-1) /*new in 1.0.4*
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @returns Promise that resolves with true if the sound is playing, false if it's not
     */
    speak(sound: string, volume?: number, expression?: number | string): Promise<boolean> {
        return this.internalModel.motionManager.speakUp(sound, volume, expression);
    }

    
    /**
     * Stop current audio playback and lipsync
     */
    stopSpeaking(): void {
        return this.internalModel.motionManager.stopSpeaking()
    }

    /**
     * Shorthand to set an expression.
     * @param id - Either the index, or the name of the expression. If not presented, a random expression will be set.
     * @return Promise that resolves with true if succeeded, with false otherwise.
     */
    expression(id?: number | string): Promise<boolean> {
        if (this.internalModel.motionManager.expressionManager) {
            return id === undefined
                ? this.internalModel.motionManager.expressionManager.setRandomExpression()
                : this.internalModel.motionManager.expressionManager.setExpression(id);
        }
        return Promise.resolve(false);
    }

    /**
     * Updates the focus position. This will not cause the model to immediately look at the position,
     * instead the movement will be interpolated.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @param instant - Should the focus position be instantly applied.
     */
    focus(x: number, y: number, instant: boolean = false): void {
        tempPoint.x = x;
        tempPoint.y = y;

        // we can pass `true` as the third argument to skip the update transform
        // because focus won't take effect until the model is rendered,
        // and a model being rendered will always get transform updated
        this.toModelPosition(tempPoint, tempPoint, true);

        let tx = (tempPoint.x / this.internalModel.originalWidth) * 2 - 1
        let ty = (tempPoint.y / this.internalModel.originalHeight) * 2 - 1
        let radian = Math.atan2(ty, tx);
        this.internalModel.focusController.focus(Math.cos(radian), -Math.sin(radian), instant);
    }

    /**
     * Tap on the model. This will perform a hit-testing, and emit a "hit" event
     * if at least one of the hit areas is hit.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @emits {@link Live2DModelEvents.hit}
     */
    tap(x: number, y: number): void {
        const hitAreaNames = this.hitTest(x, y);

        if (hitAreaNames.length) {
            logger.log(this.tag, `Hit`, hitAreaNames);

            this.emit('hit', hitAreaNames);
        }
    }

    /**
     * Hit-test on the model.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @return The names of the *hit* hit areas. Can be empty if none is hit.
     */
    hitTest(x: number, y: number): string[] {
        tempPoint.x = x;
        tempPoint.y = y;
        this.toModelPosition(tempPoint, tempPoint);

        return this.internalModel.hitTest(tempPoint.x, tempPoint.y);
    }

    /**
     * Calculates the position in the canvas of original, unscaled Live2D model.
     * @param position - A Point in world space.
     * @param result - A Point to store the new value. Defaults to a new Point.
     * @param skipUpdate - True to skip the update transform.
     * @return The Point in model canvas space.
     */
    toModelPosition(position: Point, result: Point = position.clone(), skipUpdate?: boolean): Point {
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

        return result;
    }

    /**
     * A method required by `PIXI.InteractionManager` to perform hit-testing.
     * @param point - A Point in world space.
     * @return True if the point is inside this model.
     */
    containsPoint(point: Point): boolean {
        return this.getBounds(true).contains(point.x, point.y);
    }

    /** @override */
    protected _calculateBounds(): void {
        this._bounds.addFrame(this.transform, 0, 0, this.internalModel.width, this.internalModel.height);
    }

    /**
     * An update callback to be added to `PIXI.Ticker` and invoked every tick.
     */
    onTickerUpdate(): void {
        this.update(tickerRef!.shared.deltaMS);
    }

    /**
     * Updates the model. Note this method just updates the timer,
     * and the actual update will be done right before rendering the model.
     * @param dt - The elapsed time in milliseconds since last frame.
     */
    update(dt: DOMHighResTimeStamp): void {
        this.deltaTime += dt;
        this.elapsedTime += dt;

        // don't call `this.internalModel.update()` here, because it requires WebGL context
    }

    override _render(renderer: Renderer): void {
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
            // and therefore we always bind the texture at this moment no matter what
            this.internalModel.bindTexture(i, (texture.baseTexture as any)._glTextures[this.glContextID].texture);

            // manually update the GC counter so they won't be GCed while using this model
            (texture.baseTexture as any).touched = renderer.textureGC.count;
        }

        const viewport = (renderer.framebuffer as any).viewport as Rectangle;
        this.internalModel.viewport = [viewport.x, viewport.y, viewport.width, viewport.height];

        // update only if the time has changed, as the model will possibly be updated once but rendered multiple times
        if (this.deltaTime) {
            this.internalModel.update(this.deltaTime, this.elapsedTime);
            this.deltaTime = 0;
        }

        const internalTransform = tempMatrix
            .copyFrom(renderer.globalUniforms.uniforms.projectionMatrix)
            .append(this.worldTransform);

        this.internalModel.updateTransform(internalTransform);
        this.internalModel.draw(renderer.gl);

        // reset WebGL state and texture bindings
        renderer.state.reset();
        renderer.texture.reset();
    }

    /**
     * Destroys the model and all related resources. This takes the same options and also
     * behaves the same as `PIXI.Container#destroy`.
     * @param options - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param [options.children=false] - if set to true, all the children will have their destroy
     *  method called as well. 'options' will be passed on to those calls.
     * @param [options.texture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the texture of the child sprite
     * @param [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the base texture of the child sprite
     */
    destroy(options?: { children?: boolean, texture?: boolean, baseTexture?: boolean }): void {
        this.emit('destroy');

        // the setters will do the cleanup
        this.autoUpdate = false;

        this.unregisterInteraction();

        if (options?.texture) {
            this.textures.forEach(texture => texture.destroy(options.baseTexture));
        }

        this.internalModel.destroy();

        super.destroy(options);
    }
}

applyMixins(Live2DModel, [InteractionMixin]);
