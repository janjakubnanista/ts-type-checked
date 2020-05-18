import { assert, notALiteral } from './utils';
import fc from 'fast-check';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';

describe('special-cases', () => {
  test('never in conditional', () => {
    type ConditionalPropertyNames<P> = {
      [K in keyof P]: P[K] extends number ? K : never;
    }[keyof P];
    type Interface = {
      numeric: number;
      string: string;
    };
    type TypeReference1 = ConditionalPropertyNames<Interface>;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(fc.constantFrom<TypeReference1>('numeric'));
    const invalidArbitrary: fc.Arbitrary<unknown> = fc.oneof(
      fc.constantFrom('string'),
      fc.anything().filter(notALiteral('numeric')),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
