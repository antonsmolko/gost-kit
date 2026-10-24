export type AllRequired<T> = {
  [Key in keyof T]-?: T[Key];
};
