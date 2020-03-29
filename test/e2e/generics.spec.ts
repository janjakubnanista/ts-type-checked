import 'jest';

import { isA } from '../..';
import { nullableArbitrary, testValues } from './utils';
import fc from 'fast-check';

describe('generics', () => {
  interface InterfaceWithGenerics<T> {
    prop: T;
    method: () => T;
  }

  interface InterfaceWithoutGenerics {
    prop: boolean;
  }

  type InterfaceWithIndex = {
    [t: number]: boolean;
    ole: boolean;
  };

  const interfaceWithGenericsArbitrary = <T>(propArbitrary: fc.Arbitrary<T>): fc.Arbitrary<InterfaceWithGenerics<T>> =>
    fc.record({
      prop: propArbitrary,
      method: fc.func(propArbitrary),
    });

  describe('simple', () => {
    it('should allow string keyed Record', () => {
      const isAStringRecord = (value: unknown) => isA<Record<string, boolean>>(value);
      testValues(
        fc.object({
          key: fc.string(),
          values: [fc.boolean()],
        }),
        isAStringRecord,
      );

      testValues(
        fc.object({
          key: fc.string(),
          values: [fc.integer(), fc.string(), fc.object(), nullableArbitrary],
        }),
        isAStringRecord,
        false,
      );
    });

    // it('should allow fully defined generics', () => {
    //   // const isAStringArrayButNotBrackets = (value: unknown) => isA<Array<string>>(value);
    //   const isALiteralRecord = (value: unknown) => isA<Record<'a' | 'b' | 'c', boolean>>(value);
    //   const isANumberRecord = (value: unknown) => isA<Record<number, boolean>>(value);

    //   // const isAStringOrNumberRecord = (value: unknown) => isA<Record<string | number, boolean>>(value);
    //   // const isAnInterfaceWithIndex = (value: unknown) => isA<InterfaceWithIndex>(value);
    //   // const isAnInterface = (value: unknown) => isA<InterfaceWithoutGenerics>(value);

    //   const isANumber = (value: unknown) => isA<number>(value);
    //   const isAString = (value: unknown) => isA<string>(value);
    //   const isASomething = (value: unknown) => isA<'something'>(value);
    //   const isAFalse = (value: unknown) => isA<false>(value);
    //   const isAStringArray = (value: unknown) => isA<string[]>(value);
    //   const isASomethingArray = (value: unknown) => isA<'something'[]>(value);

    //   testValues(fc.string(), isAString);
    //   testValues(fc.integer(), isANumber);
    //   testValues(fc.constant('something'), isASomething);
    //   testValues(fc.constant(false), isAFalse);
    //   testValues(fc.array(fc.string()), isAStringArray);
    //   // testValues(fc.array(fc.string()), isAStringArrayButNotBrackets);
    //   testValues(fc.array(fc.constant('something')), isASomethingArray);

    //   // // const isAMapOfStringToObject = (value: unknown) => isA<Map<string, object>>(value);

    //   const isAGenericWithString = (value: unknown) => isA<InterfaceWithGenerics<string>>(value);
    //   const isAGenericWithNumber = (value: unknown) => isA<InterfaceWithGenerics<number>>(value);
    //   const isAGenericWithObject = (value: unknown) => isA<InterfaceWithGenerics<{}>>(value);

    //   testValues(interfaceWithGenericsArbitrary(fc.string()), isAGenericWithString);
    //   testValues(interfaceWithGenericsArbitrary(fc.integer()), isAGenericWithNumber);
    //   testValues(interfaceWithGenericsArbitrary(fc.object()), isAGenericWithObject);
    // });
  });
});
