import { createIsInstanceOf, createLogicalAndChain, createValueCheckFunction } from './utils';
import ts from 'typescript';

export type CreateSetElementCheck = (value: ts.Expression) => ts.Expression;

export const createSetTypeCheck = (value: ts.Expression, createElementCheck: CreateSetElementCheck): ts.Expression => {
  const setValues = ts.createCall(ts.createPropertyAccess(value, 'values'), [], []);
  const setValuesAsArray = ts.createCall(
    ts.createPropertyAccess(ts.createIdentifier('Array'), 'from'),
    [],
    [setValues],
  );

  const elementChecks = ts.createCall(
    ts.createPropertyAccess(setValuesAsArray, 'every'),
    [],
    [createValueCheckFunction(createElementCheck)],
  );

  return createLogicalAndChain(createIsInstanceOf(value, ts.createIdentifier('Set')), elementChecks);
};

const isPropertyAFunction = (value: ts.Expression, name: string): ts.Expression =>
  ts.createStrictEquality(ts.createTypeOf(ts.createPropertyAccess(value, name)), ts.createLiteral('function'));

export const createPromiseTypeCheck = (value: ts.Expression): ts.Expression => {
  const isTruthy = ts.createPrefix(
    ts.SyntaxKind.ExclamationToken,
    ts.createPrefix(ts.SyntaxKind.ExclamationToken, value),
  );

  return createLogicalAndChain(isTruthy, isPropertyAFunction(value, 'then'), isPropertyAFunction(value, 'catch'));
};
