import 'jest';

import { assert, numeric, oneOf, primitive } from '../../../utils/utils.v2';

import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('Map', () => {
  test('Map', () => {
    type TypeReference1 = Map<number, string>;

    const validArbitrary: fc.Arbitrary<TypeReference1> = oneOf(
      fc.constantFrom(new Map([[6, 'string']])),
      fc.array(fc.tuple(numeric(), fc.string())).map((entries) => new Map(entries)),
    );
    const invalidArbitrary = oneOf(
      fc.constantFrom<any[]>({}, new Map([['key', 'value']]), new Set(), new Date()),
      primitive(),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
