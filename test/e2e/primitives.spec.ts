import 'jest';

import { isA } from '../..';
import { testValues } from './utils';
import fc from 'fast-check';

describe('primitive types', () => {
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
});
