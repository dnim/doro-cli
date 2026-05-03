export type TimerMode = 'work' | 'short' | 'long';

export type TimerStatus = 'running' | 'paused' | 'switchPrompt';

export type TimerConfig = {
  workSeconds: number;
  shortRestSeconds: number;
  longRestSeconds: number;
  longRestEveryWorkSessions: number;
  switchConfirmSeconds: number;
};

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  workSeconds: 22 * 60,
  shortRestSeconds: 5 * 60,
  longRestSeconds: 12 * 60,
  longRestEveryWorkSessions: 3,
  switchConfirmSeconds: 60
};

export const MODE_LABELS: Record<TimerMode, string> = {
  work: 'Work',
  short: 'Short Rest',
  long: 'Long Rest'
};

export const MODE_LABELS_SHORT: Record<TimerMode, string> = {
  work: 'Work',
  short: 'Short',
  long: 'Long'
};

export function getDurationForMode(config: TimerConfig, mode: TimerMode): number {
  if (mode === 'work') {
    return config.workSeconds;
  }

  if (mode === 'short') {
    return config.shortRestSeconds;
  }

  return config.longRestSeconds;
}

export function getNextModeAfterCompletion(
  mode: TimerMode,
  completedWorkSessions: number,
  config: TimerConfig
): TimerMode {
  if (mode === 'work') {
    return completedWorkSessions % config.longRestEveryWorkSessions === 0 ? 'long' : 'short';
  }

  return 'work';
}
// Test comment
