import { execSync } from 'child_process';
import path from 'path';
import ts from 'typescript';

const INDEX_JS = path.join(__dirname, 'index.js');
const INDEX_TS = path.join(__dirname, 'index.d.ts');
const PWD = execSync('pwd').toString();

export const isOurImportExpression = (node: ts.Node): node is ts.ImportDeclaration => {
  if (!ts.isImportDeclaration(node)) return false;

  const sourceFile = node.getSourceFile().fileName;
  const module = (node.moduleSpecifier as ts.StringLiteral).text;
  const isModulePathRelative = module.startsWith('.');
  const modulePath = isModulePathRelative ? path.resolve(path.dirname(sourceFile), module) : module;

  try {
    const resolvedPath = require.resolve(modulePath, { paths: [PWD, sourceFile] });

    return INDEX_JS === resolvedPath;
  } catch (e) {
    return false;
  }
};

const isJSDocSignature = (declaration: ts.Node | undefined): declaration is ts.JSDocSignature => {
  if (typeof ts.isJSDocSignature !== 'function') return false;
  if (!declaration) return false;

  return ts.isJSDocSignature(declaration);
};

export const isOurCallExpression = (
  node: ts.Node,
  name: string,
  typeChecker: ts.TypeChecker,
): node is ts.CallExpression => {
  if (!ts.isCallExpression(node)) return false;

  const declaration = typeChecker.getResolvedSignature(node)?.declaration;
  return (
    !!declaration &&
    // Declaration must be there
    !isJSDocSignature(declaration) &&
    // It has to come from our .d.ts definition file
    path.join(declaration.getSourceFile().fileName) === INDEX_TS &&
    // And its name must match the expected name
    declaration.name?.getText() === name
  );
};
