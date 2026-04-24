import { appendFile } from 'node:fs/promises';
import type blessed from 'blessed';
import { createCompletionBeepClip, createResetBeepClip, createRestStartClip, createWorkStartClip } from './audio/synth';
import { playClip, stopPlayback } from './audio/player';
import { getDurationForMode } from './constants';
import { isAllowedWhenLocked, isPromptConfirmEvent, resolveControlCommand, type InputEvent } from './input';
import { TimerStateMachine } from './stateMachine';
import { PapadoroUi } from './ui';

export class PapadoroApp {
  private readonly debugInputEnabled: boolean;

  private readonly machine: TimerStateMachine;

  private readonly ui: PapadoroUi;

  private readonly workStartClip: Buffer;

  private readonly restStartClip: Buffer;

  private readonly completionBeepClip: Buffer;

  private readonly resetBeepClip: Buffer;

  private isExiting = false;

  private isMuted = false;

  private tickInterval: NodeJS.Timeout | null = null;

  private lastTickTs = Date.now();

  public constructor() {
    this.debugInputEnabled = process.env.PAPADORO_DEBUG_INPUT === '1';
    this.machine = new TimerStateMachine();
    this.workStartClip = createWorkStartClip();
    this.restStartClip = createRestStartClip();
    this.completionBeepClip = createCompletionBeepClip();
    this.resetBeepClip = createResetBeepClip();

    this.ui = new PapadoroUi({
      onKey: (ch, key) => {
        this.handleInput({
          type: 'key',
          ch,
          keyName: key.name ?? '',
          keyFull: key.full ?? '',
          shift: Boolean(key.shift),
          ctrl: Boolean(key.ctrl)
        });
      },
      onAnyClick: () => {
        this.handleInput({ type: 'mouse' });
      },
      onResize: () => {
        this.handleInput({ type: 'resize' });
      }
    });
  }

  public start(): void {
    this.machine.startMode('work');
    this.playModeClip('work');
    this.lastTickTs = Date.now();
    this.render();

    this.tickInterval = setInterval(() => {
      this.stepClock();
    }, 250);
  }

  private stepClock(): void {
    if (this.isExiting) {
      return;
    }

    const now = Date.now();
    let state = this.machine.getState();

    if (state.status === 'running') {
      const elapsedSeconds = Math.floor((now - this.lastTickTs) / 1000);
      if (elapsedSeconds > 0) {
        for (let i = 0; i < elapsedSeconds; i += 1) {
          const tickAt = this.lastTickTs + 1000;
          const result = this.machine.tick(tickAt);
          this.lastTickTs = tickAt;
          state = result.state;

          if (result.startedPrompt) {
            this.playCompletionBeep();
          }

          if (result.switchedRunning && result.switchedToMode) {
            this.playModeClip(result.switchedToMode);
          }

          if (state.status !== 'running') {
            break;
          }
        }
      }
    } else {
      this.lastTickTs = now;
      const result = this.machine.tick(now);
      state = result.state;

      if (result.switchedRunning && result.switchedToMode) {
        this.playModeClip(result.switchedToMode);
      }
    }

    this.render();
  }

  private handleInput(event: InputEvent): void {
    if (this.isExiting) {
      return;
    }

    if (event.type === 'resize') {
      this.render();
      return;
    }

    const command = resolveControlCommand(event);
    this.debugInput(event, command, 'received');

    if (command === 'quit') {
      this.shutdown();
      return;
    }

    const state = this.machine.getState();

    if (state.status === 'switchPrompt') {
      this.debugInput(event, command, 'switchPrompt');
      if (command === 'debugNearEnd') {
        this.machine.debugJumpToNearEnd(3);
        this.render();
        return;
      }
      if (isPromptConfirmEvent(event, command)) {
        const result = this.machine.confirmPromptAndSwitch();
        if (result.switchedToMode) {
          this.playModeClip(result.switchedToMode);
        }
      }

      this.render();
      return;
    }

    if (state.isLocked && !isAllowedWhenLocked(command)) {
      this.render();
      return;
    }

    if (command === 'toggleLock') {
      this.machine.toggleLock();
      this.render();
      return;
    }

    if (command === 'pauseResume') {
      this.machine.togglePause();
      this.lastTickTs = Date.now();
      this.render();
      return;
    }

    if (command === 'toggleColorScheme') {
      this.ui.toggleColorScheme();
      this.render();
      return;
    }

    if (command === 'toggleMute') {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        stopPlayback();
      }
      this.render();
      return;
    }

