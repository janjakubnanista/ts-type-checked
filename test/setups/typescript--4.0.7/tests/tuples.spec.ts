import 'jest';

import { assert, notNullOrUndefined, nullable, numeric, oneOf, primitive } from '../../../utils/utils.v2';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('Tuples', () => {
  test('Labelled tuple elements', () => {
    type TypeReference1 = [start: number, end: string];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.tuple(numeric(), fc.string());
    const invalidArbitrary = oneOf<unknown>(
      primitive(),
      nullable(),
      fc.constantFrom(['hey', NaN]),
      fc.tuple(fc.string(), fc.string())
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
