import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { Cubism4ModelSettings } from '@/cubism4/Cubism4ModelSettings';
import { TEST_MODEL, TEST_MODEL4 } from '../env';

const basicCubism2SettingsJSON = {
    model: 'foo.moc',
    textures: ['foo.png'],
};

const basicCubism4SettingsJSON = {
    Version: 3,
    FileReferences: {
        Moc: 'foo.moc',
        Textures: ['foo.png'],
    },
};

describe('ModelSettings', () => {
    it('should validate JSON format', function() {
        // cubism2
        expect(Cubism2ModelSettings.isValidJSON(TEST_MODEL.json)).to.be.true;
        expect(Cubism2ModelSettings.isValidJSON(basicCubism2SettingsJSON)).to.be.true;
        expect(Cubism2ModelSettings.isValidJSON({})).to.be.false;
        expect(Cubism2ModelSettings.isValidJSON({ model: 'foo', textures: [1] })).to.be.false;
        expect(Cubism2ModelSettings.isValidJSON(undefined)).to.be.false;

        // cubism4
        expect(Cubism4ModelSettings.isValidJSON(TEST_MODEL4.json)).to.be.true;
        expect(Cubism4ModelSettings.isValidJSON(basicCubism4SettingsJSON)).to.be.true;
        expect(Cubism4ModelSettings.isValidJSON({})).to.be.false;
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
        const settings = new Cubism2ModelSettings({
            ...basicCubism2SettingsJSON,
            url: 'foo/bar/baz.model.json',
        });

        expect(settings.url).to.equal('foo/bar/baz.model.json');
        expect(settings.name).to.equal('bar');
    });
});
