export namespace Cubism2Spec {
    interface ModelJSON {
        name?: string;

        // files
        model: string;
        pose?: string;
        physics?: string;
        textures: string[];

        // metadata
        layout?: Layout;
        hit_areas?: HitArea[];
        init_params?: InitParam[];
        init_opacities?: InitOpacity[];

        // motions
        expressions?: Expression[];
        motions?: Record<string, Motion[]>;
    }

    interface Layout {
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

    interface Motion {
        /** `*.mtn` file. */
        file: string;

        /** Sound file. */
        sound?: string;

        /** Motion fade-in timeout. */
        fade_in?: number;

        /** Motion fade-out timeout. */
        fade_out?: number;
    }

    interface Expression {
        name: string;

        /** `*.json` file. */
        file: string;
    }

    interface HitArea {
        name: string;
        id: string
    }

    interface InitParam {
        id: string;
        value: number
    }

    interface InitOpacity {
        id: string;
        value: number
    }

    interface ExpressionJSON {
        fade_in?: number;
        fade_out?: number;
        params?: {
            id: string;
            val: number;
            def?: number;
            calc?: 'set' | 'add' | 'mult';
        }[]
    }

    interface PhysicsJSON {
        physics_hair?: {
            'comment': string,
            'setup': {
                'length': number,
                'regist': number,
                'mass': number
            },
            'src': {
                'id': string,
                'ptype': 'x' | 'y' | 'angle',
                'scale': number,
                'weight': number
            }[],
            'targets': {
                'id': string,
                'ptype': 'x' | 'y' | 'angle',
                'scale': number,
                'weight': number
            }[]
        }[]
    }

    interface PoseJSON {
        'parts_visible': {
            group: {
                id: string;
                link?: string[];
            }[];
        }[]
    }
}
