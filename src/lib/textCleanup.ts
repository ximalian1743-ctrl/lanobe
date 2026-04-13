const BRACKET_READING_PATTERN = /\[[^\]]+\]/g;
const PARENTHETICAL_READING_PATTERN = /[\uFF08(][^\uFF08\uFF09()]*[\uFF09)]/g;

export function stripBracketReadings(text: string) {
  return text.replace(BRACKET_READING_PATTERN, '').trim();
}

export function stripParentheticalReadings(text: string) {
  return text.replace(PARENTHETICAL_READING_PATTERN, '').trim();
}

export function cleanWordJapaneseText(text: string) {
  return stripBracketReadings(stripParentheticalReadings(text)).trim();
}

export function formatBracketReadingsAsParen(text: string) {
  return text.replace(/\[([^\]]+)\]/g, '\uFF08$1\uFF09').trim();
}
