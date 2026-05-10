import { MockInstance } from 'vitest';
import { enableMouse, disableMouse } from '../mouse';

describe('Mouse Tracking', () => {
  let mockStdoutWrite: MockInstance;
  let mockStdinOff: MockInstance;
  let mockStdinPrependListener: MockInstance;

  beforeEach(() => {
    mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    mockStdinOff = vi.spyOn(process.stdin, 'off').mockImplementation(() => process.stdin);
    mockStdinPrependListener = vi
      .spyOn(process.stdin, 'prependListener')
      .mockImplementation(() => process.stdin);
    vi.useFakeTimers();
  });

  afterEach(() => {
    disableMouse();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should enable mouse tracking and emit escape sequences', () => {
    const mockHandler = vi.fn();
    enableMouse(mockHandler);

    expect(mockStdinPrependListener).toHaveBeenCalledWith('data', expect.any(Function));

    // Process the setImmediate
    vi.runAllTimers();

    expect(mockStdoutWrite).toHaveBeenCalledWith('\x1b[?1000h\x1b[?1006h');
  });

  it('should disable mouse tracking', () => {
    const mockHandler = vi.fn();
    enableMouse(mockHandler);
    vi.runAllTimers();

    disableMouse();

    expect(mockStdinOff).toHaveBeenCalledWith('data', expect.any(Function));
    expect(mockStdoutWrite).toHaveBeenCalledWith('\x1b[?1006l\x1b[?1000l');
  });

  it('should call handler on left mouse click SGR sequences', () => {
    const mockHandler = vi.fn();
    enableMouse(mockHandler);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataListener = (mockStdinPrependListener.mock.calls[0] as any[])[1];

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
