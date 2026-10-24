export type RemoveOptional<T extends object> = {
  [Key in keyof T]-?: T[Key];
};
