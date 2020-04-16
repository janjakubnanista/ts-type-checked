import { createLogger } from './utils';
import { createTypeCheckWithMapCreator } from './createTypeCheckWithMapCreator';
import { createTypeDescriber } from './descriptor';
import { createTypeGuardCreator } from './createTypeGuardCreator';
import { visitNodeAndChildren } from './visitor';
import ts from 'typescript';

interface TypeCheckMethod {
  name: string;
  definition: ts.ArrowFunction;
}

export interface TransformerOptions {
  debug?: boolean;
}

// The transformer function
export default (program: ts.Program, options: TransformerOptions = {}): ts.TransformerFactory<ts.SourceFile> => {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => {
    // Make the logger silent unless options.debug is true
    const logger = createLogger(`[${file.fileName}]`, !options.debug);

    // Get a reference to a TypeScript TypeChecker in order to resolve types from type nodes
    const typeChecker = program.getTypeChecker();
    const typeCheckCreator = createTypeGuardCreator(typeChecker, logger);
    const [typeCheckWithMapCreator, typeCheckMapStatementCreator] = createTypeCheckWithMapCreator(typeCheckCreator);

    const [typeDescriber, typeDescriptorMap] = createTypeDescriber(logger, typeChecker);

    const typeCheckExpressionCreator = (typeNode: ts.TypeNode): ts.Expression => {
      logger('Processing', typeNode.getFullText());
      const type = typeChecker.getTypeFromTypeNode(typeNode);
      const typeDescriptor = typeDescriber(typeNode, type);
      console.warn('Descriptor', typeDescriptor);

      return typeCheckWithMapCreator(typeNode, type);
    };

    console.warn('type descriptor map', typeDescriptorMap.size());

    // First transform the file
    const transformedFile = visitNodeAndChildren(file, program, context, typeCheckExpressionCreator);

    return ts.updateSourceFileNode(transformedFile, [typeCheckMapStatementCreator(), ...transformedFile.statements]);
  };
};
