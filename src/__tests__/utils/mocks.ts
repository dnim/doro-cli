import type { InputEvent } from '../../input';

/**
 * Mock setup for external dependencies used across multiple tests.
 *
 * NOTE: vi.mock() calls must be declared at the TOP LEVEL of each test file
 * (not inside these helper functions) so Vitest can hoist them.
 * These helpers configure mock return values after the module mocks are in place.
 */

/**
 * Sets up global fetch mock for network requests (like update checks)
 */
export function setupFetchMock() {
  global.fetch = vi.fn();
}

/**
 * Sets up input-related mocks for simulating user interactions
 */
export function setupInputMocks() {
  // Mock process.stdin for input handling
  const mockStdin = {
    setRawMode: vi.fn(),
    resume: vi.fn(),
    pause: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn()
  };

  Object.defineProperty(process, 'stdin', {
    value: mockStdin,
    writable: true
  });

  // Mock process.stdout for terminal output
  const mockStdout = {
    write: vi.fn(),
    columns: 80,
    rows: 24
  };

  Object.defineProperty(process, 'stdout', {
    value: mockStdout,
    writable: true
  });
}

/**
 * Sets up timer mocks using Vitest's fake timers
 */
export function setupTimerMocks() {
  vi.useFakeTimers();
}

/**
 * Sets up process.exit mock to prevent tests from terminating
 */
export function setupProcessExitMock() {
  return vi.spyOn(process, 'exit').mockImplementation((() => {
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
  ch: string | undefined,
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
 * Comprehensive setup for all common mocks used across test files.
 * NOTE: Callers must declare the required vi.mock() calls at their file's top level.
 */
export function setupAllCommonMocks() {
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
    kill: vi.fn(),
    on: vi
      .fn()
      .mockImplementation((event: string, cb: (code: number, signal: string | null) => void) => {
        if (event === 'close') {
          setTimeout(() => cb(exitCode, null), 0);
        }
      }),
    killed: false
  };
}
