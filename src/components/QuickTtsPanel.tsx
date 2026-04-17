import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, FileText, Loader2, Play, Sparkles, Upload, Volume2, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { runAiAnnotate, AI_MAX_CHARS } from '../services/aiAnnotate';
import { stripBracketReadings } from '../lib/textCleanup';
import { splitOversizeTxt, downloadSplits } from '../lib/txtFileSplit';
import { useToast } from './Toast';

interface PendingFile {
  id: string;
  name: string;
  content: string;
}

function makeFileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type LangKey = 'auto' | 'ja' | 'zh';

interface VoiceOption {
  id: string;
  name: string;
}

const VOICES: Record<'ja' | 'zh', VoiceOption[]> = {
  ja: [
    { id: 'ja-JP-NanamiNeural', name: 'Nanami · 女声 / 標準' },
    { id: 'ja-JP-AoiNeural', name: 'Aoi · 女声 / 清亮' },
    { id: 'ja-JP-MayuNeural', name: 'Mayu · 女声 / 温柔' },
    { id: 'ja-JP-ShioriNeural', name: 'Shiori · 女声 / 年轻' },
    { id: 'ja-JP-KeitaNeural', name: 'Keita · 男声 / 標準' },
    { id: 'ja-JP-DaichiNeural', name: 'Daichi · 男声 / 成熟' },
    { id: 'ja-JP-NaokiNeural', name: 'Naoki · 男声 / 新闻' },
  ],
  zh: [
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 · 女声 / 标准' },
    { id: 'zh-CN-XiaoyiNeural', name: '晓伊 · 女声 / 活泼' },
    { id: 'zh-CN-YunxiNeural', name: '云希 · 男声 / 年轻' },
    { id: 'zh-CN-YunjianNeural', name: '云健 · 男声 / 成熟' },
    { id: 'zh-CN-YunyangNeural', name: '云扬 · 男声 / 新闻' },
    { id: 'zh-CN-XiaohanNeural', name: '晓涵 · 女声 / 温暖' },
    { id: 'zh-TW-HsiaoChenNeural', name: '曉臻 · 台湾女声' },
    { id: 'zh-HK-HiuMaanNeural', name: '曉曼 · 粤语女声' },
  ],
};

const RATE_PRESETS = [0.8, 1.0, 1.2, 1.5];
const STORAGE_KEY = 'lanobe-quick-tts-state-v1';
const MAX_CHARS = 2000;

const N_MODE_CONFIG = {
  aiApiBase: 'https://grok.ximalian.cc.cd/v1',
  aiApiKey: 'zgt20031204',
  aiModel: 'grok-4.20-expert',
} as const;

function detectLang(text: string): 'ja' | 'zh' {
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  return 'ja';
}

function resolveApiBase(apiBase: string): string {
  if (!apiBase) return '';
  if (apiBase === 'https://api.ximalian.cc.cd') return '';
  return apiBase;
}

interface PersistedState {
  text?: string;
  lang?: LangKey;
  voice?: string;
  rate?: number;
  open?: boolean;
  nMode?: boolean;
}

