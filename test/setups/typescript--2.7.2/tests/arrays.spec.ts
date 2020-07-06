import 'jest';

import ts from 'typescript';

import {
  InterfaceWithPropertyOfType,
  assert,
  notALiteral,
  notAnArray,
  notAnEmptyArray,
  notOfType,
  numeric,
  primitive,
} from '../../../utils/utils.v2';

import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('arrays', () => {
  test('string[]', () => {
    type TypeReference1 = string[];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.array(fc.string());
    const invalidSpecialCases = fc.constantFrom<any[]>([6], ['string', true]);

    const invalidArbitrary = fc.oneof(
      invalidSpecialCases,
      fc.anything().filter(notAnArray),
      fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('literal[]', () => {
    type LiteralType = 'a' | 'b';
    type TypeReference1 = LiteralType[];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.array(fc.constantFrom<LiteralType>('a', 'b'));
    const invalidArbitrary = fc.oneof(
      fc.constantFrom<any[]>([6], ['string', true]),
      fc.anything().filter(notAnArray),
      fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('interface[]', () => {
    type TypeReference1 = InterfaceWithPropertyOfType<string>[];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.array(
      fc.record({
        property: fc.string(),
      }),
    );
    const invalidArbitrary = fc.oneof(
      fc.constantFrom({}, new Object(), [{}], [{ property: 'string' }, false], [[]]),
      fc.anything().filter(notAnArray),
      fc.array(primitive()).filter(notAnEmptyArray),
      fc
        .array(
          fc.record({
            property: fc.anything().filter(notOfType('string')),
          }),
        )
        .filter(notAnEmptyArray),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('tuple', () => {
    type TypeReference1 = [number, true, string];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.tuple(numeric(), fc.constant<true>(true), fc.string());
    const invalidArbitrary = fc.oneof(
      fc.anything().filter(notAnArray),
      fc.tuple(numeric(), fc.constant(true), fc.string(), fc.anything()),
      fc.tuple(fc.anything().filter(notOfType('number')), fc.constant(true), fc.string()),
      fc.tuple(numeric(), fc.anything().filter(notALiteral(true)), fc.string()),
      fc.tuple(numeric(), fc.constant(true), fc.anything().filter(notOfType('string'))),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
