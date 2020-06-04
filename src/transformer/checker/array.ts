import { createLogicalAndChain, createValueCheckFunction } from './utils';
import ts from 'typescript';

export type CreateArrayElementCheck = (value: ts.Expression) => ts.Expression;

export const createIsArray = (value: ts.Expression): ts.Expression =>
  ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'), [], [value]);

export const createArrayTypeCheck = (
  value: ts.Expression,
  createElementCheck: CreateArrayElementCheck,
): ts.Expression => {
  const elementChecks = ts.createCall(
    ts.createPropertyAccess(value, 'every'),
    [],
    [createValueCheckFunction(createElementCheck)],
  );

  return createLogicalAndChain(createIsArray(value), elementChecks);
};
