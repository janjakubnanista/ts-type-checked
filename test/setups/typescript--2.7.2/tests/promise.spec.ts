import 'jest';

import { assert } from '../../../utils/utils.v2';

import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('Promise', () => {
  test('Promise resolution type should not be checked', () => {
    type TypeReference1 = Promise<string>;

    const validArbitrary = fc.oneof(fc.anything().map((value) => Promise.resolve(value)));
    const invalidArbitrary = fc.anything();

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
