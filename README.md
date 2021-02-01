<!-- Logo -->
<p align="center">
  <img width="50%" src="https://raw.githubusercontent.com/janjakubnanista/ts-type-checked/main/res/ts-type-checked.jpg"/>
</p>

<h1 align="center">
  ts-type-checked
</h1>

<p align="center">
  Automatic type guards for TypeScript
</p>

<!-- The badges section -->
<p align="center">
  <!-- CircleCI build status -->
  <a href="https://circleci.com/gh/janjakubnanista/ts-type-checked/tree/main"><img alt="CircleCI Build Status" src="https://circleci.com/gh/janjakubnanista/ts-type-checked.svg?style=shield"></a>
  <!-- Fury.io NPM published package version -->
  <a href="https://www.npmjs.com/package/ts-type-checked"><img alt="NPM Version" src="https://badge.fury.io/js/ts-type-checked.svg"/></a>
  <!-- Shields.io dev dependencies status -->
  <a href="https://github.com/janjakubnanista/ts-type-checked/blob/main/package.json"><img alt="Dev Dependency Status" src="https://img.shields.io/david/dev/janjakubnanista/ts-type-checked"/></a>
  <!-- Snyk.io vulnerabilities badge -->
  <a href="https://snyk.io/test/github/janjakubnanista/ts-type-checked"><img alt="Known Vulnerabilities" src="https://snyk.io/test/github/janjakubnanista/ts-type-checked/badge.svg"/></a>
  <!-- Shields.io license badge -->
  <a href="https://github.com/janjakubnanista/ts-type-checked/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/ts-type-checked"/></a>
</p>

<p align="center">
  <code>ts-type-checked</code> generates <a href="https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types">type guards</a> based on your own (or library) TypeScript types.
  It is compatible with
  <a href="./docs/INSTALLATION.md#installation--rollup">Rollup</a>,
  <a href="./docs/INSTALLATION.md#installation--webpack">Webpack</a> and
  <a href="./docs/INSTALLATION.md#installation--ttypescript">ttypescript</a> projects
  and works nicely with
  <a href="./docs/INSTALLATION.md#installation--jest">Jest</a>,
  <a href="./docs/INSTALLATION.md#installation--mocha">Mocha</a> or
  <a href="./docs/INSTALLATION.md#installation--ts-node">ts-node</a>
</p>

<p align="center">
  <a href="#example-cases">Example cases</a>
  <span>|</span>
  <a href="https://github.com/janjakubnanista/ts-type-checked/blob/main/docs/INSTALLATION.md">Installation</a>
  <span>|</span>
  <a href="https://github.com/janjakubnanista/ts-type-checked/blob/main/docs/API.md">API</a>
  <span>|</span>
  <a href="https://github.com/janjakubnanista/ts-type-checked/blob/main/docs/SUPPORTED_TYPES.md">Supported types</a>
</p>

## Wait what?

As they say *an example is worth a thousand API docs* so why not start with one.

```typescript
interface WelcomeMessage {
  name: string;
  hobbies: string[];
}

//
// You can now turn this
//
const isWelcomeMessage = (value: any): message is WelcomeMessage =>
  !!value &&
  typeof value.name === 'string' &&
  Array.isArray(value.hobbies) &&
  value.hobbies.every(hobby => typeof hobby === 'string');

//
// Into this
//
const isWelcomeMessage = typeCheckFor<WelcomeMessage>();

//
// Or without creating a function
//
if (isA<WelcomeMessage>(value)) {
  // value is a WelcomeMessage!
}
```

## Motivation

TypeScript is a powerful way of enhancing your application code at compile time but, unfortunately, provides no runtime type guards out of the box - you need to [create these manually](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards). For types like `string` or `boolean` this is easy, you can just use the `typeof` operator. It becomes more difficult for interface types, arrays, enums etc.

**And that is where `ts-type-checked` comes in!** It automatically creates these type guards at compile time for you.

This might get useful when:

- You want to make sure an object you received from an API matches the expected type
- You are exposing your code as a library and want to prevent users from passing in invalid arguments
- You want to check whether a variable implements one of more possible interfaces (e.g. `LoggedInUser`, `GuestUser`)
- _..._

## Example cases

### Checking external data

Imagine your [API spec](https://swagger.io/) promises to respond with objects like these:

```typescript
interface WelcomeMessage {
  name: string;
  greeting: string;
}

interface GoodbyeMessage {
  sayByeTo: string[];
}
```

Somewhere in your code there probably is a function just like  `handleResponse` below:

```typescript
function handleResponse(data: string): string {
  const message = JSON.parse(data);

  if (isWelcomeMessage(message)) {
    return 'Good day dear ' + message.name!
  }

  if (isGoodbyeMessage(message)) {
    return 'I will say bye to ' + message.sayByeTo.join(', ');
  }

  throw new Error('I have no idea what you mean');
}
```

If you now need to find out whether you received a valid response, you end up defining helper functions like  `isWelcomeMessage` and `isGoodbyeMessage` below.

```typescript
const isWelcomeMessage = (value: any): value is WelcomeMessage =>
  !!value &&
  typeof value.name === 'string' &&
  typeof value.greeting === 'string';

const isGoodbyeMessage = (value: any): value is GoodbyeMessage =>
  !!value &&
  Array.isArray(value.sayByeTo) &&
  value.sayByeTo.every(name => typeof name === 'string');
```

Annoying isn't it? Not only you need to define the guards yourself, you also need to make sure the types and the type guards don't drift apart as the code evolves. Let's try using `ts-type-checked`:

```typescript
import { isA, typeCheckFor } from 'ts-type-checked';

// You can use typeCheckFor type guard factory
const isWelcomeMessage = typeCheckFor<WelcomeMessage>();
const isGoodbyeMessage = typeCheckFor<GoodbyeMessage>();

// Or use isA generic type guard directly in your code
if (isA<WelcomeMessage>(message)) {
  // ...
}
```

### Type guard factories

`ts-type-checked` exports `typeCheckFor` type guard factory. This is more or less a syntactic sugar that saves you couple of keystrokes. It is useful when you want to store the type guard into a variable or pass it as a parameter:

```typescript
import { typeCheckFor } from 'ts-type-checked';

interface Config {
  version: string;
}

const isConfig = typeCheckFor<Config>();
const isString = typeCheckFor<string>();

function handleArray(array: unknown[]) {
  const strings = array.filter(isString);
  const configs = array.filter(isConfig);
}

// Without typeCheckFor you'd need to write
const isConfig = (value: unknown): value is Config => isA<Config>(value);
const isString = (value: unknown): value is Config => isA<string>(value);
```

### Reducing the size of generated code

`isA` and `typeCheckFor` will both transform the code on per-file basis - in other terms a type guard function will be created in every file where either of these is used. To prevent duplication of generated code I recommend placing the type guards in a separate file and importing them when necessary:

```typescript
// in file typeGuards.ts
import { typeCheckFor } from 'ts-type-checked';

export const isDate = typeCheckFor<Date>();
export const isStringRecord = typeCheckFor<Record<string, string>>();

// in file myUtility.ts
import { isDate } from './typeGuards';

if (isDate(value)) {
  // ...
}
```

## Useful links

- [ts-trasformer-keys](https://www.npmjs.com/package/ts-transformer-keys), TypeScript transformer that gives you access to interface properties
- [ts-auto-mock](https://www.npmjs.com/package/ts-auto-mock), TypeScript transformer that generates mock data objects based on your types