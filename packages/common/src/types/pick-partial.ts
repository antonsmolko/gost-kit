export type PickPartial<T, Keys extends keyof T> = Omit<T, Keys> &
  Partial<Pick<T, Keys>>;
