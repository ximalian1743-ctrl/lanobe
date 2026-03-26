import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { buildLocalChapters } from '../lib/chapters';
import { parseTxt } from '../lib/parser';
import { generateChapters } from '../services/aiService';
import { Chapter } from '../types';

interface LoadContentOptions {
  presetChapters?: Chapter[];
  skipAi?: boolean;
}

export function useLoadContent() {
  const { setEntries, setIsGeneratingChapters, setChapters, settings, uiLanguage } = useAppStore();

  const loadContent = useCallback(async (text: string, options?: LoadContentOptions) => {
    const parsed = parseTxt(text);
    if (parsed.length === 0) return;

    setEntries(parsed);

    if (options?.presetChapters?.length) {
      setChapters(options.presetChapters);
      return;
    }

    if (options?.skipAi) {
      setChapters(buildLocalChapters(parsed, uiLanguage));
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
        setChapters(buildLocalChapters(parsed, uiLanguage));
      }
    } finally {
      setIsGeneratingChapters(false);
    }
  }, [setChapters, setEntries, setIsGeneratingChapters, settings.aiApiBase, settings.aiApiKey, settings.aiModel, settings.apiBase, uiLanguage]);

  return { loadContent };
}
