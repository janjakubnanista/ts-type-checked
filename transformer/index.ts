import {
  FunctionExpression,
  Identifier,
  Program,
  PropertyAssignment,
  SourceFile,
  TransformationContext,
  TransformerFactory,
  TypeNode,
  createBlock,
  createCall,
  createFalse,
  createFunctionExpression,
  createIdentifier,
  createLogicalAnd,
  createParameter,
  createPropertyAccess,
  createPropertyAssignment,
  createReturn,
  createStrictEquality,
  createStringLiteral,
  createTypeOf,
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

      // if (type.flags & TypeFlags.BooleanLiteral) {
      //   const typeNode = typeChecker.typeToTypeNode(type);

      //   return createTypeCheckerFunction(value =>
      //     createStrictEquality(value, createLiteral(typeNode?.kind === SyntaxKind.TrueKeyword)),
      //   );
      // }

      // if (type.isLiteral()) {
      //   return createTypeCheckerFunction(value => createStrictEquality(value, createLiteral(type.value)));
      // }

      // if (type.isUnion()) {
      //   return createTypeCheckerFunction(value => {
      //     return type.types
      //       .map(unionMemberType => {
      //         return createValueTypeCheck(unionMemberType, value);
      //       })
      //       .reduce((expression, unionMemberExpression) => createLogicalOr(expression, unionMemberExpression));
      //   });
      // }

      // // const typeNode = typeChecker.typeToTypeNode(type);
      // if (typeNode && isArrayTypeNode(typeNode)) {
      //   const indexType = type.getNumberIndexType();
      //   if (!indexType) {
      //     throw new Error('Could not find array type for ' + typeNode.getFullText());
      //   }

      //   return createTypeCheckerFunction(value => {
      //     const isArray = createCall(createPropertyAccess(createIdentifier('Array'), 'isArray'), [], [value]);
      //     const element = createIdentifier('element');
      //     const checkElement = createFunctionExpression(
      //       undefined,
      //       undefined,
      //       undefined,
      //       undefined,
      //       [
      //         createParameter(
      //           /* decorators */ undefined,
      //           /* modifiers */ undefined,
      //           /* dotDotDotToken */ undefined,
      //           /* name */ element,
      //           undefined,
      //           undefined,
      //           undefined,
      //         ),
      //       ],
      //       undefined,
      //       createBlock([createReturn(createValueTypeCheck(indexType, element))], false),
      //     );
      //     const checkElements = createCall(createPropertyAccess(value, 'every'), [], [checkElement]);

      //     return createLogicalAnd(isArray, checkElements);
      //   });
      // }

      // return createTypeCheckerFunction(value => {
      //   const isObject = createLogicalAnd(
      //     createStrictEquality(createTypeOf(value), createStringLiteral('object')),
      //     createStrictInequality(value, createNull()),
      //   );

      //   return type.getProperties().reduce((expression, property) => {
      //     const declaration = property.valueDeclaration;
      //     // TODO Properties without a type, just an initializer
      //     if (
      //       !isPropertySignature(declaration) &&
      //       !isMethodSignature(declaration) &&
      //       !isPropertyDeclaration(declaration)
      //     ) {
      //       console.warn('declaration', declaration.kind);

      //       throw new Error(`Property ${property.name} does not have a property declaration`);
      //     }

      //     if (!declaration.type) {
      //       throw new Error(`Could not determine the type of property ${property.name}`);
      //     }

      //     const type = typeChecker.getTypeFromTypeNode(declaration.type);
      //     const propertyAccess = createPropertyAccess(value, property.name);
      //     const valueTypeCheck = createValueTypeCheck(type, propertyAccess);
      //     const isOptional = property.getFlags() & SymbolFlags.Optional;
      //     if (!isOptional) {
      //       return createLogicalAnd(expression, valueTypeCheck);
      //     }

      //     const optionalCheck = createStrictEquality(createTypeOf(propertyAccess), createStringLiteral('undefined'));
      //     return createLogicalAnd(expression, createParen(createLogicalOr(optionalCheck, valueTypeCheck)));
      //   }, isObject);
      // });
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

    const createValueTypeCheck: ValueTypeCheckCreator = (typeNode, value) => {
      const type = typeChecker.getTypeFromTypeNode(typeNode);
      console.warn('[createValueTypeCheck]', typeChecker.typeToString(type), typeNode.kind);

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

      const baseContraintType = typeChecker.getBaseConstraintOfType(type);
      // if (baseContraintType) {
      //   debugger;
      // }

      // // Now let's check true/false keywords
      // const booleanLiteral = getBooleanLiteral(typeNode);
      // if (booleanLiteral) {
      //   return ts.createStrictEquality(value, booleanLiteral);
      // }

      // Next we check for an array
      if (ts.isArrayTypeNode(typeNode)) {
        return createArrayElementsCheck(typeChecker, createValueTypeCheck, typeNode, value);
      }

      // if (ts.isLiteralTypeNode(typeNode)) {
      //   console.log('literal type node', typeNode.literal);

      //   return createStrictEquality(value, typeNode.literal);
      // }

      if (type.isUnion()) {
        console.log('union type node');

        return type.types
          .map(unionMemberType => {
            const unionMemberTypeNode = typeChecker.typeToTypeNode(unionMemberType, typeNode);
            if (!unionMemberTypeNode) {
              throw new Error(`Could not resolve union member type node`);
            }

            return createValueTypeCheck(unionMemberTypeNode, value);
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
