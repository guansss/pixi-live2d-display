import { createTexture } from "@/factory/texture";
import { Texture } from "@pixi/core";
import { expect } from "vitest";
import { TEST_TEXTURE, test } from "../env";

test("creates Texture", async () => {
    await expect(createTexture(TEST_TEXTURE)).resolves.toBeInstanceOf(Texture);
    await expect(createTexture("foo")).rejects.toThrow();
});
