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

type StrictNullChecksPrefixer = (typeGuard: ts.Expression, value: ts.Expression) => ts.Expression;

export const createTypeGuardGenerator = (
  typeGuardRegistry: TypeGuardRegistry,
  typeDescriptorRegistry: TypeDescriptorRegistry,
  strictNullChecks: boolean,
): TypeGuardGenerator => {
  // If the strict null checks are off (which they shouldn't),
  // the optional types all pretend to be non-optional
  // so we need to make sure every type can also be null or undefined
  const prefixNullChecks: StrictNullChecksPrefixer = strictNullChecks
    ? // If strictNullChecks are on just return the original type guard
      (typeGuard) => typeGuard
    : // But if they are off prepend every type guard with check for null or undefined
      (typeGuard, value): ts.Expression => {
        return createLogicalOrChain(
          ts.createStrictEquality(value, ts.createNull()),
          ts.createStrictEquality(value, ts.createIdentifier('undefined')),
          typeGuard,
        );
      };

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
    //
    // In this step we need to prefix all applicable type guards
    // with null checks bypass (see above)
    switch (typeDescriptor._type) {
      case 'literal':
        return prefixNullChecks(ts.createStrictEquality(value, typeDescriptor.value), value);

      case 'keyword':
        switch (typeDescriptor.value) {
          case 'object':
            return prefixNullChecks(createIsNotPrimitive(value), value);

          default:
            return prefixNullChecks(
              ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral(typeDescriptor.value)),
              value,
            );
        }

      case 'intersection':
        const intersectionTypeCheckMethod = typeGuardRegistry.create(typeName, (value) =>
          prefixNullChecks(
            createLogicalAndChain(
              ...typeDescriptor.types.map<ts.Expression>((typeName) => typeGuardGenerator(typeName, value)),
            ),
            value,
          ),
        );

        return ts.createCall(intersectionTypeCheckMethod, undefined, [value]);

      case 'union':
        const unionTypeCheckMethod = typeGuardRegistry.create(typeName, (value) =>
          prefixNullChecks(
            createLogicalOrChain(
              ...typeDescriptor.types.map<ts.Expression>((typeName) => typeGuardGenerator(typeName, value)),
            ),
            value,
          ),
        );

        return ts.createCall(unionTypeCheckMethod, undefined, [value]);

      case 'array':
        return prefixNullChecks(
          createArrayTypeGuard(value, (element) => typeGuardGenerator(typeDescriptor.type, element)),
          value,
        );

      case 'tuple':
        return prefixNullChecks(
          createTupleTypeGuard(value, typeDescriptor.types.length, (element, index) => {
            return typeGuardGenerator(typeDescriptor.types[index], element);
          }),
          value,
        );

      case 'class':
        return prefixNullChecks(createIsInstanceOf(value, typeDescriptor.value), value);

      case 'map':
        return prefixNullChecks(
          createMapTypeGuard(
            value,
            (key) => typeGuardGenerator(typeDescriptor.keyType, key),
            (value) => typeGuardGenerator(typeDescriptor.valueType, value),
          ),
          value,
        );

      case 'set':
        return prefixNullChecks(
          createSetTypeGuard(value, (element) => typeGuardGenerator(typeDescriptor.type, element)),
          value,
        );

      case 'promise':
        const promiseTypeCheckMethod = typeGuardRegistry.create('Promise', (value) =>
          prefixNullChecks(
            createObjectTypeGuard(value, { properties: typeDescriptor.properties }, typeGuardGenerator),
            value,
          ),
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
          prefixNullChecks(
            createLogicalAndChain(functionTypeCheck, createObjectTypeGuard(value, typeDescriptor, typeGuardGenerator)),
            value,
          ),
        );

        return ts.createCall(functionTypeCheckMethod, undefined, [value]);

      case 'interface':
        const objectTypeCheckMethod = typeGuardRegistry.create(typeName, (value) =>
          prefixNullChecks(createObjectTypeGuard(value, typeDescriptor, typeGuardGenerator), value),
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
