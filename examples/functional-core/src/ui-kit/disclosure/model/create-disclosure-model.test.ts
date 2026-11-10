import { afterEach, expect, test, vi } from 'vitest';
import { createDisclosureModel } from './create-disclosure-model';
import type { DisclosureOptions } from '../types/disclosure-options';
import type { OpenChangeHandler } from '../types/open-change-handler';

afterEach(() => {
  vi.restoreAllMocks();
});

test('creates separate closed states without callbacks', async () => {
  const first = createDisclosureModel(() => {
    return {};
  });
  const second = createDisclosureModel(() => {
    return {};
  });

  expect(first.state).toEqual({ open: false });
  expect(first.state).not.toBe(second.state);

  const pending = first.dispatch({ type: 'ToggleAction' });

  expect(first.state).toEqual({ open: true });
  expect(second.state).toEqual({ open: false });
  await pending;
});

test('two rapid toggles notify true then false without losing either payload', async () => {
  const values: boolean[] = [];
  const model = createDisclosureModel(() => {
    return {
      onOpenChange: (open) => {
        values.push(open);
      },
    };
  });
  const first = model.dispatch({ type: 'ToggleAction' });
  const second = model.dispatch({ type: 'ToggleAction' });

  expect(values).toEqual([true, false]);
  expect(model.state).toEqual({ open: false });
  await Promise.all([first, second]);
});

test('reset restores only its own initial value and skips no-op notifications', async () => {
  const values: boolean[] = [];
  const first = createDisclosureModel(() => {
    return {
      defaultOpen: true,
      onOpenChange: (open) => {
        values.push(open);
      },
    };
  });
  const second = createDisclosureModel(() => {
    return {};
  });

  await first.dispatch({ type: 'ToggleAction' });
  await second.dispatch({ type: 'ToggleAction' });
  await first.reset();
  await first.reset();

  expect(first.state).toEqual({ open: true });
  expect(second.state).toEqual({ open: true });
  expect(values).toEqual([false, true]);
});

test.each([true, 'ignored invalid replacement'])(
  'a later defaultOpen=%s does not change current state or reset seed',
  async (defaultOpen) => {
    let options: DisclosureOptions = { defaultOpen: false };
    const model = createDisclosureModel(() => {
      return options;
    });

    options = { defaultOpen } as unknown as DisclosureOptions;
    expect(model.state).toEqual({ open: false });
    await model.dispatch({ type: 'ToggleAction' });
    await model.reset();
    expect(model.state).toEqual({ open: false });
  },
);

test.each([
  { mode: 'uncontrolled', next: false },
  { mode: 'controlled', next: true },
])(
  '$mode uses the current callback instead of the creation callback',
  async ({ mode, next }) => {
    const first = vi.fn();
    const second = vi.fn();
    let options: DisclosureOptions =
      mode === 'controlled'
        ? { open: false, onOpenChange: first }
        : { onOpenChange: first };
    const model = createDisclosureModel(() => {
      return options;
    });

    await model.dispatch({ type: 'ToggleAction' });
    options =
      mode === 'controlled'
        ? { open: false, onOpenChange: second }
        : { onOpenChange: second };
    await model.dispatch({ type: 'ToggleAction' });

    expect(first).toHaveBeenCalledExactlyOnceWith(true);
    expect(second).toHaveBeenCalledExactlyOnceWith(next);
  },
);

test('controlled requests do not change owner state until accepted', async () => {
  const onOpenChange = vi.fn();
  let open = false;
  const model = createDisclosureModel(() => {
    return { open, onOpenChange };
  });

  await model.dispatch({ type: 'ToggleAction' });
  await model.dispatch({ type: 'ToggleAction' });
  await model.dispatch({ type: 'SetOpenAction', open: false });

  expect(model.state).toEqual({ open: false });
  expect(onOpenChange.mock.calls).toEqual([[true], [true]]);

  open = true;
  expect(model.state).toEqual({ open: true });
  expect(onOpenChange).toHaveBeenCalledTimes(2);
});

test('controlled callback can publish the proposed value', async () => {
  let open = false;
  const model = createDisclosureModel(() => {
    return {
      open,
      onOpenChange: (next) => {
        open = next;
      },
    };
  });

  await model.dispatch({ type: 'ToggleAction' });
  expect(model.state).toEqual({ open: true });
  await model.dispatch({ type: 'ToggleAction' });
  expect(model.state).toEqual({ open: false });
});

test('controlled reset requests the creation baseline without an optimistic write', async () => {
  let open = true;
  const onOpenChange = vi.fn();
  const model = createDisclosureModel(() => {
    return { open, onOpenChange };
  });

  open = false;
  await model.reset();
  expect(model.state).toEqual({ open: false });
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);

  open = true;
  await model.reset();
  expect(onOpenChange).toHaveBeenCalledTimes(1);
});

