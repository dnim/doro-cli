import { describe, expect, it } from '@jest/globals';
import {
  isAllowedWhenLocked,
  isPromptConfirmEvent,
  resolveControlCommand,
  type InputEvent
} from '../input';

function keyEvent(
  ch: string,
  keyName: string,
  keyFull = keyName,
  shift = false,
  ctrl = false
): InputEvent {
  return {
    type: 'key',
    ch,
    keyName,
    keyFull,
    shift,
    ctrl
  };
}

describe('input mapping', () => {
  it('maps commands correctly', () => {
    expect(resolveControlCommand(keyEvent('q', 'q'))).toBe('quit');
    expect(resolveControlCommand(keyEvent('p', 'p'))).toBe('pauseResume');
    expect(resolveControlCommand(keyEvent('c', 'c'))).toBe('toggleColorScheme');
    expect(resolveControlCommand(keyEvent('m', 'm'))).toBe('toggleMute');
    expect(resolveControlCommand(keyEvent('D', 'd', 'S-d', true))).toBe('debugNearEnd');
    expect(resolveControlCommand(keyEvent('d', 'd'))).toBe('none');
    expect(resolveControlCommand(keyEvent('r', 'r'))).toBe('resetRun');
    expect(resolveControlCommand(keyEvent('R', 'r', 'S-r', true))).toBe('resetSettings');
    expect(resolveControlCommand(keyEvent('w', 'w'))).toBe('startWork');
    expect(resolveControlCommand(keyEvent('s', 's'))).toBe('startShort');
    expect(resolveControlCommand(keyEvent('l', 'l'))).toBe('startLong');
    expect(resolveControlCommand(keyEvent('L', 'l', 'S-l', true))).toBe('toggleLock');
    expect(resolveControlCommand(keyEvent('\u0003', 'c', 'C-c', false, true))).toBe('quit');
  });

  it('allows only quit and toggle lock when locked', () => {
    expect(isAllowedWhenLocked('quit')).toBe(true);
    expect(isAllowedWhenLocked('toggleLock')).toBe(true);
    expect(isAllowedWhenLocked('toggleColorScheme')).toBe(true);
    expect(isAllowedWhenLocked('toggleMute')).toBe(true);
    expect(isAllowedWhenLocked('resetSettings')).toBe(true);
    expect(isAllowedWhenLocked('pauseResume')).toBe(false);
  });

  it('treats any non-quit key and mouse as prompt confirm', () => {
    expect(isPromptConfirmEvent(keyEvent('q', 'q'), 'quit')).toBe(false);
    expect(isPromptConfirmEvent(keyEvent('p', 'p'), 'pauseResume')).toBe(true);
    expect(isPromptConfirmEvent({ type: 'mouse' }, 'none')).toBe(true);
    expect(isPromptConfirmEvent(keyEvent('D', 'd', 'S-d', true), 'debugNearEnd')).toBe(false);
  });
});
