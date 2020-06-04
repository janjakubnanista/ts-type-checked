import { PropertyTypeDescriptor, TypeNameResolver } from '../types';
import { getPropertyAccessor } from './getPropertyAccessor';
import ts from 'typescript';

export const getPropertyTypeDescriptors = (
  typeChecker: ts.TypeChecker,
  scope: ts.TypeNode,
  type: ts.Type,
  resolve: TypeNameResolver,
): PropertyTypeDescriptor[] => {
  return type.getProperties().map((property) => {
    const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, scope);
    const accessor: ts.Expression = getPropertyAccessor(property);

    return {
      _type: 'property',
      accessor,
      type: resolve(scope, propertyType),
    };
  });
};
