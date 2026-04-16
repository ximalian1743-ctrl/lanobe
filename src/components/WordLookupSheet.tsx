import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BottomSheet } from './BottomSheet';

interface WordLookupSheetProps {
  word: string;
  onClose: () => void;
}

export function WordLookupSheet({ word, onClose }: WordLookupSheetProps) {
  const entries = useAppStore((s) => s.entries);
  const setCurrentIndex = useAppStore((s) => s.setCurrentIndex);

  const query = word.trim();

  const hits = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return entries
      .map((entry, idx) => {
        const matchingWords = entry.words.filter(
          ([jp, zh]) => jp.toLowerCase().includes(q) || zh.toLowerCase().includes(q),
        );
        const jpHit = entry.jp?.includes(query);
        if (matchingWords.length > 0 || jpHit) {
          return { entry, idx, matchingWords };
        }
        return null;
      })
      .filter(
        (x): x is { entry: (typeof entries)[number]; idx: number; matchingWords: (typeof entries)[number]['words'] } =>
          !!x,
      )
      .slice(0, 20);
  }, [query, entries]);

  const meanings = useMemo(() => {
    const out = new Map<string, Set<string>>();
    for (const hit of hits) {
      for (const [jp, zh] of hit.matchingWords) {
        if (!out.has(jp)) out.set(jp, new Set());
        out.get(jp)!.add(zh);
      }
    }
    return Array.from(out.entries());
  }, [hits]);

  return (
    <BottomSheet
      open
      onClose={onClose}
      maxHeightVh={0.7}
      title={
        <span className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">划词查询</span>
          <span className="mt-1 block text-lg font-bold text-slate-100">{query}</span>
        </span>
      }
    >
      {meanings.length > 0 ? (
        <div className="mb-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">词汇释义</p>
          <ul className="space-y-1.5">
            {meanings.map(([jp, zhSet]) => (
              <li key={jp} className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm">
                <span className="font-semibold text-blue-300">{jp}</span>
                <span className="mx-2 text-slate-700">|</span>
                <span className="text-slate-300">{Array.from(zhSet).join('；')}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        在全书出现（{hits.length} 处）
      </p>
      {hits.length === 0 ? (
        <p className="mt-4 text-center text-sm text-slate-500">未找到匹配</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {hits.map(({ entry, idx }) => (
            <li
              key={entry.id}
              onClick={() => {
                setCurrentIndex(idx);
                onClose();
              }}
              className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 hover:border-blue-500/40 hover:bg-slate-800/60"
            >
              <p className="text-[10px] font-semibold text-slate-500">#{idx + 1}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-200">{entry.jp?.replace(/\[[^\]]+\]/g, '')}</p>
              {entry.ch ? <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{entry.ch}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
