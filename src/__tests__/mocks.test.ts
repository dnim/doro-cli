// Top-level vi.mock declarations (must be at module level for hoisting)
vi.mock('env-paths', () => ({
  default: vi.fn().mockReturnValue({ config: '/mock/config/path' })
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      rm: vi.fn()
    }
  }
}));

vi.mock('node:child_process', () => ({
  spawn: vi.fn()
}));

vi.mock('../stateMachine');
vi.mock('../ui');
vi.mock('../audio/player');
vi.mock('../audio/synth');
vi.mock('../constants');
vi.mock('../input');
vi.mock('../config');
vi.mock('../update');

import {
  createKeyEvent,
  createMockChildProcess,
  createMouseEvent,
  createResizeEvent,
  setupAllCommonMocks,
  setupFetchMock,
  setupInputMocks,
  setupProcessExitMock,
  setupTimerMocks
} from './utils/mocks';

import envPaths from 'env-paths';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { TimerStateMachine } from '../stateMachine';
import { DoroUi } from '../ui';
import { stopPlayback } from '../audio/player';
import { createWorkStartClip } from '../audio/synth';
import { DEFAULT_TIMER_CONFIG } from '../constants';
import { resolveControlCommand } from '../input';
import { loadSettings } from '../config';
import { getCurrentVersion } from '../update';

describe('test mock helpers', () => {
  const originalFetch = global.fetch;
  const originalExit = process.exit;
  const stdinDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin');
  const stdoutDescriptor = Object.getOwnPropertyDescriptor(process, 'stdout');

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();

    if (stdinDescriptor) {
      Object.defineProperty(process, 'stdin', stdinDescriptor);
    }

    if (stdoutDescriptor) {
      Object.defineProperty(process, 'stdout', stdoutDescriptor);
    }

    process.exit = originalExit;
    global.fetch = originalFetch;
  });

  it('mocks env-paths with a stable config directory', () => {
    expect(vi.isMockFunction(envPaths)).toBe(true);
    expect(envPaths('doro-cli')).toEqual({ config: '/mock/config/path' });
  });

  it('mocks fs and child process modules', () => {
    expect(vi.isMockFunction(fs.existsSync)).toBe(true);
    expect(vi.isMockFunction(fs.promises.readFile)).toBe(true);
    expect(vi.isMockFunction(fs.promises.writeFile)).toBe(true);
    expect(vi.isMockFunction(fs.promises.mkdir)).toBe(true);
    expect(vi.isMockFunction(fs.promises.rm)).toBe(true);
    expect(vi.isMockFunction(spawn)).toBe(true);
  });

  it('mocks fetch and process streams', () => {
    setupFetchMock();
    setupInputMocks();

    expect(vi.isMockFunction(global.fetch)).toBe(true);
    expect(vi.isMockFunction(process.stdin.setRawMode)).toBe(true);
    expect(vi.isMockFunction(process.stdin.resume)).toBe(true);
    expect(vi.isMockFunction(process.stdout.write)).toBe(true);
    expect(process.stdout.columns).toBe(80);
    expect(process.stdout.rows).toBe(24);
  });

  it('enables fake timers and prevents process exit', () => {
    const callback = vi.fn();

    setupTimerMocks();
    setTimeout(callback, 100);
    vi.advanceTimersByTime(100);

    const exitSpy = setupProcessExitMock();
    process.exit(0 as never);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it('sets up grouped audio and app mocks', () => {
    expect(vi.isMockFunction(fs.existsSync)).toBe(true);
    expect(vi.isMockFunction(spawn)).toBe(true);
    expect(vi.isMockFunction(TimerStateMachine)).toBe(true);
    expect(vi.isMockFunction(DoroUi)).toBe(true);
    expect(vi.isMockFunction(stopPlayback)).toBe(true);
    expect(vi.isMockFunction(createWorkStartClip)).toBe(true);
    expect(vi.isMockFunction(resolveControlCommand)).toBe(true);
    expect(vi.isMockFunction(loadSettings)).toBe(true);
    expect(vi.isMockFunction(getCurrentVersion)).toBe(true);
    expect(DEFAULT_TIMER_CONFIG).toBeDefined();
  });

  it('creates typed key, mouse, and resize events', () => {
    expect(createKeyEvent('U', 'u', 'S-u', true)).toEqual({
      type: 'key',
      ch: 'U',
      keyName: 'u',
      keyFull: 'S-u',
      shift: true,
      ctrl: false
    });
    expect(createMouseEvent()).toEqual({ type: 'mouse', source: 'mouse' });
    expect(createMouseEvent('click')).toEqual({ type: 'mouse', source: 'click' });
    expect(createResizeEvent()).toEqual({ type: 'resize' });
  });

  it('sets up the common helper bundle', () => {
    setupAllCommonMocks();

    expect(vi.isMockFunction(global.fetch)).toBe(true);
    expect(vi.isMockFunction(process.stdin.on)).toBe(true);
    expect(vi.isMockFunction(process.exit)).toBe(true);
  });

  it('creates a mock child process that emits close events', () => {
    setupTimerMocks();

    const child = createMockChildProcess(7);
    const closeCallback = vi.fn();

    child.on('close', closeCallback);
    vi.runAllTimers();

    expect(vi.isMockFunction(child.kill)).toBe(true);
    expect(closeCallback).toHaveBeenCalledWith(7, null);
    expect(child.killed).toBe(false);
  });
});
