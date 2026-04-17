import type { TtsProvider } from '../types';

export interface VoiceOption {
  id: string;
  label: string;
}

const EDGE_JA: VoiceOption[] = [
  { id: 'ja-JP-NanamiNeural',  label: 'Nanami · 女声 / 标准' },
  { id: 'ja-JP-AoiNeural',     label: 'Aoi · 女声 / 清亮' },
  { id: 'ja-JP-MayuNeural',    label: 'Mayu · 女声 / 温柔' },
  { id: 'ja-JP-ShioriNeural',  label: 'Shiori · 女声 / 年轻' },
  { id: 'ja-JP-KeitaNeural',   label: 'Keita · 男声 / 标准' },
  { id: 'ja-JP-DaichiNeural',  label: 'Daichi · 男声 / 成熟' },
  { id: 'ja-JP-NaokiNeural',   label: 'Naoki · 男声 / 新闻' },
];

const EDGE_ZH: VoiceOption[] = [
  { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓 · 女声 / 标准' },
  { id: 'zh-CN-XiaoyiNeural',   label: '晓伊 · 女声 / 活泼' },
  { id: 'zh-CN-YunxiNeural',    label: '云希 · 男声 / 年轻' },
  { id: 'zh-CN-YunjianNeural',  label: '云健 · 男声 / 成熟' },
  { id: 'zh-CN-YunyangNeural',  label: '云扬 · 男声 / 新闻' },
  { id: 'zh-CN-XiaohanNeural',  label: '晓涵 · 女声 / 温暖' },
  { id: 'zh-TW-HsiaoChenNeural', label: '曉臻 · 台湾女声' },
  { id: 'zh-HK-HiuMaanNeural',  label: '曉曼 · 粤语女声' },
];

// Qwen3-TTS voices are multilingual — the same voice produces natural
// Japanese and Mandarin output depending on the input script. Keep a
// shared list for both languages.
const QWEN_VOICES: VoiceOption[] = [
  { id: 'Cherry',    label: 'Cherry · 女声 / 多语种' },
  { id: 'Chelsea',   label: 'Chelsea · 女声 / 多语种' },
  { id: 'Jennifer',  label: 'Jennifer · 女声 / 多语种' },
  { id: 'Katerina',  label: 'Katerina · 女声 / 多语种' },
  { id: 'Jada',      label: 'Jada · 女声 / 多语种' },
  { id: 'Sunny',     label: 'Sunny · 女声 / 多语种' },
  { id: 'Kiki',      label: 'Kiki · 女声 / 多语种' },
  { id: 'Li',        label: 'Li · 女声 / 多语种' },
  { id: 'Ethan',     label: 'Ethan · 男声 / 多语种' },
  { id: 'Ryan',      label: 'Ryan · 男声 / 多语种' },
  { id: 'Elias',     label: 'Elias · 男声 / 多语种' },
  { id: 'Dylan',     label: 'Dylan · 男声 / 多语种' },
  { id: 'Marcus',    label: 'Marcus · 男声 / 多语种' },
  { id: 'Roy',       label: 'Roy · 男声 / 多语种' },
  { id: 'Peter',     label: 'Peter · 男声 / 多语种' },
  { id: 'Rocky',     label: 'Rocky · 男声 / 多语种' },
  { id: 'Eric',      label: 'Eric · 男声 / 多语种' },
  { id: 'Nofish',    label: 'Nofish · 中性 / 多语种' },
];

// Doubao voices are fetched dynamically after cookie auth. Ship with a
// known-stable pair so users can try it out, and let them paste a custom
// speaker ID for anything else.
const DOUBAO_VOICES: VoiceOption[] = [
  { id: 'zh_female_linjianvhai_emo_v2_mars_bigtts', label: '邻家女孩 · 女声 / 中日通用' },
  { id: 'ja_female_kawaii_emo_v2_mars_bigtts',      label: 'かわいい · 女声 / 日语' },
  { id: 'zh_male_jieshuonansheng_emo_v2_mars_bigtts', label: '解说男声 · 男声 / 中日通用' },
  { id: 'CUSTOM', label: '自定义 · 手动填写 speaker ID' },
];

export function getTtsVoices(provider: TtsProvider, lang: 'jp' | 'zh'): VoiceOption[] {
  if (provider === 'edge') return lang === 'jp' ? EDGE_JA : EDGE_ZH;
  if (provider === 'qwen3') return QWEN_VOICES;
  return DOUBAO_VOICES;
}

export function getDefaultVoice(provider: TtsProvider, lang: 'jp' | 'zh'): string {
  if (provider === 'edge') return lang === 'jp' ? 'ja-JP-NanamiNeural' : 'zh-CN-XiaoxiaoNeural';
  if (provider === 'qwen3') return 'Cherry';
  return lang === 'jp'
    ? 'ja_female_kawaii_emo_v2_mars_bigtts'
    : 'zh_female_linjianvhai_emo_v2_mars_bigtts';
}

export function getProviderMime(provider: TtsProvider): string {
  if (provider === 'qwen3') return 'audio/wav';
  if (provider === 'doubao') return 'audio/aac';
  return 'audio/mp3';
}
