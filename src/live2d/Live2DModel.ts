import FocusController from '@/live2d/FocusController';
import Live2DEyeBlink from '@/live2d/Live2DEyeBlink';
import { loadModel, loadModelSettings, loadPhysics, loadPose } from '@/live2d/Live2DLoader';
import Live2DPhysics from '@/live2d/Live2DPhysics';
import Live2DPose from '@/live2d/Live2DPose';
import ModelSettings from '@/live2d/ModelSettings';
import MotionManager from '@/live2d/MotionManager';
import { log } from '@/core/utils/log';
import { randomID } from '@/core/utils/string';
import { Matrix } from '@pixi/math';

export const LOGICAL_WIDTH = 2;
export const LOGICAL_HEIGHT = 2;

// prettier-ignore
const tempMatrixArray = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]);

export default class Live2DModel {
    tag = 'Live2DModel(uninitialized)';

    name: string;
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

    static async create(file: string | string[]) {
        let modelSettingsFile: string | undefined;
        let modelSettings: ModelSettings | undefined;

        if (typeof file === 'string') {
            modelSettingsFile = file;
        } else if (Array.isArray(file)) {
            // check if there is already a model settings file in folder
            modelSettingsFile = file.find(f => f.endsWith('.model.json'));

            if (!modelSettingsFile) {
                modelSettings = ModelSettings.fromFolder(file);
            }
        } else {
            throw 'Invalid source.';
        }

        if (modelSettingsFile) {
            modelSettings = await loadModelSettings(modelSettingsFile);

            if (!modelSettings) {
                throw `Failed to load model settings from "${modelSettingsFile}"`;
            }
        }

        const internalModel = await loadModel(modelSettings!.model);

        return new Live2DModel(internalModel!, modelSettings!);
    }

    private constructor(readonly internalModel: Live2DModelWebGL, public modelSettings: ModelSettings) {
        this.name = modelSettings.name || randomID();
        this.tag = `Live2DModel\n(${this.name})`;

        this.motionManager = new MotionManager(
            this.name,
            internalModel,
            modelSettings.motions,
            modelSettings.expressions,
        );
        this.eyeBlink = new Live2DEyeBlink(internalModel);

        if (modelSettings.pose) {
            loadPose(modelSettings.pose, internalModel)
                .then(pose => (this.pose = pose))
                .catch(e => log(this.tag, e));
        }

        if (modelSettings.physics) {
            loadPhysics(modelSettings.physics, internalModel)
                .then(physics => (this.physics = physics))
                .catch(e => log(this.tag, e));
        }

        const layout = Object.assign(
            {
                width: LOGICAL_WIDTH,
                height: LOGICAL_HEIGHT,
            },
            modelSettings.layout,
        );

        this.originalWidth = internalModel.getCanvasWidth();
        this.originalHeight = internalModel.getCanvasHeight();

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
            modelSettings.initParams.forEach(({ id, value }) => internalModel.setParamFloat(id, value));
        }
        if (modelSettings.initOpacities) {
            modelSettings.initOpacities.forEach(({ id, value }) => internalModel.setPartsOpacity(id, value));
        }

        internalModel.saveParam();

        this.eyeballXParamIndex = internalModel.getParamIndex('PARAM_EYE_BALL_X');
        this.eyeballYParamIndex = internalModel.getParamIndex('PARAM_EYE_BALL_Y');
        this.angleXParamIndex = internalModel.getParamIndex('PARAM_ANGLE_X');
        this.angleYParamIndex = internalModel.getParamIndex('PARAM_ANGLE_Y');
        this.angleZParamIndex = internalModel.getParamIndex('PARAM_ANGLE_Z');
        this.bodyAngleXParamIndex = internalModel.getParamIndex('PARAM_BODY_ANGLE_X');
        this.breathParamIndex = internalModel.getParamIndex('PARAM_BREATH');
    }

    bindTexture(index: number, texture: WebGLTexture) {
        this.internalModel.setTexture(index, texture);
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
        if (this.internalModel && this.modelSettings.hitAreas) {
            return this.modelSettings.hitAreas
                .filter(({ name, id }) => {
                    const drawIndex = this.internalModel.getDrawDataIndex(id);

                    if (drawIndex >= 0) {
                        const points = this.internalModel.getTransformedPoints(drawIndex);
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
        const model = this.internalModel;

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

        this.internalModel.setMatrix(tempMatrixArray);
        this.internalModel.draw();
    }
}
