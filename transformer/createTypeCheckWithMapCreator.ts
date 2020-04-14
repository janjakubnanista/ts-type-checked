import { PluggableTypeCheckCreator, TypeCheckCreator } from './types';
import { createTypeCheckerFunction } from './utils';
import ts from 'typescript';

interface TypeCheckMethod {
  identifier: string;
  definition?: ts.ArrowFunction;
}

export type TypeMapStatementCreator = () => ts.Statement;

export const createTypeCheckWithMapCreator = (
  typeCheckCreator: PluggableTypeCheckCreator,
): [TypeCheckCreator, TypeMapStatementCreator] => {
  // A runtime object that will hold the type checks for object types. Since they can reference themselves
  // (or create cycles in general) they could create endless recursion when creating type checks
  //
  // The solution is to store all object type checks in a (runtime) map
  const typeCheckerObjectIdentfifier: ts.Identifier = ts.createIdentifier('__isA');
  const typeCheckMethods: Map<ts.Type, TypeCheckMethod> = new Map();
  let lastMethodIdentifier = 0;

  const wrappedTypeCheckCreator: TypeCheckCreator = (root, type, value) => {
    // If the type check already exists then don't make a new one, instead just call an existing one
    const existingTypeCheck = typeCheckMethods.get(type);
    if (existingTypeCheck) {
      return ts.createCall(
        ts.createPropertyAccess(typeCheckerObjectIdentfifier, existingTypeCheck.identifier),
        undefined,
        [value],
      );
    }

    // Add a new entry to the global type checker map
    const method: TypeCheckMethod = { identifier: `__${lastMethodIdentifier++}` };
    // Make sure that it gets inserted (albeit incomplete) before we start digging deeper into the object properties
    // otherwise we will not get rid of any possible recursion
    typeCheckMethods.set(type, method);

    // Create type check function
    const definition = createTypeCheckerFunction(value => typeCheckCreator(root, type, value, wrappedTypeCheckCreator));

    // Finally fill in the undefined value for the method definition
    typeCheckMethods.set(type, { ...method, definition });

    // TODO This is repetition of the code several lines above
    return ts.createCall(ts.createPropertyAccess(typeCheckerObjectIdentfifier, method.identifier), undefined, [value]);
  };

  const statementCreator: TypeMapStatementCreator = () => {
    const typeChecks: ts.PropertyAssignment[] = Array.from(typeCheckMethods.values()).map(method => {
      if (!method.definition) {
        // FIXME Better handling but this should never happen so not too much work yes
        const message = `Type check missing!`;

        throw new Error(message);
      }
      return ts.createPropertyAssignment(method.identifier, method.definition);
    });

    return ts.createVariableStatement(/* modifiers */ undefined, [
      ts.createVariableDeclaration(
        typeCheckerObjectIdentfifier,
        /* type */ undefined,
        ts.createObjectLiteral(/* properties */ typeChecks, /* multiline */ true),
      ),
    ]);
  };

  return [wrappedTypeCheckCreator, statementCreator];
};
