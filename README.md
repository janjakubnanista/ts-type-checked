<p align="center">
  <img width="50%" src="https://raw.githubusercontent.com/janjakubnanista/ts-type-checked/master/documentation/ts-type-checked.svg"/>
</p>

<h1 align="center">
  ts-type-checked
</h1>

<p align="center">
  Automatic type checking for TypeScript
</p>

<p align="center">
  <!-- Travis CI build status -->
  <a href="https://travis-ci.org/janjakubnanista/ts-type-checked"><img alt="Build Status" src="https://travis-ci.org/janjakubnanista/ts-type-checked.svg?branch=master"/></a>
  <!-- Fury.io NPM published package version -->
  <a href="https://www.npmjs.com/package/ts-type-checked"><img alt="NPM Version" src="https://badge.fury.io/js/ts-type-checked.svg"/></a>
  <!-- Shields.io dev dependencies status -->
  <a href="https://github.com/janjakubnanista/ts-type-checked/blob/master/package.json"><img alt="Dev Dependency Status" src="https://img.shields.io/david/dev/janjakubnanista/ts-type-checked"/></a>
  <!-- Snyk.io vulnerabilities badge -->
  <a href="https://snyk.io/test/github/janjakubnanista/ts-type-checked"><img alt="Known Vulnerabilities" src="https://snyk.io/test/github/janjakubnanista/ts-type-checked/badge.svg"/></a>
  <!-- Shields.io license badge -->
  <a href="https://github.com/janjakubnanista/ts-type-checked/blob/master/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/ts-type-checked"/></a>
</p>

## Why

TypeScript is a powerful way of enhancing your application at compile time but provides no utilities to type-check entities at runtime - there is no way of checking whether the JSON object coming from your API truly is what you think it is.

That's where `ts-type-checked` comes in! Now you no longer need to worry whether a particular object implements `User` interface, belongs to an `enum`, matches a Union type, the list goes on, you just write:

```typescript
if (isA<User>(value)) {
  greet();
} else {
  complain();
}
```

And all that without actually writing any of the type checks yourself!

## How

`ts-type-checked` is a TypeScript transformer - it generates the required type checks and injects them into your code at compile time. This comes at a small price - it only works with `webpack`, `rollup` or `ttypescript`. You can find all the required information and more down in the [Examples section](#examples).

<a id="examples"></a>
## Examples

<!-- TODO -->