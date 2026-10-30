import type { JSONValue } from './json-value';

export type JSONObject = {
  [key: string]: JSONValue;
};
