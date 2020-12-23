import { config, Cubism2ModelSettings, Cubism4ModelSettings, Live2DModel, MOTION_PRELOAD_NONE } from '@';
import { createTexture } from '@/factory/texture';
import { Application } from '@pixi/app';
import { Texture } from '@pixi/core';
import merge from 'lodash/merge';
import sinon from 'sinon';
import { TEST_MODEL, TEST_MODEL4, TEST_TEXTURE } from '../env';
import { createApp } from '../utils';

describe('Live2DFactory', function() {
    const options = { autoUpdate: false, motionPreload: MOTION_PRELOAD_NONE };
    const originalLogLevel = config.logLevel;
    const fakeXHRs = [];

    this.timeout(1000);

    before(function() {
        this.fakeXHR = sinon.useFakeXMLHttpRequest();

        const matchesFake = url => url.match(/fake/);

        XMLHttpRequest.useFilters = true;
        XMLHttpRequest.addFilter((method, url) => !matchesFake(url));

        this.fakeXHR.onCreate = xhr => {
            xhr.addEventListener('readystatechange', () => {
                if (xhr.readyState === XMLHttpRequest.OPENED && matchesFake(xhr.url)) {
                    // console.log('XHR faked: ', xhr.url, xhr);
                    fakeXHRs.push(xhr);
                }
            });
        };
    });

    after(function() {
        this.fakeXHR.restore();
    });

    afterEach(function() {
        config.logLevel = originalLogLevel;
        fakeXHRs.length = 0;
    });

    it('should create Texture', async function() {
        await expect(createTexture(TEST_TEXTURE)).to.eventually.be.instanceOf(Texture);
        await expect(createTexture('fakeTexture')).to.be.rejected;
    });

    it('should create Live2DModel', async function() {
        // cubism2
        await expect(Live2DModel.from(TEST_MODEL.file, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(TEST_MODEL.json, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(new Cubism2ModelSettings(TEST_MODEL.json), options))
            .to.eventually.be.instanceOf(Live2DModel);

        // cubism4
        await expect(Live2DModel.from(TEST_MODEL4.file, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(TEST_MODEL4.json, options)).to.eventually.be.instanceOf(Live2DModel);
        await expect(Live2DModel.from(new Cubism4ModelSettings(TEST_MODEL4.json), options))
            .to.eventually.be.instanceOf(Live2DModel);
    });

    it('should create derived Live2DModel', async () => {
        class DerivedLive2DModel extends Live2DModel {}

        await expect(DerivedLive2DModel.from(TEST_MODEL.file, options))
            .to.eventually.be.instanceOf(DerivedLive2DModel).and.instanceOf(Live2DModel);
    });

    it('should handle error', async function() {
        config.logLevel = config.LOG_LEVEL_ERROR;

        const creation = Live2DModel.from({ ...TEST_MODEL.json, model: 'fakeModel' }, options);

        expect(fakeXHRs.length).to.equal(1);
        fakeXHRs[0].respond(404);

        try {
            await creation;

            throw new Error('The expected error was not thrown.');
        } catch (e) {
            expect(e).to.have.property('status', 404);
        }

        await expect(Live2DModel.from(merge({}, TEST_MODEL.json, { textures: ['fakeTexture'] }), options)).to.be.rejected;
    });

    describe('Synchronous creation', function() {
        let app;

        before(function() {
            app = createApp(Application, false);
        });

        after(function() {
            app.destroy();
        });

        it('should create Live2DModel', async function() {
            const modelOptions = { ...options };

            const onLoadCalled = new Promise((resolve1, reject1) => {
                modelOptions.onLoad = resolve1;
                modelOptions.onError = reject1;
            });

            const model = Live2DModel.fromSync(TEST_MODEL.file, modelOptions);

            expect(model).to.be.instanceOf(Live2DModel);

            const eventEmitted = new Promise((resolve2, reject2) => {
                model.on('ready', () => {
                        try {
                            app.stage.addChild(model);
                            model.update(100);
                            app.render();
                        } catch (e) {
                            reject2(e);
                        }
                    })
                    .on('load', () => {
                        try {
                            app.render();
                            resolve2();
                        } catch (e) {
                            reject2(e);
                        }
                    });
            });

            return Promise.all([onLoadCalled, eventEmitted]);
        });

        it('should emit events', function(done) {
            const events = {
                settingsJSONLoaded: undefined,
                settingsLoaded: undefined,
                textureLoaded: undefined,
                modelLoaded: undefined,
                poseLoaded: undefined,
                physicsLoaded: undefined,
                ready: undefined,
                load: undefined,
            };

            const model = Live2DModel.fromSync(TEST_MODEL.file, { ...options, onLoad, onError: done });

            Object.keys(events).forEach(event => {
                // create a named function for spy to prettify the print message
                events[event] = sinon.spy(new Function('return function ' + event + '(){}')());

                model.on(event, events[event]);
            });

            function onLoad() {
                Object.entries(events).forEach(([event, handler]) => {
                    expect(handler).to.be.calledOnce;
                });

                expect(events.modelLoaded).to.be.calledBefore(events.poseLoaded);
                expect(events.modelLoaded).to.be.calledBefore(events.physicsLoaded);
                expect(events.modelLoaded).to.be.calledBefore(events.ready);
                expect(events.textureLoaded).to.be.calledBefore(events.ready);

                expect(events.poseLoaded).to.be.calledBefore(events.load);
                expect(events.physicsLoaded).to.be.calledBefore(events.load);
                expect(events.ready).to.be.calledBefore(events.load);

                done();
            }
        });

        it('should handle error', async function() {
            config.logLevel = config.LOG_LEVEL_ERROR;

            await new Promise((resolve, reject) => {
                Live2DModel.fromSync({
                    ...TEST_MODEL.json,
                    model: 'fakeModel',
                }, {
                    ...options,
                    onLoad: () => reject(new Error('Unexpected onLoad() call.')),
                    onError(e) {
                        try {
                            expect(e).to.be.an('error').with.property('status', 404);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    },
                });

                expect(fakeXHRs.length).to.equal(1);

                fakeXHRs[0].respond(404);
            });

            await new Promise((resolve, reject) => {
                Live2DModel.fromSync(
                    merge({}, TEST_MODEL.json, { textures: ['fakeTexture'] }),
                    {
                        ...options,
                        onLoad: () => reject(new Error('Unexpected onLoad() call.')),
                        onError(e) {
                            try {
                                expect(e).to.be.an('error');
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        },
                    },
                );
            });
        });
    });
});
