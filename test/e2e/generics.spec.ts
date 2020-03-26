import 'jest';

import { isA } from '../..';
import { testValues } from './utils';
import fc from 'fast-check';

describe('generics', () => {
  interface InterfaceWithGenerics<T> {
    prop: T;
    method: () => T;
  }

  describe('simple', () => {
    it('should allow fully defined generics', () => {
      const isANumber = (value: unknown) => isA<number>(value);
      const isAString = (value: unknown) => isA<string>(value);
      const isASomething = (value: unknown) => isA<'something'>(value);
      const isASomething2 = (value: unknown) => isA<'something'>(value);
      const isAFalse = (value: unknown) => isA<false>(value);

      testValues(fc.string(), isAString);
      testValues(fc.integer(), isANumber);
      // const isASomething = (value: unknown) => isA<'something'>(value);
      // // const isAMapOfStringToObject = (value: unknown) => isA<Map<string, object>>(value);
      // const isAGenericWithString = (value: unknown) => isA<InterfaceWithGenerics<string>>(value);
      // const isAGenericWithNumber = (value: unknown) => isA<InterfaceWithGenerics<number>>(value);
      // const isAGenericWithObject = (value: unknown) => isA<InterfaceWithGenerics<{}>>(value);

      // const interfaceWithGenericsArbitrary = <T>(
      //   propArbitrary: fc.Arbitrary<T>,
      // ): fc.Arbitrary<InterfaceWithGenerics<T>> =>
      //   fc.record({
      //     prop: propArbitrary,
      //     method: fc.func(propArbitrary),
      //   });

      // testValues(interfaceWithGenericsArbitrary(fc.string()), isAGenericWithString);
      // testValues(interfaceWithGenericsArbitrary(fc.integer()), isAGenericWithNumber);
      // testValues(interfaceWithGenericsArbitrary(fc.object()), isAGenericWithObject);
    });
  });
});
