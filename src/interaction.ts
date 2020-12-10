import { InteractionEvent, InteractionManager } from '@pixi/interaction';
import { Live2DModel } from './Live2DModel';

declare module './Live2DModel' {
    interface Live2DModel {
        /**
         * Unregisters interaction bound to `InteractionManager`.
         * @private
         */
        _unregisterInteraction?(): void;
    }
}

export namespace interaction {
    /**
     * Registers interaction for a `Live2DModel`.
     * @param model
     * @param manager
     */
    export function registerInteraction(model: Live2DModel<any>, manager: InteractionManager): void {
        unregisterInteraction(model);

        model.interactionManager = manager;

        const onPointerMove = (event: InteractionEvent) => model.focus(event.data.global.x, event.data.global.y);

        manager.on('pointermove', onPointerMove);

        model._unregisterInteraction = function() {
            this.interactionManager?.off('pointermove', onPointerMove);
        };
    }

    /**
     * Unregisters interaction for a `Live2DModel`.
     * @param model
     */
    export function unregisterInteraction(model: Live2DModel<any>): void {
        model._unregisterInteraction?.();
        model._unregisterInteraction = undefined;
        model.interactionManager = undefined;
    }
}
