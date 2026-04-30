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
      promptNextMode: null
    });

    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    expect(mockScreen.title).toContain('10:00');
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
      promptNextMode: 'short'
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
      promptNextMode: null
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
      promptNextMode: null
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
      promptNextMode: null
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

  it('should show volume indicator at very small widths', () => {
    // Test that volume icon appears at width 1
    const result1 = getRunningStatusText('running', false, 'muted', 1);
    const result2 = getRunningStatusText('running', false, 'quiet', 1);
    const result3 = getRunningStatusText('running', false, 'normal', 1);

    expect(result1).toBe('✕');
    expect(result2).toBe('♪');
    expect(result3).toBe('♫');
  });

  it('should show volume icons for all modes at tiny widths', () => {
    // Test that volume indicators are prioritized over lock icons at tiny widths
    const result1 = getRunningStatusText('running', true, 'muted', 3);
    const result2 = getRunningStatusText('running', true, 'quiet', 3);
    const result3 = getRunningStatusText('running', true, 'normal', 3);

    // At width 3, should fit "⊘ ✕" (lock + space + volume)
    expect(result1).toBe('⊘ ✕');
    expect(result2).toBe('⊘ ♪');
    expect(result3).toBe('⊘ ♫');
  });
});
