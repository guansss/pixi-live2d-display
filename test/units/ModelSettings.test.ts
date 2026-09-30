import { Cubism2ModelSettings } from "@/cubism2/Cubism2ModelSettings";
import { Cubism4ModelSettings } from "@/cubism4/Cubism4ModelSettings";
import { cloneDeep, get } from "lodash-es";
import { describe, expect, test } from "vitest";
import type { Cubism2Spec } from "../../src/csm2";
import type { CubismSpec } from "../../src/csm4";
import { TEST_MODEL2, TEST_MODEL4 } from "../env";

const minimalCubism2Json = Object.freeze({
    model: "foo.moc",
    textures: ["foo.png"],
}) satisfies Cubism2Spec.ModelJSON;

const minimalCubism4Json = Object.freeze({
    Version: 3,
    FileReferences: {
        Moc: "foo.moc",
        Textures: ["foo.png"],
    },
}) satisfies CubismSpec.ModelJSON;

test("validates model JSON", () => {
    expect(Cubism2ModelSettings.isValidJSON(TEST_MODEL2.modelJson)).to.be.true;
    expect(Cubism2ModelSettings.isValidJSON(minimalCubism2Json)).to.be.true;
    expect(Cubism2ModelSettings.isValidJSON({})).to.be.false;
    expect(Cubism2ModelSettings.isValidJSON({ model: "foo", textures: [] })).to.be.false;
    expect(Cubism2ModelSettings.isValidJSON({ model: "foo", textures: [1] })).to.be.false;
    expect(Cubism2ModelSettings.isValidJSON(undefined)).to.be.false;

    expect(Cubism4ModelSettings.isValidJSON(TEST_MODEL4.modelJson)).to.be.true;
    expect(Cubism4ModelSettings.isValidJSON(minimalCubism4Json)).to.be.true;
    expect(Cubism4ModelSettings.isValidJSON({})).to.be.false;
    expect(Cubism4ModelSettings.isValidJSON({ FileReferences: { Moc: "foo", Textures: [] } })).to.be
        .false;
    expect(Cubism4ModelSettings.isValidJSON({ FileReferences: { Moc: "foo", Textures: [1] } })).to
        .be.false;
    expect(Cubism4ModelSettings.isValidJSON(undefined)).to.be.false;
});

test("copies and validates properties", () => {
    const settings2 = new Cubism2ModelSettings({
        ...minimalCubism2Json,
        url: "foo",
        pose: 1 as unknown as string,
        hit_areas: ["foo-string" as any, { id: "foo", name: "foo" }],
    });

    expect(settings2).to.have.property("moc").that.equals(minimalCubism2Json.model);
    expect(settings2).to.have.property("textures").that.eql(minimalCubism2Json.textures);
    expect(settings2.pose).to.be.undefined;
    expect(settings2)
        .to.have.property("hitAreas")
        .that.is.an("array")
        .with.deep.members([{ id: "foo", name: "foo" }]);

    const settings4 = new Cubism4ModelSettings({ ...minimalCubism4Json, url: "foo" });

    expect(settings4).to.have.property("moc").that.equals(minimalCubism4Json.FileReferences.Moc);
    expect(settings4)
        .to.have.property("textures")
        .that.eql(minimalCubism4Json.FileReferences.Textures);
});

test("handles URL", () => {
    const url = "foo/bar/baz.model.json";

    const settings = new Cubism2ModelSettings({
        ...minimalCubism2Json,
        url: url,
    });

    expect(settings.url).to.equal(url);
    expect(settings.name).to.equal("bar");
});

