import { MotionManagerOptions } from '@/cubism-common/MotionManager';

export interface Live2DModelOptions extends MotionManagerOptions {
    /**
     * Automatically update internal model by `Ticker.shared`.
     */
    autoUpdate?: boolean;

    /**
     * Automatically listen for pointer events from `InteractionManager` to achieve interaction.
     */
    autoInteract?: boolean;
}
