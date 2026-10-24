import type { DuplicateKeys } from './duplicate-keys.ts';

// Fixed tuple positions have string indices; a numeric index is a dynamic rest.
export type Unique<THandlerTables extends readonly unknown[]> = {
  [TIndex in keyof THandlerTables]: THandlerTables[TIndex] & (
    TIndex extends number ? never : { [TDuplicateKey in DuplicateKeys<THandlerTables>]: never }
  );
};
