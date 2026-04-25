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
  // W. A. Mozart - Eine kleine Nachtmusik (Public Domain)
  return makeClip([
    { frequency: 392.0, durationMs: 400, volume: 0.3, wave: 'square' }, // G4
    { frequency: 293.66, durationMs: 400, volume: 0.3, wave: 'square' }, // D4
    { frequency: 392.0, durationMs: 200, volume: 0.3, wave: 'square' }, // G4
    { frequency: 293.66, durationMs: 200, volume: 0.3, wave: 'square' }, // D4
    { frequency: 392.0, durationMs: 200, volume: 0.3, wave: 'square' }, // G4
    { frequency: 493.88, durationMs: 200, volume: 0.3, wave: 'square' }, // B4
    { frequency: 587.33, durationMs: 800, volume: 0.3, wave: 'square' }, // D5
    { frequency: 523.25, durationMs: 400, volume: 0.3, wave: 'square' }, // C5
    { frequency: 440.0, durationMs: 400, volume: 0.3, wave: 'square' }, // A4
    { frequency: 523.25, durationMs: 200, volume: 0.3, wave: 'square' }, // C5
    { frequency: 440.0, durationMs: 200, volume: 0.3, wave: 'square' }, // A4
    { frequency: 523.25, durationMs: 200, volume: 0.3, wave: 'square' }, // C5
    { frequency: 369.99, durationMs: 200, volume: 0.3, wave: 'square' }, // F#4
    { frequency: 440.0, durationMs: 800, volume: 0.3, wave: 'square' } // A4
  ]);
}

export function createShortRestStartClip(): Buffer {
  // Johann Strauss II - The Blue Danube (Public Domain)
  return makeClip([
    { frequency: 261.63, durationMs: 250, volume: 0.24, wave: 'square' }, // C4
    { frequency: 261.63, durationMs: 250, volume: 0.24, wave: 'square' }, // C4
    { frequency: 329.63, durationMs: 250, volume: 0.24, wave: 'square' }, // E4
    { frequency: 392.0, durationMs: 500, volume: 0.24, wave: 'square' }, // G4
    { frequency: 392.0, durationMs: 250, volume: 0.24, wave: 'square' }, // G4
    { frequency: 783.99, durationMs: 250, volume: 0.24, wave: 'square' }, // G5
    { frequency: 783.99, durationMs: 500, volume: 0.24, wave: 'square' }, // G5
    { frequency: 659.25, durationMs: 250, volume: 0.24, wave: 'square' }, // E5
    { frequency: 659.25, durationMs: 500, volume: 0.24, wave: 'square' } // E5
  ]);
}

export function createLongRestStartClip(): Buffer {
  // Ludwig van Beethoven - Ode to Joy (Public Domain)
  return makeClip([
    { frequency: 329.63, durationMs: 300, volume: 0.24, wave: 'square' }, // E4
    { frequency: 329.63, durationMs: 300, volume: 0.24, wave: 'square' }, // E4
    { frequency: 349.23, durationMs: 300, volume: 0.24, wave: 'square' }, // F4
    { frequency: 392.0, durationMs: 300, volume: 0.24, wave: 'square' }, // G4
    { frequency: 392.0, durationMs: 300, volume: 0.24, wave: 'square' }, // G4
    { frequency: 349.23, durationMs: 300, volume: 0.24, wave: 'square' }, // F4
    { frequency: 329.63, durationMs: 300, volume: 0.24, wave: 'square' }, // E4
    { frequency: 293.66, durationMs: 300, volume: 0.24, wave: 'square' }, // D4
    { frequency: 261.63, durationMs: 300, volume: 0.24, wave: 'square' }, // C4
    { frequency: 261.63, durationMs: 300, volume: 0.24, wave: 'square' }, // C4
    { frequency: 293.66, durationMs: 300, volume: 0.24, wave: 'square' }, // D4
    { frequency: 329.63, durationMs: 300, volume: 0.24, wave: 'square' }, // E4
    { frequency: 329.63, durationMs: 450, volume: 0.24, wave: 'square' }, // E4 (dotted)
    { frequency: 293.66, durationMs: 150, volume: 0.24, wave: 'square' }, // D4
    { frequency: 293.66, durationMs: 600, volume: 0.24, wave: 'square' } // D4 (half)
  ]);
}

export function createCompletionBeepClip(): Buffer {
  // Joseph Haydn - Surprise Symphony (Public Domain)
  return makeClip([
    { frequency: 261.63, durationMs: 200, volume: 0.35, wave: 'sine' }, // C4
    { frequency: 261.63, durationMs: 200, volume: 0.35, wave: 'sine' }, // C4
    { frequency: 329.63, durationMs: 200, volume: 0.35, wave: 'sine' }, // E4
    { frequency: 329.63, durationMs: 200, volume: 0.35, wave: 'sine' }, // E4
    { frequency: 392.0, durationMs: 200, volume: 0.35, wave: 'sine' }, // G4
    { frequency: 392.0, durationMs: 200, volume: 0.35, wave: 'sine' }, // G4
    { frequency: 329.63, durationMs: 400, volume: 0.35, wave: 'sine' } // E4
  ]);
}

export function createResetBeepClip(): Buffer {
  return makeClip([{ frequency: 783.99, durationMs: 140, volume: 0.15, wave: 'sine' }]);
}

export const AUDIO_SAMPLE_RATE = SAMPLE_RATE;
