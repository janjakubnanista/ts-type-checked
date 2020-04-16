import { isOurCallExpression, isOurImportExpression } from './utils';
import { visitEachChild } from 'typescript';
import ts from 'typescript';

function visitNode(
  node: ts.SourceFile,
  program: ts.Program,
  typeCheckExpressionCreator: TypeCheckExpressionCreator,
): ts.SourceFile;
function visitNode(
  node: ts.Node,
  program: ts.Program,
  typeCheckExpressionCreator: TypeCheckExpressionCreator,
): ts.Node | undefined;
function visitNode(
  node: ts.Node,
  program: ts.Program,
  typeCheckExpressionCreator: TypeCheckExpressionCreator,
): ts.Node | undefined {
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

    return ts.createCall(typeCheckExpressionCreator(typeNode), [], [valueNode]);
  }

  if (isOurCallExpression(node, 'typeCheckFor', typeChecker)) {
    const typeNode = node.typeArguments?.[0];
    if (!typeNode) {
      throw new Error('typeCheckFor<T>() requires one type parameter, none specified');
    }

    return typeCheckExpressionCreator(typeNode);
  }

  return node;
}

export type TypeCheckExpressionCreator = (typeNode: ts.TypeNode) => ts.Expression;

export function visitNodeAndChildren(
  node: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext,
  typeCheckExpressionCreator: TypeCheckExpressionCreator,
): ts.SourceFile;
export function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
  typeCheckExpressionCreator: TypeCheckExpressionCreator,
): ts.Node | undefined;
export function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
  typeCheckExpressionCreator: TypeCheckExpressionCreator,
): ts.Node | undefined {
  return visitEachChild(
    visitNode(node, program, typeCheckExpressionCreator),
    childNode => visitNodeAndChildren(childNode, program, context, typeCheckExpressionCreator),
    context,
  );
}
