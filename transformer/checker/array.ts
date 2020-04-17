import ts from 'typescript';

export type CreateArrayElementCheck = (value: ts.Expression, index: number | ts.Expression) => ts.Expression;

export const createIsArray = (value: ts.Expression): ts.Expression =>
  ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'), [], [value]);

export const createArrayElementsCheck = (
  value: ts.Expression,
  createElementCheck: CreateArrayElementCheck,
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
    createElementCheck(element, index),
  );

  // Now let's do value.every(<element type checker>)
  const checkElements = ts.createCall(ts.createPropertyAccess(value, 'every'), [], [checkElement]);

  return ts.createLogicalAnd(createIsArray(value), checkElements);
};

export const createArrayTypeCheck = (
  value: ts.Expression,
  createElementCheck: CreateArrayElementCheck,
): ts.Expression => {
  return ts.createLogicalAnd(createIsArray(value), createArrayElementsCheck(value, createElementCheck));
};
