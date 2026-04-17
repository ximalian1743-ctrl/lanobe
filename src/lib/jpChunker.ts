const SENTENCE_END = /([。！？!?]+["」』）)]?)/;

function splitParagraph(paragraph: string): string[] {
  if (!paragraph) return [];
  const pieces: string[] = [];
  let buf = '';
  for (const part of paragraph.split(SENTENCE_END)) {
    if (!part) continue;
    if (SENTENCE_END.test(part)) {
      buf += part;
      pieces.push(buf);
      buf = '';
    } else {
      buf += part;
    }
  }
  if (buf.trim()) pieces.push(buf);
  return pieces;
}

function hardSplit(piece: string, maxChars: number): string[] {
  if (piece.length <= maxChars) return [piece];
  const out: string[] = [];
  for (let i = 0; i < piece.length; i += maxChars) {
    out.push(piece.slice(i, i + maxChars));
  }
  return out;
}

/**
 * Split raw Japanese text into chunks that each stay under `maxChars`, using
 * paragraph breaks first, then sentence-ending punctuation, never slicing
 * mid-sentence unless a single sentence exceeds the cap on its own.
 */
export function chunkJapaneseText(raw: string, maxChars = 800): string[] {
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const segments: string[] = [];
  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      segments.push(para);
      continue;
    }
    for (const sentence of splitParagraph(para)) {
      if (sentence.length <= maxChars) {
        segments.push(sentence);
      } else {
        segments.push(...hardSplit(sentence, maxChars));
      }
    }
  }

  const chunks: string[] = [];
  let current = '';
  for (const seg of segments) {
    if (!current) {
      current = seg;
      continue;
    }
    if (current.length + seg.length + 1 <= maxChars) {
      current += '\n' + seg;
    } else {
      chunks.push(current);
      current = seg;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
