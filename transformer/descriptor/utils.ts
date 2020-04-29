import { Logger } from '../logger';
import { PropertyTypeDescriptor, TypeDescriptor, TypeName } from '../types';
import { typeFlags } from '../utils';
import ts from 'typescript';

type TypeDescriptorName =
  | 'array'
  | 'bigint'
  | 'date'
  | 'number'
  | 'string'
  | 'boolean'
  | 'object'
  | 'function'
  | 'promise'
  | 'map'
  | 'set';

const typeDescriptorNameBySymbolName: Record<string, TypeDescriptorName> = {
  Array: 'array',
  ReadonlyArray: 'array',
  BigInt: 'bigint',
  Number: 'number',
  Function: 'function',
  Date: 'date',
  String: 'string',
  Boolean: 'boolean',
  Object: 'object',
  Promise: 'promise',
  Map: 'map',
  Set: 'set',
};

const getFirstValidDeclaration = (declarations: ts.Declaration[] | undefined): ts.Declaration | undefined => {
  return (
    declarations?.find(
      declaration => !ts.isVariableDeclaration(declaration) && !ts.isFunctionDeclaration(declaration),
    ) || declarations?.[0]
  );
};

export const getLibraryTypeDescriptorName = (program: ts.Program, type: ts.Type): TypeDescriptorName | undefined => {
  const declaration = getFirstValidDeclaration(type.symbol?.declarations);
  const sourceFile = declaration?.getSourceFile();

  if (!sourceFile || !program.isSourceFileDefaultLibrary(sourceFile)) return undefined;

  return typeDescriptorNameBySymbolName[type.symbol?.name];
};

export const getDOMElementClassName = (program: ts.Program, type: ts.Type): string | undefined => {
  if (!type.isClassOrInterface()) return undefined;

  const declaration = getFirstValidDeclaration(type.symbol?.declarations);
  const sourceFile = declaration?.getSourceFile();

  if (!sourceFile || !program.isSourceFileDefaultLibrary(sourceFile)) return undefined;
  if (!sourceFile.fileName.match(/lib.dom.d.ts$/)) return undefined;
  if (!type.symbol?.name.match(/(Element|^Document|^Node)$/i)) return undefined;

  return type.symbol.name;
};

export type ResolveTypeDescriptor<T = TypeDescriptor> = (resolve: (scope: ts.TypeNode, type: ts.Type) => TypeName) => T;

