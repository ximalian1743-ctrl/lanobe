import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import WebSocket from 'ws';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '50mb' }));

class Semaphore {
  private count: number;
  private queue: Array<() => void> = [];

  constructor(count: number) {
    this.count = count;
  }

  async acquire(): Promise<void> {
    if (this.count > 0) {
      this.count--;
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) resolve();
    } else {
      this.count++;
    }
  }
}

// Limit to 2 concurrent TTS generation tasks globally to avoid connection errors
const ttsSemaphore = new Semaphore(2);

async function getEdgeTTS(text: string, voice: string, rate: number, retries = 3): Promise<Buffer> {
  await ttsSemaphore.acquire();
  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      let tts: MsEdgeTTS | null = null;
      try {
        tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        
        const rateStr = rate >= 1 ? `+${Math.round((rate-1)*100)}%` : `${Math.round((rate-1)*100)}%`;
        
        const { audioStream } = tts.toStream(text, { rate: rateStr });
        
        return await new Promise((resolve, reject) => {
          let audioData = Buffer.alloc(0);
          
          audioStream.on('data', (chunk) => {
            audioData = Buffer.concat([audioData, chunk]);
          });
          
          audioStream.on('close', () => {
            tts?.close();
            resolve(audioData);
          });
          
          audioStream.on('error', (err) => {
            tts?.close();
            reject(err);
          });
        });
      } catch (error) {
        if (tts) {
          try { tts.close(); } catch (e) {}
        }
        if (attempt === retries) {
          throw error;
        }
        console.warn(`TTS attempt ${attempt} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
    throw new Error('TTS failed after retries');
  } finally {
    ttsSemaphore.release();
  }
}

async function getQwen3TTS(
  text: string,
  voice: string,
  rate: number,
  apiKey: string,
): Promise<Buffer> {
  if (!apiKey) throw new Error('Missing Qwen3 API key');
  const speedRate = Math.max(0.5, Math.min(2.0, rate || 1.0));
  const body = {
    model: 'qwen3-tts-flash',
    input: { text, voice },
    parameters: { sample_rate: 24000, format: 'wav', speed_rate: speedRate },
  };
  const res = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => '');
    throw new Error(`Qwen3 ${res.status}: ${err.slice(0, 200)}`);
  }
  const sse = await res.text();
  // SSE stream concatenates `data: {...}` lines; the final chunk carries the
  // complete audio URL on its `output.audio.url` field. Fall back to a loose
  // regex scan so we don't care which chunk announces it.
  const urlMatch = sse.match(/"url"\s*:\s*"(https?:[^"]+)"/);
  if (!urlMatch) throw new Error('Qwen3: no audio URL in response');
  const audioUrl = urlMatch[1];
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw new Error(`Qwen3 audio download failed: ${audioRes.status}`);
  const buf = Buffer.from(await audioRes.arrayBuffer());
  if (buf.length < 100) throw new Error('Qwen3: empty audio body');
  return buf;
}

function doubaoCommonParams(): string {
  const rand = () => String(Math.floor(1e8 + 9e8 * Math.random()));
  const id = rand() + rand();
  return (
    `&mode=0&language=zh&browser_language=zh-CN&device_platform=web` +
    `&aid=586861&real_aid=586861&pkg_type=release_version` +
    `&device_id=${id}&tea_uuid=${id}&web_id=${id}&is_new_user=0` +
    `&region=CN&sys_region=CN&use-olympus-account=1&samantha_web=1` +
    `&version=1.20.1&version_code=20800&pc_version=1.20.1`
  );
}

async function getDoubaoTTS(
  text: string,
  speaker: string,
  rate: number,
  cookie: string,
): Promise<Buffer> {
  if (!cookie) throw new Error('Missing Doubao cookie');
  if (!speaker || speaker === 'CUSTOM') {
    throw new Error('Missing Doubao speaker ID (set one in Settings)');
  }
  const speechRate = Math.max(-100, Math.min(100, Math.round(((rate || 1.0) - 1.0) * 200)));
  const url =
    `wss://ws-samantha.doubao.com/samantha/audio/tts` +
    `?format=aac&speaker=${encodeURIComponent(speaker)}&speech_rate=${speechRate}&pitch=0` +
    doubaoCommonParams();
  const headers = {
    Cookie: cookie,
    Origin: 'chrome-extension://capohkkfagimodmlpnahjoijgoocdjhd',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
  };

  return await new Promise<Buffer>((resolve, reject) => {
    let settled = false;
    const chunks: Buffer[] = [];
    const ws = new WebSocket(url, { headers });
    const done = (err: Error | null, buf?: Buffer) => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch {}
      if (err) reject(err);
      else resolve(buf!);
    };
    const timer = setTimeout(() => done(new Error('Doubao TTS timeout')), 60000);

    ws.on('open', () => {
      ws.send(JSON.stringify({ event: 'text', podcast_extra: { role: '' }, text }));
      ws.send(JSON.stringify({ event: 'finish' }));
    });
    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        chunks.push(data as Buffer);
        return;
      }
      const txt = data.toString();
      if (txt.includes('"error"') || txt.includes('"code"')) {
        // Surface the server-side error JSON if there is one.
        done(new Error(`Doubao WS error: ${txt.slice(0, 200)}`));
      }
    });
    ws.on('close', (code) => {
      clearTimeout(timer);
      if (chunks.length === 0) {
        done(new Error(`Doubao WS closed with no audio (code ${code})`));
        return;
      }
      done(null, Buffer.concat(chunks));
    });
    ws.on('error', (err) => {
      clearTimeout(timer);
      done(err instanceof Error ? err : new Error(String(err)));
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.2.0' });
});

// Batch TTS endpoint
app.post('/api/tts-batch', async (req, res) => {
  const { requests, provider = 'edge', auth = {} } = req.body;
  if (!Array.isArray(requests)) {
    return res.status(400).json({ error: 'Invalid requests array' });
  }
  if (provider !== 'edge' && provider !== 'qwen3' && provider !== 'doubao') {
    return res.status(400).json({ error: `Unknown TTS provider: ${provider}` });
  }

  try {
    console.log(`TTS batch: provider=${provider} items=${requests.length}`);
    const results = [];
    for (const reqItem of requests) {
      if (!reqItem.text) continue;
      const preview = String(reqItem.text).substring(0, 30);
      console.log(`  ${provider} "${preview}..." voice=${reqItem.voice} rate=${reqItem.rate}`);
      let audioBuffer: Buffer;
      if (provider === 'qwen3') {
        audioBuffer = await getQwen3TTS(reqItem.text, reqItem.voice, reqItem.rate, auth.qwenApiKey);
      } else if (provider === 'doubao') {
        audioBuffer = await getDoubaoTTS(reqItem.text, reqItem.voice, reqItem.rate, auth.doubaoCookie);
      } else {
        audioBuffer = await getEdgeTTS(reqItem.text, reqItem.voice, reqItem.rate);
      }
      results.push({
        text: reqItem.text,
        voice: reqItem.voice,
        rate: reqItem.rate,
        audioBase64: audioBuffer.toString('base64'),
      });
    }
    console.log(`Successfully generated ${results.length} TTS items via ${provider}`);
    res.json({ results });
  } catch (error: any) {
    console.error(`TTS Error (${provider}):`, error?.message || error);
    res.status(500).json({ error: error?.message || 'Unknown TTS error' });
  }
});

// AI Proxy endpoint to bypass CORS issues
app.post('/api/ai-chat', async (req, res) => {
  const {
    apiBase,
    apiKey,
    model,
    messages,
    ...passthrough
  } = req.body;
  
  if (!apiBase || !apiKey || !model || !messages) {
    return res.status(400).json({ error: 'Missing required AI parameters' });
  }

  try {
    let baseUrl = apiBase.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      // Force non-streaming: some OpenAI-compat endpoints (e.g. grok2api) default to SSE,
      // which would break the response.json() parse below.
      body: JSON.stringify({
        model,
        messages,
        ...passthrough,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('AI Proxy Error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Unknown AI Proxy error' });
  }
});

async function startServer() {
  // Required for App Service managed certificate HTTP-token validation.
  // Azure writes challenge files under .well-known/pki-validation in wwwroot.
  const pkiValidationPath = path.join(process.cwd(), '.well-known', 'pki-validation');
  app.use('/.well-known/pki-validation', express.static(pkiValidationPath));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
