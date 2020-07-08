import * as assert from './utils/assert';
import { Logger } from '../utils/logger';
import { TypeDescriptor } from '../types';
import { TypeDescriptorGenerator, TypeDescriptorGeneratorCallback, TypeNameResolver } from '../types';
import { functionTypeWarning, promiseTypeWarning } from './utils/messages';
import { getDOMElementClassName } from './utils/getDOMElementClassName';
import { getLibraryTypeDescriptorName } from './utils/getLibraryTypeDescriptorName';
import { getPropertyTypeDescriptors } from './utils/getPropertyTypeDescriptors';
import ts from 'typescript';

/**
 * A factory for TypeDescriptorGenerator functions.
 *
 * TypeDescriptorGenerator functions accept a TypeNode and a Type and spit out
 * a TypeDescriptor (if the type is simple) or a TypeDescriptorGeneratorCallback if the type
 * contains nested types that also need to be resolved into a TypeDescriptor.
 *
 * We want to be able to intercept the calls to TypeDescriptorGenerator in order to break dependency cycles
 * so it can't just call itself when it needs to resolve a nested type, instead it returns
 * a TypeDescriptorGeneratorCallback which gives this function access to
 *
 * @param program {ts.Program} A TypeScript Program instance
 * @param logger {Logger} An instance of Logger to use
 */
