// @ts-expect-error - untyped package
import { toMatchImageSnapshot as untyped_toMatchImageSnapshot } from "jest-image-snapshot";

import type { MatcherState, RawMatcherFn, SyncExpectationResult } from "@vitest/expect";
import type { SnapshotState } from "@vitest/snapshot";
import type { OverrideProperties } from "type-fest";

const toMatchImageSnapshot = untyped_toMatchImageSnapshot as RawMatcherFn;

// props that I can confirm are accessed by reading the source code of jest-image-snapshot,
// if tests are fucked up, the lists may need to be updated
const KNOWN_ACCESSED_CTX_PROPS = ["testPath", "currentTestName", "isNot", "snapshotState"] as const;
const KNOWN_ACCESSED_SNAPSHOT_STATE_PROPS = [
    "_updateSnapshot",
    "_counters",
    "updated",
    "added",
    "matched",
    "unmatched",
] as const;

type KnownAccessedCtxProps = (typeof KNOWN_ACCESSED_CTX_PROPS)[number];
type KnownAccessedSnapshotStateProps = (typeof KNOWN_ACCESSED_SNAPSHOT_STATE_PROPS)[number];

type FakeMatcherState = OverrideProperties<
    Pick<MatcherState, KnownAccessedCtxProps>,
    { snapshotState: FakeSnapshotState }
>;
export type FakeMatcherStateSerialized = OverrideProperties<
    FakeMatcherState,
    { snapshotState: FakeSnapshotStateSerialized }
>;
type FakeSnapshotState = {
    updated: SnapshotState["updated"];
    added: SnapshotState["added"];
    matched: SnapshotState["matched"];
    unmatched: SnapshotState["unmatched"];
    _updateSnapshot: string;
    _counters: Map<string, number>;
};
type FakeSnapshotStateSerialized = OverrideProperties<
    FakeSnapshotState,
    { _counters: Record<string, number> }
>;

export function handleToMatchImageSnapshot({
    ctx,
    received,
    options,
}: {
    ctx: FakeMatcherStateSerialized;
    received: string;
    options: unknown;
}): OverrideProperties<SyncExpectationResult, { message: string }> {
    const fakeThis: FakeMatcherState = {
        ...ctx,
        snapshotState: {
            ...ctx.snapshotState,
            _counters: new Map(Object.entries(ctx.snapshotState._counters)),
        },
    };

    fakeThis.snapshotState = new Proxy(fakeThis.snapshotState, {
        get(target, p) {
            validateSnapshotStateProps(p);
            return target[p];
        },
        set(target, p, value) {
            validateSnapshotStateProps(p);
            target[p] = value as never;
            return true;
        },
    });

    const fakeThisProxy = new Proxy(fakeThis, {
        get(target, p) {
            validateCtxProps(p);
            return target[p];
        },
        set(target, p, value) {
            validateCtxProps(p);
            target[p] = value as never;
            return true;
        },
    });

    if (received.slice(0, 10) === "data:image") {
        received = received.slice("data:image/png;base64,".length);
    }

    const result = toMatchImageSnapshot.call(
        fakeThisProxy as unknown as MatcherState,
        Buffer.from(received, "base64"),
        options,
    ) as SyncExpectationResult;

    return {
        ...result,
        message: result.message(),
    };
}

function validateCtxProps(p: string | symbol): asserts p is KnownAccessedCtxProps {
    if (!KNOWN_ACCESSED_CTX_PROPS.includes(p as never)) {
        throw new Error(`Unexpected prop "this.${String(p)}" accessed by jest-image-snapshot`);
    }
}

function validateSnapshotStateProps(
    p: string | symbol,
): asserts p is KnownAccessedSnapshotStateProps {
    if (!KNOWN_ACCESSED_SNAPSHOT_STATE_PROPS.includes(p as never)) {
        throw new Error(
            `Unexpected prop "snapshotState.${String(p)}" accessed by jest-image-snapshot`,
        );
    }
}
