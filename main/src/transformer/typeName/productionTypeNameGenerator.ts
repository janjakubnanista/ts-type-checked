import { TypeName } from '../types';
import { TypeNameGenerator } from '../types';

export const createProductionTypeNameGenerator = (): TypeNameGenerator => {
  const existingNames: Set<number> = new Set();

  return (): TypeName => {
    let typeName = existingNames.size;
    while (existingNames.has(typeName)) typeName++;

    existingNames.add(typeName);

    return String(typeName);
  };
};
