import assert from 'node:assert/strict';
import test from 'node:test';
import {
  splitOversizeTxt,
  splitFileName,
} from '../../src/lib/txtFileSplit.ts';

test('splitOversizeTxt returns the original text as single part when under cap', () => {
  const result = splitOversizeTxt('short content', 1000);
  assert.equal(result.needsSplit, false);
  assert.deepEqual(result.parts, ['short content']);
});

test('splitOversizeTxt splits large payload into multiple parts under the cap', () => {
  const sentence = 'これはテストの文章です。';
  const big = sentence.repeat(200);
  const result = splitOversizeTxt(big, sentence.length * 5);
  assert.equal(result.needsSplit, true);
  assert.ok(result.parts.length > 1, 'must split into more than one part');
  for (const part of result.parts) {
    assert.ok(part.length <= sentence.length * 5, 'each part stays under cap');
  }
});

test('splitOversizeTxt normalizes CRLF before splitting', () => {
  const input = 'alpha.\r\n\r\nbeta.';
  const result = splitOversizeTxt(input, 5000);
  assert.equal(result.needsSplit, false);
  assert.ok(!result.parts[0].includes('\r'));
});

test('splitOversizeTxt preserves content across chunks', () => {
  const runs = 'a'.repeat(300) + '。' + 'b'.repeat(300) + '。' + 'c'.repeat(300);
  const result = splitOversizeTxt(runs, 250);
  assert.equal(result.needsSplit, true);
  const rejoined = result.parts.join('');
  assert.equal(rejoined.replace(/\n/g, ''), runs.replace(/\n/g, ''));
});

test('splitFileName pads index to match total width and strips extension', () => {
  assert.equal(splitFileName('volume.txt', 0, 3), 'volume_part-01.txt');
  assert.equal(splitFileName('volume.txt', 9, 100), 'volume_part-010.txt');
  assert.equal(splitFileName('no-ext', 0, 2), 'no-ext_part-01.txt');
  assert.equal(splitFileName('', 0, 1), 'split_part-01.txt');
});
