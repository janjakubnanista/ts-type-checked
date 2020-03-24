import path from 'path';
import ts from 'typescript';

// Create an empty object declaration
export const addTypeCheckerMap = (
  file: ts.SourceFile,
  identifier: ts.Identifier,
  properties: ts.PropertyAssignment[],
): ts.SourceFile => {
  return ts.updateSourceFileNode(file, [
    ts.createVariableStatement(/* modifiers */ undefined, [
      ts.createVariableDeclaration(
        identifier,
        /* type */ undefined,
        ts.createObjectLiteral(/* properties */ properties, /* multiline */ true),
      ),
    ]),
    ...file.statements,
  ]);
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
