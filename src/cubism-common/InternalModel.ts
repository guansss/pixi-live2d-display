import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '@/cubism-common/constants';
import { FocusController } from '@/cubism-common/FocusController';
import { ModelSettings } from '@/cubism-common/ModelSettings';
import { MotionManager } from '@/cubism-common/MotionManager';
import { Cubism2InternalModel } from '@/cubism2/Cubism2InternalModel';
import { Cubism4InternalModel } from '@/cubism4/Cubism4InternalModel';
import { Matrix } from '@pixi/math';
import { EventEmitter } from '@pixi/utils';

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

export interface CommonHitArea {
    id: string;
    name: string;
    index: number;
}

// just for convenience, by declaring this we can get rid of the hell of generics
export interface DerivedInternalModelSet {
    cubism2: Cubism2InternalModel;
    cubism4: Cubism4InternalModel;
}

export type DerivedInternalModel = DerivedInternalModelSet[keyof DerivedInternalModelSet]

export abstract class InternalModel<Model = any, DerivedModelSettings extends ModelSettings = ModelSettings, DerivedMotionManager extends MotionManager<Model> = MotionManager<Model>> extends EventEmitter {
    coreModel: Model;

    readonly settings: DerivedModelSettings;

    readonly motionManager: DerivedMotionManager;

    /**
     * Original width of model canvas.
     */
    readonly originalWidth: number = 0;

    /**
     * Original height of model canvas.
     */
    readonly originalHeight: number = 0;

    /**
     * Width of model canvas, scaled by `width` in {@link Cubism2ModelSettings#layout}.
     */
    readonly width: number = 0;

    /**
     * Width of model canvas, scaled by `height` in {@link Cubism2ModelSettings#layout}.
     */
    readonly height: number = 0;

    /**
     * Transformation matrix, calculated from the model's layout.
     */
    matrix = new Matrix();

    focusController = new FocusController();

    hitAreas: Record<string, CommonHitArea> = {};

    protected constructor(model: Model, settings: DerivedModelSettings, motionManager: DerivedMotionManager) {
        super();
        this.coreModel = model;
        this.settings = settings;
        this.motionManager = motionManager;

        this.init();
    }

    protected init() {
        this.setupLayout();
        this.setupHitAreas();
    }

    protected setupLayout(): void {
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

        this.matrix.scale(layout.width / LOGICAL_WIDTH, layout.height / LOGICAL_HEIGHT);

        self.width = this.originalWidth * this.matrix.a;
        self.height = this.originalHeight * this.matrix.d;

        // multiply the offset by model's width and height, this calculation differs from Live2D SDK
        this.matrix.translate(
            this.width *
            ((layout.x !== undefined && layout.x - layout.width / 2) ||
                (layout.centerX !== undefined && layout.centerX) ||
                (layout.left !== undefined && layout.left - layout.width / 2) ||
                (layout.right !== undefined && layout.right + layout.width / 2) ||
                0),
            -this.height *
            ((layout.y !== undefined && layout.y - layout.height / 2) ||
                (layout.centerY !== undefined && layout.centerY) ||
                (layout.top !== undefined && layout.top - layout.height / 2) ||
                (layout.bottom !== undefined && layout.bottom + layout.height / 2) ||
                0),
        );
    }

    protected setupHitAreas() {
        const definitions = this.getHitAreaDefs().filter(hitArea => hitArea.index >= 0);

        for (const def of definitions) {
            this.hitAreas[def.name] = def;
        }
    }

    /**
     * Hit test on model.
     * @param x - Position in model canvas.
     * @param y - Position in model canvas.
     * @return The hit hit areas.
     */
    hitTest(x: number, y: number): string[] {
        return Object.keys(this.hitAreas).filter(hitAreaName => this.isHit(hitAreaName, x, y));
    }

    isHit(hitAreaName: string, x: number, y: number): boolean {
        if (!this.hitAreas[hitAreaName]) {
            return false;
        }

        const vertices = this.getHitArea(this.hitAreas[hitAreaName]!.index);

        let left = this.originalWidth;
        let right = 0;
        let top = this.originalHeight;
        let bottom = 0;

        for (let i = 0; i < vertices.length; i += 2) {
            const vx = vertices[i]!;
            const vy = vertices[i + 1]!;

            left = Math.min(vx, left);
            right = Math.max(vx, right);
            top = Math.min(vy, top);
            bottom = Math.max(vy, bottom);
        }

        return left <= x && x <= right && top <= y && y <= bottom;
    }

    update(dt: DOMHighResTimeStamp, now: DOMHighResTimeStamp): void {
        this.focusController.update(dt);
    };

    destroy() {
        this.emit('destroy');
        this.motionManager.destroy();
    }

    abstract getHitArea(drawIndex: number): ArrayLike<number>;

    /**
     * Updates GL context when it's changed.
     * @param gl
     * @param glContextID - Unique ID of given Gl context.
     */
    abstract updateWebGLContext(gl: WebGLRenderingContext, glContextID: number): void;

    /**
     * Binds a texture to core model. The index must be the same as the index of this texture
     * in {@link Cubism2ModelSettings#textures}
     * @param index
     * @param texture
     */
    abstract bindTexture(index: number, texture: WebGLTexture): void;

    abstract draw(matrix: Matrix): void;

    protected abstract getHitAreaDefs(): CommonHitArea[];

    protected abstract getSize(): [number, number];

    protected abstract getLayout(): CommonLayout;
}
