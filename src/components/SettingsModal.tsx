import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';

function RateSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-xs text-blue-400">
          {localValue.toFixed(1)}x
        </span>
      </div>
      <input
        type="range"
        min="0.5"
        max="2.0"
        step="0.1"
        value={localValue}
        onChange={(e) => setLocalValue(Number.parseFloat(e.target.value))}
        onMouseUp={() => onChange(localValue)}
        onTouchEnd={() => onChange(localValue)}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500 transition-all hover:accent-blue-400"
      />
      <div className="flex justify-between font-mono text-xs text-slate-500">
        <span>0.5x</span>
        <span>1.0x</span>
        <span>2.0x</span>
      </div>
    </div>
  );
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, clearCache } = useAppStore();
  const { text } = useUiText();

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

  const pauseOptions = [
    { id: 'pauseSegmentMs', label: text.settings.pauseSegment },
    { id: 'pauseWordItemMs', label: text.settings.pauseWordItem },
    { id: 'pauseBetweenWordsMs', label: text.settings.pauseBetweenWords },
    { id: 'pauseBetweenEntriesMs', label: text.settings.pauseBetweenEntries },
  ] as const;

  const handleSequenceChange = (checked: boolean, token: string) => {
    let nextSequence = [...settings.sequence];
    if (checked && !nextSequence.includes(token)) {
      nextSequence.push(token);
    } else if (!checked) {
      nextSequence = nextSequence.filter((item) => item !== token);
    }
    updateSettings({ sequence: nextSequence });
    clearCache();
  };

  const handleRateChange = (key: 'jpRate' | 'chRate', value: number) => {
    updateSettings({ [key]: value });
    clearCache();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 p-6 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-slate-100">{text.settings.title}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 space-y-10 overflow-y-auto p-6">
          <section>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-blue-400">{text.settings.displaySection}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {displayOptions.map((option) => (
                <label key={option.id} className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800/50 bg-slate-950/50 p-4 transition-colors hover:border-slate-700">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={settings[option.id]}
                      onChange={(e) => updateSettings({ [option.id]: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-800 peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
                  </div>
                  <span className="font-medium text-slate-300 transition-colors group-hover:text-white">{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="h-px bg-slate-800/50"></div>

          <section>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-blue-400">
              {text.settings.voiceSection}
              <span className="ml-2 text-xs font-normal normal-case text-slate-500">({text.settings.recacheHint})</span>
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-6 rounded-3xl border border-slate-800/50 bg-slate-950/50 p-5">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">{text.settings.japaneseVoice}</label>
                  <select
                    value={settings.jpVoice}
                    onChange={(e) => {
                      updateSettings({ jpVoice: e.target.value });
                      clearCache();
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ja-JP-NanamiNeural">{text.settings.voiceNanami}</option>
                    <option value="ja-JP-KeitaNeural">{text.settings.voiceKeita}</option>
                    <option value="ja-JP-AoiNeural">{text.settings.voiceAoi}</option>
                  </select>
                </div>
                <RateSlider label={text.settings.japaneseRate} value={settings.jpRate} onChange={(value) => handleRateChange('jpRate', value)} />
              </div>

              <div className="space-y-6 rounded-3xl border border-slate-800/50 bg-slate-950/50 p-5">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">{text.settings.chineseVoice}</label>
                  <select
                    value={settings.chVoice}
                    onChange={(e) => {
                      updateSettings({ chVoice: e.target.value });
                      clearCache();
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="zh-CN-XiaoxiaoNeural">{text.settings.voiceXiaoxiao}</option>
                    <option value="zh-CN-YunxiNeural">{text.settings.voiceYunxi}</option>
                    <option value="zh-CN-YunjianNeural">{text.settings.voiceYunjian}</option>
                  </select>
                </div>
                <RateSlider label={text.settings.chineseRate} value={settings.chRate} onChange={(value) => handleRateChange('chRate', value)} />
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-800/50"></div>

          <section>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-blue-400">
              {text.settings.sequenceSection}
              <span className="ml-2 text-xs font-normal normal-case text-slate-500">({text.settings.recacheHint})</span>
            </h3>
            <div className="space-y-8 rounded-3xl border border-slate-800/50 bg-slate-950/50 p-6">
              <div>
                <label className="mb-4 block text-sm font-medium text-slate-300">{text.settings.sequenceTitle}</label>
                <div className="flex flex-wrap gap-3">
                  {sequenceOptions.map((option) => (
                    <label key={option.id} className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 transition-colors hover:border-slate-600">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={settings.sequence.includes(option.id)}
                          onChange={(e) => handleSequenceChange(e.target.checked, option.id)}
                          className="peer sr-only"
                        />
                        <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-slate-600 transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-500">
                          <svg className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                      <span className="text-sm text-slate-300 transition-colors group-hover:text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3 text-sm text-slate-400">
                  <span className="font-medium text-slate-500">{text.settings.sequenceCurrent}:</span>
                  <span className="font-mono tracking-wide text-blue-400">{settings.sequence.join(' -> ') || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <span className="text-sm font-medium text-slate-300">{text.settings.repeatCount}</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.entryRepeat}
                    onChange={(e) => {
                      updateSettings({ entryRepeat: Number.parseInt(e.target.value, 10) || 1 });
                      clearCache();
                    }}
                    className="w-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-center text-slate-200 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <span className="text-sm font-medium text-slate-300 transition-colors group-hover:text-white">{text.settings.replayJapanese}</span>
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={settings.finalReplayJp}
                      onChange={(e) => {
                        updateSettings({ finalReplayJp: e.target.checked });
                        clearCache();
                      }}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-800 peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {pauseOptions.map((option) => (
                  <label key={option.id} className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-slate-400">{option.label}</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={settings[option.id]}
                      onChange={(e) => {
                        updateSettings({ [option.id]: Number.parseInt(e.target.value, 10) || 0 });
                        clearCache();
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-800/50"></div>

          <section>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-blue-400">{text.settings.aiSection}</h3>
            <div className="space-y-4 rounded-3xl border border-slate-800/50 bg-slate-950/50 p-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">{text.settings.apiBaseUrl}</label>
                <input
                  type="text"
                  value={settings.aiApiBase || ''}
                  onChange={(e) => updateSettings({ aiApiBase: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm text-slate-200 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">{text.settings.apiKey}</label>
                <input
                  type="password"
                  value={settings.aiApiKey || ''}
                  onChange={(e) => updateSettings({ aiApiKey: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm text-slate-200 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="sk-..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">{text.settings.model}</label>
                <input
                  type="text"
                  value={settings.aiModel || ''}
                  onChange={(e) => updateSettings({ aiModel: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm text-slate-200 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="gpt-5.4"
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-800/50"></div>

          <section>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-blue-400">{text.settings.performanceSection}</h3>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-950/50 p-4">
                <span className="text-sm font-medium text-slate-300">{text.settings.cacheAheadEntries}</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={settings.cacheAheadEntries}
                  onChange={(e) => updateSettings({ cacheAheadEntries: Number.parseInt(e.target.value, 10) || 0 })}
                  className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-center text-slate-200 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-950/50 p-4">
                <span className="text-sm font-medium text-slate-300">{text.settings.entryConcurrency}</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.entryConcurrency}
                  onChange={(e) => updateSettings({ entryConcurrency: Number.parseInt(e.target.value, 10) || 1 })}
                  className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-center text-slate-200 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="mb-1 font-medium text-slate-200">{text.settings.clearCacheTitle}</p>
                <p className="text-sm text-slate-500">{text.settings.clearCacheDescription}</p>
              </div>
              <button
                onClick={clearCache}
                className="whitespace-nowrap rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
              >
                {text.settings.clearCacheButton}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

