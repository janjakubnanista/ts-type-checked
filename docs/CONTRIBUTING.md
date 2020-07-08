<h1>
  <img height="56px" width="auto" src="https://raw.githubusercontent.com/janjakubnanista/ts-type-checked/main/res/ts-type-checked@xs.jpg" align="center"/>
  <span>ts-type-checked</span>
</h1>

<a href="https://github.com/janjakubnanista/ts-type-checked">&lt; Back to project</a>

# Contributing

## Development

Project comes with a `Makefile` that defines the following targets:

- `all` (default) equivalent to `make build` and `make lint`
- `build` Builds the package to `./dist` folder. This will result in a publishable artifact
- `watch` Builds the package to `./dist` folder and watches for file changes, rebuilding every time
- `install` Installs NPM dependencies for the package. Will not install dependencies for `test` or `examples` projects since they depend on the build artifact of the root project
- `uninstall` Remove all `node_modules` folders recursively
- `upgrade` Upgrade dependencies of all projects to their latest versions
- `clean` Remove the `./dist` folder
- `lint` ESLint the whole project
- `test` Run the complete test suite in `test` project. This will run the tests against all the TypeScript versions specified in [versions.txt](https://github.com/janjakubnanista/ts-type-checked/blob/main/test/scripts/versions.txt). To run a specific test suite, specific test or against a specific TypeScript version, you need to check the `test` project yarn command `test:version` and `test-with-version.sh` script.
- `examples` Builds and runs the `examples` project