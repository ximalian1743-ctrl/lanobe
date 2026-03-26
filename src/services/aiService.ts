import { UiLanguage } from '../i18n/ui';
import { Entry } from '../types';

export interface EntryExplanation {
  overview: string;
  translation: string;
  contextNote: string;
  structure: string;
  grammarPoints: Array<{ title: string; explanation: string }>;
  wordBreakdown: Array<{ term: string; meaning: string; role: string }>;
  sentencePatterns: string[];
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

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

function getOutputLanguageName(language: UiLanguage) {
  if (language === 'ja-JP') return 'Japanese';
  if (language === 'en-US') return 'English';
  return 'Simplified Chinese';
}

function buildFallbackWords(entry: Entry) {
  return entry.words
    .filter((word) => word[0] || word[1])
    .slice(0, 12)
    .map((word) => ({
      term: word[0] || word[1],
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
    return excerpts.map((e, idx) => ({
      title: `Part ${idx + 1}`,
      index: e.index,
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
${batch.map((e, idx) => `Segment ${idx + 1}:\n${e.text}`).join('\n\n')}`;

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

      if (parsed.titles && Array.isArray(parsed.titles)) {
        const batchTitles = parsed.titles.map((title: string, idx: number) => ({
          title,
          index: batch[idx]?.index || 0,
        }));
        allChapters.push(...batchTitles);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Failed to generate chapters for batch ${i / batchSize + 1}:`, error);
      const fallbackTitles = batch.map((e, idx) => ({
        title: `Part ${i + idx + 1}`,
        index: e.index,
      }));
      allChapters.push(...fallbackTitles);
    }
  }

  return allChapters;
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
  bookTitle,
  volumeLabel,
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
  bookTitle?: string;
  volumeLabel?: string;
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

  const prompt = `You are a world-class Japanese teacher helping a learner study one sentence inside its story context.
Respond entirely in ${targetLanguage}.
Return one JSON object only. Do not use markdown fences.

JSON shape:
{
  "overview": "short overall explanation",
  "translation": "natural translation of the current sentence",
  "contextNote": "how the previous/current/next lines connect",
  "structure": "sentence structure and clause breakdown",
  "grammarPoints": [{"title":"", "explanation":""}],
  "wordBreakdown": [{"term":"", "meaning":"", "role":""}],
  "sentencePatterns": ["pattern 1", "pattern 2"],
  "teachingTip": "best teaching explanation for this learner"
}

Book: ${bookTitle || 'Unknown'}
Volume: ${volumeLabel || 'Unknown'}
Line: ${lineNumber}

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

Requirements:
- Focus on grammar, clause structure, vocabulary, nuance, and why the sentence is written this way.
- Use the story context when explaining tone or omitted subjects.
- If useful, explain contraction, omitted particles, or implied meaning.
- Keep the explanation dense and practical for learning, not generic praise.
- Keep wordBreakdown to the most useful 5-10 items.`;

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
          content: 'You are an expert Japanese teacher and linguistic analyst. Return JSON only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
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
    contextNote: parsed.contextNote || '',
    structure: parsed.structure || '',
    grammarPoints: Array.isArray(parsed.grammarPoints) ? parsed.grammarPoints : [],
    wordBreakdown: Array.isArray(parsed.wordBreakdown) && parsed.wordBreakdown.length ? parsed.wordBreakdown : buildFallbackWords(entry),
    sentencePatterns: Array.isArray(parsed.sentencePatterns) ? parsed.sentencePatterns : [],
    teachingTip: parsed.teachingTip || '',
  };
}
