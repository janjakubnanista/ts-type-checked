import ts from 'typescript';

export const getFirstValidDeclaration = (declarations: ts.Declaration[] | undefined): ts.Declaration | undefined => {
  return (
    declarations?.find(
      (declaration) => !ts.isVariableDeclaration(declaration) && !ts.isFunctionDeclaration(declaration),
    ) || declarations?.[0]
  );
};
