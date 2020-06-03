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
export function typeCheckFor<T>(): (value: unknown) => value is T;

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
export function isA<T>(value: unknown): value is T;

export type TypeChecked<T> = 
  T extends [infer E1] ? [TypeChecked<E1>] :
  T extends [infer E1, infer E2] ? [TypeChecked<E1>, TypeChecked<E2>] :
  T extends [infer E1, infer E2, infer E3] ? [TypeChecked<E1>, TypeChecked<E2>, TypeChecked<E3>] :
  T extends Array<infer E> ? TypeChecked<E>[] :
  T extends Date ? Date : 
  T extends Node | Element ? T :
  T extends Promise<any> ? Promise<unknown> : 
  T extends symbol ? symbol :
  T extends String | Number | Boolean | BigInt ? T :
  T extends string | number | boolean | bigint ? T :
  T extends Record<infer K, any> ? { [P in K]: TypeChecked<T[P]> } :
  
  T extends Function ? (...args: unknown[]) => unknown : 
  T extends object ? object : unknown;

interface Test1 {
  property: string;
}

interface Test2 {
  property: string[];
}

interface Test3 {
  property: (name: string) => string;
}

interface Test4 {
  property: Promise<Test1>;
}

interface Test5 {
  property: Array<Test4 | string | true>;
}

type A1 = TypeChecked<'literal'>
type A2 = TypeChecked<6>
type A3 = TypeChecked<number>
type A4 = TypeChecked<string>
type A5 = TypeChecked<boolean>
type A6 = TypeChecked<true>
type A7 = TypeChecked<false>
type A8 = TypeChecked<[]>
type A9 = TypeChecked<string[]>
type A10 = TypeChecked<object[]>
type A11 = TypeChecked<[number]>
type A12 = TypeChecked<[1]>
type A13 = TypeChecked<Date>
type A14 = TypeChecked<HTMLAnchorElement>
type A15 = TypeChecked<Promise<HTMLAnchorElement>>

type B1 = TypeChecked<Test1>
type B2 = TypeChecked<Test2>
type B3 = TypeChecked<Test3>
type B4 = TypeChecked<Test4>
type B5 = TypeChecked<Test5>
