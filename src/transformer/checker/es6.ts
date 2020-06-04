import { createIsInstanceOf, createLogicalAndChain, createValueCheckFunction } from './utils';
import ts from 'typescript';

const createArrayFromIterator = (value: ts.Expression): ts.Expression =>
  ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'from'), [], [value]);

export type CreateSetElementCheck = (value: ts.Expression) => ts.Expression;

export const createSetTypeCheck = (value: ts.Expression, createElementCheck: CreateSetElementCheck): ts.Expression => {
  const setValues = ts.createCall(ts.createPropertyAccess(value, 'values'), [], []);
  const setValuesAsArray = createArrayFromIterator(setValues);

  const elementChecks = ts.createCall(
    ts.createPropertyAccess(setValuesAsArray, 'every'),
    [],
    [createValueCheckFunction(createElementCheck)],
  );

  return createLogicalAndChain(createIsInstanceOf(value, ts.createIdentifier('Set')), elementChecks);
};

export const createMapTypeCheck = (
  value: ts.Expression,
  createKeyCheck: CreateSetElementCheck,
  createValueCheck: CreateSetElementCheck,
): ts.Expression => {
  const mapEntries = ts.createCall(ts.createPropertyAccess(value, 'entries'), [], []);
  const mapEntriesAsArray = createArrayFromIterator(mapEntries);

  const entryChecks = ts.createCall(
    ts.createPropertyAccess(mapEntriesAsArray, 'every'),
    [],
    [
      createValueCheckFunction(
        (entry) =>
          createLogicalAndChain(
            createKeyCheck(ts.createElementAccess(entry, 0)),
            createValueCheck(ts.createElementAccess(entry, 1)),
          ),
        'entry',
      ),
    ],
  );

  return createLogicalAndChain(createIsInstanceOf(value, ts.createIdentifier('Map')), entryChecks);
};
