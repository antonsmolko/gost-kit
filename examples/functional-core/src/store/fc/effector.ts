import {
  createApiHandler,
  define,
  effecting,
  type Effector,
} from '@gost-kit/common';
import type { Paths } from '../../api/paths';
import type { RootAction } from '../types/action';
import type {
  ApiClient,
  ApiOperation,
  DispatchActionEffect,
  RootEffect,
} from '../types/effect';

const shellEffector = define.effector<RootAction, DispatchActionEffect>({
  DispatchActionEffect: async ({ effect, dispatch }) => {
    await dispatch(effect.action);
  },
});

export const createEffector = (
  api: ApiClient,
): Effector<RootAction, RootEffect> => {
  return effecting(
    createApiHandler<Paths, RootAction, ApiOperation>(api),
    shellEffector,
  );
};
