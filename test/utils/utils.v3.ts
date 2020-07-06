import 'jest';
import { numeric } from './utils.v2';
import fc from 'fast-check';

export const primitive = (): fc.Arbitrary<Primitive> =>
  fc.oneof(fc.string(), fc.boolean(), numeric(), fc.bigInt(), fc.constantFrom(null, undefined, Symbol('a')));

// Filtering functions for arbitraries
export type FilterFunction = (value: unknown) => boolean;
type TypeOf = 'string' | 'boolean' | 'number' | 'function' | 'bigint' | 'undefined' | 'object' | 'symbol';
type Primitive = string | boolean | number | bigint | symbol | null | undefined;

export const notOfType = (...types: TypeOf[]): FilterFunction => (value: unknown): boolean =>
  !types.includes(typeof value);

// Helper assertion methods
export const assertArbitrary = (arbitrary: fc.Arbitrary<unknown>, checks: FilterFunction[], result: boolean): void => {
  fc.assert(
    fc.property(arbitrary, (value) => {
      checks.forEach((check) => {
        expect(check(value)).toBe(result);
      });
    }),
  );
};

export const assert = <T>(
  validArbitrary: fc.Arbitrary<T>,
  invalidArbitrary: fc.Arbitrary<unknown>,
  checks: FilterFunction[],
): void => {
  assertArbitrary(validArbitrary, checks, true);
  assertArbitrary(invalidArbitrary, checks, false);
};
