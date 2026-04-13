import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cleanWordJapaneseText,
  formatBracketReadingsAsParen,
} from '../../src/lib/textCleanup.ts';

test('cleanWordJapaneseText removes parenthetical and bracket readings', () => {
  assert.equal(cleanWordJapaneseText('term(kana)[kana]'), 'term');
  assert.equal(cleanWordJapaneseText('word\uFF08kana\uFF09[kana]'), 'word');
  assert.equal(cleanWordJapaneseText('vocab[kana]'), 'vocab');
});

test('formatBracketReadingsAsParen converts bracket readings for AI display', () => {
  assert.equal(formatBracketReadingsAsParen('term[kana]'), 'term\uFF08kana\uFF09');
});
