import blessed from 'blessed';
import { MODE_LABELS, type TimerMode, type TimerStatus } from './constants';

type UiRenderState = {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  durationSeconds: number;
  isLocked: boolean;
  isMuted: boolean;
  promptCountdownSeconds: number;
  hasPrompt: boolean;
  promptNextMode: TimerMode | null;
};

type UiHandlers = {
  onKey: (ch: string, key: blessed.Widgets.Events.IKeyEventArg) => void;
  onMouse: () => void;
  onResize: () => void;
};

type ModeStyle = {
  base: string;
  fill: string;
  text: string;
  bannerBg: string;
  bannerFg: string;
  statusBg: string;
  statusFg: string;
  promptBg: string;
  promptFg: string;
};

type ColorScheme = 'modern' | 'calm';

type Palette = {
  modes: Record<TimerMode, ModeStyle>;
  pause: ModeStyle;
};

const MODERN_MODE_STYLES: Record<TimerMode, ModeStyle> = {
  work: {
    base: '#fce9f1',
    fill: '#f4b8d0',
    text: '#3a1e2d',
    bannerBg: '#c96f97',
    bannerFg: '#1d0b14',
    statusBg: '#e5a7c4',
    statusFg: '#2b1320',
    promptBg: '#b85a87',
    promptFg: '#160910'
  },
  short: {
    base: '#e4f6ed',
    fill: '#b6e2ca',
    text: '#1e3629',
    bannerBg: '#5ea87f',
    bannerFg: '#0c1a12',
    statusBg: '#a2d5bc',
    statusFg: '#12271d',
    promptBg: '#4f956f',
    promptFg: '#08130d'
  },
  long: {
    base: '#e4eef9',
    fill: '#b8cff0',
    text: '#182b40',
    bannerBg: '#6a93c9',
    bannerFg: '#0a1523',
    statusBg: '#9fbde6',
    statusFg: '#102033',
    promptBg: '#5b84bb',
    promptFg: '#09121e'
  }
};

const PAUSED_NEUTRAL_STYLE: ModeStyle = {
  base: '#d4d8df',
  fill: '#b3bac5',
  text: '#232831',
  bannerBg: '#727b8a',
  bannerFg: '#f5f7fa',
  statusBg: '#949dad',
  statusFg: '#151920',
  promptBg: '#646d7d',
  promptFg: '#f4f6f9'
};

const CALM_MODE_STYLES: Record<TimerMode, ModeStyle> = {
  work: {
    base: '#fff3f8',
    fill: '#f8cfdf',
    text: '#3a2230',
    bannerBg: '#d699b6',
    bannerFg: '#1f1118',
    statusBg: '#efbfd3',
    statusFg: '#2d1622',
    promptBg: '#c885a5',
    promptFg: '#180c13'
  },
  short: {
    base: '#f0faf4',
    fill: '#cce8d9',
    text: '#20362b',
    bannerBg: '#8ebca4',
    bannerFg: '#0d1812',
    statusBg: '#bbddcc',
    statusFg: '#162a1f',
    promptBg: '#7eab94',
    promptFg: '#09130e'
  },
  long: {
    base: '#eef4fc',
    fill: '#c9d8ee',
    text: '#1b2d42',
    bannerBg: '#89a8ce',
    bannerFg: '#0b1624',
    statusBg: '#b7cde9',
    statusFg: '#122235',
    promptBg: '#7997bd',
    promptFg: '#09121e'
  }
};

