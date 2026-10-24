import type { Keyof } from './keyof';

export type ValueOf<T extends object> = T[Keyof<T>];
