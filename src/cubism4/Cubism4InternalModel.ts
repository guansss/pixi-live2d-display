import { MotionManagerOptions } from '@/cubism-common';
import { CommonHitArea, CommonLayout, InternalModel } from '@/cubism-common/InternalModel';
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import { Cubism4MotionManager } from '@/cubism4/Cubism4MotionManager';
import {
    ParamAngleX,
    ParamAngleY,
    ParamAngleZ,
    ParamBodyAngleX,
    ParamBreath,
    ParamEyeBallX,
    ParamEyeBallY,
} from '@cubism/cubismdefaultparameterid';
import { BreathParameterData, CubismBreath } from '@cubism/effect/cubismbreath';
import { CubismEyeBlink } from '@cubism/effect/cubismeyeblink';
import { CubismPose } from '@cubism/effect/cubismpose';
import { CubismMatrix44 } from '@cubism/math/cubismmatrix44';
import { CubismModel } from '@cubism/model/cubismmodel';
import { CubismModelUserData } from '@cubism/model/cubismmodeluserdata';
import { CubismPhysics } from '@cubism/physics/cubismphysics';
import { CubismRenderer_WebGL, CubismShader_WebGL } from '@cubism/rendering/cubismrenderer_webgl';
import { Matrix } from '@pixi/math';
import mapKeys from 'lodash/mapKeys';

const tempMatrix = new CubismMatrix44();

export const frameBufferMap = new WeakMap<WebGLRenderingContext, WebGLFramebuffer>();

export class Cubism4InternalModel extends InternalModel {
    settings: Cubism4ModelSettings;
    coreModel: CubismModel;
    motionManager: Cubism4MotionManager;

    lipSync = true;

    breath = CubismBreath.create();
    eyeBlink?: CubismEyeBlink;
    pose?: CubismPose;
    physics?: CubismPhysics;

    // what's this for?
    userData?: CubismModelUserData;

    renderer = new CubismRenderer_WebGL();

    idParamAngleX = ParamAngleX;
    idParamAngleY = ParamAngleY;
    idParamAngleZ = ParamAngleZ;
    idParamEyeBallX = ParamEyeBallX;
    idParamEyeBallY = ParamEyeBallY;
    idParamBodyAngleX = ParamBodyAngleX;
    idParamBreath = ParamBreath;

    pixelsPerUnit = 1;

    constructor(coreModel: CubismModel, settings: Cubism4ModelSettings, options?: MotionManagerOptions) {
        super();

        this.coreModel = coreModel;
        this.settings = settings;
        this.motionManager = new Cubism4MotionManager(settings, options);

        this.init();
    }

    protected init() {
        super.init();

        if (this.settings.getEyeBlinkParameters()?.length! > 0) {
            this.eyeBlink = CubismEyeBlink.create(this.settings);
        }

        this.breath.setParameters([
            new BreathParameterData(this.idParamAngleX, 0.0, 15.0, 6.5345, 0.5),
            new BreathParameterData(this.idParamAngleY, 0.0, 8.0, 3.5345, 0.5),
            new BreathParameterData(this.idParamAngleZ, 0.0, 10.0, 5.5345, 0.5),
            new BreathParameterData(this.idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5),
            new BreathParameterData(this.idParamBreath, 0.0, 0.5, 3.2345, 0.5),
        ]);

        this.renderer.initialize(this.coreModel);
        this.renderer.setIsPremultipliedAlpha(true);
    }

    protected getSize(): [number, number] {
        return [this.coreModel.getModel().canvasinfo.CanvasWidth, this.coreModel.getModel().canvasinfo.CanvasHeight];
    }

    protected getLayout(): CommonLayout {
        // un-capitalize each key to satisfy the common layout format
        return mapKeys({ ...this.settings.layout }, (_, key) => key.charAt(0).toLowerCase() + key.slice(1));
    }

    protected setupLayout() {
        super.setupLayout();

        this.pixelsPerUnit = this.coreModel.getModel().canvasinfo.PixelsPerUnit;
    }

