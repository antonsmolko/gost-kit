import { expect, expectTypeOf, test } from 'vitest';
import { defineApiOperation } from '../lib/define-api-operation';
import type { SingleApiOperation } from '../index';
import type { TestPaths } from './api-client.test';

const checkSingleOperation = () => {
  const first = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
    mapResponse: (dto) => {
      return dto.name;
    },
  });
  const sameRoute = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
    mapResponse: (dto) => {
      return dto.id;
    },
  });
  const other = defineApiOperation<TestPaths>()({
    method: 'delete',
    url: '/empty',
  });

  expectTypeOf<SingleApiOperation<typeof first>>().toEqualTypeOf<
    typeof first
  >();
  expectTypeOf<SingleApiOperation<typeof first | typeof other>>().toBeNever();
  expectTypeOf<
    SingleApiOperation<typeof first | typeof sameRoute>
  >().toBeNever();
  expectTypeOf<SingleApiOperation<never>>().toBeNever();

  return [first, sameRoute, other];
};

test('public narrowing helper rejects route and mapper unions', () => {
  expect(checkSingleOperation).toBeTypeOf('function');
});
