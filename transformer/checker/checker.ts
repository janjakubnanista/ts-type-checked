import { TypeCheckCreator, TypeDescriptorMap, TypeName } from '../types';
import ts from 'typescript';

export const createTypeChecker = (typeDescriptorMap: TypeDescriptorMap): [TypeCheckCreator] => {
  const typeCheckMapIdentfifier: ts.Identifier = ts.createIdentifier('__isA');
  const typeCheckMethods: Map<TypeName, ts.Expression> = new Map();

  const createTypeCheck = (typeName: TypeName, value: ts.Expression): ts.Expression => {
    const typeDescriptor = typeDescriptorMap.get(typeName);
    if (!typeDescriptor) {
      throw new Error('Type descriptor not found for type ' + typeName);
    }

    switch (typeDescriptor._type) {
      case 'literal':
        return ts.createStrictEquality(value, typeDescriptor.value);

      case 'primitive':
        return ts.createStrictEquality(ts.createTypeOf(value), typeDescriptor.value);

      case 'intersection':
        return typeDescriptor.types
          .map<ts.Expression>(typeName => ts.createParen(createTypeCheck(typeName, value)))
          .reduce((typeCheck, comparison) => ts.createLogicalAnd(typeCheck, comparison));

      case 'union':
        return typeDescriptor.types
          .map<ts.Expression>(typeName => ts.createParen(createTypeCheck(typeName, value)))
          .reduce((typeCheck, comparison) => ts.createLogicalOr(typeCheck, comparison));

      case 'unspecified':
        return ts.createTrue();

      default:
        // FIXME Add others
        return ts.createFalse();
    }
  };

  return [createTypeCheck];
};
