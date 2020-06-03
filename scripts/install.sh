#!/usr/bin/env bash

# This scripts copies the built package from dist folder into node_modules

SCRIPTS_PATH=$(dirname $0)
ROOT_PATH="$SCRIPTS_PATH/.."
DIST_PATH="$ROOT_PATH/dist"

set -e
set -x

cp -R $DIST_PATH/ node_modules/ts-type-checked/