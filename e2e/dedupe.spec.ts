import { expect, test } from '@playwright/test';
import { importFixture } from './utils.js';

test('detects and merges an exact-URL duplicate', async ({ page }) => {
  // Import without skipping duplicates so both react.dev variants land in the
  // store despite normalizing to the same URL.
  await importFixture(page, { skipDuplicates: false });

  await page.goto('/duplicates');

  await expect(page.getByText('1 duplicate group')).toBeVisible();
  await expect(page.getByText('Exact URL match')).toBeVisible();
  await expect(page.getByText('React Documentation')).toBeVisible();
  await expect(page.getByText('React Docs Mirror')).toBeVisible();

  await page.getByRole('button', { name: 'Merge, keep selected' }).click();

  await expect(page.getByText('No duplicates found')).toBeVisible();

  await page.goto('/bookmarks');
  const reactEntries = page.getByText(/^React Doc/);
  await expect(reactEntries).toHaveCount(1);
});
