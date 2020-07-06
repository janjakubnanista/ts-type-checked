import 'jest';

import { assert, notALiteral, notNullOrUndefined, notOfType, numeric, oneOf, primitive } from '../../../utils/utils.v2';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('classes', () => {
  test('ES6 private properties', () => {
    class TypeReference1 {
      #property = '';
      #anotherProperty: number;

      constructor(anotherProperty = 1) {
        this.#anotherProperty = anotherProperty;
      }

      #privateMethodWithInitializer = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function
    }

    const validArbitrary: fc.Arbitrary<TypeReference1> = oneOf(
      fc.constantFrom(new TypeReference1(6), new TypeReference1()),
      numeric().map((a) => new TypeReference1(a)),

      // Empty object should be valid since TypeReference1 has no public properties
      fc.anything().filter(notNullOrUndefined) as fc.Arbitrary<TypeReference1>,
    );

    const invalidArbitrary = oneOf(fc.constantFrom(null, undefined));

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
