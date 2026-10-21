import { expect, test } from '@playwright/test';

test('component dispatches email and renders the completed request', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Email').fill('ada@example.test');
  await expect(page.getByText('Email in state: ada@example.test', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Load user' }).click();
  await expect(page.getByRole('status')).toHaveText('Status: loading');
  await expect(page.getByRole('heading', { name: 'Ada Lovelace' })).toBeVisible();
  await expect(page.getByText('Loaded email: ada@example.test', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Status: ready');
  expect(errors).toEqual([]);
});

test('request failure shows a global alert and retry can succeed', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Email').fill('error@example.test');
  await page.getByRole('button', { name: 'Load user' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not load user');
  await expect(page.getByRole('status')).toHaveText('Status: error');
  await expect(page.getByLabel('Email')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Load user' })).toBeEnabled();
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Email').fill('ada@example.test');
  await page.getByRole('button', { name: 'Load user' }).click();
  await expect(page.getByRole('heading', { name: 'Ada Lovelace' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Status: ready');
  expect(errors).toEqual([]);
});
