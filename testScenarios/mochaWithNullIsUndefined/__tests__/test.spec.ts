import { expect } from 'chai';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('with nullIsUndefined on', () => {
  it('null should pass for undefined', () => {
    expect(isA<undefined>(null)).to.equal(true);
    expect(isA<void>(null)).to.equal(true);
  });

  it('undefined should not pass for null', () => {
    expect(isA<null>(undefined)).to.equal(false);
    expect(isA<null>(void 0)).to.equal(false);
  });

  it('null should pass for optional properties', () => {
    type TypeReference1 = {
      property?: string;
    };

    const validArbitrary = fc.record({
      property: fc.option(fc.string()),
    });

    const typeCheck = typeCheckFor<TypeReference1>();

    fc.assert(
      fc.property(validArbitrary, (value) => {
        expect(isA<TypeReference1>(value)).to.equal(true);
        expect(typeCheck(value)).to.equal(true);
      }),
    );
  });

  it('null should pass for unions with undefined', () => {
    type TypeReference1 = {
      property: string | undefined;
    };

    const validArbitrary = fc.record({
      property: fc.option(fc.string()),
    });

    const typeCheck = typeCheckFor<TypeReference1>();

    fc.assert(
      fc.property(validArbitrary, (value) => {
        expect(isA<TypeReference1>(value)).to.equal(true);
        expect(typeCheck(value)).to.equal(true);
      }),
    );
  });
});
