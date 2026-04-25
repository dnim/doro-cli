describe('logger', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should export no-ops when DORO_DEBUG is unset', () => {
    delete process.env.DORO_DEBUG;

    const mockAppendFileSync = jest.fn();
    jest.doMock('fs', () => ({ appendFileSync: mockAppendFileSync }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { debugLog, isDebugEnabled } = require('../logger');

    expect(isDebugEnabled).toBe(false);

    debugLog('test', 'hello');
    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });

  it('should write to log file when DORO_DEBUG=1', () => {
    process.env.DORO_DEBUG = '1';

    const mockAppendFileSync = jest.fn();
    jest.doMock('fs', () => ({ appendFileSync: mockAppendFileSync }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { debugLog, isDebugEnabled } = require('../logger');

    expect(isDebugEnabled).toBe(true);

    debugLog('state', 'transition', { from: 'work', to: 'short' });
    expect(mockAppendFileSync).toHaveBeenCalledTimes(1);

    const written = mockAppendFileSync.mock.calls[0][1] as string;
    expect(written).toContain('[state]');
    expect(written).toContain('transition');
    expect(written).toContain('"from":"work"');
  });

  it('should use custom log path from DORO_DEBUG_LOG', () => {
    process.env.DORO_DEBUG = '1';
    process.env.DORO_DEBUG_LOG = '/tmp/custom-doro.log';

    const mockAppendFileSync = jest.fn();
    jest.doMock('fs', () => ({ appendFileSync: mockAppendFileSync }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { debugLog } = require('../logger');

    debugLog('app', 'started');
    expect(mockAppendFileSync).toHaveBeenCalledWith('/tmp/custom-doro.log', expect.any(String));
  });

  it('should write without data payload when none provided', () => {
    process.env.DORO_DEBUG = '1';

    const mockAppendFileSync = jest.fn();
    jest.doMock('fs', () => ({ appendFileSync: mockAppendFileSync }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { debugLog } = require('../logger');

    debugLog('app', 'simple message');
    const written = mockAppendFileSync.mock.calls[0][1] as string;
    expect(written).toContain('[app] simple message');
    expect(written).not.toContain('{');
  });
});
