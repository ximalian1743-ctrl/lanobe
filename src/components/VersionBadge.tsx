const RAW_SHA = import.meta.env.VITE_COMMIT_SHA ?? '';
const SHORT_SHA = RAW_SHA.slice(0, 7);

/**
 * Tiny fixed-corner badge showing the deployed commit's short SHA so
 * anyone opening the page can tell at a glance which build is live.
 * Rendered as a bare anchor when a GitHub repo link is known, otherwise
 * a plain span.
 */
export function VersionBadge() {
  if (!SHORT_SHA) return null;
  const href = `https://github.com/ximalian1743-ctrl/lanobe/commit/${RAW_SHA}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`build ${RAW_SHA}`}
      className="pointer-events-auto fixed bottom-1.5 right-2 z-[120] rounded-full border border-slate-700/40 bg-slate-950/60 px-2 py-0.5 font-mono text-[10px] text-slate-400 backdrop-blur-sm transition-colors hover:border-slate-500 hover:text-slate-200"
    >
      v{SHORT_SHA}
    </a>
  );
}
