import { TypeCheckCreator, TypeCheckMapCreator, TypeDescriptor, TypeDescriptorMap, TypeName } from '../types';
import { createArrayTypeCheck } from './array';
import { createLogicalAndChain, createLogicalOrChain, createValueCheckFunction } from './utils';
import { createObjectTypeCheck } from './object';
import { createTupleTypeCheck } from './tuple';
import ts from 'typescript';

export const createTypeChecker = (
  typeCheckMapIdentifier: ts.Identifier,
  typeDescriptorMap: TypeDescriptorMap,
): [TypeCheckCreator, TypeCheckMapCreator] => {
  // const typeCheckMapIdentfifier: ts.Identifier = ts.createIdentifier('__isA');
  const typeCheckFunctionMap: Map<TypeName, ts.Expression> = new Map();

  const createTypeCheckMapStatement: TypeCheckMapCreator = () => {
    const typeChecks: ts.PropertyAssignment[] = Array.from(typeCheckFunctionMap.entries()).map(entry =>
      ts.createPropertyAssignment(ts.createLiteral(entry[0]), entry[1]),
    );

    return ts.createVariableStatement(/* modifiers */ undefined, [
      ts.createVariableDeclaration(
        typeCheckMapIdentifier,
        /* type */ undefined,
        ts.createObjectLiteral(/* properties */ typeChecks, /* multiline */ true),
      ),
    ]);
  };

  const createTypeCheckFunction = (
    typeName: TypeName,
    creator: (value: ts.Identifier) => ts.Expression,
  ): ts.Expression => {
    const existingTypeCheckMethod = typeCheckFunctionMap.get(typeName);
    if (existingTypeCheckMethod) return existingTypeCheckMethod;

    typeCheckFunctionMap.set(typeName, createValueCheckFunction(creator));

    return ts.createElementAccess(typeCheckMapIdentifier, ts.createLiteral(typeName));
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
        return createLogicalAndChain(
          ...typeDescriptor.types.map<ts.Expression>(typeName => createTypeCheck(typeName, value)),
        );

      case 'union':
        return createLogicalOrChain(
          ...typeDescriptor.types.map<ts.Expression>(typeName => createTypeCheck(typeName, value)),
        );

      case 'array':
        return createArrayTypeCheck(value, element => createTypeCheck(typeDescriptor.type, element));

      case 'tuple':
        return createTupleTypeCheck(value, typeDescriptor.types.length, (element, index) => {
          return createTypeCheck(typeDescriptor.types[index], element);
        });

      case 'object':
        const typeCheckMethod = createTypeCheckFunction(typeName, value =>
          createObjectTypeCheck(value, typeDescriptor.properties, typeDescriptor.stringIndexType, createTypeCheck),
        );

        return ts.createCall(typeCheckMethod, undefined, [value]);

      case 'unspecified':
        return ts.createTrue();

      default:
        throw new Error('Unable to create a checker for type descriptor ' + (typeDescriptor as TypeDescriptor)._type);
    }
  };

  return [createTypeCheck, createTypeCheckMapStatement];
};
