import { describe, expect, it } from '@jest/globals';
import {
  DEFAULT_TIMER_CONFIG,
  MODE_LABELS,
  MODE_LABELS_SHORT,
  getDurationForMode,
  getNextModeAfterCompletion,
  type TimerConfig
} from '../constants';

describe('constants', () => {
  const testConfig: TimerConfig = {
    workSeconds: 1500,
    shortRestSeconds: 300,
    longRestSeconds: 900,
    longRestEveryWorkSessions: 4,
    switchConfirmSeconds: 30
  };

  describe('getDurationForMode', () => {
    it('returns work duration for work mode', () => {
      expect(getDurationForMode(testConfig, 'work')).toBe(1500);
    });

    it('returns short rest duration for short mode', () => {
      expect(getDurationForMode(testConfig, 'short')).toBe(300);
    });

    it('returns long rest duration for long mode', () => {
      expect(getDurationForMode(testConfig, 'long')).toBe(900);
    });
  });

  describe('getNextModeAfterCompletion', () => {
    it('returns short rest after work when not at long rest interval', () => {
      expect(getNextModeAfterCompletion('work', 1, testConfig)).toBe('short');
      expect(getNextModeAfterCompletion('work', 2, testConfig)).toBe('short');
      expect(getNextModeAfterCompletion('work', 3, testConfig)).toBe('short');
    });

    it('returns long rest after work at long rest interval', () => {
      expect(getNextModeAfterCompletion('work', 4, testConfig)).toBe('long');
      expect(getNextModeAfterCompletion('work', 8, testConfig)).toBe('long');
    });

    it('returns work after any rest mode', () => {
      expect(getNextModeAfterCompletion('short', 1, testConfig)).toBe('work');
      expect(getNextModeAfterCompletion('long', 4, testConfig)).toBe('work');
    });
  });

  describe('constants', () => {
    it('has correct mode labels', () => {
      expect(MODE_LABELS.work).toBe('Work');
      expect(MODE_LABELS.short).toBe('Short Rest');
      expect(MODE_LABELS.long).toBe('Long Rest');
    });

    it('has correct short mode labels', () => {
      expect(MODE_LABELS_SHORT.work).toBe('Work');
      expect(MODE_LABELS_SHORT.short).toBe('Short');
      expect(MODE_LABELS_SHORT.long).toBe('Long');
    });

    it('has default timer config', () => {
      expect(DEFAULT_TIMER_CONFIG).toEqual({
        workSeconds: 22 * 60,
        shortRestSeconds: 5 * 60,
        longRestSeconds: 12 * 60,
        longRestEveryWorkSessions: 3,
        switchConfirmSeconds: 60
      });
    });
  });
});
