import { expect, test } from '@playwright/test';
import { importFixture } from './utils.js';

test('fuzzy search filters the bookmark table live', async ({ page }) => {
  await importFixture(page);
  await page.goto('/bookmarks');

  await expect(page.getByRole('link', { name: 'Hacker News' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Wikipedia' })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search bookmarks' }).fill('hacker');

  await expect(page.getByRole('link', { name: 'Hacker News' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Wikipedia' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'React Documentation' })).not.toBeVisible();
});

test('clearing the search restores the full list', async ({ page }) => {
  await importFixture(page);
  await page.goto('/bookmarks');

  const search = page.getByRole('searchbox', { name: 'Search bookmarks' });
  await search.fill('wikipedia');
  await expect(page.getByRole('link', { name: 'Hacker News' })).not.toBeVisible();

  await search.fill('');
  await expect(page.getByRole('link', { name: 'Hacker News' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Wikipedia' })).toBeVisible();
});
