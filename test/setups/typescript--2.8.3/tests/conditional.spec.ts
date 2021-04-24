import 'jest';

import { assert, notALiteral, notAnArray, notAnEmptyArray, notOfType } from '../../../utils/utils.v2';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('conditional types', () => {
  test('conditional types', () => {
    type ConditionalOfType<T, C> = C extends true ? T : undefined;
    type PositiveTypeReference = ConditionalOfType<string[], true>;
    type NegativeReference = ConditionalOfType<string[], false>;

    const validPositiveArbitrary = fc.array(fc.string());
    const invalidPositiveSpecialCases = fc.constantFrom(['string', 7]);
    const invalidPositiveArbitrary = fc.oneof(
      invalidPositiveSpecialCases,
      fc.anything().filter(notAnArray),
      fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
    );

    const validNegativeArbitrary = fc.constantFrom(undefined, void 0);
    const invalidNegativeArbitrary = fc.anything().filter(notOfType('undefined'));

    assert(validPositiveArbitrary, invalidPositiveArbitrary, [
      typeCheckFor<PositiveTypeReference>(),
      (value: any) => isA<PositiveTypeReference>(value),
    ]);
    assert(validNegativeArbitrary, invalidNegativeArbitrary, [
      typeCheckFor<NegativeReference>(),
      (value: any) => isA<NegativeReference>(value),
    ]);
  });

  test('never in conditional', () => {
    type ConditionalPropertyNames<P> = {
      [K in keyof P]: P[K] extends number ? K : never;
    }[keyof P];
    type Interface = {
      numeric: number;
      string: string;
    };
    type TypeReference1 = ConditionalPropertyNames<Interface>;
    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(fc.constantFrom<TypeReference1[]>('numeric'));
    const invalidArbitrary: fc.Arbitrary<any> = fc.oneof(
      fc.constantFrom('string'),
      fc.anything().filter(notALiteral('numeric')),
    );
    assert(validArbitrary, invalidArbitrary, [
      typeCheckFor<TypeReference1>(),
      (value: any) => isA<TypeReference1>(value),
    ]);
  });
});
