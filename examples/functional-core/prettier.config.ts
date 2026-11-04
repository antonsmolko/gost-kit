import type { Config } from 'prettier';
import config from '@gost-kit/prettier-config';

export default {
  ...config,
  plugins: ['prettier-plugin-svelte'],
} satisfies Config;
