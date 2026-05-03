import { describe, expect, it } from '@jest/globals';
import { TimerStateMachine } from '../stateMachine';
import { createQuickTestConfig } from './utils/factories';

describe('TimerStateMachine', () => {
  it('starts in paused work mode', () => {
    // Arrange
    const config = createQuickTestConfig();
    const machine = new TimerStateMachine(config);
    // Act
    const state = machine.getState();

    // Assert
    expect(state.mode).toBe('work');
    expect(state.status).toBe('paused');
    expect(state.remainingSeconds).toBe(10);
  });

  it('resets current mode and runs', () => {
    // Arrange
    const config = createQuickTestConfig();
    const machine = new TimerStateMachine(config);

    // Act
    machine.startMode('short');
    machine.tick(Date.now());
    const result = machine.resetCurrentAndRun();

    // Assert
    expect(result.state.mode).toBe('short');
    expect(result.state.remainingSeconds).toBe(3);
    expect(result.state.status).toBe('running');
  });

  it('enters switch prompt when running timer reaches zero', () => {
    // Arrange
    const config = createQuickTestConfig({ workSeconds: 2 });
    const machine = new TimerStateMachine(config);

    // Act
    machine.startMode('work');
    machine.tick(1000);
    const result = machine.tick(2000);

    // Assert
    expect(result.startedPrompt).toBe(true);
    expect(result.completedMode).toBe('work');
    expect(result.state.status).toBe('switchPrompt');
    expect(result.state.switchPrompt?.nextMode).toBe('short');
    expect(result.state.completedWorkSessions).toBe(1);
  });

  it('switches to long rest every third completed work session', () => {
    // Arrange
    const config = createQuickTestConfig({
      workSeconds: 1,
      shortRestSeconds: 1,
      longRestSeconds: 2
    });
    const machine = new TimerStateMachine(config);

    // Act
    machine.startMode('work');

    machine.tick(1000);
    machine.confirmPromptAndSwitch();
    machine.tick(2000);
    machine.confirmPromptAndSwitch();

    machine.tick(3000);
    machine.confirmPromptAndSwitch();
    machine.tick(4000);
    machine.confirmPromptAndSwitch();

    machine.tick(5000);
    const state = machine.getState();

    // Assert
    expect(state.status).toBe('switchPrompt');
    expect(state.switchPrompt?.nextMode).toBe('long');
    expect(state.completedWorkSessions).toBe(3);
  });

  it('confirm switches immediately and runs', () => {
    // Arrange
    const config = createQuickTestConfig({ workSeconds: 1 });
    const machine = new TimerStateMachine(config);

    // Act
    machine.startMode('work');
    machine.tick(1000);
    const result = machine.confirmPromptAndSwitch();

    // Assert
    expect(result.switchedToMode).toBe('short');
    expect(result.state.mode).toBe('short');
    expect(result.state.status).toBe('running');
    expect(result.state.remainingSeconds).toBe(3);
  });

  it('auto-switches and starts next mode after prompt timeout', () => {
    // Arrange
    const config = createQuickTestConfig({
      workSeconds: 1,
      switchConfirmSeconds: 2
    });
    const machine = new TimerStateMachine(config);

    // Act
    machine.startMode('work');
    machine.tick(1000);
    const result = machine.tick(3000);

    // Assert
    expect(result.switchedRunning).toBe(true);
    expect(result.switchedToMode).toBe('short');
    expect(result.state.mode).toBe('short');
    expect(result.state.status).toBe('running');
    expect(result.state.remainingSeconds).toBe(3);
  });

  it('debug jump pushes running timer to 3 seconds', () => {
    // Arrange
    const config = createQuickTestConfig();
    const machine = new TimerStateMachine(config);

    // Act
    machine.startMode('work');
    const state = machine.debugJumpToNearEnd(3);

    // Assert
    expect(state.status).toBe('running');
    expect(state.remainingSeconds).toBe(3);
  });

  it('debug jump does nothing while paused', () => {
    // Arrange
    const config = createQuickTestConfig();
    const machine = new TimerStateMachine(config);

    // Act
    const before = machine.getState();
    const after = machine.debugJumpToNearEnd(3);

    // Assert
    expect(after.status).toBe('paused');
    expect(after.remainingSeconds).toBe(before.remainingSeconds);
  });

  it('debug jump during switch prompt shortens confirm window', () => {
    // Arrange
    const config = createQuickTestConfig({
      workSeconds: 2,
      switchConfirmSeconds: 60
    });
    const machine = new TimerStateMachine(config);

    // Act
    machine.startMode('work');
    machine.tick(1000);
    machine.tick(2000);
    const before = machine.getState();
    expect(before.status).toBe('switchPrompt');

    const after = machine.debugJumpToNearEnd(3);

    // Assert
    expect(after.status).toBe('switchPrompt');
    expect(after.switchPrompt).not.toBeNull();
    const remainingMs = (after.switchPrompt as { deadlineTs: number }).deadlineTs - Date.now();
    expect(remainingMs).toBeLessThanOrEqual(3000);
    expect(remainingMs).toBeGreaterThan(0);
  });

  describe('toggleLock', () => {
    it('toggles isLocked state', () => {
      // Arrange
      const config = createQuickTestConfig();
      const machine = new TimerStateMachine(config);

      // Act & Assert
      const initialState = machine.getState();
      expect(initialState.isLocked).toBe(false);

      const lockedState = machine.toggleLock();
      expect(lockedState.isLocked).toBe(true);

      const unlockedState = machine.toggleLock();
      expect(unlockedState.isLocked).toBe(false);
    });
  });

  describe('togglePause', () => {
    it('toggles between running and paused states', () => {
      // Arrange
      const config = createQuickTestConfig();
      const machine = new TimerStateMachine(config);

      // Act & Assert
      machine.startMode('work');
      const runningState = machine.getState();
      expect(runningState.status).toBe('running');

      const pausedState = machine.togglePause();
      expect(pausedState.status).toBe('paused');

      const resumedState = machine.togglePause();
      expect(resumedState.status).toBe('running');
    });

    it('does nothing when in switchPrompt status', () => {
      // Arrange
      const config = createQuickTestConfig({ workSeconds: 1 });
      const machine = new TimerStateMachine(config);

      // Act
      machine.startMode('work');
      machine.tick(1000); // Complete work, enter switchPrompt

      const beforeState = machine.getState();
      expect(beforeState.status).toBe('switchPrompt');

      const afterState = machine.togglePause();

      // Assert
      expect(afterState.status).toBe('switchPrompt');
    });
  });

  describe('forceQuitState', () => {
    it('returns current state without modification', () => {
      // Arrange
      const config = createQuickTestConfig();
      const machine = new TimerStateMachine(config);

      // Act
      const beforeState = machine.getState();
      const afterState = machine.forceQuitState();

      // Assert
      expect(afterState).toEqual(beforeState);
      expect(afterState.mode).toBe('work');
      expect(afterState.status).toBe('paused');
    });
  });

  describe('getConfig', () => {
    it('returns the timer configuration', () => {
      // Arrange
      const config = createQuickTestConfig({
        workSeconds: 15,
        shortRestSeconds: 4,
        longRestSeconds: 8,
        longRestEveryWorkSessions: 2,
        switchConfirmSeconds: 3
      });

      // Act
      const machine = new TimerStateMachine(config);
      const returnedConfig = machine.getConfig();

      // Assert
      expect(returnedConfig).toEqual(config);
    });
  });

  describe('tick edge cases', () => {
    it('returns unchanged state when not running and not in switchPrompt', () => {
      // Arrange
      const config = createQuickTestConfig();
      const machine = new TimerStateMachine(config);

      // Act (Machine starts paused)
      const result = machine.tick(Date.now());

      // Assert
      expect(result.startedPrompt).toBe(false);
      expect(result.switchedRunning).toBe(false);
      expect(result.switchedToMode).toBeNull();
      expect(result.completedMode).toBeNull();
      expect(result.state.status).toBe('paused');
    });

    it('returns unchanged state when in switchPrompt but deadline not reached', () => {
      // Arrange
      const config = createQuickTestConfig({
        workSeconds: 1,
        switchConfirmSeconds: 60 // Long timeout
      });
      const machine = new TimerStateMachine(config);

      // Act
      machine.startMode('work');
      const firstTick = machine.tick(1000); // Complete work, enter switchPrompt
      expect(firstTick.state.status).toBe('switchPrompt');

      // Tick slightly ahead but before the 60-second deadline
      // Deadline will be 1000 + 60*1000 = 61000, so tick at 2000 is safe
      const result = machine.tick(2000);

      // Assert
      expect(result.startedPrompt).toBe(false);
      expect(result.switchedRunning).toBe(false);
      expect(result.switchedToMode).toBeNull();
      expect(result.completedMode).toBeNull();
      expect(result.state.status).toBe('switchPrompt');
    });
  });

  describe('confirmPromptAndSwitch edge cases', () => {
    it('returns null switchedToMode when no prompt exists', () => {
      // Arrange
      const config = createQuickTestConfig();
      const machine = new TimerStateMachine(config);

      // Act (No switchPrompt active)
      const result = machine.confirmPromptAndSwitch();

      // Assert
      expect(result.switchedToMode).toBeNull();
      expect(result.state.status).toBe('paused');
    });
  });
});
