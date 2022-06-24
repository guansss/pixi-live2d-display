// run this to tell git not to track this file
// git update-index --skip-worktree test/playground/index.ts

import { Application, Ticker } from 'pixi.js';
import { Live2DModel } from '../src';

Live2DModel.registerTicker(Ticker);

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const modelURL = 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D/Senko_Normals/senko.model3.json';

async function main() {
    const app = new Application({
        resizeTo: window,
        view: canvas,
    });
    (window as any).app = app;

    const model = await Live2DModel.from(modelURL);

    app.stage.addChild(model);
}

main().then();

function checkbox(name: string, onChange: (checked: boolean) => void) {
    const id = name.replace(/\W/g, '').toLowerCase();

    document.getElementById('control')!.innerHTML += `
<p>
  <input type="checkbox" id="${id}">
  <label for="${id}">${name}</label>
</p>`;

    const checkbox = document.getElementById(id) as HTMLInputElement;

    checkbox.addEventListener('change', (ev) => {
        onChange(checkbox.checked);
    });

    onChange(checkbox.checked);
}