    if (command === 'debugNearEnd') {
      this.machine.debugJumpToNearEnd(3);
      this.render();
      return;
    }

    if (command === 'resetRun') {
      const result = this.machine.resetCurrentAndRun();
      if (result.switchedToMode) {
        this.playResetBeep();
      }
      this.lastTickTs = Date.now();
      this.render();
      return;
    }

    if (command === 'startWork') {
      this.machine.startMode('work');
      this.playModeClip('work');
      this.lastTickTs = Date.now();
      this.render();
      return;
    }

    if (command === 'startShort') {
      this.machine.startMode('short');
      this.playModeClip('short');
      this.lastTickTs = Date.now();
      this.render();
      return;
    }

    if (command === 'startLong') {
      this.machine.startMode('long');
      this.playModeClip('long');
      this.lastTickTs = Date.now();
      this.render();
      return;
    }

    this.render();
  }

  private debugInput(event: InputEvent, command: string, stage: string): void {
    if (!this.debugInputEnabled) {
      return;
    }

    const state = this.machine.getState();
    const eventLabel = event.type === 'mouse' ? `mouse:${event.source ?? 'unknown'}` : event.type;
    const line = `${new Date().toISOString()} stage=${stage} event=${eventLabel} command=${command} status=${state.status} prompt=${state.switchPrompt ? 'on' : 'off'}\n`;
    void appendFile('/tmp/papadoro-input.log', line, { encoding: 'utf8' });
  }

  private playModeClip(mode: 'work' | 'short' | 'long'): void {
    if (this.isMuted) {
      return;
    }

    const clip = mode === 'work' ? this.workStartClip : this.restStartClip;
    void playClip(clip);
  }

  private playCompletionBeep(): void {
    if (this.isMuted) {
      return;
    }

    void playClip(this.completionBeepClip);
  }

  private playResetBeep(): void {
    if (this.isMuted) {
      return;
    }

    void playClip(this.resetBeepClip);
  }

  private render(): void {
    const state = this.machine.getState();
    const config = this.machine.getConfig();
    const duration = getDurationForMode(config, state.mode);

    let promptCountdownSeconds = 0;
    let promptTotalSeconds = 0;
    let promptNextMode: 'work' | 'short' | 'long' | null = null;
    if (state.switchPrompt) {
      promptCountdownSeconds = Math.max(0, Math.ceil((state.switchPrompt.deadlineTs - Date.now()) / 1000));
      promptTotalSeconds = this.machine.getConfig().switchConfirmSeconds;
      promptNextMode = state.switchPrompt.nextMode;
    }

    this.ui.render({
      mode: state.mode,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      durationSeconds: duration,
      isLocked: state.isLocked,
      isMuted: this.isMuted,
      hasPrompt: Boolean(state.switchPrompt),
      promptCountdownSeconds,
      promptTotalSeconds,
      promptNextMode
    });
  }

  private shutdown(): void {
    if (this.isExiting) {
      return;
    }

    this.isExiting = true;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    stopPlayback();
    this.ui.destroy();
    process.exit(0);
  }

  public bindProcessSignals(): void {
    process.on('SIGINT', () => {
      this.shutdown();
    });
    process.on('SIGTERM', () => {
      this.shutdown();
    });
  }
}

export type KeyArg = blessed.Widgets.Events.IKeyEventArg;
