import { CreateArrayElementCheck, createIsArray } from './array';
import { createLogicalAndChain } from './utils';
import ts from 'typescript';

export const createTupleCheck = (
  value: ts.Expression,
  length: number,
  createElementCheck: CreateArrayElementCheck,
): ts.Expression => {
  const arrayLengthCheck = ts.createStrictEquality(ts.createPropertyAccess(value, 'length'), ts.createLiteral(length));
  const elementChecks = Array.from({ length }).map((_, index) =>
    createElementCheck(ts.createElementAccess(value, index)),
  );

  return createLogicalAndChain(createIsArray(value), arrayLengthCheck, ...elementChecks);
};
