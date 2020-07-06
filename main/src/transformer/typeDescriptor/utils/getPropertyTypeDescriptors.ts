import { PropertyTypeDescriptor, TypeNameResolver } from '../../types';
import { getPropertyAccessor, isPublicProperty } from '../../utils/ast';
import ts from 'typescript';

export const getPropertyTypeDescriptors = (
  typeChecker: ts.TypeChecker,
  scope: ts.TypeNode,
  properties: ts.Symbol[],
  typeNameResolver: TypeNameResolver,
): PropertyTypeDescriptor[] => {
  return properties.filter(isPublicProperty).map((property) => {
    const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, scope);
    const accessor: ts.Expression = getPropertyAccessor(property, typeChecker, scope);

    return {
      _type: 'property',
      accessor,
      type: typeNameResolver(scope, propertyType),
    };
  });
};
