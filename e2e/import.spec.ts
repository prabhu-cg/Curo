import { expect, test } from '@playwright/test';
import path from 'node:path';

const FIXTURE_PATH = path.join(import.meta.dirname, 'fixtures', 'bookmarks.html');

test('imports a bookmarks HTML export with a live preview', async ({ page }) => {
  await page.goto('/import');

  await page.locator('input[type="file"]').setInputFiles(FIXTURE_PATH);

  await expect(page.getByText('Ready to import')).toBeVisible();
  await expect(page.getByText('React Documentation')).toBeVisible();

  await page.getByRole('button', { name: /^Import \d+ bookmarks?$/ }).click();

  await expect(page.getByText(/^Imported \d+ bookmark/)).toBeVisible();
  await page.getByRole('link', { name: 'View bookmarks' }).click();

  await expect(page).toHaveURL(/\/bookmarks$/);
  await expect(page.getByText('React Documentation')).toBeVisible();
  await expect(page.getByText('Hacker News')).toBeVisible();
});

test('reports issues for a file with no bookmark list', async ({ page }) => {
  await page.goto('/import');

  const buffer = Buffer.from('<html><body>not a bookmarks file</body></html>');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'empty.html',
    mimeType: 'text/html',
    buffer,
  });

  await expect(page.getByText('Issues found')).toBeVisible();
  await expect(
    page.getByText('No bookmark list was found', { exact: false }),
  ).toBeVisible();
});
