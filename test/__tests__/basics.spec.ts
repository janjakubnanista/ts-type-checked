import 'jest';

// @ts-ignore
import { FilterFunction, aPrimitive, notALiteral, notOfType, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('basics', () => {
  test('undefined', () => {
    type TypeReference1 = undefined;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom(undefined, void 0);
    const invalidArbitrary = fc.anything().filter((value) => value !== undefined);

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('any', () => {
    type TypeReference1 = any;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.anything();

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
  });

  test('string', () => {
    type TypeReference1 = string;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.string();
    const invalidArbitrary = fc.anything().filter(notOfType('string'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('String', () => {
    type TypeReference1 = String; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.string();
    const invalidArbitrary = fc.anything().filter(notOfType('string'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('number', () => {
    type TypeReference1 = number;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(fc.integer(), fc.float());
    const invalidArbitrary = fc.anything().filter(notOfType('number'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Number', () => {
    type TypeReference1 = Number; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(fc.integer(), fc.float());
    const invalidArbitrary = fc.anything().filter(notOfType('number'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('boolean', () => {
    type TypeReference1 = boolean;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.boolean();
    const invalidArbitrary = fc.anything().filter(notOfType('boolean'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Boolean', () => {
    type TypeReference1 = Boolean; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.boolean();
    const invalidArbitrary = fc.anything().filter(notOfType('boolean'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Boolean', () => {
    type TypeReference1 = Boolean; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.boolean();
    const invalidArbitrary = fc.anything().filter(notOfType('boolean'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('bigint', () => {
    type TypeReference1 = bigint;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.bigInt();
    const invalidArbitrary = fc.anything().filter(notOfType('bigint'));
    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('BigInt', () => {
    type TypeReference1 = BigInt; // eslint-disable-line @typescript-eslint/ban-types

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.bigInt();
    const invalidArbitrary = fc.anything().filter(notOfType('bigint'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
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
      fc.anything().filter(aPrimitive),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
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
      fc.integer(),
      fc.string(),
      fc.bigInt(),
      fc.boolean(),
      fc.object(),
      fc.func(fc.anything()),
    );
    const invalidArbitrary = fc.constantFrom(null, undefined);

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Date', () => {
    type TypeReference1 = Date;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.date();
    const invalidArbitrary = fc.anything().filter((value) => !(value instanceof Date));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Function', () => {
    type TypeReference1 = Function;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.func(fc.anything());
    const invalidArbitrary = fc.anything().filter(notOfType('function'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Function literal', () => {
    type TypeReference1 = () => number;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.func(fc.anything() as fc.Arbitrary<any>);
    const invalidArbitrary = fc.anything().filter(notOfType('function'));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  // This test is not super DRY
  test('literal', () => {
    type TypeReference1 = 'a' | 'b' | 'c' | 9 | false | true;
    const literalTypeValues: TypeReference1[] = ['a', 'b', 'c', 9, false, true];

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>(...literalTypeValues);
    const invalidArbitrary = fc.anything().filter(notALiteral(...literalTypeValues));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Error', () => {
    type TypeReference1 = Error;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.string().map((message) => new Error(message));
    const invalidArbitrary = fc.oneof(fc.anything().filter(aPrimitive), fc.constantFrom({}));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
