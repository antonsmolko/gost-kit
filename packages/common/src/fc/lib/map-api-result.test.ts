import { expect, test, vi } from 'vitest';
import { defineApiOperation, type ApiFailure } from '../../api';
import { mapApiResult } from './map-api-result';
import type { TestPaths, TestUser } from '../../api/types/api-client.test';

test.each<ApiFailure['kind']>(['http', 'network', 'contract', 'aborted'])(
  '%s failure passes through unchanged without running mapper',
  async (kind) => {
    const mapResponse = vi.fn((dto: TestUser) => {
      return { label: dto.name };
    });
    const operation = defineApiOperation<TestPaths>()({
      method: 'post',
      url: '/users/{id}',
      mapResponse,
    });
    const result = { type: 'error' as const, error: { kind, errors: [] } };

    expect(await mapApiResult(result, operation)).toBe(result);
    expect(mapResponse).not.toHaveBeenCalled();
  },
);

test('successful DTO is mapped exactly once and async mapper is awaited', async () => {
  const mapResponse = vi.fn(async (dto: TestUser) => {
    await Promise.resolve();

    return { label: dto.name };
  });
  const operation = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
    mapResponse,
  });

  expect(
    await mapApiResult({ type: 'ok', data: { id: 1, name: 'Ada' } }, operation),
  ).toEqual({ type: 'ok', data: { label: 'Ada' } });
  expect(mapResponse).toHaveBeenCalledExactlyOnceWith({ id: 1, name: 'Ada' });
});

test.each(['throw', 'reject'] as const)(
  '%s mapper failure becomes contract without inventing status',
  async (mode) => {
    const operation = defineApiOperation<TestPaths>()({
      method: 'post',
      url: '/users/{id}',
      mapResponse: () => {
        const error = new DOMException('Bad DTO', 'AbortError');

        if (mode === 'reject') {
          return Promise.reject(error);
        }

        throw error;
      },
    });

    expect(
      await mapApiResult(
        { type: 'ok', data: { id: 1, name: 'Ada' } },
        operation,
      ),
    ).toEqual({ type: 'error', error: { kind: 'contract', errors: [] } });
  },
);

test.each([null, undefined, false, 0, ''])(
  'preserves valid falsy mapper output: %j',
  async (output) => {
    const operation = defineApiOperation<TestPaths>()({
      method: 'post',
      url: '/users/{id}',
      mapResponse: () => {
        return output;
      },
    });

    expect(
      await mapApiResult(
        { type: 'ok', data: { id: 1, name: 'Ada' } },
        operation,
      ),
    ).toEqual({ type: 'ok', data: output });
  },
);
