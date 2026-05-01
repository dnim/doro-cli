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
  isUpdatePromptEvent,
  resolveControlCommand,
  type InputEvent
} from './input';
import { TimerStateMachine } from './stateMachine';
import { DoroUi } from './ui';
import { type Settings, saveSettings, resetSettings, loadSettings } from './config';
import {
  checkForUpdates,
  copyToClipboard,
  getUpdateCommand,
  isCheckDue,
  shouldPromptForVersion,
  type UpdateCheckResult
} from './update';

export type UpdatePromptState = 'none' | 'available' | 'copySuccess' | 'copyFallback' | 'skipped';

export class DoroApp {
  private readonly machine: TimerStateMachine;

  private readonly ui: DoroUi;

  private workStartClip: Buffer;

  private shortRestStartClip: Buffer;

  private longRestStartClip: Buffer;

  private completionBeepClip: Buffer;

  private resetBeepClip: Buffer;

  private isExiting = false;

  private volumeMode: 'normal' | 'quiet' | 'muted';

  private tickInterval: NodeJS.Timeout | null = null;

  private lastTickTs = Date.now();

  // Update-related state
  private updatePromptState: UpdatePromptState = 'none';

  private updateCheckResult: UpdateCheckResult | null = null;

  private isCheckingUpdate = false;

  public constructor(initialSettings: Settings) {
    this.machine = new TimerStateMachine();
    this.volumeMode = initialSettings.volumeMode;

    const mult = this.volumeMode === 'quiet' ? 0.25 : 1.0;
    this.workStartClip = createWorkStartClip(mult);
    this.shortRestStartClip = createShortRestStartClip(mult);
    this.longRestStartClip = createLongRestStartClip(mult);
    this.completionBeepClip = createCompletionBeepClip(mult);
    this.resetBeepClip = createResetBeepClip(mult);

    this.ui = new DoroUi(
      {
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
      },
      initialSettings.colorScheme
    );
  }

  public start(): void {
    this.machine.startMode('work');
    this.playModeClip('work');
    this.lastTickTs = Date.now();
    this.render();

    this.tickInterval = setInterval(() => {
      this.stepClock();
    }, 250);

    // Start non-blocking update check
    void this.performStartupUpdateCheck();
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

    if (command === 'quit') {
      this.shutdown();
      return;
    }

    // Handle update prompt responses with priority
    if (this.updatePromptState !== 'none' && isUpdatePromptEvent(command)) {
      if (command === 'updateYes' || command === 'updateNo') {
        void this.handleUpdatePromptResponse(command);
      }
      return;
    }

    if (command === 'checkUpdate') {
      void this.handleManualUpdateCheck();
      return;
    }

    const state = this.machine.getState();

    if (state.status === 'switchPrompt') {
      if (command === 'debugNearEnd') {
        this.machine.debugJumpToNearEnd(3);
        this.render();
        return;
      }

      if (command === 'pauseResume') {
        // Special case: confirm transition but leave paused, no start sound
        stopPlayback(); // Stop any current audio
        const result = this.machine.confirmPromptAndSwitch();
        if (result.switchedToMode) {
          // Immediately pause the new mode without playing start sound
          this.machine.togglePause();
        }
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
      const beforeState = this.machine.getState();
      this.machine.togglePause();
      const afterState = this.machine.getState();

      // Stop audio if transitioning from running to paused
      if (beforeState.status === 'running' && afterState.status === 'paused') {
        stopPlayback();
      }

      this.lastTickTs = Date.now();
      this.render();
      return;
    }

    if (command === 'toggleColorScheme') {
      this.ui.toggleColorScheme();
      this.persistSettings();
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

      this.persistSettings();
      this.render();
      return;
    }

    if (command === 'resetSettings') {
      void this.handleResetSettings();
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
      promptNextMode,
      updatePromptState: this.updatePromptState,
      updateCheckResult: this.updateCheckResult
    });
  }