const PALETTES: Record<ColorScheme, Palette> = {
  modern: {
    modes: MODERN_MODE_STYLES,
    pause: PAUSED_NEUTRAL_STYLE
  },
  calm: {
    modes: CALM_MODE_STYLES,
    pause: PAUSED_NEUTRAL_STYLE
  }
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mm = Math.floor(safe / 60).toString().padStart(2, '0');
  const ss = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function statusLabel(status: TimerStatus): string {
  if (status === 'running') {
    return 'RUNNING';
  }

  if (status === 'paused') {
    return 'PAUSED';
  }

  return 'SWITCH';
}

export class PapadoroUi {
  private readonly screen: blessed.Widgets.Screen;

  private readonly root: blessed.Widgets.BoxElement;

  private readonly progressFill: blessed.Widgets.BoxElement;

  private readonly modeBannerBox: blessed.Widgets.BoxElement;

  private readonly statusBox: blessed.Widgets.BoxElement;

  private readonly helpBox: blessed.Widgets.BoxElement;

  private readonly promptOverlay: blessed.Widgets.BoxElement;

  private readonly promptText: blessed.Widgets.BoxElement;

  private colorScheme: ColorScheme = 'modern';

  public constructor(handlers: UiHandlers) {
    const initialStyle = PALETTES.modern.modes.work;

    this.screen = blessed.screen({
      smartCSR: false,
      fastCSR: false,
      fullUnicode: false,
      autoPadding: false,
      title: 'papadoro',
      mouse: true,
      dockBorders: false,
      warnings: false
    });

    this.root = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      style: {
        bg: initialStyle.base
      }
    });

    this.progressFill = blessed.box({
      parent: this.root,
      top: 0,
      left: 0,
      width: 0,
      height: '100%',
      style: {
        bg: initialStyle.fill
      }
    });

    this.modeBannerBox = blessed.box({
      parent: this.root,
      top: 2,
      left: 0,
      width: '100%',
      height: 1,
      align: 'center',
      tags: true,
      style: {
        bg: initialStyle.bannerBg,
        fg: initialStyle.bannerFg
      },
      content: '{bold}WORK{/bold}'
    });

    this.statusBox = blessed.box({
      parent: this.root,
      top: 4,
      left: 0,
      width: '100%',
      height: 1,
      align: 'center',
      tags: true,
      style: {
        bg: initialStyle.statusBg,
        fg: initialStyle.statusFg
      },
      content: 'RUNNING | OPEN'
    });

    this.helpBox = blessed.box({
      parent: this.root,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      align: 'center',
      tags: true,
      style: {
        bg: initialStyle.statusBg,
        fg: initialStyle.statusFg
      },
      content: 'q quit  p pause  r reset  c colors  m mute  w/s/l mode  L lock'
    });

    this.promptOverlay = blessed.box({
      parent: this.root,
      hidden: true,
      top: 'center-4',
      left: 'center-26',
      width: 52,
      height: 8,
      border: 'line',
      align: 'center',
      valign: 'middle',
      style: {
        border: {
          fg: initialStyle.promptFg
        },
        bg: initialStyle.promptBg
      }
    });

    this.promptText = blessed.box({
      parent: this.promptOverlay,
      top: 1,
      left: 1,
      width: '100%-2',
      height: '100%-2',
      align: 'center',
      valign: 'middle',
      tags: true,
      style: {
        bg: initialStyle.promptBg,
        fg: initialStyle.promptFg
      }
    });

    this.screen.on('keypress', handlers.onKey);
    this.screen.on('mouse', handlers.onMouse);
    this.screen.on('resize', handlers.onResize);
  }

  public toggleColorScheme(): void {
    this.colorScheme = this.colorScheme === 'modern' ? 'calm' : 'modern';
  }

  public render(state: UiRenderState): void {
    const cols = this.screen.cols;
    const rows = this.screen.rows;
    const isPaused = state.status === 'paused';
    const palette = PALETTES[this.colorScheme];
    const style = isPaused ? palette.pause : palette.modes[state.mode];
    const progressRatio = state.durationSeconds <= 0
      ? 0
      : clamp((state.durationSeconds - state.remainingSeconds) / state.durationSeconds, 0, 1);
    const progressWidth = Math.round(cols * progressRatio);
    const modeText = isPaused
      ? '{bold}PAUSED{/bold}'
      : state.mode === 'work'
        ? '{bold}WORK{/bold}'
        : state.mode === 'short'
          ? '{bold}SHORT BREAK{/bold}'
          : '{bold}LONG BREAK{/bold}';
    const statusText = state.hasPrompt
      ? `SWITCH NOW (${state.promptCountdownSeconds}s)`
      : statusLabel(state.status);

    this.root.style.bg = style.base;
    this.progressFill.style.bg = style.fill;
    if (progressWidth > 0) {
      this.progressFill.show();
      this.progressFill.width = progressWidth;
    } else {
      this.progressFill.hide();
    }

    const compactHeight = rows < 10;
    const narrowWidth = cols < 72;

    this.modeBannerBox.top = compactHeight ? 0 : 2;
    this.statusBox.top = compactHeight ? 1 : 4;
    this.helpBox.hidden = compactHeight;
    this.helpBox.setContent(
      narrowWidth
        ? 'q quit  p pause  r reset  c colors  m mute  w/s/l  L lock'
        : 'q quit  p pause  r reset  c colors  m mute  w work  s short  l long  L lock'
    );

    this.modeBannerBox.style.bg = style.bannerBg;
    this.modeBannerBox.style.fg = style.bannerFg;
    this.statusBox.style.bg = style.statusBg;
    this.statusBox.style.fg = style.statusFg;
    this.helpBox.style.bg = style.statusBg;
    this.helpBox.style.fg = style.statusFg;

    this.screen.title = `papadoro ${formatTime(state.remainingSeconds)}`;
    this.modeBannerBox.setContent(modeText);
    this.statusBox.setContent(
      `${statusText} | ${state.isLocked ? 'LOCKED' : 'OPEN'} | ${state.isMuted ? 'MUTED' : 'SOUND'}`
    );

    if (state.hasPrompt && state.promptNextMode) {
      const promptWidth = clamp(cols - 8, 34, 72);
      const promptHeight = clamp(rows < 14 ? 6 : 8, 6, 8);
      this.promptOverlay.width = promptWidth;
      this.promptOverlay.height = promptHeight;
      this.promptOverlay.left = Math.floor((cols - promptWidth) / 2);
      this.promptOverlay.top = Math.max(0, Math.floor((rows - promptHeight) / 2));
      this.promptOverlay.style.bg = style.promptBg;
      this.promptOverlay.style.border.fg = style.promptFg;
      this.promptText.style.bg = style.promptBg;
      this.promptText.style.fg = style.promptFg;
      this.promptOverlay.show();
      this.promptText.setContent(
        '{bold}Time done{/bold}\n' +
          `Next: {bold}${MODE_LABELS[state.promptNextMode]}{/bold}\n` +
          `Press any key/click to confirm (${state.promptCountdownSeconds}s)\n` +
          'q exits immediately'
      );
    } else {
      this.promptOverlay.hide();
    }

    this.screen.render();
  }

  public destroy(): void {
    this.screen.destroy();
  }
}
