import { ASTVisitor, TypeGuardResolver } from '../types';
import { createSingleParameterFunction } from '../utils/codeGenerators';
import { isOurCallExpression, isOurImportExpression } from './assertions';
import ts from 'typescript';

/**
 * Factory for ASTVisitor that replaces occurrences of isA and typeCheckFor
 * with generated type guards
 *
 * This visitor inspects the code and uses the typeGuardResolver to generate the type guards
 *
 * @param typeChecker {ts.TypeChecker} Instance of TypeChecker
 * @param typeGuardResolver {TypeCheckFactory} Function that turns a type into a type guard expression
 */
export const createTypeCheckVisitor = (
  typeChecker: ts.TypeChecker,
  typeGuardResolver: TypeGuardResolver,
): ASTVisitor => {
  return (node: ts.Node) => {
    // All the imports from this module are fake so we need to remove them all
    if (isOurImportExpression(node)) return undefined;

    if (isOurCallExpression(node, 'isA', typeChecker)) {
      const typeNode = node.typeArguments?.[0];
      if (!typeNode) {
        throw new Error('isA<T>() requires one type parameter, none specified');
      }

      const valueNode = node.arguments[0];
      if (!valueNode) {
        throw new Error('isA<T>() requires one argument, none specified');
      }

      return typeGuardResolver(typeNode, valueNode);
    }

    if (isOurCallExpression(node, 'typeCheckFor', typeChecker)) {
      const typeNode = node.typeArguments?.[0];
      if (!typeNode) {
        throw new Error('typeCheckFor<T>() requires one type parameter, none specified');
      }

      return createSingleParameterFunction((value) => typeGuardResolver(typeNode, value));
    }

    return node;
  };
};
