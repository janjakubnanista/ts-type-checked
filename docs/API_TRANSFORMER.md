<h1>
  <img height="56px" width="auto" src="https://raw.githubusercontent.com/janjakubnanista/ts-type-checked/main/res/ts-type-checked@xs.jpg" align="center"/>
  <span>ts-type-checked</span>
</h1>

<a href="https://github.com/janjakubnanista/ts-type-checked">&lt; Back to project</a>

# Transformer API

## `function transformer(program: ts.Program, options: TransformerOptions): (file: ts.SourceFile) => ts.SourceFile`

The transformer function is exported from `ts-type-checked/transformer`:

```typescript
import transformer from 'ts-type-checked/transformer';

// Or equivalent
const transfomer = require('ts-type-checked/transformer').default;
```

Please refer to the [installation section](./INSTALLATION.md) for more information on how to plug the transformer into your build.

### TransformerOptions

`transformer` function accepts an `options` object with the following keys:

|Name|Type|Default value|Description|
|----|----|-------------|-----------|
|`logLevel`|`'debug' | 'normal' | 'nosey' | 'silent'`|`'normal'`|Set the verbosity of logging when transforming|
|`mode`|`'development' | 'production'`|`process.env.NODE_ENV`|In `production` mode the generated code is slightly smaller (the code generator does not use full names of types in the output)|

## Passing options to `transformer`

Depending on the type of your project there are several ways of passing the `options` to the transformer.

### Webpack and Rollup projects

You can pass options to the transformer directly in your config file:

```javascript
// In your Webpack config loader configuration
{
  // ...
  getCustomTransformers: program => ({
    before: [transformer(program, { logLevel: 'debug' })],
  }),
  // ...
}

// In your Rollup config using @wessberg/rollup-plugin-ts
ts({
  transformers: [
    ({ program }) => ({
      before: transformer(program, { logLevel: 'debug' }),
    }),
  ],
}),

// In your Rollup config using rollup-plugin-typescript2
typescript({
  transformers: [
    service => ({
      before: [transformer(service.getProgram(), { logLevel: 'debug' })],
      after: [],
    }),
  ],
}),
```

### TTypeScript projects

You can pass options to the transformer via `tsconfig.json`:

```javascript
{
  // ...
  "compilerOptions": {
    "plugins": [
      { "transform": "ts-type-checked/transformer", "logLevel": "debug" },
    ]
  },
  // ...
}
```