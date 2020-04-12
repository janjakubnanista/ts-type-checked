import { createTypeCheckerFunction, isOurCallExpression, isOurImportExpression } from './utils';
import { visitEachChild } from 'typescript';
import ts from 'typescript';

export type IsACallVisitor = (typeNode: ts.TypeNode) => ts.Expression;

function visitNode(node: ts.SourceFile, program: ts.Program, isACallVisitor: IsACallVisitor): ts.SourceFile;
function visitNode(node: ts.Node, program: ts.Program, isACallVisitor: IsACallVisitor): ts.Node | undefined;
function visitNode(node: ts.Node, program: ts.Program, isACallVisitor: IsACallVisitor): ts.Node | undefined {
  // Discard all the imports from this module
  if (isOurImportExpression(node)) {
    return;
  }

  const typeChecker = program.getTypeChecker();
  if (isOurCallExpression(node, 'isA', typeChecker)) {
    const typeNode = node.typeArguments?.[0];
    if (!typeNode) {
      throw new Error('isA<T>() requires one type parameter, none specified');
    }

    const valueNode = node.arguments[0];
    if (!valueNode) {
      throw new Error('isA<T>() requires one argument, none specified');
    }

    return ts.createCall(isACallVisitor(typeNode), [], [valueNode]);
  }

  if (isOurCallExpression(node, 'makeIsA', typeChecker)) {
    const typeNode = node.typeArguments?.[0];
    if (!typeNode) {
      throw new Error('makeIsA<T>() requires one type parameter, none specified');
    }

    return isACallVisitor(typeNode);

    // return createTypeCheckerFunction(value => {
    //   return isACallVisitor(typeNode, value);
    // });
  }

  return node;
}

export function visitNodeAndChildren(
  node: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext,
  isACallVisitor: IsACallVisitor,
): ts.SourceFile;
export function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
  isACallVisitor: IsACallVisitor,
): ts.Node | undefined;
export function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
  isACallVisitor: IsACallVisitor,
): ts.Node | undefined {
  return visitEachChild(
    visitNode(node, program, isACallVisitor),
    childNode => visitNodeAndChildren(childNode, program, context, isACallVisitor),
    context,
  );
}
