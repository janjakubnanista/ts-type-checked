import 'jest';

import { assert, notALiteral, notAnEmptyArray, notOfType, primitive } from '../utils/utils.v2';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('literals', () => {
  describe('singular', () => {
    test('string', () => {
      type TypeReference1 = 'a';

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>('a');
      const invalidArbitrary = fc.anything().filter(notALiteral('a'));

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });

    test('number', () => {
      type TypeReference1 = 6;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>(6);
      const invalidArbitrary = fc.anything().filter(notALiteral(6));

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });

    test('bigint', () => {
      type TypeReference1 = 1n;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>(1n);
      const invalidArbitrary = fc.anything().filter(notALiteral(1n));

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });

    test('true', () => {
      type TypeReference1 = true;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>(true, !0, !!1);
      const invalidArbitrary = fc.anything().filter(notALiteral(true));

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });

    test('false', () => {
      type TypeReference1 = false;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>(false, !!0, !1);
      const invalidArbitrary = fc.anything().filter(notALiteral(false));

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });
  });

  describe('plural', () => {
    test('primitive', () => {
      type TypeReference1 = 'a' | 6 | false | 7n;

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>('a', 6, false, 7n);
      const invalidArbitrary = fc.anything().filter(notALiteral('a', 6, false, 7n));

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });

    test('non-primitive', () => {
      type TypeReference1 = string[] | { property: string };

      const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
        fc.constantFrom<TypeReference1>(
          [],
          ['string'],
          { property: 'string' },
          Object.assign(() => true, { property: 'string' }),
        ),
        fc.array(fc.string()),
        fc.record({
          property: fc.string(),
        }),
      );
      const invalidArbitrary = fc.oneof(
        fc.constantFrom<unknown[]>([6], ['string', true]),
        primitive(),
        fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
        fc.record({
          property: fc.anything().filter(notOfType('string')),
        }),
      );

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });
  });
});
