export type OmitRequired<T extends object> = {
  [Key in keyof T as T[Key] extends Required<T>[Key] ? Key : never]: T[Key];
};
