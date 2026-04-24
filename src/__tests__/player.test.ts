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
});
