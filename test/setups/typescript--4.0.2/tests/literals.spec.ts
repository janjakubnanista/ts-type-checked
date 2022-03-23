import 'jest';

import { assert, oneOf } from '../../../utils/utils.v2';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('literals', () => {
  test('false', () => {
    const validArbitrary: fc.Arbitrary<false> = oneOf(fc.constantFrom(false));
    const invalidArbitrary = fc.anything().filter((value) => value !== false);

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<false>(), (value) => isA<false>(value)]);
  });

  test('true', () => {
    const validArbitrary: fc.Arbitrary<true> = oneOf(fc.constantFrom(true));
    const invalidArbitrary = fc.anything().filter((value) => value !== true);

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<true>(), (value) => isA<true>(value)]);
  });

  test('false (aliased)', () => {
    type TypeReference1 = false;

    const validArbitrary: fc.Arbitrary<TypeReference1> = oneOf(fc.constantFrom(false));
    const invalidArbitrary = fc.anything().filter((value) => value !== false);

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('true (aliased)', () => {
    type TypeReference1 = true;

    const validArbitrary: fc.Arbitrary<TypeReference1> = oneOf(fc.constantFrom(true));
    const invalidArbitrary = fc.anything().filter((value) => value !== true);

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
