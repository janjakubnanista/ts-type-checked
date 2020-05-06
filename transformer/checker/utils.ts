import { InterfaceTypeDescriptor, TypeName } from '../types';
import ts from 'typescript';

const parenthesize = (expressions: ts.Expression[]): ts.Expression[] =>
  expressions.map<ts.Expression>((expression) =>
    ts.isCallExpression(expression) ? expression : ts.createParen(expression),
  );

export const createLogicalAndChain = (...expressions: ts.Expression[]): ts.Expression => {
  return parenthesize(expressions).reduce((chain, expression) => ts.createLogicalAnd(chain, expression));
};

export const createLogicalOrChain = (...expressions: ts.Expression[]): ts.Expression => {
  return parenthesize(expressions).reduce((chain, expression) => ts.createLogicalOr(chain, expression));
};

export const createIsOfType = (value: ts.Expression, type: ts.Expression): ts.Expression =>
  ts.createStrictEquality(ts.createTypeOf(value), type);

export const createIsInstanceOf = (value: ts.Expression, className: ts.Expression) =>
  ts.createBinary(value, ts.SyntaxKind.InstanceOfKeyword, className);

export const createDoubleNegation = (value: ts.Expression): ts.Expression =>
  ts.createPrefix(ts.SyntaxKind.ExclamationToken, ts.createPrefix(ts.SyntaxKind.ExclamationToken, value));

// See
//
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#object-type
//
// for more information
export const createIsNotPrimitive = (value: ts.Expression): ts.Expression => {
  return createLogicalOrChain(
    createIsOfType(value, ts.createLiteral('function')),
    createLogicalAndChain(createIsOfType(value, ts.createLiteral('object')), createDoubleNegation(value)),
  );
};

export const createValueCheckFunction = (
  comparison: (valueNode: ts.Identifier) => ts.ConciseBody,
  parameterName = 'value',
): ts.ArrowFunction => {
  const value: ts.Identifier = ts.createIdentifier(parameterName);

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

export const createObjectPropertiesCheck = (
  value: ts.Expression,
  descriptor: InterfaceTypeDescriptor,
  propertyCheck: (typeName: TypeName, value: ts.Expression) => ts.Expression,
): ts.Expression => {
  const propertiesCheck = descriptor.properties.length
    ? descriptor.properties
        .map<ts.Expression>((propertyDescriptor) =>
          ts.createParen(
            propertyCheck(propertyDescriptor.type, ts.createElementAccess(value, propertyDescriptor.accessor)),
          ),
        )
        .reduce((expression, propertyCheck) => ts.createLogicalAnd(expression, propertyCheck))
    : undefined;

  // TODO Maybe return undefined instead of createTrue()
  if (!descriptor.stringIndexType) return propertiesCheck || ts.createTrue();

  const propertyMapIdentifier = ts.createIdentifier('properties');

  // Map of explicitly defined properties
  const propertyMap = ts.createVariableStatement(
    undefined /* modifiers */,
    ts.createVariableDeclarationList(
      [
        ts.createVariableDeclaration(
          propertyMapIdentifier,
          undefined,
          ts.createObjectLiteral(
            descriptor.properties.map((propertyDescriptor) => {
              return ts.createPropertyAssignment(
                ts.createComputedPropertyName(propertyDescriptor.accessor),
                ts.createTrue(),
              );
            }),
            true,
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );

  // The Object.keys(value) call
  const objectKeysCall = ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Object'), 'keys'), [], [value]);

  // Callback parameter for the .every(key => {}) call
  const key = ts.createIdentifier('key');

  // value[key] access
  const valueForKey = ts.createElementAccess(value, key);

  const stringIndexTypeCheck = propertyCheck(descriptor.stringIndexType, valueForKey);
  const checkProperty = createValueCheckFunction((key) =>
    ts.createBlock([
      propertyMap,

      // If the property has been defined explicitly then we skip it
      ts.createIf(ts.createElementAccess(propertyMapIdentifier, key), ts.createReturn(ts.createTrue())),

      // If it is an indexed property then it is checked using the checks above
      ts.createReturn(stringIndexTypeCheck),
    ]),
  );

  return ts.createCall(ts.createPropertyAccess(objectKeysCall, 'every'), [], [checkProperty]);
};
