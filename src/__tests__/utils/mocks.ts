import type { InputEvent } from '../../input';

/**
 * Mock setup for external dependencies used across multiple tests
 */

/**
 * Sets up env-paths mock to return a consistent config path
 */
export function setupEnvPathsMock() {
  jest.mock('env-paths', () => {
    return jest.fn().mockReturnValue({
      config: '/mock/config/path'
    });
  });
}

/**
 * Sets up Node.js fs module mocks for file operations
 */
export function setupFsMocks() {
  jest.mock('node:fs', () => ({
    existsSync: jest.fn(),
    promises: {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      mkdir: jest.fn(),
      rm: jest.fn()
    }
  }));
}

/**
 * Sets up Node.js child_process module mocks for audio playback
 */
export function setupChildProcessMocks() {
  jest.mock('node:child_process', () => ({
    spawn: jest.fn()
  }));
}

/**
 * Sets up global fetch mock for network requests (like update checks)
 */
export function setupFetchMock() {
  global.fetch = jest.fn();
}

/**
 * Sets up comprehensive audio-related mocks including player and synthesizer modules
 */
export function setupAudioMocks() {
  // These mocks need to be set up before the modules are imported
  // So this is mainly for documentation - actual mocks should be at top level
  setupChildProcessMocks();
  setupFsMocks();
}

/**
 * Sets up mocks for core application modules
 * NOTE: These mocks need to be set up before imports, so should be called at top level
 */
export function setupAppMocks() {
  jest.mock('../../stateMachine');
  jest.mock('../../ui');
  jest.mock('../../audio/player');
  jest.mock('../../audio/synth');
  jest.mock('../../constants');
  jest.mock('../../input');
  jest.mock('../../config');
  jest.mock('../../update');
}

/**
 * Sets up input-related mocks for simulating user interactions
 */
export function setupInputMocks() {
  // Mock process.stdin for input handling
  const mockStdin = {
    setRawMode: jest.fn(),
    resume: jest.fn(),
    pause: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn()
  };

  Object.defineProperty(process, 'stdin', {
    value: mockStdin,
    writable: true
  });

  // Mock process.stdout for terminal output
  const mockStdout = {
    write: jest.fn(),
    columns: 80,
    rows: 24
  };

  Object.defineProperty(process, 'stdout', {
    value: mockStdout,
    writable: true
  });
}

/**
 * Sets up timer mocks using Jest's fake timers
 */
export function setupTimerMocks() {
  jest.useFakeTimers();
}

/**
 * Sets up process.exit mock to prevent tests from terminating
 */
export function setupProcessExitMock() {
  return jest.spyOn(process, 'exit').mockImplementation((() => {
    // Intentionally empty - prevents process.exit from terminating test runner
  }) as never);
}

/**
 * Creates a mock input event for keyboard testing
 * @param ch Character pressed
 * @param keyName Key name (e.g., 'space', 'enter')
 * @param keyFull Full key name including modifiers (e.g., 'S-d')
 * @param shift Whether shift was pressed
 * @param ctrl Whether ctrl was pressed
 * @returns InputEvent object
 */
export function createKeyEvent(
  ch: string,
  keyName: string,
  keyFull = keyName,
  shift = false,
  ctrl = false
): InputEvent {
  return {
    type: 'key',
    ch,
    keyName,
    keyFull,
    shift,
    ctrl
  };
}

/**
 * Creates a mock mouse event for mouse testing
 * @param source Mouse source (e.g., 'mouse', 'click', 'mousedown')
 * @returns InputEvent object
 */
export function createMouseEvent(source: 'mouse' | 'click' | 'mousedown' = 'mouse'): InputEvent {
  return {
    type: 'mouse',
    source
  };
}

/**
 * Creates a mock resize event for terminal resize testing
 * @returns InputEvent object
 */
export function createResizeEvent(): InputEvent {
  return {
    type: 'resize'
  };
}

/**
 * Comprehensive setup for all common mocks used across test files
 * Call this in beforeEach for tests that need multiple mock types
 */
export function setupAllCommonMocks() {
  setupEnvPathsMock();
  setupFsMocks();
  setupChildProcessMocks();
  setupFetchMock();
  setupTimerMocks();
  setupInputMocks();
  setupProcessExitMock();
}

/**
 * Helper to create a mock child process for audio player tests
 */
export function createMockChildProcess(exitCode = 0) {
  return {
    kill: jest.fn(),
    on: jest
      .fn()
      .mockImplementation((event: string, cb: (code: number, signal: string | null) => void) => {
        if (event === 'close') {
          setTimeout(() => cb(exitCode, null), 0);
        }
      }),
    killed: false
  };
}
