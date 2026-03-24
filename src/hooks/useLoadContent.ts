import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { parseTxt } from '../lib/parser';
import { generateChapters } from '../services/aiService';
import { Chapter } from '../types';

interface LoadContentOptions {
  presetChapters?: Chapter[];
  skipAi?: boolean;
}

function buildFallbackChapters(entryCount: number): Chapter[] {
  if (entryCount <= 0) {
    return [];
  }

  const sectionSize = 80;
  const chapterCount = Math.max(1, Math.ceil(entryCount / sectionSize));

  return Array.from({ length: chapterCount }, (_, index) => ({
    title: `Section ${String(index + 1).padStart(2, '0')}`,
    index: Math.min(index * sectionSize, entryCount - 1),
  }));
}

export function useLoadContent() {
  const { setEntries, setIsGeneratingChapters, setChapters, settings } = useAppStore();

  const loadContent = useCallback(async (text: string, options?: LoadContentOptions) => {
    const parsed = parseTxt(text);
    if (parsed.length === 0) return;

    setEntries(parsed);

    if (options?.presetChapters?.length) {
      setChapters(options.presetChapters);
      return;
    }

    if (options?.skipAi) {
      setChapters(buildFallbackChapters(parsed.length));
      return;
    }

    setIsGeneratingChapters(true);

    try {
      const chapters = await generateChapters(
        parsed,
        settings.aiApiKey,
        settings.aiApiBase,
        settings.aiModel,
        settings.apiBase,
      );
      setChapters(chapters);
    } catch (error) {
      console.error('Failed to generate chapters', error);
      if (useAppStore.getState().chapters.length === 0) {
        setChapters(buildFallbackChapters(parsed.length));
      }
    } finally {
      setIsGeneratingChapters(false);
    }
  }, [setChapters, setEntries, setIsGeneratingChapters, settings.aiApiBase, settings.aiApiKey, settings.aiModel, settings.apiBase]);

  return { loadContent };
}
