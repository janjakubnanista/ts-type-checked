import 'jest';

// @ts-ignore
import { FilterFunction, aPrimitive, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('Map', () => {
  test('Map', () => {
    type TypeReference1 = Map<() => true, string>;

    const validArbitrary = fc.oneof(
      fc.constantFrom(new Map([[() => false, 'string']])),
      fc.array(fc.tuple(fc.func(fc.anything()), fc.string())).map(entries => new Map(entries)),
    );
    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>({}, new Map([['key', 'value']]), new Set(), new Date()),
      fc.anything().filter(aPrimitive),
    );
    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
