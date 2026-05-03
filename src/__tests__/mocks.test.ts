import {
  createKeyEvent,
  createMockChildProcess,
  createMouseEvent,
  createResizeEvent,
  setupAllCommonMocks,
  setupAppMocks,
  setupAudioMocks,
  setupChildProcessMocks,
  setupEnvPathsMock,
  setupFetchMock,
  setupFsMocks,
  setupInputMocks,
  setupProcessExitMock,
  setupTimerMocks
} from './utils/mocks';

describe('test mock helpers', () => {
  const originalFetch = global.fetch;
  const originalExit = process.exit;
  const stdinDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin');
  const stdoutDescriptor = Object.getOwnPropertyDescriptor(process, 'stdout');

  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.unmock('env-paths');
    jest.unmock('node:fs');
    jest.unmock('node:child_process');
    jest.unmock('../stateMachine');
    jest.unmock('../ui');
    jest.unmock('../audio/player');
    jest.unmock('../audio/synth');
    jest.unmock('../constants');
    jest.unmock('../input');
    jest.unmock('../config');
    jest.unmock('../update');

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
    setupEnvPathsMock();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const envPathsModule = require('env-paths');
    const envPaths = envPathsModule.default ?? envPathsModule;

    expect(jest.isMockFunction(envPaths)).toBe(true);
    expect(envPaths('doro-cli')).toEqual({ config: '/mock/config/path' });
  });

  it('mocks fs and child process modules', () => {
    setupFsMocks();
    setupChildProcessMocks();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const childProcess = require('node:child_process');

    expect(jest.isMockFunction(fs.existsSync)).toBe(true);
    expect(jest.isMockFunction(fs.promises.readFile)).toBe(true);
    expect(jest.isMockFunction(fs.promises.writeFile)).toBe(true);
    expect(jest.isMockFunction(fs.promises.mkdir)).toBe(true);
    expect(jest.isMockFunction(fs.promises.rm)).toBe(true);
    expect(jest.isMockFunction(childProcess.spawn)).toBe(true);
  });

  it('mocks fetch and process streams', () => {
    setupFetchMock();
    setupInputMocks();

    expect(jest.isMockFunction(global.fetch)).toBe(true);
    expect(jest.isMockFunction(process.stdin.setRawMode)).toBe(true);
    expect(jest.isMockFunction(process.stdin.resume)).toBe(true);
    expect(jest.isMockFunction(process.stdout.write)).toBe(true);
    expect(process.stdout.columns).toBe(80);
    expect(process.stdout.rows).toBe(24);
  });

  it('enables fake timers and prevents process exit', () => {
    const callback = jest.fn();

    setupTimerMocks();
    setTimeout(callback, 100);
    jest.advanceTimersByTime(100);

    const exitSpy = setupProcessExitMock();
    process.exit(0 as never);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it('sets up grouped audio and app mocks', () => {
    setupAudioMocks();
    setupAppMocks();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const childProcess = require('node:child_process');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TimerStateMachine } = require('../stateMachine');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DoroUi } = require('../ui');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { stopPlayback } = require('../audio/player');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createWorkStartClip } = require('../audio/synth');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DEFAULT_TIMER_CONFIG } = require('../constants');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveControlCommand } = require('../input');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { loadSettings } = require('../config');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCurrentVersion } = require('../update');

    expect(jest.isMockFunction(fs.existsSync)).toBe(true);
    expect(jest.isMockFunction(childProcess.spawn)).toBe(true);
    expect(jest.isMockFunction(TimerStateMachine)).toBe(true);
    expect(jest.isMockFunction(DoroUi)).toBe(true);
    expect(jest.isMockFunction(stopPlayback)).toBe(true);
    expect(jest.isMockFunction(createWorkStartClip)).toBe(true);
    expect(jest.isMockFunction(resolveControlCommand)).toBe(true);
    expect(jest.isMockFunction(loadSettings)).toBe(true);
    expect(jest.isMockFunction(getCurrentVersion)).toBe(true);
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

    expect(jest.isMockFunction(global.fetch)).toBe(true);
    expect(jest.isMockFunction(process.stdin.on)).toBe(true);
    expect(jest.isMockFunction(process.exit)).toBe(true);
  });

  it('creates a mock child process that emits close events', () => {
    setupTimerMocks();

    const child = createMockChildProcess(7);
    const closeCallback = jest.fn();

    child.on('close', closeCallback);
    jest.runAllTimers();

    expect(jest.isMockFunction(child.kill)).toBe(true);
    expect(closeCallback).toHaveBeenCalledWith(7, null);
    expect(child.killed).toBe(false);
  });
});
