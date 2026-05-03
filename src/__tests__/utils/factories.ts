import type { TimerState } from '../../stateMachine';
import type { TimerConfig } from '../../constants';
import type { Settings } from '../../config';
import { DEFAULT_TIMER_CONFIG } from '../../constants';

/**
 * Creates a mock TimerState object for testing purposes.
 * @param overrides Partial state properties to override defaults
 * @returns A complete TimerState object
 */
export function createMockState(overrides?: Partial<TimerState>): TimerState {
  return {
    mode: 'work',
    status: 'paused',
    remainingSeconds: 1320, // 22 minutes default work time
    isLocked: false,
    completedWorkSessions: 0,
    switchPrompt: null,
    ...overrides
  };
}

/**
 * Creates a mock TimerConfig object for testing purposes.
 * @param overrides Partial config properties to override defaults
 * @returns A complete TimerConfig object
 */
export function createMockConfig(overrides?: Partial<TimerConfig>): TimerConfig {
  return {
    ...DEFAULT_TIMER_CONFIG,
    ...overrides
  };
}

/**
 * Creates a mock Settings object for testing purposes.
 * @param overrides Partial settings properties to override defaults
 * @returns A complete Settings object
 */
export function createMockSettings(overrides?: Partial<Settings>): Settings {
  return {
    volumeMode: 'normal',
    colorScheme: 'modern',
    checkIntervalHours: 24,
    ...overrides
  };
}

/**
 * Creates a simple TimerConfig for quick testing (shorter durations).
 * @param overrides Partial config properties to override defaults
 * @returns A complete TimerConfig object with short durations
 */
export function createQuickTestConfig(overrides?: Partial<TimerConfig>): TimerConfig {
  return {
    workSeconds: 10,
    shortRestSeconds: 3,
    longRestSeconds: 6,
    longRestEveryWorkSessions: 3,
    switchConfirmSeconds: 5,
    ...overrides
  };
}
