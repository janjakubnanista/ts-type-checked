import 'jest';

import { assertArbitrary } from '../../../utils/utils.v2';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('unknown', () => {
  test('unknown', () => {
    type TypeReference1 = unknown;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.anything();

    assertArbitrary(
      validArbitrary,
      [typeCheckFor<TypeReference1>(), (value: unknown) => isA<TypeReference1>(value)],
      true,
    );
  });
});
