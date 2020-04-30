<!-- Logo -->
<p align="center">
  <img width="50%" src="https://raw.githubusercontent.com/janjakubnanista/ts-type-checked/master/res/ts-type-checked.png"/>
</p>

<h1 align="center">
  ts-type-checked
</h1>

<p align="center">
  Automatic type checks for TypeScript
</p>

<!-- The badges section -->
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

`ts-type-checked` generates [type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types) based on your own (or library) TypeScript types. It is compatible with [rollup](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/rollup), [webpack](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/webpack) and [ttypescript](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/ttypescript) projects and works nicely with [jest](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/jest).

## Wait what?

TypeScript is a powerful way of enhancing your application code at compile time but, unfortunately, provides no runtime type guards out of the box - you need to [create these manually](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards). For types like `string` or `boolean` this is easy, you can just use the `typeof` operator. It becomes more difficult for interface types, arrays, enums etc. And that is where `ts-type-checked` comes in! It automatically creates these type guards at compile time for you.

This might get usefule when:

- You want to make sure an object you received from an API matches the expected type
- You are exposing your code as a library and want to prevent users from passing in invalid arguments
- You want to check whether a variable implements one of more possible interfaces (e.g. `LoggedInUser`, `GuestUser`)
- _..._

### An example case

Imagine you need to check whether an object implements one of more possible interfaces / types. You want your code to support as many input formats as possible, some of them might be arrays, some of them implement interfaces, some of them might be e.g. strings. 

The code you'd need to write would need to check for types and shapes of these and everytime you needed to make a change to your types your checks would need to change too.

The code below demonstrates how `ts-type-checked` can be used to autogenerate these checks based on your TypeScript types.

```typescript
// Group is an array of users or accounts
type Group = Array<User | Account>;

// Account is a named collection of users
interface Account {
  name: string;
  users: User[];
}

// User represents a user
interface User {
  firstName: string;
  lastName: string;
}

// And our graph consists of nodes that can be groups, accounts or users
type Node = Account | User | Group;

// Our utility function gives us a description of a graph node
function getObjectDescription(object: Node): string {
  // We can now check what the object is without writing any 'typeof'-ish code
  if (isA<Group>(object)) {
    const groupObjectNames = object.map(getObjectName);

    return `Group[${groupObjectNames.join()}]`;
  }

  if (isA<Account>(object)) {
    const userNames = object.users.map(getObjectName);

    return `Account ${object.name}[${userNames.join()}]`;
  }

  return `User ${object.firstName} ${object.lastName}`;
}
```

<a id="how"></a>
## How

`ts-type-checked` is a TypeScript transformer - it generates the required type checks and injects them into your code at compile time. It is compatible with [rollup](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/rollup), [webpack](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/webpack) and [ttypescript](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/ttypescript) projects and works nicely with [jest](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/jest).

You will first need to install `ts-type-checked` using `npm`, `yarn` or similar:

```bash
# NPM
npm install --dev ts-type-checked

# Yarn
yarn add -D ts-type-checked
```

### Webpack

In order to enable `ts-type-checked` in your Webpack project you need to configure `ts-loader` or `awesome-typescript-loader` in you webpack config.

#### 1. Import the transformer

```typescript
// Using ES6 imports
import transformer from 'ts-type-checked/transformer';

// Or using the old syntax
const transformer = require('ts-type-checked/transformer').default;
```

#### 2. Adjust your `ts-loader` / `awesome-typescript-loader` configuration

```typescript
{
  test: /\.ts(x)?$/,
  loader: 'ts-loader', // Or 'awesome-typescript-loader'
  options: {
    getCustomTransformers: program => ({
      before: [transformer(program)],
    }),
  },
}
```

#### 3. Profit

### Rollup

In order to enable `ts-type-checked` in your Rollup project you need to configure `ts-loader` or `awesome-typescript-loader` in you rollup config.

#### 1. Import the transformer

```typescript
import transformer from 'ts-type-checked/transformer';
```

#### 2. Option 1: Adjust your `@wessberg/rollup-plugin-ts` plugin configuration

```typescript
import ts from '@wessberg/rollup-plugin-ts';

// ...

ts({
  transformers: [
    ({ program }) => ({
      before: transformer(program),
    }),
  ],
}),
```

#### 2. Option 2: Adjust your `rollup-plugin-typescript2` plugin configuration

```typescript
import typescript from 'rollup-plugin-typescript2';

// ...

typescript({
  transformers: [
    service => ({
      before: [transformer(service.getProgram())],
      after: [],
    }),
  ],
}),
```

#### 3. Profit

<a id="how/ttypescript"></a>
### TTypeScript

In order to enable `ts-type-checked` in your TTypescript project you need to configure plugins in your `tsconfig.json`.

```json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "ts-type-checked/transformer" }
    ]
  }
}
```

### Jest

In order to enable `ts-type-checked` in your Jest tests you need to switch to `ttypescript` compiler.

#### 1. Install `ttypescript`

```bash
# NPM
npm install --dev ttypescript

# Yarn
yarn add -D ttypescript
```

#### 2. Configure `ttypescript`

See [the instructions above](#how/ttypescript).

#### 3. Set `ttypescript` as your compiler

In your `jest.config.js` (or `package.json`):

```javascript
module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
    },
  },
};
```

#### 4. Profit

## Supported types

`ts-type-checked` supports (reasonably large but still only) a subset of TypeScript features.

- **Primitive types** `string`, `number`, `boolean`, `bigint`, `symbol` are supported using `typeof` operator
- **Boxed types** `String`, `Number`, `Boolean`, `BigInt`, `Symbol` are converted to their unboxed versions and checked using `typeof` operator
- **Array types** `any[]`, `Array<any>`, `ReadonlyArray<any>` are supported using `Array.isArray` utility. **All the elements are checked as well.**
- **Date type** `Date` is supported using `instanceof` keyword
- **DOM types** `Node`, `Element` (and all its subclasses) are supported using `instanceof` keyword
- **Object types** `object`, `Object`, `{}` are supported as specified in [TypeScript reference](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#object-type). In practice that covers functions and plain objects.
- **Function types** `Function`, `(...args: any[]) => any` are supported using `typeof` operator. **Due to the nature of JavaScript it is impossible to check the return type of a function without calling it** so the signature of a function is not checked.
- **Promise types** `Promise<any>` are supported by checking for `then` and `catch` methods. **Type checking promises is generally discouraged in favour of converting values into promises using `Promise.resolve`**
- **Set & Map** `Set<any>`, `Map<any, any>` are checked using `instanceof` operator. **All values (and keys for `Map`) are checked as well.**

## What is not supported

- **Promise resolution values** It is impossible to check what the value of a resolved promise will be
- **Function return types and signatures** It is impossible to check anything about a function apart from the fact that it is a function

<a id="examples"></a>
## Examples

<!-- TODO -->