export type PickRequired<T, Keys extends keyof T> = Omit<T, Keys> &
  Required<Pick<T, Keys>>;
