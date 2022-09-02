## Setup

```sh
yarn install

# this sets up the environments
yarn setup
```

## Testing

There's a browser test suite that requires production bundle, so you'll need to build before running tests.

You don't have to build it every time, just do it when you think necessary.

```sh
yarn build
```

Run `test` for a headless test, or `test:debug` for a headful test.

```sh
yarn test

yarn test:debug
```

## Playground

There's a playground with hot reload enabled, useful for debugging.

```sh
yarn playground
```

Then make changes to `playground/index.ts` and check the result.

Modifications of this file should *not* be committed to git. You can run this command to tell git not to track this file:

```sh
git update-index --skip-worktree playground/index.ts
```
