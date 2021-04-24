import 'jest';

import { assert, notNullOrUndefined, nullable, numeric, oneOf, primitive } from '../../../utils/utils.v2';
import { isA, typeCheckFor } from 'ts-type-checked';
import { valuesOf } from 'ts-reflection';
import fc from 'fast-check';

describe('String template literals', () => {
  test('With string literals', () => {
    type TypeReference1 = 'Elephant' | 'Wombat' | 'Squirrel';
    type TypeReference2 = `Ms. and Mr. ${TypeReference1}`;

    const values = valuesOf<TypeReference2>();
    const validArbitrary: fc.Arbitrary<TypeReference2> = fc.constantFrom<TypeReference2>(...values);
    const invalidArbitrary = oneOf<unknown>(
      fc.anything().filter((value) => !values.includes(value as any)),
      fc.constantFrom('Ms. and Mr. ', 'Ms. and Mr.', 'Ms. and Mr. Dog', 'Ms. and Mr. Elephant Wombat'),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference2>(), (value) => isA<TypeReference2>(value)]);
  });

  test('Product of more types', () => {
    type TypeReference1 = 'Ms. and Ms.' | 'Mr. and Mr.' | 'Ms. and Mr.';
    type TypeReference2 = 'Elephant' | 'Wombat' | 'Squirrel';
    type TypeReference3 = `${TypeReference1}${TypeReference2}`;

    const values = valuesOf<TypeReference3>();
    const validArbitrary: fc.Arbitrary<TypeReference3> = fc.constantFrom<TypeReference3>(...values);
    const invalidArbitrary = oneOf<unknown>(
      fc.anything().filter((value) => !values.includes(value as any)),
      fc.constantFrom('Ms. and Ms. ', 'Mr. and Mr.', 'Mr. and Mr. Dog', 'Ms. and Mr. Elephant Wombat'),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference3>(), (value) => isA<TypeReference3>(value)]);
  });
});
