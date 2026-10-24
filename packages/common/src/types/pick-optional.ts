type OptionalKeys<T extends object> = {
  [Key in keyof T]-?: object extends Pick<T, Key> ? Key : never;
}[keyof T];

export type PickOptional<T extends object> = Pick<T, OptionalKeys<T>>;
