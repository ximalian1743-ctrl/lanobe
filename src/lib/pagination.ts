export const ITEMS_PER_PAGE = 50;

export function getTotalPages(entryCount: number) {
  return Math.max(1, Math.ceil(entryCount / ITEMS_PER_PAGE));
}

export function clampPageIndex(pageIndex: number, entryCount: number) {
  return Math.max(0, Math.min(pageIndex, getTotalPages(entryCount) - 1));
}

export function getPageIndexForEntry(entryIndex: number) {
  return Math.max(0, Math.floor(entryIndex / ITEMS_PER_PAGE));
}

export function getPageStartIndex(pageIndex: number) {
  return Math.max(0, pageIndex * ITEMS_PER_PAGE);
}
