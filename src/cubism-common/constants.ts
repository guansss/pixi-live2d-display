export const MOTION_FADING_DURATION = 500;

export const EXPRESSION_FADING_DURATION = 500;

export const LOGICAL_WIDTH = 2;

export const LOGICAL_HEIGHT = 2;

export const MOTION_PRELOAD_ALL = 0 as const;
export const MOTION_PRELOAD_IDLE = 1 as const;
export const MOTION_PRELOAD_NONE = 2 as const;

export type MotionPreloadStrategy =
    typeof MOTION_PRELOAD_ALL
    | typeof MOTION_PRELOAD_IDLE
    | typeof MOTION_PRELOAD_NONE

export const MOTION_PRIORITY_NONE = 0 as const;
export const MOTION_PRIORITY_IDLE = 1 as const;
export const MOTION_PRIORITY_NORMAL = 2 as const;
export const MOTION_PRIORITY_FORCE = 3 as const;

export type MotionPriority =
    typeof MOTION_PRIORITY_NONE
    | typeof MOTION_PRIORITY_IDLE
    | typeof MOTION_PRIORITY_NORMAL
    | typeof MOTION_PRIORITY_FORCE
