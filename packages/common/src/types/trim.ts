import type { Space } from './space';

export type Trim<Value extends string> = Value extends
  `${Space}${infer Inner}` | `${infer Inner}${Space}`
  ? Trim<Inner>
  : Value;
