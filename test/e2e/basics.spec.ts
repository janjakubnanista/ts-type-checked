import 'jest';

import {
  NumberLiteralUnion,
  StringLiteralUnion,
  isNumberLiteralUnionCheck,
  isStringLiteralUnionCheck,
  numberLiteralUnionArbitrary,
  stringLiteralUnionArbitrary,
  testValues,
} from './utils';
import { isA, makeIsA } from '../..';
import fc from 'fast-check';

describe('basics', () => {
  describe('arrays', () => {
    type ArrayOf<T> = T[];
    type InterfaceOf<T> = {
      propertyForSure: T;
      maybeProperty?: T;
      num: number;
    };
    type GenericOf<T> = ArrayOf<T> | InterfaceOf<T> | T;

    describe('string arrays', () => {
      type StringArray = string[];

      const isAStringArrayWithBrackets = (value: unknown) => isA<string[]>(value);
      const isAStringArrayWithReference = (value: unknown) => isA<StringArray>(value);
      const isAStringArrayWithGenerics = (value: unknown) => isA<ArrayOf<string>>(value);
      const isGenericOfString = (value: unknown) => isA<GenericOf<string>>(value);

      const validStringArrayArbitrary = fc.array(fc.string());
      const invalidStringArrayArbitrary = fc.oneof(
        fc.array(fc.anything().filter(value => typeof value !== 'string')).filter(array => !!array.length),
        fc.anything().filter(value => !Array.isArray(value)),
      );

      it('should return true when a string array is passed', () => {
        testValues(validStringArrayArbitrary, isAStringArrayWithBrackets);
        testValues(validStringArrayArbitrary, isAStringArrayWithReference);
        testValues(validStringArrayArbitrary, isAStringArrayWithGenerics);
      });

      it('should return false when a non-string array is passed', () => {
        testValues(invalidStringArrayArbitrary, isAStringArrayWithBrackets, false);
        testValues(invalidStringArrayArbitrary, isAStringArrayWithReference, false);
        testValues(invalidStringArrayArbitrary, isAStringArrayWithGenerics, false);
      });
    });
  });

  test('string', () => {
    type StringType = string;

    const validStringArbitrary = fc.string();
    const invalidStringArbitrary = fc.anything().filter(value => typeof value !== 'string');

    testValues(validStringArbitrary, makeIsA<string>());
    testValues(validStringArbitrary, makeIsA<StringType>());
    testValues(invalidStringArbitrary, makeIsA<string>(), false);
    testValues(invalidStringArbitrary, makeIsA<StringType>(), false);
  });

  test('number', () => {
    type NumberType = number;

    const validNumberArbitrary = fc.oneof(fc.integer(), fc.float());
    const invalidNumberArbitrary = fc.anything().filter(value => typeof value !== 'number');

    testValues(validNumberArbitrary, makeIsA<number>());
    testValues(validNumberArbitrary, makeIsA<NumberType>());
    testValues(invalidNumberArbitrary, makeIsA<number>(), false);
    testValues(invalidNumberArbitrary, makeIsA<NumberType>(), false);
  });

  // describe('number', () => {
  //   const isANumber = (value: unknown) => isA<number>(value);
  //   const validNumberArbitrary = fc.oneof(fc.integer(), fc.float());
  //   const invalidNumberArbitrary = fc.anything().filter(value => typeof value !== 'number');

  //   it('should return true when a number is passed', () => {
  //     testValues(validNumberArbitrary, isANumber);
  //   });

  //   it('should return false when not a number is passed', () => {
  //     testValues(invalidNumberArbitrary, isANumber, false);
  //   });
  // });

  // describe('boolean', () => {
  //   const isABoolean = (value: unknown) => isA<boolean>(value);
  //   const validBooleanArbitrary = fc.boolean();
  //   const invalidBooleanArbitrary = fc.anything().filter(value => typeof value !== 'boolean');

  //   it('should return true when a boolean is passed', () => {
  //     testValues(validBooleanArbitrary, isABoolean);
  //   });

  //   it('should return false when not a boolean is passed', () => {
  //     testValues(invalidBooleanArbitrary, isABoolean, false);
  //   });
  // });

  // describe('true', () => {
  //   const isATrue = (value: unknown) => isA<true>(value);
  //   const validTrueArbitrary = fc.constant(true);
  //   const invalidTrueArbitrary = fc.anything().filter(value => value !== true);

  //   it('should return true when true is passed', () => {
  //     testValues(validTrueArbitrary, isATrue);
  //   });

  //   it('should return false when not a true is passed', () => {
  //     testValues(invalidTrueArbitrary, isATrue, false);
  //   });
  // });

  // describe('false', () => {
  //   const isATrue = (value: unknown) => isA<false>(value);
  //   const validTrueArbitrary = fc.constant(false);
  //   const invalidTrueArbitrary = fc.anything().filter(value => value !== false);

  //   it('should return true when false is passed', () => {
  //     testValues(validTrueArbitrary, isATrue);
  //   });

  //   it('should return false when not a false is passed', () => {
  //     testValues(invalidTrueArbitrary, isATrue, false);
  //   });
  // });

  // describe('any', () => {
  //   const isAny = (value: unknown) => isA<any>(value);
  //   const validAnyArbitrary = fc.anything();

  //   it('should always return true', () => {
  //     testValues(validAnyArbitrary, isAny);
  //   });
  // });

  // describe('unknown', () => {
  //   const isUnknown = (value: unknown) => isA<unknown>(value);
  //   const validUnknownArbitrary = fc.anything();

  //   it('should always return true', () => {
  //     testValues(validUnknownArbitrary, isUnknown);
  //   });
  // });

  // describe('undefined', () => {
  //   const isUndefined = (value: unknown) => isA<undefined>(value);
  //   const validUndefinedArbitrary = fc.constant(undefined);
  //   const invalidUndefinedArbitrary = fc.anything().filter(value => value !== undefined);

  //   it('should return true when undefined is passed', () => {
  //     testValues(validUndefinedArbitrary, isUndefined);
  //   });

  //   it('should return false when not an undefined is passed', () => {
  //     testValues(invalidUndefinedArbitrary, isUndefined, false);
  //   });
  // });

  // describe('string literal unions', () => {
  //   const isAStringLiteralUnion = (value: unknown) => isA<StringLiteralUnion>(value);
  //   const invalidStringLiteralUnionArbitrary = fc.anything().filter(value => !isStringLiteralUnionCheck(value));
  //   it('should return true when valid string is passed', () => {
  //     testValues(stringLiteralUnionArbitrary, isAStringLiteralUnion);
  //   });
  //   it('should return false when invalid string is passed', () => {
  //     testValues(invalidStringLiteralUnionArbitrary, isAStringLiteralUnion, false);
  //   });
  //   it('should return false when an array of valid strings is passed', () => {
  //     testValues(fc.array(invalidStringLiteralUnionArbitrary), isAStringLiteralUnion, false);
  //   });
  // });

  // describe('number literal unions', () => {
  //   const isNumberLiteralUnion = (value: unknown) => isA<NumberLiteralUnion>(value);
  //   const invalidNumberLiteralUnionArbitrary = fc.anything().filter(value => !isNumberLiteralUnionCheck(value));
  //   it('should return true when valid number is passed', () => {
  //     testValues(numberLiteralUnionArbitrary, isNumberLiteralUnion);
  //   });
  //   it('should return false when invalid number is passed', () => {
  //     testValues(invalidNumberLiteralUnionArbitrary, isNumberLiteralUnion, false);
  //   });
  //   it('should return false when an array of valid numbers is passed', () => {
  //     testValues(fc.array(numberLiteralUnionArbitrary), isNumberLiteralUnion, false);
  //   });
  // });

  // describe('arrays', () => {
  //   type ArrayOf<T> = T[];
  //   type InterfaceOf<T> = {
  //     property: T;
  //   };
  //   type GenericOf<T> = ArrayOf<T> | InterfaceOf<T> | T;

  //   describe('string arrays', () => {
  //     type StringArray = string[];

  //     const isAStringArrayWithBrackets = (value: unknown) => isA<string[]>(value);
  //     const isAStringArrayWithReference = (value: unknown) => isA<StringArray>(value);
  //     const isAStringArrayWithGenerics = (value: unknown) => isA<ArrayOf<string>>(value);
  //     const isGenericOfString = (value: unknown) => isA<GenericOf<string>>(value);

  //     const validStringArrayArbitrary = fc.array(fc.string());
  //     const invalidStringArrayArbitrary = fc.oneof(
  //       fc.array(fc.anything().filter(value => typeof value !== 'string')).filter(array => !!array.length),
  //       fc.anything().filter(value => !Array.isArray(value)),
  //     );

  //     it('should return true when a string array is passed', () => {
  //       testValues(validStringArrayArbitrary, isAStringArrayWithBrackets);
  //       testValues(validStringArrayArbitrary, isAStringArrayWithReference);
  //       testValues(validStringArrayArbitrary, isAStringArrayWithGenerics);
  //     });

  //     it('should return false when a non-string array is passed', () => {
  //       testValues(invalidStringArrayArbitrary, isAStringArrayWithBrackets, false);
  //       testValues(invalidStringArrayArbitrary, isAStringArrayWithReference, false);
  //       testValues(invalidStringArrayArbitrary, isAStringArrayWithGenerics, false);
  //     });
  //   });
  // });

  // FIXME How to handle global classes (Array, Date etc.)?
  //
  // describe('Date', () => {
  //   const isADate = (value: unknown) => isA<Date>(value);
  //   const validDateArbitrary = fc.date();
  //   const invalidDateArbitrary = fc.anything().filter(value => !(value instanceof Date));

  //   it('should return true when a Date object is passed', () => {
  //     testValues(validDateArbitrary, isADate);
  //   });

  //   it('should return false when not a Date object is passed', () => {
  //     testValues(invalidDateArbitrary, isADate, false);
  //   });
  // });
});
