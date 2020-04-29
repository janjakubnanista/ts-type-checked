import 'jest';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';

interface User {
  name: string;
  age?: number;
}

const isAUser = typeCheckFor<User>();
const getTypeName = (value: unknown): string => {
  if (isAUser(value)) return 'User';
  if (isA<string>(value)) return 'String';
  if (isA<number>(value)) return 'Number';

  return 'Unknown!!!';
};

describe('example tests', () => {
  test('ts-type-checked should work with jest', () => {
    expect(getTypeName('hey')).toBe('String');
    expect(getTypeName('')).toBe('String');

    expect(getTypeName(6)).toBe('Number');
    expect(getTypeName(NaN)).toBe('Number');

    expect(getTypeName({ name: 'John' })).toBe('User');
    expect(getTypeName({ name: 'John', age: 7 })).toBe('User');

    expect(getTypeName({ name: 'John', age: 'Not-a-number' })).toBe('Unknown!!!');
  });
});
