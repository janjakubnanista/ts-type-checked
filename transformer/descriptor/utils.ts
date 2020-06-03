import { Logger } from '../logger';
import { PropertyTypeDescriptor, TypeDescriptor, TypeName } from '../types';
import { typeFlags } from '../utils';
import ts from 'typescript';

type TypeDescriptorName =
  | 'Array'
  | 'BigInt'
  | 'Date'
  | 'Number'
  | 'String'
  | 'Boolean'
  | 'Object'
  | 'Function'
  | 'Promise'
  | 'Map'
  | 'Set';

const typeDescriptorNameBySymbolName: Record<string, TypeDescriptorName> = {
  Array: 'Array',
  ReadonlyArray: 'Array',
  BigInt: 'BigInt',
  Number: 'Number',
  Function: 'Function',
  Date: 'Date',
  String: 'String',
  Boolean: 'Boolean',
  Object: 'Object',
  Promise: 'Promise',
  Map: 'Map',
  Set: 'Set',
};

const functionTypeWarning = (typeName: string) => `

It looks like you are trying to type check a function-like value (${typeName}). 
Due to very nature of JavaScript it's not possible to see what the return type of a function is
or what the signature of a function was.

ts-type-checked can only check whether something is of type function, nothing more. Sorry :(

`;

const getFirstValidDeclaration = (declarations: ts.Declaration[] | undefined): ts.Declaration | undefined => {
  return (
    declarations?.find(
      (declaration) => !ts.isVariableDeclaration(declaration) && !ts.isFunctionDeclaration(declaration),
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
    logger.warn(
      `

It looks like you are trying to type check a Promise-like value (${typeName}). 
Although possible, type checking Promises is discouraged in favour of wrapping the value in a new Promise:

const certainlyPromise = Promise.resolve(value);

Check https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise for more information.

`,
    );

    return (resolve) => {
      const properties: PropertyTypeDescriptor[] = type.getProperties().map((property) => {
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
        properties,
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
      const properties: PropertyTypeDescriptor[] = type.getProperties().map((property) => {
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
        numberIndexType: numberIndexType ? resolve(scope, numberIndexType) : undefined,
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
