import 'jest';

import { TypeDescriptorMap, TypeNameGenerator } from '../../types';
import { createTypeDescriber } from '../descriptor';
import ts from 'typescript';

describe('descriptor', () => {
  let logger: jest.Mock;
  let typeChecker: ts.TypeChecker;
  let typeNameGenerator: TypeNameGenerator;
  let typeDescriptorMap: TypeDescriptorMap;

  beforeEach(() => {
    const program = ts.createProgram({
      options: {},
      rootNames: [],
    });
    typeChecker = program.getTypeChecker();

    logger = jest.fn();

    [typeNameGenerator, typeDescriptorMap] = createTypeDescriber(logger, typeChecker);
  });

  it('should return a primitive type descriptor when passed a boolean type', () => {
    const typeNode = ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    const type = typeChecker.getTypeFromTypeNode(typeNode);
    const typeName = typeNameGenerator(ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword), type);

    expect(typeDescriptorMap.get(typeName)).toEqual({
      _type: 'primitive',
      value: 'boolean',
    });
  });
});
