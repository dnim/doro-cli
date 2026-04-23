import { describe, expect, it } from '@jest/globals';
import { TimerStateMachine } from '../stateMachine';

describe('TimerStateMachine', () => {
  it('starts in paused work mode', () => {
    const machine = new TimerStateMachine({
      workSeconds: 10,
      shortRestSeconds: 3,
      longRestSeconds: 6,
      longRestEveryWorkSessions: 3,
      switchConfirmSeconds: 5
    });

    const state = machine.getState();
    expect(state.mode).toBe('work');
    expect(state.status).toBe('paused');
    expect(state.remainingSeconds).toBe(10);
  });

  it('resets current mode and runs', () => {
    const machine = new TimerStateMachine({
      workSeconds: 10,
      shortRestSeconds: 3,
      longRestSeconds: 6,
      longRestEveryWorkSessions: 3,
      switchConfirmSeconds: 5
    });

    machine.startMode('short');
    machine.tick(Date.now());
    const result = machine.resetCurrentAndRun();
    expect(result.state.mode).toBe('short');
    expect(result.state.remainingSeconds).toBe(3);
    expect(result.state.status).toBe('running');
  });

  it('enters switch prompt when running timer reaches zero', () => {
    const machine = new TimerStateMachine({
      workSeconds: 2,
      shortRestSeconds: 3,
      longRestSeconds: 6,
      longRestEveryWorkSessions: 3,
      switchConfirmSeconds: 5
    });

    machine.startMode('work');
    machine.tick(1000);
    const result = machine.tick(2000);

    expect(result.startedPrompt).toBe(true);
    expect(result.completedMode).toBe('work');
    expect(result.state.status).toBe('switchPrompt');
    expect(result.state.switchPrompt?.nextMode).toBe('short');
    expect(result.state.completedWorkSessions).toBe(1);
  });

  it('switches to long rest every third completed work session', () => {
    const machine = new TimerStateMachine({
      workSeconds: 1,
      shortRestSeconds: 1,
      longRestSeconds: 2,
      longRestEveryWorkSessions: 3,
      switchConfirmSeconds: 5
    });

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
    expect(state.status).toBe('switchPrompt');
    expect(state.switchPrompt?.nextMode).toBe('long');
    expect(state.completedWorkSessions).toBe(3);
  });

  it('confirm switches immediately and runs', () => {
    const machine = new TimerStateMachine({
      workSeconds: 1,
      shortRestSeconds: 3,
      longRestSeconds: 6,
      longRestEveryWorkSessions: 3,
      switchConfirmSeconds: 5
    });

    machine.startMode('work');
    machine.tick(1000);
    const result = machine.confirmPromptAndSwitch();

    expect(result.switchedToMode).toBe('short');
    expect(result.state.mode).toBe('short');
    expect(result.state.status).toBe('running');
    expect(result.state.remainingSeconds).toBe(3);
  });

  it('auto-switches and pauses after prompt timeout', () => {
    const machine = new TimerStateMachine({
      workSeconds: 1,
      shortRestSeconds: 3,
      longRestSeconds: 6,
      longRestEveryWorkSessions: 3,
      switchConfirmSeconds: 2
    });

    machine.startMode('work');
    machine.tick(1000);
    const result = machine.tick(3000);

    expect(result.autoSwitchedPaused).toBe(true);
    expect(result.state.mode).toBe('short');
    expect(result.state.status).toBe('paused');
    expect(result.state.remainingSeconds).toBe(3);
  });
});
