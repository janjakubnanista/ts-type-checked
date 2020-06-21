#!/usr/bin/env bash

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Please provide version as the first argument"
  exit 1
fi

yarn version --strict-semver --new-version "$VERSION"