import type { Nil } from './nil';

export type JSONObject = {
  [key: string]: JSONValue;
};

export type JSONValue = Nil<string | number | boolean | object | JSONValue[] | JSONObject>;
