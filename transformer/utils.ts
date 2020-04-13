import path from 'path';
import ts from 'typescript';

// Creates a check for indexed access properties
export const createObjectIndexedPropertiesCheck = (
  type: ts.Type,
  value: ts.Expression,
  createValueTypeCheck: (type: ts.Type, value: ts.Expression) => ts.Expression,
): ts.Expression | undefined => {
  const numberIndexType = type.getNumberIndexType();
  if (numberIndexType) {
    throw new Error(`Number-indexed records are not supported since object keys are always converted to string`);
  }

  const stringIndexType = type.getStringIndexType();
  if (!stringIndexType) return undefined;

  const properties: ts.Symbol[] = type.getProperties() || [];
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
            properties.map(property => {
              return ts.createPropertyAssignment(ts.createStringLiteral(property.getName()), ts.createTrue());
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

  // isA<StringType>(value[key])
  const stringIndexTypeCheck: ts.Expression = createValueTypeCheck(stringIndexType, valueForKey);

  const checkKey = ts.createFunctionExpression(
    undefined /* modifiers */,
    undefined /* asteriskToken */,
    undefined /* name */,
    undefined /* typeParameters */,
    [
      ts.createParameter(
        undefined /* decorators */,
        undefined /* modifiers */,
        undefined /* dotDotDotToken */,
        key /* name */,
        undefined /* questionToken */,
        undefined /* type */,
        undefined /* initializer */,
      ),
    ],
    undefined,
    ts.createBlock(
      [
        // If numberIndexTypeNode is defined we need to check whether a key is numberic
        // which in case of plain objects means the key is still a string but can be converted to a number
        propertyMap,

        // If the property has been defined explicitly then we skip it
        ts.createIf(ts.createElementAccess(propertyMapIdentifier, key), ts.createReturn(ts.createTrue())),

        // If it is an indexed property then it is checked using the checks above
        ts.createReturn(stringIndexTypeCheck),
      ],
      false,
    ),
  );

  return ts.createCall(ts.createPropertyAccess(objectKeysCall, 'every'), [], [checkKey]);
};

// Array.isArray(value) && value.every(element => isA(element))
export const createArrayElementsCheck = (
  value: ts.Expression,
  elementTypeCheck: (value: ts.Expression, index: ts.Expression) => ts.Expression,
): ts.Expression => {
  // First let's do Array.isArray(value)
  const isArray = ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'), [], [value]);

  // Then let's define a element type checker function that can be passed to Array.every
  const element = ts.createIdentifier('element');
  const index = ts.createIdentifier('index');
  const checkElement = ts.createFunctionExpression(
    undefined /* modifiers */,
    undefined /* asteriskToken */,
    undefined /* name */,
    undefined /* typeParameters */,
    [
      ts.createParameter(
        undefined /* decorators */,
        undefined /* modifiers */,
        undefined /* dotDotDotToken */,
        element /* name */,
        undefined /* questionToken */,
        undefined /* type */,
        undefined /* initializer */,
      ),
      ts.createParameter(
        undefined /* decorators */,
        undefined /* modifiers */,
        undefined /* dotDotDotToken */,
        index /* name */,
        undefined /* questionToken */,
        undefined /* type */,
        undefined /* initializer */,
      ),
    ],
    undefined,
    ts.createBlock([ts.createReturn(elementTypeCheck(element, index))], false),
  );

  // Now let's do value.every(<element type checker>)
  const checkElements = ts.createCall(ts.createPropertyAccess(value, 'every'), [], [checkElement]);

  return ts.createLogicalAnd(isArray, checkElements);
};

export const createTypeCheckerFunction = (
  comparison: (valueNode: ts.Identifier) => ts.Expression,
): ts.FunctionExpression => {
  const value: ts.Identifier = ts.createIdentifier('value');

  return ts.createFunctionExpression(
    undefined,
    undefined,
    undefined,
    undefined,
    [
      ts.createParameter(
        /* decorators */ undefined,
        /* modifiers */ undefined,
        /* dotDotDotToken */ undefined,
        /* name */ value,
        undefined,
        undefined,
        undefined,
      ),
    ],
    undefined,
    ts.createBlock([ts.createReturn(comparison(value))], false),
  );
};

const indexJs = path.join(__dirname, '..', 'index.js');
export const isOurImportExpression = (node: ts.Node): node is ts.ImportDeclaration => {
  if (!ts.isImportDeclaration(node)) {
    return false;
  }

  try {
    const module = (node.moduleSpecifier as ts.StringLiteral).text;

    return (
      indexJs ===
      (module.startsWith('.')
        ? require.resolve(path.resolve(path.dirname(node.getSourceFile().fileName), module))
        : require.resolve(module))
    );
  } catch (e) {
    return false;
  }
};

// Whether this is an actual call of arbitraryOf<T>
const indexTs = path.join(__dirname, '..', 'index.d.ts');
export const isOurCallExpression = (
  node: ts.Node,
  name: string,
  typeChecker: ts.TypeChecker,
): node is ts.CallExpression => {
  if (!ts.isCallExpression(node)) {
    return false;
  }

  const signature = typeChecker.getResolvedSignature(node);
  if (typeof signature === 'undefined') {
    return false;
  }

  const { declaration } = signature;
  return (
    !!declaration &&
    !ts.isJSDocSignature(declaration) &&
    path.join(declaration.getSourceFile().fileName) === indexTs &&
    !!declaration.name &&
    declaration.name.getText() === name
  );
};

export const isTypeReference = (type: ts.Type): type is ts.TypeReference => {
  const { node, target } = type as ts.TypeReference;

  // FIXME Maybe more checks on the target
  if (!target) return false;
  if (node && !ts.isTypeNode(node)) return false;

  return true;
};

export const typeFlags = (type: ts.Type): string[] => {
  return Object.keys(ts.TypeFlags).filter(flagName => !!((ts.TypeFlags[flagName as any] as any) & type.flags));
};
