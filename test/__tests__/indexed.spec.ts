import 'jest';

// @ts-ignore
import { FilterFunction, notAnEmptyObject, notAnObject, recordOf, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('indexed types', () => {
  test('string records', () => {
    type TypeReference1 = Record<string, boolean>;
    type TypeReference2 = {
      [key: string]: boolean;
    };
    interface TypeReference3 {
      [key: string]: boolean;
    }

    const validSpecialCases = fc.constantFrom({}, new Object(), { 6: true }, { [Symbol('value')]: false });
    const validArbitrary = fc.oneof(
      validSpecialCases,
      fc.boolean().map((property) => Object.assign(() => 'string', { property })),
      recordOf(fc.boolean()),
    );

    const invalidArbitrary = fc.oneof(
      fc.anything().filter(notAnObject),
      recordOf(fc.integer()).filter(notAnEmptyObject),
      recordOf(fc.string()).filter(notAnEmptyObject),
      recordOf(fc.object()).filter(notAnEmptyObject),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<Record<string, boolean>>(),
      typeCheckFor<{ [key: string]: boolean }>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      (value) => isA<Record<string, boolean>>(value),
      (value) => isA<{ [key: string]: boolean }>(value),
      (value) => isA<TypeReference1>(value),
      (value) => isA<TypeReference2>(value),
      (value) => isA<TypeReference3>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
