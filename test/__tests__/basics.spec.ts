import 'jest';

import { assert, assertArbitrary, notALiteral, notOfType, numeric, primitive } from './utils';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('basics', () => {
  test('undefined', () => {
    type TypeReference1 = undefined;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom(undefined, void 0);
    const invalidArbitrary = fc.anything().filter((value) => value !== undefined);

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('any', () => {
    type TypeReference1 = any;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.anything();

    assertArbitrary(validArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)], true);
  });

  test('string', () => {
    type TypeReference1 = string;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.string();
    const invalidArbitrary = fc.anything().filter(notOfType('string'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('String', () => {
    type TypeReference1 = String; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.string();
    const invalidArbitrary = fc.anything().filter(notOfType('string'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('number', () => {
    type TypeReference1 = number;

    const validArbitrary: fc.Arbitrary<TypeReference1> = numeric();
    const invalidArbitrary = fc.anything().filter(notOfType('number'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Number', () => {
    type TypeReference1 = Number; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = numeric();
    const invalidArbitrary = fc.anything().filter(notOfType('number'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('boolean', () => {
    type TypeReference1 = boolean;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.boolean();
    const invalidArbitrary = fc.anything().filter(notOfType('boolean'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Boolean', () => {
    type TypeReference1 = Boolean; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.boolean();
    const invalidArbitrary = fc.anything().filter(notOfType('boolean'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Boolean', () => {
    type TypeReference1 = Boolean; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.boolean();
    const invalidArbitrary = fc.anything().filter(notOfType('boolean'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

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

  test('object', () => {
    type TypeReference1 = object;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom<TypeReference1>(
        {},
        new Object(),
        () => true,
        Object.assign(() => true, {}),
        new Map(),
        new Set(),
      ),
      fc.object(),
      fc.array(fc.anything()),
      fc.func(fc.anything()),
    );
    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>(true, false, undefined, null, 6, 'string', Symbol('a'), 1n),
      primitive(),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Object', () => {
    type TypeReference1 = Object; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom<TypeReference1>(
        {},
        new Object(),
        new String(),
        () => true,
        Object.assign(() => true, {}),
        Symbol('a'),
      ),
      fc.array(fc.anything()),
      fc.date(),
      numeric(),
      fc.string(),
      fc.bigInt(),
      fc.boolean(),
      fc.object(),
      fc.func(fc.anything()),
    );
    const invalidArbitrary = fc.constantFrom(null, undefined);

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Date', () => {
    type TypeReference1 = Date;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.date();
    const invalidArbitrary = fc.anything().filter((value) => !(value instanceof Date));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Function', () => {
    type TypeReference1 = Function;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.func(fc.anything());
    const invalidArbitrary = fc.anything().filter(notOfType('function'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Function literal', () => {
    type TypeReference1 = () => number;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.func(fc.anything() as fc.Arbitrary<any>);
    const invalidArbitrary = fc.anything().filter(notOfType('function'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  // This test is not super DRY
  test('literal', () => {
    type TypeReference1 = 'a' | 'b' | 'c' | 9 | false | true;
    const literalTypeValues: TypeReference1[] = ['a', 'b', 'c', 9, false, true];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>(...literalTypeValues);
    const invalidArbitrary = fc.anything().filter(notALiteral(...literalTypeValues));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Error', () => {
    type TypeReference1 = Error;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.string().map((message) => new Error(message));
    const invalidArbitrary = fc.oneof(primitive(), fc.constantFrom({}));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
