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

<p align="center">
  <a href="#example-cases">Example cases</a>
  <span>|</span>
  <a href="#installation">Installation</a>
  <span>|</span>
  <a href="#api">API</a>
  <span>|</span>
  <a href="#supported-types">Supported types</a>
</p>

## Wait what?

TypeScript is a powerful way of enhancing your application code at compile time but, unfortunately, provides no runtime type guards out of the box - you need to [create these manually](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards). For types like `string` or `boolean` this is easy, you can just use the `typeof` operator. It becomes more difficult for interface types, arrays, enums etc. And that is where `ts-type-checked` comes in! It automatically creates these type guards at compile time for you.

This might get usefule when:

- You want to make sure an object you received from an API matches the expected type
- You are exposing your code as a library and want to prevent users from passing in invalid arguments
- You want to check whether a variable implements one of more possible interfaces (e.g. `LoggedInUser`, `GuestUser`)
- _..._

## Example cases

### Example 1: Data consistency checks

```typescript
import { isA } from 'ts-type-checked';

// Imagine a third party service that sends out JSON serialized 
// messages that might sometimes come broken
// and a client that handles these.

interface WelcomeMessage {
  text: 'Oh hello there!'
}

interface WhatALovelyDayMessage {
  yesIndeed: boolean;
  isTheSkyUnusuallyBlue?: boolean;
}

interface GoodbyeThenMessage {
  sayHelloTo: string[];
}

function handleMessage(data: string): string {
  const message = JSON.parse(message);

  // Instead of writing the code that checks the message consistency 
  // you can just use the ts-type-checked isA function:
  if (isA<WelcomeMessage>(message)) {
    return 'Good day sir!'!
  }

  if (isA<WhatALovelyDayMessage>(message)) {
    return message.isTheSkyUnusuallyBlue ? 'magnificient' : 'wonderful';
  }

  if (isA<GoodbyeThenMessage>(message)) {
    return 'I will tell ' + message.sayHelloTo.join(' and ')
  }

  throw new Error('I have know idea what you mean');
}

```

### Example 2: Distniguishing between several types

One more example, this time some data traversal code

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

### Example 3: Passing type guards as parameters

`ts-type-checked` also exports `typeCheckFor` type guard factory. This is more or less a syntactic sugar that saves you couple of keystrokes. It is useful when you want to store the type guard into a variable or pass it as a parameter:

```typescript
import { typeCheckFor } from 'ts-type-checked';

// Store type guard in a variable
const isStringArray = typeCheckFor<string[]>();

function createMessageHandler<T>(validator: (value: unknown) => value is T) {
  return function handleMessage(data: string) {
    const message = JSON.parse(data);

    if (validator(message)) {
      console.log('valid message!');

      // ...
    } else {
      console.error('invalid message!');
    }
  }
}

interface HelloWorldMessage {
  hello: 'world';
}

// Or pass it as a parameter
const handleStringMessage = createMessageHandler(typeCheckFor<string>());

const handleHelloWorldMessage = createMessageHandler(typeCheckFor<HelloWorldMessage>());
```

### Example 4: Deduplicating generated type guards

`isA` and `typeCheckFor` will both transform the code on per-file basis - in other terms a type guard function will be created in every file where either of these is used. To prevent duplication of generated code I recommend placing the type guards in a separate file and importing them when necessary:

```typescript
// ./typeGuards.ts
import { typeCheckFor } from 'ts-type-checked';

export const isDate = typeCheckFor<Date>();
export const isStringRecord = typeCheckFor<Record<string, string>>();

// ./myUtility.ts
import { isDate } from './typeGuards';

if (isDate(value)) {
  // ...
}
```

<a id="installation"></a>
## Installation

`ts-type-checked` is a TypeScript transformer - it generates the required type checks and injects them into your code at compile time. It is compatible with [rollup](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/rollup), [webpack](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/webpack) and [ttypescript](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/ttypescript) projects and works nicely with [jest](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/jest).

