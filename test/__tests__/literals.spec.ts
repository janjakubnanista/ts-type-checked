import 'jest';

// @ts-ignore
import { FilterFunction, GenericReference, notALiteral, notAPrimitive, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('literals', () => {
  describe('singular', () => {
    test('string', () => {
      type TypeReference1 = 'a';

      const validArbitrary = fc.constantFrom('a');
      const invalidArbitrary = fc.anything().filter(notALiteral('a'));

      const checks: FilterFunction[] = [
        typeCheckFor<'a'>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<'a'>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<'a'>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<'a'>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('number', () => {
      type TypeReference1 = 6;

      const validArbitrary = fc.constantFrom(6);
      const invalidArbitrary = fc.anything().filter(notALiteral(6));

      const checks: FilterFunction[] = [
        typeCheckFor<6>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<6>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<6>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<6>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('bigint', () => {
      type TypeReference1 = 1n;

      const validArbitrary = fc.constantFrom(1n);
      const invalidArbitrary = fc.anything().filter(notALiteral(1n));

      const checks: FilterFunction[] = [
        typeCheckFor<1n>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<1n>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<1n>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<1n>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('true', () => {
      type TypeReference1 = true;

      const validArbitrary = fc.constantFrom(true, !0, !!1);
      const invalidArbitrary = fc.anything().filter(notALiteral(true));

      const checks: FilterFunction[] = [
        typeCheckFor<true>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<true>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<true>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<true>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('false', () => {
      type TypeReference1 = false;

      const validArbitrary = fc.constantFrom(false, !!0, !1);
      const invalidArbitrary = fc.anything().filter(notALiteral(false));

      const checks: FilterFunction[] = [
        typeCheckFor<false>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<false>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<false>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<false>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });
  });

  describe('plural', () => {
    test('primitive', () => {
      type TypeReference1 = 'a' | 6 | false | 7n;

      const validArbitrary = fc.constantFrom<TypeReference1>('a', 6, false, 7n);
      const invalidArbitrary = fc.anything().filter(notALiteral('a', 6, false, 7n));

      const checks: FilterFunction[] = [
        typeCheckFor<'a' | 6 | false | 7n>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<'a' | 6 | false | 7n>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<'a' | 6 | false | 7n>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<'a' | 6 | false | 7n>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('non-primitive', () => {
      type TypeReference1 = string[] | {} | (() => string[]);

      const validSpecialCases = fc.constantFrom(
        [],
        [6, true],
        new Object(),
        Object.create({}),
        {},
        Object.assign(() => true, { property: 'string' }),
      );
      const validArbitrary = fc.oneof(validSpecialCases, fc.array(fc.string()), fc.object(), fc.func(fc.anything()));
      const invalidSpecialCases = fc.constantFrom<unknown>(
        true,
        false,
        undefined,
        null,
        'string',
        7,
        1n,
        Symbol('hey'),
      );
      const invalidArbitrary = fc.oneof(
        invalidSpecialCases,
        fc.anything().filter(value => !notAPrimitive(value)),
      );

      const checks: FilterFunction[] = [
        typeCheckFor<string[] | {} | (() => string[])>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<GenericReference<string[] | {} | (() => string[])>>(),
        typeCheckFor<GenericReference<TypeReference1>>(),
        value => isA<string[] | {} | (() => string[])>(value),
        value => isA<TypeReference1>(value),
        value => isA<GenericReference<string[] | {} | (() => string[])>>(value),
        value => isA<GenericReference<TypeReference1>>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });
  });
});
