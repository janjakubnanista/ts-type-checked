import { getFirstValidDeclaration } from './getFirstValidDeclaration';
import ts from 'typescript';

export type LibraryTypeDescriptorName =
  | 'Array'
  | 'BigInt'
  | 'Date'
  | 'Number'
  | 'String'
  | 'Boolean'
  | 'Object'
  | 'Function'
  | 'Promise'
  | 'Map'
  | 'Set';

const typeDescriptorNameBySymbolName: Record<string, LibraryTypeDescriptorName> = {
  Array: 'Array',
  ReadonlyArray: 'Array',
  BigInt: 'BigInt',
  Number: 'Number',
  Function: 'Function',
  Date: 'Date',
  String: 'String',
  Boolean: 'Boolean',
  Object: 'Object',
  Promise: 'Promise',
  Map: 'Map',
  Set: 'Set',
};

export const getLibraryTypeDescriptorName = (
  program: ts.Program,
  type: ts.Type,
): LibraryTypeDescriptorName | undefined => {
  const declaration = getFirstValidDeclaration(type.symbol?.declarations);
  const sourceFile = declaration?.getSourceFile();

  if (!sourceFile || !program.isSourceFileDefaultLibrary(sourceFile)) return undefined;

  return typeDescriptorNameBySymbolName[type.symbol?.name];
};
