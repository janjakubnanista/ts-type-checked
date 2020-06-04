#!/usr/bin/env bash

# This script is used to run the test suite against a particular version of TypeScript.
# It is important in order to make sure that the transformation is correct for all supported TS versions.
#
# IMPORTANT This script relies on the fact that the code has already been built
#
# The idea is to have a separate package under the `test` folder with its own package.json.
# This package contains the test suite (as well as some test utilities) that will be run.

set -x
set -e

DEBUG=
VERSION=
TS_LIB=es6

# Get the script arguments
# 
# -d|--debug                Whether to start jest in node --inspect mode
# -v|--version <version>    The typescript version to test against
while [[ $# -gt 0 ]]; do
  OPTION="$1"

  case $OPTION in
      -d|--debug)
      DEBUG=1
      shift # past argument
      ;;
      -t|--test)
      TEST_PATTERN="$2"
      shift # past argument
      shift # past value
      ;;
      -l|--lib)
      TS_LIB="$2"
      shift # past argument
      shift # past value
      ;;
      -v|--version)
      VERSION="$2"
      shift # past argument
      shift # past value
      ;;
      *)
      shift # past argument
      ;;
  esac
done

# Some file system information first
SCRIPTS_PATH=$(dirname $0)
ROOT_PATH="$SCRIPTS_PATH/.."
TEST_PATH="$ROOT_PATH/test"
SANDBOX_PATH="$ROOT_PATH/sandbox"

if [ -z "$VERSION" ]; then
  echo "Please provide a valid typescript version number"
  exit 1
fi
echo "Running tests for version $VERSION"

# Move to the test project
cd "$TEST_PATH"

# Install the test project dependencies
yarn

# And move back to root
cd ..

# Remove the sandbox folder
rm -rf "$SANDBOX_PATH"

# Copy the test project to the sandbox
cp -R "$TEST_PATH/" "$SANDBOX_PATH"

# Move to the untracked sandbox project
cd "$SANDBOX_PATH"

# Get the correct version of TypeScript config
cp "tsconfig.${TS_LIB}.json" "tsconfig.json"

# And add a specific version of typescript
yarn add -dev --exact typescript@${VERSION}

# Clear jest cache
yarn jest --clearCache

if [ -z "$DEBUG" ]; then
  # In non-debug mode the jest bin is used
  yarn jest "$TEST_PATTERN"
else
  # In debug mode node is started with inspect flag
  node --inspect ./node_modules/.bin/jest --runInBand "$TEST_PATTERN"
fi