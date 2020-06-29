import { HashTypeGuardRegistry } from './storage/HashTypeGuardRegistry';
import { MapTypeDescriptorRegistry } from './storage/MapTypeDescriptorRegistry';
import { TransformerOptions, defaultTransformerOptions } from './utils/transformerOptions';
import { TypeDescriptorRegistry, TypeGuardRegistry } from './types';
import { createDebugTypeNameGenerator } from './typeName/debugTypeNameGenerator';
import { createLogger } from './utils/logger';
import { createProductionTypeNameGenerator } from './typeName/productionTypeNameGenerator';
import { createTypeCheckVisitor } from './visitor/typeCheckVisitor';
import { createTypeDescriptorGenerator } from './typeDescriptor/typeDescriptorGenerator';
import { createTypeGuardGenerator } from './typeGuard/typeGuardGenerator';
import { createTypeGuardResolver } from './typeGuard/typeGuardResolver';
import { createTypeNameResolver } from './typeName/typeNameResolver';
import { transformUsingVisitor } from './utils/transformUsingVisitor';
import ts from 'typescript';

/**
 * The main transformer function.
 *
 * This needs to be registered as a TypeScript "before" transform
 * in your build/test configuration.
 *
 * See https://www.npmjs.com/package/ts-type-checked#installation for more information
 *
 * @param program {ts.Program} An instance of TypeScript Program
 * @param options {Partial<TransformerOptions>} Transformer options object
 */
export default (
  program: ts.Program,
  options: Partial<TransformerOptions> = {},
): ts.TransformerFactory<ts.SourceFile> => {
  const resolvedOptions: TransformerOptions = { ...defaultTransformerOptions, ...options };
  const { mode, logLevel, nullIsUndefined } = resolvedOptions;

  // Without strict null checks on we need to
  const compilerOptions = program.getCompilerOptions();
  const strictNullChecks = !!compilerOptions.strictNullChecks;

  // Get a reference to a TypeScript TypeChecker in order to resolve types from type nodes
  const typeChecker = program.getTypeChecker();

  return (context: ts.TransformationContext) => (file: ts.SourceFile) => {
    // Create a file specific logger
    const logger = createLogger(logLevel, `[${file.fileName}]`);

    // We will need a utility that can generate unique type names
    // that can be used to reference type descriptors and type guards.
    //
    // Since we are doing the transformation on per-file basis we will create
    // it here so that the type names are unique within one file but not necessarily
    // unique across the codebase
    const typeNameGenerator =
      mode === 'development' ? createDebugTypeNameGenerator(typeChecker) : createProductionTypeNameGenerator();

    // Now we need to walk the AST and replace all the references to isA or typeCheckFor
    // with generated type guards.
    //
    // Simple type guards (string, number etc.) will be inlined since they translate
    // into something like
    //
    // value => typeof value === 'string'
    //
    // But the interface type guards could contain cycles (on the type level, e.g.)
    //
    // interface Node {
    //   parent?: Node;
    // }
    //
    // If we inlined these the code generator would be spinning in cycles. Therefore
    // we need to store them somewhere to be able to access them by the unique type id
    // so that they can call themselves recursively.
    //
    // The solution is to create a runtime variable, a hash with type names
    // as keys and type guards as values, let's call it type guard map:
    const typeGuardRegistryIdentifier = ts.createIdentifier('___isA___');
    const typeGuardRegistry: TypeGuardRegistry = new HashTypeGuardRegistry(typeGuardRegistryIdentifier);

    const typeDescriptorRegistry: TypeDescriptorRegistry = new MapTypeDescriptorRegistry(typeNameGenerator);

    const typeGuardGenerator = createTypeGuardGenerator(
      typeGuardRegistry,
      typeDescriptorRegistry,
      strictNullChecks,
      nullIsUndefined,
    );
    const typeDescriptorCreator = createTypeDescriptorGenerator(program, logger);
    const typeNameResolver = createTypeNameResolver(typeDescriptorRegistry, typeDescriptorCreator);
    const typeGuardResolver = createTypeGuardResolver(program, typeNameResolver, typeGuardGenerator);

    // Now we need an ASTVisitor function that will replace all occurrences
    // of isA and typeCheckFor with the generated type guards
    const visitor = createTypeCheckVisitor(typeChecker, typeGuardResolver);

    // We use the visitor to transform the file
    const transformedFile = transformUsingVisitor(file, context, visitor);

    // The last step is to insert the type guard hash into the source file
    return ts.updateSourceFileNode(transformedFile, [...typeGuardRegistry.code(), ...transformedFile.statements]);
  };
};
