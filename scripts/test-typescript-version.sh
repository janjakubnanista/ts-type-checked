#!/usr/bin/env bash

# This script is used to run the test suite against a particular version of TypeScript.
# It is important in order to make sure that the transformation is correct for all supported TS versions.
#
# IMPORTANT This script relies on the fact that the code has already been built
#
# The idea is to have a separate package under the `test` folder with its own package.json.
# This package contains the test suite (as well as some test utilities) that will be run.

# Some file system information first
SCRIPTS_PATH=$(dirname $0)
PROJECT_PATH="$SCRIPTS_PATH/.."

# As the first step we need to get the TS version to be used
VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Please provide a valid typescript version number"
  exit 1
fi

# This will make sure that after the tests are run the package.json
# and yarn.lock files are restored to their original state
#
# TODO Maybe as a next step this whole folder could be copied first to a non-tracked
# location, only then the tests would run
function cleanup {
  echo "Cleaning up modified git files after testing:"
  echo ""
  git status
  echo ""

  # git co -- "$PROJECT_PATH/test/package.json"
  # git co -- "$PROJECT_PATH/test/yarn.lock"
}

# Register the cleanup function
trap cleanup EXIT

set -x

# Install the test project dependencies
yarn

# Then add a specific version of typescript
npm install --no-save --no-package-lock typescript@${VERSION}

# And finally copy our package build artifacts to the node_modules for this project
#
# IMPORTANT / HACKY linking would not work since the typescript versions used by the original package
# and this test package would differ so we need to manually copy the build files over
TTC_NODE_MODULE_PATH="node_modules/ts-type-checked"
mkdir -p $TTC_NODE_MODULE_PATH/transformer
cp ../package.json $TTC_NODE_MODULE_PATH/package.json
cp ../index.js $TTC_NODE_MODULE_PATH/index.js
cp ../index.d.ts $TTC_NODE_MODULE_PATH/index.d.ts
cp ../transformer/*.js $TTC_NODE_MODULE_PATH/transformer

# And run tests
yarn jest --clearCache
yarn jest