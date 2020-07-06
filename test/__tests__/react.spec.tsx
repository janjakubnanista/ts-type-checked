import 'jest';
import React from 'react';

import { assert, notALiteral, notAnObject, notOfType, numeric, primitive } from '../utils/utils.v2';

// @ts-ignore
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('React', () => {
  const TestFunctionComponent: React.FC = () => null;
  class TestClassComponent extends React.Component {}
  class TestPureClassComponent extends React.PureComponent {}

  const reactComponentTypeArbitrary = fc.constantFrom<React.ComponentType>(
    TestFunctionComponent,
    TestClassComponent,
    TestPureClassComponent,
  );
  const reactTypeArbitrary: fc.Arbitrary<React.ReactElement['type']> = fc.oneof(
    fc.string(),
    reactComponentTypeArbitrary,
  );
  const reactKeyArbitrary = fc.option(fc.oneof(fc.string(), numeric(), fc.float()));
  const reactPropsArbitrary = fc.object();

  describe('ReactElement', () => {
    test('without type arguments', () => {
      type TypeReference1 = React.ReactElement;

      const validArbitrary = fc.record<TypeReference1>({
        type: reactTypeArbitrary,
        props: reactPropsArbitrary,
        key: reactKeyArbitrary,
      });

      const invalidSpecialCases = fc.constantFrom(
        {},
        { type: 6, props: {}, key: null },
        { type: {}, props: {}, key: 'key' },
        { props: 'string', key: 'key' },
        { type: 'div', props: {}, key: {} },
      );
      const invalidArbitrary = fc.oneof(
        invalidSpecialCases,
        fc.anything().filter(notAnObject),
        fc.record({
          props: reactPropsArbitrary,
          key: reactKeyArbitrary,
        }),
        fc.record({
          type: reactPropsArbitrary,
          props: reactPropsArbitrary,
          key: reactKeyArbitrary,
        }),
      );

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });

    test('with props type argument', () => {
      interface TypeReferenceProps {
        property: number;
        onChange: () => void;
      }
      type TypeReference1 = React.ReactElement<TypeReferenceProps>;

      const validPropsArbitrary = fc.record<TypeReferenceProps>({
        property: numeric(),
        onChange: fc.func(fc.constantFrom(undefined)),
      });
      const validArbitrary = fc.record<TypeReference1>({
        type: reactTypeArbitrary,
        props: validPropsArbitrary,
        key: reactKeyArbitrary,
      });

      const invalidSpecialCases = fc.constantFrom(
        { type: 'div', props: {}, key: 'key' },
        { type: 'div', props: { property: 7 }, key: 'key' },
        { type: 'div', props: { property: 7, onChange: undefined }, key: 'key' },
        { type: 'div', props: { property: 'string', onChange: () => undefined }, key: 'key' },
      );
      const invalidArbitrary = fc.oneof(
        invalidSpecialCases,
        fc.anything().filter(notAnObject),
        fc.record({
          type: reactTypeArbitrary,
          props: fc.record({
            property: fc.anything().filter(notOfType('number')),
            onChange: fc.func(fc.anything()),
          }),
          key: reactKeyArbitrary,
        }),
        fc.record({
          type: reactTypeArbitrary,
          props: fc.record({
            property: numeric(),
            onChange: fc.anything().filter(notOfType('function')),
          }),
          key: reactKeyArbitrary,
        }),
      );

      assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
    });
  });

  test('ComponentType', () => {
    type TypeReference1 = React.ComponentType;

    const validArbitrary: fc.Arbitrary<TypeReference1> = reactComponentTypeArbitrary;
    const invalidArbitrary = fc.oneof(
      primitive(),
      fc.constantFrom<unknown>(
        {},
        <div />,
        <TestFunctionComponent />,
        <TestClassComponent />,
        <TestPureClassComponent />,
      ),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });

  test('RefObject', () => {
    type TypeReference1 = React.RefObject<string>;

    const validArbitrary = fc.record<TypeReference1>({
      current: fc.option(fc.string()),
    });
    const invalidArbitrary = fc.oneof(
      primitive(),
      fc.record({
        current: fc.anything().filter(notOfType('string')).filter(notALiteral(null)),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [typeCheckFor<TypeReference1>(), (value) => isA<TypeReference1>(value)]);
  });
});
