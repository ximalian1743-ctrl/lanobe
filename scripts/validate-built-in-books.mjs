import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseTxt } from '../src/lib/parser.ts';

const root = process.cwd();
const booksRoot = path.join(root, 'public', 'books');
const indexPath = path.join(booksRoot, 'index.json');

function detectFormat(text) {
  if (/^ja:/m.test(text) || /^(?:zh|ch):/m.test(text) || /^word:/m.test(text) || /^pause:/m.test(text)) {
    return 'labeled';
  }

  return 'legacy';
}

function getEntryBlocks(text) {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => /^(?:ja|jp):/i.test(block));
}

function getOrphanBlocks(text) {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !/^(?:ja|jp):/i.test(block))
    .filter((block) => !/^pause:/i.test(block));
}

function validateVolume(bookSlug, volume, publicTextPath) {
  const text = fs.readFileSync(publicTextPath, 'utf8');
  const format = detectFormat(text);
  const parsedEntries = parseTxt(text);
  const entryBlocks = getEntryBlocks(text);
  const orphanBlocks = getOrphanBlocks(text);
  const decorativeOrphans = orphanBlocks.filter((block) => block.length <= 80);
  const significantOrphans = orphanBlocks.filter((block) => block.length > 80);
  const missingZh = parsedEntries.filter((entry) => !entry.ch.trim()).length;
  const missingWords = parsedEntries.filter((entry) => entry.words.length === 0).length;
  const pauseMarkers = (text.match(/^pause:/gm) || []).length;

  console.log(
    `  ${volume.id}: format=${format}, blocks=${entryBlocks.length}, entries=${parsedEntries.length}, missingZh=${missingZh}, missingWords=${missingWords}, pauseMarkers=${pauseMarkers}, decorativeBlocks=${decorativeOrphans.length}`,
  );

  if (significantOrphans.length > 0) {
    throw new Error(`${bookSlug}/${volume.id} has ${significantOrphans.length} non-entry block(s) that look like malformed content`);
  }

  if (parsedEntries.length === 0) {
    throw new Error(`${bookSlug}/${volume.id} parsed zero entries`);
  }

  if (parsedEntries.length !== entryBlocks.length) {
    throw new Error(`${bookSlug}/${volume.id} has ${entryBlocks.length} entry blocks but parsed ${parsedEntries.length} entries`);
  }

  if (missingZh > Math.max(20, Math.floor(parsedEntries.length * 0.1))) {
    throw new Error(`${bookSlug}/${volume.id} is missing too many translated lines`);
  }

  if (missingWords > Math.max(2000, Math.floor(parsedEntries.length * 0.8))) {
    throw new Error(`${bookSlug}/${volume.id} is missing too many word lines`);
  }
}

function main() {
  if (!fs.existsSync(indexPath)) {
    throw new Error('Missing public/books/index.json');
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  if (!Array.isArray(index) || index.length === 0) {
    throw new Error('Built-in books index is empty');
  }

  console.log('Built-in books validation');

  for (const book of index) {
    const metaPath = path.join(root, 'public', book.metaPath.replace(/^\//, '').replace(/\//g, path.sep));
    console.log(`BOOK ${book.slug}`);

    if (!fs.existsSync(metaPath)) {
      throw new Error(`Missing meta file: ${book.metaPath}`);
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (!Array.isArray(meta.volumes) || meta.volumes.length === 0) {
      throw new Error(`Book ${book.slug} has no volumes`);
    }

    for (const volume of meta.volumes) {
      const textPath = path.join(root, 'public', volume.textPath.replace(/^\//, '').replace(/\//g, path.sep));
      if (!fs.existsSync(textPath)) {
        throw new Error(`Missing volume file: ${volume.textPath}`);
      }

      validateVolume(book.slug, volume, textPath);
    }
  }

  console.log('Built-in books validation passed');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
