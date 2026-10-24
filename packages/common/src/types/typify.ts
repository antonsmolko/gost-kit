export type Typify<T> = {
  [Key in keyof T as Key extends string ? Key : never]: T[Key];
};
