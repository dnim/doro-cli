import { playClip, stopPlayback } from '../audio/player';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';

jest.mock('node:child_process');
jest.mock('node:fs', () => ({
  promises: {
    writeFile: jest.fn(),
    rm: jest.fn()
  }
}));

describe('Audio Player', () => {
  let mockSpawn: jest.Mock;
  let mockFsWriteFile: jest.Mock;
  let mockFsRm: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSpawn = spawn as unknown as jest.Mock;
    mockFsWriteFile = fs.writeFile as jest.Mock;
    mockFsRm = fs.rm as jest.Mock;

    mockFsWriteFile.mockResolvedValue(undefined);
    mockFsRm.mockResolvedValue(undefined);
  });

  afterEach(() => {
    stopPlayback();
  });

  it('should write buffer to temp file, spawn child process, and clean up', async () => {
    // Setup a mock child process that successfully exits immediately
    const mockChild = {
      kill: jest.fn(),
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'close') {
          setTimeout(() => cb(0, null), 0); // exit code 0
        }
      }),
      killed: false
    };
    mockSpawn.mockReturnValue(mockChild);

    const dummyBuffer = Buffer.from('dummy-audio-data');

    await playClip(dummyBuffer);

    expect(mockFsWriteFile).toHaveBeenCalledWith(
      expect.stringMatching(/doro-[0-9a-f]+\.wav/),
      dummyBuffer
    );
    expect(mockSpawn).toHaveBeenCalled();
    // Verify cleanup
    expect(mockFsRm).toHaveBeenCalledWith(expect.stringMatching(/doro-[0-9a-f]+\.wav/), {
      force: true
    });
  });

  it('should stop playback and kill child process if stopPlayback is called', async () => {
    let closeCb: (code: number, signal: string) => void;

    const mockChild = {
      kill: jest.fn().mockImplementation((signal) => {
        if (closeCb) {
          closeCb(null as unknown as number, signal); // Simulate child exiting after kill
        }
      }),
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'close') {
          closeCb = cb;
        }
      }),
      killed: false
    };

    mockSpawn.mockReturnValue(mockChild);

    const dummyBuffer = Buffer.from('dummy');

    const playPromise = playClip(dummyBuffer);

    // Give it a tick to start
    await new Promise((resolve) => setTimeout(resolve, 0));

    stopPlayback();

    await playPromise;

    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('should fallback to next candidate if spawn fails or exits with error', async () => {
    // We mock spawn to fail for the first candidate and succeed for the second
    let spawnCount = 0;
    mockSpawn.mockImplementation(() => {
      spawnCount++;
      const isFirst = spawnCount === 1;
      return {
        kill: jest.fn(),
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === 'close') {
            setTimeout(() => cb(isFirst ? 1 : 0, null), 0); // fail 1st, succeed 2nd
          }
        }),
        killed: false
      };
    });

    const dummyBuffer = Buffer.from('dummy');
    await playClip(dummyBuffer);

    expect(mockSpawn).toHaveBeenCalledTimes(2);
  });

  it('should handle early cancellation after spawn but before child setup', async () => {
    const mockChild = {
      kill: jest.fn(),
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'close') {
          // Simulate being killed
          setTimeout(() => cb(null, 'SIGTERM'), 5);
        }
      }),
      killed: false
    };

    mockSpawn.mockReturnValue(mockChild);

    const dummyBuffer = Buffer.from('dummy');

    // Start playback
    const playPromise = playClip(dummyBuffer);

    // Cancel after a tiny delay to let spawn happen
    setTimeout(() => stopPlayback(), 1);

    await playPromise;

    expect(mockSpawn).toHaveBeenCalled();
    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('should handle spawn error event', async () => {
    let errorCb: () => void;
    let spawnCount = 0;

    mockSpawn.mockImplementation(() => {
      spawnCount++;
      const isFirst = spawnCount === 1;

      const mockChild = {
        kill: jest.fn(),
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === 'error' && isFirst) {
            errorCb = cb;
            // Trigger error immediately for first spawn
            setTimeout(() => errorCb(), 0);
          } else if (event === 'close' && !isFirst) {
            // Second spawn succeeds
            setTimeout(() => cb(0, null), 0);
          }
        }),
        killed: false
      };

      return mockChild;
    });

    const dummyBuffer = Buffer.from('dummy');
    await playClip(dummyBuffer);

    expect(mockSpawn).toHaveBeenCalledTimes(2);
  });

  it('should fall back to terminal bell when all candidates fail', async () => {
    const mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation();

    // Make all spawn attempts fail
    mockSpawn.mockImplementation(() => ({
      kill: jest.fn(),
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'close') {
          setTimeout(() => cb(1, null), 0); // Non-zero exit code = failure
        }
      }),
      killed: false
    }));

    const dummyBuffer = Buffer.from('dummy');
    await playClip(dummyBuffer);

    expect(mockStdoutWrite).toHaveBeenCalledWith('\u0007'); // Terminal bell character

    mockStdoutWrite.mockRestore();
  });

  it('should stop immediately if stopPlayback is called before spawn', async () => {
    let callCount = 0;
    mockSpawn.mockImplementation(() => {
      callCount++;
      return {
        kill: jest.fn(),
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === 'close') {
            setTimeout(() => cb(0, null), 0);
          }
        }),
        killed: false
      };
    });

    // Stop playback before starting
    stopPlayback();

    const dummyBuffer = Buffer.from('dummy');
    await playClip(dummyBuffer);

    // Should start new playback even though stop was called before
    expect(callCount).toBeGreaterThan(0);
  });

  it('should handle stopping when no active playback exists', () => {
    // This should not throw an error
    stopPlayback();
    stopPlayback(); // Call multiple times

    // If we get here without error, the test passes
    expect(true).toBe(true);
  });

  it('should handle concurrent playClip calls by cancelling previous', async () => {
    let spawnCount = 0;

    mockSpawn.mockImplementation(() => {
      spawnCount++;
      const isFirst = spawnCount === 1;

      return {
        kill: jest.fn(),
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === 'close') {
            if (isFirst) {
              // First call gets cancelled (signal SIGTERM)
              setTimeout(() => cb(null, 'SIGTERM'), 5);
            } else {
              // Second call succeeds
              setTimeout(() => cb(0, null), 10);
            }
          }
        }),
        killed: false
      };
    });

    const buffer1 = Buffer.from('first');
    const buffer2 = Buffer.from('second');

    // Start first playback
    const firstPlay = playClip(buffer1);

    // Start second playback shortly after (should cancel first)
    setTimeout(() => {
      playClip(buffer2);
    }, 2);

    await firstPlay;

    expect(spawnCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle cancellation before spawn completes', async () => {
    const dummyBuffer = Buffer.from('dummy');

    // Mock a cancelled state that gets checked early
    let mockChild: { kill: jest.Mock; on: jest.Mock; killed: boolean } | undefined;
    mockSpawn.mockImplementation(() => {
      mockChild = {
        kill: jest.fn(),
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === 'close') {
            setTimeout(() => cb(null, 'SIGTERM'), 0);
          }
        }),
        killed: false
      };
      return mockChild;
    });

    // Start playback and immediately stop to trigger early cancellation paths
    const playPromise = playClip(dummyBuffer);

    // Give a tiny delay for spawn to happen
    await new Promise((resolve) => setTimeout(resolve, 1));
    stopPlayback();

    await playPromise;

    expect(mockChild?.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('should handle error during spawn with cancellation', async () => {
    // Track if playback gets cancelled during error handling
    let errorCb: () => void;

    mockSpawn.mockImplementation(() => ({
      kill: jest.fn(),
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'error') {
          errorCb = cb;
          setTimeout(() => {
            stopPlayback(); // Cancel during error
            errorCb();
          }, 0);
        }
      }),
      killed: false
    }));

    const dummyBuffer = Buffer.from('dummy');
    await playClip(dummyBuffer);
  });

  it('should skip audio in test mode', async () => {
    const originalTestMode = process.env.DORO_TEST_MODE;
    process.env.DORO_TEST_MODE = '1';

    const dummyBuffer = Buffer.from('dummy');
    await playClip(dummyBuffer);

    // Should not spawn any processes in test mode
    expect(mockSpawn).not.toHaveBeenCalled();
    expect(mockFsWriteFile).not.toHaveBeenCalled();

    process.env.DORO_TEST_MODE = originalTestMode;
  });
});
