import 'jest';

import {
  ArrayReference,
  GenericReference,
  InterfaceWithPropertyOfType,
  assert,
  notAnArray,
  notAnEmptyArray,
  notOfType,
  numeric,
  primitive,
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

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference2>(), (value) => isA<TypeReference2>(value)]);
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

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference2>(), (value) => isA<TypeReference2>(value)]);
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference3>(), (value) => isA<TypeReference3>(value)]);
  });

  test('generic reference', () => {
    type TypeReference1 = GenericReference<string>;
    type TypeReference2 = GenericReference<TypeReference1>;
    type TypeReference3 = GenericReference<GenericReference<TypeReference2>>;

    const validArbitrary = fc.string();
    const invalidArbitrary = fc.anything().filter(notOfType('string'));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference2>(), (value) => isA<TypeReference2>(value)]);
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference3>(), (value) => isA<TypeReference3>(value)]);
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

    const validArbitrary = fc.record<TypeReference1 & TypeReference2 & TypeReference3 & TypeReference4>({
      property: numeric(),
    });
    const invalidArbitrary = fc.oneof(
      fc.constantFrom({}, { property: 'string' }),
      primitive(),
      fc.record({
        property: fc.anything().filter(notOfType('number')),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference2>(), (value) => isA<TypeReference2>(value)]);
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference3>(), (value) => isA<TypeReference3>(value)]);
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference4>(), (value) => isA<TypeReference4>(value)]);
  });

  test('signature of a function should not be checked', () => {
    type TypeReference1 = (param: boolean) => string;

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.func(fc.anything() as fc.Arbitrary<any>);
    const invalidArbitrary = fc.oneof(
      fc.constantFrom<unknown>({}, 'string', false),
      fc.anything().filter(notOfType('function')),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('constructor types', () => {
    type TypeReference1 = new () => {};

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(instantiable);
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function')));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('interfaces with constructors', () => {
    type TypeReference1 = {
      new (): {};
    };

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(instantiable);
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function')));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('constructor types in unions', () => {
    type TypeReference1 = string | (new () => {});

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(instantiable, fc.string());
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function', 'string')));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
