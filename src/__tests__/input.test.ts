import { describe, expect, it } from '@jest/globals';
import {
  isAllowedWhenLocked,
  isPromptConfirmEvent,
  isUpdatePromptEvent,
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
    expect(resolveControlCommand(keyEvent(' ', 'space'))).toBe('pauseResume');
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

  it('maps update commands correctly', () => {
    expect(resolveControlCommand(keyEvent('U', 'u', 'S-u', true))).toBe('checkUpdate');
    expect(resolveControlCommand(keyEvent('u', 'u'))).toBe('none');
    expect(resolveControlCommand(keyEvent('y', 'y'))).toBe('updateYes');
    expect(resolveControlCommand(keyEvent('Y', 'y'))).toBe('updateYes');
    expect(resolveControlCommand(keyEvent('n', 'n'))).toBe('updateNo');
    expect(resolveControlCommand(keyEvent('N', 'n'))).toBe('updateNo');
  });

  it('allows only quit, pause, toggle lock, and update check when locked', () => {
    expect(isAllowedWhenLocked('quit')).toBe(true);
    expect(isAllowedWhenLocked('toggleLock')).toBe(true);
    expect(isAllowedWhenLocked('pauseResume')).toBe(true);
    expect(isAllowedWhenLocked('checkUpdate')).toBe(true);
    expect(isAllowedWhenLocked('toggleColorScheme')).toBe(false);
    expect(isAllowedWhenLocked('toggleMute')).toBe(false);
    expect(isAllowedWhenLocked('resetSettings')).toBe(false);
    expect(isAllowedWhenLocked('startWork')).toBe(false);
    expect(isAllowedWhenLocked('resetRun')).toBe(false);
    expect(isAllowedWhenLocked('updateYes')).toBe(false);
    expect(isAllowedWhenLocked('updateNo')).toBe(false);
  });

  it('treats any non-quit key and mouse as prompt confirm', () => {
    expect(isPromptConfirmEvent(keyEvent('q', 'q'), 'quit')).toBe(false);
    expect(isPromptConfirmEvent(keyEvent('p', 'p'), 'pauseResume')).toBe(true);
    expect(isPromptConfirmEvent({ type: 'mouse' }, 'none')).toBe(true);
    expect(isPromptConfirmEvent(keyEvent('D', 'd', 'S-d', true), 'debugNearEnd')).toBe(false);
  });

  it('identifies update prompt events correctly', () => {
    expect(isUpdatePromptEvent('updateYes')).toBe(true);
    expect(isUpdatePromptEvent('updateNo')).toBe(true);
    expect(isUpdatePromptEvent('testUpdateAvailable')).toBe(true);
    expect(isUpdatePromptEvent('testUpdateCopySuccess')).toBe(true);
    expect(isUpdatePromptEvent('testUpdateCopyFallback')).toBe(true);
    expect(isUpdatePromptEvent('testUpdateSkipped')).toBe(true);
    expect(isUpdatePromptEvent('checkUpdate')).toBe(false);
    expect(isUpdatePromptEvent('quit')).toBe(false);
    expect(isUpdatePromptEvent('pauseResume')).toBe(false);
  });

  it('maps test mode update commands correctly', () => {
    const originalEnv = process.env.DORO_TEST_MODE;
    process.env.DORO_TEST_MODE = '1';

    expect(resolveControlCommand(keyEvent('1', '1'))).toBe('testUpdateAvailable');
    expect(resolveControlCommand(keyEvent('2', '2'))).toBe('testUpdateCopySuccess');
    expect(resolveControlCommand(keyEvent('3', '3'))).toBe('testUpdateCopyFallback');
    expect(resolveControlCommand(keyEvent('4', '4'))).toBe('testUpdateSkipped');

    process.env.DORO_TEST_MODE = originalEnv;
  });

  it('handles non-key events correctly', () => {
    expect(resolveControlCommand({ type: 'mouse' })).toBe('none');
    expect(resolveControlCommand({ type: 'resize' })).toBe('none');
  });
});
