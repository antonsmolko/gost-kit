import { setTimeout } from 'node:timers/promises';
import { createUserStore } from './user-store.ts';
import type { User } from './user-store.ts';

// Replace this dependency with a real request at the application boundary.
const loadUser = async (): Promise<User> => {
  await setTimeout(50);
  if (process.argv.includes('--fail')) throw new Error('Service unavailable');
  return { id: '1', name: 'Ada' };
};

const store = createUserStore(loadUser);
const finished = Promise.withResolvers<void>();
console.log(store.getSnapshot().context);
const subscription = store.subscribe(({ context }) => {
  console.log(context);
  if (context.status === 'ready' || context.status === 'error') finished.resolve();
});

store.trigger.load();
await finished.promise;
subscription.unsubscribe();
