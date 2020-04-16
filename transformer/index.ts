import { createLogger } from './utils';
// import { createTypeCheckWithMapCreator } from './createTypeCheckWithMapCreator';
import { createTypeChecker } from './checker/checker';
import { createTypeDescriber } from './descriptor/descriptor';
// import { createTypeGuardCreator } from './createTypeGuardCreator';
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
    const typeCheckMapIdentifier: ts.Identifier = ts.createIdentifier('__isA');
    const [typeDescriber, typeDescriptorMap] = createTypeDescriber(logger, typeChecker);
    const [typeCheckCreator, typeCheckMapCreator] = createTypeChecker(typeCheckMapIdentifier, typeDescriptorMap);

    const typeCheckExpressionCreator = (typeNode: ts.TypeNode, value: ts.Expression): ts.Expression => {
      logger('Processing', typeNode.getFullText());

      const type = typeChecker.getTypeFromTypeNode(typeNode);
      const typeDescriptorName = typeDescriber(typeNode, type);

      return typeCheckCreator(typeDescriptorName, value);
    };

    // First transform the file
    const transformedFile = visitNodeAndChildren(file, program, context, typeCheckExpressionCreator);

    // console.warn('type descriptor map', typeDescriptorMap.entries());
    // console.warn('type function map', typeCheckFunctionMap.size);

    return ts.updateSourceFileNode(transformedFile, [typeCheckMapCreator(), ...transformedFile.statements]);
  };
};
