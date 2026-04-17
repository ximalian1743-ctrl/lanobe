import { useState } from 'react';
import { ExternalLink, Info, KeyRound, Cookie, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getDefaultVoice } from '../lib/ttsVoices';
import type { TtsProvider } from '../types';

interface ProviderMeta {
  id: TtsProvider;
  label: string;
  tagline: string;
  icon: typeof Zap;
}

const PROVIDERS: ProviderMeta[] = [
  { id: 'edge',   label: 'Edge TTS',     tagline: '微软 · 免登录 · 多音色',  icon: Zap },
  { id: 'qwen3',  label: '千问 3 TTS',   tagline: '阿里云 · API Key · 多语种', icon: KeyRound },
  { id: 'doubao', label: '豆包 TTS',     tagline: 'ByteDance · Cookie · 自然',  icon: Cookie },
];

export function TtsProviderSection() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const clearCache = useAppStore((s) => s.clearCache);
  const [showCookieGuide, setShowCookieGuide] = useState(false);

  const setProvider = (next: TtsProvider) => {
    if (next === settings.ttsProvider) return;
    updateSettings({
      ttsProvider: next,
      jpVoice: getDefaultVoice(next, 'jp'),
      chVoice: getDefaultVoice(next, 'zh'),
    });
    clearCache();
  };

  return (
    <section className="rounded-[28px] border border-slate-800/70 bg-[linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,0.84))] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
          TTS 服务商
        </h3>
        <span className="text-[11px] text-slate-500">切换后会自动清缓存并重置音色</span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {PROVIDERS.map((p) => {
          const active = settings.ttsProvider === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={[
                'flex flex-col items-start gap-1 rounded-2xl border px-3.5 py-3 text-left transition-all',
                active
                  ? 'border-orange-400/70 bg-orange-500/15 shadow-lg shadow-orange-500/10'
                  : 'border-slate-700/60 bg-slate-900/50 hover:border-slate-500',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <Icon size={14} className={active ? 'text-orange-300' : 'text-slate-400'} />
                {p.label}
              </div>
              <span className="text-[11px] text-slate-400">{p.tagline}</span>
            </button>
          );
        })}
      </div>

      {settings.ttsProvider === 'edge' ? (
        <p className="mt-4 rounded-2xl border border-slate-700/40 bg-slate-950/60 p-3.5 text-xs leading-6 text-slate-400">
          使用浏览器到 Microsoft Edge 在线朗读服务，无需登录。首选项，上线即用。
        </p>
      ) : null}

      {settings.ttsProvider === 'qwen3' ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-100">
            <span className="inline-flex items-center gap-2">
              <Info size={12} />
              先去阿里云创建 API Key，再粘到下方
            </span>
            <a
              href="https://bailian.console.aliyun.com/?tab=model#/api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-amber-300/50 bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/30"
            >
              去登录 <ExternalLink size={11} />
            </a>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm text-slate-300">阿里云 DashScope API Key</span>
            <input
              type="password"
              value={settings.qwenApiKey || ''}
              onChange={(e) => updateSettings({ qwenApiKey: e.target.value })}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-mono text-slate-200"
            />
            <span className="text-[11px] text-slate-500">
              Key 保存在本地浏览器。模型固定为 <code className="font-mono">qwen3-tts-flash</code>。
            </span>
          </label>
        </div>
      ) : null}

      {settings.ttsProvider === 'doubao' ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-100">
            <span className="inline-flex items-center gap-2">
              <Info size={12} />
              登录豆包网页版，复制 Cookie 粘回这里
            </span>
            <a
              href="https://www.doubao.com/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-rose-300/50 bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/30"
            >
              去登录 <ExternalLink size={11} />
            </a>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm text-slate-300">豆包 Cookie（整串）</span>
            <textarea
              value={settings.doubaoCookie || ''}
              onChange={(e) => updateSettings({ doubaoCookie: e.target.value })}
              rows={3}
              placeholder="passport_csrf_token=...; sid_tt=...; sessionid=...; ..."
              autoComplete="off"
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-mono text-slate-200"
            />
            <span className="text-[11px] text-slate-500">
              Cookie 保存在本地浏览器。过期会失效，需要重新登录后再粘一次。
            </span>
          </label>
          <button
            type="button"
            onClick={() => setShowCookieGuide((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-slate-500"
          >
            <Info size={12} />
            {showCookieGuide ? '收起获取步骤' : '如何获取 Cookie（电脑 / 手机）'}
          </button>
          {showCookieGuide ? (
            <div className="space-y-3 rounded-2xl border border-slate-700/40 bg-slate-950/60 p-4 text-[12px] leading-6 text-slate-300">
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">电脑（Chrome / Edge）</div>
                <ol className="list-decimal space-y-1 pl-5 text-slate-300">
                  <li>在新标签打开 <span className="font-mono text-blue-300">doubao.com/chat</span> 并完成登录。</li>
                  <li>按 <kbd className="rounded bg-slate-800 px-1 text-[10px]">F12</kbd> 打开开发者工具 → 切到 <b>Network</b> 面板。</li>
                  <li>在豆包页里随便发一条消息触发网络请求。</li>
                  <li>在 Network 列表选任一请求 → 右侧 <b>Headers</b> → <b>Request Headers</b>。</li>
                  <li>找到 <span className="font-mono text-blue-300">cookie:</span> 那一行，整串复制（从第一个字符到行末）。</li>
                  <li>粘贴回上方输入框保存即可。</li>
                </ol>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">手机（iOS Safari / Android Chrome）</div>
                <ol className="list-decimal space-y-1 pl-5 text-slate-300">
                  <li>在手机浏览器打开 <span className="font-mono text-blue-300">doubao.com/chat</span> 并登录。</li>
                  <li>
                    iOS：在 Safari 地址栏输入：
                    <div className="mt-1 overflow-x-auto rounded-lg bg-slate-900 px-2 py-1.5 font-mono text-[11px] text-amber-200">
                      javascript:prompt('cookie',document.cookie)
                    </div>
                    <span className="text-[11px] text-slate-500">若 Safari 剥离 javascript: 前缀，粘贴后手动补 j 开头。</span>
                  </li>
                  <li>
                    Android：Chrome 不支持 javascript: 书签，改用 <b>eruda</b> 调试器 —
                    收藏一个 <span className="font-mono text-blue-300">javascript:(function(){'{'}var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/eruda';document.body.appendChild(s);s.onload=function(){'{'}eruda.init();{'}'};{'}'})();</span>
                    的书签并在 doubao.com 页面触发即可。
                  </li>
                  <li>复制弹窗 / Console 输出的完整 cookie 字符串。</li>
                  <li>切回 Lanobe 设置界面粘贴并保存。</li>
                </ol>
              </div>
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-[11px] text-amber-100">
                提示：Cookie 有效期通常几天到几周。失效后 TTS 会报错，按同样步骤重新获取即可。
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
