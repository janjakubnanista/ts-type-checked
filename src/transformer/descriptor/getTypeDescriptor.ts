import { Logger } from '../logger';
import { TypeDescriptor, TypeNameResolver } from '../types';
import { functionTypeWarning, promiseTypeWarning } from './messages';
import { getDOMElementClassName } from './getDOMElementClassName';
import { getLibraryTypeDescriptorName } from './getLibraryTypeDescriptorName';
import { getPropertyTypeDescriptors } from './getPropertyTypeDescriptors';
import {
  isAny,
  isArray,
  isBigInt,
  isBoolean,
  isDate,
  isFalseKeyword,
  isFunction,
  isInterface,
  isLiteral,
  isMap,
  isNever,
  isNull,
  isNumber,
  isObjectKeyword,
  isPromise,
  isSet,
  isString,
  isTrueKeyword,
  isTuple,
  isUndefined,
} from './assertions';
import { typeFlags } from '../utils';
import ts from 'typescript';

export type ResolveTypeDescriptor<T = TypeDescriptor> = (resolve: TypeNameResolver) => T;

export const getTypeDescriptor = (
  logger: Logger,
  program: ts.Program,
  type: ts.Type,
  scope: ts.TypeNode,
): TypeDescriptor | ResolveTypeDescriptor => {
  const libraryDescriptorName = getLibraryTypeDescriptorName(program, type);
  logger.debug('Library descriptor name', libraryDescriptorName);

  logger.info('Heyyyyyyy', typeFlags(type));

  if (type.flags & ts.TypeFlags.TypeParameter) {
    logger.info('Type parameter');

    debugger;
  }

  // BigInt
  if (isBigInt(type, libraryDescriptorName)) {
    logger.debug('BigInt');

    return { _type: 'keyword', value: 'bigint' };
  }

  // Boolean
  if (isBoolean(type, libraryDescriptorName)) {
    logger.debug('Boolean');

    return { _type: 'keyword', value: 'boolean' };
  }

  // Number
  if (isNumber(type, libraryDescriptorName)) {
    logger.debug('Number');

    return { _type: 'keyword', value: 'number' };
  }

  // String
  if (isString(type, libraryDescriptorName)) {
    logger.debug('String');

    return { _type: 'keyword', value: 'string' };
  }

  // Date
  if (isDate(type, libraryDescriptorName)) {
    logger.debug('Date');

    return { _type: 'class', value: ts.createIdentifier(libraryDescriptorName) };
  }

  // Union
  if (type.isUnion()) {
    logger.debug('Union type');

    return (resolve) => ({
      _type: 'union',
      types: type.types.map((type) => resolve(scope, type)),
    });
  }

  // Intersection
  if (type.isIntersection()) {
    logger.debug('Intersection type');

    return (resolve) => ({
      _type: 'intersection',
      types: type.types.map((type) => resolve(scope, type)),
    });
  }

  // Grab an instance of TypeChecker
  //
  // We do this as late as possible, in this case we need the type name
  // for error messages below
  const typeChecker = program.getTypeChecker();
  const typeName = typeChecker.typeToString(type, scope);

  // Promise
  if (isPromise(type, libraryDescriptorName)) {
    logger.debug('Promise');
    logger.warn(promiseTypeWarning(typeName));

    return (resolve) => ({
      _type: 'promise',
      properties: getPropertyTypeDescriptors(typeChecker, scope, type, resolve),
    });
  }

  // Literal types
  if (isLiteral(type)) {
    logger.debug('Literal');

    const value = (type as ts.LiteralType).value;
    if (value === undefined) {
      throw new Error('Could not find value for a literal type ' + typeName);
    }

    return { _type: 'literal', value: ts.createLiteral(value) };
  }

  // Null
  if (isNull(type)) return { _type: 'literal', value: ts.createNull() };

  // Undefined, Void
  if (isUndefined(type)) {
    logger.debug('Undefined');

    return { _type: 'literal', value: ts.createIdentifier('undefined') };
  }

  // Any
  if (isAny(type)) return { _type: 'unspecified' };

  // Never
  if (isNever(type)) return { _type: 'never' };

  // For the checks below we need access to the TypeNode for this type
  const typeNode = typeChecker.typeToTypeNode(type, scope);

  if (isObjectKeyword(typeNode)) {
    logger.debug('object (keyword)');

    return { _type: 'keyword', value: 'object' };
  }

  // True
  if (isTrueKeyword(typeNode)) return { _type: 'literal', value: ts.createTrue() };

  // False
  if (isFalseKeyword(typeNode)) return { _type: 'literal', value: ts.createFalse() };

  // Tuple
  if (isTuple(type, typeNode)) {
    logger.debug('Tuple');

    const typeArguments = type.typeArguments || [];

    return (resolve) => ({
      _type: 'tuple',
      types: typeArguments.map((type) => resolve(scope, type)) || [],
    });
  }

  // Function
  if (isFunction(type, libraryDescriptorName, typeNode)) {
    logger.debug('Function');
    logger.info(functionTypeWarning(typeName));

    return { _type: 'keyword', value: 'function' };
  }

  // Array
  if (isArray(typeChecker, type, libraryDescriptorName, typeNode)) {
    logger.debug('Array');

    const elementType = type.typeArguments?.[0];
    if (!elementType) {
      throw new Error('Could not find element type for (apparently) array type ' + typeName);
    }

    return (resolve) => ({ _type: 'array', type: resolve(scope, elementType) });
  }

  // Map
  if (isMap(type, libraryDescriptorName)) {
    logger.debug('Map');

    const [keyType, valueType] = type.typeArguments || [];
    if (!keyType) {
      throw new Error('Could not find key type for (apparently) Map type ' + typeName);
    }

    if (!valueType) {
      throw new Error('Could not find value type for (apparently) Map type ' + typeName);
    }

    return (resolve) => ({ _type: 'map', keyType: resolve(scope, keyType), valueType: resolve(scope, valueType) });
  }

  // Set
  if (isSet(type, libraryDescriptorName)) {
    logger.debug('Set');

    const [setType] = type.typeArguments || [];
    if (!setType) {
      throw new Error('Could not find key type for (apparently) Set type ' + typeName);
    }

    return (resolve) => ({ _type: 'set', type: resolve(scope, setType) });
  }

  const domElementClassName = getDOMElementClassName(program, type);
  if (domElementClassName) {
    logger.debug('DOM');

    return { _type: 'class', value: ts.createIdentifier(domElementClassName) };
  }

  // Interface-ish
  if (isInterface(type, libraryDescriptorName)) {
    logger.debug('Interface');

    const callable = type.getCallSignatures()?.length !== 0;
    if (callable) logger.info(functionTypeWarning(typeName));

    return (resolve) => {
      const numberIndexType = type.getNumberIndexType();
      const stringIndexType = type.getStringIndexType();

      return {
        _type: 'interface',
        callable,
        properties: getPropertyTypeDescriptors(typeChecker, scope, type, resolve),
        numberIndexType: numberIndexType ? resolve(scope, numberIndexType) : undefined,
        stringIndexType: stringIndexType ? resolve(scope, stringIndexType) : undefined,
      };
    };
  }

  throw new Error('oh noooooo no type descriptor for ' + typeChecker.typeToString(type));
};
