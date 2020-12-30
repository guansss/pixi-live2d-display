import { InternalModelOptions } from '@/cubism-common';
import { CommonHitArea, CommonLayout, InternalModel } from '@/cubism-common/InternalModel';
import { Cubism2ModelSettings } from './Cubism2ModelSettings';
import { Cubism2MotionManager } from './Cubism2MotionManager';
import { Live2DEyeBlink } from './Live2DEyeBlink';
import { Live2DPhysics } from './Live2DPhysics';
import { Live2DPose } from './Live2DPose';

// prettier-ignore
const tempMatrixArray = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]);

/**
 * A wrapper of core model, which is `Live2DModelWebGL` from Live2D runtime library.
 */
export class Cubism2InternalModel extends InternalModel {
    settings: Cubism2ModelSettings;

    coreModel: Live2DModelWebGL;
    motionManager: Cubism2MotionManager;

    eyeBlink: Live2DEyeBlink;
    physics?: Live2DPhysics;
    pose?: Live2DPose;

    /**
     * Live2D parameter index, cached for better performance.
     */
    eyeballXParamIndex: number;
    eyeballYParamIndex: number;
    angleXParamIndex: number;
    angleYParamIndex: number;
    angleZParamIndex: number;
    bodyAngleXParamIndex: number;
    breathParamIndex: number;

    textureFlipY = true;

    constructor(coreModel: Live2DModelWebGL, settings: Cubism2ModelSettings, options?: InternalModelOptions) {
        super();

        this.coreModel = coreModel;
        this.settings = settings;
        this.motionManager = new Cubism2MotionManager(settings, options);
        this.eyeBlink = new Live2DEyeBlink(coreModel);

        this.eyeballXParamIndex = coreModel.getParamIndex('PARAM_EYE_BALL_X');
        this.eyeballYParamIndex = coreModel.getParamIndex('PARAM_EYE_BALL_Y');
        this.angleXParamIndex = coreModel.getParamIndex('PARAM_ANGLE_X');
        this.angleYParamIndex = coreModel.getParamIndex('PARAM_ANGLE_Y');
        this.angleZParamIndex = coreModel.getParamIndex('PARAM_ANGLE_Z');
        this.bodyAngleXParamIndex = coreModel.getParamIndex('PARAM_BODY_ANGLE_X');
        this.breathParamIndex = coreModel.getParamIndex('PARAM_BREATH');

        this.init();
    }

    protected init() {
        super.init();

        if (this.settings.initParams) {
            this.settings.initParams.forEach(({ id, value }) => this.coreModel.setParamFloat(id, value));
        }
        if (this.settings.initOpacities) {
            this.settings.initOpacities.forEach(({ id, value }) => this.coreModel.setPartsOpacity(id, value));
        }

        this.coreModel.saveParam();
    }

    protected getSize(): [number, number] {
        return [this.coreModel.getCanvasWidth(), this.coreModel.getCanvasHeight()];
    }

    protected getLayout(): CommonLayout {
        const layout = this.settings.layout || {};

        return {
            ...layout,
            centerX: layout.center_x,
            centerY: layout.center_y,
        };
    }

    /** @override */
    updateWebGLContext(gl: WebGLRenderingContext, glContextID: number): void {
        const drawParamWebGL = this.coreModel.drawParamWebGL;

        drawParamWebGL.firstDraw = true;
        drawParamWebGL.setGL(gl);
        drawParamWebGL.glno = glContextID;

        // reset WebGL buffers
        for (const prop in drawParamWebGL) {
            if (drawParamWebGL.hasOwnProperty(prop) && (drawParamWebGL as any)[prop] instanceof WebGLBuffer) {
                (drawParamWebGL as any)[prop] = null;
            }
        }

        // a temporary workaround for the frame buffers bound to WebGL context in Live2D
        const clipManager = this.coreModel.getModelContext().clipManager;
        clipManager.curFrameNo = glContextID;
        clipManager.getMaskRenderTexture();
    }

    /** @override */
    bindTexture(index: number, texture: WebGLTexture): void {
        this.coreModel.setTexture(index, texture);
    }

    protected getHitAreaDefs(): CommonHitArea[] {
        return this.settings.hitAreas?.map(hitArea => ({
            id: hitArea.id,
            name: hitArea.name,
            index: this.coreModel.getDrawDataIndex(hitArea.id),
        })) || [];
    }

    getHitAreaVertices(drawIndex: number): Float32Array {
        return this.coreModel.getTransformedPoints(drawIndex).slice(0);
    }

    update(dt: DOMHighResTimeStamp, now: DOMHighResTimeStamp): void {
        super.update(dt, now);

        const model = this.coreModel;

        model.loadParam();

        const updated = this.motionManager.update(this.coreModel, now);
        if (!updated) {
            this.eyeBlink.update(dt);
        }

        model.saveParam();

        const focusX = this.focusController.x;
        const focusY = this.focusController.y;
        const t = (now / 1000) * 2 * Math.PI;
        model.addToParamFloat(this.eyeballXParamIndex, focusX);
        model.addToParamFloat(this.eyeballYParamIndex, focusY);
        model.addToParamFloat(this.angleXParamIndex, focusX * 30 + 15 * Math.sin(t / 6.5345) * 0.5);
        model.addToParamFloat(this.angleYParamIndex, focusY * 30 + 8 * Math.sin(t / 3.5345) * 0.5);
        model.addToParamFloat(this.angleZParamIndex, focusX * focusY * -30 + 10 * Math.sin(t / 5.5345) * 0.5);
        model.addToParamFloat(this.bodyAngleXParamIndex, focusX * 10 + 4 * Math.sin(t / 15.5345) * 0.5);
        model.setParamFloat(this.breathParamIndex, 0.5 + 0.5 * Math.sin(t / 3.2345));

        this.physics?.update(now);
        this.pose?.update(dt);

        model.update();
    }

    draw(gl: WebGLRenderingContext): void {
        const matrix = this.drawingMatrix;

        // set given 3x3 matrix into a 4x4 matrix, with Y inverted
        tempMatrixArray[0] = matrix.a;
        tempMatrixArray[1] = matrix.b;
        tempMatrixArray[4] = matrix.c;
        tempMatrixArray[5] = matrix.d;
        tempMatrixArray[12] = matrix.tx;
        tempMatrixArray[13] = matrix.ty;

        this.coreModel.setMatrix(tempMatrixArray);
        this.coreModel.draw();
    }

    release() {
        this.motionManager.release();

        (this as Partial<this>).motionManager = undefined;

        // cubism2 core has a super dumb memory management so there's basically nothing much to do to release the model
        (this as Partial<this>).coreModel = undefined;
    }
}
