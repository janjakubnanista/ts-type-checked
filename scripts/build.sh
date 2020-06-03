#!/usr/bin/env bash

# Some file system information first
SCRIPTS_PATH=$(dirname $0)
ROOT_PATH="$SCRIPTS_PATH/.."
DIST_PATH="$ROOT_PATH/dist"

set -e
set -x

# Clean the build folder
yarn clean

# Make sure everything is okay
yarn lint
yarn test

# Build the package
yarn tsc

# Lint the build
yarn lint:fix

# Copy all the metadata files to dist
cp LICENSE "$DIST_PATH/LICENSE"
cp index.js "$DIST_PATH/index.js"
cp index.d.ts "$DIST_PATH/index.d.ts"
cp package.json "$DIST_PATH/package.json"
cp *.md "$DIST_PATH/"