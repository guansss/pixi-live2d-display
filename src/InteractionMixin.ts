import { InteractionEvent, InteractionManager } from '@pixi/interaction';
import { Live2DModel } from './Live2DModel';

export class InteractionMixin {
    private _autoInteract = false;

    /**
     * Enables automatic interaction. Only takes effect if Pixi's interaction feature has been enabled (by registering the `InteractionManager` plugin in `PIXI.Renderer`).
     */
    get autoInteract(): boolean {
        return this._autoInteract;
    }

    set autoInteract(autoInteract: boolean) {
        if (autoInteract !== this._autoInteract) {
            if (autoInteract) {
                (this as unknown as Live2DModel).on('pointertap', onTap, this);
            } else {
                (this as unknown as Live2DModel).off('pointertap', onTap, this);
            }

            this._autoInteract = autoInteract;
        }
    }

    /**
     * The `InteractionManager` is locally stored so we can on/off events anytime.
     */
    interactionManager?: InteractionManager;

    /**
     * Registers interaction by subscribing to the `InteractionManager`.
     * @param manager
     */
    registerInteraction(this: Live2DModel, manager?: InteractionManager): void {
        if (manager !== this.interactionManager) {
            this.unregisterInteraction();

            if (this._autoInteract && manager) {
                this.interactionManager = manager;

                manager.on('pointermove', onPointerMove, this);
            }
        }
    }

    /**
     * Unregisters interaction.
     */
    unregisterInteraction(this: Live2DModel): void {
        if (this.interactionManager) {
            this.interactionManager?.off('pointermove', onPointerMove);
            this.interactionManager?.off('pointertap', onTap);
            this.interactionManager = undefined;
        }
    }
}

function onTap(this: Live2DModel, event: InteractionEvent): void {
    this.tap(event.data.global.x, event.data.global.y);
}

function onPointerMove(this: Live2DModel, event: InteractionEvent) {
    this.focus(event.data.global.x, event.data.global.y);
}
