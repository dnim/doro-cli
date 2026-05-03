import { describe, expect, it } from '@jest/globals';
import {
  AUDIO_SAMPLE_RATE,
  createCompletionBeepClip,
  createResetBeepClip,
  createShortRestStartClip,
  createLongRestStartClip,
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

  it('creates valid short rest clip wav', () => {
    const buffer = createShortRestStartClip();
    validateWav(buffer);
    expect(buffer.length).toBeGreaterThan(44 + AUDIO_SAMPLE_RATE * 2);
  });

  it('creates valid long rest clip wav', () => {
    const buffer = createLongRestStartClip();
    validateWav(buffer);
    expect(buffer.length).toBeGreaterThan(44 + AUDIO_SAMPLE_RATE * 2);
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

  it('creates clips with different volume multipliers', () => {
    const buffer1 = createWorkStartClip(0.5);
    const buffer2 = createWorkStartClip(1.0);

    validateWav(buffer1);
    validateWav(buffer2);

    // Both should be valid but may have different characteristics
    expect(buffer1.length).toBeGreaterThan(44);
    expect(buffer2.length).toBeGreaterThan(44);
  });

  it('handles edge cases in synthesis', () => {
    // Test with very low volume
    const lowVolumeBuffer = createCompletionBeepClip(0.1);
    validateWav(lowVolumeBuffer);

    // Test with zero volume (edge case)
    const zeroVolumeBuffer = createCompletionBeepClip(0.0);
    validateWav(zeroVolumeBuffer);
  });
});
