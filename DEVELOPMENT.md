## Setup

```sh
# clone the repo and submodule (cubism)
git clone git@github.com:guansss/pixi-live2d-display.git --recursive

# install dependencies
npm install

# download Live2D core files into `./core`
npm run setup
```

#### Cloning via HTTPS

If you didn't set up a SSH key for GitHub, you can use HTTPS instead:

```sh
# omit the `--recursive` flag
git clone https://github.com/guansss/pixi-live2d-display.git
```

Then edit `.gitmodules` and change the `url` of `cubism` submodule to `https://github.coguansss/CubismWebFramework.git`, and run the following command to install the submodule:

```sh
git submodule sync
git submodule update --init
```

If you are contributing to this project, please do not commit the changes to `.gitmodules`.

## Testing

There's a browser test suite that requires production bundle, so you'll need to build before running tests.

You don't have to build it every time, just do it when you think necessary.

```sh
npm run build

# run test headlessly
npm run test

# run test with GUI
npm run test:debug
```

## Playground

There's a playground with hot reload enabled, useful for debugging.

```sh
npm run playground
```

Then make changes to `playground/index.ts` and check the result.

Modifications of this file should *not* be committed to git. You can run this command to tell git not to track this file:

```sh
git update-index --skip-worktree playground/index.ts
```
