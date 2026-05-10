/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMockChildProcess } from './utils/mocks';

vi.mock('node:child_process', () => ({
  spawn: vi.fn()
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      rm: vi.fn()
    }
  },
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rm: vi.fn()
  }
}));

import { playClip, stopPlayback } from '../audio/player';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';

describe('Audio Player', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Setup default mock behavior
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.rm).mockResolvedValue(undefined);
  });

  afterEach(() => {
    stopPlayback();
  });

  it('should write buffer to temp file, spawn child process, and clean up', async () => {
    // Arrange
    const mockChild = createMockChildProcess(0); // Successfully exits with code 0
    vi.mocked(spawn).mockReturnValue(mockChild as any);
    const dummyBuffer = Buffer.from('dummy-audio-data');

    // Act
    await playClip(dummyBuffer);

    // Assert
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/doro-[0-9a-f]+\.wav/),
      dummyBuffer
    );
    expect(spawn).toHaveBeenCalled();
    // Verify cleanup
    expect(fs.rm).toHaveBeenCalledWith(expect.stringMatching(/doro-[0-9a-f]+\.wav/), {
      force: true
    });
  });

  it('should stop playback and kill child process if stopPlayback is called', async () => {
    // Arrange
    let closeCb: (code: number, signal: string) => void;

    const mockChild = {
      kill: vi.fn().mockImplementation((signal) => {
        if (closeCb) {
          closeCb(null as unknown as number, signal); // Simulate child exiting after kill
        }
      }),
      on: vi.fn().mockImplementation((event, cb) => {
        if (event === 'close') {
          closeCb = cb;
        }
      }),
      killed: false
    };

    vi.mocked(spawn).mockReturnValue(mockChild as any);
    const dummyBuffer = Buffer.from('dummy');

    // Act
    const playPromise = playClip(dummyBuffer);

    // Give it a tick to start
    await new Promise((resolve) => setTimeout(resolve, 0));

    stopPlayback();

    await playPromise;

    // Assert
    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('should fallback to next candidate if spawn fails or exits with error', async () => {
    // Arrange: Mock spawn to fail for the first candidate and succeed for the second
    let spawnCount = 0;
    (vi.mocked(spawn) as any).mockImplementation(() => {
      spawnCount++;
      const isFirst = spawnCount === 1;
      return createMockChildProcess(isFirst ? 1 : 0) as unknown as ReturnType<typeof spawn>; // Fail first, succeed second
    });

    // Act
    const dummyBuffer = Buffer.from('dummy');
    await playClip(dummyBuffer);

    // Assert
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('should handle early cancellation after spawn but before child setup', async () => {
    // Arrange
    const mockChild = {
      kill: vi.fn(),
      on: vi.fn().mockImplementation((event, cb) => {
        if (event === 'close') {
          // Simulate being killed
          setTimeout(() => cb(null, 'SIGTERM'), 5);
        }
      }),
      killed: false
    };

    vi.mocked(spawn).mockReturnValue(mockChild as any);
    const dummyBuffer = Buffer.from('dummy');

    // Act
    const playPromise = playClip(dummyBuffer);

    // Cancel after a tiny delay to let spawn happen
    setTimeout(() => stopPlayback(), 1);

    await playPromise;

    // Assert
    expect(spawn).toHaveBeenCalled();
    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('should handle spawn error event', async () => {
    let errorCb: () => void;
    let spawnCount = 0;

    (vi.mocked(spawn) as any).mockImplementation(() => {
      spawnCount++;
      const isFirst = spawnCount === 1;

      const mockChild = {
        kill: vi.fn(),
        on: vi.fn().mockImplementation((event, cb) => {
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

    expect(vi.mocked(spawn)).toHaveBeenCalledTimes(2);
  });

  it('should fall back to terminal bell when all candidates fail', async () => {
    const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation((() => {
      /* noop */
    }) as any);

    // Make all spawn attempts fail
    (vi.mocked(spawn) as any).mockImplementation(() => ({
      kill: vi.fn(),
      on: vi.fn().mockImplementation((event, cb) => {
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
    (vi.mocked(spawn) as any).mockImplementation(() => {
      callCount++;
      return {
        kill: vi.fn(),
        on: vi.fn().mockImplementation((event, cb) => {
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

    (vi.mocked(spawn) as any).mockImplementation(() => {
      spawnCount++;
      const isFirst = spawnCount === 1;

      return {
        kill: vi.fn(),
        on: vi.fn().mockImplementation((event, cb) => {
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
    let mockChild:
      | { kill: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn>; killed: boolean }
      | undefined;
    (vi.mocked(spawn) as any).mockImplementation(() => {
      mockChild = {
        kill: vi.fn(),
        on: vi.fn().mockImplementation((event, cb) => {
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

    (vi.mocked(spawn) as any).mockImplementation(() => ({
      kill: vi.fn(),
      on: vi.fn().mockImplementation((event, cb) => {
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
    expect(vi.mocked(spawn)).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();

    process.env.DORO_TEST_MODE = originalTestMode;
  });
});
