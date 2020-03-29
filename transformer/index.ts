import {
  FunctionExpression,
  Identifier,
  Program,
  PropertyAssignment,
  SourceFile,
  SymbolFlags,
  SyntaxKind,
  TransformationContext,
  TransformerFactory,
  Type,
  TypeFlags,
  TypeNode,
  createBlock,
  createCall,
  createFalse,
  createFunctionExpression,
  createIdentifier,
  createLiteral,
  createLogicalAnd,
  createLogicalOr,
  createNull,
  createParameter,
  createParen,
  createPropertyAccess,
  createPropertyAssignment,
  createReturn,
  createStrictEquality,
  createStrictInequality,
  createStringLiteral,
  createTypeOf,
  isArrayTypeNode,
  isMethodSignature,
  isPropertyDeclaration,
  isPropertySignature,
} from 'typescript';
import { ValueTypeCheckCreator, visitNodeAndChildren } from './visitor';
import {
  addTypeCheckerMap,
  createIsPlainObjectCheck,
  createObjectPropertiesCheck,
  createTypeCheckerFunction,
  getTypeOf,
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
        const type = typeChecker.getTypeFromTypeNode(typeNode);
        const stringIndexType = type.getStringIndexType();
        const stringIndexTypeNode = stringIndexType ? typeChecker.typeToTypeNode(stringIndexType) : undefined;

        const numberIndexType = type.getNumberIndexType();

        if (stringIndexType || numberIndexType) {
          console.warn('\t\tindex type', stringIndexType, numberIndexType);

          debugger;
        }

        return createTypeCheckerFunction(value => {
          // First we check whether the thing is an object
          const isObject = createIsPlainObjectCheck(value);
          const propertyChecks = createObjectPropertiesCheck(typeChecker, createValueTypeCheck, typeNode, value);

          if (stringIndexTypeNode) {
            const valueKeysCall = ts.createCall(
              ts.createPropertyAccess(ts.createIdentifier('Object'), 'keys'),
              [],
              [value],
            );
            const key = ts.createIdentifier('key');
            const checkKey = ts.createFunctionExpression(
              undefined /* modifiers */,
              undefined /* asteriskToken */,
              undefined /* name */,
              undefined /* typeParameters */,
              [
                ts.createParameter(
                  undefined /* decorators */,
                  undefined /* modifiers */,
                  undefined /* dotDotDotToken */,
                  key /* name */,
                  undefined /* questionToken */,
                  undefined /* type */,
                  undefined /* initializer */,
                ),
              ],
              undefined,
              ts.createBlock(
                [ts.createReturn(createValueTypeCheck(stringIndexTypeNode, ts.createElementAccess(value, key)))],
                false,
              ),
            );

            const checkKeys = ts.createCall(ts.createPropertyAccess(valueKeysCall, 'every'), [], [checkKey]);

            return createLogicalAnd(ts.createParen(propertyChecks), checkKeys);
          }

          return propertyChecks;
        });
      }

      debugger;

      return createTypeCheckerFunction(() => createFalse());

      // if (type.flags & TypeFlags.Boolean) {
      //   return createTypeCheckerFunction(value =>
      //     createStrictEquality(createTypeOf(value), createStringLiteral('boolean')),
      //   );
      // }

      // if (type.flags & TypeFlags.BooleanLiteral) {
      //   const typeNode = typeChecker.typeToTypeNode(type);

      //   return createTypeCheckerFunction(value =>
      //     createStrictEquality(value, createLiteral(typeNode?.kind === SyntaxKind.TrueKeyword)),
      //   );
      // }

      // if (type.flags & TypeFlags.Number) {
      //   return createTypeCheckerFunction(value =>
      //     createStrictEquality(createTypeOf(value), createStringLiteral('number')),
      //   );
      // }

      // if (type.flags & TypeFlags.String) {
      //   return createTypeCheckerFunction(value =>
      //     createStrictEquality(createTypeOf(value), createStringLiteral('string')),
      //   );
      // }

      // if (type.flags & TypeFlags.Undefined) {
      //   return createTypeCheckerFunction(value =>
      //     createStrictEquality(createTypeOf(value), createStringLiteral('undefined')),
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
      try {
        console.warn('createValueTypeCheck', typeNode.getFullText(), typeNode.kind);
      } catch (error) {
        console.warn('createValueTypeCheck', '[UNKNOWN]', typeNode.kind);
      }

      const tc = typeChecker;
      debugger;

      // First let's check for types that will not create a new method on typechecker map
      const typeOfNode = getTypeOf(typeNode);
      if (typeOfNode) {
        return createStrictEquality(createTypeOf(value), createStringLiteral(typeOfNode));
      }

      if (ts.isLiteralTypeNode(typeNode)) {
        console.log('literal type node', typeNode.literal);

        return createStrictEquality(value, typeNode.literal);
      }

      if (ts.isIndexedAccessTypeNode(typeNode)) {
        console.log('\tindexed access kinda node', typeNode.indexType.kind, typeNode.objectType.kind);

        return ts.createTrue();
      }

      if (ts.isArrayTypeNode(typeNode)) {
        console.log('\tarray kinda node');

        // First let's do Array.isArray(value)
        const isArray = createCall(createPropertyAccess(createIdentifier('Array'), 'isArray'), [], [value]);

        // Then let's define a element type checker function that can be passed to Array.every
        const element = createIdentifier('element');
        const checkElement = createFunctionExpression(
          undefined /* modifiers */,
          undefined /* asteriskToken */,
          undefined /* name */,
          undefined /* typeParameters */,
          [
            createParameter(
              undefined /* decorators */,
              undefined /* modifiers */,
              undefined /* dotDotDotToken */,
              element /* name */,
              undefined /* questionToken */,
              undefined /* type */,
              undefined /* initializer */,
            ),
          ],
          undefined,
          createBlock([createReturn(createValueTypeCheck(typeNode.elementType, element))], false),
        );

        // Now let's do value.every(<element type checker>)
        const checkElements = createCall(createPropertyAccess(value, 'every'), [], [checkElement]);

        return createLogicalAnd(isArray, checkElements);
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
