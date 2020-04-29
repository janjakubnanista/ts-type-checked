import ts from 'typescript';

export interface PropertyTypeDescriptor {
  _type: 'property';
  accessor: ts.Expression;
  type: TypeName;
}

export interface PrimitiveTypeDescriptor {
  _type: 'primitive';
  value: ts.Expression;
}

export interface ObjectTypeDescriptor {
  _type: 'object';
}

export interface LiteralTypeDescriptor {
  _type: 'literal';
  value: ts.Expression;
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

export interface InterfaceTypeDescriptor {
  _type: 'interface';
  callable?: boolean;
  properties: PropertyTypeDescriptor[];
  stringIndexType?: TypeName;
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

export type TypeDescriptor =
  | PrimitiveTypeDescriptor
  | LiteralTypeDescriptor
  | InterfaceTypeDescriptor
  | ObjectTypeDescriptor
  | ArrayTypeDescriptor
  | TupleTypeDescriptor
  | PromiseTypeDescriptor
  | MapTypeDescriptor
  | SetTypeDescriptor
  | ClassTypeDescriptor
  | UnionTypeDescriptor
  | IntersectionTypeDescriptor
  | UnspecifiedTypeDescriptor;

export type TypeName = string;

export type TypeNameGenerator = (root: ts.TypeNode, type: ts.Type) => TypeName;

export type TypeDescriptorMap = Map<TypeName, TypeDescriptor>;

export type TypeCheckCreator = (typeName: TypeName, value: ts.Expression) => ts.Expression;

export type TypeCheckMapCreator = () => ts.Statement;
