import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { explainEntryWithAi, EntryExplanation } from '../services/aiService';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-4 md:p-5">
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function AiExplainModal({ onClose }: { onClose: () => void }) {
  const { entries, currentIndex, settings, lastOpenedBook, setIsPlaying } = useAppStore();
  const { text, uiLanguage } = useUiText();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [result, setResult] = useState<EntryExplanation | null>(null);

  const currentEntry = entries[currentIndex];
  const previousEntry = currentIndex > 0 ? entries[currentIndex - 1] : undefined;
  const nextEntry = currentIndex < entries.length - 1 ? entries[currentIndex + 1] : undefined;

  const cleanedSentence = useMemo(
    () => currentEntry?.jp?.replace(/\[[^\]]+\]/g, '').trim() || '',
    [currentEntry],
  );

  const generateExplanation = useCallback(async () => {
    if (!currentEntry) {
      setStatus('error');
      setError(text.aiModal.noSentence);
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const explanation = await explainEntryWithAi({
        entry: currentEntry,
        previousEntry,
        nextEntry,
        lineNumber: currentIndex + 1,
        apiKey: settings.aiApiKey,
        apiBase: settings.aiApiBase,
        model: settings.aiModel,
        backendApiBase: settings.apiBase,
        uiLanguage,
        bookTitle: lastOpenedBook?.bookTitle,
        volumeLabel: lastOpenedBook?.volumeLabel,
      });

      setResult(explanation);
      setStatus('success');
    } catch (nextError) {
      console.error('Failed to explain entry with AI', nextError);
      setStatus('error');
      setError(nextError instanceof Error ? nextError.message : text.aiModal.failed);
    }
  }, [
    currentEntry,
    currentIndex,
    lastOpenedBook?.bookTitle,
    lastOpenedBook?.volumeLabel,
    nextEntry,
    previousEntry,
    settings.aiApiBase,
    settings.aiApiKey,
    settings.aiModel,
    settings.apiBase,
    text.aiModal.failed,
    text.aiModal.noSentence,
    uiLanguage,
  ]);

  useEffect(() => {
    setIsPlaying(false);
    generateExplanation();
  }, [generateExplanation, setIsPlaying]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/86 p-4 backdrop-blur-sm">
      <div
        data-testid="ai-explain-modal"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
              <Sparkles size={15} />
              AI
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-100">{text.aiModal.title}</h2>
            <p className="mt-1 truncate text-sm text-slate-400">{text.aiModal.lineLabel.replace('{line}', String(currentIndex + 1))}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label={text.common.close}
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <Section title={text.aiModal.currentSentence}>
            <p className="text-lg font-medium leading-8 text-slate-100">{cleanedSentence || text.aiModal.noSentence}</p>
            {currentEntry?.ch && <p className="mt-3 text-sm leading-7 text-slate-400">{currentEntry.ch}</p>}
          </Section>

          {status === 'loading' && (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
              <Loader2 size={38} className="animate-spin text-amber-300" />
              <div>
                <h3 className="text-lg font-bold text-slate-100">{text.aiModal.loadingTitle}</h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">{text.aiModal.loadingHint}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-red-100">
              <h3 className="text-lg font-bold">{text.aiModal.failed}</h3>
              <p className="mt-2 text-sm leading-7 text-red-100/85">{error}</p>
              <button
                type="button"
                onClick={generateExplanation}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/20"
              >
                <RefreshCw size={16} />
                {text.aiModal.retry}
              </button>
            </div>
          )}

          {status === 'success' && result && (
            <div className="mt-5 space-y-4">
              <Section title={text.aiModal.translation}>
                <p className="text-sm leading-7 text-slate-300">{result.translation || currentEntry?.ch || '-'}</p>
              </Section>

              <Section title={text.aiModal.overview}>
                <p className="text-sm leading-7 text-slate-300">{result.overview || '-'}</p>
              </Section>

              <Section title={text.aiModal.context}>
                <p className="text-sm leading-7 text-slate-300">{result.contextNote || '-'}</p>
              </Section>

              <Section title={text.aiModal.structure}>
                <p className="text-sm leading-7 text-slate-300">{result.structure || '-'}</p>
              </Section>

              <Section title={text.aiModal.grammar}>
                <div className="space-y-3">
                  {result.grammarPoints.length ? (
                    result.grammarPoints.map((point, index) => (
                      <div key={`${point.title}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                        <h4 className="text-sm font-semibold text-slate-100">{point.title || `${text.aiModal.grammar} ${index + 1}`}</h4>
                        <p className="mt-2 text-sm leading-7 text-slate-300">{point.explanation || '-'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">-</p>
                  )}
                </div>
              </Section>

              <Section title={text.aiModal.words}>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.wordBreakdown.length ? (
                    result.wordBreakdown.map((word, index) => (
                      <div key={`${word.term}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                        <div className="text-sm font-semibold text-blue-300">{word.term || '-'}</div>
                        <div className="mt-2 text-sm leading-7 text-slate-300">{word.meaning || '-'}</div>
                        {word.role && <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{word.role}</div>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">-</p>
                  )}
                </div>
              </Section>

              <Section title={text.aiModal.patterns}>
                <div className="flex flex-wrap gap-2">
                  {result.sentencePatterns.length ? (
                    result.sentencePatterns.map((pattern, index) => (
                      <span
                        key={`${pattern}-${index}`}
                        className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200"
                      >
                        {pattern}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">-</p>
                  )}
                </div>
              </Section>

              <Section title={text.aiModal.teaching}>
                <p className="text-sm leading-7 text-slate-200">{result.teachingTip || '-'}</p>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
