import { ASTVisitor } from '../types';
import { visitEachChild } from 'typescript';
import ts from 'typescript';

function visitNode(node: ts.SourceFile, visitor: ASTVisitor): ts.SourceFile;
function visitNode(node: ts.Node, visitor: ASTVisitor): ts.Node | undefined;
function visitNode(node: ts.Node, visitor: ASTVisitor): ts.Node | undefined {
  if (ts.isSourceFile(node)) return node;

  return visitor(node);
}

export function transformUsingVisitor(
  node: ts.SourceFile,
  context: ts.TransformationContext,
  visitor: ASTVisitor,
): ts.SourceFile;
export function transformUsingVisitor(
  node: ts.Node,
  context: ts.TransformationContext,
  visitor: ASTVisitor,
): ts.Node | undefined;
export function transformUsingVisitor(
  node: ts.Node,
  context: ts.TransformationContext,
  visitor: ASTVisitor,
): ts.Node | undefined {
  return visitEachChild(
    visitNode(node, visitor),
    (childNode) => transformUsingVisitor(childNode, context, visitor),
    context,
  );
}
