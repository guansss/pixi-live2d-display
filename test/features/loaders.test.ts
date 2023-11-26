import { Live2DModel } from "@/Live2DModel";
import JSZip from "jszip";
import { beforeAll, describe, expect } from "vitest";
import { Live2DFactory } from "../../src/factory/Live2DFactory";
import { ZipLoader } from "../../src/factory/ZipLoader";
import { describeEachModel, test, testEachModel } from "../env";
import { createFile, defaultOptions } from "../utils";

describe("FileLoader", function () {
    testEachModel("loads model from files", async ({ model: { files }, objectURLs }) => {
        const model = await Live2DModel.from(await files(), defaultOptions());

        expect(model).to.be.instanceOf(Live2DModel);

        model.destroy();

        expect(objectURLs).to.be.empty;
    });

    testEachModel(
        "loads model from files with predefined ModelSettings",
        async ({ model: { files, modelJsonWithUrl }, objectURLs }) => {
            const settings =
                Live2DFactory.findRuntime(modelJsonWithUrl)!.createModelSettings(modelJsonWithUrl);

            // TODO: remove the need for this
            settings._objectURL = "xxxxxxxxx";

            const filesSrc = (await files()).slice();
            (filesSrc as any).settings = settings;

            const model = await Live2DModel.from(filesSrc, defaultOptions());
            expect(model).to.be.instanceOf(Live2DModel);
            model.destroy();
            expect(objectURLs).to.be.empty;
        },
    );
});

describeEachModel("ZipLoader", ({ model: { name, files, modelJsonUrl, modelJsonWithUrl } }) => {
    let zipFile: File;
    let zipFileWithoutSettings: File;

    beforeAll(async () => {
        ZipLoader.zipReader = (data, url) => JSZip.loadAsync(data);
        ZipLoader.readText = (jsZip, path) => jsZip.file(path).async("text");
        ZipLoader.getFilePaths = (jsZip: JSZip) => {
            const paths: string[] = [];
            jsZip.forEach((relativePath) => paths.push(relativePath));
            return Promise.resolve(paths);
        };
        ZipLoader.getFiles = (jsZip, paths) => {
            return Promise.all(
                paths.map(async (path) => {
                    const fileName = path.slice(path.lastIndexOf("/") + 1);
                    const blob = await jsZip.file(path).async("blob");
                    return new File([blob], fileName);
                }),
            );
        };

        const zip = new JSZip();
        let settingsFile!: File;

        for (const file of await files()) {
            if (modelJsonUrl.includes(file.webkitRelativePath)) {
                settingsFile = file;
                continue;
            }
            zip.file(file.webkitRelativePath, file);
        }

        expect(settingsFile, "found settings file").toBeInstanceOf(File);

        const zipBlobWithoutSettings = await zip.generateAsync({ type: "blob" });
        zipFileWithoutSettings = createFile(zipBlobWithoutSettings, `foo/bar/${name}.zip`);

        zip.file(settingsFile.webkitRelativePath, settingsFile);

        const zipBlob = await zip.generateAsync({ type: "blob" });
        zipFile = createFile(zipBlob, `foo/bar/${name}.zip`);
    });

    test("loads model from a zip", async ({ objectURLs }) => {
        const model = await Live2DModel.from([zipFile], defaultOptions());
        expect(model).to.be.instanceOf(Live2DModel);
        model.destroy();
        expect(objectURLs).to.be.empty;
    });

    test("loads model from a zip with predefined ModelSettings", async ({ objectURLs }) => {
        const files = [zipFileWithoutSettings];
        (files as any).settings =
            Live2DFactory.findRuntime(modelJsonWithUrl)!.createModelSettings(modelJsonWithUrl);

        const model = await Live2DModel.from(files, defaultOptions());
        expect(model).to.be.instanceOf(Live2DModel);
        model.destroy();
        expect(objectURLs).to.be.empty;
    });

    test("loads model from a zip URL", async ({ objectURLs }) => {
        const zipURL = ZipLoader.ZIP_PROTOCOL + URL.createObjectURL(zipFile);
        const model = await Live2DModel.from(zipURL, defaultOptions());
        expect(model).to.be.instanceOf(Live2DModel);
        model.destroy();
        URL.revokeObjectURL(zipURL);
        expect(objectURLs).to.be.empty;
    });
});
