import resolve from 'rollup-plugin-node-resolve';
import transformer from '../transformer/index.js';
import ts from '@wessberg/rollup-plugin-ts';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: './index.ts',
  output: {
    file: 'index.rollup.js',
    format: 'iife',
  },
  plugins: [
    resolve(),
    // Uncomment these lines if you are using rollup-plugin-typescript2
    // (Don't forget to comment the @wessberg/rollup-plugin-ts below)
    //
    // typescript({
    //   transformers: [
    //     service => ({
    //       before: [transformer(service.getProgram())],
    //       after: [],
    //     }),
    //   ],
    // }),

    // I prefer @wessberg's rollup-plugin-ts myself but feel free to comment this bit out
    // and uncomment the bit above
    ts({
      transformers: [
        ({ program }) => ({
          before: transformer(program),
        }),
      ],
    }),
  ],
};
