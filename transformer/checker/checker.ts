import { TypeCheckCreator, TypeCheckMapCreator, TypeDescriptorMap, TypeName } from '../types';
import {
  createArrayElementsCheck,
  createIsObject,
  createObjectPropertiesCheck,
  createTypeCheckerFunction,
} from './utils';
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

    typeCheckFunctionMap.set(typeName, createTypeCheckerFunction(creator));

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
        const typeCheckMethod = createTypeCheckFunction(typeName, value => {
          return ts.createLogicalAnd(
            createIsObject(value),
            createObjectPropertiesCheck(value, typeDescriptor, createTypeCheck),
          );
        });

        return ts.createCall(typeCheckMethod, undefined, [value]);

      case 'unspecified':
        return ts.createTrue();

      default:
        // FIXME Add others:
        // - tuple
        return ts.createFalse();
    }
  };

  return [createTypeCheck, createTypeCheckMapStatement];
};
