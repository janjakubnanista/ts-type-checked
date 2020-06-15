<h1>
  <img height="56px" width="auto" src="https://raw.githubusercontent.com/janjakubnanista/ts-type-checked/main/res/ts-type-checked.png" align="center"/>
  <span>ts-type-checked</span>
</h1>

<a href="https://github.com/janjakubnanista/ts-type-checked">&lt; Back to project</a>

# Type checker API

Two functions are exported: `isA` and `typeCheckFor`. (funny enough neither of them exist, just check [index.js](https://github.com/janjakubnanista/ts-type-checked/tree/main/src/index.ts) yourself :grinning:).

```typescript
import { isA, typeCheckFor } from 'ts-type-checked';
```

#### `function isA<T>(value: unknown): value is T`

`isA` takes one type argument `T` and one function argument `value` and checks whether the value is assignable to type `T`:

```typescript
if (isA<string[]>(valueFromApi)) {
  // valueFromApi is now for sure a string array!
}

interface MyInterface {
  name?: string;
  items: string[];
}

if (isA<MyInterface>(value)) {
  // value is MyInterface
}
```

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

#### `function typeCheckFor<T>(): (value: unknown) => value is T`

`typeCheckFor` is a factory function for `isA` so to say - it takes one type argument `T` and returns a function, just like `isA`, that takes an argument `value` and checks whether the value is assignable to type `T`.

**The type that you pass to `typeCheckFor` must not be a type parameter either!** (see above)

