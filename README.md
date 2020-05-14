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

This might get useful when:

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

  throw new Error('I have no idea what you mean');
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

[See example here](https://github.com/janjakubnanista/ts-type-checked/tree/master/examples/ttypescript)

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

### Transformer API

The transformer function is exported from `ts-type-checked/transformer`:

```typescript
import transformer from 'ts-type-checked/transformer';

// Or equivalent
const transfomer = require('ts-type-checked/transformer').default;
```

*Please refer to the [installation section](#installation)  for more information on how to plug the transfomer into your build.*

<a id="supported-types"></a>
## Supported TypeScript features

`ts-type-checked` supports (reasonably large but still only) a subset of TypeScript features:

<!-- <tr>
  <th></th>
  <td></td>
  <td></td>
</tr> -->

<table width="100%" cellpadding="4">
  <thead>
    <tr>
      <th align="left">Type&nbsp;/&nbsp;feature</th>
      <th align="center">Support</th>
      <th align="left">Notes</th>
      <th align="left">Implementation</th>
    </tr>
  </thead>

  <tbody>
    <!-- Primitive types -->
    <tr valign="top">
      <td align="left">
        <code>bigint</code>,<br/>
        <code>boolean</code>,<br/>
        <code>number</code>,<br/>
        <code>string</code>
      </td>
      <td align="center">✓</td>
      <td align="left">Primitive types that can be checked using the <code>typeof</code> operator</td>
      <td align="left">
        <code>typeof value === 'bigint'</code>,<br/>
        <code>typeof value === 'boolean'</code>,<br/>
        <code>typeof value === 'number'</code>,<br/>
        <code>typeof value === 'string'</code>
      </td>
    </tr>
    <!-- Boxed types -->
    <tr valign="top">
      <td align="left">
        <code>BigInt</code>,<br/>
        <code>Boolean</code>,<br/>
        <code>Number</code>,<br/>
        <code>String</code>
      </td>
      <td align="center">✓</td>
      <td align="left">Boxed types are converted to their un-boxed versions and checked accordingly</td>
      <td align="left">
        <code>typeof value === 'bigint'</code>,<br/>
        <code>typeof value === 'boolean'</code>,<br/>
        <code>typeof value === 'number'</code>,<br/>
        <code>typeof value === 'string'</code>
      </td>
    </tr>
    <!-- any, unknown -->
    <tr valign="top">
      <td align="left">
        <code>any</code>,<br/>
        <code>unknown</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Checks for these will always be true
      </td>
      <td align="left">
        <code>true</code>
      </td>
    </tr>
    <!-- object keyword -->
    <tr valign="top">
      <td align="left">
        <code>object</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        All non-primitives (See description of the object type <a href="https://www.typescriptlang.org/docs/handbook/basic-types.html#object">here</a>)
      </td>
      <td align="left">
        <code>typeof value === 'function' || (typeof value === 'object' && value !== null)</code>
      </td>
    </tr>
    <!-- Object interface -->
    <tr valign="top">
      <td align="left">
        <code>Object</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        All objects that inherit from <code>Object</code> (i.e. everything except for <code>null</code> and <code>undefined</code>) and implement the <code>Object</code> interface.
        <br/>
        <br/>
        Check the definition of the <code>Object</code> interface here <a href="https://github.com/microsoft/TypeScript/blob/master/src/lib/es5.d.ts">here</a>
      </td>
      <td align="left">
        <code>value !== null && value !== undefined && typeof value.toString === 'function' && ...</code>
      </td>
    </tr>
    <!-- Date -->
    <tr valign="top">
      <td align="left">
        <code>Date</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Date objects
      </td>
      <td align="left">
        <code>value instanceof Date</code>
      </td>
    </tr>
    <!-- Set -->
    <tr valign="top">
      <td align="left">
        <code>Set&lt;T&gt;</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        ES6 Sets
        <br/>
        <br/>
        <code>Array.from</code> and <code>Array.every</code> methods are used so they need to be available.
      </td>
      <td align="left">
        <code>(value instanceof Set) && Array.from(value.values()).every(value => isA&lt;T&gt;(value))</code>
      </td>
    </tr>
    <!-- Map -->
    <tr valign="top">
      <td align="left">
        <code>Map&lt;K, V&gt;</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        ES6 Maps
        <br/>
        <br/>
        <code>Array.from</code> and <code>Array.every</code> methods are used so they need to be available.
      </td>
      <td align="left">
        <code>(value instanceof Map) && Array.from(value.entries()).every(entry => isA&lt;K&gt;(entry[0]) && isA&lt;V&gt;(entry[1]))</code>
      </td>
    </tr>
    <!-- Interfaces -->
    <tr valign="top">
      <td align="left">
        <code>interface T {<br/>
          &nbsp;&nbsp;name:&nbsp;string;<br/>
          &nbsp;&nbsp;age:&nbsp;number;<br/>
          &nbsp;&nbsp;others:&nbsp;T[];<br/>
          &nbsp;&nbsp;// ...<br/>
        }</code>,
        <br/>
        <code>type T = {<br/>
          &nbsp;&nbsp;name:&nbsp;string;<br/>
          &nbsp;&nbsp;age:&nbsp;number;<br/>
          &nbsp;&nbsp;others:&nbsp;T[];<br/>
          &nbsp;&nbsp;// ...<br/>
        }</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        All objects that inherit from <code>Object</code> (i.e. everything except for <code>null</code> and <code>undefined</code>) and have all the properties of interface <code>T</code>.
        <br/>
        <br/>
        Recursive types are also supported.
      </td>
      <td align="left">
        <code>value !== null && value !== undefined && typeof value.name === 'string' && typeof value.age === 'number' && isA&lt;T[]&gt;(value.others)</code>
      </td>
    </tr>
    <!-- Indexed types -->
    <tr valign="top">
      <td align="left">
        <code>Record&lt;string, T&gt;</code>,
        <br/>
        <code>Record&lt;number, T&gt;</code>,
        <br/>
        <code>{<br/>
          &nbsp;&nbsp;[key: string]: T;<br/>
        }</code>
        <code>{<br/>
          &nbsp;&nbsp;[key: number]: T;<br/>
        }</code>
        <code>{<br/>
          &nbsp;&nbsp;[key: number]: T;<br/>
          &nbsp;&nbsp;[key: string]: U;<br/>
        }</code>
      </td>
      <td align="center">~</td>
      <td align="left">
        All non-primitives (See description of the object type <a href="https://www.typescriptlang.org/docs/handbook/basic-types.html#object">here</a>) whose properties are assignable to <code>T</code>
        <br/>
        <br/>
        <code>Object.keys</code> and <code>Array.every</code> methods are used to check the properties so they need to be available
        <br/>
        <br/>
        <strong>The support for numeric indexes works something like this:</strong> if a key can be casted to a number (not a <code>NaN</code>) <strong>OR</strong> is equal to <code>"NaN"</code> then the value is checked against the index type.
      </td>
      <td align="left">
        <code>(typeof value === 'function' || (typeof value === 'object' && value !== null)) && Object.keys(value).every(key => isA&lt;T&gt;(value[key]))</code>
        <br/>
        <br/>
        Or for numeric indexes:
        <br/>
        <br/>
        <code>(typeof value === 'function' || (typeof value === 'object' && value !== null)) && Object.keys(value).every(key => (isNaN(parseFloat(key)) && key !== 'NaN') || isA&lt;T&gt;(value[key]))</code>
      </td>
    </tr>
    <!-- Literal types -->
    <tr valign="top">
      <td align="left">
        <code>'primary'</code>,<br/>
        <code>21</code>,<br/>
        <code>true</code>,<br/>
        <code>false</code>,<br/>
        <code>null</code>,<br/>
        <code>undefined</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Literal types
      </td>
      <td align="left">
        <code>value === 'primary'</code>,<br/>
        <code>value === 21</code>,<br/>
        <code>value === true</code>,<br/>
        <code>value === false</code>,<br/>
        <code>value === null</code>,<br/>
        <code>value === undefined</code>,<br/>
      </td>
    </tr>
    <!-- Union types -->
    <tr valign="top">
      <td align="left">
        <code>A | B</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Union types
      </td>
      <td align="left">
        <code>isA&lt;A&gt;(value) || isA&lt;B&gt;(value)</code>
      </td>
    </tr>
    <!-- Intersection types -->
    <tr valign="top">
      <td align="left">
        <code>A & B</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Intersection types
      </td>
      <td align="left">
        <code>isA&lt;A&gt;(value) && isA&lt;B&gt;(value)</code>
      </td>
    </tr>
    <!-- Generic types -->
    <tr valign="top">
      <td align="left">
        <code>Type&lt;T&gt;</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Generic types are supported provided all the type arguments (<code>T</code> in this case) are specified.<br/>
        <br/>
        What this means is that you cannot create a generic function and use the <code>isA</code> to check whether a value is assignable to a type parameter of that function.
        <br/>
        <br/>
        Conditional types are also supported as part of generic types.
      </td>
      <td align="left"></td>
    </tr>
    <!-- Array types -->
    <tr valign="top">
      <td align="left">
        <code>T[]</code>,<br/>
        <code>Array&lt;T&gt;</code>,<br/>
        <code>ReadonlyArray&lt;T&gt;</code>,<br/>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Array types are checked using <code>Array.isArray</code>, the types of elements using <code>Array.every</code> so these need to be available
      </td>
      <td align="left">
        <code>Array.isArray(value) && value.every(element => isA&lt;T&gt;(element))</code>
      </td>
    </tr>
    <!-- Tuple types -->
    <tr valign="top">
      <td align="left">
        <code>[T, U, V]</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Tuple types are checked for their length as well as the types of their members
      </td>
      <td align="left">
        <code>Array.isArray(value) && value.length === 3 && isA&lt;T&gt;(value[0]) && isA&lt;U&gt;(value[1]) && isA&lt;V&gt;(value[2])</code>
      </td>
    </tr>
    <!-- Function types -->
    <tr valign="top">
      <td align="left">
        <code>Function</code>,<br/>
        <code>(...args:&nbsp;any[])&nbsp;=>&nbsp;any</code>,<br/>
        <code>new () => {}</code>
      </td>
      <td align="center">~</td>
      <td align="left">
        <strong>The signature of the function cannot be checked (since you cannot check the return type of a function without calling it)</strong>
      </td>
      <td align="left">
        <code>typeof value === 'function'</code>
      </td>
    </tr>
    <!-- Callable interface -->
    <tr valign="top">
      <td align="left">
        <code>
          interface T {<br/>
          &nbsp;&nbsp;() => string;<br/>
          &nbsp;&nbsp;callCount: number;<br/>
          }
        </code>
      </td>
      <td align="center">~</td>
      <td align="left">
        <strong>The signature of the function cannot be checked (since you cannot check the return type of a function without calling it)</strong>
      </td>
      <td align="left">
        <code>typeof value === 'function' && typeof(value.callCount) === 'number'</code>
      </td>
    </tr>
    <!-- Promises -->
    <tr valign="top">
      <td align="left">
        <code>Promise&lt;T&gt;</code>
      </td>
      <td align="center">~</td>
      <td align="left">
        <strong>The resolution value of the promise cannot be checked.</strong>
        <br/>
        <br/>
        Checking for promise types is discouraged in favor of using the <code>Promise.resolve</code> method.
      </td>
      <td align="left">
        <code>!!value && typeof value.then === 'function' && typeof value.catch === 'function'</code>
      </td>
    </tr>
    <!-- DOM types -->
    <tr valign="top">
      <td align="left">
        <code>Node</code>,<br/>
        <code>Element</code>,<br/>
        <code>HTMLElement</code>,<br/>
        <code>HTMLDivElement</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        The global DOM classes
      </td>
      <td align="left">
        <code>value instanceof Node</code>,<br/>
        <code>value instanceof Element</code>,<br/>
        <code>value instanceof HTMLElement</code>,<br/>
        <code>value instanceof HTMLDivElement</code>
      </td>
    </tr>
  </tbody>
</table>

### What is not supported

- **Promise resolution values** It is impossible to check what the value of a resolved promise will be
- **Function return types and signatures** It is impossible to check anything about a function apart from the fact that it is a function

## Supported TypeScript versions

`ts-type-checked` has an extensive E2E test suite found in the [test](https://github.com/janjakubnanista/ts-type-checked/tree/master/test) folder. This suite is being run against several TS versions (the list can be found [here](https://github.com/janjakubnanista/ts-type-checked/blob/master/scripts/versions.txt)):

- `4.0.0-dev.20200514`
- `3.9.2`
- `3.8.3`
- `3.8.2`
- `3.8.1`
- `3.8.0`
- `3.7.5`
- `3.7.4`
- `3.7.3`
- `3.7.2`
- `3.7.1`
- `3.7.0`
- `3.6.5`
- `3.6.4`
- `3.6.3`
- `3.6.2`
- `3.5.1`
- `3.4.1`
- `3.3.1`
- `3.2.1`
- `3.1.1`