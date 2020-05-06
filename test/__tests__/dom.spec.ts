import 'jest';

import { FilterFunction, testTypeChecks } from './utils';
// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('DOM', () => {
  test('Document', () => {
    type TypeReference1 = Document;

    const validArbitrary = fc.constantFrom(document);
    const invalidArbitrary = fc.anything();

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Node', () => {
    type TypeReference1 = Node;

    const validArbitrary = fc
      .constantFrom('div', 'span', 'article', 'p')
      .map((tagName) => document.createElement(tagName));
    const invalidArbitrary = fc.anything();

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('Element', () => {
    type TypeReference1 = Element;

    const validArbitrary = fc
      .constantFrom('div', 'span', 'article', 'p')
      .map((tagName) => document.createElement(tagName));
    const invalidArbitrary = fc.anything();

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });

  test('HTMLDivElement', () => {
    type TypeReference1 = HTMLDivElement;

    const validArbitrary = fc.constantFrom('div').map((tagName) => document.createElement(tagName));
    const invalidArbitrary = fc.oneof(
      fc.anything(),
      fc.constantFrom('span', 'article', 'link', 'p').map((tagName) => document.createElement(tagName)),
    );

    const checks: FilterFunction[] = [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)];

    testTypeChecks(validArbitrary, checks, true);
    testTypeChecks(invalidArbitrary, checks, false);
  });
});
