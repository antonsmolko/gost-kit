import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vitest runs in Node; compile runes for the client to exercise reactivity.
  plugins: [svelte({ dynamicCompileOptions: () => ({ generate: 'client' }) })],
  resolve: { conditions: ['browser'] },
  ssr: { resolve: { conditions: ['browser'] } },
  test: {
    include: ['src/**/*.test.ts'],
    server: { deps: { inline: ['svelte'] } },
  },
});
