/**
 * Unofficial declaration file of Cubism 2.1 core library.
 */

declare class Live2D {
    static setGL(gl: WebGLRenderingContext, index?: number): void;

    static getError(): unknown | undefined;
}

declare class Live2DModelWebGL {
    static loadModel(buffer: ArrayBuffer): Live2DModelWebGL;

    private constructor();

    drawParamWebGL: DrawParamWebGL;

    getModelContext(): ModelContext;

    /**
     * @return The width of model's Live2D drawing canvas but NOT the html canvas element.
     */
    getCanvasWidth(): number;

    /**
     * @return The height of model's Live2D drawing canvas but NOT the html canvas element.
     */
    getCanvasHeight(): number;

    setTexture(index: number, texture: WebGLTexture): void;

    setMatrix(matrix: ArrayLike<number>): void;

    setParamFloat(id: string | number, value: number, weight?: number): unknown;

    addToParamFloat(id: string | number, value: number, weight?: number): unknown;

    multParamFloat(id: string | number, value: number, weight?: number): unknown;

    setPartsOpacity(id: string | number, value: number): unknown;

    getPartsOpacity(id: string | number): number;

    getParamFloat(id: string | number): number;

    getParamIndex(id: string): number;

    getPartsDataIndex(id: string): number;

    getDrawDataIndex(id: string): number;

    getTransformedPoints(index: number): number[];

    loadParam(): void;

    saveParam(): void;

    update(): void;

    draw(): void;
}

declare class AMotion {
    setFadeIn(time: number): unknown;

    setFadeOut(time: number): unknown;

    updateParamExe(model: Live2DModelWebGL, time: DOMTimeStamp, weight: number, MotionQueueEnt: unknown): unknown;
}

declare class Live2DMotion extends AMotion {
    private constructor();

    static loadMotion(buffer: ArrayBuffer): Live2DMotion;
}

declare class MotionQueueManager {
    motions: unknown[];

    /**
     * @return The size of internal motion arrays.
     */
    startMotion(motion: AMotion, neverUsedArg?: boolean): number;

    stopAllMotions(): void;

    isFinished(): boolean;

    /**
     * @return True if parameters are updated by any motion.
     */
    updateParam(model: Live2DModelWebGL): boolean;
}

declare class PhysicsHair {
    static Src: {
        SRC_TO_X: string;
        SRC_TO_Y: string;
        SRC_TO_G_ANGLE: string;
    };
    static Target: {
        TARGET_FROM_ANGLE: string;
        TARGET_FROM_ANGLE_V: string;
    };

    setup(length: number, regist: number, mass: number): unknown;

    addSrcParam(type: string, id: string, scale: number, weight: number): unknown;

    addTargetParam(type: string, id: string, scale: number, weight: number): unknown;

    update(model: Live2DModelWebGL, time: DOMTimeStamp): unknown;
}

declare class PartsDataID {
    static getID(id: string): string;
}

// Hidden classes

declare class DrawParamWebGL {
    gl: WebGLRenderingContext;
    glno: number;

    firstDraw: boolean;

    setGL(gl: WebGLRenderingContext): void;
}

declare class ModelContext {
    clipManager: ClipManager;
}

declare class ClipManager {
    curFrameNo: number;

    getMaskRenderTexture(): number;
}
