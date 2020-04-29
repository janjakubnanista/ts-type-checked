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

export const recordOf = (values: fc.Arbitrary<unknown>) => fc.dictionary(fc.string(), values);

export type FilterFunction = (value: unknown) => boolean;
export const testTypeChecks = <T>(arbitrary: fc.Arbitrary<T>, checks: FilterFunction[], result: boolean) => {
  fc.assert(
    fc.property(arbitrary, value => {
      checks.forEach(check => {
        expect(check(value)).toBe(result);
      });
    }),
  );
};

// Filtering functions for arbitraries
type Shape = Record<string, FilterFunction>;
type TypeOf = 'string' | 'boolean' | 'number' | 'function' | 'bigint' | 'undefined' | 'object' | 'symbol';
type Primitive = string | boolean | number | bigint | symbol | null | undefined;

const PRIMITIVE_TYPES = ['string', 'boolean', 'number', 'bigint', 'symbol', 'undefined'];

export const primitive = (): fc.Arbitrary<Primitive> =>
  fc.oneof(
    fc.string(),
    fc.boolean(),
    fc.integer(),
    fc.float(),
    fc.bigInt(),
    fc.constantFrom(null, undefined, Symbol('a')),
  );
export const notAnArray: FilterFunction = (value: unknown): boolean => !Array.isArray(value);
export const notAnEmptyArray: FilterFunction = (value: unknown): boolean => !Array.isArray(value) || value.length !== 0;
export const notAnObject: FilterFunction = (value: unknown): boolean => typeof value !== 'object' || value === null;
export const notAnEmptyObject: FilterFunction = (value: unknown): boolean =>
  notAnObject(value) || Object.keys(value as any).length !== 0;
export const notOfType = (...types: TypeOf[]): FilterFunction => value => !types.includes(typeof value);
export const notAPrimitive: FilterFunction = value => !PRIMITIVE_TYPES.includes(typeof value) && value !== null;
export const aPrimitive: FilterFunction = value => !notAPrimitive(value);
export const notALiteral = (...literals: unknown[]): FilterFunction => value => !literals.includes(value);
