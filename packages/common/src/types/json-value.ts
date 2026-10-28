import type { JSONObject } from './json-object';
import type { Nlx } from './nlx';

export type JSONValue = Nlx<string | number | boolean | JSONValue[] | JSONObject>;
