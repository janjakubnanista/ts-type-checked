import 'jest';

import { assert, notALiteral, notAnEmptyObject, notNumeric, notOfType, numeric, primitive } from './utils';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('indexed types', () => {
  test('Record<string, number>', () => {
    type TypeReference1 = Record<string, number>;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        {},
        new Object() as TypeReference1,
        (() => true) as any,
        { 6: 7, property: 12 },
        { [Symbol('value')]: 12 },
        { [Symbol('value')]: 'invalid string' },
        Object.assign<object, Record<string, number>>(() => true, { age: 6 }),
      ),
      fc.dictionary(fc.string(), numeric()),
    );

    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>(
        { property: 'string' },
        Object.assign(() => true, { property: 'string' }),
      ),
      primitive(),
      fc.dictionary(fc.string(), fc.anything().filter(notOfType('number'))).filter(notAnEmptyObject),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Record<number, number>', () => {
    type TypeReference1 = Record<number, number>;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        {},
        new Object() as TypeReference1,
        (() => true) as any,
        { property: 'string' },
        { 6: 7, property: 12 },
        { [Symbol('value')]: 12 },
        { [Symbol('value')]: 'invalid string' },
        Object.assign<object, Record<number, number>>(() => true, { 1: 6 }),
      ),
      fc.dictionary(numeric().map(String), numeric()),
    );

    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>(
        { 1: 'string' },
        Object.assign(() => true, { 3: 'string' }),
      ),
      primitive(),
      fc.dictionary(numeric().map(String), fc.anything().filter(notOfType('number'))).filter(notAnEmptyObject),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('{ [key: string]: number }', () => {
    type TypeReference1 = {
      [key: string]: number;
    };

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        {},
        { [Symbol('value')]: 'string' } as any,
        { [Symbol('value')]: parseInt },
        new Object() as TypeReference1,
        { 6: 7, property: 7654e1 },
        Object.assign<object, Record<string, number>>(() => true, { 1: 32.123 }),
        Object.assign<object, Record<string, number>>(() => true, { property: 9 }),
      ),
      fc.dictionary(fc.string(), numeric()),
      fc.dictionary(numeric().map(String), numeric()),
    );

    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>(
        { property: 'string' },
        Object.assign(() => true, { property: 'string' }),
      ),
      primitive(),
      fc.dictionary(fc.string(), fc.anything().filter(notOfType('number'))).filter(notAnEmptyObject),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('{ [key: number]: number }', () => {
    type TypeReference1 = {
      [key: number]: number;
    };

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        {},
        { [Symbol('value')]: 'string' } as any,
        { [Symbol('value')]: parseInt },
        new Object() as TypeReference1,
        { 6: 1, property: () => false },
        { 6: 2344, property: 'string' },
        Object.assign<object, Record<number, number>>(() => true, { 6: 1 }),
        Object.assign<object, Record<string, string>>(() => true, { property: 'string' }),
      ),
      fc.dictionary(numeric().map(String), numeric()),
      fc.dictionary(fc.string().filter(notNumeric), fc.anything()),
    );

    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>(
        { 6: 'string' },
        Object.assign(() => true, { 7: 'string' }),
      ),
      primitive(),
      fc.dictionary(numeric().map(String), fc.anything().filter(notOfType('number'))).filter(notAnEmptyObject),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('{ [key: number]: "literal", [key: string]: string }', () => {
    type TypeReference1 = {
      [key: number]: 'literal';
      [key: string]: string;
    };

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        {},
        { [Symbol('value')]: 'string' } as any,
        { [Symbol('value')]: parseInt },
        new Object() as TypeReference1,
        { 6: 'literal', property: 'string' },
        Object.assign<object, Record<number, 'literal'>>(() => true, { 6: 'literal' }),
      ),
      fc.dictionary(numeric().map(String), fc.constant('literal')),
      fc.dictionary(fc.string().filter(notNumeric), fc.string()),
    );

    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>(
        { 6: 'string' },
        { 6: 'literal', property: () => false },
        Object.assign(() => true, { 7: 'string' }),
      ),
      primitive(),
      fc.dictionary(numeric().map(String), fc.anything().filter(notALiteral('literal'))).filter(notAnEmptyObject),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
