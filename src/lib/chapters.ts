import { UiLanguage } from '../i18n/ui';
import { Chapter, Entry } from '../types';
import { stripFurigana } from './parser';

const FALLBACK_SECTION_SIZE = 120;
const TABLE_OF_CONTENTS_PATTERNS = [/^\u76EE\u6B21$/i, /^\u76EE\u5F55$/i, /^contents$/i];
const CHAPTER_HEADING_PATTERNS = [
  /^intermission/i,
  /^prologue/i,
  /^epilogue/i,
  /^afterword/i,
  /^\u3042\u3068\u304C\u304D$/i,
  /^\u540E\u8BB0$/i,
  /^\u7D42\u7AE0/i,
  /^\u756A\u5916\u7DE8/i,
  /^[~\uFF5E]\s*[0-9\uFF10-\uFF19].*(?:\u6557|\u8D25|\u76EE|\u7AE0|\u8A71|\u7BC7)/i,
  /^\u7B2C\s*[0-9\uFF10-\uFF19].*(?:\u7AE0|\u8BDD|\u7BC7|\u90E8|\u8D25)/i,
];

interface ChapterCandidate {
  title: string;
  key: string;
  index: number;
}

export function buildLocalChapters(entries: Entry[], language: UiLanguage): Chapter[] {
  if (entries.length === 0) {
    return [];
  }

  const dedupedCandidates = new Map<string, ChapterCandidate>();

  entries.forEach((entry, index) => {
    if (!looksLikeChapterHeading(entry)) {
      return;
    }

    const title = getChapterTitle(entry, language);
    const key = normalizeChapterKey(entry);

    if (!title || !key || TABLE_OF_CONTENTS_PATTERNS.some((pattern) => pattern.test(title))) {
      return;
    }

    // Keep the last occurrence so the actual chapter heading wins over table-of-contents duplicates.
    dedupedCandidates.set(key, {
      title,
      key,
      index,
    });
  });

  const localChapters = Array.from(dedupedCandidates.values())
    .sort((left, right) => left.index - right.index)
    .map(({ title, index }) => ({ title, index }));

  if (localChapters.length >= 2) {
    return localChapters;
  }

  return buildFallbackChapters(entries.length, language);
}

export function buildFallbackChapters(entryCount: number, language: UiLanguage): Chapter[] {
  if (entryCount <= 0) {
    return [];
  }

  const chapterCount = Math.max(1, Math.ceil(entryCount / FALLBACK_SECTION_SIZE));

  return Array.from({ length: chapterCount }, (_, index) => ({
    title: getFallbackChapterTitle(index + 1, language),
    index: Math.min(index * FALLBACK_SECTION_SIZE, entryCount - 1),
  }));
}

function looksLikeChapterHeading(entry: Entry) {
  const jp = stripFurigana(entry.jp);
  const ch = entry.ch.trim();
  const label = jp || ch;
  const combined = `${jp} ${ch}`.trim();

  if (!label || label.length > 96) {
    return false;
  }

  if (entry.words.length > 6 && label.length > 48) {
    return false;
  }

  return CHAPTER_HEADING_PATTERNS.some((pattern) => pattern.test(combined));
}

function normalizeChapterKey(entry: Entry) {
  return stripFurigana(entry.jp || entry.ch)
    .replace(/\s+/g, '')
    .toLowerCase();
}

function getChapterTitle(entry: Entry, language: UiLanguage) {
  const jp = stripFurigana(entry.jp);
  const ch = entry.ch.trim();

  if (language === 'ja-JP') {
    return jp || ch;
  }

  return ch || jp;
}

function getFallbackChapterTitle(index: number, language: UiLanguage) {
  if (language === 'en-US') {
    return `Chapter ${String(index).padStart(2, '0')}`;
  }

  return `\u7B2C ${String(index).padStart(2, '0')} \u7AE0`;
}
