import 'jest';

// @ts-ignore
import { FilterFunction, GenericReference, notALiteral, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('enums', () => {
  describe('non-const', () => {
    test('without values', () => {
      enum Enum {
        A,
        B,
      }

      type TypeReference1 = Enum;

      const validArbitrary = fc.constantFrom(Enum.A, Enum.B);
      const invalidArbitrary = fc.anything().filter(notALiteral(Enum.A, Enum.B));

      const checks: FilterFunction[] = [
        typeCheckFor<Enum>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<Enum>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<Enum>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<Enum>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('with values', () => {
      enum Enum {
        A = 7,
        B = 'ole',
      }

      type TypeReference1 = Enum;

      const validArbitrary = fc.constantFrom(Enum.A, Enum.B);
      const invalidArbitrary = fc.anything().filter(notALiteral(Enum.A, Enum.B));

      const checks: FilterFunction[] = [
        typeCheckFor<Enum>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<Enum>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<Enum>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<Enum>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });
  });

  describe('const', () => {
    test('without values', () => {
      const enum Enum {
        A,
        B,
      }

      type TypeReference1 = Enum;

      const validArbitrary = fc.constantFrom(Enum.A, Enum.B);
      const invalidArbitrary = fc.anything().filter(notALiteral(Enum.A, Enum.B));

      const checks: FilterFunction[] = [
        typeCheckFor<Enum>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<Enum>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<Enum>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<Enum>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('with values', () => {
      const enum Enum {
        A = 7,
        B = 'ole',
      }

      type TypeReference1 = Enum;

      const validArbitrary = fc.constantFrom(Enum.A, Enum.B);
      const invalidArbitrary = fc.anything().filter(notALiteral(Enum.A, Enum.B));

      const checks: FilterFunction[] = [
        typeCheckFor<Enum>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<Enum>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<Enum>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<Enum>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });
  });
});
