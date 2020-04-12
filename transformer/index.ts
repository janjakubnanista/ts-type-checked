import {
  FunctionExpression,
  Identifier,
  Program,
  PropertyAssignment,
  SourceFile,
  TransformationContext,
  TransformerFactory,
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
    const logger = createLogger('[isACallVisitor]');
    const typeChecker = program.getTypeChecker();

    // I believe this is the only hack in the whole codebase
    //
    // This API is marked as internal in TypeScript compiler
    const isArrayType = (type: ts.Type): boolean => (typeChecker as any).isArrayType?.(type) || false;

    const isACallVisitor = (typeNode: ts.TypeNode): ts.Expression => {
      logger('Processing', typeNode.getFullText());

      const type = typeChecker.getTypeFromTypeNode(typeNode);
      // A runtime object that will hold the type checks for object types. Since they can reference themselves
      // (or create cycles in general) they could create endless recursion when creating type checks
      //
      // The solution is to store all object type checks in a (runtime) map
      const typeCheckerObjectIdentfifier: Identifier = createIdentifier('__typeCheckerMap__');
      const typeCheckMethods: Map<ts.Type, TypeCheckMethod> = new Map();
      let lastMethodId = 0;

      const createCheckForType = (root: ts.TypeNode, type: ts.Type, value: ts.Expression): ts.Expression => {
        const typeName = typeChecker.typeToString(type, root);
        logger('Type', typeName, typeFlags(type).join(', '));

        // If the checker already exists don't make a new one, instead just call an existing one
        const typeCheck = typeCheckMethods.get(type);
        if (typeCheck) {
          return ts.createCall(ts.createPropertyAccess(typeCheckerObjectIdentfifier, typeCheck.name), undefined, [
            value,
          ]);
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

        // FIXME Throw an exception here
        return ts.createFalse();
      };

      const typeCheck = createTypeCheckerFunction(value => createCheckForType(typeNode, type, value));
      const typeCheckerProperties: PropertyAssignment[] = Array.from(typeCheckMethods.values()).map(method => {
        return createPropertyAssignment(method.name, method.definition);
      });
      if (typeCheckerProperties.length === 0) {
        return typeCheck;
      }

      return ts.createImmediatelyInvokedArrowFunction([
        ts.createVariableStatement(/* modifiers */ undefined, [
          ts.createVariableDeclaration(
            typeCheckerObjectIdentfifier,
            /* type */ undefined,
            ts.createObjectLiteral(/* properties */ typeCheckerProperties, /* multiline */ true),
          ),
        ]),
        ts.createReturn(typeCheck),
      ]);

      // return ts.createFunctionExpression(
      //   undefined,
      //   undefined,
      //   undefined,
      //   undefined,
      //   [],
      //   undefined,
      //   ts.createBlock(
      //     [
      //       ts.createVariableStatement(/* modifiers */ undefined, [
      //         ts.createVariableDeclaration(
      //           typeCheckerObjectIdentfifier,
      //           /* type */ undefined,
      //           ts.createObjectLiteral(/* properties */ typeCheckerProperties, /* multiline */ true),
      //         ),
      //       ]),
      //       ts.createReturn(typeCheck),
      //     ],
      //     false,
      //   ),
      // );
    };

    const transformedFile = visitNodeAndChildren(file, program, context, isACallVisitor);
    // const typeCheckerProperties: PropertyAssignment[] = Array.from(typeCheckMethods.values()).map(method => {
    //   return createPropertyAssignment(method.name, method.definition);
    // });
    // const transformedFileWithTypeCheckerMap = addTypeCheckerMap(
    //   transformedFile,
    //   typeCheckerObjectIdentfifier,
    //   typeCheckerProperties,
    // );

    return transformedFile;
  };
};
