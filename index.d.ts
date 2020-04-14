// The main export of this package is a ghost one - its definition
// is generated at compile time by the provided transformer

/**
 * Create a type guard function for type T.
 * See {@link isA} for the signature.
 *
 * @example
 * ```
 * const isAString = typeCheckFor<string>();
 * const isANumericArray = typeCheckFor<number[]>();
 *
 * isAString('');             // true
 * isAString('something');    // true
 * isAString(7);              // false
 * isAString({});             // false
 *
 * isANumericArray([]);             // true
 * isANumericArray([1, NaN, 0.89]); // true
 * isANumericArray(['string']);     // true
 * isANumericArray({});             // false
 *
 * type Color = 'red' | 'yellow' | 'blue';
 * const isAColor = typeCheckFor<Color>();
 * ```
 *
 * @function
 * @template T
 * @return {function(value: unknown): void} True if {@param value} is assignable to type T
 */
export function typeCheckFor<T>(): (value: unknown) => value is T;

/**
 * Type guard function for type T (checks whether {@param value} is of type T).
 *
 * This is the less performant yet quicker way of creating a type guard:
 *
 * @example
 * ```
 * if (isA<boolean[]>(someValue)) {
 *    // someValue is a boolean array
 * }
 * ```
 *
 * There is a performance hit associated - the guard will be recreated every time isA() is called.
 *
 * @function
 * @template T
 * @param {unknown} value - The value to check
 * @return {boolean} True if {@param value} is assignable to type T
 */
export function isA<T>(value: unknown): value is T;