test('pending callback completion does not overwrite a newer owner value', async () => {
  let open = false;
  const completion = Promise.withResolvers<void>();
  const values: boolean[] = [];
  const model = createDisclosureModel(() => {
    return {
      open,
      onOpenChange: (next) => {
        values.push(next);

        return completion.promise;
      },
    };
  });
  const pending = model.dispatch({ type: 'ToggleAction' });

  expect(values).toEqual([true]);
  expect(model.state).toEqual({ open: false });
  open = true;
  expect(model.state).toEqual({ open: true });
  open = false;
  completion.resolve();
  await pending;
  expect(model.state).toEqual({ open: false });
});

test('dispatch commits immediately but waits for an async callback', async () => {
  const completion = Promise.withResolvers<void>();
  const model = createDisclosureModel(() => {
    return {
      onOpenChange: () => {
        return completion.promise;
      },
    };
  });
  let settled = false;
  const pending = model.dispatch({ type: 'ToggleAction' }).then(() => {
    settled = true;
  });

  expect(model.state).toEqual({ open: true });
  await Promise.resolve();
  expect(settled).toBe(false);
  completion.resolve();
  await pending;
  expect(settled).toBe(true);
});

test.each([
  { controlled: false, kind: 'throw', expectedOpen: true },
  { controlled: false, kind: 'reject', expectedOpen: true },
  { controlled: true, kind: 'throw', expectedOpen: false },
  { controlled: true, kind: 'reject', expectedOpen: false },
])(
  'callback $kind in controlled=$controlled reports without rejecting or rolling back',
  async ({ controlled, kind, expectedOpen }) => {
    const error = new Error('Callback failed');
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onOpenChange: OpenChangeHandler = () => {
      if (kind === 'throw') {
        throw error;
      }

      return Promise.reject(error);
    };
    const model = createDisclosureModel(() => {
      return controlled ? { open: false, onOpenChange } : { onOpenChange };
    });

    await model.dispatch({ type: 'ToggleAction' });

    expect(model.state).toEqual({ open: expectedOpen });
    expect(report).toHaveBeenCalledExactlyOnceWith({
      kind: 'effect',
      action: { type: 'ToggleAction' },
      effect: { type: 'OpenChangeEffect', open: true },
      error,
    });
  },
);

test.each([
  { open: true },
  { open: true, defaultOpen: false, onOpenChange: () => {} },
  { open: null, onOpenChange: () => {} },
  { defaultOpen: 'invalid' },
  { open: false, onOpenChange: 'invalid' },
])('rejects invalid initial JavaScript ownership props %j', (options) => {
  expect(() => {
    return createDisclosureModel(() => {
      return options as unknown as DisclosureOptions;
    });
  }).toThrow(TypeError);
});

test.each([
  { controlled: false, operation: 'dispatch' },
  { controlled: false, operation: 'reset' },
  { controlled: true, operation: 'dispatch' },
  { controlled: true, operation: 'reset' },
])(
  'ownership switch controlled=$controlled: getter throws, $operation reports once without transition',
  async ({ controlled, operation }) => {
    const onOpenChange = vi.fn();
    const initial: DisclosureOptions = controlled
      ? { open: false, onOpenChange }
      : { onOpenChange };
    let options: DisclosureOptions = initial;
    const model = createDisclosureModel(() => {
      return options;
    });
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});

    options = controlled ? { onOpenChange } : { open: true, onOpenChange };
    expect(() => {
      return model.state;
    }).toThrow(TypeError);

    if (operation === 'reset') {
      await model.reset();
    } else {
      await model.dispatch({ type: 'ToggleAction' });
    }

    expect(report).toHaveBeenCalledExactlyOnceWith({
      kind: 'readState',
      action:
        operation === 'reset'
          ? { type: 'SetOpenAction', open: false }
          : { type: 'ToggleAction' },
      error: expect.any(TypeError),
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    options = initial;
    expect(model.state).toEqual({ open: false });
  },
);

test.each([
  { open: false },
  { open: false, onOpenChange: () => {}, defaultOpen: true },
])(
  'controlled mutable invalid props %j report as readState without callback',
  async (invalid) => {
    const onOpenChange = vi.fn();
    let options: DisclosureOptions = { open: false, onOpenChange };
    const model = createDisclosureModel(() => {
      return options;
    });
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});

    options = invalid as unknown as DisclosureOptions;
    await model.dispatch({ type: 'ToggleAction' });

    expect(report).toHaveBeenCalledExactlyOnceWith({
      kind: 'readState',
      action: { type: 'ToggleAction' },
      error: expect.any(TypeError),
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  },
);
