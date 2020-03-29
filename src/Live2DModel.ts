import { Renderer, Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { InteractionEvent } from '@pixi/interaction';
import { ObservablePoint, Point } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { fromModelSettings, fromModelSettingsFile, fromModelSettingsJSON, fromResources } from './factory';
import { Live2DInternalModel } from './live2d/Live2DInternalModel';
import Live2DTransform from './Live2DTransform';
import { log } from './utils/log';
import { clamp } from './utils/math';

// for temporarily use
const _point = new Point();

export class Live2DModel extends Container {
    tag: string;

    textures: Texture[] = [];

    transform: Live2DTransform; // override the type

    anchor = new ObservablePoint(this.onAnchorChange, this, 0, 0);

    highlightCover?: Sprite;

    glContextID = -1;

    currentTime = performance.now();
    deltaTime = 0;

    static fromModelSettingsFile = fromModelSettingsFile;
    static fromModelSettingsJSON = fromModelSettingsJSON;
    static fromModelSettings = fromModelSettings;
    static fromResources = fromResources;

    constructor(readonly internal: Live2DInternalModel) {
        super();

        this.tag = `Live2DModel(${internal.modelSettings.name})`;

        this.transform = new Live2DTransform(internal);

        this.on('tap', (event: InteractionEvent) => this.tap(event.data.global.x, event.data.global.y));
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
     * Makes the model focus on a point.
     *
     * @param x - The x position in world space.
     * @param y - The y position in world space.
     */
    focus(x: number, y: number) {
        _point.x = x;
        _point.y = y;

        // the update transform can be skipped because the focus won't take effect until model is rendered,
        //  and a model being rendered will always get transform updated
        this.toModelPosition(_point, _point, true);

        this.internal.focusController.focus(
            clamp((_point.x / this.internal.originalWidth) * 2 - 1, -1, 1),
            -clamp((_point.y / this.internal.originalHeight) * 2 - 1, -1, 1),
        );
    }

    /**
     * @event Live2DModel#hit
     * @param {string[]} hitAreaNames - The names of hit Live2D hit areas.
     */

    /**
     * Performs tap action on sprite.
     *
     * @param x - The x position in world space.
     * @param y - The y position in world space.
     *
     * @fires Live2DModel#hit
     */
    tap(x: number, y: number) {
        _point.x = x;
        _point.y = y;
        this.toModelPosition(_point, _point);

        const hitAreaNames = this.internal.hitTest(_point.x, _point.y);

        if (hitAreaNames.length) {
            log(this.tag, `Hit`, hitAreaNames);

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

    protected _calculateBounds() {
        this._bounds.addFrame(this.transform, 0, 0, this.internal.width, this.internal.height);
    }

    update(dt: DOMHighResTimeStamp) {
        this.deltaTime = dt;
        this.currentTime += dt;

        // don't call update() on internal model here, because it requires WebGL context
    }

    protected _render(renderer: Renderer) {
        // reset certain systems in renderer to make Live2D's drawing system compatible with Pixi
        renderer.batch.reset();
        renderer.geometry.reset();
        renderer.shader.reset();
        renderer.state.reset();

        // when the WebGL context has changed
        if (this.glContextID !== (renderer as any).CONTEXT_UID) {
            this.glContextID = (renderer as any).CONTEXT_UID;

            this.internal.updateWebGLContext(renderer.gl, this.glContextID);

            for (let i = 0; i < this.textures.length; i++) {
                const baseTexture = this.textures[i].baseTexture;

                const flipY = renderer.gl.getParameter(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL);

                // let TextureSystem generate corresponding WebGLTexture. The binding location is not important
                renderer.gl.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, true);
                renderer.texture.bind(baseTexture, 0);
                renderer.gl.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, flipY);

                // bind the WebGLTexture generated by TextureSystem
                // kind of ugly but it does the trick :/
                this.internal.bindTexture(i, (baseTexture as any)._glTextures[(renderer as any).CONTEXT_UID].texture);
            }
        }

        for (const texture of this.textures) {
            // manually update the GC counter so they won't be GCed
            (texture.baseTexture as any).touched = renderer.textureGC.count;
        }

        this.internal.update(this.deltaTime, this.currentTime);
        this.deltaTime = 0;

        this.internal.draw(this.transform.getDrawingMatrix(renderer.gl));

        // reset the active texture that has been changed by Live2D's drawing system
        renderer.gl.activeTexture(WebGLRenderingContext.TEXTURE0 + renderer.texture.currentLocation);
    }
}
