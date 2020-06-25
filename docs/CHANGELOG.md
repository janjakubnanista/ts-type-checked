<h1>
  <img height="56px" width="auto" src="https://raw.githubusercontent.com/janjakubnanista/ts-type-checked/main/res/ts-type-checked@xs.jpg" align="center"/>
  <span>ts-type-checked</span>
</h1>

<a href="https://github.com/janjakubnanista/ts-type-checked">&lt; Back to project</a>

# Changelog

## v0.4.0

### Features

- Support for `symbol` and `Symbol` types

### Bugfixes

- `private` and `protected` members are not checked anymore

## v0.4.1

### Bugfixes

- Checking circular structures will not end up with stack overflow anymore, instead an `Error` will be thrown when a circular structure is being checked

## v0.4.2

### Bugfixes

- Transformer would throw an error in older versions of TypeScript due to missing `isArrayType` method on `ts.TypeChecker`
