export interface ModelSettingsJSON {
    name?: string;

    // files
    model: string;
    pose?: string;
    physics?: string;
    textures: string[];

    // metadata
    layout?: Layout;
    hitAreas?: { name: string; id: string }[];
    initParams?: [{ id: string; value: number }];
    initOpacities?: [{ id: string; value: number }];

    // motions
    expressions?: ExpressionDefinition[];
    motions?: { [group: string]: MotionDefinition[] };
}

export interface Layout {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    centerX?: number;
    centerY?: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}

export interface MotionDefinition {
    /** `*.mtn` file. */
    file: string;

    /** Sound file. */
    sound?: string;

    /** Motion fade-in timeout. */
    fadeIn?: number;

    /** Motion fade-out timeout. */
    fadeOut?: number;
}

export interface ExpressionDefinition {
    name: string;

    /** `*.json` file. */
    file: string;
}
