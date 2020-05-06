import 'jest';

import {
  ArrayReference,
  FilterFunction,
  GenericReference,
  InterfaceWithPropertyOfType,
  notAPrimitive,
  notAnArray,
  notAnEmptyArray,
  notOfType,
  testTypeChecks,
} from './utils';
// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('type resolution', () => {
  class A {
    aProperty = 'Andrea Bocelli';
  }

  class B {
    bProperty = 'Britney Spears';
  }

  const instantiable = fc.constantFrom<new () => any>(Object, Array, Number, Boolean, Function, Date, Error, A, B);

  test('simple reference', () => {
    type TypeReference1 = string;
    type TypeReference2 = TypeReference1;

    const validArbitrary = fc.string();
    const invalidArbitrary = fc.anything().filter(notOfType('string'));

    const checks: FilterFunction[] = [
      typeCheckFor<string>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      (value) => isA<string>(value),
      (value) => isA<TypeReference1>(value),
      (value) => isA<TypeReference2>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('array reference', () => {
    type TypeReference1 = string[];
    type TypeReference2 = TypeReference1;
    type TypeReference3 = ArrayReference<string>;

    const validArbitrary = fc.array(fc.string());
    const invalidArbitrary = fc.oneof(
      fc.anything().filter(notAnArray),
      fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<string[]>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      (value) => isA<string[]>(value),
      (value) => isA<TypeReference1>(value),
      (value) => isA<TypeReference2>(value),
      (value) => isA<TypeReference3>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('generic reference', () => {
    type TypeReference1 = GenericReference<string>;
    type TypeReference2 = GenericReference<TypeReference1>;
    type TypeReference3 = GenericReference<GenericReference<TypeReference2>>;

    const validArbitrary = fc.string();
    const invalidArbitrary = fc.anything().filter(notOfType('string'));

    const checks: FilterFunction[] = [
      typeCheckFor<string>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      (value) => isA<string>(value),
      (value) => isA<TypeReference1>(value),
      (value) => isA<TypeReference2>(value),
      (value) => isA<TypeReference3>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('reference in interface property type', () => {
    type TypeReference1 = InterfaceWithPropertyOfType<number>;
    type TypeReference2 = {
      property: number;
    };
    type TypeReference3 = TypeReference1;
    interface TypeReference4 {
      property: number;
    }
    type TypeReference5 = TypeReference4;

    const validArbitrary = fc.record<
      TypeReference1 & TypeReference2 & TypeReference3 & TypeReference4 & TypeReference5
    >({
      property: fc.oneof(fc.integer(), fc.float()),
    });
    const invalidArbitrary = fc.oneof(
      fc.anything().filter((value) => notAPrimitive(value)),
      fc.tuple(fc.object(), fc.anything().filter(notOfType('number'))),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      typeCheckFor<TypeReference4>(),
      typeCheckFor<TypeReference5>(),
      (value) => isA<TypeReference1>(value),
      (value) => isA<TypeReference2>(value),
      (value) => isA<TypeReference3>(value),
      (value) => isA<TypeReference4>(value),
      (value) => isA<TypeReference5>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('signature of a function should not be checked', () => {
    type TypeReference1 = (param: boolean) => string;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.func(fc.anything() as fc.Arbitrary<any>);

    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>({}, 'string', false),
      fc.anything().filter(notOfType('function')),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('constructor types', () => {
    type TypeReference1 = new () => {};

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(instantiable);
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function')));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('interfaces with constructors', () => {
    type TypeReference1 = {
      new (): {};
    };

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(instantiable);
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function')));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('constructor types in unions', () => {
    type TypeReference1 = string | (new () => {});

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(instantiable, fc.string());
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function', 'string')));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
