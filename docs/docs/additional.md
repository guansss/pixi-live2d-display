These features are not strongly related to this project's main goal - "displaying Live2D", but can be useful
sometimes.

## HitAreaFrames

Displays frames for model's hit areas. You can see this in the [interaction demo](https://codepen.io/guansss/pen/KKgXBOP/left?editors=0010).

`HitAreaFrames` must be used as a direct child of `Live2DModel`.

```js
const hitAreaFrames = new HitAreaFrames();

model.addChild(hitAreaFrames);
```

This class depends on `@pixi/graphics` and `@pixi/text`, therefore it's excluded from the main bundle to avoid involving unnecessary dependency.

You can import it from the `extra` bundle.

```js
import { HitAreaFrames } from 'pixi-live2d-display/extra';
```

For using CDNs, you can load it like this:

```html
<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/extra.min.js"></script>
```

Then, access it from `PIXI.live2d.HitAreaFrames`.

## Loading model from uploaded files (experimental)

`Live2DModel` can be created from an array of `File`s. Each `File` must have a [`webkitRelativePath`](https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath) property that represents relative path of the file.

You can get the `File`s from a directory picker:

```html
<input type="file" id="filepicker" webkitdirectory multiple />
```

```js
document.getElementById("filepicker").addEventListener("change", async (event) => {
    const files = event.target.files;

    if (files.length) {
        const model = await Live2DModel.from(files);
    }
});
```

!!! info "How this works"
    Source files are handled by an internal helper `FileLoader`.
    
    From given files, it looks for model settings file by matching `.model.json` or `.model3.json` extension, then creates a lookup table for resource files defined in the settings, where the keys are the file paths and the values are their [object URLs](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL).

    Then, it overrides the `model.modelSettings.resolveURL()` method so that the resource files can be resolved to corresponding `File`s using the lookup table.

If given files include more than one settings file, only the first one will be chosen. To use another one, you need to manually create a `ModelSettings`, and attach it to the array:

```js
const files = [
    // collected files:
    // shizuku-normal.model.json
    // shizuku-special.model.json
    // shizuku.moc
    // texture_0.png
    // ...
];

// if you do this, the model will be created by "shizuku-normal.model.json" as it's the first matched settings file
// const model = await Live2DModel.from(files);

const settingsFile = files.find(file => file.name === 'shizuku-special.model.json');

// read JSON from the file
const settingsJSON = await fetch(URL.createObjectURL(settingsFile)).then(res => res.json());

// don't forget to specify url!
settingsJSON.url = settingsFile.webkitRelativePath;

// attach the settings to the array
files.settings = new Cubism2ModelSettings(settingsJSON);

const model = await Live2DModel.from(files);

// to be honest, I just found myself so dumb when writing this guide...
// why didn't I just add an option to the `options` of Live2DModel.from()?
```

If given files include no settings file, an error will be thrown.

## Loading model from a zip file (experimental)

!!! info "How this works"
    Zip files are handled by an internal helper `ZipLoader`. It looks for the model settings file inside the zip, extracts referenced resource
    files as `File`s, then simply passes them to `FileLoader`.

To avoid depending on a zipping library, `ZipLoader` has left several static methods unimplemented, therefore you need
to implement them before loading zip files, *otherwise a "Not implemented" error will be thrown*.

Typings:

```ts
// this can be anything depending on the zipping library you're using
type ZipReader = any;

// accepts the zip's data and URL, returns a zip reader
ZipLoader.zipReader(data: Blob, url: string): Promise<ZipReader>

// retrieves relative paths of all the files in this zip
ZipLoader.getFilePaths(reader: ZipReader): Promise<string[]>

// extracts specific files in this zip as Files
ZipLoader.getFiles(reader: ZipReader, paths: string[]): Promise<File[]>

// reads a file in this zip as text
ZipLoader.readText(reader: ZipReader, path: string): Promise<string>

// releases the zip reader, this is optional
ZipLoader.releaseReader(reader: ZipReader): void
```

!!! info
    An implementation example using [jszip](https://github.com/Stuk/jszip) can be found in the [live2d-viewer-web](https://github.com/guansss/live2d-viewer-web/blob/main/src/app/zip.ts) project.

Then, you can create model from a zip file using its URL.

```js
Live2DModel.from('path/to/shizuku.zip');
```

If the zip file's URL does not end with `.zip`, you can prepend it with a fake protocol `zip://` to get it recognized.

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
        const model = await Live2DModel.from(files);
    }
});
```

In this way, you're also able to specify the target settings file with the same approach as above.
