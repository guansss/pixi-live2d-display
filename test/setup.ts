import "./load-cores";

import { Container } from "@pixi/display";
import "@pixi/events";
import "@pixi/extract";
import { cloneDeep } from "lodash-es";
import { afterEach, beforeEach, vi } from "vitest";
import { config } from "../src/config";
import "./rpc/image-snapshot-client";

Container.defaultSortableChildren = true;

beforeEach(async function () {
    // declaring the context as an argument will cause a strange error, so we have to use arguments
    // eslint-disable-next-line prefer-rest-params
    const context: any = arguments[0];
    context.__originalConfig = cloneDeep(config);

    config.sound = false;
});
afterEach(async function () {
    // eslint-disable-next-line prefer-rest-params
    const context: any = arguments[0];
    Object.assign(config, context.__originalConfig);

    vi.restoreAllMocks();
});
