import type { Rec } from './rec';

export type RecValues<T extends Rec> = T[keyof T];
