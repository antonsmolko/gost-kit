import type { AnyFn } from '@gost-kit/common';

export type OpenChangeHandler = AnyFn<[open: boolean], void | Promise<void>>;
