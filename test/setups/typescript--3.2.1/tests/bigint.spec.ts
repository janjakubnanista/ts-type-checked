import 'jest';

import { assert, notOfType } from '../../../utils/utils.v3';

import { isA, typeCheckFor } from 'ts-type-checked';
import { notALiteral, nullable } from '../../../utils/utils.v2';
import fc from 'fast-check';

describe('bigint', () => {
  test('bigint', () => {
    type TypeReference1 = bigint;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.bigInt();
    const invalidArbitrary = fc.anything().filter(notOfType('bigint'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('BigInt', () => {
    type TypeReference1 = BigInt; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.bigInt();
    const invalidArbitrary = fc.anything().filter(notOfType('bigint'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('bigint literal', () => {
    type TypeReference1 = 1n;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1[]>(1n);
    const invalidArbitrary = fc.anything().filter(notALiteral(1n));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('bigint literal in union', () => {
    type TypeReference1 = 'a' | 6 | false | 7n;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1[]>('a', 6, false, 7n);
    const invalidArbitrary = fc.anything().filter(notALiteral('a', 6, false, 7n));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('{}', () => {
    type TypeReference1 = {};

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(fc.constantFrom<TypeReference1[]>(1n), fc.bigInt());
    const invalidArbitrary = nullable();

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('with Object methods', () => {
    interface TypeReference1 {
      toString: () => string;
    }

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(fc.constantFrom<TypeReference1[]>(6, 6n), fc.bigInt());

    const invalidArbitrary = fc.oneof(nullable());

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
