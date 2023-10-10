import type { Ticker } from "@pixi/core";
import type { FederatedPointerEvent } from "pixi.js";
import type { Live2DModel } from "./Live2DModel";
import { logger } from "./utils";

export interface AutomatorOptions {
    /**
     * Should the internal model be automatically updated by `PIXI.Ticker.shared`.
     * @default ture
     */
    autoUpdate?: boolean;

    /**
     * Should the internal model automatically reacts to interactions by listening for pointer events.
     * @default true
     * @deprecated since v0.5.0, reading/writing this property is equivalent to reading/writing `autoHitTest && autoFocus`.
     */
    autoInteract?: boolean;

    /**
     * Automatically hit-test the model when `pointertap` event is triggered.
     * @default true
     */
    autoHitTest?: boolean;

    /**
     * Automatically update the focus position when `globalpointermove` event is triggered.
     * @default true
     */
    autoFocus?: boolean;

    /**
     * The ticker to be used for automatic updates.
     * @default `PIXI.Ticker.shared` from the global PIXI namespace.
     */
    ticker?: Ticker;
}

export class Automator {
    private static defaultTicker?: Ticker;

    model: Live2DModel;
    private destroyed = false;

    private _ticker?: Ticker;

    get ticker(): Ticker | undefined {
        return this._ticker;
    }

    set ticker(ticker: Ticker | undefined) {
        if (this._ticker) {
            this._ticker.remove(onTickerUpdate, this);
        }

        this._ticker = ticker;

        if (this._autoUpdate) {
            this._ticker?.add(onTickerUpdate, this);
        }
    }

    private _autoUpdate = false;

    /**
     * @see {@link AutomatorOptions.autoUpdate}
     */
    get autoUpdate() {
        return this._autoUpdate;
    }

    set autoUpdate(autoUpdate: boolean) {
        if (this.destroyed) {
            return;
        }

        if (autoUpdate) {
            if (this._ticker) {
                this._ticker.add(onTickerUpdate, this);
                this._autoUpdate = true;
            } else {
                logger.warn(
                    this.model.tag,
                    "No Ticker to be used for automatic updates. Either set option.ticker when creating Live2DModel, or expose PIXI to global scope (window.PIXI = PIXI).",
                );
            }
        } else {
            this._ticker?.remove(onTickerUpdate, this);
            this._autoUpdate = false;
        }
    }

    private _autoHitTest = false;

    /**
     * @see {@link AutomatorOptions.autoHitTest}
     */
    get autoHitTest(): boolean {
        return this._autoHitTest;
    }

    set autoHitTest(autoHitTest: boolean) {
        if (autoHitTest !== this.autoHitTest) {
            if (autoHitTest) {
                this.model.on("pointertap", onTap, this);
            } else {
                this.model.off("pointertap", onTap, this);
            }

            this._autoHitTest = autoHitTest;
        }
    }

    private _autoFocus = false;

    /**
     * @see {@link AutomatorOptions.autoFocus}
     */
    get autoFocus(): boolean {
        return this._autoFocus;
    }

    set autoFocus(autoFocus: boolean) {
        if (autoFocus !== this.autoFocus) {
            if (autoFocus) {
                this.model.on("globalpointermove", onPointerMove, this);
            } else {
                this.model.off("globalpointermove", onPointerMove, this);
            }

            this._autoFocus = autoFocus;
        }
    }

    /**
     * @see {@link AutomatorOptions.autoInteract}
     */
    get autoInteract(): boolean {
        return this._autoHitTest && this._autoFocus;
    }

    set autoInteract(autoInteract: boolean) {
        this.autoHitTest = autoInteract;
        this.autoFocus = autoInteract;
    }

    constructor(
        model: Live2DModel,
        {
            autoUpdate = true,
            autoHitTest = true,
            autoFocus = true,
            autoInteract = true,
            ticker,
        }: AutomatorOptions = {},
    ) {
        if (!ticker) {
            if (Automator.defaultTicker) {
                ticker = Automator.defaultTicker;
            } else if (typeof PIXI !== "undefined") {
                ticker = PIXI.Ticker.shared;
            }
        }

        this.model = model;
        this.autoUpdate = autoUpdate;
        this.autoHitTest = autoHitTest;
        this.autoFocus = autoFocus;
        this.autoInteract = autoInteract;
    }

    onTickerUpdate(deltaTime: number) {
        this.model.update(deltaTime);
    }

    onTap(event: FederatedPointerEvent) {
        this.model.tap(event.global.x, event.global.y);
    }

    onPointerMove(event: FederatedPointerEvent) {
        this.model.focus(event.global.x, event.global.y);
    }

    destroy() {
        // call setters to clean up
        this.autoFocus = false;
        this.autoHitTest = false;
        this.autoUpdate = false;
        this.ticker = undefined;

        this.destroyed = true;
    }
}

// static event delegates
function onTickerUpdate(this: Automator, deltaTime: number) {
    this.onTickerUpdate(deltaTime);
}
function onTap(this: Automator, event: FederatedPointerEvent) {
    this.onTap(event);
}
function onPointerMove(this: Automator, event: FederatedPointerEvent) {
    this.onPointerMove(event);
}
