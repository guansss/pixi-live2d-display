## Cloning the repo

#### Cloning via SSH

Run the following command to clone the repo with submodule:

```sh
git clone git@github.com:guansss/pixi-live2d-display.git --recursive
```

#### Cloning via HTTPS

Run the following command to clone the repo _without_ submodule:

```sh
git clone https://github.com/guansss/pixi-live2d-display.git
```

Then follow one of the following methods to manually install the submodule:

**Method 1**

```sh
git config --global url."https://github.com/guansss/CubismWebFramework.git".insteadOf "git@github.com:guansss/CubismWebFramework.git"

git submodule sync
git submodule update --init
```

**Method 2**

Edit `.gitmodules` and replace `git@github.com:guansss/CubismWebFramework.git` with `https://github.com/guansss/CubismWebFramework.git` (don't commit this change if you are contributing to this project!).

Then run:

```sh
git submodule sync
git submodule update --init
```

## Setup

Install dependencies:

```sh
npm install
```

Download Live2D core files into `./core`:

```sh
npm run setup
```

## Testing

There's a bundle test that requires a production build. Before running the tests for the first time, you need to build the project: (at some point I will automate this step so you don't have to do it manually)

```sh
npm run build
```

Then you can run the tests:

```sh
npm run test
```

Or run the tests and update snapshots:

```sh
npm run test:u
```

If you get an error like `This version of ChromeDriver only supports Chrome version XX`, you need to do either of the following:

- Check if your Chrome browser has a "Relaunch to update" button in the top right corner. If it does, click the button to update Chrome to the latest version.
- Delete the installed `chromedriver` folder (for example `C:\Users\XXX\AppData\Local\Temp\chromedriver\win64-120.0.6099.109\chromedriver-win64` on Windows).

If you get an error like `Error: spawn C:\Users\XXX\AppData\Local\Temp\chromedriver\win64-120.0.6099.109\chromedriver-win64\chromedriver.exe ENOENT`, you need to delete the `chromedriver` folder just like the step 2 above.

## Playground

The playground is for debugging and testing. To run the playground:

```sh
npm run playground
```

Then make changes to `playground/index.ts` and check the result.

Changes to this file should _not_ be committed to git. You can run this command to tell git not to track this file:

```sh
git update-index --skip-worktree playground/index.ts
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any ideas or suggestions.

Before contributing, or better yet, before each commit, please run the following command to lint and fix the code:

```sh
npm run lint:fix
```

If there are any errors that cannot be fixed automatically, please fix them manually.
