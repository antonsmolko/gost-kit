export type DuplicateKeys<THandlerTables extends readonly unknown[], TSeenKeys extends PropertyKey = never> =
  THandlerTables extends readonly [infer THandlerTable, ...infer TRemainingTables]
    ? (keyof THandlerTable & TSeenKeys) | DuplicateKeys<TRemainingTables, TSeenKeys | keyof THandlerTable>
    : never;
