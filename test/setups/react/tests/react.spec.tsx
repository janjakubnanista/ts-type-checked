import 'jest';
import React from 'react';

import { assert, notALiteral, notAnObject, notOfType, numeric, oneOf, primitive } from '../../../utils/utils.v2';

import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('React', () => {
  const TestFunctionComponent: React.FC = () => null;
  class TestClassComponent extends React.Component {}
  class TestPureClassComponent extends React.PureComponent {}

  const reactComponentTypeArbitrary: fc.Arbitrary<React.ComponentType> = fc.constantFrom<React.ComponentType<{}>[]>(
    TestFunctionComponent,
    TestClassComponent,
    TestPureClassComponent,
  );
  const reactTypeArbitrary: fc.Arbitrary<React.ReactElement['type']> = oneOf<React.ReactElement['type']>(
    fc.string(),
    reactComponentTypeArbitrary,
  );
  const reactKeyArbitrary: fc.Arbitrary<React.ReactElement['key']> = fc.option(
    oneOf<React.ReactElement['key']>(fc.string(), numeric()),
  );
  const reactPropsArbitrary: fc.Arbitrary<React.ReactElement['props']> = fc.object();

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
      const invalidArbitrary = oneOf(
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

      assert(validArbitrary, invalidArbitrary, [
        typeCheckFor<TypeReference1>(),
        (value: any) => isA<TypeReference1>(value),
      ]);
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
        { type: 'div', props: { property: 'string', onChange: (): void => undefined }, key: 'key' },
      );
      const invalidArbitrary = oneOf(
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

      assert(validArbitrary, invalidArbitrary, [
        typeCheckFor<TypeReference1>(),
        (value: any) => isA<TypeReference1>(value),
      ]);
    });
  });

  test('ComponentType', () => {
    type TypeReference1 = React.ComponentType;

    const validArbitrary: fc.Arbitrary<TypeReference1> = reactComponentTypeArbitrary;
    const invalidArbitrary = oneOf(
      primitive(),
      fc.constantFrom<any[]>({}, <div />, <TestFunctionComponent />, <TestClassComponent />, <TestPureClassComponent />),
    );

    assert(validArbitrary, invalidArbitrary, [
      typeCheckFor<TypeReference1>(),
      (value: any) => isA<TypeReference1>(value),
    ]);
  });

  test('RefObject', () => {
    type TypeReference1 = React.RefObject<string>;

    const validArbitrary = fc.record<TypeReference1>({
      current: fc.option(fc.string()),
    });
    const invalidArbitrary = oneOf<any>(
      primitive(),
      fc.record({
        current: fc.anything().filter(notOfType('string')).filter(notALiteral(null)),
      }),
    );

    assert(validArbitrary, invalidArbitrary, [
      typeCheckFor<TypeReference1>(),
      (value: any) => isA<TypeReference1>(value),
    ]);
  });
});
