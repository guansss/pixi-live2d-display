import { MotionManagerOptions } from '@/cubism-common/MotionManager';
import { Live2DFactory } from '@/factory/Live2DFactory';

export interface Live2DModelOptions extends MotionManagerOptions {
    /**
     * Automatically update internal model by `Ticker.shared`.
     */
    autoUpdate?: boolean;

    /**
     * Automatically listen for pointer events from `InteractionManager` to achieve interaction.
     */
    autoInteract?: boolean;

    factory?: Live2DFactory;
}
