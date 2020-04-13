#!/usr/bin/env bash

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Please provide a valid typescript version number"
  exit 1
fi

PROJECT_PATH=$(pwd)

function cleanup {
  echo "Cleaning up modified files after testing:"
  echo ""
  git status
  echo ""

  git co -- "$PROJECT_PATH/test/e2e"
}

trap cleanup EXIT

# Go to test project
cd test/e2e

# Install the test project dependencies
yarn

# Then add a specific version of typescript
yarn add -D -E typescript@${VERSION} --no-lockfile --non-interactive

# And finally add our package
#
# IMPORTANT / HACKY linking would not work since the typescript versions used by the original package
# and this test package would differ so we need to manually copy the build files
TTC_NODE_MODULE_PATH="node_modules/ts-type-checked"
mkdir -p $TTC_NODE_MODULE_PATH/transformer
cp ../../package.json $TTC_NODE_MODULE_PATH/package.json
cp ../../index.js $TTC_NODE_MODULE_PATH/index.js
cp ../../index.d.ts $TTC_NODE_MODULE_PATH/index.d.ts
cp ../../transformer/*.js $TTC_NODE_MODULE_PATH/transformer

# And run tests
yarn test:clean
yarn test