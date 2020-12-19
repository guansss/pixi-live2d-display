import { Cubism2ModelSettings, Cubism4ModelSettings, Live2DModel, MOTION_PRELOAD_NONE } from '@';
import { Application } from '@pixi/app';
import merge from 'lodash/merge';
import { TEST_MODEL, TEST_MODEL4 } from '../env';
import { createApp } from '../utils';

describe.only('Live2DFactory', function() {
    const options = { autoUpdate: false, motionPreload: MOTION_PRELOAD_NONE };

    this.timeout(1000);

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

        await expect(DerivedLive2DModel.from(TEST_MODEL.file), options)
            .to.eventually.be.instanceOf(DerivedLive2DModel).and.instanceOf(Live2DModel);
    });

    describe('Synchronous creation', function() {
        it('should create Live2DModel', async function() {
            await new Promise(resolve => {
                const model = Live2DModel.fromSync(TEST_MODEL.file, { onLoad: resolve });

                expect(model).to.be.instanceOf(Live2DModel);

                const app = createApp(Application, false);
                app.stage.addChild(model);
                model.update(100);
                app.render();
                app.destroy();
            });
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

            const model = Live2DModel.fromSync(TEST_MODEL.file, { onLoad, onError: done });

            Object.keys(events).forEach(event => {
                // create a named function for spy to prettify the printed message
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
            const fakeXHR = sinon.useFakeXMLHttpRequest();
            const requests = [];

            XMLHttpRequest.useFilters = true;
            XMLHttpRequest.addFilter((method, url) => !/fake/.test(url));

            fakeXHR.onCreate = xhr => {
                requests.push(xhr);
                // setTimeout(() => console.log('XHR Created ' + xhr.url), 0);
            };

            try {
                await new Promise((resolve, reject) => {
                    Live2DModel.fromSync({
                        ...TEST_MODEL.json,
                        model: 'fakeModel',
                    }, {
                        onLoad: () => reject(new Error('Unexpected onLoad() call.')),
                        onError(e) {
                            try {
                                expect(e).to.be.an('error');
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        },
                    });

                    expect(requests.length).to.equal(1);

                    requests[0].respond(404);
                    requests.length = 0;
                });

                await new Promise((resolve, reject) => {
                    Live2DModel.fromSync(
                        merge({}, TEST_MODEL.json, { textures: ['fakeTexture'] }),
                        {
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
            } finally {
                fakeXHR.restore();
            }
        });
    });
});
