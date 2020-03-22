export interface ModelSettingsJSON {
    readonly name?: string;

    // files
    readonly model: string;
    readonly preview?: string;
    readonly pose?: string;
    readonly physics?: string;
    readonly subtitle?: string;
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
    readonly name?: string;

    /** `*.mtn` file. */
    readonly file: string;

    /** Sound file. */
    readonly sound?: string;

    /** Subtitle name. */
    readonly subtitle?: string;

    /** Motion fade-in timeout. */
    readonly fadeIn?: number;

    /** Motion fade-out timeout. */
    readonly fadeOut?: number;

    /** Start time in hours (for start-up motions only). */
    readonly time?: number;

    /** Used by greeting. */
    readonly season?: string;
}

export interface ExpressionDefinition {
    readonly name: string;

    /** `*.json` file. */
    readonly file: string;
}
