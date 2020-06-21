import { TypeGuard } from '../types';

/**
 * Helper utility that wraps a type guard with circular reference check.
 *
 * To illustrate the function of this cycle breaker, let's take a simple recursive type:
 *
 * @example
 * ```
 * interface Recursive {
 *   parent?: Recursive;
 * }
 * ```
 *
 * We can now create an object that matches that type but has a cycle:
 *
 * @example
 * ```
 * const node = {};
 * const recursive: Recursive = Object.assign(node, { parent: node });
 * ```
 *
 * If we didn't wrap the original type guard, it would be spinning in circles
 * until the maximum call stack exceeded error was thrown.
 *
 * @param typeName {TypeName} Name of the type (to be displayed in an error message)
 * @param typeGuard {TypeGuard} The original type guard
 * @returns {TypeGuard} The wrapped type guard
 */
export default <T>(typeGuard: TypeGuard<T>): TypeGuard<T> => {
  // We will create a heap in this closure that will store all the values being checked by this type guard
  const heap: unknown[] = [];

  // We return a TypeGuard with signature identical to the original one
  return (value: unknown): value is T => {
    // First we check whether the value is now already being checked
    //
    // If the value is in the heap it means that this type guard has called itself
    // with the same value, something like the chicken and egg situation.
    //
    // Looking at the problem from the second type guard call, the one that would start the whole
    // type checking cascade again and again:
    //
    // 1. If it returns false, it must be that the value is not of a valid type.
    //    - If it indeed was of an invalid type, other property checks must have failed,
    //      so returning false will not affect the result of the original call.
    //    - If the value was of a valid type though, i.e. other property checks would pass,
    //      returning false would make the original call return false even though it was valid
    // 2. If it returns true, it must be that the value is of a valid type
    //    - If it indeed was of a valid type, other property checks must have passed so returning true
    //      will not break the positive and correct result
    //    - If it was of an invalid type, i.e. other property checks would be failing,
    //      returning true will not affect the negative and correct result
    //
    // In other words,  believe this should return true
    if (heap.indexOf(value) !== -1) {
      return true;
    }

    // If the value was not in the heap then let's add it there
    heap.push(value);

    // Now we perform the type check
    const isOfTypeT: boolean = typeGuard(value);

    // And get the value out of the heap
    heap.pop();

    return isOfTypeT;
  };
};
