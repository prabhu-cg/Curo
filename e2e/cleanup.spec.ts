import { expect, test } from '@playwright/test';
import path from 'node:path';
import { importFixture } from './utils.js';

const FOLDERS_FIXTURE_PATH = path.join(
  import.meta.dirname,
  'fixtures',
  'cleanup-folders.html',
);

test('flags missing metadata and lets you bulk-add tags', async ({ page }) => {
  await importFixture(page);
  await page.goto('/cleanup');

  await expect(page.getByText('bookmarks need attention')).toBeVisible();
  await expect(page.getByText('No tags').first()).toBeVisible();

  const firstRow = page.locator('label').filter({ hasText: 'GitHub' });
  await firstRow.getByRole('checkbox').check();

  await page.getByRole('button', { name: /Add tags/ }).click();
  await page.getByPlaceholder('tag1, tag2').fill('reference');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  await expect(page.getByText('Tags added')).toBeVisible();
});

test('detects an empty folder and deletes it', async ({ page }) => {
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles(FOLDERS_FIXTURE_PATH);
  await page.getByText('Ready to import').waitFor();
  await page.getByRole('button', { name: /^Import \d+ bookmarks?$/ }).click();
  await page.getByRole('link', { name: 'View bookmarks' }).waitFor();

  await page.goto('/cleanup');
  await page.getByRole('tab', { name: 'Folders' }).click();

  await expect(page.getByText('1 empty folder')).toBeVisible();
  await expect(page.getByText('Dev / Empty')).toBeVisible();

  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Delete/ }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page.getByText('Empty folders deleted')).toBeVisible();
  await expect(page.getByText('No empty folders found.')).toBeVisible();
});
