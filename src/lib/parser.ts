import { Entry } from "../types";

export function parseTxt(text: string): Entry[] {
  const entries: Entry[] = [];
  const blocks = text.split(/(?=^jp:)/m).filter(b => b.trim());

  blocks.forEach((block, index) => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    let jp = '';
    let ch = '';
    let words: [string, string][] = [];

    if (lines.length >= 3) {
      jp = lines[0].replace(/^jp:\s*/i, '');
      ch = lines[1];
      words = parseWords(lines.slice(2).join(' '));
    } else if (lines.length === 2) {
      jp = lines[0].replace(/^jp:\s*/i, '');
      if (lines[1].includes(':') || lines[1].includes('：')) {
         words = parseWords(lines[1]);
      } else {
         ch = lines[1];
      }
    } else if (lines.length === 1) {
      let content = lines[0].replace(/^jp:\s*/i, '');
      // Try to extract Chinese in double quotes “...” or "..."
      const chMatch = content.match(/[“"]([^”"]+)[”"]/);
      if (chMatch) {
        ch = chMatch[1];
        const parts = content.split(chMatch[0]);
        jp = parts[0].trim();
        words = parseWords(parts[1] || '');
      } else {
        jp = content;
      }
    }

    if (jp || ch || words.length > 0) {
      entries.push({ id: `entry-${index}`, jp, ch, words });
    }
  });

  return entries;
}

function parseWords(raw: string): [string, string][] {
  if (!raw) return [];
  return raw.split(/[,，]/).map(w => {
    const parts = w.split(/[:：]/);
    if (parts.length >= 2) {
      return [parts[0].trim(), parts[1].trim()] as [string, string];
    }
    return null;
  }).filter(Boolean) as [string, string][];
}
