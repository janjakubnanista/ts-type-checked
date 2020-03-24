import 'jest';

import {
  InterfaceWithPrimitives,
  MixedUnionWithLiterals,
  NumberLiteralUnion,
  StringLiteralUnion,
  interfaceWithPrimitivesArbitrary,
  isMixedUnionWithLiteralsCheck,
  isNumberLiteralUnionCheck,
  isStringLiteralUnionCheck,
  mixedUnionWithLiteralsArbitrary,
  nullableArbitrary,
  numberLiteralUnionArbitrary,
  stringLiteralUnionArbitrary,
  testValues,
} from './utils';
import { isA } from '../..';
import fc from 'fast-check';

describe('union types', () => {
  describe('string literal unions', () => {
    const isAStringLiteralUnion = (value: unknown) => isA<StringLiteralUnion>(value);
    const invalidStringLiteralUnionArbitrary = fc.anything().filter(value => !isStringLiteralUnionCheck(value));

    it('should return true when valid string is passed', () => {
      testValues(stringLiteralUnionArbitrary, isAStringLiteralUnion);
    });

    it('should return false when invalid string is passed', () => {
      testValues(invalidStringLiteralUnionArbitrary, isAStringLiteralUnion, false);
    });

    it('should return false when an array of valid strings is passed', () => {
      testValues(fc.array(invalidStringLiteralUnionArbitrary), isAStringLiteralUnion, false);
    });
  });

  describe('number literal unions', () => {
    const isNumberLiteralUnion = (value: unknown) => isA<NumberLiteralUnion>(value);
    const invalidNumberLiteralUnionArbitrary = fc.anything().filter(value => !isNumberLiteralUnionCheck(value));

    it('should return true when valid number is passed', () => {
      testValues(numberLiteralUnionArbitrary, isNumberLiteralUnion);
    });

    it('should return false when invalid number is passed', () => {
      testValues(invalidNumberLiteralUnionArbitrary, isNumberLiteralUnion, false);
    });

    it('should return false when an array of valid numbers is passed', () => {
      testValues(fc.array(numberLiteralUnionArbitrary), isNumberLiteralUnion, false);
    });
  });

  describe('object literal unions', () => {
    type ObjectB = {
      attribute: boolean;
    };

    type ObjectLiteralUnion = InterfaceWithPrimitives | ObjectB | { prop: number };
    const isObjectLiteralUnion = (value: unknown) => isA<ObjectLiteralUnion>(value);
    const objectBArbitrary = fc.record<ObjectB>({ attribute: fc.boolean() });
    const objectCArbitrary = fc.record<{ prop: number }>({ prop: fc.integer() });
    const validObjectLiteralUnionArbitrary = fc.oneof(
      interfaceWithPrimitivesArbitrary,
      objectBArbitrary,
      objectCArbitrary,
    );
    const invalidObjectLiteralUnionArbitrary = fc.oneof(
      fc.record({
        property: fc.oneof(
          fc.date(),
          fc.integer(),
          fc.boolean(),
          fc.object(),
          fc.date(),
          fc.array(validObjectLiteralUnionArbitrary),
        ),
      }),
      fc.record({
        attribute: fc.oneof(
          fc.date(),
          fc.string(),
          fc.integer(),
          fc.object(),
          fc.date(),
          fc.array(validObjectLiteralUnionArbitrary),
        ),
      }),
      fc.record({
        prop: fc.oneof(fc.date(), fc.string(), fc.boolean(), fc.object(), fc.array(validObjectLiteralUnionArbitrary)),
      }),
      fc.integer(),
      fc.boolean(),
      fc.date(),
      nullableArbitrary,
    );

    it('should return true when valid object is passed', () => {
      testValues(validObjectLiteralUnionArbitrary, isObjectLiteralUnion);
    });

    it('should return false when invalid object is passed', () => {
      testValues(invalidObjectLiteralUnionArbitrary, isObjectLiteralUnion, false);
    });

    it('should return false when an array of valid objects is passed', () => {
      testValues(fc.array(validObjectLiteralUnionArbitrary), isObjectLiteralUnion, false);
    });
  });

  describe('mixed unions with literals', () => {
    const isMixedUnionWithLiterals = (value: unknown) => isA<MixedUnionWithLiterals>(value);
    const invalidObjectLiteralUnionArbitrary = fc.anything().filter(value => !isMixedUnionWithLiteralsCheck(value));

    it('should return true when valid object is passed', () => {
      testValues(mixedUnionWithLiteralsArbitrary, isMixedUnionWithLiterals);
    });

    it('should return false when invalid object is passed', () => {
      testValues(invalidObjectLiteralUnionArbitrary, isMixedUnionWithLiterals, false);
    });

    it('should return false when an array of valid objects is passed', () => {
      testValues(fc.array(mixedUnionWithLiteralsArbitrary), isMixedUnionWithLiterals, false);
    });
  });
});
