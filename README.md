# ts-type-checked

<!-- TODO Add build badges -->

Runtime duck type checking utilities for TypeScript.

**IMPORTANT** This package is still under development. It will take some time to reach version 1.0.0.

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