#!/usr/bin/env bash

SCRIPTS_PATH=$(dirname $0)

function printHeader {
  echo "########################################"
  echo ""
  echo ""
  echo "$1"
  echo ""
  echo ""
  echo "########################################"
}

function testVersion {
  VERSION=$1

  printHeader "Testing with TypeScript version $VERSION"

  ./$SCRIPTS_PATH/test-typescript-version.sh "$VERSION"

  printHeader "Done testing with TypeScript version $VERSION"
}

testVersion 3.9.0-beta
testVersion 3.8.3
testVersion 3.8.2
testVersion 3.7.5
testVersion 3.7.4
testVersion 3.7.3
testVersion 3.7.2