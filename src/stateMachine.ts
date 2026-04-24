import {
  DEFAULT_TIMER_CONFIG,
  getDurationForMode,
  getNextModeAfterCompletion,
  type TimerConfig,
  type TimerMode,
  type TimerStatus
} from './constants';

export type SwitchPrompt = {
  nextMode: TimerMode;
  deadlineTs: number;
};

export type TimerState = {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  isLocked: boolean;
  completedWorkSessions: number;
  switchPrompt: SwitchPrompt | null;
};

export type TickResult = {
  state: TimerState;
  completedMode: TimerMode | null;
  startedPrompt: boolean;
  switchedRunning: boolean;
  switchedToMode: TimerMode | null;
};

export type ActionResult = {
  state: TimerState;
  switchedToMode: TimerMode | null;
};

function createInitialState(config: TimerConfig): TimerState {
  return {
    mode: 'work',
    status: 'paused',
    remainingSeconds: config.workSeconds,
    isLocked: false,
    completedWorkSessions: 0,
    switchPrompt: null
  };
}

export class TimerStateMachine {
  private readonly config: TimerConfig;

  private state: TimerState;

  public constructor(config: TimerConfig = DEFAULT_TIMER_CONFIG) {
    this.config = config;
    this.state = createInitialState(config);
  }

  public getState(): TimerState {
    return {
      ...this.state,
      switchPrompt: this.state.switchPrompt ? { ...this.state.switchPrompt } : null
    };
  }

  public toggleLock(): TimerState {
    this.state = { ...this.state, isLocked: !this.state.isLocked };
    return this.getState();
  }

  public togglePause(): TimerState {
    if (this.state.status === 'switchPrompt') {
      return this.getState();
    }

    this.state = {
      ...this.state,
      status: this.state.status === 'running' ? 'paused' : 'running'
    };

    return this.getState();
  }

  public resetCurrentAndRun(): ActionResult {
    const duration = getDurationForMode(this.config, this.state.mode);

    this.state = {
      ...this.state,
      remainingSeconds: duration,
      status: 'running',
      switchPrompt: null
    };

    return { state: this.getState(), switchedToMode: this.state.mode };
  }

  public startMode(mode: TimerMode): ActionResult {
    const duration = getDurationForMode(this.config, mode);

    this.state = {
      ...this.state,
      mode,
      remainingSeconds: duration,
      status: 'running',
      switchPrompt: null
    };

    return { state: this.getState(), switchedToMode: mode };
  }

  public debugJumpToNearEnd(secondsLeft = 3): TimerState {
    if (this.state.status === 'switchPrompt' && this.state.switchPrompt) {
      this.state = {
        ...this.state,
        switchPrompt: {
          ...this.state.switchPrompt,
          deadlineTs: Date.now() + Math.max(1, Math.floor(secondsLeft)) * 1000
        }
      };
      return this.getState();
    }

    if (this.state.status !== 'running') {
      return this.getState();
    }

    this.state = {
      ...this.state,
      remainingSeconds: Math.max(1, Math.floor(secondsLeft))
    };

    return this.getState();
  }

  public forceQuitState(): TimerState {
    return this.getState();
  }

  public tick(nowTs: number): TickResult {
    if (this.state.status === 'switchPrompt') {
      const prompt = this.state.switchPrompt;

      if (prompt && nowTs >= prompt.deadlineTs) {
        const duration = getDurationForMode(this.config, prompt.nextMode);
        this.state = {
          ...this.state,
          mode: prompt.nextMode,
          remainingSeconds: duration,
          status: 'running',
          switchPrompt: null
        };

        return {
          state: this.getState(),
          completedMode: null,
          startedPrompt: false,
          switchedRunning: true,
          switchedToMode: prompt.nextMode
        };
      }

      return {
        state: this.getState(),
        completedMode: null,
        startedPrompt: false,
        switchedRunning: false,
        switchedToMode: null
      };
    }

    if (this.state.status !== 'running') {
      return {
        state: this.getState(),
        completedMode: null,
        startedPrompt: false,
        switchedRunning: false,
        switchedToMode: null
      };
    }

    if (this.state.remainingSeconds > 1) {
      this.state = {
        ...this.state,
        remainingSeconds: this.state.remainingSeconds - 1
      };

      return {
        state: this.getState(),
        completedMode: null,
        startedPrompt: false,
        switchedRunning: false,
        switchedToMode: null
      };
    }

    const completedMode = this.state.mode;
    const completedWorkSessions =
      completedMode === 'work'
        ? this.state.completedWorkSessions + 1
        : this.state.completedWorkSessions;
    const nextMode = getNextModeAfterCompletion(completedMode, completedWorkSessions, this.config);

    this.state = {
      ...this.state,
      remainingSeconds: 0,
      status: 'switchPrompt',
      completedWorkSessions,
      switchPrompt: {
        nextMode,
        deadlineTs: nowTs + this.config.switchConfirmSeconds * 1000
      }
    };

    return {
      state: this.getState(),
      completedMode,
      startedPrompt: true,
      switchedRunning: false,
      switchedToMode: null
    };
  }

  public confirmPromptAndSwitch(): ActionResult {
    const prompt = this.state.switchPrompt;

    if (!prompt) {
      return { state: this.getState(), switchedToMode: null };
    }

    const duration = getDurationForMode(this.config, prompt.nextMode);
    this.state = {
      ...this.state,
      mode: prompt.nextMode,
      remainingSeconds: duration,
      status: 'running',
      switchPrompt: null
    };

    return { state: this.getState(), switchedToMode: prompt.nextMode };
  }

  public getConfig(): TimerConfig {
    return this.config;
  }
}
