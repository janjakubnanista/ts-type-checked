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
    // with the same value. That means that the result of a type check would depend on the result of the type check
    // and a loop would be created
    const heapIndex: number = heap.indexOf(value);
    if (heapIndex !== -1) {
      // Since the heap is shared between the calls we need to clear it before
      // throwing an error. If we didn't, following calls to the type guard
      // might see the stale values in the heap. This is only a problem in a very specific
      // scenario:
      //
      // - Try checking a circular structure with the type guard
      // - Catch the exception
      // - Mutate one value in the circular structure (break the cycle)
      // - Try checking the structure again
      heap.splice(0, heap.length);

      throw new Error(`Value that was passed to ts-type-checked contains a circular reference and cannot be checked`);
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
