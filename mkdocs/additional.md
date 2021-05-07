These features are not strongly related to the subject of this project - "displaying Live2D", but can be useful
sometimes.

## HitAreaFrames

Displays a frame for model's each hit area. You can see this in
the [interaction demo](https://codepen.io/guansss/pen/KKgXBOP/left?editors=0010).

The `HitAreaFrames` must be used as a direct child of `Live2DModel`.

```js
const hitAreaFrames = new HitAreaFrames();

model.addChild(hitAreaFrames);
```

Because this class involves the dependency of `PIXI.Graphics`, it's included in the browser build, but not in the module
system build.

In browser, you can directly use the `PIXI.live2d.HitAreaFrames`.

In Node, you can import the source file:

```js
import { HitAreaFrames } from 'pixi-live2d-display/src/tools/HitAreaFrames';
```

However it's a TypeScript file, so you'll need an appropriate loader, such as ts-loader when using webpack.

And unfortunately, while importing this file works, the TypeScript compiler will report an error due to the path
alias `@` in this file. This can be fixed
once [webpack supports ES module output](https://github.com/webpack/webpack/issues/2933). For now, I'd suggest copying
this file to your project and replacing `@/Live2DModel` with `../Live2DModel` in the first line.

## Loading from uploaded files (experimental)

You can create a model by an array of `File` objects, each of which has
a [`webkitRelativePath`](https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath) property.

```js
document.getElementById("filepicker").addEventListener("change", function(event) {
    const files = event.target.files;

    if (files.length) {
        const model = await Live2DModel.from(files);
    }
});
```

Files will be handled by the `FileLoader`. From given files, it looks for the model settings file by matching
the `model.json` or `model3.json` extension, then creates a lookup table for the resource files defined in the settings,
where the keys are the files' paths and the values are their object URLs.

If there are more than one settings file, only the first one will be chosen by default, but you can specify it by
attaching a `ModelSettings` to the file array.

```js
// files:
// shizuku-normal.model.json
// shizuku-special.model.json
// shizuku.moc
// texture_0.png
// ...

const files = getUploadedFiles();

// if you do this, the model will be created by "shizuku-normal.model.json" as it's the first matched settings file
// const model = await Live2DModel.from(files);

const settingsFile = files.find(file => file.name === 'shizuku-special.model.json');

// load JSON from the file
const settingsJSON = await fetch(URL.createObjectURL(settingsFile)).then(res => res.json());

// don't forget to specify the url
settingsJSON.url = settingsFile.webkitRelativePath;

files.settings = new Cubism2ModelSettings(settingsJSON);

// now the model will be created by "shizuku-special.model.json"
const model = await Live2DModel.from(files);

// to be honest, I just found myself so dumb when writing this guide...
// why didn't I just add an option to the `options` of Live2DModel.from()?
```

If the given files include no settings file, an error will be thrown.

## Loading from a zip file (experimental)

Zip files will be handled by the `ZipLoader`. It looks for the model settings file in the zip, extracts the resource
files as `File`s, then simply passes them to the `FileLoader`.

To avoid depending on a zipping library, `ZipLoader` has left several static methods unimplemented, therefore you need
to implement them before loading zip files, *otherwise a "Not implemented" error will be thrown*.

```ts
// the type `ZipReader` is an arbitrary object

// accepts the zip's data and URL, returns a zip reader
ZipLoader.zipReader(data: Blob, url: string): Promise<ZipReader>

// retrieves relative paths of all the files in this zip
ZipLoader.getFilePaths(reader: ZipReader): Promise<string[]>

// extracts specific files in this zip as `File` objects
ZipLoader.getFiles(reader: ZipReader, paths: string[]): Promise<File[]>

// reads a file in this zip as text
ZipLoader.readText(reader: ZipReader, path: string): Promise<string>

// releases the zip reader, this is optional
ZipLoader.releaseReader(reader: ZipReader): void
```

An example for implementing them with [jszip](https://github.com/Stuk/jszip) can be found in
the [live2d-viewer-web](https://github.com/guansss/live2d-viewer-web/blob/main/src/app/zip.ts) project.

Then, you can create model from a zip file.

```js
Live2DModel.from('path/to/shizuku.zip');
```

If the zip file's URL is not ended with `.zip`, you can prepend the URL with a fake protocol `zip://`.

```js
Live2DModel.from('zip://path/to/shizuku');

Live2DModel.from('zip://http://example.com/give-me-a-random-model');
```

Additionally, you can even pass an uploaded zip file.

```html
<input type="file" id="zippicker" accept=".zip">
```

```js
document.getElementById("zippicker").addEventListener("change", async function(event) {
    const files = event.target.files;

    if (files.length) {
        // the zip source is a one-length array containing a single zip file
        const zipSource = [files[0]];

        const model = await Live2DModel.from(zipSource);
    }
});
```

In this way, you're also able to specify the target settings file with the same approach as above.
