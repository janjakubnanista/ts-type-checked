import { Expression, Node, Program, SourceFile, TransformationContext, TypeNode, visitEachChild } from 'typescript';
import { Logger, isOurCallExpression, isOurImportExpression } from './utils';

export type ValueTypeCheckCreator = (type: TypeNode, value: Expression, logger?: Logger) => Expression;

function visitNode(node: SourceFile, program: Program, typeCheckValue: ValueTypeCheckCreator): SourceFile;
function visitNode(node: Node, program: Program, typeCheckValue: ValueTypeCheckCreator): Node | undefined;
function visitNode(node: Node, program: Program, typeCheckValue: ValueTypeCheckCreator): Node | undefined {
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
    return typeCheckValue(typeNode, valueNode);
  }

  return node;
}

export function visitNodeAndChildren(
  node: SourceFile,
  program: Program,
  context: TransformationContext,
  typeCheckValue: ValueTypeCheckCreator,
): SourceFile;
export function visitNodeAndChildren(
  node: Node,
  program: Program,
  context: TransformationContext,
  typeCheckValue: ValueTypeCheckCreator,
): Node | undefined;
export function visitNodeAndChildren(
  node: Node,
  program: Program,
  context: TransformationContext,
  typeCheckValue: ValueTypeCheckCreator,
): Node | undefined {
  return visitEachChild(
    visitNode(node, program, typeCheckValue),
    childNode => visitNodeAndChildren(childNode, program, context, typeCheckValue),
    context,
  );
}
