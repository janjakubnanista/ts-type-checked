import { LogLevel } from './logger';

export type TransformerMode = 'development' | 'production';

export interface TransformerOptions {
  logLevel: LogLevel;
  mode: TransformerMode;
  /**
   * When nullIsUndefined is truthy, null passes as an undefined.
   *
   * That goes for optional properties as well as explicitly undefined properties,
   * good for when your backend sends nulls for optional properties
   *
   * @example
   * ```
   * interface MyInterface {
   *   optional?: boolean;
   *   possiblyUndefined: string | undefined;
   * }
   *
   * // With nullIsUndefined = false (default)
   *
   * isA<undefined>(null); // false
   * isA<MyInterface>({ optional: null }); // false
   * isA<MyInterface>({ possiblyUndefined: null }); // false
   *
   * // With nullIsUndefined = true
   *
   * isA<undefined>(null); // true
   * isA<MyInterface>({ optional: null }); // true
   * isA<MyInterface>({ possiblyUndefined: null }); // true
   * ```
   */
  nullIsUndefined: boolean;
}

const isDevelopment = process.env.NODE_ENVIRONMENT === 'development';

export const defaultTransformerOptions: TransformerOptions = {
  mode: isDevelopment ? 'development' : 'production',
  logLevel: 'normal',
  nullIsUndefined: false,
};
