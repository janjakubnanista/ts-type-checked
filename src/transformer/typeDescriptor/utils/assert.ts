import { LibraryTypeDescriptorName } from './getLibraryTypeDescriptorName';
import ts from 'typescript';

export const isBigInt = (type: ts.Type, libraryDescriptorName?: LibraryTypeDescriptorName): boolean =>
  !!(type.flags & ts.TypeFlags.BigInt) || libraryDescriptorName === 'BigInt';

export const isBoolean = (type: ts.Type, libraryDescriptorName?: LibraryTypeDescriptorName): boolean =>
  !!(type.flags & ts.TypeFlags.Boolean) || libraryDescriptorName === 'Boolean';

export const isString = (type: ts.Type, libraryDescriptorName?: LibraryTypeDescriptorName): boolean =>
  !!(type.flags & ts.TypeFlags.String) || libraryDescriptorName === 'String';

export const isNumber = (type: ts.Type, libraryDescriptorName?: LibraryTypeDescriptorName): boolean =>
  !!(type.flags & ts.TypeFlags.Number) || libraryDescriptorName === 'Number';

export const isSymbol = (type: ts.Type, libraryDescriptorName?: LibraryTypeDescriptorName): boolean =>
  !!(type.flags & ts.TypeFlags.ESSymbol) || libraryDescriptorName === 'Symbol';

export const isDate = (
  type: ts.Type,
  libraryDescriptorName?: LibraryTypeDescriptorName,
): libraryDescriptorName is LibraryTypeDescriptorName => libraryDescriptorName === 'Date';

export const isMap = (type: ts.Type, libraryDescriptorName?: LibraryTypeDescriptorName): type is ts.TypeReference =>
  libraryDescriptorName === 'Map';

export const isSet = (type: ts.Type, libraryDescriptorName?: LibraryTypeDescriptorName): type is ts.TypeReference =>
  libraryDescriptorName === 'Set';

export const isPromise = (type: ts.Type, libraryDescriptorName?: LibraryTypeDescriptorName): boolean =>
  libraryDescriptorName === 'Promise';

export const isInterface = (type: ts.Type, libraryDescriptorName?: LibraryTypeDescriptorName): boolean =>
  !!(type.flags & ts.TypeFlags.Object) || libraryDescriptorName === 'Object';

export const isLiteral = (type: ts.Type): type is ts.LiteralType =>
  type.isLiteral() || !!(type.flags & ts.TypeFlags.BigIntLiteral);

export const isNull = (type: ts.Type): boolean => !!(type.flags & ts.TypeFlags.Null);

export const isUndefined = (type: ts.Type): boolean =>
  !!(type.flags & ts.TypeFlags.Undefined || type.flags & ts.TypeFlags.Void);

export const isAny = (type: ts.Type): boolean => !!(type.flags & ts.TypeFlags.Any || type.flags & ts.TypeFlags.Unknown);

export const isNever = (type: ts.Type): boolean => !!(type.flags & ts.TypeFlags.Never);

export const isObjectKeyword = (typeNode: ts.TypeNode | undefined): boolean =>
  typeNode?.kind === ts.SyntaxKind.ObjectKeyword;

export const isTrueKeyword = (typeNode: ts.TypeNode | undefined): boolean =>
  typeNode?.kind === ts.SyntaxKind.TrueKeyword;

export const isFalseKeyword = (typeNode: ts.TypeNode | undefined): boolean =>
  typeNode?.kind === ts.SyntaxKind.FalseKeyword;

export const isTuple = (type: ts.Type, typeNode: ts.TypeNode | undefined): type is ts.TupleType =>
  typeNode?.kind === ts.SyntaxKind.TupleType;

export const isFunction = (
  type: ts.Type,
  libraryDescriptorName?: LibraryTypeDescriptorName,
  typeNode?: ts.TypeNode,
): boolean =>
  typeNode?.kind === ts.SyntaxKind.FunctionType ||
  typeNode?.kind === ts.SyntaxKind.ConstructorType ||
  libraryDescriptorName === 'Function' ||
  !!type.getConstructSignatures()?.length ||
  !!type.getCallSignatures()?.length;

const isArrayType = (typeChecker: ts.TypeChecker, type: ts.Type): boolean =>
  typeof (typeChecker as any).isArrayType === 'function' && !!(typeChecker as any)?.isArrayType(type);

export const isArray = (
  typeChecker: ts.TypeChecker,
  type: ts.Type,
  libraryDescriptorName?: LibraryTypeDescriptorName,
  typeNode?: ts.TypeNode,
): type is ts.TypeReference =>
  typeNode?.kind === ts.SyntaxKind.ArrayType || libraryDescriptorName === 'Array' || isArrayType(typeChecker, type);
