import { cloneWithCamelCase, config, copyArray, copyObjectArray, copyProperty, folderName, logger } from '../../src';

describe('Utils', () => {
    before(() => {
        sinon.stub(console, 'log');
        sinon.stub(console, 'warn');
        sinon.stub(console, 'error');
    });

    after(() => {
        sinon.restore();
    });

    describe('logger', () => {
        it('should obey log levels', function() {
            const originalLogLevel = config.logLevel;

            config.logLevel = config.LOG_LEVEL_ERROR;
            logger.error('foo', 'bar');
            expect(console.error).to.be.calledWith('[foo]', 'bar');

            config.logLevel = config.LOG_LEVEL_WARNING;
            logger.warn('foo', 'bar');
            expect(console.warn).to.be.calledWith('[foo]', 'bar');

            config.logLevel = config.LOG_LEVEL_VERBOSE;
            logger.log('foo', 'bar');
            expect(console.log).to.be.calledWith('[foo]', 'bar');

            console.log.resetHistory();
            config.logLevel = config.LOG_LEVEL_NONE;
            logger.log('foo', 'bar');
            expect(console.log).to.not.be.called;

            config.logLevel = originalLogLevel;
        });
    });

    describe('obj', function() {
        it('cloneWithCamelCase', function() {
            const clone = cloneWithCamelCase({
                foo_bar: {
                    foo_bar: [
                        { foo_bar: 1 },
                    ],
                },
            });

            expect(clone).to.have.nested.property('fooBar.fooBar[0].fooBar', 1);
        });

        it('copyProperty', function() {
            const clone = {};

            copyProperty(clone, { num: 1 }, 'num', 'number');

            expect(clone).to.have.property('num', 1);
        });

        it('copyArray', function() {
            const clone = {};

            copyArray(clone, { arr: [1] }, 'arr', 'number');

            expect(clone).to.have.nested.property('arr[0]', 1);
        });

        it('copyObjectArray', function() {
            const clone = {};

            copyObjectArray(clone, { arr: [{ num: 1 }] }, 'arr', { num: 'number' });

            expect(clone).to.have.nested.property('arr[0].num', 1);
        });
    });

    describe('string', () => {
        expect(folderName('foo/bar/baz.js')).to.equal('bar');
        expect(folderName('bar/baz.js')).to.equal('bar');
        expect(folderName('bar/')).to.equal('bar');
        expect(folderName('/bar/')).to.equal('bar');
        expect(folderName('baz.js')).to.equal('baz.js');
    });
});
