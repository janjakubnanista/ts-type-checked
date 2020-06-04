import { TypeName } from '../types';

export function getUniqueTypeName(typeName: TypeName, takenNames: string[]): TypeName {
  let uniqueTypeName = typeName;
  let attempt = 1;
  while (takenNames.includes(uniqueTypeName)) {
    uniqueTypeName = typeName + '~' + attempt++;
  }

  return uniqueTypeName;
}
