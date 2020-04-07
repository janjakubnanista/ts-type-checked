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
import {
  addTypeCheckerMap,
  createArrayElementsCheck,
  createIsPlainObjectCheck,
  createObjectPropertiesCheck,
  getLiteral,
  getTypeOf,
  hasNoConstraint,
  typeFlags,
} from './utils';
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
    const typeCheckMethods: Map<TypeNode, TypeCheckMethod> = new Map();

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
    // logger('TypeFlags', Object.keys(ts.TypeFlags));

    const createCheckForType = (root: ts.TypeNode, type: ts.Type, value: ts.Expression): ts.Expression => {
      logger('Type', typeChecker.typeToString(type, root), typeFlags(type).join(', '));

      if (type.flags & ts.TypeFlags.Boolean) {
        logger('\tBoolean');

        return ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral('boolean'));
      }

      if (type.isLiteral()) {
        logger('\tLiteral type');

        return ts.createStrictEquality(value, ts.createLiteral(type.value));
      }

      // logger(type as ts.TypeReference).target;

      if (type.isUnion()) {
        logger('\tUnion type');

        return type.types
          .map(unionMemberType => createCheckForType(root, unionMemberType, value))
          .reduce((expression, comparison) => {
            return ts.createLogicalOr(expression, comparison);
          });
      }

      // if (type.isStringLiteral()) {
      //   logger('\tString literal type');
      // }

      if (type.flags & ts.TypeFlags.Number) {
        logger('\tNumber');

        return ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral('number'));
      }

      if (type.flags & ts.TypeFlags.String) {
        logger('\tString');

        return ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral('string'));
      }

      if (type.flags & ts.TypeFlags.Null) {
        logger('\tNull');

        return ts.createStrictEquality(value, ts.createNull());
      }

      if (type.flags & ts.TypeFlags.Undefined) {
        logger('\tUndefined');

        return ts.createStrictEquality(value, ts.createIdentifier('undefined'));
      }

      logger('');
      debugger;

      // // TS CODE START
      // function getTypeOfGlobalSymbol(symbol: symbol, arity: number): ObjectType {
      //   function getTypeDeclaration(symbol: symbol): Declaration {
      //     const declarations = symbol.declarations;
      //     for (const declaration of declarations) {
      //       switch (declaration.kind) {
      //         case ts.SyntaxKind.ClassDeclaration:
      //         case ts.SyntaxKind.InterfaceDeclaration:
      //         case ts.SyntaxKind.EnumDeclaration:
      //           return declaration;
      //       }
      //     }
      //   }

      //   if (!symbol) {
      //     return arity ? emptyGenericType : emptyObjectType;
      //   }
      //   const type = getDeclaredTypeOfSymbol(symbol);
      //   if (!(type.flags & TypeFlags.ObjectType)) {
      //     error(getTypeDeclaration(symbol), Diagnostics.Global_type_0_must_be_a_class_or_interface_type, symbol.name);
      //     return arity ? emptyGenericType : emptyObjectType;
      //   }
      //   if (((<InterfaceType>type).typeParameters ? (<InterfaceType>type).typeParameters.length : 0) !== arity) {
      //     error(getTypeDeclaration(symbol), Diagnostics.Global_type_0_must_have_1_type_parameter_s, symbol.name, arity);
      //     return arity ? emptyGenericType : emptyObjectType;
      //   }
      //   return <ObjectType>type;
      // }

      // function getGlobalSymbol(name: string, meaning: SymbolFlags, diagnostic: DiagnosticMessage): symbol {
      //   return resolveName(undefined, name, meaning, diagnostic, name);
      // }

      // function getGlobalTypeSymbol(name: string): symbol {
      //   return getGlobalSymbol(name, SymbolFlags.Type, Diagnostics.Cannot_find_global_type_0);
      // }
      // function getGlobalType(name: string, arity = 0): ObjectType {
      //   return getTypeOfGlobalSymbol(getGlobalTypeSymbol(name), arity);
      // }
      // // TS CODE END

      // getGlobalType('Array', /*arity*/ 1);

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
