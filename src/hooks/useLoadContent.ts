import { useAppStore } from '../store/useAppStore';
import { parseTxt } from '../lib/parser';
import { generateChapters } from '../services/aiService';

export function useLoadContent() {
  const { setEntries, setIsGeneratingChapters, setChapters, settings } = useAppStore();

  const loadContent = async (text: string) => {
    const parsed = parseTxt(text);
    if (parsed.length === 0) return;
    
    // Set entries first so we don't lose data if AI fails, but we hide them using isGeneratingChapters
    setEntries(parsed);
    setIsGeneratingChapters(true);
    
    try {
      const chapters = await generateChapters(
        parsed, 
        settings.aiApiKey, 
        settings.aiApiBase, 
        settings.aiModel,
        settings.apiBase
      );
      setChapters(chapters);
    } catch (error) {
      console.error('Failed to generate chapters', error);
      // Fallback chapters are handled in generateChapters, but just in case:
      if (useAppStore.getState().chapters.length === 0) {
         const numChapters = Math.min(50, parsed.length);
         const segmentSize = Math.floor(parsed.length / numChapters);
         const fallbackChapters = Array.from({length: numChapters}).map((_, i) => ({
           title: `第 ${i + 1} 部分`,
           index: i * segmentSize
         }));
         setChapters(fallbackChapters);
      }
    } finally {
      setIsGeneratingChapters(false);
    }
  };

  return { loadContent };
}
