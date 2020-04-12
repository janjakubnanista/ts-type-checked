import {
  FunctionExpression,
  Identifier,
  Program,
  PropertyAssignment,
  SourceFile,
  TransformationContext,
  TransformerFactory,
  TypeNode,
  createIdentifier,
  createPropertyAssignment,
} from 'typescript';
import { addTypeCheckerMap, createArrayElementsCheck, createTypeCheckerFunction, typeFlags } from './utils';
import { createLogger } from './logger';
import { visitNodeAndChildren } from './visitor';
import ts from 'typescript';

interface TypeCheckMethod {
  name: string;
  definition: FunctionExpression;
}

export default (program: Program): TransformerFactory<SourceFile> => {
  return (context: TransformationContext) => (file: SourceFile) => {
    const typeChecker = program.getTypeChecker();
    const typeCheckerObjectIdentfifier: Identifier = createIdentifier('__typeCheckerMap__');
    const typeCheckMethods: Map<ts.Type, TypeCheckMethod> = new Map();

    const isArrayType = (type: ts.Type): boolean => (typeChecker as any).isArrayType?.(type) || false;

    // // Main type check generator method
    // const createTypeCheckMethodDefinition = (typeNode: TypeNode): FunctionExpression => {
    //   if (ts.isTypeReferenceNode(typeNode) || ts.isTypeLiteralNode(typeNode)) {
    //     return createTypeCheckerFunction(value => {
    //       // First we check whether the thing is an object
    //       const isObject = createIsPlainObjectCheck(value);
    //       const explicitPropertyChecks = createObjectPropertiesCheck(
    //         typeChecker,
    //         createValueTypeCheck,
    //         typeNode,
    //         value,
    //       );
    //       const indexedPropertyChecks = createObjectIndexedPropertiesCheck(
    //         typeChecker,
    //         createValueTypeCheck,
    //         typeNode,
    //         value,
    //       );

    //       if (explicitPropertyChecks && indexedPropertyChecks)
    //         return ts.createLogicalAnd(
    //           ts.createParen(isObject),
    //           ts.createLogicalAnd(ts.createParen(explicitPropertyChecks), ts.createParen(indexedPropertyChecks)),
    //         );

    //       if (explicitPropertyChecks)
    //         return ts.createLogicalAnd(ts.createParen(isObject), ts.createParen(explicitPropertyChecks));

    //       if (indexedPropertyChecks)
    //         return ts.createLogicalAnd(ts.createParen(isObject), ts.createParen(indexedPropertyChecks));

    //       return isObject;
    //     });
    //   }

    //   return createTypeCheckerFunction(() => createFalse());
    // };

    // let lastMethodId = 0;
    // const createTypeCheckMethod = (typeNode: TypeNode): TypeCheckMethod => {
    //   const name = `__${lastMethodId++}`;
    //   const defaultMethod = { name, definition: undefined };

    //   // FIXME We first need to mark this node, then create its definition to prevent recursion
    //   typeCheckMethods.set(typeNode, defaultMethod as any);

    //   const definition = createTypeCheckMethodDefinition(typeNode);
    //   const method = { name, definition };
    //   typeCheckMethods.set(typeNode, method);

    //   return method;
    // };

    // const createValueTypeCheck: ValueTypeCheckCreator = (typeNode, value, logger = createLogger()) => {
    //   const type = typeChecker.getTypeFromTypeNode(typeNode);
    //   logger('[createValueTypeCheck]', typeChecker.typeToString(type), typeNode.kind, type.flags);

    //   const node = (type as ts.TypeReference).node;
    //   logger('\tNode:', node?.kind);

    //   // // FIXME Flags look like a bitmap rather than a number
    //   // switch (type.flags) {
    //   //   case ts.TypeFlags.Any:
    //   //   case ts.TypeFlags.Unknown:
    //   //     logger('\tis any');
    //   //     break;

    //   //   case ts.TypeFlags.String:
    //   //   case ts.TypeFlags.Boolean:
    //   //   case ts.TypeFlags.Number:
    //   //     logger('\tis typeofable');
    //   //     break;

    //   //   case ts.TypeFlags.Intersection:
    //   //     logger('\tis intersection');
    //   //     break;

    //   //   case ts.TypeFlags.Union:
    //   //     logger('\tis union');
    //   //     break;
    //   // }

    //   // Checks for any/unknown types
    //   if (hasNoConstraint(typeNode)) {
    //     return ts.createTrue();
    //   }

    //   // Checks for types that can be asserted using the "typeof" keyword
    //   const typeOfNode = getTypeOf(typeNode);
    //   if (typeOfNode) {
    //     return ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral(typeOfNode));
    //   }

    //   // Checks for any kind of literal
    //   // - true / false
    //   // - null
    //   // - undefined
    //   // - "string literal"
    //   const literal = getLiteral(typeNode);
    //   if (literal) {
    //     return ts.createStrictEquality(value, literal);
    //   }

    //   // Check for an array of any kind (the element type check is created by calling )
    //   if (ts.isArrayTypeNode(typeNode)) {
    //     return createArrayElementsCheck(typeChecker, createValueTypeCheck, typeNode, value);
    //   }

    //   if (ts.isTypeReferenceNode(typeNode)) {
    //     logger('\tType reference node');
    //     if (node) {
    //       if (ts.isArrayTypeNode(node)) {
    //         logger('\t\tGot array', node.kind);
    //         return createValueTypeCheck(node, value, logger.indent());
    //       }

    //       if (ts.isArrayTypeNode(node)) {
    //         logger('\t\tGot tuple', node.kind);
    //         // return createValueTypeCheck(node, value, logger.indent());
    //       }

    //       logger('\t\tGot uneexpected', node.kind);
    //     }

    //     // const node = (type as ts.TypeReference).node;
    //     debugger;
    //   }

    //   if (ts.isTypeLiteralNode(typeNode)) {
    //     logger('\tType literal node');
    //   }

    //   if (ts.isUnionTypeNode(typeNode)) {
    //     logger('\tUnion type node');

    //     return typeNode.types
    //       .map(memberTypeNode => {
    //         return createValueTypeCheck(memberTypeNode, value, logger.indent());
    //       })
    //       .reduce((expression, unionMemberExpression) => ts.createLogicalOr(expression, unionMemberExpression));
    //   }

    //   if (type.isUnion()) {
    //     logger('\tUnion type');

    //     return type.types
    //       .map(unionMemberType => {
    //         const unionMemberTypeNode = typeChecker.typeToTypeNode(unionMemberType, typeNode);
    //         if (!unionMemberTypeNode) {
    //           throw new Error(`Could not resolve union member type node`);
    //         }

    //         return createValueTypeCheck(unionMemberTypeNode, value, logger.indent());
    //       })
    //       .reduce((expression, unionMemberExpression) => ts.createLogicalOr(expression, unionMemberExpression));
    //   }

    //   // Now the ones that will
    //   const method = typeCheckMethods.get(typeNode) || createTypeCheckMethod(typeNode);
    //   return createCall(
    //     ts.createPropertyAccess(typeCheckerObjectIdentfifier, method.name),
    //     /* typeArguments */ undefined,
    //     /* arguments */ [value],
    //   );
    // };

    const logger = createLogger('[isACallVisitor]');

    let lastMethodId = 0;
    const createTypeCheckMethod = (type: ts.Type): TypeCheckMethod => {
      const name = `__${lastMethodId++}`;
      const defaultMethod = { name, definition: undefined };

      // FIXME We first need to mark this node, then create its definition to prevent recursion
      typeCheckMethods.set(type, defaultMethod as any);

      const definition = createTypeCheckMethodDefinition(typeNode);
      const method = { name, definition };
      typeCheckMethods.set(type, method);

      return method;
    };

    const createCheckForType = (root: ts.TypeNode, type: ts.Type, value: ts.Expression): ts.Expression => {
      const typeName = typeChecker.typeToString(type, root);
      logger('Type', typeName, typeFlags(type).join(', '));

      // If the checker already exists don't make a new one, instead just call an existing one
      const typeCheck = typeCheckMethods.get(type);
      if (typeCheck) {
        return ts.createCall(ts.createPropertyAccess(typeCheckerObjectIdentfifier, typeCheck.name), undefined, [value]);
      }

      if (isArrayType(type)) {
        logger('\tArray type');

        const elementType = (type as ts.TypeReference).typeArguments?.[0];
        if (!elementType) {
          throw new Error('Unable to find element type of ' + typeName);
        }

        return createArrayElementsCheck(value, (element: ts.Expression) =>
          createCheckForType(root, elementType, element),
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
          .map(unionMemberType => createCheckForType(root, unionMemberType, value))
          .reduce((expression, comparison) => {
            return ts.createLogicalOr(expression, comparison);
          });
      }

      if (type.isIntersection()) {
        logger('\tIntersection type');

        return type.types
          .map(unionMemberType => createCheckForType(root, unionMemberType, value))
          .reduce((expression, comparison) => {
            return ts.createLogicalAnd(expression, comparison);
          });
      }

      if (type.flags & ts.TypeFlags.Object) {
        logger('\tObject');

        // Add a new entry to the global type checker map
        const methodName = `__${lastMethodId++}`;
        const defaultMethod = { name: methodName, definition: undefined };

        // Make sure that it gets inserted (albeit incomplete) before we start digging deeper into the object properties
        // otherwise we will not get rid of any possible recursion
        typeCheckMethods.set(type, defaultMethod as any);

        const methodDefinition = createTypeCheckerFunction(value => {
          const properties: ts.Symbol[] = type.getProperties();
          const checkAllProperties = properties
            .map<ts.Expression>(property => {
              const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, root);

              logger('\t\tProperty', property.getName());

              const propertyAccess = ts.createElementAccess(value, ts.createStringLiteral(property.name));
              const valueTypeCheck = createCheckForType(root, propertyType, propertyAccess);

              return ts.createParen(valueTypeCheck);
            })
            .reduce((expression, propertyCheck) => ts.createLogicalAnd(expression, propertyCheck), ts.createTrue());

          const checkIsObject = ts.createLogicalAnd(
            ts.createParen(ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral('object'))),
            ts.createParen(ts.createStrictInequality(value, ts.createNull())),
          );

          return ts.createLogicalAnd(checkIsObject, checkAllProperties);
        });

        // Finally fill in the undefined value for the method definition
        typeCheckMethods.set(type, { name: methodName, definition: methodDefinition });

        return ts.createCall(ts.createPropertyAccess(typeCheckerObjectIdentfifier, methodName), undefined, [value]);
      }

      // This one should most probably always be one of the last ones or the last one
      // since it's the most permissive one
      if (type.flags & ts.TypeFlags.Any) {
        logger('\tAny');

        return ts.createTrue();
      }

      logger('\tCould not find anything');

      // FIXME Throw an exception here
      return ts.createFalse();
    };

    const isACallVisitor = (typeNode: ts.TypeNode, value: ts.Expression): ts.Expression => {
      logger('Processing', typeNode.getFullText());

      const typeChecker = program.getTypeChecker();
      const type = typeChecker.getTypeFromTypeNode(typeNode);

      return createCheckForType(typeNode, type, value);
    };

    const transformedFile = visitNodeAndChildren(file, program, context, isACallVisitor);
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
