import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  StickyNote,
  Volume2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAppStore, buildEntryKey } from '../store/useAppStore';
import { AppSettings, Entry } from '../types';
import { cn } from '../lib/utils';
import { useUiText } from '../hooks/useUiText';
import { clampPageIndex, getTotalPages, ITEMS_PER_PAGE } from '../lib/pagination';
import { useSwipe } from '../hooks/useSwipe';
import { renderRuby } from '../lib/ruby';

interface ReadingContext {
  slug: string;
  volumeId: string;
}

const EntryItem = memo(
  ({
    entry,
    originalIndex,
    isActive,
    isPlaying,
    settings,
    onSelect,
    onOpenNote,
    onLookup,
    readingCtx,
    activeRef,
  }: {
    entry: Entry;
    originalIndex: number;
    isActive: boolean;
    isPlaying: boolean;
    settings: AppSettings;
    onSelect: (index: number) => void;
    onOpenNote: (index: number) => void;
    onLookup: (word: string) => void;
    readingCtx: ReadingContext | null;
    activeRef: React.RefObject<HTMLLIElement> | null;
  }) => {
    const isCached = useAppStore((state) => !!state.audioCache[originalIndex]);
    const fetching = useAppStore((state) => state.isFetching[originalIndex]);
    const fetchError = useAppStore((state) => state.fetchErrors[originalIndex]);
    const bookmark = useAppStore((state) =>
      readingCtx
        ? state.bookmarks[buildEntryKey(readingCtx.slug, readingCtx.volumeId, originalIndex)]
        : undefined,
    );
    const note = useAppStore((state) =>
      readingCtx
        ? state.notes[buildEntryKey(readingCtx.slug, readingCtx.volumeId, originalIndex)]
        : undefined,
    );
    const toggleBookmark = useAppStore((state) => state.toggleBookmark);
    const { text } = useUiText();
    const compact = settings.readerDensity === 'compact';
    const scale = settings.readerFontScale ?? 1;
    const [wordsExpanded, setWordsExpanded] = useState(false);
    const [noteExpanded, setNoteExpanded] = useState(false);

    function handleBookmarkClick(e: React.MouseEvent) {
      e.stopPropagation();
      if (!readingCtx) return;
      const preview = (entry.jp ?? '').replace(/\[[^\]]+\]/g, '').slice(0, 40);
      toggleBookmark(readingCtx.slug, readingCtx.volumeId, originalIndex, preview);
    }

    function handleTextSelection(e: React.MouseEvent | React.TouchEvent) {
      // Debounce selection to avoid firing on mid-drag / tap
      window.setTimeout(() => {
        const sel = window.getSelection();
        const txt = sel?.toString().trim();
        // Require 2+ chars, max 12, and only fire on genuine release
        if (txt && txt.length >= 2 && txt.length <= 12) {
          e.stopPropagation();
          onLookup(txt);
        }
      }, 60);
    }

    return (
      <li
        ref={activeRef}
        onClick={() => onSelect(originalIndex)}
        className={cn(
          compact
            ? 'group relative cursor-pointer overflow-hidden rounded-2xl border p-3 transition-all duration-300 md:p-4'
            : 'group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 md:rounded-3xl md:p-6',
          isActive
            ? isPlaying
              ? 'border-blue-500/50 bg-blue-900/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
              : 'border-slate-600 bg-slate-800/80 shadow-lg'
            : 'border-slate-800/50 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/60',
        )}
      >
        {isActive && isPlaying && (
          <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
        )}

        <div
          className={
            compact ? 'mb-2 flex items-start justify-between' : 'mb-3 flex items-start justify-between md:mb-4'
          }
        >
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold md:px-2.5 md:text-xs',
              isActive
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-400',
            )}
          >
            {isActive && isPlaying && <Volume2 size={12} className="animate-pulse" />}
            #{originalIndex + 1}
          </span>

          <div className="flex items-center gap-1.5 md:gap-2">
            {readingCtx ? (
              <>
                <button
                  type="button"
                  onClick={handleBookmarkClick}
                  className={cn(
                    'rounded-lg px-1.5 py-1 transition-colors',
                    bookmark
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'text-slate-500 hover:bg-slate-800 hover:text-amber-300',
                  )}
                  title={bookmark ? '取消书签' : '加入书签'}
                  aria-label={bookmark ? 'remove bookmark' : 'add bookmark'}
                >
                  {bookmark ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNote(originalIndex);
                  }}
                  className={cn(
                    'rounded-lg px-1.5 py-1 transition-colors',
                    note
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'text-slate-500 hover:bg-slate-800 hover:text-blue-300',
                  )}
                  title={note ? '查看 / 编辑笔记' : '添加笔记'}
                  aria-label="note"
                >
                  <StickyNote size={14} />
                </button>
              </>
            ) : null}
            {fetchError ? (
              <span
                className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-400 md:px-2.5 md:text-xs"
                title={fetchError}
              >
                <AlertCircle size={12} /> {text.entryList.loadFailed}
              </span>
            ) : fetching ? (
              <span className="flex items-center gap-1 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[11px] font-medium text-yellow-500 md:px-2.5 md:text-xs">
                <Loader2 size={12} className="animate-spin" /> {text.entryList.generating}
              </span>
            ) : isCached ? (
              <span className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400 md:px-2.5 md:text-xs">
                <CheckCircle2 size={12} /> {text.entryList.cached}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800/50 px-2 py-1 text-[11px] font-medium text-slate-500 md:px-2.5 md:text-xs">
                <AlertCircle size={12} /> {text.entryList.notCached}
              </span>
            )}
          </div>
        </div>

        {settings.showJP && entry.jp && (
          <p
            className={cn(
              compact
                ? 'mb-1.5 font-medium leading-7 tracking-wide transition-colors md:mb-2'
                : 'mb-2 font-medium leading-relaxed tracking-wide transition-colors md:mb-3',
              isActive ? 'text-blue-100' : 'text-slate-200 group-hover:text-slate-100',
            )}
            style={{ fontSize: `${(compact ? 1 : 1.2) * scale}rem` }}
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
          >
            {settings.furiganaMode === 'hidden'
              ? entry.jp.replace(/\[[^\]]+\]/g, '')
              : settings.furiganaMode === 'bracket'
                ? entry.jp
                : renderRuby(entry.jp)}
          </p>
        )}

        {settings.showZH && entry.ch && (
          <p
            className={cn(
              compact ? 'leading-6 transition-colors' : 'leading-relaxed transition-colors',
              isActive ? 'text-blue-300/80' : 'text-slate-400 group-hover:text-slate-300',
            )}
            style={{ fontSize: `${(compact ? 0.82 : 1) * scale}rem` }}
          >
            {entry.ch}
          </p>
        )}

        {note ? (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNoteExpanded((v) => !v);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300 hover:bg-blue-500/20"
            >
              <StickyNote size={10} />
              {noteExpanded ? '收起笔记' : '已有笔记'}
            </button>
          </div>
        ) : null}
        {note && noteExpanded ? (
          <div
            className="mt-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-200/90"
            onClick={(e) => {
              e.stopPropagation();
              onOpenNote(originalIndex);
            }}
          >
            <p className="whitespace-pre-wrap text-blue-100/85">{note.text}</p>
          </div>
        ) : null}

        {settings.showWords && entry.words.length > 0 && (
          <div
            className={
              compact
                ? 'mt-3 border-t border-slate-800/50 pt-2.5'
                : 'mt-4 border-t border-slate-800/50 pt-3 md:mt-5 md:pt-4'
            }
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setWordsExpanded((v) => !v);
              }}
              className="mb-2 inline-flex items-center gap-1 rounded-full bg-slate-800/60 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-700 md:text-xs"
            >
              <ChevronDown
                size={12}
                className={wordsExpanded ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
              {entry.words.length} {wordsExpanded ? '收起' : '个词'}
            </button>
            {wordsExpanded && (
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {entry.words.map((word, index) => (
                  <span
                    key={`${entry.id}-${index}`}
                    className={cn(
                      compact
                        ? 'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] shadow-sm transition-colors md:text-xs'
                        : 'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] shadow-sm transition-colors md:rounded-xl md:px-3 md:py-1.5 md:text-sm',
                      isActive
                        ? 'border-blue-800/50 bg-blue-950/50 text-blue-300'
                        : 'border-slate-800/80 bg-slate-950/50 text-slate-300',
                    )}
                  >
                    <span className={isActive ? 'font-medium text-blue-200' : 'font-medium text-blue-300'}>
                      {word[0]}
                    </span>
                    <span className={isActive ? 'text-blue-800/50' : 'text-slate-700'}>|</span>
                    <span className={isActive ? 'text-blue-300/80' : 'text-slate-400'}>{word[1]}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </li>
    );
  },
);

EntryItem.displayName = 'EntryItem';

interface EntryListProps {
  readingCtx?: ReadingContext | null;
  onOpenNote?: (entryIndex: number) => void;
  onLookup?: (word: string) => void;
}

export function EntryList({ readingCtx, onOpenNote, onLookup }: EntryListProps = {}) {
  const entries = useAppStore((state) => state.entries);
  const currentIndex = useAppStore((state) => state.currentIndex);
  const setCurrentIndex = useAppStore((state) => state.setCurrentIndex);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);
  const currentPage = useAppStore((state) => state.readerPageIndex);
  const setCurrentPage = useAppStore((state) => state.setReaderPageIndex);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const settings = useAppStore((state) => state.settings);
  const locateTrigger = useAppStore((state) => state.locateTrigger);
  const { text, format } = useUiText();
  const compact = settings.readerDensity === 'compact';

  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex, currentPage, locateTrigger]);

  const totalPages = getTotalPages(entries.length);

  const currentEntries = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return entries.slice(start, start + ITEMS_PER_PAGE).map((entry, idx) => ({
      entry,
      originalIndex: start + idx,
    }));
  }, [currentPage, entries]);

  const swipe = useSwipe({
    onSwipeLeft: () => setCurrentPage(clampPageIndex(currentPage + 1, entries.length)),
    onSwipeRight: () => setCurrentPage(clampPageIndex(currentPage - 1, entries.length)),
  });

  const handleSelect = (index: number) => {
    setCurrentIndex(index);
    // Preserve user's current play/pause intent — do NOT force-start playback.
    // The audio queue will pick up the new index and continue if already playing.
    void setIsPlaying;
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/20 py-32 text-center text-slate-500">
        <p className="mb-2 text-lg font-medium">{text.entryList.emptyTitle}</p>
        <p className="text-sm text-slate-600">{text.entryList.emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="pb-20" {...swipe}>
      {totalPages > 1 && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-sm backdrop-blur-sm">
          <button
            onClick={() => setCurrentPage(clampPageIndex(currentPage - 1, entries.length))}
            disabled={currentPage === 0}
            className="rounded-xl bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium tracking-wide text-slate-400">
            {format(text.entryList.pageLabel, { page: currentPage + 1, total: totalPages })}
          </span>
          <button
            onClick={() => setCurrentPage(clampPageIndex(currentPage + 1, entries.length))}
            disabled={currentPage === totalPages - 1}
            className="rounded-xl bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className={compact ? 'space-y-3' : 'space-y-4'}
        >
          {currentEntries.map(({ entry, originalIndex }) => (
            <EntryItem
              key={entry.id}
              entry={entry}
              originalIndex={originalIndex}
              isActive={originalIndex === currentIndex}
              isPlaying={isPlaying}
              settings={settings}
              onSelect={handleSelect}
              onOpenNote={onOpenNote ?? (() => {})}
              onLookup={onLookup ?? (() => {})}
              readingCtx={readingCtx ?? null}
              activeRef={originalIndex === currentIndex ? activeRef : null}
            />
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}
