import { DoroUi } from '../ui';
import blessed from 'blessed';
import { enableMouse, disableMouse } from '../mouse';

jest.mock('../logger', () => ({
  debugLog: jest.fn(),
  isDebugEnabled: false
}));

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
    // 1 root + 1 progress + 1 banner + 1 status + 1 help + 4 prompt overlays + 1 debug = 10 boxes
    expect(blessed.box).toHaveBeenCalledTimes(10);

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

  it('should toggle color scheme', () => {
    ui = new DoroUi(handlers);

    // Test that the method doesn't throw, and state is preserved internally
    ui.toggleColorScheme();

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

    // We expect the styles to change, which internally modifies root.style.bg.
    // The specifics are covered by integration / manual tests, but we ensure no crashes.
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;
    expect(mockScreen.render).toHaveBeenCalledTimes(1);
  });

  it('should destroy and disable mouse', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

    ui.destroy();

    expect(disableMouse).toHaveBeenCalledTimes(1);
    expect(mockScreen.destroy).toHaveBeenCalledTimes(1);
  });

  it('should skip render when state has not changed', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

    const state = {
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

    ui.render(state);
    expect(mockScreen.render).toHaveBeenCalledTimes(1);

    // Second render with same state should be skipped
    ui.render(state);
    expect(mockScreen.render).toHaveBeenCalledTimes(1);
    expect(ui.getRenderSkipCount()).toBe(1);

    // Render with changed state should go through
    ui.render({ ...state, remainingSeconds: 599 });
    expect(mockScreen.render).toHaveBeenCalledTimes(2);
  });

  it('should not toggle debug overlay when debug is disabled', () => {
    ui = new DoroUi(handlers);

    ui.toggleDebugOverlay();
    expect(ui.isDebugOverlayVisible()).toBe(false);
  });

  it('should not render debug overlay when not visible', () => {
    ui = new DoroUi(handlers);
    const mockScreen = (blessed.screen as jest.Mock).mock.results[0].value;

    ui.renderDebugOverlay({
      rssBytes: 100 * 1024 * 1024,
      heapUsedBytes: 12 * 1024 * 1024,
      tickDriftMs: 2,
      renderSkips: 5
    });

    // Should not call screen.render since overlay is not visible
    expect(mockScreen.render).not.toHaveBeenCalled();
  });

  it('should return false from copyDebugToClipboard when no content', () => {
    ui = new DoroUi(handlers);

    expect(ui.copyDebugToClipboard()).toBe(false);
  });
});

describe('DoroUi (debug enabled)', () => {
  let handlers: { onKey: jest.Mock; onResize: jest.Mock; onAnyClick: jest.Mock };
  let ui: DoroUi;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Re-mock with isDebugEnabled = true
    jest.doMock('../logger', () => ({
      debugLog: jest.fn(),
      isDebugEnabled: true
    }));

    jest.doMock('blessed', () => {
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

    jest.doMock('../mouse', () => ({
      enableMouse: jest.fn(),
      disableMouse: jest.fn()
    }));

    handlers = { onKey: jest.fn(), onResize: jest.fn(), onAnyClick: jest.fn() };
  });

  afterEach(() => {
    if (ui) {
      ui.destroy();
    }
  });

  it('should toggle debug overlay on and off when debug is enabled', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DoroUi: DebugUi } = require('../ui');
    ui = new DebugUi(handlers);

    ui.toggleDebugOverlay();
    expect(ui.isDebugOverlayVisible()).toBe(true);

    ui.toggleDebugOverlay();
    expect(ui.isDebugOverlayVisible()).toBe(false);
  });

  it('should render debug overlay with metrics when visible', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const blessedMod = require('blessed');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DoroUi: DebugUi } = require('../ui');
    ui = new DebugUi(handlers);
    const mockScreen = (blessedMod.screen as jest.Mock).mock.results[0].value;

    ui.toggleDebugOverlay();
    ui.renderDebugOverlay({
      rssBytes: 95 * 1024 * 1024,
      heapUsedBytes: 12 * 1024 * 1024,
      tickDriftMs: 1,
      renderSkips: 25
    });

    expect(mockScreen.render).toHaveBeenCalled();
  });

  it('should copy debug content to clipboard and flash indicator', () => {
    jest.doMock('child_process', () => ({
      execSync: jest.fn()
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const blessedMod = require('blessed');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DoroUi: DebugUi } = require('../ui');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('child_process');
    ui = new DebugUi(handlers);
    const mockScreen = (blessedMod.screen as jest.Mock).mock.results[0].value;

    ui.toggleDebugOverlay();
    ui.renderDebugOverlay({
      rssBytes: 95 * 1024 * 1024,
      heapUsedBytes: 12 * 1024 * 1024,
      tickDriftMs: 1,
      renderSkips: 25
    });
    mockScreen.render.mockClear();

    const result = ui.copyDebugToClipboard();
    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledTimes(1);
    // Flash indicator should trigger a screen.render
    expect(mockScreen.render).toHaveBeenCalled();
  });
});