export const createTypeDescriptorGenerator = (program: ts.Program, logger: Logger): TypeDescriptorGenerator => (
  scope: ts.TypeNode,
  type: ts.Type,
): TypeDescriptor | TypeDescriptorGeneratorCallback => {
  const typeChecker = program.getTypeChecker();
  const libraryDescriptorName = getLibraryTypeDescriptorName(program, type);

  // BigInt
  if (assert.isBigInt(type, libraryDescriptorName)) {
    logger.debug('BigInt');

    return { _type: 'keyword', value: 'bigint' };
  }

  // Boolean
  if (assert.isBoolean(type, libraryDescriptorName)) {
    logger.debug('Boolean');

    return { _type: 'keyword', value: 'boolean' };
  }

  // Number
  if (assert.isNumber(type, libraryDescriptorName)) {
    logger.debug('Number');

    return { _type: 'keyword', value: 'number' };
  }

  // String
  if (assert.isString(type, libraryDescriptorName)) {
    logger.debug('String');

    return { _type: 'keyword', value: 'string' };
  }

  // Symbol
  if (assert.isSymbol(type, libraryDescriptorName)) {
    logger.debug('Symbol');

    return { _type: 'keyword', value: 'symbol' };
  }

  // Date
  if (assert.isDate(type, libraryDescriptorName)) {
    logger.debug('Date');

    return { _type: 'class', value: ts.createIdentifier(libraryDescriptorName) };
  }

  // RegExp
  if (assert.isRegExp(type, libraryDescriptorName)) {
    logger.debug('RegExp');

    return { _type: 'class', value: ts.createIdentifier(libraryDescriptorName) };
  }

  // Null
  if (assert.isNull(type)) return { _type: 'literal', value: ts.createNull() };

  // Undefined, Void
  if (assert.isUndefined(type)) {
    logger.debug('Undefined');

    return { _type: 'literal', value: ts.createIdentifier('undefined') };
  }

  // Any
  if (assert.isAny(type)) return { _type: 'unspecified' };

  // Never
  if (assert.isNever(type)) return { _type: 'never' };

  // For the checks below we need access to the TypeNode for this type
  const typeNode = typeChecker.typeToTypeNode(type, scope);
  const typeName = typeChecker.typeToString(type, scope);

  // True
  if (assert.isTrueKeyword(typeNode)) return { _type: 'literal', value: ts.createTrue() };

  // False
  if (assert.isFalseKeyword(typeNode)) return { _type: 'literal', value: ts.createFalse() };

  // Promise
  //
  // Checking promises is not precise - it is not possible to type-check
  // the resolution value. A warning is printed notifying the consumer about this.
  if (assert.isPromise(type, libraryDescriptorName)) {
    logger.debug('Promise');
    logger.warn(promiseTypeWarning(typeName));

    return (resolve: TypeNameResolver) => ({
      _type: 'promise',
      properties: getPropertyTypeDescriptors(typeChecker, scope, type.getProperties(), resolve),
    });
  }

  // Literal types
  if (assert.isLiteral(type)) {
    logger.debug('Literal');

    const value = (type as ts.LiteralType).value;
    if (value === undefined) {
      throw new Error('Could not find value for a literal type ' + typeName);
    }

    return { _type: 'literal', value: ts.createLiteral(value) };
  }

  // Intersection
  if (assert.isIntersection(type, typeNode)) {
    logger.debug('Intersection type');

    return (resolve: TypeNameResolver) => ({
      _type: 'intersection',
      types: type.types.map((type) => resolve(scope, type)),
    });
  }

  // Union
  if (assert.isUnion(type, typeNode)) {
    logger.debug('Union type');

    return (resolve: TypeNameResolver) => ({
      _type: 'union',
      types: type.types.map((type) => resolve(scope, type)),
    });
  }

  // object
  if (assert.isObjectKeyword(typeNode)) {
    logger.debug('object (keyword)');

    return { _type: 'keyword', value: 'object' };
  }

  // Tuple
  if (assert.isTuple(type, typeNode)) {
    logger.debug('Tuple');

    const typeArguments = type.typeArguments || [];

    return (resolve: TypeNameResolver) => ({
      _type: 'tuple',
      types: typeArguments.map((type) => resolve(scope, type)),
    });
  }

  // Function
  if (assert.isFunction(type, libraryDescriptorName, typeNode)) {
    logger.debug('Function');
    logger.info(functionTypeWarning(typeName));

    const numberIndexType = type.getNumberIndexType();
    const stringIndexType = type.getStringIndexType();

    // If the type refers to Function library type we need to skip property checks
    // since properties of Function include e.g. apply, call or bind which are all of type Function.
    // Leaving them in would create an infinite loop.
    //
    // This though is not unsafe since checking whether typeof value === 'function'
    // is enough to be certain that these properties exist.
    //
    // If the type refers to e.g. a function literal we use type.getProperties()
    // which will only return the explicitly defined properties (skipping apply, call, bind etc)
    const properties: ts.Symbol[] = libraryDescriptorName === 'Function' ? [] : type.getProperties();

    return (resolve: TypeNameResolver) => ({
      _type: 'function',
      properties: getPropertyTypeDescriptors(typeChecker, scope, properties, resolve),
      numberIndexType: numberIndexType ? resolve(scope, numberIndexType) : undefined,
      stringIndexType: stringIndexType ? resolve(scope, stringIndexType) : undefined,
    });
  }

  // Array
  if (assert.isArray(typeChecker, type, libraryDescriptorName, typeNode)) {
    logger.debug('Array');

    const elementType = type.typeArguments?.[0];
    if (!elementType) {
      throw new Error('Could not find element type for (apparently) array type ' + typeName);
    }

    return (resolve: TypeNameResolver) => ({ _type: 'array', type: resolve(scope, elementType) });
  }

  // Map
  if (assert.isMap(type, libraryDescriptorName)) {
    logger.debug('Map');

    const [keyType, valueType] = type.typeArguments || [];
    if (!keyType) {
      throw new Error('Could not find key type for (apparently) Map type ' + typeName);
    }

    if (!valueType) {
      throw new Error('Could not find value type for (apparently) Map type ' + typeName);
    }

    return (resolve: TypeNameResolver) => ({
      _type: 'map',
      keyType: resolve(scope, keyType),
      valueType: resolve(scope, valueType),
    });
  }

  // Set
  if (assert.isSet(type, libraryDescriptorName)) {
    logger.debug('Set');

    const [setType] = type.typeArguments || [];
    if (!setType) {
      throw new Error('Could not find key type for (apparently) Set type ' + typeName);
    }

    return (resolve: TypeNameResolver) => ({ _type: 'set', type: resolve(scope, setType) });
  }

  // DOM Element / Node
  const domElementClassName = getDOMElementClassName(program, type);
  if (domElementClassName) {
    logger.debug('DOM');

    return { _type: 'class', value: ts.createIdentifier(domElementClassName) };
  }

  // Interface-ish
  if (assert.isInterface(type, libraryDescriptorName)) {
    logger.debug('Interface');

    const numberIndexType = type.getNumberIndexType();
    const stringIndexType = type.getStringIndexType();

    return (resolve: TypeNameResolver) => ({
      _type: 'interface',
      properties: getPropertyTypeDescriptors(typeChecker, scope, type.getApparentProperties(), resolve),
      numberIndexType: numberIndexType ? resolve(scope, numberIndexType) : undefined,
      stringIndexType: stringIndexType ? resolve(scope, stringIndexType) : undefined,
    });
  }

  throw new Error('Unable to describe type ' + typeName);
};
