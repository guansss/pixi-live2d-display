import { NormalizedLayoutDefinition, SuperModel } from '@/cubism-common/SuperModel';
import { Matrix } from '@pixi/math';
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
export class Live2DInternalModel extends SuperModel<Live2DModelWebGL, Cubism2ModelSettings, Cubism2MotionManager> {
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

    constructor(model: Live2DModelWebGL, modelSettings: Cubism2ModelSettings) {
        super(model, modelSettings, new Cubism2MotionManager(model, modelSettings));

        this.eyeBlink = new Live2DEyeBlink(model);

        if (modelSettings.initParams) {
            modelSettings.initParams.forEach(({ id, value }) => model.setParamFloat(id, value));
        }
        if (modelSettings.initOpacities) {
            modelSettings.initOpacities.forEach(({ id, value }) => model.setPartsOpacity(id, value));
        }

        model.saveParam();

        this.eyeballXParamIndex = model.getParamIndex('PARAM_EYE_BALL_X');
        this.eyeballYParamIndex = model.getParamIndex('PARAM_EYE_BALL_Y');
        this.angleXParamIndex = model.getParamIndex('PARAM_ANGLE_X');
        this.angleYParamIndex = model.getParamIndex('PARAM_ANGLE_Y');
        this.angleZParamIndex = model.getParamIndex('PARAM_ANGLE_Z');
        this.bodyAngleXParamIndex = model.getParamIndex('PARAM_BODY_ANGLE_X');
        this.breathParamIndex = model.getParamIndex('PARAM_BREATH');
    }

    protected getSize(): [number, number] {
        return [this.model.getCanvasWidth(), this.model.getCanvasHeight()];
    }

    protected getLayout(): NormalizedLayoutDefinition {
        const layout = this.modelSettings.layout || {};

        return {
            ...layout,
            centerX: layout.center_x,
            centerY: layout.center_y,
        };
    }

    /** @override */
    updateWebGLContext(gl: WebGLRenderingContext, glContextID: number): void {
        const drawParamWebGL = this.model.drawParamWebGL;

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
        const clipManager = this.model.getModelContext().clipManager;
        clipManager.curFrameNo = glContextID;
        clipManager.getMaskRenderTexture();
    }

    /** @override */
    bindTexture(index: number, texture: WebGLTexture): void {
        this.model.setTexture(index, texture);
    }

    /** @override */
    hitTest(x: number, y: number): string[] {
        if (this.model && this.modelSettings.hitAreas) {
            return this.modelSettings.hitAreas
                .filter(({ name, id }) => {
                    const drawIndex = this.model.getDrawDataIndex(id);

                    if (drawIndex >= 0) {
                        const points = this.model.getTransformedPoints(drawIndex);
                        let left = this.originalWidth;
                        let right = 0;
                        let top = this.originalHeight;
                        let bottom = 0;

                        for (let i = 0; i < points.length; i += 2) {
                            const px = points[i];
                            const py = points[i + 1];

                            if (px < left) left = px;
                            if (px > right) right = px;
                            if (py < top) top = py;
                            if (py > bottom) bottom = py;
                        }

                        return left <= x && x <= right && top <= y && y <= bottom;
                    }
                })
                .map(hitArea => hitArea.name);
        }

        return [];
    }

    update(dt: DOMHighResTimeStamp, now: DOMHighResTimeStamp): void {
        const model = this.model;

        model.loadParam();

        const updated = this.motionManager.update(this.model, dt);
        if (!updated) {
            this.eyeBlink.update(dt);
        }

        model.saveParam();

        // update focus and natural movements
        this.focusController.update(dt);
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

        this.physics && this.physics.update(now);
        this.pose && this.pose.update(dt);

        model.update();
    }

    draw(matrix: Matrix): void {
        // set given 3x3 matrix into a 4x4 matrix, with Y inverted
        tempMatrixArray[0] = matrix.a;
        tempMatrixArray[1] = -matrix.c;
        tempMatrixArray[4] = matrix.b;
        tempMatrixArray[5] = -matrix.d;
        tempMatrixArray[12] = matrix.tx;
        tempMatrixArray[13] = -matrix.ty;

        this.model.setMatrix(tempMatrixArray);
        this.model.draw();
    }
}
