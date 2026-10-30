import type { Rec } from '../../types';

export type Logger = {
  trace(message: string, payload?: Rec): void;
  debug(message: string, payload?: Rec): void;
  info(message: string, payload?: Rec): void;
  warn(message: string, payload?: Rec): void;
  error(error: string | Error, payload?: Rec): void;
};