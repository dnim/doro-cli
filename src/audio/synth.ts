type ToneWave = 'square' | 'sine';

type Tone = {
  frequency: number;
  durationMs: number;
  volume: number;
  wave: ToneWave;
};

const SAMPLE_RATE = 11_025;
const MASTER_GAIN = 0.24;

function envelope(position: number, total: number): number {
  const attack = Math.min(0.05, total * 0.2);
  const releaseStart = Math.max(0, total - 0.08);

  if (position < attack) {
    return position / attack;
  }

  if (position > releaseStart) {
    const releaseLength = Math.max(0.01, total - releaseStart);
    return Math.max(0, 1 - (position - releaseStart) / releaseLength);
  }

  return 1;
}

function synthesize(tones: Tone[]): Uint8Array {
  const totalMs = tones.reduce((sum, tone) => sum + tone.durationMs, 0);
  const totalSamples = Math.max(1, Math.floor((totalMs / 1000) * SAMPLE_RATE));
  const pcm = new Uint8Array(totalSamples);

  let writeIndex = 0;
  for (const tone of tones) {
    const samples = Math.max(1, Math.floor((tone.durationMs / 1000) * SAMPLE_RATE));
    for (let i = 0; i < samples && writeIndex < pcm.length; i += 1) {
      const t = i / SAMPLE_RATE;
      const sine = Math.sin(2 * Math.PI * tone.frequency * t);
      const square = sine >= 0 ? 1 : -1;
      const raw = tone.wave === 'square' ? square * 0.68 + sine * 0.32 : sine;
      const shaped = raw * tone.volume * MASTER_GAIN * envelope(t, samples / SAMPLE_RATE);
      const quantized = Math.round((shaped * 0.5 + 0.5) * 255);
      pcm[writeIndex] = Math.max(0, Math.min(255, quantized));
      writeIndex += 1;
    }
  }

  for (; writeIndex < pcm.length; writeIndex += 1) {
    pcm[writeIndex] = 128;
  }

  return pcm;
}

function wavFromPcm8Mono(pcm: Uint8Array): Buffer {
  const headerSize = 44;
  const dataSize = pcm.length;
  const fileSize = headerSize + dataSize;
  const buffer = Buffer.alloc(fileSize);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);
  Buffer.from(pcm).copy(buffer, 44);

  return buffer;
}

function makeClip(tones: Tone[]): Buffer {
  return wavFromPcm8Mono(synthesize(tones));
}

export function createWorkStartClip(): Buffer {
  return makeClip([
    { frequency: 440, durationMs: 380, volume: 0.3, wave: 'square' },
    { frequency: 523.25, durationMs: 380, volume: 0.3, wave: 'square' },
    { frequency: 659.25, durationMs: 380, volume: 0.31, wave: 'square' },
    { frequency: 523.25, durationMs: 280, volume: 0.27, wave: 'square' },
    { frequency: 698.46, durationMs: 420, volume: 0.32, wave: 'square' },
    { frequency: 783.99, durationMs: 420, volume: 0.33, wave: 'square' },
    { frequency: 880, durationMs: 420, volume: 0.33, wave: 'square' },
    { frequency: 1046.5, durationMs: 520, volume: 0.31, wave: 'square' },
    { frequency: 880, durationMs: 420, volume: 0.28, wave: 'square' }
  ]);
}

export function createRestStartClip(): Buffer {
  return makeClip([
    { frequency: 392, durationMs: 420, volume: 0.24, wave: 'square' },
    { frequency: 329.63, durationMs: 420, volume: 0.23, wave: 'square' },
    { frequency: 293.66, durationMs: 420, volume: 0.23, wave: 'square' },
    { frequency: 261.63, durationMs: 520, volume: 0.22, wave: 'square' },
    { frequency: 293.66, durationMs: 420, volume: 0.23, wave: 'square' },
    { frequency: 329.63, durationMs: 420, volume: 0.23, wave: 'square' },
    { frequency: 349.23, durationMs: 420, volume: 0.24, wave: 'square' },
    { frequency: 392, durationMs: 620, volume: 0.24, wave: 'square' }
  ]);
}

export function createCompletionBeepClip(): Buffer {
  return makeClip([
    { frequency: 587.33, durationMs: 260, volume: 0.14, wave: 'sine' },
    { frequency: 659.25, durationMs: 260, volume: 0.14, wave: 'sine' },
    { frequency: 698.46, durationMs: 360, volume: 0.13, wave: 'sine' }
  ]);
}

export function createResetBeepClip(): Buffer {
  return makeClip([{ frequency: 783.99, durationMs: 140, volume: 0.15, wave: 'sine' }]);
}

export const AUDIO_SAMPLE_RATE = SAMPLE_RATE;
