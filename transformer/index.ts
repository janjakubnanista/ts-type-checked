import {
  addTypeCheckerMap,
  createArrayElementsCheck,
  createLogger,
  createObjectIndexedPropertiesCheck,
  createTypeCheckerFunction,
  typeFlags,
} from './utils';
import { isArrayType, isFunctionType, isObjectType, isTupleType } from './checks';
import { visitNodeAndChildren } from './visitor';
import ts from 'typescript';

interface TypeCheckMethod {
  name: string;
  definition: ts.ArrowFunction;
}

export interface TransformerOptions {
  debug?: boolean;
}

// The transformer function
export default (program: ts.Program, options: TransformerOptions = {}): ts.TransformerFactory<ts.SourceFile> => {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => {
    // Make the logger silent unless options.debug is true
    const logger = createLogger(`[${file.fileName}]`, !options.debug);

    // Get a reference to a TypeScript TypeChecker in order to resolve types from type nodes
    const typeChecker = program.getTypeChecker();

    // A runtime object that will hold the type checks for object types. Since they can reference themselves
    // (or create cycles in general) they could create endless recursion when creating type checks
    //
    // The solution is to store all object type checks in a (runtime) map
    const typeCheckerObjectIdentfifier: ts.Identifier = ts.createIdentifier('__isA');
    const typeCheckMethods: Map<ts.Type, TypeCheckMethod> = new Map();
    let lastMethodId = 0;

    const isACallVisitor = (typeNode: ts.TypeNode): ts.Expression => {
      logger('Processing', typeNode.getFullText());

      const type = typeChecker.getTypeFromTypeNode(typeNode);

      const createCheckForType = (root: ts.TypeNode, type: ts.Type, value: ts.Expression): ts.Expression => {
        const typeName = typeChecker.typeToString(type, root);
        logger('Type', typeName, typeFlags(type).join(', '));

        // If the type check already exists then don't make a new one, instead just call an existing one
        const typeCheck = typeCheckMethods.get(type);
        if (typeCheck) {
          return ts.createCall(ts.createPropertyAccess(typeCheckerObjectIdentfifier, typeCheck.name), undefined, [
            value,
          ]);
        }

        if (isArrayType(typeChecker, type, root)) {
          logger('\tArray type');

          const elementType = (type as ts.TypeReference).typeArguments?.[0];
          if (!elementType) {
            const errorMessage = `Unable to find array element type for type '${typeName}'. This happened while creating a check for '${root.getText()}' in ${
              file.fileName
            })`;

            throw new Error(errorMessage);
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

              return ts.createParen(createCheckForType(root, tupleType, elementAccess));
            })
            .reduce((expression, check) => ts.createLogicalAnd(expression, check), ts.createTrue());

          return ts.createLogicalAnd(isArray, elementChecks);
        }

        if (isObjectType(typeChecker, type, root)) {
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

        // Rather than silently failing we throw an exception here to let the people in charge know
        // that this type check is not supported. This might happen if the passed type is e.g. a generic type parameter
        const errorMessage = `Could not create type checker for type '${typeName}'. This happened while creating a check for '${root.getText()}' in ${
          file.fileName
        })`;

        throw new Error(errorMessage);
      };

      return createTypeCheckerFunction(value => createCheckForType(typeNode, type, value));
    };

    // First transform the file
    const transformedFile = visitNodeAndChildren(file, program, context, isACallVisitor);

    // Then grab all the things that need to be checked
    const typeCheckerProperties: ts.PropertyAssignment[] = Array.from(typeCheckMethods.values()).map(method => {
      return ts.createPropertyAssignment(method.name, method.definition);
    });
    const transformedFileWithTypeCheckerMap = addTypeCheckerMap(
      transformedFile,
      typeCheckerObjectIdentfifier,
      typeCheckerProperties,
    );

    return transformedFileWithTypeCheckerMap;
  };
};
