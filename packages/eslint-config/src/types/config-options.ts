export type ConfigOptions = {
  /** Absolute root of the consuming project's TypeScript configuration. */
  tsconfigRootDir: string;
  /** Enable rules that import helpers from @gost-kit/common. */
  common?: boolean;
};
