import { expect, test, type Page } from '@playwright/test';
import type * as FixtureModule from '../src/ui-kit/disclosure/__tests__/mount-fixture';
import type { FixtureCommand } from '../src/ui-kit/disclosure/__tests__/mount-fixture';

const command = async (page: Page, action: FixtureCommand) => {
  return page.evaluate(async (current) => {
    const route = '/src/ui-kit/disclosure/__tests__/mount-fixture.ts';
    const fixture = (await import(route)) as typeof FixtureModule;

    return fixture.command(current);
  }, action);
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const route = '/src/ui-kit/disclosure/__tests__/mount-fixture.ts';
    const fixture = (await import(route)) as typeof FixtureModule;

    await fixture.setup();
  });
});

test.afterEach(async ({ page }) => {
  await page.evaluate(async () => {
    const route = '/src/ui-kit/disclosure/__tests__/mount-fixture.ts';
    const fixture = (await import(route)) as typeof FixtureModule;

    await fixture.cleanup();
  });
});

test('local instances reset and remount independently through real component exports', async ({
  page,
}) => {
  const first = page.getByRole('button', {
    name: 'Fixture first',
    exact: true,
  });
  const second = page.getByRole('button', {
    name: 'Fixture second',
    exact: true,
  });

  await first.click();
  await second.click();
  await command(page, { type: 'resetFirst' });
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(second).toHaveAttribute('aria-expanded', 'true');

  await first.click();
  await command(page, { type: 'showFirst', value: false });
  await expect(first).toHaveCount(0);
  await expect(second).toHaveAttribute('aria-expanded', 'true');

  await command(page, { type: 'showFirst', value: true });
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(second).toHaveAttribute('aria-expanded', 'true');

  await command(page, { type: 'setDefault', value: true });
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await first.click();
  await command(page, { type: 'resetFirst' });
  await expect(first).toHaveAttribute('aria-expanded', 'false');
});

test('native keyboard toggles ready aria flags and hidden content stays mounted', async ({
  page,
}) => {
  const first = page.getByRole('button', {
    name: 'Fixture first',
    exact: true,
  });
  const second = page.getByRole('button', {
    name: 'Fixture second',
    exact: true,
  });
  const firstId = await first.getAttribute('aria-controls');
  const secondId = await second.getAttribute('aria-controls');

  expect(firstId).toBeTruthy();
  expect(secondId).toBeTruthy();
  expect(firstId).not.toBe(secondId);

  const panel = page.locator('[id="' + firstId + '"]');

  await expect(panel).toBeHidden();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  await page.getByLabel('First draft').fill('Preserve this value');
  await first.focus();
  await page.keyboard.press('Space');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  await first.click();
  await expect(page.getByLabel('First draft')).toHaveValue(
    'Preserve this value',
  );
  await expect(first).toHaveAttribute('aria-controls', firstId ?? '');
});

test('controlled UI waits for owner acceptance and external updates do not notify', async ({
  page,
}) => {
  const controlled = page.getByRole('button', {
    name: 'Fixture controlled',
    exact: true,
  });

  await controlled.click();
  await controlled.click();
  await expect(controlled).toHaveAttribute('aria-expanded', 'false');
  expect(await command(page, { type: 'events' })).toEqual([
    'controlled:first:true',
    'controlled:first:true',
  ]);

  await command(page, { type: 'setOpen', value: true });
  await expect(controlled).toHaveAttribute('aria-expanded', 'true');
  expect(await command(page, { type: 'events' })).toHaveLength(2);
  await command(page, { type: 'resetControlled' });
  await expect(controlled).toHaveAttribute('aria-expanded', 'true');
  expect(await command(page, { type: 'events' })).toHaveLength(3);

  await command(page, { type: 'accept', value: true });
  await controlled.click();
  await expect(controlled).toHaveAttribute('aria-expanded', 'false');
  await controlled.click();
  await expect(controlled).toHaveAttribute('aria-expanded', 'true');
});

test('component model reads a replacement callback after props update', async ({
  page,
}) => {
  const controlled = page.getByRole('button', {
    name: 'Fixture controlled',
    exact: true,
  });

  await controlled.click();
  await command(page, { type: 'replaceCallback' });
  await controlled.click();
  expect(await command(page, { type: 'events' })).toEqual([
    'controlled:first:true',
    'controlled:second:true',
  ]);
});

test('application consumes ready values through one root intent', async ({
  page,
}) => {
  const controlled = page.getByRole('button', {
    name: 'App-controlled details',
    exact: true,
  });

  await expect(controlled).toHaveAttribute('aria-expanded', 'false');
  await controlled.click();
  await expect(controlled).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByText('App-owned open: true', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Close app-controlled details', exact: true })
    .click();
  await expect(controlled).toHaveAttribute('aria-expanded', 'false');
});
