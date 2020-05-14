import fc, { Arbitrary } from 'fast-check';

export type GenericReference<T> = T;

export type ArrayReference<T> = T[];

export interface InterfaceWithPropertyOfType<T> {
  property: T;
}

export interface InterfaceWithPropertiesOfTypes<T, U> {
  property1: T;
  property2: U;
}

export interface InterfaceWithDifferentPropertyOfType<T> {
  differentProperty: T;
}

export const optionalOf = <T>(arbitrary: Arbitrary<T>): Arbitrary<T | undefined> =>
  fc.oneof(arbitrary, fc.constant(undefined));

export const numeric = (): fc.Arbitrary<number> =>
  fc.oneof(fc.integer(), fc.float(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY));

export const primitive = (): fc.Arbitrary<Primitive> =>
  fc.oneof(fc.string(), fc.boolean(), numeric(), fc.bigInt(), fc.constantFrom(null, undefined, Symbol('a')));

// Filtering functions for arbitraries
export type FilterFunction = (value: unknown) => boolean;
type TypeOf = 'string' | 'boolean' | 'number' | 'function' | 'bigint' | 'undefined' | 'object' | 'symbol';
type Primitive = string | boolean | number | bigint | symbol | null | undefined;

export const notAnArray: FilterFunction = (value: unknown): boolean => !Array.isArray(value);
export const notAnEmptyArray: FilterFunction = (value: unknown): boolean => !Array.isArray(value) || value.length !== 0;
export const notAnObject: FilterFunction = (value: unknown): boolean => typeof value !== 'object' || value === null;
export const notAnEmptyObject: FilterFunction = (value: unknown): boolean => Object.keys(value as any).length !== 0;
export const notOfType = (...types: TypeOf[]): FilterFunction => (value) => !types.includes(typeof value);
export const notALiteral = (...literals: unknown[]): FilterFunction => (value) => !literals.includes(value);
export const notNumeric: FilterFunction = (value) => isNaN(parseFloat(value as any));

// Helper assertion methods
export const assertArbitrary = (arbitrary: fc.Arbitrary<unknown>, checks: FilterFunction[], result: boolean) => {
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
) => {
  assertArbitrary(validArbitrary, checks, true);
  assertArbitrary(invalidArbitrary, checks, false);
};
