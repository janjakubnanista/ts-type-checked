import 'jest';

import { assert, notAnArray, notAnEmptyArray, notOfType, numeric, oneOf, primitive } from '../../../utils/utils.v2';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('Tuples', () => {
  // test('With optional elements', () => {
  //   type TypeReference1 = [string, number, boolean?];

  //   const validArbitrary: fc.Arbitrary<TypeReference1> = oneOf<TypeReference1>(
  //     fc.tuple(fc.string(), numeric()),
  //     fc.tuple(fc.string(), numeric(), fc.boolean()),
  //   );
  //   const invalidArbitrary = oneOf<unknown>(
  //     primitive(),
  //     fc.anything().filter(notAnArray),
  //     fc.array(numeric()),
  //     fc.tuple(fc.string(), fc.string()),
  //     fc.tuple(numeric(), numeric()),
  //     fc.tuple(fc.string(), numeric(), fc.anything().filter(notOfType('boolean'))),
  //     fc.constantFrom(["string", "string"], [6, 6], ["string", 7, 7]),
  //   );

  //   assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  // });

  test('With rest elements at the beginning', () => {
    type TypeReference1 = [...boolean[], string];

    const validArbitrary: fc.Arbitrary<TypeReference1> = oneOf<TypeReference1>(
      fc.tuple(fc.string()),
      fc.array(fc.boolean()).chain((booleans) => fc.string().map((string) => [...booleans, string])),
    );
    const invalidArbitrary = oneOf<unknown>(
      primitive(),
      fc
        .array(fc.anything().filter(notOfType('boolean')).filter(notAnEmptyArray))
        .chain((values) => fc.string().map((string) => [...values, string])),
      fc.constantFrom([6, 'string']),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
