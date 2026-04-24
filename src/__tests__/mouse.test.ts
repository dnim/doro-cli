import { enableMouse, disableMouse } from '../mouse';

describe('Mouse Tracking', () => {
  let mockStdoutWrite: jest.SpyInstance;
  let mockStdinOn: jest.SpyInstance;
  let mockStdinOff: jest.SpyInstance;
  let mockStdinPrependListener: jest.SpyInstance;

  beforeEach(() => {
    mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    mockStdinOn = jest.spyOn(process.stdin, 'on').mockImplementation(() => process.stdin);
    mockStdinOff = jest.spyOn(process.stdin, 'off').mockImplementation(() => process.stdin);
    mockStdinPrependListener = jest.spyOn(process.stdin, 'prependListener').mockImplementation(() => process.stdin);
    jest.useFakeTimers();
  });

  afterEach(() => {
    disableMouse();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should enable mouse tracking and emit escape sequences', () => {
    const mockHandler = jest.fn();
    enableMouse(mockHandler);

    expect(mockStdinPrependListener).toHaveBeenCalledWith('data', expect.any(Function));
    
    // Process the setImmediate
    jest.runAllTimers();

    expect(mockStdoutWrite).toHaveBeenCalledWith('\x1b[?1000h\x1b[?1006h');
  });

  it('should disable mouse tracking', () => {
    const mockHandler = jest.fn();
    enableMouse(mockHandler);
    jest.runAllTimers();

    disableMouse();

    expect(mockStdinOff).toHaveBeenCalledWith('data', expect.any(Function));
    expect(mockStdoutWrite).toHaveBeenCalledWith('\x1b[?1006l\x1b[?1000l');
  });

  it('should call handler on left mouse click SGR sequences', () => {
    const mockHandler = jest.fn();
    enableMouse(mockHandler);
    
    const dataListener = mockStdinPrependListener.mock.calls[0][1];
    
    // Left mouse press: \x1b[<0;10;10M
    dataListener(Buffer.from('\x1b[<0;10;10M'));
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Left mouse release: \x1b[<0;10;10m (should not trigger)
    dataListener(Buffer.from('\x1b[<0;10;10m'));
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Mouse motion: \x1b[<32;10;10M (should not trigger)
    dataListener(Buffer.from('\x1b[<32;10;10M'));
    expect(mockHandler).toHaveBeenCalledTimes(1);
    
    // Another left mouse press
    dataListener(Buffer.from('\x1b[<0;5;5M'));
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });
});
