import path from 'path';
import ts from 'typescript';

const INDEX_JS = path.join(__dirname, '..', '..', 'index.js');
const INDEX_TS = path.join(__dirname, '..', '..', 'index.d.ts');

export const isOurImportExpression = (node: ts.Node): node is ts.ImportDeclaration => {
  if (!ts.isImportDeclaration(node)) return false;

  try {
    const module = (node.moduleSpecifier as ts.StringLiteral).text;
    const isModulePathRelative = module.startsWith('.');
    const resolvedPath = require.resolve(
      isModulePathRelative ? path.resolve(path.dirname(node.getSourceFile().fileName), module) : module,
    );

    return INDEX_JS === resolvedPath;
  } catch (e) {
    return false;
  }
};

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
    path.join(declaration.getSourceFile().fileName) === INDEX_TS &&
    // And its name must match the expected name
    declaration.name?.getText() === name
  );
};
