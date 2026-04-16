import React, { useRef, useState } from 'react';
import { Check, Copy, FileText, Upload } from 'lucide-react';
import { useLoadContent } from '../hooks/useLoadContent';
import { useUiText } from '../hooks/useUiText';
import { QuickTtsPanel } from './QuickTtsPanel';

const FORMAT_TEMPLATE = `jp: 日本語テキスト（必须 / Required）
zh: 中文翻译（可选 / Optional）
word: 単語|たんご|词义 / meaning

jp: 第二段落 / Second entry
zh: 翻译二 / Translation two

jp: 只有日文也可以 / Japanese-only is fine`;

export function TxtUploadPanel() {
  const { loadContent } = useLoadContent();
  const { text } = useUiText();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const readFile = (file: File) => {
    if (!file.name.endsWith('.txt')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) loadContent(content);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FORMAT_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available; silently ignore
    }
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
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 py-12">
      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/10 shadow-[0_0_32px_rgba(59,130,246,0.12)]">
        <FileText size={36} className="text-blue-400" />
      </div>

      {/* Title + description */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">{text.txtUpload.panelTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{text.txtUpload.panelDescription}</p>
      </div>

      {/* Drop zone + upload button */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'flex w-full flex-col items-center gap-4 rounded-3xl border-2 border-dashed px-8 py-10 transition-all duration-200',
          isDragging
            ? 'border-blue-400/60 bg-blue-500/10'
            : 'border-slate-700/60 bg-slate-900/30 hover:border-slate-600/60 hover:bg-slate-900/50',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          className="sr-only"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-3 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
        >
          <Upload size={18} />
          {text.txtUpload.uploadButton}
        </button>
        <p className="text-xs text-slate-500">{text.txtUpload.dragHint}</p>
      </div>

      {/* Format requirements */}
      <div className="w-full">
        <button
          type="button"
          onClick={handleCopy}
          className="group mb-2 flex w-full items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-left transition-colors duration-150 hover:border-slate-600 hover:bg-slate-800/70"
          title={text.txtUpload.copyButton}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {text.txtUpload.formatTitle}
          </span>
          <span
            className={[
              'flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200',
              copied ? 'text-emerald-400' : 'text-blue-400 group-hover:text-blue-300',
            ].join(' ')}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? text.txtUpload.copied : text.txtUpload.copyButton}
          </span>
        </button>
        <pre className="overflow-x-auto rounded-2xl border border-slate-800/50 bg-slate-950/60 p-5 text-xs leading-7 text-slate-400">
          {FORMAT_TEMPLATE}
        </pre>
      </div>

      {/* Quick TTS — speak any pasted JP/ZH text without uploading a file */}
      <QuickTtsPanel />
    </div>
  );
}
