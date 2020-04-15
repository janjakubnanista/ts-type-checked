import 'jest';

import { isA, typeCheckFor } from '..';
import { optionalOf, testValues } from './utils';
import fc from 'fast-check';

// These classes are here for the tests of globally accessible classes
class A {
  aProperty = 'Andrea Bocelli';
}

class B {
  bProperty = 'Britney Spears';
}

class ASubclass extends A {
  aSubclassProperty = 'Enrique Iglesias';
}

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

      testValues(validStringArbitrary, typeCheckFor<string>());
      testValues(validStringArbitrary, typeCheckFor<StringType>());
      testValues(validStringArbitrary, typeCheckFor<GenericReference<string>>());
      testValues(validStringArbitrary, typeCheckFor<GenericReference<StringType>>());

      testValues(validStringArbitrary, value => isA<string>(value));
      testValues(validStringArbitrary, value => isA<StringType>(value));
      testValues(validStringArbitrary, value => isA<GenericReference<string>>(value));
      testValues(validStringArbitrary, value => isA<GenericReference<StringType>>(value));

      testValues(invalidStringArbitrary, typeCheckFor<string>(), false);
      testValues(invalidStringArbitrary, typeCheckFor<StringType>(), false);
      testValues(invalidStringArbitrary, typeCheckFor<GenericReference<string>>(), false);
      testValues(invalidStringArbitrary, typeCheckFor<GenericReference<StringType>>(), false);

      testValues(invalidStringArbitrary, value => isA<string>(value), false);
      testValues(invalidStringArbitrary, value => isA<StringType>(value), false);
      testValues(invalidStringArbitrary, value => isA<GenericReference<string>>(value), false);
      testValues(invalidStringArbitrary, value => isA<GenericReference<StringType>>(value), false);
    });

    test('number', () => {
      type NumberType = number;

      const validNumberArbitrary = fc.oneof(fc.integer(), fc.float());
      const invalidNumberArbitrary = fc.anything().filter(value => typeof value !== 'number');

      testValues(validNumberArbitrary, typeCheckFor<number>());
      testValues(validNumberArbitrary, typeCheckFor<NumberType>());
      testValues(validNumberArbitrary, typeCheckFor<GenericReference<number>>());
      testValues(validNumberArbitrary, typeCheckFor<GenericReference<NumberType>>());
      testValues(invalidNumberArbitrary, typeCheckFor<number>(), false);
      testValues(invalidNumberArbitrary, typeCheckFor<NumberType>(), false);
      testValues(invalidNumberArbitrary, typeCheckFor<GenericReference<number>>(), false);
      testValues(invalidNumberArbitrary, typeCheckFor<GenericReference<NumberType>>(), false);
    });

    test('object', () => {
      type ObjectType = object;

      const validObjectArbitrary = fc.object();
      const invalidObjectArbitrary = fc.anything().filter(value => typeof value !== 'object' || value === null);

      testValues(validObjectArbitrary, typeCheckFor<object>());
      testValues(validObjectArbitrary, typeCheckFor<ObjectType>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<object>>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<ObjectType>>());
      testValues(invalidObjectArbitrary, typeCheckFor<object>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<ObjectType>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<object>>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<ObjectType>>(), false);
    });

    test('{}', () => {
      type ObjectType = {};

      const validObjectArbitrary = fc.object();
      const invalidObjectArbitrary = fc.anything().filter(value => typeof value !== 'object' || value === null);

      testValues(validObjectArbitrary, typeCheckFor<{}>());
      testValues(validObjectArbitrary, typeCheckFor<ObjectType>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<{}>>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<ObjectType>>());
      testValues(invalidObjectArbitrary, typeCheckFor<{}>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<ObjectType>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<{}>>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<ObjectType>>(), false);
    });

    test('function', () => {
      type FunctionType = () => void;

      const validFunctionArbitrary = fc.func(fc.anything());
      const invalidFunctionArbitrary = fc.anything().filter(value => typeof value !== 'function');

      testValues(validFunctionArbitrary, typeCheckFor<() => void>());
      testValues(validFunctionArbitrary, typeCheckFor<FunctionType>());
      testValues(validFunctionArbitrary, typeCheckFor<GenericReference<() => void>>());
      testValues(validFunctionArbitrary, typeCheckFor<GenericReference<FunctionType>>());
      testValues(invalidFunctionArbitrary, typeCheckFor<() => void>(), false);
      testValues(invalidFunctionArbitrary, typeCheckFor<FunctionType>(), false);
      testValues(invalidFunctionArbitrary, typeCheckFor<GenericReference<() => void>>(), false);
      testValues(invalidFunctionArbitrary, typeCheckFor<GenericReference<FunctionType>>(), false);
    });

    test('boolean', () => {
      type BooleanType = boolean;

      const validBooleanArbitrary = fc.boolean();
      const invalidBooleanArbitrary = fc.anything().filter(value => typeof value !== 'boolean');

      testValues(validBooleanArbitrary, typeCheckFor<boolean>());
      testValues(validBooleanArbitrary, typeCheckFor<BooleanType>());
      testValues(validBooleanArbitrary, typeCheckFor<GenericReference<boolean>>());
      testValues(validBooleanArbitrary, typeCheckFor<GenericReference<BooleanType>>());
      testValues(invalidBooleanArbitrary, typeCheckFor<boolean>(), false);
      testValues(invalidBooleanArbitrary, typeCheckFor<BooleanType>(), false);
      testValues(invalidBooleanArbitrary, typeCheckFor<GenericReference<boolean>>(), false);
      testValues(invalidBooleanArbitrary, typeCheckFor<GenericReference<BooleanType>>(), false);
    });

    test('true', () => {
      type TrueType = true;

      const validTrueArbitrary = fc.constantFrom(true);
      const invalidTrueArbitrary = fc.anything().filter(value => value !== true);

      testValues(validTrueArbitrary, typeCheckFor<true>());
      testValues(validTrueArbitrary, typeCheckFor<TrueType>());
      testValues(validTrueArbitrary, typeCheckFor<GenericReference<true>>());
      testValues(validTrueArbitrary, typeCheckFor<GenericReference<TrueType>>());
      testValues(invalidTrueArbitrary, typeCheckFor<true>(), false);
      testValues(invalidTrueArbitrary, typeCheckFor<TrueType>(), false);
      testValues(invalidTrueArbitrary, typeCheckFor<GenericReference<true>>(), false);
      testValues(invalidTrueArbitrary, typeCheckFor<GenericReference<TrueType>>(), false);
    });

    test('false', () => {
      type FalseType = false;

      const validFalseArbitrary = fc.constantFrom(false);
      const invalidFalseArbitrary = fc.anything().filter(value => value !== false);

      testValues(validFalseArbitrary, typeCheckFor<false>());
      testValues(validFalseArbitrary, typeCheckFor<FalseType>());
      testValues(validFalseArbitrary, typeCheckFor<GenericReference<false>>());
      testValues(validFalseArbitrary, typeCheckFor<GenericReference<FalseType>>());
      testValues(invalidFalseArbitrary, typeCheckFor<false>(), false);
      testValues(invalidFalseArbitrary, typeCheckFor<FalseType>(), false);
      testValues(invalidFalseArbitrary, typeCheckFor<GenericReference<false>>(), false);
      testValues(invalidFalseArbitrary, typeCheckFor<GenericReference<FalseType>>(), false);
    });

    test('undefined', () => {
      type UndefinedType = undefined;

      const validUndefinedArbitrary = fc.constantFrom(undefined, void 0);
      const invalidUndefinedArbitrary = fc.anything().filter(value => typeof value !== 'undefined');

      testValues(validUndefinedArbitrary, typeCheckFor<undefined>());
      testValues(validUndefinedArbitrary, typeCheckFor<UndefinedType>());
      testValues(invalidUndefinedArbitrary, typeCheckFor<undefined>(), false);
      testValues(invalidUndefinedArbitrary, typeCheckFor<UndefinedType>(), false);
    });

    test('any', () => {
      type AnyType = any;

      const anyArbitrary = fc.anything();

      testValues(anyArbitrary, typeCheckFor<any>());
      testValues(anyArbitrary, typeCheckFor<AnyType>());
    });

    // This test is not super DRY
    test('literal', () => {
      type LiteralType = 'a' | 'b' | 'c' | 9 | false | true;
      const literalTypeValues: LiteralType[] = ['a', 'b', 'c', 9, false, true];

      const validLiteralArbitrary = fc.constantFrom<LiteralType>(...literalTypeValues);
      const invalidLiteralArbitrary = fc.anything().filter(value => !literalTypeValues.includes(value as any));

      testValues(validLiteralArbitrary, typeCheckFor<'a' | 'b' | 'c' | 9 | false | true>());
      testValues(validLiteralArbitrary, typeCheckFor<LiteralType>());
      testValues(validLiteralArbitrary, typeCheckFor<GenericReference<LiteralType>>());
      testValues(invalidLiteralArbitrary, typeCheckFor<'a' | 'b' | 'c' | 9 | false | true>(), false);
      testValues(invalidLiteralArbitrary, typeCheckFor<LiteralType>(), false);
      testValues(invalidLiteralArbitrary, typeCheckFor<GenericReference<LiteralType>>(), false);
    });
  });

  describe('interface types', () => {
    describe('number property', () => {
      type NumberPropertyObjectType = InterfaceWithPropertyOfType<number>;

      const validObjectArbitrary = fc.integer().map<InterfaceWithPropertyOfType<number>>(property => ({ property }));
      const invalidObjectArbitrary = fc.anything().filter((value: any) => typeof value?.property !== 'number');

      test('typeCheckerFor', () => {
        testValues(validObjectArbitrary, typeCheckFor<{ property: number }>());
        testValues(validObjectArbitrary, typeCheckFor<NumberPropertyObjectType>());
        testValues(validObjectArbitrary, typeCheckFor<GenericReference<NumberPropertyObjectType>>());

        testValues(invalidObjectArbitrary, typeCheckFor<{ property: number }>(), false);
        testValues(invalidObjectArbitrary, typeCheckFor<NumberPropertyObjectType>(), false);
        testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<NumberPropertyObjectType>>(), false);
      });

      test('isA', () => {
        testValues(validObjectArbitrary, value => isA<{ property: number }>(value));
        testValues(validObjectArbitrary, value => isA<NumberPropertyObjectType>(value));
        testValues(validObjectArbitrary, value => isA<GenericReference<NumberPropertyObjectType>>(value));

        testValues(invalidObjectArbitrary, value => isA<{ property: number }>(value), false);
        testValues(invalidObjectArbitrary, value => isA<NumberPropertyObjectType>(value), false);
        testValues(invalidObjectArbitrary, value => isA<GenericReference<NumberPropertyObjectType>>(value), false);
      });
    });

    test('array property', () => {
      type BooleanArrayPropertyObjectType = InterfaceWithArrayPropertyOfType<boolean>;

      const validObjectArbitrary = fc.record<BooleanArrayPropertyObjectType>({
        property: fc.array(fc.boolean()),
      });
      const invalidObjectArbitrary = fc
        .anything()
        .filter((value: any) => !Array.isArray(value) || value.some(element => typeof element !== 'boolean'));

      testValues(validObjectArbitrary, typeCheckFor<{ property: boolean[] }>());
      testValues(validObjectArbitrary, typeCheckFor<BooleanArrayPropertyObjectType>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<BooleanArrayPropertyObjectType>>());
      testValues(invalidObjectArbitrary, typeCheckFor<{ property: boolean[] }>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<BooleanArrayPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<BooleanArrayPropertyObjectType>>(), false);
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

      testValues(validObjectArbitrary, typeCheckFor<{ property?: string }>());
      testValues(validObjectArbitrary, typeCheckFor<StringOptionalPropertyObjectType>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<StringOptionalPropertyObjectType>>());
      testValues(invalidObjectArbitrary, typeCheckFor<{ property?: string }>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<StringOptionalPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<StringOptionalPropertyObjectType>>(), false);
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

      testValues(validObjectArbitrary, typeCheckFor<MultiplePropertiesObjectType>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<MultiplePropertiesObjectType>>());
      testValues(invalidObjectArbitrary, typeCheckFor<MultiplePropertiesObjectType>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<MultiplePropertiesObjectType>>(), false);
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

      testValues(validObjectArbitrary, typeCheckFor<RecursiveType>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<RecursiveType>>());
      testValues(invalidObjectArbitrary, typeCheckFor<RecursiveType>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<RecursiveType>>(), false);
    });

    test('conditional types', () => {
      type ConditionalOfType<T, C extends true | false> = C extends true ? T : undefined;
      type ConditionalOfStringArray = ConditionalOfType<string[], true>;
      type ConditionalOfUndefined = ConditionalOfType<string[], false>;

      const stringArrayArbitrary = fc.array(fc.string());
      const undefinedArbitrary = fc.constant(undefined);

      testValues(stringArrayArbitrary, typeCheckFor<ConditionalOfStringArray>());
      testValues(stringArrayArbitrary, typeCheckFor<ConditionalOfType<string[], true>>());
      testValues(stringArrayArbitrary, typeCheckFor<ConditionalOfType<ArrayReference<string>, true>>());

      testValues(undefinedArbitrary, typeCheckFor<ConditionalOfUndefined>());
      testValues(undefinedArbitrary, typeCheckFor<ConditionalOfType<string[], false>>());
      testValues(undefinedArbitrary, typeCheckFor<ConditionalOfType<ArrayReference<string>, false>>());
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

      testValues(validObjectArbitrary, typeCheckFor<NumberPropertyObjectType & StringDifferentPropertyObjectType>());
      testValues(validObjectArbitrary, typeCheckFor<IntersectionType>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<IntersectionType>>());
      testValues(
        invalidObjectArbitrary,
        typeCheckFor<NumberPropertyObjectType & StringDifferentPropertyObjectType>(),
        false,
      );
      testValues(invalidObjectArbitrary, typeCheckFor<IntersectionType>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<IntersectionType>>(), false);
    });

    test('string records', () => {
      type StringRecord = Record<string, number | boolean>;

      const stringRecordArbitrary = fc.array(fc.string()).chain(keys => {
        return fc.record<StringRecord>(
          keys.reduce(
            (recordOptions, key) => ({
              ...recordOptions,
              [key]: fc.oneof(fc.integer(), fc.boolean()),
            }),
            {},
          ),
        );
      });

      testValues(stringRecordArbitrary, typeCheckFor<StringRecord>());
      testValues(stringRecordArbitrary, typeCheckFor<GenericReference<StringRecord>>());
    });
  });

  describe('array types', () => {
    test('string[]', () => {
      type StringType = string[];

      const validStringArbitrary = fc.array(fc.string());
      const invalidStringArbitrary = fc
        .anything()
        .filter(value => !Array.isArray(value) || value.some(element => typeof element !== 'string'));

      testValues(validStringArbitrary, typeCheckFor<string[]>());
      testValues(validStringArbitrary, typeCheckFor<StringType>());
      testValues(validStringArbitrary, typeCheckFor<GenericReference<string[]>>());
      testValues(validStringArbitrary, typeCheckFor<GenericReference<StringType>>());
      testValues(invalidStringArbitrary, typeCheckFor<string[]>(), false);
      testValues(invalidStringArbitrary, typeCheckFor<StringType>(), false);
      testValues(invalidStringArbitrary, typeCheckFor<GenericReference<string[]>>(), false);
      testValues(invalidStringArbitrary, typeCheckFor<GenericReference<StringType>>(), false);
    });

    test('interface[]', () => {
      type StringPropertyObjectType = InterfaceWithPropertyOfType<string>[];

      const validObjectArbitrary = fc.array(
        fc.string().map<InterfaceWithPropertyOfType<string>>(property => ({ property })),
      );
      const invalidObjectArbitrary = fc
        .anything()
        .filter(value => !Array.isArray(value) || value.some(element => typeof element?.property !== 'string'));

      testValues(validObjectArbitrary, typeCheckFor<{ property: string }[]>());
      testValues(validObjectArbitrary, typeCheckFor<StringPropertyObjectType>());
      testValues(validObjectArbitrary, typeCheckFor<GenericReference<StringPropertyObjectType>>());
      testValues(invalidObjectArbitrary, typeCheckFor<{ property: string }[]>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<StringPropertyObjectType>(), false);
      testValues(invalidObjectArbitrary, typeCheckFor<GenericReference<StringPropertyObjectType>>(), false);
    });

    test('tuples', () => {
      type TupleType = [number, true, () => void, GenericReference<string>];

      const validTupleArbitrary = fc.tuple(fc.integer(), fc.constant(true), fc.func(fc.anything()), fc.string());
      const invalidTupleArbitrary = fc
        .anything()
        .filter(
          value =>
            !Array.isArray(value) ||
            typeof value[0] !== 'number' ||
            value[1] !== true ||
            typeof value[2] !== 'function' ||
            typeof value[3] !== 'string',
        );

      testValues(validTupleArbitrary, typeCheckFor<[number, true, () => void, GenericReference<string>]>());
      testValues(validTupleArbitrary, typeCheckFor<TupleType>());
      testValues(
        validTupleArbitrary,
        typeCheckFor<GenericReference<[number, true, () => void, GenericReference<string>]>>(),
      );
      testValues(validTupleArbitrary, typeCheckFor<GenericReference<TupleType>>());

      testValues(invalidTupleArbitrary, typeCheckFor<[number, true, () => void, GenericReference<string>]>(), false);
      testValues(invalidTupleArbitrary, typeCheckFor<TupleType>(), false);
      testValues(
        invalidTupleArbitrary,
        typeCheckFor<GenericReference<[number, true, () => void, GenericReference<string>]>>(),
        false,
      );
      testValues(invalidTupleArbitrary, typeCheckFor<GenericReference<TupleType>>(), false);
    });
  });

  describe('enums', () => {
    test('normal enums', () => {
      enum EnumWithAAndB {
        A,
        B,
      }

      enum EnumWithAAndBWithValues {
        A = 'a',
        B = 'b',
      }

      const validEnumWithAAndBArbitrary = fc.constantFrom(EnumWithAAndB.A, EnumWithAAndB.B);
      const invalidEnumWithAAndBArbitrary = fc
        .anything()
        .filter(value => value !== EnumWithAAndB.A && value !== EnumWithAAndB.B);
      const validEnumWithAAndBWithValuesArbitrary = fc.constantFrom(
        EnumWithAAndBWithValues.A,
        EnumWithAAndBWithValues.B,
      );
      const invalidEnumWithAAndBWithValuesArbitrary = fc
        .anything()
        .filter(value => value !== EnumWithAAndBWithValues.A && value !== EnumWithAAndBWithValues.B);

      testValues(validEnumWithAAndBArbitrary, typeCheckFor<EnumWithAAndB>());
      testValues(invalidEnumWithAAndBArbitrary, typeCheckFor<EnumWithAAndB>(), false);

      testValues(validEnumWithAAndBWithValuesArbitrary, typeCheckFor<EnumWithAAndBWithValues>());
      testValues(invalidEnumWithAAndBWithValuesArbitrary, typeCheckFor<EnumWithAAndBWithValues>(), false);
    });

    test('const enums', () => {
      const enum EnumWithAAndB {
        A,
        B,
      }

      const enum EnumWithAAndBWithValues {
        A = 'a',
        B = 'b',
      }

      const validEnumWithAAndBArbitrary = fc.constantFrom(EnumWithAAndB.A, EnumWithAAndB.B);
      const invalidEnumWithAAndBArbitrary = fc
        .anything()
        .filter(value => value !== EnumWithAAndB.A && value !== EnumWithAAndB.B);
      const validEnumWithAAndBWithValuesArbitrary = fc.constantFrom(
        EnumWithAAndBWithValues.A,
        EnumWithAAndBWithValues.B,
      );
      const invalidEnumWithAAndBWithValuesArbitrary = fc
        .anything()
        .filter(value => value !== EnumWithAAndBWithValues.A && value !== EnumWithAAndBWithValues.B);

      testValues(validEnumWithAAndBArbitrary, typeCheckFor<EnumWithAAndB>());
      testValues(invalidEnumWithAAndBArbitrary, typeCheckFor<EnumWithAAndB>(), false);

      testValues(validEnumWithAAndBWithValuesArbitrary, typeCheckFor<EnumWithAAndBWithValues>());
      testValues(invalidEnumWithAAndBWithValuesArbitrary, typeCheckFor<EnumWithAAndBWithValues>(), false);
    });
  });

  describe('classes', () => {
    test('globally accessible', () => {
      const validClassAArbitrary = fc.constantFrom(new A());
      const validClassASubclassArbitrary = fc.constantFrom(new ASubclass());
      const validClassBArbitrary = fc.constantFrom(new B());
      const invalidClassAArbitrary = fc.anything().filter(value => !(value instanceof A));
      const invalidClassASubclassArbitrary = fc.anything().filter(value => !(value instanceof ASubclass));
      const invalidClassBArbitrary = fc.anything().filter(value => !(value instanceof B));

      testValues(validClassAArbitrary, typeCheckFor<A>());
      testValues(validClassASubclassArbitrary, typeCheckFor<A>());
      testValues(validClassASubclassArbitrary, typeCheckFor<ASubclass>());
      testValues(validClassBArbitrary, typeCheckFor<B>());

      testValues(invalidClassAArbitrary, typeCheckFor<A>(), false);
      testValues(invalidClassASubclassArbitrary, typeCheckFor<A>(), false);
      testValues(invalidClassASubclassArbitrary, typeCheckFor<ASubclass>(), false);
      testValues(invalidClassBArbitrary, typeCheckFor<B>(), false);
    });

    test('local classes should not work', () => {
      class D {}
      const validClassDArbitrary = fc.constantFrom(new D());
      const invalidClassDArbitrary = fc.anything().filter(value => !(value instanceof D));

      expect(() => testValues(validClassDArbitrary, typeCheckFor<D>())).toThrow();
      expect(() => testValues(invalidClassDArbitrary, typeCheckFor<D>(), false)).toThrow();
    });
  });
});
