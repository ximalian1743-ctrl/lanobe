import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatUiText, getUiCopy } from '../i18n/ui';

export function useUiText() {
  const uiLanguage = useAppStore((state) => state.uiLanguage);
  const setUiLanguage = useAppStore((state) => state.setUiLanguage);

  const text = useMemo(() => getUiCopy(uiLanguage), [uiLanguage]);

  const format = (template: string, values: Record<string, string | number>) => formatUiText(template, values);

  return {
    uiLanguage,
    setUiLanguage,
    text,
    format,
  };
}