export function QuickTtsPanel() {
  const settings = useAppStore((s) => s.settings);
  const batchAiProgress = useAppStore((s) => s.batchAiProgress);
  const { text: ui, format } = useUiText();
  const t = ui.quickTts;
  const { toast } = useToast();
  const aiBusy = !!batchAiProgress;

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [lang, setLang] = useState<LangKey>('auto');
  const [voice, setVoice] = useState<string>(settings.jpVoice || 'ja-JP-NanamiNeural');
  const [rate, setRate] = useState(1.0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [nMode, setNMode] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inflightRef = useRef<AbortController | null>(null);
  const filePickerRef = useRef<HTMLInputElement | null>(null);

  // Hydrate persisted state once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as PersistedState;
      if (typeof s.text === 'string') setText(s.text);
      if (s.lang) setLang(s.lang);
      if (typeof s.rate === 'number') setRate(s.rate);
      if (typeof s.voice === 'string') setVoice(s.voice);
      if (typeof s.open === 'boolean') setOpen(s.open);
      if (typeof s.nMode === 'boolean') setNMode(s.nMode);
    } catch {
      // ignore
    }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ text, lang, voice, rate, open, nMode } satisfies PersistedState),
      );
    } catch {
      // ignore quota errors
    }
  }, [text, lang, voice, rate, open, nMode]);

  const effectiveLang: 'ja' | 'zh' = useMemo(
    () => (lang === 'auto' ? detectLang(text) : lang),
    [lang, text],
  );

  const voiceOptions = VOICES[effectiveLang];

  // Keep voice consistent with effectiveLang
  useEffect(() => {
    if (!voiceOptions.some((v) => v.id === voice)) {
      setVoice(voiceOptions[0].id);
    }
  }, [voiceOptions, voice]);

  // Cleanup blob URL when replaced or unmounted
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
      inflightRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSynth = async () => {
    const value = text.trim();
    if (!value) {
      setStatus(t.errEmpty);
      return;
    }
    if (value.length > MAX_CHARS) {
      setStatus(t.errTooLong.replace('{n}', String(MAX_CHARS)));
      return;
    }

    // TTS engine pronounces bracket furigana literally (`漢[かん]字` →
    // "漢 かん 字"), so strip them to match the main reader's behaviour.
    const ttsText = stripBracketReadings(value);
    if (!ttsText) {
      setStatus(t.errEmpty);
      return;
    }

    inflightRef.current?.abort();
    const controller = new AbortController();
    inflightRef.current = controller;

    setBusy(true);
    setStatus(t.generating);

    try {
      const apiBase = resolveApiBase(settings.apiBase);
      const t0 = performance.now();
      const res = await fetch(`${apiBase}/api/tts-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ text: ttsText, voice, rate }] }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { results: Array<{ audioBase64: string }> };
      const audioBase64 = data.results?.[0]?.audioBase64;
      if (!audioBase64) throw new Error(t.errNoAudio);

      // Convert base64 to Blob (avoids huge data: URLs)
      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });

      if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Wait for state propagation, then play
      requestAnimationFrame(() => {
        const el = audioRef.current;
        if (!el) return;
        el.src = url;
        el.play().catch(() => {
          // Autoplay blocked — user can press the audio control manually
        });
      });

      const ms = Math.round(performance.now() - t0);
      setStatus(t.done.replace('{kb}', (blob.size / 1024).toFixed(1)).replace('{ms}', String(ms)));
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setStatus(t.canceled);
      } else {
        console.error('Quick TTS error:', error);
        setStatus((error as Error).message || t.errUnknown);
      }
    } finally {
      setBusy(false);
      inflightRef.current = null;
    }
  };

  const handleStop = () => {
    inflightRef.current?.abort();
    audioRef.current?.pause();
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const slug = text.trim().slice(0, 20).replace(/[\\/:*?"<>|\r\n]+/g, '_');
    a.download = `tts_${slug || 'audio'}.mp3`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const addFiles = async (raw: File[]) => {
    const existingKeys = new Set(files.map((f) => `${f.name}|${f.content.length}`));
    const accepted: PendingFile[] = [];
    for (const file of raw) {
      if (!file.name.toLowerCase().endsWith('.txt')) {
        toast(format(t.filesNonTxt, { name: file.name }), 'error');
        continue;
      }
      const content = (await file.text()).replace(/\r\n/g, '\n');
      const key = `${file.name}|${content.length}`;
      if (existingKeys.has(key)) {
        toast(format(t.filesDuplicate, { name: file.name }), 'info');
        continue;
      }
      existingKeys.add(key);
      accepted.push({ id: makeFileId(), name: file.name, content });
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list && list.length > 0) void addFiles(Array.from(list));
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const list = e.dataTransfer.files;
    if (list && list.length > 0) void addFiles(Array.from(list));
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleAiAnnotate = async () => {
    if (aiBusy) return;
    const typedText = text.trim();
    if (!typedText && files.length === 0) {
      toast(t.filesEmptyError, 'error');
      return;
    }

    const oversize = files.filter((f) => f.content.length > AI_MAX_CHARS);
    if (oversize.length > 0) {
      for (const file of oversize) {
        const { parts } = splitOversizeTxt(file.content);
        await downloadSplits(file.name, parts);
      }
      if (oversize.length === 1) {
        const one = oversize[0];
        const { parts } = splitOversizeTxt(one.content);
        toast(
          format(t.filesOversizeSingle, { name: one.name, cap: AI_MAX_CHARS, n: parts.length }),
          'info',
        );
      } else {
        toast(
          format(t.filesOversizeMulti, { count: oversize.length, cap: AI_MAX_CHARS }),
          'info',
        );
      }
      setFiles([]);
      return;
    }

    inflightRef.current?.abort();
    audioRef.current?.pause();

    type Job = { label: string; text: string; isTextJob: boolean };
    const jobs: Job[] = [];
    if (typedText) jobs.push({ label: '', text: typedText, isTextJob: true });
    for (const file of files) jobs.push({ label: file.name, text: file.content, isTextJob: false });

    setFiles([]);

    const effectiveSettings = nMode
      ? { ...settings, ...N_MODE_CONFIG }
      : settings;

    let isFirst = useAppStore.getState().entries.length === 0;
    for (const job of jobs) {
      void runAiAnnotate({
        text: job.text,
        settings: effectiveSettings,
        mode: isFirst ? 'replace' : 'append',
        toast,
      });
      isFirst = false;
    }

    if (jobs.length === 1) {
      const [only] = jobs;
      toast(only.isTextJob ? t.filesQueuedText : format(t.filesQueuedFile, { name: only.label }), 'info');
    } else {
      toast(format(t.filesQueuedBatch, { n: jobs.length }), 'info');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSynth();
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-left transition-colors duration-150 hover:border-slate-600 hover:bg-slate-800/70"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          <Volume2 size={14} className="text-blue-400" />
          {t.title}
        </span>
        <ChevronDown
          size={16}
          className={['text-slate-400 transition-transform duration-200', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4">
          <p className="mb-3 text-xs leading-6 text-slate-500">{t.description}</p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={4}
            className="w-full resize-y rounded-xl border border-slate-700/60 bg-slate-900/70 px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-blue-400/60"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-600">
            <span>{t.shortcut}</span>
            <span>{text.length} / {MAX_CHARS}</span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={[
              'mt-3 rounded-2xl border-2 border-dashed p-3 transition-colors',
              isDragging
                ? 'border-amber-400/60 bg-amber-500/10'
                : 'border-slate-700/50 bg-slate-950/40',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t.filesTitle}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">{t.filesHint}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <input
                  ref={filePickerRef}
                  type="file"
                  accept=".txt,text/plain"
                  multiple
                  className="sr-only"
                  onChange={handleFilePick}
                />
                <button
                  type="button"
                  onClick={() => filePickerRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-200 transition-colors hover:border-amber-300/70 hover:bg-amber-500/20"
                >
                  <Upload size={12} />
                  {t.filesPick}
                </button>
                {files.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-[11px] text-slate-500 hover:text-slate-300"
                  >
                    {t.filesClear}
                  </button>
                ) : null}
              </div>
            </div>
            {files.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1">
                {files.map((f) => {
                  const oversize = f.content.length > AI_MAX_CHARS;
                  return (
                    <li
                      key={f.id}
                      className={[
                        'flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5',
                        oversize ? 'bg-red-500/10 ring-1 ring-red-500/30' : 'bg-slate-900/60',
                      ].join(' ')}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText size={12} className={['shrink-0', oversize ? 'text-red-400' : 'text-slate-500'].join(' ')} />
                        <span className="truncate text-[11px] text-slate-200">{f.name}</span>
                        <span className="shrink-0 font-mono text-[10px] text-slate-500">
                          {format(t.filesSizeLabel, { kb: (f.content.length / 1024).toFixed(1) })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
                        aria-label={t.filesRemove}
                        title={t.filesRemove}
                      >
                        <X size={11} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-[10px] text-slate-600">{t.filesDrop}</p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">{t.langLabel}</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LangKey)}
                className="rounded-lg border border-slate-700/60 bg-slate-900/70 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60"
              >
                <option value="auto">{t.langAuto}</option>
                <option value="ja">{t.langJa}</option>
                <option value="zh">{t.langZh}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">{t.voiceLabel}</span>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="rounded-lg border border-slate-700/60 bg-slate-900/70 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60"
              >
                {voiceOptions.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500">
              <span>{t.rateLabel}</span>
              <span className="font-mono normal-case tracking-normal text-slate-400">{rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="mt-1.5 w-full accent-blue-500"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {RATE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRate(preset)}
                  className={[
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                    Math.abs(rate - preset) < 0.001
                      ? 'border-blue-400/60 bg-blue-500/15 text-blue-200'
                      : 'border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200',
                  ].join(' ')}
                >
                  {preset.toFixed(1)}x
                </button>
              ))}
            </div>
          </div>

          <label className="mt-3 flex cursor-pointer select-none items-center justify-between gap-3 rounded-2xl border border-slate-700/50 bg-slate-950/40 px-3 py-2.5">
            <span className="flex min-w-0 flex-col">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                <Sparkles size={12} className={nMode ? 'text-fuchsia-300' : 'text-slate-500'} />
                {t.nModeLabel}
              </span>
              <span className="mt-0.5 truncate text-[10px] text-slate-500">
                {nMode ? t.nModeOnHint : t.nModeOffHint}
              </span>
            </span>
            <span className="relative shrink-0">
              <input
                type="checkbox"
                checked={nMode}
                onChange={(e) => setNMode(e.target.checked)}
                className="peer sr-only"
                aria-label={t.nModeLabel}
              />
              <span className="flex h-6 w-11 items-center rounded-full bg-slate-700 transition-colors peer-checked:bg-fuchsia-500 peer-focus-visible:ring-2 peer-focus-visible:ring-fuchsia-300" />
              <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-slate-100 shadow-sm transition-transform peer-checked:translate-x-5" />
            </span>
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={busy ? handleStop : handleSynth}
              disabled={(!busy && text.trim().length === 0) || aiBusy}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-150 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {busy ? t.stop : t.play}
            </button>
            <button
              type="button"
              onClick={handleAiAnnotate}
              disabled={aiBusy || busy || (text.trim().length === 0 && files.length === 0)}
              title={t.aiAnnotateTooltip}
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-100 transition-all duration-150 hover:border-amber-300/70 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {aiBusy ? t.aiAnnotateBusy : t.aiAnnotateLabel}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!audioUrl}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/40 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-700/60 disabled:hover:text-slate-300"
            >
              <Download size={14} />
              {t.download}
            </button>
            <span className="ml-auto truncate text-[11px] text-slate-500">{status}</span>
          </div>

          <audio
            ref={audioRef}
            controls
            preload="auto"
            className="mt-3 w-full"
          />
        </div>
      )}
    </div>
  );
}
