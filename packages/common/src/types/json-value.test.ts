import { expectTypeOf, test } from 'vitest';
import type { JSONObject, JSONValue, Nlx } from '..';

test('public JSON types accept recursive JSON data and exclude non-JSON values', () => {
  expectTypeOf<{
    items: [null, boolean, { id: string }];
  }>().toExtend<JSONObject>();
  expectTypeOf<JSONObject>().toExtend<JSONValue>();
  expectTypeOf<
    Nlx<string | number | boolean | JSONValue[]>
  >().toExtend<JSONValue>();
  expectTypeOf<undefined>().not.toExtend<JSONValue>();
  expectTypeOf<Date>().not.toExtend<JSONValue>();
  expectTypeOf<{ callback: () => void }>().not.toExtend<JSONObject>();
});
