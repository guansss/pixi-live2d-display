import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const tsdFile = resolve("types/index.d.ts");

console.log("Patching types for", tsdFile);

let tsdContent = readFileSync(tsdFile, "utf8");

// correct the declaration merging
tsdContent = tsdContent.replace(
    "export declare interface Live2DMotion",
    "declare interface Live2DMotion",
);

writeFileSync(tsdFile, tsdContent);
