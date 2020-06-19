import { TypeName } from '../types';
import { TypeNameGenerator } from '../types';
import ts from 'typescript';

export const createDebugTypeNameGenerator = (typeChecker: ts.TypeChecker): TypeNameGenerator => {
  const existingNames: Set<TypeName> = new Set();

  return (type: ts.Type): TypeName => {
    const originalTypeName = typeChecker.typeToString(type);
    let typeName = originalTypeName;
    let attempt = 1;

    while (existingNames.has(typeName)) {
      typeName = originalTypeName + '~' + ++attempt;
    }

    existingNames.add(typeName);

    return typeName;
  };
};
