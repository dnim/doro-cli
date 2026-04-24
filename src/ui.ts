import blessed from 'blessed';
import { MODE_LABELS, MODE_LABELS_SHORT, type TimerMode, type TimerStatus } from './constants';
import { enableMouse, disableMouse } from './mouse';

type UiRenderState = {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  durationSeconds: number;
  isLocked: boolean;
  isMuted: boolean;
  promptCountdownSeconds: number;
  promptTotalSeconds: number;
  hasPrompt: boolean;
  promptNextMode: TimerMode | null;
};

type UiHandlers = {
  onKey: (ch: string, key: blessed.Widgets.Events.IKeyEventArg) => void;
  onResize: () => void;
  onAnyClick: () => void;
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

const HELP_TEXT_WIDE = 'q quit  p pause  r reset  c colors  m mute  w work  s short  l long  L lock';
const HELP_TEXT_NARROW = 'q:✕  p:⏸  r:↺  c:✦  m:♪  w/s/l  L:⊟';
const HELP_TEXT_ULTRA = 'q p r c m w s l L';

// Priority-ordered single-key tokens for sub-ultra fallback
const HELP_TOKENS_PRIORITY = ['q', 'p', 'r', 'm', 'w', 's', 'l', 'c', 'L'];

/**
 * Returns the widest help-legend string that fits within `cols` characters.
 * Items are dropped from lowest priority first when space is very tight.
 */
function getHelpText(cols: number): string {
  if (cols <= 0) return '';
  if (HELP_TEXT_WIDE.length <= cols) return HELP_TEXT_WIDE;
  if (HELP_TEXT_NARROW.length <= cols) return HELP_TEXT_NARROW;
  if (HELP_TEXT_ULTRA.length <= cols) return HELP_TEXT_ULTRA;
  // Still doesn't fit – drop lowest-priority tokens one at a time
  const tokens: string[] = [];
  for (const token of HELP_TOKENS_PRIORITY) {
    const candidate = [...tokens, token].join(' ');
    if (candidate.length <= cols) {
      tokens.push(token);
    } else {
      break;
    }
  }
  return tokens.join(' ');
}

/**
 * Builds a full-width row string that shows a two-tone progress background
 * using blessed markup tags.  The `visibleText` (plain, no markup) is centred
 * across `cols` columns; everything left of `fillWidth` gets `fillBg` and
 * everything to the right gets `baseBg`.
 */
function buildProgressRow(
  visibleText: string,
  cols: number,
  fillWidth: number,
  fillBg: string,
  baseBg: string,
  fg: string,
  bold = false
): string {
  if (cols <= 0) return '';
  const fw = Math.max(0, Math.min(fillWidth, cols));
  const textLen = Math.min(visibleText.length, cols);
  const safeText = visibleText.slice(0, textLen);
  const totalPad = cols - textLen;
  const padLeft = Math.floor(totalPad / 2);
  const padRight = totalPad - padLeft;
  const full = ' '.repeat(padLeft) + safeText + ' '.repeat(padRight);
  const p1 = full.substring(0, fw);
  const p2 = full.substring(fw);
  const bO = bold ? '{bold}' : '';
  const bC = bold ? '{/bold}' : '';
  let content = '';
  if (p1.length > 0) content += `{${fillBg}-bg}{${fg}-fg}${bO}${p1}${bC}`;
  if (p2.length > 0) content += `{${baseBg}-bg}{${fg}-fg}${bO}${p2}${bC}`;
  return content;
}

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

  private readonly promptBarTrack: blessed.Widgets.BoxElement;

  private readonly promptBarFill: blessed.Widgets.BoxElement;

  private colorScheme: ColorScheme = 'modern';

  public constructor(handlers: UiHandlers) {
    const initialStyle = PALETTES.modern.modes.work;

    this.screen = blessed.screen({
      smartCSR: false,
      fastCSR: false,
      fullUnicode: true,
      autoPadding: false,
      title: 'papadoro',
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
      content: ''
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
      content: ''
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
      height: '100%-4',
      align: 'center',
      valign: 'middle',
      tags: true,
      style: {
        bg: initialStyle.promptBg,
        fg: initialStyle.promptFg
      }
    });

    this.promptBarTrack = blessed.box({
      parent: this.promptOverlay,
      bottom: 1,
      left: 2,
      width: '100%-4',
      height: 1,
      style: {
        bg: initialStyle.statusBg
      }
    });

    this.promptBarFill = blessed.box({
      parent: this.promptBarTrack,
      top: 0,
      left: 0,
      width: 0,
      height: 1,
      style: {
        bg: initialStyle.promptFg
      }
    });

    enableMouse(() => {
      handlers.onAnyClick();
    });

    this.screen.on('keypress', handlers.onKey);
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
    const compactHeight = rows < 10;

    const bannerText = isPaused
      ? 'PAUSED'
      : state.mode === 'work'
        ? 'WORK'
        : state.mode === 'short'
          ? 'SHORT BREAK'
          : 'LONG BREAK';
    const statusBaseText = state.hasPrompt
      ? 'SWITCH NOW'
      : statusLabel(state.status);
    const statusText = `${statusBaseText} | ${state.isLocked ? 'LOCKED' : 'OPEN'} | ${state.isMuted ? 'MUTED' : 'SOUND'}`;

    this.root.style.bg = style.base;
    this.progressFill.style.bg = style.fill;
    if (progressWidth > 0) {
      this.progressFill.show();
      this.progressFill.width = progressWidth;
    } else {
      this.progressFill.hide();
    }

    this.modeBannerBox.top = compactHeight ? 0 : 2;
    this.statusBox.top = compactHeight ? 1 : 4;
    // Show help unless there is genuinely no row for it (banner + status take rows 0-1).
    this.helpBox.hidden = rows < 3;

    this.modeBannerBox.style.bg = style.bannerBg;
    this.modeBannerBox.style.fg = style.bannerFg;
    this.statusBox.style.bg = style.statusBg;
    this.statusBox.style.fg = style.statusFg;
    this.helpBox.style.bg = style.statusBg;
    this.helpBox.style.fg = style.statusFg;

    this.screen.title = `papadoro ${formatTime(state.remainingSeconds)}`;
    this.modeBannerBox.setContent(
      buildProgressRow(bannerText, cols, progressWidth, style.fill, style.bannerBg, style.bannerFg, true)
    );
    this.statusBox.setContent(
      buildProgressRow(statusText, cols, progressWidth, style.fill, style.statusBg, style.statusFg)
    );
    this.helpBox.setContent(
      buildProgressRow(getHelpText(cols), cols, progressWidth, style.fill, style.statusBg, style.statusFg)
    );

    if (state.hasPrompt && state.promptNextMode) {
      const ultraSmall = cols < 40 || rows < 10;
      const promptWidth = ultraSmall
        ? clamp(cols - 2, 20, cols - 2)
        : clamp(cols - 8, 34, 72);
      const promptHeight = ultraSmall ? 5 : clamp(rows < 14 ? 7 : 8, 6, 8);
      const compactPrompt = ultraSmall || promptWidth < 48 || promptHeight < 8;
      this.promptOverlay.width = promptWidth;
      this.promptOverlay.height = promptHeight;
      this.promptOverlay.left = Math.max(0, Math.floor((cols - promptWidth) / 2));
      this.promptOverlay.top = Math.max(0, Math.floor((rows - promptHeight) / 2));
      this.promptOverlay.style.bg = style.promptBg;
      this.promptOverlay.style.border.fg = style.promptFg;
      this.promptText.style.bg = style.promptBg;
      this.promptText.style.fg = style.promptFg;
      this.promptText.height = promptHeight - 4;
      this.promptBarTrack.style.bg = style.statusBg;
      this.promptBarFill.style.bg = style.promptFg;
      this.promptOverlay.show();

      const nextLabel = ultraSmall
        ? MODE_LABELS_SHORT[state.promptNextMode]
        : MODE_LABELS[state.promptNextMode];
      this.promptText.setContent(
        compactPrompt
          ? `{bold}Done{/bold}\nNext: {bold}${nextLabel}{/bold}\nkey/click`
          : '{bold}Time done{/bold}\n' +
            `Next: {bold}${nextLabel}{/bold}\n` +
            'Press any key/click to confirm\n' +
            'q exits immediately'
      );

      const trackWidth = Math.max(1, promptWidth - 4);
      const ratio = state.promptTotalSeconds > 0
        ? clamp(state.promptCountdownSeconds / state.promptTotalSeconds, 0, 1)
        : 0;
      const fillWidth = Math.max(0, Math.round(trackWidth * ratio));
      if (fillWidth > 0) {
        this.promptBarFill.show();
        this.promptBarFill.width = fillWidth;
      } else {
        this.promptBarFill.hide();
      }
    } else {
      this.promptOverlay.hide();
    }

    this.screen.render();
  }

  public destroy(): void {
    disableMouse();
    this.screen.destroy();
  }
}
