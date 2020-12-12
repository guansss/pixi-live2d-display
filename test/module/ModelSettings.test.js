import { Cubism2ModelSettings } from '@/cubism2/Cubism2ModelSettings';
import { TEST_MODEL } from '../env';

const basicCubism2SettingsJSON = {
    model: 'foo.moc',
    textures: ['foo.png'],
};

describe('ModelSettings', () => {
    it('should validate JSON format', function() {
        expect(Cubism2ModelSettings.isValidJSON(TEST_MODEL.json)).to.be.true;
        expect(Cubism2ModelSettings.isValidJSON(basicCubism2SettingsJSON)).to.be.true;
        expect(Cubism2ModelSettings.isValidJSON({})).to.be.false;
        expect(Cubism2ModelSettings.isValidJSON({ model: 'foo', textures: [1] })).to.be.false;
        expect(Cubism2ModelSettings.isValidJSON(undefined)).to.be.false;
    });

    it('should copy and validate properties', function() {
        const settings = new Cubism2ModelSettings({
            ...basicCubism2SettingsJSON,
            pose: 1,
            hit_areas: [
                'string item',
                { name: 'foo' },
            ],
        });

        expect(settings).to.have.property('moc').that.equals(basicCubism2SettingsJSON.model);
        expect(settings).to.have.property('textures').that.eql(basicCubism2SettingsJSON.textures);
        expect(settings).to.not.have.property('pose');
        expect(settings).to.have.property('hitAreas')
            .that.is.an('array')
            .with.deep.members([{ name: 'foo' }]);
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
