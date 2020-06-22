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

  private simplify(typeName: TypeName): void {
    const typeDescriptor = this.typeDescriptorsByTypeName.get(typeName);
    if (!typeDescriptor) {
      throw new Error(`Could not find type descriptor for ${typeName}`);
    }

    switch (typeDescriptor._type) {
      case 'union':
      case 'intersection':
        const uniqueTypeNames: TypeName[] = unique(typeDescriptor.types);
        this.typeDescriptorsByTypeName.set(typeName, {
          ...typeDescriptor,
          types: uniqueTypeNames,
        });

        uniqueTypeNames.forEach((typeName) => this.simplify(typeName));
        break;

      case 'function':
      case 'interface':
        this.typeDescriptorsByTypeName.set(typeName, {
          ...typeDescriptor,
          properties: typeDescriptor.properties.map((propertyTypeDescriptor) => ({})),
        });
        break;
    }
  }
}

const unique = <T>(array: T[]): T[] => Array.from(new Set(array).values());

const compareTypeDescriptors = (a: TypeDescriptor, b: TypeDescriptor): number =>
  getTypeDescriptorComplexityScore(a) - getTypeDescriptorComplexityScore(b);

const getTypeDescriptorComplexityScore = (typeDescriptor: TypeDescriptor): number => {
  switch (typeDescriptor._type) {
    // No comparisons
    case 'never':
    case 'unspecified':
      return 0;

    // One simple strict equality comparison
    case 'literal':
      return 1;

    // One simple strict equality comparison
    // One typeof call
    case 'keyword':
      return 2;

    // One instanceof call
    case 'class':
      return 5;

    // One Array.isArray function call
    // One Array.every call
    case 'tuple':
    case 'array':
      return 10;

    // One instanceof call
    // One Set.values call
    // One Array.from call
    // One type check per value
    case 'set':
      return 30;

    // One instanceof call
    // One Map.entries call
    // One Array.from call
    // Two type checks per key/value
    case 'map':
      return 50;

    // TODO For now all the other ones have 100 complexity regardless of the implementation
    default:
      return 100;
  }
};
