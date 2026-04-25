import { appendFileSync } from 'fs';

const DEBUG_ENABLED = process.env.DORO_DEBUG === '1';
const LOG_PATH = process.env.DORO_DEBUG_LOG ?? '/tmp/doro-debug.log';

/**
 * Returns an ISO timestamp string for log entries.
 */
function ts(): string {
  return new Date().toISOString();
}

/**
 * Append a timestamped debug line to the log file.
 * This is a synchronous write to keep ordering deterministic;
 * the volume of debug log writes is very low (a few per second at most).
 *
 * When DORO_DEBUG is not set, this function is replaced by a no-op below.
 */
function writeLog(category: string, message: string, data?: Record<string, unknown>): void {
  const payload = data ? `  ${JSON.stringify(data)}` : '';
  appendFileSync(LOG_PATH, `[${ts()}] [${category}] ${message}${payload}\n`);
}

/* ------------------------------------------------------------------ */
/*  Public API — no-ops when debug is disabled                        */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
const noop = (_cat: string, _msg: string, _data?: Record<string, unknown>): void => {};

/**
 * Log a debug message. No-op when DORO_DEBUG is unset.
 */
export const debugLog: (category: string, message: string, data?: Record<string, unknown>) => void =
  DEBUG_ENABLED ? writeLog : noop;

/**
 * Whether debug mode is active. Use this to gate expensive
 * debug-only computations (e.g. building the debug overlay string).
 */
export const isDebugEnabled: boolean = DEBUG_ENABLED;
