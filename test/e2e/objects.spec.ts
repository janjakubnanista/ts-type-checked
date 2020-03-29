import 'jest';

import {
  InterfaceWithOptionals,
  InterfaceWithPrimitives,
  interfaceWithOptionalsArbitrary,
  interfaceWithPrimitivesArbitrary,
  isInterfaceWithOptionalsCheck,
  isInterfaceWithPrimitivesCheck,
  testValues,
} from './utils';
import { isA } from '../..';
import fc from 'fast-check';

describe('objects', () => {
  // it('should return true for any object', () => {
  //   const isAnObject = (value: unknown) => isA<{}>(value);

  //   testValues(fc.object(), isAnObject);
  // });

  // it('should return true for any Date', () => {
  //   const isAnObject = (value: unknown) => isA<{}>(value);

  //   testValues(fc.date(), isAnObject);
  // });

  describe('without optionals', () => {
    const isInterfaceWithPrimitives = (value: unknown) => isA<InterfaceWithPrimitives>(value);
    const invalidInterfaceWithPrimitivesArbitrary = fc
      .anything()
      .filter(value => !isInterfaceWithPrimitivesCheck(value));

    it('should return true when valid object is passed', () => {
      testValues(interfaceWithPrimitivesArbitrary, isInterfaceWithPrimitives);
    });

    it('should return false when invalid object is passed', () => {
      testValues(invalidInterfaceWithPrimitivesArbitrary, isInterfaceWithPrimitives, false);
    });
  });

  // describe('with optionals', () => {
  //   const isInterfaceWithOptionals = (value: unknown) => isA<InterfaceWithOptionals>(value);
  //   const invalidInterfaceWithOptionalsArbitrary = fc.anything().filter(value => !isInterfaceWithOptionalsCheck(value));

  //   it('should return true when valid object is passed', () => {
  //     testValues(interfaceWithOptionalsArbitrary, isInterfaceWithOptionals);
  //   });

  //   it('should return false when invalid object is passed', () => {
  //     testValues(invalidInterfaceWithOptionalsArbitrary, isInterfaceWithOptionals, false);
  //   });
  // });

  // it('should only return true for literal object types with correct properties', () => {
  //   fc.assert(
  //     fc.property(
  //       fc.record({
  //         num: fc.integer(),
  //         str: fc.string(),
  //       }),
  //       object => {
  //         expect(isA<{ num: number; str: string }>(object)).toBeTruthy();
  //         expect(isA<{ num: number }>(object)).toBeTruthy();
  //         expect(isA<{ str: string }>(object)).toBeTruthy();
  //         expect(isA<{ num: number; str: string; other: undefined }>(object)).toBeTruthy();
  //         expect(isA<{}>(object)).toBeTruthy();

  //         expect(isA<{ num: string; str: string }>(object)).toBeFalsy();
  //         expect(isA<{ num: number; str: number }>(object)).toBeFalsy();
  //         expect(isA<{ num: number; str: string; other: boolean }>(object)).toBeFalsy();
  //       },
  //     ),
  //   );
  // });

  // it('should only return true for object types with correct interface properties', () => {
  //   interface Original {
  //     num: number;
  //     str: string;
  //   }

  //   fc.assert(
  //     fc.property(
  //       fc.record({
  //         num: fc.integer(),
  //         str: fc.string(),
  //       }),
  //       object => {
  //         expect(isA<Original>(object)).toBeTruthy();
  //         expect(isA<Original>(object)).toBeTruthy();
  //       },
  //     ),
  //   );
  // });
});
