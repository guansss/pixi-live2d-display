export interface ModelSettingsJSON {
    readonly name?: string;

    // files
    readonly model: string;
    readonly pose?: string;
    readonly physics?: string;
    readonly textures: string[];

    // metadata
    readonly layout?: Layout;
    readonly hitAreas?: { name: string; id: string }[];
    readonly initParams?: [{ id: string; value: number }];
    readonly initOpacities?: [{ id: string; value: number }];

    // motions
    readonly expressions?: ExpressionDefinition[];
    readonly motions?: { [group: string]: MotionDefinition[] };
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
    readonly file: string;

    /** Sound file. */
    readonly sound?: string;

    /** Motion fade-in timeout. */
    readonly fadeIn?: number;

    /** Motion fade-out timeout. */
    readonly fadeOut?: number;
}

export interface ExpressionDefinition {
    readonly name: string;

    /** `*.json` file. */
    readonly file: string;
}
