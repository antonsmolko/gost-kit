import type { Nlx } from './nlx';

export type JSONObject = {
  [key: string]: JSONValue;
};

export type JSONValue = Nlx<string | number | boolean | JSONValue[] | JSONObject>;
