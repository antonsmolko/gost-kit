import type { Effector } from './shell/types.ts';
import type { ApiClient, RootAction, RootEffect, User } from './types.ts';

export const createEffector = (api: ApiClient): Effector<RootAction, RootEffect> =>
  async (effect, dispatch) => {
    switch (effect.type) {
      case 'DispatchActionEffect':
        await dispatch(effect.action);
        return;
      case 'ApiEffect': {
        let response: User;
        try {
          response = await api({ url: effect.url, body: effect.body });
        } catch (error) {
          if (effect.receiverError) {
            const errors = [{ message: error instanceof Error ? error.message : 'Request failed' }];
            await dispatch(effect.receiverError(errors));
          }
          return;
        }
        // Only request failures are caught. Receiver/dispatch exceptions propagate.
        await dispatch(effect.receiverSuccess(response));
      }
    }
  };
