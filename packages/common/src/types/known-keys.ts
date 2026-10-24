export type KnownKeys<T extends object> = {
  [
    Key in keyof T as string extends Key
      ? never
      : number extends Key
        ? never
        : symbol extends Key
          ? never
          : Key
  ]: T[Key];
};
