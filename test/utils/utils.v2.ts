import 'jest';
import fc from 'fast-check';

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

export const oneOf = <T>(...arbitraries: fc.Arbitrary<T>[]): fc.Arbitrary<T> =>
  // TypeScript 2.7.2 does not work well with fast-check type definitions
  fc.oneof(...arbitraries) as fc.Arbitrary<any>;

export const optionalOf = <T>(arbitrary: fc.Arbitrary<T>): fc.Arbitrary<T | undefined> =>
  oneOf(arbitrary, fc.constant(undefined));

export const symbol = (): fc.Arbitrary<symbol> => fc.string().map(Symbol);

export const nullable = (): fc.Arbitrary<null | undefined> => fc.constantFrom(null, undefined);

export const numeric = (): fc.Arbitrary<number> =>
  oneOf<number>(fc.integer(), fc.float(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY));

export const primitive = (): fc.Arbitrary<Primitive> =>
  oneOf<Primitive>(fc.string(), symbol(), fc.boolean(), numeric(), nullable()) as fc.Arbitrary<any>;

// Filtering functions for arbitraries
export type FilterFunction = (value: any) => boolean;
export type TypeOf = 'string' | 'boolean' | 'number' | 'function' | 'undefined' | 'object' | 'symbol';
export type Primitive = string | boolean | number | symbol | null | undefined;

export const notAnArray: FilterFunction = (value: any): boolean => !Array.isArray(value);
export const notAnEmptyArray: FilterFunction = (value: any): boolean => !Array.isArray(value) || value.length !== 0;
export const notAnObject: FilterFunction = (value: any): boolean => typeof value !== 'object' || value === null;
export const notAnEmptyObject: FilterFunction = (value: any): boolean => Object.keys(value as any).length !== 0;
export const notOfType = (...types: TypeOf[]): FilterFunction => (value: any): boolean =>
  types.indexOf(typeof value as TypeOf) === -1;
export const notALiteral = (...literals: any[]): FilterFunction => (value: any): boolean =>
  literals.indexOf(value) === -1;
export const notNumeric: FilterFunction = (value) => isNaN(parseFloat(value as any));
export const notNullOrUndefined: FilterFunction = (value) => value !== null && value !== undefined;
export const notA = (constructor: Function): FilterFunction => (value) => !(value instanceof constructor);

// Helper assertion methods
export const assertArbitrary = (arbitrary: fc.Arbitrary<any>, checks: FilterFunction[], result: boolean): void => {
  fc.assert(
    fc.property(arbitrary, (value) => {
      checks.forEach((check) => {
        expect(check(value)).toBe(result);
      });
      // TypeScript 2.7.2 does not work well with fast-check type definitions
    }) as any,
  );
};

export const assert = <T>(
  validArbitrary: fc.Arbitrary<T>,
  invalidArbitrary: fc.Arbitrary<any>,
  checks: FilterFunction[],
): void => {
  assertArbitrary(validArbitrary, checks, true);
  assertArbitrary(invalidArbitrary, checks, false);
};
