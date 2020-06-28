import ts from 'typescript';

/**
 * TypeName is defined to make it very explicit when we are talking
 * about a type name as opposed to just a string
 */
export type TypeName = string;

/**
 * TypeNameGenerator describes a function that generates (unique)
 * string representations for types.
 */
export type TypeNameGenerator = (type: ts.Type) => TypeName;

/**
 * TypeDescriptorGenerator is a function that produces a TypeDescriptor based on a Type
 *
 * @param scope {ts.TypeNode} The root TypeNode that contains the type
 * @param type {ts.Type} The type to resolve into a TypeDescriptor
 *
 * The scope parameter represented by a TypeNode is necessary to resolve more complex,
 * especially generic types.
 *
 * If the Type to be resolved contains nested types (a union, an intersection etc.)
 * it can return a function that will be called with a TypeNameResolver function
 *
 * @example
 * ```
 * const myTypeDescriptorGenerator: TypeDescriptorGenerator = (scope, type) => {
 *   // ...
 *   return (resolve: TypeNameResolver) => ({
 *     _type: 'union',
 *     types: type.types.map(unionType => resolve(scope, unionType))
 *   });
 * }
 * ```
 */
export type TypeDescriptorGenerator = (
  scope: ts.TypeNode,
  type: ts.Type,
) => TypeDescriptor | TypeDescriptorGeneratorCallback;

/**
 * One of possible return values of TypeDescriptorGenerator
 *
 * If TypeDescriptorGenerator needs to resolve a type, for example
 * an element type of an array or a property type of an interface,
 * it will return a TypeDescriptorGeneratorCallback that gives it access
 * to a TypeNameResolver.
 *
 * @param typeNameResolver {TypeNameResolver}
 */
export type TypeDescriptorGeneratorCallback = (typeNameResolver: TypeNameResolver) => TypeDescriptor;

/**
 * TypeNameResolver takes a Type and returns a TypeName that can be used
 * to look up a TypeDescriptor from TypeDescriptorRegistry.
 *
 * @param scope {ts.TypeNode} The root TypeNode that contains the type
 * @param type {ts.Type} The type to resolve into a TypeDescriptor
 */
export type TypeNameResolver = (scope: ts.TypeNode, type: ts.Type) => TypeName;

/**
 * TypeGuardGenerator takes a TypeName (that can be used to look up the TypeDescriptor from TypeDescriptorRegistry)
 * and turns it into a runtime type guard expression for {@param value}.
 *
 * @param typeName {TypeName} The name of the type to check against
 * @param value {ts.Expression} The value to type check
 */
export type TypeGuardGenerator = (typeName: TypeName, value: ts.Expression) => ts.Expression;

export type TypeGuardResolver = (typeNode: ts.TypeNode, value: ts.Expression) => ts.Expression;

export interface TypeDescriptorRegistry {
  get(typeName: TypeName): TypeDescriptor | undefined;
  create(type: ts.Type, factory: () => TypeDescriptor): TypeName;
}

/**
 * TypeGuardRegistry represents a store for type guard functions
 * that might possibly be cyclic.
 *
 * It stores a type guard function expression that resolves to something like:
 *
 * @example
 * ```
 * (value: unknown): value is MyObject => typeof value === 'object' && ...
 * ```
 *
 * In order to create the type guard registry in runtime code we need
 * to insert the ts.Statement[] returned by code() into the AST.
 */
export interface TypeGuardRegistry {
  /**
   * Get a type guard function for a type specified by typeName
   *
   * @param typeName {TypeName} The name of the stored type guard type
   * @returns {ts.Expression} Runtime reference to the type guard function (e.g. ___isA___['MyInterface'])
   */
  get(typeName: TypeName): ts.Expression | undefined;

  /**
   * Create a new type guard function for typeName.
   *
   * @param typeName {TypeName} The name of the new stored type guard
   * @param factory {ExpressionTransformer} Function that accepts a runtime reference to type checked value and returns a type guard function body
   * @returns {ts.Expression} Runtime reference to the type guard function (e.g. ___isA___['MyInterface'])
   */
  create(typeName: TypeName, factory: ExpressionTransformer): ts.Expression;

  /**
   * Export the stored type guards for insertion into the AST
   *
   * @returns {ts.Statement[]} Statements to be inserted into the AST
   */
  code(): ts.Statement[];
}

/**
 * TypeScript AST visitor that transforms the tree on a per-node basis.
 *
 * It can either return the original node, return a completely different node
 * or return undefined if the original node needs to be removed from the tree.
 */
export type ASTVisitor = (node: ts.Node) => ts.Node | undefined;

/**
 * Helper type for functions that accept an Expression and return a different expression
 */
export type ExpressionTransformer = (value: ts.Expression) => ts.Expression;

/**
 * Helper type for type guard functions
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * TypeDescriptor is a serializable representation of a Type object.
 * It is used as an intermediate step between the type to be checked
 * and the generated type guard.
 *
 * See below for the definitions of all the possible type descriptors
 */
export type TypeDescriptor =
  | KeywordTypeDescriptor
  | LiteralTypeDescriptor
  | FunctionTypeDescriptor
  | InterfaceTypeDescriptor
  | ArrayTypeDescriptor
  | TupleTypeDescriptor
  | PromiseTypeDescriptor
  | MapTypeDescriptor
  | SetTypeDescriptor
  | ClassTypeDescriptor
  | UnionTypeDescriptor
  | IntersectionTypeDescriptor
  | NeverTypeDescriptor
  | UnspecifiedTypeDescriptor;

// All the primitive types as specified in https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#object-type
export interface KeywordTypeDescriptor {
  _type: 'keyword';
  value: 'string' | 'number' | 'boolean' | 'bigint' | 'object' | 'symbol' | 'null' | 'undefined';
}

export interface ObjectTypeDescriptor {
  properties: PropertyTypeDescriptor[];
  numberIndexType?: TypeName;
  stringIndexType?: TypeName;
}

export interface FunctionTypeDescriptor extends ObjectTypeDescriptor {
  _type: 'function';
}

export interface InterfaceTypeDescriptor extends ObjectTypeDescriptor {
  _type: 'interface';
}

export interface LiteralTypeDescriptor {
  _type: 'literal';
  value: ts.Expression;
}

export interface PropertyTypeDescriptor {
  _type: 'property';
  optional: boolean;
  accessor: ts.Expression;
  type: TypeName;
}

export interface ArrayTypeDescriptor {
  _type: 'array';
  type: TypeName;
}

export interface TupleTypeDescriptor {
  _type: 'tuple';
  types: TypeName[];
}

export interface PromiseTypeDescriptor {
  _type: 'promise';
  properties: PropertyTypeDescriptor[];
}

export interface MapTypeDescriptor {
  _type: 'map';
  keyType: TypeName;
  valueType: TypeName;
}

export interface SetTypeDescriptor {
  _type: 'set';
  type: TypeName;
}

export interface ClassTypeDescriptor {
  _type: 'class';
  value: ts.Expression;
}

export interface UnionTypeDescriptor {
  _type: 'union';
  types: TypeName[];
}

export interface IntersectionTypeDescriptor {
  _type: 'intersection';
  types: TypeName[];
}

export interface UnspecifiedTypeDescriptor {
  _type: 'unspecified';
}

export interface NeverTypeDescriptor {
  _type: 'never';
}
