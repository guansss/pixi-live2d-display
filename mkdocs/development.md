## Setup

Run the `setup` script to set up the environment.

```sh
yarn setup
```

## Testing

Run `test` for a headless test, or `test:debug` for a headful test.

```sh
yarn test

yarn test:debug
```

Note there's a browser test suite that requires a production bundle, so you'll need to build the library before running
tests.

```sh
yarn build
```

You don't have to build it every time, just do it when you think necessary.

## Playground

There's a playground with hot reload enabled, it's useful for debugging.

```sh
yarn playground
```

Then make changes to the `tests/playground/index.ts` and check the result.

Modifications of this file should *not* be committed to git. You can run this command to tell git not to track this
file:

```sh
git update-index --skip-worktree test/playground/index.ts
```
