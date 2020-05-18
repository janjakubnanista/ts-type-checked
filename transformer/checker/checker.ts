import { TypeCheckCreator, TypeCheckMapCreator, TypeDescriptor, TypeDescriptorMap, TypeName } from '../types';
import { createArrayTypeCheck } from './array';
import {
  createIsInstanceOf,
  createIsNotPrimitive,
  createLogicalAndChain,
  createLogicalOrChain,
  createValueCheckFunction,
} from './utils';
import { createMapTypeCheck, createPromiseTypeCheck, createSetTypeCheck } from './es6';
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
    const typeChecks: ts.PropertyAssignment[] = Array.from(typeCheckFunctionMap.entries()).map((entry) =>
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
    if (typeCheckFunctionMap.has(typeName)) {
      return ts.createElementAccess(typeCheckMapIdentifier, ts.createLiteral(typeName));
    }

    // TODO This is a bit hacky and could be solved in prettier way
    //
    // What is happening here is that we need to remember the fact that we are creating
    // a check for "typeName" so that if that type is recursive we will not keep spinning in dependency circles
    typeCheckFunctionMap.set(typeName, ts.createFalse());
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

      case 'keyword':
        switch (typeDescriptor.value) {
          case 'object':
            return createIsNotPrimitive(value);

          default:
            return ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral(typeDescriptor.value));
        }

      case 'intersection':
        const intersectionTypeCheckMethod = createTypeCheckFunction(typeName, (value) =>
          createLogicalAndChain(
            ...typeDescriptor.types.map<ts.Expression>((typeName) => createTypeCheck(typeName, value)),
          ),
        );

        return ts.createCall(intersectionTypeCheckMethod, undefined, [value]);

      case 'union':
        const unionTypeCheckMethod = createTypeCheckFunction(typeName, (value) =>
          createLogicalOrChain(
            ...typeDescriptor.types.map<ts.Expression>((typeName) => createTypeCheck(typeName, value)),
          ),
        );

        return ts.createCall(unionTypeCheckMethod, undefined, [value]);

      case 'array':
        return createArrayTypeCheck(value, (element) => createTypeCheck(typeDescriptor.type, element));

      case 'tuple':
        return createTupleTypeCheck(value, typeDescriptor.types.length, (element, index) => {
          return createTypeCheck(typeDescriptor.types[index], element);
        });

      case 'class':
        return createIsInstanceOf(value, typeDescriptor.value);

      case 'map':
        return createMapTypeCheck(
          value,
          (key) => createTypeCheck(typeDescriptor.keyType, key),
          (value) => createTypeCheck(typeDescriptor.valueType, value),
        );

      case 'set':
        return createSetTypeCheck(value, (element) => createTypeCheck(typeDescriptor.type, element));

      case 'promise':
        return createPromiseTypeCheck(value);

      case 'interface':
        const objectTypeCheckMethod = createTypeCheckFunction(typeName, (value) =>
          createObjectTypeCheck(value, typeDescriptor, createTypeCheck),
        );

        return ts.createCall(objectTypeCheckMethod, undefined, [value]);

      case 'unspecified':
        return ts.createTrue();

      case 'never':
        return ts.createFalse();

      default:
        throw new Error('Unable to create a checker for type descriptor ' + (typeDescriptor as TypeDescriptor)._type);
    }
  };

  return [createTypeCheck, createTypeCheckMapStatement];
};
