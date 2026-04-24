/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
import { DoroApp } from '../app';
import { TimerStateMachine } from '../stateMachine';
import { DoroUi } from '../ui';
import { stopPlayback } from '../audio/player';
import {
  createCompletionBeepClip,
  createResetBeepClip,
  createRestStartClip,
  createWorkStartClip
} from '../audio/synth';
import { getDurationForMode } from '../constants';
import { resolveControlCommand } from '../input';

// Mock dependencies
jest.mock('../stateMachine');
jest.mock('../ui');
jest.mock('../audio/player');
jest.mock('../audio/synth');
jest.mock('../constants');
jest.mock('../input');

// Mock `process.exit` to prevent tests from terminating the process
const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);

// Mock `setInterval` and `clearInterval`
jest.useFakeTimers();
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
      toggleColorScheme: jest.fn()
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
    (createRestStartClip as jest.Mock).mockReturnValue(Buffer.from('rest'));
    (createCompletionBeepClip as jest.Mock).mockReturnValue(Buffer.from('complete'));
    (createResetBeepClip as jest.Mock).mockReturnValue(Buffer.from('reset'));

    // Default mock implementations for methods
    mockTimerStateMachine.getState.mockReturnValue({
      mode: 'work',
      status: 'paused',
      remainingSeconds: 0,
      isLocked: false,
      switchPrompt: null,
      completedWorkSessions: 0
    });
    mockTimerStateMachine.getConfig.mockReturnValue({
      workSeconds: 25 * 60,
      shortRestSeconds: 5 * 60,
      longRestSeconds: 15 * 60,
      longRestEveryWorkSessions: 4,
      switchConfirmSeconds: 5
    });
    (getDurationForMode as jest.Mock).mockReturnValue(25 * 60); // Default duration

    mockTimerStateMachine.tick.mockReturnValue({
      state: {
        mode: 'work',
        status: 'running',
        remainingSeconds: 10,
        isLocked: false,
        switchPrompt: null,
        completedWorkSessions: 0
      },
      startedPrompt: false,
      switchedRunning: false,
      switchedToMode: null,
      completedMode: null
    });

    app = new DoroApp();
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
    expect(createRestStartClip).toHaveBeenCalledTimes(1);
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
      const sigintHandler = mockOn.mock.calls.find((call) => call[0] === 'SIGINT')![1] as Function;
      sigintHandler();
      expect(mockShutdown).toHaveBeenCalledTimes(1);

      mockOn.mockRestore();
    });
  });
});
