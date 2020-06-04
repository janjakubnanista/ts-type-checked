import path from 'path';
import ts from 'typescript';

export const createValueCheckFunction = (comparison: (valueNode: ts.Identifier) => ts.Expression): ts.ArrowFunction => {
  const value: ts.Identifier = ts.createIdentifier('value');

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

const indexJs = path.join(__dirname, '..', 'index.js');
export const isOurImportExpression = (node: ts.Node): node is ts.ImportDeclaration => {
  if (!ts.isImportDeclaration(node)) return false;

  try {
    const module = (node.moduleSpecifier as ts.StringLiteral).text;
    const isModulePathRelative = module.startsWith('.');
    const resolvedPath = require.resolve(
      isModulePathRelative ? path.resolve(path.dirname(node.getSourceFile().fileName), module) : module,
    );

    return indexJs === resolvedPath;
  } catch (e) {
    return false;
  }
};

const indexTs = path.join(__dirname, '..', 'index.d.ts');
export const isOurCallExpression = (
  node: ts.Node,
  name: string,
  typeChecker: ts.TypeChecker,
): node is ts.CallExpression => {
  if (!ts.isCallExpression(node)) return false;

  const declaration = typeChecker.getResolvedSignature(node)?.declaration;
  return (
    // Declaration must be there
    !!declaration &&
    // It must not be JSDoc
    !ts.isJSDocSignature(declaration) &&
    // It has to come from our .d.ts definition file
    path.join(declaration.getSourceFile().fileName) === indexTs &&
    // And its name must match the expected name
    declaration.name?.getText() === name
  );
};

export const typeFlags = (type: ts.Type): string[] => {
  return Object.keys(ts.TypeFlags).filter((flagName) => !!((ts.TypeFlags[flagName as any] as any) & type.flags));
};

export const objectFlags = (type: ts.Type): string[] => {
  const objectFlags = (type as ts.TypeReference).objectFlags;
  if (typeof objectFlags !== 'number') return [];

  return Object.keys(ts.ObjectFlags).filter((flagName) => !!((ts.ObjectFlags[flagName as any] as any) & objectFlags));
};

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
