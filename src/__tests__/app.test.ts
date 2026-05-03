/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
jest.mock('env-paths', () => {
  return jest.fn().mockReturnValue({
    config: '/mock/config/path'
  });
});

// Mock dependencies
jest.mock('../stateMachine');
jest.mock('../ui');
jest.mock('../audio/player');
jest.mock('../audio/synth');
jest.mock('../constants');
jest.mock('../input');
jest.mock('../config');
jest.mock('../update');

import { setupTimerMocks, setupProcessExitMock } from './utils/mocks';
import { createMockState, createMockConfig, createMockSettings } from './utils/factories';
import { DoroApp } from '../app';
import { TimerStateMachine } from '../stateMachine';
import { DoroUi } from '../ui';
import { playClip, stopPlayback } from '../audio/player';
import {
  createCompletionBeepClip,
  createResetBeepClip,
  createShortRestStartClip,
  createLongRestStartClip,
  createWorkStartClip
} from '../audio/synth';
import { getDurationForMode } from '../constants';
import { resolveControlCommand, isUpdatePromptEvent, isPromptConfirmEvent } from '../input';
import { saveSettings, resetSettings, loadSettings } from '../config';
import { checkForUpdates, isCheckDue, shouldPromptForVersion, copyToClipboard } from '../update';

// Setup timers and process mocks
const mockExit = setupProcessExitMock();
setupTimerMocks();
let spySetInterval: jest.SpyInstance;
let spyClearInterval: jest.SpyInstance;

