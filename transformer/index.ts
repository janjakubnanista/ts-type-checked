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
  createBlock,
  createCall,
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
import { addTypeCheckerMap, createTypeCheckerFunction } from './utils';

interface TypeCheckMethod {
  name: string;
  definition: FunctionExpression;
}

export default (program: Program): TransformerFactory<SourceFile> => {
  return (context: TransformationContext) => (file: SourceFile) => {
    const typeChecker = program.getTypeChecker();
    const typeCheckerObjectIdentfifier: Identifier = createIdentifier('__typeCheckerMap__');
    const typeCheckMethods: Map<Type, TypeCheckMethod> = new Map();

    // Main type check generator method
    const createTypeCheckMethodDefinition = (type: Type): FunctionExpression => {
      console.warn('type', type.symbol?.getName(), type.flags, type.symbol?.getDeclarations());

      if (type.flags & TypeFlags.Boolean) {
        return createTypeCheckerFunction(value =>
          createStrictEquality(createTypeOf(value), createStringLiteral('boolean')),
        );
      }

      if (type.flags & TypeFlags.BooleanLiteral) {
        const typeNode = typeChecker.typeToTypeNode(type);

        return createTypeCheckerFunction(value =>
          createStrictEquality(value, createLiteral(typeNode?.kind === SyntaxKind.TrueKeyword)),
        );
      }

      if (type.flags & TypeFlags.Number) {
        return createTypeCheckerFunction(value =>
          createStrictEquality(createTypeOf(value), createStringLiteral('number')),
        );
      }

      if (type.flags & TypeFlags.String) {
        return createTypeCheckerFunction(value =>
          createStrictEquality(createTypeOf(value), createStringLiteral('string')),
        );
      }

      if (type.flags & TypeFlags.Undefined) {
        return createTypeCheckerFunction(value =>
          createStrictEquality(createTypeOf(value), createStringLiteral('undefined')),
        );
      }

      if (type.isLiteral()) {
        return createTypeCheckerFunction(value => createStrictEquality(value, createLiteral(type.value)));
      }

      if (type.isUnion()) {
        return createTypeCheckerFunction(value => {
          return type.types
            .map(unionMemberType => {
              return createValueTypeCheck(unionMemberType, value);
            })
            .reduce((expression, unionMemberExpression) => createLogicalOr(expression, unionMemberExpression));
        });
      }

      debugger;

      const typeNode = typeChecker.typeToTypeNode(type);
      if (typeNode && isArrayTypeNode(typeNode)) {
        const indexType = type.getNumberIndexType();
        if (!indexType) {
          throw new Error('Could not find array type for ' + typeNode.getFullText());
        }

        return createTypeCheckerFunction(value => {
          const isArray = createCall(createPropertyAccess(createIdentifier('Array'), 'isArray'), [], [value]);
          const element = createIdentifier('element');
          const checkElement = createFunctionExpression(
            undefined,
            undefined,
            undefined,
            undefined,
            [
              createParameter(
                /* decorators */ undefined,
                /* modifiers */ undefined,
                /* dotDotDotToken */ undefined,
                /* name */ element,
                undefined,
                undefined,
                undefined,
              ),
            ],
            undefined,
            createBlock([createReturn(createValueTypeCheck(indexType, element))], false),
          );
          const checkElements = createCall(createPropertyAccess(value, 'every'), [], [checkElement]);

          return createLogicalAnd(isArray, checkElements);
        });
      }

      return createTypeCheckerFunction(value => {
        const isObject = createLogicalAnd(
          createStrictEquality(createTypeOf(value), createStringLiteral('object')),
          createStrictInequality(value, createNull()),
        );

        return type.getProperties().reduce((expression, property) => {
          const declaration = property.valueDeclaration;
          // TODO Properties without a type, just an initializer
          if (
            !isPropertySignature(declaration) &&
            !isMethodSignature(declaration) &&
            !isPropertyDeclaration(declaration)
          ) {
            console.warn('declaration', declaration.kind);

            throw new Error(`Property ${property.name} does not have a property declaration`);
          }

          if (!declaration.type) {
            throw new Error(`Could not determine the type of property ${property.name}`);
          }

          const type = typeChecker.getTypeFromTypeNode(declaration.type);
          const propertyAccess = createPropertyAccess(value, property.name);
          const valueTypeCheck = createValueTypeCheck(type, propertyAccess);
          const isOptional = property.getFlags() & SymbolFlags.Optional;
          if (!isOptional) {
            return createLogicalAnd(expression, valueTypeCheck);
          }

          const optionalCheck = createStrictEquality(createTypeOf(propertyAccess), createStringLiteral('undefined'));
          return createLogicalAnd(expression, createParen(createLogicalOr(optionalCheck, valueTypeCheck)));
        }, isObject);
      });
    };

    let lastMethodId = 0;
    const createTypeCheckMethod = (type: Type): TypeCheckMethod => {
      const name = `__${lastMethodId++}`;
      const defaultMethod = { name, definition: undefined };

      // FIXME We first need to mark this node, then create its definition to prevent recursion
      typeCheckMethods.set(type, defaultMethod as any);

      const definition = createTypeCheckMethodDefinition(type);
      const method = { name, definition };
      typeCheckMethods.set(type, method);

      return method;
    };

    const createValueTypeCheck: ValueTypeCheckCreator = (type, value) => {
      const method = typeCheckMethods.get(type) || createTypeCheckMethod(type);

      return createCall(
        createPropertyAccess(typeCheckerObjectIdentfifier, method.name),
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
