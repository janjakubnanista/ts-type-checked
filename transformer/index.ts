import { createLogger, createTypeCheckerFunction } from './utils';
import { createTypeCheckCreator } from './createTypeCheckCreator';
import { createTypeCheckWithMapCreator } from './createTypeCheckWithMapCreator';
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
    const typeCheckCreator = createTypeCheckCreator(typeChecker, logger);
    const [typeCheckWithMapCreator, typeCheckMapStatementCreator] = createTypeCheckWithMapCreator(typeCheckCreator);

    const isACallVisitor = (typeNode: ts.TypeNode): ts.Expression => {
      logger('Processing', typeNode.getFullText());
      const type = typeChecker.getTypeFromTypeNode(typeNode);

      return createTypeCheckerFunction(value => typeCheckWithMapCreator(typeNode, type, value));
    };

    // First transform the file
    const transformedFile = visitNodeAndChildren(file, program, context, isACallVisitor);

    return ts.updateSourceFileNode(transformedFile, [typeCheckMapStatementCreator(), ...transformedFile.statements]);
  };
};
