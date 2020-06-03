import { LogLevel, createLogger } from './logger';
import { createTypeChecker } from './checker/checker';
import { createTypeDescriber } from './descriptor/createTypeDescriber';
import { visitNodeAndChildren } from './visitor';
import ts from 'typescript';

export interface TransformerOptions {
  logLevel: LogLevel;
}

const defaultTransformerOptions: TransformerOptions = {
  logLevel: 'normal',
};

// The transformer function
export default (
  program: ts.Program,
  partialOptions: Partial<TransformerOptions> = {},
): ts.TransformerFactory<ts.SourceFile> => {
  const options: TransformerOptions = { ...defaultTransformerOptions, ...partialOptions };

  return (context: ts.TransformationContext) => (file: ts.SourceFile) => {
    // Make the logger silent unless options.debug is true
    const logger = createLogger(options.logLevel, `[${file.fileName}]`);

    // Get a reference to a TypeScript TypeChecker in order to resolve types from type nodes
    const typeChecker = program.getTypeChecker();
    const typeCheckMapIdentifier: ts.Identifier = ts.createIdentifier('__isA');
    const [typeDescriber, typeDescriptorMap] = createTypeDescriber(logger.indent(), program, typeChecker);
    const [typeCheckCreator, typeCheckMapCreator] = createTypeChecker(typeCheckMapIdentifier, typeDescriptorMap);

    const typeCheckExpressionCreator = (typeNode: ts.TypeNode, value: ts.Expression): ts.Expression => {
      logger.debug('Processing', typeNode.getFullText());

      const type = typeChecker.getTypeFromTypeNode(typeNode);
      const typeDescriptorName = typeDescriber(typeNode, type);

      return typeCheckCreator(typeDescriptorName, value);
    };

    // First transform the file
    const transformedFile = visitNodeAndChildren(file, program, context, typeCheckExpressionCreator);

    return ts.updateSourceFileNode(transformedFile, [typeCheckMapCreator(), ...transformedFile.statements]);
  };
};
