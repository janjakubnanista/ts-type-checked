export type Logger = (...args: unknown[]) => void;

export const createLogger = (name = '', silent = false): Logger =>
  silent ? () => undefined : (...args: unknown[]) => console.log(name, ...args); // eslint-disable-line no-console
