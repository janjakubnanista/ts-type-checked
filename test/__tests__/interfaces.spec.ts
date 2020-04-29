import 'jest';

// @ts-ignore
import {
  FilterFunction,
  GenericReference,
  InterfaceWithDifferentPropertyOfType,
  InterfaceWithPropertiesOfTypes,
  InterfaceWithPropertyOfType,
  aPrimitive,
  notAnArray,
  notAnEmptyArray,
  notAnObject,
  notOfType,
  optionalOf,
  testTypeChecks,
} from './utils';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('interface types', () => {
  test('primitive property', () => {
    type PropertyType =
      | number
      | number
      | string
      | string
      | boolean
      | boolean
      | bigint
      | BigInt
      | object
      | Record<string, any>;
    type TypeReference1 = InterfaceWithPropertyOfType<PropertyType>;
    type TypeReference2 = {
      property: PropertyType;
    };
    interface TypeReference3 {
      property: PropertyType;
    }

    const validPropertyArbitrary = fc.oneof(
      fc.integer(),
      fc.float(),
      fc.string(),
      fc.bigInt(),
      fc.boolean(),
      fc.object(),
      fc.func(fc.anything()),
    );
    const validSpecialCases = fc.constantFrom({ property: () => false });
    const validArbitrary = fc.oneof(
      validSpecialCases,
      validPropertyArbitrary.map(property => Object.assign(() => true, { property })),
      fc.record<TypeReference1 & TypeReference2 & TypeReference3>({
        property: validPropertyArbitrary,
      }),
    );

    const invalidPropertyArbitrary = fc.anything().filter(notOfType('number', 'string', 'boolean', 'bigint', 'object'));
    const invalidSpecialCases = fc.constantFrom<unknown>({}, { a: false }, { property: null }, { property: undefined });
    const invalidArbitrary = fc.oneof(
      invalidSpecialCases,
      fc.anything().filter(notAnObject),
      invalidPropertyArbitrary.map(property => Object.assign(() => true, { property })),
      fc.record({
        property: invalidPropertyArbitrary,
      }),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<{ property: PropertyType }>(),
      typeCheckFor<InterfaceWithPropertyOfType<PropertyType>>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      value => isA<{ property: PropertyType }>(value),
      value => isA<InterfaceWithPropertyOfType<PropertyType>>(value),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
      value => isA<TypeReference3>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('optional property', () => {
    type PropertyType = object;
    type TypeReference1 = InterfaceWithPropertyOfType<PropertyType | undefined>;
    type TypeReference2 = {
      property: PropertyType | undefined;
    };
    interface TypeReference3 {
      property?: object;
    }

    const validSpecialCases = fc.constantFrom({}, new Object());
    const validArbitrary = fc.oneof(
      validSpecialCases,
      fc.object().map(property => Object.assign(() => true, { property })),
      fc.record({
        property: optionalOf(fc.object()),
      }),
    );

    const invalidArbitrary = fc.oneof(
      fc.anything().filter(notAnObject),
      fc.record({
        property: fc.anything().filter(notOfType('object', 'undefined')),
      }),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<{ property: PropertyType | undefined }>(),
      typeCheckFor<InterfaceWithPropertyOfType<PropertyType | undefined>>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      value => isA<{ property: PropertyType | undefined }>(value),
      value => isA<InterfaceWithPropertyOfType<PropertyType | undefined>>(value),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
      value => isA<TypeReference3>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('return type of a function property should not be checked ', () => {
    type TypeReference1 = InterfaceWithPropertyOfType<Function>;
    type TypeReference2 = {
      property: Function;
    };
    interface TypeReference3 {
      property: () => string;
    }

    interface TypeReference4 {
      property: () => string;
    }
    interface TypeReference5 {
      property: GenericReference<Function>;
    }
    interface TypeReference6 {
      property: GenericReference<() => string>;
    }

    const validArbitrary = fc.record({
      property: fc.func(fc.anything()),
    });

    const invalidSpecialCases = fc.constantFrom<unknown>({}, { a: false }, { property: 'number' });
    const invalidArbitrary = fc.oneof(
      invalidSpecialCases,
      fc.anything().filter(notAnObject),
      fc.record({
        property: fc.anything().filter(notOfType('function')),
      }),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<{ property: Function }>(),
      typeCheckFor<{ property: () => string }>(),
      typeCheckFor<InterfaceWithPropertyOfType<Function>>(),
      typeCheckFor<InterfaceWithPropertyOfType<() => string>>(),
      typeCheckFor<TypeReference1>(),
      typeCheckFor<TypeReference2>(),
      typeCheckFor<TypeReference3>(),
      typeCheckFor<TypeReference4>(),
      typeCheckFor<TypeReference5>(),
      typeCheckFor<TypeReference6>(),
      value => isA<{ property: Function }>(value),
      value => isA<{ property: () => string }>(value),
      value => isA<InterfaceWithPropertyOfType<Function>>(value),
      value => isA<InterfaceWithPropertyOfType<() => string>>(value),
      value => isA<TypeReference1>(value),
      value => isA<TypeReference2>(value),
      value => isA<TypeReference3>(value),
      value => isA<TypeReference4>(value),
      value => isA<TypeReference5>(value),
      value => isA<TypeReference6>(value),
    ];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('recursion', () => {
    type RecursiveType = InterfaceWithPropertyOfType<RecursiveType | number>;

    const tree: fc.Memo<RecursiveType> = fc.memo(() => node());
    const node: fc.Memo<RecursiveType> = fc.memo(n => {
      if (n <= 1)
        return fc.record<RecursiveType>({
          property: fc.oneof(fc.integer(), fc.float()),
        });

      return fc.record<RecursiveType>({
        property: tree(),
      });
    });

    const validObjectArbitrary = tree();

    const invalidSpecialCases = fc.constantFrom({}, { property: 'number' }, { property: undefined });
    const invalidObjectArbitrary = fc.oneof(
      invalidSpecialCases,
      fc.anything().filter(notAnObject),
      fc.record({
        property: fc.record({
          property: fc.anything().filter(notOfType('number', 'object')),
        }),
      }),
    );

    const checks: FilterFunction[] = [
      typeCheckFor<RecursiveType>(),
      typeCheckFor<GenericReference<RecursiveType>>(),
      typeCheckFor<RecursiveType>(),
      typeCheckFor<GenericReference<RecursiveType>>(),
    ];

    testTypeChecks(validObjectArbitrary, checks, true);
    testTypeChecks(invalidObjectArbitrary, checks, false);
  });

  test('conditional types', () => {
    type ConditionalOfType<T, C> = C extends true ? T : undefined;
    type PositiveTypeReference = ConditionalOfType<string[], true>;
    type NegativeReference = ConditionalOfType<string[], false>;

    const validPositiveArbitrary = fc.array(fc.string());
    const invalidPositiveSpecialCases = fc.constantFrom(['string', 7]);
    const invalidPositiveArbitrary = fc.oneof(
      invalidPositiveSpecialCases,
      fc.anything().filter(notAnArray),
      fc.array(fc.anything().filter(notOfType('string'))).filter(notAnEmptyArray),
    );

    const validNegativeArbitrary = fc.constantFrom(undefined, void 0);
    const invalidNegativeArbitrary = fc.anything().filter(notOfType('undefined'));

    const positiveChecks: FilterFunction[] = [
      typeCheckFor<ConditionalOfType<string[], true>>(),
      typeCheckFor<PositiveTypeReference>(),
      typeCheckFor<GenericReference<PositiveTypeReference>>(),
      typeCheckFor<GenericReference<ConditionalOfType<string[], true>>>(),
      value => isA<ConditionalOfType<string[], true>>(value),
      value => isA<PositiveTypeReference>(value),
      value => isA<GenericReference<PositiveTypeReference>>(value),
      value => isA<GenericReference<ConditionalOfType<string[], true>>>(value),
    ];

    const negativeChecks: FilterFunction[] = [
      typeCheckFor<ConditionalOfType<string[], false>>(),
      typeCheckFor<NegativeReference>(),
      typeCheckFor<GenericReference<NegativeReference>>(),
      typeCheckFor<GenericReference<ConditionalOfType<string[], false>>>(),
      value => isA<ConditionalOfType<string[], false>>(value),
      value => isA<NegativeReference>(value),
      value => isA<GenericReference<NegativeReference>>(value),
      value => isA<GenericReference<ConditionalOfType<string[], false>>>(value),
    ];

    testTypeChecks(validPositiveArbitrary, positiveChecks, true);
    testTypeChecks(invalidPositiveArbitrary, positiveChecks, false);

    testTypeChecks(validNegativeArbitrary, negativeChecks, true);
    testTypeChecks(invalidNegativeArbitrary, negativeChecks, false);
  });

  test('multiple properties', () => {
    type Property1 = boolean;
    type Property2 = InterfaceWithPropertyOfType<string>;
    type TypeReference1 = InterfaceWithPropertiesOfTypes<Property1, Property2>;

    const validArbitrary = fc.record<TypeReference1>({
      property1: fc.boolean(),
      property2: fc.record({
        property: fc.string(),
      }),
    });
    const invalidArbitrary = fc.oneof(
      fc.anything().filter(aPrimitive),
      fc.record({
        property1: fc.anything().filter(notOfType('boolean')),
        property2: fc.anything().filter(aPrimitive),
      }),
      fc.record({
        property1: fc.boolean(),
        property2: fc.anything().filter(aPrimitive),
      }),
      fc.record({
        property1: fc.boolean(),
        property2: fc.record({
          property: fc.anything().filter(notOfType('string')),
        }),
      }),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('intersection', () => {
    type NumberPropertyObjectType = InterfaceWithPropertyOfType<number>;
    type StringDifferentPropertyObjectType = InterfaceWithDifferentPropertyOfType<string>;
    type TypeReference1 = NumberPropertyObjectType & StringDifferentPropertyObjectType;

    const validArbitrary = fc.record<TypeReference1>({
      property: fc.integer(),
      differentProperty: fc.string(),
    });
    const invalidArbitrary = fc.oneof(
      fc.constantFrom({}, { property: undefined }),
      fc.anything().filter(aPrimitive),
      fc.record({
        property: fc.anything().filter(notOfType('number')),
        differentProperty: fc.string(),
      }),
      fc.record({
        property: fc.integer(),
        differentProperty: fc.anything().filter(notOfType('string')),
      }),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), value => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
