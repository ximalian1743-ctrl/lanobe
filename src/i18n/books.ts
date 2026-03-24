import { BuiltInBookMeta, BuiltInBookSummary, BuiltInVolume } from '../types/books';
import { UiLanguage } from './ui';

interface LocalizedBookContent {
  title: string;
  subtitle: string;
  description: string;
  author?: string;
  illustrator?: string;
}

const builtInBookCopy: Record<string, Record<UiLanguage, LocalizedBookContent>> = {
  'makeine-too-many-heroines': {
    'zh-CN': {
      title: '败犬女主太多了！',
      subtitle: 'Makeine: Too Many Losing Heroines!',
      description: 'Lanobe 当前接入的第一套站内内置小说，共 8 卷，支持直接进入阅读与听书。',
      author: '雨森たきび',
      illustrator: 'いみぎむる',
    },
    'ja-JP': {
      title: '負けヒロインが多すぎる！',
      subtitle: 'Makeine: Too Many Losing Heroines!',
      description: 'Lanobe に組み込まれた最初のシリーズ作品です。全 8 巻をサイト内から直接読書?聴書できます。',
      author: '雨森たきび',
      illustrator: 'いみぎむる',
    },
    'en-US': {
      title: 'Makeine: Too Many Losing Heroines!',
      subtitle: 'Built-in Eight-Volume Series',
      description: 'The first built-in bookshelf series inside Lanobe, currently available with eight local volumes for direct reading and listening.',
      author: 'Takibi Amamori',
      illustrator: 'Imigimuru',
    },
  },
};

export function getLocalizedBookSummary(book: BuiltInBookSummary, language: UiLanguage): BuiltInBookSummary {
  const override = builtInBookCopy[book.slug]?.[language];
  return {
    ...book,
    title: override?.title ?? book.title,
    subtitle: override?.subtitle ?? book.subtitle,
    description: override?.description ?? book.description,
  };
}

export function getLocalizedBookMeta(meta: BuiltInBookMeta, language: UiLanguage): BuiltInBookMeta {
  const override = builtInBookCopy[meta.slug]?.[language];
  return {
    ...meta,
    title: override?.title ?? meta.title,
    subtitle: override?.subtitle ?? meta.subtitle,
    description: override?.description ?? meta.description,
    author: override?.author ?? meta.author,
    illustrator: override?.illustrator ?? meta.illustrator,
    volumes: meta.volumes.map((volume) => ({
      ...volume,
      label: formatVolumeLabel(volume, language),
      title: formatVolumeTitle(volume, language),
    })),
  };
}

export function getFormattedVolumeLabel(volumeId: string, language: UiLanguage) {
  return formatVolumeNumber(getVolumeNumberFromId(volumeId), language);
}

function getVolumeNumber(volume: BuiltInVolume) {
  return getVolumeNumberFromId(volume.id);
}

function formatVolumeLabel(volume: BuiltInVolume, language: UiLanguage) {
  return formatVolumeNumber(getVolumeNumber(volume), language);
}

function formatVolumeTitle(volume: BuiltInVolume, language: UiLanguage) {
  return formatVolumeNumber(getVolumeNumber(volume), language);
}

function getVolumeNumberFromId(volumeId: string) {
  const matched = volumeId.match(/(\d+)/);
  return matched ? Number.parseInt(matched[1], 10) : 1;
}

function formatVolumeNumber(number: number, language: UiLanguage) {
  if (language === 'zh-CN') return `第 ${number} 卷`;
  if (language === 'ja-JP') return `第 ${number} 巻`;
  return `Volume ${String(number).padStart(2, '0')}`;
}

