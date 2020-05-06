import { InterfaceTypeDescriptor, TypeName } from '../types';
import {
  createIsNotPrimitive,
  createIsOfType,
  createLogicalAndChain,
  createLogicalOrChain,
  createValueCheckFunction,
} from './utils';
import ts from 'typescript';

export type CreateObjectPropertyCheck = (typeName: TypeName, value: ts.Expression) => ts.Expression;

const createIsNotNullOrUndefined = (value: ts.Expression): ts.Expression =>
  createLogicalAndChain(
    ts.createStrictInequality(value, ts.createIdentifier('undefined')),
    ts.createStrictInequality(value, ts.createNull()),
  );

// interface      -> everything except for null & undefined
// - Object       -> everything except for null & undefined
// object         -> everything but number, string, boolean, symbol, null, or undefined
// Indexed        -> everything but number, string, boolean, symbol, null, or undefined
// - Record       -> everything but number, string, boolean, symbol, null, or undefined
export const createObjectTypeCheck = (
  value: ts.Expression,
  { callable, properties, stringIndexType }: InterfaceTypeDescriptor,
  createObjectPropertyCheck: CreateObjectPropertyCheck,
): ts.Expression => {
  const propertyChecks = properties.map((property) =>
    createObjectPropertyCheck(property.type, ts.createElementAccess(value, property.accessor)),
  );

  const objectKeys = ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Object'), 'keys'), [], [value]);
  const basicTypeCheck = callable
    ? createIsOfType(value, ts.createLiteral('function'))
    : stringIndexType
    ? createIsNotPrimitive(value)
    : createIsNotNullOrUndefined(value);
  const indexPropertyChecks = stringIndexType
    ? [
        ts.createCall(
          ts.createPropertyAccess(objectKeys, 'every'),
          [],
          [
            createValueCheckFunction((key) => {
              const propertyValue = ts.createElementAccess(value, key);
              const propertyCheck = createObjectPropertyCheck(stringIndexType, propertyValue);
              const explicitPropertyCheck = properties.length
                ? createLogicalOrChain(...properties.map(({ accessor }) => ts.createStrictEquality(accessor, key)))
                : undefined;

              if (explicitPropertyCheck) {
                return ts.createBlock([
                  ts.createIf(explicitPropertyCheck, ts.createBlock([ts.createReturn(ts.createTrue())])),
                  ts.createReturn(propertyCheck),
                ]);
              }

              return propertyCheck;
            }, 'key'),
          ],
        ),
      ]
    : [];

  return createLogicalAndChain(basicTypeCheck, ...propertyChecks, ...indexPropertyChecks);
};
