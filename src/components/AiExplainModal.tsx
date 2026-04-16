import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Sparkles, StickyNote, X } from 'lucide-react';
import { explainEntryWithAi, EntryExplanation } from '../services/aiService';
import { useAppStore, buildEntryKey } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { useEscClose } from '../hooks/useModalDismiss';
import { useToast } from './Toast';

function Section({
  title,
  tone = 'default',
  children,
}: {
  title: string;
  tone?: 'default' | 'accent';
  children: ReactNode;
}) {
  return (
    <section
      className={[
        'rounded-[26px] border p-4 transition-transform duration-200 md:p-5',
        tone === 'accent'
          ? 'border-amber-300/18 bg-[linear-gradient(180deg,_rgba(251,191,36,0.14),_rgba(15,23,42,0.82))]'
          : 'border-slate-800/70 bg-slate-950/62 hover:-translate-y-0.5',
      ].join(' ')}
    >
      <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-400">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

interface AiExplainModalProps {
  onClose: () => void;
  /** Optional reading context so explanations can be cached / saved to notes. */
  slug?: string;
  volumeId?: string;
}

export function AiExplainModal({ onClose, slug, volumeId }: AiExplainModalProps) {
  const { entries, currentIndex, settings, setIsPlaying } = useAppStore();
  const setAiExplanation = useAppStore((s) => s.setAiExplanation);
  const cachedExplanation = useAppStore((s) =>
    slug && volumeId ? s.aiExplanations[buildEntryKey(slug, volumeId, currentIndex)] : undefined,
  );
  const setNote = useAppStore((s) => s.setNote);
  const { text, uiLanguage } = useUiText();
  const { toast } = useToast();
  useEscClose(onClose);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [result, setResult] = useState<EntryExplanation | null>(null);

  const currentEntry = entries[currentIndex];
  const previousEntry = currentIndex > 0 ? entries[currentIndex - 1] : undefined;
  const nextEntry = currentIndex < entries.length - 1 ? entries[currentIndex + 1] : undefined;

  const plainSentence = useMemo(
    () => currentEntry?.jp?.replace(/\[[^\]]+\]/g, '').trim() || '',
    [currentEntry],
  );

  const sentenceWithReading = useMemo(
    () => currentEntry?.jp?.replace(/\[([^\]]+)\]/g, '（$1）').trim() || '',
    [currentEntry],
  );

  const generateExplanation = useCallback(
    async (force = false) => {
      if (!currentEntry) {
        setStatus('error');
        setError(text.aiModal.noSentence);
        return;
      }

      // Use cached explanation if available (unless forced regenerate)
      if (!force && cachedExplanation?.data) {
        setResult(cachedExplanation.data as EntryExplanation);
        setStatus('success');
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
        });

        setResult(explanation);
        setStatus('success');
        if (slug && volumeId) {
          setAiExplanation(slug, volumeId, currentIndex, explanation);
        }
      } catch (nextError) {
        console.error('Failed to explain entry with AI', nextError);
        setStatus('error');
        setError(nextError instanceof Error ? nextError.message : text.aiModal.failed);
      }
    },
    [
      cachedExplanation?.data,
      currentEntry,
      currentIndex,
      nextEntry,
      previousEntry,
      settings.aiApiBase,
      settings.aiApiKey,
      settings.aiModel,
      settings.apiBase,
      setAiExplanation,
      slug,
      text.aiModal.failed,
      text.aiModal.noSentence,
      uiLanguage,
      volumeId,
    ],
  );

  useEffect(() => {
    setIsPlaying(false);
    generateExplanation();
  }, [generateExplanation, setIsPlaying]);

  function handleSaveToNote() {
    if (!slug || !volumeId || !result) return;
    const parts: string[] = [];
    if (result.translation) parts.push(`【翻译】${result.translation}`);
    if (result.overview) parts.push(`【整体】${result.overview}`);
    if (result.grammarPoints?.length) {
      parts.push(
        '【语法】\n' +
          result.grammarPoints.map((g) => `· ${g.title}：${g.explanation}`).join('\n'),
      );
    }
    if (result.wordBreakdown?.length) {
      parts.push(
        '【词汇】\n' +
          result.wordBreakdown
            .map((w) => `· ${w.term}${w.reading ? `（${w.reading}）` : ''} - ${w.meaning}`)
            .join('\n'),
      );
    }
    if (result.teachingTip) parts.push(`【提示】${result.teachingTip}`);
    setNote(slug, volumeId, currentIndex, parts.join('\n\n'));
    toast('AI 讲解已保存到笔记', 'success');
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/86 p-0 md:items-center md:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        data-testid="ai-explain-modal"
        className="flex h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[32px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.96))] shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-[34px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_rgba(15,23,42,0.2)_35%,_transparent_70%)] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/18 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                <Sparkles size={14} />
                AI
              </div>
              <h2 className="mt-3 text-xl font-black tracking-tight text-slate-100">{text.aiModal.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{text.aiModal.lineLabel.replace('{line}', String(currentIndex + 1))}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-2 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
              aria-label={text.common.close}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-5 pt-4 md:px-5">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <Section title={text.aiModal.currentSentence} tone="accent">
              <p className="text-lg font-semibold leading-8 text-slate-100">{sentenceWithReading || text.aiModal.noSentence}</p>
              {currentEntry?.ch && <p className="mt-3 text-sm leading-7 text-slate-300/88">{currentEntry.ch}</p>}
            </Section>

            <Section title={text.aiModal.reading}>
              <p className="text-sm leading-7 text-slate-200">{result?.readingGuide || sentenceWithReading || plainSentence || '-'}</p>
            </Section>
          </div>

          {status === 'loading' && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/18 bg-amber-500/10">
                <Loader2 size={30} className="animate-spin text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{text.aiModal.loadingTitle}</h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">{text.aiModal.loadingHint}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 rounded-[26px] border border-red-500/20 bg-red-500/10 p-5 text-red-100">
              <h3 className="text-lg font-bold">{text.aiModal.failed}</h3>
              <p className="mt-2 text-sm leading-7 text-red-100/85">{error}</p>
              <button
                type="button"
                onClick={() => generateExplanation(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/20"
              >
                <RefreshCw size={16} />
                {text.aiModal.retry}
              </button>
            </div>
          )}

          {status === 'success' && slug && volumeId ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveToNote}
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/20"
              >
                <StickyNote size={14} />
                保存为笔记
              </button>
              <button
                type="button"
                onClick={() => generateExplanation(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500"
              >
                <RefreshCw size={14} />
                重新生成
              </button>
              {cachedExplanation ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  已缓存
                </span>
              ) : null}
            </div>
          ) : null}

          {status === 'success' && result && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Section title={text.aiModal.translation}>
                <p className="text-sm leading-7 text-slate-200">{result.translation || currentEntry?.ch || '-'}</p>
              </Section>

              <Section title={text.aiModal.overview}>
                <p className="text-sm leading-7 text-slate-200">{result.overview || '-'}</p>
              </Section>

              <Section title={text.aiModal.grammar}>
                <div className="space-y-3">
                  {result.grammarPoints.length ? (
                    result.grammarPoints.map((point, index) => (
                      <div key={`${point.title}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/82 p-3.5">
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
                <div className="space-y-3">
                  {result.wordBreakdown.length ? (
                    result.wordBreakdown.map((word, index) => (
                      <div key={`${word.term}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/82 p-3.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-semibold text-blue-300">{word.term || '-'}</span>
                          {word.reading ? <span className="text-xs uppercase tracking-[0.16em] text-slate-500">{word.reading}</span> : null}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-300">{word.meaning || '-'}</p>
                        {word.role ? <p className="mt-1 text-xs text-slate-500">{word.role}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">-</p>
                  )}
                </div>
              </Section>

              <div className="md:col-span-2">
                <Section title={text.aiModal.teaching} tone="accent">
                  <p className="text-sm leading-7 text-slate-100">{result.teachingTip || '-'}</p>
                </Section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
