export type OmitStrict<T, Keys extends keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
>;
