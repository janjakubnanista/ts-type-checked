import ts from 'typescript';

export type FunctionBodyCreator<T extends ts.Identifier[]> = (...args: T) => ts.ConciseBody;

/**
 * Helper function to create an arrow function with one argument
 *
 * @example
 * ```
 * // If we create the function like this
 * const arrowFunction = createSingleParameterFunction(
 *   (argument) => ts.createStrictEquality(argument, ts.createNull())
 * );
 *
 * // The generated code will look like this
 * (value) => value === null;
 * ```
 *
 * @example
 * ```
 * // Sometimes the argument name would shadow a variable from parent scope
 * // In those case we can rename it to something else than 'value'
 * const arrowFunction = createSingleParameterFunction(
 *   (argument) => ts.createStrictEquality(argument, ts.createNull()),
 *   'element'
 * );
 *
 * // The generated code will look like this
 * (element) => element === null;
 * ```
 *
 * @param body {FunctionBodyCreator<[ts.Identifier]>} Function that accepts the argument identifier and returns the function body
 * @param argumentName {String} [value] Name of the function argument
 */
export const createSingleParameterFunction = (
  body: FunctionBodyCreator<[ts.Identifier]>,
  argumentName = 'value',
): ts.ArrowFunction => {
  const argument: ts.Identifier = ts.createIdentifier(argumentName);

  return ts.createArrowFunction(
    /* modifiers */ undefined,
    /* typeParameters */ undefined,
    [
      ts.createParameter(
        /* decorators */ undefined,
        /* modifiers */ undefined,
        /* dotDotDotToken */ undefined,
        /* name */ argument,
      ),
    ],
    undefined,
    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    body(argument),
  );
};

/**
 * Helper function for accessing object properties
 *
 * @example
 * ```
 * const identifier = ts.createIdentifier('obj');
 *
 * const accessKey = createElementAccess(identifier, 'property');
 * const accessElement = createElementAccess(identifier, 1);
 *
 * // The generated code will look like this
 * obj['property']
 * obj[1]
 * ```
 *
 * @param value {ts.Expression} The object which property should be accessed
 * @param property {String | Number} The property name / element index
 */
export const createElementAccess = (value: ts.Expression, property: string | number): ts.Expression =>
  ts.createElementAccess(value, ts.createLiteral(property.toString()));

export const createObjectWithProperties = (properties: ts.PropertyAssignment[]): ts.Expression =>
  ts.createObjectLiteral(properties, true);

export const createVariable = (identifier: ts.Identifier, initializer: ts.Expression): ts.Statement =>
  ts.createVariableStatement(undefined, [ts.createVariableDeclaration(identifier, undefined, initializer)]);

export const createArrayEvery = (
  value: ts.Expression,
  body: FunctionBodyCreator<[ts.Identifier]>,
  callbackArgumentName = 'element',
): ts.Expression =>
  ts.createCall(
    ts.createPropertyAccess(value, 'every'),
    [],
    [createSingleParameterFunction(body, callbackArgumentName)],
  );

export const createArrayFrom = (value: ts.Expression): ts.Expression =>
  ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'from'), [], [value]);

export const createIsArray = (value: ts.Expression): ts.Expression =>
  ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'), [], [value]);

export const createObjectKeys = (value: ts.Expression): ts.Expression =>
  ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Object'), 'keys'), [], [value]);

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

export const createIsInstanceOf = (value: ts.Expression, className: ts.Expression): ts.Expression =>
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

export const createIsNotNullOrUndefined = (value: ts.Expression): ts.Expression =>
  createLogicalAndChain(
    ts.createStrictInequality(value, ts.createIdentifier('undefined')),
    ts.createStrictInequality(value, ts.createNull()),
  );

export const createRequire = (identifier: ts.Identifier, path: string, property = 'default'): ts.Statement =>
  createVariable(
    identifier,
    ts.createPropertyAccess(
      ts.createCall(ts.createIdentifier('require'), undefined, [ts.createLiteral(path)]),
      property,
    ),
  );
