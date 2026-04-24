/**
 * Raw terminal mouse tracking.
 *
 * Blessed's mouse support is broken in the neo-blessed fork — it never writes
 * the enable escape sequences. We do it ourselves:
 *   - Write ANSI sequences directly to stdout to enable button-event tracking
 *     in SGR extended mode (handles terminals wider than 223 columns).
 *   - Listen on stdin raw data, parse SGR left-button press packets, and call
 *     the registered click handler.
 *   - On cleanup, send the matching disable sequences.
 */

export type MouseClickHandler = () => void;

// SGR extended mouse: \x1b[<btn;col;rowM  (press)  or  \x1b[<btn;col;rowm  (release)
const SGR_RE = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g;

let handler: MouseClickHandler | null = null;
let listening = false;

function onData(chunk: Buffer): void {
  const s = chunk.toString('binary');
  let m: RegExpExecArray | null;
  SGR_RE.lastIndex = 0;
  while ((m = SGR_RE.exec(s)) !== null) {
    const isPress = m[4] === 'M';
    const btn = parseInt(m[1], 10);
    // btn 0 = left button press; ignore motion (btn 32+), scroll (btn 64+), release
    if (isPress && btn === 0) {
      handler?.();
    }
  }
}

export function enableMouse(onClick: MouseClickHandler): void {
  handler = onClick;
  if (!listening) {
    listening = true;
    // Use prependListener so our handler runs before blessed's stdin handler
    process.stdin.prependListener('data', onData);
    // Delay writing the enable sequences by one event-loop tick.
    // Blessed may write \x1b[?1000l (disable mouse) during its own init;
    // setImmediate ensures our sequences land after blessed is fully settled.
    setImmediate(() => {
      process.stdout.write('\x1b[?1000h\x1b[?1006h');
    });
  }
}

export function disableMouse(): void {
  handler = null;
  if (listening) {
    listening = false;
    process.stdin.off('data', onData);
    process.stdout.write('\x1b[?1006l\x1b[?1000l');
  }
}
