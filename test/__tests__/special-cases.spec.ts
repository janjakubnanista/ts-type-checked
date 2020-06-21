import { assert, notALiteral } from './utils';
import fc from 'fast-check';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';

describe('special-cases', () => {
  const circularTypeError = /^Value that was passed to ts-type-checked contains a circular reference and cannot be checked$/;

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
    };

    const createLinkedList = (n: number, close: boolean): [TypeReference1, TypeReference1] => {
      const head: TypeReference1 = {} as TypeReference1;
      let tail: TypeReference1 = head;

      // First we create a linear linked list
      for (let i = 0; i < n; i++) {
        tail = tail.next = {} as TypeReference1;
      }

      // Then we close the cycle by pointing the last element to the head
      if (close) tail.next = head;

      return [head, tail];
    };

    test('same-type circular structure should throw an error', () => {
      const circularArbitrary = fc.integer(0, 100).map<TypeReference1>((n) => createLinkedList(n, true)[0]);

      // We check the valid arbitrary on a finer-grained level than the invalid one
      fc.assert(
        fc.property(circularArbitrary, (value) => {
          expect(() => typeCheckFor<TypeReference1>()(value)).toThrow(circularTypeError);
          expect(() => isA<TypeReference1>(value)).toThrow(circularTypeError);
        }),
      );
    });

    // The heap in the cycle breaker might need cleaning so the test should perform one
    // check with problematic object, then change its property while not changing the object reference
    // and call the check again
    test('recovering after same-type circular structure check', () => {
      const circularArbitrary = fc
        .integer(0, 50)
        .map<[TypeReference1, TypeReference1]>((n) => createLinkedList(n, true));

      // We check the valid arbitrary on a finer-grained level than the invalid one
      fc.assert(
        fc.property(circularArbitrary, ([head, tail]) => {
          expect(() => typeCheckFor<TypeReference1>()(head)).toThrow(circularTypeError);
          expect(() => isA<TypeReference1>(head)).toThrow(circularTypeError);

          head.next = undefined;
          expect(typeCheckFor<TypeReference1>()(head)).toBeTruthy();
          expect(isA<TypeReference1>(head)).toBeTruthy();

          head.next = tail;
          expect(() => typeCheckFor<TypeReference1>()(head)).toThrow(circularTypeError);
          expect(() => isA<TypeReference1>(head)).toThrow(circularTypeError);
        }),
      );
    });
  });

  describe('alternating-type circular structure', () => {
    type TypeReference1 = {
      next?: TypeReference2;
    };
    type TypeReference2 = {
      following?: TypeReference1;
    };

    const createLinkedList = (n: number, close: boolean): [TypeReference1, TypeReference2] => {
      const head: TypeReference1 = {} as TypeReference1;
      let tail: TypeReference1 = head;

      // First we create a linear linked list
      for (let i = 0; i < n; i++) {
        tail.next = {} as TypeReference2;
        tail = tail.next.following = {} as TypeReference1;
      }

      // Then we close the cycle by pointing the last element to the head
      if (close) {
        tail.next = {} as TypeReference2;
        tail.next.following = head;
      }

      return [head, tail.next!];
    };

    test('alternating-type circular structure should throw an error', () => {
      const circularArbitrary = fc.integer(0, 100).map<TypeReference1>((n) => createLinkedList(n, true)[0]);

      // We check the valid arbitrary on a finer-grained level than the invalid one
      fc.assert(
        fc.property(circularArbitrary, (value) => {
          expect(() => typeCheckFor<TypeReference1>()(value)).toThrow(circularTypeError);
          expect(() => isA<TypeReference1>(value)).toThrow(circularTypeError);

          expect(() => typeCheckFor<TypeReference2>()(value.next)).toThrow(circularTypeError);
          expect(() => isA<TypeReference2>(value.next)).toThrow(circularTypeError);
        }),
      );
    });

    // The heap in the cycle breaker might need cleaning so the test should perform one
    // check with problematic object, then change its property while not changing the object reference
    // and call the check again
    test('recovering after same-type circular structure check', () => {
      const circularArbitrary = fc
        .integer(0, 50)
        .map<[TypeReference1, TypeReference2]>((n) => createLinkedList(n, true));

      // We check the valid arbitrary on a finer-grained level than the invalid one
      fc.assert(
        fc.property(circularArbitrary, ([head, tail]) => {
          expect(() => typeCheckFor<TypeReference1>()(head)).toThrow(circularTypeError);
          expect(() => isA<TypeReference1>(head)).toThrow(circularTypeError);

          tail.following = undefined;
          expect(typeCheckFor<TypeReference1>()(head)).toBeTruthy();
          expect(isA<TypeReference1>(head)).toBeTruthy();

          tail.following = head;
          expect(() => typeCheckFor<TypeReference1>()(head)).toThrow(circularTypeError);
          expect(() => isA<TypeReference1>(head)).toThrow(circularTypeError);
        }),
      );
    });
  });
});
