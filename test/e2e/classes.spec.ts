import 'jest';

import { isA } from '../..';

describe('classes', () => {
  it('should return true if object is instanceof a class', () => {
    //
    // TODO Add support for properties with inferred type
    //
    //
    class A {
      aProperty = 'Property A';
    }
    class B extends A {
      bProperty = 'Property B';
    }
    class C {
      cProperty = 'Property C';
    }
    const a = new A();
    const b = new B();
    const c = new C();
    const obj = {};
    expect(isA<A>(a)).toBeTruthy();
    expect(isA<A>(b)).toBeTruthy();
    expect(isA<A>(c)).toBeFalsy();
    expect(isA<A>(obj)).toBeFalsy();
    expect(isA<B>(a)).toBeFalsy();
    expect(isA<B>(b)).toBeTruthy();
    expect(isA<B>(c)).toBeFalsy();
    expect(isA<B>(obj)).toBeFalsy();
    expect(isA<C>(a)).toBeFalsy();
    expect(isA<C>(b)).toBeFalsy();
    expect(isA<C>(c)).toBeTruthy();
    expect(isA<C>(obj)).toBeFalsy();
  });
});
