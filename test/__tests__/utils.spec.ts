import 'jest';
import { aPrimitive, notAPrimitive, primitive } from './utils';
import fc from 'fast-check';

describe('utils', () => {
  describe('value filtering', () => {
    test('aPrimitive', () => {
      expect(aPrimitive(1)).toBeTruthy();
      expect(aPrimitive(1n)).toBeTruthy();
      expect(aPrimitive(NaN)).toBeTruthy();
      expect(aPrimitive(null)).toBeTruthy();
      expect(aPrimitive(undefined)).toBeTruthy();
      expect(aPrimitive('string')).toBeTruthy();
      expect(aPrimitive(true)).toBeTruthy();
      expect(aPrimitive(false)).toBeTruthy();
      expect(aPrimitive(Symbol('my symbol'))).toBeTruthy();

      expect(aPrimitive({})).toBeFalsy();
      expect(aPrimitive([])).toBeFalsy();
      expect(aPrimitive(Object)).toBeFalsy();
      expect(aPrimitive(document)).toBeFalsy();
      expect(aPrimitive(new Date())).toBeFalsy();
      expect(aPrimitive(() => true)).toBeFalsy();

      fc.assert(
        fc.property(primitive(), (value) => {
          expect(aPrimitive(value)).toBeTruthy();
        }),
      );
    });

    test('notAPrimitive', () => {
      expect(notAPrimitive(1)).toBeFalsy();
      expect(notAPrimitive(1n)).toBeFalsy();
      expect(notAPrimitive(NaN)).toBeFalsy();
      expect(notAPrimitive(null)).toBeFalsy();
      expect(notAPrimitive(undefined)).toBeFalsy();
      expect(notAPrimitive('string')).toBeFalsy();
      expect(notAPrimitive(true)).toBeFalsy();
      expect(notAPrimitive(false)).toBeFalsy();
      expect(notAPrimitive(Symbol('my symbol'))).toBeFalsy();

      expect(notAPrimitive({})).toBeTruthy();
      expect(notAPrimitive([])).toBeTruthy();
      expect(notAPrimitive(Object)).toBeTruthy();
      expect(notAPrimitive(document)).toBeTruthy();
      expect(notAPrimitive(new Date())).toBeTruthy();
      expect(notAPrimitive(() => true)).toBeTruthy();

      fc.assert(
        fc.property(primitive(), (value) => {
          expect(notAPrimitive(value)).toBeFalsy();
        }),
      );
    });
  });
});
