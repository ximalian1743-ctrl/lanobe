import { BuiltInBookMeta, BuiltInBookSummary } from '../types/books';

export async function fetchBooksIndex(): Promise<BuiltInBookSummary[]> {
  const response = await fetch('/books/index.json');
  if (!response.ok) {
    throw new Error(`Failed to load books index: ${response.status}`);
  }
  return response.json();
}

export async function fetchBookMeta(metaPath: string): Promise<BuiltInBookMeta> {
  const response = await fetch(metaPath);
  if (!response.ok) {
    throw new Error(`Failed to load book meta: ${response.status}`);
  }
  return response.json();
}

export async function fetchBookText(textPath: string): Promise<string> {
  const response = await fetch(textPath);
  if (!response.ok) {
    throw new Error(`Failed to load book text: ${response.status}`);
  }
  return response.text();
}
