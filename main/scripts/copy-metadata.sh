#!/usr/bin/env bash
set -e

# Output coloring
DIMMED='\033[1;30m'
HIGHLIGHT='\033[1;37m'
SUCCESS='\033[0;32m'
ERROR='\033[0;31m'
NC='\033[0m'

# This script copies files that are required by NPM from
# the root folder to the dist folder since that's where the package is publishd from.
# 
# Having them here though is good for e.g. github repo home page
SRC_PATH=$1
if [ ! -d "$SRC_PATH" ]; then
  echo "'$SRC_PATH' is not a valid src directory"
fi

DIST_PATH=$2
if [ ! -d "$DIST_PATH" ]; then
  echo "'$DIST_PATH' is not a valid dist directory"
fi

# Copy all the NPM metadata files to dist folder
cp ../LICENSE "$DIST_PATH/LICENSE"
cp ./package.json "$DIST_PATH/package.json"
cp ../README.md "$DIST_PATH/README.md"