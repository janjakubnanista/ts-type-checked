// In your code you would probably do something like
//
// const transformer = require('ts-type-checked/transformer').default;
//
// OR
//
// import transformer from 'ts-type-checked/transformer'
const transformer = require('../transformer').default;

module.exports = {
  mode: 'development',
  entry: './index.ts',
  output: {
    filename: `index.webpack.js`,
    path: __dirname,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        // awesome-typescript-loader works just as good
        loader: 'ts-loader',
        options: {
          getCustomTransformers: program => ({
            // The transformer accepts options as second argument
            before: [transformer(program, { debug: false })],
          }),
        },
      },
    ],
  },
};
