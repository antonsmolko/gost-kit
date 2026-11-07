import { expect, expectTypeOf, test, vi } from 'vitest';
import { defineApiOperation } from './define-api-operation';
import type { TestPaths, TestUser } from '../types/api-request.test';

const checkTypes = () => {
  const defineOperation = defineApiOperation<TestPaths>();
  const mapped = defineOperation({
    method: 'post',
    url: '/users/{id}',
    mapResponse: (dto) => {
      expectTypeOf(dto).toEqualTypeOf<TestUser>();

      return { label: dto.name };
    },
  });

  expectTypeOf(mapped.method).toEqualTypeOf<'post'>();
  expectTypeOf(mapped.mapResponse({ id: 1, name: 'Ada' })).toEqualTypeOf<{
    label: string;
  }>();

  const identity = defineOperation({ method: 'get', url: '/users/{id}' });

  expectTypeOf(identity.mapResponse(null)).toEqualTypeOf<TestUser | null>();

  const head = defineOperation({ method: 'head', url: '/head-json' });

  expectTypeOf(head.mapResponse(undefined)).toEqualTypeOf<undefined>();

  const empty = defineOperation({ method: 'delete', url: '/empty' });

  expectTypeOf(empty.mapResponse(undefined)).toEqualTypeOf<undefined>();
  // @ts-expect-error unknown route
  defineOperation({ method: 'get', url: '/missing' });
  // @ts-expect-error invalid method for route
  defineOperation({ method: 'post', url: '/empty' });
  defineOperation({
    method: 'post',
    url: '/users/{id}',
    // @ts-expect-error mapper accepts endpoint DTO
    mapResponse: (dto: string) => {
      return dto;
    },
  });
  // @ts-expect-error route metadata is readonly
  mapped.url = '/empty';
};

test('operation construction does not call mapper and preserves route/mapper', () => {
  const mapResponse = vi.fn((dto: TestUser) => {
    return { label: dto.name };
  });
  const operation = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
    mapResponse,
  });

  expect(mapResponse).not.toHaveBeenCalled();
  expect(operation).toEqual({
    method: 'post',
    url: '/users/{id}',
    mapResponse,
  });
  expect(operation.mapResponse({ id: 1, name: 'Ada' })).toEqual({
    label: 'Ada',
  });
});

test('omitted mapper preserves null and DTO identity', () => {
  const operation = defineApiOperation<TestPaths>()({
    method: 'get',
    url: '/users/{id}',
  });
  const dto = { id: 1, name: 'Ada' };

  expect(operation.mapResponse(dto)).toBe(dto);
  expect(operation.mapResponse(null)).toBeNull();
});

test('type assertions are checked by tsc', () => {
  expect(checkTypes).toBeTypeOf('function');
});
