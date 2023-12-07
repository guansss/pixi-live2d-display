import type { Application } from "@pixi/app";
import { isObject } from "lodash-es";
import { expect } from "vitest";
import type { FakeMatcherStateSerialized } from "./image-snapshot-server";
import { rpc } from "./rpc-client";

interface CustomMatchers<T = unknown> {
    toMatchImageSnapshot(): Promise<void>;
}

declare module "vitest" {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
    async toMatchImageSnapshot(received: unknown, options: unknown) {
        if (!(received instanceof ArrayBuffer || isPixiApp(received))) {
            return {
                pass: false,
                message: () =>
                    "toMatchImageSnapshot can only be used with ArrayBuffers or PIXI.Application",
            };
        }

        const receivedAsB64 = isPixiApp(received)
            ? await received.renderer.extract.base64(undefined, "image/png")
            : btoa(String.fromCharCode(...new Uint8Array(received)));

        const ctx: FakeMatcherStateSerialized = {
            testPath: this.testPath,
            currentTestName: this.currentTestName,
            isNot: this.isNot,
            snapshotState: {
                updated: this.snapshotState.updated,
                added: this.snapshotState.added,
                matched: this.snapshotState.matched,
                unmatched: this.snapshotState.unmatched,
                _updateSnapshot: this.snapshotState["_updateSnapshot"] as string,
                _counters: Object.fromEntries(
                    Object.entries(this.snapshotState["_counters"] as Record<string, number>),
                ),
            },
        };

        const result = await rpc().toMatchImageSnapshot({
            ctx,
            received: receivedAsB64,
            options: {
                // images are a bit different (~1% from observation) when rendered in CI,
                // and probably also in other platforms, so we have to set a higher threshold
                failureThreshold: 3,
                failureThresholdType: "percent",
            },
        });

        return {
            pass: result.pass,
            message: () => result.message,
        };
    },
});

function isPixiApp(v: unknown): v is Application {
    return isObject(v) && "stage" in v && "renderer" in v;
}
