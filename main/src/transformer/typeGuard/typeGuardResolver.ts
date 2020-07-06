import { TypeGuardGenerator, TypeGuardResolver, TypeNameResolver } from '../types';
import ts from 'typescript';

export const createTypeGuardResolver = (
  program: ts.Program,
  typeNameResolver: TypeNameResolver,
  typeGuardGenerator: TypeGuardGenerator,
): TypeGuardResolver => {
  const typeChecker = program.getTypeChecker();

  const typeGuardResolver = (typeNode: ts.TypeNode, value: ts.Expression): ts.Expression => {
    // Step 1: Get type from TypeNode
    const type = typeChecker.getTypeFromTypeNode(typeNode);

    // Step 2: Resolve the type descriptor
    const typeName = typeNameResolver(typeNode, type);

    // Step 3: Turn the type descriptor into a type guard
    const typeGuard = typeGuardGenerator(typeName, value);

    // Step 4: RETURN!!!
    return typeGuard;
  };

  return typeGuardResolver;
};
