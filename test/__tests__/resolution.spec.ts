import 'jest';

// @ts-ignore
import {
  ArrayReference,
  FilterFunction,
  GenericReference,
  InterfaceWithPropertyOfType,
  notAPrimitive,
  notAnArray,
  notAnEmptyArray,
  notOfType,
  primitive,
  testTypeChecks,
} from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('type resolution', () => {
  test('simple reference', () => {
    type TypeReference1 = string;
    type TypeReference2 = TypeReference1;

    const validArbitrary = fc.string();
    const invalidArbitrary = fc.anything().filter(notOfType('string'));

    const checks: FilterFunction[] = [
      typeCheckFor<string>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      value => isA<string>(value),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
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
      value => isA<string[]>(value),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
      value => isA<TypeReference3>(value),
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
      value => isA<string>(value),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
      value => isA<TypeReference3>(value),
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
      fc.anything().filter(value => notAPrimitive(value)),
      fc.tuple(fc.object(), fc.anything().filter(notOfType('number'))),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      typeCheckFor<TypeReference4>(),
      typeCheckFor<TypeReference5>(),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
      value => isA<TypeReference3>(value),
      value => isA<TypeReference4>(value),
      value => isA<TypeReference5>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  describe('boxed types', () => {
    test('string / String', () => {
      type TypeReference1 = string;
      type TypeReference2 = string;

      const validArbitrary = fc.string();
      const invalidArbitrary = fc.anything().filter(notOfType('string'));
      const checks: FilterFunction[] = [
        typeCheckFor<string>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<TypeReference2>(),
        value => isA<string>(value),
        value => isA<TypeReference1>(value),
        value => isA<TypeReference2>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('number / Number', () => {
      type TypeReference1 = number;
      type TypeReference2 = number;

      const validArbitrary = fc.oneof(fc.integer(), fc.float());
      const invalidArbitrary = fc.anything().filter(notOfType('number'));
      const checks: FilterFunction[] = [
        typeCheckFor<number>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<TypeReference2>(),
        value => isA<number>(value),
        value => isA<TypeReference1>(value),
        value => isA<TypeReference2>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('boolean / Boolean', () => {
      type TypeReference1 = boolean;
      type TypeReference2 = boolean;

      const validArbitrary = fc.boolean();
      const invalidArbitrary = fc.anything().filter(notOfType('boolean'));
      const checks: FilterFunction[] = [
        typeCheckFor<boolean>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<TypeReference2>(),
        value => isA<boolean>(value),
        value => isA<TypeReference1>(value),
        value => isA<TypeReference2>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('bigint / BigInt', () => {
      type TypeReference1 = bigint;
      type TypeReference2 = BigInt;

      const validArbitrary = fc.bigInt();
      const invalidArbitrary = fc.anything().filter(notOfType('bigint'));
      const checks: FilterFunction[] = [
        typeCheckFor<bigint>(),
        typeCheckFor<TypeReference1>(),
        typeCheckFor<TypeReference2>(),
        value => isA<bigint>(value),
        value => isA<TypeReference1>(value),
        value => isA<TypeReference2>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('object / Object / {}', () => {
      type TypeReference1 = object;
      type TypeReference2 = Record<string, any>;
      type TypeReference3 = {};

      const validArbitrary = fc.oneof(
        fc.constantFrom<TypeReference1 | TypeReference2 | TypeReference3>(
          {},
          new Object(),
          () => true,
          Object.assign(() => true, {}),
        ),
      );
      const invalidArbitrary = primitive();
      const checks: FilterFunction[] = [
        typeCheckFor<TypeReference1>(),
        typeCheckFor<TypeReference2>(),
        typeCheckFor<TypeReference3>(),
        value => isA<TypeReference1>(value),
        value => isA<TypeReference2>(value),
        value => isA<TypeReference3>(value),
      ];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });

    test('Function', () => {
      type TypeReference1 = Function;

      const validArbitrary = fc.func(fc.anything());
      const invalidArbitrary = fc.anything().filter(notOfType('function'));
      const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

      testTypeChecks(validArbitrary, checks, true);
      testTypeChecks(invalidArbitrary, checks, false);
    });
  });
});
