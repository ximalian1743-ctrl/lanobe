import { UiLanguage } from '../i18n/ui';
import { Entry } from '../types';
import { formatBracketReadingsAsParen } from '../lib/textCleanup';

export interface AnnotatedEntry {
  jp: string;
  ch: string;
}

export interface EntryExplanation {
  overview: string;
  translation: string;
  readingGuide: string;
  grammarPoints: Array<{ title: string; explanation: string }>;
  wordBreakdown: Array<{ term: string; reading: string; meaning: string; role: string }>;
  teachingTip: string;
}

function cleanJapaneseText(text: string) {
  return text.replace(/\[[^\]]+\]/g, '').trim();
}

function getAiProxyUrl(backendApiBase: string = '') {
  return backendApiBase && backendApiBase !== 'https://api.ximalian.cc.cd'
    ? `${backendApiBase}/api/ai-chat`
    : '/api/ai-chat';
}

function parseJsonContent(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced ?? content).trim();
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('AI response did not contain a JSON object');
  }

  const raw = candidate.slice(firstBrace, lastBrace + 1);

  // Gemini-family models sometimes emit lenient JSON. Try strict first,
  // then fall back through a sequence of tolerant transformations so a
  // single trailing comma / comment doesn't drop the whole explanation.
  try {
    return JSON.parse(raw);
  } catch {
    // Strip trailing commas before } or ]
    const noTrailingCommas = raw.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(noTrailingCommas);
    } catch {
      // Strip // line comments and /* block comments */
      const stripped = noTrailingCommas
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      try {
        return JSON.parse(stripped);
      } catch {
        // Last-resort: remove unescaped literal newlines inside double-quoted strings
        const flattened = stripped.replace(/"([^"\\]|\\.)*"/gs, (match) =>
          match.replace(/\n/g, '\\n').replace(/\r/g, ''),
        );
        return JSON.parse(flattened);
      }
    }
  }
}

function getOutputLanguageName(language: UiLanguage) {
  if (language === 'ja-JP') return 'Japanese';
  if (language === 'en-US') return 'English';
  return 'Simplified Chinese';
}

function getReasoningEffort(model: string) {
  const normalized = model.toLowerCase();
  if (normalized.includes('gpt-5') || normalized.startsWith('o1') || normalized.startsWith('o3') || normalized.startsWith('o4')) {
    return 'low';
  }
  return undefined;
}

function buildFallbackWords(entry: Entry) {
  return entry.words
    .filter((word) => word[0] || word[1])
    .slice(0, 5)
    .map((word) => ({
      term: word[0] || word[1],
      reading: '',
      meaning: word[1] || word[0],
      role: '',
    }));
}

