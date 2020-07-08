import 'jest';

import { assert } from '../../../utils/utils.v2';

import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('Set', () => {
  test('Set', () => {
    type TypeReference1 = Set<string | boolean>;

    const validArbitrary = fc.set(fc.oneof(fc.string(), fc.boolean())).map((values) => new Set(values));
    const invalidArbitrary = fc
      .anything()
      .filter(
        (value) =>
          !(value instanceof Set) ||
          Array.from(value.values()).some((element) => typeof element !== 'string' && typeof element !== 'boolean'),
      );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
