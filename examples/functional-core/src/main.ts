import { guard } from '@gost-kit/common';
import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');

if (!guard.HTMLElement(target)) {
  throw new Error('Application mount element #app is missing.');
}

mount(App, { target });
