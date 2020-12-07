export interface Cubism2ModelSettingsDef {
    name?: string;

    // files
    model: string;
    pose?: string;
    physics?: string;
    textures: string[];

    // metadata
    layout?: Cubism2LayoutDef;
    hit_areas?: Cubism2HitAreaDef[];
    init_params?: Cubism2InitParamsDef[];
    init_opacities?: Cubism2InitOpacitiesDef[];

    // motions
    expressions?: Cubism2ExpressionDef[];
    motions?: Record<string, Cubism2MotionDef[]>;
}

export interface Cubism2LayoutDef {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    center_x?: number;
    center_y?: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}

export interface Cubism2MotionDef {
    /** `*.mtn` file. */
    file: string;

    /** Sound file. */
    sound?: string;

    /** Motion fade-in timeout. */
    fade_in?: number;

    /** Motion fade-out timeout. */
    fade_out?: number;
}

export interface Cubism2ExpressionDef {
    name: string;

    /** `*.json` file. */
    file: string;
}

export interface Cubism2HitAreaDef {
    name: string;
    id: string
}

export interface Cubism2InitParamsDef {
    id: string;
    value: number
}

export interface Cubism2InitOpacitiesDef {
    id: string;
    value: number
}
