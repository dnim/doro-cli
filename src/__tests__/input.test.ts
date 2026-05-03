import { describe, expect, it } from '@jest/globals';
import { createKeyEvent } from './utils/mocks';
import {
  resolveControlCommand,
  isUpdatePromptEvent,
  isPromptConfirmEvent,
  isAllowedWhenLocked
} from '../input';

describe('input mapping', () => {
  it('maps commands correctly', () => {
    expect(resolveControlCommand(createKeyEvent('q', 'q'))).toBe('quit');
    expect(resolveControlCommand(createKeyEvent('p', 'p'))).toBe('pauseResume');
    expect(resolveControlCommand(createKeyEvent(' ', 'space'))).toBe('pauseResume');
    expect(resolveControlCommand(createKeyEvent('c', 'c'))).toBe('toggleColorScheme');
    expect(resolveControlCommand(createKeyEvent('m', 'm'))).toBe('toggleMute');
    expect(resolveControlCommand(createKeyEvent('D', 'd', 'S-d', true))).toBe('debugNearEnd');
    expect(resolveControlCommand(createKeyEvent('d', 'd'))).toBe('none');
    expect(resolveControlCommand(createKeyEvent('r', 'r'))).toBe('resetRun');
    expect(resolveControlCommand(createKeyEvent('R', 'r', 'S-r', true))).toBe('resetSettings');
    expect(resolveControlCommand(createKeyEvent('w', 'w'))).toBe('startWork');
    expect(resolveControlCommand(createKeyEvent('s', 's'))).toBe('startShort');
    expect(resolveControlCommand(createKeyEvent('l', 'l'))).toBe('startLong');
    expect(resolveControlCommand(createKeyEvent('L', 'l', 'S-l', true))).toBe('toggleLock');
    expect(resolveControlCommand(createKeyEvent('\u0003', 'c', 'C-c', false, true))).toBe('quit');
  });

  it('maps update commands correctly', () => {
    expect(resolveControlCommand(createKeyEvent('U', 'u', 'S-u', true))).toBe('checkUpdate');
    expect(resolveControlCommand(createKeyEvent('u', 'u'))).toBe('none');
    expect(resolveControlCommand(createKeyEvent('y', 'y'))).toBe('updateYes');
    expect(resolveControlCommand(createKeyEvent('Y', 'y'))).toBe('updateYes');
    expect(resolveControlCommand(createKeyEvent('n', 'n'))).toBe('updateNo');
    expect(resolveControlCommand(createKeyEvent('N', 'n'))).toBe('updateNo');
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
    expect(isPromptConfirmEvent(createKeyEvent('q', 'q'), 'quit')).toBe(false);
    expect(isPromptConfirmEvent(createKeyEvent('p', 'p'), 'pauseResume')).toBe(true);
    expect(isPromptConfirmEvent({ type: 'mouse' }, 'none')).toBe(true);
    expect(isPromptConfirmEvent(createKeyEvent('D', 'd', 'S-d', true), 'debugNearEnd')).toBe(false);
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

    expect(resolveControlCommand(createKeyEvent('1', '1'))).toBe('testUpdateAvailable');
    expect(resolveControlCommand(createKeyEvent('2', '2'))).toBe('testUpdateCopySuccess');
    expect(resolveControlCommand(createKeyEvent('3', '3'))).toBe('testUpdateCopyFallback');
    expect(resolveControlCommand(createKeyEvent('4', '4'))).toBe('testUpdateSkipped');

    process.env.DORO_TEST_MODE = originalEnv;
  });

  it('handles non-key events correctly', () => {
    expect(resolveControlCommand({ type: 'mouse' })).toBe('none');
    expect(resolveControlCommand({ type: 'resize' })).toBe('none');
  });
});