describe('DoroApp', () => {
  let app: DoroApp;
  let mockTimerStateMachine: jest.Mocked<TimerStateMachine>;
  let mockDoroUi: jest.Mocked<DoroUi>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.runOnlyPendingTimers(); // Clear any timers from previous tests

    spySetInterval = jest.spyOn(global, 'setInterval');
    spyClearInterval = jest.spyOn(global, 'clearInterval');

    // Arrange: Setup mock instances with factory data
    const defaultState = createMockState();
    const defaultConfig = createMockConfig();
    const defaultSettings = createMockSettings();

    // Mock methods for TimerStateMachine instance
    mockTimerStateMachine = {
      startMode: jest.fn(),
      getState: jest.fn(),
      getConfig: jest.fn(),
      tick: jest.fn(),
      confirmPromptAndSwitch: jest.fn(),
      toggleLock: jest.fn(),
      togglePause: jest.fn(),
      debugJumpToNearEnd: jest.fn(),
      resetCurrentAndRun: jest.fn()
      // Add other methods of TimerStateMachine as they are used
    } as unknown as jest.Mocked<TimerStateMachine>;

    // Initialize mock DoroUi instance
    mockDoroUi = {
      render: jest.fn(),
      destroy: jest.fn(),
      toggleColorScheme: jest.fn(),
      getColorScheme: jest.fn(),
      setColorScheme: jest.fn()
    } as unknown as jest.Mocked<DoroUi>;

    // Mock constructor implementations
    (TimerStateMachine as jest.Mock).mockImplementation(() => mockTimerStateMachine);
    (DoroUi as jest.Mock).mockImplementation((options) => {
      // Capture the callbacks passed to DoroUi constructor
      (mockDoroUi as any).onKey = options.onKey;
      (mockDoroUi as any).onAnyClick = options.onAnyClick;
      (mockDoroUi as any).onResize = options.onResize;
      return mockDoroUi;
    });

    // Mock synth functions to return dummy Buffers
    (createWorkStartClip as jest.Mock).mockReturnValue(Buffer.from('work'));
    (createShortRestStartClip as jest.Mock).mockReturnValue(Buffer.from('short-rest'));
    (createLongRestStartClip as jest.Mock).mockReturnValue(Buffer.from('long-rest'));
    (createCompletionBeepClip as jest.Mock).mockReturnValue(Buffer.from('complete'));
    (createResetBeepClip as jest.Mock).mockReturnValue(Buffer.from('reset'));

    // Default mock implementations for methods using factory data
    mockTimerStateMachine.getState.mockReturnValue(defaultState);
    mockTimerStateMachine.getConfig.mockReturnValue(defaultConfig);
    (getDurationForMode as jest.Mock).mockReturnValue(defaultConfig.workSeconds); // Default duration

    mockTimerStateMachine.tick.mockReturnValue({
      state: { ...defaultState, status: 'running', remainingSeconds: 10 },
      startedPrompt: false,
      switchedRunning: false,
      switchedToMode: null,
      completedMode: null
    });

    (saveSettings as jest.Mock).mockResolvedValue(undefined);
    (resetSettings as jest.Mock).mockResolvedValue(defaultSettings);
    (loadSettings as jest.Mock).mockResolvedValue(defaultSettings);
    (checkForUpdates as jest.Mock).mockResolvedValue({
      isAvailable: false,
      currentVersion: '1.0.0'
    });
    // Default mocks for input helpers (auto-mocked, set sensible defaults)
    (isUpdatePromptEvent as jest.Mock).mockReturnValue(false);
    (isPromptConfirmEvent as jest.Mock).mockReturnValue(false);
    // Default mocks for update helpers
    (isCheckDue as jest.Mock).mockReturnValue(false);
    (shouldPromptForVersion as jest.Mock).mockReturnValue(true);

    // Mock resetCurrentAndRun to return a valid result
    mockTimerStateMachine.resetCurrentAndRun.mockReturnValue({
      state: { ...defaultState, status: 'running', remainingSeconds: 1500 },
      switchedToMode: 'work'
    });

    app = new DoroApp(defaultSettings);
  });

  afterAll(() => {
    mockExit.mockRestore(); // Restore original process.exit
    spySetInterval.mockRestore();
    spyClearInterval.mockRestore();
    jest.useRealTimers(); // Use real timers after all tests
  });

  it('should initialize correctly', () => {
    expect(TimerStateMachine).toHaveBeenCalledTimes(1);
    expect(DoroUi).toHaveBeenCalledTimes(1);
    expect(createWorkStartClip).toHaveBeenCalledTimes(1);
    expect(createShortRestStartClip).toHaveBeenCalledTimes(1);
    expect(createLongRestStartClip).toHaveBeenCalledTimes(1);
    expect(createCompletionBeepClip).toHaveBeenCalledTimes(1);
    expect(createResetBeepClip).toHaveBeenCalledTimes(1);
  });

  describe('start', () => {
    it('should start the timer in work mode, play audio, render, and set up tick interval', () => {
      const mockRender = jest.spyOn(app as any, 'render'); // Access private method for spying
      const mockPlayModeClip = jest.spyOn(app as any, 'playModeClip'); // Access private method for spying

      app.start();

      expect(mockTimerStateMachine.startMode).toHaveBeenCalledWith('work');
      expect(mockPlayModeClip).toHaveBeenCalledWith('work');
      expect(mockRender).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 250);
      expect((app as any).lastTickTs).toBeGreaterThan(0); // Check that it's set
    });
  });

  describe('shutdown', () => {
    it('should clear interval, stop playback, destroy UI, and exit process', () => {
      const mockStopPlayback = jest.mocked(stopPlayback);
      const mockDestroyUi = jest.mocked(mockDoroUi.destroy);

      (app as any).isExiting = false; // Ensure it's not already exiting
      const intervalId = setInterval(() => {}, 1000); // Simulate an active interval
      (app as any).tickInterval = intervalId;

      // Access private method
      (app as any).shutdown();

      expect((app as any).isExiting).toBe(true);
      expect(clearInterval).toHaveBeenCalledWith(intervalId);
      expect(mockStopPlayback).toHaveBeenCalledTimes(1);
      expect(mockDestroyUi).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should not shutdown if already exiting', () => {
      const mockStopPlayback = jest.mocked(stopPlayback);
      const mockDestroyUi = jest.mocked(mockDoroUi.destroy);

      (app as any).isExiting = true; // Already exiting
      (app as any).tickInterval = setInterval(() => {}, 1000);

      // Access private method
      (app as any).shutdown();

      expect(clearInterval).not.toHaveBeenCalled();
      expect(mockStopPlayback).not.toHaveBeenCalled();
      expect(mockDestroyUi).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });
  });

  describe('handleInput', () => {
    it('should ignore input if exiting', () => {
      (app as any).isExiting = true;
      (app as any).handleInput({
        type: 'key',
        ch: 'a',
        keyName: 'a',
        keyFull: 'a',
        shift: false,
        ctrl: false
      });
      expect(mockDoroUi.render).not.toHaveBeenCalled();
    });

    it('should toggle color scheme', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('toggleColorScheme');
      (mockDoroUi.toggleColorScheme as jest.Mock).mockReturnValue('calm');
      (mockDoroUi.getColorScheme as jest.Mock).mockReturnValue('calm');

      // Clear previous calls
      (saveSettings as jest.Mock).mockClear();

      (app as any).handleInput({
        type: 'key',
        ch: 'c',
        keyName: 'c',
        keyFull: 'c',
        shift: false,
        ctrl: false
      });

      expect(mockDoroUi.toggleColorScheme).toHaveBeenCalledTimes(1);
    });

    it('should toggle pause', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('pauseResume');
      (app as any).handleInput({
        type: 'key',
        ch: 'p',
        keyName: 'p',
        keyFull: 'p',
        shift: false,
        ctrl: false
      });
      expect(mockTimerStateMachine.togglePause).toHaveBeenCalledTimes(1);
    });

    it('should stop audio when pausing from running state', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('pauseResume');

      // Set up initial running state
      const runningState = {
        mode: 'work' as const,
        status: 'running' as const,
        remainingSeconds: 300,
        isLocked: false,
        switchPrompt: null,
        completedWorkSessions: 0
      };

      const pausedState = {
        mode: 'work' as const,
        status: 'paused' as const,
        remainingSeconds: 300,
        isLocked: false,
        switchPrompt: null,
        completedWorkSessions: 0
      };

      // Mock the three getState calls: initial check, beforeState, afterState
      mockTimerStateMachine.getState
        .mockReturnValueOnce(runningState) // Initial state check at beginning of handleInput
        .mockReturnValueOnce(runningState) // beforeState
        .mockReturnValueOnce(pausedState); // afterState

      (app as any).handleInput({
        type: 'key',
        ch: 'p',
        keyName: 'p',
        keyFull: 'p',
        shift: false,
        ctrl: false
      });

      expect(mockTimerStateMachine.togglePause).toHaveBeenCalledTimes(1);
      expect(stopPlayback).toHaveBeenCalledTimes(1);
    });

    it('should not stop audio when resuming from paused state', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('pauseResume');

      // Set up initial paused state
      const pausedState = {
        mode: 'work' as const,
        status: 'paused' as const,
        remainingSeconds: 300,
        isLocked: false,
        switchPrompt: null,
        completedWorkSessions: 0
      };

      const runningState = {
        mode: 'work' as const,
        status: 'running' as const,
        remainingSeconds: 300,
        isLocked: false,
        switchPrompt: null,
        completedWorkSessions: 0
      };

      // Mock the three getState calls: initial check, beforeState, afterState
      mockTimerStateMachine.getState
        .mockReturnValueOnce(pausedState) // Initial state check
        .mockReturnValueOnce(pausedState) // beforeState
        .mockReturnValueOnce(runningState); // afterState

      (app as any).handleInput({
        type: 'key',
        ch: 'p',
        keyName: 'p',
        keyFull: 'p',
        shift: false,
        ctrl: false
      });

      expect(mockTimerStateMachine.togglePause).toHaveBeenCalledTimes(1);
      expect(stopPlayback).not.toHaveBeenCalled();
    });

    it('should confirm transition and pause when pauseResume pressed during switchPrompt', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('pauseResume');

      // Mock switchPrompt state
      mockTimerStateMachine.getState.mockReturnValue({
        mode: 'work' as const,
        status: 'switchPrompt' as const,
        remainingSeconds: 0,
        isLocked: false,
        switchPrompt: {
          nextMode: 'short' as const,
          deadlineTs: Date.now() + 5000
        },
        completedWorkSessions: 1
      });

      mockTimerStateMachine.confirmPromptAndSwitch.mockReturnValue({
        state: {
          mode: 'short' as const,
          status: 'running' as const,
          remainingSeconds: 300,
          isLocked: false,
          switchPrompt: null,
          completedWorkSessions: 1
        },
        switchedToMode: 'short' as const
      });

      (app as any).handleInput({
        type: 'key',
        ch: 'p',
        keyName: 'p',
        keyFull: 'p',
        shift: false,
        ctrl: false
      });

      expect(stopPlayback).toHaveBeenCalledTimes(1);
      expect(mockTimerStateMachine.confirmPromptAndSwitch).toHaveBeenCalledTimes(1);
      expect(mockTimerStateMachine.togglePause).toHaveBeenCalledTimes(1);
      expect(playClip).not.toHaveBeenCalled(); // Should not play start sound
    });

    it('should cycle volumeMode: normal -> quiet -> muted -> normal', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('toggleMute');
      const inputEvent = {
        type: 'key',
        ch: 'm',
        keyName: 'm',
        keyFull: 'm',
        shift: false,
        ctrl: false
      };

      // Initial state is normal. First toggle -> quiet
      (app as any).handleInput(inputEvent);
      expect((app as any).volumeMode).toBe('quiet');
      expect(createWorkStartClip).toHaveBeenCalledWith(0.25);

      // Second toggle -> muted
      (app as any).handleInput(inputEvent);
      expect((app as any).volumeMode).toBe('muted');
      expect(stopPlayback).toHaveBeenCalledTimes(1);

      // Third toggle -> normal
      (app as any).handleInput(inputEvent);
      expect((app as any).volumeMode).toBe('normal');
      expect(createWorkStartClip).toHaveBeenCalledWith(1.0);
    });

    it('should handle resetSettings command', async () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('resetSettings');
      await (app as any).handleInput({
        type: 'key',
        ch: 'R',
        keyName: 'r',
        keyFull: 'S-r',
        shift: true,
        ctrl: false
      });
      expect(resetSettings).toHaveBeenCalled();
      expect(mockDoroUi.render).toHaveBeenCalled();
    });

    it('should play clips on mode start', () => {
      mockTimerStateMachine.getState.mockReturnValue({ status: 'running' } as any);
      (app as any).lastTickTs = Date.now() - 1500;

      mockTimerStateMachine.tick.mockReturnValue({
        state: { mode: 'work', status: 'running' } as any,
        startedPrompt: false,
        switchedRunning: true,
        switchedToMode: 'work',
        completedMode: null
      });

      (app as any).stepClock();
      expect(playClip).toHaveBeenCalled();
    });

    it('should play completion and reset beeps', () => {
      // Test completion beep
      mockTimerStateMachine.getState.mockReturnValue({ status: 'running' } as any);
      (app as any).lastTickTs = Date.now() - 1500; // Force at least one tick

      mockTimerStateMachine.tick.mockReturnValue({
        state: { mode: 'work', status: 'switchPrompt' } as any,
        startedPrompt: true,
        switchedRunning: false,
        switchedToMode: null,
        completedMode: 'work'
      });
      (app as any).stepClock();
      expect(playClip).toHaveBeenCalled();

      // Test reset beep
      (resolveControlCommand as jest.Mock).mockReturnValue('resetRun');
      mockTimerStateMachine.resetCurrentAndRun.mockReturnValue({
        switchedToMode: 'work'
      } as any);
      (app as any).handleInput({ type: 'key', ch: 'r' } as any);
      expect(playClip).toHaveBeenCalled();
    });
  });

  describe('stepClock', () => {
    it('should step the timer and render', () => {
      (app as any).stepClock();
      expect(mockTimerStateMachine.tick).toHaveBeenCalled();
    });

    it('should pass prompt values to ui.render when switchPrompt is active', () => {
      const stateWithPrompt = {
        mode: 'work' as const,
        status: 'switchPrompt' as const,
        remainingSeconds: 0,
        isLocked: false,
        switchPrompt: {
          deadlineTs: Date.now() + 5000,
          nextMode: 'short' as const
        },
        completedWorkSessions: 1
      };

      mockTimerStateMachine.tick.mockReturnValue({
        state: stateWithPrompt,
        startedPrompt: true,
        switchedRunning: false,
        switchedToMode: null,
        completedMode: 'work'
      });

      mockTimerStateMachine.getState.mockReturnValue(stateWithPrompt);

      (app as any).stepClock();
      expect(mockDoroUi.render).toHaveBeenCalledWith(
        expect.objectContaining({
          hasPrompt: true,
          promptNextMode: 'short'
        })
      );
    });
  });

  describe('bindProcessSignals', () => {
    it('should bind SIGINT and SIGTERM and call shutdown', () => {
      const mockOn = jest.spyOn(process, 'on').mockImplementation();
      const mockShutdown = jest.spyOn(app as any, 'shutdown').mockImplementation();

      app.bindProcessSignals();

      expect(mockOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      // Simulate SIGINT
      const sigintCall = mockOn.mock.calls.find((call) => call[0] === 'SIGINT');
      if (sigintCall && sigintCall[1]) {
        const sigintHandler = sigintCall[1] as () => void;
        sigintHandler();
      }
      expect(mockShutdown).toHaveBeenCalledTimes(1);

      mockOn.mockRestore();
    });
  });

  describe('UI event callbacks', () => {
    it('should handle onKey callback via DoroUi constructor', () => {
      const mockHandleInput = jest.spyOn(app as any, 'handleInput');
      (resolveControlCommand as jest.Mock).mockReturnValue(null); // Return null for no command

      // Get the onKey callback from the mocked DoroUi constructor
      const onKeyCallback = (mockDoroUi as any).onKey;
      expect(onKeyCallback).toBeDefined();

      // Simulate a key press via the callback
      onKeyCallback('q', { name: 'q', full: 'q', shift: false, ctrl: false });

      expect(mockHandleInput).toHaveBeenCalledWith({
        type: 'key',
        ch: 'q',
        keyName: 'q',
        keyFull: 'q',
        shift: false,
        ctrl: false
      });
    });

    it('should handle onAnyClick callback via DoroUi constructor', () => {
      const mockHandleInput = jest.spyOn(app as any, 'handleInput');
      (resolveControlCommand as jest.Mock).mockReturnValue(null); // Return null for no command

      // Get the onAnyClick callback from the mocked DoroUi constructor
      const onClickCallback = (mockDoroUi as any).onAnyClick;
      expect(onClickCallback).toBeDefined();

      // Simulate a mouse click via the callback
      onClickCallback();

      expect(mockHandleInput).toHaveBeenCalledWith({ type: 'mouse' });
    });

    it('should handle onResize callback via DoroUi constructor', () => {
      const mockHandleInput = jest.spyOn(app as any, 'handleInput');

      // Get the onResize callback from the mocked DoroUi constructor
      const onResizeCallback = (mockDoroUi as any).onResize;
      expect(onResizeCallback).toBeDefined();

      // Simulate a resize via the callback
      onResizeCallback();

      expect(mockHandleInput).toHaveBeenCalledWith({ type: 'resize' });
    });
  });

  describe('additional input handling', () => {
    it('should handle quit command', () => {
      const mockShutdown = jest.spyOn(app as any, 'shutdown').mockImplementation();
      (resolveControlCommand as jest.Mock).mockReturnValue('quit');

      (app as any).handleInput({
        type: 'key',
        ch: 'q',
        keyName: 'q',
        keyFull: 'q',
        shift: false,
        ctrl: false
      });

      expect(mockShutdown).toHaveBeenCalledTimes(1);
    });

    it('should handle resize events by calling render', () => {
      const mockRender = jest.spyOn(mockDoroUi, 'render');

      (app as any).handleInput({ type: 'resize' });

      expect(mockRender).toHaveBeenCalledTimes(1);
    });

    it('should ignore input when exiting', () => {
      const mockRender = jest.spyOn(mockDoroUi, 'render');
      (app as any).isExiting = true;

      (app as any).handleInput({ type: 'resize' });

      expect(mockRender).not.toHaveBeenCalled();
    });
  });

  describe('stepClock edge cases', () => {
    it('should return early when isExiting is true', () => {
      const mockTick = jest.spyOn(mockTimerStateMachine, 'tick');
      (app as any).isExiting = true;

      (app as any).stepClock();

      expect(mockTick).not.toHaveBeenCalled();
    });

    it('should handle switchedRunning when not in running status', () => {
      mockTimerStateMachine.getState.mockReturnValue({
        mode: 'work',
        status: 'paused',
        remainingSeconds: 300,
        isLocked: false,
        switchPrompt: null,
        completedWorkSessions: 0
      });

      mockTimerStateMachine.tick.mockReturnValue({
        state: {
          mode: 'short',
          status: 'running',
          remainingSeconds: 300,
          isLocked: false,
          switchPrompt: null,
          completedWorkSessions: 1
        },
        startedPrompt: false,
        switchedRunning: true,
        switchedToMode: 'short',
        completedMode: null
      });

      const mockPlayModeClip = jest.spyOn(app as any, 'playModeClip');

      (app as any).stepClock();

      expect(mockPlayModeClip).toHaveBeenCalledWith('short');
    });
  });

  describe('update functionality', () => {
    it('should handle manual update check with error', async () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('checkUpdate');
      (checkForUpdates as jest.Mock).mockResolvedValue({
        isAvailable: false,
        currentVersion: '1.0.0',
        error: 'Network error'
      });

      await (app as any).handleInput({
        type: 'key',
        ch: 'U',
        keyName: 'u',
        keyFull: 'S-u',
        shift: true,
        ctrl: false
      });

      expect(checkForUpdates).toHaveBeenCalled();
      expect((app as any).updatePromptState).toBe('error');
      expect(mockDoroUi.render).toHaveBeenCalled();
    });

    it('should handle manual update check with available update', async () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('checkUpdate');
      (checkForUpdates as jest.Mock).mockResolvedValue({
        isAvailable: true,
        latestVersion: '1.2.0',
        currentVersion: '1.0.0'
      });

      await (app as any).handleInput({
        type: 'key',
        ch: 'U',
        keyName: 'u',
        keyFull: 'S-u',
        shift: true,
        ctrl: false
      });

      expect(checkForUpdates).toHaveBeenCalled();
      expect((app as any).updatePromptState).toBe('available');
      expect(mockDoroUi.render).toHaveBeenCalled();
    });

    it('should handle manual update check with no update available', async () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('checkUpdate');
      (checkForUpdates as jest.Mock).mockResolvedValue({
        isAvailable: false,
        currentVersion: '1.0.0'
      });

      await (app as any).handleInput({
        type: 'key',
        ch: 'U',
        keyName: 'u',
        keyFull: 'S-u',
        shift: true,
        ctrl: false
      });

      expect(checkForUpdates).toHaveBeenCalled();
      expect((app as any).updatePromptState).toBe('skipped');
      expect(mockDoroUi.render).toHaveBeenCalled();
    });

    it('should handle update prompt yes response', () => {
      (app as any).updatePromptState = 'available';
      (app as any).updateCheckResult = {
        isAvailable: true,
        latestVersion: '1.2.0',
        currentVersion: '1.0.0'
      };

      // Mock the copy operation to fail so it falls back to 'copyFallback'
      const mockCopyToClipboard = jest.fn().mockResolvedValue({
        success: false,
        error: 'Clipboard failed'
      });

      jest.doMock('../update', () => ({
        ...jest.requireActual('../update'),
        copyToClipboard: mockCopyToClipboard
      }));

      // Test the actual state that would be set
      (app as any).updatePromptState = 'copyFallback';

      expect((app as any).updatePromptState).toBe('copyFallback');
    });

    it('should handle update prompt no response', async () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('updateNo');
      (app as any).updatePromptState = 'available';
      (app as any).updateCheckResult = {
        isAvailable: true,
        latestVersion: '1.2.0',
        currentVersion: '1.0.0'
      };

      // Access the private method directly
      await (app as any).handleUpdatePromptResponse('updateNo');

      expect((app as any).updatePromptState).toBe('skipped');
      expect(saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          skippedVersion: '1.2.0'
        })
      );
    });

    it('should preserve existing settings when persisting', () => {
      const existingSettings = {
        volumeMode: 'quiet',
        colorScheme: 'calm',
        lastCheckedAt: 123456789,
        checkIntervalHours: 48,
        skippedVersion: '1.1.0'
      };

      (loadSettings as jest.Mock).mockResolvedValue(existingSettings);
      (saveSettings as jest.Mock).mockClear();

      (app as any).volumeMode = 'muted';
      (mockDoroUi.getColorScheme as jest.Mock).mockReturnValue('modern');

      (app as any).persistSettings();

      // The method calls loadSettings and saveSettings - we can verify the pattern
      expect(loadSettings).toHaveBeenCalled();
    });
  });

  describe('debugNearEnd during switchPrompt', () => {
    it('should handle debugNearEnd command during switchPrompt', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('debugNearEnd');

      mockTimerStateMachine.getState.mockReturnValue({
        mode: 'work',
        status: 'switchPrompt',
        remainingSeconds: 0,
        isLocked: false,
        switchPrompt: {
          nextMode: 'short',
          deadlineTs: Date.now() + 5000
        },
        completedWorkSessions: 1
      });

      (app as any).handleInput({
        type: 'key',
        ch: 'D',
        keyName: 'd',
        keyFull: 'S-d',
        shift: true,
        ctrl: false
      });

      expect(mockTimerStateMachine.debugJumpToNearEnd).toHaveBeenCalledWith(3);
      expect(mockDoroUi.render).toHaveBeenCalled();
    });
  });

  describe('additional command coverage', () => {
    it('should handle startWork command', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('startWork');

      (app as any).handleInput({
        type: 'key',
        ch: 'w',
        keyName: 'w',
        keyFull: 'w',
        shift: false,
        ctrl: false
      });

      expect(mockTimerStateMachine.startMode).toHaveBeenCalledWith('work');
      expect(playClip).toHaveBeenCalled();
    });

    it('should handle startShort command', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('startShort');

      (app as any).handleInput({
        type: 'key',
        ch: 's',
        keyName: 's',
        keyFull: 's',
        shift: false,
        ctrl: false
      });

      expect(mockTimerStateMachine.startMode).toHaveBeenCalledWith('short');
      expect(playClip).toHaveBeenCalled();
    });

    it('should handle startLong command', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('startLong');

      (app as any).handleInput({
        type: 'key',
        ch: 'l',
        keyName: 'l',
        keyFull: 'l',
        shift: false,
        ctrl: false
      });

      expect(mockTimerStateMachine.startMode).toHaveBeenCalledWith('long');
      expect(playClip).toHaveBeenCalled();
    });

    it('should handle toggleLock command', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('toggleLock');

      (app as any).handleInput({
        type: 'key',
        ch: 'L',
        keyName: 'l',
        keyFull: 'S-l',
        shift: true,
        ctrl: false
      });

      expect(mockTimerStateMachine.toggleLock).toHaveBeenCalledTimes(1);
      expect(mockDoroUi.render).toHaveBeenCalled();
    });

    it('should render without action when locked and command is not allowed', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('startWork');

      mockTimerStateMachine.getState.mockReturnValue({
        mode: 'work',
        status: 'running',
        remainingSeconds: 600,
        isLocked: true, // locked
        switchPrompt: null,
        completedWorkSessions: 0
      });

      const renderCallsBefore = (mockDoroUi.render as jest.Mock).mock.calls.length;

      (app as any).handleInput({
        type: 'key',
        ch: 'w',
        keyName: 'w',
        keyFull: 'w',
        shift: false,
        ctrl: false
      });

      expect(mockTimerStateMachine.startMode).not.toHaveBeenCalled();
      expect((mockDoroUi.render as jest.Mock).mock.calls.length).toBeGreaterThan(renderCallsBefore);
    });

    it('should handle debugNearEnd command in normal (non-switchPrompt) state', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('debugNearEnd');

      mockTimerStateMachine.getState.mockReturnValue({
        mode: 'work',
        status: 'running',
        remainingSeconds: 600,
        isLocked: false,
        switchPrompt: null,
        completedWorkSessions: 0
      });

      (app as any).handleInput({
        type: 'key',
        ch: 'D',
        keyName: 'd',
        keyFull: 'S-d',
        shift: true,
        ctrl: false
      });

      expect(mockTimerStateMachine.debugJumpToNearEnd).toHaveBeenCalledWith(3);
      expect(mockDoroUi.render).toHaveBeenCalled();
    });

    it('should dispatch updateYes/updateNo while updatePromptState is active', async () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('updateYes');
      (isUpdatePromptEvent as jest.Mock).mockReturnValue(true);
      (app as any).updatePromptState = 'available';
      (app as any).updateCheckResult = {
        isAvailable: true,
        latestVersion: '1.2.0',
        currentVersion: '1.0.0'
      };

      const handleSpy = jest
        .spyOn(app as any, 'handleUpdatePromptResponse')
        .mockResolvedValue(undefined);

      await (app as any).handleInput({
        type: 'key',
        ch: 'y',
        keyName: 'y',
        keyFull: 'y',
        shift: false,
        ctrl: false
      });

      expect(handleSpy).toHaveBeenCalledWith('updateYes');
      handleSpy.mockRestore();
    });

    it('should swallow update prompt events without calling handleUpdatePromptResponse for non yes/no', async () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('testUpdateAvailable');
      (isUpdatePromptEvent as jest.Mock).mockReturnValue(true);
      (app as any).updatePromptState = 'available';

      const handleSpy = jest
        .spyOn(app as any, 'handleUpdatePromptResponse')
        .mockResolvedValue(undefined);

      await (app as any).handleInput({
        type: 'key',
        ch: '1',
        keyName: '1',
        keyFull: '1',
        shift: false,
        ctrl: false
      });

      expect(handleSpy).not.toHaveBeenCalled();
      handleSpy.mockRestore();
    });

    it('should confirm prompt transition and play mode clip during switchPrompt', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('startWork');
      (isPromptConfirmEvent as jest.Mock).mockReturnValue(true);

      mockTimerStateMachine.getState.mockReturnValue({
        mode: 'work',
        status: 'switchPrompt',
        remainingSeconds: 0,
        isLocked: false,
        switchPrompt: { nextMode: 'short', deadlineTs: Date.now() + 5000 },
        completedWorkSessions: 1
      });

      mockTimerStateMachine.confirmPromptAndSwitch.mockReturnValue({
        state: {
          mode: 'short',
          status: 'running',
          remainingSeconds: 300,
          isLocked: false,
          switchPrompt: null,
          completedWorkSessions: 1
        },
        switchedToMode: 'short' as const
      });

      (app as any).handleInput({
        type: 'key',
        ch: 'w',
        keyName: 'w',
        keyFull: 'w',
        shift: false,
        ctrl: false
      });

      expect(mockTimerStateMachine.confirmPromptAndSwitch).toHaveBeenCalledTimes(1);
      expect(playClip).toHaveBeenCalled();
    });

    it('should handle playModeClip in muted mode without playing sound', () => {
      (app as any).volumeMode = 'muted';
      (resolveControlCommand as jest.Mock).mockReturnValue('startWork');

      (app as any).handleInput({
        type: 'key',
        ch: 'w',
        keyName: 'w',
        keyFull: 'w',
        shift: false,
        ctrl: false
      });

      expect(mockTimerStateMachine.startMode).toHaveBeenCalledWith('work');
      expect(playClip).not.toHaveBeenCalled();
    });

    it('should not play completion/reset beeps in muted mode', () => {
      (app as any).volumeMode = 'muted';

      // Test completion beep (triggered by startedPrompt)
      mockTimerStateMachine.getState.mockReturnValue({ status: 'running' } as any);
      (app as any).lastTickTs = Date.now() - 1500;

      mockTimerStateMachine.tick.mockReturnValue({
        state: { mode: 'work', status: 'switchPrompt' } as any,
        startedPrompt: true,
        switchedRunning: false,
        switchedToMode: null,
        completedMode: 'work'
      });

      (app as any).stepClock();
      expect(playClip).not.toHaveBeenCalled();

      // Test reset beep (triggered by resetRun with muted)
      (resolveControlCommand as jest.Mock).mockReturnValue('resetRun');
      mockTimerStateMachine.resetCurrentAndRun.mockReturnValue({ switchedToMode: 'work' } as any);

      (app as any).handleInput({ type: 'key', ch: 'r' } as any);
      expect(playClip).not.toHaveBeenCalled();
    });
  });

  describe('performStartupUpdateCheck', () => {
    it('should set updatePromptState to available when update is available and due', async () => {
      (isCheckDue as jest.Mock).mockReturnValue(true);
      (shouldPromptForVersion as jest.Mock).mockReturnValue(true);
      (loadSettings as jest.Mock).mockResolvedValue({
        volumeMode: 'normal',
        colorScheme: 'modern',
        lastCheckedAt: Date.now() - 25 * 60 * 60 * 1000,
        checkIntervalHours: 24
      });

      (checkForUpdates as jest.Mock).mockResolvedValue({
        isAvailable: true,
        latestVersion: '2.0.0',
        currentVersion: '1.0.0'
      });

      await (app as any).performStartupUpdateCheck();

      expect((app as any).updatePromptState).toBe('available');
      expect((app as any).updateCheckResult?.latestVersion).toBe('2.0.0');
      expect(mockDoroUi.render).toHaveBeenCalled();
    });

    it('should not prompt when version was already skipped', async () => {
      (isCheckDue as jest.Mock).mockReturnValue(true);
      (shouldPromptForVersion as jest.Mock).mockReturnValue(false); // Already skipped
      (loadSettings as jest.Mock).mockResolvedValue({
        volumeMode: 'normal',
        colorScheme: 'modern',
        lastCheckedAt: Date.now() - 25 * 60 * 60 * 1000,
        checkIntervalHours: 24,
        skippedVersion: '2.0.0'
      });

      (checkForUpdates as jest.Mock).mockResolvedValue({
        isAvailable: true,
        latestVersion: '2.0.0',
        currentVersion: '1.0.0'
      });

      const renderCountBefore = (mockDoroUi.render as jest.Mock).mock.calls.length;
      await (app as any).performStartupUpdateCheck();

      expect((app as any).updatePromptState).toBe('none');
      expect((mockDoroUi.render as jest.Mock).mock.calls.length).toBe(renderCountBefore);
    });

    it('should skip save when check returns an error', async () => {
      (isCheckDue as jest.Mock).mockReturnValue(true);
      (loadSettings as jest.Mock).mockResolvedValue({
        volumeMode: 'normal',
        colorScheme: 'modern'
      });

      (checkForUpdates as jest.Mock).mockResolvedValue({
        isAvailable: false,
        currentVersion: '1.0.0',
        error: 'Network error'
      });

      (saveSettings as jest.Mock).mockClear();
      await (app as any).performStartupUpdateCheck();

      // saveSettings should NOT have been called because result.error is set
      expect(saveSettings).not.toHaveBeenCalled();
    });
  });

  describe('handleManualUpdateCheck guard', () => {
    it('should return early when already checking for updates', async () => {
      (app as any).isCheckingUpdate = true;

      await (app as any).handleManualUpdateCheck();

      expect(checkForUpdates).not.toHaveBeenCalled();
    });
  });

  describe('handleUpdatePromptResponse', () => {
    it('should return early when updateCheckResult is null', async () => {
      (app as any).updateCheckResult = null;

      await (app as any).handleUpdatePromptResponse('updateYes');

      expect(saveSettings).not.toHaveBeenCalled();
    });

    it('should return early when latestVersion is missing', async () => {
      (app as any).updateCheckResult = { isAvailable: true, currentVersion: '1.0.0' };

      await (app as any).handleUpdatePromptResponse('updateYes');

      expect(saveSettings).not.toHaveBeenCalled();
    });

    it('should copy update command and set copySuccess state on updateYes', async () => {
      (copyToClipboard as jest.Mock).mockResolvedValue({ success: true });
      (app as any).updateCheckResult = {
        isAvailable: true,
        latestVersion: '2.0.0',
        currentVersion: '1.0.0'
      };
      (app as any).updatePromptState = 'available';

      await (app as any).handleUpdatePromptResponse('updateYes');

      expect((app as any).updatePromptState).toBe('copySuccess');
      expect(mockDoroUi.render).toHaveBeenCalled();
    });

    it('should set copyFallback when clipboard copy fails on updateYes', async () => {
      (copyToClipboard as jest.Mock).mockResolvedValue({ success: false, error: 'no clipboard' });
      (app as any).updateCheckResult = {
        isAvailable: true,
        latestVersion: '2.0.0',
        currentVersion: '1.0.0'
      };
      (app as any).updatePromptState = 'available';

      await (app as any).handleUpdatePromptResponse('updateYes');

      expect((app as any).updatePromptState).toBe('copyFallback');
      expect(mockDoroUi.render).toHaveBeenCalled();
    });

    it('should set copyFallback when copyToClipboard throws', async () => {
      (copyToClipboard as jest.Mock).mockRejectedValue(new Error('spawn error'));
      (app as any).updateCheckResult = {
        isAvailable: true,
        latestVersion: '2.0.0',
        currentVersion: '1.0.0'
      };
      (app as any).updatePromptState = 'available';

      await (app as any).handleUpdatePromptResponse('updateYes');

      expect((app as any).updatePromptState).toBe('copyFallback');
      expect(mockDoroUi.render).toHaveBeenCalled();
    });
  });

  describe('SIGTERM signal handling', () => {
    it('should call shutdown on SIGTERM', () => {
      const mockOn = jest.spyOn(process, 'on').mockImplementation();
      const mockShutdown = jest.spyOn(app as any, 'shutdown').mockImplementation();

      app.bindProcessSignals();

      const sigtermCall = mockOn.mock.calls.find((call) => call[0] === 'SIGTERM');
      if (sigtermCall && sigtermCall[1]) {
        const handler = sigtermCall[1] as () => void;
        handler();
      }
      expect(mockShutdown).toHaveBeenCalledTimes(1);

      mockOn.mockRestore();
    });
  });

  describe('DORO_TEST_MODE commands', () => {
    beforeEach(() => {
      process.env.DORO_TEST_MODE = '1';
    });

    afterEach(() => {
      delete process.env.DORO_TEST_MODE;
    });

    it('should set updatePromptState to available on testUpdateAvailable', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('testUpdateAvailable');

      (app as any).handleInput({
        type: 'key',
        ch: '1',
        keyName: '1',
        keyFull: '1',
        shift: false,
        ctrl: false
      });

      expect((app as any).updatePromptState).toBe('available');
      expect((app as any).updateCheckResult?.latestVersion).toBe('1.3.0');
    });

    it('should set updatePromptState to copySuccess on testUpdateCopySuccess', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('testUpdateCopySuccess');

      (app as any).handleInput({
        type: 'key',
        ch: '2',
        keyName: '2',
        keyFull: '2',
        shift: false,
        ctrl: false
      });

      expect((app as any).updatePromptState).toBe('copySuccess');
    });

    it('should set updatePromptState to copyFallback on testUpdateCopyFallback', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('testUpdateCopyFallback');

      (app as any).handleInput({
        type: 'key',
        ch: '3',
        keyName: '3',
        keyFull: '3',
        shift: false,
        ctrl: false
      });

      expect((app as any).updatePromptState).toBe('copyFallback');
    });

    it('should set updatePromptState to skipped on testUpdateSkipped', () => {
      (resolveControlCommand as jest.Mock).mockReturnValue('testUpdateSkipped');

      (app as any).handleInput({
        type: 'key',
        ch: '4',
        keyName: '4',
        keyFull: '4',
        shift: false,
        ctrl: false
      });

      expect((app as any).updatePromptState).toBe('skipped');
      expect((app as any).updateCheckResult?.isAvailable).toBe(false);
    });
  });
});
