import { TypeDescriptor, TypeName } from '../types';
import { TypeDescriptorRegistry, TypeNameGenerator } from '../types';
import ts from 'typescript';

/**
 * Map based implementation of TypeDescriptorRegistry
 */
export class MapTypeDescriptorRegistry implements TypeDescriptorRegistry {
  // Type to TypeName map
  private readonly typeNamesByType: Map<ts.Type, TypeName> = new Map();

  // TypeName to TypeDescriptor map
  private readonly typeDescriptorsByTypeName: Map<TypeName, TypeDescriptor> = new Map();

  // We will also need a TypeNameGenerator to create names for types
  constructor(private readonly typeNameGenerator: TypeNameGenerator) {}

  public get(typeName: TypeName): TypeDescriptor | undefined {
    // Simply get the type descriptor from the map
    return this.typeDescriptorsByTypeName.get(typeName);
  }

  public create(type: ts.Type, factory: () => TypeDescriptor): TypeName {
    // First check whether we already have a type name for this type.
    const existingTypeName = this.typeNamesByType.get(type);
    if (existingTypeName !== undefined) return existingTypeName;

    // Generate a name for this type
    const typeName = this.typeNameGenerator(type);

    // First we store the name in the map which effectively "marks" the type as resolved
    this.typeNamesByType.set(type, typeName);

    // Only then we create the type descriptor. This is important since if we didn't
    // store the typeName in typeNamesByType prior to creating the descriptor
    // we might end up spinning in type reference circles
    this.typeDescriptorsByTypeName.set(typeName, factory());

    return typeName;
  }
}
