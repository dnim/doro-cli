import { DoroUi, getRunningStatusText } from '../ui';
import blessed from 'blessed';
import { enableMouse, disableMouse } from '../mouse';

jest.mock('blessed', () => {
  const mockScreen = {
    on: jest.fn(),
    render: jest.fn(),
    destroy: jest.fn(),
    cols: 80,
    rows: 24
  };
  const mockBox = {
    style: {},
    setContent: jest.fn(),
    hide: jest.fn(),
    show: jest.fn()
  };

  return {
    screen: jest.fn(() => mockScreen),
    box: jest.fn(() => ({ ...mockBox }))
  };
});

jest.mock('../mouse', () => ({
  enableMouse: jest.fn(),
  disableMouse: jest.fn()
}));

describe('DoroUi', () => {
  let handlers: { onKey: jest.Mock; onResize: jest.Mock; onAnyClick: jest.Mock };
  let ui: DoroUi;

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {
      onKey: jest.fn(),
      onResize: jest.fn(),
      onAnyClick: jest.fn()
    };
  });

  afterEach(() => {
    if (ui) {
      ui.destroy();
    }
  });

  it('should initialize correctly with blessed elements', () => {
    ui = new DoroUi(handlers);

    expect(blessed.screen).toHaveBeenCalledTimes(1);
    // 1 root + 1 progress + 1 banner + 1 status + 1 help + 4 prompt overlays = 9 boxes
    expect(blessed.box).toHaveBeenCalledTimes(9);

    expect(enableMouse).toHaveBeenCalledTimes(1);

    const mouseCallback = (enableMouse as jest.Mock).mock.calls[0][0];
    mouseCallback();
    expect(handlers.onAnyClick).toHaveBeenCalledTimes(1);
  });

  it('should render work mode state', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

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
      updateCheckResult: null
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render update error state', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

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
      updateCheckResult: {
        isAvailable: false,
        currentVersion: '1.2.1',
        error: 'Network timeout'
      }
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render update skipped state with version info', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

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
      updateCheckResult: {
        isAvailable: true,
        latestVersion: '1.3.0',
        currentVersion: '1.2.1'
      }
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render transition prompt state', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

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
      updateCheckResult: null
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should handle zero columns without crashing', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;
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
      updateCheckResult: null
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    mockScreen.cols = 80; // Restore
  });

  it('should render paused state', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

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
      updateCheckResult: null
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should render switchPrompt status explicitly', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

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
      updateCheckResult: null
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should toggle color scheme and return it', () => {
    ui = new DoroUi(handlers, 'modern');
    expect(ui.getColorScheme()).toBe('modern');

    const next = ui.toggleColorScheme();
    expect(next).toBe('calm');
    expect(ui.getColorScheme()).toBe('calm');

    const back = ui.toggleColorScheme();
    expect(back).toBe('modern');
  });

  it('should set color scheme explicitly', () => {
    ui = new DoroUi(handlers, 'modern');
    ui.setColorScheme('calm');
    expect(ui.getColorScheme()).toBe('calm');
  });

  it('should destroy and disable mouse', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

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
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

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
      updateCheckResult: {
        isAvailable: true,
        latestVersion: '1.3.0',
        currentVersion: '1.2.1'
      }
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
      updateCheckResult: null
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
      updateCheckResult: null
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
      updateCheckResult: {
        isAvailable: false,
        currentVersion: '1.2.1'
      }
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });
});
