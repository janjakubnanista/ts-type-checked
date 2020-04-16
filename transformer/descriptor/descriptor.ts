import { Logger, typeFlags } from '../utils';
import { ObjectTypePropertyDescriptor, TypeDescriptor, TypeDescriptorMap, TypeName, TypeNameGenerator } from './types';
import { isArrayType, isFunctionType, isObjectType, isTupleType } from '../checks';
import ts from 'typescript';

export const createTypeDescriber = (
  logger: Logger,
  typeChecker: ts.TypeChecker,
): [TypeNameGenerator, TypeDescriptorMap] => {
  const resolvedTypeNames: Map<ts.Type, TypeName> = new Map();
  const resolvedTypeDescriptors: TypeDescriptorMap = new Map();

  function getUniqueTypeName(typeName: TypeName): TypeName {
    const reservedNames = Array.from(resolvedTypeNames.values());

    let uniqueTypeName = typeName;
    let attempt = 1;
    while (reservedNames.includes(uniqueTypeName)) {
      uniqueTypeName = typeName + '~' + attempt++;
    }

    return uniqueTypeName;
  }

  function describeType(root: ts.TypeNode, type: ts.Type): TypeName {
    const resolvedTypeName = resolvedTypeNames.get(type);
    if (resolvedTypeName) return resolvedTypeName;

    const rawTypeName = typeChecker.typeToString(type, root);
    const uniqueTypeName = getUniqueTypeName(rawTypeName);

    resolvedTypeNames.set(type, uniqueTypeName);
    resolvedTypeDescriptors.set(uniqueTypeName, resolveType(root, type));

    return uniqueTypeName;
  }

  function resolveType(root: ts.TypeNode, type: ts.Type): TypeDescriptor {
    const typeName = typeChecker.typeToString(type, root);
    logger('Type', typeName, typeFlags(type).join(', '));

    if (isArrayType(typeChecker, type, root)) {
      logger('\tArray type');

      const elementType = (type as ts.TypeReference).typeArguments?.[0];
      if (!elementType) {
        const errorMessage = `Unable to find array element type for type '${typeName}'. This happened while creating a check for '${root.getText()}'`;

        throw new Error(errorMessage);
      }

      return {
        _type: 'array',
        type: describeType(root, elementType),
      };
    }

    if (type.isClass()) {
      logger('\tClass type');

      return {
        _type: 'object',
        constructorName: typeName,
        properties: [],
      };
    }

    if (type.isLiteral()) {
      logger('\tLiteral type');

      return {
        _type: 'literal',
        value: ts.createLiteral(type.value),
      };
    }

    if (
      type.flags & ts.TypeFlags.BooleanLiteral ||
      type.flags & ts.TypeFlags.Undefined ||
      type.flags & ts.TypeFlags.Null
    ) {
      logger('\ttrue, false, undefined, null');

      return {
        _type: 'literal',
        value: ts.createIdentifier(typeName),
      };
    }

    if (type.flags & ts.TypeFlags.Boolean || type.flags & ts.TypeFlags.Number || type.flags & ts.TypeFlags.String) {
      logger('\tboolean, number, string');

      return {
        _type: 'primitive',
        value: ts.createLiteral(typeName),
      };
    }

    if (type.isUnion()) {
      logger('\tUnion type');

      return {
        _type: 'union',
        types: type.types.map(type => describeType(root, type)),
      };
    }

    if (type.isIntersection()) {
      logger('\tIntersection type');

      return {
        _type: 'intersection',
        types: type.types.map(type => describeType(root, type)),
      };
    }

    if (isFunctionType(typeChecker, type, root)) {
      logger('\tFunction');

      return {
        _type: 'primitive',
        value: ts.createLiteral('function'),
      };
    }

    if (isTupleType(typeChecker, type, root)) {
      logger('\tTuple');

      const types = (type as ts.TupleType).typeArguments || [];

      return {
        _type: 'tuple',
        types: types.map(type => describeType(root, type)),
      };
    }

    if (isObjectType(typeChecker, type, root)) {
      logger('\tObject');

      const properties: ObjectTypePropertyDescriptor[] = type.getProperties().map(property => {
        const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, root);
        const propertyAccessor: ts.Expression =
          ts.isPropertySignature(property.valueDeclaration) && ts.isComputedPropertyName(property.valueDeclaration.name)
            ? property.valueDeclaration.name.expression
            : ts.createStringLiteral(property.name);

        return {
          _type: 'property',
          accessor: propertyAccessor,
          type: describeType(root, propertyType),
        };
      });

      return {
        _type: 'object',
        properties,
      };
    }

    // This one should most probably always be one of the last ones or the last one
    // since it's the most permissive one
    if (type.flags & ts.TypeFlags.Any) {
      logger('\tAny');

      return {
        _type: 'unspecified',
      };
    }

    // Rather than silently failing we throw an exception here to let the people in charge know
    // that this type check is not supported. This might happen if the passed type is e.g. a generic type parameter
    const errorMessage = `Could not create type checker for type '${typeName}'. This happened while creating a check for '${root.getText()}'`;

    throw new Error(errorMessage);
  }

  return [describeType, resolvedTypeDescriptors];
};
