import { TypeCheckCreator, TypeDescriptorMap, TypeName } from '../types';
import { createArrayElementsCheck, createTypeCheckerFunction } from './utils';
import ts from 'typescript';

export const createTypeChecker = (typeDescriptorMap: TypeDescriptorMap): [TypeCheckCreator] => {
  const typeCheckMapIdentfifier: ts.Identifier = ts.createIdentifier('__isA');
  const typeCheckMethods: Map<TypeName, ts.Expression> = new Map();

  const createTypeCheckMethod = (
    typeName: TypeName,
    creator: (value: ts.Identifier) => ts.Expression,
  ): ts.Expression => {
    const existingTypeCheckMethod = typeCheckMethods.get(typeName);
    if (existingTypeCheckMethod) return existingTypeCheckMethod;

    typeCheckMethods.set(typeName, createTypeCheckerFunction(creator));

    return ts.createElementAccess(typeCheckMapIdentfifier, ts.createLiteral(typeName));
  };

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

      case 'array':
        return createArrayElementsCheck(value, element => createTypeCheck(typeDescriptor.type, element));

      case 'object':
        const typeCheckMethod = createTypeCheckMethod(typeName, value => {
          return ts.createLiteral('oops');
        });

        return ts.createCall(typeCheckMethod, undefined, [value]);

      case 'unspecified':
        return ts.createTrue();

      default:
        // FIXME Add others:
        // - tuple
        // - object
        return ts.createFalse();
    }
  };

  return [createTypeCheck];
};
