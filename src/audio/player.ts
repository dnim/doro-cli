import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';

type PlayerCandidate = {
  command: string;
  args: (filePath: string) => string[];
};

type PlaybackState = {
  cancelled: boolean;
  child: ChildProcess | null;
};

const CANDIDATES: PlayerCandidate[] = [
  { command: 'afplay', args: (filePath) => ['-v', '0.2', filePath] },
  { command: 'aplay', args: (filePath) => [filePath] },
  { command: 'paplay', args: (filePath) => [filePath] },
  { command: 'ffplay', args: (filePath) => ['-v', 'quiet', '-autoexit', '-nodisp', filePath] },
  {
    command: 'powershell',
    args: (filePath) => [
      '-NoProfile',
      '-Command',
      `(New-Object Media.SoundPlayer '${filePath.replace(/'/g, "''")}').PlaySync();`
    ]
  }
];

let activePlayback: PlaybackState | null = null;

function runCandidate(command: string, args: string[], playback: PlaybackState): Promise<'ok' | 'failed' | 'cancelled'> {
  return new Promise((resolve) => {
    if (playback.cancelled) {
      resolve('cancelled');
      return;
    }

    const child = spawn(command, args, {
      stdio: 'ignore'
    });
    playback.child = child;

    if (playback.cancelled) {
      child.kill('SIGTERM');
      resolve('cancelled');
      return;
    }

    child.on('error', () => {
      playback.child = null;
      resolve(playback.cancelled ? 'cancelled' : 'failed');
    });

    child.on('close', (code, signal) => {
      playback.child = null;
      if (playback.cancelled || signal === 'SIGTERM' || signal === 'SIGINT') {
        resolve('cancelled');
        return;
      }

      resolve(code === 0 ? 'ok' : 'failed');
    });
  });
}

export function stopPlayback(): void {
  if (!activePlayback) {
    return;
  }

  activePlayback.cancelled = true;
  if (activePlayback.child && !activePlayback.child.killed) {
    activePlayback.child.kill('SIGTERM');
  }
}

export async function playClip(buffer: Buffer): Promise<void> {
  stopPlayback();
  const playback: PlaybackState = {
    cancelled: false,
    child: null
  };
  activePlayback = playback;

  const filePath = join(tmpdir(), `doro-${randomBytes(6).toString('hex')}.wav`);
  await fs.writeFile(filePath, buffer);

  try {
    for (const candidate of CANDIDATES) {
      if (playback.cancelled || activePlayback !== playback) {
        return;
      }

      const result = await runCandidate(candidate.command, candidate.args(filePath), playback);
      if (result === 'ok') {
        return;
      }

      if (result === 'cancelled') {
        return;
      }
    }

    if (!playback.cancelled && activePlayback === playback) {
      process.stdout.write('\u0007');
    }
  } finally {
    if (activePlayback === playback) {
      activePlayback = null;
    }

    await fs.rm(filePath, { force: true });
  }
}
