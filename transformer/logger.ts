// const SILENT = false;
const SILENT = true;

export interface Logger {
  (message: string, ...args: unknown[]): void;
  indent: () => Logger;
}

export const createLogger = (prefix = ''): Logger => {
  return Object.assign(
    (message: string, ...args: unknown[]) => (SILENT ? undefined : console.log(prefix + message, ...args)),
    {
      indent: () => createLogger('\t' + prefix),
    },
  );
};
