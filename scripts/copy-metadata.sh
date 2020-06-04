#!/usr/bin/env bash
set -e

# This script copies files that are required by NPM from
# the root folder to the dist folder since that's where the package is publishd from.
# 
# Having them here though is good for e.g. github repo home page

DIST_PATH=dist

# Copy all the NPM metadata files to dist folder
cp LICENSE "$DIST_PATH/LICENSE"
cp package.json "$DIST_PATH/package.json"
cp README.md "$DIST_PATH/"