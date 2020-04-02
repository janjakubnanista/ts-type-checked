import { Expression, Node, Program, SourceFile, TransformationContext, TypeNode, visitEachChild } from 'typescript';
import { isOurCallExpression, isOurImportExpression } from './utils';
import ts from 'typescript';

export type IsACallVisitor = (typeNode: ts.TypeNode, value: ts.Expression) => ts.Expression;

function visitNode(node: SourceFile, program: Program, isACallVisitor: IsACallVisitor): SourceFile;
function visitNode(node: Node, program: Program, isACallVisitor: IsACallVisitor): Node | undefined;
function visitNode(node: Node, program: Program, isACallVisitor: IsACallVisitor): Node | undefined {
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

    // const type = typeChecker.getTypeFromTypeNode(typeNode);
    return isACallVisitor(typeNode, valueNode);
  }

  return node;
}

export function visitNodeAndChildren(
  node: SourceFile,
  program: Program,
  context: TransformationContext,
  isACallVisitor: IsACallVisitor,
): SourceFile;
export function visitNodeAndChildren(
  node: Node,
  program: Program,
  context: TransformationContext,
  isACallVisitor: IsACallVisitor,
): Node | undefined;
export function visitNodeAndChildren(
  node: Node,
  program: Program,
  context: TransformationContext,
  isACallVisitor: IsACallVisitor,
): Node | undefined {
  return visitEachChild(
    visitNode(node, program, isACallVisitor),
    childNode => visitNodeAndChildren(childNode, program, context, isACallVisitor),
    context,
  );
}
