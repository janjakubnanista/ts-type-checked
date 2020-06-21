import { assert, notALiteral, notOfType, numeric, primitive } from './utils';
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

  describe('same-type circular structure', () => {
    type TypeReference1 = {
      next?: TypeReference1;
      property: string;
    };

    const typeReferenceArbitrary = fc.record<TypeReference1>({
      property: fc.string(),
    });

    const circularListArbitrary: fc.Arbitrary<[TypeReference1, TypeReference1]> = fc.integer(1, 100).chain((length) =>
      fc.array(typeReferenceArbitrary, 1, length).map((array) => {
        const head = array[0];
        const tail = array[array.length - 1];

        array.forEach((node, index) => {
          node.next = array[(index + 1) % array.length];
        });

        return [head, tail];
      }),
    );

    test('same-type valid circular structure', () => {
      const validArbitrary = circularListArbitrary.map<TypeReference1>(([head]) => head);
      const invalidArbitrary = fc.oneof(
        primitive(),
        fc.date(),
        fc.func(fc.anything()),
        fc.object(),
        // The original list with invalid property
        fc.tuple(circularListArbitrary, fc.anything().filter(notOfType('string'))).map(([[head, tail], property]) => {
          tail.property = property as string;

          return head;
        }),
      );

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });
  });

  describe('alternating-type circular structure', () => {
    type TypeReference1 = {
      next?: TypeReference2;
      property1: string;
    };
    type TypeReference2 = {
      next?: TypeReference1;
      property2: number;
    };

    const typeReferenceArbitrary = fc.record<TypeReference1 & TypeReference2>({
      property1: fc.string(),
      property2: numeric(),
    });

    const circularListArbitrary: fc.Arbitrary<[TypeReference1, TypeReference1]> = fc.integer(1, 100).chain((length) =>
      fc.array(typeReferenceArbitrary, 1, length).map((array) => {
        const head = array[0];
        const tail = array[array.length - 1];

        array.forEach((node, index) => {
          node.next = array[(index + 1) % array.length];
        });

        return [head, tail];
      }),
    );

    test('alternating-type valid circular structure', () => {
      const validArbitrary = circularListArbitrary.map<TypeReference1>(([head]) => head);
      const invalidArbitrary = fc.oneof(
        primitive(),
        fc.date(),
        fc.func(fc.anything()),
        fc.object(),
        // The original list with invalid property1
        fc.tuple(circularListArbitrary, fc.anything().filter(notOfType('string'))).map(([[head], property1]) => {
          head.property1 = property1 as string;

          return head;
        }),
        // The original list with invalid property2
        fc.tuple(circularListArbitrary, fc.anything().filter(notOfType('number'))).map(([[head], property2]) => {
          head.next!.property2 = property2 as number;

          return head;
        }),
      );

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });
  });
});
