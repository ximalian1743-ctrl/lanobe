import React, { useState } from 'react';
import { Settings, Upload, PlayCircle, Trash2, FileText, List } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useLoadContent } from '../hooks/useLoadContent';

export function Header({ onOpenSettings, onOpenChapters }: { onOpenSettings: () => void, onOpenChapters: () => void }) {
  const { entries, setEntries, settings, updateSettings, clearCache } = useAppStore();
  const [fileName, setFileName] = useState('未选择文件');
  const [backendStatus, setBackendStatus] = useState<'idle' | 'testing' | 'ok' | 'err'>('idle');
  const { loadContent } = useLoadContent();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      loadContent(text);
    };
    reader.readAsText(file);
  };

  const loadDemo = () => {
    const demoText = `jp:今日はいい天気ですね。
今天天气真好。
天気(てんき):天气, いい:好

jp:明日も頑張りましょう。
明天也加油吧。
頑張る(がんばる):努力, 明日(あした):明天

jp:「ストーカーでも、妹[いもうと]は健全[けんぜん]な方[ほう]のストーカーだから大丈夫[だいじょうぶ]だって」 “就算是跟踪狂，妹妹也是健全的那类跟踪狂所以没关系” ストーカー: 跟踪狂, 妹 (いもうと): 妹妹, 健全 (けんぜん): 健全, 大丈夫 (だいじょうぶ): 没关系`;
    setFileName('demo.txt');
    loadContent(demoText);
  };

  const clearData = () => {
    if (window.confirm('确定要清空当前所有数据吗？')) {
      setEntries([]);
      setFileName('未选择文件');
      clearCache();
    }
  };

  const testBackend = async () => {
    setBackendStatus('testing');
    try {
      const apiBase = settings.apiBase === 'https://api.ximalian.cc.cd' ? '' : settings.apiBase;
      const res = await fetch(`${apiBase}/health`);
      if (res.ok) setBackendStatus('ok');
      else setBackendStatus('err');
    } catch {
      setBackendStatus('err');
    }
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 mb-6 shadow-xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-3">
            <PlayCircle className="text-blue-500" size={32} />
            ラノベ 在线朗读
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">上传 TXT → 全文连续阅读 → 自定义播放序列 → 低延迟预缓存无缝播放</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Upload size={18} />
            上传 TXT
            <input type="file" accept=".txt,text/plain" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={loadDemo} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl font-medium transition-colors border border-slate-700">
            加载示例
          </button>
          {entries.length > 0 && (
            <button onClick={onOpenChapters} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl font-medium transition-colors border border-slate-700 flex items-center gap-2">
              <List size={18} />
              目录
            </button>
          )}
          {entries.length > 0 && (
            <button onClick={clearData} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl font-medium transition-colors border border-red-500/20 flex items-center gap-2" title="清空数据">
              <Trash2 size={18} />
            </button>
          )}
          <button onClick={onOpenSettings} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl font-medium transition-colors border border-slate-700 flex items-center gap-2">
            <Settings size={18} />
            设置
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 text-sm bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
        <div className="flex items-center gap-2 text-slate-300 min-w-[200px]">
          <FileText size={16} className="text-slate-500" />
          <span className="text-slate-500">当前文件:</span>
          <span className="font-medium text-blue-400 truncate max-w-[150px] md:max-w-[200px]">{fileName}</span>
        </div>
        <div className="w-full md:w-px h-px md:h-6 bg-slate-800"></div>
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <span className="text-slate-500 whitespace-nowrap">后端 API:</span>
          <input 
            type="text" 
            value={settings.apiBase === 'https://api.ximalian.cc.cd' ? '' : settings.apiBase}
            onChange={(e) => updateSettings({ apiBase: e.target.value })}
            placeholder="留空使用内置后端"
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 flex-1 min-w-[200px] focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button onClick={testBackend} className="bg-slate-800 hover:bg-slate-700 px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap border border-slate-700">
            测试
          </button>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide ${
            backendStatus === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
            backendStatus === 'err' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
            backendStatus === 'testing' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
            'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {backendStatus === 'ok' ? '正常' : backendStatus === 'err' ? '失败' : backendStatus === 'testing' ? '检测中' : '未检测'}
          </span>
        </div>
      </div>
    </header>
  );
}
