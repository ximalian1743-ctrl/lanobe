import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function RateSlider({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
  const [localVal, setLocalVal] = useState(value);
  
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded-md text-blue-400 border border-slate-800">
          {localVal.toFixed(1)}x
        </span>
      </div>
      <input 
        type="range" min="0.5" max="2.0" step="0.1" 
        value={localVal}
        onChange={(e) => setLocalVal(parseFloat(e.target.value))}
        onMouseUp={() => onChange(localVal)}
        onTouchEnd={() => onChange(localVal)}
        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
      />
      <div className="flex justify-between text-xs text-slate-500 font-mono">
        <span>0.5x</span>
        <span>1.0x</span>
        <span>2.0x</span>
      </div>
    </div>
  );
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, clearCache } = useAppStore();

  const handleSequenceChange = (e: React.ChangeEvent<HTMLInputElement>, token: string) => {
    const checked = e.target.checked;
    let newSeq = [...settings.sequence];
    if (checked && !newSeq.includes(token)) {
      newSeq.push(token);
    } else if (!checked) {
      newSeq = newSeq.filter(t => t !== token);
    }
    updateSettings({ sequence: newSeq });
    clearCache(); // Sequence change invalidates cache
  };

  const handleRateChange = (key: 'jpRate' | 'chRate', val: number) => {
    updateSettings({ [key]: val });
    clearCache();
  };

  const handleClearCache = () => {
    clearCache();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md z-10">
          <h2 className="text-2xl font-bold text-slate-100">播放与显示设置</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          
          <section>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-5">显示选项</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'showJP', label: '显示日文' },
                { id: 'showZH', label: '显示中文' },
                { id: 'showWords', label: '显示词汇' },
                { id: 'showFurigana', label: '显示注音 [ ]' },
              ].map(opt => (
                <label key={opt.id} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 cursor-pointer hover:border-slate-700 transition-colors group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={settings[opt.id as keyof typeof settings] as boolean}
                      onChange={(e) => updateSettings({ [opt.id]: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </div>
                  <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="h-px bg-slate-800/50"></div>

          <section>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-5">语音与语速 <span className="text-xs text-slate-500 font-normal normal-case ml-2">(更改后需重新缓存)</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6 p-5 rounded-3xl bg-slate-950/50 border border-slate-800/50">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">日文语音</label>
                  <select 
                    value={settings.jpVoice}
                    onChange={(e) => { updateSettings({ jpVoice: e.target.value }); clearCache(); }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                  >
                    <option value="ja-JP-NanamiNeural">Nanami (女)</option>
                    <option value="ja-JP-KeitaNeural">Keita (男)</option>
                    <option value="ja-JP-AoiNeural">Aoi (女)</option>
                  </select>
                </div>
                <RateSlider 
                  label="日文语速" 
                  value={settings.jpRate} 
                  onChange={(val) => handleRateChange('jpRate', val)} 
                />
              </div>
              <div className="space-y-6 p-5 rounded-3xl bg-slate-950/50 border border-slate-800/50">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">中文语音</label>
                  <select 
                    value={settings.chVoice}
                    onChange={(e) => { updateSettings({ chVoice: e.target.value }); clearCache(); }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                  >
                    <option value="zh-CN-XiaoxiaoNeural">Xiaoxiao (女)</option>
                    <option value="zh-CN-YunxiNeural">Yunxi (男)</option>
                    <option value="zh-CN-YunjianNeural">Yunjian (男)</option>
                  </select>
                </div>
                <RateSlider 
                  label="中文语速" 
                  value={settings.chRate} 
                  onChange={(val) => handleRateChange('chRate', val)} 
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-800/50"></div>

          <section>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-5">播放序列与停顿 <span className="text-xs text-slate-500 font-normal normal-case ml-2">(更改后需重新缓存)</span></h3>
            <div className="p-6 rounded-3xl bg-slate-950/50 border border-slate-800/50 space-y-8">
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-4">朗读序列 (勾选包含的项)</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'jp', label: '日文整段' },
                    { id: 'ch', label: '中文整段' },
                    { id: 'word_jp', label: '词汇(仅日)' },
                    { id: 'word_ch', label: '词汇(仅中)' },
                    { id: 'word_pair', label: '词汇(中日对)' },
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl cursor-pointer hover:border-slate-600 transition-colors group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={settings.sequence.includes(opt.id)}
                          onChange={(e) => handleSequenceChange(e, opt.id)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 border-2 border-slate-600 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-colors">
                          <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 text-sm text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 flex items-center gap-2">
                  <span className="font-medium text-slate-500">当前序列:</span> 
                  <span className="text-blue-400 font-mono tracking-wide">{settings.sequence.join(' → ') || '无'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-sm font-medium text-slate-300">每段重复次数</span>
                  <input 
                    type="number" min="1" max="10"
                    value={settings.entryRepeat}
                    onChange={(e) => { updateSettings({ entryRepeat: parseInt(e.target.value) }); clearCache(); }}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </label>
                <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer group">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">段尾补播日文</span>
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox"
                      checked={settings.finalReplayJp}
                      onChange={(e) => { updateSettings({ finalReplayJp: e.target.checked }); clearCache(); }}
                      className="peer sr-only"
                    />
                    <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { id: 'pauseSegmentMs', label: '段落间停顿 (ms)' },
                  { id: 'pauseWordItemMs', label: '词汇内停顿 (ms)' },
                  { id: 'pauseBetweenWordsMs', label: '词汇间停顿 (ms)' },
                  { id: 'pauseBetweenEntriesMs', label: '条目间停顿 (ms)' },
                ].map(opt => (
                  <label key={opt.id} className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-slate-400">{opt.label}</span>
                    <input 
                      type="number" step="50" min="0"
                      value={settings[opt.id as keyof typeof settings] as number}
                      onChange={(e) => { updateSettings({ [opt.id]: parseInt(e.target.value) }); clearCache(); }}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </label>
                ))}
              </div>

            </div>
          </section>

          <div className="h-px bg-slate-800/50"></div>

          <section>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-5">AI 章节生成设置</h3>
            <div className="space-y-4 p-5 rounded-3xl bg-slate-950/50 border border-slate-800/50">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">API Base URL</label>
                <input 
                  type="text"
                  value={settings.aiApiBase || ''}
                  onChange={(e) => updateSettings({ aiApiBase: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">API Key</label>
                <input 
                  type="password"
                  value={settings.aiApiKey || ''}
                  onChange={(e) => updateSettings({ aiApiKey: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                  placeholder="sk-..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">模型</label>
                <input 
                  type="text"
                  value={settings.aiModel || ''}
                  onChange={(e) => updateSettings({ aiModel: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                  placeholder="gpt-3.5-turbo"
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-800/50"></div>

          <section>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-5">性能设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                <span className="text-sm font-medium text-slate-300">向后缓存段数</span>
                <input 
                  type="number" min="0" max="20"
                  value={settings.cacheAheadEntries}
                  onChange={(e) => updateSettings({ cacheAheadEntries: parseInt(e.target.value) })}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                <span className="text-sm font-medium text-slate-300">并发请求数</span>
                <input 
                  type="number" min="1" max="10"
                  value={settings.entryConcurrency}
                  onChange={(e) => updateSettings({ entryConcurrency: parseInt(e.target.value) })}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </label>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/50 border border-slate-800/50">
              <div>
                <p className="text-slate-200 font-medium mb-1">清空音频缓存</p>
                <p className="text-sm text-slate-500">释放浏览器内存，已缓存的音频将被删除</p>
              </div>
              <button 
                onClick={handleClearCache}
                className="px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl font-medium transition-colors border border-red-500/20 whitespace-nowrap"
              >
                清空缓存
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