  private persistSettings(): void {
    void saveSettings({
      volumeMode: this.volumeMode,
      colorScheme: this.ui.getColorScheme()
    });
  }

  private async handleResetSettings(): Promise<void> {
    const settings = await resetSettings();
    this.volumeMode = settings.volumeMode;
    const mult = this.volumeMode === 'quiet' ? 0.25 : 1.0;
    this.workStartClip = createWorkStartClip(mult);
    this.shortRestStartClip = createShortRestStartClip(mult);
    this.longRestStartClip = createLongRestStartClip(mult);
    this.completionBeepClip = createCompletionBeepClip(mult);
    this.resetBeepClip = createResetBeepClip(mult);

    this.ui.setColorScheme(settings.colorScheme);
    this.render();
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

  private async performStartupUpdateCheck(): Promise<void> {
    try {
      const currentSettings = await loadSettings();

      if (!isCheckDue(currentSettings)) {
        return;
      }

      this.isCheckingUpdate = true;
      const result = await checkForUpdates();

      if (
        result.isAvailable &&
        result.latestVersion &&
        shouldPromptForVersion(result.latestVersion, currentSettings)
      ) {
        this.updateCheckResult = result;
        this.updatePromptState = 'available';
        this.render();
      }

      // Update lastCheckedAt only if the check was successful (no error)
      if (!result.error) {
        await saveSettings({
          ...currentSettings,
          lastCheckedAt: Date.now()
        });
      }
    } catch {
      // Silently fail startup checks
    } finally {
      this.isCheckingUpdate = false;
    }
  }

  private async handleManualUpdateCheck(): Promise<void> {
    if (this.isCheckingUpdate) {
      return;
    }

    try {
      this.isCheckingUpdate = true;
      const result = await checkForUpdates();

      if (result.isAvailable && result.latestVersion) {
        this.updateCheckResult = result;
        this.updatePromptState = 'available';
        this.render();
      } else {
        // No update available - briefly show a message, then clear
        this.updateCheckResult = result;
        this.updatePromptState = 'skipped';
        this.render();

        // Auto-clear the message after a few seconds
        setTimeout(() => {
          if (this.updatePromptState === 'skipped') {
            this.updatePromptState = 'none';
            this.updateCheckResult = null;
            this.render();
          }
        }, 3000);
      }

      // Update lastCheckedAt for manual checks if successful
      if (!result.error) {
        const currentSettings = await loadSettings();
        await saveSettings({
          ...currentSettings,
          lastCheckedAt: Date.now()
        });
      }
    } catch {
      // Silently fail manual checks
    } finally {
      this.isCheckingUpdate = false;
    }
  }

  private async handleUpdatePromptResponse(command: 'updateYes' | 'updateNo'): Promise<void> {
    if (!this.updateCheckResult || !this.updateCheckResult.latestVersion) {
      return;
    }

    if (command === 'updateNo') {
      // User declined - skip this version
      const currentSettings = await loadSettings();
      await saveSettings({
        ...currentSettings,
        skippedVersion: this.updateCheckResult.latestVersion
      });

      this.updatePromptState = 'skipped';
      this.render();

      // Auto-clear after showing skipped message
      setTimeout(() => {
        this.updatePromptState = 'none';
        this.updateCheckResult = null;
        this.render();
      }, 2000);

      return;
    }

    if (command === 'updateYes') {
      // User accepted - copy update command to clipboard and exit
      const updateCommand = getUpdateCommand();

      try {
        const clipboardResult = await copyToClipboard(updateCommand);

        if (clipboardResult.success) {
          this.updatePromptState = 'copySuccess';
        } else {
          this.updatePromptState = 'copyFallback';
        }

        this.render();

        // Exit after showing the result for a moment
        setTimeout(() => {
          this.shutdown();
        }, 2000);
      } catch {
        this.updatePromptState = 'copyFallback';
        this.render();

        setTimeout(() => {
          this.shutdown();
        }, 2000);
      }
    }
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
