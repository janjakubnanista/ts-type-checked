import ts from 'typescript';

/**
 * Helper function that checks whether the array of modifiers
 * contains "private" or "protected" keywords.
 *
 * @param modifiers {ts.ModifiersArray} [undefined] The array of modifiers
 */
const hasPrivateOrProtectedModifiers = (modifiers?: ts.ModifiersArray): boolean =>
  !!modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword,
  );

/**
 * Helper function that checks whether a property represented by a Symbol
 * is publicly visible, i.e. it does not have "private" or "protected" modifier
 *
 * @param property {ts.Symbol} Property symbol
 */
export const isPublicProperty = (property: ts.Symbol): boolean => {
  const declaration = property.valueDeclaration;
  if (!declaration) {
    // TODO This is just a "guess", maybe the missing declaration can mean a private/protected property
    return true;
  }

  if (
    ts.isPropertySignature(declaration) ||
    ts.isPropertyDeclaration(declaration) ||
    ts.isMethodDeclaration(declaration) ||
    ts.isMethodSignature(declaration) ||
    ts.isParameter(declaration) ||
    ts.isGetAccessor(declaration)
  )
    return !hasPrivateOrProtectedModifiers(declaration.modifiers);

  return false;
};

/**
 * Helper function that return property name as a ts.Expression.
 * It will make sure that is the property is a numeric literal,
 * it is returned as a number rather than a number-like string
 *
 * @param property {ts.Symbol} The property to get the name of
 * @param typeChecker {ts.TypeChecker} Instance of ts.TypeChecker
 * @param scope {ts.TypeNode} The root TypeNode that contained the type
 */
const getPropertyName = (property: ts.Symbol, typeChecker: ts.TypeChecker, scope: ts.TypeNode): ts.Expression => {
  // Let's get the property type
  const propertyType: ts.Type | undefined =
    // The nameType property is not documented but can serve as a good starting point,
    // saves one function call :)
    (property as any).nameType || typeChecker.getTypeOfSymbolAtLocation(property, scope);

  // If the property type exists and it looks like a number literal then let's turn it into a number
  if (propertyType && typeof propertyType.flags === 'number' && propertyType.flags & ts.TypeFlags.NumberLiteral) {
    const nameAsNumber = parseFloat(property.name);
    if (!isNaN(nameAsNumber) && String(nameAsNumber) === property.name) {
      return ts.createLiteral(nameAsNumber);
    }
  }

  return ts.createLiteral(property.name);
};

/**
 * Helper function that returns a property accessor - either a property name (e.g. 'name')
 * or a computed property expression (e.g. Symbol.toStringTag)
 *
 * @param property {ts.Symbol} The property to get the accessor of
 * @param typeChecker {ts.TypeChecker} Instance of ts.TypeChecker
 * @param scope {ts.TypeNode} The root TypeNode that contained the type
 */
export const getPropertyAccessor = (
  property: ts.Symbol,
  typeChecker: ts.TypeChecker,
  scope: ts.TypeNode,
): ts.Expression => {
  const declaration = property.valueDeclaration;
  if (
    declaration &&
    (ts.isPropertySignature(declaration) ||
      ts.isPropertyDeclaration(declaration) ||
      ts.isMethodDeclaration(declaration) ||
      ts.isMethodSignature(declaration))
  ) {
    if (ts.isComputedPropertyName(declaration.name)) return declaration.name.expression;
  }

  return getPropertyName(property, typeChecker, scope);
};
