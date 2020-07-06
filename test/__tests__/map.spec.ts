import 'jest';

import { assert, numeric, primitive } from '../utils/utils.v2';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('Map', () => {
  test('Map', () => {
    type TypeReference1 = Map<number, string>;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(new Map([[6, 'string']])),
      fc.array(fc.tuple(numeric(), fc.string())).map((entries) => new Map(entries)),
    );
    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>({}, new Map([['key', 'value']]), new Set(), new Date()),
      primitive(),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
