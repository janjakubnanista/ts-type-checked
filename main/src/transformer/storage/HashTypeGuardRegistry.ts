import { ExpressionTransformer, TypeGuardRegistry } from '../types';
import { TypeName } from '../types';
import {
  createElementAccess,
  createObjectWithProperties,
  createRequire,
  createSingleParameterFunction,
  createVariable,
} from '../utils/codeGenerators';
import ts from 'typescript';

/**
 * Hash (as in plain JavaScript object) based implementation of TypeGuardRegistry
 */
export class HashTypeGuardRegistry implements TypeGuardRegistry {
  private readonly typeGuardsBeingCreated: Set<TypeName> = new Set();

  private readonly typeGuardFunctionsByTypeName: Map<TypeName, ts.Expression> = new Map();

  private readonly cyclicTypeNames: Set<TypeName> = new Set();

  constructor(private readonly identifier: ts.Identifier) {}

  public get(typeName: TypeName): ts.Expression | undefined {
    // First we check that a type under this name has been registered
    if (!this.typeGuardFunctionsByTypeName.has(typeName)) return undefined;

    // Then we create a runtime reference to the type guard
    return createElementAccess(this.identifier, typeName);
  }

  public create(typeName: TypeName, factory: ExpressionTransformer): ts.Expression {
    // Get an existing type guard function expression
    const hasTypeGuard = this.typeGuardFunctionsByTypeName.has(typeName);

    // Check whether we are not in progress of creating the very same type guard
    //
    // This can happen when types reference themselves circularly, for example:
    //
    // interface MyInterface {
    //   parent: MyInterface | undefined;
    // }
    //
    const typeGuardIsBeingCreated = this.typeGuardsBeingCreated.has(typeName);

    // If the type guard with the same name is being created it means
    // that the type is cyclic so we mark it as such
    if (typeGuardIsBeingCreated) {
      this.cyclicTypeNames.add(typeName);
    }

    // If we don't have the type guard yet and we are not creating one at the moment
    // we need to create it
    if (!hasTypeGuard && !typeGuardIsBeingCreated) {
      // First let's mark the fact that we are creating it now
      this.typeGuardsBeingCreated.add(typeName);

      // Then create the type guard and store it in the map
      this.typeGuardFunctionsByTypeName.set(typeName, createSingleParameterFunction(factory));

      // Finally let's remove the mark
      this.typeGuardsBeingCreated.delete(typeName);
    }

    // We return an expression that points to the type guard function
    return createElementAccess(this.identifier, typeName);
  }

  public code(): ts.Statement[] {
    // There is no need for a object if it is not used in the code
    if (this.typeGuardFunctionsByTypeName.size === 0) return [];

    // We will use this to remember whether there were any cyclic types
    let areAnyTypesCyclic = false;

    // In order not to create the cycle breaker in every file we import it from our module
    const wrapperIdentifier = ts.createIdentifier('__typeGuardCycleBreaker__');
    const wrapperImport = createRequire(wrapperIdentifier, 'ts-type-checked/transformer/helpers/typeGuardCycleBreaker');
    const wrapTypeGuard: ExpressionTransformer = (typeGuard: ts.Expression): ts.Expression =>
      ts.createCall(wrapperIdentifier, undefined, [typeGuard]);

    // Now we create an object literal with all the type guards keyed by type names
    const typeGuardEntries = Array.from(this.typeGuardFunctionsByTypeName.entries());
    const properties: ts.PropertyAssignment[] = typeGuardEntries.map(([typeName, typeGuard]) => {
      // First we check whether the type has been marked as cyclic
      const isCyclic: boolean = this.cyclicTypeNames.has(typeName);

      // Make sure we remember meeting any cyclic types
      areAnyTypesCyclic = areAnyTypesCyclic || isCyclic;

      // If the type is not cyclic we output a simple property assignment,
      // if it is cyclic we need to wrap the type guard in a cycle-breaking code
      const wrappedTypeGuard = isCyclic ? wrapTypeGuard(typeGuard) : typeGuard;

      return ts.createPropertyAssignment(ts.createLiteral(typeName), wrappedTypeGuard);
    });

    return [
      // If there were any cyclic types we will need to import the cycle breaker
      ...(areAnyTypesCyclic ? [wrapperImport] : []),
      createVariable(this.identifier, createObjectWithProperties(properties)),
    ];
  }
}
