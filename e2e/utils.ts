import path from 'node:path';
import type { Page } from '@playwright/test';

const FIXTURE_PATH = path.join(import.meta.dirname, 'fixtures', 'bookmarks.html');

/**
 * Imports the shared e2e bookmarks fixture (6 links, including two
 * react.dev entries that normalize to the same URL for dedupe testing).
 */
export async function importFixture(
  page: Page,
  { skipDuplicates = true } = {},
): Promise<void> {
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles(FIXTURE_PATH);
  await page.getByText('Ready to import').waitFor();

  if (!skipDuplicates) {
    await page.getByLabel('Skip bookmarks already in your library').uncheck();
  }

  await page.getByRole('button', { name: /^Import \d+ bookmarks?$/ }).click();
  await page.getByRole('link', { name: 'View bookmarks' }).waitFor();
}
