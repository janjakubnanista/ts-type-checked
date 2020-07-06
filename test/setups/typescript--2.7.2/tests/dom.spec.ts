import 'jest';

import { assert } from '../../../utils/utils.v2';

import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('DOM', () => {
  test('Document', () => {
    type TypeReference1 = Document;

    const validArbitrary = fc.constantFrom(document);
    const invalidArbitrary = fc.anything();

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Node', () => {
    type TypeReference1 = Node;

    const validArbitrary = fc
      .constantFrom('div', 'span', 'article', 'p')
      .map((tagName) => document.createElement(tagName));
    const invalidArbitrary = fc.anything();

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('Element', () => {
    type TypeReference1 = Element;

    const validArbitrary = fc
      .constantFrom('div', 'span', 'article', 'p')
      .map((tagName) => document.createElement(tagName));
    const invalidArbitrary = fc.anything();

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('HTMLDivElement', () => {
    type TypeReference1 = HTMLDivElement;

    const validArbitrary = fc.constantFrom('div').map((tagName) => document.createElement(tagName));
    const invalidArbitrary = fc.oneof(
      fc.anything(),
      fc.constantFrom('span', 'article', 'link', 'p').map((tagName) => document.createElement(tagName)),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
