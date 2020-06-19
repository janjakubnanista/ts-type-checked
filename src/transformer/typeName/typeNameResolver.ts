import { TypeDescriptor, TypeName } from '../types';
import {
  TypeDescriptorGenerator,
  TypeDescriptorGeneratorCallback,
  TypeDescriptorRegistry,
  TypeNameResolver,
} from '../types';
import ts from 'typescript';

export const createTypeNameResolver = (
  registry: TypeDescriptorRegistry,
  typeDescriptorGenerator: TypeDescriptorGenerator,
): TypeNameResolver => {
  const typeNameResolver = (scope: ts.TypeNode, type: ts.Type): TypeName => {
    // FIXME Maybe the registry does not need to pass typeName as the first parameter to create factory
    const typeName: TypeName = registry.create(type, () => {
      const typeDescriptorOrCallback: TypeDescriptor | TypeDescriptorGeneratorCallback = typeDescriptorGenerator(
        scope,
        type,
      );
      const typeDescriptor: TypeDescriptor =
        typeof typeDescriptorOrCallback === 'function'
          ? typeDescriptorOrCallback(typeNameResolver)
          : typeDescriptorOrCallback;

      return typeDescriptor;
    });

    return typeName;
  };

  return typeNameResolver;
};
