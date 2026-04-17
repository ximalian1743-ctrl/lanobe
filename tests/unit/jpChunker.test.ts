import assert from 'node:assert/strict';
import test from 'node:test';
import { chunkJapaneseText } from '../../src/lib/jpChunker.ts';

test('returns empty array for empty or whitespace-only input', () => {
  assert.deepEqual(chunkJapaneseText(''), []);
  assert.deepEqual(chunkJapaneseText('   \n  \n '), []);
});

test('normalizes CRLF to LF before splitting paragraphs', () => {
  const input = 'alpha.\r\n\r\nbeta.';
  const chunks = chunkJapaneseText(input, 50);
  assert.equal(chunks.length, 1);
  assert.ok(chunks[0].includes('alpha.'));
  assert.ok(chunks[0].includes('beta.'));
  assert.ok(!chunks[0].includes('\r'));
});

test('groups short paragraphs into a single chunk up to maxChars', () => {
  const input = 'short1\n\nshort2\n\nshort3';
  const chunks = chunkJapaneseText(input, 100);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], 'short1\nshort2\nshort3');
});

test('splits a paragraph on Japanese sentence terminators when it exceeds maxChars', () => {
  const sentence = 'これは日本語のテスト文章です。';
  const paragraph = sentence.repeat(4);
  const chunks = chunkJapaneseText(paragraph, sentence.length + 2);
  assert.ok(chunks.length >= 2, 'long paragraph should split into multiple chunks');
  for (const chunk of chunks) {
    assert.ok(chunk.length <= sentence.length * 2 + 4, 'each chunk stays near the cap');
    assert.ok(/[。！？!?]/.test(chunk), 'chunks end on sentence terminators, not mid-word');
  }
});

test('handles full-width quote suffix after sentence terminator', () => {
  const input = '「こんにちは。」「またね。」';
  const chunks = chunkJapaneseText(input, 6);
  const joined = chunks.join('');
  assert.equal(joined, input, 'no content lost across split boundaries');
});

test('hardSplits a single sentence longer than maxChars when no punctuation is available', () => {
  const longRun = 'a'.repeat(250);
  const chunks = chunkJapaneseText(longRun, 100);
  assert.ok(chunks.length >= 3, 'a run longer than 2x maxChars must split into >= 3 chunks');
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 100, `chunk '${chunk.slice(0, 20)}…' exceeded maxChars`);
  }
  assert.equal(chunks.join(''), longRun, 'hardSplit must preserve content');
});
