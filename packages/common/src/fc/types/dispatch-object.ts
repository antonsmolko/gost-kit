/** @internal Constraint for inferring an API callback's dispatch object. */
export type DispatchObject = {
  action: `${string}/${string}`;
  payload?: unknown;
};
