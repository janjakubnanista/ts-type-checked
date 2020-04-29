import 'jest';

// @ts-ignore
import { FilterFunction, GenericReference, notALiteral, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('basics', () => {
  test('undefined', () => {
    type TypeReference1 = undefined;

    const validArbitrary = fc.constantFrom(undefined, void 0);
    const invalidArbitrary = fc.anything().filter(value => value !== undefined);

    const checks: FilterFunction[] = [
      typeCheckFor<undefined>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<GenericReference<undefined>>(),
      typeCheckFor<GenericReference<TypeReference1>>(),
      value => isA<undefined>(value),
      value => isA<TypeReference1>(value),
      value => isA<GenericReference<undefined>>(value),
      value => isA<GenericReference<TypeReference1>>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('any', () => {
    type TypeReference1 = any;

    const validArbitrary = fc.anything();

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
  });

  // This test is not super DRY
  test('literal', () => {
    type TypeReference1 = 'a' | 'b' | 'c' | 9 | false | true;
    const literalTypeValues: TypeReference1[] = ['a', 'b', 'c', 9, false, true];

    const validArbitrary = fc.constantFrom<TypeReference1>(...literalTypeValues);
    const invalidArbitrary = fc.anything().filter(notALiteral(...literalTypeValues));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
