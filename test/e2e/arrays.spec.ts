import 'jest';

import {
  InterfaceWithPrimitives,
  MixedUnionWithLiterals,
  NumberLiteralUnion,
  StringLiteralUnion,
  interfaceWithPrimitivesArbitrary,
  isInterfaceWithPrimitivesCheck,
  isMixedUnionWithLiteralsCheck,
  isNumberLiteralUnionCheck,
  isStringLiteralUnionCheck,
  mixedUnionWithLiteralsArbitrary,
  numberLiteralUnionArbitrary,
  stringLiteralUnionArbitrary,
  testValues,
} from './utils';
import { isA } from '../..';
import fc from 'fast-check';

describe('array types', () => {
  type ArrayOf<T> = T[];

  describe('string arrays', () => {
    type StringArray = string[];
    const isAStringArrayWithBrackets = (value: unknown) => isA<string[]>(value);
    const isAStringArrayWithReference = (value: unknown) => isA<StringArray>(value);
    const isAStringArrayWithGenerics = (value: unknown) => isA<ArrayOf<string>>(value);

    const validStringArrayArbitrary = fc.array(fc.string());
    const invalidStringArrayArbitrary = fc.oneof(
      fc.array(fc.anything().filter(value => typeof value !== 'string')).filter(array => !!array.length),
      fc.anything().filter(value => !Array.isArray(value)),
    );

    it('should return true when a string array is passed', () => {
      testValues(validStringArrayArbitrary, isAStringArrayWithBrackets);
      testValues(validStringArrayArbitrary, isAStringArrayWithReference);
      testValues(validStringArrayArbitrary, isAStringArrayWithGenerics);
    });

    it('should return false when a non-string array is passed', () => {
      testValues(invalidStringArrayArbitrary, isAStringArrayWithBrackets, false);
      testValues(invalidStringArrayArbitrary, isAStringArrayWithReference, false);
      testValues(invalidStringArrayArbitrary, isAStringArrayWithGenerics, false);
    });
  });

  describe('numeric arrays', () => {
    type NumberArray = string[];

    const isANumberArrayWithBrackets = (value: unknown) => isA<number[]>(value);
    const validNumberArrayArbitrary = fc.array(fc.integer());
    const invalidNumberArrayArbitrary = fc.oneof(
      fc.array(fc.anything().filter(value => typeof value !== 'number')).filter(array => !!array.length),
      fc.anything().filter(value => !Array.isArray(value)),
    );

    it('should return true when a numeric array is passed', () => {
      testValues(validNumberArrayArbitrary, isANumberArrayWithBrackets);
    });

    it('should return false when a non-numeric array is passed', () => {
      testValues(invalidNumberArrayArbitrary, isANumberArrayWithBrackets, false);
    });
  });

  describe('boolean arrays', () => {
    const isABooleanArrayWithBrackets = (value: unknown) => isA<boolean[]>(value);
    const validBooleanArrayArbitrary = fc.array(fc.boolean());
    const invalidBooleanArrayArbitrary = fc.oneof(
      fc.array(fc.anything().filter(value => typeof value !== 'boolean')).filter(array => !!array.length),
      fc.anything().filter(value => !Array.isArray(value)),
    );

    it('should return true when a boolean array is passed', () => {
      testValues(validBooleanArrayArbitrary, isABooleanArrayWithBrackets);
    });

    it('should return false when a non-boolean array is passed', () => {
      testValues(invalidBooleanArrayArbitrary, isABooleanArrayWithBrackets, false);
    });
  });

  describe('string literal arrays', () => {
    const isAStringLiteralArrayWithBrackets = (value: unknown) => isA<StringLiteralUnion[]>(value);
    const validStringLiteralArrayArbitrary = fc.array(stringLiteralUnionArbitrary);
    const invalidStringLiteralArrayArbitrary = fc.oneof(
      fc.array(fc.anything().filter(value => !isStringLiteralUnionCheck(value))).filter(array => !!array.length),
      fc.anything().filter(value => !Array.isArray(value)),
    );

    it('should return true when a string literal array is passed', () => {
      testValues(validStringLiteralArrayArbitrary, isAStringLiteralArrayWithBrackets);
    });

    it('should return false when a non-string-literal array is passed', () => {
      testValues(invalidStringLiteralArrayArbitrary, isAStringLiteralArrayWithBrackets, false);
    });
  });

  describe('number literal arrays', () => {
    const isANumberLiteralArrayWithBrackets = (value: unknown) => isA<NumberLiteralUnion[]>(value);
    const validNumberLiteralArrayArbitrary = fc.array(numberLiteralUnionArbitrary);
    const invalidNumberLiteralArrayArbitrary = fc.oneof(
      fc.array(fc.anything().filter(value => !isNumberLiteralUnionCheck(value))).filter(array => !!array.length),
      fc.anything().filter(value => !Array.isArray(value)),
    );

    it('should return true when a number literal array is passed', () => {
      testValues(validNumberLiteralArrayArbitrary, isANumberLiteralArrayWithBrackets);
    });

    it('should return false when a non-number-literal array is passed', () => {
      testValues(invalidNumberLiteralArrayArbitrary, isANumberLiteralArrayWithBrackets, false);
    });
  });

  describe('object arrays', () => {
    const isAnInterfaceWithPrimitivesArray = (value: unknown) => isA<InterfaceWithPrimitives[]>(value);
    const validInterfaceWithPrimitivesArrayArbitrary = fc.array(interfaceWithPrimitivesArbitrary);
    const invalidInterfaceWithPrimitivesArrayArbitrary = fc.oneof(
      fc.array(fc.anything().filter(value => !isInterfaceWithPrimitivesCheck(value))).filter(array => !!array.length),
      fc.anything().filter(value => !Array.isArray(value)),
    );

    it('should return true when a matching object array is passed', () => {
      testValues(validInterfaceWithPrimitivesArrayArbitrary, isAnInterfaceWithPrimitivesArray);
    });

    it('should return false when a non-number-literal array is passed', () => {
      testValues(invalidInterfaceWithPrimitivesArrayArbitrary, isAnInterfaceWithPrimitivesArray, false);
    });
  });

  describe('mixed union arrays', () => {
    const isMixedUnionWithLiteralsArray = (value: unknown) => isA<MixedUnionWithLiterals[]>(value);
    const validMixedUnionWithLiteralsArrayArbitrary = fc.array(mixedUnionWithLiteralsArbitrary);
    const invalidMixedUnionWithLiteralsArrayArbitrary = fc.oneof(
      fc.array(fc.anything().filter(value => !isMixedUnionWithLiteralsCheck(value))).filter(array => !!array.length),
      fc.anything().filter(value => !Array.isArray(value)),
    );

    it('should return true when a matching array is passed', () => {
      testValues(validMixedUnionWithLiteralsArrayArbitrary, isMixedUnionWithLiteralsArray);
    });

    it('should return false when a non-number-literal array is passed', () => {
      testValues(invalidMixedUnionWithLiteralsArrayArbitrary, isMixedUnionWithLiteralsArray, false);
    });
  });
});
