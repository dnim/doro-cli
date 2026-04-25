import type blessed from 'blessed';
import {
  createCompletionBeepClip,
  createResetBeepClip,
  createShortRestStartClip,
  createLongRestStartClip,
  createWorkStartClip
} from './audio/synth';
import { playClip, stopPlayback } from './audio/player';
import { getDurationForMode } from './constants';
import {
  isAllowedWhenLocked,
  isPromptConfirmEvent,
  resolveControlCommand,
  type InputEvent
} from './input';
import { debugLog, isDebugEnabled } from './logger';
import { TimerStateMachine } from './stateMachine';
import { DoroUi } from './ui';

export class DoroApp {
  private readonly machine: TimerStateMachine;

  private readonly ui: DoroUi;

  private workStartClip: Buffer;

  private shortRestStartClip: Buffer;

  private longRestStartClip: Buffer;

  private completionBeepClip: Buffer;

  private resetBeepClip: Buffer;

  private isExiting = false;

  private volumeMode: 'normal' | 'quiet' | 'muted' = 'normal';

  private tickInterval: NodeJS.Timeout | null = null;

  private lastTickTs = Date.now();

  /** Measures event-loop drift for the debug overlay. */
  private lastTickDriftMs = 0;

  public constructor() {
    this.machine = new TimerStateMachine();
    this.workStartClip = createWorkStartClip();
    this.shortRestStartClip = createShortRestStartClip();
    this.longRestStartClip = createLongRestStartClip();
    this.completionBeepClip = createCompletionBeepClip();
    this.resetBeepClip = createResetBeepClip();

    this.ui = new DoroUi({
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
    debugLog('app', 'started', { mode: 'work' });
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
    // Track event-loop drift: how far setInterval is from its 250ms target.
    if (isDebugEnabled) {
      this.lastTickDriftMs = Math.abs(now - this.lastTickTs - 250);
    }
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
            debugLog('state', 'prompt started', { mode: state.mode });
            this.playCompletionBeep();
          }

          if (result.switchedRunning && result.switchedToMode) {
            debugLog('state', 'auto-switched', { to: result.switchedToMode });
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

      if (result.switchedRunning && result.switchedToMode) {
        debugLog('state', 'auto-switched (non-running)', { to: result.switchedToMode });
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

    if (command === 'quit') {
      this.shutdown();
      return;
    }

    const state = this.machine.getState();

    if (state.status === 'switchPrompt') {
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
      if (this.volumeMode === 'normal') {
        this.volumeMode = 'quiet';
      } else if (this.volumeMode === 'quiet') {
        this.volumeMode = 'muted';
      } else {
        this.volumeMode = 'normal';
      }

      if (this.volumeMode === 'muted') {
        stopPlayback();
      } else {
        const mult = this.volumeMode === 'quiet' ? 0.25 : 1.0;
        this.workStartClip = createWorkStartClip(mult);
        this.shortRestStartClip = createShortRestStartClip(mult);
        this.longRestStartClip = createLongRestStartClip(mult);
        this.completionBeepClip = createCompletionBeepClip(mult);
        this.resetBeepClip = createResetBeepClip(mult);
      }

      this.render();
      return;
    }

    if (command === 'toggleDebugOverlay') {
      this.ui.toggleDebugOverlay();
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

  private playModeClip(mode: 'work' | 'short' | 'long'): void {
    if (this.volumeMode === 'muted') {
      return;
    }

    let clip = this.workStartClip;
    if (mode === 'short') {
      clip = this.shortRestStartClip;
    } else if (mode === 'long') {
      clip = this.longRestStartClip;
    }

    void playClip(clip);
  }

  private playCompletionBeep(): void {
    if (this.volumeMode === 'muted') {
      return;
    }

    void playClip(this.completionBeepClip);
  }

  private playResetBeep(): void {
    if (this.volumeMode === 'muted') {
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
      promptCountdownSeconds = Math.max(
        0,
        Math.ceil((state.switchPrompt.deadlineTs - Date.now()) / 1000)
      );
      promptTotalSeconds = this.machine.getConfig().switchConfirmSeconds;
      promptNextMode = state.switchPrompt.nextMode;
    }

    this.ui.render({
      mode: state.mode,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      durationSeconds: duration,
      isLocked: state.isLocked,
      volumeMode: this.volumeMode,
      hasPrompt: Boolean(state.switchPrompt),
      promptCountdownSeconds,
      promptTotalSeconds,
      promptNextMode
    });

    // Debug overlay — additive, completely decoupled from main render.
    if (isDebugEnabled) {
      const mem = process.memoryUsage();
      this.ui.renderDebugOverlay({
        rssBytes: mem.rss,
        heapUsedBytes: mem.heapUsed,
        tickDriftMs: this.lastTickDriftMs,
        renderSkips: this.ui.getRenderSkipCount()
      });
    }
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
