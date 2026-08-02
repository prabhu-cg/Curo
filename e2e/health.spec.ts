import { expect, type Locator, type Page } from '@playwright/test';
import { test } from '@playwright/test';
import { importFixture } from './utils.js';

function weightsCard(page: Page): Locator {
  return page.locator('[data-slot="card"]').filter({ hasText: 'Scoring weights' });
}

function taggedPercent(page: Page): Locator {
  return weightsCard(page)
    .locator('div')
    .filter({ hasText: 'Tagged' })
    .last()
    .getByText(/^\d+%$/);
}

test('shows the health score, breakdown, and actionable insights', async ({ page }) => {
  await importFixture(page);
  await page.goto('/health');

  await expect(page.getByText('Knowledge Health Score')).toBeVisible();
  await expect(page.locator('span.text-5xl')).toHaveText(/^\d+$/);
  await expect(page.getByText('duplicate bookmark', { exact: false })).toBeVisible();
  await expect(page.getByText('Actionable insights')).toBeVisible();
  await expect(page.getByText('bookmarks have no tags')).toBeVisible();
});

test('adjusting a scoring weight changes the score and persists across reload', async ({
  page,
}) => {
  await importFixture(page);
  await page.goto('/health');

  const scoreLocator = page.locator('span.text-5xl');
  const initialScore = Number(await scoreLocator.textContent());
  await expect(taggedPercent(page)).toHaveText('20%');

  await page.getByRole('slider', { name: 'Tagged weight' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(taggedPercent(page)).toHaveText('25%');

  const updatedScore = Number(await scoreLocator.textContent());
  expect(updatedScore).toBeLessThan(initialScore);

  await page.reload();
  await expect(taggedPercent(page)).toHaveText('25%');
  const reloadedScore = Number(await scoreLocator.textContent());
  expect(reloadedScore).toBe(updatedScore);
});

test('reset to defaults restores the original weights', async ({ page }) => {
  await importFixture(page);
  await page.goto('/health');

  await page.getByRole('slider', { name: 'Tagged weight' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(taggedPercent(page)).toHaveText('25%');

  await page.getByRole('button', { name: 'Reset to defaults' }).click();
  await expect(
    page.getByText('Weights reset to defaults', { exact: true }),
  ).toBeVisible();
  await expect(taggedPercent(page)).toHaveText('20%');
});
