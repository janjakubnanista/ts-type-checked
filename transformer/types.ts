import ts from 'typescript';

export type TypeGuardCreator = (
  root: ts.TypeNode,
  type: ts.Type,
  nestedTypeGuardCreator?: TypeGuardCreator,
) => ts.Expression;

// export type PluggableTypeCheckCreator = (
//   root: ts.TypeNode,
//   type: ts.Type,
//   value: ts.Expression,
//   nestedTypeCheckCreator?: TypeCheckCreator,
// ) => ts.Expression;

// export type TypeCheckCreator = (root: ts.TypeNode, type: ts.Type, value: ts.Expression) => ts.Expression;
