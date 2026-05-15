/* eslint-disable @typescript-eslint/no-explicit-any */
import { DoroUi, getRunningStatusText } from '../ui';
import blessed from 'blessed';
import { enableMouse, disableMouse } from '../mouse';

vi.mock('blessed', () => {
  const mockScreen = {
    on: vi.fn(),
    render: vi.fn(),
    destroy: vi.fn(),
    cols: 80,
    rows: 24
  };
  const mockBox = {
    style: {},
    setContent: vi.fn(),
    hide: vi.fn(),
    show: vi.fn()
  };

  return {
    default: {
      screen: vi.fn(() => mockScreen),
      box: vi.fn(() => ({ ...mockBox }))
    }
  };
});

vi.mock('../mouse', () => ({
  enableMouse: vi.fn(),
  disableMouse: vi.fn()
}));

describe('DoroUi', () => {
  let handlers: {
    onKey: ReturnType<typeof vi.fn>;
    onResize: ReturnType<typeof vi.fn>;
    onAnyClick: ReturnType<typeof vi.fn>;
  };
  let ui: DoroUi;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = {
      onKey: vi.fn(),
      onResize: vi.fn(),
      onAnyClick: vi.fn()
    };
  });

  afterEach(() => {
    if (ui) {
      ui.destroy();
    }
  });

  it('should initialize correctly with blessed elements', () => {
    ui = new DoroUi(handlers as any);

    expect(blessed.screen).toHaveBeenCalledTimes(1);
    // 1 root + 1 progress + 1 banner + 1 status + 1 help + 4 prompt overlays = 9 boxes
    expect(blessed.box).toHaveBeenCalledTimes(9);

    expect(enableMouse).toHaveBeenCalledTimes(1);

    const mouseCallback = vi.mocked(enableMouse).mock.calls[0][0];
    mouseCallback();
    expect(handlers.onAnyClick).toHaveBeenCalledTimes(1);
  });

  it('should render work mode state', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render update error state', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'error',
      updateCheckResult: { isAvailable: false, currentVersion: '1.2.1', error: 'Network timeout' },
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render update skipped state with version info', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'skipped',
      updateCheckResult: { isAvailable: true, latestVersion: '1.3.0', currentVersion: '1.2.1' },
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render transition prompt state', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;

    ui.render({
      mode: 'work',
      status: 'switchPrompt',
      remainingSeconds: 0,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: true,
      promptCountdownSeconds: 3,
      promptTotalSeconds: 5,
      promptNextMode: 'short',
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should handle zero columns without crashing', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;
    mockScreen.cols = 0;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.cols = 80; // Restore
  });

  it('should render paused state', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;

    ui.render({
      mode: 'work',
      status: 'paused',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render switchPrompt status explicitly', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;

    ui.render({
      mode: 'work',
      status: 'switchPrompt',
      remainingSeconds: 0,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false, // Intentionally false to hit fallback branch in statusLabel
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should toggle color scheme and return it', () => {
    ui = new DoroUi(handlers as any, 'modern');
    expect(ui.getColorScheme()).toBe('modern');

    const next = ui.toggleColorScheme();
    expect(next).toBe('calm');
    expect(ui.getColorScheme()).toBe('calm');

    const back = ui.toggleColorScheme();
    expect(back).toBe('modern');
  });

  it('should set color scheme explicitly', () => {
    ui = new DoroUi(handlers as any, 'modern');
    ui.setColorScheme('calm');
    expect(ui.getColorScheme()).toBe('calm');
  });

  it('should destroy and disable mouse', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;

    ui.destroy();

    expect(disableMouse).toHaveBeenCalledTimes(1);
    expect(mockScreen.destroy).toHaveBeenCalledTimes(1);
  });

  it('should show volume icons at various widths as documented', () => {
    // At width 1, only the lock icon fits
    expect(getRunningStatusText('running', false, 'muted', 1)).toBe('○');
    expect(getRunningStatusText('running', true, 'muted', 1)).toBe('⊘');
  });

  it('should show both lock and volume icons at super tiny widths', () => {
    // At width 5, both icons fit but not the running label
    expect(getRunningStatusText('running', true, 'muted', 5)).toBe('⊘ ✕');
    expect(getRunningStatusText('running', true, 'quiet', 5)).toBe('⊘ ♪');
    expect(getRunningStatusText('running', true, 'normal', 5)).toBe('⊘ ♫');
  });

  it('should show all three indicators at medium widths', () => {
    // At width 11, compact icons with running label fits
    expect(getRunningStatusText('running', false, 'muted', 11)).toBe('RUNNING ○ ✕');
    expect(getRunningStatusText('running', false, 'quiet', 11)).toBe('RUNNING ○ ♪');
    expect(getRunningStatusText('running', false, 'normal', 11)).toBe('RUNNING ○ ♫');
  });

  it('should render update prompt states', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;

    // Update available prompt
    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'available',
      updateCheckResult: { isAvailable: true, latestVersion: '1.3.0', currentVersion: '1.2.1' },
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    expect(mockScreen.title).toBe('doro Update');

    mockScreen.render.mockClear();

    // Copy success state
    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'copySuccess',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);

    mockScreen.render.mockClear();

    // Copy fallback state
    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'copyFallback',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);

    mockScreen.render.mockClear();

    // Skipped state (no update)
    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'skipped',
      updateCheckResult: { isAvailable: false, currentVersion: '1.2.1' },
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should use narrow help text at medium screen width', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;
    mockScreen.cols = 50;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.cols = 80; // Restore
  });

  it('should use ultra help text at small screen width', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;
    mockScreen.cols = 19;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.cols = 80; // Restore
  });

  it('should drop low-priority tokens at very tiny screen width', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;
    mockScreen.cols = 10;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.cols = 80; // Restore
  });

  it('should render buildProgressRow with fill within left padding', () => {
    // Very low progress ratio → fw < padLeft for centered text
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;
    mockScreen.cols = 80;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 1439, // ~4% elapsed → fw ≈ 3, well inside left padding
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render buildProgressRow with fill spanning into right padding', () => {
    // Very high progress ratio → fw > padLeft + textLen
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;
    mockScreen.cols = 80;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 150, // 90% elapsed → fw ≈ 72
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render update available without latestVersion (empty status text)', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;

    ui.render({
      mode: 'work',
      status: 'running',
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
      updatePromptState: 'available',
      updateCheckResult: { isAvailable: true, currentVersion: '1.2.0' },
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false // no latestVersion
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render update prompt fallback text at very narrow screens', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;
    mockScreen.cols = 5;

    const baseState = {
      mode: 'work' as const,
      status: 'running' as const,
      remainingSeconds: 600,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal' as const,
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null
    };

    // copySuccess fallback (shortest = 'Copied!' = 7 > 5)
    ui.render({
      ...baseState,
      updatePromptState: 'copySuccess',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });
    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.render.mockClear();

    // copyFallback fallback (shortest candidate = 32 > 5)
    ui.render({
      ...baseState,
      updatePromptState: 'copyFallback',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });
    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.render.mockClear();

    // skipped (no update, shortest = 'Latest.' = 7 > 5)
    ui.render({
      ...baseState,
      updatePromptState: 'skipped',
      updateCheckResult: { isAvailable: false, currentVersion: '1.2.0' },
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });
    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.render.mockClear();

    // skipped (update was available, shortest = 'Skipped.' = 8 > 5)
    ui.render({
      ...baseState,
      updatePromptState: 'skipped',
      updateCheckResult: { isAvailable: true, latestVersion: '1.3.0', currentVersion: '1.2.0' },
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });
    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.render.mockClear();

    // error fallback (shortest = 'Error.' = 6 > 5)
    ui.render({
      ...baseState,
      updatePromptState: 'error',
      updateCheckResult: { isAvailable: false, currentVersion: '1.2.0', error: 'net fail' },
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });
    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.render.mockClear();

    // available fallback (shortest = 'y/n?' = 4 > 3) - use cols=3
    mockScreen.cols = 3;
    ui.render({
      ...baseState,
      updatePromptState: 'available',
      updateCheckResult: { isAvailable: true, latestVersion: '1.3.0', currentVersion: '1.2.0' },
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });
    expect(mockScreen.render).toHaveBeenCalledTimes(1);

    mockScreen.cols = 80; // Restore
  });

  it('should return empty transition status text when terminal is too narrow', () => {
    ui = new DoroUi(handlers as any);
    const mockScreen = vi.mocked(blessed.screen).mock.results[0].value;
    mockScreen.cols = 1; // Even '1s' (2 chars) doesn't fit

    ui.render({
      mode: 'work',
      status: 'switchPrompt',
      remainingSeconds: 0,
      durationSeconds: 1500,
      isLocked: false,
      volumeMode: 'normal',
      hasPrompt: true,
      promptCountdownSeconds: 1,
      promptTotalSeconds: 5,
      promptNextMode: 'short',
      updatePromptState: 'none',
      updateCheckResult: null,
      editDurationState: 'none',
      editDurationValue: null,
      editDurationBlink: false
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.cols = 80; // Restore
  });
});
