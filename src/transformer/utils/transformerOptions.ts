import { LogLevel } from './logger';

export type TransformerMode = 'development' | 'production';

export interface TransformerOptions {
  logLevel: LogLevel;
  mode: TransformerMode;
}

const isDevelopment = process.env.NODE_ENVIRONMENT === 'development';

export const defaultTransformerOptions: TransformerOptions = {
  mode: isDevelopment ? 'development' : 'production',
  logLevel: 'normal',
};
