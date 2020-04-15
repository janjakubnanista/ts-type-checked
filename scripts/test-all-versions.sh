#!/usr/bin/env bash

# This script collects all the target TypeScript versions from versions.txt file
# and runs the test suite for each one of them.

SCRIPTS_PATH=$(dirname $0)

# Some simple yet cute printing
function printHeader {
  echo "########################################"
  echo ""
  echo ""
  echo "$1"
  echo ""
  echo ""
  echo "########################################"
}

# Now for the main act we'll collect all the TS version numbers
# we are interested in and run the test suite for each one, one by one
for VERSION in $(cat $SCRIPTS_PATH/versions.txt); do
  # Newlines are allowed and skipped
  if [ -z "$VERSION" ]; then
    continue
  fi

  printHeader "Testing with TypeScript version $VERSION"

  $SCRIPTS_PATH/test.sh -v "$VERSION"

  printHeader "Done testing with TypeScript version $VERSION"
done