# pixi-live2d-display

![GitHub package.json version](https://img.shields.io/github/package-json/v/guansss/pixi-live2d-display?style=flat-square)
![Cubism version](https://img.shields.io/badge/Cubism-2/3/4-ff69b4?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/guansss/pixi-live2d-display/test.yml?style=flat-square)

English | [中文](README.zh.md)

Live2D integration for [PixiJS](https://github.com/pixijs/pixi.js) v6.

This project aims to be a universal Live2D framework on the web platform. While the official Live2D framework is just
complex and problematic, this project has rewritten it to unify and simplify the APIs, which allows you to control the
Live2D models on a high level without the need to learn how the internal system works.

#### Features

- Supports all versions of Live2D models
- Supports PIXI.RenderTexture and PIXI.Filter
- Pixi-style transform APIs: position, scale, rotation, skew, anchor
- Automatic interactions: focusing, hit-testing
- Enhanced motion reserving logic compared to the official framework
- Loading from uploaded files / zip files (experimental)
- Fully typed - we all love types!

#### Requirements

- PixiJS: 6.x
- Cubism core: 2.1 or 4
- Browser: WebGL, ES6

#### Demos

- [Basic demo](https://codepen.io/guansss/pen/oNzoNoz/left?editors=1010)
- [Interaction demo](https://codepen.io/guansss/pen/KKgXBOP/left?editors=0010)
- [Render texture & filter demo](https://codepen.io/guansss/pen/qBaMNQV/left?editors=1010)
- [Live2D Viewer Online](https://guansss.github.io/live2d-viewer-web/)

#### Documentations

- [Documentation](https://guansss.github.io/pixi-live2d-display)
- [API Documentation](https://guansss.github.io/pixi-live2d-display/api/index.html)
- [Development Notes](DEVELOPMENT.md)

## Cubism

Cubism is the name of Live2D SDK. There are so far three versions of it: Cubism 2.1, Cubism 3 and Cubism 4; where Cubism
4 is backward-compatible with Cubism 3 models.

This plugin supports all variants of Live2D models by using Cubism 2.1 and Cubism 4.

#### Cubism Core

Before using the plugin, you'll need to include the Cubism runtime library, aka Cubism Core.

For Cubism 4, you need `live2dcubismcore.min.js` that can be extracted from
the [Cubism 4 SDK](https://www.live2d.com/download/cubism-sdk/download-web/), or be referred by
a [direct link](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js) (_however the direct link is quite
unreliable, don't use it in production!_).

For Cubism 2.1, you need `live2d.min.js`. It's no longer downloadable from the official
site [since 2019/9/4](https://help.live2d.com/en/other/other_20/), but can be
found [here](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib), and with
a [CDN link](https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js) that you'll probably need.

#### Individual Bundles

The plugin provides individual bundles for each Cubism version to reduce your app's size when you just want to use one
of the versions.

Specifically, there are `cubism2.js` and `cubism4.js` for respective runtime, along with an `index.js` that includes
both of them.

Note that if you want both the Cubism 2.1 and Cubism 4 support, use `index.js`, but _not_ the combination
of `cubism2.js` and `cubism4.js`.

To make it clear, here's how you would use these files:

- Use `cubism2.js`+`live2d.min.js` to support Cubism 2.1 models
- Use `cubism4.js`+`live2dcubismcore.min.js` to support Cubism 3 and Cubism 4 models
- Use `index.js`+`live2d.min.js`+`live2dcubismcore.min.js` to support all versions of models

## Installation

#### Via npm

```sh
npm install pixi-live2d-display
```

```js
import { Live2DModel } from 'pixi-live2d-display';

// if only Cubism 2.1
import { Live2DModel } from 'pixi-live2d-display/cubism2';

// if only Cubism 4
import { Live2DModel } from 'pixi-live2d-display/cubism4';
```

#### Via CDN

```html
<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js"></script>

<!-- if only Cubism 2.1 -->
<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/cubism2.min.js"></script>

<!-- if only Cubism 4 -->
<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/cubism4.min.js"></script>
```

In this way, all the exported members are available under `PIXI.live2d` namespace, such as `PIXI.live2d.Live2DModel`.

## Basic usage

```javascript
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';

// expose PIXI to window so that this plugin is able to
// reference window.PIXI.Ticker to automatically update Live2D models
window.PIXI = PIXI;

(async function () {
  const app = new PIXI.Application({
    view: document.getElementById('canvas'),
  });

  const model = await Live2DModel.from('shizuku.model.json');

  app.stage.addChild(model);

  // transforms
  model.x = 100;
  model.y = 100;
  model.rotation = Math.PI;
  model.skew.x = Math.PI;
  model.scale.set(2, 2);
  model.anchor.set(0.5, 0.5);

  // interaction
  model.on('hit', (hitAreas) => {
    if (hitAreas.includes('body')) {
      model.motion('tap_body');
    }
  });
})();
```

## Package importing

When importing Pixi packages on-demand, you may need to manually register some plugins to enable optional features.

```javascript
import { Application } from '@pixi/app';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { InteractionManager } from '@pixi/interaction';
import { Live2DModel } from 'pixi-live2d-display';

// register Ticker for Live2DModel
Live2DModel.registerTicker(Ticker);

// register Ticker for Application
Application.registerPlugin(TickerPlugin);

// register InteractionManager to make Live2D models interactive
Renderer.registerPlugin('interaction', InteractionManager);

(async function () {
  const app = new Application({
    view: document.getElementById('canvas'),
  });

  const model = await Live2DModel.from('shizuku.model.json');

  app.stage.addChild(model);
})();
```

---

The example Live2D models, Shizuku (Cubism 2.1) and Haru (Cubism 4), are redistributed under
Live2D's [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html).


## 🌐 Web Resources & Interactive Index
- [HUNGRY NOOB CAFE SIMULATOR](https://ilearnworld.github.io/hungry-noob-cafe-simulator.html)
- [MR RACER CAR RACING](https://learnquesters.pages.dev/mr-racer-car-racing.html)
- [CATEGORY ARENA254](https://theskillquest.pages.dev/category-arena254.html)
- [PLANTS VS ZOMBIES WAR](https://studyquesthub.web.app/plants-vs-zombies-war.html)
- [ANGRY SNAKE IO](https://studyquests.github.io/angry-snake-io.html)
- [TCG CARD CLICKER](https://themindplaying.web.app/tcg-card-clicker.html)
- [PLANE CRASH RAGDOLL SIMULATOR](https://themindzone.pages.dev/plane-crash-ragdoll-simulator.html)
- [ALPHABET LORE MAZE](https://themindplays.pages.dev/alphabet-lore-maze.html)
- [ONE LINE DRAWING](https://themindzone.pages.dev/one-line-drawing.html)
- [CATEGORY TURN BASED30](https://learnquester.pages.dev/category-turn-based30.html)
- [THE SORTING MART](https://studyquests.github.io/the-sorting-mart.html)
- [SAVE STRANDING FISH](https://iskillquest.pages.dev/save-stranding-fish.html)
- [GUN FEST](https://themindplay.pages.dev/gun-fest.html)
- [OLE BUNNY](https://studyquests.github.io/ole-bunny.html)
- [CATEGORY RPG80](https://theskillquest.pages.dev/category-rpg80.html)
- [21 CARDS](https://thelearnquester.web.app/21-cards.html)
- [MY CAKE SHOP BAKE SERVE](https://learnquesters.pages.dev/my-cake-shop-bake-serve.html)
- [MANYUNYA SAVING THE PRINCESS](https://learnquesters.pages.dev/manyunya-saving-the-princess.html)
- [CATEGORY CASUAL971](https://studyquests.github.io/category-casual971.html)
- [CITY DRIFT RACING](https://quizverses.github.io/city-drift-racing.html)
- [LOVE TILE TRIO](https://learnquesters.pages.dev/love-tile-trio.html)
- [SEAT JAM 3D](https://themindplays.pages.dev/seat-jam-3d.html)
- [CUTE COLORING GAMES](https://learnquesters.pages.dev/cute-coloring-games.html)
- [MONSTER DASH](https://themindzone.pages.dev/monster-dash.html)
- [MINI GOLF SAGA](https://themindplay.pages.dev/mini-golf-saga.html)
- [CATEGORY MATCH 3](https://themindplaying.web.app/category-match-3.html)
- [TINY BAKER OCEAN JELLY CAKE](https://quizverses-9d2f2.web.app/tiny-baker-ocean-jelly-cake.html)
- [LEMONADE TYCOON IDLE](https://themindplay.pages.dev/lemonade-tycoon-idle.html)
- [TROLL THE TEACHER](https://iskillquest.pages.dev/troll-the-teacher.html)
- [TEACHER SIMULATOR CHRISTMAS EXAM](https://theskillquest.pages.dev/teacher-simulator-christmas-exam.html)
- [IMPOSTER 3D](https://learnquesters.pages.dev/imposter-3d.html)
- [STICKMAN MEGA BOSS BATTLES](https://learnquester.github.io/stickman-mega-boss-battles.html)
- [CATEGORY CASUAL 3](https://theskillquest.pages.dev/category-casual-3.html)
- [SKIBRONX RUNNER](https://themindzone.pages.dev/skibronx-runner.html)
- [BRAINROT HOOK SWING](https://themindplay.github.io/brainrot-hook-swing.html)
- [CATEGORY RAMMERHEAD](https://iskillquest.pages.dev/category-rammerhead.html)
- [GOOD YARD](https://themindplay.github.io/good-yard.html)
- [OBBY PUMP UP YOUR MUSCLES 1 PER SECOND](https://themindplays.pages.dev/obby-pump-up-your-muscles-1-per-second.html)
- [CATEGORY COOKING](https://thelearnquesters.pages.dev/category-cooking.html)
- [CATEGORY MAHJONG CONNECT](https://themindplay.github.io/category-mahjong-connect.html)
- [CATEGORY 2048](https://themindplaying.web.app/category-2048.html)
- [PRINCESS ROYAL WEDDING](https://theskillquest.pages.dev/princess-royal-wedding.html)
- [BLOCKS STACK RUSH](https://quizverses.github.io/blocks-stack-rush.html)
- [BALL PAINT 3D](https://themindzone.pages.dev/ball-paint-3d.html)
- [INFINITE CRAFT](https://theskillquest.pages.dev/infinite-craft.html)
- [PUZZLE WOOD BLOCK](https://learnquesters.pages.dev/puzzle-wood-block.html)
- [QUEENS ROYAL SUDOKU PUZZLE](https://themindzone.pages.dev/queens-royal-sudoku-puzzle.html)
- [CATEGORY BLOCK94](https://learnquester.pages.dev/category-block94.html)
- [CATEGORY CASUAL](https://studyquests.github.io/category-casual.html)
- [CATEGORY OBSTACLE299](https://theskillquest.pages.dev/category-obstacle299.html)
- [321 CHOOSE THE DIFFERENT](https://themindplay.pages.dev/321-choose-the-different.html)
- [CATEGORY SOLITAIRE](https://learnquester.pages.dev/category-solitaire.html)
- [SNEAKER FACTORY](https://themindzone.pages.dev/sneaker-factory.html)
- [CONSTRUCTION SET 3D BUILDER](https://thequizzone.pages.dev/construction-set-3d-builder.html)
- [CATEGORY 1 PLAYER139](https://quizverses.github.io/category-1-player139.html)
- [DRESS PRINCESS](https://themindplays.pages.dev/dress-princess.html)
- [TOBININ](https://thequizzone.pages.dev/tobinin.html)
- [CATEGORY MAGIC46](https://studyquests.pages.dev/category-magic46.html)
- [CHICKEN WILD RUN](https://thequizzone.pages.dev/chicken-wild-run.html)
- [BITGOBLINS RPG SIMULATOR](https://learnquester.pages.dev/bitgoblins-rpg-simulator.html)
- [MICROPLASTICS FEEDING](https://thelearnquester.web.app/microplastics-feeding.html)
- [VARIETY MECHA](https://thequizzone.pages.dev/variety-mecha.html)
- [BUBBLE MANIA SHOOTER](https://quizverses.github.io/bubble-mania-shooter.html)
- [UNO ONLINE](https://themindplay.github.io/uno-online.html)
- [SCARY PAIRS](https://quizverses.github.io/scary-pairs.html)
- [STACK UP](https://thequizzone.pages.dev/stack-up.html)
- [BALLISTIC BREAKTHROUGH](https://learnquesters.pages.dev/ballistic-breakthrough.html)
- [CHROME CARS GARAGE](https://iskillquest.pages.dev/chrome-cars-garage.html)
- [STACK UP](https://themindplay.github.io/stack-up.html)
- [CATEGORY ADVENTURE 2](https://thelearnquesters.pages.dev/category-adventure-2.html)
- [CATEGORY PUZZLE](https://studyquests.github.io/category-puzzle.html)
- [BUILD A GO KART](https://quizverses.github.io/build-a-go-kart.html)
- [ARROW SURVIVAL 15 SECONDS](https://learnquester.github.io/arrow-survival-15-seconds.html)
- [SAMURAI MADNESS](https://studyquesthub.web.app/samurai-madness.html)
- [FASHION MAKEOVER DASH](https://quizverses.github.io/fashion-makeover-dash.html)
- [BRAWL STARS SOUND](https://themindplay.github.io/brawl-stars-sound.html)
- [WENDY SOFT GIRL MAKEUP](https://learnquesters.pages.dev/wendy-soft-girl-makeup.html)
- [SOCCER DASH](https://themindplay.pages.dev/soccer-dash.html)
- [ROBOT TRANSFORM RACE](https://themindplay.pages.dev/robot-transform-race.html)
- [CATEGORY JUMPING150](https://studyquests.pages.dev/category-jumping150.html)
- [TABLE TENNIS OPEN](https://themindplay.github.io/table-tennis-open.html)
- [CATEGORY WAR137](https://studyquests.github.io/category-war137.html)
- [CATEGORY SURVIVAL365](https://studyquesthub.web.app/category-survival365.html)
- [CATEGORY ZOMBIE175](https://thelearnquester.web.app/category-zombie175.html)
- [CATEGORY FPS 2](https://learnquester.pages.dev/category-fps-2.html)
- [ASMR WASHING FIXING](https://themindplay.pages.dev/asmr-washing-fixing.html)
- [RANCH ADVENTURES](https://quizverses-9d2f2.web.app/ranch-adventures.html)
- [INDEX32](https://themindplay.pages.dev/index32.html)
- [MAHJONG CONNECT MAJONG CLASS](https://themindplays.pages.dev/mahjong-connect-majong-class.html)
- [MAHJONG RIDDLES EGYPT](https://quizverses.github.io/mahjong-riddles-egypt.html)
- [CATEGORY AVOID295](https://thelearnquester.web.app/category-avoid295.html)
- [BLUE VS RED](https://themindplays.pages.dev/blue-vs-red.html)
- [FAMILY TREE EMOJI](https://studyquesthub.web.app/family-tree-emoji.html)
- [LAST WAR SURVIVAL](https://themindzone.pages.dev/last-war-survival.html)
- [SAVE THE DADDY](https://quizverses-9d2f2.web.app/save-the-daddy.html)
- [CATEGORY POINT AND CLICK124](https://learnquesters.pages.dev/category-point-and-click124.html)
- [KAWAII FRIENDS TILES MATCHER](https://studyquesthub.web.app/kawaii-friends-tiles-matcher.html)
- [CATEGORY ONE BUTTON](https://studyquests.github.io/category-one-button.html)
- [ZUMBA STORY](https://studyquesthub.web.app/zumba-story.html)
- [FOOT HOSPITAL](https://quizverses-9d2f2.web.app/foot-hospital.html)
- [CATEGORY QUIZ](https://studyquests.github.io/category-quiz.html)
- [SUPER BITCOIN BOY](https://theskillquest.pages.dev/super-bitcoin-boy.html)
- [CATEGORY DEFENSE176](https://learnquester.pages.dev/category-defense176.html)
- [CATEGORY MINECRAFT](https://quizverses-9d2f2.web.app/category-minecraft.html)
- [MOTO X3M DEAD AHEAD](https://learnquester.pages.dev/moto-x3m-dead-ahead.html)
- [AIDAN IN DANGER](https://learnquester.github.io/aidan-in-danger.html)
- [CATEGORY PUZZLE 6](https://quizverses-9d2f2.web.app/category-puzzle-6.html)
- [MY ARCADE CENTER](https://iskillquest.pages.dev/my-arcade-center.html)
- [PYRAMIDZ](https://quizverses.github.io/pyramidz.html)
- [LOVIE CHICS COACHELLA FESTIVAL](https://thequizzone.pages.dev/lovie-chics-coachella-festival.html)
- [CLOAK MASTER SHOOTER RUN](https://thequizzone.pages.dev/cloak-master-shooter-run.html)
- [CATEGORY PUZZLE 2](https://studyquests.github.io/category-puzzle-2.html)
- [CELEBRITY SPRING FASHION TRENDS](https://iskillquest.pages.dev/celebrity-spring-fashion-trends.html)
- [INDEX21](https://themindplaying.web.app/index21.html)
- [THE SORT AGENCY](https://learnquesters.pages.dev/the-sort-agency.html)
- [MAHJONG SORT PUZZLE](https://themindplay.github.io/mahjong-sort-puzzle.html)
- [CLASSIC LABYRINTH 3D MAZE](https://learnquester.github.io/classic-labyrinth-3d-maze.html)
- [SHOTTING BALLS](https://quizverses.github.io/shotting-balls.html)
- [SCREW MATCH](https://iskillplay.web.app/screw-match.html)
- [CRIME THEFT GANGSTER PARADISE](https://enskillcrafts.pages.dev/crime-theft-gangster-paradise.html)
- [INDEX8](https://thelearnquester.web.app/index8.html)
- [RESCUE RIFT](https://themindskillplayplay.pages.dev/rescue-rift.html)
- [CATEGORY CASUAL 9](https://iskillplay.web.app/category-casual-9.html)
- [CATEGORY TOP DOWN251](https://themindskillplayplay.pages.dev/category-top-down251.html)
- [WORLD WAR BROTHERS WW2](https://thequizzone.pages.dev/world-war-brothers-ww2.html)
- [PING PONG BATTLE TABLE TENNIS](https://thelearnquester.web.app/ping-pong-battle-table-tennis.html)
- [STICKMAN HALLOWEEN SURVIVE](https://themindplay.pages.dev/stickman-halloween-survive.html)
- [SPACE CLEANER](https://themindplay.pages.dev/space-cleaner.html)
- [INDEX27](https://iskillplay.web.app/index27.html)
- [JUST MAHJONG](https://themindskillplayplay.pages.dev/just-mahjong.html)
