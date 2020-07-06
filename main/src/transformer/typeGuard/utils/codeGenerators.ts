import { ExpressionTransformer, ObjectTypeDescriptor, TypeGuardGenerator, TypeName } from '../../types';
import {
  createArrayEvery,
  createArrayFrom,
  createIsArray,
  createIsInstanceOf,
  createIsNotNullOrUndefined,
  createIsNotPrimitive,
  createLogicalAndChain,
  createLogicalOrChain,
  createObjectKeys,
} from '../../utils/codeGenerators';
import ts from 'typescript';

export const createArrayTypeGuard = (value: ts.Expression, createElementCheck: ExpressionTransformer): ts.Expression =>
  createLogicalAndChain(createIsArray(value), createArrayEvery(value, createElementCheck));

export const createSetTypeGuard = (value: ts.Expression, createElementCheck: ExpressionTransformer): ts.Expression => {
  const setValues = ts.createCall(ts.createPropertyAccess(value, 'values'), [], []);
  const setValuesAsArray = createArrayFrom(setValues);
  const elementChecks = createArrayEvery(setValuesAsArray, createElementCheck);

  return createLogicalAndChain(createIsInstanceOf(value, ts.createIdentifier('Set')), elementChecks);
};

export const createMapTypeGuard = (
  value: ts.Expression,
  createKeyCheck: ExpressionTransformer,
  createValueCheck: ExpressionTransformer,
): ts.Expression => {
  const mapEntries = ts.createCall(ts.createPropertyAccess(value, 'entries'), [], []);
  const mapEntriesAsArray = createArrayFrom(mapEntries);

  const entryChecks = createArrayEvery(
    mapEntriesAsArray,
    (entry) =>
      createLogicalAndChain(
        createKeyCheck(ts.createElementAccess(entry, 0)),
        createValueCheck(ts.createElementAccess(entry, 1)),
      ),
    'entry',
  );

  return createLogicalAndChain(createIsInstanceOf(value, ts.createIdentifier('Map')), entryChecks);
};

export const createTupleTypeGuard = (
  value: ts.Expression,
  length: number,
  createElementCheck: (value: ts.Expression, index: number) => ts.Expression,
): ts.Expression => {
  const arrayLengthCheck = ts.createStrictEquality(ts.createPropertyAccess(value, 'length'), ts.createLiteral(length));
  const elementChecks = Array.from({ length }).map((_, index) =>
    createElementCheck(ts.createElementAccess(value, index), index),
  );

  return createLogicalAndChain(createIsArray(value), arrayLengthCheck, ...elementChecks);
};

const createIsNotNumeric = (value: ts.Expression): ts.Expression =>
  createLogicalAndChain(
    ts.createCall(ts.createIdentifier('isNaN'), [], [ts.createCall(ts.createIdentifier('parseFloat'), [], [value])]),
    ts.createStrictInequality(value, ts.createLiteral('NaN')),
  );

export const createObjectTypeGuard = (
  value: ts.Expression,
  { properties, numberIndexType, stringIndexType }: ObjectTypeDescriptor,
  typeGuardGenerator: TypeGuardGenerator,
): ts.Expression => {
  const objectKeys = createObjectKeys(value);
  const basicTypeGuard =
    stringIndexType || numberIndexType ? createIsNotPrimitive(value) : createIsNotNullOrUndefined(value);

  const propertyChecks = properties.map(({ type, accessor }) =>
    typeGuardGenerator(type, ts.createElementAccess(value, accessor)),
  );

  const indexPropertyChecks =
    stringIndexType || numberIndexType
      ? [
          createArrayEvery(
            objectKeys,
            (key: ts.Expression) => {
              const propertyValue = ts.createElementAccess(value, key);
              const numberPropertyCheck = numberIndexType
                ? createLogicalOrChain(createIsNotNumeric(key), typeGuardGenerator(numberIndexType, propertyValue))
                : undefined;

              const stringPropertyCheck = stringIndexType
                ? typeGuardGenerator(stringIndexType, propertyValue)
                : undefined;

              const checks: ts.Expression[] = [numberPropertyCheck, stringPropertyCheck].filter(
                Boolean,
              ) as ts.Expression[];

              return createLogicalAndChain(...checks);
            },
            'key',
          ),
        ]
      : [];

  return createLogicalAndChain(basicTypeGuard, ...propertyChecks, ...indexPropertyChecks);
};
