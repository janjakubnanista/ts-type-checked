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
  test('{}', () => {
    type TypeReference1 = {};

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom<TypeReference1>(
        {},
        [],
        ['string'],
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

  test('simple property', () => {
    interface TypeReference1 {
      property: string;
    }

    const validSpecialCases: fc.Arbitrary<TypeReference1> = fc.constantFrom({ property: '' });
    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      validSpecialCases,
      fc.string().map((property) => Object.assign(() => true, { property })),
      fc.record<TypeReference1>({
        property: fc.string(),
      }),
    );

    const invalidPropertyArbitrary = fc.anything().filter(notOfType('string'));
    const invalidSpecialCases = fc.constantFrom<unknown>({}, { a: false });
    const invalidArbitrary = fc.oneof(
      invalidSpecialCases,
      fc.anything().filter(aPrimitive),
      invalidPropertyArbitrary.map((property) => Object.assign(() => true, { property })),
      fc.record({
        property: invalidPropertyArbitrary,
      }),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('with Object methods', () => {
    interface TypeReference1 {
      toString: () => string;
    }

    const validSpecialCases: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>(
      {},
      new Object(),
      () => true,
      'string',
      6,
      6n,
      true,
      false,
      Symbol('symbol'),
    );
    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      validSpecialCases,
      fc.string(),
      fc.boolean(),
      fc.object(),
      fc.bigInt(),
      fc.func(fc.anything()),
      fc.object(),
    );

    const invalidArbitrary = fc.oneof(fc.constantFrom(null, undefined));

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('optional property', () => {
    interface TypeReference1 {
      property?: string;
    }

    const validSpecialCases: fc.Arbitrary<TypeReference1> = fc.constantFrom<TypeReference1>(
      {},
      new Object(),
      { property: undefined },
      { property: 'string' },
      0 as TypeReference1,
      false as TypeReference1,
      1n as TypeReference1,
      (() => true) as TypeReference1,
    );
    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      validSpecialCases,
      optionalOf(fc.string()).map((property) => Object.assign(() => true, { property })),
      fc.record({
        property: optionalOf(fc.string()),
      }),
    );

    const invalidArbitrary = fc.oneof(
      fc.constantFrom(null, undefined),
      fc.record({
        property: fc.anything().filter(notOfType('string', 'undefined')),
      }),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('recursion', () => {
    type RecursiveType = InterfaceWithPropertyOfType<RecursiveType | number>;

    const tree: fc.Memo<RecursiveType> = fc.memo(() => node());
    const node: fc.Memo<RecursiveType> = fc.memo((n) => {
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
      (value) => isA<ConditionalOfType<string[], true>>(value),
      (value) => isA<PositiveTypeReference>(value),
      (value) => isA<GenericReference<PositiveTypeReference>>(value),
      (value) => isA<GenericReference<ConditionalOfType<string[], true>>>(value),
    ];

    const negativeChecks: FilterFunction[] = [
      typeCheckFor<ConditionalOfType<string[], false>>(),
      typeCheckFor<NegativeReference>(),
      typeCheckFor<GenericReference<NegativeReference>>(),
      typeCheckFor<GenericReference<ConditionalOfType<string[], false>>>(),
      (value) => isA<ConditionalOfType<string[], false>>(value),
      (value) => isA<NegativeReference>(value),
      (value) => isA<GenericReference<NegativeReference>>(value),
      (value) => isA<GenericReference<ConditionalOfType<string[], false>>>(value),
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

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

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

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('callable', () => {
    type TypeReference1 = {
      (): string;
      property: number;
    };

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc
      .tuple(fc.func(fc.anything() as fc.Arbitrary<string>), fc.oneof(fc.integer(), fc.float()))
      .map(([object, property]) => Object.assign(object, { property }));

    const invalidArbitrary = fc.oneof(
      fc.anything().filter(notOfType('function')),
      fc
        .tuple(fc.func(fc.anything() as fc.Arbitrary<string>), fc.anything().filter(notOfType('number')))
        .map(([object, property]) => Object.assign(object, { property })),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
