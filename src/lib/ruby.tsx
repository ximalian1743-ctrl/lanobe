import type React from 'react';
import type { ReactNode } from 'react';

/**
 * Render Japanese text containing `漢[かん]` bracket readings as native
 * <ruby>…<rt>…</rt></ruby> HTML. The character *immediately preceding* each
 * `[reading]` block is treated as the ruby base; longer multi-character bases
 * are handled by pairing characters of the base with readings in order.
 *
 * Simplified approach: treat the character directly before `[...]` as the
 * ruby base. This matches the content format used in lanobe volumes.
 */
export function renderRuby(jp: string): ReactNode {
  if (!jp) return null;
  const out: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let nodeKey = 0;

  while ((match = re.exec(jp)) !== null) {
    const reading = match[1];
    const bracketStart = match.index;
    const prefix = jp.slice(lastIndex, bracketStart);
    if (prefix.length === 0) {
      // Nothing before the bracket — render reading as-is
      out.push(
        <span key={`stray-${nodeKey++}`}>
          [{reading}]
        </span>,
      );
    } else {
      // Split prefix: everything before the last char is plain text, last char is ruby base
      const plain = prefix.slice(0, -1);
      const base = prefix.slice(-1);
      if (plain.length > 0) out.push(<span key={`t-${nodeKey++}`}>{plain}</span>);
      out.push(
        <ruby key={`r-${nodeKey++}`}>
          {base}
          <rt>{reading}</rt>
        </ruby>,
      );
    }
    lastIndex = re.lastIndex;
  }

  if (lastIndex < jp.length) {
    out.push(<span key={`tail-${nodeKey++}`}>{jp.slice(lastIndex)}</span>);
  }
  return out;
}
