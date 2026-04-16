import type React from 'react';
import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { useAppStore, type PersistedAppState } from '../store/useAppStore';
import { useToast } from './Toast';

const panelClass =
  'rounded-[28px] border border-slate-800/70 bg-[linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,0.84))] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.18)]';

export function DataExportImportSection() {
  const state = useAppStore();
  const importPersistedState = useAppStore((s) => s.importPersistedState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  function handleExport() {
    const payload: PersistedAppState & { exportedAt: string; version: number } = {
      version: 1,
      exportedAt: new Date().toISOString(),
      uiLanguage: state.uiLanguage,
      settings: state.settings,
      autoNext: state.autoNext,
      builtInBookProgress: state.builtInBookProgress,
      lastOpenedVolumes: state.lastOpenedVolumes,
      lastOpenedBook: state.lastOpenedBook,
      bookmarks: state.bookmarks,
      notes: state.notes,
      readingTime: state.readingTime,
      aiExplanations: state.aiExplanations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    link.href = url;
    link.download = `lanobe-backup-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast('备份已下载', 'success');
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as PersistedAppState;
      importPersistedState(parsed);
      toast('数据已导入', 'success');
    } catch (err) {
      toast(err instanceof Error ? `导入失败：${err.message}` : '导入失败', 'error');
    }
  }

  return (
    <section className={panelClass}>
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">数据迁移</h3>
      <p className="mt-2 text-sm text-slate-400">
        导出包括：设置、阅读进度、书签、笔记、阅读时长、AI 讲解缓存。可用于换设备或浏览器。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/20"
        >
          <Download size={14} /> 导出全部数据
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500">
          <Upload size={14} /> 从 JSON 导入
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>
    </section>
  );
}
