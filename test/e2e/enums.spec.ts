import 'jest';

import { isA } from '../..';
import fc from 'fast-check';

describe('enums', () => {
  const stringOrNumberArbitrary = () => fc.oneof(fc.string(), fc.integer());

  it('should only return true for object types with correct properties', () => {
    enum Basic {
      A,
      B,
    }

    enum BasicWithValues {
      A = 'a',
      B = 'b',
    }

    const enum ConstBasic {
      A,
      B,
    }

    const enum ConstWithValues {
      A = 98,
      B = 902,
    }

    expect(isA<Basic>(Basic.A)).toBeTruthy();
    expect(isA<Basic>(Basic.B)).toBeTruthy();

    expect(isA<ConstBasic>(ConstBasic.A)).toBeTruthy();
    expect(isA<ConstBasic>(ConstBasic.B)).toBeTruthy();

    expect(isA<BasicWithValues>(BasicWithValues.A)).toBeTruthy();
    expect(isA<BasicWithValues>(BasicWithValues.B)).toBeTruthy();

    expect(isA<ConstWithValues>(ConstWithValues.A)).toBeTruthy();
    expect(isA<ConstWithValues>(ConstWithValues.B)).toBeTruthy();

    fc.assert(
      fc.property(stringOrNumberArbitrary(), stringOrNumber => {
        fc.pre(BasicWithValues.A !== stringOrNumber);
        fc.pre(BasicWithValues.B !== stringOrNumber);

        expect(isA<BasicWithValues>(stringOrNumber)).toBeFalsy();
      }),
    );
  });
});
