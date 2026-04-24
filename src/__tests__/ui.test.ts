import { DoroUi } from '../ui';
import blessed from 'blessed';
import { enableMouse, disableMouse } from '../mouse';

jest.mock('blessed', () => {
  const mockScreen = {
    on: jest.fn(),
    render: jest.fn(),
    destroy: jest.fn(),
    cols: 80,
    rows: 24,
  };
  const mockBox = {
    style: {},
    setContent: jest.fn(),
    hide: jest.fn(),
    show: jest.fn(),
  };

  return {
    screen: jest.fn(() => mockScreen),
    box: jest.fn(() => ({ ...mockBox })),
  };
});

jest.mock('../mouse', () => ({
  enableMouse: jest.fn(),
  disableMouse: jest.fn(),
}));

describe('DoroUi', () => {
  let handlers: any;
  let ui: DoroUi;

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {
      onKey: jest.fn(),
      onResize: jest.fn(),
      onAnyClick: jest.fn(),
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
      isMuted: false,
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
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
      isMuted: false,
      hasPrompt: true,
      promptCountdownSeconds: 3,
      promptTotalSeconds: 5,
      promptNextMode: 'short',
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
      isMuted: false,
      hasPrompt: false,
      promptCountdownSeconds: 0,
      promptTotalSeconds: 0,
      promptNextMode: null,
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
});
