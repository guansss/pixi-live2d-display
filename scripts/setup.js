import { createWriteStream, existsSync, mkdirSync, writeFileSync } from "fs";
import JSZip from "jszip";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const overwriteExisting = true;
const __dirname = dirname(fileURLToPath(import.meta.url));
const coreDir = resolve(__dirname, "../core") + "/";

const assets = [
    {
        url: "http://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js",
        file: coreDir + "live2d.min.js",
    },
    {
        url: "https://cubism.live2d.com/sdk-web/bin/CubismSdkForWeb-4-r.7.zip",
        zipEntries: [
            {
                entryFile: "CubismSdkForWeb-4-r.7/Core/live2dcubismcore.js",
                outputFile: coreDir + "live2dcubismcore.js",
            },
            {
                entryFile: "CubismSdkForWeb-4-r.7/Core/live2dcubismcore.d.ts",
                outputFile: coreDir + "live2dcubismcore.d.ts",
            },
        ],
    },
];

async function main() {
    for (const asset of assets) {
        await download(asset);
    }
    console.log("Done");
}

async function download({ url, file, zipEntries }) {
    console.log("Downloading", url);

    if (file) {
        if (!overwriteExisting && existsSync(file)) {
            console.log("Skip existing", file);
            return;
        }

        const dir = dirname(file);

        if (!existsSync(dir)) {
            console.log("Create dir ", dir);

            mkdirSync(dir);
        }
    }

    const arrayBuffer = await fetch(url).then((res) => res.arrayBuffer());
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
        throw new Error("got empty response from " + url);
    }

    if (file) {
        writeFileSync(file, buffer);
        console.log("Downloaded to", file);
    } else if (zipEntries) {
        await unzip(zipEntries, buffer);
    }
}

async function unzip(zipEntries, buffer) {
    const zip = await JSZip.loadAsync(buffer);

    for (const { entryFile, outputFile } of zipEntries) {
        if (!overwriteExisting && existsSync(outputFile)) {
            console.log("Skip existing", outputFile);
            continue;
        }

        console.log("Extracting ", outputFile);

        let zipFile;

        if (typeof entryFile === "string") {
            zipFile = zip.file(entryFile);
        } else {
            const zipFiles = zip.file(entryFile);

            if (zipFiles.length === 0) {
                throw new Error(`No zip entry found for ${entryFile}`);
            }

            if (zipFiles.length > 1) {
                console.error(
                    `Multiple zip entries found for ${entryFile}, only the first one will be used`,
                );
                zipFiles.forEach((f) => console.error(`> ${f.name}`));
            }

            zipFile = zipFiles[0];
        }

        await new Promise((resolve, reject) => {
            zipFile
                .nodeStream()
                .pipe(createWriteStream(outputFile, "utf8"))
                .on("finish", resolve)
                .on("error", reject);
        });
    }
}

main().then();
