import { Matrix } from '@pixi/math';
import FocusController from './FocusController';
import Live2DEyeBlink from './Live2DEyeBlink';
import Live2DPhysics from './Live2DPhysics';
import Live2DPose from './Live2DPose';
import ModelSettings from './ModelSettings';
import MotionManager from './MotionManager';

export const LOGICAL_WIDTH = 2;
export const LOGICAL_HEIGHT = 2;

// prettier-ignore
const tempMatrixArray = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]);

export class Live2DInternalModel {
    motionManager: MotionManager;

    eyeBlink: Live2DEyeBlink;
    physics?: Live2DPhysics;
    pose?: Live2DPose;

    readonly originalWidth: number;
    readonly originalHeight: number;

    readonly width: number;
    readonly height: number;

    matrix = new Matrix();

    focusController = new FocusController();

    eyeballXParamIndex: number;
    eyeballYParamIndex: number;
    angleXParamIndex: number;
    angleYParamIndex: number;
    angleZParamIndex: number;
    bodyAngleXParamIndex: number;
    breathParamIndex: number;

    constructor(readonly coreModel: Live2DModelWebGL, readonly modelSettings: ModelSettings) {
        this.motionManager = new MotionManager(coreModel, modelSettings);
        this.eyeBlink = new Live2DEyeBlink(coreModel);

        const layout = Object.assign(
            {
                width: LOGICAL_WIDTH,
                height: LOGICAL_HEIGHT,
            },
            modelSettings.layout,
        );

        this.originalWidth = coreModel.getCanvasWidth();
        this.originalHeight = coreModel.getCanvasHeight();

        this.matrix.scale(layout.width / LOGICAL_WIDTH, layout.height / LOGICAL_HEIGHT);

        this.width = this.originalWidth * this.matrix.a;
        this.height = this.originalHeight * this.matrix.d;

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

        if (modelSettings.initParams) {
            modelSettings.initParams.forEach(({ id, value }) => coreModel.setParamFloat(id, value));
        }
        if (modelSettings.initOpacities) {
            modelSettings.initOpacities.forEach(({ id, value }) => coreModel.setPartsOpacity(id, value));
        }

        coreModel.saveParam();

        this.eyeballXParamIndex = coreModel.getParamIndex('PARAM_EYE_BALL_X');
        this.eyeballYParamIndex = coreModel.getParamIndex('PARAM_EYE_BALL_Y');
        this.angleXParamIndex = coreModel.getParamIndex('PARAM_ANGLE_X');
        this.angleYParamIndex = coreModel.getParamIndex('PARAM_ANGLE_Y');
        this.angleZParamIndex = coreModel.getParamIndex('PARAM_ANGLE_Z');
        this.bodyAngleXParamIndex = coreModel.getParamIndex('PARAM_BODY_ANGLE_X');
        this.breathParamIndex = coreModel.getParamIndex('PARAM_BREATH');
    }

    bindTexture(index: number, texture: WebGLTexture) {
        this.coreModel.setTexture(index, texture);
    }

    /**
     * Hit test on model.
     *
     * @param x - The x position in model canvas.
     * @param y - The y position in model canvas.
     *
     * @returns The names of hit areas that have passed the test.
     */
    hitTest(x: number, y: number): string[] {
        if (this.coreModel && this.modelSettings.hitAreas) {
            return this.modelSettings.hitAreas
                .filter(({ name, id }) => {
                    const drawIndex = this.coreModel.getDrawDataIndex(id);

                    if (drawIndex >= 0) {
                        const points = this.coreModel.getTransformedPoints(drawIndex);
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

    update(dt: DOMHighResTimeStamp, now: DOMHighResTimeStamp) {
        const model = this.coreModel;

        model.loadParam();

        const updated = this.motionManager.update();
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

    draw(matrix: Matrix) {
        // set given 3x3 matrix into a 4x4 matrix, with Y inverted
        tempMatrixArray[0] = matrix.a;
        tempMatrixArray[1] = -matrix.c;
        tempMatrixArray[4] = matrix.b;
        tempMatrixArray[5] = -matrix.d;
        tempMatrixArray[12] = matrix.tx;
        tempMatrixArray[13] = -matrix.ty;

        this.coreModel.setMatrix(tempMatrixArray);
        this.coreModel.draw();
    }
}
