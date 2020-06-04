import ts from 'typescript';

export const getPropertyAccessor = (property: ts.Symbol): ts.Expression => {
  return ts.isPropertySignature(property.valueDeclaration) && ts.isComputedPropertyName(property.valueDeclaration.name)
    ? property.valueDeclaration.name.expression
    : ts.createStringLiteral(property.name);
};
