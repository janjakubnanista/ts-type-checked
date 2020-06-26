import { expect } from 'chai';
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
  it('should work with jest', () => {
    expect(getTypeName('hey')).to.equal('String');
    expect(getTypeName('')).to.equal('String');

    expect(getTypeName(6)).to.equal('Number');
    expect(getTypeName(NaN)).to.equal('Number');

    expect(getTypeName({ name: 'John' })).to.equal('User');
    expect(getTypeName({ name: 'John', age: 7 })).to.equal('User');

    expect(getTypeName({ name: 'John', age: 'Not-a-number' })).to.equal('Unknown!!!');
  });
});
