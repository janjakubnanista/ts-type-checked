import 'jest';

// @ts-ignore
import { FilterFunction, notALiteral, notAnArray, notAnEmptyArray, notOfType, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('arrays', () => {
  test('array', () => {
    type TypeReference1 = string[];
    type TypeReference2 = ReadonlyArray<string>;
    type TypeReference3 = Array<string>;

    const validArbitrary = fc.array(fc.string());
    const invalidSpecialCases = fc.constantFrom([6], ['string', true]);
    const invalidArbitrary = fc.oneof(
      invalidSpecialCases,
      fc.anything().filter(notAnArray),
      fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
      value => isA<TypeReference3>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('tuples', () => {
    type TypeReference1 = [number, true, string];

    const validArbitrary = fc.tuple(fc.integer(), fc.constant(true), fc.string());
    const invalidArbitrary = fc.oneof(
      fc.anything().filter(notAnArray),
      fc.tuple(fc.integer(), fc.constant(true), fc.string(), fc.anything()),
      fc.tuple(fc.anything().filter(notOfType('number')), fc.constant(true), fc.string()),
      fc.tuple(fc.integer(), fc.anything().filter(notALiteral(true)), fc.string()),
      fc.tuple(fc.integer(), fc.constant(true), fc.anything().filter(notOfType('string'))),
    );

    const value: any = [];
    if (isA<TypeReference1>(value)) {
      const a = value[0];
      const b = value[1];
      const c = value[2];
    }

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
