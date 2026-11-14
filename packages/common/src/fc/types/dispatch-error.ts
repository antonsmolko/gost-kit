export type DispatchError = {
  kind: 'dispatch';
  path: unknown;
  error: TypeError;
};
