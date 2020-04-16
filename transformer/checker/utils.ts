import ts from 'typescript';

export const createTypeCheckerFunction = (
  comparison: (valueNode: ts.Identifier) => ts.Expression,
): ts.ArrowFunction => {
  const value: ts.Identifier = ts.createIdentifier('value');

  return ts.createArrowFunction(
    /* modifiers */ undefined,
    /* typeParameters */ undefined,
    [
      ts.createParameter(
        /* decorators */ undefined,
        /* modifiers */ undefined,
        /* dotDotDotToken */ undefined,
        /* name */ value,
      ),
    ],
    undefined,
    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    comparison(value),
  );
};

export const createIsArray = (value: ts.Expression): ts.Expression =>
  ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'), [], [value]);

export const createArrayElementsCheck = (
  value: ts.Expression,
  elementTypeCheck: (value: ts.Expression, index: ts.Expression) => ts.Expression,
): ts.Expression => {
  const element = ts.createIdentifier('element');
  const index = ts.createIdentifier('index');
  const checkElement = ts.createArrowFunction(
    undefined /* modifiers */,
    undefined /* typeParameters */,
    [
      ts.createParameter(
        undefined /* decorators */,
        undefined /* modifiers */,
        undefined /* dotDotDotToken */,
        element /* name */,
      ),
      ts.createParameter(
        undefined /* decorators */,
        undefined /* modifiers */,
        undefined /* dotDotDotToken */,
        index /* name */,
      ),
    ],
    undefined,
    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    elementTypeCheck(element, index),
  );

  // Now let's do value.every(<element type checker>)
  const checkElements = ts.createCall(ts.createPropertyAccess(value, 'every'), [], [checkElement]);

  return ts.createLogicalAnd(createIsArray(value), checkElements);
};

export const createIsObject = (value: ts.Expression): ts.Expression =>
  ts.createParen(
    ts.createLogicalAnd(
      ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral('object')),
      ts.createStrictInequality(value, ts.createNull()),
    ),
  );
