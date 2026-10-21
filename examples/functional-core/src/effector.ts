import { define, effecting } from './shell/handlers.ts';
import type { Effector } from './shell/types.ts';
import type { ApiClient, ApiEffect, DispatchActionEffect, RootAction, RootEffect, User } from './types.ts';

const apiEffector = (api: ApiClient) => define.effector<RootAction, ApiEffect>({
  ApiEffect: async ({ effect, dispatch }) => {
    let response: User;
    try {
      response = await api({ url: effect.url, body: effect.body });
    } catch {
      await dispatch(effect.receiverError([effect.defaultError]));
      return;
    }
    // Only request failures are caught. Receiver/dispatch exceptions propagate.
    await dispatch(effect.receiverSuccess(response));
  },
});

const shellEffector = define.effector<RootAction, DispatchActionEffect>({
  DispatchActionEffect: async ({ effect, dispatch }) => {
    await dispatch(effect.action);
  },
});

export const createEffector = (api: ApiClient): Effector<RootAction, RootEffect> =>
  effecting(apiEffector(api), shellEffector);
