import { chunkJapaneseText } from './jpChunker';

/** Leave headroom below the AI cap so the last chunk is never right on the line. */
const DEFAULT_SPLIT_CAP = 18000;

export interface SplitResult {
  parts: string[];
  needsSplit: boolean;
}

/**
 * Split an oversize TXT payload into paragraph/sentence-aligned chunks that
 * each stay under `maxChars`. Returns the original content as a single-element
 * array when no split is needed.
 */
export function splitOversizeTxt(
  content: string,
  maxChars: number = DEFAULT_SPLIT_CAP,
): SplitResult {
  const trimmed = content.replace(/\r\n/g, '\n');
  if (trimmed.length <= maxChars) {
    return { parts: [trimmed], needsSplit: false };
  }
  const parts = chunkJapaneseText(trimmed, maxChars);
  return { parts, needsSplit: true };
}

/**
 * Produce the filename used for the Nth split piece. `baseName` should be the
 * original filename without extension; the result ends in `_part-01.txt` etc.
 */
export function splitFileName(baseName: string, index: number, total: number): string {
  const width = Math.max(2, String(total).length);
  const padded = String(index + 1).padStart(width, '0');
  const sanitized = baseName.replace(/\.[^.]+$/, '') || 'split';
  return `${sanitized}_part-${padded}.txt`;
}

/**
 * Trigger sequential browser downloads for each split piece. A short delay
 * between downloads avoids the browser's "multiple downloads" block in some
 * engines. Returns a promise that resolves once all clicks have been scheduled.
 */
export async function downloadSplits(baseName: string, parts: string[]): Promise<void> {
  if (typeof document === 'undefined') return;
  for (let i = 0; i < parts.length; i++) {
    const blob = new Blob([parts[i]], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = splitFileName(baseName, i, parts.length);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    if (i < parts.length - 1) await new Promise((r) => setTimeout(r, 200));
  }
}
