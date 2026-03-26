import { useState } from 'react';
import { LocateFixed, Search, Settings2, SlidersHorizontal, Target, Wand2, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { LanguageSwitcher } from './LanguageSwitcher';

type TabId = 'quick' | 'audio' | 'display' | 'advanced';

function RateControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span className="font-mono text-xs text-blue-400">{value.toFixed(1)}x</span>
      </div>
      <input
        type="range"
        min="0.5"
        max="2.0"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
      />
    </label>
  );
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const {
    entries,
    currentIndex,
    autoNext,
    setAutoNext,
    setCurrentIndex,
    triggerLocate,
    settings,
    updateSettings,
    clearCache,
  } = useAppStore();
  const { text } = useUiText();
  const [tab, setTab] = useState<TabId>('quick');
  const [search, setSearch] = useState('');
  const [jumpPercent, setJumpPercent] = useState(0);

  const tabs: Array<{ id: TabId; label: string; icon: typeof Settings2 }> = [
    { id: 'quick', label: text.settings.tabQuick, icon: Settings2 },
    { id: 'audio', label: text.settings.tabAudio, icon: Wand2 },
    { id: 'display', label: text.settings.tabDisplay, icon: SlidersHorizontal },
    { id: 'advanced', label: text.settings.tabAdvanced, icon: Settings2 },
  ];

  const displayOptions = [
    { id: 'showJP', label: text.settings.showJapanese },
    { id: 'showZH', label: text.settings.showChinese },
    { id: 'showWords', label: text.settings.showWords },
    { id: 'showFurigana', label: text.settings.showFurigana },
  ] as const;

  const sequenceOptions = [
    { id: 'jp', label: text.settings.sequenceJp },
    { id: 'ch', label: text.settings.sequenceCh },
    { id: 'word_jp', label: text.settings.sequenceWordJp },
    { id: 'word_ch', label: text.settings.sequenceWordCh },
    { id: 'word_pair', label: text.settings.sequenceWordPair },
  ] as const;

  const sequencePresets = [
    { label: text.settings.sequencePresetJpCh, sequence: ['jp', 'ch'] },
    { label: text.settings.sequencePresetChJp, sequence: ['ch', 'jp'] },
    { label: text.settings.sequencePresetJpOnly, sequence: ['jp'] },
    { label: text.settings.sequencePresetListening, sequence: ['jp', 'ch', 'word_pair'] },
  ];

  const pausePresets = [
    { label: text.settings.pausePresetZero, values: { pauseSegmentMs: 0, pauseWordItemMs: 0, pauseBetweenWordsMs: 0, pauseBetweenEntriesMs: 0 } },
    { label: text.settings.pausePresetTight, values: { pauseSegmentMs: 100, pauseWordItemMs: 100, pauseBetweenWordsMs: 100, pauseBetweenEntriesMs: 150 } },
    { label: text.settings.pausePresetDefault, values: { pauseSegmentMs: 200, pauseWordItemMs: 200, pauseBetweenWordsMs: 200, pauseBetweenEntriesMs: 350 } },
  ];

  const canNavigate = entries.length > 0;

  const handleSearch = () => {
    if (!search) return;
    const idx = entries.findIndex(
      (entry) =>
        entry.jp.includes(search) ||
        entry.ch.includes(search) ||
        entry.words.some((word) => word[0].includes(search) || word[1].includes(search)),
    );
    if (idx !== -1) {
      setCurrentIndex(idx);
      onClose();
    }
  };

  const handleJump = () => {
    if (!entries.length) return;
    const idx = Math.floor((jumpPercent / 100) * (entries.length - 1));
    setCurrentIndex(Math.max(0, Math.min(idx, entries.length - 1)));
    onClose();
  };

  const updateAndRecache = (next: Record<string, unknown>) => {
    updateSettings(next as never);
    clearCache();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/82 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{text.settings.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{text.settings.quickSection}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="border-b border-slate-800 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={[
                    'inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors',
                    active ? 'bg-orange-400 text-stone-950' : 'border border-slate-700 bg-slate-950/70 text-slate-200 hover:border-slate-500',
                  ].join(' ')}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'quick' && (
            <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
              <section className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">{text.settings.quickSearchTitle}</h3>
                  <label className="group flex items-center gap-3 rounded-full border border-slate-800/60 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} className="peer sr-only" />
                      <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
                    </div>
                    <span>{text.controls.autoNext}</span>
                  </label>
                </div>
                <p className="mt-2 text-sm text-slate-400">{entries.length ? `${currentIndex + 1} / ${entries.length}` : '0 / 0'}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <div className="flex flex-1 items-center rounded-2xl border border-slate-800/60 bg-slate-900/70 p-1.5">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder={text.controls.searchPlaceholder}
                      className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
                    />
                    <button type="button" onClick={handleSearch} disabled={!canNavigate} className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-40">
                      <Search size={16} />
                    </button>
                  </div>
                  <div className="flex items-center rounded-2xl border border-slate-800/60 bg-slate-900/70 p-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={jumpPercent}
                      onChange={(e) => setJumpPercent(Number(e.target.value))}
                      className="w-16 bg-transparent px-2 py-2 text-center text-sm text-slate-200 focus:outline-none"
                    />
                    <span className="text-sm text-slate-500">%</span>
                    <button type="button" onClick={handleJump} disabled={!canNavigate} className="ml-1 rounded-xl p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-40">
                      <Target size={16} />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerLocate();
                    onClose();
                  }}
                  disabled={!canNavigate}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 hover:border-slate-500 disabled:opacity-40"
                >
                  <LocateFixed size={14} />
                  {text.settings.locateCurrentLine}
                </button>
              </section>

              <section className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">{text.common.language}</h3>
                <div className="mt-4">
                  <LanguageSwitcher />
                </div>
                <div className="mt-5 rounded-2xl border border-orange-300/15 bg-orange-500/10 p-4 text-sm text-orange-100/90">
                  {text.settings.volumeGuide}
                </div>
              </section>
            </div>
          )}

          {tab === 'audio' && (
            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">{text.settings.sequencePresetsTitle}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sequencePresets.map((preset) => (
                    <button key={preset.label} type="button" onClick={() => updateAndRecache({ sequence: preset.sequence })} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 hover:border-slate-500">
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sequenceOptions.map((option) => (
                    <label key={option.id} className="group flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 hover:border-slate-500">
                      <input
                        type="checkbox"
                        checked={settings.sequence.includes(option.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...settings.sequence, option.id].filter((item, index, list) => list.indexOf(item) === index)
                            : settings.sequence.filter((item) => item !== option.id);
                          updateAndRecache({ sequence: next });
                        }}
                        className="sr-only"
                      />
                      <span className="text-sm text-slate-300">{option.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-400">
                  <span className="text-slate-500">{text.settings.sequenceCurrent}:</span> <span className="font-mono text-blue-400">{settings.sequence.join(' -> ') || '-'}</span>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">{text.settings.pausePresetsTitle}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pausePresets.map((preset) => (
                    <button key={preset.label} type="button" onClick={() => updateAndRecache(preset.values)} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 hover:border-slate-500">
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-300"><span>{text.settings.pauseSegment}</span><input type="number" value={settings.pauseSegmentMs} onChange={(e) => updateAndRecache({ pauseSegmentMs: Number.parseInt(e.target.value, 10) || 0 })} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200" /></label>
                  <label className="space-y-2 text-sm text-slate-300"><span>{text.settings.pauseWordItem}</span><input type="number" value={settings.pauseWordItemMs} onChange={(e) => updateAndRecache({ pauseWordItemMs: Number.parseInt(e.target.value, 10) || 0 })} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200" /></label>
                  <label className="space-y-2 text-sm text-slate-300"><span>{text.settings.pauseBetweenWords}</span><input type="number" value={settings.pauseBetweenWordsMs} onChange={(e) => updateAndRecache({ pauseBetweenWordsMs: Number.parseInt(e.target.value, 10) || 0 })} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200" /></label>
                  <label className="space-y-2 text-sm text-slate-300"><span>{text.settings.pauseBetweenEntries}</span><input type="number" value={settings.pauseBetweenEntriesMs} onChange={(e) => updateAndRecache({ pauseBetweenEntriesMs: Number.parseInt(e.target.value, 10) || 0 })} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200" /></label>
                </div>
              </section>

              <section className="grid gap-5 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">{text.settings.japaneseVoice}</span>
                    <select value={settings.jpVoice} onChange={(e) => updateAndRecache({ jpVoice: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200">
                      <option value="ja-JP-NanamiNeural">{text.settings.voiceNanami}</option>
                      <option value="ja-JP-KeitaNeural">{text.settings.voiceKeita}</option>
                      <option value="ja-JP-AoiNeural">{text.settings.voiceAoi}</option>
                    </select>
                  </label>
                  <div className="mt-4"><RateControl label={text.settings.japaneseRate} value={settings.jpRate} onChange={(value) => updateAndRecache({ jpRate: value })} /></div>
                </div>
                <div className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">{text.settings.chineseVoice}</span>
                    <select value={settings.chVoice} onChange={(e) => updateAndRecache({ chVoice: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200">
                      <option value="zh-CN-XiaoxiaoNeural">{text.settings.voiceXiaoxiao}</option>
                      <option value="zh-CN-YunxiNeural">{text.settings.voiceYunxi}</option>
                      <option value="zh-CN-YunjianNeural">{text.settings.voiceYunjian}</option>
                    </select>
                  </label>
                  <div className="mt-4"><RateControl label={text.settings.chineseRate} value={settings.chRate} onChange={(value) => updateAndRecache({ chRate: value })} /></div>
                </div>
              </section>
            </div>
          )}

          {tab === 'display' && (
            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">{text.settings.displaySection}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {displayOptions.map((option) => (
                    <label key={option.id} className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800/50 bg-slate-900/50 p-4 hover:border-slate-700">
                      <input type="checkbox" checked={settings[option.id]} onChange={(e) => updateSettings({ [option.id]: e.target.checked })} className="h-4 w-4 accent-blue-500" />
                      <span className="text-slate-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">{text.settings.readerDensitySection}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { id: 'compact', label: text.settings.readerDensityCompact },
                    { id: 'comfortable', label: text.settings.readerDensityComfortable },
                  ].map((option) => (
                    <button key={option.id} type="button" onClick={() => updateSettings({ readerDensity: option.id as 'compact' | 'comfortable' })} className={[ 'rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]', settings.readerDensity === option.id ? 'bg-orange-400 text-stone-950' : 'border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500', ].join(' ')}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === 'advanced' && (
            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">{text.settings.aiSection}</h3>
                <div className="mt-4 space-y-3">
                  <input type="text" value={settings.aiApiBase || ''} onChange={(e) => updateSettings({ aiApiBase: e.target.value })} placeholder={text.settings.apiBaseUrl} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200" />
                  <input type="password" value={settings.aiApiKey || ''} onChange={(e) => updateSettings({ aiApiKey: e.target.value })} placeholder={text.settings.apiKey} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200" />
                  <input type="text" value={settings.aiModel || ''} onChange={(e) => updateSettings({ aiModel: e.target.value })} placeholder={text.settings.model} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200" />
                </div>
                <p className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100/90">
                  {text.settings.aiExplainHint}
                </p>
              </section>
              <section className="rounded-3xl border border-slate-800/60 bg-slate-950/50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">{text.settings.performanceSection}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <input type="number" value={settings.cacheAheadEntries} onChange={(e) => updateSettings({ cacheAheadEntries: Number.parseInt(e.target.value, 10) || 0 })} placeholder={text.settings.cacheAheadEntries} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200" />
                  <input type="number" value={settings.entryConcurrency} onChange={(e) => updateSettings({ entryConcurrency: Number.parseInt(e.target.value, 10) || 1 })} placeholder={text.settings.entryConcurrency} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200" />
                </div>
                <button onClick={clearCache} className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 font-medium text-red-400 hover:bg-red-500/20">
                  {text.settings.clearCacheButton}
                </button>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
