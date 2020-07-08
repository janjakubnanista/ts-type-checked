#!/usr/bin/env bash

# This script is used to run the test suite against a particular version of TypeScript.
# It is important in order to make sure that the transformation is correct for all supported TS versions.
#
# IMPORTANT This script relies on the fact that the code has already been built
#
# The idea is to have a separate package under the `test` folder with its own package.json.
# This package contains the test suite (as well as some test utilities) that will be run.

# Output coloring
DIMMED='\033[1;30m'
HIGHLIGHT='\033[1;37m'
SUCCESS='\033[0;32m'
ERROR='\033[0;31m'
NC='\033[0m'

set -e

DEBUG=
VERSION=
TEST_PATTERN=
SETUP_PATTERN=

# Get the script arguments
# 
# -d|--debug                Whether to start jest in node --inspect mode
# -s|--setup <pattern>      The test setup pattern to run (matched against setup package.json name)
# -t|--test <pattern>       The test pattern to run (passed to jest)
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
      -s|--setup)
      SETUP_PATTERN="$2"
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

SCRIPTS_PATH=$(dirname $0)

if [ -z "$VERSION" ]; then
  printf "${ERROR}Please provide a valid typescript version number${NC}\n"
  exit 1
fi

# This function will be executed when the script is terminated
# 
# It needs to clean
function cleanup {
  # Restore snapshots of package.json and yarn.lock
  printf "${DIMMED}Restoring snapshots of package.json and yarn.lock...${NC}\n"

  if [ -f "package.json.snapshot" ]; then
    mv package.json.snapshot package.json
  fi

  if [ -f "yarn.lock.snapshot" ]; then
    mv yarn.lock.snapshot yarn.lock
  fi
}

# Make sure we clean up after the script
trap cleanup EXIT

printf "${HIGHLIGHT}Running tests for TypeScript version ${VERSION}${NC}\n"
printf "${DIMMED}Using test pattern ${NC}'$TEST_PATTERN'\n"
printf "${DIMMED}Using setup pattern ${NC}'$SETUP_PATTERN'\n"

# Save snapshots of package.json and yarn.lock
printf "${DIMMED}Saving snapshots of package.json and yarn.lock...${NC}\n"
cp package.json package.json.snapshot
cp yarn.lock yarn.lock.snapshot

printf "${DIMMED}Installing TypeScript version ${NC}${VERSION}${DIMMED}...${NC}\n"
yarn add --dev --exact --ignore-workspace-root-check typescript@${VERSION} > /dev/null

# Install dependencies for the whole test monorepo
printf "${DIMMED}Installing dependencies...${NC}\n"
yarn --check-files > /dev/null

# List all the setups that should be run for this TypeScript version
MATCHING_SETUPS=$($SCRIPTS_PATH/list-setups-for-typescript.js "$VERSION" "$SETUP_PATTERN")

for MATCHING_SETUP in $MATCHING_SETUPS; do
  # Yes the double --silent is necessary :)
  MATCHING_TESTS=$(yarn workspace --silent "$MATCHING_SETUP" --silent run jest "$TEST_PATTERN" --listTests)
  if [ -z "$MATCHING_TESTS" ]; then
    printf "${DIMMED}No matching tests in ${HIGHLIGHT}${MATCHING_SETUP}:${NC}\n"
    continue
  fi

  printf "${DIMMED}Running setup in ${HIGHLIGHT}${MATCHING_SETUP}:${NC}\n"

  # List all the setups that should be run for this TypeScript version
  printf "${DIMMED}TypeScript version verfication: ${NC}"
  ACTUAL_VERSION=$(yarn workspace "$MATCHING_SETUP" run tsc --version | grep "Version")
  MATCHING_VERSION=$(echo "$ACTUAL_VERSION" | grep "$VERSION")
  if [ -z "$MATCHING_VERSION" ]; then
    printf "${ERROR}Does not match!${NC}\n"
    exit 1
  else
    printf "${SUCCESS}Matches!${NC}\n"
  fi

  printf "${DIMMED}Clearing jest cache...${NC}\n"
  yarn workspace "$MATCHING_SETUP" run jest --clearCache

  if [ -z "$DEBUG" ]; then
    # In non-debug mode the jest bin is used
    yarn workspace "$MATCHING_SETUP" run jest "$TEST_PATTERN"
  else
    # In debug mode node is started with inspect flag
    yarn workspace "$MATCHING_SETUP" node --inspect-brk $(which jest) "$TEST_PATTERN" --runInBand
  fi

  printf "\n\n\n"
done