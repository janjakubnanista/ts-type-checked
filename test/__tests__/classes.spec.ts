import 'jest';

import { assert, notALiteral, notNullOrUndefined, notOfType, numeric, primitive } from '../utils/utils.v2';
// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('classes', () => {
  test('public properties', () => {
    class TypeReference1 {
      constructor(public property: string) {}
    }

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        new TypeReference1('string'),
        { property: 'string' },
        Object.assign(() => true, { property: 'string' }),
      ),
      fc.string().map((value) => new TypeReference1(value)),
      fc.record({
        property: fc.string(),
      }),
    );
    const invalidArbitrary = fc.oneof(
      primitive(),
      fc.record({
        property: fc.anything().filter(notOfType('string')),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('public methods', () => {
    class TypeReference1 {
      method(): string {
        return 'value';
      }
    }

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        new TypeReference1(),
        { method: () => 'value' },
        Object.assign(() => true, { method: () => 'value' }),
      ),
      fc.record({
        method: fc.func(fc.anything() as fc.Arbitrary<any>),
      }),
    );
    const invalidArbitrary = fc.oneof(
      primitive(),
      fc.record({
        method: fc.anything().filter(notOfType('function')),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('public async methods', () => {
    class TypeReference1 {
      async method() {
        return 'value';
      }
    }

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        new TypeReference1(),
        { method: () => Promise.resolve('value') },
        Object.assign(() => true, { method: () => Promise.resolve('value') }),
      ),
      fc.record({
        method: fc.func(fc.anything() as fc.Arbitrary<any>),
      }),
    );
    const invalidArbitrary = fc.oneof(
      primitive(),
      fc.record({
        method: fc.anything().filter(notOfType('function')),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('generic properties', () => {
    class TypeReference1<T> {
      constructor(public property: T) {}
    }

    const validArbitrary: fc.Arbitrary<TypeReference1<number>> = fc.oneof(
      fc.constantFrom(
        new TypeReference1(1),
        { property: 7 },
        Object.assign(() => true, { property: NaN }),
      ),
      fc.record({
        property: numeric(),
      }),
    );
    const invalidArbitrary = fc.oneof(
      primitive(),
      fc.record({
        property: fc.anything().filter(notOfType('number')),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [
      typeCheckFor<TypeReference1<number>>(),
      (value) => isA<TypeReference1<number>>(value),
    ]);
  });

  test('public getters', () => {
    class TypeReference1 {
      get property1() {
        return null;
      }

      public get property2(): string {
        return '';
      }
    }

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(new TypeReference1()),
      fc.record({
        property1: fc.constant(null),
        property2: fc.string(),
      }),
    );

    const invalidArbitrary = fc.oneof(
      primitive(),
      fc.constantFrom(
        {},
        { property1: null },
        {
          get property1() {
            return 'string';
          },
          property2: 'string',
        },
      ),
      fc.record({
        property1: fc.anything().filter(notALiteral(null)),
        property2: fc.string(),
      }),
      fc.record({
        property1: fc.constant(null),
        property2: fc.anything().filter(notOfType('string')),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('property initializers', () => {
    class TypeReference1 {
      property = 'value';
    }

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(
        new TypeReference1(),
        { property: 'string' },
        Object.assign(() => true, { property: 'value' }),
      ),
      fc.record({
        property: fc.string(),
      }),
    );
    const invalidArbitrary = fc.oneof(
      primitive(),
      fc.record({
        property: fc.anything().filter(notOfType('string')),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('private properties', () => {
    class TypeReference1 {
      private property = '';
      private anotherProperty: number;

      constructor(private privateProperty: string, anotherProperty = 1) {
        this.anotherProperty = anotherProperty;
      }

      private privateMethod(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
      private privateMethodWithInitializer = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

      private get propertyWithGetter() {
        return null;
      }
    }

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(new TypeReference1('string'), new TypeReference1('string', 7)),
      fc.tuple(fc.string(), numeric()).map(([a, b]) => new TypeReference1(a, b)),

      // Empty object should be valid since TypeReference1 has no public properties
      fc.anything().filter(notNullOrUndefined) as fc.Arbitrary<TypeReference1>,
    );

    const invalidArbitrary = fc.oneof(fc.constantFrom(null, undefined));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('protected properties', () => {
    class TypeReference1 {
      protected property = '';
      protected anotherProperty: number;

      constructor(protected protectedProperty: string, anotherProperty = 1) {
        this.anotherProperty = anotherProperty;
      }

      protected protectedMethod(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
      protected protectedMethodWithInitializer = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

      protected get propertyWithGetter() {
        return null;
      }
    }

    const validArbitrary: fc.Arbitrary<TypeReference1> = fc.oneof(
      fc.constantFrom(new TypeReference1('string'), new TypeReference1('string', 7)),
      fc.tuple(fc.string(), numeric()).map(([a, b]) => new TypeReference1(a, b)),

      // Empty object should be valid since TypeReference1 has no public properties
      fc.anything().filter(notNullOrUndefined) as fc.Arbitrary<TypeReference1>,
    );

    // Any non-null thing should be valid since it has no properties
    const invalidArbitrary = fc.oneof(fc.constantFrom(null, undefined));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
