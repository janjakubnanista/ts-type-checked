import fc, { Arbitrary } from 'fast-check';

export const optionalOf = <T>(arbitrary: Arbitrary<T>): Arbitrary<T | undefined> =>
  fc.oneof(arbitrary, fc.constant(undefined));

export const testValues = <T>(arbitrary: fc.Arbitrary<T>, check: (value: unknown) => boolean, result = true) => {
  fc.assert(
    fc.property(arbitrary, value => {
      expect(check(value)).toBe(result);
    }),
  );
};
