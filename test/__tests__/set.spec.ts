import 'jest';

// @ts-ignore
import { FilterFunction, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('Set', () => {
  test('Set', () => {
    type TypeReference1 = Set<string | boolean>;

    const validSetArbitrary = fc.set(fc.oneof(fc.string(), fc.boolean())).map(values => new Set(values));
    const invalidSetArbitrary = fc
      .anything()
      .filter(
        value =>
          !(value instanceof Set) ||
          Array.from(value.values()).some(element => typeof element !== 'string' && typeof element !== 'boolean'),
      );
    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validSetArbitrary, checks, true);
    testTypeChecks(invalidSetArbitrary, checks, false);
  });
});
