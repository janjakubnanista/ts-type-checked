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
  createObjectIndexedPropertiesCheck,
  createObjectPropertiesCheck,
  createTypeCheckerFunction,
  getLiteral,
  getTypeOf,
  hasNoConstraint,
  typeFlags,
} from './utils';
import { createLogger } from './logger';
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

    const createCheckForType = (root: ts.TypeNode, typeNode: ts.TypeNode, value: ts.Expression): ts.Expression => {
      const type = typeChecker.getTypeFromTypeNode(typeNode);
      logger('\tChecking', typeChecker.typeToString(type, root), typeNode.kind, type.flags, typeFlags(type));

      // function getTypeOfGlobalSymbol(symbol: Symbol, arity: number): ObjectType {

      //       function getTypeDeclaration(symbol: Symbol): Declaration {
      //         let declarations = symbol.declarations;
      //         for (let declaration of declarations) {
      //             switch (declaration.kind) {
      //                 case SyntaxKind.ClassDeclaration:
      //                 case SyntaxKind.InterfaceDeclaration:
      //                 case SyntaxKind.EnumDeclaration:
      //                     return declaration;
      //             }
      //         }
      //     }

      //     if (!symbol) {
      //         return arity ? emptyGenericType : emptyObjectType;
      //     }
      //     let type = getDeclaredTypeOfSymbol(symbol);
      //     if (!(type.flags & TypeFlags.ObjectType)) {
      //         error(getTypeDeclaration(symbol), Diagnostics.Global_type_0_must_be_a_class_or_interface_type, symbol.name);
      //         return arity ? emptyGenericType : emptyObjectType;
      //     }
      //     if (((<InterfaceType>type).typeParameters ? (<InterfaceType>type).typeParameters.length : 0) !== arity) {
      //         error(getTypeDeclaration(symbol), Diagnostics.Global_type_0_must_have_1_type_parameter_s, symbol.name, arity);
      //         return arity ? emptyGenericType : emptyObjectType;
      //     }
      //     return <ObjectType>type;
      // }
      //
      // function getGlobalTypeSymbol(name: string): Symbol {
      //     return getGlobalSymbol(name, SymbolFlags.Type, Diagnostics.Cannot_find_global_type_0);
      // }
      //   function getGlobalType(name: string, arity = 0): ObjectType {
      //     return getTypeOfGlobalSymbol(getGlobalTypeSymbol(name), arity);
      // }
      //
      // getGlobalType("Array", /*arity*/ 1)

      // // FIXME Flags look like a bitmap rather than a number
      // switch (type.flags) {
      //   case ts.TypeFlags.Any:
      //   case ts.TypeFlags.Unknown:
      //     logger('\tis any');
      //     break;
      //   case ts.TypeFlags.String:
      //   case ts.TypeFlags.Boolean:
      //   case ts.TypeFlags.Number:
      //     logger('\tis typeofable');
      //     break;
      //   case ts.TypeFlags.Intersection:
      //     logger('\tis intersection');
      //     break;
      //   case ts.TypeFlags.Union:
      //     logger('\tis union');
      //     break;

      //   case ts.TypeFlags
      // }

      // debugger;
      // Checks for any/unknown types
      if (hasNoConstraint(typeNode)) {
        logger('\tNo constraint');

        return ts.createTrue();
      }

      // Checks for types that can be asserted using the "typeof" keyword
      const typeOfNode = getTypeOf(typeNode);
      if (typeOfNode) {
        logger('\tTypeofable');

        return ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral(typeOfNode));
      }

      // Checks for any kind of literal
      // - true / false
      // - null
      // - undefined
      // - "string literal"
      const literal = getLiteral(typeNode);
      if (literal) {
        logger('\tLiteral');

        return ts.createStrictEquality(value, literal);
      }

      // if (type.isUnion()) {
      //   logger('\tUnion type');

      //   return type.types
      //     .map(unionMemberType => {
      //       const unionMemberTypeNode = typeChecker.typeToTypeNode(unionMemberType, typeNode);
      //       if (!unionMemberTypeNode) {
      //         throw new Error(`Could not resolve union member type node`);
      //       }

      //       return createCheckForType(root, unionMemberTypeNode, value);
      //     })
      //     .reduce((expression, unionMemberExpression) => ts.createLogicalOr(expression, unionMemberExpression));
      // }

      if (ts.isUnionTypeNode(typeNode)) {
        logger('\tUnion type node');

        return typeNode.types
          .map(unionMemberTypeNode => {
            return createCheckForType(root, unionMemberTypeNode, value);
          })
          .reduce((expression, unionMemberExpression) => ts.createLogicalOr(expression, unionMemberExpression));
      }

      // Check for an array of any kind (the element type check is created by calling )
      if (ts.isArrayTypeNode(typeNode)) {
        logger('\tArray type node');

        return createArrayElementsCheck(value, element => createCheckForType(root, typeNode.elementType, element));
      }

      // if (type.isTypeParameter()) {
      //   // const declaration = typeChecker.typeParameterToDeclaration(type, root);
      //   const typeOfTypeParameter = typeChecker.getTypeOfSymbolAtLocation(type.getSymbol()!, root);
      //   debugger;
      // }

      if (ts.isTypeReferenceNode(typeNode)) {
        logger('\tType reference node');

        const node = (type as ts.TypeReference)?.node;
        if (!node) {
          throw new Error(`Cannot resolve type reference ${typeChecker.typeToString(type, root)}`);
        }

        if (ts.isTypeReferenceNode(node)) {
          logger('\t\tNode', node);
        }

        if (ts.isArrayTypeNode(node)) {
          logger('\t\tArray', node, node.elementType);
          const elementType = typeChecker.getTypeFromTypeNode(node.elementType);
          if (elementType.isTypeParameter()) {
            logger('\t\tWith type parameter');
          }
          // if (ts.isTypeParameterDeclaration(node.elementType)) {
          //   logger('\t\tWith type parameter');
          // }

          debugger;
          // const resolvedNode = ts.updateTypeReferenceNode(node, typeNode.typeName)
          // const resolvedNode = ts.updateArrayTypeNode(node, typeNode.typeArguments?.[0]!);
          // debugger;

          return createCheckForType(root, node, value);
        }

        // const targetType = (type as ts.TypeReference)?.target;
        // const targetTypeNode = typeChecker.typeToTypeNode(targetType, root);

        // // typeChecker.typeParameterToDeclaration()
        // // This is hacky as there is
        // const node = (type as ts.TypeReference).node;
        // const typeArgumentNodes = typeNode.typeArguments;
        // const typeArguments = typeArgumentNodes?.map(typeArgumentNode =>
        //   typeChecker.getTypeFromTypeNode(typeArgumentNode),
        // );
        // debugger;

        // if (node) {
        //   if (ts.isArrayTypeNode(node)) {
        //     logger('\t\tGot array', node.kind, typeChecker.getTypeAtLocation(node).getSymbol()?.name);

        //     return createCheckForType(root, node, value);
        //   }
        //   if (ts.isTupleTypeNode(node)) {
        //     logger('\t\tGot tuple', node.kind);
        //     // return createValueTypeCheck(node, value, logger.indent());
        //   }
        //   logger('\t\tGot uneexpected', node.kind);
        // }
        // // const node = (type as ts.TypeReference).node;
        // debugger;
      }

      return ts.createFalse();
    };

    const isACallVisitor = (typeNode: ts.TypeNode, value: ts.Expression): ts.Expression => {
      logger('Processing', typeNode.getFullText());

      return createCheckForType(typeNode, typeNode, value);
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