export const getTypeDescriptor = (
  logger: Logger,
  program: ts.Program,
  type: ts.Type,
  scope: ts.TypeNode,
): TypeDescriptor | ResolveTypeDescriptor => {
  const libraryDescriptorName = getLibraryTypeDescriptorName(program, type);
  logger.debug('Library descriptor name', libraryDescriptorName);

  // BigInt
  if (type.flags & ts.TypeFlags.BigInt || libraryDescriptorName === 'bigint') {
    logger.debug('BigInt');

    return { _type: 'primitive', value: ts.createLiteral('bigint') };
  }

  // Boolean
  if (type.flags & ts.TypeFlags.Boolean || libraryDescriptorName === 'boolean') {
    logger.debug('Boolean');

    return { _type: 'primitive', value: ts.createLiteral('boolean') };
  }

  // Number
  if (type.flags & ts.TypeFlags.Number || libraryDescriptorName === 'number') {
    logger.debug('Number');

    return { _type: 'primitive', value: ts.createLiteral('number') };
  }

  // String
  if (type.flags & ts.TypeFlags.String || libraryDescriptorName === 'string') {
    logger.debug('String');

    return { _type: 'primitive', value: ts.createLiteral('string') };
  }

  // Union
  if (type.isUnion()) {
    logger.debug('Union type');

    return resolve => ({
      _type: 'union',
      types: type.types.map(type => resolve(scope, type)),
    });
  }

  // Intersection
  if (type.isIntersection()) {
    logger.debug('Intersection type');

    return resolve => ({
      _type: 'intersection',
      types: type.types.map(type => resolve(scope, type)),
    });
  }

  // Grab an instance of TypeChecker
  //
  // We do this as late as possible, in this case we need the type name
  // for error messages below
  const typeChecker = program.getTypeChecker();
  const typeName = typeChecker.typeToString(type, scope);

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

  // For the checks below we need access to the TypeNode for this type
  const typeNode = typeChecker.typeToTypeNode(type, scope);

  if (typeNode?.kind === ts.SyntaxKind.ObjectKeyword || libraryDescriptorName === 'object') {
    logger.debug('Object (keyword)');

    return { _type: 'object' };
  }

  // True
  if (typeNode?.kind === ts.SyntaxKind.TrueKeyword) return { _type: 'literal', value: ts.createTrue() };

  // False
  if (typeNode?.kind === ts.SyntaxKind.FalseKeyword) return { _type: 'literal', value: ts.createFalse() };

  // Tuple
  if (typeNode?.kind === ts.SyntaxKind.TupleType) {
    logger.debug('Tuple');

    const typeArguments = (type as ts.TypeReference).typeArguments || [];

    return resolve => ({
      _type: 'tuple',
      types: typeArguments.map(type => resolve(scope, type)) || [],
    });
  }

  // Function
  if (
    typeNode?.kind === ts.SyntaxKind.FunctionType ||
    typeNode?.kind === ts.SyntaxKind.ConstructorType ||
    libraryDescriptorName === 'function' ||
    type.getConstructSignatures()?.length
  ) {
    logger.debug('Function');

    return { _type: 'primitive', value: ts.createLiteral('function') };
  }

  // Array
  if (
    typeNode?.kind === ts.SyntaxKind.ArrayType ||
    libraryDescriptorName === 'array' ||
    (typeChecker as any)?.isArrayType(type)
  ) {
    logger.debug('Array');

    const elementType = (type as ts.TypeReference).typeArguments?.[0];
    if (!elementType) {
      throw new Error('Could not find element type for (apparently) array type ' + typeName);
    }

    return resolve => ({ _type: 'array', type: resolve(scope, elementType) });
  }

  // Map
  if (libraryDescriptorName === 'map') {
    const [keyType, valueType] = (type as ts.TypeReference).typeArguments || [];
    if (!keyType) {
      throw new Error('Could not find key type for (apparently) Map type ' + typeName);
    }

    if (!valueType) {
      throw new Error('Could not find value type for (apparently) Map type ' + typeName);
    }

    return resolve => ({ _type: 'map', keyType: resolve(scope, keyType), valueType: resolve(scope, valueType) });
  }

  // Set
  if (libraryDescriptorName === 'set') {
    const [setType] = (type as ts.TypeReference).typeArguments || [];
    if (!setType) {
      throw new Error('Could not find key type for (apparently) Set type ' + typeName);
    }

    return resolve => ({ _type: 'set', type: resolve(scope, setType) });
  }

  // Date
  if (libraryDescriptorName === 'date') {
    return { _type: 'class', value: ts.createIdentifier('Date') };
  }

  // Promise
  if (libraryDescriptorName === 'promise') {
    logger.warn(
      `

It looks like you are trying to type check a Promise-like value (${typeName}). 
Although possible, type checking Promises is discouraged in favour of wrapping the value in a new Promise:

const certainlyPromise = Promise.resolve(value);

Check https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise for more information.

`,
    );

    return { _type: 'promise' };
  }

  const domElementClassName = getDOMElementClassName(program, type);
  if (domElementClassName) {
    return { _type: 'class', value: ts.createIdentifier(domElementClassName) };
  }

  // Interface-ish
  if (type.flags & ts.TypeFlags.Object) {
    const callable = type.getCallSignatures()?.length !== 0;

    return resolve => {
      const stringIndexType = type.getStringIndexType();
      const properties: PropertyTypeDescriptor[] = type.getProperties().map(property => {
        const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, scope);
        const accessor: ts.Expression = getPropertyAccessor(property);

        return {
          _type: 'property',
          accessor,
          type: resolve(scope, propertyType),
        };
      });

      return {
        _type: 'interface',
        callable,
        properties,
        stringIndexType: stringIndexType ? resolve(scope, stringIndexType) : undefined,
      };
    };
  }

  throw new Error(
    'oh noooooo no type descriptor for ' + typeChecker.typeToString(type) + ' ' + typeFlags(type).join(', '),
  );
};

function getPropertyAccessor(property: ts.Symbol): ts.Expression {
  return ts.isPropertySignature(property.valueDeclaration) && ts.isComputedPropertyName(property.valueDeclaration.name)
    ? property.valueDeclaration.name.expression
    : ts.createStringLiteral(property.name);
}

export function getUniqueTypeName(typeName: TypeName, takenNames: string[]): TypeName {
  let uniqueTypeName = typeName;
  let attempt = 1;
  while (takenNames.includes(uniqueTypeName)) {
    uniqueTypeName = typeName + '~' + attempt++;
  }

  return uniqueTypeName;
}
