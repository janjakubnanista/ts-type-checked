import 'jest';

// @ts-ignore
import { FilterFunction, GenericReference, InterfaceWithPropertyOfType, notOfType, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('functions', () => {
  test('function', () => {
    type TypeReference1 = () => void;
    type TypeReference2 = () => string;
    type TypeReference3 = Function;

    const validArbitrary = fc.func(fc.anything());
    const invalidArbitrary = fc.anything().filter(notOfType('function'));

    const checks: FilterFunction[] = [
      typeCheckFor<() => void>(),
      typeCheckFor<() => string>(),
      typeCheckFor<Function>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      typeCheckFor<GenericReference<() => void>>(),
      typeCheckFor<GenericReference<() => string>>(),
      typeCheckFor<GenericReference<Function>>(),
      typeCheckFor<GenericReference<TypeReference1>>(),
      value => isA<() => void>(value),
      value => isA<() => string>(value),
      value => isA<Function>(value),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
      value => isA<TypeReference3>(value),
      value => isA<GenericReference<() => void>>(value),
      value => isA<GenericReference<() => string>>(value),
      value => isA<GenericReference<Function>>(value),
      value => isA<GenericReference<TypeReference1>>(value),
      value => isA<GenericReference<TypeReference2>>(value),
      value => isA<GenericReference<TypeReference3>>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('constructor type', () => {
    type TypeReference1 = new () => {};

    class A {}
    class B {
      constructor() {
        return {};
      }
    }

    const validArbitrary = fc.constantFrom<TypeReference1>(Object, A, B);
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function')));

    const checks: FilterFunction[] = [
      typeCheckFor<new () => {}>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<GenericReference<new () => {}>>(),
      typeCheckFor<GenericReference<TypeReference1>>(),
      value => isA<new () => {}>(value),
      value => isA<TypeReference1>(value),
      value => isA<GenericReference<new () => {}>>(value),
      value => isA<GenericReference<TypeReference1>>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('callable interface', () => {
    type TypeReference1 = {
      (): string;
      property: number;
    };
    type TypeReference2 = InterfaceWithPropertyOfType<number> & (() => string);
    type TypeReference3 = InterfaceWithPropertyOfType<number> & Function;

    const validArbitrary = fc
      .func(fc.anything())
      .chain(func => fc.integer().map(property => Object.assign(func, { property })));
    const invalidArbitrary = fc.oneof(
      fc.anything().filter(notOfType('function')),
      fc.func(fc.anything()).chain(func =>
        fc
          .anything()
          .filter(notOfType('number'))
          .map(property => Object.assign(func, { property })),
      ),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<{
        (): string;
        property: number;
      }>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      typeCheckFor<
        GenericReference<{
          (): string;
          property: number;
        }>
      >(),
      typeCheckFor<GenericReference<TypeReference1>>(),
      typeCheckFor<GenericReference<TypeReference2>>(),
      typeCheckFor<GenericReference<TypeReference3>>(),
      value =>
        isA<{
          (): string;
          property: number;
        }>(value),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
      value => isA<TypeReference3>(value),
      value =>
        isA<
          GenericReference<{
            (): string;
            property: number;
          }>
        >(value),
      value => isA<GenericReference<TypeReference1>>(value),
      value => isA<GenericReference<TypeReference2>>(value),
      value => isA<GenericReference<TypeReference3>>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
