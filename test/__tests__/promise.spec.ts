import 'jest';

// @ts-ignore
import { FilterFunction, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('Promise', () => {
  test('Promise type should not be checked', () => {
    type TypeReference1 = Promise<string>;

    const validArbitrary = fc.oneof(
      fc.record({
        then: fc.func(fc.anything()),
        catch: fc.func(fc.anything()),
      }),
      fc.anything().map(value => Promise.resolve(value)),
    );
    const invalidArbitrary = fc.anything();

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
