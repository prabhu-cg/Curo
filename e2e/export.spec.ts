import { expect, test } from '@playwright/test';
import { importFixture } from './utils.js';

test('exports all bookmarks as an HTML file', async ({ page }) => {
  await importFixture(page);
  await page.goto('/export');

  await expect(page.locator('#format-html')).toBeChecked();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /^Export \d+ bookmarks?$/ }).click(),
  ]);

  expect(download.suggestedFilename()).toBe('curo-bookmarks.html');
});

test('bundles multiple formats into a zip', async ({ page }) => {
  await importFixture(page);
  await page.goto('/export');

  await page.locator('#format-csv').check();
  await page.locator('#format-json').check();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /^Export \d+ bookmarks?$/ }).click(),
  ]);

  expect(download.suggestedFilename()).toBe('curo-bookmarks-export.zip');
});

test('exports only favorites when that scope is selected', async ({ page }) => {
  await importFixture(page);
  await page.goto('/bookmarks');

  await page.getByRole('button', { name: 'Add to favorites' }).first().click();
  await expect(page.getByRole('button', { name: 'Remove from favorites' })).toBeVisible();

  await page.goto('/export');
  await page.getByRole('radio', { name: /Favorites only/ }).check();

  await expect(page.getByRole('button', { name: 'Export 1 bookmark' })).toBeVisible();
});
