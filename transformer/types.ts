import ts from 'typescript';

export interface PrimitiveTypeDescriptor {
  _type: 'primitive';
  value: ts.Expression;
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

export interface ObjectTypePropertyDescriptor {
  _type: 'property';
  accessor: ts.Expression;
  type: TypeName;
}

export interface ObjectTypeDescriptor {
  _type: 'object';
  constructorName?: string;
  properties: ObjectTypePropertyDescriptor[];
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
  | ObjectTypeDescriptor
  | ArrayTypeDescriptor
  | TupleTypeDescriptor
  | UnionTypeDescriptor
  | IntersectionTypeDescriptor
  | UnspecifiedTypeDescriptor;

export type TypeName = string;

export type TypeNameGenerator = (root: ts.TypeNode, type: ts.Type) => TypeName;

export type TypeDescriptorMap = Map<TypeName, TypeDescriptor>;

export type TypeCheckCreator = (typeName: TypeName, value: ts.Expression) => ts.Expression;
