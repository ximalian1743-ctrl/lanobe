import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

async function test() {
  const tts = new MsEdgeTTS();
  await tts.setMetadata('ja-JP-NanamiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream('「ストーカーでも、妹は健全な方のストーカーだから大丈夫だって」', { rate: '+0%' });
  let audioData = Buffer.alloc(0);
  audioStream.on('data', (chunk) => {
    audioData = Buffer.concat([audioData, chunk]);
  });
  audioStream.on('close', () => {
    console.log('Audio size:', audioData.length);
    tts.close();
  });
  audioStream.on('error', (err) => {
    console.error('Error:', err);
    tts.close();
  });
}

test();
