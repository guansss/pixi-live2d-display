import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import { TEST_MODEL, TEST_MODEL4 } from '../env';
import { cloneDeep, xor } from 'lodash-es';

const basicCubism2SettingsJSON = {
    url: 'foo/bar',
    model: 'foo.moc',
    textures: ['foo.png'],
};

const basicCubism4SettingsJSON = {
    url: 'foo/bar',
    Version: 3,
    FileReferences: {
        Moc: 'foo.moc',
        Textures: ['foo.png'],
    },
};

describe('ModelSettings', () => {
    function createModelSettings(json) {
        return Cubism4ModelSettings.isValidJSON(json) ? new Cubism4ModelSettings(json) : new Cubism2ModelSettings(json);
    }

    it('should validate JSON format', function() {
        // cubism2
        expect(Cubism2ModelSettings.isValidJSON(TEST_MODEL.json)).to.be.true;
        expect(Cubism2ModelSettings.isValidJSON(basicCubism2SettingsJSON)).to.be.true;
        expect(Cubism2ModelSettings.isValidJSON({})).to.be.false;
        expect(Cubism2ModelSettings.isValidJSON({ model: 'foo', textures: [] })).to.be.false;
        expect(Cubism2ModelSettings.isValidJSON({ model: 'foo', textures: [1] })).to.be.false;
        expect(Cubism2ModelSettings.isValidJSON(undefined)).to.be.false;

        // cubism4
        expect(Cubism4ModelSettings.isValidJSON(TEST_MODEL4.json)).to.be.true;
        expect(Cubism4ModelSettings.isValidJSON(basicCubism4SettingsJSON)).to.be.true;
        expect(Cubism4ModelSettings.isValidJSON({})).to.be.false;
        expect(Cubism4ModelSettings.isValidJSON({ FileReferences: { Moc: 'foo', Textures: [] } })).to.be.false;
        expect(Cubism4ModelSettings.isValidJSON({ FileReferences: { Moc: 'foo', Textures: [1] } })).to.be.false;
        expect(Cubism4ModelSettings.isValidJSON(undefined)).to.be.false;
    });

    it('should copy and validate properties', function() {
        // cubism2

        const settings2 = new Cubism2ModelSettings({
            ...basicCubism2SettingsJSON,
            pose: 1,
            hit_areas: [
                'string item',
                { name: 'foo' },
            ],
        });

        expect(settings2).to.have.property('moc').that.equals(basicCubism2SettingsJSON.model);
        expect(settings2).to.have.property('textures').that.eql(basicCubism2SettingsJSON.textures);
        expect(settings2).to.not.have.property('pose');
        expect(settings2).to.have.property('hitAreas')
            .that.is.an('array')
            .with.deep.members([{ name: 'foo' }]);

        // cubism4

        const settings4 = new Cubism4ModelSettings(basicCubism4SettingsJSON);

        expect(settings4).to.have.property('moc').that.equals(basicCubism4SettingsJSON.FileReferences.Moc);
        expect(settings4).to.have.property('textures').that.eql(basicCubism4SettingsJSON.FileReferences.Textures);
    });

    it('should handle URL', function() {
        const url = 'foo/bar/baz.model.json';

        const settings = new Cubism2ModelSettings({
            ...basicCubism2SettingsJSON,
            url: url,
        });

        expect(settings.url).to.equal(url);
        expect(settings.name).to.equal('bar');
    });

    describe('should iterate through all files', function() {
        function retrieveFiles(obj, files) {
            for (const key of Object.keys(obj)) {
                if (obj[key] && typeof obj[key] === 'object') {
                    retrieveFiles(obj[key], files);
                } else {
                    files.push(obj[key]);
                }
            }
        }

        const cubism2JSON = {
            model: 'moc:foo',
            pose: 'pose:foo',
            physics: 'physics:foo',
            textures: ['textures[0]:foo', 'textures[1]:foo'],
            motions: {
                a: [{ file: 'motions.a[0].file:foo', sound: 'motions.a[0].sound:foo' }],
                b: [{ file: 'motions.b[0].file:foo', sound: 'motions.b[0].sound:foo' },
                    { file: 'motions.b[1].file:foo', sound: 'motions.b[1].sound:foo' }],
            },
            expressions: [{ file: 'expressions[0].file:foo' }],
        };

        const cubism4JSON = {
            FileReferences: {
                Moc: 'moc:foo',
                Pose: 'pose:foo',
                Physics: 'physics:foo',
                Textures: ['textures[0]:foo', 'textures[1]:foo'],
                Motions: {
                    a: [{ File: 'motions.a[0].File:foo', Sound: 'motions.a[0].Sound:foo' }],
                    b: [{ File: 'motions.b[0].File:foo', Sound: 'motions.b[0].Sound:foo' },
                        { File: 'motions.b[1].File:foo', Sound: 'motions.b[1].Sound:foo' }],
                },
                Expressions: [{ File: 'expressions[0].File:foo' }],
            },
        };

        for (const [cubismVersion, json] of [['cubism2', cubism2JSON], ['cubism4', cubism4JSON]]) {
            const actuallyDefinedFiles = [];

            retrieveFiles(json, actuallyDefinedFiles);

            json.url = '';

            function matchActuallyDefinedFiles(files) {
                const diff = xor(actuallyDefinedFiles, files);

                if (diff.length) {
                    throw diff;
                }

                return true;
            }

            describe(cubismVersion, function() {
                it('should get all defined files', function() {
                    const settings = createModelSettings(cloneDeep(json));

                    expect(settings.getDefinedFiles()).to.satisfy(matchActuallyDefinedFiles);
                });

                it('should replace all files', function() {
                    const settings = createModelSettings(cloneDeep(json));
                    const replacedFiles = [];

                    settings.replaceFiles((file, path) => {
                        expect(file).to.equal(path + ':foo');

                        replacedFiles.push(file);

                        return file + 'bar';
                    });

                    expect(replacedFiles).to.satisfy(matchActuallyDefinedFiles);

                    for (const definedFile of settings.getDefinedFiles()) {
                        expect(definedFile).to.include('foobar');
                    }
                });

                it('should validate files', function() {
                    const settings = createModelSettings(cloneDeep(json));

                    expect(() => settings.validateFiles(actuallyDefinedFiles)).to.not.throw();
                    expect(() => settings.validateFiles(actuallyDefinedFiles.filter(file => file.match(/moc|texture/)))).to.not.throw();
                    expect(() => settings.validateFiles(['bar'])).to.throw();

                    const validFiles = settings.validateFiles([...actuallyDefinedFiles, 'bar']);

                    expect(validFiles).to.not.include('bar');
                    expect(validFiles).to.satisfy(matchActuallyDefinedFiles);
                });
            });
        }
    });
});
