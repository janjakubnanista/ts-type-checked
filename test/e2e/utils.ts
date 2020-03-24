import fc, { Arbitrary } from 'fast-check';

export const nullableArbitrary = fc.constantFrom(null, undefined);
export const optionalOf = <T>(arbitrary: Arbitrary<T>): Arbitrary<T | undefined> =>
  fc.oneof(arbitrary, fc.constant(undefined));

export interface InterfaceWithPrimitives {
  str: string;
  num: number;
  bool: boolean;
  obj: object | {};
}
export const interfaceWithPrimitivesArbitrary = fc.record<InterfaceWithPrimitives>({
  str: fc.string(),
  num: fc.oneof(fc.float(), fc.integer()),
  bool: fc.boolean(),
  obj: fc.object(),
});
export const isInterfaceWithPrimitivesCheck = (value: any): boolean =>
  !!value &&
  typeof value === 'object' &&
  typeof value.str === 'string' &&
  typeof value.num === 'number' &&
  typeof value.bool === 'boolean' &&
  typeof value.obj === 'object' &&
  value.obj !== null;

export interface InterfaceWithOptionals {
  str?: string;
  num?: number;
  bool?: boolean;
  obj?: InterfaceWithPrimitives;
}
export const interfaceWithOptionalsArbitrary = fc.record<InterfaceWithOptionals>({
  str: optionalOf(fc.string()),
  num: optionalOf(fc.oneof(fc.float(), fc.integer())),
  bool: optionalOf(fc.boolean()),
  obj: optionalOf(interfaceWithPrimitivesArbitrary),
});
export const isInterfaceWithOptionalsCheck = (value: any): boolean =>
  !!value &&
  typeof value === 'object' &&
  (typeof value.str === 'string' || typeof value.str === 'undefined') &&
  (typeof value.num === 'number' || typeof value.num === 'undefined') &&
  (typeof value.bool === 'boolean' || typeof value.bool === 'undefined') &&
  (typeof value.obj === 'undefined' || isInterfaceWithPrimitivesCheck(value.obj));

export type StringLiteralUnion = 'property' | 'attribute' | 'feature';
export const stringLiteralUnionArbitrary = fc.constantFrom<StringLiteralUnion>('property', 'attribute', 'feature');
export const isStringLiteralUnionCheck = (value: any): boolean => ['property', 'attribute', 'feature'].includes(value);

export type NumberLiteralUnion = 8 | 14 | 7;
export const numberLiteralUnionArbitrary = fc.constantFrom<NumberLiteralUnion>(8, 14, 7);
export const isNumberLiteralUnionCheck = (value: any) => [8, 14, 7].includes(value);

export type MixedUnionWithLiterals = InterfaceWithPrimitives | string | true | 6;
export const mixedUnionWithLiteralsArbitrary = fc.oneof(
  interfaceWithPrimitivesArbitrary,
  fc.string(),
  fc.constantFrom<true | 6>(true, 6),
);
export const isMixedUnionWithLiteralsCheck = (value: any) =>
  isInterfaceWithPrimitivesCheck(value) || typeof value === 'string' || value === true || value === 6;

export const testValues = <T>(arbitrary: fc.Arbitrary<T>, check: (value: unknown) => boolean, result = true) => {
  fc.assert(
    fc.property(arbitrary, value => {
      expect(check(value)).toBe(result);
    }),
  );
};
