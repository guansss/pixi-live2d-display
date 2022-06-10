import { InteractionEvent, InteractionManager } from '@pixi/interaction';
import { Live2DModel } from './Live2DModel';

/**
 * The interaction control split from Live2DModel class for code clarity. This mixin should *only*
 * be used on the Live2DModel.
 */
export class InteractionMixin {
    private _autoInteract = false;

    /**
     * Enables automatic interaction. Only takes effect if Pixi's interaction
     * feature has been enabled (by registering the `PIXI.InteractionManager` into `PIXI.Renderer`).
     */
    get autoInteract(): boolean {
        return this._autoInteract;
    }

    set autoInteract(autoInteract: boolean) {
        if (autoInteract !== this._autoInteract) {
            if (autoInteract) {
                (this as any as Live2DModel<any>).on('pointertap', onTap, this);
            } else {
                (this as any as Live2DModel<any>).off('pointertap', onTap, this);
            }

            this._autoInteract = autoInteract;
        }
    }

    /**
     * Local reference used to clean up the event listeners when destroying the model.
     */
    interactionManager?: InteractionManager;

    /**
     * Registers interaction by subscribing to the `PIXI.InteractionManager`.
     */
    registerInteraction(this: Live2DModel<any>, manager?: InteractionManager): void {
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
    unregisterInteraction(this: Live2DModel<any>): void {
        if (this.interactionManager) {
            this.interactionManager?.off('pointermove', onPointerMove, this);
            this.interactionManager = undefined;
        }
    }
}

function onTap(this: Live2DModel<any>, event: InteractionEvent): void {
    this.tap(event.data.global.x, event.data.global.y);
}

function onPointerMove(this: Live2DModel<any>, event: InteractionEvent) {
    this.focus(event.data.global.x, event.data.global.y);
}
