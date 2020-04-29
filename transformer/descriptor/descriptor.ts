import { Logger } from '../logger';
import { ResolveTypeDescriptor, getTypeDescriptor, getUniqueTypeName } from './utils';
import { TypeDescriptor, TypeDescriptorMap, TypeName, TypeNameGenerator } from '../types';
import { objectFlags, typeFlags } from '../utils';
import ts from 'typescript';

export const createTypeDescriber = (
  logger: Logger,
  program: ts.Program,
  typeChecker: ts.TypeChecker,
): [TypeNameGenerator, TypeDescriptorMap] => {
  const resolvedTypeNames: Map<ts.Type, TypeName> = new Map();
  const resolvedTypeDescriptors: TypeDescriptorMap = new Map();

  function describeType(scope: ts.TypeNode, type: ts.Type): TypeName {
    const typeName = typeChecker.typeToString(type);

    logger.info('Describing', typeName);
    logger.debug('\tType flags: ', typeFlags(type).join(', '));
    logger.debug('\tObject flags: ', objectFlags(type).join(', '));

    const resolvedTypeName = resolvedTypeNames.get(type);
    if (resolvedTypeName) return resolvedTypeName;

    const rawTypeName = typeChecker.typeToString(type);
    const uniqueTypeName = getUniqueTypeName(rawTypeName, Array.from(resolvedTypeNames.values()));

    resolvedTypeNames.set(type, uniqueTypeName);

    const typeDescriptor = resolveTypeDescriptor(getTypeDescriptor(logger.indent(), program, type, scope));
    resolvedTypeDescriptors.set(uniqueTypeName, typeDescriptor);

    return uniqueTypeName;
  }

  function resolveTypeDescriptor(typeDescriptor: TypeDescriptor | ResolveTypeDescriptor): TypeDescriptor {
    return typeof typeDescriptor === 'function'
      ? typeDescriptor((scope, type) => describeType(scope, type))
      : typeDescriptor;
  }

  return [describeType, resolvedTypeDescriptors];
};
