import { TypeDescriptor, TypeName } from '../types';
import { TypeDescriptorRegistry, TypeGuardGenerator, TypeGuardRegistry } from '../types';
import {
  createArrayTypeGuard,
  createMapTypeGuard,
  createObjectTypeGuard,
  createSetTypeGuard,
  createTupleTypeGuard,
} from './utils/codeGenerators';
import {
  createIsInstanceOf,
  createIsNotPrimitive,
  createLogicalAndChain,
  createLogicalOrChain,
} from '../utils/codeGenerators';
import ts from 'typescript';

export const createTypeGuardGenerator = (
  typeGuardRegistry: TypeGuardRegistry,
  typeDescriptorRegistry: TypeDescriptorRegistry,
): TypeGuardGenerator => {
  const typeGuardGenerator: TypeGuardGenerator = (typeName: TypeName, value: ts.Expression): ts.Expression => {
    // Step 1: Check if type guard already exists for this type
    const storedTypeGuardFunction: ts.Expression | undefined = typeGuardRegistry.get(typeName);
    if (storedTypeGuardFunction) {
      return ts.createCall(storedTypeGuardFunction, [], [value]);
    }

    // Step 2: Get the TypeDescriptor for the typeName
    const typeDescriptor = typeDescriptorRegistry.get(typeName);
    if (typeDescriptor === undefined) {
      throw new Error(`Unable to find type descriptor for type '${typeName}'`);
    }

    // Step 3: Turn the TypeDescriptor into a type guard expression
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
        const intersectionTypeCheckMethod = typeGuardRegistry.create(typeName, (value) =>
          createLogicalAndChain(
            ...typeDescriptor.types.map<ts.Expression>((typeName) => typeGuardGenerator(typeName, value)),
          ),
        );

        return ts.createCall(intersectionTypeCheckMethod, undefined, [value]);

      case 'union':
        const unionTypeCheckMethod = typeGuardRegistry.create(typeName, (value) =>
          createLogicalOrChain(
            ...typeDescriptor.types.map<ts.Expression>((typeName) => typeGuardGenerator(typeName, value)),
          ),
        );

        return ts.createCall(unionTypeCheckMethod, undefined, [value]);

      case 'array':
        return createArrayTypeGuard(value, (element) => typeGuardGenerator(typeDescriptor.type, element));

      case 'tuple':
        return createTupleTypeGuard(value, typeDescriptor.types.length, (element, index) => {
          return typeGuardGenerator(typeDescriptor.types[index], element);
        });

      case 'class':
        return createIsInstanceOf(value, typeDescriptor.value);

      case 'map':
        return createMapTypeGuard(
          value,
          (key) => typeGuardGenerator(typeDescriptor.keyType, key),
          (value) => typeGuardGenerator(typeDescriptor.valueType, value),
        );

      case 'set':
        return createSetTypeGuard(value, (element) => typeGuardGenerator(typeDescriptor.type, element));

      case 'promise':
        const promiseTypeCheckMethod = typeGuardRegistry.create('Promise', (value) =>
          createObjectTypeGuard(value, { properties: typeDescriptor.properties }, typeGuardGenerator),
        );

        return ts.createCall(promiseTypeCheckMethod, undefined, [value]);

      case 'function':
        const functionTypeCheck = ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral('function'));

        // If this is just a simple function with no additional properties then return the typeof check immediately
        if (!typeDescriptor.properties.length && !typeDescriptor.stringIndexType && !typeDescriptor.numberIndexType) {
          return functionTypeCheck;
        }

        // If though the function has additional properties and/or index we need to check that
        const functionTypeCheckMethod = typeGuardRegistry.create(typeName, (value) =>
          createLogicalAndChain(functionTypeCheck, createObjectTypeGuard(value, typeDescriptor, typeGuardGenerator)),
        );

        return ts.createCall(functionTypeCheckMethod, undefined, [value]);

      case 'interface':
        const objectTypeCheckMethod = typeGuardRegistry.create(typeName, (value) =>
          createObjectTypeGuard(value, typeDescriptor, typeGuardGenerator),
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

  return typeGuardGenerator;
};
