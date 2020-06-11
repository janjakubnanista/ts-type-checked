import { createValueCheckFunction, isOurCallExpression, isOurImportExpression } from './utils';
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

    return typeCheckExpressionCreator(typeNode, valueNode);
  }

  if (isOurCallExpression(node, 'typeCheckFor', typeChecker)) {
    const typeNode = node.typeArguments?.[0];
    if (!typeNode) {
      throw new Error('typeCheckFor<T>() requires one type parameter, none specified');
    }

    return createValueCheckFunction((value) => typeCheckExpressionCreator(typeNode, value));
  }

  return node;
}

export type TypeCheckExpressionCreator = (typeNode: ts.TypeNode, value: ts.Expression) => ts.Expression;

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
    (childNode) => visitNodeAndChildren(childNode, program, context, typeCheckExpressionCreator),
    context,
  );
}

const isStringTag = <K extends symbol, T extends Record<K, any>>(value: K, promise: T): value is keyof T => {
  return value === Symbol.toStringTag;
};

// const symboles: unique symbol = Symbol.toStringTag;

interface Base {
  [Symbol.toStringTag]: true;
}

type Keys<T> = {
  [K in keyof T]: K extends symbol ? K : never;
}[keyof T];

// type IsSymbolA<T> = T extends Symbol ? T[typeof Symbol.toStringTag] : never;

type M = keyof Promise<string>;

type B = Keys<Promise<string>>;

declare const promise: Promise<string>;
promise[Symbol.toStringTag];
const a = Symbol.toStringTag;
if (isStringTag(a, promise)) {
  promise[a];
}
type A = Promise<string>;
