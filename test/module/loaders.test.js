import { Live2DFactory } from '@/factory/Live2DFactory';
import { ZipLoader } from '@/factory/ZipLoader';
import '@/cubism2';
import '@/cubism4';
import { RUNTIMES } from '../env';
import { Live2DModel } from '@/Live2DModel';
import urlModule from 'url';
import JSZip from 'jszip';

describe('Loaders', function() {
    async function fetchBlob(url) {
        return fetch(url).then(res => res.blob());
    }

    function createFile(blob, relativePath) {
        const name = relativePath.slice(relativePath.lastIndexOf('/') + 1);

        const file = new File([blob], name);

        Object.defineProperty(file, 'webkitRelativePath', { value: relativePath });

        return file;
    }

    const runtimes = Object.assign({}, RUNTIMES);

    before(async function() {
        await runtimes.each(async (runtime, runtimeName) => {
            const originalURL = runtime.definition.file;

            const settingsFilePath = runtimeName.includes('2') ? 'foo/spa  ced/model.json' : 'foo/spa  ced/model3.json';

            const settingsJSON = Object.assign({}, runtime.definition.json, { url: settingsFilePath });

            const settings = Live2DFactory.findRuntime(settingsJSON).createModelSettings(settingsJSON);

            const settingsFile = createFile(new Blob([JSON.stringify(settingsJSON)]), settingsFilePath);

            const definedFiles = settings.getDefinedFiles();

            const files = await Promise.all(definedFiles.map(
                async file => {
                    const url = urlModule.resolve(originalURL, file);
                    const filePath = decodeURI(settings.resolveURL(file));

                    return createFile(await fetchBlob(url), filePath);
                },
            ));

            files.push(settingsFile);

            runtime.files = files;
            runtime.settingsFile = settingsFile;
            runtime.newSettings = () => Live2DFactory.findRuntime(settingsJSON).createModelSettings(settingsJSON);
        });
    });

    describe('FileLoader', function() {
        runtimes.each((runtime, runtimeName) => {
            describe(runtimeName, function() {
                it('should load from files', async function() {
                    const model = await Live2DModel.from(runtime.files);

                    expect(model).to.be.instanceOf(Live2DModel);

                    let revokedURLs = 0;

                    sinon.stub(URL, 'revokeObjectURL').callsFake(url => {
                        URL.revokeObjectURL.wrappedMethod.call(URL, url);
                        revokedURLs++;
                    });

                    model.destroy();

                    try {
                        expect(revokedURLs).to.equal(runtime.files.length);
                    } finally {
                        URL.revokeObjectURL.restore();
                    }
                });

                it('should load from files with predefined ModelSettings', async function() {
                    const settings = runtime.newSettings();

                    settings._objectURL = URL.createObjectURL(runtime.settingsFile);

                    const files = runtime.files.slice();
                    files.settings = settings;

                    try {
                        const model = await Live2DModel.from(files);

                        expect(model).to.be.instanceOf(Live2DModel);
                    } finally {
                        URL.revokeObjectURL(settings._objectURL);
                        delete settings._objectURL;
                    }
                });
            });
        });
    });

    describe('ZipLoader', function() {
        before(function() {
            ZipLoader.zipReader = (data, url) => JSZip.loadAsync(data);
            ZipLoader.readText = (jsZip, path) => jsZip.file(path).async('text');

            ZipLoader.getFilePaths = jsZip => {
                const paths = [];

                jsZip.forEach(relativePath => paths.push(relativePath));

                return Promise.resolve(paths);
            };

            ZipLoader.getFiles = (jsZip, paths) => {
                return Promise.all(paths.map(
                    async path => {
                        const fileName = path.slice(path.lastIndexOf('/') + 1);

                        const blob = await jsZip.file(path).async('blob');

                        return new File([blob], fileName);
                    }));
            };
        });

        runtimes.each((runtime, runtimeName) => {
            describe(runtimeName, async function() {
                let zipFile;
                let zipFileWithoutSettings;

                before(async function() {
                    const jsZip = new JSZip();

                    for (const file of runtime.files) {
                        jsZip.file(file.webkitRelativePath, file);
                    }

                    const zipBlobWithoutSettings = await jsZip.generateAsync({ type: 'blob' });
                    zipFileWithoutSettings = createFile(zipBlobWithoutSettings, `bar/${runtimeName.replace(/\W/g, '')}.zip`);

                    jsZip.file(runtime.settingsFile.webkitRelativePath, runtime.settingsFile);

                    const zipBlob = await jsZip.generateAsync({ type: 'blob' });
                    zipFile = createFile(zipBlob, `bar/${runtimeName.replace(/\W/g, '')}.zip`);
                });

                it('should load from zip file', async function() {
                    const model = await Live2DModel.from([zipFile]);

                    expect(model).to.be.instanceOf(Live2DModel);

                    model.destroy();
                });

                it('should load from zip file with predefined ModelSettings', async function() {
                    const files = [zipFileWithoutSettings];

                    files.settings = runtime.newSettings();

                    const model = await Live2DModel.from(files);

                    expect(model).to.be.instanceOf(Live2DModel);

                    model.destroy();
                });

                it('should load from zip URL', async function() {
                    const zipURL = ZipLoader.ZIP_PROTOCOL + URL.createObjectURL(zipFile);

                    const model = await Live2DModel.from(zipURL);

                    expect(model).to.be.instanceOf(Live2DModel);

                    model.destroy();
                });
            });
        });
    });
});
