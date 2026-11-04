import { expect, expectTypeOf, test } from 'vitest';
import { executeRequest } from './execute-request';
import { readResult } from './read-result';
import type { TestUser } from '../types/api-request.test';

const checkPipelineTypes = async () => {
  const data: TestUser = { id: 1, name: 'Ada' };
  const execution = await executeRequest(async () => ({
    data,
    response: Response.json(data),
  }));

  if (execution.type === 'ok') {
    expectTypeOf(execution.data.data).toEqualTypeOf<TestUser>();

    const result = readResult(execution.data, 'get');

    if (result.type === 'ok') {
      expectTypeOf(result.data).toEqualTypeOf<TestUser>();
    }

    const head = readResult(execution.data, 'head');

    if (head.type === 'ok') {
      expectTypeOf(head.data).toEqualTypeOf<undefined>();
    }
  }
};

test('pipeline type assertions are checked by tsc', () => {
  expect(checkPipelineTypes).toBeTypeOf('function');
});
