import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '@/cubism-common/constants';
import { FocusController } from '@/cubism-common/FocusController';
import { ModelSettings } from '@/cubism-common/ModelSettings';
import { MotionManager, MotionManagerOptions } from '@/cubism-common/MotionManager';
import { Matrix } from '@pixi/math';
import { EventEmitter } from '@pixi/utils';

/**
 * Common layout definition shared between all Cubism versions.
 */
export interface CommonLayout {
    centerX?: number;
    centerY?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}

/**
 * Common hit area definition shared between all Cubism versions.
 */
export interface CommonHitArea {
    id: string;
    name: string;
    index: number;
}

export interface Bounds {
    left: number
    right: number
    top: number
    bottom: number
}

export interface InternalModelOptions extends MotionManagerOptions {}

/**
 * A wrapper that manages the states of a Live2D core model, and delegates all operations to it.
 * @emits {@link InternalModelEvents}
 */
export abstract class InternalModel extends EventEmitter {
    /**
     * The managed Live2D core model.
     */
    abstract readonly coreModel: object;

    abstract readonly settings: ModelSettings;

    focusController = new FocusController();

    abstract motionManager: MotionManager;

    pose?: any;
    physics?: any;

    /**
     * Original canvas width of the model. Note this doesn't represent the model's real size,
     * as the model can overflow from its canvas.
     */
    readonly originalWidth: number = 0;

    /**
     * Original canvas height of the model. Note this doesn't represent the model's real size,
     * as the model can overflow from its canvas.
     */
    readonly originalHeight: number = 0;

    /**
     * Canvas width of the model, scaled by the `width` of the model's layout.
     */
    readonly width: number = 0;

    /**
     * Canvas height of the model, scaled by the `height` of the model's layout.
     */
    readonly height: number = 0;

    /**
     * Local transformation, calculated from the model's layout.
     */
    localTransform = new Matrix();

    /**
     * The final matrix to draw the model.
     */
    drawingMatrix = new Matrix();

    // TODO: change structure
    /**
     * The hit area definitions, keyed by their names.
     */
    hitAreas: Record<string, CommonHitArea> = {};

    /**
     * Flags whether `gl.UNPACK_FLIP_Y_WEBGL` should be enabled when binding the textures.
     */
    textureFlipY = false;

    /**
     * WebGL viewport when drawing the model. The format is `[x, y, width, height]`.
     */
    viewport: [number, number, number, number] = [0, 0, 0, 0];

    /**
     * Should be called in the constructor of derived class.
     */
    protected init() {
        this.setupLayout();
        this.setupHitAreas();
    }

    /**
     * Sets up the model's size and local transform by the model's layout.
     */
    protected setupLayout() {
        // cast `this` to be mutable
        const self = this as Mutable<this>;

        const size = this.getSize();

        self.originalWidth = size[0];
        self.originalHeight = size[1];

        const layout = Object.assign(
            {
                width: LOGICAL_WIDTH,
                height: LOGICAL_HEIGHT,
            },
            this.getLayout(),
        );

        this.localTransform.scale(layout.width / LOGICAL_WIDTH, layout.height / LOGICAL_HEIGHT);

        self.width = this.originalWidth * this.localTransform.a;
        self.height = this.originalHeight * this.localTransform.d;

        // this calculation differs from Live2D SDK...
        const offsetX = (layout.x !== undefined && layout.x - layout.width / 2)
            || (layout.centerX !== undefined && layout.centerX)
            || (layout.left !== undefined && layout.left - layout.width / 2)
            || (layout.right !== undefined && layout.right + layout.width / 2)
            || 0;

        const offsetY = (layout.y !== undefined && layout.y - layout.height / 2)
            || (layout.centerY !== undefined && layout.centerY)
            || (layout.top !== undefined && layout.top - layout.height / 2)
            || (layout.bottom !== undefined && layout.bottom + layout.height / 2)
            || 0;

        this.localTransform.translate(this.width * offsetX, -this.height * offsetY);
    }

