# pixi-live2d-display

![GitHub package.json version](https://img.shields.io/github/package-json/v/guansss/pixi-live2d-display?style=flat-square)
![Cubism version](https://img.shields.io/badge/Cubism-2/3/4-ff69b4?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/guansss/pixi-live2d-display/Test%20CI?style=flat-square)

> :warning: 该 readme 版本为 v0.4.0，如果要找 v0.3.1 版本的话, 请查看[这里](https://github.com/guansss/pixi-live2d-display/blob/dfa7f764f241c1c802e92a7ab490206369746efd/README.md).

为 [PixiJS](https://github.com/pixijs/pixi.js) v6 提供的 Live2D 插件

此项目旨在成为 web 平台上的通用 Live2D 框架。由于 Live2D 的官方框架非常复杂且不可靠，这个项目已将其重写以提供统一且简单的 API，使你可以从较高的层次来控制 Live2D 模型而无需了解其内部的工作原理

#### 特性

-   支持所有版本的 Live2D 模型
-   支持 PIXI.RenderTexture 和 PIXI.Filter
-   Pixi 风格的变换 API：position, scale, rotation, skew, anchor
-   自动交互：鼠标跟踪, 点击命中检测
-   比官方框架更好的动作预约逻辑
-   从上传的文件或 zip 文件中加载 (实验性功能)
-   完善的类型定义 - 我们都喜欢类型！

#### 要求

-   PixiJS：>6
-   浏览器：WebGL， ES6

#### 示例

-   [基础示例](https://codepen.io/guansss/pen/oNzoNoz/left?editors=1010)
-   [交互示例](https://codepen.io/guansss/pen/KKgXBOP/left?editors=0010)
-   [渲染纹理与滤镜示例](https://codepen.io/guansss/pen/qBaMNQV/left?editors=1010)
-   [Live2D Viewer Online](https://guansss.github.io/live2d-viewer-web/)

#### 文档

-   [文档](https://guansss.github.io/pixi-live2d-display)（暂无中文翻译）
-   [API 文档](https://guansss.github.io/pixi-live2d-display/api/index.html)

## Cubism

Cubism 是 Live2D SDK 的名称，目前有 3 个版本：Cubism 2.1、Cubism 3、Cubism 4，其中 Cubism 4 可以与 Cubism 3 的模型兼容

该插件使用 Cubism 2.1 和 Cubism 4，从而支持所有版本的 Live2D 模型

#### Cubism Core

在使用该插件之前，你需要加载 Cubism 运行时，也就是 Cubism Core

Cubism 4 需要加载 `live2dcubismcore.min.js`，可以从 [Cubism 4 SDK](https://www.live2d.com/download/cubism-sdk/download-web/)
里解压出来，或者直接引用[这个链接](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js)
（_链接偶尔会挂掉，不要在生产版本中使用！_）

Cubism 2.1 需要加载 `live2d.min.js`，[从 2019/9/4 起](https://help.live2d.com/en/other/other_20/)
，官方已经不再提供该版本 SDK 的下载，但是可以从 [这里](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib)
找到，以及你大概想要的 [CDN 链接](https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js)

#### 单独的打包文件

该插件为每个 Cubism 版本提供了单独的打包文件，从而在你只想使用其中一个版本的时候减少需要加载文件的大小。

具体来说，为两种版本分别提供了 `cubism2.js` 和 `cubism4.js`，以及一个同时包含了两种版本的 `index.js`

注意，如果你想同时支持 Cubism 2.1 和 Cubism 4 的话，请使用 `index.js`，_而不要同时使用_ `cubism2.js` 和 `cubism4.js`

为了更明确一点，这里列出使用这些文件的方法：

-   使用 `cubism2.js`+`live2d.min.js` 以支持 Cubism 2.1 模型
-   使用 `cubism4.js`+`live2dcubismcore.min.js` 以支持 Cubism 3 和 Cubism 4 模型
-   使用 `index.js`+`live2d.min.js`+`live2dcubismcore.min.js` 以支持所有版本的模型

## 安装

#### 通过 npm

```sh
npm install pixi-live2d-display
```

```js
import { Live2DModel } from 'pixi-live2d-display';

// 如果只需要 Cubism 2.1
import { Live2DModel } from 'pixi-live2d-display/cubism2';

// 如果只需要 Cubism 4
import { Live2DModel } from 'pixi-live2d-display/cubism4';
```

#### 通过 CDN

```html
<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js"></script>

<!-- 如果只需要 Cubism 2.1 -->
<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/cubism2.min.js"></script>

<!-- 如果只需要 Cubism 4 -->
<script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/cubism4.min.js"></script>
```

通过这种方式加载的话，所有成员都会被导出到 `PIXI.live2d` 命名空间下，比如 `PIXI.live2d.Live2DModel`

## 基础使用

```javascript
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';

// 将 PIXI 暴露到 window 上，这样插件就可以通过 window.PIXI.Ticker 来自动更新模型
window.PIXI = PIXI;

(async function () {
    const app = new PIXI.Application({
        view: document.getElementById('canvas'),
    });

    const model = await Live2DModel.from('shizuku.model.json');

    app.stage.addChild(model);

    // 变换
    model.x = 100;
    model.y = 100;
    model.rotation = Math.PI;
    model.skew.x = Math.PI;
    model.scale.set(2, 2);
    model.anchor.set(0.5, 0.5);

    // 交互
    model.on('hit', (hitAreas) => {
        if (hitAreas.includes('body')) {
            model.motion('tap_body');
        }
    });
})();
```

## 包导入

当按需导入 Pixi 的包时，需要手动注册相应的组件来启用可选功能

```javascript
import { Application } from '@pixi/app';
import { Ticker } from '@pixi/ticker';
import { InteractionManager } from '@pixi/interaction';
import { Live2DModel } from 'pixi-live2d-display';

// 为 Live2DModel 注册 Ticker
Live2DModel.registerTicker(Ticker);

// 为 Application 注册 Ticker
Application.registerPlugin(TickerPlugin);

// 注册 InteractionManager 以支持 Live2D 模型的自动交互
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

示例的 Live2D 模型 Shizuku (Cubism 2.1) 和 Haru (Cubism 4) 遵守 Live2D 的
[Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html)
