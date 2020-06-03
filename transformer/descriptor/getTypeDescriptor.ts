import { Logger } from '../logger';
import { TypeDescriptor, TypeNameResolver } from '../types';
import { functionTypeWarning, promiseTypeWarning } from './messages';
import { getDOMElementClassName } from './getDOMElementClassName';
import { getLibraryTypeDescriptorName } from './getLibraryTypeDescriptorName';
import { getPropertyTypeDescriptors } from './getPropertyTypeDescriptors';
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

  // BigInt
  if (type.flags & ts.TypeFlags.BigInt || libraryDescriptorName === 'BigInt') {
    logger.debug('BigInt');

    return { _type: 'keyword', value: 'bigint' };
  }

  // Boolean
  if (type.flags & ts.TypeFlags.Boolean || libraryDescriptorName === 'Boolean') {
    logger.debug('Boolean');

    return { _type: 'keyword', value: 'boolean' };
  }

  // Number
  if (type.flags & ts.TypeFlags.Number || libraryDescriptorName === 'Number') {
    logger.debug('Number');

    return { _type: 'keyword', value: 'number' };
  }

  // String
  if (type.flags & ts.TypeFlags.String || libraryDescriptorName === 'String') {
    logger.debug('String');

    return { _type: 'keyword', value: 'string' };
  }

  // Date
  if (libraryDescriptorName === 'Date') {
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
  if (libraryDescriptorName === 'Promise') {
    logger.warn(promiseTypeWarning(typeName));

    return (resolve) => {
      return {
        _type: 'promise',
        properties: getPropertyTypeDescriptors(typeChecker, scope, type, resolve),
      };
    };
  }

  // Literal types
  if (type.isLiteral() || type.flags & ts.TypeFlags.BigIntLiteral) {
    logger.debug('Literal');

    const value = (type as ts.LiteralType).value;
    if (value === undefined) {
      throw new Error('Could not find value for a literal type ' + typeName);
    }

    return { _type: 'literal', value: ts.createLiteral(value) };
  }

  // Null
  if (type.flags & ts.TypeFlags.Null) return { _type: 'literal', value: ts.createNull() };

  // Undefined, Void
  if (type.flags & ts.TypeFlags.Undefined || type.flags & ts.TypeFlags.Void) {
    logger.debug('Undefined');

    return { _type: 'literal', value: ts.createIdentifier('undefined') };
  }

  // Any
  if (type.flags & ts.TypeFlags.Any || type.flags & ts.TypeFlags.Unknown) return { _type: 'unspecified' };

  // Never
  if (type.flags & ts.TypeFlags.Never) return { _type: 'never' };

  // For the checks below we need access to the TypeNode for this type
  const typeNode = typeChecker.typeToTypeNode(type, scope);

  if (typeNode?.kind === ts.SyntaxKind.ObjectKeyword) {
    logger.debug('object (keyword)');

    return { _type: 'keyword', value: 'object' };
  }

  // True
  if (typeNode?.kind === ts.SyntaxKind.TrueKeyword) return { _type: 'literal', value: ts.createTrue() };

  // False
  if (typeNode?.kind === ts.SyntaxKind.FalseKeyword) return { _type: 'literal', value: ts.createFalse() };

  // Tuple
  if (typeNode?.kind === ts.SyntaxKind.TupleType) {
    logger.debug('Tuple');

    const typeArguments = (type as ts.TypeReference).typeArguments || [];

    return (resolve) => ({
      _type: 'tuple',
      types: typeArguments.map((type) => resolve(scope, type)) || [],
    });
  }

  // Function
  if (
    typeNode?.kind === ts.SyntaxKind.FunctionType ||
    typeNode?.kind === ts.SyntaxKind.ConstructorType ||
    libraryDescriptorName === 'Function' ||
    type.getConstructSignatures()?.length
  ) {
    logger.debug('Function');
    logger.info(functionTypeWarning(typeName));

    return { _type: 'keyword', value: 'function' };
  }

  // Array
  if (
    typeNode?.kind === ts.SyntaxKind.ArrayType ||
    libraryDescriptorName === 'Array' ||
    (typeChecker as any)?.isArrayType(type)
  ) {
    logger.debug('Array');

    const elementType = (type as ts.TypeReference).typeArguments?.[0];
    if (!elementType) {
      throw new Error('Could not find element type for (apparently) array type ' + typeName);
    }

    return (resolve) => ({ _type: 'array', type: resolve(scope, elementType) });
  }

  // Map
  if (libraryDescriptorName === 'Map') {
    const [keyType, valueType] = (type as ts.TypeReference).typeArguments || [];
    if (!keyType) {
      throw new Error('Could not find key type for (apparently) Map type ' + typeName);
    }

    if (!valueType) {
      throw new Error('Could not find value type for (apparently) Map type ' + typeName);
    }

    return (resolve) => ({ _type: 'map', keyType: resolve(scope, keyType), valueType: resolve(scope, valueType) });
  }

  // Set
  if (libraryDescriptorName === 'Set') {
    const [setType] = (type as ts.TypeReference).typeArguments || [];
    if (!setType) {
      throw new Error('Could not find key type for (apparently) Set type ' + typeName);
    }

    return (resolve) => ({ _type: 'set', type: resolve(scope, setType) });
  }

  const domElementClassName = getDOMElementClassName(program, type);
  if (domElementClassName) {
    return { _type: 'class', value: ts.createIdentifier(domElementClassName) };
  }

  // Interface-ish
  if (type.flags & ts.TypeFlags.Object || libraryDescriptorName === 'Object') {
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
