import { Entry } from '../types';

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
    // Extract up to 200 characters of Japanese text
    while (curr < entries.length && text.length < 200) {
      if (entries[curr].jp) {
        // Remove furigana brackets for cleaner text
        text += entries[curr].jp.replace(/\[[^\]]+\]/g, '') + ' ';
      }
      curr++;
    }
    excerpts.push({
      index: startIndex,
      text: text.substring(0, 250).trim(),
    });
  }

  // If no API key is configured, return deterministic fallback chapters.
  if (!safeApiKey) {
    return excerpts.map((e, idx) => ({
      title: `Part ${idx + 1}`,
      index: e.index,
    }));
  }

  const proxyUrl = backendApiBase && backendApiBase !== 'https://api.ximalian.cc.cd' ? `${backendApiBase}/api/ai-chat` : '/api/ai-chat';
  const allChapters: { title: string; index: number }[] = [];
  const batchSize = 25;

  for (let i = 0; i < excerpts.length; i += batchSize) {
    const batch = excerpts.slice(i, i + batchSize);
    const batchCount = batch.length;

    const prompt = `你是一个小说章节标题生成器。我将提供${batchCount}个小说片段（日文），请为每个片段生成一个概括性的中文章节标题。标题可以稍微长一点，要能吸引人并准确概括该部分内容。
请严格返回一个JSON对象，包含一个 "titles" 数组，数组中包含${batchCount}个字符串。
例如：{"titles": ["第一章：意外的相遇与未知的命运", "第二章：在暗夜中寻找光明的线索"]}

片段如下：
${batch.map((e, idx) => `片段 ${idx + 1}:\n${e.text}`).join('\n\n')}`;

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
              content: '你是一个专业的小说编辑，擅长根据内容提炼吸引人的章节标题。请只返回JSON格式。',
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
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      
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
      // Fallback to generic chapters if API fails for this batch
      const fallbackTitles = batch.map((e, idx) => ({
        title: `第 ${i + idx + 1} 部分`,
        index: e.index,
      }));
      allChapters.push(...fallbackTitles);
    }
  }

  return allChapters;
}
