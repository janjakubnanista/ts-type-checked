.PHONY: all test examples

# The default target that builds the package
all: build lint

# Installs NPM dependencies for the root project and for the test and examples "workspaces"
install:
	yarn

# Clear all installed NPM dependencies
uninstall:
	find . -name "node_modules" -type d -exec rm -rf '{}' +

# Upgrade NPM dependencies
upgrade:
	yarn upgrade --latest
	cd test; yarn upgrade --latest
	cd examples; yarn upgrade --latest

# Build project
build:
	yarn rollup -c

# Build and watch project
watch:
	yarn rollup -cw

# Clean built project
clean:
	rm -rf dist

# Lint (source & built)
lint:
	yarn eslint . --fix --ext .js,.ts

# Run the complete test suite from test project
test:
	cd test; yarn
	cd test; yarn test

# Check whether the examples still work
examples:
	cd examples; yarn
	cd examples; yarn test

# Publish built package
publish:
	cd dist; npm publish

release: clean build lint test examples publish
