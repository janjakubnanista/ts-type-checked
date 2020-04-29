/* eslint-disable no-console */
export type LoggerMethod = (...args: unknown[]) => void;

export interface Logger {
  debug: LoggerMethod;
  info: LoggerMethod;
  warn: LoggerMethod;
  error: LoggerMethod;
  indent: () => Logger;
}

export enum LogFeature {
  DEBUG = 1,
  INFO = 2,
  WARN = 4,
  ERROR = 8,
}

export type LogLevel = 'debug' | 'normal' | 'nosey' | 'silent';

const LOG_FEATURES: Record<LogLevel, number> = {
  debug: LogFeature.DEBUG | LogFeature.INFO | LogFeature.WARN | LogFeature.ERROR,
  nosey: LogFeature.INFO | LogFeature.WARN | LogFeature.ERROR,
  normal: LogFeature.WARN | LogFeature.ERROR,
  silent: 0,
};

const noop: () => void = () => undefined;

const bindConsole = (method: 'debug' | 'info' | 'warn' | 'error', prefix: unknown[]): LoggerMethod =>
  console[method].bind(console, ...prefix);

export const createLogger = (logLevel: LogLevel, ...prefix: unknown[]): Logger => {
  const logFeatures = LOG_FEATURES[logLevel];

  return {
    debug: logFeatures & LogFeature.DEBUG ? bindConsole('debug', prefix) : noop,
    info: logFeatures & LogFeature.INFO ? bindConsole('info', prefix) : noop,
    warn: logFeatures & LogFeature.WARN ? bindConsole('warn', prefix) : noop,
    error: logFeatures & LogFeature.ERROR ? bindConsole('error', prefix) : noop,
    indent: () => createLogger(logLevel, ...prefix, '\t'),
  };
};
