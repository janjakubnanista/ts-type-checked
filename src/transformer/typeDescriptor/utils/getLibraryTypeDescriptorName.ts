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
  | 'RegExp'
  | 'Map'
  | 'Set'
  | 'Symbol';

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
  RegExp: 'RegExp',
  Map: 'Map',
  Set: 'Set',
  Symbol: 'Symbol',
};

export const isSourceFileDefaultLibrary = (program: ts.Program, file: ts.SourceFile): boolean => {
  if (program.isSourceFileDefaultLibrary(file)) return true;
  if (file.fileName.match(/typescript\/lib\/lib\..*\.d\.ts$/)) return true;

  return false;
};

export const getLibraryTypeDescriptorName = (
  program: ts.Program,
  type: ts.Type,
): LibraryTypeDescriptorName | undefined => {
  const declaration = getFirstValidDeclaration(type.symbol?.declarations);
  const sourceFile = declaration?.getSourceFile();

  if (!sourceFile || !isSourceFileDefaultLibrary(program, sourceFile)) return undefined;

  return typeDescriptorNameBySymbolName[type.symbol?.name];
};
