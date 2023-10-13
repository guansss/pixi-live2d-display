import { expect } from "vitest";
import type { FakeMatcherStateSerialized } from "./image-snapshot-server";
import { rpc } from "./rpc-client";

interface CustomMatchers<T = unknown> {
    toMatchImageSnapshot(): T;
}

declare module "vitest" {
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
    async toMatchImageSnapshot(received, options) {
        if (!(received instanceof ArrayBuffer)) {
            return {
                pass: false,
                message: () => "toMatchImageSnapshot can only be used with ArrayBuffers",
            };
        }

        const receivedAsB64 = btoa(String.fromCharCode(...new Uint8Array(received)));

        const ctx: FakeMatcherStateSerialized = {
            testPath: this.testPath,
            currentTestName: this.currentTestName,
            isNot: this.isNot,
            snapshotState: {
                updated: this.snapshotState.updated,
                added: this.snapshotState.added,
                matched: this.snapshotState.matched,
                unmatched: this.snapshotState.unmatched,
                _updateSnapshot: this.snapshotState["_updateSnapshot"],
                _counters: Object.fromEntries(Object.entries(this.snapshotState["_counters"])),
            },
        };

        const result = await rpc().toMatchImageSnapshot({ ctx, received: receivedAsB64, options });

        return result;
    },
});
