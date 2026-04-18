import { Entry } from '../types';

const JP_LINE_PATTERN = /^(?:jp|ja):\s*/i;
const CH_LINE_PATTERN = /^(?:zh|ch):\s*/i;
const WORD_LINE_PATTERN = /^word:\s*/i;
const PAUSE_LINE_PATTERN = /^pause:\s*/i;

export function stripFurigana(text: string) {
  return text.replace(/\[[^\]]+\]/g, '').trim();
}

export function parseTxt(text: string): Entry[] {
  // Insert blank line before ja:/jp: lines not already preceded by one,
  // so files without blank-line separators are split correctly into blocks.
  const normalized = text.replace(/([^\r\n])\r?\n((?:jp|ja):)/gi, '$1\n\n$2');

  return normalized
    .split(/\r?\n\s*\r?\n/)
    .map((block) => parseBlock(block))
    .filter((entry): entry is Omit<Entry, 'id'> => !!entry)
    .map((entry, index) => ({
      id: `entry-${index}`,
      ...entry,
    }));
}

function parseBlock(block: string): Omit<Entry, 'id'> | null {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length || !JP_LINE_PATTERN.test(lines[0])) {
    return null;
  }

  const jpLines = [lines[0].replace(JP_LINE_PATTERN, '').trim()];
  const words: [string, string][] = [];
  let ch = '';
  const bodyLines = lines.slice(1).filter((line) => !PAUSE_LINE_PATTERN.test(line));
  const hasLabeledBody = bodyLines.some((line) => CH_LINE_PATTERN.test(line) || WORD_LINE_PATTERN.test(line));

  if (hasLabeledBody) {
    for (const line of bodyLines) {
      if (CH_LINE_PATTERN.test(line)) {
        ch = line.replace(CH_LINE_PATTERN, '').trim();
        continue;
      }

      if (WORD_LINE_PATTERN.test(line)) {
        const word = parseWordLine(line);
        if (word) {
          words.push(word);
        }
        continue;
      }

      if (!ch) {
        jpLines.push(line);
      }
    }
  } else {
    const legacyWordStartIndex = bodyLines.findIndex(looksLikeWordPayload);
    const textLines = legacyWordStartIndex === -1 ? bodyLines : bodyLines.slice(0, legacyWordStartIndex);
    const wordLines = legacyWordStartIndex === -1 ? [] : bodyLines.slice(legacyWordStartIndex);

    if (textLines.length > 0) {
      ch = textLines[textLines.length - 1];
      jpLines.push(...textLines.slice(0, -1));
    }

    wordLines.forEach((line) => {
      const word = parseLooseWordLine(line);
      if (word) {
        words.push(word);
      }
    });
  }

  const jp = jpLines.join('').trim();
  if (!jp && !ch && words.length === 0) {
    return null;
  }

  return { jp, ch, words };
}

function parseWordLine(line: string): [string, string] | null {
  return parseLooseWordLine(line.replace(WORD_LINE_PATTERN, '').trim());
}

function parseLooseWordLine(raw: string): [string, string] | null {
  if (!raw) {
    return null;
  }

  const pipeParts = raw
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  if (pipeParts.length >= 3) {
    return [pipeParts[0], pipeParts[2]];
  }

  if (pipeParts.length >= 2) {
    return [pipeParts[0], pipeParts[1]];
  }

  const colonParts = raw
    .split(/[:\uFF1A]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (colonParts.length >= 2) {
    return [colonParts[0], colonParts.slice(1).join('\uFF1A')];
  }

  return null;
}

function looksLikeWordPayload(line: string) {
  return line.includes('|') || /[:\uFF1A]/.test(line);
}
