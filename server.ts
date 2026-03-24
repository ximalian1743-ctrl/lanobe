import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.1.0' });
});

// Batch TTS endpoint
app.post('/api/tts-batch', async (req, res) => {
  const { requests } = req.body;
  if (!Array.isArray(requests)) {
    return res.status(400).json({ error: 'Invalid requests array' });
  }

  try {
    console.log(`Received TTS batch request with ${requests.length} items`);
    // Process requests sequentially to avoid rate limits, or in parallel if small
    // Edge TTS allows parallel connections but it's safer to limit concurrency
    const results = [];
    for (const reqItem of requests) {
      if (!reqItem.text) continue;
      console.log(`Generating TTS for: "${reqItem.text.substring(0, 30)}..." voice: ${reqItem.voice}, rate: ${reqItem.rate}`);
      const audioBuffer = await getEdgeTTS(reqItem.text, reqItem.voice, reqItem.rate);
      results.push({
        text: reqItem.text,
        voice: reqItem.voice,
        rate: reqItem.rate,
        audioBase64: audioBuffer.toString('base64')
      });
    }
    console.log(`Successfully generated ${results.length} TTS items`);
    res.json({ results });
  } catch (error: any) {
    console.error('TTS Error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Unknown TTS error' });
  }
});

// AI Proxy endpoint to bypass CORS issues
app.post('/api/ai-chat', async (req, res) => {
  const { apiBase, apiKey, model, messages, response_format } = req.body;
  
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
      body: JSON.stringify({
        model,
        messages,
        response_format
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
