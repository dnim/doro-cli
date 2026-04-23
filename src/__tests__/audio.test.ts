import { describe, expect, it } from '@jest/globals';
import {
  AUDIO_SAMPLE_RATE,
  createCompletionBeepClip,
  createResetBeepClip,
  createRestStartClip,
  createWorkStartClip
} from '../audio/synth';

function validateWav(buffer: Buffer): void {
  expect(buffer.slice(0, 4).toString('ascii')).toBe('RIFF');
  expect(buffer.slice(8, 12).toString('ascii')).toBe('WAVE');
  expect(buffer.slice(12, 16).toString('ascii')).toBe('fmt ');
  expect(buffer.slice(36, 40).toString('ascii')).toBe('data');
  expect(buffer.readUInt32LE(24)).toBe(AUDIO_SAMPLE_RATE);
  const dataSize = buffer.readUInt32LE(40);
  expect(dataSize).toBe(buffer.length - 44);
}

describe('audio synth', () => {
  it('creates valid work clip wav', () => {
    const buffer = createWorkStartClip();
    validateWav(buffer);
    expect(buffer.length).toBeGreaterThan(44 + AUDIO_SAMPLE_RATE * 3);
  });

  it('creates valid rest clip wav', () => {
    const buffer = createRestStartClip();
    validateWav(buffer);
    expect(buffer.length).toBeGreaterThan(44 + AUDIO_SAMPLE_RATE * 3);
  });

  it('creates valid smooth completion beep wav', () => {
    const buffer = createCompletionBeepClip();
    validateWav(buffer);
    expect(buffer.length).toBeGreaterThan(44 + AUDIO_SAMPLE_RATE / 2);
  });

  it('creates valid short reset beep wav', () => {
    const buffer = createResetBeepClip();
    validateWav(buffer);
    expect(buffer.length).toBeGreaterThan(44 + AUDIO_SAMPLE_RATE / 10);
    expect(buffer.length).toBeLessThan(44 + AUDIO_SAMPLE_RATE / 3);
  });
});
