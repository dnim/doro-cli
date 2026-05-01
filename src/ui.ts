import blessed from 'blessed';
import { MODE_LABELS, MODE_LABELS_SHORT, type TimerMode, type TimerStatus } from './constants';
import { enableMouse, disableMouse } from './mouse';
import type { UpdateCheckResult } from './update';

export type UpdatePromptState = 'none' | 'available' | 'copySuccess' | 'copyFallback' | 'skipped';

type UiRenderState = {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  durationSeconds: number;
  isLocked: boolean;
  volumeMode: 'normal' | 'quiet' | 'muted';
  promptCountdownSeconds: number;
  promptTotalSeconds: number;
  hasPrompt: boolean;
  promptNextMode: TimerMode | null;
  updatePromptState: UpdatePromptState;
  updateCheckResult: UpdateCheckResult | null;
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

const HELP_TEXT_WIDE =
  'q quit  p pause  r reset  c colors  m mute  w work  s short  l long  L lock  U update';
const HELP_TEXT_NARROW = 'q:✕  p:⏸  r:↺  c:✦  m:♪  w/s/l  L:⊟  U:⬆';
const HELP_TEXT_ULTRA = 'q p r c m w s l L U';

// Priority-ordered single-key tokens for sub-ultra fallback
const HELP_TOKENS_PRIORITY = ['q', 'p', 'r', 'm', 'w', 's', 'l', 'c', 'L', 'U'];

/**
 * Returns the widest help-legend string that fits within `cols` characters.
 * Items are dropped from lowest priority first when space is very tight.
 */
function getHelpText(cols: number): string {
  if (cols <= 0) {
    return '';
  }
  if (HELP_TEXT_WIDE.length <= cols) {
    return HELP_TEXT_WIDE;
  }
  if (HELP_TEXT_NARROW.length <= cols) {
    return HELP_TEXT_NARROW;
  }
  if (HELP_TEXT_ULTRA.length <= cols) {
    return HELP_TEXT_ULTRA;
  }
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
/**
 * Returns a responsive running/paused status line that fits within `cols`.
 * Includes the current status plus lock and volume indicators, and falls back
 * to shorter variants as width shrinks.
 */
export function getRunningStatusText(
  status: TimerStatus,
  isLocked: boolean,
  volumeMode: 'normal' | 'quiet' | 'muted',
  cols: number
): string {
  const s = statusLabel(status);
  const lock = isLocked ? 'LOCK' : 'OPEN';
  const muteStrLong = volumeMode === 'muted' ? 'MUTED' : volumeMode === 'quiet' ? 'QUIET' : 'SOUND';
  const muteStrShort = volumeMode === 'muted' ? 'MUT' : volumeMode === 'quiet' ? 'SHH' : 'SND';
  const lockIcon = isLocked ? '⊘' : '○';
  const volumeIcon = volumeMode === 'muted' ? '✕' : volumeMode === 'quiet' ? '♪' : '♫';
  const candidates = [
    `${s} | ${isLocked ? 'LOCKED' : 'OPEN'} | ${muteStrLong}`,
    `${s} | ${lock} | ${muteStrShort}`,
    `${s} ${lockIcon} ${volumeIcon}`,
    `${lockIcon} ${volumeIcon}`,
    lockIcon
  ];
  for (const c of candidates) {
    if (c.length <= cols) {
      return c;
    }
  }
  return lockIcon.slice(0, cols);
}

function getTransitionStatusText(nextMode: TimerMode, autoSec: number, cols: number): string {
  const full = MODE_LABELS[nextMode];
  const short = MODE_LABELS_SHORT[nextMode];
  const candidates = [
    `Next: ${full}  |  any key to start  |  auto in ${autoSec}s`,
    `Next: ${full}  |  auto in ${autoSec}s`,
    `Next: ${full}  ${autoSec}s`,
    `→ ${full}  ${autoSec}s`,
    `→ ${short}  ${autoSec}s`,
    `→${short} ${autoSec}s`,
    `${autoSec}s`
  ];
  for (const c of candidates) {
    if (c.length <= cols) {
      return c;
    }
  }
  return '';
}

/**
 * Returns responsive update prompt text based on state and screen width
 */
function getUpdatePromptText(
  updatePromptState: UpdatePromptState,
  updateCheckResult: UpdateCheckResult | null,
  cols: number
): string {
  if (updatePromptState === 'none') {
    return '';
  }

  if (updatePromptState === 'available' && updateCheckResult?.latestVersion) {
    const version = updateCheckResult.latestVersion;
    const candidates = [
      `Update available: v${version}  |  Press y to update, n to skip  |  U to check again`,
      `Update available: v${version}  |  y=update, n=skip`,
      `Update v${version} available  |  y/n?`,
      `Update v${version}  |  y/n?`,
      `v${version} y/n?`,
      `y/n?`
    ];
    for (const c of candidates) {
      if (c.length <= cols) {
        return c;
      }
    }
    return 'y/n?';
  }

  if (updatePromptState === 'copySuccess') {
    const candidates = [
      'Update command copied to clipboard! Run it in your terminal after doro exits.',
      'Command copied to clipboard! Run after exit.',
      'Copied to clipboard! Run after exit.',
      'Copied! Run after exit.',
      'Copied!'
    ];
    for (const c of candidates) {
      if (c.length <= cols) {
        return c;
      }
    }
    return 'Copied!';
  }

  if (updatePromptState === 'copyFallback') {
    const candidates = [
      'Run this command after doro exits: npm install -g doro-cli@latest',
      'Run after exit: npm install -g doro-cli@latest',
      'Run: npm install -g doro-cli@latest',
      'Run: npm i -g doro-cli@latest',
      'npm i -g doro-cli@latest'
    ];
    for (const c of candidates) {
      if (c.length <= cols) {
        return c;
      }
    }
    return 'npm i -g doro-cli@latest';
  }

  if (updatePromptState === 'skipped') {
    if (!updateCheckResult?.isAvailable) {
      const candidates = [
        'No update available. You are running the latest version.',
        'No update available.',
        'Up to date.',
        'Latest.'
      ];
      for (const c of candidates) {
        if (c.length <= cols) {
          return c;
        }
      }
      return 'Latest.';
    } else {
      const candidates = [
        `Update v${updateCheckResult.latestVersion} skipped. Press U to check again.`,
        `v${updateCheckResult.latestVersion} skipped.`,
        'Skipped.'
      ];
      for (const c of candidates) {
        if (c.length <= cols) {
          return c;
        }
      }
      return 'Skipped.';
    }
  }

  return '';
}

function buildProgressRow(
  visibleText: string,
  cols: number,
  fillWidth: number,
  fillBg: string,
  baseBg: string,
  fg: string,
  bold = false
): string {
  if (cols <= 0) {
    return '';
  }
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
  if (p1.length > 0) {
    content += `{${fillBg}-bg}{${fg}-fg}${bO}${p1}${bC}`;
  }
  if (p2.length > 0) {
    content += `{${baseBg}-bg}{${fg}-fg}${bO}${p2}${bC}`;
  }
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
  const mm = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(safe % 60)
    .toString()
    .padStart(2, '0');
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

export class DoroUi {
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

  private colorScheme: ColorScheme;

  public constructor(handlers: UiHandlers, initialColorScheme: ColorScheme = 'modern') {
    this.colorScheme = initialColorScheme;
    const initialStyle = PALETTES[this.colorScheme].modes.work;

    this.screen = blessed.screen({
      smartCSR: false,
      fastCSR: false,
      fullUnicode: true,
      autoPadding: false,
      title: 'doro',
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

    // Prompt overlay removed — transition state is shown inline via banner/status rows.
    this.promptOverlay = blessed.box({
      parent: this.root,
      hidden: true,
      top: 0,
      left: 0,
      width: 0,
      height: 0
    });
    this.promptText = blessed.box({
      parent: this.promptOverlay,
      hidden: true,
      top: 0,
      left: 0,
      width: 0,
      height: 0
    });
    this.promptBarTrack = blessed.box({
      parent: this.promptOverlay,
      hidden: true,
      top: 0,
      left: 0,
      width: 0,
      height: 0
    });
    this.promptBarFill = blessed.box({
      parent: this.promptBarTrack,
      hidden: true,
      top: 0,
      left: 0,
      width: 0,
      height: 0
    });

    enableMouse(() => {
      handlers.onAnyClick();
    });

    this.screen.on('keypress', handlers.onKey);
    this.screen.on('resize', handlers.onResize);
  }

  public getColorScheme(): ColorScheme {
    return this.colorScheme;
  }

  public setColorScheme(scheme: ColorScheme): void {
    this.colorScheme = scheme;
  }

  public toggleColorScheme(): ColorScheme {
    this.colorScheme = this.colorScheme === 'modern' ? 'calm' : 'modern';
    return this.colorScheme;
  }

  public render(state: UiRenderState): void {
    const cols = this.screen.cols;
    const rows = this.screen.rows;
    const isPaused = state.status === 'paused';
    const palette = PALETTES[this.colorScheme];
    const isTransition = state.hasPrompt;
    const hasUpdatePrompt = state.updatePromptState !== 'none';
    const style = isPaused
      ? palette.pause
      : isTransition && state.promptNextMode
        ? palette.modes[state.promptNextMode]
        : palette.modes[state.mode];
    const progressRatio =
      isTransition || state.durationSeconds <= 0
        ? 0
        : clamp((state.durationSeconds - state.remainingSeconds) / state.durationSeconds, 0, 1);
    const progressWidth = Math.round(cols * progressRatio);
    const compactHeight = rows < 10;

    const bannerText = state.hasPrompt
      ? 'Done'
      : isPaused
        ? 'PAUSED'
        : state.mode === 'work'
          ? 'WORK'
          : state.mode === 'short'
            ? cols < 14
              ? 'SHORT'
              : 'SHORT BREAK'
            : cols < 13
              ? 'LONG'
              : 'LONG BREAK';

    let statusText: string;
    if (hasUpdatePrompt) {
      // Update prompts take priority over timer status
      statusText = getUpdatePromptText(state.updatePromptState, state.updateCheckResult, cols);
    } else if (state.hasPrompt && state.promptNextMode) {
      statusText = getTransitionStatusText(
        state.promptNextMode,
        state.promptCountdownSeconds,
        cols
      );
    } else {
      statusText = getRunningStatusText(state.status, state.isLocked, state.volumeMode, cols);
    }

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

    const time = formatTime(state.remainingSeconds);
    this.screen.title =
      state.hasPrompt && state.promptNextMode
        ? cols < 10
          ? `→${MODE_LABELS_SHORT[state.promptNextMode]}`
          : `doro Done → ${MODE_LABELS_SHORT[state.promptNextMode]}`
        : hasUpdatePrompt
          ? 'doro Update'
          : cols >= 15
            ? `doro ${time}`
            : cols >= 10
              ? `d ${time}`
              : time;
    this.modeBannerBox.setContent(
      buildProgressRow(
        bannerText,
        cols,
        progressWidth,
        style.fill,
        style.bannerBg,
        style.bannerFg,
        true
      )
    );
    this.statusBox.setContent(
      buildProgressRow(statusText, cols, progressWidth, style.fill, style.statusBg, style.statusFg)
    );
    this.helpBox.setContent(
      buildProgressRow(
        getHelpText(cols),
        cols,
        progressWidth,
        style.fill,
        style.statusBg,
        style.statusFg
      )
    );

    // Transition state is now rendered inline — overlay always hidden.
    this.promptOverlay.hide();

    this.screen.render();
  }

  public destroy(): void {
    disableMouse();
    this.screen.destroy();
  }
}
