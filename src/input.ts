export type InputEvent =
  | {
      type: 'key';
      ch: string;
      keyName: string;
      keyFull: string;
      shift: boolean;
      ctrl: boolean;
    }
  | {
      type: 'mouse';
      source?: 'mouse' | 'click' | 'mousedown';
    }
  | {
      type: 'resize';
    };

export type ControlCommand =
  | 'quit'
  | 'toggleLock'
  | 'toggleColorScheme'
  | 'toggleMute'
  | 'debugNearEnd'
  | 'pauseResume'
  | 'resetRun'
  | 'resetSettings'
  | 'startWork'
  | 'startShort'
  | 'startLong'
  | 'checkUpdate'
  | 'updateYes'
  | 'updateNo'
  | 'testUpdateAvailable'
  | 'testUpdateCopySuccess'
  | 'testUpdateCopyFallback'
  | 'testUpdateSkipped'
  | 'none';

export function resolveControlCommand(event: InputEvent): ControlCommand {
  if (event.type !== 'key') {
    return 'none';
  }

  if (event.keyFull === 'C-c' || (event.ctrl && event.keyName === 'c')) {
    return 'quit';
  }

  const lowerChar = event.ch.toLowerCase();
  if (event.keyName === 'q' || lowerChar === 'q') {
    return 'quit';
  }

  if (event.keyName === 'l' && (event.shift || event.ch === 'L' || event.keyFull === 'S-l')) {
    return 'toggleLock';
  }

  if (event.keyName === 'p' || lowerChar === 'p' || event.keyName === 'space') {
    return 'pauseResume';
  }

  if (event.keyName === 'c' || lowerChar === 'c') {
    return 'toggleColorScheme';
  }

  if (event.keyName === 'm' || lowerChar === 'm') {
    return 'toggleMute';
  }

  if (event.keyName === 'd' && (event.shift || event.ch === 'D' || event.keyFull === 'S-d')) {
    return 'debugNearEnd';
  }

  if (event.keyName === 'r' || lowerChar === 'r') {
    if (event.shift || event.ch === 'R' || event.keyFull === 'S-r') {
      return 'resetSettings';
    }
    return 'resetRun';
  }

  if (event.keyName === 'w' || lowerChar === 'w') {
    return 'startWork';
  }

  if (event.keyName === 's' || lowerChar === 's') {
    return 'startShort';
  }

  if (event.keyName === 'l' || lowerChar === 'l') {
    return 'startLong';
  }

  if (event.keyName === 'u' && (event.shift || event.ch === 'U' || event.keyFull === 'S-u')) {
    return 'checkUpdate';
  }

  // Test mode commands for VRT (only in test environment)
  if (process.env.DORO_TEST_MODE === '1') {
    if (event.keyName === '1' || event.ch === '1') {
      return 'testUpdateAvailable';
    }
    if (event.keyName === '2' || event.ch === '2') {
      return 'testUpdateCopySuccess';
    }
    if (event.keyName === '3' || event.ch === '3') {
      return 'testUpdateCopyFallback';
    }
    if (event.keyName === '4' || event.ch === '4') {
      return 'testUpdateSkipped';
    }
  }

  if (event.keyName === 'y' || lowerChar === 'y') {
    return 'updateYes';
  }

  if (event.keyName === 'n' || lowerChar === 'n') {
    return 'updateNo';
  }

  return 'none';
}

export function isAllowedWhenLocked(command: ControlCommand): boolean {
  return (
    command === 'quit' ||
    command === 'toggleLock' ||
    command === 'pauseResume' ||
    command === 'checkUpdate'
  );
}

export function isPromptConfirmEvent(event: InputEvent, command: ControlCommand): boolean {
  if (command === 'quit') {
    return false;
  }

  if (command === 'debugNearEnd') {
    return false;
  }

  return event.type === 'mouse' || event.type === 'key';
}

export function isUpdatePromptEvent(command: ControlCommand): boolean {
  return (
    command === 'updateYes' ||
    command === 'updateNo' ||
    command === 'testUpdateAvailable' ||
    command === 'testUpdateCopySuccess' ||
    command === 'testUpdateCopyFallback' ||
    command === 'testUpdateSkipped'
  );
}
