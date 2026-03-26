import { expect, test } from '@playwright/test';

function skipFirstRunGuides(page) {
  return page.addInitScript(() => {
    window.localStorage.setItem('lanobe-guide-bookshelf-v2', '1');
    window.localStorage.setItem('lanobe-guide-reader-v2', '1');
  });
}

test('bookshelf volume selection flows into streamlined reader controls', async ({ page }) => {
  await skipFirstRunGuides(page);

  await page.goto('http://127.0.0.1:4173/lanobe/bookshelf');
  await page.getByRole('button', { name: 'EN' }).click();

  const bookCard = page.locator('article').first();
  await expect(bookCard.getByText('Choose a volume before entering')).toBeVisible();

  await bookCard.getByRole('button', { name: /Volume 08/ }).click();
  await bookCard.locator('a[href*="volume=volume-08"]').first().click();

  await page.waitForURL(/volume=volume-08/);

  await expect(page.getByText('Volume 08').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('button', { name: 'Quick' })).toBeVisible();

  await page.getByRole('button', { name: 'Playback' }).last().click();
  await expect(page.getByText('Zero gap')).toBeVisible();

  await page.getByRole('button', { name: 'Display' }).click();
  await expect(page.getByText('Compact')).toBeVisible();
});

test('mobile reader mounts the persistent background audio element', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await skipFirstRunGuides(page);

  await page.goto('http://127.0.0.1:4173/lanobe/book/makeine-too-many-heroines?volume=volume-01');
  await page.waitForURL(/volume=volume-01/);

  const backgroundAudio = page.locator('#lanobe-background-audio');
  await expect(backgroundAudio).toHaveCount(1);
  await expect(backgroundAudio).toHaveAttribute('playsinline', 'true');
  await expect(backgroundAudio).toHaveAttribute('webkit-playsinline', 'true');
  await expect(backgroundAudio).toHaveJSProperty('preload', 'auto');
});
