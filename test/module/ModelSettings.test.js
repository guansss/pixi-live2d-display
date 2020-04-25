import { ModelSettings } from '../../src';
import { TEST_MODEL } from '../env';

const baseModelSettingsJSON = {
    model: 'foo.moc',
    textures: ['foo.png'],
};

describe('ModelSettings', () => {
    it('should validate JSON format', function() {
        expect(ModelSettings.isModelSettingsJSON(TEST_MODEL.json)).to.be.true;
        expect(ModelSettings.isModelSettingsJSON(baseModelSettingsJSON)).to.be.true;
        expect(ModelSettings.isModelSettingsJSON({})).to.be.false;
        expect(ModelSettings.isModelSettingsJSON({ model: 'foo', textures: [1] })).to.be.false;
        expect(ModelSettings.isModelSettingsJSON(undefined)).to.be.false;
    });

    it('should validate property types when copying', function() {
        const settings = new ModelSettings({
            ...baseModelSettingsJSON,
            pose: 1,
            hitAreas: [
                'string item',
                { name: 'foo', id: 'ID' },
            ],
        }, '');

        expect(settings).to.not.have.property('pose');
        expect(settings).to.have.property('hitAreas')
            .that.is.an('array')
            .with.deep.members([{ name: 'foo', id: 'ID' }]);
    });

    it('should copy properties as camelCase', function() {
        const settings = new ModelSettings({
            ...baseModelSettingsJSON,
            hit_areas: [],
            motions: {
                tap_body: [],
            },
        }, '');

        expect(settings).to.have.deep.property('hitAreas', []);
        expect(settings).to.have.deep.nested.property('motions.tapBody', []);
    });

    it('should resolve path', function() {
        const settings = new ModelSettings(baseModelSettingsJSON, 'a/b/foo.model.json');

        expect(settings.resolvePath('foo.json')).to.equal('a/b/foo.json');
        expect(settings.resolvePath('../foo.json')).to.equal('a/foo.json');
    });
});