    updateWebGLContext(gl: WebGLRenderingContext, glContextID: number): void {
        if (!frameBufferMap.has(gl)) {
            frameBufferMap.set(gl, gl.getParameter(gl.FRAMEBUFFER_BINDING));
        }

        // reset resources that were bound to previous WebGL context
        this.renderer.firstDraw = true;
        this.renderer._bufferData = {
            vertex: null,
            uv: null,
            index: null,
        };
        this.renderer.startUp(gl);
        this.renderer._clippingManager._currentFrameNo = glContextID;
        this.renderer._clippingManager._maskTexture = undefined;
        CubismShader_WebGL.getInstance()._shaderSets = [];
    }

    /** @override */
    bindTexture(index: number, texture: WebGLTexture): void {
        this.renderer.bindTexture(index, texture);
    }

    protected getHitAreaDefs(): CommonHitArea[] {
        return this.settings.hitAreas?.map(hitArea => ({
            id: hitArea.Id,
            name: hitArea.Name,
            index: this.coreModel.getDrawableIndex(hitArea.Id),
        })) ?? [];
    }

    getHitAreaVertices(drawIndex: number): Float32Array {
        const arr = this.coreModel.getDrawableVertices(drawIndex).slice(0);

        for (let i = 0; i < arr.length; i += 2) {
            arr[i] = arr[i]! * this.pixelsPerUnit + this.originalWidth / 2;
            arr[i + 1] = -arr[i + 1]! * this.pixelsPerUnit + this.originalHeight / 2;
        }

        return arr;
    }

    updateTransform(transform: Matrix) {
        super.updateTransform(transform);

        this.drawingMatrix.translate(this.width * transform.a / 2, this.height * transform.d / 2);
        this.drawingMatrix.a *= this.pixelsPerUnit;
        this.drawingMatrix.d *= this.pixelsPerUnit;
    }

    public update(dt: DOMHighResTimeStamp, now: DOMHighResTimeStamp): void {
        super.update(dt, now);

        dt /= 1000;
        now /= 1000;

        const model = this.coreModel;

        model.loadParameters();

        let motionUpdated = this.motionManager.update(this.coreModel, now);

        model.saveParameters();

        if (!motionUpdated) {
            this.eyeBlink?.updateParameters(model, dt);
        }

        model.addParameterValueById(this.idParamAngleX, this.focusController.x * 30); // -30 ~ 30
        model.addParameterValueById(this.idParamAngleY, this.focusController.y * 30);
        model.addParameterValueById(this.idParamAngleZ, this.focusController.x * this.focusController.y * -30);
        model.addParameterValueById(this.idParamBodyAngleX, this.focusController.x * 10); // -10 ~ 10
        model.addParameterValueById(this.idParamEyeBallX, this.focusController.x); // -1 ~ 1
        model.addParameterValueById(this.idParamEyeBallY, this.focusController.y);

        this.breath?.updateParameters(model, dt);
        this.physics?.evaluate(model, dt);

        // TODO: Add lip sync API
        // if (this.lipSync) {
        //     const value = 0; // 0 ~ 1
        //
        //     for (let i = 0; i < this.lipSyncIds.length; ++i) {
        //         model.addParameterValueById(this.lipSyncIds[i], value, 0.8);
        //     }
        // }

        this.pose?.updateParameters(model, dt);

        model.update();
    }

    public draw(gl: WebGLRenderingContext): void {
        const matrix = this.drawingMatrix;
        const array = tempMatrix.getArray();

        // set given 3x3 matrix into a 4x4 matrix, with Y inverted
        array[0] = matrix.a;
        array[1] = matrix.c;
        array[4] = matrix.b;
        array[5] = matrix.d;
        array[12] = matrix.tx;
        array[13] = -matrix.ty;

        this.renderer.setMvpMatrix(tempMatrix);
        this.renderer.setRenderState(frameBufferMap.get(gl)!, [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);
        this.renderer.drawModel();
    }
}
