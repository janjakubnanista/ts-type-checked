import 'jest';

// @ts-ignore
import { FilterFunction, notAPrimitive, notOfType, testTypeChecks } from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

class A {
  aProperty = 'Andrea Bocelli';
}

class B {
  bProperty = 'Britney Spears';
}

const instantiable = fc.constantFrom<unknown>(Object, Array, Number, Boolean, Function, Date, Error, A, B);

describe('classes', () => {
  test('generic', () => {
    class TestedType<T> {
      propertyWithInitializer = 'Something';
      genericProperty: T;

      voidMethod(): void {
        return undefined;
      }
      stringMethod(): string {
        return 'A string';
      }
      async asyncMethod() {
        return 'A string';
      }

      constructor(genericProperty: T) {
        this.genericProperty = genericProperty;
      }
    }

    const validTypeArbitrary = <T>(propertyArbitrary: fc.Arbitrary<T>) =>
      propertyArbitrary.map(genericProperty => new TestedType(genericProperty));

    const validStringTypeArbitrary = validTypeArbitrary(fc.string());
    const invalidStringTypeArbitrary = fc.oneof(
      fc.anything().filter(value => !notAPrimitive(value)),
      validTypeArbitrary(fc.anything().filter(notOfType('string'))),
    );

    const validObjectTypeArbitrary = validTypeArbitrary(fc.object());
    const invalidObjectTypeArbitrary = fc.oneof(
      fc.anything().filter(value => !notAPrimitive(value)),
      validTypeArbitrary(fc.anything().filter(value => !notAPrimitive(value))),
    );

    const validSelfReferencingTypeArbitrary = validTypeArbitrary(validTypeArbitrary(fc.string()));
    const invalidSelfReferencingTypeArbitrary = fc.oneof(
      invalidStringTypeArbitrary,
      invalidObjectTypeArbitrary,
      validTypeArbitrary(invalidStringTypeArbitrary),
    );

    const commonChecks: FilterFunction[] = [
      typeCheckFor<TestedType<any>>(),
      typeCheckFor<TestedType<unknown>>(),
      value => isA<TestedType<any>>(value),
      value => isA<TestedType<unknown>>(value),
    ];

    const stringChecks: FilterFunction[] = [
      typeCheckFor<TestedType<string>>(),
      value => isA<TestedType<string>>(value),
    ];

    const objectChecks: FilterFunction[] = [typeCheckFor<TestedType<{}>>(), value => isA<TestedType<{}>>(value)];

    const selfReferencingChecks: FilterFunction[] = [
      typeCheckFor<TestedType<TestedType<string>>>(),
      value => isA<TestedType<TestedType<string>>>(value),
    ];

    testTypeChecks(validStringTypeArbitrary, commonChecks, true);
    testTypeChecks(validStringTypeArbitrary, stringChecks, true);
    testTypeChecks(invalidStringTypeArbitrary, stringChecks, false);

    testTypeChecks(validObjectTypeArbitrary, commonChecks, true);
    testTypeChecks(validObjectTypeArbitrary, objectChecks, true);
    testTypeChecks(invalidObjectTypeArbitrary, objectChecks, false);

    testTypeChecks(validSelfReferencingTypeArbitrary, commonChecks, true);
    testTypeChecks(validSelfReferencingTypeArbitrary, selfReferencingChecks, true);
    testTypeChecks(invalidSelfReferencingTypeArbitrary, selfReferencingChecks, false);
  });

  test('interfaces with constructors', () => {
    type TypeReference1 = {
      new (): Record<string, any>;
    };

    const validArbitrary = fc.oneof(instantiable);
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function')));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('constructor types', () => {
    type TypeReference1 = new () => {};

    const validArbitrary = fc.oneof(instantiable);
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function')));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('constructor types in unions', () => {
    type Instantiated = {};
    type ConstructorType = new () => Instantiated;
    type TypeReference1 = string | ConstructorType;

    const validSpecialCases = fc.constantFrom<TypeReference1>(Object, A, B, Array, Date, String, Boolean, Number);
    const validArbitrary = fc.oneof(fc.string(), validSpecialCases);
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function', 'string')));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Date', () => {
    type TypeReference1 = Date;

    const validArbitrary = fc.date();
    const invalidArbitrary = fc.anything().filter(value => !(value instanceof Date));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
