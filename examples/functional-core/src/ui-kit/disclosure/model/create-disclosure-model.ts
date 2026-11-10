import {
  createDispatch,
  define,
  effecting,
  guard,
  report,
  type AnyFn,
  type Dispatch,
  type Effector,
} from '@gost-kit/common';
import { createStore } from '@gost-kit/svelte';
import { disclosureState } from '../domain/fc/state';
import { disclosureReducer } from '../domain/fc/reducer';
import type { DisclosureAction } from '../domain/fc/action';
import type { DisclosureEffect } from '../domain/fc/effect';
import type { DisclosureOptions } from '../types/disclosure-options';
import type { DisclosureModel } from '../types/disclosure-model';

const readControlledState = (options: DisclosureOptions) => {
  if (
    !guard.boolean(options.open) ||
    !guard.ulx(options.defaultOpen) ||
    !guard.function(options.onOpenChange)
  ) {
    throw new TypeError(
      'Controlled Disclosure requires boolean open and onOpenChange, without defaultOpen',
    );
  }

  return disclosureState({ open: options.open });
};

const assertUncontrolledMode = (options: DisclosureOptions) => {
  if (!guard.ulx(options.open)) {
    throw new TypeError(
      'Disclosure ownership cannot change after creation; remount to change modes',
    );
  }
};

const createLocalBindings = (
  readOptions: AnyFn<[], DisclosureOptions>,
  initialOpen: boolean,
  effector: Effector<DisclosureAction, DisclosureEffect>,
) => {
  const store = createStore({
    initState: () => {
      return disclosureState({ open: initialOpen });
    },
    reducer: disclosureReducer,
    effector,
  });
  const dispatch: Dispatch<DisclosureAction> = async (action) => {
    try {
      assertUncontrolledMode(readOptions());
    } catch (error) {
      report({ kind: 'readState', action, error });

      return;
    }

    return store.dispatch(action);
  };

  return {
    readState: () => {
      assertUncontrolledMode(readOptions());

      return store.state;
    },
    dispatch,
  };
};

const createControlledBindings = (
  readOptions: AnyFn<[], DisclosureOptions>,
  effector: Effector<DisclosureAction, DisclosureEffect>,
) => {
  const readState = () => {
    return readControlledState(readOptions());
  };
  const dispatch = createDispatch({
    readState,
    writeState: () => {},
    reducer: disclosureReducer,
    effector,
  });

  return { readState, dispatch };
};

export const createDisclosureModel = (
  readOptions: AnyFn<[], DisclosureOptions>,
): DisclosureModel => {
  const initial = readOptions();
  const controlled = !guard.ulx(initial.open);

  if (
    !controlled &&
    !guard.ulx(initial.defaultOpen) &&
    !guard.boolean(initial.defaultOpen)
  ) {
    throw new TypeError('Disclosure defaultOpen must be a boolean');
  }

  const initialOpen = controlled
    ? readControlledState(initial).open
    : (initial.defaultOpen ?? false);
  const effector: Effector<DisclosureAction, DisclosureEffect> = effecting(
    define.effector<DisclosureAction, DisclosureEffect>({
      OpenChangeEffect: async ({ effect }) => {
        const callback = readOptions().onOpenChange;

        if (!guard.ulx(callback)) {
          await callback(effect.open);
        }
      },
    }),
  );
  const bindings = controlled
    ? createControlledBindings(readOptions, effector)
    : createLocalBindings(readOptions, initialOpen, effector);

  return {
    get state() {
      return bindings.readState();
    },
    dispatch: bindings.dispatch,
    reset: () => {
      return bindings.dispatch({ type: 'SetOpenAction', open: initialOpen });
    },
  };
};