You will first need to install `ts-type-checked` using `npm`, `yarn` or similar:

```bash
# NPM
npm install --dev ts-type-checked

# Yarn
yarn add -D ts-type-checked
```

### Webpack

[See example here](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/webpack)

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

#### 3. Profit :money_with_wings:

### Rollup

[See example here](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/rollup)

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

#### 3. Profit :money_with_wings:

<a id="installation/ttypescript"></a>
### TTypeScript

[See example here](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/jest)

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

[See example here](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/jest)

In order to enable `ts-type-checked` in your Jest tests you need to switch to `ttypescript` compiler.

#### 1. Install `ttypescript`

```bash
# NPM
npm install --dev ttypescript

# Yarn
yarn add -D ttypescript
```

#### 2. Configure `ttypescript`

See [the instructions above](#installation/ttypescript).

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

#### 4. Profit :money_with_wings:

<a id="api"></a>
## API

### Transformer API

### Type guard API

*Please refer to the [TypeScript definition file](https://github.com/janjakubnanista/ts-type-checked/tree/master/index.d.ts) of the module for more information.*

Two functions are exposed (funny enough neither of them exist, just check [index.js](https://github.com/janjakubnanista/ts-type-checked/tree/master/index.js) yourself :grinning:): `isA` and `typeCheckFor`:

```typescript
import { isA, typeCheckFor } from 'ts-type-checked';
```

#### `isA<T>(value: unknown) => value is T`

`isA` takes one type argument `T` and one function argument `value` and checkes whether the value is assignable to type `T`.

**The type that you pass to `isA` must not be a type parameter!** In other words:

```typescript
function doMyStuff<T>(value: unknown) {
  // Bad, T is a type argument and will depend on how you call the function
  if (isA<T>(value)) {
    // ...
  }

  // Good, string[] is not a type parameter
  if (isA<string[]>(value)) {
    // ...
  }
}
```

#### `typeCheckFor<T>() => (value: unknown) => value is T`

`typeCheckFor` is a factory function for `isA` so to say - it takes one type argument `T` and returns a function, just like `isA`, that takes an argument `value` and checkes whether the value is assignable to type `T`.

**The type that you pass to `typeCheckFor` must not be a type parameter either!** (see above)

<a id="supported-types"></a>
## Supported types

`ts-type-checked` supports (reasonably large but still only) a subset of TypeScript features.

- **Primitive types** `string`, `number`, `boolean`, `bigint`, `symbol` are supported using `typeof` operator
- **Boxed types** `String`, `Number`, `Boolean`, `BigInt`, `Symbol` are converted to their unboxed versions and checked using `typeof` operator. 
- **Array types** `any[]`, `Array<any>`, `ReadonlyArray<any>` are supported using `Array.isArray` utility. **All the elements are checked as well** so avoid unneccessary type checks of long lists.
- **Date type** `Date` is supported using `instanceof` keyword
- **DOM types** `Node`, `Element` (and all its subclasses) are supported using `instanceof` keyword
- **Object types** `object`, `Object`, `{}` are supported as specified in [TypeScript reference](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#object-type).
- **Function types** `Function`, `(...args: any[]) => any` are supported using `typeof` operator. **Due to the nature of JavaScript it is impossible to check the return type of a function without calling it** so the signature of a function is not checked.
- **Promise types** `Promise<any>` are supported by checking for `then` and `catch` methods. **Type checking promises is generally discouraged in favour of converting values into promises using `Promise.resolve`**
- **Set & Map** `Set<any>`, `Map<any, any>` are checked using `instanceof` operator. **All values (and keys for `Map`) are checked as well.**

## What is not supported

- **Promise resolution values** It is impossible to check what the value of a resolved promise will be
- **Function return types and signatures** It is impossible to check anything about a function apart from the fact that it is a function