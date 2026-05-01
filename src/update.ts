import { type Settings } from './config';

export type UpdateCheckResult = {
  isAvailable: boolean;
  latestVersion?: string;
  currentVersion: string;
  error?: string;
};

export type ClipboardResult = {
  success: boolean;
  command?: string;
  error?: string;
};

/**
 * Gets the current version from package.json
 */
export function getCurrentVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../package.json');
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

/**
 * Fetches the latest version from npm registry
 */
export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch('https://registry.npmjs.org/doro-cli/latest', {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.version || null;
  } catch {
    return null;
  }
}

/**
 * Compares two semantic version strings
 * Returns true if newVersion > currentVersion
 */
export function isNewerVersion(currentVersion: string, newVersion: string): boolean {
  const parseCurrent = currentVersion.split('.').map((n) => parseInt(n, 10));
  const parseNew = newVersion.split('.').map((n) => parseInt(n, 10));

  for (let i = 0; i < Math.max(parseCurrent.length, parseNew.length); i++) {
    const current = parseCurrent[i] || 0;
    const latest = parseNew[i] || 0;

    if (latest > current) {
      return true;
    }
    if (latest < current) {
      return false;
    }
  }

  return false;
}

/**
 * Checks if enough time has passed since last check
 */
export function isCheckDue(settings: Settings): boolean {
  if (!settings.lastCheckedAt || !settings.checkIntervalHours) {
    return true;
  }

  const now = Date.now();
  const intervalMs = settings.checkIntervalHours * 60 * 60 * 1000;

  return now - settings.lastCheckedAt >= intervalMs;
}

/**
 * Checks if we should prompt for this version (not skipped)
 */
export function shouldPromptForVersion(version: string, settings: Settings): boolean {
  return settings.skippedVersion !== version;
}

/**
 * Performs update check and returns result
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentVersion();

  try {
    const latestVersion = await fetchLatestVersion();

    if (!latestVersion) {
      return {
        isAvailable: false,
        currentVersion,
        error: 'Failed to fetch latest version'
      };
    }

    const isNewer = isNewerVersion(currentVersion, latestVersion);

    return {
      isAvailable: isNewer,
      latestVersion,
      currentVersion
    };
  } catch (error) {
    return {
      isAvailable: false,
      currentVersion,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets the update command for the current platform
 */
export function getUpdateCommand(): string {
  return 'npm install -g doro-cli@latest';
}

/**
 * Attempts to copy text to clipboard using platform-specific methods
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  const command = getUpdateCommand();

  // Try different clipboard methods based on platform
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawn } = require('child_process');

  return new Promise((resolve) => {
    let clipboardCmd: string;
    let args: string[];

    if (process.platform === 'darwin') {
      clipboardCmd = 'pbcopy';
      args = [];
    } else if (process.platform === 'linux') {
      // Try xclip first, then xsel
      clipboardCmd = 'xclip';
      args = ['-selection', 'clipboard'];
    } else if (process.platform === 'win32') {
      clipboardCmd = 'clip';
      args = [];
    } else {
      resolve({
        success: false,
        command,
        error: 'Clipboard not supported on this platform'
      });
      return;
    }

    const proc = spawn(clipboardCmd, args);
    let errorOutput = '';

    proc.on('error', (err: Error) => {
      // If xclip fails on Linux, try xsel
      if (process.platform === 'linux' && clipboardCmd === 'xclip') {
        const procXsel = spawn('xsel', ['--clipboard', '--input']);

        procXsel.on('error', () => {
          resolve({
            success: false,
            command,
            error: 'No clipboard utility found (tried xclip, xsel)'
          });
        });

        procXsel.on('close', (code: number) => {
          resolve({
            success: code === 0,
            command,
            error: code !== 0 ? 'xsel failed' : undefined
          });
        });

        procXsel.stdin.write(text);
        procXsel.stdin.end();
        return;
      }

      resolve({
        success: false,
        command,
        error: err.message
      });
    });

    proc.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code: number) => {
      resolve({
        success: code === 0,
        command,
        error: code !== 0 ? errorOutput || 'Clipboard command failed' : undefined
      });
    });

    proc.stdin.write(text);
    proc.stdin.end();
  });
}
