import 'jest';

import { isA, typeCheckFor } from 'ts-type-checked';
import { testValues } from '../utils';
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
});