    /**
     * Sets up the hit areas by their definitions in settings.
     */
    protected setupHitAreas() {
        const definitions = this.getHitAreaDefs().filter(hitArea => hitArea.index >= 0);

        for (const def of definitions) {
            this.hitAreas[def.name] = def;
        }
    }

    /**
     * Hit-test on the model.
     * @param x - Position in model canvas.
     * @param y - Position in model canvas.
     * @return The names of the *hit* hit areas. Can be empty if none is hit.
     */
    hitTest(x: number, y: number): string[] {
        return Object.keys(this.hitAreas).filter(hitAreaName => this.isHit(hitAreaName, x, y));
    }

    /**
     * Hit-test for a single hit area.
     * @param hitAreaName - The hit area's name.
     * @param x - Position in model canvas.
     * @param y - Position in model canvas.
     * @return True if hit.
     */
    isHit(hitAreaName: string, x: number, y: number): boolean {
        if (!this.hitAreas[hitAreaName]) {
            return false;
        }

        const drawIndex = this.hitAreas[hitAreaName]!.index;

        const bounds = this.getDrawableBounds(drawIndex);

        return bounds.left <= x && x <= bounds.right && bounds.top <= y && y <= bounds.bottom;
    }

    // TODO: bounds parameter
    /**
     * Gets a drawable's bounds.
     * @param index - Index of the drawable.
     * @return The bounds in model canvas space.
     */
    getDrawableBounds(index: number): Bounds {
        const vertices = this.getDrawableVertices(index);

        let left = vertices[0]!;
        let right = vertices[0]!;
        let top = vertices[1]!;
        let bottom = vertices[1]!;

        for (let i = 0; i < vertices.length; i += 2) {
            const vx = vertices[i]!;
            const vy = vertices[i + 1]!;

            left = Math.min(vx, left);
            right = Math.max(vx, right);
            top = Math.min(vy, top);
            bottom = Math.max(vy, bottom);
        }

        return { left, right, top, bottom };
    }

    /**
     * Updates the model's transform.
     * @param transform - The world transform.
     */
    updateTransform(transform: Matrix) {
        this.drawingMatrix.copyFrom(transform).append(this.localTransform);
    }

    /**
     * Updates the model's parameters.
     * @param dt - Elapsed time in milliseconds from last frame.
     * @param now - Current time in milliseconds.
     */
    update(dt: DOMHighResTimeStamp, now: DOMHighResTimeStamp): void {
        this.focusController.update(dt);
    };

    /**
     * Destroys the model and all related resources.
     * @emits {@link InternalModelEvents.destroy | destroy}
     */
    destroy() {
        this.motionManager.destroy();
        (this as Partial<this>).motionManager = undefined;

        // TODO: emit before destroy
        this.emit('destroy');
    }

    /**
     * Gets all the hit area definitions.
     * @return Normalized definitions.
     */
    protected abstract getHitAreaDefs(): CommonHitArea[];

    /**
     * Gets the model's original canvas size.
     * @return `[width, height]`
     */
    protected abstract getSize(): [number, number];

    /**
     * Gets the layout definition.
     * @return Normalized definition.
     */
    protected abstract getLayout(): CommonLayout;

    /**
     * Gets all the drawables' IDs.
     * @return IDs.
     */
    abstract getDrawableIDs(): string[];

    /**
     * Finds the index of a drawable by its ID.
     * @return The index.
     */
    abstract getDrawableIndex(id: string): number;

    /**
     * Gets a drawable's vertices.
     * @param index - Either the index or the ID of the drawable.
     * @throws Error when the drawable cannot be found.
     */
    abstract getDrawableVertices(index: number | string): Float32Array;

    /**
     * Updates WebGL context bound to this model.
     * @param gl - WebGL context.
     * @param glContextID - Unique ID for given WebGL context.
     */
    abstract updateWebGLContext(gl: WebGLRenderingContext, glContextID: number): void;

    /**
     * Binds a texture to the model. The index must be the same as that of this texture
     * in the {@link ModelSettings.textures} array.
     */
    abstract bindTexture(index: number, texture: WebGLTexture): void;

    /**
     * Draws the model.
     */
    abstract draw(gl: WebGLRenderingContext): void;
}
