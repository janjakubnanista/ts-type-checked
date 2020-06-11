import 'jest';

import {
  InterfaceWithPropertyOfType,
  assert,
  notALiteral,
  notAnArray,
  notAnEmptyArray,
  notOfType,
  numeric,
  primitive,
} from './utils';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('generic types', () => {
  test('isA should work generic types with defined entry points', () => {
    const isSomething = <T>(value: unknown): value is T => isA<T>(value);

    type TypeReference1 = string;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.string();
    const invalidArbitrary = fc.anything().filter(notOfType('string'));

    assert(validArbitrary, invalidArbitrary, [(value) => isSomething<TypeReference1>(value)]);
  });
});
