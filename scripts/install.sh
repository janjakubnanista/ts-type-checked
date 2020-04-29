#!/usr/bin/env bash

# This scripts packs the ts-type-checked package for distribution and places it into node_modules folder
# in the current working directory

SCRIPTS_PATH=$(dirname $0)
ROOT_PATH="$SCRIPTS_PATH/.."

set -e
set -x

# Remove any existing tarballs
rm -rf ts-type-checked-*.tgz

# Remove any existing module folder
rm -rf node_modules/ts-type-checked

# Remove any remaining untarred stuff
rm -rf node_modules/package

# Pack the package into a tarball
npm pack "$ROOT_PATH" 2>/dev/null

# Untar it into node_modules (this will create a folder called node_modules/package)
tar zxvf ts-type-checked-*.tgz -C node_modules

# Remove the newly created tarball
rm -rf ts-type-checked-*.tgz

# Rename the package/ folder to ts-type-checked
mv node_modules/package node_modules/ts-type-checked

