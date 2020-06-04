/**
 * Create a type guard function for type T.
 * See {@link isA} for the signature.
 *
 * This works great for when you need to pass the type guard
 * as e.g. an argument to a filter function:
 *
 * @example
 * ```
 * const users = objects.filter(typeCheckerFor<User>());
 * ```
 *
 * Which is an equivalent of writing:
 *
 * @example
 * ```
 * const users = objects.filter(value => isA<User>(value));
 * ```
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
export declare function typeCheckFor<T>(): (value: unknown) => value is T;

/**
 * Type guard function for type T (checks whether {@param value} is of type T).
 *
 * This is the quicker way of creating a type guard and works great
 * for when you need to do the check in e.g. a conditional:
 *
 * @example
 * ```
 * if (isA<boolean[]>(someValue)) {
 *    // someValue is a boolean array
 * }
 * ```
 *
 * @function
 * @template T
 * @param {unknown} value - The value to check
 * @return {boolean} True if {@param value} is assignable to type T
 */
export declare function isA<T>(value: unknown): value is T;

// If someone forgets to register ts-type-checked/transformer then tsc
// is going to actually import this file which will throw this error
// for easier problem solving
throw new Error(
  'It looks like you have forgotten to register the transform for ts-type-checked!\n\nPlease look at the installation guide to see how to do that for your project:\n\nhttps://www.npmjs.com/package/ts-type-checked#installation',
);
