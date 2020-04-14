import { Logger, createArrayElementsCheck, createObjectIndexedPropertiesCheck, typeFlags } from './utils';
import { PluggableTypeCheckCreator } from './types';
import { isArrayType, isFunctionType, isObjectType, isTupleType } from './checks';
import ts from 'typescript';

export const createTypeCheckCreator = (typeChecker: ts.TypeChecker, logger: Logger): PluggableTypeCheckCreator => {
  const typeCheckCreator: PluggableTypeCheckCreator = (
    root: ts.TypeNode,
    type: ts.Type,
    value: ts.Expression,
    nestedTypeCheckCreator = typeCheckCreator,
  ): ts.Expression => {
    const typeName = typeChecker.typeToString(type, root);
    logger('Type', typeName, typeFlags(type).join(', '));

    if (isArrayType(typeChecker, type, root)) {
      logger('\tArray type');

      const elementType = (type as ts.TypeReference).typeArguments?.[0];
      if (!elementType) {
        const errorMessage = `Unable to find array element type for type '${typeName}'. This happened while creating a check for '${root.getText()}'`;

        throw new Error(errorMessage);
      }

      return createArrayElementsCheck(value, (element: ts.Expression) =>
        nestedTypeCheckCreator(root, elementType, element),
      );
    }

    if (type.isClass()) {
      logger('\tClass type');

      return ts.createBinary(value, ts.SyntaxKind.InstanceOfKeyword, ts.createIdentifier(typeName));
    }

    if (type.isLiteral()) {
      logger('\tLiteral type');

      return ts.createStrictEquality(value, ts.createLiteral(type.value));
    }

    if (
      type.flags & ts.TypeFlags.BooleanLiteral ||
      type.flags & ts.TypeFlags.Undefined ||
      type.flags & ts.TypeFlags.Null
    ) {
      logger('\ttrue, false, undefined, null');

      return ts.createStrictEquality(value, ts.createIdentifier(typeName));
    }

    if (type.flags & ts.TypeFlags.Boolean || type.flags & ts.TypeFlags.Number || type.flags & ts.TypeFlags.String) {
      logger('\tboolean, number, string');

      return ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral(typeName));
    }

    if (type.isUnion()) {
      logger('\tUnion type');

      return type.types
        .map(unionMemberType => nestedTypeCheckCreator(root, unionMemberType, value))
        .reduce((expression, comparison) => {
          return ts.createLogicalOr(expression, comparison);
        });
    }

    if (type.isIntersection()) {
      logger('\tIntersection type');

      return type.types
        .map(unionMemberType => nestedTypeCheckCreator(root, unionMemberType, value))
        .reduce((expression, comparison) => {
          return ts.createLogicalAnd(expression, comparison);
        });
    }

    if (isFunctionType(typeChecker, type, root)) {
      logger('\tFunction');

      return ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral('function'));
    }

    if (isTupleType(typeChecker, type, root)) {
      logger('\tTuple');

      const isArray = ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'), [], [value]);
      const types = (type as ts.TupleType).typeArguments || [];
      const elementChecks = types
        .map<ts.Expression>((tupleType, index) => {
          const elementAccess = ts.createElementAccess(value, index);

          return ts.createParen(nestedTypeCheckCreator(root, tupleType, elementAccess));
        })
        .reduce((expression, check) => ts.createLogicalAnd(expression, check), ts.createTrue());

      return ts.createLogicalAnd(isArray, elementChecks);
    }

    if (isObjectType(typeChecker, type, root)) {
      logger('\tObject');

      const properties: ts.Symbol[] = type.getProperties();
      const checkAllProperties = properties
        .map<ts.Expression>(property => {
          const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, root);

          const propertyAccess = ts.createElementAccess(value, ts.createStringLiteral(property.name));
          const valueTypeCheck = nestedTypeCheckCreator(root, propertyType, propertyAccess);

          return ts.createParen(valueTypeCheck);
        })
        .reduce((expression, propertyCheck) => ts.createLogicalAnd(expression, propertyCheck), ts.createTrue());

      const checkIsObject = ts.createLogicalAnd(
        ts.createParen(ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral('object'))),
        ts.createParen(ts.createStrictInequality(value, ts.createNull())),
      );

      const checkIndexedProperties = createObjectIndexedPropertiesCheck(type, value, (type, value) =>
        nestedTypeCheckCreator(root, type, value),
      );

      return ts.createLogicalAnd(
        checkIsObject,
        checkIndexedProperties ? ts.createLogicalAnd(checkAllProperties, checkIndexedProperties) : checkAllProperties,
      );
    }

    // This one should most probably always be one of the last ones or the last one
    // since it's the most permissive one
    if (type.flags & ts.TypeFlags.Any) {
      logger('\tAny');

      return ts.createTrue();
    }

    // Rather than silently failing we throw an exception here to let the people in charge know
    // that this type check is not supported. This might happen if the passed type is e.g. a generic type parameter
    const errorMessage = `Could not create type checker for type '${typeName}'. This happened while creating a check for '${root.getText()}'`;

    throw new Error(errorMessage);
  };

  return typeCheckCreator;
};
