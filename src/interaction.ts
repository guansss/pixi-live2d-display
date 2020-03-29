import { InteractionEvent, InteractionManager } from '@pixi/interaction';
import { Live2DModel } from './Live2DModel';

export namespace interaction {
    const live2dModels: Live2DModel[] = [];

    let interactionManager: InteractionManager | undefined;

    export function register(manager: InteractionManager) {
        if (interactionManager) {
            unregister();
        }

        interactionManager = manager;
        interactionManager.on('pointermove', onPointerMove);
    }

    export function unregister() {
        if (interactionManager) {
            interactionManager.off('pointermove', onPointerMove);
        }

        interactionManager = undefined;
    }

    function onPointerMove(event: InteractionEvent) {
        for (const model of live2dModels) {
            if (model.interactive) {
                model.focus(event.data.global.x, event.data.global.y);
            }
        }
    }

    export function registerInteraction(model: Live2DModel) {
        model.on('pointertap', (event: InteractionEvent) => model.tap(event.data.global.x, event.data.global.y));

        live2dModels.push(model);
    }

    export function unregisterInteraction(model: Live2DModel) {
        const index = live2dModels.indexOf(model);

        if (index !== -1) {
            live2dModels.splice(index, 1);
        }
    }
}
