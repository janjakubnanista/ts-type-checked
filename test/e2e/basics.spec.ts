import 'jest';

import { isA } from '../..';
import { testValues } from './utils';
import fc from 'fast-check';

describe('basics', () => {
  describe('string', () => {
    const isAString = (value: unknown) => isA<string>(value);
    const validStringArbitrary = fc.string();
    const invalidStringArbitrary = fc.anything().filter(value => typeof value !== 'string');

    it('should return true when a string is passed', () => {
      testValues(validStringArbitrary, isAString);
    });

    it('should return false when not a string is passed', () => {
      testValues(invalidStringArbitrary, isAString, false);
    });
  });

  describe('number', () => {
    const isANumber = (value: unknown) => isA<number>(value);
    const validNumberArbitrary = fc.oneof(fc.integer(), fc.float());
    const invalidNumberArbitrary = fc.anything().filter(value => typeof value !== 'number');

    it('should return true when a number is passed', () => {
      testValues(validNumberArbitrary, isANumber);
    });

    it('should return false when not a number is passed', () => {
      testValues(invalidNumberArbitrary, isANumber, false);
    });
  });

  describe('boolean', () => {
    const isABoolean = (value: unknown) => isA<boolean>(value);
    const validBooleanArbitrary = fc.boolean();
    const invalidBooleanArbitrary = fc.anything().filter(value => typeof value !== 'boolean');

    it('should return true when a boolean is passed', () => {
      testValues(validBooleanArbitrary, isABoolean);
    });

    it('should return false when not a boolean is passed', () => {
      testValues(invalidBooleanArbitrary, isABoolean, false);
    });
  });

  describe('true', () => {
    const isATrue = (value: unknown) => isA<true>(value);
    const validTrueArbitrary = fc.constant(true);
    const invalidTrueArbitrary = fc.anything().filter(value => value !== true);

    it('should return true when true is passed', () => {
      testValues(validTrueArbitrary, isATrue);
    });

    it('should return false when not a true is passed', () => {
      testValues(invalidTrueArbitrary, isATrue, false);
    });
  });

  describe('false', () => {
    const isATrue = (value: unknown) => isA<false>(value);
    const validTrueArbitrary = fc.constant(false);
    const invalidTrueArbitrary = fc.anything().filter(value => value !== false);

    it('should return true when false is passed', () => {
      testValues(validTrueArbitrary, isATrue);
    });

    it('should return false when not a false is passed', () => {
      testValues(invalidTrueArbitrary, isATrue, false);
    });
  });

  describe('any', () => {
    const isAny = (value: unknown) => isA<any>(value);
    const validAnyArbitrary = fc.anything();

    it('should always return true', () => {
      testValues(validAnyArbitrary, isAny);
    });
  });

  describe('unknown', () => {
    const isUnknown = (value: unknown) => isA<unknown>(value);
    const validUnknownArbitrary = fc.anything();

    it('should always return true', () => {
      testValues(validUnknownArbitrary, isUnknown);
    });
  });

  describe('undefined', () => {
    const isUndefined = (value: unknown) => isA<undefined>(value);
    const validUndefinedArbitrary = fc.constant(undefined);
    const invalidUndefinedArbitrary = fc.anything().filter(value => value !== undefined);

    it('should return true when undefined is passed', () => {
      testValues(validUndefinedArbitrary, isUndefined);
    });

    it('should return false when not an undefined is passed', () => {
      testValues(invalidUndefinedArbitrary, isUndefined, false);
    });
  });

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
