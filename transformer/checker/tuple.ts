import { createIsArray } from './array';
import { createLogicalAndChain } from './utils';
import ts from 'typescript';

export type CreateTupleElementCheck = (value: ts.Expression, index: number) => ts.Expression;

export const createTupleTypeCheck = (
  value: ts.Expression,
  length: number,
  createElementCheck: CreateTupleElementCheck,
): ts.Expression => {
  const arrayLengthCheck = ts.createStrictEquality(ts.createPropertyAccess(value, 'length'), ts.createLiteral(length));
  const elementChecks = Array.from({ length }).map((_, index) =>
    createElementCheck(ts.createElementAccess(value, index), index),
  );

  return createLogicalAndChain(createIsArray(value), arrayLengthCheck, ...elementChecks);
};
