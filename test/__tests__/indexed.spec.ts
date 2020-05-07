import 'jest';

import { FilterFunction, aPrimitive, notAnEmptyObject, notOfType, testTypeChecks } from './utils';
// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('indexed types', () => {
  test('Record<string, number>', () => {
    type TypeReference1 = Record<string, number>;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        {},
        new Object() as TypeReference1,
        (() => true) as any,
        { 6: 7, property: 12 },
        { [Symbol('value')]: 12 },
        Object.assign<object, Record<string, number>>(() => true, { age: 6 }),
      ),
      fc.dictionary(fc.string(), fc.oneof(fc.integer(), fc.float())),
    );

    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>(
        { property: 'string' },
        { [Symbol('value')]: 'string' },
        Object.assign(() => true, { property: 'string' }),
      ),
      fc.anything().filter(aPrimitive),
      fc.dictionary(fc.string(), fc.anything().filter(notOfType('number'))).filter(notAnEmptyObject),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('{ [key: string]: Function }', () => {
    type TypeReference1 = {
      [key: string]: Function;
    };

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        {},
        new Object() as TypeReference1,
        { 6: () => true, property: () => false },
        { [Symbol('value')]: parseInt },
        Object.assign<object, Record<string, Function>>(() => true, { age: isNaN }),
      ),
      fc.dictionary(fc.string(), fc.func(fc.anything())),
      fc.func(fc.anything()) as fc.Arbitrary<any>,
    );

    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>(
        { property: 'string' },
        { [Symbol('value')]: 'string' },
        Object.assign(() => true, { property: 'string' }),
      ),
      fc.anything().filter(aPrimitive),
      fc.dictionary(fc.string(), fc.anything().filter(notOfType('function'))).filter(notAnEmptyObject),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
