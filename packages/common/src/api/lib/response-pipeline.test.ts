import { expect, expectTypeOf, test } from 'vitest';
import { captureRequest } from './capture-request';
import { prepareResult } from './prepare-result';
import type { TestUser } from '../types/api-client.test';

const checkPipelineTypes = async () => {
  const data: TestUser = { id: 1, name: 'Ada' };
  const result = await captureRequest(async () => {
    return {
      data,
      response: Response.json(data),
    };
  });

  if (result.type === 'ok') {
    expectTypeOf(result.data.data).toEqualTypeOf<TestUser>();
  }

  const apiResult = prepareResult(result, 'get');

  if (apiResult.type === 'ok') {
    expectTypeOf(apiResult.data).toEqualTypeOf<TestUser>();
  }

  const head = prepareResult(result, 'head');

  if (head.type === 'ok') {
    expectTypeOf(head.data).toEqualTypeOf<undefined>();
  }
};

test('pipeline type assertions are checked by tsc', () => {
  expect(checkPipelineTypes).toBeTypeOf('function');
});
