import fc from 'fast-check';
export declare const optionalOf: <T>(arbitrary: fc.Arbitrary<T>) => fc.Arbitrary<T | undefined>;
export declare const testValues: <T>(
  arbitrary: fc.Arbitrary<T>,
  check: (value: unknown) => boolean,
  result?: boolean,
) => void;
