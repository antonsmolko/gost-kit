type NonNeverKeys<T extends object> = {
  [Key in keyof T]: [T[Key]] extends [never] ? never : Key;
}[keyof T];

export type OmitNever<T extends object> = Pick<T, NonNeverKeys<T>>;
