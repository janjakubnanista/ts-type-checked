import { getFirstValidDeclaration } from './getFirstValidDeclaration';
import { isSourceFileDefaultLibrary } from './getLibraryTypeDescriptorName';
import ts from 'typescript';

export const getDOMElementClassName = (program: ts.Program, type: ts.Type): string | undefined => {
  const declaration = getFirstValidDeclaration(type.symbol?.declarations);
  const sourceFile = declaration?.getSourceFile();

  if (!sourceFile || !isSourceFileDefaultLibrary(program, sourceFile)) return undefined;
  if (!sourceFile.fileName.match(/lib.dom.d.ts$/)) return undefined;
  if (!type.symbol?.name.match(/(Element|^Document|^Node)$/i)) return undefined;

  return type.symbol.name;
};
