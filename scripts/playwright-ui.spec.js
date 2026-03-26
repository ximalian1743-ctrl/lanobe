import { expect, test } from '@playwright/test';

function seedLocalState(page, overrides = {}) {
  return page.addInitScript((stateOverrides) => {
    window.localStorage.setItem('lanobe-guide-bookshelf-v2', '1');
    window.localStorage.setItem('lanobe-guide-reader-v2', '1');

    const existing = window.localStorage.getItem('lanobe-storage');
    const parsed = existing ? JSON.parse(existing) : { state: {}, version: 0 };
    const nextState = {
      ...parsed.state,
      ...stateOverrides,
      settings: {
        ...(parsed.state?.settings || {}),
        ...(stateOverrides.settings || {}),
      },
    };

    window.localStorage.setItem(
      'lanobe-storage',
      JSON.stringify({
        state: nextState,
        version: parsed.version ?? 0,
      }),
    );
  }, overrides);
}

test('bookshelf volume selection leads to fixed reader controls with page navigation', async ({ page }) => {
  await seedLocalState(page, {
    uiLanguage: 'en-US',
  });

  await page.goto('http://127.0.0.1:4173/lanobe/bookshelf');

  const bookCard = page.locator('article').first();
  await expect(bookCard.getByText('Choose a volume before entering')).toBeVisible();

  await bookCard.getByRole('button', { name: /Volume 08/ }).click();
  await bookCard.locator('a[href*="volume=volume-08"]').first().click();

  await page.waitForURL(/volume=volume-08/);

  const controls = page.getByTestId('reader-controls-shell');
  await expect(controls).toHaveCSS('position', 'fixed');
  await expect(page.locator('a[href="/lanobe/bookshelf"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('button', { name: 'Quick' })).toBeVisible();
  await page.getByRole('button', { name: 'Playback' }).last().click();
  await expect(page.getByText('Zero gap')).toBeVisible();
});

test('mobile reader keeps the persistent background audio element mounted', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedLocalState(page, {
    uiLanguage: 'en-US',
  });

  await page.goto('http://127.0.0.1:4173/lanobe/book/makeine-too-many-heroines?volume=volume-01');
  await page.waitForURL(/volume=volume-01/);

  const backgroundAudio = page.locator('#lanobe-background-audio');
  await expect(backgroundAudio).toHaveCount(1);
  await expect(backgroundAudio).toHaveAttribute('playsinline', 'true');
  await expect(backgroundAudio).toHaveAttribute('webkit-playsinline', 'true');
  await expect(backgroundAudio).toHaveJSProperty('preload', 'auto');
  await expect(page.getByTestId('reader-controls-shell')).toHaveCSS('position', 'fixed');
});

test('configured AI button opens the explanation modal and renders the response', async ({ page }) => {
  await seedLocalState(page, {
    uiLanguage: 'en-US',
    settings: {
      aiApiBase: 'https://example.com/v1',
      aiApiKey: 'test-key',
      aiModel: 'test-model',
    },
  });

  await page.route('**/api/ai-chat', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overview: 'The speaker is softening the statement and relying on shared context.',
                translation: 'A natural translation for the current line.',
                contextNote: 'This line responds to the previous sentence and prepares the next one.',
                structure: 'Main clause plus a soft explanatory tail.',
                grammarPoints: [
                  {
                    title: 'Soft sentence ending',
                    explanation: 'The ending adds nuance instead of making the sentence sound blunt.',
                  },
                ],
                wordBreakdown: [
                  {
                    term: '負け',
                    meaning: 'loss / losing',
                    role: 'core noun',
                  },
                ],
                sentencePatterns: ['soft explanation', 'context-driven omission'],
                teachingTip: 'Read this sentence as a response shaped by the conversation, not in isolation.',
              }),
            },
          },
        ],
      }),
    });
  });

  await page.goto('http://127.0.0.1:4173/lanobe/book/makeine-too-many-heroines?volume=volume-01');
  await page.waitForURL(/volume=volume-01/);

  await expect(page.getByTestId('ai-explain-button')).toBeVisible();
  await page.getByTestId('ai-explain-button').click();

  await expect(page.getByTestId('ai-explain-modal')).toBeVisible();
  await expect(page.getByText('Generating the full explanation')).toBeVisible();
  await expect(page.getByText('The speaker is softening the statement and relying on shared context.')).toBeVisible();
  await expect(page.getByText('Read this sentence as a response shaped by the conversation, not in isolation.')).toBeVisible();
});
