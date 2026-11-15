import { expect, expectTypeOf, test } from 'vitest';
import {
  createApiClient,
  defineApiOperation,
  type ApiFailure,
} from '../../api';
import type { AppError } from '../../app-error';
import { createApiEffect } from '../lib/create-api-effect';
import { createApiEffector } from '../lib/create-api-effector';
import type { ApiEffect } from './api-effect';
import type { DispatchAction } from './dispatch-action';
import type { TestPaths } from '../../api/types/api-client.test';

type SuccessAction =
  | { type: 'LoadedAction'; payload: { label: string } }
  | { type: 'EmptyAction' };
type ErrorAction = { type: 'FailedAction'; payload: { errors: AppError[] } };
type Action = SuccessAction | ErrorAction;

const operation = defineApiOperation<TestPaths>()({
  method: 'post',
  url: '/users/{id}',
  mapResponse: (dto) => {
    return { label: dto.name };
  },
});
const options = {
  params: { path: { id: 1 } },
  body: { name: 'Ada' },
  defaultError: { code: 'LOAD', message: 'Failed', path: [] },
};

const checkActionRoles = () => {
  type Effect = ApiEffect<typeof operation, SuccessAction, ErrorAction>;

  const valid: Effect = createApiEffect(operation, {
    ...options,
    onSuccess: (user) => {
      expectTypeOf(user).toEqualTypeOf<{ label: string }>();

      return { action: 'root/LoadedAction', payload: { label: user.label } };
    },
    onError: (errors, failure) => {
      expectTypeOf(errors).toEqualTypeOf<AppError[]>();
      expectTypeOf(failure).toEqualTypeOf<ApiFailure>();

      return { action: 'root/FailedAction', payload: { errors } };
    },
  });
  const secondSuccess: Effect = createApiEffect(operation, {
    ...options,
    onSuccess: () => {
      return { action: 'root/EmptyAction' };
    },
  });
  const swappedSuccess: Effect = {
    ...valid,
    // @ts-expect-error success callback cannot return an error action
    onSuccess: () => {
      return { action: 'root/FailedAction', payload: { errors: [] } };
    },
  };
  const swappedError: Effect = {
    ...valid,
    // @ts-expect-error error callback cannot return a success action
    onError: () => {
      return { action: 'root/EmptyAction' };
    },
  };
  const wrongPayload: Effect = {
    ...valid,
    // @ts-expect-error the correct error discriminator still requires its payload
    onError: () => {
      return { action: 'root/FailedAction' };
    },
  };
  const noData = { action: 'root/EmptyAction' as const, payload: 2 };
  const extraPayload: Effect = {
    ...valid,
    // @ts-expect-error Callback results cannot add data to a no-data action.
    onSuccess: () => {
      return noData;
    },
  };

  createApiEffect<
    typeof operation,
    DispatchAction<SuccessAction>,
    DispatchAction<ErrorAction>
  >(operation, {
    ...options,
    // @ts-expect-error explicit factory action roles are checked too
    onSuccess: () => {
      return { action: 'root/FailedAction', payload: { errors: [] } };
    },
  });
  type FeatureSuccessAction = SuccessAction & { scope: 'users' };
  type FeatureErrorAction = ErrorAction & { scope: 'users' };

  const scoped: ApiEffect<
    typeof operation,
    FeatureSuccessAction,
    FeatureErrorAction
  > = createApiEffect(operation, {
    ...options,
    onSuccess: (user) => {
      return { action: 'users/LoadedAction', payload: { label: user.label } };
    },
    onError: (errors) => {
      return { action: 'users/FailedAction', payload: { errors } };
    },
  });
  const wrongScope: ApiEffect<
    typeof operation,
    FeatureSuccessAction,
    FeatureErrorAction
  > = {
    ...scoped,
    // @ts-expect-error required scope is preserved for the error action
    onError: (errors) => {
      return { action: 'other/FailedAction', payload: { errors } };
    },
  };
  const swappedFactory = createApiEffect(operation, {
    ...options,
    onSuccess: () => {
      return { action: 'root/FailedAction', payload: { errors: [] } };
    },
    onError: () => {
      return { action: 'root/EmptyAction' };
    },
  });
  // @ts-expect-error inferred factory action roles must match the declared effect
  const invalidFactory: Effect = swappedFactory;
  const withoutCallbacks: ApiEffect<typeof operation, never, never> =
    createApiEffect(operation, options);
  const successOnly: ApiEffect<typeof operation, SuccessAction, never> =
    createApiEffect(operation, {
      ...options,
      onSuccess: () => {
        return { action: 'root/EmptyAction' };
      },
    });
  const errorOnly: ApiEffect<typeof operation, never, ErrorAction> =
    createApiEffect(operation, {
      ...options,
      onError: (errors) => {
        return { action: 'root/FailedAction', payload: { errors } };
      },
    });
  const api = createApiClient<TestPaths>({ baseUrl: 'https://example.test' });
  const handler = createApiEffector<TestPaths, Action, typeof operation>(api);

  void handler.ApiEffect({ effect: valid, dispatch: async () => {} });
  void handler.ApiEffect({ effect: secondSuccess, dispatch: async () => {} });
  void handler.ApiEffect({ effect: successOnly, dispatch: async () => {} });
  void handler.ApiEffect({ effect: errorOnly, dispatch: async () => {} });
  void handler.ApiEffect({
    effect: withoutCallbacks,
    dispatch: async () => {},
  });

  const featureHandler = createApiEffector<
    TestPaths,
    FeatureSuccessAction | FeatureErrorAction,
    typeof operation
  >(api);

  void featureHandler.ApiEffect({ effect: scoped, dispatch: async () => {} });

  const unrelatedError = createApiEffect(operation, {
    ...options,
    onError: () => {
      return { action: 'root/UnrelatedAction' };
    },
  });

  // @ts-expect-error both callback results must belong to RootAction
  void handler.ApiEffect({ effect: unrelatedError, dispatch: async () => {} });

  return [
    valid,
    secondSuccess,
    wrongPayload,
    extraPayload,
    scoped,
    wrongScope,
    swappedSuccess,
    swappedError,
    invalidFactory,
    withoutCallbacks,
    successOnly,
    errorOnly,
  ];
};

test('success and error action roles are checked separately by tsc', () => {
  expect(checkActionRoles).toBeTypeOf('function');
});
