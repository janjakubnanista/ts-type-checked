import {
  FunctionExpression,
  Identifier,
  Program,
  PropertyAssignment,
  SourceFile,
  TransformationContext,
  TransformerFactory,
  TypeNode,
  createCall,
  createFalse,
  createIdentifier,
  createPropertyAssignment,
} from 'typescript';
import { ValueTypeCheckCreator, visitNodeAndChildren } from './visitor';
import {
  addTypeCheckerMap,
  createArrayElementsCheck,
  createIsPlainObjectCheck,
  createLogger,
  createObjectIndexedPropertiesCheck,
  createObjectPropertiesCheck,
  createTypeCheckerFunction,
  getLiteral,
  getTypeOf,
  hasNoConstraint,
} from './utils';
import ts from 'typescript';

interface TypeCheckMethod {
  name: string;
  definition: FunctionExpression;
}

export default (program: Program): TransformerFactory<SourceFile> => {
  return (context: TransformationContext) => (file: SourceFile) => {
    const typeChecker = program.getTypeChecker();
    const typeCheckerObjectIdentfifier: Identifier = createIdentifier('__typeCheckerMap__');
    const typeCheckMethods: Map<TypeNode, TypeCheckMethod> = new Map();

    // Main type check generator method
    const createTypeCheckMethodDefinition = (typeNode: TypeNode): FunctionExpression => {
      if (ts.isTypeReferenceNode(typeNode) || ts.isTypeLiteralNode(typeNode)) {
        return createTypeCheckerFunction(value => {
          // First we check whether the thing is an object
          const isObject = createIsPlainObjectCheck(value);
          const explicitPropertyChecks = createObjectPropertiesCheck(
            typeChecker,
            createValueTypeCheck,
            typeNode,
            value,
          );
          const indexedPropertyChecks = createObjectIndexedPropertiesCheck(
            typeChecker,
            createValueTypeCheck,
            typeNode,
            value,
          );

          if (explicitPropertyChecks && indexedPropertyChecks)
            return ts.createLogicalAnd(
              ts.createParen(isObject),
              ts.createLogicalAnd(ts.createParen(explicitPropertyChecks), ts.createParen(indexedPropertyChecks)),
            );

          if (explicitPropertyChecks)
            return ts.createLogicalAnd(ts.createParen(isObject), ts.createParen(explicitPropertyChecks));

          if (indexedPropertyChecks)
            return ts.createLogicalAnd(ts.createParen(isObject), ts.createParen(indexedPropertyChecks));

          return isObject;
        });
      }

      return createTypeCheckerFunction(() => createFalse());
    };

    let lastMethodId = 0;
    const createTypeCheckMethod = (typeNode: TypeNode): TypeCheckMethod => {
      const name = `__${lastMethodId++}`;
      const defaultMethod = { name, definition: undefined };

      // FIXME We first need to mark this node, then create its definition to prevent recursion
      typeCheckMethods.set(typeNode, defaultMethod as any);

      const definition = createTypeCheckMethodDefinition(typeNode);
      const method = { name, definition };
      typeCheckMethods.set(typeNode, method);

      return method;
    };

    const createValueTypeCheck: ValueTypeCheckCreator = (typeNode, value, logger = createLogger()) => {
      const type = typeChecker.getTypeFromTypeNode(typeNode);

      logger('[createValueTypeCheck]', typeChecker.typeToString(type), typeNode.kind);

      // Checks for any/unknown types
      if (hasNoConstraint(typeNode)) {
        return ts.createTrue();
      }

      // Checks for types that can be asserted using the "typeof" keyword
      const typeOfNode = getTypeOf(typeNode);
      if (typeOfNode) {
        return ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral(typeOfNode));
      }

      // Checks for any kind of literal
      // - true / false
      // - null
      // - undefined
      // - "string literal"
      const literal = getLiteral(typeNode);
      if (literal) {
        return ts.createStrictEquality(value, literal);
      }

      // Check for an array of any kind (the element type check is created by calling )
      if (ts.isArrayTypeNode(typeNode)) {
        return createArrayElementsCheck(typeChecker, createValueTypeCheck, typeNode, value);
      }

      if (ts.isTypeReferenceNode(typeNode)) {
        logger('\tType reference node');
      }

      if (ts.isTypeLiteralNode(typeNode)) {
        logger('\tType literal node');
      }

      if (ts.isUnionTypeNode(typeNode)) {
        logger('\tUnion type node');

        return typeNode.types
          .map(memberTypeNode => {
            return createValueTypeCheck(memberTypeNode, value, logger.indent());
          })
          .reduce((expression, unionMemberExpression) => ts.createLogicalOr(expression, unionMemberExpression));
      }

      if (type.isUnion()) {
        logger('\tUnion type');

        return type.types
          .map(unionMemberType => {
            const unionMemberTypeNode = typeChecker.typeToTypeNode(unionMemberType, typeNode);
            if (!unionMemberTypeNode) {
              throw new Error(`Could not resolve union member type node`);
            }

            return createValueTypeCheck(unionMemberTypeNode, value, logger.indent());
          })
          .reduce((expression, unionMemberExpression) => ts.createLogicalOr(expression, unionMemberExpression));
      }

      // Now the ones that will
      const method = typeCheckMethods.get(typeNode) || createTypeCheckMethod(typeNode);
      return createCall(
        ts.createPropertyAccess(typeCheckerObjectIdentfifier, method.name),
        /* typeArguments */ undefined,
        /* arguments */ [value],
      );
    };

    const transformedFile = visitNodeAndChildren(file, program, context, createValueTypeCheck);
    const typeCheckerProperties: PropertyAssignment[] = Array.from(typeCheckMethods.values()).map(method => {
      return createPropertyAssignment(method.name, method.definition);
    });
    const transformedFileWithTypeCheckerMap = addTypeCheckerMap(
      transformedFile,
      typeCheckerObjectIdentfifier,
      typeCheckerProperties,
    );

    return transformedFileWithTypeCheckerMap;
  };
};
