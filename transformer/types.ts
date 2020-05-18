import ts from 'typescript';

// All the primitive types as specified in https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#object-type
export interface KeywordTypeDescriptor {
  _type: 'keyword';
  value: 'string' | 'number' | 'boolean' | 'bigint' | 'object' | 'symbol' | 'null' | 'undefined' | 'function';
}

export interface InterfaceTypeDescriptor {
  _type: 'interface';
  callable?: boolean;
  properties: PropertyTypeDescriptor[];
  numberIndexType?: TypeName;
  stringIndexType?: TypeName;
}

export interface LiteralTypeDescriptor {
  _type: 'literal';
  value: ts.Expression;
}

export interface PropertyTypeDescriptor {
  _type: 'property';
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

export type TypeDescriptor =
  | KeywordTypeDescriptor
  | LiteralTypeDescriptor
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

export type TypeName = string;

export type TypeNameGenerator = (root: ts.TypeNode, type: ts.Type) => TypeName;

export type TypeDescriptorMap = Map<TypeName, TypeDescriptor>;

export type TypeCheckCreator = (typeName: TypeName, value: ts.Expression) => ts.Expression;

export type TypeCheckMapCreator = () => ts.Statement;