export async function generateChapters(
  entries: Entry[],
  apiKey: string,
  apiBase: string,
  model: string,
  backendApiBase: string = ''
): Promise<{ title: string; index: number }[]> {
  if (entries.length === 0) return [];

  const safeApiBase = apiBase || 'https://sub.jlypx.de/v1';
  const safeApiKey = apiKey || '';
  const safeModel = model || 'gpt-5.4';

  const numChapters = Math.min(50, entries.length);
  const segmentSize = Math.floor(entries.length / numChapters);

  const excerpts: { index: number; text: string }[] = [];

  for (let i = 0; i < numChapters; i++) {
    const startIndex = i * segmentSize;
    let text = '';
    let curr = startIndex;

    while (curr < entries.length && text.length < 200) {
      if (entries[curr].jp) {
        text += cleanJapaneseText(entries[curr].jp) + ' ';
      }
      curr++;
    }
    excerpts.push({
      index: startIndex,
      text: text.substring(0, 250).trim(),
    });
  }

  if (!safeApiKey) {
    return excerpts.map((excerpt, index) => ({
      title: `Part ${index + 1}`,
      index: excerpt.index,
    }));
  }

  const proxyUrl = getAiProxyUrl(backendApiBase);
  const allChapters: { title: string; index: number }[] = [];
  const batchSize = 25;

  for (let i = 0; i < excerpts.length; i += batchSize) {
    const batch = excerpts.slice(i, i + batchSize);
    const batchCount = batch.length;

    const prompt = `You are a novel editor.
Generate ${batchCount} concise but appealing chapter titles in Simplified Chinese.
Return one JSON object only, shaped exactly like:
{"titles":["title 1","title 2"]}

Segments:
${batch.map((excerpt, index) => `Segment ${index + 1}:\n${excerpt.text}`).join('\n\n')}`;

    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiBase: safeApiBase,
          apiKey: safeApiKey,
          model: safeModel,
          messages: [
            {
              role: 'system',
              content: 'You are a professional fiction editor. Respond with JSON only.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const parsed = parseJsonContent(content);

      if (Array.isArray(parsed.titles)) {
        allChapters.push(
          ...parsed.titles.map((title: string, index: number) => ({
            title,
            index: batch[index]?.index || 0,
          })),
        );
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Failed to generate chapters for batch ${i / batchSize + 1}:`, error);
      allChapters.push(
        ...batch.map((excerpt, index) => ({
          title: `Part ${i + index + 1}`,
          index: excerpt.index,
        })),
      );
    }
  }

  return allChapters;
}

export async function annotateTextWithAi({
  text,
  apiKey,
  apiBase,
  model,
  backendApiBase = '',
  signal,
}: {
  text: string;
  apiKey: string;
  apiBase: string;
  model: string;
  backendApiBase?: string;
  signal?: AbortSignal;
}): Promise<AnnotatedEntry[]> {
  const safeApiBase = apiBase || 'https://sub.jlypx.de/v1';
  const safeApiKey = apiKey.trim();
  const safeModel = model || 'gpt-5.4';
  if (!safeApiKey) throw new Error('Missing AI API key');

  const proxyUrl = getAiProxyUrl(backendApiBase);
  const reasoningEffort = getReasoningEffort(safeModel);

  const prompt = `You process Japanese text for a bilingual reader.

Task for the passage below:
1. Split it into natural sentences. Split on 。！？!? and between quotes/paragraphs. Preserve the original punctuation inside each sentence.
2. For EVERY kanji word, append its hiragana reading in square brackets right after the word, e.g. 漢字[かんじ]. Group consecutive kanji of a single word together (食[た]べる, not 食[た]べ). Do not bracket pure kana.
3. For each sentence, provide an accurate, natural Simplified Chinese translation.
4. Do not add sentences or content that is not in the input. Keep the original order.

Return JSON ONLY, shape:
{"entries":[{"jp":"漢字[かんじ]の本[ほん]。","ch":"汉字的书。"}, ...]}

Passage:
<<<
${text}
>>>`;

  const requestBody: Record<string, unknown> = {
    apiBase: safeApiBase,
    apiKey: safeApiKey,
    model: safeModel,
    messages: [
      {
        role: 'system',
        content:
          'You are a precise Japanese text processor. Output compact JSON only, no prose, no markdown fences.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  };
  if (reasoningEffort) requestBody.reasoning_effort = reasoningEffort;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const parsed = parseJsonContent(content);
  const rawEntries = Array.isArray(parsed?.entries) ? parsed.entries : [];

  const cleaned: AnnotatedEntry[] = [];
  for (const item of rawEntries) {
    const jp = typeof item?.jp === 'string' ? item.jp.trim() : '';
    const ch = typeof item?.ch === 'string' ? item.ch.trim() : '';
    if (!jp && !ch) continue;
    cleaned.push({ jp, ch });
  }
  if (!cleaned.length) throw new Error('AI returned no sentences');
  return cleaned;
}

export async function explainEntryWithAi({
  entry,
  previousEntry,
  nextEntry,
  lineNumber,
  apiKey,
  apiBase,
  model,
  backendApiBase = '',
  uiLanguage,
}: {
  entry: Entry;
  previousEntry?: Entry;
  nextEntry?: Entry;
  lineNumber: number;
  apiKey: string;
  apiBase: string;
  model: string;
  backendApiBase?: string;
  uiLanguage: UiLanguage;
}): Promise<EntryExplanation> {
  const safeApiBase = apiBase || 'https://sub.jlypx.de/v1';
  const safeApiKey = apiKey.trim();
  const safeModel = model || 'gpt-5.4';

  if (!safeApiKey) {
    throw new Error('Missing AI API key');
  }

  const targetLanguage = getOutputLanguageName(uiLanguage);
  const proxyUrl = getAiProxyUrl(backendApiBase);
  const currentJp = cleanJapaneseText(entry.jp);
  const previousJp = previousEntry ? cleanJapaneseText(previousEntry.jp) : '';
  const nextJp = nextEntry ? cleanJapaneseText(nextEntry.jp) : '';
  const reasoningEffort = getReasoningEffort(safeModel);

  const prompt = `You are a patient Japanese teacher for beginners.
Respond entirely in ${targetLanguage}.
Do not discuss plot unless it is absolutely needed for grammar or omitted subjects.
Keep the total response short enough to fit in a single phone screen.
Whenever you mention Japanese words with kanji, annotate them as 漢字（かな）.
Return JSON only.

JSON shape:
{
  "overview": "1-2 short sentences that explain the core meaning",
  "translation": "one natural translation",
  "readingGuide": "rewrite the current sentence with kana support for key kanji",
  "grammarPoints": [{"title":"", "explanation":""}],
  "wordBreakdown": [{"term":"", "reading":"", "meaning":"", "role":""}],
  "teachingTip": "one compact teaching note"
}

Hard limits:
- grammarPoints: at most 3
- wordBreakdown: at most 5
- each explanation: concise
- no extra keys

Previous line:
JP: ${previousJp || '(none)'}
ZH: ${previousEntry?.ch || '(none)'}

Current line:
JP: ${currentJp || '(empty)'}
ZH: ${entry.ch || '(none)'}
Words:
${entry.words.length ? entry.words.map((word) => `- ${word[0]} => ${word[1]}`).join('\n') : '(none)'}

Next line:
JP: ${nextJp || '(none)'}
ZH: ${nextEntry?.ch || '(none)'}

Focus order:
1. natural meaning
2. beginner-friendly reading support
3. grammar and sentence structure
4. useful vocabulary only`;

  const requestBody: Record<string, unknown> = {
    apiBase: safeApiBase,
    apiKey: safeApiKey,
    model: safeModel,
    messages: [
      {
        role: 'system',
        content: 'You are an expert Japanese teacher. Return compact JSON only.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_completion_tokens: 650,
  };

  if (reasoningEffort) {
    requestBody.reasoning_effort = reasoningEffort;
  }

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const parsed = parseJsonContent(content);

  return {
    overview: parsed.overview || '',
    translation: parsed.translation || entry.ch || '',
    readingGuide: parsed.readingGuide || formatBracketReadingsAsParen(entry.jp || currentJp),
    grammarPoints: Array.isArray(parsed.grammarPoints) ? parsed.grammarPoints.slice(0, 3) : [],
    wordBreakdown:
      Array.isArray(parsed.wordBreakdown) && parsed.wordBreakdown.length
        ? parsed.wordBreakdown.slice(0, 5)
        : buildFallbackWords(entry),
    teachingTip: parsed.teachingTip || '',
  };
}