describe.each([
    {
        name: "cubism2",
        createSettings: (url: string) => new Cubism2ModelSettings({ ...minimalCubism2Json, url }),
    },
    {
        name: "cubism4",
        createSettings: (url: string) => new Cubism4ModelSettings({ ...minimalCubism4Json, url }),
    },
])("resolves resource URLs ($name)", ({ createSettings }) => {
    test.each([
        "blob:http://localhost:61139/b096d3b0-90dd-4f56-a79f-2228ebe02cf0",
        "blob:https://example.com/texture-id",
        "blob:null/moc-id",
        'data:application/json,{"name":"model:resource"}',
        "data:application/octet-stream;base64,AAECAw==",
        "http://example.com:8080/model.moc?version=1#resource",
        "https://example.com/texture.png?source=http://other.example/#resource",
        "HTTPS://EXAMPLE.COM/Texture.png",
        "file:///models/model.moc",
        "asset+v1.0-test:models/model.moc",
    ])("preserves absolute URL %s", (path) => {
        for (const url of ["https://example.com/models/model.json", "models/model.json", ""]) {
            expect(createSettings(url).resolveURL(path)).to.equal(path);
        }
    });

    test.each([
        [
            "https://example.com/models/model.json",
            "textures/texture.png",
            "https://example.com/models/textures/texture.png",
        ],
        [
            "https://example.com/models/model.json",
            "../shared/model.moc",
            "https://example.com/shared/model.moc",
        ],
        [
            "https://example.com/models/model.json",
            "/textures/texture.png",
            "https://example.com/textures/texture.png",
        ],
        [
            "https://example.com/models/model.json",
            "//cdn.example.com/texture.png",
            "https://cdn.example.com/texture.png",
        ],
        [
            "http://example.com/models/model.json",
            "//cdn.example.com/texture.png",
            "http://cdn.example.com/texture.png",
        ],
        [
            "https://example.com/models/model.json?old=1#old",
            "texture.png?v=2#part",
            "https://example.com/models/texture.png?v=2#part",
        ],
        [
            "https://example.com/models/model.json?old=1#old",
            "?v=2",
            "https://example.com/models/model.json?v=2",
        ],
        [
            "https://example.com/models/model.json?v=1#old",
            "#part",
            "https://example.com/models/model.json?v=1#part",
        ],
        [
            "https://example.com/models/model.json?v=1#old",
            "",
            "https://example.com/models/model.json?v=1",
        ],
        ["models/model.json", "./textures/texture.png", "models/textures/texture.png"],
        ["models/model.json", "../shared/model.moc", "shared/model.moc"],
        ["/models/model.json", "texture.png", "/models/texture.png"],
        ["models/model.json", "/texture.png", "/texture.png"],
        ["model.json", "texture.png", "texture.png"],
        ["", "texture.png", "texture.png"],
        ["models/model.json", "./texture:variant.png", "models/texture:variant.png"],
        ["models/model.json", "texture with spaces.png", "models/texture%20with%20spaces.png"],
        ["models/model.json", "texture%20name.png", "models/texture%20name.png"],
    ])("resolves %s and %s to %s", (url, path, expected) => {
        expect(createSettings(url).resolveURL(path)).to.equal(expected);
    });
});

function colletFiles<T>(fn: (makeFile: (file: string) => string) => T) {
    const definedFiles: string[] = [];

    const json = fn((file) => {
        definedFiles.push(file);
        return file;
    });

    definedFiles.sort();

    return { json, definedFiles };
}

describe.each([
    {
        name: "cubism2",
        ...colletFiles((make) => {
            return {
                model: make("moc"),
                pose: make("pose"),
                physics: make("physic"),
                textures: [make("texture1"), make("texture2")],
                motions: {
                    a: [{ file: make("motion1"), sound: make("sound1") }],
                    b: [
                        { file: make("motion2"), sound: make("sound2") },
                        { file: make("motion3") },
                    ],
                },
                expressions: [{ file: make("expression"), name: "foo" }],
            } satisfies Cubism2Spec.ModelJSON;
        }),
    },
    {
        name: "cubism4",
        ...colletFiles((make) => {
            return {
                Version: 3,
                FileReferences: {
                    Moc: make("moc"),
                    Pose: make("pose"),
                    Physics: make("physic"),
                    Textures: [make("texture1"), make("texture2")],
                    Motions: {
                        a: [{ File: make("motion1"), Sound: make("sound1") }],
                        b: [
                            { File: make("motion2"), Sound: make("sound2") },
                            { File: make("motion3") },
                        ],
                    },
                    Expressions: [{ File: make("expression"), Name: "foo" }],
                },
            } satisfies CubismSpec.ModelJSON;
        }),
    },
])("handles defined files", function ({ name, json, definedFiles }) {
    function createModelSettings(json: any) {
        return Cubism4ModelSettings.isValidJSON(json)
            ? new Cubism4ModelSettings(cloneDeep({ ...json, url: "foo" }))
            : new Cubism2ModelSettings(cloneDeep({ ...json, url: "foo" }));
    }

    function expectSameAsDefinedFiles(files: string[]) {
        expect(files.sort()).to.have.same.members(definedFiles);
    }

    test("collects defined files", () => {
        const settings = createModelSettings(json);

        expectSameAsDefinedFiles(settings.getDefinedFiles());
    });

    test("replaces files", () => {
        const settings = createModelSettings(json);
        const iteratedFiles: string[] = [];

        settings.replaceFiles((file, path) => {
            expect(get(settings, path)).to.equal(file);

            iteratedFiles.push(file);

            return file + ".replaced";
        });

        expectSameAsDefinedFiles(iteratedFiles);

        for (const definedFile of settings.getDefinedFiles()) {
            expect(definedFile).to.include(".replaced");
        }
    });

    test("validates files", () => {
        const settings = createModelSettings(json);

        expect(() => settings.validateFiles(definedFiles)).to.not.throw();
        expect(() =>
            settings.validateFiles(definedFiles.filter((file) => file.match(/moc|texture/))),
        ).to.not.throw();
        expect(() => settings.validateFiles(["bar"])).to.throw();

        const validFiles = settings.validateFiles([...definedFiles, "xyz"]);

        expect(validFiles).to.not.include("xyz");
        expectSameAsDefinedFiles(validFiles);
    });
});
