import type { Keyof } from './keyof.ts';

export type ValueOf<T extends object> = T[Keyof<T>];
