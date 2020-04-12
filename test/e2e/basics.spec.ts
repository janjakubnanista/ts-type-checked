import 'jest';

import { isA, makeIsA } from '../..';
import { optionalOf, testValues } from './utils';
import fc from 'fast-check';

describe('basics', () => {
  type GenericReference<T> = T;

  type ArrayReference<T> = T[];

  interface InterfaceWithPropertyOfType<T> {
    property: T;
  }

  interface InterfaceWithArrayPropertyOfType<T> {
    property: ArrayReference<T>;
  }

  interface InterfaceWithPropertiesOfTypes<T, U> {
    property1: T;
    property2: U;
  }

  interface InterfaceWithDifferentPropertyOfType<T> {
    differentProperty: T;
  }

  interface InterfaceWithOptionalPropertyOfType<T> {
    property?: T;
  }

  describe('primitives', () => {
    test('string', () => {
      type StringType = string;

      const validStringArbitrary = fc.string();
      const invalidStringArbitrary = fc.anything().filter(value => typeof value !== 'string');

      testValues(validStringArbitrary, makeIsA<string>());
      testValues(validStringArbitrary, makeIsA<StringType>());
      testValues(validStringArbitrary, makeIsA<GenericReference<string>>());
      testValues(validStringArbitrary, makeIsA<GenericReference<StringType>>());

      testValues(validStringArbitrary, value => isA<string>(value));
      testValues(validStringArbitrary, value => isA<StringType>(value));
      testValues(validStringArbitrary, value => isA<GenericReference<string>>(value));
      testValues(validStringArbitrary, value => isA<GenericReference<StringType>>(value));

      testValues(invalidStringArbitrary, makeIsA<string>(), false);
      testValues(invalidStringArbitrary, makeIsA<StringType>(), false);
      testValues(invalidStringArbitrary, makeIsA<GenericReference<string>>(), false);
      testValues(invalidStringArbitrary, makeIsA<GenericReference<StringType>>(), false);

      testValues(invalidStringArbitrary, value => isA<string>(value), false);
      testValues(invalidStringArbitrary, value => isA<StringType>(value), false);
      testValues(invalidStringArbitrary, value => isA<GenericReference<string>>(value), false);
      testValues(invalidStringArbitrary, value => isA<GenericReference<StringType>>(value), false);
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
      const invalidObjectArbitrary = fc.anything().filter((value: any) => typeof value?.property !== 'number');

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
        property: fc.array(fc.boolean()),
      });
      const invalidObjectArbitrary = fc
        .anything()
        .filter((value: any) => !Array.isArray(value) || value.some(element => typeof element !== 'boolean'));

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
        property: optionalOf(fc.string()),
      });
      const invalidObjectArbitrary = fc
        .anything()
        .filter(
          (value: any) =>
            typeof value !== 'object' ||
            (typeof value?.property !== 'undefined' && typeof value?.property !== 'number'),
        );

      testValues(validObjectArbitrary, makeIsA<{ property?: string }>());
      testValues(validObjectArbitrary, makeIsA<StringOptionalPropertyObjectType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<StringOptionalPropertyObjectType>>());
      testValues(invalidObjectArbitrary, makeIsA<{ property?: string }>(), false);
      testValues(invalidObjectArbitrary, makeIsA<StringOptionalPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<StringOptionalPropertyObjectType>>(), false);
    });

    test('multiple properties', () => {
      type Property1 = string | number | boolean;
      type Property2 = InterfaceWithPropertiesOfTypes<string, {}>;
      type MultiplePropertiesObjectType = InterfaceWithPropertiesOfTypes<Property1, Property2>;

      const validObjectArbitrary = fc.record<MultiplePropertiesObjectType>({
        property1: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        property2: fc.record({
          property1: fc.string(),
          property2: fc.object(),
        }),
      });
      const invalidObjectArbitrary = fc.anything().filter((value: any) => {
        const typeOfProperty1 = typeof value?.property1;
        if (typeOfProperty1 !== 'string' && typeOfProperty1 !== 'number' && typeOfProperty1 !== 'boolean') return true;

        const typeOfProperty2Property1 = typeof value?.property2?.property1;
        if (typeOfProperty2Property1 !== 'string') return true;

        const typeOfProperty2Property2 = typeof value?.property2?.property2;
        if (typeOfProperty2Property2 !== 'object' || value?.property2?.property2 === null) return true;

        return false;
      });

      testValues(validObjectArbitrary, makeIsA<MultiplePropertiesObjectType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<MultiplePropertiesObjectType>>());
      testValues(invalidObjectArbitrary, makeIsA<MultiplePropertiesObjectType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<MultiplePropertiesObjectType>>(), false);
    });

    test('recursion', () => {
      type RecursiveType = InterfaceWithPropertyOfType<RecursiveType | undefined>;

      const tree: fc.Memo<RecursiveType> = fc.memo(n => node());
      const node: fc.Memo<RecursiveType> = fc.memo(n => {
        if (n <= 1)
          return fc.record<RecursiveType>({
            property: fc.constant(undefined),
          });

        return fc.record<RecursiveType>({
          property: tree(),
        });
      });

      const validObjectArbitrary = tree();
      const isRecursiveType = (value: any): value is RecursiveType => {
        if (typeof value !== 'object' || !value) return false;
        if (typeof value?.property === 'undefined' || isRecursiveType(value.property)) return true;

        return false;
      };
      const invalidObjectArbitrary = fc.anything().filter(value => !isRecursiveType(value));

      testValues(validObjectArbitrary, makeIsA<RecursiveType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<RecursiveType>>());
      testValues(invalidObjectArbitrary, makeIsA<RecursiveType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<RecursiveType>>(), false);
    });

    test('conditional types', () => {
      type ConditionalOfType<T, C extends true | false> = C extends true ? T : undefined;
      type ConditionalOfStringArray = ConditionalOfType<string[], true>;
      type ConditionalOfUndefined = ConditionalOfType<string[], false>;

      const stringArrayArbitrary = fc.array(fc.string());
      const undefinedArbitrary = fc.constant(undefined);

      testValues(stringArrayArbitrary, makeIsA<ConditionalOfStringArray>());
      testValues(stringArrayArbitrary, makeIsA<ConditionalOfType<string[], true>>());
      testValues(stringArrayArbitrary, makeIsA<ConditionalOfType<ArrayReference<string>, true>>());

      testValues(undefinedArbitrary, makeIsA<ConditionalOfUndefined>());
      testValues(undefinedArbitrary, makeIsA<ConditionalOfType<string[], false>>());
      testValues(undefinedArbitrary, makeIsA<ConditionalOfType<ArrayReference<string>, false>>());
    });

    test('intersection', () => {
      type NumberPropertyObjectType = InterfaceWithPropertyOfType<number>;
      type StringDifferentPropertyObjectType = InterfaceWithDifferentPropertyOfType<string>;
      type IntersectionType = NumberPropertyObjectType & StringDifferentPropertyObjectType;

      const validObjectArbitrary = fc.record<IntersectionType>({
        property: fc.integer(),
        differentProperty: fc.string(),
      });
      const invalidObjectArbitrary = fc
        .anything()
        .filter((value: any) => typeof value?.property !== 'number' || typeof value?.differentProperty !== 'string');

      testValues(validObjectArbitrary, makeIsA<NumberPropertyObjectType & StringDifferentPropertyObjectType>());
      testValues(validObjectArbitrary, makeIsA<IntersectionType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<IntersectionType>>());
      testValues(
        invalidObjectArbitrary,
        makeIsA<NumberPropertyObjectType & StringDifferentPropertyObjectType>(),
        false,
      );
      testValues(invalidObjectArbitrary, makeIsA<IntersectionType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<IntersectionType>>(), false);
    });
  });

  describe('array types', () => {
    test('string[]', () => {
      type StringType = string[];

      const validStringArbitrary = fc.array(fc.string());
      const invalidStringArbitrary = fc
        .anything()
        .filter(value => !Array.isArray(value) || value.some(element => typeof element !== 'string'));

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

      const validObjectArbitrary = fc.array(
        fc.string().map<InterfaceWithPropertyOfType<string>>(property => ({ property })),
      );
      const invalidObjectArbitrary = fc
        .anything()
        .filter(value => !Array.isArray(value) || value.some(element => typeof element?.property !== 'string'));

      testValues(validObjectArbitrary, makeIsA<{ property: string }[]>());
      testValues(validObjectArbitrary, makeIsA<StringPropertyObjectType>());
      testValues(validObjectArbitrary, makeIsA<GenericReference<StringPropertyObjectType>>());
      testValues(invalidObjectArbitrary, makeIsA<{ property: string }[]>(), false);
      testValues(invalidObjectArbitrary, makeIsA<StringPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, makeIsA<GenericReference<StringPropertyObjectType>>(), false);
    });
  });
});
