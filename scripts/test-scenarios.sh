#!/usr/bin/env bash

# This script is used to run the test scenarios in testScenarios directory
# 
# These are real life examples of TypeScript setups that need to be checked in addition
# to having the e2e tests in test directory

DEBUG=

# Get the script arguments
# 
# -d|--debug                Whether to start tests in debug mode
while [[ $# -gt 0 ]]; do
  OPTION="$1"

  case $OPTION in
      -d|--debug)
      DEBUG=1
      shift # past argument
      ;;
      *)
      shift # past argument
      ;;
  esac
done

CURRENT_PATH=$(pwd)
SCRIPTS_PATH=$(dirname $0)
ROOT_PATH="$SCRIPTS_PATH/.."

# Grab all the scenarios from test scenarios directory
TEST_SCENARIOS_PATH="$ROOT_PATH/testScenarios"
TEST_SCENARIOS_DIRECTORIES=$(find "$TEST_SCENARIOS_PATH" -type d -depth 1)

# This is for the loops below
IFS='
'

for TEST_SCENARIO_DIRECTORY in $TEST_SCENARIOS_DIRECTORIES; do
  echo "Testing setup $TEST_SCENARIO_DIRECTORY"

  # Move to the scenario directory
  cd "$CURRENT_PATH"
  cd "$TEST_SCENARIO_DIRECTORY"

  # Install fresh copy of ts-type-checked
  rm -rf node_modules/ts-type-checked
  yarn --check-files

  if [ -z "$DEBUG" ]; then
    yarn test
  else
    yarn test:debug
  fi
done