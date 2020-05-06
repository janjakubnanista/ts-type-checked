import 'jest';

// @ts-ignore
import {
  FilterFunction,
  InterfaceWithPropertyOfType,
  aPrimitive,
  notALiteral,
  notAnArray,
  notAnEmptyArray,
  notOfType,
  testTypeChecks,
} from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('arrays', () => {
  test('string[]', () => {
    type TypeReference1 = string[];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.array(fc.string());
    const invalidSpecialCases = fc.constantFrom([6], ['string', true]);

    const invalidArbitrary = fc.oneof(
      invalidSpecialCases,
      fc.anything().filter(notAnArray),
      fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('literal[]', () => {
    type LiteralType = 'a' | 'b';
    type TypeReference1 = LiteralType[];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.array(fc.constantFrom('a', 'b'));
    const invalidArbitrary = fc.oneof(
      fc.constantFrom([6], ['string', true]),
      fc.anything().filter(notAnArray),
      fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('interface[]', () => {
    type TypeReference1 = InterfaceWithPropertyOfType<string>[];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.array(
      fc.record({
        property: fc.string(),
      }),
    );
    const invalidArbitrary = fc.oneof(
      fc.constantFrom({}, new Object(), [{}], [{ property: 'string' }, false], [[]]),
      fc.anything().filter(notAnArray),
      fc.array(fc.anything().filter(aPrimitive)).filter(notAnEmptyArray),
      fc
        .array(
          fc.record({
            property: fc.anything().filter(notOfType('string')),
          }),
        )
        .filter(notAnEmptyArray),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('tuple', () => {
    type TypeReference1 = [number, true, string];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.tuple(fc.integer(), fc.constant(true), fc.string());
    const invalidArbitrary = fc.oneof(
      fc.anything().filter(notAnArray),
      fc.tuple(fc.integer(), fc.constant(true), fc.string(), fc.anything()),
      fc.tuple(fc.anything().filter(notOfType('number')), fc.constant(true), fc.string()),
      fc.tuple(fc.integer(), fc.anything().filter(notALiteral(true)), fc.string()),
      fc.tuple(fc.integer(), fc.constant(true), fc.anything().filter(notOfType('string'))),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
