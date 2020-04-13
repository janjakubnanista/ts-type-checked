import {
  FunctionExpression,
  Identifier,
  Program,
  PropertyAssignment,
  TransformationContext,
  createIdentifier,
  createPropertyAssignment,
} from 'typescript';
import {
  createArrayElementsCheck,
  createObjectIndexedPropertiesCheck,
  createTypeCheckerFunction,
  typeFlags,
} from './utils';
import { createLogger } from './logger';
import { visitNodeAndChildren } from './visitor';
import ts from 'typescript';

interface TypeCheckMethod {
  name: string;
  definition: FunctionExpression;
}

export interface TransformerOptions {
  debug?: boolean;
}

export default (program: Program, options: TransformerOptions = {}): ts.TransformerFactory<ts.SourceFile> => {
  return (context: TransformationContext) => (file: ts.SourceFile) => {
    // Make the logger silent unless options.debug is true
    const logger = createLogger(`[${file.fileName}]`, !options.debug);

    // Get a reference to a TypeScript TypeChecker in order to resolve types from type nodes
    const typeChecker = program.getTypeChecker();

    const isArrayType = (type: ts.Type): boolean => {
      // I believe this is the only hack in the whole codebase
      //
      // This API is marked as internal in TypeScript compiler
      // const isArrayType = (type: ts.Type): boolean => (typeChecker as any).isArrayType?.(type) || false;
      if (typeof (typeChecker as any).isArrayType === 'function') {
        return (typeChecker as any).isArrayType(type) || false;
      }

      const typeNode = typeChecker.typeToTypeNode(type);
      return !!typeNode && ts.isArrayTypeNode(typeNode);
    };

    // The "object" keyword type is also not very keen to be detected using the Type based API
    // and needs to be converted to TypeNode in order to be detected
    const isObjectType = (type: ts.Type): boolean => {
      if (type.flags & ts.TypeFlags.Object) return true;

      const typeNode = typeChecker.typeToTypeNode(type);
      return typeNode?.kind === ts.SyntaxKind.ObjectKeyword;
    };

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

        if (isObjectType(type)) {
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

            const checkIndexedProperties = createObjectIndexedPropertiesCheck(type, value, (type, value) =>
              createCheckForType(root, type, value),
            );

            return ts.createLogicalAnd(
              checkIsObject,
              checkIndexedProperties
                ? ts.createLogicalAnd(checkAllProperties, checkIndexedProperties)
                : checkAllProperties,
            );
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

        debugger;

        // Rather than silently failing we throw an exception here to let the people in charge know
        // that this type check is not supported. This might happen if the passed type is e.g. a generic type parameter
        const errorMessage = `Could not create type checker for type '${typeName}'. This happened while creating a check for '${root.getText()}' in ${
          file.fileName
        })`;

        throw new Error(errorMessage);
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
    };

    return visitNodeAndChildren(file, program, context, isACallVisitor);
  };
};
