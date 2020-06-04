#!/usr/bin/env bash

# Some file system information first
SCRIPTS_PATH=$(dirname $0)
ROOT_PATH="$SCRIPTS_PATH/.."
DIST_PATH="$ROOT_PATH/dist"

set -e
set -x

ls -al

# Clean the build folder
yarn clean

# Make sure everything is okay
yarn lint

# Build the package
yarn tsc

# Lint the build
yarn lint:fix

# Copy all the metadata files to dist
cp LICENSE "$DIST_PATH/LICENSE"
cp index.js "$DIST_PATH/index.js"
cp index.d.ts "$DIST_PATH/index.d.ts"
cp package.json "$DIST_PATH/package.json"

# cp yarn.lock "$DIST_PATH/yarn.lock"
# cp .npmrc "$DIST_PATH/.npmrc" || true
# cp .yarnrc "$DIST_PATH/.yarnrc" || true

cp *.md "$DIST_PATH/"