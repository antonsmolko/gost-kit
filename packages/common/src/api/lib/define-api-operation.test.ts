import { expect, expectTypeOf, test, vi } from 'vitest';
import { defineApiOperation, response } from '..';
import type { ApiOperationDefinition } from '../types/api-operation-definition';
import type { TestPaths, TestUser } from '../types/api-client.test';
import type { Nlx } from '../../types';

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

  expectTypeOf(identity.mapResponse(null)).toEqualTypeOf<Nlx<TestUser>>();

  const head = defineOperation({ method: 'head', url: '/head-json' });

  expectTypeOf(head.mapResponse(undefined)).toEqualTypeOf<undefined>();

  const empty = defineOperation({ method: 'delete', url: '/empty' });

  expectTypeOf(empty.mapResponse(undefined)).toEqualTypeOf<undefined>();

  const optionalMapper: {
    method: 'post';
    url: '/users/{id}';
    mapResponse?: (dto: TestUser) => string;
  } = { method: 'post', url: '/users/{id}' };
  const optional = defineOperation(optionalMapper);

  expectTypeOf(optional.mapResponse({ id: 1, name: 'Ada' })).toEqualTypeOf<
    TestUser | string
  >();

  const widened: ApiOperationDefinition<TestPaths> = {
    method: 'post',
    url: '/users/{id}',
    mapResponse: (dto) => {
      return dto.name;
    },
  };
  const unknownResult = defineOperation(widened);

  expectTypeOf(
    unknownResult.mapResponse({ id: 1, name: 'Ada' }),
  ).toEqualTypeOf<unknown>();

  const pipeline = defineOperation({
    method: 'post',
    url: '/users/{id}',
    response: response
      .validate((dto) => {
        expectTypeOf(dto).toEqualTypeOf<unknown>();

        return [];
      })
      .map(async (dto) => {
        expectTypeOf(dto).toEqualTypeOf<TestUser>();

        return { label: dto.name };
      }),
  });

  expectTypeOf(pipeline.mapResponse({ id: 1, name: 'Ada' })).toEqualTypeOf<
    Promise<{ label: string }>
  >();

  const optionalPipeline = (enabled: boolean) => {
    return {
      method: 'post' as const,
      url: '/users/{id}' as const,
      ...(enabled && {
        response: response
          .validate(() => {
            return [];
          })
          .map((dto: TestUser) => {
            return dto.id;
          }),
      }),
    };
  };
  const conditional = defineOperation(optionalPipeline(true));

  expectTypeOf(conditional.mapResponse({ id: 1, name: 'Ada' })).toEqualTypeOf<
    TestUser | number
  >();

  const wrongMapper = response
    .validate(() => {
      return [];
    })
    .map((dto: string) => {
      return dto.toUpperCase();
    });

  defineOperation({
    method: 'post',
    url: '/users/{id}',
    // @ts-expect-error the pipeline mapper must accept the endpoint DTO
    response: wrongMapper,
  });

  // @ts-expect-error the validator must accept unknown
  response.validate((_dto: TestUser) => {
    return [];
  });

  // @ts-expect-error configure a pipeline or a standalone mapper
  defineOperation({
    method: 'post',
    url: '/users/{id}',
    response: response
      .validate(() => {
        return [];
      })
      .map((dto: TestUser) => {
        return dto.name;
      }),
    mapResponse: (dto: TestUser) => {
      return dto.name;
    },
  });

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

test('response pipeline construction preserves callbacks without running them', () => {
  const validate = vi.fn((_dto: unknown) => {
    return [];
  });
  const map = vi.fn((dto: TestUser) => {
    return dto.name;
  });
  const operation = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
    response: response.validate(validate).map(map),
  });

  expect(operation.validateResponse).toBe(validate);
  expect(operation.mapResponse).toBe(map);
  expect(validate).not.toHaveBeenCalled();
  expect(map).not.toHaveBeenCalled();
});

test('type assertions are checked by tsc', () => {
  expect(checkTypes).toBeTypeOf('function');
});
