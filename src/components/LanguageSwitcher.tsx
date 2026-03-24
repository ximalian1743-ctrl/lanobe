import { uiLanguageOptions } from '../i18n/ui';
import { useUiText } from '../hooks/useUiText';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { uiLanguage, setUiLanguage, text } = useUiText();

  return (
    <div className={compact ? 'inline-flex items-center gap-1 rounded-full border border-stone-700/80 bg-stone-950/75 p-1 backdrop-blur-md' : 'inline-flex items-center gap-1 rounded-full border border-stone-700/80 bg-stone-950/75 p-1.5 backdrop-blur-md'}>
      {!compact && <span className="pl-2 pr-1 text-[11px] uppercase tracking-[0.24em] text-stone-400">{text.common.language}</span>}
      {uiLanguageOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setUiLanguage(option.value)}
          title={option.longLabel[uiLanguage]}
          className={[
            'rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors',
            option.value === uiLanguage ? 'bg-orange-400 text-stone-950' : 'text-stone-300 hover:bg-stone-800 hover:text-stone-100',
          ].join(' ')}
        >
          {option.shortLabel}
        </button>
      ))}
    </div>
  );
}

