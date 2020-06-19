import ts from 'typescript';

/**
 * Helper debugging function that takes a type as a parameter and returns
 * a human-readable list of its flags
 *
 * @param type {ts.Type}
 *
 * @returns {String[]} Array of type flags names
 */
export const typeFlags = (type: ts.Type): string[] => {
  return Object.keys(ts.TypeFlags).filter((flagName) => !!((ts.TypeFlags[flagName as any] as any) & type.flags));
};

/**
 * Helper debugging function that takes a type as a parameter and returns
 * a human-readable list of its object flags (if it has any)
 *
 * @param type {ts.Type}
 *
 * @returns {String[]} Array of object flags names
 */
export const objectFlags = (type: ts.Type): string[] => {
  const objectFlags = (type as ts.TypeReference).objectFlags;
  if (typeof objectFlags !== 'number') return [];

  return Object.keys(ts.ObjectFlags).filter((flagName) => !!((ts.ObjectFlags[flagName as any] as any) & objectFlags));
};

/**
 * Helper debugging function that takes a Symbol as a parameter and returns
 * a human-readable list of its flags
 *
 * @param type {ts.Symbol}
 *
 * @returns {String[]} Array of symbol flags names
 */
export const symbolFlags = (symbol: ts.Symbol): string[] => {
  return Object.keys(ts.SymbolFlags).filter((flagName) => !!((ts.SymbolFlags[flagName as any] as any) & symbol.flags));
};
