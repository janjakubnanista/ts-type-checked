import 'jest';

// @ts-ignore
import { FilterFunction, aPrimitive, notALiteral, notAnEmptyArray, notOfType, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('literals', () => {
  describe('singular', () => {
    test('string', () => {
      type TypeReference1 = 'a';

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom('a');
      const invalidArbitrary = fc.anything().filter(notALiteral('a'));

      const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('number', () => {
      type TypeReference1 = 6;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom(6);
      const invalidArbitrary = fc.anything().filter(notALiteral(6));

      const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('bigint', () => {
      type TypeReference1 = 1n;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom(1n);
      const invalidArbitrary = fc.anything().filter(notALiteral(1n));

      const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('true', () => {
      type TypeReference1 = true;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom(true, !0, !!1);
      const invalidArbitrary = fc.anything().filter(notALiteral(true));

      const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('false', () => {
      type TypeReference1 = false;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom(false, !!0, !1);
      const invalidArbitrary = fc.anything().filter(notALiteral(false));

      const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });
  });

  describe('plural', () => {
    test('primitive', () => {
      type TypeReference1 = 'a' | 6 | false | 7n;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>('a', 6, false, 7n);
      const invalidArbitrary = fc.anything().filter(notALiteral('a', 6, false, 7n));

      const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('non-primitive', () => {
      type TypeReference1 = string[] | { property: string };

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
        fc.constantFrom<TypeReference1>(
          [],
          ['string'],
          { property: 'string' },
          Object.assign(() => true, { property: 'string' }),
        ),
        fc.array(fc.string()),
        fc.record({
          property: fc.string(),
        }),
      );
      const invalidArbitrary = fc.oneof(
        fc.constantFrom([6], ['string', true]),
        fc.anything().filter(aPrimitive),
        fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
        fc.record({
          property: fc.anything().filter(notOfType('string')),
        }),
      );

      const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });
  });
});
