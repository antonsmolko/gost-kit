import type { Rec } from './rec.ts';

export type RecValues<T extends Rec> = T[keyof T];
