import { expect, expectTypeOf, test, vi } from 'vitest';
import { defineApiOperation } from '../../api';
import { createApiEffect } from './create-api-effect';
import type { TestPaths, TestUser } from '../../api/types/api-client.test';
import type { ApiEffect } from '../types/api-effect';
import type { AppError } from '../../app-error';

const fallback: AppError = { code: 'LOAD', message: 'Failed', path: [] };
const operation = defineApiOperation<TestPaths>()({
  method: 'post',
  url: '/users/{id}',
  mapResponse: (dto) => {
    return { label: dto.name };
  },
});

type SuccessAction = { type: 'LoadedAction'; label: string };
type ErrorAction = { type: 'FailedAction'; errors: AppError[] };

const checkTypes = () => {
  const effect = createApiEffect(operation, {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    onSuccess: (user) => {
      expectTypeOf(user).toEqualTypeOf<{ label: string }>();

      return { type: 'LoadedAction', label: user.label };
    },
    onError: (errors) => {
      return { type: 'FailedAction', errors };
    },
  });
  const rootEffect: ApiEffect<typeof operation, SuccessAction, ErrorAction> =
    effect;

  // @ts-expect-error missing required body
  createApiEffect(operation, {
    params: { path: { id: 1 } },
    defaultError: fallback,
  });
  createApiEffect(operation, {
    // @ts-expect-error wrong path param
    params: { path: { id: 'one' } },
    body: { name: 'Ada' },
    defaultError: fallback,
  });
  // @ts-expect-error missing params
  createApiEffect(operation, { body: { name: 'Ada' }, defaultError: fallback });
  createApiEffect(operation, {
    // @ts-expect-error no route override
    method: 'get',
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
  });
  createApiEffect(operation, {
    // @ts-expect-error no operation override
    operation,
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
  });
  createApiEffect(operation, {
    // @ts-expect-error JSON-only
    parseAs: 'text',
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
  });
  createApiEffect(operation, {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    // @ts-expect-error mapped callback receives domain, not DTO
    onSuccess: (_dto: TestUser) => {
      return { type: 'LoadedAction', label: '' };
    },
  });

  const wrongAction = createApiEffect(operation, {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    onSuccess: () => {
      return { type: 'WrongAction' };
    },
  });
  // @ts-expect-error RootAction validation
  const invalid: ApiEffect<typeof operation, SuccessAction, ErrorAction> =
    wrongAction;
  const other = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
    mapResponse: (dto) => {
      return dto.id;
    },
  });
  const otherEffect = createApiEffect(other, {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    onSuccess: (id) => {
      expectTypeOf(id).toEqualTypeOf<number>();

      return { type: 'LoadedAction', label: String(id) };
    },
  });
  const union: ApiEffect<
    typeof operation | typeof other,
    SuccessAction,
    ErrorAction
  > = otherEffect;
  // @ts-expect-error callback input must correlate with the selected operation
  const mixed: ApiEffect<
    typeof operation | typeof other,
    SuccessAction,
    ErrorAction
  > = {
    ...otherEffect,
    onSuccess: (_user: { label: string }) => {
      return {
        type: 'LoadedAction' as const,
        label: '',
      };
    },
  };
  const queryOperation = defineApiOperation<{
    '/search': {
      get: {
        parameters: { query: { term: string } };
        responses: { 200: { content: { 'application/json': string[] } } };
      };
    };
  }>()({ method: 'get', url: '/search' });

  createApiEffect(queryOperation, {
    params: { query: { term: 'Ada' } },
    defaultError: fallback,
  });
  // @ts-expect-error required query
  createApiEffect(queryOperation, { defaultError: fallback });

  createApiEffect(operation, {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    // @ts-expect-error callbacks must return an action discriminator
    onSuccess: () => {
      return { type: 'wrong' };
    },
  });

  const asyncOperation = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
    mapResponse: async (dto) => {
      return { label: dto.name };
    },
  });

  createApiEffect(asyncOperation, {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    onSuccess: (user) => {
      expectTypeOf(user).toEqualTypeOf<{ label: string }>();

      return { type: 'LoadedAction', label: user.label };
    },
  });

  return [rootEffect, invalid, union, mixed];
};

test('factory describes one effect without executing mapper or callbacks', () => {
  const mapResponse = vi.fn((dto: TestUser) => {
    return { label: dto.name };
  });
  const load = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
    mapResponse,
  });
  const onSuccess = vi.fn(() => {
    return {
      type: 'LoadedAction' as const,
      label: 'Ada',
    };
  });
  const onError = vi.fn(() => {
    return { type: 'FailedAction' as const, errors: [] };
  });
  const effect = createApiEffect(load, {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    onSuccess,
    onError,
  });

  expect(effect).toEqual({
    type: 'ApiEffect',
    operation: load,
    method: 'post',
    url: '/users/{id}',
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    onSuccess,
    onError,
  });
  expect(effect.operation).toBe(load);
  expect(mapResponse).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});

test('type assertions are checked by tsc', () => {
  expect(checkTypes).toBeTypeOf('function');
});
