import 'jest';

import {
  NumberLiteralUnion,
  StringLiteralUnion,
  isNumberLiteralUnionCheck,
  isStringLiteralUnionCheck,
  numberLiteralUnionArbitrary,
  stringLiteralUnionArbitrary,
  testValues,
  optionalOf,
} from './utils';
import { isA, makeIsA } from '../..';
import fc, { property } from 'fast-check';

describe('basics', () => {
  type GenericReference<T> = T;

  type ArrayReference<T> = T[];

  interface InterfaceWithPropertyOfType<T> {
    property: T;
  }

  interface InterfaceWithArrayPropertyOfType<T> {
    property: T[];
  }

  interface InterfaceWithDifferentPropertyOfType<T> {
    differentProperty: T;
  }

  interface InterfaceWithOptionalPropertyOfType<T> {
    property?: T;
  }

  type TypeWithPropertyOfType<T> = {
    property: T;
  };

  type TypeWithOptionalPropertyOfType<T> = {
    property?: T;
  };

  describe('primitives', () => {
    test('string', () => {
      type StringType = string;

      const validStringArbitrary = fc.string();
      const invalidStringArbitrary = fc.anything().filter(value => typeof value !== 'string');

      testValues(validStringArbitrary, makeIsA<string>());
      testValues(validStringArbitrary, makeIsA<StringType>());
      testValues(validStringArbitrary, makeIsA<GenericReference<string>>());
      testValues(validStringArbitrary, makeIsA<GenericReference<StringType>>());
      testValues(invalidStringArbitrary, makeIsA<string>(), false);
      testValues(invalidStringArbitrary, makeIsA<StringType>(), false);
      testValues(invalidStringArbitrary, makeIsA<GenericReference<string>>(), false);
      testValues(invalidStringArbitrary, makeIsA<GenericReference<StringType>>(), false);
    });

    test('number', () => {
      type NumberType = number;

      const validNumberArbitrary = fc.oneof(fc.integer(), fc.float());
      const invalidNumberArbitrary = fc.anything().filter(value => typeof value !== 'number');

      testValues(validNumberArbitrary, makeIsA<number>());
      testValues(validNumberArbitrary, makeIsA<NumberType>());
      testValues(validNumberArbitrary, makeIsA<GenericReference<number>>());
      testValues(validNumberArbitrary, makeIsA<GenericReference<NumberType>>());
      testValues(invalidNumberArbitrary, makeIsA<number>(), false);
      testValues(invalidNumberArbitrary, makeIsA<NumberType>(), false);
      testValues(invalidNumberArbitrary, makeIsA<GenericReference<number>>(), false);
      testValues(invalidNumberArbitrary, makeIsA<GenericReference<NumberType>>(), false);
    });

    test('boolean', () => {
      type BooleanType = boolean;

      const validBooleanArbitrary = fc.boolean();
      const invalidBooleanArbitrary = fc.anything().filter(value => typeof value !== 'boolean');

      testValues(validBooleanArbitrary, makeIsA<boolean>());
      testValues(validBooleanArbitrary, makeIsA<BooleanType>());
      testValues(validBooleanArbitrary, makeIsA<GenericReference<boolean>>());
      testValues(validBooleanArbitrary, makeIsA<GenericReference<BooleanType>>());
      testValues(invalidBooleanArbitrary, makeIsA<boolean>(), false);
      testValues(invalidBooleanArbitrary, makeIsA<BooleanType>(), false);
      testValues(invalidBooleanArbitrary, makeIsA<GenericReference<boolean>>(), false);
      testValues(invalidBooleanArbitrary, makeIsA<GenericReference<BooleanType>>(), false);
    });

    test('true', () => {
      type TrueType = true;

      const validTrueArbitrary = fc.constantFrom(true);
      const invalidTrueArbitrary = fc.anything().filter(value => value !== true);

      testValues(validTrueArbitrary, makeIsA<true>());
      testValues(validTrueArbitrary, makeIsA<TrueType>());
      testValues(validTrueArbitrary, makeIsA<GenericReference<true>>());
      testValues(validTrueArbitrary, makeIsA<GenericReference<TrueType>>());
      testValues(invalidTrueArbitrary, makeIsA<true>(), false);
      testValues(invalidTrueArbitrary, makeIsA<TrueType>(), false);
      testValues(invalidTrueArbitrary, makeIsA<GenericReference<true>>(), false);
      testValues(invalidTrueArbitrary, makeIsA<GenericReference<TrueType>>(), false);
    });

    test('false', () => {
      type FalseType = false;

      const validFalseArbitrary = fc.constantFrom(false);
      const invalidFalseArbitrary = fc.anything().filter(value => value !== false);

      testValues(validFalseArbitrary, makeIsA<false>());
      testValues(validFalseArbitrary, makeIsA<FalseType>());
      testValues(validFalseArbitrary, makeIsA<GenericReference<false>>());
      testValues(validFalseArbitrary, makeIsA<GenericReference<FalseType>>());
      testValues(invalidFalseArbitrary, makeIsA<false>(), false);
      testValues(invalidFalseArbitrary, makeIsA<FalseType>(), false);
      testValues(invalidFalseArbitrary, makeIsA<GenericReference<false>>(), false);
      testValues(invalidFalseArbitrary, makeIsA<GenericReference<FalseType>>(), false);
    });

    test('undefined', () => {
      type UndefinedType = undefined;

      const validUndefinedArbitrary = fc.constantFrom(undefined, void 0);
      const invalidUndefinedArbitrary = fc.anything().filter(value => typeof value !== 'undefined');

      testValues(validUndefinedArbitrary, makeIsA<undefined>());
      testValues(validUndefinedArbitrary, makeIsA<UndefinedType>());
      testValues(invalidUndefinedArbitrary, makeIsA<undefined>(), false);
      testValues(invalidUndefinedArbitrary, makeIsA<UndefinedType>(), false);
    });

    test('any', () => {
      type AnyType = any;

      const anyArbitrary = fc.anything();

      testValues(anyArbitrary, makeIsA<any>());
      testValues(anyArbitrary, makeIsA<AnyType>());
    });

    // This test is not super DRY
    test('literal', () => {
      type LiteralType = 'a' | 'b' | 'c' | 9 | false | true;
      const literalTypeValues: LiteralType[] = ['a', 'b', 'c', 9, false, true];

      const validLiteralArbitrary = fc.constantFrom<LiteralType>(...literalTypeValues);
      const invalidLiteralArbitrary = fc.anything().filter(value => !literalTypeValues.includes(value as any));

      testValues(validLiteralArbitrary, makeIsA<'a' | 'b' | 'c' | 9 | false | true>());
      testValues(validLiteralArbitrary, makeIsA<LiteralType>());
      testValues(validLiteralArbitrary, makeIsA<GenericReference<LiteralType>>());
      testValues(invalidLiteralArbitrary, makeIsA<'a' | 'b' | 'c' | 9 | false | true>(), false);
      testValues(invalidLiteralArbitrary, makeIsA<LiteralType>(), false);
      testValues(invalidLiteralArbitrary, makeIsA<GenericReference<LiteralType>>(), false);
    });
  });

  describe('interface types', () => {
    test('number property', () => {
      type NumberPropertyObjectType = InterfaceWithPropertyOfType<number>;

      const validObjectArbitrary = fc.integer().map<InterfaceWithPropertyOfType<number>>(property => ({ property }));
      const invalidObjectArbitrary = fc.anything().filter((value: any) => typeof(value?.property) !== 'number');

      testValues(validObjectArbitrary, makeIsA<{ property: number }>());
      testValues(validObjectArbitrary, makeIsA<NumberPropertyObjectType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<NumberPropertyObjectType>>());
      testValues(invalidObjectArbitrary, makeIsA<{ property: number }>(), false);
      testValues(invalidObjectArbitrary, makeIsA<NumberPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<NumberPropertyObjectType>>(), false);
    });

    test('array property', () => {
      type BooleanArrayPropertyObjectType = InterfaceWithArrayPropertyOfType<boolean>;

      const validObjectArbitrary = fc.record<BooleanArrayPropertyObjectType>({
        property: fc.array(fc.boolean())
      })
      const invalidObjectArbitrary = fc.anything().filter((value: any) => !Array.isArray(value) || value.some(element => typeof(element) !== 'boolean'));

      testValues(validObjectArbitrary, makeIsA<{ property: boolean[] }>());
      testValues(validObjectArbitrary, makeIsA<BooleanArrayPropertyObjectType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<BooleanArrayPropertyObjectType>>());
      testValues(invalidObjectArbitrary, makeIsA<{ property: boolean[] }>(), false);
      testValues(invalidObjectArbitrary, makeIsA<BooleanArrayPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<BooleanArrayPropertyObjectType>>(), false);
    });

    test('optional property', () => {
      type StringOptionalPropertyObjectType = InterfaceWithOptionalPropertyOfType<string>;

      const validObjectArbitrary = fc.record<StringOptionalPropertyObjectType>({
        property: optionalOf(fc.string())
      })
      const invalidObjectArbitrary = fc.anything().filter((value: any) => typeof value !== 'object' || (typeof value?.property !== 'undefined' && typeof value?.property !== 'number'));

      testValues(validObjectArbitrary, makeIsA<{ property?: string }>());
      testValues(validObjectArbitrary, makeIsA<StringOptionalPropertyObjectType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<StringOptionalPropertyObjectType>>());
      testValues(invalidObjectArbitrary, makeIsA<{ property?: string }>(), false);
      testValues(invalidObjectArbitrary, makeIsA<StringOptionalPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<StringOptionalPropertyObjectType>>(), false);
    });

    test('intersection', () => {
      type NumberPropertyObjectType = InterfaceWithPropertyOfType<number>;
      type StringDifferentPropertyObjectType = InterfaceWithDifferentPropertyOfType<string>;
      type IntersectionType = NumberPropertyObjectType & StringDifferentPropertyObjectType;

      const validObjectArbitrary = fc.record<IntersectionType>({
        property: fc.integer(),
        differentProperty: fc.string()
      })
      const invalidObjectArbitrary = fc.anything().filter((value: any) => typeof(value?.property) !== 'number' || typeof(value?.differentProperty) !== 'string');

      testValues(validObjectArbitrary, makeIsA<NumberPropertyObjectType & StringDifferentPropertyObjectType>());
      testValues(validObjectArbitrary, makeIsA<IntersectionType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<IntersectionType>>());
      testValues(invalidObjectArbitrary, makeIsA<NumberPropertyObjectType & StringDifferentPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<IntersectionType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<IntersectionType>>(), false);
    });
  });

  describe('array types', () => {
    test('string[]', () => {
      type StringType = string[];

      const validStringArbitrary = fc.array(fc.string());
      const invalidStringArbitrary = fc.anything().filter(value => !Array.isArray(value) || value.some(element => typeof element !== 'string'));

      testValues(validStringArbitrary, makeIsA<string[]>());
      testValues(validStringArbitrary, makeIsA<StringType>());
      testValues(validStringArbitrary, makeIsA<GenericReference<string[]>>());
      testValues(validStringArbitrary, makeIsA<GenericReference<StringType>>());
      testValues(invalidStringArbitrary, makeIsA<string[]>(), false);
      testValues(invalidStringArbitrary, makeIsA<StringType>(), false);
      testValues(invalidStringArbitrary, makeIsA<GenericReference<string[]>>(), false);
      testValues(invalidStringArbitrary, makeIsA<GenericReference<StringType>>(), false);
    });

    test('interface[]', () => {
      type StringPropertyObjectType = InterfaceWithPropertyOfType<string>[];

      const validObjectArbitrary = fc.array(fc.string().map<InterfaceWithPropertyOfType<string>>(property => ({ property })));
      const invalidObjectArbitrary = fc.anything().filter(value => !Array.isArray(value) || value.some(element => typeof element?.property !== 'string'));

      testValues(validObjectArbitrary, makeIsA<{ property: string }[]>());
      testValues(validObjectArbitrary, makeIsA<StringPropertyObjectType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<StringPropertyObjectType>>());
      testValues(invalidObjectArbitrary, makeIsA<{ property: string }[]>(), false);
      testValues(invalidObjectArbitrary, makeIsA<StringPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<StringPropertyObjectType>>(), false);
    });
  });
});
