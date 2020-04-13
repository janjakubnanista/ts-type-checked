import ts from 'typescript';

export const isArrayType = (typeChecker: ts.TypeChecker, type: ts.Type, root?: ts.TypeNode): boolean => {
  // I believe this is the only hack in the whole codebase
  //
  // This API is marked as internal in TypeScript compiler
  // const isArrayType = (type: ts.Type): boolean => (typeChecker as any).isArrayType?.(type) || false;
  if (typeof (typeChecker as any).isArrayType === 'function') {
    return (typeChecker as any).isArrayType(type) || false;
  }

  const typeNode = typeChecker.typeToTypeNode(type, root);
  return !!typeNode && ts.isArrayTypeNode(typeNode);
};

// The "object" keyword type is also not very keen to be detected using the Type based API
// and needs to be converted to TypeNode in order to be detected
export const isObjectType = (typeChecker: ts.TypeChecker, type: ts.Type, root?: ts.TypeNode): boolean => {
  if (type.flags & ts.TypeFlags.Object) return true;

  const typeNode = typeChecker.typeToTypeNode(type, root);
  return typeNode?.kind === ts.SyntaxKind.ObjectKeyword;
};

// The "object" keyword type is also not very keen to be detected using the Type based API
// and needs to be converted to TypeNode in order to be detected
export const isFunctionType = (typeChecker: ts.TypeChecker, type: ts.Type, root?: ts.TypeNode): boolean => {
  const typeNode = typeChecker.typeToTypeNode(type, root);
  return typeNode?.kind === ts.SyntaxKind.FunctionType;
};
