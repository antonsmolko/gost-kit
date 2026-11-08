import { expect, test } from 'vitest';
import { define } from '../lib/define';
import type { StoreConfig } from './store-config';

const checkStoreConfig = (
  config: StoreConfig<{ count: number }, { type: 'RunAction' }, never>,
) => {
  const stateConfig = { ...config };

  stateConfig.initState = define.state<{ count: number }>((options = {}) => {
    return {
      count: 0,
      ...options,
    };
  });
  stateConfig.initState = () => {
    return { count: 0 };
  };
  // @ts-expect-error Initial state must be a factory, not a snapshot.
  stateConfig.initState = { count: 0 };
  // @ts-expect-error Store calls the factory without arguments.
  stateConfig.initState = (options: { count: number }) => {
    return options;
  };
};

test('checks factory config contracts without executing invalid assignments', () => {
  expect(checkStoreConfig).toBeTypeOf('function');
});
