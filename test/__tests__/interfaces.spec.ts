import 'jest';

import {
  InterfaceWithDifferentPropertyOfType,
  InterfaceWithPropertiesOfTypes,
  InterfaceWithPropertyOfType,
  assert,
  notAnArray,
  notAnEmptyArray,
  notAnEmptyObject,
  notOfType,
  numeric,
  optionalOf,
  primitive,
} from './utils';

// @ts-ignore
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
      primitive(),
      invalidPropertyArbitrary.map((property) => Object.assign(() => true, { property })),
      fc.record({
        property: invalidPropertyArbitrary,
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
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

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
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

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
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

    assert(validPositiveArbitrary, invalidPositiveArbitrary, [
      typeCheckFor<PositiveTypeReference>(),
      (value) => isA<PositiveTypeReference>(value),
    ]);
    assert(validNegativeArbitrary, invalidNegativeArbitrary, [
      typeCheckFor<NegativeReference>(),
      (value) => isA<NegativeReference>(value),
    ]);
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
      primitive(),
      fc.record({
        property1: fc.anything().filter(notOfType('boolean')),
        property2: primitive(),
      }),
      fc.record({
        property1: fc.boolean(),
        property2: primitive(),
      }),
      fc.record({
        property1: fc.boolean(),
        property2: fc.record({
          property: fc.anything().filter(notOfType('string')),
        }),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('intersection', () => {
    type NumberPropertyObjectType = InterfaceWithPropertyOfType<number>;
    type StringDifferentPropertyObjectType = InterfaceWithDifferentPropertyOfType<string>;
    type TypeReference1 = NumberPropertyObjectType & StringDifferentPropertyObjectType;

    const validArbitrary = fc.record<TypeReference1>({
      property: numeric(),
      differentProperty: fc.string(),
    });
    const invalidArbitrary = fc.oneof(
      fc.constantFrom({}, { property: undefined }),
      primitive(),
      fc.record({
        property: fc.anything().filter(notOfType('number')),
        differentProperty: fc.string(),
      }),
      fc.record({
        property: numeric(),
        differentProperty: fc.anything().filter(notOfType('string')),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('callable interface', () => {
    type TypeReference1 = {
      (a: string): string;
      (a: boolean): number;
    };
    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.func(fc.anything()) as fc.Arbitrary<TypeReference1>,
    );
    const invalidArbitrary = fc.oneof(fc.anything().filter(notOfType('function')));
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('callable interface with additional properties', () => {
    type TypeReference1 = {
      (): string;
      apply: number;
      description: string;
    };
    const validArbitrary: fc.Arbitrary<TypeReference1> = fc
      .tuple(fc.func(fc.anything() as fc.Arbitrary<string>), numeric(), fc.string())
      .map(([object, apply, description]) => Object.assign(object, { apply, description }));
    const invalidArbitrary = fc.oneof(
      fc.func(fc.anything()),
      fc.anything().filter(notOfType('function')),
      fc
        .tuple(
          fc.func(fc.anything() as fc.Arbitrary<string>),
          fc.anything().filter(notOfType('number')),
          fc.anything().filter(notOfType('string')),
        )
        .map(([object, apply, description]) => Object.assign(object, { apply, description })),
    );
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('callable interface with string index type', () => {
    type TypeReference1 = {
      (a: string): string;
      [key: string]: number;
    };

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.dictionary(fc.string(), numeric()).map((record) => Object.assign(() => 'string', record)),
    );

    const invalidArbitrary = fc.oneof(
      fc.anything().filter(notOfType('function')),
      fc
        .dictionary(fc.string(), fc.anything().filter(notOfType('number')))
        .filter(notAnEmptyObject)
        .map((record) => Object.assign(() => 'string', record)),
    );
    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
